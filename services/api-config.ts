const DEFAULT_PAYMENTS_API_PATH = "/payment-batches";

export const paymentApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  apiPath: process.env.NEXT_PUBLIC_PAYMENTS_API_PATH ?? DEFAULT_PAYMENTS_API_PATH,
  useMocks: process.env.NEXT_PUBLIC_ENABLE_MOCKS !== "false",
  authToken: process.env.API_AUTH_TOKEN
};

export function buildPaymentApiUrl(path = "") {
  const normalizedBaseUrl = paymentApiConfig.baseUrl.replace(/\/$/, "");
  const normalizedApiPath = paymentApiConfig.apiPath.startsWith("/")
    ? paymentApiConfig.apiPath
    : `/${paymentApiConfig.apiPath}`;
  const normalizedPath = path ? `/${path.replace(/^\//, "")}` : "";

  return `${normalizedBaseUrl}${normalizedApiPath}${normalizedPath}`;
}

export function getPaymentApiHeaders(init?: HeadersInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(paymentApiConfig.authToken ? { Authorization: `Bearer ${paymentApiConfig.authToken}` } : {}),
    ...init
  };
}
