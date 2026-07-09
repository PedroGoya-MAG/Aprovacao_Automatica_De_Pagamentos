import { type AuthTokenPayload } from "@/types/auth";

export const DASH_BENEFICIO_CLAIM = "DashBeneficio";

export const DASH_BENEFICIO_ROLES = {
  ADMIN: "ADMIN",
  BENEFICIO: "BENEFICIO",
  TESOURARIA: "TESOURARIA"
} as const;

export type DashBeneficioRole = (typeof DASH_BENEFICIO_ROLES)[keyof typeof DASH_BENEFICIO_ROLES];

export const DASHBOARD_FEATURES = {
  APPROVALS_VIEW: "approvals.view",
  APPROVALS_MANAGE: "approvals.manage",
  HISTORY_VIEW: "history.view",
  MONTHLY_VIEW: "monthly.view",
  TREASURY_VIEW: "treasury.view"
} as const;

export type DashboardFeature = (typeof DASHBOARD_FEATURES)[keyof typeof DASHBOARD_FEATURES];

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

export function isValidDashBeneficioRole(role: unknown): role is DashBeneficioRole {
  return typeof role === "string" && Object.values(DASH_BENEFICIO_ROLES).includes(role as DashBeneficioRole);
}

export function getDashBeneficioRoleFromPayload(payload: AuthTokenPayload): DashBeneficioRole | null {
  const claim = payload[DASH_BENEFICIO_CLAIM];

  if (typeof claim !== "string" || !claim.trim()) {
    return null;
  }

  return CLAIM_ROLE_MAP[claim.trim()] ?? null;
}

export function canAccessFeature(role: DashBeneficioRole, feature: DashboardFeature) {
  return ROLE_FEATURES[role].has(feature);
}

export function getFeatureForPath(pathname: string): DashboardFeature | null {
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

export function canAccessPath(role: DashBeneficioRole, pathname: string) {
  const feature = getFeatureForPath(pathname);

  return feature ? canAccessFeature(role, feature) : true;
}

export function getDefaultRouteForRole(role: DashBeneficioRole) {
  return role === DASH_BENEFICIO_ROLES.TESOURARIA ? "/tesouraria" : "/";
}
