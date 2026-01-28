import React, { useState } from "react";
import { TradeRecord } from "../types";
import { translations, Language } from "../translations";

// Robust ID fallback
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `rec-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
};

interface TradeFormProps {
  onAdd: (record: TradeRecord) => void;
  lang: Language;
}

export const TradeForm: React.FC<TradeFormProps> = ({ onAdd, lang }) => {
  const t = translations[lang].form;
  const [formData, setFormData] = useState({
    grams: "0",
    costPrice: "0",
    sellingPrice: "0",
    handlingFeeRate: "0.004",
    desiredPrice: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const g = parseFloat(formData.grams);
    const cp = parseFloat(formData.costPrice);
    const sp = parseFloat(formData.sellingPrice);
    const hfr = parseFloat(formData.handlingFeeRate);
    const dp = parseFloat(formData.desiredPrice) || sp;

    if (isNaN(g) || isNaN(cp) || isNaN(sp) || g < 0 || cp < 0 || sp < 0) return;

    const actualProfit = g * (sp - cp) - sp * hfr * g;
    const projectedProfit = g * (dp - cp) - dp * hfr * g;
    const margin = (actualProfit / (g * cp)) * 100;

    const newRecord: TradeRecord = {
      id: generateId(),
      grams: g,
      costPrice: cp,
      sellingPrice: sp,
      handlingFeeRate: hfr,
      actualProfit,
      desiredPrice: dp,
      projectedProfit,
      profitMargin: margin,
      timestamp: Date.now(),
    };

    onAdd(newRecord);
    setFormData({
      grams: "",
      costPrice: "",
      sellingPrice: "",
      handlingFeeRate: "0.004",
      desiredPrice: "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val < 0) return;
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
      <h2 className="text-xl font-bold text-amber-500 mb-6 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
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
        {t.newTrade}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              {t.grams}
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.0001"
              name="grams"
              value={formData.grams}
              onChange={handleChange}
              placeholder="5.00"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              {t.feeRate}
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.0001"
              name="handlingFeeRate"
              value={formData.handlingFeeRate}
              onChange={handleChange}
              placeholder="0.004"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              {t.costPrice}
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleChange}
              placeholder="1102.85"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              {t.sellingPrice}
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleChange}
              placeholder="1128.37"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            {t.targetPrice}
          </label>
          <input
            type="number"
            step="0.01"
            name="desiredPrice"
            value={formData.desiredPrice}
            onChange={handleChange}
            placeholder={t.targetPlaceholder}
            className="w-full bg-slate-900 border border-blue-500/30 rounded-xl px-4 py-3 text-blue-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path
              fillRule="evenodd"
              d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
              clipRule="evenodd"
            />
          </svg>
          {t.recordBtn}
        </button>
      </form>
    </div>
  );
};
