# Деплой портфолио на Hetzner (свой домен)

Отдельный Next.js 15 сайт: [ArsentyStreltsov/portfolio](https://github.com/ArsentyStreltsov/portfolio).  
Стек на VPS: Node 20 + PM2 + Nginx + Let's Encrypt.

---

## Часть 1. Что понадобится заранее

| Что | Зачем |
|-----|--------|
| VPS на Hetzner | IP-адрес сервера |
| Домен | A-запись на IP |
| SSH-доступ | `ssh root@IP` или пользователь с sudo |
| Репозиторий на GitHub | `git clone` на сервер |
| Топик ntfy | заявки с формы `/start` |

Подставь свои значения везде ниже:

- `ДОМЕН` — например `arsenty.dev` или `www.arsenty.dev`
- `IP` — IP VPS
- `REPO` — `https://github.com/ArsentyStreltsov/portfolio.git` (или SSH-URL)

---

## Часть 2. DNS (у регистратора домена)

Создай записи:

| Тип | Имя | Значение |
|-----|-----|----------|
| A | `@` | `IP` сервера |
| A | `www` | `IP` сервера (если нужен www) |

Подожди 5–30 минут (иногда до часа), пока DNS обновится.  
Проверка с Mac:

```bash
dig +short ДОМЕН
```

Должен показаться IP Hetzner.

---

## Часть 3. Один раз настроить сервер

Подключись:

```bash
ssh root@IP
```

### 3.1. Обновление и базовые пакеты

```bash
apt update && apt upgrade -y
apt install -y nginx git curl certbot python3-certbot-nginx
```

### 3.2. Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # должно быть v20.x
npm -v
```

### 3.3. PM2 (чтобы сайт не падал после выхода из SSH)

```bash
npm install -g pm2
```

### 3.4. Клонировать сайт

```bash
mkdir -p /var/www
cd /var/www
git clone REPO arsenty-portfolio
cd arsenty-portfolio
```

### 3.5. Переменные окружения

Создай файл **на сервере** (в git его нет):

```bash
nano /var/www/arsenty-portfolio/.env.production
```

Содержимое (свой топик и домен!):

```env
NTFY_TOPIC=твой-секретный-топик-ntfy
# NTFY_URL=https://ntfy.sh
NEXT_PUBLIC_SITE_URL=https://ДОМЕН
```

`NEXT_PUBLIC_SITE_URL` нужен для SEO (canonical, sitemap, Open Graph). Без него подставится `https://arsentystreltsov.com`.

Сохрани: `Ctrl+O`, Enter, `Ctrl+X`.

В приложении ntfy на телефоне подпишись на **тот же** топик.

Справка по переменным — в `.env.example` репозитория.

### 3.6. Сборка и запуск

```bash
cd /var/www/arsenty-portfolio
npm ci
npm run build
pm2 start npm --name portfolio -- start
pm2 save
pm2 startup
```

Команда `pm2 startup` напечатает ещё одну команду — **скопируй и выполни её**.

Проверка локально на сервере:

```bash
curl -I http://127.0.0.1:3000
```

Должен быть ответ `200` или `307`/`308`, не ошибка соединения.

---

## Часть 4. Nginx + HTTPS (домен → сайт)

### 4.1. Конфиг сайта

```bash
nano /etc/nginx/sites-available/portfolio
```

Вставь (замени `ДОМЕН`):

```nginx
server {
    listen 80;
    server_name ДОМЕН www.ДОМЕН;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Включи сайт и проверь Nginx:

```bash
ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Открой в браузере `http://ДОМЕН` — сайт уже должен открываться (пока без замка).

### 4.2. SSL (Let's Encrypt)

```bash
certbot --nginx -d ДОМЕН -d www.ДОМЕН
```

Следуй вопросам (email, согласие). Certbot сам поправит Nginx на HTTPS.

Готово: `https://ДОМЕН`.

---

## Часть 5. Обновления: локальный пуш + автодеплой

### 5.1. С Mac — одним скриптом

Из корня проекта:

```bash
./push.sh "краткое сообщение коммита"
```

Скрипт сделает `git add` → `commit` → `push` в `main`.  
После пуша GitHub Actions сам обновит сайт на VPS (см. 5.2).

### 5.2. Автодеплой при пуше (один раз настроить)

Workflow: `.github/workflows/deploy.yml` — по пушу в `main` заходит на сервер по SSH и выполняет: `git reset --hard` → `npm ci` → `build` → `pm2 restart`.

#### На Mac: ключ только для деплоя

```bash
ssh-keygen -t ed25519 -C "github-actions-portfolio" -f ~/.ssh/portfolio_deploy -N ""
```

Публичный ключ на сервер (подставь свой IP/пользователя, если не `root`):

```bash
ssh-copy-id -i ~/.ssh/portfolio_deploy.pub root@IP
```

Или вручную: содержимое `~/.ssh/portfolio_deploy.pub` добавь одной строкой в `/root/.ssh/authorized_keys` на VPS.

Проверка:

```bash
ssh -i ~/.ssh/portfolio_deploy root@IP "echo ok"
```

#### В GitHub → Settings → Secrets and variables → Actions

Создай secrets:

| Secret | Значение |
|--------|----------|
| `SSH_HOST` | IP сервера (например `204.168.196.245`) |
| `SSH_USER` | `root` (или другой пользователь с доступом к `/var/www/arsenty-portfolio` и PM2) |
| `SSH_PRIVATE_KEY` | **весь** файл `~/.ssh/portfolio_deploy` (приватный ключ, включая `BEGIN`/`END`) |

Порт SSH в workflow — `22`. Если у тебя другой — поправь `port` в `.github/workflows/deploy.yml`.

Приватный ключ в git **не** клади.

#### На сервере: чтобы `git fetch` работал без вопросов

Репозиторий публичный — достаточно HTTPS-remote (как после обычного `git clone`). Проверь:

```bash
cd /var/www/arsenty-portfolio
git remote -v
# origin  https://github.com/ArsentyStreltsov/portfolio.git
```

После первого пуша с workflow смотри вкладку **Actions** на GitHub.

### 5.3. Ручной деплой на сервере (если Actions недоступен)

```bash
cd /var/www/arsenty-portfolio
git pull
npm ci
npm run build
pm2 restart portfolio
```

Если менял `.env.production` — после правки тоже `pm2 restart portfolio` (и пересобери, если менял `NEXT_PUBLIC_*`).

---

## Часть 6. Чеклист «всё ли ок»

- [ ] `https://ДОМЕН` открывается
- [ ] Главная, Portfolio, About, Process выглядят нормально
- [ ] `/start` — форма уходит, на телефон приходит ntfy
- [ ] После перезагрузки VPS сайт сам поднимается (`pm2 save` + `pm2 startup` уже сделаны)
- [ ] `https://ДОМЕН/robots.txt` и `https://ДОМЕН/sitemap.xml` открываются
- [ ] В `.env.production` задан `NEXT_PUBLIC_SITE_URL=https://ДОМЕН`
- [ ] (опционально) Google Search Console → добавить домен → отправить sitemap
Полезные команды:

```bash
pm2 status
pm2 logs portfolio
pm2 restart portfolio
```

---

## Частые проблемы

**DNS ещё не обновился** — `dig +short ДОМЕН` не показывает IP. Подожди или проверь записи у регистратора.

**502 Bad Gateway** — Next не запущен: `pm2 status`, `pm2 logs portfolio`.

**Форма не приходит** — нет `.env.production` или неверный `NTFY_TOPIC`; перезапусти после правки: `pm2 restart portfolio`.

**Certbot не выдал сертификат** — A-запись должна уже указывать на этот сервер; порты 80/443 открыты в firewall Hetzner (Cloud Firewall / ufw).

Открыть порты через ufw (если включён):

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## Чего делать не нужно

- Не деплоить монорепо — только этот репозиторий портфолио.
- Не класть секреты в git (`.env.production` создаётся только на сервере).
- Не обязательно Docker — для одного сайта PM2 + Nginx проще и достаточно.

---

## Краткая схема

```
Домен (A → IP)
    → Nginx :443
        → Next.js на 127.0.0.1:3000 (PM2)
            → /api/brief → ntfy
```
