import { NextRequest, NextResponse } from "next/server";

import { isAuthPkceEnabled } from "@/lib/auth/config";
import { exchangeCodeForToken, OAuthProviderError, validateIdTokenNonce } from "@/lib/auth/oauth";
import {
  clearAuthSessionCookies,
  clearAuthTemporaryCookies,
  setAuthSessionCookie
} from "@/lib/auth/session";
import {
  AUTH_CODE_VERIFIER_COOKIE,
  AUTH_NONCE_COOKIE,
  AUTH_RETURN_TO_COOKIE,
  AUTH_STATE_COOKIE,
  resolveSessionFromAccessToken
} from "@/lib/auth/token-session";

export const dynamic = "force-dynamic";

function sanitizeReturnTo(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function callbackError(message: string, status: number, clearSession = false) {
  const response = noStore(new NextResponse(message, { status }));

  if (clearSession) {
    clearAuthSessionCookies(response);
  } else {
    clearAuthTemporaryCookies(response);
  }

  return response;
}

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const expectedState = request.cookies.get(AUTH_STATE_COOKIE)?.value;
  const expectedNonce = request.cookies.get(AUTH_NONCE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(AUTH_CODE_VERIFIER_COOKIE)?.value;
  const returnTo = sanitizeReturnTo(request.cookies.get(AUTH_RETURN_TO_COOKIE)?.value);
  const code = request.nextUrl.searchParams.get("code");
  const receivedState = request.nextUrl.searchParams.get("state");
  const providerError = request.nextUrl.searchParams.get("error");

  console.info("[auth.callback] retorno recebido", {
    correlationId,
    hasCode: Boolean(code),
    hasReceivedState: Boolean(receivedState),
    hasSavedState: Boolean(expectedState),
    hasNonce: Boolean(expectedNonce),
    hasCodeVerifier: Boolean(codeVerifier),
    hasProviderError: Boolean(providerError)
  });

  if (providerError) {
    console.warn("[auth.callback] provedor retornou erro de autorizacao", {
      correlationId,
      error: providerError.replace(/[^a-z0-9_.-]/gi, "_").slice(0, 80)
    });
    return callbackError("Autenticacao cancelada ou recusada pelo Identidade.", 400);
  }

  if (!code || !receivedState || !expectedState || receivedState !== expectedState) {
    console.warn("[auth.callback] validacao de state falhou", {
      correlationId,
      hasCode: Boolean(code),
      hasReceivedState: Boolean(receivedState),
      hasSavedState: Boolean(expectedState),
      stateMatches: Boolean(receivedState && expectedState && receivedState === expectedState)
    });
    return callbackError("Falha ao validar o retorno do Identidade.", 400);
  }

  if (!expectedNonce || (isAuthPkceEnabled() && !codeVerifier)) {
    console.warn("[auth.callback] transacao OAuth incompleta", {
      correlationId,
      hasNonce: Boolean(expectedNonce),
      hasCodeVerifier: Boolean(codeVerifier),
      pkceEnabled: isAuthPkceEnabled()
    });
    return callbackError("A sessao temporaria de autenticacao expirou ou esta incompleta.", 400);
  }

  try {
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier);
    validateIdTokenNonce(tokenResponse.id_token, expectedNonce);

    const session = resolveSessionFromAccessToken(tokenResponse.access_token);

    if (!session) {
      console.warn("[auth.callback] token sem perfil autorizado", { correlationId });
      return callbackError(
        "Usuario autenticado sem um perfil DashBeneficio valido. O acesso ao portal nao foi liberado.",
        403,
        true
      );
    }

    const response = noStore(NextResponse.redirect(new URL(returnTo, request.url)));
    setAuthSessionCookie(response, tokenResponse);
    clearAuthTemporaryCookies(response);
    console.info("[auth.callback] autenticacao concluida", { correlationId });
    return response;
  } catch (error) {
    if (error instanceof OAuthProviderError) {
      console.error("[auth.callback] troca do code por token falhou", {
        correlationId,
        providerStatus: error.status,
        providerMessage: error.providerMessage
      });
    } else {
      console.error("[auth.callback] autenticacao falhou", {
        correlationId,
        errorType: error instanceof Error ? error.name : "UnknownError"
      });
    }

    return callbackError("Falha ao autenticar no Identidade.", 502);
  }
}
