import sqlite3, os, sys, json, shutil, datetime

DB_PATH = os.path.expanduser("~/.local/share/opencode/opencode.db")
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
    conn = get_conn()
    cur = conn.cursor()
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
    print("\nRestore one with: python opencode-session.py restore <session_id>")
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

def cmd_restore_search(query):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""SELECT id, title FROM session
                   WHERE time_archived IS NOT NULL AND title LIKE ? ESCAPE '\\'
                   ORDER BY time_archived DESC""", (f"%{query}%",))
    rows = cur.fetchall()
    if not rows:
        print(f"No archived sessions matching '{query}'.")
        conn.close()
        return
    for i, r in enumerate(rows):
        print(f"  {i+1}. {r[1]}  (id: {r[0]})")
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

    export_data = {"sessions": [], "messages": [], "parts": [], "todos": [], "events": []}

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

    if not output:
        os.makedirs(EXPORT_DIR, exist_ok=True)
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        name = f"sessions_{project_id or 'all'}_{ts}.json"
        output = os.path.join(EXPORT_DIR, name)

    with open(output, "w", encoding="utf-8") as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)

    print(f"Exported {len(session_ids)} sessions to {output}")
    conn.close()

def cmd_import(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    conn = get_conn()
    cur = conn.cursor()

    count = 0
    for s in data.get("sessions", []):
        try:
            cur.execute("""INSERT OR REPLACE INTO session
                (id, project_id, workspace_id, parent_id, slug, directory, path, title, version, share_url,
                 summary_additions, summary_deletions, summary_files, summary_diffs, metadata, cost,
                 tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write,
                 revert, permission, agent, model, time_created, time_updated, time_compacting, time_archived)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
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

    for m in data.get("messages", []):
        try:
            cur.execute("""INSERT OR REPLACE INTO message (id, session_id, time_created, time_updated, data)
                VALUES (?,?,?,?,?)""",
                (m.get("id"), m.get("session_id"), m.get("time_created"), m.get("time_updated"), m.get("data")))
        except Exception as e:
            print(f"Error importing message {m.get('id')}: {e}")

    for p in data.get("parts", []):
        try:
            cur.execute("""INSERT OR REPLACE INTO part (id, message_id, session_id, time_created, time_updated, data)
                VALUES (?,?,?,?,?,?)""",
                (p.get("id"), p.get("message_id"), p.get("session_id"), p.get("time_created"), p.get("time_updated"), p.get("data")))
        except Exception as e:
            print(f"Error importing part {p.get('id')}: {e}")

    for t in data.get("todos", []):
        try:
            cur.execute("""INSERT OR REPLACE INTO todo (session_id, content, status, priority, position, time_created, time_updated)
                VALUES (?,?,?,?,?,?,?)""",
                (t.get("session_id"), t.get("content"), t.get("status"), t.get("priority"),
                 t.get("position"), t.get("time_created"), t.get("time_updated")))
        except Exception as e:
            print(f"Error importing todo: {e}")

    for e in data.get("events", []):
        try:
            cur.execute("""INSERT OR REPLACE INTO event (id, aggregate_id, seq, type, data)
                VALUES (?,?,?,?,?)""",
                (e.get("id"), e.get("aggregate_id"), e.get("seq"), e.get("type"), e.get("data")))
        except Exception as e:
            print(f"Error importing event {e.get('id')}: {e}")

    conn.commit()
    print(f"Imported: {len(data.get('sessions',[]))} sessions, {len(data.get('messages',[]))} messages, {len(data.get('parts',[]))} parts")
    conn.close()

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
OpenCode Session Manager
========================
Tool for managing OpenCode chat sessions: archive, restore, export, import.

Location: ~/.local/share/opencode/opencode.db

Quick restore (most common use case):
  python opencode-session.py restore-last
      Restore the most recently archived session (no ID needed).
      Example: python opencode-session.py restore-last

  python opencode-session.py restore <query>
      Restore a session by ID or by title text.
      If multiple matches — lists them, then use the exact ID.
      Examples:
        python opencode-session.py restore ses_f94638cf1ffeEOhz02yB0uPCaG
        python opencode-session.py restore "session 13"
        python opencode-session.py restore "conditions"

  python opencode-session.py restore-all
      Restore ALL archived sessions at once.

Other commands:
  list                       Show all archived sessions
  projects                   List all projects with session counts
  archive-project <pid>      Archive all sessions for a project
  export [pid] [file]        Export sessions to JSON (for transfer)
  import <file>              Import sessions from JSON
  backup [file]              Full database backup
  help                       Show this help

Full guide:
  python opencode-session.py help --full
""")

def cmd_help_full():
    print("""
OpenCode Session Manager — Full Guide
=====================================
Tool for managing OpenCode chat sessions: archive, restore, export, import.

Data location: ~/.local/share/opencode/opencode.db
(this resolves to C:\\Users\\<user>\\.local\\share\\opencode\\ on Windows
 and  /home/<user>/.local/share/opencode/ on Linux)


QUICK RESTORE — session disappeared from the side panel
---------------------------------------------------------
OpenCode Desktop can auto-archive completed sessions. To get the most
recently archived one back (no ID required):

    python opencode-session.py restore-last

If it's not the one you want:

    python opencode-session.py list
    python opencode-session.py restore <session_id>
    python opencode-session.py restore <title-part>

Examples:
    python opencode-session.py restore "session 13"
    python opencode-session.py restore ses_f94638cf1ffeEOhz02yB0uPCaG

After restoring, restart OpenCode Desktop so the session list reloads.


COMMAND REFERENCE
-----------------
  list
      Show all archived sessions.
      Example: python opencode-session.py list

  restore <session_id_or_text>
      Restore a specific archived session. Accepts a full session ID
      or any text that appears in the session title.
      Example: python opencode-session.py restore ses_fc82ed18bffeFBxWI2QPochhv5

  restore-last
      Restore the most recently archived session.
      Example: python opencode-session.py restore-last

  restore-all
      Restore ALL archived sessions at once.
      Example: python opencode-session.py restore-all

  projects
      List all projects with session counts (shows project IDs and paths).
      Example: python opencode-session.py projects

  archive-project <project_id>
      Archive all sessions for a specific project.
      Example: python opencode-session.py archive-project 04eb5a3827dfa1ae8de74d083cff855cb62379f1

  export [project_id] [file]
      Export sessions to a JSON file. If project_id is given — exports
      only that project. If no project_id — exports all sessions.
      Examples:
        python opencode-session.py export
        python opencode-session.py export 04eb5a3827dfa1ae8de74d083cff855cb62379f1
        python opencode-session.py export 04eb5a3827dfa1ae8de74d083cff855cb62379f1 C:\\backup\\my-sessions.json

  import <file>
      Import sessions from a JSON file (created by export).
      Example: python opencode-session.py import C:\\backup\\my-sessions.json

  backup [file]
      Full database backup (copies .db + .wal + .shm files).
      If no file given — saves to ~/.local/share/opencode/exports/
      Examples:
        python opencode-session.py backup
        python opencode-session.py backup D:\\backups\\opencode_2026.db

  help
      Show this help message.
  help --full
      Show this full guide.


WORKFLOW: Transfer sessions to another computer
-------------------------------------------------
1. On source computer:
     python opencode-session.py projects
     python opencode-session.py export <project_id>

2. Copy the exported JSON file to the target computer.

3. On target computer:
     python opencode-session.py import <path_to_json_file>

4. Restart OpenCode.
Note: project paths (directories) are stored as absolute paths. On the new
computer the sessions will show, but the project directory may need to match
or be remapped to point at the new location.


WORKFLOW: Restore accidentally / auto-archived session
-------------------------------------------------------
1. python opencode-session.py restore-last
   (or: python opencode-session.py list  then  restore <id>)
2. Restart OpenCode Desktop.
""")

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        cmd_help()
        sys.exit(0)

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
    elif cmd == "archive-project" and len(args) > 1:
        cmd_archive_project(args[1])
    elif cmd == "export":
        pid = args[1] if len(args) > 1 else None
        out = args[2] if len(args) > 2 else None
        cmd_export(pid, out)
    elif cmd == "import" and len(args) > 1:
        cmd_import(args[1])
    elif cmd == "backup":
        out = args[1] if len(args) > 1 else None
        cmd_backup(out)
    elif cmd == "help":
        cmd_help_full() if len(args) > 1 and args[1] == "--full" else cmd_help()
    else:
        cmd_help()
