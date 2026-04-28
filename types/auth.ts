export interface AuthTokenPayload extends Record<string, unknown> {
  sub?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
  id_token?: string;
}

export interface AuthenticatedSession {
  accessToken: string;
  tokenType: string;
  expiresAt: string | null;
  user: {
    id: string;
    name: string;
    email?: string;
    claims: AuthTokenPayload;
  };
}
