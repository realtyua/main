---
description: Start one Form Engine work item
agent: build
---

Start work item $1.

Follow the project policy in `AGENTS.md`: nothing is committed, everything runs
locally, every file is UTF-8 without BOM, and changes need the user's permission.

1. Read `docs/form-engine/WORKITEMS.md` and `docs/form-engine/items/$1.md`.
   If the spec file is missing, create it from
   `docs/form-engine/items/_TEMPLATE.md` and show it to me before changing code.
2. Confirm the current repository, branch and worktree match the item.
   If they do not, stop and tell me what to switch to.
3. Worktree: `worktree_create "<ID>-<slug>"`. It opens in **detached HEAD** —
   inside the worktree run `git checkout -b feat/<ID>-<slug>` before any edit.
   **Offline:** the worktree has no `node_modules`. Link the canonical one
   (`cmd /c mklink /J node_modules ..\..\main\node_modules`); never run
   `npm install`. Remove the junction **before** `worktree_remove`.
4. Run the item's baseline gates before changing anything.
5. Implement only the item's scope. Do not touch other items.
6. Run the item's gates.
7. Append a handoff note to the item file: status, files changed, gates run,
   leftovers, commit SHA.
8. Update the item's row in `WORKITEMS.md`.
9. Do not commit anything. Do not run `git add`, `git commit`, `git push`,
   `git merge` or `git rebase`. Leave every change in the working tree and
   report what is ready for the user to review.

If $1 is empty or unknown, list the available IDs from `WORKITEMS.md` and stop.
