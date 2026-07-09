import { AppHeader } from "@/components/layout/app-header";
import { DashboardShell } from "@/components/payments/dashboard-shell";
import { getServerSession } from "@/lib/auth/session";
import { getResumoDashboardServer } from "@/services/dashboard-service";
import { getLotes } from "@/services/payment-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession();
  const [batchesResult, summaryResult] = await Promise.allSettled([
    getLotes({ status: "PENDING" }),
    getResumoDashboardServer({ status: "PENDING" })
  ]);
  const batches = batchesResult.status === "fulfilled" ? batchesResult.value : [];
  const initialSummary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
  const initialLoadError =
    batchesResult.status === "rejected"
      ? readErrorMessage(batchesResult.reason, "Nao foi possivel carregar os lotes de pagamentos.")
      : null;

  return (
    <main className="min-h-screen w-full">
      <AppHeader activeTab="approvals" />
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-5 px-3 py-4 sm:px-5 lg:px-6 xl:px-8 2xl:gap-6 2xl:py-5">
        <DashboardShell
          initialBatches={batches}
          initialSummary={initialSummary}
          initialLoadError={initialLoadError}
          role={session?.user.role}
        />
      </div>
    </main>
  );
}

function readErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}
