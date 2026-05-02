import { NextResponse, type NextRequest } from "next/server";

import { isAuthEnabled } from "@/lib/auth/config";
import { AUTH_ACCESS_TOKEN_COOKIE, resolveSessionFromAccessToken } from "@/lib/auth/token-session";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/historico") ||
    pathname.startsWith("/visao-mensal") ||
    pathname.startsWith("/tesouraria") ||
    pathname.startsWith("/api/aprovacoes")
  );
}

export function middleware(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.next();
  }

  const { pathname, search, searchParams } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname === "/" && (searchParams.has("code") || searchParams.has("error"))) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(AUTH_ACCESS_TOKEN_COOKIE)?.value;
  const session = accessToken ? resolveSessionFromAccessToken(accessToken) : null;

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/aprovacoes")) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const loginUrl = new URL("/api/auth/login", request.url);
  loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/", "/historico/:path*", "/visao-mensal/:path*", "/tesouraria/:path*", "/api/aprovacoes/:path*"]
};
