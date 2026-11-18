# Form Engine — робочий процес

Цей каталог — реєстр робіт над Form Engine. Він не є частиною сайту.

- `WORKITEMS.md` — 41 item, статуси, залежності, протокол сесії.
- `items/<ID>.md` — деталі одного item: мета, файли, кроки, acceptance, гейти,
  handoff.
- `items/_TEMPLATE.md` — шаблон для нового item.

## Як почати item

```text
/item JEK-R1
```

Команда (`.opencode/commands/item.md`) змушує агента:

1. прочитати реєстр та item-файл (або створити його з шаблону й показати);
2. перевірити repo/branch/worktree;
3. прогнати baseline-гейти до змін;
4. реалізувати лише scope item-а;
5. прогнати гейти;
6. дописати handoff і оновити статус;
7. закомітити `<ID>: <short imperative>`.

## Життєвий цикл

```text
todo → ready → doing → review → done
                  ↘ blocked
```

`ready` — усі залежності `done`. `done` — змерджено в `feature/form-engine`,
worktree видалено.

## Правила

- Один item — одна сесія, одна гілка, один worktree.
- Не запускати дві сесії в одному worktree.
- Jekyll і 11ty — різні репозиторії, отже різні worktrees.
- Для read-only аналізу worktree не потрібен.
- Нова знахідка поза scope → новий ID.

## Пов'язане

- План: `~/.opencode/plan/form-engine-plan.md` (reference `plan`).
- Скіл: `.opencode/skills/form-engine/`.
- Правила для агентів: `AGENTS.md`.
