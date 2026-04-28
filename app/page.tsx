import type { Route } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { DashboardShell } from "@/components/payments/dashboard-shell";
import { redirect } from "next/navigation";
import { getResumoDashboardServer } from "@/services/dashboard-service";
import { getLotes } from "@/services/payment-service";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ code?: string; state?: string; error?: string }>;
}) {
  const { code, state, error } = await searchParams;

  if (error) {
    redirect("/api/auth/logout?local=true");
  }

  if (code) {
    const callbackUrl = new URL("/api/auth/callback", "http://localhost");

    callbackUrl.searchParams.set("code", code);

    if (state) {
      callbackUrl.searchParams.set("state", state);
    }

    redirect(`${callbackUrl.pathname}${callbackUrl.search}` as Route);
  }

  const [batches, initialSummary] = await Promise.all([
    getLotes().catch(() => []),
    getResumoDashboardServer().catch(() => null)
  ]);

  return (
    <main className="min-h-screen w-full">
      <AppHeader activeTab="approvals" />
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-5 sm:px-6 xl:px-8">
        <DashboardShell initialBatches={batches} initialSummary={initialSummary} />
      </div>
    </main>
  );
}
