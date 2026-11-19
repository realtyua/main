# Form Engine — Work Items

Реєстр робіт. План: `~/.opencode/plan/form-engine-plan.md` (reference `plan`).
Один item = одна сесія = одна гілка = один worktree.

## Статуси

| Status | Значення |
| --- | --- |
| `todo` | не почато |
| `ready` | усі залежності `done` |
| `doing` | є активна сесія/worktree |
| `review` | гейти зелені, чекає merge/коміт |
| `done` | змерджено в `feature/form-engine`, worktree видалено |
| `blocked` | є зовнішня перепона; причина — в item-файлі |

`ready` = усі `Depends` у статусі `done`. Один item — максимум одна активна
сесія.

`Commit` — SHA коміту item-а (не merge-коміту). Для `done` це коміт, який
увійшов у `feature/form-engine`; merge `--no-ff`, гілка, worktree і прогін
гейтів — у `items/<ID>.md`. Назви в колонках `Branch`/`Worktree` лишаються
історичним слідом і після видалення гілки та worktree.

## Phase 1 — OpenCode

| ID | Phase | Title | Depends | Status | Branch | Worktree | Last session | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OC-1 | 1 | `opencode.jsonc`: model, references, worktree, permissions | — | done | feature/form-engine | — | 2026-11-01 | 178afaf8 |
| OC-2 | 1 | Skill `form-engine`: `SKILL.md` + references + scripts | OC-1 | done | feature/form-engine | — | 2026-11-01 | 178afaf8 |
| OC-3 | 1 | Реєстр, шаблон item, команда `/item` | OC-2 | done | feature/form-engine | — | 2026-11-01 | 178afaf8 |
| OC-4 | 1 | `AGENTS.md`: архітектура, заборони, гейти, конвенції | OC-1 | done | feature/form-engine | — | 2026-11-01 | 178afaf8 |
| OC-5 | 1 | `.gitignore`: прибрати `README.md`, `package.json` | — | done | feature/form-engine | — | 2026-11-01 | 178afaf8 |

## Phase 2 — Baseline

| ID | Phase | Title | Depends | Status | Branch | Worktree | Last session | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BASE-1 | 2 | Інвентаризація 47 змін realtyua → план комітів | OC-5 | done | feature/form-engine | — | 2026-11-01 | 178afaf8 |
| BASE-2 | 2 | commit 1: OpenCode setup | BASE-1, OC-1..OC-4 | done | feature/form-engine | — | 2026-11-01 | 178afaf8 |
| BASE-3 | 2 | commit 2: Form Engine WIP | BASE-2 | done | feature/form-engine | — | 2026-11-01 | 178afaf8 |
| BASE-4 | 2 | Гілка + логічні коміти reifua | BASE-3 | done | feature/form-engine (reifua) | — | 2026-11-02 | 7a95f78 |
| BASE-5 | 2 | Push обох гілок + worktree smoke test | BASE-4 | done | — | — | 2026-11-02 | — |
| BASE-6 | 2 | `reifua`: доля `src/assets/data/**` (7.9 MB) | BASE-5 | done | `feat/BASE-6-reifua-data` | `BASE-6-reifua-data` | 2026-11-18 | cd2fb02 |

> Примітка: BASE-2 і BASE-3 увійшли одним комітом `178afaf8` (97 файлів,
> +19952/−4365). Розділяти історію після push не стали — гілка вже опублікована.
>
> BASE-6 — `done`: лишились трекованими лише вживані
> `src/assets/data/if.json` і `districts.json`; 25 файлів (8 003 822 B ≈ 7.6 MiB)
> видалено, `all.json` → `if.json`, datas-гілка `30559` закоментована. Гейти: build 0, `T` 238/238, `V` valid, `CA` PASS, `CN` ok,
> `VR` 42/42. Деталі — `items/BASE-6.md`.

## Phase 3 — Jekyll readiness

| ID | Phase | Title | Depends | Status | Branch | Worktree | Last session | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| JEK-R1 | 3 | Leaflet dedup: `head.html`, `java-script.html`, порожній блок | BASE-5 | done | `feat/JEK-R1-leaflet-dedup` | `JEK-R1-leaflet-dedup` | 2026-11-05 | 19e99ce6 |
| JEK-R2 | 3 | `url` + `property_url` у notify | BASE-5 | done | `feat/JEK-R2-notify-url` | `JEK-R2-notify-url` | 2026-11-05 | 3044fe03 |
| JEK-R3 | 3 | `check-add-property`: тріаж 13 copy-розбіжностей | BASE-5 | done | `feat/JEK-R3-copy-triage` | `JEK-R3-copy-triage` | 2026-11-04 | 13aa53ca |
| JEK-R4 | 3 | `check-add-property`: структурний `file-info` | JEK-R3 | done | `feat/JEK-R4-file-info` | `JEK-R4-file-info` | 2026-11-05 | 8457ff21 |
| JEK-R5 | 3 | Мертвий код: legacy partial-и, дубль notify, сирота, `.old` | BASE-5 | done | `feat/JEK-R5-dead-code` | `JEK-R5-dead-code` | 2026-11-05 | 13f52ac4 |
| JEK-R6 | 3 | `_form-engine/README.md`: актуальний статус | JEK-R1..R5 | done | `feat/JEK-R6-readme-status` | `JEK-R6-readme-status` | 2026-11-06 | 0bed23ae |
| JEK-R7 | 3 | Повний прогін гейтів Jekyll | JEK-R1..R6 | done | `feat/JEK-R7-full-gates` | `JEK-R7-full-gates` | 2026-11-06 | dfda107e |
| JEK-R8 | 3 | EOL-нормалізація: `.gitattributes` + EOL-незалежний freshness-тест | BASE-5 | done | `feat/JEK-R8-eol-normalization` | `JEK-R8-eol-normalization` | 2026-11-06 | 1c35ef86 |
| JEK-R9 | 3 | Property notify: підключити `form-engine/app.js` | BASE-5 | done | `feat/JEK-R9-property-notify-appjs` | `JEK-R9-property-notify-appjs` | 2026-11-05 | c4ce9c75 |

> Примітка: JEK-R1 ліг у `feature/form-engine` лінійно (коміт `19e99ce6`,
> без merge-коміту). JEK-R2, JEK-R3, JEK-R4, JEK-R7, JEK-R8 і JEK-R9 — через
> merge `--no-ff`: `f08d1ea3`, `a9b83197`, `d580169d`, `7969a1d7`, `e33f7379`,
> `e83c1c1f` відповідно. JEK-R1 і JEK-R2 стояли в реєстрі як `review` уже після
> потрапляння в гілку; статуси вирівняно з git 2026-11-05.
>
> JEK-R7 — `done`: `T` 214/214, `V` 3/3, `CA` PASS, `CN` ok, Leaflet 1/1/0;
> `VR` — baseline `verify-render` перезахоплено 2026-11-06 після ручного
> перегляду 3 розбіжностей (пост-baseline зміни JEK-R3/R4/R9). Деталі —
> `items/JEK-R7.md`.

## Phase 4 — Jekyll engine

| ID | Phase | Title | Depends | Status | Branch | Worktree | Last session | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| JEK-E1 | 4 | Аудит Phase 7c: чого бракує theme-neutral hooks | JEK-R7 | done | `feat/JEK-E1-theme-hooks-audit` | `JEK-E1-theme-hooks-audit` | 2026-11-07 | 2b9dc860 |
| JEK-E2 | 4 | Реалізація theme-neutral hooks | JEK-E1 | done | `feat/JEK-E2-theme-neutral-hooks` | `JEK-E2-theme-neutral-hooks` | 2026-11-07 | c950b994 |
| JEK-E3 | 4 | Bootstrap4 render-тести до паритету з Tailwind | JEK-E2 | done | `feat/JEK-E3-bootstrap4-render-parity` | `JEK-E3-bootstrap4-render-parity` | 2026-11-08 | a1ef8c59 |
| JEK-E4 | 4 | Доступність: labels, aria, focus, keyboard | JEK-E3 | done | `feat/JEK-E4-accessibility` | `../worktrees/JEK-E4-accessibility` | 2026-11-08 | — |
| JEK-E5 | 4 | Повний build + docs | JEK-E4 | done | `feat/JEK-E5-full-build-docs` | `../worktrees/JEK-E5-full-build-docs` | 2026-11-08 | — |

> Примітка: JEK-E1 — `done`: item commit `2b9dc860`, merge `--no-ff`
> `aacfcf2e`. Аудит без зміни коду; item-гейти — **T** 214/214, **V** 3/3,
> **CA** PASS. Відкрито 8 прогалин (G-1..G-8): blocker-ів немає, G-1 —
> єдиний видимий UI-дефект. Рішення для реалізації — `items/JEK-E1.md` і
> `theme-neutral-hooks.md`. JEK-E2 переведено в `ready`.
>
> JEK-E2 — `done`: item commit `c950b994`, merge `--no-ff` `4cfd9730`.
> G-1..G-6, G-8 реалізовано; `T` 215/215, `V` 3/3, `CA` PASS, `CN` ok,
> `VR` PASS після ручного перегляду розбіжностей `new.html` і
> перезахоплення baseline. G-7 лишається окремим item-ом. Деталі —
> `items/JEK-E2.md`.
>
> JEK-E3 — `done`: item commit `a1ef8c59`, merge `--no-ff` `6a25a32b`.
> Item лише про тести (runtime, теми, CSS, конфіги, `_includes`,
> `_plugins`, baseline без змін). Додано `theme-render-parity`
> і `theme-wire-parity` — Tailwind тепер проходить booted `add-property`
> (таблиця glue-селекторів, autocomplete, G-1, location summary, локальний
> captcha); узгоджено `BOOTSTRAP_TOKENS`/`HOOK_TOKENS` (`alert-info` —
> widget-хук captcha). `T` 228/228, `V` 3/3, `CA` PASS; `VR` не запускався.
> Деталі — `items/JEK-E3.md`.

## Phase 5 — Eleventy parity (`reifua`)

| ID | Phase | Title | Depends | Status | Branch | Worktree | Last session | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EL-1 | 5 | Синхронізація рушія + hash-тест | JEK-E5 | done | `feat/EL-1-engine-sync` | `../worktrees/EL-1-engine-sync` | 2026-11-09 | — |
| EL-2 | 5 | Сторінка add-property + Bootstrap4 wiring | EL-1 | done | feat/EL-2-add-property-page | ../worktrees/EL-2-add-property-page | 2026-11-09 | 7959fcd |
| EL-3 | 5 | Demo-сторінка (Tailwind) | EL-1 | done | `feat/EL-3-demo-page` | `../worktrees/EL-3-demo-page` | 2026-11-09 | a4d8570 |
| EL-4 | 5 | Notify: layout/host, config, captcha, endpoint | EL-2 | done | `feat/EL-4-notify-wiring` | `../worktrees/EL-4-notify-wiring` | 2026-11-09 | e8ad8f7 |
| EL-5 | 5 | Passthrough + Tailwind purge | EL-2, EL-4 | done | `feat/EL-5-passthrough-purge` | `../worktrees/EL-5-passthrough-purge` | 2026-11-09 | 1689dc6 |
| EL-6 | 5 | Порт `check-add-property` | EL-2 | done | `feat/EL-6-check-add-property` | `../worktrees/EL-6-check-add-property` | 2026-11-10 | db1f95f |
| EL-7 | 5 | Порт `check-notify` | EL-4 | done | `feat/EL-7-check-notify` | `X:/OpenCodeData/opencode/worktree/b25e23/EL-7-check-notify` | 2026-11-11 | bb0fc36 |
| EL-8 | 5 | Freshness + parity test Jekyll ↔ 11ty | EL-6, EL-7 | done | `feat/EL-8-freshness-parity` | `X:/OpenCodeData/opencode/worktree/b25e23/EL-8-freshness-parity` | 2026-11-12 | c2ab420 |
| EL-9 | 5 | Повний build + усі гейти | EL-1..EL-8 | done | `feat/EL-9-full-gates` | `X:/OpenCodeData/opencode/worktree/b25e23/EL-9-full-gates` | 2026-11-12 | d26c782c |
| EL-10 | 5 | Notify: повний конфіг в island | EL-7 | done | `feat/EL-10-notify-config-island` | `X:/OpenCodeData/opencode/worktree/b25e23/EL-10-notify-config-island` | 2026-11-11 | b0f5e05 |

## Phase 6 — Publication (`form-engine`)

| ID | Phase | Title | Depends | Status | Branch | Worktree | Last session | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-1 | 6 | Bootstrap репо + MIT `LICENSE` + `NOTICE` | EL-9 | done | `feat/PUB-1-bootstrap-repo` | `../worktrees/PUB-1-bootstrap-repo` | 2026-11-12 | 1b15b19 |
| PUB-2 | 6 | Виділити `runtime/` | PUB-1 | done | `feat/PUB-2-extract-runtime` | `../worktrees/PUB-2-extract-runtime` | 2026-11-12 | 397c93c |
| PUB-3 | 6 | Виділити Jekyll-адаптер | PUB-2 | done | `feat/PUB-3-extract-jekyll-adapter` | `../worktrees/PUB-3-extract-jekyll-adapter` | 2026-11-12 | 35e80dd |
| PUB-4 | 6 | Виділити Eleventy-адаптер | PUB-2 | done | `feat/PUB-4-extract-eleventy-adapter` | `../worktrees/PUB-4-extract-eleventy-adapter` | 2026-11-12 | 86880af |
| PUB-5 | 6 | `tools/`, `schema/`, `test/` | PUB-2 | done | `feat/PUB-5-tools-schema-test` | `../worktrees/PUB-5-tools-schema-test` | 2026-11-12 | d1b8187 |
| PUB-6 | 6 | `package.json`, exports, versioning, changelog | PUB-2..5 | done | `feat/PUB-6-package-exports` | `X:/OpenCodeData/opencode/worktree/247de9/PUB-6-package-exports` | 2026-11-13 | ba5a759 |
| PUB-7 | 6 | `examples/jekyll` + `examples/eleventy` | PUB-6 | done | `feat/PUB-7-examples` | `X:/OpenCodeData/opencode/worktree/247de9/PUB-7-examples` | 2026-11-14 | d611cc5 |
| PUB-11 | 6 | Close test debt: pure-runtime on `../runtime/*`, site-coupled to adapters with fixtures | PUB-6 | done | `feat/PUB-6-package-exports` | `X:/OpenCodeData/opencode/worktree/247de9/PUB-6-package-exports` | 2026-11-13 | ba5a759 |
| PUB-8 | 6 | `README.md` + getting started | PUB-7 | done | `feat/PUB-8-readme-getting-started` | `../worktrees/PUB-8-readme-getting-started` | 2026-11-14 | 19f35d9 |
| PUB-9 | 6 | Config reference, theming, migration | PUB-6 | done | `feat/PUB-9-config-reference-theming-migration` | `../worktrees/PUB-9-config-reference-theming-migration` | 2026-11-14 | 7dc5b287 |
| PUB-10 | 6 | CI + реліз `1.0.0` | PUB-7..9 | done | `feat/PUB-10-ci-release` | `../worktrees/PUB-10-ci-release` | 2026-11-14 | 6065337 |
| PUB-12 | 6 | Перевірка установки пакету (`npm install @realtyua/form-engine`) в чистому проекті | PUB-10 | done | `feat/PUB-12-install-smoke-test` | `X:/OpenCodeData/opencode/worktree/247de9/PUB-12-install-smoke-test` | 2026-11-15 | 719ba5fd |
| PUB-13 | 6 | Міграція `realtyua` на npm пакет (локально, гейти, без пушу) | PUB-12 | done | `feat/PUB-13-realtyua-migrate-npm` (merged) | — (cleaned 2026-11-18) | 2026-11-18 | 5ade2ac7 |
| PUB-14 | 6 | Міграція `reifua` на npm пакет (локально, гейти, без пушу) | PUB-12 | done | `feat/PUB-14-reifua-migrate-npm` (reifua) | `../worktrees/PUB-14-reifua-migrate-npm` (reifua) | 2026-11-18 | 9685757 |
| PUB-15 | 6 | `runtime/package.json` (`type: module`) у пакеті | PUB-10 | done | `feat/PUB-15-runtime-package-type` | `../worktrees/PUB-15-runtime-package-type` | 2026-11-15 | 404f6c2 |
| PUB-16 | 6 | Eleventy-адаптер: CJS/ESM-скоуп і відв'язка від шляхів сайту | PUB-10 | done | `feat/PUB-16-eleventy-adapter-packaging` | `../worktrees/PUB-16-eleventy-adapter-packaging` | 2026-11-15 | 2941bee9 |
| PUB-17 | 6 | README/theming: шляхи копіювання та заяви про залежності | PUB-10 | done | `feat/PUB-17-docs-paths-deps` | `../worktrees/PUB-17-docs-paths-deps` | 2026-11-15 | 3a44099 |
| PUB-18 | 6 | Mouse pick in autocomplete/location dropdowns (hover loop) | PUB-13 | done | `feat/PUB-18-autocomplete-mouse-pick` (merged) | `../worktrees/PUB-18-autocomplete-mouse-pick` (form-engine, cleaned 2026-11-18) | 2026-11-18 | ca98184 |

> Примітка: PUB-15..PUB-17 відкриті за результатами PUB-12 (F1–F6 в
> `items/PUB-12.md`). PUB-12 був `blocked`, доки F1, F3, F4 не виправлені;
> повторна перевірка установки після PUB-15..PUB-17 — **успішна**, статус → `done`.
> PUB-15 → `done` (commit 404f6c2). PUB-16 → `done` (commit 2941bee9 / fbcbc6e merge).
> PUB-17 (docs only) → `done` (commit 3a44099). PUB-13 → `done` (follow-ups закрито
> 2026-11-18: package-backed paths з npm, `demo` endpoint, пакет 1.0.3; фінальний
> коміт `5ade2ac7`, push — користувач). PUB-18 → `done` (commit `ca98184`,
> merge `4e62dc8` у form-engine `master`). PUB-14 → `done` (reifua item `9685757`,
> merge `559e1b0` у `reifua/feature/form-engine`, branch/worktree прибрано;
> гейти зелені, локальні копії runtime/adapter видалено).

## Phase 7 — Integration (merge to master)

| ID | Phase | Title | Depends | Status | Branch | Worktree | Last session | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MERGE-1 | 7 | Merge `feature/form-engine` → `master` (`reifua`) | BASE-6 | done | `master` (reifua) | `reifua/main` | 2026-11-18 | 6da93db |
| MERGE-2 | 7 | Merge `feature/form-engine` → `master` (`realtyua`) | MERGE-1 | done | `master` (realtyua) | `realtyua/main` | 2026-11-18 | 80e9e38c |

> Примітка: MERGE-1 — merge виконано локально 2026-11-18 (`--no-ff`,
> merge-коміт `6da93db`, 24 коміти / 56 файлів, конфліктів немає). Гейти на
> `master`: build 0, `T` 238/238, `V` valid, `CA` PASS, `CN` ok. Користувач
> запушив `master` (`24d3a5b`), але Action упав на Node 18 (`ERR_REQUIRE_ESM`
> + `engines >=20`) — відкрито MOD-1. MERGE-1 лишається `review`, доки деплой
> не стане зеленим. Деталі — `items/MERGE-1.md`.
>
> Примітка: MERGE-2 — merge виконано локально 2026-11-18 у `realtyua/main`
> (`master`, `--no-ff`, merge-коміт `80e9e38c`, батьки `6d8bbeec` і `0ef96b72`).
> Конфлікт лише в `_config.yml` (коментований `#path: /*/data/*.json`): за
> погодженням користувача лишено рядок із `feature/form-engine`. Гейти на
> `master`: `T` 228/228, `V` 3/3 valid, `CA` PASS, Jekyll build 0 (175 с),
> `CN` ok (1 page). `VR` — FAIL 2/3 через застарілий baseline (captured
> 2026-11-08): `form-bake sha` після PUB-18 rebake (`e301affb`, 2026-11-18) і
> новий пост у `master`; baseline свідомо не перезахоплювався. Push `master`
> (`26b6c47b`) і зелений Action — 2026-11-18; статус `done`. Деталі —
> `items/MERGE-2.md`.

## Phase 8 — Modernization

| ID | Phase | Title | Depends | Status | Branch | Worktree | Last session | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MOD-1 | 8 | Node 24 + Eleventy 3.1.8 (CI fix, Tailwind без плагіна) | MERGE-1 | done | `feat/MOD-1-eleventy3-node24` (merged) | `reifua/main` | 2026-11-18 | ad87a29 |
| MOD-2 | 8 | Purge: сканувати Tailwind-тему з npm-пакета (стилі `/demo`) | MOD-1 | done | `feat/MOD-2-purge-npm-runtime` (merged) | `reifua/main` | 2026-11-18 | 92c773e |
| MOD-3 | 8 | Оновити `actions/*` (прибрати застереження Node 20) | MOD-1 | done | `feat/MOD-3-actions-versions` (merged) | `reifua/main` | 2026-11-18 | a2dbcb3 |
| MOD-4 | 8 | Cloudflare: Worker-endpoint форм, зона `rent.if.ua`, Turnstile | MERGE-1 | blocked | `feat/MOD-4-cloudflare-forms` | `reifua/main` | 2026-11-18 | — |
| MOD-5 | 8 | Оновити `actions/*` + `ubuntu-24.04` (`realtyua`) | MERGE-2 | todo | `feat/MOD-5-actions-versions` | `../worktrees/MOD-5-actions-versions` | — | — |
| MOD-6 | 8 | Відновити шлях до `assets/js/form-engine/captcha.js` | MERGE-2 | done | `feat/MOD-6-captcha-path` (merged) | `../worktrees/MOD-6-captcha-path` (cleaned) | 2026-11-18 | 748ea138 |
| MOD-7 | 8 | Turnstile: усунути подвійне завантаження `api.js` | MOD-6 | done | `feat/MOD-7-turnstile-double-load` (merged) | `../worktrees/MOD-7-turnstile-double-load` (cleaned) | 2026-11-19 | 08ca1244 |
| MOD-8 | 8 | Свідоме перезахоплення baseline `verify-render` | MOD-6, MOD-7 | todo | `feat/MOD-8-baseline-recapture` | `../worktrees/MOD-8-baseline-recapture` | — | — |

> Примітка: MOD-1 — `review`: Node 24 у CI, `@11ty/eleventy` 3.1.8, ESM-конфіг
> `eleventy.config.mjs`, `eleventy-plugin-tailwindcss` замінено на
> `lib/build-css.mjs` (postcss + tailwind + autoprefixer + clean-css). Item —
> два коміти (`bdd6df2` + `ad87a29`), merge `--no-ff` у `reifua/master` —
> `156fd37`, гілку видалено. Гейти: `npm ci` ok, build 0, `T` 238/238,
> `V` valid, `CA` PASS, `CN` ok, `VR` 42/42. Чекає push + зелений Action.
> Деталі — `items/MOD-1.md`.
>
> MOD-1 задеплоєно 2026-11-18: Action зелений. Лишились застереження
> «Node.js 20 is deprecated» для `actions/checkout@v4`, `setup-node@v4`,
> `upload-artifact@v4`, `deploy-pages@v4` — це не помилка (actions примусово
> виконуються на Node 24), оновлення тегів — окремий item після перевірки
> актуальних версій (мережа).
>
> MOD-2 — `done`: після першого деплою `/demo` втратив стилі. Причина —
> застарілий шлях purge (`./src/assets/js/form-engine/**`) після PUB-14;
> тепер сканується `node_modules/@realtyua/form-engine/runtime/**`. Класів без
> CSS по `dist` **86 → 29**, `main.css` 19 361 → 28 671 B. Item-коміт
> `92c773e`, merge `--no-ff` `4c94ecc`, гілку видалено. Гейти: build 0,
> `T` 238/238, `V` valid, `CA` PASS, `CN` ok, `VR` 42/42. Push + зелений
> Action; користувач підтвердив стилі `/demo` на живому сайті. Деталі —
> `items/MOD-2.md`.
>
> MOD-3 — `review`: теги `actions/*` піднято до актуальних мажорів, що
> працюють на Node 24 — `checkout@v7` (`v7.0.1`), `setup-node@v7` (`v7.1.0`),
> `upload-pages-artifact@v5` (`v5.0.0`, всередині `upload-artifact@v7`),
> `deploy-pages@v5` (`v5.0.1`). Входи workflow (`node-version`, `cache`,
> `path`) сумісні — звірено з `action.yml`. Гейти: YAML parse ok, build 0,
> `T` 238/238. Item-коміт `a2dbcb3`, merge `--no-ff` `494de8b`, гілку
> видалено; push виконано, Action зелений без застережень про Node 20.
> Status `done`. Деталі — `items/MOD-3.md`.
>
> MOD-4 — `blocked`: Cloudflare Worker-endpoint для форм, зона `rent.if.ua`
> і Turnstile. Рішення: той самий акаунт; API token + `wrangler`; код —
> `workers/forms/` у `reifua/main`; доставка — як `realtyua/main/workers/*`,
> окремо для `rent.if.ua`; endpoint `https://forms.rent.if.ua`; NS на
> Cloudflare, GitHub Pages — DNS-only; новий Turnstile widget, secret
> вставляє користувач. План A–D готовий; бракує токена/Account ID,
> sitekey, email-адрес, підтвердження NS і дозволу на `npm install`
> wrangler. Деталі — `items/MOD-4.md`.
>
> MOD-3 і MOD-4 — окремі сесії. MOD-3 закрито (`done`). MOD-4:
> реалізація ще не починалася (у цій сесії — лише рішення й план);
> старт — після токена й sitekey.
>
> MOD-5..MOD-8 — окремі сесії після MERGE-2 (зареєстровано 2026-11-18,
> статус `todo`; гілку й worktree створює кожна сесія самостійно):
> MOD-5 — застереження Actions (рецепт MOD-3 із reifua, плюс `ubuntu-24.04`);
> MOD-6 — 404 `/assets/js/captcha.js` після перейменування в `178afaf8`;
> MOD-7 — подвійне завантаження Turnstile: підтверджено живими доказами
> (HEAD + BODY) і усунуто видаленням інжекту з `head.html`;
> MOD-8 — свідоме перезахоплення baseline `verify-render` (дві застарілі
> розбіжності, зафіксовані в MERGE-2). Деталі — `items/MOD-5.md`..`MOD-8.md`.
>
> MOD-6 — `review`: `_includes/head.html:178` тепер посилається на
> `assets/js/form-engine/captcha.js`; у рендері з `turnstile_enabled: true`
> старий шлях відсутній, тег `api.js` не змінено. Гейти: build 0 + check-notify
> ok, `V` 3/3 valid; `T` 227/228 (stale baked form) і `CA` 4 failure(s)
> (autocomplete) — обидві розбіжності існували ще на `master` @ `5f07b1c9`
> і не спричинені MOD-6. Item-коміт `748ea138`, merge `--no-ff` у `master` —
> `35da72b9` (затверджено користувачем; `feature/form-engine` позаду master).
> Push — користувач. Деталі — `items/MOD-6.md`.
>
> MOD-7 — `done`: живі Network/View Source підтвердили два інжекти —
> `head.html` (`?v=site.time`) і запечений фрагмент двигуна
> (`?v=engineDigest`). Варіантом A сайтовий блок видалено; з
> `turnstile_enabled: true` у `new.html` лишився 1 набір тегів у BODY
> (було 2: HEAD + BODY). Гейти: build 0, `V` 3/3 valid, `CN` ok,
> `T` 227/228 (stale baked form) і `CA` 4 failure(s) (autocomplete) —
> відомі розбіжності baseline. Notify лишається на `type: raw` і без
> асетів; уніфікація вимагає нової версії `@realtyua/form-engine` —
> окремий ID. Item-коміт `08ca1244`, merge `--no-ff` у `master` —
> `a73eaabf`. Push — користувач. Деталі — `items/MOD-7.md`.

**Разом: 60 item.**

## Протокол сесії

1. Нова сесія (build-агент), назва `<ID> — <Title>`.
2. `/item <ID>`.
3. Worktree: `worktree_create <ID>-<slug>` і всередині нього — гілка
   `feat/<ID>-<slug>` (**worktree створюється в detached HEAD**, треба перейти
   на нову гілку одразу). У worktree немає `node_modules`; для гейтів зробити
   junction на канонічний (`cmd /c mklink /J node_modules ..\..\main\node_modules`),
   **ніколи** `npm install`. Junction знімати **до** `worktree_remove`.
4. Baseline-гейти **до** змін.
5. Реалізація лише в межах scope.
6. Гейти item.
7. Handoff + статус.
8. Користувач переглядає зміни → «прийнято».
9. Агент виконує локальний цикл: `git add` (явні файли), `git commit`
   `<ID>: <short imperative>`, `git merge --no-ff` у `feature/form-engine`,
   оновлення Commit SHA у реєстрі, видалення worktree; статус → `done`.
10. `git push` — користувач.

Агент НЕ запускає: `git push`, `git fetch/pull`, `git rebase`, `git reset --hard`,
`git commit --amend`, не створює тегів, не робить force-push.
Локальний цикл (commit → merge --no-ff → cleanup) — лише після явного схвалення
користувачем («прийнято»). До схвалення всі зміни лишаються в робочому дереві.
Усе робиться локально (без мережі), файли — UTF-8 без BOM, будь-яка дія — з
дозволу користувача.

## Іменування

| Артефакт | Шаблон |
| --- | --- |
| Branch | `feat/<ID>-<slug>` → `feat/JEK-R1-leaflet-dedup` |
| Worktree | `../worktrees/<ID>-<slug>` |
| Session | `<ID> — <Title>` |
| Commit | `<ID>: <short imperative>` |

## Правила

- Один шар на item: runtime / theme / adapter / config / tests / docs.
- Одна платформа, крім items паритету.
- Знайшов поза scope → новий ID, не розширюй поточний.
- Не влізає в одну сесію → `<ID>a`, `<ID>b`.
- `docs/form-engine/items/<ID>.md` — єдине джерело деталей item.
