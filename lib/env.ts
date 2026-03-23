function getEnvValue(serverKey: string, publicKey: string) {
  return process.env[serverKey] ?? process.env[publicKey];
}

function getRequiredEnvValue(serverKey: string, publicKey: string, label: string) {
  const value = getEnvValue(serverKey, publicKey);

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria nao configurada: ${label}.`);
  }

  return value;
}

export function getApprovalsSummaryUrl() {
  return getRequiredEnvValue(
    "APPROVALS_SUMMARY_URL",
    "NEXT_PUBLIC_APPROVALS_SUMMARY_URL",
    "APPROVALS_SUMMARY_URL"
  );
}

export function getApprovalsBatchesUrl() {
  return getRequiredEnvValue(
    "APPROVALS_BATCHES_URL",
    "NEXT_PUBLIC_APPROVALS_BATCHES_URL",
    "APPROVALS_BATCHES_URL"
  );
}

export function getApprovalsWebhookBaseUrl() {
  return getRequiredEnvValue(
    "APPROVALS_WEBHOOK_BASE_URL",
    "NEXT_PUBLIC_APPROVALS_WEBHOOK_BASE_URL",
    "APPROVALS_WEBHOOK_BASE_URL"
  );
}
