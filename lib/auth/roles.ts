import {
  canAccessFeature,
  DASHBOARD_FEATURES,
  DASH_BENEFICIO_CLAIM,
  DASH_BENEFICIO_ROLES,
  getDashBeneficioRoleFromPayload,
  isValidDashBeneficioRole,
  type DashboardFeature,
  type DashBeneficioRole
} from "@/lib/auth/authorization";
import { decodeJwtPayload } from "@/lib/auth/jwt";

export {
  canAccessFeature,
  DASHBOARD_FEATURES,
  DASH_BENEFICIO_CLAIM,
  DASH_BENEFICIO_ROLES,
  getDashBeneficioRoleFromPayload,
  isValidDashBeneficioRole,
  type DashboardFeature,
  type DashBeneficioRole
};

export function getDashBeneficioRoleFromToken(token: string): DashBeneficioRole | null {
  const payload = decodeJwtPayload(token);
  return payload ? getDashBeneficioRoleFromPayload(payload) : null;
}

