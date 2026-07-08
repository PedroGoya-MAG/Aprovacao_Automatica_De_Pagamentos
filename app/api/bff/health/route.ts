import { jsonOk } from "@/lib/bff/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  return jsonOk({
    status: "ok",
    service: "bff",
    timestamp: new Date().toISOString()
  });
}
