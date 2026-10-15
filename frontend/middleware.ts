import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ROLE_PREFIX: Record<string, string> = {
  student: "/dashboard/student",
  author: "/dashboard/author",
  admin: "/dashboard/admin",
};

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "change-me");

async function roleFromToken(
  token: string | undefined,
  type: "access" | "refresh"
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.type === type ? (payload.role as string) : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Access token (30 daqiqa) tugagan bo'lsa ham refresh token amal qilayotgan bo'lsa, sahifa ochiladi:
  // birinchi API so'rovi 401 olib, apiFetch sessiyani avtomatik yangilaydi. Bu yerda faqat
  // yo'naltirish uchun rol kerak — haqiqiy huquq tekshiruvi backend'da.
  const role =
    (await roleFromToken(request.cookies.get("access_token")?.value, "access")) ??
    (await roleFromToken(request.cookies.get("refresh_token")?.value, "refresh"));

  if (!role) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const allowedPrefix = ROLE_PREFIX[role];
  if (!allowedPrefix || !pathname.startsWith(allowedPrefix)) {
    return NextResponse.redirect(new URL(allowedPrefix ?? "/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
