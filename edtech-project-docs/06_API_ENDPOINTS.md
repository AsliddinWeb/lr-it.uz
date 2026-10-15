# Backend API endpointlari (FastAPI)

> Barcha endpointlar `/api/v1` prefiksi bilan. Auth talab qiluvchi endpointlar `Bearer <access_token>` bilan himoyalangan. Rol tekshiruvi FastAPI dependency orqali (`require_role("admin")` kabi).

## Auth
| Method | Endpoint | Tavsif |
|---|---|---|
| POST | `/auth/register` | Ro'yxatdan o'tish |
| POST | `/auth/verify-email` | OTP orqali email tasdiqlash |
| POST | `/auth/login` | Kirish, JWT qaytaradi |
| POST | `/auth/refresh` | Access tokenni yangilash |
| POST | `/auth/forgot-password` | Parol tiklash so'rovi |
| POST | `/auth/reset-password` | Yangi parol o'rnatish |
| POST | `/auth/telegram/link` | Telegram akkauntni bog'lash (deep-link token orqali) |
| POST | `/auth/telegram/webhook` | Bot xabarlarini qabul qilish (bot mikroservisi ishlatadi) |

## Users
| Method | Endpoint | Tavsif |
|---|---|---|
| GET | `/users/me` | Joriy foydalanuvchi profili |
| PATCH | `/users/me` | Profilni yangilash |
| GET | `/users` | *(admin)* Barcha foydalanuvchilar, qidiruv/filter bilan |
| PATCH | `/users/{id}/role` | *(admin)* Rol o'zgartirish |
| PATCH | `/users/{id}/block` | *(admin)* Bloklash/blokdan chiqarish |

## Courses
| Method | Endpoint | Tavsif |
|---|---|---|
| GET | `/courses` | Kurslar ro'yxati (filter: track, level, status) |
| GET | `/courses/{slug}` | Kurs detali |
| POST | `/courses` | *(author/admin)* Yangi kurs yaratish |
| PATCH | `/courses/{id}` | *(author/admin)* Kursni tahrirlash |
| PATCH | `/courses/{id}/status` | *(admin)* Tasdiqlash/arxivlash |
| POST | `/courses/{id}/modules` | *(author)* Modul qo'shish |
| POST | `/modules/{id}/lessons` | *(author)* Mavzu qo'shish |
| PATCH | `/lessons/{id}` | *(author)* Mavzuni tahrirlash |

## Enrollments (so'rovlar)
| Method | Endpoint | Tavsif |
|---|---|---|
| POST | `/enrollments` | *(student)* So'rov berish |
| GET | `/enrollments/me` | *(student)* Mening arizalarim |
| GET | `/enrollments` | *(author/admin)* Kelgan so'rovlar (filter: status) |
| PATCH | `/enrollments/{id}/approve` | *(author/admin)* Tasdiqlash → Telegram xabar trigger |
| PATCH | `/enrollments/{id}/reject` | *(author/admin)* Rad etish (sabab bilan) |

## Code execution (Piston integratsiyasi)
| Method | Endpoint | Tavsif |
|---|---|---|
| POST | `/code/run` | Kodni Piston orqali ishga tushirish (sync javob) |
| WS | `/ws/code/run` | Kod ijrosi natijasini jonli oqim sifatida uzatish |
| GET | `/code/submissions?lesson_id=` | *(student)* O'z submission tarixi |

## Quizzes
| Method | Endpoint | Tavsif |
|---|---|---|
| GET | `/lessons/{id}/quiz` | Mavzu quizini olish |
| POST | `/quizzes` | *(author)* Quiz yaratish |
| POST | `/quizzes/{id}/generate-ai` | *(author)* AI orqali savollar generatsiyasi |
| POST | `/quizzes/{id}/attempts` | *(student)* Javoblarni topshirish, ball hisoblash |

## Q&A
| Method | Endpoint | Tavsif |
|---|---|---|
| GET | `/lessons/{id}/questions` | Mavzu savollari |
| POST | `/lessons/{id}/questions` | Savol yozish |
| POST | `/questions/{id}/answers` | Javob yozish |
| PATCH | `/qa/{id}/moderate` | *(admin)* Moderatsiya |

## Gamifikatsiya
| Method | Endpoint | Tavsif |
|---|---|---|
| GET | `/leaderboard` | Umumiy/kurs bo'yicha reyting |
| GET | `/users/me/xp-history` | XP tarixi |
| GET | `/users/me/badges` | Qo'lga kiritilgan badge'lar |

## Sertifikatlar
| Method | Endpoint | Tavsif |
|---|---|---|
| GET | `/certificates/me` | *(student)* Mening sertifikatlarim |
| GET | `/certificates/verify/{number}` | Ochiq — sertifikatni tekshirish |
| POST | `/certificates/{course_id}/issue` | Tizim ichida (kurs tugaganda avtomatik trigger) |

## AI-yordamchi
| Method | Endpoint | Tavsif |
|---|---|---|
| POST | `/ai/ask` | Mavzu bo'yicha savol berish (Claude API, stream) |
| POST | `/ai/review-code` | Kodni AI orqali tahlil qildirish |
| GET | `/ai/conversations/{lesson_id}` | Suhbat tarixi |

## Admin — statistika va boshqaruv
| Method | Endpoint | Tavsif |
|---|---|---|
| GET | `/admin/analytics/overview` | Umumiy statistika (grafiklar uchun) |
| POST | `/admin/broadcast` | Ommaviy bildirishnoma yuborish |
| GET | `/admin/content` / `PATCH /admin/content` | Sayt statik matnlari |

## Qidiruv (global)
| Method | Endpoint | Tavsif |
|---|---|---|
| GET | `/search?q=&scope=` | Dashboard ichidagi global qidiruv (kurs/o'quvchi/so'rov bo'yicha, `scope` parametri kesim beradi) |
