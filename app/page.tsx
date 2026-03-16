import { AppHeader } from "@/components/layout/app-header";
import { DashboardShell } from "@/components/payments/dashboard-shell";
import { getLotes } from "@/services/payment-service";

export default async function Home() {
  const batches = await getLotes();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-8 px-4 py-6 sm:px-6 xl:px-8">
      <AppHeader />
      <DashboardShell initialBatches={batches} />
    </main>
  );
}
