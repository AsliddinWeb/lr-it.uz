# Texnologiyalar to'plami (Tech Stack)

> Tanlov mezoni: **bepul/ochiq-manba**, faol qo'llab-quvvatlanadigan, FastAPI/async ekotizimiga mos.

## Backend
| Qatlam | Texnologiya | Izoh |
|---|---|---|
| Til/framework | **Python 3.12 + FastAPI** | Async-native, avtomatik OpenAPI hujjat |
| ORM | **SQLAlchemy 2.0 (async)** | Modern, type-safe async ORM |
| Migratsiya | **Alembic** | SQLAlchemy bilan standart juftlik |
| Validatsiya | **Pydantic v2** | FastAPI bilan native integratsiya |
| Ma'lumotlar bazasi | **PostgreSQL 16** | Talab qilingan |
| Cache / navbat brokeri | **Redis** | Cache + fon vazifalari uchun |
| Fon vazifalari | **Arq** (async Redis queue) | Sertifikat generatsiyasi, Telegram xabarlari, AI so'rovlari navbati — Celery'dan farqli, to'liq async, FastAPI stackiga tabiiy mos |
| Autentifikatsiya | **JWT (access + refresh)**, `python-jose`, `passlib[bcrypt]` | Standart, bepul |
| Fayl saqlash | **MinIO** (S3-compatible, self-hosted) | Sertifikat PDF, avatarlar, kurs materiallari |
| Sertifikat PDF | **WeasyPrint** (HTML→PDF) + **qrcode** | Bepul, HTML/CSS orqali dizayn qilish qulay |
| Real-time oqim | **FastAPI WebSocket** | Kod ijrosi natijasini jonli chiqarish uchun |

## AI integratsiyasi
- **Anthropic Claude API** (`anthropic` Python SDK) — har mavzudagi AI-yordamchi.
- So'rovlar **Arq navbati** orqali oqim (streaming) tarzida frontendga uzatiladi (SSE/WebSocket).
- Har bir AI muloqoti `ai_conversations` jadvalida saqlanadi (kontekst va tahlil uchun).

## Kod ijro tizimi (real-time Python/C++)
- **Piston** (https://github.com/engineer-man/piston) — ochiq-manba, bepul, Docker orqali o'z serveringizda ishga tushiriladigan kod-ijro dvigateli.
- Har bir kod yuborilganda alohida izolyatsiyalangan konteynerda ishga tushadi (xavfsiz sandbox).
- Python va C++ dan tashqari kelajakda boshqa tillar ham oson qo'shiladi.
- Backend Piston'ga ichki tarmoq orqali (`http://piston:2000`) so'rov yuboradi, natijani WebSocket orqali frontendga uzatadi.

## Telegram bot
- **aiogram 3.x** (async, zamonaviy) — alohida mikroservis sifatida (`/bot`).
- Bot vazifalari: foydalanuvchini autentifikatsiya qilish, tasdiqlangan so'rov bo'yicha kirish kodi/havola yuborish, bildirishnomalar (yangi mavzu, sertifikat tayyor va h.k.).
- Bot backend bilan ichki REST API orqali gaplashadi (umumiy DB'ga to'g'ridan-to'g'ri yozmaydi — barcha yozuvlar backend orqali).

## Frontend
| Qatlam | Texnologiya | Izoh |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript** | SSR/SSG, yaxshi SEO (Home/Courses uchun), tez |
| Stil | **Tailwind CSS** | Talab qilingan |
| Komponent kutubxonasi | **shadcn/ui** (Radix UI asosida) | Headless, to'liq moslashtiriladigan — "shablon" ko'rinishdan qochish uchun ustiga to'liq qayta stillanadi |
| Ikonlar | **Lucide Icons** | Zamonaviy, minimal, professional chiziq-ikonlar to'plami; emoji hech qayerda ishlatilmaydi |
| Grafik/chart | **Recharts** | React-native, moslashuvchan, dark/light rejimga moslashadi |
| Server state | **TanStack Query** | Keshlash, qayta so'rov, optimistik yangilanish |
| Client/local state | **Zustand** | Sidebar holati, theme, UI holatlari |
| Formalar | **React Hook Form + Zod** | Validatsiya |
| Theme (dark/light) | **next-themes** + Tailwind `dark:` strategiyasi | Har bir sahifa va dashboard uchun to'liq qo'llab-quvvatlanadi |
| Real-time | **WebSocket client** | Kod ijrosi natijasi uchun |

## Infratuzilma
- **Docker + docker-compose** — har xizmat alohida konteynerda:
  `frontend`, `backend`, `bot`, `piston`, `postgres`, `redis`, `minio`, `nginx`.
- **Nginx** — reverse proxy va statik fayllarni uzatish.
- **GitHub Actions** — CI (test + lint), bepul (ochiq repo uchun cheksiz daqiqa).
- **Pytest** — backend testlari; **Playwright** — frontend e2e testlari (ixtiyoriy, keyingi bosqich).

## Muhit o'zgaruvchilari (asosiylar)
```
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://redis:6379/0
JWT_SECRET=...
ANTHROPIC_API_KEY=...
TELEGRAM_BOT_TOKEN=...
PISTON_URL=http://piston:2000
MINIO_ENDPOINT=...
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
```

## Nega bu tanlovlar
- Barchasi **litsenziya to'lovisiz**, self-hosted qilib bo'ladi.
- Backend to'liq **async** (FastAPI + SQLAlchemy async + Arq) — bir xil dasturlash uslubi, kam "context switching".
- Piston — Judge0'ga qaraganda o'rnatish va boshqarish osonroq, bepul va ochiq-manba.
- Next.js — SEO kerak bo'lgan ommaviy sahifalar (Home, Courses) va murakkab dashboardlar uchun bir xil freymvorkda ikkalasi ham yaxshi ishlaydi.
