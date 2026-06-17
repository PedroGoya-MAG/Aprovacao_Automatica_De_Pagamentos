import { NextRequest, NextResponse } from "next/server";

import { isAuthEnabled } from "@/lib/auth/config";
import { buildLogoutUrl } from "@/lib/auth/oauth";
import { clearAuthSessionCookies } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/api/auth/login", request.url);
  loginUrl.searchParams.set("prompt", "login");

  const identidadeLogoutUrl = isAuthEnabled() ? buildLogoutUrl(loginUrl.toString()) : null;
  const response = NextResponse.redirect(identidadeLogoutUrl ?? loginUrl);
  clearAuthSessionCookies(response);

  if (request.nextUrl.searchParams.get("local") === "true") {
    return response;
  }

  return response;
}
