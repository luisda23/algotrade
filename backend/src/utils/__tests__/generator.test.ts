// Golden-file tests para los generators MQL5 / MQL4.
//
// Para cada combinación (indicador × formato × idioma) generamos el .mq5/.mq4
// y lo comparamos byte a byte con un archivo "golden" comprometido al repo.
// Si una sola línea cambia inesperadamente al modificar el generator, este
// test rompe — no necesitas cargar el bot en MetaTrader para enterarte.
//
// Refrescar goldens cuando el cambio es legítimo:
//   npm run test:update-goldens
//
// Volatilidad en el output (date, build SHA) la neutralizamos con `normalize`.

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { generateMQL5 } from "../mqlGenerator";
import { generateMQL4 } from "../mql4Generator";

const GOLDENS_DIR = path.join(__dirname, "goldens");
const UPDATE = process.env.UPDATE_GOLDENS === "1";

// Strip de líneas que cambian por motivos no relacionados con la lógica
// del generator: la fecha de generación y el SHA de build.
function normalize(code: string): string {
  return (
    code
      // Header banner: "Generado/Generated por YudBot · 2026-05-07"
      .replace(/(YudBot ·) \d{4}-\d{2}-\d{2}/g, "$1 TEST_DATE")
      // Print interno con el mismo timestamp en OnInit
      .replace(/(YudBot ·) \d{4}-\d{2}-\d{2}"\)/g, '$1 TEST_DATE")')
      // build: <sha>
      .replace(/build: [a-f0-9]{7,}/g, "build: TEST_SHA")
      .replace(/build: dev/g, "build: TEST_SHA")
  );
}

interface BotConfig {
  id?: string;
  name: string;
  description?: string | null;
  strategy: string;
  parameters: Record<string, unknown>;
}

// Config base del bot. Cada test sobrescribe campos específicos.
function makeConfig(
  overrides: Partial<BotConfig> & {
    indicators?: string[];
    risk?: any;
    strategy?: string;
  } = {},
): BotConfig {
  const { indicators, risk, strategy, ...rest } = overrides;
  return {
    id: "test-bot-fixed-id",
    name: "TestBot",
    description: "Bot de test",
    strategy: strategy ?? "momentum",
    parameters: {
      market: "forex",
      pair: "EURUSD",
      leverage: 30,
      indicators: indicators ?? ["rsi"],
      timeframe: "M15",
      lot: { mode: "auto", fixedLot: 0.1 },
      risk: risk ?? {
        unit: "percent",
        stopLoss: 1.5,
        takeProfit: 3.0,
        posSize: 2,
        dailyLoss: 4,
      },
      news: { enabled: false },
      funded: { enabled: false, firm: null },
    },
    ...rest,
  };
}

function runGolden(name: string, output: string) {
  const goldenPath = path.join(GOLDENS_DIR, `${name}.golden`);
  const normalized = normalize(output);

  if (UPDATE || !fs.existsSync(goldenPath)) {
    fs.mkdirSync(path.dirname(goldenPath), { recursive: true });
    fs.writeFileSync(goldenPath, normalized);
    return; // En modo update no fallamos
  }

  const expected = fs.readFileSync(goldenPath, "utf8");
  expect(
    normalized,
    `${name} difiere del golden — corre 'npm run test:update-goldens' si el cambio es intencional`,
  ).toBe(expected);
}

const INDICATORS = [
  "rsi",
  "stoch",
  "stochrsi",
  "cci",
  "willr",
  "roc",
  "ema",
  "sma",
  "macd",
  "adx",
  "ichimoku",
  "psar",
  "supertrend",
  "bb",
  "atr",
  "donchian",
  "keltner",
  "vol",
  "obv",
  "vwap",
  "mfi",
  "fib",
  "pivot",
  "sr",
] as const;

describe("MQL5 generator — single indicator", () => {
  for (const ind of INDICATORS) {
    it(`indicator: ${ind}`, () => {
      const config = makeConfig({ indicators: [ind] });
      runGolden(`mql5/single/${ind}`, generateMQL5(config, "es"));
    });
  }
});

describe("MQL4 generator — single indicator", () => {
  for (const ind of INDICATORS) {
    it(`indicator: ${ind}`, () => {
      const config = makeConfig({ indicators: [ind] });
      runGolden(`mql4/single/${ind}`, generateMQL4(config, "es"));
    });
  }
});

describe("MQL5 generator — combinations and edge cases", () => {
  it("trigger + filter combo (RSI trigger + EMA filter)", () => {
    const config = makeConfig({ indicators: ["rsi", "ema"] });
    runGolden("mql5/combo/rsi-ema", generateMQL5(config, "es"));
  });

  it("all 24 indicators together", () => {
    const config = makeConfig({ indicators: [...INDICATORS] });
    runGolden("mql5/combo/all", generateMQL5(config, "es"));
  });

  it("only filter-only indicator (ATR alone) → fallback price-action", () => {
    // ATR es filter-only; sin trigger, el generator inyecta breakout 10-bar
    // como fallback. Sin esto el bot disparaba en cada barra.
    const config = makeConfig({ indicators: ["atr"] });
    runGolden("mql5/edge/filter-only-atr", generateMQL5(config, "es"));
  });

  it("reversal strategy switches BB/Stoch thresholds", () => {
    const config = makeConfig({
      indicators: ["bb", "stoch"],
      strategy: "reversal",
    });
    runGolden("mql5/edge/reversal-bb-stoch", generateMQL5(config, "es"));
  });
});

describe("MQL5 generator — risk units", () => {
  it("SL/TP en pips", () => {
    const config = makeConfig({
      indicators: ["rsi"],
      risk: {
        unit: "pips",
        stopLoss: 15,
        takeProfit: 30,
        posSize: 2,
        dailyLoss: 4,
      },
    });
    runGolden("mql5/risk/pips", generateMQL5(config, "es"));
  });

  it("SL/TP en ATR multiplier", () => {
    const config = makeConfig({
      indicators: ["rsi"],
      risk: {
        unit: "atr",
        stopLoss: 1.5,
        takeProfit: 3.0,
        posSize: 2,
        dailyLoss: 4,
      },
    });
    runGolden("mql5/risk/atr", generateMQL5(config, "es"));
  });

  it("break-even + trailing en pips", () => {
    const config = makeConfig({
      indicators: ["rsi"],
      risk: {
        unit: "pips",
        stopLoss: 15,
        takeProfit: 30,
        posSize: 2,
        dailyLoss: 4,
        breakEven: { enabled: true, triggerDistance: 10 },
        trailing: { enabled: true, distance: 8 },
      },
    });
    runGolden("mql5/risk/be-trailing-pips", generateMQL5(config, "es"));
  });
});

describe("MQL5 generator — i18n", () => {
  it("output en inglés (lang=en)", () => {
    const config = makeConfig({ indicators: ["rsi"] });
    runGolden("mql5/i18n/rsi-en", generateMQL5(config, "en"));
  });

  it("output en español (lang=es) — control", () => {
    const config = makeConfig({ indicators: ["rsi"] });
    runGolden("mql5/i18n/rsi-es", generateMQL5(config, "es"));
  });
});
