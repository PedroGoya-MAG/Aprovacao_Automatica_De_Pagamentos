export function readAuthEnv(key: string) {
  return process.env[key]?.trim() || "";
}

export function isAuthEnabled() {
  const explicit = readAuthEnv("AUTH_ENABLED");

  if (explicit) {
    return explicit === "true";
  }

  return Boolean(
    readAuthEnv("AUTH_IDENTIDADE_AUTHORIZE_URL") &&
      readAuthEnv("AUTH_IDENTIDADE_TOKEN_URL") &&
      readAuthEnv("AUTH_IDENTIDADE_CLIENT_ID") &&
      readAuthEnv("AUTH_IDENTIDADE_CLIENT_SECRET")
  );
}
