import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { exchangeCodeForToken } from "@/lib/auth/oauth";
import { clearAuthSessionCookies, setAuthSessionCookie } from "@/lib/auth/session";
import {
  AUTH_RETURN_TO_COOKIE,
  AUTH_STATE_COOKIE,
  resolveSessionFromAccessToken
} from "@/lib/auth/token-session";

function sanitizeReturnTo(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(AUTH_STATE_COOKIE)?.value;
  const returnTo = sanitizeReturnTo(cookieStore.get(AUTH_RETURN_TO_COOKIE)?.value);
  const code = request.nextUrl.searchParams.get("code");
  const receivedState = request.nextUrl.searchParams.get("state");

  if (!code || !receivedState || !expectedState || receivedState !== expectedState) {
    return new NextResponse("Falha ao validar o retorno do Identidade.", { status: 400 });
  }

  try {
    const tokenResponse = await exchangeCodeForToken(code);
    const session = resolveSessionFromAccessToken(tokenResponse.access_token);

    if (!session) {
      const response = NextResponse.redirect(new URL("/api/auth/logout?local=true", request.url));
      clearAuthSessionCookies(response);
      return response;
    }

    const response = NextResponse.redirect(new URL(returnTo, request.url));
    setAuthSessionCookie(response, tokenResponse);
    response.cookies.delete(AUTH_STATE_COOKIE);
    response.cookies.delete(AUTH_RETURN_TO_COOKIE);
    return response;
  } catch {
    return new NextResponse("Falha ao autenticar no Identidade.", { status: 502 });
  }
}
