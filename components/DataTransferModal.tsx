import React, { useEffect, useMemo, useRef, useState } from "react";
import { Ledger } from "../types";

export type ImportAllMode = "merge" | "replace";
export type ImportLedgerMode = "asNew" | "replace";

export type DataTransferI18n = {
  title: string;
  subtitle: string;
  allTitle: string;
  ledgerTitle: string;
  exportAll: string;
  chooseFile: string;
  importMerge: string;
  importReplace: string;
  exportLedger: string;
  importLedgerAsNew: string;
  importLedgerReplace: string;
  selectLedger: string;
  close: string;
  fileSelected: (name: string) => string;
  tipReplaceAll: string;
  tipReplaceLedger: string;
};

const ledgerOptions = (ledgers: Ledger[]) =>
  ledgers.map((l) => ({ id: l.id, name: l.name }));

export const DataTransferModal: React.FC<{
  isOpen: boolean;
  i18n: DataTransferI18n;
  ledgers: Ledger[];
  activeLedgerId: string;
  onClose: () => void;
  onExportAll: () => void;
  onImportAll: (file: File, mode: ImportAllMode) => void;
  onExportLedger: (ledgerId: string) => void;
  onImportLedger: (file: File, mode: ImportLedgerMode, targetLedgerId: string) => void;
}> = ({
  isOpen,
  i18n,
  ledgers,
  activeLedgerId,
  onClose,
  onExportAll,
  onImportAll,
  onExportLedger,
  onImportLedger,
}) => {
  const allFileRef = useRef<HTMLInputElement | null>(null);
  const ledgerFileRef = useRef<HTMLInputElement | null>(null);
  const [pendingAllFile, setPendingAllFile] = useState<File | null>(null);
  const [pendingLedgerFile, setPendingLedgerFile] = useState<File | null>(null);

  const selectableLedgers = useMemo(() => ledgerOptions(ledgers), [ledgers]);

  const initialLedgerId = useMemo(() => {
    if (activeLedgerId !== "master") return activeLedgerId;
    return selectableLedgers[0]?.id || "";
  }, [activeLedgerId, selectableLedgers]);

  const [selectedLedgerId, setSelectedLedgerId] = useState(initialLedgerId);

  useEffect(() => {
    if (!isOpen) return;
    setPendingAllFile(null);
    setPendingLedgerFile(null);
    setSelectedLedgerId(initialLedgerId);
  }, [isOpen, initialLedgerId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl w-full max-w-2xl shadow-2xl p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-[var(--text)]">{i18n.title}</h3>
            <p className="text-sm text-[var(--muted)] mt-1">{i18n.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted-2)] hover:text-[var(--text)]"
            aria-label={i18n.close}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-2)]">
              {i18n.allTitle}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={onExportAll}
                className="w-full bg-[var(--panel)] border border-[var(--border)] px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
              >
                {i18n.exportAll}
              </button>

              <input
                ref={allFileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setPendingAllFile(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => allFileRef.current?.click()}
                className="w-full bg-[var(--panel)] border border-[var(--border)] px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
              >
                {i18n.chooseFile}
              </button>
              {pendingAllFile && (
                <div className="text-xs text-[var(--muted)]">
                  {i18n.fileSelected(pendingAllFile.name)}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!pendingAllFile}
                  onClick={() => pendingAllFile && onImportAll(pendingAllFile, "merge")}
                  className="flex-1 bg-[var(--panel)] border border-[var(--border)] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {i18n.importMerge}
                </button>
                <button
                  type="button"
                  disabled={!pendingAllFile}
                  onClick={() =>
                    pendingAllFile && onImportAll(pendingAllFile, "replace")
                  }
                  className="flex-1 bg-[var(--panel)] border border-[var(--border)] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--danger)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {i18n.importReplace}
                </button>
              </div>
              <div className="text-[11px] text-[var(--muted-2)] leading-relaxed">
                {i18n.tipReplaceAll}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-2)]">
              {i18n.ledgerTitle}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-[var(--muted)]">
                  {i18n.selectLedger}
                </div>
                <select
                  value={selectedLedgerId}
                  onChange={(e) => setSelectedLedgerId(e.target.value)}
                  className="flex-1 bg-[var(--panel)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  {selectableLedgers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={!selectedLedgerId}
                onClick={() => selectedLedgerId && onExportLedger(selectedLedgerId)}
                className="w-full bg-[var(--panel)] border border-[var(--border)] px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {i18n.exportLedger}
              </button>

              <input
                ref={ledgerFileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setPendingLedgerFile(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => ledgerFileRef.current?.click()}
                className="w-full bg-[var(--panel)] border border-[var(--border)] px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
              >
                {i18n.chooseFile}
              </button>
              {pendingLedgerFile && (
                <div className="text-xs text-[var(--muted)]">
                  {i18n.fileSelected(pendingLedgerFile.name)}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!pendingLedgerFile}
                  onClick={() =>
                    pendingLedgerFile &&
                    onImportLedger(pendingLedgerFile, "asNew", selectedLedgerId)
                  }
                  className="flex-1 bg-[var(--panel)] border border-[var(--border)] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {i18n.importLedgerAsNew}
                </button>
                <button
                  type="button"
                  disabled={!pendingLedgerFile || !selectedLedgerId}
                  onClick={() =>
                    pendingLedgerFile &&
                    selectedLedgerId &&
                    onImportLedger(pendingLedgerFile, "replace", selectedLedgerId)
                  }
                  className="flex-1 bg-[var(--panel)] border border-[var(--border)] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--danger)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {i18n.importLedgerReplace}
                </button>
              </div>
              <div className="text-[11px] text-[var(--muted-2)] leading-relaxed">
                {i18n.tipReplaceLedger}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

