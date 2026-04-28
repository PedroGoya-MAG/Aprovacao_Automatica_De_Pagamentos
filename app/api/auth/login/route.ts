import { NextRequest, NextResponse } from "next/server";

import { getAuthCookieSecure, isAuthEnabled } from "@/lib/auth/config";
import { buildAuthorizeUrl, createOAuthState } from "@/lib/auth/oauth";
import { AUTH_RETURN_TO_COOKIE, AUTH_STATE_COOKIE } from "@/lib/auth/token-session";

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

  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const state = createOAuthState();
  const response = NextResponse.redirect(buildAuthorizeUrl(state));

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
    value: returnTo,
    httpOnly: true,
    sameSite: "lax",
    secure: getAuthCookieSecure(),
    path: "/",
    maxAge: 60 * 10
  });

  return response;
}
