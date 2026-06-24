import { NextRequest, NextResponse } from "next/server";

import { getAppBaseUrl, isAuthEnabled, shouldForceAuthPrompt } from "@/lib/auth/config";
import { buildAuthorizeUrl, createOAuthTransaction } from "@/lib/auth/oauth";
import { clearAuthTemporaryCookies, setAuthTransactionCookies } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function sanitizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function GET(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (request.nextUrl.origin !== getAppBaseUrl()) {
    const canonicalUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, getAppBaseUrl());
    const response = NextResponse.redirect(canonicalUrl);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }

  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const forceLogin = request.nextUrl.searchParams.get("prompt") === "login" || shouldForceAuthPrompt();
  const transaction = await createOAuthTransaction();
  const response = NextResponse.redirect(
    buildAuthorizeUrl(transaction, { prompt: forceLogin ? "login" : undefined, maxAge: forceLogin ? 0 : undefined })
  );

  response.headers.set("Cache-Control", "no-store, max-age=0");
  clearAuthTemporaryCookies(response);
  setAuthTransactionCookies(response, transaction, returnTo);

  return response;
}
