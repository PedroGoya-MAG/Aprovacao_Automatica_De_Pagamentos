import { cookies } from "next/headers";
import { type NextResponse } from "next/server";

import { getAuthCookieSecure, isAuthEnabled } from "@/lib/auth/config";
import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_RETURN_TO_COOKIE,
  AUTH_STATE_COOKIE,
  resolveSessionFromAccessToken
} from "@/lib/auth/token-session";
import { type OAuthTokenResponse } from "@/types/auth";

export async function getServerSession() {
  if (!isAuthEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  return resolveSessionFromAccessToken(accessToken);
}

export function setAuthSessionCookie(response: NextResponse, tokenResponse: OAuthTokenResponse) {
  response.cookies.set({
    name: AUTH_ACCESS_TOKEN_COOKIE,
    value: tokenResponse.access_token,
    httpOnly: true,
    sameSite: "lax",
    secure: getAuthCookieSecure(),
    path: "/",
    maxAge: tokenResponse.expires_in
  });
}

export function clearAuthSessionCookies(response: NextResponse) {
  [AUTH_ACCESS_TOKEN_COOKIE, AUTH_STATE_COOKIE, AUTH_RETURN_TO_COOKIE].forEach((cookieName) => {
    response.cookies.set({
      name: cookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: getAuthCookieSecure(),
      path: "/",
      maxAge: 0
    });
  });
}
