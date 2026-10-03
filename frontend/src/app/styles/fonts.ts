import { Onest } from "next/font/google";

/**
 * Шрифт бренда. В макете — Styrene A (коммерческий, без кириллицы в веб-версии),
 * здесь бесплатная замена близкой геометрии с кириллицей.
 * Купленный шрифт подключается через next/font/local с тем же `variable`.
 */
export const brandFont = Onest({
  variable: "--font-brand",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});
