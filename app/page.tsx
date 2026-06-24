import { AppHeader } from "@/components/layout/app-header";
import { DashboardShell } from "@/components/payments/dashboard-shell";
import { getServerSession } from "@/lib/auth/session";
import { getResumoDashboardServer } from "@/services/dashboard-service";
import { getLotes } from "@/services/payment-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession();
  const [batches, initialSummary] = await Promise.all([
    getLotes({ status: "PENDING" }).catch(() => []),
    getResumoDashboardServer({ status: "PENDING" }).catch(() => null)
  ]);

  return (
    <main className="min-h-screen w-full">
      <AppHeader activeTab="approvals" />
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-5 sm:px-6 xl:px-8">
        <DashboardShell initialBatches={batches} initialSummary={initialSummary} role={session?.user.role} />
      </div>
    </main>
  );
}
