# OC-5 — `.gitignore`

Phase: 1 · Depends: — · Repo: realtyua
Branch: `feature/form-engine` · Worktree: —

Status: `review` (чекає commit BASE-2)

## Goal

`.gitignore` не ховає файли, потрібні для публікації та роботи рушія:
`README.md`, `package.json` (кореневий і `assets/js/form-engine/package.json`).

## Files

- `.gitignore`

## Steps

1. Прибрати `package.json` з секції Gulp, перейменувати секцію на Node.
2. Прибрати `README.md` з секції Other.
3. Перевірити `git check-ignore` для потрібних шляхів.
4. Перевірити, що `_form-engine/`, `.opencode/`, `opencode.jsonc`,
   `docs/form-engine/` не ігноруються.

## Acceptance

- `git check-ignore` нічого не повертає для перелічених шляхів.
- `assets/js/form-engine/package.json` (ESI-маркер `{"type":"module"}`) стає
  видимим для git.
- Кореневий `package.json` зі скриптами test/validate стає видимим.
- Немає нових випадкових ігнорів.

## Gates

```powershell
git check-ignore -v README.md package.json opencode.jsonc AGENTS.md `
  docs/form-engine/WORKITEMS.md .opencode/skills/form-engine/SKILL.md
```

Очікування: порожньо (exit 1).

## Out of scope

Додавання `.gitattributes` для LF/CRLF, чистка `.old`-файлів (JEK-R5).

## Handoff log

- 2026-11-01: прибрано `package.json` і `README.md`.
- `git check-ignore` для потрібних шляхів — порожньо.
- Наслідок: у `git status` з'явилися `package.json`, `package-lock.json`,
  `assets/js/form-engine/package.json`. Це очікувано і входить у BASE-3.
- Кореневого `README.md` у репо немає — він не «ховався», а відсутній;
  створити актуальний — JEK-R6 / PUB-8.
