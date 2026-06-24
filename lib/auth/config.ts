function readEnv(key: string) {
  return process.env[key]?.trim() || "";
}

export function getAppBaseUrl() {
  const value = readEnv("AUTH_APP_BASE_URL") || readEnv("AUTH_URL") || readEnv("NEXT_PUBLIC_APP_URL");

  if (!value) {
    throw new Error(
      "Variavel de ambiente obrigatoria nao configurada: AUTH_APP_BASE_URL, AUTH_URL ou NEXT_PUBLIC_APP_URL."
    );
  }

  const url = new URL(value);

  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("AUTH_APP_BASE_URL deve conter apenas a origem canonica da aplicacao.");
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("AUTH_APP_BASE_URL deve usar HTTPS em producao.");
  }

  return url.origin;
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

export function getAuthLogoutUrl() {
  return readEnv("AUTH_IDENTIDADE_LOGOUT_URL");
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
  const expected = `${getAppBaseUrl()}/api/auth/callback`;
  const configured = readEnv("AUTH_IDENTIDADE_REDIRECT_URI") || expected;

  if (configured !== expected) {
    throw new Error(`AUTH_IDENTIDADE_REDIRECT_URI deve ser exatamente ${expected}.`);
  }

  return configured;
}

export function getAuthCookieSecure() {
  if (process.env.NODE_ENV === "production") {
    return true;
  }

  const explicit = readEnv("AUTH_COOKIE_SECURE");

  if (explicit) {
    return explicit === "true";
  }

  const appUrl = readEnv("AUTH_APP_BASE_URL") || readEnv("AUTH_URL") || readEnv("NEXT_PUBLIC_APP_URL");
  return appUrl.startsWith("https://");
}

export function getAuthCookieDomain() {
  return readEnv("AUTH_COOKIE_DOMAIN") || undefined;
}

export function isAuthPkceEnabled() {
  const explicit = readEnv("AUTH_IDENTIDADE_PKCE_ENABLED");
  return explicit ? explicit === "true" : true;
}

export function isOidcEnabled() {
  return getAuthScope().split(/\s+/).includes("openid");
}

export function shouldForceAuthPrompt() {
  return readEnv("AUTH_IDENTIDADE_FORCE_LOGIN") === "true";
}
