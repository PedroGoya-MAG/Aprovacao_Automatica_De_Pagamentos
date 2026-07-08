import {
  getAuthAuthorizeUrl,
  getAuthClientId,
  getAuthClientSecret,
  getAuthLogoutUrl,
  getAuthRedirectUri,
  getAuthScope,
  getAuthTokenUrl,
  isAuthPkceEnabled,
  isOidcEnabled
} from "@/lib/auth/config";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import { createRequestTimeoutSignal } from "@/lib/http";
import { type OAuthTokenResponse } from "@/types/auth";

export type OAuthTransaction = {
  state: string;
  nonce: string;
  codeVerifier?: string;
  codeChallenge?: string;
};

export class OAuthProviderError extends Error {
  constructor(
    public readonly status: number,
    public readonly providerMessage: string
  ) {
    super("Nao foi possivel concluir a autenticacao com o Identidade.");
    this.name = "OAuthProviderError";
  }
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createRandomValue(byteLength = 32) {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function createCodeChallenge(codeVerifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return encodeBase64Url(new Uint8Array(digest));
}

export async function createOAuthTransaction(): Promise<OAuthTransaction> {
  const codeVerifier = isAuthPkceEnabled() ? createRandomValue(64) : undefined;

  return {
    state: createRandomValue(),
    nonce: createRandomValue(),
    codeVerifier,
    codeChallenge: codeVerifier ? await createCodeChallenge(codeVerifier) : undefined
  };
}

export function buildAuthorizeUrl(
  transaction: OAuthTransaction,
  options?: { prompt?: "login"; maxAge?: number }
) {
  const url = new URL(getAuthAuthorizeUrl());

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getAuthClientId());
  url.searchParams.set("redirect_uri", getAuthRedirectUri());
  url.searchParams.set("scope", getAuthScope());
  url.searchParams.set("state", transaction.state);

  if (isOidcEnabled()) {
    url.searchParams.set("nonce", transaction.nonce);
  }

  if (transaction.codeChallenge) {
    url.searchParams.set("code_challenge", transaction.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }

  if (options?.prompt) {
    url.searchParams.set("prompt", options.prompt);
  }

  if (options?.maxAge !== undefined) {
    url.searchParams.set("max_age", String(options.maxAge));
  }

  return url.toString();
}

export function buildLogoutUrl(redirectUri: string, idTokenHint?: string) {
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

  if (idTokenHint) {
    url.searchParams.set("id_token_hint", idTokenHint);
  }

  return url.toString();
}

export function logoutRequiresAuthorizeReturnUrl() {
  const logoutUrl = getAuthLogoutUrl();
  return Boolean(logoutUrl && new URL(logoutUrl).pathname.toLowerCase().endsWith("/account/signout"));
}

function sanitizeProviderMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return "Resposta de erro sem detalhes seguros.";
  }

  const payload = value as Record<string, unknown>;
  const error = typeof payload.error === "string" ? payload.error.replace(/[^a-z0-9_.-]/gi, "_").slice(0, 80) : "oauth_error";
  const description = typeof payload.error_description === "string" ? payload.error_description : "";
  const sanitizedDescription = description
    .replace(/(code|token|secret|assertion|verifier)\s*[=:]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 300);

  return sanitizedDescription ? `${error}: ${sanitizedDescription}` : error;
}

export async function exchangeCodeForToken(code: string, codeVerifier?: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: getAuthClientId(),
    client_secret: getAuthClientSecret(),
    code,
    redirect_uri: getAuthRedirectUri()
  });

  if (codeVerifier) {
    body.set("code_verifier", codeVerifier);
  }

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
    const providerPayload = await response.json().catch(() => null);
    throw new OAuthProviderError(response.status, sanitizeProviderMessage(providerPayload));
  }

  return (await response.json()) as OAuthTokenResponse;
}

export function validateIdTokenNonce(idToken: string | undefined, expectedNonce: string) {
  if (!idToken) {
    if (isOidcEnabled()) {
      throw new Error("O provedor OIDC nao retornou id_token.");
    }

    return;
  }

  const payload = decodeJwtPayload(idToken);

  if (!payload || payload.nonce !== expectedNonce) {
    throw new Error("Nonce OIDC invalido.");
  }
}
