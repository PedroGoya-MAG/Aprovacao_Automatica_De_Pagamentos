import "server-only";

import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

import { canAccessFeature, DASHBOARD_FEATURES } from "@/lib/auth/roles";
import { AUTH_ACCESS_TOKEN_COOKIE, resolveSessionFromAccessToken } from "@/lib/auth/token-session";
import { BffError } from "@/lib/bff/errors";
import { type BffAuthContext } from "@/lib/bff/types";

export async function getAuthenticatedBffContext(request?: NextRequest): Promise<BffAuthContext> {
  const correlationId = getCorrelationId(request);
  const accessToken = request
    ? request.cookies.get(AUTH_ACCESS_TOKEN_COOKIE)?.value
    : (await cookies()).get(AUTH_ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    throw new BffError(401, "UNAUTHENTICATED", "Nao autenticado.", correlationId);
  }

  const session = resolveSessionFromAccessToken(accessToken);

  if (!session) {
    throw new BffError(401, "INVALID_SESSION", "Sessao expirada ou invalida.", correlationId);
  }

  return {
    accessToken,
    correlationId,
    user: session.user
  };
}

export function requireApprovalsManagement(context: BffAuthContext) {
  if (!canAccessFeature(context.user.role, DASHBOARD_FEATURES.APPROVALS_MANAGE)) {
    throw new BffError(403, "FORBIDDEN", "Perfil sem permissao para alterar aprovacoes.", context.correlationId);
  }
}

function getCorrelationId(request?: NextRequest) {
  return (
    request?.headers.get("x-correlation-id")?.trim() ||
    request?.headers.get("x-request-id")?.trim() ||
    crypto.randomUUID()
  );
}
