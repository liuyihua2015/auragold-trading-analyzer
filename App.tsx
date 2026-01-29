import React, { useState, useMemo, useEffect, useRef } from "react";
import { TradeRecord, TradeSummary, Ledger } from "./types";
import { TradeForm } from "./components/TradeForm";
import { StatsCards } from "./components/StatsCards";
import { InputModal } from "./components/InputModal";
import { ConfirmModal } from "./components/ConfirmModal";
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

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("auragold_theme");
    if (saved === "light" || saved === "dark") return saved;
    const systemDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemDark ? "dark" : "light";
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
        if (
          savedActive === "master" ||
          parsed.some((l: Ledger) => l.id === savedActive)
        ) {
          return savedActive;
        }
      } catch (e) {}
    }
    return ledgers[0]?.id || "";
  });

  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isHistoryFullscreen, setIsHistoryFullscreen] = useState(false);
  const [isLedgerMenuOpen, setIsLedgerMenuOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const ledgerMenuRef = useRef<HTMLDivElement | null>(null);

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
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    targetId?: string;
  }>({
    isOpen: false,
  });
  const [clearModal, setClearModal] = useState<{ isOpen: boolean }>({
    isOpen: false,
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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("auragold_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isLedgerMenuOpen) return;
    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      const el = ledgerMenuRef.current;
      if (!el) return;
      if (event.target instanceof Node && !el.contains(event.target)) {
        setIsLedgerMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [isLedgerMenuOpen]);

  const activeLedger = useMemo(
    () => ledgers.find((l) => l.id === activeLedgerId) || ledgers[0],
    [ledgers, activeLedgerId],
  );

  const summary = useMemo<TradeSummary>(() => {
    const records =
      activeLedgerId === "master"
        ? ledgers.flatMap((l) => l.records)
        : activeLedger?.records || [];
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
  }, [activeLedger, activeLedgerId, ledgers]);

  const addRecord = (record: TradeRecord) => {
    if (activeLedgerId === "master") return;
    setLedgers((prev) =>
      prev.map((l) =>
        l.id === activeLedgerId ? { ...l, records: [record, ...l.records] } : l,
      ),
    );
  };

  const removeRecord = (id: string) => {
    setLedgers((prev) =>
      prev.map((l) =>
        l.id === activeLedgerId
          ? { ...l, records: l.records.filter((r) => r.id !== id) }
          : l,
      ),
    );
  };

  const clearActiveLedger = () => {
    if (activeLedgerId === "master") return;
    setLedgers((prev) =>
      prev.map((l) => (l.id === activeLedgerId ? { ...l, records: [] } : l)),
    );
    setAiAnalysis("");
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
    const rt = t.report;
    const name =
      activeLedgerId === "master"
        ? t.ledgers.masterName
        : activeLedger?.name || t.ledger;
    const count =
      activeLedgerId === "master"
        ? ledgers.reduce((acc, l) => acc + l.records.length, 0)
        : activeLedger?.records.length || 0;
    const report = `
[${name}] ${rt.title}
-----------------------------------
- ${rt.actual}: ￥${summary.totalProfit.toFixed(2)}
- ${rt.projected}: ￥${summary.totalProjectedProfit.toFixed(2)}
- ${rt.diff}: ￥${summary.profitDifference.toFixed(2)}
- ${rt.volume}: ${summary.totalGrams.toFixed(2)}g
- ${rt.count}: ${count}
-----------------------------------
${rt.date}: ${new Date().toLocaleString()}
    `.trim();

    navigator.clipboard.writeText(report).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    });
  };

  const runAnalysis = async () => {
    if (activeLedgerId === "master") return;
    setIsAnalyzing(true);
    const result = await analyzeTrades(activeLedger?.records || [], lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "zh" : "en"));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div
      className={`min-h-screen selection:bg-[var(--accent)]/30 flex flex-col ${isHistoryFullscreen ? "gap-6 p-3 md:p-6 w-full" : "gap-8 pb-20 p-4 md:p-8 w-full"}`}
    >
      <main
        className={`flex-1 min-w-0 ${isHistoryFullscreen ? "flex flex-col min-h-[calc(100vh-48px)]" : ""}`}
      >
        {isHistoryFullscreen ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsHistoryFullscreen(false)}
                className="bg-[var(--panel)] border border-[var(--border)] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors shadow-lg flex-shrink-0"
              >
                {lang === "zh" ? "退出全屏" : "Exit Fullscreen"}
              </button>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[var(--text)] truncate">
                  {activeLedgerId === "master"
                    ? t.ledgers.masterName
                    : activeLedger?.name || t.ledger}
                </div>
                <div className="text-[10px] text-[var(--muted-2)] font-mono truncate">
                  {t.ledgerSub}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center bg-[var(--panel)] border border-[var(--border)] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors shadow-lg"
                title={theme === "dark" ? t.themeLight : t.themeDark}
              >
                {theme === "dark" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 15a5 5 0 100-10 5 5 0 000 10z" />
                    <path
                      fillRule="evenodd"
                      d="M10 1a.75.75 0 01.75.75V3a.75.75 0 01-1.5 0V1.75A.75.75 0 0110 1zm0 16a.75.75 0 01.75.75V19a.75.75 0 01-1.5 0v-1.25A.75.75 0 0110 17zM3.636 3.636a.75.75 0 011.06 0l.884.884a.75.75 0 11-1.06 1.06l-.884-.884a.75.75 0 010-1.06zm10.784 10.784a.75.75 0 011.06 0l.884.884a.75.75 0 11-1.06 1.06l-.884-.884a.75.75 0 010-1.06zM1 10a.75.75 0 01.75-.75H3a.75.75 0 010 1.5H1.75A.75.75 0 011 10zm16 0a.75.75 0 01.75-.75H19a.75.75 0 010 1.5h-1.25A.75.75 0 0117 10zM3.636 16.364a.75.75 0 010-1.06l.884-.884a.75.75 0 111.06 1.06l-.884.884a.75.75 0 01-1.06 0zM14.42 5.58a.75.75 0 010-1.06l.884-.884a.75.75 0 111.06 1.06l-.884.884a.75.75 0 01-1.06 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8 8 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center bg-[var(--panel)] border border-[var(--border)] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors shadow-lg"
              >
                {lang === "en" ? t.langEn : t.langZh}
              </button>
            </div>
          </div>
        ) : (
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)] rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-slate-900 font-black text-xs">AG</span>
                </div>
                <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[var(--brand-from)] via-[var(--accent)] to-[var(--brand-to)]">
                  AuraGold{" "}
                  <span className="text-[var(--muted-2)] font-light text-xl italic tracking-tighter">
                    {t.terminal}
                  </span>
                </h1>
              </div>
              <p className="text-[var(--muted)] font-medium text-sm tracking-wide">
                {t.subHeader}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div ref={ledgerMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsLedgerMenuOpen((v) => !v)}
                  className="flex items-center bg-[var(--panel)] border border-[var(--border)] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors shadow-lg gap-2"
                  title={lang === "zh" ? "切换账本" : "Switch ledger"}
                >
                  <span className="max-w-[180px] truncate">
                    {activeLedgerId === "master"
                      ? t.ledgers.masterName
                      : activeLedger?.name || t.ledger}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {isLedgerMenuOpen && (
                  <div className="absolute left-0 mt-2 w-[320px] max-w-[calc(100vw-2rem)] bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-30">
                    <div className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--muted-2)] border-b border-[var(--border)]">
                      {t.ledgers.title}
                    </div>
                    <div className="max-h-[50vh] overflow-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLedgerId("master");
                          setIsLedgerMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                          activeLedgerId === "master"
                            ? "bg-[var(--accent)]/10"
                            : "hover:bg-[var(--row-hover)]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              activeLedgerId === "master"
                                ? "bg-[var(--accent)]"
                                : "bg-[var(--border-2)]"
                            }`}
                          />
                          <span className="text-sm font-bold truncate text-[var(--text)]">
                            {t.ledgers.masterName}
                          </span>
                        </div>
                      </button>
                      {ledgers.map((l) => (
                        <div
                          key={l.id}
                          className={`group w-full px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                            activeLedgerId === l.id
                              ? "bg-[var(--accent)]/10"
                              : "hover:bg-[var(--row-hover)]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveLedgerId(l.id);
                              setIsLedgerMenuOpen(false);
                            }}
                            className="flex items-center gap-3 min-w-0 flex-1 text-left"
                          >
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                activeLedgerId === l.id
                                  ? "bg-[var(--accent)]"
                                  : "bg-[var(--border-2)]"
                              }`}
                            />
                            <span className="text-sm font-bold truncate text-[var(--text)]">
                              {l.name}
                            </span>
                          </button>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsLedgerMenuOpen(false);
                                renameLedger(l.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted-2)] hover:text-[var(--accent)] transition-all"
                              title={t.ledgers.rename}
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
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsLedgerMenuOpen(false);
                                deleteLedger(l.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted-2)] hover:text-[var(--danger)] transition-all"
                              title={t.ledgers.delete}
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-[var(--border)] p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLedgerMenuOpen(false);
                          createLedger();
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-[var(--panel-2)] border border-[var(--border)] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {t.ledgers.newLedger}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={shareReport}
                className="flex items-center bg-[var(--panel)] border border-[var(--border)] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors shadow-lg gap-2"
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
                onClick={toggleTheme}
                className="flex items-center bg-[var(--panel)] border border-[var(--border)] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors shadow-lg"
                title={theme === "dark" ? t.themeLight : t.themeDark}
              >
                {theme === "dark" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 15a5 5 0 100-10 5 5 0 000 10z" />
                    <path
                      fillRule="evenodd"
                      d="M10 1a.75.75 0 01.75.75V3a.75.75 0 01-1.5 0V1.75A.75.75 0 0110 1zm0 16a.75.75 0 01.75.75V19a.75.75 0 01-1.5 0v-1.25A.75.75 0 0110 17zM3.636 3.636a.75.75 0 011.06 0l.884.884a.75.75 0 11-1.06 1.06l-.884-.884a.75.75 0 010-1.06zm10.784 10.784a.75.75 0 011.06 0l.884.884a.75.75 0 11-1.06 1.06l-.884-.884a.75.75 0 010-1.06zM1 10a.75.75 0 01.75-.75H3a.75.75 0 010 1.5H1.75A.75.75 0 011 10zm16 0a.75.75 0 01.75-.75H19a.75.75 0 010 1.5h-1.25A.75.75 0 0117 10zM3.636 16.364a.75.75 0 010-1.06l.884-.884a.75.75 0 111.06 1.06l-.884.884a.75.75 0 01-1.06 0zM14.42 5.58a.75.75 0 010-1.06l.884-.884a.75.75 0 111.06 1.06l-.884.884a.75.75 0 01-1.06 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8 8 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              <button
                onClick={toggleLanguage}
                className="flex items-center bg-[var(--panel)] border border-[var(--border)] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors shadow-lg"
              >
                {lang === "en" ? t.langEn : t.langZh}
              </button>

              <button
                onClick={runAnalysis}
                disabled={
                  activeLedgerId === "master" ||
                  !activeLedger ||
                  activeLedger.records.length === 0 ||
                  isAnalyzing
                }
                className="flex items-center bg-[var(--panel)] hover:bg-[var(--row-hover)] border border-[var(--border-2)] px-6 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-[var(--accent)]"
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-[var(--accent)]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l1.5 3.5L17 7l-3.5 1.5L12 12l-1.5-3.5L7 7l3.5-1.5L12 2zm0 8l1 2.5L15.5 13 13 14.5 12 17l-1-2.5L8.5 13 11 12.5 12 10z" />
                    </svg>{" "}
                    {t.strategyInsight}
                  </span>
                )}
              </button>
            </div>
          </header>
        )}

        {!isHistoryFullscreen && (
          <StatsCards
            summary={summary}
            lang={lang}
            onNewTrade={() => setIsTradeModalOpen(true)}
            newTradeDisabled={activeLedgerId === "master"}
          />
        )}

        <div
          className={
            isHistoryFullscreen ? "flex-1 min-h-0 flex flex-col" : "space-y-6"
          }
        >
          <div
            className={
              isHistoryFullscreen ? "flex-1 min-h-0 flex flex-col" : ""
            }
          >
            <div
              className={`bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-0 ${isHistoryFullscreen ? "flex-1" : ""}`}
            >
              <div className="p-6 border-b border-[var(--border)] bg-[var(--panel)] flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text)]">
                    {activeLedgerId === "master"
                      ? t.ledgers.masterName
                      : activeLedger?.name || t.ledger}
                  </h2>
                  <p className="text-xs text-[var(--muted-2)] font-mono">
                    {t.ledgerSub}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsHistoryFullscreen((v) => !v)}
                    className="bg-[var(--panel-2)] border border-[var(--border)] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    {isHistoryFullscreen
                      ? lang === "zh"
                        ? "退出全屏"
                        : "Exit"
                      : lang === "zh"
                        ? "全屏"
                        : "Fullscreen"}
                  </button>
                  <span className="bg-[var(--chip-bg)] text-[var(--accent-2)] text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter">
                    {activeLedgerId === "master"
                      ? ledgers.reduce((acc, l) => acc + l.records.length, 0)
                      : activeLedger?.records.length || 0}{" "}
                    {t.transactions}
                  </span>
                </div>
              </div>

              {activeLedgerId === "master" && (
                <div className="p-6">
                  <p className="text-[var(--muted)] text-sm">
                    {lang === "zh"
                      ? "总账本仅展示所有账本统计，不支持添加或编辑记录。"
                      : "Master ledger shows global stats only; adding or editing records is disabled."}
                  </p>
                </div>
              )}

              {activeLedgerId !== "master" && (
                <div
                  className={`${isHistoryFullscreen ? "flex-1 min-h-0 overflow-auto" : "overflow-x-auto max-h-[70vh] overflow-y-auto"} scroll-smooth`}
                >
                  <table className="min-w-[1440px] w-full text-center border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: "160px" }} />
                      <col style={{ width: "160px" }} />
                      <col style={{ width: "160px" }} />
                      <col style={{ width: "160px" }} />
                      <col style={{ width: "160px" }} />
                      <col style={{ width: "160px" }} />
                      <col style={{ width: "160px" }} />
                      <col style={{ width: "160px" }} />
                      <col style={{ width: "160px" }} />
                    </colgroup>
                    <thead className="sticky top-0 z-10 bg-[var(--panel-2)]">
                      <tr className="text-[var(--muted-2)] text-[10px] md:text-[11px] font-black uppercase tracking-widest text-center">
                        <th className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] text-center">
                          {lang === "zh" ? "序号" : "#"}
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] text-center">
                          {t.table.timeline}
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] text-center">
                          {t.table.volume}
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] text-center">
                          {t.table.cost}
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] text-center">
                          {t.table.sell}
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] text-center">
                          {t.table.fee}
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] text-center">
                          {t.table.actualNet}
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] text-center">
                          {t.table.projectedNet}
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] text-center">
                          {lang === "zh" ? "操作" : "Action"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {(activeLedger?.records || []).map((record, index) => {
                        const feeAmount =
                          record.sellingPrice *
                          record.handlingFeeRate *
                          record.grams;
                        return (
                          <tr
                            key={record.id}
                            className="hover:bg-[var(--row-hover)] transition-all group text-xs md:text-sm"
                          >
                            <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                              <span className="text-sm font-black text-[var(--muted)] font-mono">
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                              <div className="text-sm text-[var(--text)] font-semibold">
                                {new Date(
                                  record.timestamp,
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-[10px] text-[var(--muted-2)] font-mono">
                                {new Date(record.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                              <div className="text-sm font-black text-[var(--accent)]">
                                {record.grams.toFixed(2)}g
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                              <div className="text-sm font-black text-[var(--danger)] font-mono">
                                ￥{record.costPrice.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                              <div className="text-sm font-black text-[var(--success)] font-mono">
                                ￥{record.sellingPrice.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-sm font-black text-[var(--muted)] font-mono">
                                  ￥
                                  {feeAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                <span className="text-[10px] text-[var(--muted-2)] uppercase font-bold tracking-tighter">
                                  {(record.handlingFeeRate * 100).toFixed(2)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                              <div
                                className={`text-sm font-black font-mono ${record.actualProfit >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                              >
                                ￥
                                {record.actualProfit.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[10px] text-[var(--info)] font-bold uppercase tracking-tighter opacity-70">
                                  {t.table.target}: ￥
                                  {record.desiredPrice.toFixed(2)}
                                </span>
                                <span className="text-sm font-black text-[var(--info)] font-mono">
                                  ￥
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
                            <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    isOpen: true,
                                    targetId: record.id,
                                  })
                                }
                                className="text-[var(--muted-2)] hover:text-[var(--danger)] p-2 opacity-100 transition-all scale-90 hover:scale-110"
                                aria-label={
                                  lang === "zh" ? "删除记录" : "Delete record"
                                }
                                title={t.confirmDelete}
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
                        );
                      })}
                      {(!activeLedger || activeLedger.records.length === 0) && (
                        <tr>
                          <td colSpan={9} className="px-6 py-24 text-center">
                            <div className="flex flex-col items-center opacity-40">
                              <div className="w-16 h-16 bg-[var(--panel-2)] rounded-full flex items-center justify-center mb-4">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-8 w-8 text-[var(--muted)]"
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
                              <p className="text-[var(--muted)] font-bold uppercase tracking-widest text-xs">
                                {t.noRecords}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          {!isHistoryFullscreen && aiAnalysis && (
            <div className="bg-[var(--panel)] border border-[var(--accent)]/30 p-6 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[var(--accent)] font-black text-sm uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse"></span>
                  {t.analystReport}
                </h4>
                <button
                  onClick={() => setAiAnalysis("")}
                  className="text-[var(--muted-2)] hover:text-[var(--text)]"
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
              <div className="text-sm text-[var(--muted)] leading-relaxed font-medium whitespace-pre-wrap">
                {aiAnalysis}
              </div>
            </div>
          )}
        </div>
      </main>

      {isTradeModalOpen && activeLedgerId !== "master" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsTradeModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl">
            <button
              type="button"
              onClick={() => setIsTradeModalOpen(false)}
              className="absolute -top-3 -right-3 bg-[var(--panel)] border border-[var(--border)] p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] shadow-xl"
              aria-label={lang === "zh" ? "关闭" : "Close"}
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
            <TradeForm
              onAdd={addRecord}
              lang={lang}
              onSubmitted={() => setIsTradeModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-[var(--success)] text-slate-900 px-6 py-3 rounded-2xl font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-50 flex items-center gap-3">
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
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={lang === "zh" ? "删除交易记录" : "Delete Trade Record"}
        message={t.confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false })}
        onConfirm={() => {
          if (deleteModal.targetId) removeRecord(deleteModal.targetId);
          setDeleteModal({ isOpen: false });
        }}
        confirmText={t.ledgers.confirm}
        cancelText={t.ledgers.cancel}
      />
      <ConfirmModal
        isOpen={clearModal.isOpen}
        title={lang === "zh" ? "清空当前账本" : "Clear Current Ledger"}
        message={t.confirmClear}
        onCancel={() => setClearModal({ isOpen: false })}
        onConfirm={() => {
          setClearModal({ isOpen: false });
          clearActiveLedger();
        }}
        confirmText={t.ledgers.confirm}
        cancelText={t.ledgers.cancel}
      />
    </div>
  );
}
