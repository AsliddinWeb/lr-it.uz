# Deploy qo'llanmasi

Server: Ubuntu 22.04 (`164.92.240.184`). Domenlar: `lr-it.uz`, `www.lr-it.uz`, `lr-it.neonsoft.uz`.

## Qanday ishlaydi

```
Brauzer ──443──> serverdagi nginx (SSL, certbot) ──> 127.0.0.1:8700 ──> Docker nginx ──┬─> frontend (Next.js)
                                                                                       └─> backend  (FastAPI)
```

- **8700-port faqat `127.0.0.1` da ochiladi** — tashqaridan unga to'g'ridan-to'g'ri kirib bo'lmaydi, faqat domen orqali.
- Postgres, Redis, MinIO, Piston va bot tashqariga umuman chiqarilmagan (faqat Docker ichki tarmog'ida).
- Serverda boshqa loyihalar ham ishlayotgani uchun `docker-compose.prod.yml` o'z nomi (`lrit`) ostida ishlaydi — boshqa loyihalarning konteyner va volume'lari bilan to'qnashmaydi.

## 0. Boshlashdan oldin tekshiring

```bash
free -h                                  # xotira
ss -tlnp | grep :8700                    # bo'sh bo'lishi kerak (bo'sh edi)
ss -tlnp | grep -E ':80 |:443 '          # kim 80/443 ni ushlab turibdi?
docker --version && docker compose version
nginx -v && certbot --version
```

- **Xotira.** Oxirgi tekshiruvda xotira 70%, swap 50% edi. Frontend imidjini yig'ish (`next build`) va Piston ancha xotira oladi. Yig'ish paytida server qotib qolmasligi uchun 2 GB swap qo'shib qo'ying (agar yetarli bo'lmasa):
  ```bash
  sudo fallocate -l 2G /swapfile2 && sudo chmod 600 /swapfile2
  sudo mkswap /swapfile2 && sudo swapon /swapfile2
  ```
- **80/443 portlar.** Agar ularni nginx ushlab turgan bo'lsa — 4-qadam shunga mo'ljallangan. Boshqa dastur (Apache, Caddy, Traefik) ushlasa, shu dasturga mos qoidani yozing: `lr-it.uz`, `www.lr-it.uz`, `lr-it.neonsoft.uz` → `http://127.0.0.1:8700`.
- Docker, nginx yoki certbot o'rnatilmagan bo'lsa:
  ```bash
  sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
  curl -fsSL https://get.docker.com | sudo sh        # docker + compose plugin
  ```

## 1. DNS

Registrator/DNS panelida uchala domen uchun **A yozuv** qo'shing:

| Nomi | Tur | Qiymat |
|---|---|---|
| `lr-it.uz` | A | `164.92.240.184` |
| `www.lr-it.uz` | A | `164.92.240.184` |
| `lr-it.neonsoft.uz` | A | `164.92.240.184` |

Tekshirish (yangilanishi bir necha daqiqadan bir necha soatgacha olishi mumkin):

```bash
dig +short lr-it.uz www.lr-it.uz lr-it.neonsoft.uz     # hammasi 164.92.240.184 bo'lishi kerak
```

Certbot (6-qadam) DNS to'g'ri bo'lmaguncha sertifikat bera olmaydi.

## 2. Kodni serverga olish

```bash
cd /home/projects
git clone https://github.com/AsliddinWeb/lr-it.uz.git lr-it.uz
cd /home/projects/lr-it.uz
```

## 3. Sozlamalar (`.env`) va ishga tushirish

```bash
cp .env.production.example .env
nano .env
```

To'ldirish:

```bash
openssl rand -hex 24     # POSTGRES_PASSWORD, MINIO_SECRET_KEY uchun
openssl rand -hex 32     # JWT_SECRET uchun
```

- `POSTGRES_PASSWORD` ni yozing va **xuddi shu parolni** `DATABASE_URL` ichidagi `BU_YERGA_POSTGRES_PAROLI` o'rniga qo'ying.
- `MINIO_ACCESS_KEY` — istalgan uzun nom, `MINIO_SECRET_KEY` — parol.
- `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `SMTP_*` — mavjud bo'lsa shu yerga. Bo'sh qolsa: AI yordamchi, bot va email xatlari (OTP, parolni tiklash) ishlamaydi, qolgan hammasi ishlaydi.
- Qolganlarini (`PUBLIC_BASE_URL`, `CORS_ORIGINS`, `ENVIRONMENT`) o'zgartirmang.

`.env` faylini hech qachon git'ga qo'shmang (`.gitignore`da bor).

Ishga tushirish (birinchi marta 5–15 daqiqa oladi — imidjlar yig'iladi):

```bash
docker compose up -d --build
docker compose ps                  # hammasi Up bo'lishi kerak
docker compose logs -f backend     # "Application startup complete" ko'ringach Ctrl+C
curl -I http://127.0.0.1:8700/     # 200 OK
```

Backend har ishga tushganda migratsiyalarni o'zi qo'llaydi (`alembic upgrade head`).

### Bir martalik boshlang'ich amallar

**Yutuqlar (badge'lar):**
```bash
docker compose exec backend python -m app.scripts.seed_badges
```

**Birinchi administrator** (parol so'raladi):
```bash
docker compose exec backend python -m app.scripts.create_admin admin@lr-it.uz "Ism Familiya"
```
Kerak bo'lsa, shu buyruq mavjud foydalanuvchini administratorga aylantiradi va parolini yangilaydi.

**Kod ijrosi (Piston) uchun tillar.** Piston tillarsiz keladi — ularni bir marta o'rnatish kerak (backend ishlatadigan versiyalar: Python 3.12.0 va C++ uchun gcc 10.2.0):

```bash
docker compose exec backend python - <<'EOF'
import httpx
for lang, ver in [("python", "3.12.0"), ("gcc", "10.2.0")]:
    r = httpx.post("http://piston:2000/api/v2/packages", json={"language": lang, "version": ver}, timeout=900)
    print(lang, ver, r.status_code, r.text[:200])
EOF
```
O'rnatilganini tekshirish:
```bash
docker compose exec backend python -c "import httpx; print([ (r['language'], r['version']) for r in httpx.get('http://piston:2000/api/v2/runtimes').json()])"
```
Piston `amd64` imidj — bu serverda (x86_64) tabiiy ishlaydi.

## 4. Serverdagi nginx (domenlarni 8700 ga ulash)

```bash
sudo cp /home/projects/lr-it.uz/infra/host-nginx/lr-it.conf /etc/nginx/sites-available/lr-it.conf
sudo ln -s /etc/nginx/sites-available/lr-it.conf /etc/nginx/sites-enabled/lr-it.conf
```

Konfig `$connection_upgrade` o'zgaruvchisini ishlatadi (WebSocket uchun). Avval bor-yo'qligini tekshiring:

```bash
sudo grep -rn "connection_upgrade" /etc/nginx/ | grep -v lr-it.conf
```

- **Chiqish bo'sh bo'lsa** — `/etc/nginx/conf.d/websocket-upgrade.conf` faylini yarating:
  ```nginx
  map $http_upgrade $connection_upgrade {
      default upgrade;
      ''      close;
  }
  ```
- **Chiqishda `map ... $connection_upgrade` ko'rinsa** — boshqa loyiha allaqachon e'lon qilgan, qayta qo'shmang (nginx "duplicate" xatosini beradi).

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I -H "Host: lr-it.uz" http://127.0.0.1/      # 200 OK
```

Firewall yoqilgan bo'lsa:
```bash
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp    # 8700 ni ochish KERAK EMAS
```

## 5. SSL (certbot)

DNS to'g'ri bo'lgach (1-qadam):

```bash
sudo certbot --nginx -d lr-it.uz -d www.lr-it.uz -d lr-it.neonsoft.uz
```

- Email so'raydi, shartlarga rozilik beriladi.
- "Redirect HTTP traffic to HTTPS?" savoliga **2 (Redirect)** deb javob bering.
- Certbot nginx konfigini o'zi yangilaydi va avtomatik yangilanishni (timer) o'rnatadi. Tekshirish:
  ```bash
  sudo certbot renew --dry-run
  ```

> **Muhim:** `ENVIRONMENT=production` bo'lganda login cookie'lari faqat HTTPS orqali ishlaydi (`Secure`). SSL olinmaguncha saytga kirib bo'lmaydi — bu kutilgan holat.

## 6. Tekshiruv ro'yxati

- [ ] `https://lr-it.uz`, `https://www.lr-it.uz`, `https://lr-it.neonsoft.uz` ochiladi (qulf belgisi bilan)
- [ ] `http://...` avtomatik `https://...` ga yo'naltiradi
- [ ] Admin sifatida kirish ishlaydi
- [ ] Kurs yaratish, mavzu qo'shish ishlaydi
- [ ] Mavzu sahifasida kod ishga tushadi (Piston tillari o'rnatilgan bo'lsa)
- [ ] Mavzuga fayl biriktirish ishlaydi (MinIO)
- [ ] (Agar sozlangan bo'lsa) ro'yxatdan o'tishda email kodi keladi, AI yordamchi javob beradi, bot `/start` ga javob beradi

## Yangilash (yangi kod chiqqanda)

```bash
cd /home/projects/lr-it.uz
git pull
docker compose up -d --build        # migratsiyalar avtomatik qo'llanadi
docker image prune -f               # eski imidjlarni tozalash
```

## Foydali buyruqlar

```bash
docker compose ps                         # holat
docker compose logs -f --tail 100 backend # log (frontend, nginx, bot, piston ham shunday)
docker compose restart backend            # bitta xizmatni qayta ishga tushirish
docker compose down                       # to'xtatish (ma'lumotlar saqlanadi)
```

> `docker compose down -v` — **volume'larni ham o'chiradi (butun baza va yuklangan fayllar yo'qoladi)**. Faqat nima qilayotganingizni bilsangiz ishlating.

## Zaxira nusxa (backup)

```bash
# Baza
docker compose exec -T postgres pg_dump -U edtech edtech | gzip > ~/lrit-db-$(date +%F).sql.gz

# Tiklash (bo'sh bazaga)
gunzip -c ~/lrit-db-2026-01-01.sql.gz | docker compose exec -T postgres psql -U edtech edtech

# Yuklangan fayllar va sertifikatlar (MinIO volume)
docker run --rm -v lrit_minio_data:/data -v ~:/backup alpine tar czf /backup/lrit-minio-$(date +%F).tar.gz -C /data .
```

Kunlik avtomatik zaxira uchun `crontab -e` ga qo'shing:
```
0 3 * * * cd /home/projects/lr-it.uz && docker compose exec -T postgres pg_dump -U edtech edtech | gzip > /root/backups/lrit-db-$(date +\%F).sql.gz
```
(`mkdir -p /root/backups` qilib qo'ying, eski fayllarni vaqti-vaqti bilan o'chirib turing.)

## Muammolar

| Belgi | Sabab va yechim |
|---|---|
| `502 Bad Gateway` | Docker konteynerlari ishlamayapti: `docker compose ps`, `docker compose up -d`. Yaqinda ishga tushgan bo'lsa, 30–60 soniya kuting. |
| `port is already allocated` (8700) | Port band: `sudo ss -tlnp \| grep :8700`. Boshqa jarayon bo'lsa, `docker-compose.prod.yml` dagi `127.0.0.1:8700:80` va `infra/host-nginx/lr-it.conf` dagi `proxy_pass` ni bir xil boshqa portga o'zgartiring. |
| Login qilgach darhol chiqib ketadi | Sayt HTTPS emas (5-qadam) yoki `JWT_SECRET` yig'ishdan keyin o'zgartirilgan. `JWT_SECRET` o'zgarsa: `docker compose up -d --build frontend`. |
| Brauzerda CORS xatosi | `.env` dagi `CORS_ORIGINS` da domen yetishmayapti (JSON formatida, qo'sh tirnoqda). O'zgartirgach: `docker compose up -d backend`. |
| Build paytida `Killed` / server qotadi | Xotira yetmadi — 0-qadamdagi swap'ni qo'shing va qayta urining. |
| Kod ishga tushmaydi ("runtime not found") | Piston tillari o'rnatilmagan — 3-qadamdagi Piston buyrug'ini bajaring. |
| Sertifikat olinmaydi (certbot) | DNS hali yangilanmagan (`dig +short lr-it.uz`) yoki 80-port tashqaridan yopiq (firewall / provayder paneli). |
| Email kelmaydi | `SMTP_*` to'ldirilmagan yoki noto'g'ri: `docker compose logs backend \| grep -i smtp`. |
