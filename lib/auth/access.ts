import { extractClaimStrings } from "@/lib/auth/jwt";
import {
  canAccessFeature,
  canAccessPath,
  DASHBOARD_FEATURES,
  DASH_BENEFICIO_ROLES,
  getDefaultRouteForRole,
  type DashboardFeature,
  type DashBeneficioRole
} from "@/lib/auth/authorization";
import { type AuthTokenPayload, type AuthenticatedSession } from "@/types/auth";

export { canAccessPath, getDefaultRouteForRole };

type AppHeaderTab = "approvals" | "history" | "monthly" | "treasury";

const TAB_FEATURES: Record<AppHeaderTab, DashboardFeature> = {
  approvals: DASHBOARD_FEATURES.APPROVALS_VIEW,
  history: DASHBOARD_FEATURES.HISTORY_VIEW,
  monthly: DASHBOARD_FEATURES.MONTHLY_VIEW,
  treasury: DASHBOARD_FEATURES.TREASURY_VIEW
};

export function extractAuthorizedScopes(payload: AuthTokenPayload) {
  const directScopes = extractClaimStrings(payload, ["OAuth2.ClientAllowedScopes"]);
  return Array.from(new Set(directScopes.map((scope) => scope.trim()).filter(Boolean)));
}

export function canAccessTab(role: DashBeneficioRole, tab: AppHeaderTab) {
  return canAccessFeature(role, TAB_FEATURES[tab]);
}

export function canManageApprovals(session: AuthenticatedSession | null) {
  return session ? canAccessFeature(session.user.role, DASHBOARD_FEATURES.APPROVALS_MANAGE) : false;
}

export function isReadOnlyApprovalUser(session: AuthenticatedSession | null) {
  return session?.user.role === DASH_BENEFICIO_ROLES.BENEFICIO;
}

export function formatRoleLabel(role: DashBeneficioRole) {
  if (role === DASH_BENEFICIO_ROLES.ADMIN) {
    return "Administrador";
  }

  if (role === DASH_BENEFICIO_ROLES.TESOURARIA) {
    return "Tesouraria";
  }

  return "Beneficio";
}

