import { getApiAuthToken, getN8nApiUrl } from "@/lib/env";
import { createRequestTimeoutSignal } from "@/lib/http";

type N8nParamValue = string | number | boolean | null | undefined;
type N8nParams = Record<string, N8nParamValue | Array<string | number | boolean>>;

export class N8nApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "N8nApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function buildN8nGetUrl(screen: string, action: string, params: N8nParams = {}) {
  const url = new URL(getN8nApiUrl());

  url.searchParams.set("screen", screen);
  url.searchParams.set("action", action);

  Object.entries(params).forEach(([key, value]) => {
    appendSearchParam(url, key, value);
  });

  return url.toString();
}

export async function n8nGet<T>(screen: string, action: string, params: N8nParams = {}) {
  const url = buildN8nGetUrl(screen, action, params);
  const startedAt = Date.now();

  logN8nStart("GET", screen, action, url);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: createRequestTimeoutSignal(),
      headers: buildN8nHeaders()
    });
  } catch (error) {
    logN8nFailure("GET", screen, action, Date.now() - startedAt, error);
    throw error;
  }

  logN8nEnd("GET", screen, action, response.status, Date.now() - startedAt);

  return parseN8nResponse<T>(response, `Falha ao consultar ${screen}/${action} no n8n.`);
}

export async function n8nPost<T>(screen: string, action: string, body: Record<string, unknown> = {}) {
  const url = getN8nApiUrl();
  const startedAt = Date.now();

  logN8nStart("POST", screen, action, url);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      signal: createRequestTimeoutSignal(),
      headers: buildN8nHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        screen,
        action,
        ...body
      })
    });
  } catch (error) {
    logN8nFailure("POST", screen, action, Date.now() - startedAt, error);
    throw error;
  }

  logN8nEnd("POST", screen, action, response.status, Date.now() - startedAt);

  return parseN8nResponse<T>(response, `Falha ao executar ${screen}/${action} no n8n.`);
}

function buildN8nHeaders(extraHeaders: HeadersInit = {}) {
  const token = getApiAuthToken();
  const headers = new Headers({
    Accept: "application/json",
    ...extraHeaders
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function logN8nStart(method: string, screen: string, action: string, url: string) {
  console.info("[n8n-api] start", {
    method,
    screen,
    action,
    apiBaseUrl: sanitizeUrl(url),
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    usingMock: false,
    authTokenConfigured: Boolean(getApiAuthToken())
  });
}

function logN8nEnd(method: string, screen: string, action: string, status: number, durationMs: number) {
  console.info("[n8n-api] end", {
    method,
    screen,
    action,
    status,
    durationMs
  });
}

function logN8nFailure(method: string, screen: string, action: string, durationMs: number, error: unknown) {
  const message = error instanceof Error ? error.message : "Erro desconhecido";

  if (message.startsWith("Dynamic server usage:")) {
    return;
  }

  console.error("[n8n-api] failure", {
    method,
    screen,
    action,
    durationMs,
    error: message
  });
}

function sanitizeUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "invalid-url";
  }
}

async function parseN8nResponse<T>(response: Response, fallbackMessage: string) {
  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new N8nApiError(readMessageFromPayload(payload) ?? fallbackMessage, response.status, payload);
  }

  return payload as T;
}

async function parseJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readMessageFromPayload(payload: unknown) {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = (payload as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  return null;
}

function appendSearchParam(
  url: URL,
  key: string,
  value: N8nParamValue | Array<string | number | boolean>
) {
  if (Array.isArray(value)) {
    value.forEach((item) => appendSearchParam(url, key, item));
    return;
  }

  if (value === undefined || value === null) {
    return;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return;
  }

  url.searchParams.set(key, normalized);
}
