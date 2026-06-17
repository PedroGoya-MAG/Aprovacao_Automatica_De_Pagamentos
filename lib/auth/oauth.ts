import {
  getAuthAuthorizeUrl,
  getAuthClientId,
  getAuthClientSecret,
  getAuthLogoutUrl,
  getAuthRedirectUri,
  getAuthScope,
  getAuthTokenUrl
} from "@/lib/auth/config";
import { createRequestTimeoutSignal } from "@/lib/http";
import { type OAuthTokenResponse } from "@/types/auth";

export function createOAuthState() {
  return crypto.randomUUID();
}

export function buildAuthorizeUrl(state: string, options?: { prompt?: "login" }) {
  const url = new URL(getAuthAuthorizeUrl());

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getAuthClientId());
  url.searchParams.set("redirect_uri", getAuthRedirectUri());
  url.searchParams.set("scope", getAuthScope());
  url.searchParams.set("state", state);

  if (options?.prompt) {
    url.searchParams.set("prompt", options.prompt);
  }

  return url.toString();
}

export function buildLogoutUrl(redirectUri: string) {
  const logoutUrl = getAuthLogoutUrl();

  if (!logoutUrl) {
    return null;
  }

  const url = new URL(logoutUrl);

  if (url.pathname.toLowerCase().endsWith("/account/signout")) {
    const redirectUrl = new URL(redirectUri);
    url.searchParams.set("returnurl", `${redirectUrl.pathname}${redirectUrl.search}`);
    return url.toString();
  }

  url.searchParams.set("client_id", getAuthClientId());
  url.searchParams.set("post_logout_redirect_uri", redirectUri);

  return url.toString();
}

export async function exchangeCodeForToken(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: getAuthClientId(),
    client_secret: getAuthClientSecret(),
    code,
    redirect_uri: getAuthRedirectUri()
  });

  const response = await fetch(getAuthTokenUrl(), {
    method: "POST",
    cache: "no-store",
    signal: createRequestTimeoutSignal(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel concluir a autenticacao com o Identidade.");
  }

  return (await response.json()) as OAuthTokenResponse;
}
