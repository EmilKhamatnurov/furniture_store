# Публикация и CI/CD — KHAMATNUROV MEBEL

Инструкция: как впервые опубликовать сайт на сервере и настроить
**автоматический деплой при изменении версии** (CI/CD через GitHub Actions).

---

## 0. Как это устроено

Сайт разворачивается как набор Docker-контейнеров на одном сервере (VPS):

| Контейнер | Что делает |
|-----------|-----------|
| `postgres` | База данных PostgreSQL |
| `redis`    | Кэш + очереди (BullMQ) |
| `migrate`  | Одноразово применяет миграции БД перед стартом приложения |
| `app`      | Next.js-приложение (сам сайт) |
| `worker`   | Фоновый обработчик (письма) |
| `caddy`    | Реверс-прокси + автоматический HTTPS (Let's Encrypt) |

CI/CD-процесс: вы ставите **тег версии** (`v1.0.0`) → GitHub Actions подключается
к серверу по SSH → забирает код → пересобирает и перезапускает контейнеры.

> **Важно (152-ФЗ):** персональные данные должны храниться в РФ. Берите
> **российский** VPS (Selectel, Timeweb, Yandex Cloud). Минимум ~2 vCPU / 4 ГБ RAM
> (сборка Next.js требует памяти).

---

## 1. Что понадобится заранее

1. **VPS** в РФ с Ubuntu 22.04/24.04.
2. **Домен** (например, `shop.example.ru`).
3. Аккаунт **GitHub** (код будет в репозитории).

---

## 2. Заливаем код в Git (один раз)

Проект ещё не в git. На своём компьютере, в папке `fs-step1`:

```bash
git init
git add .
git commit -m "Initial commit"
```

Создайте приватный репозиторий на GitHub и привяжите его:

```bash
git branch -M main
git remote add origin git@github.com:ВАШ_ЛОГИН/khamatnurov-mebel.git
git push -u origin main
```

> Файлы с секретами (`.env`, `.env.local`, `.env.production`) **не попадут** в git —
> они уже в `.gitignore`. Это правильно: секреты живут только на сервере.

---

## 3. Готовим сервер (один раз)

Подключитесь к серверу по SSH (`ssh root@IP_СЕРВЕРА`) и выполните.

### 3.1. Установить Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### 3.2. Настроить DNS

В панели вашего регистратора домена создайте **A-запись**:
`shop.example.ru → IP вашего сервера`. Подождите несколько минут.

### 3.3. Клонировать репозиторий

```bash
mkdir -p /opt/khamatnurov-mebel
cd /opt/khamatnurov-mebel
git clone git@github.com:ВАШ_ЛОГИН/khamatnurov-mebel.git .
```

> Чтобы сервер мог делать `git clone/pull` приватного репозитория, добавьте на
> сервере ssh-ключ (deploy key) и пропишите его в настройках репозитория на GitHub
> (Settings → Deploy keys). Либо клонируйте по HTTPS с токеном.

### 3.4. Создать файлы окружения

**`.env`** — переменные для docker-compose:

```bash
cat > .env <<'EOF'
POSTGRES_PASSWORD=ПРИДУМАЙТЕ_СЛОЖНЫЙ_ПАРОЛЬ_БД
DOMAIN=shop.example.ru
EOF
```

**`.env.production`** — конфиг приложения. Скопируйте шаблон и заполните:

```bash
cp .env.production.example .env.production
nano .env.production
```

Обязательно заполните (см. комментарии в файле):
- `NEXT_PUBLIC_APP_URL=https://shop.example.ru`
- `APP_SECRET` — сгенерируйте: `openssl rand -hex 32`
- `DATABASE_URL` — пароль **тот же**, что `POSTGRES_PASSWORD` в `.env`,
  хост — `postgres` (имя контейнера): `postgresql://furniture_user:ПАРОЛЬ@postgres:5432/furniture_shop`
- `REDIS_URL=redis://redis:6379`
- `S3_*` — ключи объектного хранилища (Selectel) для картинок
- `YUKASSA_*` — данные магазина ЮKassa
- `UNISENDER_API_KEY`, `EMAIL_FROM` — для писем
- `ADMIN_EMAIL` — почта администратора

### 3.5. Пароль для входа в админку

```bash
docker compose run --rm migrate npm run admin:hash -- "ВАШ_ПАРОЛЬ_АДМИНА"
```

Скопируйте выведенную строку `ADMIN_PASSWORD_HASH=...` в `.env.production`.

### 3.6. Первый запуск

```bash
docker compose --profile prod up -d --build
```

Команда соберёт образы, применит миграции БД и поднимет все сервисы.
Caddy сам выпустит SSL-сертификат. Через минуту сайт откроется на `https://shop.example.ru`.

(Опционально) наполнить демо-данными:
```bash
docker compose run --rm migrate npm run db:seed
```

### 3.7. Настроить webhook ЮKassa

В личном кабинете ЮKassa укажите URL уведомлений:
`https://shop.example.ru/api/payments/yukassa/webhook`

✅ На этом сайт опубликован.

---

## 4. Настройка автодеплоя (CI/CD)

Workflow уже готов: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
Он деплоит на сервер при пуше тега версии (`v*.*.*`).

### 4.1. Создать SSH-ключ для деплоя

На **своём компьютере**:

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f deploy_key -N ""
```

Появятся два файла: `deploy_key` (приватный) и `deploy_key.pub` (публичный).

Публичный ключ добавьте на **сервер**:
```bash
ssh-copy-id -i deploy_key.pub ВАШ_ПОЛЬЗОВАТЕЛЬ@IP_СЕРВЕРА
# или вручную допишите содержимое deploy_key.pub в ~/.ssh/authorized_keys на сервере
```

### 4.2. Добавить секреты в GitHub

Репозиторий → **Settings → Secrets and variables → Actions → New repository secret**.
Создайте:

| Имя секрета | Значение |
|-------------|----------|
| `DEPLOY_HOST` | IP или домен сервера |
| `DEPLOY_USER` | пользователь SSH (например, `root` или `deploy`) |
| `DEPLOY_SSH_KEY` | **полное содержимое файла `deploy_key`** (приватный ключ) |
| `DEPLOY_PATH` | `/opt/khamatnurov-mebel` |
| `DEPLOY_PORT` | `22` (если SSH на другом порту — укажите его) |

> После добавления удалите локальные `deploy_key*` или храните в надёжном месте.

### 4.3. Готово

Теперь любой пуш тега версии автоматически деплоит сайт.

---

## 5. Как выкатывать новую версию

Когда внесли изменения и хотите опубликовать:

```bash
# 1. Закоммитить и запушить изменения
git add .
git commit -m "Описание изменений"
git push

# 2. Поднять версию и поставить тег
npm version patch        # 0.1.0 → 0.1.1 (или: minor / major)
git push --follow-tags
```

`npm version patch` сам обновит `package.json`, создаст коммит и тег `v0.1.1`.
Пуш тега запустит GitHub Actions → через пару минут новая версия на сайте.

**Следить за деплоем:** вкладка **Actions** в репозитории GitHub.
**Ручной запуск** (без нового тега): Actions → Deploy → Run workflow.

---

## 6. Эксплуатация

```bash
# Статус контейнеров
docker compose --profile prod ps

# Логи приложения / воркера / прокси
docker compose --profile prod logs -f app
docker compose --profile prod logs -f worker
docker compose --profile prod logs -f caddy

# Перезапустить вручную
docker compose --profile prod up -d --build

# Откат на предыдущую версию
git checkout v0.1.0
docker compose --profile prod up -d --build
```

### Бэкап базы данных

```bash
# Создать дамп
docker exec furniture_postgres pg_dump -U furniture_user furniture_shop > backup_$(date +%F).sql

# Восстановить
cat backup.sql | docker exec -i furniture_postgres psql -U furniture_user -d furniture_shop
```

Рекомендуется настроить ежедневный бэкап (cron) и хранить копии вне сервера.

---

## 7. Частые проблемы

| Симптом | Причина / решение |
|---------|-------------------|
| `502 Bad Gateway` | `app` ещё собирается или упал — `docker compose logs app` |
| Нет HTTPS | Проверьте, что A-запись домена указывает на сервер и порт 80/443 открыт |
| Сборка падает с нехваткой памяти | Мало RAM — добавьте swap или возьмите тариф ≥4 ГБ |
| Миграции не применились | Логи: `docker compose logs migrate` |
| Письма не уходят | Проверьте `UNISENDER_API_KEY`; в проде воркер шлёт реально |
| Деплой по тегу не сработал | Тег должен быть формата `vX.Y.Z`; проверьте секреты и вкладку Actions |

---

## 8. Альтернатива: сборка образов в CI (для роста нагрузки)

Текущая схема собирает образы **на сервере** (просто, без реестра). Когда трафик
вырастет и сборка начнёт мешать работе сайта, переходят на схему:
CI собирает образы → пушит в реестр (GitHub Container Registry / Yandex CR) →
сервер только скачивает (`docker compose pull && up -d`). Это уже отдельная
настройка — обращайтесь, когда понадобится.
