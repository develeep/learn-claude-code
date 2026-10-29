import meta from "./meta";
import s01 from "./s01";
import s11 from "./s11";

// Korean text for strings hard-coded in English, keyed by the English original.
export const KO_TEXT: Record<string, string> = {
  ...meta,
  ...s01,
  ...s11,
};
