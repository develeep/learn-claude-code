import { KO_TEXT } from "@/i18n/ko-text";

// Hard-coded English strings (version metadata, visualizations, simulator
// scenarios) are translated by looking up the English text itself. Locales
// without a dictionary keep the original English.
const TEXT_BY_LOCALE: Record<string, Record<string, string>> = { ko: KO_TEXT };

export function localizeText(locale: string, text: string): string {
  return TEXT_BY_LOCALE[locale]?.[text] ?? text;
}
