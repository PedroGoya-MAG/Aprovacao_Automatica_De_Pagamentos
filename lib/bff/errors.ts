import { NextResponse } from "next/server";

import { type BffErrorResponse } from "@/lib/bff/types";

export class BffError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly correlationId?: string
  ) {
    super(message);
    this.name = "BffError";
  }
}

export class BackendApiError extends BffError {
  constructor(status: number, message: string, correlationId?: string, public readonly payload?: unknown) {
    super(status, "BACKEND_ERROR", message, correlationId);
    this.name = "BackendApiError";
  }
}

export function toBffErrorResponse(error: unknown, fallbackMessage: string, correlationId?: string) {
  if (error instanceof BffError) {
    return jsonError(error.status, error.code, safeMessage(error.message, fallbackMessage), error.correlationId ?? correlationId);
  }

  return jsonError(502, "BFF_UNAVAILABLE", fallbackMessage, correlationId);
}

export function jsonError(status: number, code: string, message: string, correlationId?: string) {
  return withNoStore(
    NextResponse.json<BffErrorResponse>(
      {
        error: {
          code,
          message,
          ...(correlationId ? { correlationId } : {})
        }
      },
      { status }
    )
  );
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return withNoStore(NextResponse.json(data, init));
}

export function withNoStore<T extends NextResponse>(response: T) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function safeMessage(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}
