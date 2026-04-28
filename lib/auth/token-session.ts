import { decodeJwtPayload, isJwtExpired } from "@/lib/auth/jwt";
import { type AuthenticatedSession } from "@/types/auth";

export const AUTH_ACCESS_TOKEN_COOKIE = "mag_identidade_access_token";
export const AUTH_STATE_COOKIE = "mag_identidade_oauth_state";
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

  return {
    accessToken,
    tokenType: "Bearer",
    expiresAt: typeof payload.exp === "number" ? new Date(payload.exp * 1000).toISOString() : null,
    user: {
      id: typeof payload.sub === "string" ? payload.sub : email ?? name,
      name,
      email,
      claims: payload
    }
  };
}
