import { AppHeader } from "@/components/layout/app-header";
import { TreasuryPagnetShell } from "@/components/treasury/treasury-pagnet-shell";
import { getPagnetImportedPayments } from "@/services/treasury-pagnet-service";

export default async function TesourariaPage() {
  const payments = await getPagnetImportedPayments();

  return (
    <main className="min-h-screen w-full">
      <AppHeader activeTab="treasury" />
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-5 sm:px-6 xl:px-8">
        <TreasuryPagnetShell initialPayments={payments} />
      </div>
    </main>
  );
}
