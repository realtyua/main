# BASE-6 — `reifua`: доля `src/assets/data/**`

Phase: 2 · Depends: BASE-5 · Repo: reifua
Branch: `feat/BASE-6-reifua-data` · Worktree: `../worktrees/BASE-6-reifua-data`

Status: `todo`

## Goal

Перевірити, що закомічені 27 файлів `src/assets/data/**` у `reifua` справді
потрібні, відтворювані й не заважають збірці — або прибрати їх з репозиторію.
Після item немає ні «висячих» даних, ні сумнівів щодо їхнього походження.

## Статус: файли вже закомічені

Під час BASE-4 планувалося лишити теку untracked. Фактично коміт `7a95f78`
у `reifua/feature/form-engine` містить усі 27 файлів разом із рушієм.
Історію не переписували. Тому item тепер не «вирішити, чи трекати», а
**«перевірити доцільність і узгодженість»**.

## Контекст (знайдено в BASE-4)

- 27 файлів, разом **~7.9 MB**: `all.json` (571 KB), `lviv.json` (533 KB),
  `pl.json` (507 KB), `kh.json`, `zt.json`, `dp.json`, `vn.json`, `cn.json`,
  `ck.json`, `cv.json`, `if.json`, `km.json`, `kr.json`, `ks.json`,
  `kyiv.json`, `lt.json`, `mk.json`, `odesa.json`, `rv.json`, `sm.json`,
  `te.json`, `uz.json`, `zp.json`, `districts.json`,
  `districts-30559.json`, `info`, `scraper.py`.
- Це **дані сайту**, не Form Engine.
- `realtyua` тримає 28 аналогічних файлів у `assets/data` трекованими.
- `.eleventy.js` уже має `config.addPassthroughCopy('src/assets/data/')`,
  тобто build очікує цю теку.
- `reifua/.gitignore` цих файлів не ігнорує.

## Питання, на які item має відповісти

1. Чи `reifua` взагалі рендерить сторінки, що споживають ці дані?
2. Чи дані відтворювані з `scraper.py` (тоді — генерація, а не коміт)?
3. Чи `scraper.py` і `info` — службові артефакти, яким не місце в репо?
4. 7.9 MB одноразово — прийнятно для репозиторію, чи варто Git LFS /
   зовнішнє джерело?

## Steps

1. Grep `src/**` на звернення до `assets/data/`.
2. Перевірити, чи build без цих файлів щось ламає.
3. Рішення зафіксувати одним із варіантів:
   - **A** — `git add src/assets/data` окремим комітом `chore(data): region datasets`;
   - **B** — `.gitignore` + документована команда генерації;
   - **C** — Git LFS.
4. Якщо B: перевірити, що `addPassthroughCopy` не ламає build на чистому клоні.

## Acceptance

- `git status` у `reifua` чистий (без вічних untracked).
- Рішення й обґрунтування записані в handoff.
- Чистий клон `reifua` збирається (`npm run build`).

## Gates

```powershell
cd ..\..\reifua\main
npm run build
```

## Out of scope

- Синхронізація рушія (EL-1) і сторінки 11ty (EL-2…EL-4).
- Зміст самих даних і логіка скрейпера.

## Handoff log

- 2026-11-01: item створено під час BASE-4. Файли лишено untracked; рішення
  відкладено, щоб не змішувати дані сайту з комітами рушія.
- 2026-11-02: файли закомічено в `7a95f78` разом з рештою змін `reifua`.
  Item переорієнтовано з «вирішити, чи трекати» на «перевірити доцільність».
