# Ma'lumotlar bazasi tuzilishi (PostgreSQL)

> Bu yerda asosiy jadvallar va bog'lanishlar keltirilgan. Aniq ustun tiplari Alembic migratsiyasi yozilayotganda SQLAlchemy modellarida belgilanadi.

## users
| Ustun | Tip | Izoh |
|---|---|---|
| id | UUID (PK) | |
| full_name | varchar | |
| email | varchar, unique | |
| password_hash | varchar | |
| role | enum(`student`,`author`,`admin`) | |
| avatar_url | varchar, null | MinIO'dagi fayl |
| telegram_chat_id | bigint, null, unique | Bot orqali bog'langanda to'ldiriladi |
| telegram_username | varchar, null | |
| is_email_verified | bool | |
| xp_total | integer, default 0 | |
| created_at / updated_at | timestamp | |

## courses
| Ustun | Tip | Izoh |
|---|---|---|
| id | UUID (PK) | |
| author_id | UUID (FK → users.id) | Asosiy muallif |
| title | varchar | |
| slug | varchar, unique | |
| description | text | |
| track | enum(`savodxonlik`,`python`,`cpp`) | |
| level | enum(`boshlangich`,`orta`,`yuqori`) | |
| status | enum(`qoralama`,`kutilmoqda`,`faol`,`arxiv`) | |
| cover_image_url | varchar, null | |
| created_at / updated_at | timestamp | |

## course_authors (ko'p muallifli kurslar uchun, many-to-many)
| Ustun | Tip |
|---|---|
| course_id | UUID (FK) |
| user_id | UUID (FK, role=author) |

## modules
| Ustun | Tip | Izoh |
|---|---|---|
| id | UUID (PK) | |
| course_id | UUID (FK) | |
| title | varchar | |
| order_index | integer | |

## lessons
| Ustun | Tip | Izoh |
|---|---|---|
| id | UUID (PK) | |
| module_id | UUID (FK) | |
| title | varchar | |
| content_md | text | Matn/video havolasi (markdown) |
| starter_code | text, null | Kod-mashq uchun boshlang'ich shablon |
| language | enum(`python`,`cpp`), null | Piston uchun |
| order_index | integer | |

## enrollments (so'rovlar)
| Ustun | Tip | Izoh |
|---|---|---|
| id | UUID (PK) | |
| student_id | UUID (FK → users.id) | |
| course_id | UUID (FK → courses.id) | |
| status | enum(`kutilmoqda`,`tasdiqlangan`,`rad_etilgan`) | |
| reviewed_by | UUID (FK → users.id), null | Tasdiqlagan/rad etgan author/admin |
| rejection_reason | text, null | |
| requested_at / reviewed_at | timestamp | |

## code_submissions
| Ustun | Tip | Izoh |
|---|---|---|
| id | UUID (PK) | |
| student_id | UUID (FK) | |
| lesson_id | UUID (FK) | |
| code | text | |
| stdout / stderr | text | Piston natijasi |
| status | enum(`success`,`error`,`timeout`) | |
| xp_awarded | integer, default 0 | |
| created_at | timestamp | |

## quizzes / quiz_questions / quiz_attempts
- `quizzes`: id, lesson_id (FK), title
- `quiz_questions`: id, quiz_id (FK), question_text, options (JSONB), correct_option, ai_generated (bool)
- `quiz_attempts`: id, student_id (FK), quiz_id (FK), score, answers (JSONB), completed_at

## qa_questions / qa_answers
- `qa_questions`: id, lesson_id (FK), student_id (FK), question_text, created_at
- `qa_answers`: id, question_id (FK), user_id (FK), answer_text, created_at

## badges / user_badges
- `badges`: id, title, description, icon_key (Lucide ikon nomi)
- `user_badges`: user_id (FK), badge_id (FK), earned_at

## xp_logs
| Ustun | Tip | Izoh |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK) | |
| amount | integer | |
| reason | varchar | masalan `quiz_tugatildi`, `kod_ishga_tushdi` |
| created_at | timestamp | |

## certificates
| Ustun | Tip | Izoh |
|---|---|---|
| id | UUID (PK) | |
| student_id | UUID (FK) | |
| course_id | UUID (FK) | |
| certificate_number | varchar, unique | masalan `EDT-2026-0483` |
| pdf_url | varchar | MinIO'dagi fayl |
| issued_at | timestamp | |

## ai_conversations
| Ustun | Tip | Izoh |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK) | |
| lesson_id | UUID (FK), null | |
| messages | JSONB | Claude API bilan almashilgan xabarlar tarixi |
| created_at | timestamp | |

## notifications
| Ustun | Tip | Izoh |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK) | |
| type | varchar | masalan `sorov_tasdiqlandi`, `sertifikat_tayyor` |
| payload | JSONB | |
| is_read | bool, default false | |
| created_at | timestamp | |

## Bog'lanishlar xulosasi
```
users 1—* courses (author_id)
courses *—* users (course_authors, multi-author)
courses 1—* modules 1—* lessons
users 1—* enrollments *—1 courses
users 1—* code_submissions *—1 lessons
lessons 1—* quizzes 1—* quiz_questions
users 1—* quiz_attempts *—1 quizzes
lessons 1—* qa_questions 1—* qa_answers
users *—* badges (user_badges)
users 1—* xp_logs
users 1—* certificates *—1 courses
users 1—* ai_conversations
users 1—* notifications
```
