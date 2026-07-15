import { NextResponse, type NextRequest } from "next/server";

import {
  canAccessFeature,
  canAccessPath,
  DASHBOARD_FEATURES,
  getDashBeneficioRoleFromPayload,
  getDefaultRouteForRole,
  type DashBeneficioRole
} from "@/lib/auth/authorization";
import { isAuthEnabled } from "@/lib/auth/auth-enabled";
import { decodeJwtPayload, isJwtExpired } from "@/lib/auth/jwt";

const AUTH_ACCESS_TOKEN_COOKIE = "mag_identidade_access_token";

function resolveRoleFromAccessToken(accessToken: string): DashBeneficioRole | null {
  const payload = decodeJwtPayload(accessToken);

  if (!payload || isJwtExpired(payload)) {
    return null;
  }

  return getDashBeneficioRoleFromPayload(payload);
}

function isProtectedPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/historico") ||
    pathname.startsWith("/visao-mensal") ||
    pathname.startsWith("/tesouraria") ||
    pathname.startsWith("/api/aprovacoes") ||
    pathname.startsWith("/api/bff") ||
    pathname.startsWith("/api/tesouraria")
  );
}

export function middleware(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(AUTH_ACCESS_TOKEN_COOKIE)?.value;
  const role = accessToken ? resolveRoleFromAccessToken(accessToken) : null;

  if (role) {
    if (!canAccessPath(role, pathname)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ message: "Acesso negado para este perfil." }, { status: 403 });
      }

      return NextResponse.redirect(new URL(getDefaultRouteForRole(role), request.url));
    }

    if (
      (pathname.startsWith("/api/aprovacoes") || pathname.startsWith("/api/bff")) &&
      request.method !== "GET" &&
      !canAccessFeature(role, DASHBOARD_FEATURES.APPROVALS_MANAGE)
    ) {
      return NextResponse.json({ message: "Perfil sem permissao para alterar aprovacoes." }, { status: 403 });
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const loginUrl = new URL("/api/auth/login", request.url);
  loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/",
    "/historico/:path*",
    "/visao-mensal/:path*",
    "/tesouraria/:path*",
    "/api/aprovacoes/:path*",
    "/api/bff/:path*",
    "/api/tesouraria/:path*"
  ]
};
