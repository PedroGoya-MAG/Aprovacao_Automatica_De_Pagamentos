import { extractClaimStrings } from "@/lib/auth/jwt";
import { type AuthTokenPayload, type AuthenticatedSession, type PermissionLevel } from "@/types/auth";

type AppHeaderTab = "approvals" | "history" | "monthly" | "treasury";

const TEMP_USER_ROLE_MAP: Record<string, PermissionLevel> = {
  cdaraujo: "ADMIN",
  atang: "ADMIN",
  lqueiroz: "BENEFICIO",
  "esx.pgoya": "BENEFICIO",
  ssimoncelo: "BENEFICIO",
  "esx.lrcorrea": "BENEFICIO",
  kvarges: "BENEFICIO",
  "esx.vsvargas": "BENEFICIO",
  lmmoreira: "BENEFICIO",
  mapereira: "BENEFICIO",
  jcsouza: "BENEFICIO",
  sdsantos: "TESOURARIA",
  bmeira: "TESOURARIA"
};

export function resolveTemporaryPermissionLevel(payload: AuthTokenPayload, scopes: string[]): PermissionLevel | null {
  if (!scopes.includes("dash.beneficio")) {
    return null;
  }

  const candidates = getUserIdentityCandidates(payload);

  for (const candidate of candidates) {
    const permissionLevel = TEMP_USER_ROLE_MAP[candidate];

    if (permissionLevel) {
      return permissionLevel;
    }
  }

  return null;
}

export function extractAuthorizedScopes(payload: AuthTokenPayload) {
  const directScopes = extractClaimStrings(payload, ["OAuth2.ClientAllowedScopes"]);
  return Array.from(new Set(directScopes.map((scope) => scope.trim()).filter(Boolean)));
}

export function getUserIdentityCandidates(payload: AuthTokenPayload) {
  const values = new Set<string>();
  const rawValues = [
    payload.name,
    payload.sub,
    payload.preferred_username,
    payload.email,
    ...(typeof payload.email === "string" && payload.email.includes("@") ? [payload.email.split("@")[0]] : [])
  ];

  rawValues.forEach((value) => {
    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    values.add(normalizeIdentity(value));
  });

  return Array.from(values);
}

export function canAccessTab(permissionLevel: PermissionLevel, tab: AppHeaderTab) {
  if (permissionLevel === "TESOURARIA") {
    return tab === "treasury";
  }

  return true;
}

export function canAccessPath(permissionLevel: PermissionLevel, pathname: string) {
  if (permissionLevel === "TESOURARIA") {
    return pathname.startsWith("/tesouraria") || pathname.startsWith("/api/tesouraria");
  }

  return true;
}

export function canManageApprovals(session: AuthenticatedSession | null) {
  return session?.user.permissionLevel === "ADMIN";
}

export function isReadOnlyApprovalUser(session: AuthenticatedSession | null) {
  return session?.user.permissionLevel === "BENEFICIO";
}

export function getDefaultRouteForPermission(permissionLevel: PermissionLevel) {
  return permissionLevel === "TESOURARIA" ? "/tesouraria" : "/";
}

export function formatPermissionLabel(permissionLevel: PermissionLevel) {
  if (permissionLevel === "ADMIN") {
    return "Administrador";
  }

  if (permissionLevel === "TESOURARIA") {
    return "Tesouraria";
  }

  return "Beneficio";
}

function normalizeIdentity(value: string) {
  return value.trim().toLowerCase();
}
