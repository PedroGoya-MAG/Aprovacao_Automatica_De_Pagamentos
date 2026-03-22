import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"]
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Portal de Aprovacao de Pagamentos",
  description: "Dashboard interno para aprovacao de pagamentos de beneficios."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${manrope.variable} ${sora.variable}`}>{children}</body>
    </html>
  );
}
