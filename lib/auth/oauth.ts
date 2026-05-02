import {
  getAuthAuthorizeUrl,
  getAuthClientId,
  getAuthClientSecret,
  getAuthRedirectUri,
  getAuthScope,
  getAuthTokenUrl
} from "@/lib/auth/config";
import { type OAuthTokenResponse } from "@/types/auth";

export function createOAuthState() {
  return crypto.randomUUID();
}

export function buildAuthorizeUrl(state: string) {
  const url = new URL(getAuthAuthorizeUrl());

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getAuthClientId());
  url.searchParams.set("redirect_uri", getAuthRedirectUri());
  url.searchParams.set("scope", getAuthScope());
  url.searchParams.set("state", state);

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
