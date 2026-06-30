import { extractAuthorizedScopes } from "@/lib/auth/access";
import { decodeJwtPayload, extractScopeValues, isJwtExpired } from "@/lib/auth/jwt";
import { getDashBeneficioRoleFromPayload } from "@/lib/auth/roles";
import { type AuthenticatedSession } from "@/types/auth";

export const AUTH_ACCESS_TOKEN_COOKIE = "mag_identidade_hmg_access_token";
export const AUTH_ID_TOKEN_COOKIE = "mag_identidade_id_token";
export const AUTH_STATE_COOKIE = "mag_identidade_oauth_state";
export const AUTH_NONCE_COOKIE = "mag_identidade_oauth_nonce";
export const AUTH_CODE_VERIFIER_COOKIE = "mag_identidade_oauth_code_verifier";
export const AUTH_RETURN_TO_COOKIE = "mag_identidade_return_to";

export function resolveSessionFromAccessToken(accessToken: string): AuthenticatedSession | null {
  const payload = decodeJwtPayload(accessToken);

  if (!payload || isJwtExpired(payload)) {
    return null;
  }

  const email =
    (typeof payload.email === "string" && payload.email) ||
    (typeof payload.preferred_username === "string" && payload.preferred_username) ||
    undefined;
  const nameParts = [payload.given_name, payload.family_name].filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
  const name =
    (typeof payload.name === "string" && payload.name.trim()) ||
    (nameParts.length > 0 ? nameParts.join(" ") : "") ||
    email ||
    (typeof payload.sub === "string" ? payload.sub : "Usuario MAG");
  const scopes = Array.from(new Set([...extractScopeValues(payload), ...extractAuthorizedScopes(payload)]));
  const role = getDashBeneficioRoleFromPayload(payload);

  if (!role) {
    return null;
  }

  return {
    expiresAt: toExpirationDate(payload.exp),
    user: {
      id: typeof payload.sub === "string" ? payload.sub : email ?? name,
      name,
      email,
      scopes,
      role
    }
  };
}

function toExpirationDate(value: unknown) {
  if (typeof value !== "number") return null;
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
