import { type BenefitType } from "@/types/payments";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const longDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full"
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short"
});

export type DateInput = string | number | Date | null | undefined;

const warnedInvalidDates = new Set<string>();

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function parseDate(value: DateInput, fieldName = "date"): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  try {
    let date: Date;

    if (value instanceof Date) {
      date = new Date(value.getTime());
    } else if (typeof value === "number") {
      date = new Date(value);
    } else {
      const normalized = value.trim();
      if (!normalized) {
        return null;
      }

      const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
      const brazilianDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized);

      if (isoDate) {
        date = createLocalDate(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]));
      } else if (brazilianDate) {
        date = createLocalDate(Number(brazilianDate[3]), Number(brazilianDate[2]), Number(brazilianDate[1]));
      } else {
        // Some APIs serialize SQL timestamps with a space instead of the ISO `T`.
        date = new Date(normalized.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/, "$1T$2"));
      }
    }

    if (Number.isNaN(date.getTime())) {
      warnInvalidDate(fieldName, value);
      return null;
    }

    return date;
  } catch {
    warnInvalidDate(fieldName, value);
    return null;
  }
}

export function isValidDate(value: DateInput): boolean {
  return parseDate(value) !== null;
}

export function normalizeDateValue(value: DateInput, fieldName = "date"): string | null {
  const date = parseDate(value, fieldName);
  if (!date) return null;
  return typeof value === "string" ? value.trim() : date.toISOString();
}

export function getDateWeekKey(value: DateInput, fieldName = "date"): string | null {
  const date = parseDate(value, fieldName);
  if (!date) return null;
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const weekIndex = Math.floor((date.getDate() + firstDay.getDay() - 1) / 7) + 1;
  return `${date.getFullYear()}-${date.getMonth() + 1}-S${weekIndex}`;
}

export function formatDate(value: DateInput, fieldName = "date") {
  return formatSafely(dateFormatter, value, fieldName);
}

export function formatDateTime(value: DateInput, fieldName = "dateTime") {
  return formatSafely(dateTimeFormatter, value, fieldName);
}

export function formatLongDate(value: DateInput, fieldName = "date") {
  return formatSafely(longDateFormatter, value, fieldName);
}

function formatSafely(formatter: Intl.DateTimeFormat, value: DateInput, fieldName: string) {
  const date = parseDate(value, fieldName);
  if (!date) {
    return "-";
  }

  try {
    return formatter.format(date);
  } catch {
    warnInvalidDate(fieldName, value);
    return "-";
  }
}

function createLocalDate(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return new Date(Number.NaN);
  }
  return date;
}

function warnInvalidDate(fieldName: string, value: DateInput) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const key = `${fieldName}:${String(value)}`;
  if (!warnedInvalidDates.has(key)) {
    warnedInvalidDates.add(key);
    console.warn(`[date] Invalid value received for ${fieldName}`, value);
  }
}

export function formatBenefitType(type: BenefitType) {
  return type === "SORTEIO" ? "Sorteio" : "Resgate";
}

export function formatDocument(document: string) {
  const digits = document.replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  return document;
}

