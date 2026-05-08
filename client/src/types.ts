export type TimePeriod = "1w" | "1m" | "3m" | "1y" | "all";
export type ChartType = "line" | "bar" | "area" | "scatter";

export interface PriceEntry {
  date: string;
  price: number;
  volume: number;
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  currency: string;
  history: PriceEntry[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
  fill: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface AppState {
  stocks: Stock[];
  selectedStock1: string;
  selectedStock2: string | null;
  currentPeriod: TimePeriod;
  currentChartType: ChartType;
  error: string | null;
  loading: boolean;
}
