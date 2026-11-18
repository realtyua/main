# <ID> — <Title>

Phase: <N> · Depends: <IDs> · Repo: <realtyua|reifua|form-engine>
Branch: `feat/<ID>-<slug>` · Worktree: `../worktrees/<ID>-<slug>`

Status: `todo`

## Goal

Одне-два речення: що має бути істинним після item.

## Files

Точні шляхи (за потреби — рядки).

- `path/to/file`

## Steps

1. ...
2. ...

## Acceptance

- ...
- ...

## Gates

Лишити потрібні: `T`, `V`, `CA`, `CN`, `VR`, `B`, `P`.

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
```

## Out of scope

Що НЕ робимо в цьому item.

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
