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

export function getN8nApiUrl() {
  return getRequiredEnvValue("NEXT_PUBLIC_N8N_API_URL");
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
