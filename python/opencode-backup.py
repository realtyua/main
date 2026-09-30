import sqlite3, os, sys, json, shutil, datetime

DB_PATH = os.environ.get("OPENCODE_DB") or os.path.expanduser("~/.local/share/opencode/opencode.db")
EXPORT_DIR = os.path.join(os.path.dirname(DB_PATH), "exports")

def get_conn():
    return sqlite3.connect(DB_PATH)

def cmd_list_archived():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, title, time_archived, time_created, project_id FROM session WHERE time_archived IS NOT NULL ORDER BY time_archived DESC")
    rows = cur.fetchall()
    if not rows:
        print("No archived sessions found.")
    else:
        print(f"Archived sessions ({len(rows)}):\n")
        for s in rows:
            print(f"  {s[1]}  (id: {s[0]})")
    conn.close()

def cmd_restore(session_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, title FROM session WHERE id = ?", (session_id,))
    row = cur.fetchone()
    if not row:
        print(f"Session not found: {session_id}")
        conn.close()
        return
    cur.execute("UPDATE session SET time_archived = NULL WHERE id = ?", (session_id,))
    conn.commit()
    print(f"Restored: {row[1]}  (id: {row[0]})")
    conn.close()

def cmd_restore_search(query):
    """Restore a session by full ID or by title text. If multiple title
    matches — lists them and exits so the user can pick the exact ID."""
    conn = get_conn()
    cur = conn.cursor()
    # First try exact session ID match
    cur.execute("SELECT id, title FROM session WHERE id = ?", (query,))
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE session SET time_archived = NULL WHERE id = ?", (row[0],))
        conn.commit()
        print(f"Restored: {row[1]}  (id: {row[0]})")
        conn.close()
        return
    # Otherwise search by title text
    cur.execute("""SELECT id, title FROM session
                   WHERE time_archived IS NOT NULL AND title LIKE ? ESCAPE '\\'
                   ORDER BY time_archived DESC""", (f"%{query}%",))
    rows = cur.fetchall()
    if not rows:
        print(f"No archived sessions matching '{query}'.")
        conn.close()
        return
    if len(rows) == 1:
        cur.execute("UPDATE session SET time_archived = NULL WHERE id = ?", (rows[0][0],))
        conn.commit()
        print(f"Restored: {rows[0][1]}  (id: {rows[0][0]})")
        conn.close()
        return
    print(f"Multiple archived sessions match '{query}':\n")
    for i, r in enumerate(rows):
        print(f"  {i+1}. {r[1]}  (id: {r[0]})")
    if sys.stdin.isatty():
        print()
        try:
            choice = input("Enter number to restore (0 = cancel): ").strip()
        except EOFError:
            choice = ""
        if choice.isdigit():
            n = int(choice)
            if 1 <= n <= len(rows):
                target = rows[n - 1]
                cur.execute("UPDATE session SET time_archived = NULL WHERE id = ?", (target[0],))
                conn.commit()
                print(f"Restored: {target[1]}  (id: {target[0]})")
                conn.close()
                return
        print("Canceled.")
    else:
        print("\nRestore one with: python opencode-backup.py restore <session_id>")
    conn.close()

def cmd_restore_all():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE session SET time_archived = NULL WHERE time_archived IS NOT NULL")
    count = cur.rowcount
    conn.commit()
    print(f"Restored {count} archived sessions.")
    conn.close()

def cmd_restore_last():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""SELECT id, title FROM session
                   WHERE time_archived IS NOT NULL
                   ORDER BY time_archived DESC LIMIT 1""")
    row = cur.fetchone()
    if not row:
        print("No archived sessions to restore.")
        conn.close()
        return
    cur.execute("UPDATE session SET time_archived = NULL WHERE id = ?", (row[0],))
    conn.commit()
    print(f"Restored most recent archive: {row[1]}  (id: {row[0]})")
    conn.close()

def cmd_list_projects():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.id, p.worktree, COUNT(s.id), SUM(CASE WHEN s.time_archived IS NOT NULL THEN 1 ELSE 0 END)
        FROM project p
        LEFT JOIN session s ON s.project_id = p.id
        GROUP BY p.id
        ORDER BY COUNT(s.id) DESC
    """)
    rows = cur.fetchall()
    print("Projects:\n")
    for p in rows:
        archived = p[3] or 0
        total = p[2]
        print(f"  {p[0]}")
        print(f"    dir: {p[1]}")
        print(f"    sessions: {total} ({archived} archived)\n")
    conn.close()

def cmd_path_check():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, worktree FROM project ORDER BY worktree")
    rows = cur.fetchall()
    print("Project path check:\n")
    missing = []
    for p in rows:
        wt = p[1] or ""
        ok = bool(wt) and os.path.isdir(wt)
        if not ok:
            missing.append(p)
        print(f"  [{'OK' if ok else 'MISSING'}] {p[0]}")
        print(f"      dir: {wt}\n")
    if missing:
        print(f"{len(missing)} of {len(rows)} project directories missing.")
        print("Remap them with: python opencode-backup.py remap <old_path> <new_path>")
    else:
        print("All project directories exist.")
    conn.close()

def _columns(conn, table):
    try:
        return [r[1] for r in conn.execute(f"PRAGMA table_info({table})")]
    except Exception:
        return []

def cmd_remap(old_path, new_path, force=False):
    old_n = old_path.replace("\\", "/").rstrip("/")
    new_n = new_path.replace("\\", "/").rstrip("/")

    def remap_value(p):
        if not p:
            return None
        n = p.replace("\\", "/")
        if n.lower() == old_n.lower():
            return new_n
        if n.lower().startswith(old_n.lower() + "/"):
            return new_n + n[len(old_n):]
        return None

    conn = get_conn()
    cur = conn.cursor()
    sess_cols = _columns(conn, "session")
    has_path = "path" in sess_cols
    has_dir = "directory" in sess_cols
    proj_affected = []
    cur.execute("SELECT id, worktree FROM project")
    for pid, wt in cur.fetchall():
        if remap_value(wt) is not None:
            proj_affected.append(pid)
    sess_affected = 0
    path_affected = 0
    sess_col = "path" if has_path and not has_dir else "directory"
    cnt_sql = f"SELECT id, {sess_col} FROM session WHERE {sess_col} IS NOT NULL"
    for sid, d in cur.execute(cnt_sql).fetchall():
        if remap_value(d) is not None:
            if sess_col == "path":
                path_affected += 1
            else:
                sess_affected += 1

    if not proj_affected and sess_affected == 0 and path_affected == 0:
        print(f"No records reference path '{old_path}'.")
        conn.close()
        return

    print(f"Will remap '{old_n}' -> '{new_n}'")
    print(f"  projects: {len(proj_affected)}")
    if has_path:
        print(f"  session paths: {path_affected}")
    if has_dir:
        print(f"  session dirs:  {sess_affected}")
    if not force:
        if sys.stdin.isatty():
            try:
                ans = input("Apply? [y/N] ").strip().lower()
            except EOFError:
                ans = ""
            if ans != "y":
                print("Canceled.")
                conn.close()
                return
        else:
            print("Non-interactive: add --yes to apply.")
            conn.close()
            return

    cur.execute("SELECT id, worktree FROM project")
    for pid, wt in cur.fetchall():
        nv = remap_value(wt)
        if nv is not None:
            cur.execute("UPDATE project SET worktree = ? WHERE id = ?", (nv, pid))
    if has_dir:
        cur.execute("SELECT id, directory FROM session WHERE directory IS NOT NULL")
        for sid, d in cur.fetchall():
            nv = remap_value(d)
            if nv is not None:
                cur.execute("UPDATE session SET directory = ? WHERE id = ?", (nv, sid))
    if has_path:
        cur.execute("SELECT id, path FROM session WHERE path IS NOT NULL")
        for sid, d in cur.fetchall():
            nv = remap_value(d)
            if nv is not None:
                cur.execute("UPDATE session SET path = ? WHERE id = ?", (nv, sid))
    # project_directory rows mirror the project worktree; keep them in sync.
    if "project_directory" in [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")]:
        pd_cols = _columns(conn, "project_directory")
        if "directory" in pd_cols:
            cur.execute("SELECT project_id, directory FROM project_directory WHERE directory IS NOT NULL")
            for pid, d in cur.fetchall():
                nv = remap_value(d)
                if nv is not None:
                    cur.execute("UPDATE project_directory SET directory = ? WHERE project_id = ?", (nv, pid))
    conn.commit()
    print(f"Remapped {len(proj_affected)} projects and {sess_affected + path_affected} sessions.")
    conn.close()

def _git(args, cwd):
    """Run a git command and return trimmed stdout, or None on failure."""
    import subprocess
    try:
        r = subprocess.run(["git"] + args, cwd=cwd, capture_output=True,
                           text=True, encoding="utf-8", errors="replace")
        if r.returncode != 0:
            return None
        return r.stdout.strip()
    except Exception:
        return None

def _project_id_from_remote(remote_url):
    """Replicates OpenCode 1.18.x ProjectV2 url()/parts() to derive the
    normalized 'host/path' used for the git-remote project hash."""
    import re
    from urllib.parse import urlparse

    def parts(host, name):
        p = re.sub(r"^\/+", "", name)
        p = re.sub(r"\.git\/?$", "", p)
        p = re.sub(r"\/+$", "", p)
        if not host or not p:
            return None
        return f"{host.lower()}/{p}"

    value = (remote_url or "").strip()
    if not value:
        return None
    parsed = urlparse(value)
    if parsed.scheme:
        return parts(parsed.hostname, parsed.path)
    scp = re.match(r"^([^@/:]+@)?([^/:]+):(.+)$", value)
    if scp:
        return parts(scp.group(2), scp.group(3))
    return None

def get_project_id(directory):
    """Compute the project ID OpenCode would use for this directory
    (same algorithm as v1.18.x: git remote URL -> sha1, then .git/opencode
    cache, then root commit). Returns (project_id, source)."""
    import hashlib
    directory = directory or "."
    origin = _git(["remote", "get-url", "origin"], directory)
    if origin:
        norm = _project_id_from_remote(origin)
        if norm:
            return hashlib.sha1(f"git-remote:{norm}".encode()).hexdigest(), f"remote:{origin}"
    cache = None
    gc = _git(["rev-parse", "--absolute-git-dir"], directory)
    if gc:
        cp = os.path.join(gc, "opencode")
        if os.path.isfile(cp):
            try:
                with open(cp, encoding="utf-8") as f:
                    cache = f.read().strip()
            except OSError:
                cache = None
    if cache:
        return cache, "cache:.git/opencode"
    root = _git(["rev-list", "--max-parents=0", "HEAD"], directory)
    if root:
        first = root.splitlines()[0]
        return first, "root-commit"
    return "global", "no-git-repo"

def cmd_project_id(directory=None):
    import hashlib, sqlite3
    directory = directory or "."
    pid, source = get_project_id(directory)
    print(f"Project ID for {directory}:")
    print(f"  {pid}   ({source})\n")
    conn = get_conn()
    try:
        rows = conn.execute("SELECT id, worktree FROM project").fetchall()
        found = [r for r in rows if r[0] == pid]
        if found:
            print(f"Matches DB project: {pid}")
            print(f"  worktree: {found[0][1]}")
        else:
            print(f"No project with this ID in the DB yet.")
            print("Sessions exported with this project_id will attach to this")
            print("project automatically once it is opened here.")
    finally:
        conn.close()

def cmd_archive_project(project_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE session SET time_archived = ? WHERE project_id = ? AND time_archived IS NULL",
                (int(datetime.datetime.now().timestamp() * 1000), project_id))
    count = cur.rowcount
    conn.commit()
    print(f"Archived {count} sessions for project {project_id}")
    conn.close()

def cmd_export(project_id=None, output=None):
    conn = get_conn()
    cur = conn.cursor()

    where = "WHERE s.project_id = ?" if project_id else ""
    params = (project_id,) if project_id else ()

    cur.execute(f"SELECT s.id FROM session s {where}", params)
    session_ids = [r[0] for r in cur.fetchall()]

    if not session_ids:
        print("No sessions found for export.")
        conn.close()
        return

    export_data = {"sessions": [], "messages": [], "parts": [], "todos": [], "events": [], "event_sequences": []}

    for sid in session_ids:
        cur.execute("SELECT * FROM session WHERE id = ?", (sid,))
        cols = [d[0] for d in cur.description]
        row = dict(zip(cols, cur.fetchone()))
        export_data["sessions"].append(row)

        cur.execute("SELECT * FROM message WHERE session_id = ?", (sid,))
        cols = [d[0] for d in cur.description]
        for r in cur.fetchall():
            export_data["messages"].append(dict(zip(cols, r)))

        cur.execute("SELECT * FROM part WHERE session_id = ?", (sid,))
        cols = [d[0] for d in cur.description]
        for r in cur.fetchall():
            export_data["parts"].append(dict(zip(cols, r)))

        cur.execute("SELECT * FROM todo WHERE session_id = ?", (sid,))
        cols = [d[0] for d in cur.description]
        for r in cur.fetchall():
            export_data["todos"].append(dict(zip(cols, r)))

        cur.execute("SELECT * FROM event WHERE aggregate_id = ?", (sid,))
        cols = [d[0] for d in cur.description]
        for r in cur.fetchall():
            export_data["events"].append(dict(zip(cols, r)))

        cur.execute("SELECT * FROM event_sequence WHERE aggregate_id = ?", (sid,))
        cols = [d[0] for d in cur.description]
        for r in cur.fetchall():
            export_data["event_sequences"].append(dict(zip(cols, r)))

    if not output:
        os.makedirs(EXPORT_DIR, exist_ok=True)
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        name = f"sessions_{project_id or 'all'}_{ts}.json"
        output = os.path.join(EXPORT_DIR, name)

    with open(output, "w", encoding="utf-8") as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)

    print(f"Exported {len(session_ids)} sessions to {output}")
    conn.close()

def cmd_import(filepath, force=False):
    print(f"Reading {filepath}...", flush=True)
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"Read: {len(data.get('sessions',[]))} sessions, {len(data.get('events',[]))} events", flush=True)

    conn = get_conn()
    cur = conn.cursor()

    # Guard: importing an OLD export over a session that has since grown would
    # silently re-add stale events and overwrite upstream state. Compare the
    # max event seq already stored vs. the max the export carries. Any session
    # whose export is not the freshest gets skipped unless --force is given.
    max_seq_export = {}
    for e in data.get("events", []):
        agg = e.get("aggregate_id")
        if not agg:
            continue
        try:
            s = int(e.get("seq"))
        except (TypeError, ValueError):
            continue
        if agg not in max_seq_export or s > max_seq_export[agg]:
            max_seq_export[agg] = s

    skipped = {}
    for s in data.get("sessions", []):
        sid = s.get("id")
        if not sid:
            continue
        row = cur.execute("SELECT MAX(seq) FROM event WHERE aggregate_id = ?", (sid,)).fetchone()
        db_max = row[0] if row and row[0] is not None else None
        exp_max = max_seq_export.get(sid, -1)
        if db_max is not None and db_max > exp_max:
            if not force:
                skipped[sid] = (db_max, exp_max)
            else:
                print(f"  force: importing session {sid[:12]} over {db_max} events in DB", flush=True)

    if skipped:
        print("\nWARNING: this export is OLDER than the data already in the database for:")
        for sid, (db_max, exp_max) in skipped.items():
            print(f"  {sid}  (DB has {db_max} events, export has {exp_max})")
        print("Skipping those sessions to avoid overwriting newer data.")
        print("Re-run with '--force' to import them anyway.\n")

    sessions = [s for s in data.get("sessions", []) if s.get("id") not in skipped]
    messages = [m for m in data.get("messages", []) if m.get("session_id") not in skipped]
    parts = [p for p in data.get("parts", []) if p.get("session_id") not in skipped]
    todos = [t for t in data.get("todos", []) if t.get("session_id") not in skipped]
    events = [e for e in data.get("events", []) if e.get("aggregate_id") not in skipped]
    if skipped:
        print("Importing the remaining", len(sessions), "sessions.", flush=True)

    count = 0
    for s in sessions:
        try:
            cur.execute("""INSERT OR REPLACE INTO session
                (id, project_id, workspace_id, parent_id, slug, directory, path, title, version, share_url,
                 summary_additions, summary_deletions, summary_files, summary_diffs, metadata, cost,
                 tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write,
                 revert, permission, agent, model, time_created, time_updated, time_compacting, time_archived)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (s.get("id"), s.get("project_id"), s.get("workspace_id"), s.get("parent_id"),
                 s.get("slug"), s.get("directory"), s.get("path"), s.get("title"), s.get("version"),
                 s.get("share_url"), s.get("summary_additions"), s.get("summary_deletions"),
                 s.get("summary_files"), s.get("summary_diffs"), s.get("metadata"), s.get("cost"),
                 s.get("tokens_input"), s.get("tokens_output"), s.get("tokens_reasoning"),
                 s.get("tokens_cache_read"), s.get("tokens_cache_write"), s.get("revert"),
                 s.get("permission"), s.get("agent"), s.get("model"), s.get("time_created"),
                 s.get("time_updated"), s.get("time_compacting"), s.get("time_archived")))
            count += 1
        except Exception as e:
            print(f"Error importing session {s.get('id')}: {e}")

    for m in messages:
        try:
            cur.execute("""INSERT OR REPLACE INTO message (id, session_id, time_created, time_updated, data)
                VALUES (?,?,?,?,?)""",
                (m.get("id"), m.get("session_id"), m.get("time_created"), m.get("time_updated"), m.get("data")))
        except Exception as e:
            print(f"Error importing message {m.get('id')}: {e}")

    for p in parts:
        try:
            cur.execute("""INSERT OR REPLACE INTO part (id, message_id, session_id, time_created, time_updated, data)
                VALUES (?,?,?,?,?,?)""",
                (p.get("id"), p.get("message_id"), p.get("session_id"), p.get("time_created"), p.get("time_updated"), p.get("data")))
        except Exception as e:
            print(f"Error importing part {p.get('id')}: {e}")

    for t in todos:
        try:
            cur.execute("""INSERT OR REPLACE INTO todo (session_id, content, status, priority, position, time_created, time_updated)
                VALUES (?,?,?,?,?,?,?)""",
                (t.get("session_id"), t.get("content"), t.get("status"), t.get("priority"),
                 t.get("position"), t.get("time_created"), t.get("time_updated")))
        except Exception as e:
            print(f"Error importing todo: {e}")

    for e in events:
        try:
            cur.execute("""INSERT OR REPLACE INTO event (id, aggregate_id, seq, type, data)
                VALUES (?,?,?,?,?)""",
                (e.get("id"), e.get("aggregate_id"), e.get("seq"), e.get("type"), e.get("data")))
        except Exception as ex:
            print(f"Error importing event {e.get('id')}: {ex}")

    # After importing events, opencode re-appends new events using the
    # event_sequence counter. If the sequence is stale it tries seq=0 again
    # and fails with "UNIQUE constraint failed: event.aggregate_id, event.seq".
    # Re-sync the counter to the max imported seq for every affected aggregate.
    seqs = {}
    for e in events:
        agg = e.get("aggregate_id")
        if not agg:
            continue
        try:
            s = int(e.get("seq"))
        except (TypeError, ValueError):
            continue
        if agg not in seqs or s > seqs[agg]:
            seqs[agg] = s
    for agg, max_seq in seqs.items():
        try:
            row = cur.execute("SELECT seq FROM event_sequence WHERE aggregate_id = ?", (agg,)).fetchone()
            existing = row[0] if row else None
            if existing is None or max_seq > existing:
                if existing is None:
                    cur.execute("INSERT INTO event_sequence (aggregate_id, seq, owner_id) VALUES (?,?,NULL)", (agg, max_seq))
                else:
                    cur.execute("UPDATE event_sequence SET seq = ? WHERE aggregate_id = ?", (max_seq, agg))
        except Exception as ex:
            print(f"Error updating event_sequence for {agg}: {ex}")

    conn.commit()
    imported_sessions = sessions
    print(f"Imported: {len(imported_sessions)} sessions, {len(messages)} messages, {len(parts)} parts")

    missing = {}
    for s in imported_sessions:
        d = s.get("directory")
        if d and not os.path.isdir(d):
            missing[d] = missing.get(d, 0) + 1
    if missing:
        print(f"\n{len(missing)} imported project directory(ies) not found on this computer:")
        for d, c in sorted(missing.items(), key=lambda x: -x[1]):
            print(f"  {d}   ({c} sessions)")
        print("\nIf those projects live at a different path, remap them with:")
        print("  python opencode-backup.py check")
        print("  python opencode-backup.py remap <old_path> <new_path>")
    conn.close()

def _filter_db(src, dst, project_id):
    """Create dst as a copy of src containing ONLY the given project:
    project row, its sessions and everything cascaded, plus events owned by
    those sessions. Uses CASCADE deletes (foreign keys are declared)."""
    import sqlite3 as sq
    src_c = sq.connect(src)
    dst_c = sq.connect(dst)
    try:
        src_c.backup(dst_c)
    finally:
        src_c.close()
    cur = dst_c.cursor()

    # Which aggregates (sessions) to keep for the event log.
    cur.execute("SELECT id FROM session WHERE project_id = ?", (project_id,))
    keep = {r[0] for r in cur.fetchall()}

    # Enable FK cascades for deletes.
    cur.execute("PRAGMA foreign_keys = ON")

    # Members of the event log: sessions of this project (safe) — but events
    # are per aggregate_id, so also keep only those aggregates' sequences.
    placeholders = ",".join("?" * len(keep))
    if keep:
        cur.execute("DELETE FROM event WHERE aggregate_id NOT IN (" + placeholders + ")", sorted(keep))
        cur.execute("DELETE FROM event_sequence WHERE aggregate_id NOT IN (" + placeholders + ")", sorted(keep))

    # Remove every other project; sessions/messages/parts/todos cascade away,
    # as do permission, project_directory, workspace, session_* tables.
    cur.execute("DELETE FROM project WHERE id != ?", (project_id,))

    # Sessions whose project was deleted are gone; but events also reference
    # other aggregates (accounts etc.) — those are not project-local, so the
    # project backup intentionally keeps only this project's session events.

    dst_c.commit()
    dst_c.execute("VACUUM")
    dst_c.close()
    return len(keep)

def cmd_full_backup(project_id=None, output=None):
    """Package everything into a single .zip:
    - OpenCode config  (opencode.json / opencode.jsonc)
    - API credentials  (auth.json — contains API keys)
    - session database (opencode.db + -wal + -shm)
    - sessions of a single project (JSON export, if project_id given)
    """
    import zipfile

    config_dir = os.path.expanduser("~/.config/opencode")
    data_dir = os.path.dirname(DB_PATH)
    config_files = []
    if os.path.isdir(config_dir):
        for name in ("opencode.json", "opencode.jsonc"):
            p = os.path.join(config_dir, name)
            if os.path.isfile(p):
                config_files.append(p)

    auth_file = os.path.join(data_dir, "auth.json")

    if not output:
        os.makedirs(EXPORT_DIR, exist_ok=True)
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        tag = project_id or "full"
        output = os.path.join(EXPORT_DIR, f"opencode_full_{tag}_{ts}.zip")
    # Temp files are written next to the target archive, so the target
    # directory must exist first (it is NOT auto-created for a user path).
    output_dir = os.path.dirname(output) or os.getcwd()
    os.makedirs(output_dir, exist_ok=True)

    export_json = None
    tmp_export = None
    tmp_db = None
    db_size = 0
    if project_id:
        conn = get_conn()
        exists = conn.execute("SELECT COUNT(*) FROM session WHERE project_id = ?", (project_id,)).fetchone()[0]
        conn.close()
        if exists == 0:
            print(f"Project {project_id}: no sessions found; packaging without session data.")
        else:
            tmp_export = os.path.join(os.path.dirname(output), f"_tmp_sessions_{os.getpid()}.json")
            cmd_export(project_id, tmp_export)
            export_json = tmp_export
            # Filtered DB with ONLY this project.
            tmp_db = os.path.join(os.path.dirname(output), f"_tmp_db_{os.getpid()}.db")
            _filter_db(DB_PATH, tmp_db, project_id)
            db_size = os.path.getsize(tmp_db) if os.path.exists(tmp_db) else 0

    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as z:
        def add(name, path):
            if os.path.isfile(path):
                z.write(path, name)
        add("config/opencode.json", os.path.join(config_dir, "opencode.json"))
        add("config/opencode.jsonc", os.path.join(config_dir, "opencode.jsonc"))
        add("auth.json", auth_file)
        if tmp_db:
            add("db/opencode.db", tmp_db)
        else:
            for suffix in ("", "-wal", "-shm"):
                add("db/opencode.db" + suffix, DB_PATH + suffix)
        if export_json:
            z.write(export_json, "sessions/export.json")

    for p in (tmp_export, tmp_db):
        if p and os.path.isfile(p):
            os.remove(p)

    if db_size:
        db_label = f"{db_size/1048576:.1f} MB (filtered to project)"
    else:
        db_label = f"{os.path.getsize(DB_PATH)/1048576:.1f} MB"
    print(f"Full backup created: {output}")
    print(f"  config files: {len(config_files)}")
    print(f"  auth.json:    {'yes' if os.path.isfile(auth_file) else 'no'}")
    print(f"  database:     {db_label}")
    if export_json:
        print(f"  project {project_id}: sessions included (project-only DB + export.json)")
    else:
        print(f"  project {project_id or '-'}: no project data included")

def _opencode_running():
    """Detect if an OpenCode Desktop/server process is running.
    Works on Windows (tasklist) and Linux (pgrep)."""
    try:
        if os.name == "nt":
            out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
            return "opencode" in out.lower()
        else:
            out = subprocess.run(["pgrep", "-f", "opencode"], capture_output=True, text=True).stdout
            return bool(out.strip())
    except Exception:
        return False

def cmd_full_restore(archive, dry_run=False, assume_yes=False):
    """Restore a full-backup .zip. Works identically on Windows and Linux:
    config -> ~/.config/opencode, auth.json + db -> ~/.local/share/opencode.
    Creates a pre-restore backup of every file it overwrites."""
    import zipfile
    if not os.path.isfile(archive):
        print(f"Archive not found: {archive}")
        return 1
    config_dir = os.environ.get("OPENCODE_CONFIG_DIR") or os.path.expanduser("~/.config/opencode")
    data_dir = os.environ.get("OPENCODE_DATA_DIR") or os.path.expanduser("~/.local/share/opencode")
    db_path = os.path.join(data_dir, "opencode.db")
    with zipfile.ZipFile(archive) as z:
        names = z.namelist()
        cfg = sorted(n for n in names if n.startswith("config/"))
        has_auth = "auth.json" in names
        dbs = sorted(n for n in names if n.startswith("db/opencode.db"))
        if not (cfg or has_auth or dbs):
            print("Archive has no restorable content (expected config/, auth.json, db/opencode.db).")
            return 1
        print(f"Archive: {archive}")
        print(f"  config -> {config_dir}")
        print(f"  data   -> {data_dir}")
        for n in names:
            if n.startswith("config/"):
                print(f"    {n} -> config")
            elif n == "auth.json":
                print(f"    {n} -> data")
            elif n.startswith("db/"):
                print(f"    {n} -> data")
            elif n.startswith("sessions/"):
                print(f"    {n} (info: sessions already in DB; use 'import' only to merge)")
            else:
                print(f"    {n}")
        if dry_run:
            print("\n[DRY RUN] nothing was changed.")
            return 0
        if not assume_yes:
            print("\nThis OVERWRITES current OpenCode config/auth/database.")
            print("Continue? [y/N]")
            sys.stdout.flush()
            try:
                ans = input().strip().lower()
            except EOFError:
                ans = ""
            if ans not in ("y", "yes"):
                print("Aborted (re-run with --yes to skip confirmation).")
                return 1
        if _opencode_running():
            print("\nWARNING: OpenCode is currently RUNNING.")
            print("Restoring while OpenCode is open can corrupt the database")
            print("('database disk image is malformed'). Close OpenCode first.")
            if not assume_yes:
                try:
                    ans = input("Continue anyway? [y/N] ").strip().lower()
                except EOFError:
                    ans = ""
                if ans not in ("y", "yes"):
                    print("Aborted. Close OpenCode, then retry.")
                    return 1
            else:
                print("Continuing anyway (--yes given).")
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        targets = []
        for n in cfg:
            targets.append((n, os.path.join(config_dir, os.path.basename(n))))
        if has_auth:
            targets.append(("auth.json", os.path.join(data_dir, "auth.json")))
        for n in dbs:
            targets.append((n, os.path.join(data_dir, os.path.basename(n))))
        saved = []
        for n, dest in targets:
            if os.path.exists(dest):
                bak = dest + f".pre-restore-{ts}"
                shutil.copy2(dest, bak)
                saved.append(bak)
        os.makedirs(config_dir, exist_ok=True)
        os.makedirs(data_dir, exist_ok=True)
        # stale wal/shm belong to the previous db and must not survive it
        if dbs:
            for suffix in ("-wal", "-shm"):
                p = db_path + suffix
                if os.path.exists(p) and "opencode.db" + suffix not in [os.path.basename(t) for _, t in targets]:
                    os.remove(p)
                    print(f"  removed stale {os.path.basename(p)} (belongs to previous db)")
        for n, dest in targets:
            with z.open(n) as src, open(dest, "wb") as out:
                shutil.copyfileobj(src, out)
            print(f"  restored: {n} -> {dest}")
        print(f"\nRestored. Previous files kept as: *.pre-restore-{ts}")
        for s in saved:
            print(f"    {s}")
        try:
            import sqlite3 as sq
            c = sq.connect(db_path)
            integrity = c.execute("PRAGMA integrity_check").fetchone()[0]
            nsess = c.execute("SELECT COUNT(*) FROM session").fetchone()[0]
            npj = c.execute("SELECT COUNT(*) FROM project").fetchone()[0]
            c.close()
            print(f"\nDatabase verified: integrity={integrity}, projects={npj}, sessions={nsess}")
        except Exception as e:
            print(f"\nWarning: could not verify database: {e}")
        print("\nNext:")
        print("  1. Restart OpenCode.")
        print("  2. python opencode-backup.py check   (paths may differ on this PC)")
        print("  3. python opencode-backup.py remap <old_path> <new_path>  if check reports missing dirs")
        return 0

def cmd_backup(output=None):
    if not output:
        os.makedirs(EXPORT_DIR, exist_ok=True)
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output = os.path.join(EXPORT_DIR, f"opencode_backup_{ts}.db")
    shutil.copy2(DB_PATH, output)
    shutil.copy2(DB_PATH + "-wal", output + "-wal")
    shutil.copy2(DB_PATH + "-shm", output + "-shm")
    print(f"Full database backup: {output}")

def cmd_help():
    print("""
OpenCode Backup
===============
Tool for managing OpenCode chat sessions: archive, restore, export, import.

Location: ~/.local/share/opencode/opencode.db

Quick restore (most common use case):
  python opencode-backup.py restore-last
      Restore the most recently archived session (no ID needed).
      Example: python opencode-backup.py restore-last

  python opencode-backup.py restore <query>
      Restore a session by ID or by title text.
      If multiple matches — lists them; with a terminal you can
      pick the number, or use the exact ID.
      Examples:
        python opencode-backup.py restore ses_f94638cf1ffeEOhz02yB0uPCaG
        python opencode-backup.py restore "session 13"
        python opencode-backup.py restore "conditions"

  python opencode-backup.py restore-all
      Restore ALL archived sessions at once.

Other commands:
  list                       Show all archived sessions
  projects                   List all projects with session counts
  check                      Verify project directories exist on this PC
  remap <old> <new>          Rewrite project/session paths (e.g. Windows/Linux)
  project-id [dir]           Show the project ID OpenCode will use for a dir
  archive-project <pid>      Archive all sessions for a project
  export [pid] [file]        Export sessions to JSON (for transfer)
  import <file>              Import sessions from JSON
  backup [file]              Full database backup
  full-backup [-p <pid>]     One-file .zip: config + auth + DB (+ project sessions)
  full-restore <zip>         Restore full-backup .zip (config + auth + DB). Works on Windows & Linux
  help                       Show this help

Full guide:
  python opencode-backup.py help --full
""")

def cmd_help_full():
    print("""
OpenCode Backup — Full Guide
============================
Tool for managing OpenCode chat sessions: archive, restore, export, import.

Data location: ~/.local/share/opencode/opencode.db
(this resolves to C:\\Users\\<user>\\.local\\share\\opencode\\ on Windows
 and  /home/<user>/.local/share/opencode/ on Linux)


QUICK RESTORE — session disappeared from the side panel
---------------------------------------------------------
OpenCode Desktop can auto-archive completed sessions. To get the most
recently archived one back (no ID required):

    python opencode-backup.py restore-last

If it's not the one you want:

    python opencode-backup.py list
    python opencode-backup.py restore <session_id>
    python opencode-backup.py restore <title-part>

Examples:
    python opencode-backup.py restore "session 13"
    python opencode-backup.py restore ses_f94638cf1ffeEOhz02yB0uPCaG

After restoring, restart OpenCode Desktop so the session list reloads.


COMMAND REFERENCE
-----------------
  list
      Show all archived sessions.
      Example: python opencode-backup.py list

  restore <session_id_or_text>
      Restore a specific archived session. Accepts a full session ID
      or any text that appears in the session title. Works like search:
      an exact ID match is restored right away; a single title match is
      restored too; multiple title matches are listed and, when run in a
      terminal, you can type the number to choose.
      Example: python opencode-backup.py restore ses_fc82ed18bffeFBxWI2QPochhv5

  restore-last
      Restore the most recently archived session.
      Example: python opencode-backup.py restore-last

  restore-all
      Restore ALL archived sessions at once.
      Example: python opencode-backup.py restore-all

  projects
      List all projects with session counts (shows project IDs and paths).
      Example: python opencode-backup.py projects

  check
      Check whether every project directory recorded in the database
      actually exists on this computer. Flags missing ones so you can
      remap them.
      Example: python opencode-backup.py check

  remap <old_path> <new_path>
      Rewrite stored project/session paths from <old_path> to <new_path>.
      Useful after moving a project or transferring to another OS
      (Windows C:\\Users\\... vs Linux /home/...). Both / and \\ separators
      are accepted and compared case-insensitively.
      Example:
        python opencode-backup.py check
        python opencode-backup.py remap C:/Users/Vasyl/Documents/GitHub/realtyua /home/vasyl/Documents/GitHub/realtyua

  project-id [directory]
      Show which project ID OpenCode will compute for a git directory.
      Useful BEFORE transferring sessions to another computer: check that
      the clone there produces the same project ID (it will, if the git
      remote URL is the same), so the imported sessions merge into the
      project automatically. Project ID depends on the git remote URL
      (then .git/opencode cache, then root commit), NOT on the path,
      so moving/renaming the folder does not change it.
      Example:
        python opencode-backup.py project-id .
        python opencode-backup.py project-id /home/vasyl/projects/realtyua/main

  archive-project <project_id>
      Archive all sessions for a specific project.
      Example: python opencode-backup.py archive-project 04eb5a3827dfa1ae8de74d083cff855cb62379f1

  export [project_id] [file]
      Export sessions to a JSON file. If project_id is given — exports
      only that project. If no project_id — exports all sessions.
      Examples:
        python opencode-backup.py export
        python opencode-backup.py export 04eb5a3827dfa1ae8de74d083cff855cb62379f1
        python opencode-backup.py export 04eb5a3827dfa1ae8de74d083cff855cb62379f1 C:\\backup\\my-sessions.json

  import <file> [--force]
      Import sessions from a JSON file (created by export).
      If a session already exists in the database with MORE events than
      this export carries, the import is skipped for that session to avoid
      overwriting newer data. Add --force to import them anyway.
      After importing it reports which project directories are missing
      on this computer and suggests a remap.
      Example: python opencode-backup.py import C:\\backup\\my-sessions.json

  backup [file]
      Full database backup (copies .db + .wal + .shm files).
      If no file given — saves to ~/.local/share/opencode/exports/
      Examples:
        python opencode-backup.py backup
        python opencode-backup.py backup D:\\backups\\opencode_2026.db

  full-backup [-p <project_id>] [-o <file.zip>]
      Complete one-file backup as a .zip with:
        config/opencode.jsonc (settings, providers, API keys in config)
        auth.json            (stored credentials / API tokens)
        db/opencode.db       (the whole session database)
        sessions/export.json (sessions of ONE project, if -p given)
      Use -p to include the sessions of a single project in the same
      archive, or omit it for just config + auth + database.
      If no -o given — saves to ~/.local/share/opencode/exports/
      Examples:
        python opencode-backup.py full-backup
        python opencode-backup.py full-backup -p 04eb5a3827dfa1ae8de74d083cff855cb62379f1
        python opencode-backup.py full-backup -p 04eb5a3827dfa1ae8de74d083cff855cb62379f1 -o D:\\backups\\opencode_full.zip

  full-restore <archive.zip> [--dry-run] [--yes]
      Restore a full-backup .zip on THIS computer. Works identically on
      Windows and Linux (paths are resolved via the user home directory):
        config/opencode.jsonc -> ~/.config/opencode/
        auth.json             -> ~/.local/share/opencode/
        db/opencode.db        -> ~/.local/share/opencode/  (with -wal/-shm if present)
      Before overwriting, every existing target file is saved alongside as
      "<name>.pre-restore-<timestamp>" so nothing is lost. Asks for
      confirmation unless --yes is given; --dry-run only shows the plan.
      After restoring, run check/remap because stored project paths may
      differ between machines.
      Examples:
        python opencode-backup.py full-restore backup.zip --dry-run
        python opencode-backup.py full-restore backup.zip --yes
        python opencode-backup.py full-restore D:\\backups\\opencode_full.zip

  help
      Show this help message.
  help --full
      Show this full guide.


WORKFLOW: Transfer sessions to another computer
-------------------------------------------------
1. On source computer:
     python opencode-backup.py projects
     python opencode-backup.py export <project_id>

2. Copy the exported JSON file to the target computer.

3. On target computer:
     python opencode-backup.py import <path_to_json_file>

4. Run a path sanity check:
     python opencode-backup.py check
   If some project directories are missing (paths differ between the two
   machines), remap them:
     python opencode-backup.py remap <old_path> <new_path>
   Repeat for each differing path, or see the listing from `check`.

5. Restart OpenCode.


WORKFLOW: FULL backup & restore between computers (Windows <-> Linux)
----------------------------------------------------------------------
1. On source computer (Windows OR Linux), one file has everything:
     python opencode-backup.py full-backup -p <project_id> -o opencode_full.zip
   (or python opencode-backup.py full-backup  for ALL projects + settings + API keys)

2. Copy opencode_full.zip to the target computer.

3. On target (Windows OR Linux):
     python opencode-backup.py full-restore opencode_full.zip
   It restores config to ~/.config/opencode/ and auth + database to
   ~/.local/share/opencode/ — the same paths both OSes use under the
   logged-in user. It auto-backs-up anything it overwrites
   (*.pre-restore-<timestamp>) and asks for confirmation first.

4. Then:
     python opencode-backup.py check
   Project paths probably differ between machines, so:
     python opencode-backup.py remap C:/Users/Vasyl/Documents/GitHub/realtyua /home/vasyl/realtyua

5. Restart OpenCode. All sessions and settings are in place.


WORKFLOW: Restore accidentally / auto-archived session
-------------------------------------------------------
1. python opencode-backup.py restore-last
   (or: python opencode-backup.py list  then  restore <id>)
2. Restart OpenCode Desktop.
""")

def main():
    args = sys.argv[1:]
    if not args:
        cmd_help()
        return 0

    cmd = args[0]

    if cmd == "list":
        cmd_list_archived()
    elif cmd == "restore-last":
        cmd_restore_last()
    elif cmd == "restore" and len(args) > 1:
        cmd_restore_search(args[1])
    elif cmd == "restore-all":
        cmd_restore_all()
    elif cmd == "projects":
        cmd_list_projects()
    elif cmd in ("check", "path-check"):
        cmd_path_check()
    elif cmd in ("project-id", "project_id"):
        cmd_project_id(args[1] if len(args) > 1 else None)
    elif cmd == "remap":
        if len(args) >= 3:
            force = "--yes" in args
            cmd_remap(args[1], args[2], force)
        else:
            print("Usage: python opencode-backup.py remap <old_path> <new_path> [--yes]")
            print("Example: python opencode-backup.py remap C:/Users/old/Documents/realtyua C:/Users/new/Documents/realtyua")
    elif cmd == "archive-project" and len(args) > 1:
        cmd_archive_project(args[1])
    elif cmd == "export":
        pid = args[1] if len(args) > 1 else None
        out = args[2] if len(args) > 2 else None
        cmd_export(pid, out)
    elif cmd == "import" and len(args) > 1:
        cmd_import(args[1], force="--force" in args)
    elif cmd == "backup":
        out = args[1] if len(args) > 1 else None
        cmd_backup(out)
    elif cmd in ("full-backup", "fullbackup"):
        out = None
        pid = None
        rest = args[1:]
        i = 0
        while i < len(rest):
            a = rest[i]
            if a in ("-o", "--output") and i + 1 < len(rest):
                out = rest[i + 1]; i += 2
            elif a in ("-p", "--project") and i + 1 < len(rest):
                pid = rest[i + 1]; i += 2
            elif a == "--project" or a == "-p":
                # --project <pid> already consumed above; here if only pid given bare
                pass
            else:
                i += 1
        cmd_full_backup(pid, out)
    elif cmd in ("full-restore", "fullrestore"):
        if len(args) < 2:
            print("Usage: python opencode-backup.py full-restore <archive.zip> [--dry-run] [--yes]")
        else:
            archive = args[1]
            dry = "--dry-run" in args
            yes = "--yes" in args
            cmd_full_restore(archive, dry, yes)
    elif cmd == "help":
        cmd_help_full() if len(args) > 1 and args[1] == "--full" else cmd_help()
    else:
        cmd_help()
    return 0

if __name__ == "__main__":
    try:
        main()
    except FileNotFoundError as e:
        path = getattr(e, "filename", "") or ""
        print(f"\nError: file or directory not found: {path}")
        if any(ord(ch) > 127 for ch in path):
            print("Note: the path contains non-ASCII characters.")
            print("      Did you type a Cyrillic letter by mistake (e.g. С vs C)?")
            print("      Switch the keyboard layout to EN and type the path again.")
        print("Tip: the target folder must exist (e.g. D:\\backups\\),")
        print("      or point -o <file> at an existing folder.")
        sys.exit(1)
    except PermissionError as e:
        path = getattr(e, "filename", "") or ""
        print(f"\nError: no write permission for: {path}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nInterrupted by user.")
        sys.exit(130)
    except Exception as e:
        print(f"\nUnexpected error: {type(e).__name__}: {e}")
        sys.exit(1)
