# PUB-9 — Config reference, theming, migration

Phase: 6 · Depends: PUB-6 · Repo: form-engine
Branch: `feat/PUB-9-config-reference-theming-migration` · Worktree: `../worktrees/PUB-9-config-reference-theming-migration`

Status: `todo`

## Goal

Створити повну документацію для публікації пакета `form-engine`: довідник конфігурації (config reference), гайд по темуванні (theming guide) та гайд по міграції (migration guide).

## Files

- `docs/config-reference.md` — довідник конфігурації форм (всі поля, типи, валідація)
- `docs/theming-guide.md` — гайд по створенню та кастомізації тем (Bootstrap 4, Tailwind, custom)
- `docs/migration-guide.md` — гайд по міграції з Jekyll/11ty адаптерів на standalone пакет
- `README.md` — оновити з посиланнями на нові документи (якщо потрібно)

## Steps

1. Створити `docs/config-reference.md` на основі схеми `_form-engine/schema/form-config.schema.json` та прикладів конфігів (`_data/add-property.yml`, `_data/notify.yml`, `_data/demo.yml`)
2. Створити `docs/theming-guide.md` на основі існуючих тем у `assets/js/form-engine/themes/` та theme-neutral hooks з JEK-E2
3. Створити `docs/migration-guide.md` для переходу від Jekyll/11ty адаптерів до standalone пакету
4. Перевірити, що всі посилання в README.md актуальні (додати посилання на нові документи)

## Acceptance

- `docs/config-reference.md` існує і покриває всі поля конфігурації з прикладами
- `docs/theming-guide.md` існує і пояснює як створювати/розширювати теми
- `docs/migration-guide.md` існує і охоплює міграцію з Jekyll та 11ty
- Всі документи в UTF-8 без BOM
- Гейти проходять

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
node _form-engine/tools/check-notify.mjs
powershell -File _form-engine/tools/verify-render.ps1 verify
```

## Out of scope

- Зміни в runtime коді або темах
- Зміни в адаптерах Jekyll/11ty
- CI/CD налаштування (PUB-10)

## Handoff log

- **2026-11-14**: status `review` — documentation scope done in `form-engine` worktree
  `C:\Users\Vasyl\Documents\GitHub\worktrees\PUB-9-config-reference-theming-migration`, branch
  `feat/PUB-9-config-reference-theming-migration` (junction to canonical `node_modules` created).

  Files changed:
  - `docs/config-reference.md` — Complete YAML schema reference with examples (all field types, conditions, validation, widgets, submit, behavior, chrome, rates, captcha, assets)
  - `docs/theming-guide.md` — Theme architecture, built-in themes, theme-neutral hooks (G-2), extending via themeTokens, full custom theme checklist, dark mode, widget hooks
  - `docs/migration-guide.md` — Phase-by-phase migration from legacy partials: inventory, config mapping (text, select, autocomplete, location, map, captcha, price_info), layout, conditions, validation, chrome, adapter updates (Jekyll + 11ty), gates verification, common issues, rollback plan
  - `README.md` — Updated quick links and cross-references to new docs (theming-guide.md, migration-guide.md)

  Gates:
  - **T** `npm test`: **183/183 pass** (baseline unchanged)
  - **V** `validate-config --strict` on add-property.yml, notify.yml, demo.yml: **3/3 valid**, no unknown keys
  - All files verified UTF-8 without BOM

  Leftovers / out of scope:
  - CI (PUB-10) will run Ruby + 11ty in pipeline
  - Release `1.0.0` (PUB-10)

  Commit SHA: (not committed; awaiting review).