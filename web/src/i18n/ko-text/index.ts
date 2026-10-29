import meta from "./meta";
import s01 from "./s01";
import s11 from "./s11";
import s02 from "./s02";
import s04 from "./s04";
import s05 from "./s05";
import s06 from "./s06";
import s08 from "./s08";
import s10 from "./s10";
import s12 from "./s12";
import s14 from "./s14";
import s03 from "./s03";
import s07 from "./s07";
import s09 from "./s09";
import s13 from "./s13";
import s15 from "./s15";
import pages from "./pages";
import architecture from "./architecture";
import scenarios from "./scenarios";

// Korean text for strings hard-coded in English, keyed by the English original.
export const KO_TEXT: Record<string, string> = {
  ...meta,
  ...s01,
  ...s11,
  ...s02,
  ...s04,
  ...s05,
  ...s06,
  ...s08,
  ...s10,
  ...s12,
  ...s14,
  ...s03,
  ...s07,
  ...s09,
  ...s13,
  ...s15,
  ...pages,
  ...architecture,
  ...scenarios,
};
