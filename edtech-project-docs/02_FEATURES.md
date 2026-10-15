# To'liq funksional talablar (Features)

## 1. Foydalanuvchi rollari
- **Student** — kurslarni ko'radi, so'rov beradi, o'qiydi, quiz topshiradi, XP/badge yig'adi, sertifikat oladi.
- **Author** (bir nechta muallif — multi-author) — o'z kursini yaratadi/boshqaradi, so'rovlarni ko'rib chiqadi, o'quvchilar progressini kuzatadi.
- **Admin** — butun tizim: foydalanuvchilar, kurslar, so'rovlar, kontent, sozlamalar.

## 2. Autentifikatsiya (Auth)
- Email + parol orqali ro'yxatdan o'tish, email tasdiqlash (OTP kod).
- Parolni tiklash oqimi.
- **Telegram orqali autentifikatsiya/ulash** — foydalanuvchi profilini Telegram akkauntiga bog'lash (keyingi bosqichda bot orqali kirish kodlari shu bog'lanish orqali yuboriladi).
- JWT access + refresh token asosida sessiya boshqaruvi.

## 3. Kursga kirish tizimi (bepul, so'rov asosida)
- Har kurs bepul, ammo kirish ochiq emas — **so'rov + tasdiqlash** orqali boshqariladi.
- Student "So'rov berish" tugmasini bosadi → ariza tegishli Author/Admin panelga tushadi.
- Author/Admin arizani **tasdiqlaydi** yoki **rad etadi** (rad etishda sabab yozish imkoniyati).
- Tasdiqlangach, tizim avtomatik ravishda Telegram bot orqali foydalanuvchiga kirish xabarini yuboradi.
- So'rov holatlari: `kutilmoqda`, `tasdiqlangan`, `rad etilgan`.

## 4. Kurs tarkibi
- Kurs → Modul(lar) → Mavzu(lar)/Dars(lar) ierarxiyasi.
- Har mavzu: video/matn kontenti, amaliy kod-mashqi, quiz, AI-yordamchi.
- Har mavzu uchun **real-time kod ijro maydoni** (Python/C++) — kod yozib "Run" bosiladi, natija va xatolik zudlik bilan chiqadi (Piston orqali, WebSocket bilan jonli oqim).

## 5. Yo'nalishlar
- **Kompyuter savodxonligi** (boshlang'ich daraja)
- **Python** (o'rta daraja)
- **C++** (yuqori daraja)

## 6. Savol-javob va Gamifikatsiya
- Har mavzu ostida **savol-javob (Q&A)** bo'limi — student savol yozadi, muallif/boshqa studentlar javob beradi.
- **XP tizimi** — har bajarilgan topshiriq/quiz uchun ball.
- **Reyting jadvali (Leaderboard)** — umumiy va kurs bo'yicha.
- **Badge/yutuqlar** — masalan, "Python: boshlang'ich", "7 kunlik streak", "Top-10".
- **Daraja (level) tizimi** va kunlik faollik streak kuzatuvi.

## 7. Sertifikat
- Kursni to'liq tugatgan studentga avtomatik **PDF sertifikat** generatsiya qilinadi (unikal ID + QR-kod bilan).
- Ochiq **sertifikatni tekshirish sahifasi** — QR yoki ID orqali haqiqiyligini istalgan kishi tekshira oladi.

## 8. AI-yordamchi (har bitta mavzuda)
- Mavzuni tushuntirib berish (savol-javob rejimida).
- Yuborilgan kodni tahlil qilish, xatoni tushuntirish.
- Qo'shimcha mashq/misol generatsiya qilish.
- Muallif tomonidan: AI yordamida quiz savollari generatsiyasi (admin/author panelda).

## 9. Admin panel (to'liq)
- Foydalanuvchilarni boshqarish (rol berish, bloklash, o'chirish).
- Kurslarni boshqarish (tasdiqlash, tahrirlash, arxivlash).
- Barcha so'rovlarni ko'rish/boshqarish (global).
- Sertifikatlar bazasini boshqarish.
- Quiz/test bankini boshqarish.
- Q&A moderatsiyasi.
- Bildirishnoma yuborish (email/Telegram orqali ommaviy xabar).
- Sayt kontenti (Home/About/Contact matnlari) va rol/huquqlar sozlamalari.
- Umumiy tizim statistikasi va grafiklar (foydalanuvchilar o'sishi, faol kurslar, so'rov konversiyasi).

## 10. Author dashboard (to'liq)
- Kurs yaratish/tahrirlash (curriculum builder — modul/mavzu tartiblash).
- Har mavzu uchun kontent, kod-mashq, quiz qo'shish.
- O'z kurslariga tushgan so'rovlarni tasdiqlash/rad etish.
- O'quvchilar ro'yxati va progress monitoringi.
- O'z kurslari statistikasi (faollik, tugatish foizi, reyting).
- O'quvchilarga xabar yuborish.

## 11. Umumiy platforma sahifalari
- Home, Courses (katalog + filter + qidiruv), Course detail, About, Contact.
- Barcha rollar uchun profil sozlamalari (ism, avatar, Telegram bog'lanishi, til — hozircha faqat o'zbek).

## 12. Tizim talablari (nofunksional)
- To'liq **responsive** (mobil, planshet, desktop).
- **Tungi/kunduzgi rejim** — barcha sahifa va dashboardlarda, foydalanuvchi tanlovi saqlanadi.
- **Global qidiruv** — dashboardlarda (kurs, o'quvchi, so'rov bo'yicha) ishlaydigan, natija darhol chiqadigan qidiruv.
- Ikonlar — professional ikon kutubxonasi (Lucide); **emoji ishlatilmaydi**.
- Barcha matnlar — professional ohangda, faqat o'zbek tilida.
