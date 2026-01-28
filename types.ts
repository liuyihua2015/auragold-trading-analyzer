
export interface TradeRecord {
  id: string;
  grams: number;
  costPrice: number;
  sellingPrice: number;
  handlingFeeRate: number;
  actualProfit: number;
  desiredPrice: number;
  projectedProfit: number;
  profitMargin: number;
  timestamp: number;
}

export interface Ledger {
  id: string;
  name: string;
  records: TradeRecord[];
  createdAt: number;
}

export interface TradeSummary {
  totalProfit: number;
  totalProjectedProfit: number;
  totalGrams: number;
  avgCostPrice: number;
  profitDifference: number;
}
