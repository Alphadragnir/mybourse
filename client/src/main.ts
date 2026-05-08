import "./styles.css";
import { AppState } from "./types";
import { fetchStocks, getChartData, exportToCSV } from "./api";
import { renderUI } from "./ui";
import { updateChart } from "./chart";

const appState: AppState = {
  stocks: [],
  selectedStock1: "AAPL",
  selectedStock2: "TSLA",
  currentPeriod: "1m",
  currentChartType: "line",
  error: null,
  loading: true,
};

(window as any).appState = appState;
(window as any).updateApp = updateApp;
(window as any).exportCSV = exportCSVData;

async function init(): Promise<void> {
  try {
    appState.loading = true;
    appState.error = null;
    const stocks = await fetchStocks();
    appState.stocks = stocks;
    updateApp();
  } catch (error) {
    appState.error =
      error instanceof Error ? error.message : "Erreur inconnue lors du chargement";
    renderUI(appState);
  }
}

function updateApp(): void {
  appState.loading = false;
  try {
    renderUI(appState);

    if (appState.stocks.length > 0) {
      const chartData = getChartData(
        appState.stocks,
        appState.selectedStock1,
        appState.currentPeriod,
        appState.selectedStock2 || undefined
      );
      updateChart(chartData, appState.currentChartType);
    }
  } catch (error) {
    appState.error =
      error instanceof Error ? error.message : "Erreur lors de la mise à jour";
    renderUI(appState);
  }
}

function exportCSVData(): void {
  try {
    const csv = exportToCSV(
      appState.stocks,
      appState.selectedStock1,
      appState.selectedStock2,
      appState.currentPeriod
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `mybourse-${appState.selectedStock1}-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Export échoué:", error);
    alert("Erreur lors de l'export");
  }
}

function initDarkMode(): void {
  const saved = localStorage.getItem("darkMode");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved !== null ? saved === "true" : prefersDark;
  if (isDark) document.documentElement.classList.add("dark");
}

function toggleDarkMode(): void {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("darkMode", String(isDark));
}

(window as any).toggleDarkMode = toggleDarkMode;

initDarkMode();
init();
