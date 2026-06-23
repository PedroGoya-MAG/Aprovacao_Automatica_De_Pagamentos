import { decodeJwtPayload } from "@/lib/auth/jwt";
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

export function getDashBeneficioRoleFromToken(token: string): DashBeneficioRole | null {
  const payload = decodeJwtPayload(token);
  return payload ? getDashBeneficioRoleFromPayload(payload) : null;
}

export function canAccessFeature(role: DashBeneficioRole, feature: DashboardFeature) {
  return ROLE_FEATURES[role].has(feature);
}
