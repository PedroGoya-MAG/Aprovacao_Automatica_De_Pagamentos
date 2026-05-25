function readEnv(key: string) {
  return process.env[key]?.trim() || "";
}

export function getAppBaseUrl() {
  const value = readEnv("AUTH_APP_BASE_URL") || readEnv("NEXT_PUBLIC_APP_URL");

  if (!value) {
    throw new Error(
      "Variavel de ambiente obrigatoria nao configurada: AUTH_APP_BASE_URL ou NEXT_PUBLIC_APP_URL."
    );
  }

  return value.replace(/\/$/, "");
}

export function isAuthEnabled() {
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

export function getAuthAuthorizeUrl() {
  return readEnv("AUTH_IDENTIDADE_AUTHORIZE_URL");
}

export function getAuthTokenUrl() {
  return readEnv("AUTH_IDENTIDADE_TOKEN_URL");
}

export function getAuthClientId() {
  return readEnv("AUTH_IDENTIDADE_CLIENT_ID");
}

export function getAuthClientSecret() {
  return readEnv("AUTH_IDENTIDADE_CLIENT_SECRET");
}

export function getAuthScope() {
  return readEnv("AUTH_IDENTIDADE_SCOPE") || "dash.beneficio";
}

export function getAuthRedirectUri() {
  return readEnv("AUTH_IDENTIDADE_REDIRECT_URI") || `${getAppBaseUrl()}/`;
}

export function getAuthCookieSecure() {
  const explicit = readEnv("AUTH_COOKIE_SECURE");

  if (explicit) {
    return explicit === "true";
  }

  return getAppBaseUrl().startsWith("https://");
}
