import { type AuthTokenPayload } from "@/types/auth";

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

<<<<<<< HEAD
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
=======
  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  return Buffer.from(padded, "base64").toString("utf-8");
>>>>>>> prd/staging
}

export function decodeJwtPayload(token: string): AuthTokenPayload | null {
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

export function isJwtExpired(payload: AuthTokenPayload) {
  if (typeof payload.exp !== "number") {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}

export function extractClaimStrings(payload: AuthTokenPayload, keys: string[]) {
  const values = new Set<string>();

  keys.forEach((key) => {
    const value = payload[key];

    if (typeof value === "string") {
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => values.add(item));
    }

    if (Array.isArray(value)) {
      value
        .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => values.add(item));
    }
  });

  return Array.from(values);
}

export function extractScopeValues(payload: AuthTokenPayload) {
  const scope = payload.scope ?? payload.scp;

  if (typeof scope === "string") {
    return scope
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(scope)) {
    return scope
      .flatMap((item) => (typeof item === "string" ? item.split(/[\s,]+/) : []))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}
