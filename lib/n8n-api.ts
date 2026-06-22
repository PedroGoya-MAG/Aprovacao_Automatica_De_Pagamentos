import { getN8nApiUrl } from "@/lib/env";
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
  const response = await fetch(buildN8nGetUrl(screen, action, params), {
    method: "GET",
    cache: "no-store",
    signal: createRequestTimeoutSignal(),
    headers: {
      Accept: "application/json"
    }
  });

  return parseN8nResponse<T>(response, `Falha ao consultar ${screen}/${action} no n8n.`);
}

export async function n8nPost<T>(screen: string, action: string, body: Record<string, unknown> = {}) {
  const response = await fetch(getN8nApiUrl(), {
    method: "POST",
    cache: "no-store",
    signal: createRequestTimeoutSignal(),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      screen,
      action,
      ...body
    })
  });

  return parseN8nResponse<T>(response, `Falha ao executar ${screen}/${action} no n8n.`);
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
