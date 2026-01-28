import React, { useState, useMemo, useEffect } from "react";
import { TradeRecord, TradeSummary, Ledger } from "./types";
import { TradeForm } from "./components/TradeForm";
import { StatsCards } from "./components/StatsCards";
import { InputModal } from "./components/InputModal";
import { analyzeTrades } from "./services/geminiService";
import { translations, Language } from "./translations";

// Robust ID fallback
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `led-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
};

export default function App() {
  // Use initializer functions for faster/more robust state loading
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("auragold_lang");
    return (saved as Language) || "zh";
  });

  const t = translations[lang];

  const [ledgers, setLedgers] = useState<Ledger[]>(() => {
    const saved = localStorage.getItem("auragold_all_ledgers");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse ledgers", e);
      }
    }
    // Return initial default ledger if none exists
    const defaultId = generateId();
    return [
      {
        id: defaultId,
        name: translations["zh"].ledgers.defaultName,
        records: [],
        createdAt: Date.now(),
      },
    ];
  });

  const [activeLedgerId, setActiveLedgerId] = useState<string>(() => {
    const savedActive = localStorage.getItem("auragold_active_ledger_id");
    const savedLedgers = localStorage.getItem("auragold_all_ledgers");
    if (savedActive && savedLedgers) {
      try {
        const parsed = JSON.parse(savedLedgers);
        if (parsed.some((l: Ledger) => l.id === savedActive)) {
          return savedActive;
        }
      } catch (e) {}
    }
    return ledgers[0]?.id || "";
  });

  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "create" | "rename";
    initialValue: string;
    targetId?: string;
  }>({
    isOpen: false,
    type: "create",
    initialValue: "",
  });

  // Sync to Storage whenever state changes
  useEffect(() => {
    localStorage.setItem("auragold_all_ledgers", JSON.stringify(ledgers));
  }, [ledgers]);

  useEffect(() => {
    if (activeLedgerId) {
      localStorage.setItem("auragold_active_ledger_id", activeLedgerId);
    }
  }, [activeLedgerId]);

  useEffect(() => {
    localStorage.setItem("auragold_lang", lang);
  }, [lang]);

  const activeLedger = useMemo(
    () => ledgers.find((l) => l.id === activeLedgerId) || ledgers[0],
    [ledgers, activeLedgerId],
  );

  const summary = useMemo<TradeSummary>(() => {
    const records = activeLedger?.records || [];
    if (records.length === 0)
      return {
        totalProfit: 0,
        totalProjectedProfit: 0,
        totalGrams: 0,
        avgCostPrice: 0,
        profitDifference: 0,
      };

    const totalProfit = records.reduce(
      (acc, curr) => acc + curr.actualProfit,
      0,
    );
    const totalProjectedProfit = records.reduce(
      (acc, curr) => acc + curr.projectedProfit,
      0,
    );
    const totalGrams = records.reduce((acc, curr) => acc + curr.grams, 0);
    const avgCostPrice =
      records.reduce((acc, curr) => acc + curr.costPrice, 0) / records.length;
    const profitDifference = totalProjectedProfit - totalProfit;

    return {
      totalProfit,
      totalProjectedProfit,
      totalGrams,
      avgCostPrice,
      profitDifference,
    };
  }, [activeLedger]);

  const addRecord = (record: TradeRecord) => {
    setLedgers((prev) =>
      prev.map((l) =>
        l.id === activeLedgerId ? { ...l, records: [record, ...l.records] } : l,
      ),
    );
  };

  const removeRecord = (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      setLedgers((prev) =>
        prev.map((l) =>
          l.id === activeLedgerId
            ? { ...l, records: l.records.filter((r) => r.id !== id) }
            : l,
        ),
      );
    }
  };

  const clearActiveLedger = () => {
    if (window.confirm(t.confirmClear)) {
      setLedgers((prev) =>
        prev.map((l) => (l.id === activeLedgerId ? { ...l, records: [] } : l)),
      );
      setAiAnalysis("");
    }
  };

  const handleModalConfirm = (value: string) => {
    if (modalConfig.type === "create") {
      if (value && value.trim()) {
        const newId = generateId();
        const newLedger: Ledger = {
          id: newId,
          name: value.trim(),
          records: [],
          createdAt: Date.now(),
        };
        setLedgers((prev) => [...prev, newLedger]);
        setActiveLedgerId(newId);
      }
    } else if (modalConfig.type === "rename" && modalConfig.targetId) {
      if (value && value.trim()) {
        setLedgers((prev) =>
          prev.map((l) =>
            l.id === modalConfig.targetId ? { ...l, name: value.trim() } : l,
          ),
        );
      }
    }
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const createLedger = () => {
    setModalConfig({
      isOpen: true,
      type: "create",
      initialValue: "",
    });
  };

  const renameLedger = (id: string) => {
    const ledger = ledgers.find((l) => l.id === id);
    if (!ledger) return;

    setModalConfig({
      isOpen: true,
      type: "rename",
      initialValue: ledger.name,
      targetId: id,
    });
  };

  const deleteLedger = (id: string) => {
    const ledger = ledgers.find((l) => l.id === id);
    if (!ledger) return;

    if (window.confirm(t.confirmDeleteLedger.replace("{name}", ledger.name))) {
      const filtered = ledgers.filter((l) => l.id !== id);
      if (filtered.length === 0) {
        // Prevent deleting the last ledger
        const defaultId = generateId();
        const defaultLedger: Ledger = {
          id: defaultId,
          name: t.ledgers.defaultName,
          records: [],
          createdAt: Date.now(),
        };
        setLedgers([defaultLedger]);
        setActiveLedgerId(defaultId);
      } else {
        setLedgers(filtered);
        if (activeLedgerId === id) {
          setActiveLedgerId(filtered[0].id);
        }
      }
    }
  };

  const shareReport = () => {
    if (!activeLedger) return;
    const rt = t.report;
    const report = `
[${activeLedger.name}] ${rt.title}
-----------------------------------
- ${rt.actual}: ￥${summary.totalProfit.toFixed(2)}
- ${rt.projected}: ￥${summary.totalProjectedProfit.toFixed(2)}
- ${rt.diff}: ￥${summary.profitDifference.toFixed(2)}
- ${rt.volume}: ${summary.totalGrams.toFixed(2)}g
- ${rt.count}: ${activeLedger.records.length}
-----------------------------------
${rt.date}: ${new Date().toLocaleString()}
    `.trim();

    navigator.clipboard.writeText(report).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    });
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeTrades(activeLedger?.records || [], lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "zh" : "en"));
  };

  return (
    <div className="min-h-screen pb-20 p-4 md:p-8 max-w-7xl mx-auto selection:bg-amber-500/30 flex flex-col lg:flex-row gap-8">
      {/* Sidebar/Ledger Selector */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sticky top-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-amber-500 text-xs font-black uppercase tracking-widest">
              {t.ledgers.title}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                createLedger();
              }}
              className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-amber-500 bg-slate-900 shadow-sm"
              title={t.ledgers.newLedger}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {ledgers.map((l) => (
              <div
                key={l.id}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeLedgerId === l.id ? "bg-amber-500/10 border-amber-500/50" : "bg-slate-900 border-transparent hover:border-slate-600"}`}
                onClick={() => setActiveLedgerId(l.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-2 h-2 flex-shrink-0 rounded-full ${activeLedgerId === l.id ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "bg-slate-700"}`}
                  ></div>
                  <span
                    className={`text-sm font-bold truncate ${activeLedgerId === l.id ? "text-amber-100" : "text-slate-400"}`}
                  >
                    {l.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      renameLedger(l.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-amber-400 transition-all"
                    title={t.ledgers.rename}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLedger(l.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-all"
                    title={t.ledgers.delete}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-slate-900 font-black text-xs">AG</span>
              </div>
              <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                AuraGold{" "}
                <span className="text-slate-500 font-light text-xl italic tracking-tighter">
                  {t.terminal}
                </span>
              </h1>
            </div>
            <p className="text-slate-400 font-medium text-sm tracking-wide">
              {t.subHeader}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={shareReport}
              className="flex items-center bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-emerald-500 transition-colors shadow-lg gap-2"
            >
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              {t.shareBtn}
            </button>

            <button
              onClick={toggleLanguage}
              className="flex items-center bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-amber-500 transition-colors shadow-lg"
            >
              {lang === "en" ? t.langEn : t.langZh}
            </button>

            <button
              onClick={clearActiveLedger}
              className="text-slate-500 hover:text-rose-400 text-xs font-bold uppercase tracking-widest transition-colors p-2"
            >
              {t.clearData}
            </button>

            <button
              onClick={runAnalysis}
              disabled={
                !activeLedger ||
                activeLedger.records.length === 0 ||
                isAnalyzing
              }
              className="flex items-center bg-slate-800 hover:bg-slate-700 border border-slate-600 px-6 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95"
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t.processing}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="text-amber-500">✨</span> {t.strategyInsight}
                </span>
              )}
            </button>
          </div>
        </header>

        <StatsCards summary={summary} lang={lang} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            <TradeForm onAdd={addRecord} lang={lang} />

            {aiAnalysis && (
              <div className="bg-slate-800/80 backdrop-blur-md border border-amber-500/20 p-6 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-amber-500 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    {t.analystReport}
                  </h4>
                  <button
                    onClick={() => setAiAnalysis("")}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-700 bg-slate-800/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">
                    {activeLedger?.name || t.ledger}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    {t.ledgerSub}
                  </p>
                </div>
                <span className="bg-slate-700 text-amber-500 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter">
                  {activeLedger?.records.length || 0} {t.transactions}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/30 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4 border-b border-slate-700">
                        {t.table.timeline}
                      </th>
                      <th className="px-6 py-4 border-b border-slate-700 text-center">
                        {t.table.volume}
                      </th>
                      <th className="px-6 py-4 border-b border-slate-700">
                        {t.table.rate}
                      </th>
                      <th className="px-6 py-4 border-b border-slate-700">
                        {t.table.actualNet}
                      </th>
                      <th className="px-6 py-4 border-b border-slate-700">
                        {t.table.projectedNet}
                      </th>
                      <th className="px-6 py-4 border-b border-slate-700"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {(activeLedger?.records || []).map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-700/40 transition-all group"
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-slate-300 font-semibold">
                            {new Date(record.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(record.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="text-sm font-black text-amber-400/80">
                            {record.grams.toFixed(2)}g
                          </div>
                          <div className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">
                            {(record.handlingFeeRate * 100).toFixed(2)}%{" "}
                            {t.table.fee}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-rose-400 font-mono">
                              {t.table.cost}: ${record.costPrice.toFixed(2)}
                            </span>
                            <span className="text-xs text-emerald-400 font-mono font-bold">
                              {t.table.sell}: ${record.sellingPrice.toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div
                            className={`text-sm font-black font-mono ${record.actualProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                          >
                            $
                            {record.actualProfit.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter opacity-70">
                              {t.table.target}: $
                              {record.desiredPrice.toFixed(2)}
                            </span>
                            <span className="text-sm font-black text-blue-300 font-mono">
                              $
                              {record.projectedProfit.toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => removeRecord(record.id)}
                            className="text-slate-600 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-110"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!activeLedger || activeLedger.records.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center opacity-40">
                            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1m3.12-1.45a2.35 2.35 0 010-4.51m-6.24 4.51a2.35 2.35 0 010-4.51"
                                />
                              </svg>
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                              {t.noRecords}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-emerald-500 text-slate-900 px-6 py-3 rounded-2xl font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-50 flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {t.copied}
        </div>
      )}

      <InputModal
        isOpen={modalConfig.isOpen}
        title={
          modalConfig.type === "create" ? t.ledgers.newLedger : t.ledgers.rename
        }
        initialValue={modalConfig.initialValue}
        placeholder={
          modalConfig.type === "create"
            ? t.ledgers.placeholder
            : t.ledgers.renamePlaceholder
        }
        onConfirm={handleModalConfirm}
        onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        confirmText={t.ledgers.confirm}
        cancelText={t.ledgers.cancel}
      />
    </div>
  );
}
