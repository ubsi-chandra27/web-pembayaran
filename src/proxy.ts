import { NextResponse, type NextRequest } from "next/server";

const sessionUserCookie = "azkia_user_id";
const sessionRoleCookie = "azkia_role";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = request.cookies.get(sessionUserCookie)?.value;
  const role = request.cookies.get(sessionRoleCookie)?.value;

  if (pathname.startsWith("/admin")) {
    if (!userId || role === "ORANG_TUA") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/tagihan") ||
    pathname.startsWith("/pembayaran") ||
    pathname.startsWith("/tabungan") ||
    pathname.startsWith("/riwayat")
  ) {
    if (!userId || role !== "ORANG_TUA") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname === "/login" && userId) {
    return NextResponse.redirect(
      new URL(role === "ORANG_TUA" ? "/dashboard" : "/admin/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard",
    "/tagihan/:path*",
    "/pembayaran/:path*",
    "/tabungan/:path*",
    "/riwayat/:path*",
    "/login",
  ],
};
