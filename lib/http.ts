import { getApiRequestTimeoutMs } from "@/lib/env";

export function createRequestTimeoutSignal() {
  return AbortSignal.timeout(getApiRequestTimeoutMs());
}
