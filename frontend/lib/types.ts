export interface UserPublic {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "author" | "admin";
  avatar_url: string | null;
  is_email_verified: boolean;
  is_blocked: boolean;
  xp_total: number;
  telegram_chat_id: number | null;
  telegram_username: string | null;
  created_at: string;
}

export interface UserListResponse {
  items: UserPublic[];
  total: number;
}

export type CourseTrack = "savodxonlik" | "python" | "cpp";
export type CourseLevel = "boshlangich" | "orta" | "yuqori";
export type CourseStatus = "qoralama" | "kutilmoqda" | "faol" | "arxiv";

export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  track: CourseTrack;
  level: CourseLevel;
  status: CourseStatus;
  cover_image_url: string | null;
  created_at: string;
  authors: { id: string; full_name: string; avatar_url: string | null }[];
}

export interface LessonSummary {
  id: string;
  title: string;
  order_index: number;
  has_video: boolean;
  has_code: boolean;
  resource_count: number;
  is_completed: boolean;
}

export interface ModuleSummary {
  id: string;
  title: string;
  order_index: number;
  lessons: LessonSummary[];
}

export interface CourseDetail extends CourseListItem {
  modules: ModuleSummary[];
}

export type EnrollmentStatus = "kutilmoqda" | "tasdiqlangan" | "rad_etilgan";

export interface EnrollmentDetail {
  id: string;
  status: EnrollmentStatus;
  rejection_reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
    track: CourseTrack;
    cover_image_url: string | null;
  };
  student: { id: string; full_name: string; email: string };
}

export interface EnrollmentWithProgress extends EnrollmentDetail {
  completed_lessons: number;
  total_lessons: number;
}

export interface LessonResource {
  id: string;
  title: string;
  content_type: string;
  size_bytes: number;
}

export interface LessonDetail {
  id: string;
  title: string;
  content_md: string;
  video_url: string | null;
  starter_code: string | null;
  language: "python" | "cpp" | null;
  order_index: number;
  is_completed: boolean;
  resources: LessonResource[];
}

export interface CodeRunResult {
  stdout: string;
  stderr: string;
  status: "success" | "error" | "timeout";
}

export interface QuizQuestionPublic {
  id: string;
  question_text: string;
  options: string[];
}

export interface QuizPublic {
  id: string;
  title: string;
  questions: QuizQuestionPublic[];
}

export interface QuizAttemptResult {
  score: number;
  total: number;
  xp_awarded: number;
  correct_question_ids: string[];
}

export interface XpLogEntry {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface BadgePublic {
  id: string;
  title: string;
  description: string;
  icon_key: string;
  earned_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  xp_total: number;
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface ReviewCodeResponse {
  explanation: string;
}

export interface QuizQuestionAuthorView {
  id: string;
  question_text: string;
  options: string[];
  correct_option: number;
  ai_generated: boolean;
}

export interface CertificateDetail {
  id: string;
  certificate_number: string;
  issued_at: string;
  course: { id: string; title: string; slug: string };
}

export interface CertificateVerifyResponse {
  certificate_number: string;
  student_name: string;
  course_title: string;
  issued_at: string;
}

export interface PublicStats {
  active_courses: number;
  students_count: number;
  certificates_count: number;
  mentors_count: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface AnalyticsOverview {
  total_students: number;
  total_authors: number;
  total_admins: number;
  total_courses: number;
  active_courses: number;
  total_enrollments: number;
  pending_enrollments: number;
  signups_last_30_days: DailyCount[];
  activity_last_7_days: DailyCount[];
  completion_rate: number;
}

export interface BroadcastHistoryItem {
  id: string;
  title: string;
  message: string;
  target: string;
  sent_count: number;
  created_at: string;
}

export interface QaUserBrief {
  id: string;
  full_name: string;
  role: string;
}

export interface QaAnswerDetail {
  id: string;
  answer_text: string;
  is_hidden: boolean;
  created_at: string;
  user: QaUserBrief;
}

export interface QaQuestionDetail {
  id: string;
  question_text: string;
  created_at: string;
  student: QaUserBrief;
  answers: QaAnswerDetail[];
}

export interface NotificationDetail {
  id: string;
  type: string;
  payload: { message?: string; title?: string; url?: string; [key: string]: unknown };
  is_read: boolean;
  created_at: string;
}

export interface SiteContentItem {
  key: string;
  content: string;
  updated_at: string;
}

export interface AdminCertificateDetail {
  id: string;
  certificate_number: string;
  issued_at: string;
  student: { id: string; full_name: string; email: string };
  course: { id: string; title: string };
}

export interface AdminQuizListItem {
  id: string;
  title: string;
  course_title: string;
  lesson_title: string;
  question_count: number;
}

export interface AdminQuizQuestionDetail {
  id: string;
  question_text: string;
  options: string[];
  correct_option: number;
  ai_generated: boolean;
}

export interface AdminQuizDetail {
  id: string;
  title: string;
  course_title: string;
  lesson_title: string;
  questions: AdminQuizQuestionDetail[];
}

export interface StudentRosterItem {
  student_id: string;
  full_name: string;
  email: string;
  completed_lessons: number;
  total_lessons: number;
  completion_pct: number;
  xp_total: number;
  last_activity: string | null;
}

export interface CourseStatsResponse {
  total_students: number;
  completion_rate: number;
  average_quiz_score: number;
  activity_last_7_days: DailyCount[];
}

export interface AuthorOverview {
  total_courses: number;
  active_courses: number;
  pending_enrollments: number;
  total_students: number;
  activity_last_7_days: DailyCount[];
}

export const TRACK_LABELS: Record<CourseTrack, string> = {
  savodxonlik: "Kompyuter savodxonligi",
  python: "Python",
  cpp: "C++",
};

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  boshlangich: "Boshlang'ich",
  orta: "O'rta",
  yuqori: "Yuqori",
};
