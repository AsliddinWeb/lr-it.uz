const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

const NETWORK_ERROR_MESSAGE =
  "Server bilan aloqa yo'q. Internet ulanishini tekshirib, qayta urinib ko'ring.";

export class ApiError extends Error {
  status: number;
  /** Backend bergan mashina o'qiydigan kod (masalan "email_not_verified"); yo'q bo'lishi mumkin. */
  code?: string;
  /** Kodga qo'shimcha ma'lumotlar (masalan `retry_after`, `email`). */
  extra: Record<string, unknown>;

  constructor(status: number, message: string, code?: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

// FastAPI (Pydantic) validatsiya xatolaridagi maydon nomlari — foydalanuvchiga tushunarli ko'rinishda.
const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  password: "Parol",
  new_password: "Yangi parol",
  full_name: "Ism-familiya",
  title: "Sarlavha",
  description: "Tavsif",
  message: "Xabar matni",
  content: "Matn",
  content_md: "Mavzu matni",
  body: "Matn",
  code: "Kod",
  reason: "Sabab",
  rejection_reason: "Sabab",
  video_url: "Video havolasi",
  question: "Savol",
};

type ValidationIssue = { type?: string; loc?: (string | number)[]; msg?: string; ctx?: Record<string, unknown> };

function describeValidationIssue(issue: ValidationIssue): string {
  const field = String(issue.loc?.[issue.loc.length - 1] ?? "");
  const label = FIELD_LABELS[field] ?? "Maydon";
  switch (issue.type) {
    case "missing":
      return `${label} maydonini to'ldiring.`;
    case "string_too_short":
      return `${label} kamida ${issue.ctx?.min_length} belgidan iborat bo'lishi kerak.`;
    case "string_too_long":
      return `${label} ${issue.ctx?.max_length} belgidan oshmasligi kerak.`;
    case "value_error":
      return field === "email" ? "Email manzil noto'g'ri kiritilgan." : `${label} noto'g'ri kiritilgan.`;
    case "url_parsing":
    case "url_scheme":
      return `${label} to'g'ri havola bo'lishi kerak.`;
    default:
      return `${label} noto'g'ri kiritilgan.`;
  }
}

function messageFromStatus(status: number): string {
  if (status === 401) return "Sessiya muddati tugagan. Qaytadan tizimga kiring.";
  if (status === 403) return "Bu amalni bajarish uchun huquqingiz yo'q.";
  if (status === 404) return "So'ralgan ma'lumot topilmadi. U o'chirilgan bo'lishi mumkin.";
  if (status === 413) return "Fayl hajmi juda katta. Kichikroq fayl tanlang.";
  if (status === 429) return "Juda ko'p urinish bo'ldi. Birozdan so'ng qayta urinib ko'ring.";
  if (status >= 500) return "Server so'rovni bajara olmadi. Birozdan so'ng qayta urinib ko'ring.";
  return "So'rov bajarilmadi. Kiritilgan ma'lumotlarni tekshirib, qayta urinib ko'ring.";
}

function extractError(status: number, data: unknown): ApiError {
  const detail = (data as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string" && detail.trim()) return new ApiError(status, detail);
  if (Array.isArray(detail) && detail.length > 0) {
    return new ApiError(status, describeValidationIssue(detail[0]));
  }
  if (detail && typeof detail === "object") {
    const { code, message, ...extra } = detail as Record<string, unknown>;
    return new ApiError(
      status,
      typeof message === "string" && message ? message : messageFromStatus(status),
      typeof code === "string" ? code : undefined,
      extra
    );
  }
  return new ApiError(status, messageFromStatus(status));
}

/** Har qanday xatodan foydalanuvchiga ko'rsatiladigan aniq xabar. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return NETWORK_ERROR_MESSAGE;
}

// Bu yo'llarda 401 — sessiya muddati emas, noto'g'ri ma'lumot degani; ularda refresh qilinmaydi.
const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/verify-email",
  "/auth/resend-code",
  "/auth/google",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// Bir vaqtda kelgan bir nechta 401 javobi uchun sessiya faqat bir marta yangilanadi.
let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshPromise ??= fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const send = async () => {
    try {
      return await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: "include",
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...options.headers,
        },
      });
    } catch {
      throw new ApiError(0, NETWORK_ERROR_MESSAGE);
    }
  };

  let res = await send();

  // Access token muddati tugagan bo'lsa — refresh token orqali yangilab, so'rovni bir marta qaytaramiz.
  if (
    res.status === 401 &&
    !NO_REFRESH_PATHS.some((p) => path.startsWith(p)) &&
    (await refreshSession())
  ) {
    res = await send();
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw extractError(res.status, data);
  }

  return data as T;
}
