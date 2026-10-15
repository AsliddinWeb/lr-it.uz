# EdTech — loyiha umumiy ko'rinishi

## Loyiha haqida
EdTech — O'zbekiston auditoriyasi uchun mo'ljallangan, **to'liq bepul**, amaliyotga yo'naltirilgan IT ta'lim platformasi. Platforma Python, C++ va kompyuter savodxonligi bo'yicha kurslarni taqdim etadi, real vaqtda kod ijrosi, AI-tutor, gamifikatsiya va sertifikatlash orqali o'quv jarayonini to'liq siklga aylantiradi.

Interfeys tili: **faqat o'zbek tili**.

## Asosiy tamoyillar
- Barcha kurslar **hech qanday to'lovsiz**.
- Kursga kirish **pul emas, so'rov (ariza) + tasdiqlash** orqali cheklanadi.
- Tasdiqlangan so'rov egasiga kirish **Telegram bot** orqali beriladi (bot foydalanuvchini avtomatik autentifikatsiya qiladi va platformaga ulaydi).
- Har bir mavzuda **AI-yordamchi** mavjud (Anthropic Claude API asosida).
- Har mavzu **real vaqtda kod ijrosi** (Python/C++) bilan mustahkamlanadi.
- O'qish jarayoni **gamifikatsiya** (XP, reyting, badge) orqali qiziqarli qilinadi.
- Kursni tugatgan o'quvchi **tekshiriladigan raqamli sertifikat** oladi.
- Faqat **bepul/ochiq-manba** texnologiyalar ishlatiladi (litsenziya to'lovlari yo'q).
- Interfeys **premium admin-panel darajasida** bo'lishi kerak: tungi/kunduzgi rejim, ochiladigan-yopiladigan sidebar, grafiklar, global qidiruv, profil dropdown — arzon/shablon ko'rinish emas.
- Ikonlar uchun professional ikon kutubxonasi ishlatiladi, **emoji hech qayerda ishlatilmaydi**.

## Foydalanuvchi rollari
| Rol | Tavsif |
|---|---|
| **Student** | Kurslarga so'rov beradi, o'qiydi, quiz topshiradi, sertifikat oladi |
| **Author** | Bir nechta muallif bo'lishi mumkin (multi-author). O'z kurslarini yaratadi, so'rovlarni ko'rib chiqadi, o'quvchilarni kuzatadi |
| **Admin** | Butun tizimni to'liq boshqaradi — foydalanuvchilar, kurslar, so'rovlar, kontent |

## Yuqori darajadagi arxitektura
```
┌─────────────────┐      ┌──────────────────┐      ┌───────────────┐
│  Frontend        │◄────►│  Backend API      │◄────►│  PostgreSQL    │
│  Next.js + TS     │ REST/│  FastAPI          │      │  (asosiy DB)   │
│  Tailwind          │ WS  │  SQLAlchemy async │      └───────────────┘
└─────────────────┘      └──────┬───────────┘
                                  │
      ┌───────────────┬──────────┼──────────────┬────────────────┐
      ▼               ▼          ▼              ▼                ▼
┌───────────┐  ┌─────────────┐ ┌───────────┐ ┌────────────┐ ┌───────────┐
│ Telegram   │  │ Piston       │ │ Claude API │ │ Redis       │ │ MinIO      │
│ bot        │  │ (kod ijrosi, │ │ (AI-tutor)│ │ (queue,     │ │ (sertifikat│
│ (aiogram)  │  │ Docker'da)   │ │           │ │  cache)     │ │  fayllar)  │
└───────────┘  └─────────────┘ └───────────┘ └────────────┘ └───────────┘
```

Har bir servis alohida Docker konteynerida ishlaydi, `docker-compose` orqali orkestratsiya qilinadi (batafsili: `01_TECH_STACK.md`).

## Bog'liq hujjatlar
1. `00_PROJECT_OVERVIEW.md` — shu fayl
2. `01_TECH_STACK.md` — texnologiyalar va arxitektura qarorlari
3. `02_FEATURES.md` — to'liq funksional talablar
4. `03_DATABASE_SCHEMA.md` — ma'lumotlar bazasi tuzilishi
5. `04_PAGES_AND_ROUTES.md` — sahifalar, route'lar, rol bo'yicha ruxsatlar
6. `05_DESIGN_SYSTEM.md` — dizayn tizimi (rang, tipografiya, komponentlar, dark/light)
7. `06_API_ENDPOINTS.md` — backend API endpoint ro'yxati
8. `07_CONTENT_GUIDELINES.md` — matn/kontent yozish qoidalari
9. `08_ROADMAP.md` — ishlab chiqish bosqichlari
