import { Stock, TimePeriod, ChartType, AppState } from "./types";
import {
  calculatePriceChange,
  calculateStats,
  calculateCorrelation,
  interpretCorrelation,
  formatPrice,
  formatPercent,
  filterHistoryByPeriod,
} from "./api";

export function renderUI(state: AppState): void {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="container">
      <header class="header">
        <div class="header-top">
          <div>
            <h1>MyBourse</h1>
            <p class="subtitle">Suivi en temps réel de l'évolution des cours boursiers</p>
          </div>
          <button id="dark-mode-toggle" class="btn btn-icon" title="Mode sombre">
            <span class="icon-sun">☀</span>
            <span class="icon-moon">☽</span>
          </button>
        </div>
      </header>

      ${state.error ? `<div class="error-alert">${escapeHtml(state.error)}</div>` : ""}
      ${state.loading ? `<div class="loading">Chargement...</div>` : ""}

      <div class="main-content">
        <aside class="sidebar">
          <div class="control-panel">
            <div class="period-selector">
              <h3>Période</h3>
              <div class="button-group">
                ${renderPeriodButtons(state.currentPeriod)}
              </div>
            </div>

            <div class="chart-type-selector">
              <h3>Type de graphique</h3>
              <div class="button-group">
                ${renderChartTypeButtons(state.currentChartType)}
              </div>
            </div>

            <div class="stocks-selector">
              <h3>Actions disponibles</h3>
              ${renderStockButtons(state.stocks, state.selectedStock1, state.selectedStock2)}
            </div>
          </div>
        </aside>

        <main class="main">
          <div class="chart-container">
            <h2>Évolution des prix - ${state.currentPeriod.toUpperCase()}</h2>
            <canvas id="chart"></canvas>
          </div>

          <div class="stats-container">
            ${renderStockCards(state.stocks, state.selectedStock1, state.selectedStock2, state.currentPeriod)}
          </div>

          <div class="export-container">
            <button id="export-btn" class="btn btn-secondary">Exporter en CSV</button>
          </div>
        </main>
      </div>
    </div>
  `;

  attachEventListeners(state);
}

function renderPeriodButtons(currentPeriod: TimePeriod): string {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: "1w", label: "1 semaine" },
    { value: "1m", label: "1 mois" },
    { value: "3m", label: "3 mois" },
    { value: "1y", label: "1 an" },
    { value: "all", label: "Tout" },
  ];

  return periods
    .map(
      (p) =>
        `<button class="btn ${p.value === currentPeriod ? "btn-active" : "btn-secondary"}" data-period="${p.value}">${p.label}</button>`
    )
    .join("");
}

function renderChartTypeButtons(currentChartType: ChartType): string {
  const types: { value: ChartType; label: string }[] = [
    { value: "line", label: "Courbe" },
    { value: "bar", label: "Barres" },
    { value: "area", label: "Aire" },
    { value: "scatter", label: "Nuage de points" },
  ];

  return types
    .map(
      (t) =>
        `<button class="btn ${t.value === currentChartType ? "btn-active" : "btn-secondary"}" data-chart-type="${t.value}">${t.label}</button>`
    )
    .join("");
}

function renderStockButtons(
  stocks: Stock[],
  selectedStock1: string,
  selectedStock2: string | null
): string {
  return stocks
    .map((stock) => {
      const isSelected1 = stock.symbol === selectedStock1;
      const isSelected2 = stock.symbol === selectedStock2;
      // petite incohérence intentionnelle : "isSelected" déclaré mais pas utilisé partout pareil
      var isSelected = isSelected1 || isSelected2;

      return `
        <div class="stock-item">
          <button class="btn stock-btn ${isSelected ? "btn-active" : "btn-secondary"}" data-symbol="${stock.symbol}">
            ${stock.symbol}
          </button>
          ${
            !isSelected1
              ? `<button class="btn btn-compare ${isSelected2 ? "btn-active" : "btn-secondary"}" data-compare="${stock.symbol}">
              ${isSelected2 ? "Comparer (actif)" : "+ Comparer"}
            </button>`
              : ""
          }
        </div>
      `;
    })
    .join("");
}

function renderStockCards(
  stocks: Stock[],
  symbol1: string,
  symbol2: string | null,
  period: TimePeriod
): string {
  const stock1 = stocks.find((s) => s.symbol === symbol1);
  if (!stock1) return "";

  const history1 = filterHistoryByPeriod(stock1.history, period);
  const { percentChange: change1 } = calculatePriceChange(history1);
  const stats1 = calculateStats(history1);

  let html = `
    <div class="stock-card">
      <div class="card-header">
        <h3>${stock1.symbol}</h3>
        <span class="arrow ${change1 >= 0 ? "up" : "down"}">
          ${change1 >= 0 ? "▲" : "▼"}
        </span>
      </div>
      <p class="company-name">${stock1.name}</p>
      <p class="price">$${formatPrice(stock1.currentPrice)}</p>
      <p class="change ${change1 >= 0 ? "positive" : "negative"}">
        ${formatPercent(change1)}
      </p>
      <p class="sector">${stock1.sector}</p>
      <div class="stats">
        <div class="stat">Min: $${formatPrice(stats1.min)}</div>
        <div class="stat">Max: $${formatPrice(stats1.max)}</div>
        <div class="stat">Moy: $${formatPrice(stats1.avg)}</div>
      </div>
      <p class="volume">${history1.length} jours | Vol: ${history1[history1.length - 1]?.volume?.toLocaleString() ?? "N/A"}</p>
    </div>
  `;

  if (symbol2) {
    const stock2 = stocks.find((s) => s.symbol === symbol2);
    if (stock2) {
      const history2 = filterHistoryByPeriod(stock2.history, period);
      const { percentChange: change2 } = calculatePriceChange(history2);
      const stats2 = calculateStats(history2);

      html += `
        <div class="stock-card">
          <div class="card-header">
            <h3>${stock2.symbol}</h3>
            <span class="arrow ${change2 >= 0 ? "up" : "down"}">
              ${change2 >= 0 ? "▲" : "▼"}
            </span>
          </div>
          <p class="company-name">${stock2.name}</p>
          <p class="price">$${formatPrice(stock2.currentPrice)}</p>
          <p class="change ${change2 >= 0 ? "positive" : "negative"}">
            ${formatPercent(change2)}
          </p>
          <p class="sector">${stock2.sector}</p>
          <div class="stats">
            <div class="stat">Min: $${formatPrice(stats2.min)}</div>
            <div class="stat">Max: $${formatPrice(stats2.max)}</div>
            <div class="stat">Moy: $${formatPrice(stats2.avg)}</div>
          </div>
          <p class="volume">${history2.length} jours | Vol: ${history2[history2.length - 1]?.volume?.toLocaleString() ?? "N/A"}</p>
        </div>
      `;

      const r = calculateCorrelation(history1, history2);
      if (r !== null) {
        const interp = interpretCorrelation(r);
        const pct = Math.round(Math.abs(r) * 100);
        const commonCount = history1.filter(e =>
          history2.some((e2: { date: string }) => e2.date === e.date)
        ).length;

        html += `
          <div class="correlation-card">
            <div class="correlation-header">
              <span class="correlation-title">Corrélation sur la période</span>
              <span class="correlation-label" style="color: ${interp.color}">${interp.label}</span>
            </div>
            <div class="correlation-meter">
              <div class="meter-track">
                <div class="meter-fill" style="width: ${pct}%; background: ${interp.color};"></div>
              </div>
              <span class="correlation-value" style="color: ${interp.color}">${r >= 0 ? "+" : ""}${r.toFixed(2)}</span>
            </div>
            <p class="correlation-desc">${interp.description}</p>
            <p class="correlation-note">Calculé sur ${commonCount} jours communs</p>
          </div>
        `;
      }
    }
  }

  return html;
}

export function attachEventListeners(state: AppState): void {
  document.querySelectorAll("[data-period]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const period = (e.target as HTMLElement).getAttribute("data-period");
      if (period) {
        (window as any).appState.currentPeriod = period as TimePeriod;
        (window as any).updateApp();
      }
    });
  });

  // incohérence légère : ici on garde "btn" comme nom de variable
  document.querySelectorAll("[data-chart-type]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const chartType = (e.target as HTMLElement).getAttribute("data-chart-type");
      if (chartType) {
        (window as any).appState.currentChartType = chartType as ChartType;
        (window as any).updateApp();
      }
    });
  });

  document.querySelectorAll("[data-symbol]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const symbol = (e.target as HTMLElement).getAttribute("data-symbol");
      if (symbol) {
        (window as any).appState.selectedStock1 = symbol;
        (window as any).appState.selectedStock2 = null;
        (window as any).updateApp();
      }
    });
  });

  document.querySelectorAll("[data-compare]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const symbol = (e.target as HTMLElement).getAttribute("data-compare");
      if (symbol) {
        if ((window as any).appState.selectedStock2 === symbol) {
          (window as any).appState.selectedStock2 = null;
        } else {
          (window as any).appState.selectedStock2 = symbol;
        }
        (window as any).updateApp();
      }
    });
  });

  const exportBtn = document.getElementById("export-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      (window as any).exportCSV();
    });
  }

  const darkToggle = document.getElementById("dark-mode-toggle");
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      (window as any).toggleDarkMode();
    });
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
