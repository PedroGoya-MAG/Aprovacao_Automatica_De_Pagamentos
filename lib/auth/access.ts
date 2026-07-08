import { extractClaimStrings } from "@/lib/auth/jwt";
import {
  canAccessFeature,
  DASHBOARD_FEATURES,
  DASH_BENEFICIO_ROLES,
  type DashboardFeature,
  type DashBeneficioRole
} from "@/lib/auth/roles";
import { type AuthTokenPayload, type AuthenticatedSession } from "@/types/auth";

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

export function canAccessPath(role: DashBeneficioRole, pathname: string) {
  const feature = getFeatureForPath(pathname);

  return feature ? canAccessFeature(role, feature) : true;
}

export function canManageApprovals(session: AuthenticatedSession | null) {
  return session ? canAccessFeature(session.user.role, DASHBOARD_FEATURES.APPROVALS_MANAGE) : false;
}

export function isReadOnlyApprovalUser(session: AuthenticatedSession | null) {
  return session?.user.role === DASH_BENEFICIO_ROLES.BENEFICIO;
}

export function getDefaultRouteForRole(role: DashBeneficioRole) {
  return role === DASH_BENEFICIO_ROLES.TESOURARIA ? "/tesouraria" : "/";
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

function getFeatureForPath(pathname: string): DashboardFeature | null {
  if (pathname.startsWith("/tesouraria") || pathname.startsWith("/api/tesouraria")) {
    return DASHBOARD_FEATURES.TREASURY_VIEW;
  }

  if (pathname.startsWith("/historico") || pathname.startsWith("/api/historico")) {
    return DASHBOARD_FEATURES.HISTORY_VIEW;
  }

  if (pathname.startsWith("/visao-mensal") || pathname.startsWith("/api/visao-mensal")) {
    return DASHBOARD_FEATURES.MONTHLY_VIEW;
  }

  if (pathname === "/" || pathname.startsWith("/api/aprovacoes")) {
    return DASHBOARD_FEATURES.APPROVALS_VIEW;
  }

  return null;
}
