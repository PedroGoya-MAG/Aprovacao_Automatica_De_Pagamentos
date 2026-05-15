import { AppHeader } from "@/components/layout/app-header";
import { MonthlyShell } from "@/components/monthly/monthly-shell";
import { getHistoricalBatches, getMonthlyOptions, getMonthlySeriesForView, getMonthlySummaryForView } from "@/services/history-insights-service";

export default async function VisaoMensalPage() {
  const monthOptions = await getMonthlyOptions();
  const initialMonth = monthOptions.at(-1)?.value ?? "";
  const [batches, initialSummary, initialSeries] = await Promise.all([
    getHistoricalBatches(),
    initialMonth
      ? getMonthlySummaryForView(initialMonth)
      : Promise.resolve({
          month: "",
          monthLabel: "",
          totalReceivedAmount: 0,
          totalReceivedCount: 0,
          totalApprovedAmount: 0,
          totalApprovedCount: 0,
          totalRejectedAmount: 0,
          totalRejectedCount: 0,
          totalSuspiciousAmount: 0,
          totalSuspiciousCount: 0
        }),
    initialMonth
      ? getMonthlySeriesForView(initialMonth)
      : Promise.resolve({
          dailySeries: [],
          weeklySeries: []
        })
  ]);

  return (
    <main className="min-h-screen w-full">
      <AppHeader activeTab="monthly" />
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-5 sm:px-6 xl:px-8">
        <MonthlyShell batches={batches} monthOptions={monthOptions} initialSummary={initialSummary} initialSeries={initialSeries} />
      </div>
    </main>
  );
}
