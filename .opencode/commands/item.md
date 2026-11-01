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
3. Run the item's baseline gates before changing anything.
4. Implement only the item's scope. Do not touch other items.
5. Run the item's gates.
6. Append a handoff note to the item file: status, files changed, gates run,
   leftovers, commit SHA.
7. Update the item's row in `WORKITEMS.md`.
8. Do not commit anything. Do not run `git add`, `git commit`, `git push`,
   `git merge` or `git rebase`. Leave every change in the working tree and
   report what is ready for the user to review.

If $1 is empty or unknown, list the available IDs from `WORKITEMS.md` and stop.
