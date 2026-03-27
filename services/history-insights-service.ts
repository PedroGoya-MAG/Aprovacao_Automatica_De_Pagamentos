import {
  getAvailableHistoryCompetences,
  getAvailableMonthlyKeys,
  getHistoricalBatchesDemo,
  getHistorySummaryDemo,
  getMonthlyOverviewDemo
} from "@/lib/history-monthly-demo-data";

export async function getHistoricalBatches() {
  return getHistoricalBatchesDemo();
}

export async function getHistoricalSummary() {
  return getHistorySummaryDemo();
}

export async function getMonthlyOverview(month: string) {
  return getMonthlyOverviewDemo(month);
}

export async function getHistoryCompetences() {
  return getAvailableHistoryCompetences();
}

export async function getMonthlyOptions() {
  return getAvailableMonthlyKeys();
}
