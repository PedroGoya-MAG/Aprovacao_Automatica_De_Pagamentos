import { AppHeader } from "@/components/layout/app-header";
import { MonthlyShell } from "@/components/monthly/monthly-shell";
import { getHistoricalBatches, getMonthlyOptions } from "@/services/history-insights-service";

export default async function VisaoMensalPage() {
  const [batches, monthOptions] = await Promise.all([getHistoricalBatches(), getMonthlyOptions()]);

  return (
    <main className="min-h-screen w-full">
      <AppHeader activeTab="monthly" />
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-5 sm:px-6 xl:px-8">
        <MonthlyShell batches={batches} monthOptions={monthOptions} />
      </div>
    </main>
  );
}
