import React from "react";
import { TradeSummary } from "../types";
import { translations, Language } from "../translations";

interface StatsCardsProps {
  summary: TradeSummary;
  lang: Language;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ summary, lang }) => {
  const t = translations[lang].stats;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl hover:border-amber-500/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest">
            {t.totalProfit}
          </p>
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1m3.12-1.45a2.35 2.35 0 010-4.51m-6.24 4.51a2.35 2.35 0 010-4.51"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-3xl font-bold text-amber-500 font-mono tracking-tight">
          ￥
          {summary.totalProfit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl hover:border-blue-500/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest">
            {t.projectedTotal}
          </p>
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-3xl font-bold text-blue-400 font-mono tracking-tight">
          ￥
          {summary.totalProjectedProfit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl hover:border-emerald-500/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest">
            {t.profitVariance}
          </p>
          <div
            className={`p-2 rounded-lg ${summary.profitDifference >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${summary.profitDifference >= 0 ? "text-emerald-400" : "text-rose-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>
        <h3
          className={`text-3xl font-bold font-mono tracking-tight ${summary.profitDifference >= 0 ? "text-emerald-400" : "text-rose-400"}`}
        >
          {summary.profitDifference >= 0 ? "+" : ""}￥
          {summary.profitDifference.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl hover:border-[var(--border-2)] transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest">
            {t.avgCost}
          </p>
          <div className="p-2 bg-[var(--panel-2)] rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-[var(--muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-3xl font-bold text-[var(--text)] font-mono tracking-tight">
          $
          {summary.avgCostPrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>
    </div>
  );
};
