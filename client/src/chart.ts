import { ChartType, ChartData } from "./types";

declare const Chart: any;

let chartInstance: any = null;

export function updateChart(data: ChartData, chartType: ChartType): void {
  const canvas = document.getElementById("chart") as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const isScatter = chartType === "scatter";

  const datasets = data.datasets.map((dataset) => {
    if (isScatter) {
      const scatterData = data.labels.map((label, i) => ({
        x: label,
        y: dataset.data[i],
      }));
      return {
        label: dataset.label,
        data: scatterData,
        backgroundColor: dataset.borderColor,
        borderColor: dataset.borderColor,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    }

    if (chartType === "bar") {
      return {
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor,
        borderColor: dataset.borderColor,
        borderWidth: 0,
        borderRadius: 4,
      };
    }

    return {
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.borderColor,
      backgroundColor: dataset.backgroundColor,
      borderWidth: 2,
      tension: 0.4,
      fill: chartType === "area",
      pointRadius: 0,
      pointHoverRadius: 5,
      pointBackgroundColor: dataset.borderColor,
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
    };
  });

  const chartJsType =
    isScatter ? "scatter" : chartType === "area" ? "line" : chartType;

  const isDark = document.documentElement.classList.contains("dark");
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(200,200,200,0.15)";
  const tickColor = isDark ? "#94a3b8" : "#6b7280";
  const tooltipBg = isDark ? "rgba(15,23,42,0.95)" : "rgba(0,0,0,0.85)";

  const scales: any = {
    y: {
      beginAtZero: false,
      ticks: {
        callback: function(value: number) {
          return "$" + value.toFixed(0);
        },
        font: { size: 11 },
        color: tickColor,
      },
      grid: { color: gridColor },
    },
    x: {
      ticks: {
        font: { size: 10 },
        maxRotation: 45,
        minRotation: 0,
        maxTicksLimit: 12,
        color: tickColor,
      },
      grid: { display: false },
    },
  };

  if (isScatter) {
    scales.x = {
      type: "category",
      ticks: { font: { size: 10 }, maxRotation: 45, maxTicksLimit: 12, color: tickColor },
      grid: { display: false },
    };
  }

  chartInstance = new Chart(ctx, {
    type: chartJsType,
    data: {
      labels: isScatter ? undefined : data.labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
          labels: {
            font: { size: 12, weight: "500" as const },
            padding: 15,
            usePointStyle: true,
            color: tickColor,
          },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          padding: 12,
          titleFont: { size: 13, weight: "bold" as const },
          bodyFont: { size: 12 },
          borderColor: "#ddd",
          borderWidth: 1,
          callbacks: {
            label: function(context: any) {
              const v = context.parsed.y;
              return `${context.dataset.label}: $${v.toFixed(2)}`;
            },
          },
        },
      },
      scales,
    },
  });
}

export function destroyChart(): void {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}
