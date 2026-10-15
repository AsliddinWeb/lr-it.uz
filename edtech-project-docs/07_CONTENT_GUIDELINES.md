# Kontent va matn yozish qoidalari

## Umumiy jarayon
1. Har bir sahifa/komponent uchun **avval to'liq matn (nusxa) alohida tayyorlanadi** — sarlavha, tavsif, tugma matnlari, xato/bo'sh holat xabarlari.
2. Matn tasdiqlangach, UI komponentiga joylashtiriladi.
3. Bitta sahifa ichida atama va ohang **izchil** bo'lishi kerak (masalan, "so'rov" so'zi barcha joyda bir xil, ba'zan "ariza"/"zayavka" deb almashtirilmaydi).

## Ohang (tone of voice)
- **Professional, rasmiy-do'stona** — talabaga ham, mualliflarga ham, adminlarga ham hurmat bilan murojaat qiladi.
- Qisqa va aniq gaplar, ortiqcha bezak so'zlarsiz.
- Faol nisbat (active voice) ustuvor: "So'rovingizni tasdiqladik", "Sertifikat tayyor" — passiv emas.
- **Hech qanday emoji ishlatilmaydi** — na tugmalarda, na bildirishnomalarda, na xato xabarlarida.
- Tugma matni har doim **harakatni** ifodalaydi: "So'rov berish", "Kursni saqlash", "Sertifikatni yuklab olish" — "Submit", "OK" kabi umumiy so'zlar ishlatilmaydi.
- Bitta harakat butun oqim davomida bir xil nomlanadi: agar tugma "Nashr qilish" bo'lsa, muvaffaqiyat xabari ham "Nashr qilindi" bo'lishi kerak, "Yuborildi" emas.

## Atamalar lug'ati (izchillik uchun)
| Atama | Ma'nosi | Muqobil ishlatilmaydi |
|---|---|---|
| So'rov | Kursga kirish uchun ariza | ariza, zayavka |
| Dostup | Kursga kirish huquqi | ruxsat, kirish huquqi |
| Mavzu | Alohida dars birligi | dars, lesson |
| Muallif | Kurs yaratuvchi (author) | ustoz, o'qituvchi |
| O'quvchi | Student | talaba, foydalanuvchi (rol nomi sifatida) |
| Tasdiqlash / Rad etish | So'rov holatini o'zgartirish | qabul qilish/bekor qilish |
| Yutuq | Badge | nishon, medal |

## Bo'sh holat (empty state) va xato xabarlari
- Bo'sh holat — harakatga chaqiruv sifatida yoziladi: "Hali birorta kursga so'rov bermagansiz. Kurslar katalogidan boshlang."
- Xato xabarlari — nima noto'g'ri ketgani va nima qilish kerakligini aniq aytadi, kechirim so'ralmaydi: "Kod ishga tushmadi: sintaksis xatosi 4-qatorda." Umumiy "Xatolik yuz berdi" ishlatilmaydi — imkon qadar aniq sabab ko'rsatiladi.

## Namuna matnlar (referens sifatida)

**Hero (Home):**
- Sarlavha: "Amaliyot orqali IT sohasini o'rganing"
- Tavsif: "Python, C++ va kompyuter savodxonligini real vaqtda kod yozib, AI yordamida bepul o'rganing."
- CTA: "Kurslarni ko'rish" / "Qanday ishlashini bilish"

**So'rov tasdiqlandi (bildirishnoma):**
- "So'rovingiz tasdiqlandi. Kursga kirish kodi Telegram orqali yuborildi."

**So'rov rad etildi:**
- "So'rovingiz rad etildi. Sabab: {sabab}. Qayta murojaat qilishingiz mumkin."

**Kod ijrosi muvaffaqiyatsiz:**
- "Kod bajarilmadi: {xatolik matni}. Qayta urinib ko'ring."

**Sertifikat tayyor:**
- "Tabriklaymiz — '{kurs nomi}' kursini tugatdingiz. Sertifikatingiz tayyor."

**Bo'sh dashboard (author, hali kurs yo'q):**
- "Hozircha kurslaringiz yo'q. Birinchi kursingizni yarating va o'quvchilarga ulashing."

## Har bir asosiy sahifa uchun tayyorlanishi kerak bo'lgan matn hujjatlari
Quyidagi sahifalar uchun implementatsiyadan oldin alohida matn qoralamasi tayyorlanadi (kerak bo'lsa alohida `.md` fayl sifatida):
- Home
- Courses (katalog)
- Course detail
- About
- Contact
- Auth oqimlari (login/register/telegram-link)
- Student dashboard
- Author dashboard
- Admin dashboard
- Sertifikat va uni tekshirish sahifasi

Har bir hujjatda: sahifa sarlavhasi, kichik tavsif, bo'lim sarlavhalari, tugma matnlari, bo'sh/xato holatlar ro'yxati bo'lishi kerak.
