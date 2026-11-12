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
| BASE-6 | 2 | `reifua`: доля `src/assets/data/**` (7.9 MB) | BASE-5 | todo | — | — | — | — |

> Примітка: BASE-2 і BASE-3 увійшли одним комітом `178afaf8` (97 файлів,
> +19952/−4365). Розділяти історію після push не стали — гілка вже опублікована.

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
| PUB-1 | 6 | Bootstrap репо + MIT `LICENSE` + `NOTICE` | EL-9 | review | `feat/PUB-1-bootstrap-repo` | `../worktrees/PUB-1-bootstrap-repo` | 2026-11-12 | 1b15b19 |
| PUB-2 | 6 | Виділити `runtime/` | PUB-1 | todo | — | — | — | — |
| PUB-3 | 6 | Виділити Jekyll-адаптер | PUB-2 | todo | — | — | — | — |
| PUB-4 | 6 | Виділити Eleventy-адаптер | PUB-2 | todo | — | — | — | — |
| PUB-5 | 6 | `tools/`, `schema/`, `test/` | PUB-2 | todo | — | — | — | — |
| PUB-6 | 6 | `package.json`, exports, versioning, changelog | PUB-2..5 | todo | — | — | — | — |
| PUB-7 | 6 | `examples/jekyll` + `examples/eleventy` | PUB-6 | todo | — | — | — | — |
| PUB-8 | 6 | `README.md` + getting started | PUB-7 | todo | — | — | — | — |
| PUB-9 | 6 | Config reference, theming, migration | PUB-6 | todo | — | — | — | — |
| PUB-10 | 6 | CI + реліз `1.0.0` | PUB-7..9 | todo | — | — | — | — |

**Разом: 43 item.**

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
