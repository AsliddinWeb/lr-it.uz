# Ishlab chiqish bosqichlari (Roadmap)

> Claude Code uchun tavsiya: har bosqichni alohida branch/commit sifatida yakunlab, keyingisiga o'tish.

## Bosqich 0 — Infratuzilma
- Repo tuzilishi: `/backend`, `/frontend`, `/bot`, `/infra` (docker-compose, nginx config).
- `docker-compose.yml`: postgres, redis, minio, piston, backend, frontend, bot, nginx.
- Backend skeleton: FastAPI + SQLAlchemy async ulanishi, Alembic init.
- Frontend skeleton: Next.js + TypeScript + Tailwind + shadcn/ui o'rnatish, `05_DESIGN_SYSTEM.md` asosida rang/shrift tokenlarini `tailwind.config` ga kiritish.

## Bosqich 1 — Auth va foydalanuvchilar
- `users` jadvali, JWT auth, email OTP tasdiqlash.
- Login/Register/Forgot-password sahifalari (avval matn — `07_CONTENT_GUIDELINES.md`ga muvofiq).
- Rol asosidagi route himoyasi (frontend middleware + backend dependency).

## Bosqich 2 — Kurs katalogi (statik)
- `courses`, `modules`, `lessons` jadvallari.
- Home, Courses, Course detail sahifalari (hali so'rov mantiqisiz, faqat ko'rish).
- Admin/Author uchun kurs yaratish formasi (curriculum builder — asosiy versiya).

## Bosqich 3 — So'rov oqimi + Telegram bot
- `enrollments` jadvali, tasdiqlash/rad etish API'lari.
- `aiogram` bot mikroservisi: `/start`, Telegram akkauntni bog'lash, tasdiqlangan so'rov haqida xabar yuborish.
- Author/Admin dashboardida so'rovlar ro'yxati va tasdiqlash UI'si.

## Bosqich 4 — Real-time kod ijrosi
- Piston konteynerini docker-compose'ga integratsiya qilish.
- `/code/run` va WebSocket endpoint.
- Course detail/dars sahifasida kod-mashq maydoni (kod yozish, ishga tushirish, natijani ko'rish).

## Bosqich 5 — Quiz va gamifikatsiya
- `quizzes`, `quiz_questions`, `quiz_attempts`, `xp_logs`, `badges`, `user_badges`.
- Quiz topshirish oqimi, XP hisoblash, reyting jadvali sahifasi.
- Radial progress ring komponenti (`05_DESIGN_SYSTEM.md` signature elementi).

## Bosqich 6 — AI-yordamchi
- Anthropic Claude API integratsiyasi, `ai_conversations` jadvali.
- Har mavzu ostida AI chat komponenti (streaming javob).
- Author panelda AI orqali quiz savollari generatsiyasi.

## Bosqich 7 — Sertifikatlar
- Kurs tugatish shartini tekshirish logikasi.
- WeasyPrint + qrcode orqali PDF generatsiya, MinIO'ga saqlash.
- Sertifikatni tekshirish ochiq sahifasi.

## Bosqich 8 — Admin/Author dashboard (premium UI)
- To'liq sidebar (collapse), topbar (global qidiruv, bildirishnoma, profil dropdown).
- Statistik kartalar, grafiklar (Recharts), jadvallar — `05_DESIGN_SYSTEM.md`ga to'liq muvofiq.
- Q&A moderatsiya, bildirishnoma yuborish, sayt kontenti boshqaruvi.

## Bosqich 9 — Cilalash (polish)
- Dark/light rejim — barcha sahifa va dashboardlarda tekshirish.
- To'liq responsive tekshiruv (mobil/planshet/desktop).
- Global qidiruvni barcha dashboardlarda ulash.
- Bo'sh holatlar, xato xabarlari — `07_CONTENT_GUIDELINES.md` bo'yicha yakuniy tekshiruv.
- Performance: Next.js image optimizatsiyasi, DB indekslar, Redis keshlash.

## Bosqich 10 — Joylashtirish (deployment)
- Production `docker-compose.yml` (yoki Nginx + SSL bilan alohida konfiguratsiya).
- CI/CD: GitHub Actions orqali test + build + deploy.
- Backup strategiyasi (Postgres dump, MinIO snapshot).

---

**Eslatma:** har bosqich boshida tegishli `.md` fayllar (`02_FEATURES.md`, `03_DATABASE_SCHEMA.md`, `05_DESIGN_SYSTEM.md` va h.k.) Claude Code'ga kontekst sifatida ko'rsatilishi kerak, shunda har safar mos qism aniq ishlatiladi.
