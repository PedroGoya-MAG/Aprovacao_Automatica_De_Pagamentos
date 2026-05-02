import { NextRequest, NextResponse } from "next/server";

import { clearAuthSessionCookies } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  clearAuthSessionCookies(response);

  if (request.nextUrl.searchParams.get("local") === "true") {
    return response;
  }

  return response;
}
