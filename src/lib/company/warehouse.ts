/** Halden's data warehouse. Small tables, real-looking numbers. */
export interface Table {
  name: string;
  description: string;
  columns: string[];
  rows: (string | number)[][];
}

const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const fy24Margin = [39.2, 38.7, 40.1, 40.6, 41.0, 41.3, 41.8, 42.4, 41.1, 43.0, 44.2, 43.6];
const fy24Revenue = [1.62, 1.48, 1.91, 2.05, 2.21, 2.34, 2.12, 2.28, 2.67, 3.41, 3.96, 3.58];
const fy25Margin = [40.4, 40.1, 41.2, 41.9, 42.3, 42.0, 42.6, 43.1];
const fy25Revenue = [1.79, 1.66, 2.08, 2.24, 2.41, 2.55, 2.31, 2.49];

function fin(): (string | number)[][] {
  const rows: (string | number)[][] = [];
  fy24Margin.forEach((m, i) => {
    const rev = Math.round(fy24Revenue[i] * 1_000_000);
    rows.push([`2024-${months[i]}`, rev, Math.round(rev * (1 - m / 100)), m, Math.round(rev * 0.29)]);
  });
  fy25Margin.forEach((m, i) => {
    const rev = Math.round(fy25Revenue[i] * 1_000_000);
    rows.push([`2025-${months[i]}`, rev, Math.round(rev * (1 - m / 100)), m, Math.round(rev * 0.28)]);
  });
  return rows;
}

export const TABLES: Table[] = [
  {
    name: "monthly_financials",
    description: "Revenue, cost of goods, gross margin % and operating expenses by month (USD).",
    columns: ["month", "revenue_usd", "cogs_usd", "gross_margin_pct", "opex_usd"],
    rows: fin(),
  },
  {
    name: "products",
    description: "Active SKUs with list price and units sold year to date.",
    columns: ["sku", "name", "category", "msrp_usd", "units_ytd"],
    rows: [
      ["HP-40", "Traverse 40 pack", "Packs", 189, 8420],
      ["HP-55", "Traverse 55 pack", "Packs", 229, 5110],
      ["HT-2", "Cairn 2 tent", "Tents", 379, 2960],
      ["HT-3", "Cairn 3 tent", "Tents", 449, 1740],
      ["HJ-RL", "Ridgeline jacket", "Layers", 249, 6230],
      ["HJ-FL", "Fell fleece", "Layers", 129, 9875],
      ["HA-BT", "Bothy bottle 1L", "Accessories", 29, 21400],
    ],
  },
  {
    name: "regional_sales",
    description: "Revenue by region and quarter (USD).",
    columns: ["region", "quarter", "revenue_usd"],
    rows: [
      ["Pacific Northwest", "2025-Q1", 2_240_000],
      ["Mountain West", "2025-Q1", 1_610_000],
      ["Northeast", "2025-Q1", 1_120_000],
      ["Online (direct)", "2025-Q1", 560_000],
      ["Pacific Northwest", "2025-Q2", 2_910_000],
      ["Mountain West", "2025-Q2", 2_030_000],
      ["Northeast", "2025-Q2", 1_480_000],
      ["Online (direct)", "2025-Q2", 780_000],
      ["Pacific Northwest", "2025-Q3 (to date)", 1_960_000],
      ["Mountain West", "2025-Q3 (to date)", 1_390_000],
      ["Northeast", "2025-Q3 (to date)", 940_000],
      ["Online (direct)", "2025-Q3 (to date)", 510_000],
    ],
  },
  {
    name: "suppliers",
    description: "Key suppliers and open purchase orders.",
    columns: ["supplier", "country", "category", "open_po_usd", "next_delivery"],
    rows: [
      ["Bergstrom Textiles", "Sweden", "Shell fabric", 412_000, "2026-10-24 (delayed)"],
      ["Verdant Mills", "Vietnam", "Shell fabric (candidate)", 0, "sample pending"],
      ["Kowa Down", "Japan", "Insulation", 188_000, "2026-09-12"],
      ["Northline Zips", "USA", "Hardware", 42_000, "2026-09-05"],
    ],
  },
];

export function tableToCsv(t: Table): string {
  return [t.columns.join(","), ...t.rows.map((r) => r.join(","))].join("\n");
}
