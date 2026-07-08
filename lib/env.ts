function readEnvValue(key: string) {
  return process.env[key]?.trim() || "";
}

function getRequiredEnvValue(key: string) {
  const value = readEnvValue(key);

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria nao configurada: ${key}.`);
  }

  return value;
}

<<<<<<< HEAD
export function getBackendApiBaseUrl() {
  return getRequiredEnvValue("BACKEND_API_BASE_URL");
=======
export function getN8nApiUrl() {
  const value = readEnvValue("N8N_API_URL") || readEnvValue("NEXT_PUBLIC_N8N_API_URL");

  if (!value) {
    if (process.env.NODE_ENV === "development") {
      console.error("[env] API base URL ausente. Configure N8N_API_URL no servidor ou NEXT_PUBLIC_N8N_API_URL para compatibilidade.");
    }

    throw new Error("Variavel de ambiente obrigatoria nao configurada: N8N_API_URL ou NEXT_PUBLIC_N8N_API_URL.");
  }

  return value;
}

export function getApiAuthToken() {
  return readEnvValue("API_AUTH_TOKEN");
>>>>>>> prd/staging
}

export function getApiRequestTimeoutMs() {
  const key = "API_REQUEST_TIMEOUT_MS";
  const value = getRequiredEnvValue(key);
  const timeoutMs = Number(value);

  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`Variavel de ambiente invalida: ${key} deve ser um numero inteiro positivo.`);
  }

  return timeoutMs;
}
