# Sahifalar va route'lar (Next.js App Router)

> Ruxsat ustuni: **Public** (hammaga ochiq), **Student**, **Author**, **Admin**.

## Ommaviy qism
| Sahifa | Route | Ruxsat |
|---|---|---|
| Bosh sahifa | `/` | Public |
| Kurslar katalogi | `/courses` | Public |
| Kurs detali | `/courses/[slug]` | Public (kontent — faqat tasdiqlangan studentga) |
| Biz haqimizda | `/about` | Public |
| Aloqa | `/contact` | Public |
| Sertifikatni tekshirish | `/certificates/verify/[number]` | Public |

## Autentifikatsiya
| Sahifa | Route |
|---|---|
| Kirish | `/auth/login` |
| Ro'yxatdan o'tish | `/auth/register` |
| Email tasdiqlash | `/auth/verify` |
| Parolni tiklash | `/auth/forgot-password` |
| Yangi parol | `/auth/reset-password` |
| Telegram ulash | `/auth/telegram-link` |

## Student qismi
| Sahifa | Route |
|---|---|
| Student dashboard (bosh) | `/dashboard/student` |
| Mening kurslarim | `/dashboard/student/courses` |
| Dars sahifasi (video+terminal+quiz) | `/dashboard/student/courses/[slug]/lessons/[lessonId]` |
| Mening arizalarim | `/dashboard/student/enrollments` |
| Reyting jadvali | `/dashboard/student/leaderboard` |
| Sertifikatlarim | `/dashboard/student/certificates` |
| Profil sozlamalari | `/dashboard/student/settings` |

## Author dashboard
| Sahifa | Route |
|---|---|
| Author dashboard (bosh) | `/dashboard/author` |
| Mening kurslarim | `/dashboard/author/courses` |
| Kurs yaratish/tahrirlash | `/dashboard/author/courses/[courseId]/edit` |
| Curriculum builder (modul/mavzu) | `/dashboard/author/courses/[courseId]/curriculum` |
| O'quvchilar | `/dashboard/author/students` |
| So'rovlar | `/dashboard/author/enrollments` |
| Profil sozlamalari | `/dashboard/author/settings` |

## Admin panel
| Sahifa | Route |
|---|---|
| Admin dashboard (bosh) | `/dashboard/admin` |
| Foydalanuvchilar boshqaruvi | `/dashboard/admin/users` |
| Kurslarni boshqarish | `/dashboard/admin/courses` |
| So'rovlar (global) | `/dashboard/admin/enrollments` |
| Sertifikatlar | `/dashboard/admin/certificates` |
| Quiz/test banki | `/dashboard/admin/quizzes` |
| Q&A moderatsiya | `/dashboard/admin/qa` |
| Bildirishnoma yuborish | `/dashboard/admin/broadcast` |
| Sayt kontenti | `/dashboard/admin/content` |
| Rol/huquqlar sozlamalari | `/dashboard/admin/roles` |
| Tizim statistikasi | `/dashboard/admin/analytics` |

## Umumiy komponentlar (barcha dashboardlarda)
- Ochiladigan-yopiladigan **sidebar** (icon-only collapse holati bilan).
- **Topbar**: global qidiruv (Cmd/Ctrl+K), bildirishnomalar, profil dropdown (avatar, tungi/kunduzgi rejim, sozlamalar, chiqish).
- 404 va xato sahifalari (`/not-found`, `/error`).
