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

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

export function formatLongDate(value: string) {
  return longDateFormatter.format(new Date(value));
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

