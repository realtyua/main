# PUB-12 — Перевірка установки пакету (`npm install @realtyua/form-engine`) в чистому проекті

Phase: 6 · Depends: PUB-10 · Repo: form-engine
Branch: `feat/PUB-12-install-smoke-test` · Worktree: `../worktrees/PUB-12-install-smoke-test`

Status: `todo`

## Goal

Переконатися, що пакет `@realtyua/form-engine@1.0.0` встановлюється з публічного npm і працює в чистому проєкті (Jekyll + Bootstrap 4 і Eleventy + Tailwind).

## Files

-тимчасова тека для smoke-test (не комітиться)
- `package.json` тестового проєкту
- простий конфіг форми

## Steps

1. Створити worktree `PUB-12-install-smoke-test` від `main` репозиторію `form-engine`.
2. Усередині worktree: `git checkout -b feat/PUB-12-install-smoke-test`.
3. Junction на канонічний `node_modules`: `cmd /c mklink /J node_modules ..\..\main\node_modules` (без `npm install`).
4. Створити тимчасову папку `smoke-test/` поряд з worktree.
5. Протестувати **Jekyll-сценарий**:
   - `mkdir jekyll-test && cd jekyll-test`
   - `npm init -y`
   - `npm install @realtyua/form-engine`
   - Перевірити, що `node_modules/@realtyua/form-engine/runtime/app.js` існує
   - Перевірити імпорт: `node --input-type=module -e "await import('@realtyua/form-engine/runtime/app.js'); console.log('OK')"`
   - Перевірити адаптер: скопіювати `adapters/jekyll/_plugins` і `tools`, схему — перевірити bake
6. Протестувати **Eleventy-сценарий**:
   - `mkdir eleventy-test && cd eleventy-test`
   - `npm init -y`
   - `npm install @11ty/eleventy js-yaml @realtyua/form-engine`
   - Перевірити імпорт адаптера: `await import('@realtyua/form-engine/adapters/eleventy/lib/form-engine.js')`
   - Перевірити passthrough copy runtime
7. Задокументувати результат (успіх/проблеми) в handoff log.

## Acceptance

- [ ] `npm install @realtyua/form-engine` успішний в чистій папці
- [ ] Runtime імпортується: `import('@realtyua/form-engine/runtime/app.js')`
- [ ] Jekyll-адаптер копіюється і bake працює
- [ ] Eleventy-адаптер імпортується і passthrough copy працює
- [ ] Жодних помилок залежностей або missing files

## Gates

```powershell
# Вручну в smoke-test папках:
npm install @realtyua/form-engine
node --input-type=module -e "await import('@realtyua/form-engine/runtime/app.js'); console.log('runtime OK')"
node --input-type=module -e "await import('@realtyua/form-engine/adapters/eleventy/lib/form-engine.js'); console.log('eleventy adapter OK')"
```

## Out of scope

- Повна інтеграція в realtyua/reifua (це PUB-13/PUB-14)
- Публікація smoke-test проєктів

## Handoff log

<!-- Дописувати в кінці сесії: status, files changed, gates run, leftovers, commit SHA. -->