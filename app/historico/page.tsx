import { AppHeader } from "@/components/layout/app-header";
import { HistoryShell } from "@/components/history/history-shell";
import { getHistoricalBatches, getHistoricalSummary, getHistoryCompetences } from "@/services/history-insights-service";

export default async function HistoricoPage() {
  const [batches, summary, competences] = await Promise.all([
    getHistoricalBatches(),
    getHistoricalSummary(),
    getHistoryCompetences()
  ]);

  return (
    <main className="min-h-screen w-full">
      <AppHeader activeTab="history" />
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-5 sm:px-6 xl:px-8">
        <HistoryShell initialBatches={batches} initialSummary={summary} competences={competences} />
      </div>
    </main>
  );
}
