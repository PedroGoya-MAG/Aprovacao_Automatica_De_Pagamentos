import "server-only";

import { getBackendApiBaseUrl } from "@/lib/env";
import { createRequestTimeoutSignal } from "@/lib/http";
import { BackendApiError, BffError } from "@/lib/bff/errors";
import { type BackendParams, type BffAuthContext } from "@/lib/bff/types";

type BffRequestOptions = {
  method: "GET" | "POST" | "PATCH";
  context: BffAuthContext;
  params?: BackendParams;
  body?: Record<string, unknown>;
};

export async function bffGet<T>(screen: string, action: string, context: BffAuthContext, params: BackendParams = {}) {
  return bffRequest<T>(screen, action, {
    method: "GET",
    context,
    params
  });
}

export async function bffPost<T>(screen: string, action: string, context: BffAuthContext, body: Record<string, unknown> = {}) {
  return bffRequest<T>(screen, action, {
    method: "POST",
    context,
    body
  });
}

export async function bffRequest<T>(screen: string, action: string, options: BffRequestOptions) {
  const startedAt = Date.now();
  const url = buildBackendUrl(screen, action, options.params);

  logStart(options.method, screen, action, options.context);

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method,
      cache: "no-store",
      signal: createRequestTimeoutSignal(),
      headers: buildHeaders(options.context),
      ...(options.method === "GET"
        ? {}
        : {
            body: JSON.stringify({
              screen,
              action,
              ...options.body
            })
          })
    });
  } catch (error) {
    logFailure(options.method, screen, action, options.context, Date.now() - startedAt, error);
    throw new BffError(502, "BACKEND_UNREACHABLE", "Nao foi possivel comunicar com o backend.", options.context.correlationId);
  }

  logEnd(options.method, screen, action, options.context, response.status, Date.now() - startedAt);
  return parseBackendResponse<T>(response, options.context.correlationId);
}

function buildBackendUrl(screen: string, action: string, params: BackendParams = {}) {
  let url: URL;

  try {
    url = new URL(getBackendApiBaseUrl());
  } catch {
    throw new BffError(500, "BFF_CONFIG_ERROR", "Backend nao configurado.", undefined);
  }

  url.searchParams.set("screen", screen);
  url.searchParams.set("action", action);

  Object.entries(params).forEach(([key, value]) => appendSearchParam(url, key, value));
  return url.toString();
}

function buildHeaders(context: BffAuthContext) {
  return new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Correlation-Id": context.correlationId,
    Authorization: `Bearer ${context.accessToken}`
  });
}

async function parseBackendResponse<T>(response: Response, correlationId: string) {
  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new BackendApiError(response.status, readMessageFromPayload(payload), correlationId, payload);
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
    if (typeof message === "string" && message.trim()) return message.trim();
  }

  return "Falha ao consultar o backend.";
}

function appendSearchParam(url: URL, key: string, value: BackendParams[string]) {
  if (Array.isArray(value)) {
    value.forEach((item) => appendSearchParam(url, key, item));
    return;
  }

  if (value === undefined || value === null) return;
  const normalized = String(value).trim();
  if (normalized) url.searchParams.set(key, normalized);
}

function logStart(method: string, screen: string, action: string, context: BffAuthContext) {
  console.info("[bff] start", {
    method,
    screen,
    action,
    correlationId: context.correlationId,
    userId: context.user.id,
    role: context.user.role
  });
}

function logEnd(method: string, screen: string, action: string, context: BffAuthContext, status: number, durationMs: number) {
  console.info("[bff] end", {
    method,
    screen,
    action,
    status,
    durationMs,
    correlationId: context.correlationId,
    userId: context.user.id
  });
}

function logFailure(method: string, screen: string, action: string, context: BffAuthContext, durationMs: number, error: unknown) {
  console.error("[bff] failure", {
    method,
    screen,
    action,
    durationMs,
    correlationId: context.correlationId,
    userId: context.user.id,
    error: error instanceof Error ? error.name : "UnknownError"
  });
}
