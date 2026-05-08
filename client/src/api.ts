import {
  Stock,
  TimePeriod,
  PriceEntry,
  ChartData,
  ChartDataset,
} from "./types";

const API_URL = "https://keligmartin.github.io/api/stocks.json";

export async function fetchStocks(): Promise<Stock[]> {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    const data: Stock[] = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Format de données invalide");
    }

    data.forEach((stock, index) => {
      if (!stock.symbol || !stock.name || !Array.isArray(stock.history)) {
        throw new Error(`Données manquantes pour l'action à l'index ${index}`);
      }
    });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Impossible de récupérer les données: ${error.message}`);
    }
    throw new Error("Erreur inconnue");
  }
}

export function filterHistoryByPeriod(
  history: PriceEntry[],
  period: TimePeriod
): PriceEntry[] {
  if (period === "all") return history;

  const now = new Date();
  let daysBack = 0;

  switch (period) {
    case "1w": daysBack = 7; break;
    case "1m": daysBack = 30; break;
    case "3m": daysBack = 90; break;
    case "1y": daysBack = 365; break;
  }

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - daysBack);

  return history.filter((entry) => new Date(entry.date) >= cutoff);
}

export function getChartData(
  stocks: Stock[],
  symbol1: string,
  period: TimePeriod,
  symbol2?: string
): ChartData {
  const stock1 = stocks.find((s) => s.symbol === symbol1);
  if (!stock1) throw new Error(`Action ${symbol1} non trouvée`);

  const filteredHistory1 = filterHistoryByPeriod(stock1.history, period);
  const labels = filteredHistory1.map((entry) => entry.date);

  const dataset1: ChartDataset = {
    label: stock1.symbol,
    data: filteredHistory1.map((entry) => entry.price),
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    tension: 0.4,
    fill: true,
  };

  const datasets: ChartDataset[] = [dataset1];

  if (symbol2) {
    const stock2 = stocks.find((s) => s.symbol === symbol2);
    if (!stock2) throw new Error(`Action ${symbol2} non trouvée`);

    const filteredHistory2 = filterHistoryByPeriod(stock2.history, period);

    // Aligner les deux séries sur les dates communes
    const commonLabels = labels.filter((date) =>
      filteredHistory2.some((entry) => entry.date === date)
    );

    datasets[0].data = commonLabels.map((date) => {
      const entry = filteredHistory1.find((e) => e.date === date);
      return entry ? entry.price : 0;
    });

    datasets.push({
      label: stock2.symbol,
      data: commonLabels.map((date) => {
        const entry = filteredHistory2.find((e) => e.date === date);
        return entry ? entry.price : 0;
      }),
      borderColor: "#10B981",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      tension: 0.4,
      fill: true,
    });

    return { labels: commonLabels, datasets };
  }

  return { labels, datasets };
}

export function calculatePriceChange(
  history: PriceEntry[]
): { change: number; percentChange: number } {
  if (history.length < 2) return { change: 0, percentChange: 0 };

  const oldPrice = history[0].price;
  const newPrice = history[history.length - 1].price;
  const change = newPrice - oldPrice;

  return { change, percentChange: (change / oldPrice) * 100 };
}

export function calculateStats(history: PriceEntry[]): {
  min: number;
  max: number;
  avg: number;
} {
  if (history.length === 0) return { min: 0, max: 0, avg: 0 };

  const prices = history.map((e) => e.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: prices.reduce((a, b) => a + b, 0) / prices.length,
  };
}

export function formatPrice(price: number): string {
  return price.toFixed(2);
}

export function formatPercent(percent: number): string {
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

export function exportToCSV(
  stocks: Stock[],
  symbol1: string,
  symbol2: string | null,
  period: TimePeriod
): string {
  const stock1 = stocks.find((s) => s.symbol === symbol1);
  if (!stock1) return "";

  const history1 = filterHistoryByPeriod(stock1.history, period);
  const history2 = symbol2
    ? filterHistoryByPeriod(
        stocks.find((s) => s.symbol === symbol2)?.history || [],
        period
      )
    : [];

  let csv = "Date," + stock1.symbol + (symbol2 ? "," + symbol2 : "") + "\n";

  history1.forEach((entry) => {
    const entry2 = history2.find((e) => e.date === entry.date);
    csv +=
      entry.date + "," + entry.price +
      (symbol2 ? "," + (entry2?.price || "") : "") + "\n";
  });

  return csv;
}

// Calcule le coefficient de corrélation de Pearson sur les dates communes
export function calculateCorrelation(
  history1: PriceEntry[],
  history2: PriceEntry[]
): number | null {
  const commonDates = history1
    .map((e) => e.date)
    .filter((date) => history2.some((e) => e.date === date));

  if (commonDates.length < 5) return null;

  const prices1 = commonDates.map((date) => history1.find((e) => e.date === date)!.price);
  const prices2 = commonDates.map((date) => history2.find((e) => e.date === date)!.price);

  const n = prices1.length;
  const mean1 = prices1.reduce((a, b) => a + b, 0) / n;
  const mean2 = prices2.reduce((a, b) => a + b, 0) / n;

  const numerator = prices1.reduce(
    (sum, p1, i) => sum + (p1 - mean1) * (prices2[i] - mean2),
    0
  );

  const std1 = Math.sqrt(prices1.reduce((sum, p) => sum + Math.pow(p - mean1, 2), 0));
  const std2 = Math.sqrt(prices2.reduce((sum, p) => sum + Math.pow(p - mean2, 2), 0));

  if (std1 === 0 || std2 === 0) return null;

  return numerator / (std1 * std2);
}

export function interpretCorrelation(r: number): {
  label: string;
  description: string;
  color: string;
} {
  const abs = Math.abs(r);
  const direction = r >= 0 ? "positive" : "négative";

  if (abs >= 0.8)
    return {
      label: "Très forte",
      description: `Corrélation ${direction} très forte — les deux actions évoluent ${r >= 0 ? "ensemble" : "en sens inverse"}.`,
      color: r >= 0 ? "#10b981" : "#ef4444",
    };
  if (abs >= 0.6)
    return {
      label: "Forte",
      description: `Corrélation ${direction} forte — tendances ${r >= 0 ? "similaires" : "opposées"} sur la période.`,
      color: r >= 0 ? "#34d399" : "#f87171",
    };
  if (abs >= 0.4)
    return {
      label: "Modérée",
      description: `Corrélation ${direction} modérée — lien partiel entre les deux actions.`,
      color: r >= 0 ? "#fbbf24" : "#fb923c",
    };
  if (abs >= 0.2)
    return {
      label: "Faible",
      description: `Corrélation ${direction} faible — peu de lien direct.`,
      color: "#94a3b8",
    };

  return {
    label: "Nulle",
    description: "Pas de corrélation — les deux actions évoluent indépendamment.",
    color: "#94a3b8",
  };
}
