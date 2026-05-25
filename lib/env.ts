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
