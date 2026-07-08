import { type AuthenticatedSession } from "@/types/auth";

export type BffUser = AuthenticatedSession["user"];

export type BffAuthContext = {
  accessToken: string;
  correlationId: string;
  user: BffUser;
};

export type BffErrorResponse = {
  error: {
    code: string;
    message: string;
    correlationId?: string;
  };
};

export type BackendParamValue = string | number | boolean | null | undefined;
export type BackendParams = Record<string, BackendParamValue | Array<string | number | boolean>>;
