# BASE-5 — Push обох гілок + worktree smoke test

Phase: 2 · Depends: BASE-4 · Repo: realtyua + reifua
Branch: — · Worktree: `../worktrees/BASE-5-smoke`

Status: `done` (2026-11-02)

## Goal

Обидві гілки `feature/form-engine` опубліковані, і новий worktree, створений
від `feature/form-engine`, містить усе потрібне для роботи над items:
рушій, скіл, реєстр, тести.

## Push (виконано користувачем)

| Репо | Гілка | Коміт |
| --- | --- | --- |
| `realtyua/main` | `feature/form-engine` | `80c444da` |
| `reifua/main` | `feature/form-engine` | `7a95f78` |

Обидві — в синхроні з `origin`.

## Steps

1. ✅ Push обох гілок.
2. `worktree_create BASE-5-smoke` від `feature/form-engine`.
3. Перевірити наявність:
   - `_form-engine/tools/gen-form-app.mjs`
   - `_form-engine/schema/form-config.schema.json`
   - `.opencode/skills/form-engine/SKILL.md`
   - `docs/form-engine/WORKITEMS.md`
   - `assets/js/form-engine/app.js`
   - `test/*.test.mjs`
4. Прогнати `node --test` у worktree.
5. `worktree_remove`.

## Acceptance

- Worktree створюється й видаляється без помилок.
- Усі шість шляхів присутні.
- `master` / `feature/form-engine` у канонічному чекауті не змінені.
- Каталог `realtyua/worktrees/` не залишає сміття.

## Gates

```powershell
node --test --test-force-exit --test-timeout=60000 --test-concurrency=2 "test/*.test.mjs"
```

## Out of scope

- Робота над будь-яким item у цьому worktree (він тимчасовий, smoke-тест).
- `npm install` — мережа; відсутність `node_modules` у worktree очікувана.

## Handoff log

- 2026-11-02: item розпочато; push обох гілок уже виконано користувачем.
- 2026-11-02: `worktree_create BASE-5-smoke` → `realtyua/worktrees/BASE-5-smoke`.
  Усі 6 перевірених шляхів присутні, 16 тестових файлів, робоче дерево чисте.
- **Знахідка 1:** `worktree_create` дає **detached HEAD**, не однойменну гілку.
  Для item-воркфлоу це означає: після створення worktree треба явно
  `git checkout -b feat/<ID>-<slug>`. Додати в AGENTS.md / `/item`.
- **Знахідка 2:** у worktree немає `node_modules` (`npm install` заборонено —
  мережа). Тести падають з `ERR_MODULE_NOT_FOUND: js-yaml`. Обхід без мережі —
  junction на канонічний `main/node_modules`:
  `cmd /c mklink /J node_modules ..\..\main\node_modules`.
- **Знахідка 3:** після junction — **213/214**, один fail:
  `the baked add-property page matches a fresh render of the config`.
  Причина — EOL: системний `git config core.autocrlf=true`
  (`C:/Program Files/Git/etc/gitconfig`), `.gitattributes` відсутній. Блоб
  зберігається з LF, свіжий checkout на Windows дає CRLF, а bake пише змішаний
  файл; тест порівнює байти. На Linux/CI не проявляється.
  → новий item **`JEK-R8`** (EOL-нормалізація).
- `worktree_remove` — успішно; `worktree_list` знову показує лише канонічний
  чекаут. Junction знято **до** видалення (`cmd /c rmdir`), щоб не пройти
  крізь нього в `main/node_modules`.
