import { NextRequest, NextResponse } from "next/server";

import { getAppBaseUrl, isAuthEnabled } from "@/lib/auth/config";
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  createOAuthTransaction,
  logoutRequiresAuthorizeReturnUrl
} from "@/lib/auth/oauth";
import { clearAuthSessionCookies, setAuthTransactionCookies } from "@/lib/auth/session";
import { AUTH_ID_TOKEN_COOKIE } from "@/lib/auth/token-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authEnabled = isAuthEnabled();

  if (authEnabled && request.nextUrl.origin !== getAppBaseUrl()) {
    const canonicalUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, getAppBaseUrl());
    const response = NextResponse.redirect(canonicalUrl);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }

  const loginUrl = new URL("/api/auth/login", authEnabled ? getAppBaseUrl() : request.url);
  loginUrl.searchParams.set("prompt", "login");
  const isLocalOnly = request.nextUrl.searchParams.get("local") === "true";
  const idTokenHint = request.cookies.get(AUTH_ID_TOKEN_COOKIE)?.value;
  let transaction: Awaited<ReturnType<typeof createOAuthTransaction>> | undefined;
  let redirectUrl = loginUrl.toString();

  if (!isLocalOnly && authEnabled) {
    if (logoutRequiresAuthorizeReturnUrl()) {
      transaction = await createOAuthTransaction();
      const authorizeUrl = buildAuthorizeUrl(transaction, { prompt: "login", maxAge: 0 });
      redirectUrl = buildLogoutUrl(authorizeUrl, idTokenHint) ?? redirectUrl;
    } else {
      redirectUrl = buildLogoutUrl(loginUrl.toString(), idTokenHint) ?? redirectUrl;
    }
  }

  const response = NextResponse.redirect(redirectUrl);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  clearAuthSessionCookies(response);

  if (transaction) {
    setAuthTransactionCookies(response, transaction, "/");
  }

  return response;
}
