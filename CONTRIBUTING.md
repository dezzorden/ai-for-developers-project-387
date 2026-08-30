# Участие в разработке

## Conventional Commits

Все сообщения коммитов, включая коммиты автоматизированных агентов, должны соответствовать [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(optional-scope): <description>
```

Допустимые типы:

- `feat` — новая пользовательская функциональность, повышает minor-версию;
- `fix` — исправление ошибки, повышает patch-версию;
- `docs` — документация;
- `test` — тесты;
- `refactor` — изменение кода без изменения поведения;
- `perf` — улучшение производительности;
- `build` — сборка и зависимости;
- `ci` — CI/CD;
- `chore` — прочие служебные изменения;
- `style` — форматирование без изменения поведения;
- `revert` — откат коммита.

Примеры:

```text
feat(booking): add guest slot selection
fix(api): reject overlapping bookings
test(e2e): cover occupied slot response
ci(release): configure release-please
```

Несовместимые изменения отмечаются `!` и секцией `BREAKING CHANGE` в теле коммита:

```text
feat(api)!: rename booking start field

BREAKING CHANGE: startAt replaces startTime in all booking requests.
```

Перед коммитом необходимо запустить относящиеся к изменению проверки. Агент создает коммит только по прямой просьбе пользователя и использует те же правила именования.

## Автоматические релизы

После merge Conventional Commits в `main` workflow `.github/workflows/release-please.yml` создает или обновляет release-PR. В нем release-please:

- рассчитывает следующую семантическую версию;
- обновляет `CHANGELOG.md` и версии package-файлов;
- после merge release-PR создает GitHub Release и git tag.

В настройках репозитория GitHub Actions должны иметь разрешение создавать pull requests: **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests**.
