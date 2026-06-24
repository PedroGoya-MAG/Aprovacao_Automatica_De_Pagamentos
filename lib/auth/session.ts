import { cookies } from "next/headers";
import { type NextResponse } from "next/server";

import { getAuthCookieDomain, getAuthCookieSecure, isAuthEnabled } from "@/lib/auth/config";
import { type OAuthTransaction } from "@/lib/auth/oauth";
import {
  AUTH_ACCESS_TOKEN_COOKIE,
  AUTH_CODE_VERIFIER_COOKIE,
  AUTH_ID_TOKEN_COOKIE,
  AUTH_NONCE_COOKIE,
  AUTH_RETURN_TO_COOKIE,
  AUTH_STATE_COOKIE,
  resolveSessionFromAccessToken
} from "@/lib/auth/token-session";
import { type OAuthTokenResponse } from "@/types/auth";

const OAUTH_TRANSACTION_MAX_AGE_SECONDS = 60 * 10;

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
  const tokens = [
    { name: AUTH_ACCESS_TOKEN_COOKIE, value: tokenResponse.access_token },
    ...(tokenResponse.id_token ? [{ name: AUTH_ID_TOKEN_COOKIE, value: tokenResponse.id_token }] : [])
  ];

  tokens.forEach(({ name, value }) => {
    response.cookies.set({
      name,
      value,
      httpOnly: true,
      sameSite: "lax",
      secure: getAuthCookieSecure(),
      domain: getAuthCookieDomain(),
      path: "/",
      maxAge: tokenResponse.expires_in
    });
  });
}

export function setAuthTransactionCookies(
  response: NextResponse,
  transaction: OAuthTransaction,
  returnTo: string
) {
  const values = [
    { name: AUTH_STATE_COOKIE, value: transaction.state },
    { name: AUTH_NONCE_COOKIE, value: transaction.nonce },
    { name: AUTH_RETURN_TO_COOKIE, value: returnTo },
    ...(transaction.codeVerifier
      ? [{ name: AUTH_CODE_VERIFIER_COOKIE, value: transaction.codeVerifier }]
      : [])
  ];

  values.forEach(({ name, value }) => {
    response.cookies.set({
      name,
      value,
      httpOnly: true,
      sameSite: "lax",
      secure: getAuthCookieSecure(),
      domain: getAuthCookieDomain(),
      path: "/",
      maxAge: OAUTH_TRANSACTION_MAX_AGE_SECONDS
    });
  });
}

export function clearAuthTemporaryCookies(response: NextResponse) {
  [AUTH_STATE_COOKIE, AUTH_NONCE_COOKIE, AUTH_CODE_VERIFIER_COOKIE, AUTH_RETURN_TO_COOKIE].forEach((cookieName) => {
    response.cookies.set({
      name: cookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: getAuthCookieSecure(),
      domain: getAuthCookieDomain(),
      path: "/",
      maxAge: 0
    });
  });
}

export function clearAuthSessionCookies(response: NextResponse) {
  [AUTH_ACCESS_TOKEN_COOKIE, AUTH_ID_TOKEN_COOKIE].forEach((cookieName) => {
    response.cookies.set({
      name: cookieName,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: getAuthCookieSecure(),
      domain: getAuthCookieDomain(),
      path: "/",
      maxAge: 0
    });
  });

  clearAuthTemporaryCookies(response);
}
