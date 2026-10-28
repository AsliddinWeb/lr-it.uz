# Deploy qo'llanmasi

Server: Ubuntu 22.04 (`164.92.240.184`). Domenlar: `lr-it.uz`, `www.lr-it.uz`, `lr-it.neonsoft.uz`.

> **Eslatma:** fayllar (sertifikat PDF'lari, mavzu resurslari) MinIO'da emas, `storage_data` Docker volume'ida saqlanadi: MinIO'ning rasmiy Docker imidjlari endi chiqarilmaydi.

## Qanday ishlaydi

```
Brauzer ──443──> serverdagi nginx (SSL, certbot) ──> 127.0.0.1:8700 ──> Docker nginx ──┬─> frontend (Next.js)
                                                                                       └─> backend  (FastAPI)
```

- **8700-port faqat `127.0.0.1` da ochiladi** — tashqaridan unga to'g'ridan-to'g'ri kirib bo'lmaydi, faqat domen orqali.
- Postgres, Redis, Piston va bot tashqariga umuman chiqarilmagan (faqat Docker ichki tarmog'ida).
- Serverda boshqa loyihalar ham ishlayotgani uchun `docker-compose.prod.yml` o'z nomi (`lrit`) ostida ishlaydi — boshqa loyihalarning konteyner va volume'lari bilan to'qnashmaydi.

## 0. Boshlashdan oldin tekshiring

```bash
free -h                                  # xotira
ss -tlnp | grep :8700                    # bo'sh bo'lishi kerak (bo'sh edi)
ss -tlnp | grep -E ':80 |:443 '          # kim 80/443 ni ushlab turibdi?
docker --version && docker compose version
nginx -v && certbot --version
```

- **Xotira.** Server 2 GB (boshqa loyihalar bilan bo'lishiladi), shuning uchun `docker-compose.prod.yml` da backend 1 worker bilan ishlaydi va har bir konteynerga xotira limiti qo'yilgan (xotira yetmasa shu stack'ning o'z konteyneri to'xtaydi, qo'shni loyihalar emas). Oxirgi tekshiruvda xotira 70%, swap 50% edi. Frontend imidjini yig'ish (`next build`) va Piston ancha xotira oladi. Yig'ish paytida server qotib qolmasligi uchun 2 GB swap qo'shib qo'ying (agar yetarli bo'lmasa):
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
openssl rand -hex 24     # POSTGRES_PASSWORD uchun
openssl rand -hex 32     # JWT_SECRET uchun
```

- `POSTGRES_PASSWORD` ni yozing va **xuddi shu parolni** `DATABASE_URL` ichidagi `BU_YERGA_POSTGRES_PAROLI` o'rniga qo'ying.
- `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `SMTP_*` — mavjud bo'lsa shu yerga. Bo'sh qolsa: AI yordamchi, bot va email xatlari (OTP, parolni tiklash) ishlamaydi, qolgan hammasi ishlaydi.
- Qolganlarini (`PUBLIC_BASE_URL`, `CORS_ORIGINS`, `ENVIRONMENT`) o'zgartirmang.

`.env` faylini hech qachon git'ga qo'shmang (`.gitignore`da bor).

Ishga tushirish (birinchi marta 5–15 daqiqa oladi — imidjlar yig'iladi):

```bash
docker compose up -d --build
docker compose ps                  # hammasi Up bo'lishi kerak

# Xotira tor bo'lsa, Piston'siz (u eng og'ir): imidjini ham yuklamaydi
# docker compose up -d postgres redis backend frontend bot nginx
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

Keyingi foydalanuvchilar (adminlar ham) saytdan qo'shiladi: **Foydalanuvchilar → Yangi foydalanuvchi**. U yerda foydalanuvchini tahrirlash, bloklash va o'chirish ham alohida sahifalarda amalga oshiriladi.

> **Ehtiyot bo'ling:** buyruqdagi `EMAIL` — shablon, uning o'rniga haqiqiy email yozing (aks holda `EMAIL` nomli foydalanuvchi yaratiladi).

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

### DNS hali to'liq bo'lmasa (bosqichma-bosqich SSL)

Certbot so'ralgan **har bir** domen serverga qarashini talab qiladi. Domenlardan biri hali tayyor bo'lmasa, faqat tayyorlari uchun sertifikat oling, qolganlarini keyin qo'shing:

```bash
# 1. Hozir DNS tayyor domen(lar) uchun, masalan:
sudo certbot --nginx -d lr-it.neonsoft.uz

# 2. Qolgan domenlar DNS'da paydo bo'lgach (dig +short lr-it.uz  → 164.92.240.184), sertifikatni kengaytiring:
sudo certbot --nginx --expand -d lr-it.neonsoft.uz -d lr-it.uz -d www.lr-it.uz
```

Kengaytirishgacha tayyor bo'lmagan domenlarda brauzer sertifikat nomuvofiqligi haqida ogohlantiradi, bu kutilgan holat.

> **Muhim:** `ENVIRONMENT=production` bo'lganda login cookie'lari faqat HTTPS orqali ishlaydi (`Secure`). SSL olinmaguncha saytga kirib bo'lmaydi — bu kutilgan holat.

## Email yuborish: kod kelmasa shu yerga qarang

Ro'yxatdan o'tishda va parolni tiklashda 6 xonali kod emailga yuboriladi. Email sozlanmagan bo'lsa, production'da email orqali ro'yxatdan o'tish ishlamaydi (sayt buni ochiq aytadi), Google orqali kirish esa ishlayveradi.

> **Muhim:** DigitalOcean serverlarida **SMTP portlari 25, 465 va 587 bloklangan** ([rasmiy hujjat](https://docs.digitalocean.com/support/why-is-smtp-blocked/)). Shuning uchun **Gmail SMTP bu serverda ishlamaydi** (`Timed out connecting to smtp.gmail.com`). Yechim: HTTPS (443-port) orqali ishlaydigan email xizmati.

### Tavsiya: Resend (HTTPS API)

1. <https://resend.com> da ro'yxatdan o'ting.
2. **Domains → Add Domain** → `lr-it.uz`. Resend bir nechta **DNS yozuvlarini** beradi (SPF, DKIM, odatda 3 tadan 4 tagacha TXT/MX). Ularni `lr-it.uz` ning DNS panelida (A yozuvlarini qo'shgan joyingizda) kiriting, so'ng Resend'da **Verify** bosing. Status **Verified** bo'lishi kerak (bir necha daqiqadan bir necha soatgacha).
3. **API Keys → Create API Key** (ruxsat: *Sending access*). `re_...` bilan boshlanadigan kalitni nusxalang, u faqat bir marta ko'rsatiladi.
4. `.env` ga yozing:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   SMTP_FROM=EdTech <no-reply@lr-it.uz>
   ```
   `SMTP_FROM` dagi manzil **tasdiqlangan domeningizdan** bo'lishi shart (`...@lr-it.uz`), aks holda Resend rad etadi. (`SMTP_HOST` va boshqa `SMTP_*` qatorlari bo'sh qolsa bo'ladi.)
5. Qo'llang va sinang:
   ```bash
   docker compose up -d --force-recreate backend
   docker compose exec backend python -m app.scripts.send_test_email siz@gmail.com
   ```
   `OK` chiqsa, xat keladi. Xato bo'lsa, skript **Resend bergan sababni** ko'rsatadi (masalan, "domain is not verified").

Resend'ning bepul tarifi kichik loyiha uchun yetarli (hozirgi limitlar uchun resend.com/pricing ga qarang).

### Muqobil: oddiy SMTP
`RESEND_API_KEY` bo'sh bo'lsa, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` ishlatiladi. Bu portlar ochiq bo'lgan serverda ishlaydi. Port `465` va `2465` da SSL avtomatik yoqiladi, boshqa portlarda server qo'llasa STARTTLS. Resend SMTP'si ham mavjud (`smtp.resend.com`, login `resend`, parol: API key, port `2587` STARTTLS yoki `2465` SSL), lekin bu portlar DigitalOcean'da amalda ochiqligini bu yerda tasdiqlamadik: ishonchli yo'l API.

**Email sozlanmaguncha:** admin foydalanuvchini **Foydalanuvchilar → Tahrirlash → "Email tasdiqlangan"** orqali qo'lda tasdiqlashi mumkin.

## Google bilan kirish

Bu usul email yuborishni talab qilmaydi, shuning uchun eng ishonchli kirish yo'li. Faqat **Client ID** kerak (secret kerak emas), backend uni runtime'da frontend'ga beradi, **qayta yig'ish shart emas**.

1. <https://console.cloud.google.com> da loyiha yarating (yoki mavjudini tanlang).
2. **APIs & Services → OAuth consent screen**: User type **External**, ilova nomi `EdTech`, support email, **Authorized domains**: `lr-it.uz`, `neonsoft.uz`. Scope'lar standart (`email`, `profile`, `openid`) qoladi. Oxirida **Publish app** (`In production`) bosing, aks holda faqat "Test users" ro'yxatidagilar kira oladi.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**: Application type **Web application**.
4. **Authorized JavaScript origins** ga qo'shing (redirect URI kerak emas):
   - `https://lr-it.uz`
   - `https://www.lr-it.uz`
   - `https://lr-it.neonsoft.uz`
   - lokal sinash uchun: `http://localhost:8700`
5. Yaratilgan **Client ID** (`....apps.googleusercontent.com`) ni `.env` ga yozing:
   ```
   GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
   ```
6. Qo'llang: `docker compose up -d --force-recreate backend`. Sahifani yangilang: kirish sahifasida Google tugmasi paydo bo'ladi.

Qoidalar: Google'da tasdiqlangan email kerak; shu email bilan oldin ro'yxatdan o'tgan hisob bo'lsa, u avtomatik Google'ga ulanadi (parol saqlanadi). Tasdiqlanmagan hisobga kimdir oldindan parol qo'ygan bo'lsa, Google orqali kirishda o'sha parol **bekor qilinadi**.

## 6. Tekshiruv ro'yxati

- [ ] `https://lr-it.uz`, `https://www.lr-it.uz`, `https://lr-it.neonsoft.uz` ochiladi (qulf belgisi bilan)
- [ ] `http://...` avtomatik `https://...` ga yo'naltiradi
- [ ] Admin sifatida kirish ishlaydi
- [ ] Kurs yaratish, mavzu qo'shish ishlaydi
- [ ] Mavzu sahifasida kod ishga tushadi (Piston tillari o'rnatilgan bo'lsa)
- [ ] Mavzuga fayl biriktirish ishlaydi (diskdagi `storage_data` volume'ga yoziladi)
- [ ] Ro'yxatdan o'tishda email kodi keladi (yoki `send_test_email` `OK` beradi)
- [ ] (Agar `GOOGLE_CLIENT_ID` bo'lsa) kirish sahifasida Google tugmasi ko'rinadi va u orqali kirish ishlaydi
- [ ] (Agar sozlangan bo'lsa) AI yordamchi javob beradi, bot `/start` ga javob beradi

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

# Yuklangan fayllar va sertifikatlar (storage volume)
docker run --rm -v lrit_storage_data:/data -v ~:/backup alpine tar czf /backup/lrit-storage-$(date +%F).tar.gz -C /data .
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
