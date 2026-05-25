import { NextResponse, type NextRequest } from "next/server";

import { canAccessPath, getDefaultRouteForPermission } from "@/lib/auth/access";
import { isAuthEnabled } from "@/lib/auth/config";
import { AUTH_ACCESS_TOKEN_COOKIE, resolveSessionFromAccessToken } from "@/lib/auth/token-session";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/historico") ||
    pathname.startsWith("/visao-mensal") ||
    pathname.startsWith("/tesouraria") ||
    pathname.startsWith("/api/aprovacoes") ||
    pathname.startsWith("/api/historico") ||
    pathname.startsWith("/api/visao-mensal")
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
    if (!canAccessPath(session.user.permissionLevel, pathname)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ message: "Acesso negado para este perfil." }, { status: 403 });
      }

      return NextResponse.redirect(new URL(getDefaultRouteForPermission(session.user.permissionLevel), request.url));
    }

    if (pathname.startsWith("/api/aprovacoes") && request.method !== "GET" && session.user.permissionLevel !== "ADMIN") {
      return NextResponse.json({ message: "Perfil sem permissao para alterar aprovacoes." }, { status: 403 });
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/aprovacoes") || pathname.startsWith("/api/historico") || pathname.startsWith("/api/visao-mensal")) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const loginUrl = new URL("/api/auth/login", request.url);
  loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/", "/historico/:path*", "/visao-mensal/:path*", "/tesouraria/:path*", "/api/aprovacoes/:path*", "/api/historico/:path*", "/api/visao-mensal/:path*"]
};
