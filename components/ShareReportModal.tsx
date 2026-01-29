import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { TradeSummary } from "../types";

export type ShareReportTemplate = "glass" | "paper" | "neon";

export type ShareModalI18n = {
  title: string;
  subtitle: string;
  templatesLabel: string;
  templates: Record<ShareReportTemplate, string>;
  downloadPng: string;
  downloading: string;
  copyText: string;
  close: string;
};

type ReportLabels = {
  title: string;
  actual: string;
  projected: string;
  diff: string;
  volume: string;
  count: string;
  date: string;
};

type ShareReportPayload = {
  ledgerName: string;
  txCount: number;
  generatedAt: string;
  labels: ReportLabels;
};

const TEMPLATE_SIZE = { width: 1200, height: 630 };

const formatMoney = (value: number) => `￥${value.toFixed(2)}`;
const formatGrams = (value: number) => `${value.toFixed(2)}g`;

const toPngBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to encode PNG"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const safeFilename = (name: string) =>
  name
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "report";

const ReportTemplate: React.FC<{
  template: ShareReportTemplate;
  summary: TradeSummary;
  payload: ShareReportPayload;
  width: number;
  height: number;
  withShadow?: boolean;
}> = ({ template, summary, payload, width, height, withShadow = true }) => {
  const profitColor =
    summary.totalProfit >= 0 ? "text-emerald-300" : "text-rose-300";
  const diffColor =
    summary.profitDifference >= 0 ? "text-emerald-300" : "text-rose-300";

  if (template === "paper") {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-black/10 bg-[#FBFBF7] text-slate-900 ${withShadow ? "shadow-[0_20px_60px_rgba(0,0,0,0.18)]" : ""}`}
        style={{
          width,
          height,
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_80%_85%,rgba(14,165,233,0.14),transparent_55%)]" />
        <div className="relative h-full p-10 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-10">
            <div className="min-w-0">
              <div className="text-[13px] font-black tracking-[0.28em] uppercase text-slate-600">
                AuraGold
              </div>
              <div className="mt-2 text-3xl font-black leading-tight">
                [{payload.ledgerName}] {payload.labels.title}
              </div>
              <div className="mt-3 text-sm text-slate-600">
                {payload.labels.date}: {payload.generatedAt}
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-black/10 bg-white px-4 py-3">
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-500">
                {payload.labels.count}
              </div>
              <div className="mt-1 text-2xl font-black tabular-nums">
                {payload.txCount}
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-12 gap-4">
            <div className="col-span-12 rounded-2xl border border-black/10 bg-white p-6">
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-500">
                {payload.labels.actual}
              </div>
              <div
                className={`mt-2 text-5xl font-black tabular-nums ${profitColor}`}
              >
                {formatMoney(summary.totalProfit)}
              </div>
            </div>

            <div className="col-span-7 rounded-2xl border border-black/10 bg-white p-6">
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-500">
                {payload.labels.projected}
              </div>
              <div className="mt-2 text-3xl font-black tabular-nums text-slate-900">
                {formatMoney(summary.totalProjectedProfit)}
              </div>
            </div>

            <div className="col-span-5 rounded-2xl border border-black/10 bg-white p-6">
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-500">
                {payload.labels.diff}
              </div>
              <div
                className={`mt-2 text-3xl font-black tabular-nums ${diffColor}`}
              >
                {formatMoney(summary.profitDifference)}
              </div>
            </div>

            <div className="col-span-12 rounded-2xl border border-black/10 bg-white p-6 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-widest uppercase text-slate-500">
                  {payload.labels.volume}
                </div>
                <div className="mt-2 text-3xl font-black tabular-nums">
                  {formatGrams(summary.totalGrams)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold tracking-widest uppercase text-slate-500">
                  {payload.labels.title}
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-600">
                  auragold-trading-analyzer
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
            <div className="font-semibold tracking-wide">
              aura · gold · terminal
            </div>
            <div className="font-mono">{payload.generatedAt}</div>
          </div>
        </div>
      </div>
    );
  }

  if (template === "neon") {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#050816] text-slate-100 ${withShadow ? "shadow-[0_30px_90px_rgba(0,0,0,0.55)]" : ""}`}
        style={{
          width,
          height,
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.22),transparent_55%),radial-gradient(circle_at_85%_30%,rgba(168,85,247,0.20),transparent_55%),radial-gradient(circle_at_40%_90%,rgba(34,197,94,0.18),transparent_55%)]" />
        <div className="absolute inset-0 opacity-60 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:36px_36px]" />

        <div className="relative h-full p-10 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-10">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.75)]" />
                <div className="text-[11px] font-black tracking-[0.28em] uppercase text-slate-200">
                  AuraGold Terminal
                </div>
              </div>
              <div className="mt-5 text-3xl font-black leading-tight">
                [{payload.ledgerName}] {payload.labels.title}
              </div>
              <div className="mt-2 text-sm text-slate-300">
                {payload.labels.date}: {payload.generatedAt}
              </div>
            </div>

            <div className="shrink-0 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl px-5 py-4">
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
                {payload.labels.count}
              </div>
              <div className="mt-1 text-3xl font-black tabular-nums text-white">
                {payload.txCount}
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-12 gap-4">
            <div className="col-span-12 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl p-7">
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
                {payload.labels.actual}
              </div>
              <div
                className={`mt-2 text-6xl font-black tabular-nums ${profitColor}`}
              >
                {formatMoney(summary.totalProfit)}
              </div>
            </div>

            <div className="col-span-7 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl p-6">
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
                {payload.labels.projected}
              </div>
              <div className="mt-2 text-3xl font-black tabular-nums text-white">
                {formatMoney(summary.totalProjectedProfit)}
              </div>
            </div>

            <div className="col-span-5 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl p-6">
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
                {payload.labels.diff}
              </div>
              <div
                className={`mt-2 text-3xl font-black tabular-nums ${diffColor}`}
              >
                {formatMoney(summary.profitDifference)}
              </div>
            </div>

            <div className="col-span-12 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl p-6 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
                  {payload.labels.volume}
                </div>
                <div className="mt-2 text-3xl font-black tabular-nums text-white">
                  {formatGrams(summary.totalGrams)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
                  aura · gold
                </div>
                <div className="mt-2 font-mono text-xs text-slate-300">
                  {payload.generatedAt}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between text-xs text-slate-400">
            <div className="font-semibold tracking-wide">share-ready · png</div>
            <div className="font-semibold tracking-wide">1200 × 630</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/12 bg-[#020617] text-slate-100 ${withShadow ? "shadow-[0_30px_90px_rgba(0,0,0,0.55)]" : ""}`}
      style={{
        width,
        height,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,197,94,0.18),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.16),transparent_55%)]" />
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative h-full p-10 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-10">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-300 to-sky-300 shadow-[0_12px_32px_rgba(34,197,94,0.22)] flex items-center justify-center">
                <div className="text-slate-900 font-black text-sm">AG</div>
              </div>
              <div>
                <div className="text-[11px] font-black tracking-[0.28em] uppercase text-slate-300">
                  AuraGold
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  {payload.labels.title}
                </div>
              </div>
            </div>
            <div className="mt-5 text-3xl font-black leading-tight">
              [{payload.ledgerName}]
            </div>
            <div className="mt-2 text-sm text-slate-300">
              {payload.labels.date}: {payload.generatedAt}
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl px-5 py-4">
            <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
              {payload.labels.count}
            </div>
            <div className="mt-1 text-3xl font-black tabular-nums text-white">
              {payload.txCount}
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-12 gap-4">
          <div className="col-span-12 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl p-7">
            <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
              {payload.labels.actual}
            </div>
            <div
              className={`mt-2 text-6xl font-black tabular-nums ${profitColor}`}
            >
              {formatMoney(summary.totalProfit)}
            </div>
          </div>

          <div className="col-span-7 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl p-6">
            <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
              {payload.labels.projected}
            </div>
            <div className="mt-2 text-3xl font-black tabular-nums text-white">
              {formatMoney(summary.totalProjectedProfit)}
            </div>
          </div>

          <div className="col-span-5 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl p-6">
            <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
              {payload.labels.diff}
            </div>
            <div
              className={`mt-2 text-3xl font-black tabular-nums ${diffColor}`}
            >
              {formatMoney(summary.profitDifference)}
            </div>
          </div>

          <div className="col-span-12 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl p-6 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
                {payload.labels.volume}
              </div>
              <div className="mt-2 text-3xl font-black tabular-nums text-white">
                {formatGrams(summary.totalGrams)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
                aura · gold · terminal
              </div>
              <div className="mt-2 font-mono text-xs text-slate-300">
                {payload.generatedAt}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between text-xs text-slate-400">
          <div className="font-semibold tracking-wide">share-ready · png</div>
          <div className="font-semibold tracking-wide">1200 × 630</div>
        </div>
      </div>
    </div>
  );
};

const TemplatePreviewCard: React.FC<{
  id: ShareReportTemplate;
  label: string;
  selected: boolean;
  onSelect: (t: ShareReportTemplate) => void;
  summary: TradeSummary;
  payload: ShareReportPayload;
}> = ({ id, label, selected, onSelect, summary, payload }) => {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [previewWidth, setPreviewWidth] = useState(0);
  const previewRatio = TEMPLATE_SIZE.width / TEMPLATE_SIZE.height;

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      setPreviewWidth(w);
    });
    ro.observe(el);
    const initialWidth = el.getBoundingClientRect().width;
    if (initialWidth) setPreviewWidth(initialWidth);
    return () => ro.disconnect();
  }, []);

  const w = previewWidth || 360;
  const scale = w / TEMPLATE_SIZE.width;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`group w-full text-left rounded-2xl border p-3 transition-colors duration-200 shadow-xl ${
        selected
          ? "border-[var(--accent)] bg-[var(--panel-2)]"
          : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-2)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-xs font-black uppercase tracking-widest text-[var(--muted)] group-hover:text-[var(--text)] transition-colors">
          {label}
        </div>
        <div
          className={`h-5 w-5 rounded-full border flex items-center justify-center ${
            selected
              ? "border-[var(--accent)] bg-[var(--accent)] text-slate-900"
              : "border-[var(--border-2)] text-transparent"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3 w-3"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      <div
        ref={previewRef}
        className="relative w-full max-w-[420px] mx-auto rounded-xl overflow-hidden border border-[var(--border)] bg-black/10"
        style={{ aspectRatio: `${previewRatio}` }}
      >
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{
            width: TEMPLATE_SIZE.width,
            height: TEMPLATE_SIZE.height,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
          }}
        >
          <ReportTemplate
            template={id}
            summary={summary}
            payload={payload}
            width={TEMPLATE_SIZE.width}
            height={TEMPLATE_SIZE.height}
            withShadow={false}
          />
        </div>
      </div>
    </button>
  );
};

export const ShareReportModal: React.FC<{
  isOpen: boolean;
  i18n: ShareModalI18n;
  template: ShareReportTemplate;
  onTemplateChange: (t: ShareReportTemplate) => void;
  summary: TradeSummary;
  payload: ShareReportPayload;
  onCopyText: () => void;
  onClose: () => void;
}> = ({
  isOpen,
  i18n,
  template,
  onTemplateChange,
  summary,
  payload,
  onCopyText,
  onClose,
}) => {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportTemplate, setExportTemplate] =
    useState<ShareReportTemplate>(template);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const filename = useMemo(() => {
    const base = safeFilename(payload.ledgerName);
    return `${base}-report-${template}.png`;
  }, [payload.ledgerName, template]);

  if (!isOpen) return null;

  const nextFrame = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      setExportTemplate(template);
      await nextFrame();
      await nextFrame();
      const el = exportRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const blob = await toPngBlob(canvas);
      downloadBlob(blob, filename);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl bg-[var(--panel)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="text-sm font-black tracking-widest uppercase text-[var(--muted)]">
              {i18n.title}
            </div>
            <div className="mt-1 text-xl font-black text-[var(--text)] truncate">
              [{payload.ledgerName}] {payload.labels.title}
            </div>
            <div className="mt-2 text-sm text-[var(--muted)]">
              {i18n.subtitle}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--panel-2)] border border-[var(--border)] p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] transition-colors shadow-lg"
            aria-label={i18n.close}
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

        <div className="px-6 py-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="text-xs font-black uppercase tracking-widest text-[var(--muted)]">
              {i18n.templatesLabel}
            </div>
            <div className="text-xs text-[var(--muted-2)] font-mono">
              {TEMPLATE_SIZE.width} × {TEMPLATE_SIZE.height}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TemplatePreviewCard
              id="glass"
              label={i18n.templates.glass}
              selected={template === "glass"}
              onSelect={onTemplateChange}
              summary={summary}
              payload={payload}
            />
            <TemplatePreviewCard
              id="paper"
              label={i18n.templates.paper}
              selected={template === "paper"}
              onSelect={onTemplateChange}
              summary={summary}
              payload={payload}
            />
            <TemplatePreviewCard
              id="neon"
              label={i18n.templates.neon}
              selected={template === "neon"}
              onSelect={onTemplateChange}
              summary={summary}
              payload={payload}
            />
          </div>
        </div>

        <div className="px-6 py-5 border-t border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCopyText}
              className="px-4 py-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--row-hover)] transition-colors font-semibold"
            >
              {i18n.copyText}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--row-hover)] transition-colors font-semibold"
            >
              {i18n.close}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-[var(--accent)] text-slate-900 px-5 py-3 rounded-2xl font-black tracking-widest uppercase text-xs hover:bg-[var(--success)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-xl"
            >
              {isDownloading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                    />
                  </svg>
                  {i18n.downloading}
                </>
              ) : (
                <>
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
                      d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                    />
                  </svg>
                  {i18n.downloadPng}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed left-[-10000px] top-0 pointer-events-none">
        <div ref={exportRef}>
          <ReportTemplate
            template={exportTemplate}
            summary={summary}
            payload={payload}
            width={TEMPLATE_SIZE.width}
            height={TEMPLATE_SIZE.height}
          />
        </div>
      </div>
    </div>
  );
};
