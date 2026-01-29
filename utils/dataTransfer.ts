import { Ledger, TradeRecord } from "../types";
import { Language } from "../translations";

export type AuraGoldAllExport = {
  schema: "auragold.export";
  version: 1;
  kind: "all";
  exportedAt: string;
  payload: {
    ledgers: Ledger[];
    activeLedgerId?: string;
    lang?: Language;
    theme?: "light" | "dark";
  };
};

export type AuraGoldLedgerExport = {
  schema: "auragold.export";
  version: 1;
  kind: "ledger";
  exportedAt: string;
  payload: {
    ledger: Ledger;
  };
};

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

export const safeFilename = (name: string) =>
  name
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "auragold";

export const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  downloadBlob(blob, filename);
};

export const readJsonFromFile = async (file: File) => {
  const text = await file.text();
  return JSON.parse(text);
};

const asString = (value: unknown) => (typeof value === "string" ? value : null);

const asNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const asRecordObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const normalizeTradeRecord = (value: unknown): TradeRecord | null => {
  const obj = asRecordObject(value);
  if (!obj) return null;

  const id = asString(obj.id);
  const grams = asNumber(obj.grams);
  const costPrice = asNumber(obj.costPrice);
  const sellingPrice = asNumber(obj.sellingPrice);
  const handlingFeeRate = asNumber(obj.handlingFeeRate);
  const actualProfit = asNumber(obj.actualProfit);
  const desiredPrice = asNumber(obj.desiredPrice);
  const projectedProfit = asNumber(obj.projectedProfit);
  const profitMargin = asNumber(obj.profitMargin);
  const timestamp = asNumber(obj.timestamp);

  if (
    !id ||
    grams === null ||
    costPrice === null ||
    sellingPrice === null ||
    handlingFeeRate === null ||
    actualProfit === null ||
    desiredPrice === null ||
    projectedProfit === null ||
    profitMargin === null ||
    timestamp === null
  ) {
    return null;
  }

  return {
    id,
    grams,
    costPrice,
    sellingPrice,
    handlingFeeRate,
    actualProfit,
    desiredPrice,
    projectedProfit,
    profitMargin,
    timestamp,
  };
};

export const normalizeLedger = (value: unknown): Ledger | null => {
  const obj = asRecordObject(value);
  if (!obj) return null;

  const id = asString(obj.id);
  const name = asString(obj.name);
  const createdAt = asNumber(obj.createdAt);
  const rawRecords = Array.isArray(obj.records) ? obj.records : null;
  if (!id || !name || createdAt === null || !rawRecords) return null;

  const records: TradeRecord[] = [];
  const seen = new Set<string>();
  for (const item of rawRecords) {
    const r = normalizeTradeRecord(item);
    if (!r) return null;
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    records.push(r);
  }
  records.sort((a, b) => b.timestamp - a.timestamp);

  return { id, name, createdAt, records };
};

const dedupeLedgersById = (ledgers: Ledger[]) => {
  const map = new Map<string, Ledger>();
  for (const l of ledgers) {
    const prev = map.get(l.id);
    if (!prev) {
      map.set(l.id, l);
      continue;
    }
    const seen = new Set(prev.records.map((r) => r.id));
    const mergedRecords = [...prev.records];
    for (const r of l.records) {
      if (!seen.has(r.id)) mergedRecords.push(r);
    }
    mergedRecords.sort((a, b) => b.timestamp - a.timestamp);
    map.set(l.id, {
      id: prev.id,
      name: l.name || prev.name,
      createdAt: Math.min(prev.createdAt, l.createdAt),
      records: mergedRecords,
    });
  }
  return [...map.values()].sort((a, b) => a.createdAt - b.createdAt);
};

export const normalizeAllImport = (input: unknown) => {
  const obj = asRecordObject(input);
  if (!obj) return null;

  if (obj.schema === "auragold.export" && obj.kind === "all") {
    const payload = asRecordObject(obj.payload);
    if (!payload) return null;
    const ledgersRaw = Array.isArray(payload.ledgers) ? payload.ledgers : null;
    if (!ledgersRaw) return null;

    const ledgers: Ledger[] = [];
    for (const l of ledgersRaw) {
      const ledger = normalizeLedger(l);
      if (!ledger) return null;
      ledgers.push(ledger);
    }

    const activeLedgerId = asString(payload.activeLedgerId ?? undefined);
    const lang = asString(payload.lang ?? undefined);
    const theme = asString(payload.theme ?? undefined);

    return {
      ledgers: dedupeLedgersById(ledgers),
      activeLedgerId,
      lang: lang === "en" || lang === "zh" ? (lang as Language) : undefined,
      theme: theme === "light" || theme === "dark" ? theme : undefined,
    };
  }

  if (Array.isArray(input)) {
    const ledgers: Ledger[] = [];
    for (const l of input) {
      const ledger = normalizeLedger(l);
      if (!ledger) return null;
      ledgers.push(ledger);
    }
    return { ledgers: dedupeLedgersById(ledgers) };
  }

  return null;
};

export const normalizeLedgerImport = (input: unknown) => {
  const obj = asRecordObject(input);
  if (obj && obj.schema === "auragold.export" && obj.kind === "ledger") {
    const payload = asRecordObject(obj.payload);
    if (!payload) return null;
    return normalizeLedger(payload.ledger);
  }
  return normalizeLedger(input);
};

