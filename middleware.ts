import { NextResponse, type NextRequest } from "next/server";

const AUTH_ACCESS_TOKEN_COOKIE = "mag_identidade_access_token";
const DASH_BENEFICIO_CLAIM = "DashBeneficio";

const DASH_BENEFICIO_ROLES = {
  ADMIN: "ADMIN",
  BENEFICIO: "BENEFICIO",
  TESOURARIA: "TESOURARIA"
} as const;

const DASHBOARD_FEATURES = {
  APPROVALS_VIEW: "approvals.view",
  APPROVALS_MANAGE: "approvals.manage",
  HISTORY_VIEW: "history.view",
  MONTHLY_VIEW: "monthly.view",
  TREASURY_VIEW: "treasury.view"
} as const;

type AuthTokenPayload = Record<string, unknown> & {
  exp?: number;
};
type DashBeneficioRole = (typeof DASH_BENEFICIO_ROLES)[keyof typeof DASH_BENEFICIO_ROLES];
type DashboardFeature = (typeof DASHBOARD_FEATURES)[keyof typeof DASHBOARD_FEATURES];

const CLAIM_ROLE_MAP: Record<string, DashBeneficioRole> = {
  Admin: DASH_BENEFICIO_ROLES.ADMIN,
  Beneficio: DASH_BENEFICIO_ROLES.BENEFICIO,
  Tesouraria: DASH_BENEFICIO_ROLES.TESOURARIA
};

const ROLE_FEATURES: Record<DashBeneficioRole, ReadonlySet<DashboardFeature>> = {
  ADMIN: new Set(Object.values(DASHBOARD_FEATURES)),
  BENEFICIO: new Set([
    DASHBOARD_FEATURES.APPROVALS_VIEW,
    DASHBOARD_FEATURES.HISTORY_VIEW,
    DASHBOARD_FEATURES.MONTHLY_VIEW,
    DASHBOARD_FEATURES.TREASURY_VIEW
  ]),
  TESOURARIA: new Set([DASHBOARD_FEATURES.TREASURY_VIEW])
};

function readEnv(key: string) {
  return process.env[key]?.trim() || "";
}

function isAuthEnabled() {
  const explicit = readEnv("AUTH_ENABLED");

  if (explicit) {
    return explicit === "true";
  }

  return Boolean(
    readEnv("AUTH_IDENTIDADE_AUTHORIZE_URL") &&
      readEnv("AUTH_IDENTIDADE_TOKEN_URL") &&
      readEnv("AUTH_IDENTIDADE_CLIENT_ID") &&
      readEnv("AUTH_IDENTIDADE_CLIENT_SECRET")
  );
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeJwtPayload(token: string): AuthTokenPayload | null {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as AuthTokenPayload;
  } catch {
    return null;
  }
}

function isJwtExpired(payload: AuthTokenPayload) {
  if (typeof payload.exp !== "number") {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}

function getDashBeneficioRoleFromPayload(payload: AuthTokenPayload): DashBeneficioRole | null {
  const claim = payload[DASH_BENEFICIO_CLAIM];

  if (typeof claim !== "string" || !claim.trim()) {
    return null;
  }

  return CLAIM_ROLE_MAP[claim.trim()] ?? null;
}

function resolveRoleFromAccessToken(accessToken: string): DashBeneficioRole | null {
  const payload = decodeJwtPayload(accessToken);

  if (!payload || isJwtExpired(payload)) {
    return null;
  }

  return getDashBeneficioRoleFromPayload(payload);
}

function canAccessFeature(role: DashBeneficioRole, feature: DashboardFeature) {
  return ROLE_FEATURES[role].has(feature);
}

function getFeatureForPath(pathname: string): DashboardFeature | null {
  if (pathname.startsWith("/tesouraria") || pathname.startsWith("/api/tesouraria")) {
    return DASHBOARD_FEATURES.TREASURY_VIEW;
  }

  if (pathname.startsWith("/historico") || pathname.startsWith("/api/bff/history")) {
    return DASHBOARD_FEATURES.HISTORY_VIEW;
  }

  if (pathname.startsWith("/visao-mensal") || pathname.startsWith("/api/bff/monthly")) {
    return DASHBOARD_FEATURES.MONTHLY_VIEW;
  }

  if (pathname === "/" || pathname.startsWith("/api/aprovacoes") || pathname.startsWith("/api/bff")) {
    return DASHBOARD_FEATURES.APPROVALS_VIEW;
  }

  return null;
}

function canAccessPath(role: DashBeneficioRole, pathname: string) {
  const feature = getFeatureForPath(pathname);

  return feature ? canAccessFeature(role, feature) : true;
}

function getDefaultRouteForRole(role: DashBeneficioRole) {
  return role === DASH_BENEFICIO_ROLES.TESOURARIA ? "/tesouraria" : "/";
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
