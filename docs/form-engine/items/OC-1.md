# OC-1 — `opencode.jsonc`

Phase: 1 · Depends: — · Repo: realtyua
Branch: `feature/form-engine` · Worktree: —

Status: `review` (чекає commit BASE-2)

## Goal

Проєктний конфіг OpenCode V2: модель за замовчуванням, reference на 11ty-двійник
і план, каталог worktrees, безпечні permissions. V1-назви (`permission`, `bash`,
`task`) не використовуються.

## Files

- `opencode.jsonc`

## Steps

1. `$schema` = `https://opencode.ai/config.json`.
2. `model: opencode/big-pickle`, `default_agent: build`.
3. `instructions: ["AGENTS.md"]`.
4. `references.reifua.path: ../../reifua/main` (не `../reifua/main` — конфиг
   лежить у `realtyua/main`, твін — у `realtyua/../reifua/main`).
   `references.plan.path: ~/.opencode/plan`.
5. `worktree.directory: ../worktrees` → `realtyua/worktrees`.
6. `permissions`: read/glob/grep allow; shell ask + вузький allowlist
   (git status/diff/log/show/branch, npm test, node --test,
   node/powershell tools); edit allow; `git push` ask; reifua — read allow,
   edit deny; plan — read allow.

## Acceptance

- OpenCode завантажує конфіг без помилок.
- Обидва reference видно в `<available_references>`.
- Жодного deprecated-поля V1.
- Relative `worktree.directory` резолвиться від канонічного чекауту.

## Gates

Перевірка конфігу — завантаження OpenCode + `worktree_list`.

## Out of scope

Створення worktree (BASE-5), агентів, plugins, MCP.

## Handoff log

- 2026-11-01: створено `opencode.jsonc`. Конфіг підхопився; reference `reifua` і
  `plan` з'явилися в контексті. `worktree_list` бачить лише канонічний чекаут
  (очікувано, worktrees ще не створені).
- Рішення: модель зафіксована як поточна (`opencode/big-pickle`).
- Виправлено шлях із плану: `../../reifua/main`, не `../reifua/main`.
- Відкрито: чи `git push` має лишитися `ask` — так, за планом.
