import { NextRequest, NextResponse } from "next/server";

import { getAuthCookieSecure, isAuthEnabled } from "@/lib/auth/config";
import { buildAuthorizeUrl, buildLogoutUrl, createOAuthState } from "@/lib/auth/oauth";
import { clearAuthSessionCookies } from "@/lib/auth/session";
import { AUTH_RETURN_TO_COOKIE, AUTH_STATE_COOKIE } from "@/lib/auth/token-session";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/api/auth/login", request.url);
  loginUrl.searchParams.set("prompt", "login");

  if (request.nextUrl.searchParams.get("local") === "true") {
    const response = NextResponse.redirect(loginUrl);
    clearAuthSessionCookies(response);
    return response;
  }

  const state = createOAuthState();
  const authorizeUrl = isAuthEnabled() ? buildAuthorizeUrl(state, { prompt: "login" }) : null;
  const identidadeLogoutUrl = authorizeUrl ? buildLogoutUrl(authorizeUrl) : null;
  const response = NextResponse.redirect(identidadeLogoutUrl ?? loginUrl);
  clearAuthSessionCookies(response);

  if (identidadeLogoutUrl) {
    response.cookies.set({
      name: AUTH_STATE_COOKIE,
      value: state,
      httpOnly: true,
      sameSite: "lax",
      secure: getAuthCookieSecure(),
      path: "/",
      maxAge: 60 * 10
    });

    response.cookies.set({
      name: AUTH_RETURN_TO_COOKIE,
      value: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: getAuthCookieSecure(),
      path: "/",
      maxAge: 60 * 10
    });
  }

  return response;
}
