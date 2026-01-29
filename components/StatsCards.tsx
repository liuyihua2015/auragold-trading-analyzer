import React from "react";
import { TradeSummary } from "../types";
import { translations, Language } from "../translations";

interface StatsCardsProps {
  summary: TradeSummary;
  lang: Language;
  onNewTrade?: () => void;
  newTradeDisabled?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  summary,
  lang,
  onNewTrade,
  newTradeDisabled,
}) => {
  const t = translations[lang].stats;
  const tf = translations[lang].form;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <button
        type="button"
        onClick={onNewTrade}
        disabled={!onNewTrade || newTradeDisabled}
        className="bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-slate-900 border border-transparent p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] text-left"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-slate-900/80 text-[10px] font-black uppercase tracking-widest">
            {tf.newTrade}
          </p>
          <div className="p-2 bg-black/10 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-black tracking-tight">
          {lang === "zh" ? "添加一笔" : "Add Trade"}
        </div>
      </button>

      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl hover:border-[var(--accent)]/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest">
            {t.totalProfit}
          </p>
          <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-[var(--accent)]"
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
        <h3 className="text-3xl font-bold text-[var(--accent)] font-mono tracking-tight">
          ￥
          {summary.totalProfit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl hover:border-[var(--info)]/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest">
            {t.projectedTotal}
          </p>
          <div className="p-2 bg-[var(--info)]/10 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-[var(--info)]"
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
        <h3 className="text-3xl font-bold text-[var(--info)] font-mono tracking-tight">
          ￥
          {summary.totalProjectedProfit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--border)] p-6 rounded-2xl shadow-xl hover:border-[var(--success)]/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest">
            {t.profitVariance}
          </p>
          <div
            className={`p-2 rounded-lg ${summary.profitDifference >= 0 ? "bg-[var(--success)]/10" : "bg-[var(--danger)]/10"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${summary.profitDifference >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
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
          className={`text-3xl font-bold font-mono tracking-tight ${summary.profitDifference >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
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
          ￥
          {summary.avgCostPrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>
    </div>
  );
};
