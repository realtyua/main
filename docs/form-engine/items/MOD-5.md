# MOD-5 — Оновити `actions/*` і зафіксувати runner (`realtyua`)

Phase: 8 · Depends: MERGE-2 · Repo: realtyua

Branch: `feat/MOD-5-actions-versions` · Worktree: `../worktrees/MOD-5-actions-versions`

Status: `todo`

> Окрема сесія. Готовий локальний прецедент — MOD-3 у `reifua/main`: ті самі
> мажорні теги вже дають зелений Action без застережень. Мережа не потрібна —
> версії відомі з MOD-3; якщо знадобиться перевірка релізів — спитати дозвіл.

## Goal

Прибрати з GitHub Action у `realtyua/main` обидва типи застережень:
«Node.js 20 is deprecated … forced to run on Node.js 24» і
«The ubuntu-latest label will migrate to Ubuntu 26», без зміни логіки deploy.

## Files

- `.github/workflows/main.yml`

## Steps

1. Зафіксувати поточний стан: `checkout@v5` (два джоби), `setup-node@v5` +
   `node-version: '22'`, `configure-pages@v5`, `upload-pages-artifact@v4`,
   `deploy-pages@v4`, `runs-on: ubuntu-latest` (три джоби).
2. Підняти теги за рецептом MOD-3:
   - `actions/checkout@v5` → `@v7`;
   - `actions/setup-node@v5` → `@v7`, `node-version: '22'` → `24.x`;
   - `actions/upload-pages-artifact@v4` → `@v5`;
   - `actions/deploy-pages@v4` → `@v5`.
3. `runs-on: ubuntu-latest` → `ubuntu-24.04` у всіх трьох джобах (як у reifua
   після MOD-3) — це прибирає нотиси про міграцію на Ubuntu 26.
4. `actions/configure-pages@v5` — крок, який усередині тягне
   `upload-artifact@ea165f8…` (Node 20) і названий у warning. У `reifua` цього
   кроку немає: прибрати. Якщо вирішите лишити — потрібна версія на Node 24,
   перевірка тільки з дозволу на мережу.
5. Перевірити, що входи workflow (`node-version`, `path`, `cache`) сумісні з
   новими мажорами — звірено в MOD-3 з `action.yml` на закріплених тегах.
6. YAML-парсинг + гейти. Push виконує користувач; Action має бути зелений
   без обох застережень.

## Acceptance

- [ ] У логах Action немає «Node.js 20 is deprecated»
- [ ] У логах Action немає нотису про ubuntu-latest → Ubuntu 26
- [ ] Логіка workflow не змінилася — лише теги, версія Node і runner
- [ ] YAML парситься; гейти зелені
- [ ] Користувач запушив `master`; Action зелений

## Gates

```powershell
npm test
node _form-engine/tools/validate-config.mjs _data/add-property.yml --strict
node _form-engine/tools/validate-config.mjs _data/notify.yml --strict
node _form-engine/tools/validate-config.mjs _data/demo.yml --strict
node _form-engine/tools/check-add-property.mjs
node _form-engine/tools/check-notify.mjs
```

Окремий YAML-парсинг `.github/workflows/main.yml` (`js-yaml` або локальний
парсер). `VR` не запускати — див. MOD-8.

## Out of scope

- Зміна структури jobs, секретів, тригерів
- `verify-render` / baseline (MOD-8)
- MOD-4 (Cloudflare), `captcha.js` (MOD-6), Turnstile (MOD-7)
- `git push`, будь-які мережеві дії без окремого дозволу

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->
