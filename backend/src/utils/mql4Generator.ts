// mql4Generator.ts — Genera código MQL4 (MetaTrader 4) desde la config del bot
//
// Mismo modelo que mqlGenerator.ts, pero MQL4 no tiene handles: las funciones
// iX() devuelven el valor directamente. Solo necesitamos las "logic blocks"
// con setup local y las condiciones buy/sell.

interface BotParams {
  market?: string;
  pair?: string;
  leverage?: number;
  indicators?: string[];
  timeframe?: 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';
  lot?: { mode?: 'auto' | 'fixed'; fixedLot?: number };
  risk?: { stopLoss?: number; takeProfit?: number; posSize?: number; dailyLoss?: number };
  funded?: { enabled?: boolean; firm?: string };
}

const TIMEFRAME_TO_MQL4: Record<string, string> = {
  M1: 'PERIOD_M1', M5: 'PERIOD_M5', M15: 'PERIOD_M15', M30: 'PERIOD_M30',
  H1: 'PERIOD_H1', H4: 'PERIOD_H4', D1: 'PERIOD_D1',
};
const STRATEGY_DEFAULT_TF_MQL4: Record<string, string> = {
  scalping: 'M5', momentum: 'M15', mean: 'M15', breakout: 'H1',
  swing: 'H4', trend: 'H1', reversal: 'M30', grid: 'M15',
  dca: 'H4', hedge: 'H1',
};

type IndDef4 = {
  logic: (strategy: string, isOnly: boolean) => { setup: string[]; buy: string; sell: string };
};
const isReversal = (s: string) => s === 'mean' || s === 'reversal';

const INDICATOR_DEFS_MQL4: Record<string, IndDef4> = {
  // Momentum
  rsi: {
    logic: (s) => {
      const lo = isReversal(s) ? 35 : 30;
      const hi = isReversal(s) ? 65 : 70;
      return {
        setup: [`double rsi0 = iRSI(Symbol(), InpTimeframe, 14, PRICE_CLOSE, 0);`],
        buy: `rsi0 < ${lo}`,
        sell: `rsi0 > ${hi}`,
      };
    },
  },
  stoch: {
    logic: (s, only) => {
      const lo = isReversal(s) ? 25 : 20;
      const hi = isReversal(s) ? 75 : 80;
      const setup = [
        `double stochM0 = iStochastic(Symbol(), InpTimeframe, 5, 3, 3, MODE_SMA, 0, MODE_MAIN, 0);`,
        `double stochS0 = iStochastic(Symbol(), InpTimeframe, 5, 3, 3, MODE_SMA, 0, MODE_SIGNAL, 0);`,
      ];
      if (only) {
        setup.push(`double stochM1 = iStochastic(Symbol(), InpTimeframe, 5, 3, 3, MODE_SMA, 0, MODE_MAIN, 1);`);
        setup.push(`double stochS1 = iStochastic(Symbol(), InpTimeframe, 5, 3, 3, MODE_SMA, 0, MODE_SIGNAL, 1);`);
        return { setup, buy: `(stochM0 > stochS0 && stochM1 <= stochS1 && stochM0 < ${lo + 30})`, sell: `(stochM0 < stochS0 && stochM1 >= stochS1 && stochM0 > ${hi - 30})` };
      }
      return { setup, buy: `stochM0 < ${lo}`, sell: `stochM0 > ${hi}` };
    },
  },
  stochrsi: {
    // Aprox manual: usa iRSI sobre 14 barras y normaliza al rango.
    logic: (s) => {
      const lo = isReversal(s) ? 25 : 20;
      const hi = isReversal(s) ? 75 : 80;
      return {
        setup: [
          `double srsiBuf[14]; for(int siI=0; siI<14; siI++) srsiBuf[siI] = iRSI(Symbol(), InpTimeframe, 14, PRICE_CLOSE, siI);`,
          `double srsiHi = srsiBuf[0]; double srsiLo = srsiBuf[0]; for(int siJ=1; siJ<14; siJ++) { if(srsiBuf[siJ] > srsiHi) srsiHi = srsiBuf[siJ]; if(srsiBuf[siJ] < srsiLo) srsiLo = srsiBuf[siJ]; }`,
          `double stochRsi = (srsiHi > srsiLo) ? (srsiBuf[0] - srsiLo) / (srsiHi - srsiLo) * 100.0 : 50.0;`,
        ],
        buy: `stochRsi < ${lo}`,
        sell: `stochRsi > ${hi}`,
      };
    },
  },
  cci: {
    logic: () => ({
      setup: [`double cci0 = iCCI(Symbol(), InpTimeframe, 14, PRICE_TYPICAL, 0);`],
      buy: `cci0 < -100`,
      sell: `cci0 > 100`,
    }),
  },
  williams: {
    logic: () => ({
      setup: [`double wpr0 = iWPR(Symbol(), InpTimeframe, 14, 0);`],
      buy: `wpr0 < -80`,
      sell: `wpr0 > -20`,
    }),
  },
  roc: {
    logic: () => ({
      setup: [`double mom0 = iMomentum(Symbol(), InpTimeframe, 14, PRICE_CLOSE, 0); double roc = mom0 - 100.0;`],
      buy: `roc > 0.5`,
      sell: `roc < -0.5`,
    }),
  },

  // Tendencia
  ema: {
    logic: (_s, only) => {
      const setup = [
        `double emaFast0 = iMA(Symbol(), InpTimeframe, 9, 0, MODE_EMA, PRICE_CLOSE, 0);`,
        `double emaSlow0 = iMA(Symbol(), InpTimeframe, 21, 0, MODE_EMA, PRICE_CLOSE, 0);`,
      ];
      if (only) {
        setup.push(`double emaFast1 = iMA(Symbol(), InpTimeframe, 9, 0, MODE_EMA, PRICE_CLOSE, 1);`);
        setup.push(`double emaSlow1 = iMA(Symbol(), InpTimeframe, 21, 0, MODE_EMA, PRICE_CLOSE, 1);`);
        return { setup, buy: `(emaFast0 > emaSlow0 && emaFast1 <= emaSlow1)`, sell: `(emaFast0 < emaSlow0 && emaFast1 >= emaSlow1)` };
      }
      return { setup, buy: `emaFast0 > emaSlow0`, sell: `emaFast0 < emaSlow0` };
    },
  },
  sma: {
    logic: (_s, only) => {
      const setup = [
        `double smaFast0 = iMA(Symbol(), InpTimeframe, 9, 0, MODE_SMA, PRICE_CLOSE, 0);`,
        `double smaSlow0 = iMA(Symbol(), InpTimeframe, 21, 0, MODE_SMA, PRICE_CLOSE, 0);`,
      ];
      if (only) {
        setup.push(`double smaFast1 = iMA(Symbol(), InpTimeframe, 9, 0, MODE_SMA, PRICE_CLOSE, 1);`);
        setup.push(`double smaSlow1 = iMA(Symbol(), InpTimeframe, 21, 0, MODE_SMA, PRICE_CLOSE, 1);`);
        return { setup, buy: `(smaFast0 > smaSlow0 && smaFast1 <= smaSlow1)`, sell: `(smaFast0 < smaSlow0 && smaFast1 >= smaSlow1)` };
      }
      return { setup, buy: `smaFast0 > smaSlow0`, sell: `smaFast0 < smaSlow0` };
    },
  },
  macd: {
    logic: (_s, only) => {
      const setup = [
        `double macdM0 = iMACD(Symbol(), InpTimeframe, 12, 26, 9, PRICE_CLOSE, MODE_MAIN, 0);`,
        `double macdS0 = iMACD(Symbol(), InpTimeframe, 12, 26, 9, PRICE_CLOSE, MODE_SIGNAL, 0);`,
      ];
      if (only) {
        setup.push(`double macdM1 = iMACD(Symbol(), InpTimeframe, 12, 26, 9, PRICE_CLOSE, MODE_MAIN, 1);`);
        setup.push(`double macdS1 = iMACD(Symbol(), InpTimeframe, 12, 26, 9, PRICE_CLOSE, MODE_SIGNAL, 1);`);
        return { setup, buy: `(macdM0 > macdS0 && macdM1 <= macdS1)`, sell: `(macdM0 < macdS0 && macdM1 >= macdS1)` };
      }
      return { setup, buy: `macdM0 > macdS0`, sell: `macdM0 < macdS0` };
    },
  },
  adx: {
    logic: () => ({
      setup: [
        `double adxM0    = iADX(Symbol(), InpTimeframe, 14, PRICE_CLOSE, MODE_MAIN, 0);`,
        `double adxPlus  = iADX(Symbol(), InpTimeframe, 14, PRICE_CLOSE, MODE_PLUSDI, 0);`,
        `double adxMinus = iADX(Symbol(), InpTimeframe, 14, PRICE_CLOSE, MODE_MINUSDI, 0);`,
      ],
      buy: `(adxM0 > 20 && adxPlus > adxMinus)`,
      sell: `(adxM0 > 20 && adxPlus < adxMinus)`,
    }),
  },
  ichi: {
    logic: (_s, only) => {
      const setup = [
        `double ichiTen0 = iIchimoku(Symbol(), InpTimeframe, 9, 26, 52, MODE_TENKANSEN, 0);`,
        `double ichiKij0 = iIchimoku(Symbol(), InpTimeframe, 9, 26, 52, MODE_KIJUNSEN, 0);`,
        `double ichiSpA  = iIchimoku(Symbol(), InpTimeframe, 9, 26, 52, MODE_SENKOUSPANA, 0);`,
        `double ichiSpB  = iIchimoku(Symbol(), InpTimeframe, 9, 26, 52, MODE_SENKOUSPANB, 0);`,
      ];
      if (only) {
        setup.push(`double ichiTen1 = iIchimoku(Symbol(), InpTimeframe, 9, 26, 52, MODE_TENKANSEN, 1);`);
        setup.push(`double ichiKij1 = iIchimoku(Symbol(), InpTimeframe, 9, 26, 52, MODE_KIJUNSEN, 1);`);
        return { setup,
          buy: `(ichiTen0 > ichiKij0 && ichiTen1 <= ichiKij1 && Bid > ichiSpA)`,
          sell: `(ichiTen0 < ichiKij0 && ichiTen1 >= ichiKij1 && Bid < ichiSpB)`,
        };
      }
      return { setup, buy: `(ichiTen0 > ichiKij0 && Bid > ichiSpA)`, sell: `(ichiTen0 < ichiKij0 && Bid < ichiSpB)` };
    },
  },
  psar: {
    logic: () => ({
      setup: [`double sar0 = iSAR(Symbol(), InpTimeframe, 0.02, 0.2, 0);`],
      buy: `Bid > sar0`,
      sell: `Bid < sar0`,
    }),
  },
  supertrend: {
    logic: () => ({
      setup: [
        `double stAtr0 = iATR(Symbol(), InpTimeframe, 10, 0);`,
        `double stHL2  = (iHigh(Symbol(), InpTimeframe, 1) + iLow(Symbol(), InpTimeframe, 1)) / 2.0;`,
        `double stUpper = stHL2 + 3.0 * stAtr0;`,
        `double stLower = stHL2 - 3.0 * stAtr0;`,
      ],
      buy: `Bid > stUpper`,
      sell: `Bid < stLower`,
    }),
  },

  // Volatilidad
  bb: {
    logic: (s) => {
      const setup = [
        `double bbU = iBands(Symbol(), InpTimeframe, 20, 2, 0, PRICE_CLOSE, MODE_UPPER, 0);`,
        `double bbL = iBands(Symbol(), InpTimeframe, 20, 2, 0, PRICE_CLOSE, MODE_LOWER, 0);`,
      ];
      if (isReversal(s)) return { setup, buy: `Bid <= bbL`, sell: `Bid >= bbU` };
      return { setup, buy: `Bid >= bbU`, sell: `Bid <= bbL` };
    },
  },
  atr: {
    logic: () => ({
      setup: [
        `double atr0 = iATR(Symbol(), InpTimeframe, 14, 0);`,
        `double atrAvg = 0; for(int aiI = 0; aiI < 50; aiI++) atrAvg += iATR(Symbol(), InpTimeframe, 14, aiI); atrAvg /= 50.0;`,
        `bool atrActive = (atr0 >= atrAvg * 0.5);`,
        `double atrHigh5 = iHigh(Symbol(), InpTimeframe, iHighest(Symbol(), InpTimeframe, MODE_HIGH, 5, 1));`,
        `double atrLow5  = iLow(Symbol(), InpTimeframe, iLowest(Symbol(), InpTimeframe, MODE_LOW, 5, 1));`,
      ],
      buy: `(atrActive && Bid > atrHigh5)`,
      sell: `(atrActive && Bid < atrLow5)`,
    }),
  },
  donchian: {
    logic: (s) => ({
      setup: [
        `double donHigh = iHigh(Symbol(), InpTimeframe, iHighest(Symbol(), InpTimeframe, MODE_HIGH, 20, 1));`,
        `double donLow  = iLow(Symbol(), InpTimeframe, iLowest(Symbol(), InpTimeframe, MODE_LOW, 20, 1));`,
      ],
      buy: isReversal(s) ? `Bid <= donLow` : `Bid >= donHigh`,
      sell: isReversal(s) ? `Bid >= donHigh` : `Bid <= donLow`,
    }),
  },
  kc: {
    logic: (s) => ({
      setup: [
        `double kcEma = iMA(Symbol(), InpTimeframe, 20, 0, MODE_EMA, PRICE_CLOSE, 0);`,
        `double kcAtr = iATR(Symbol(), InpTimeframe, 10, 0);`,
        `double kcUpper = kcEma + 2.0 * kcAtr;`,
        `double kcLower = kcEma - 2.0 * kcAtr;`,
      ],
      buy: isReversal(s) ? `Bid <= kcLower` : `Bid >= kcUpper`,
      sell: isReversal(s) ? `Bid >= kcUpper` : `Bid <= kcLower`,
    }),
  },

  // Volumen
  vol: {
    logic: () => ({
      setup: [
        `long volNow = iVolume(Symbol(), InpTimeframe, 0);`,
        `long volAvg = 0; for(int viI = 1; viI <= 20; viI++) volAvg += iVolume(Symbol(), InpTimeframe, viI); volAvg /= 20;`,
        `bool volSpike = (volNow > volAvg * 1.5);`,
        `double volHi5 = iHigh(Symbol(), InpTimeframe, iHighest(Symbol(), InpTimeframe, MODE_HIGH, 5, 1));`,
        `double volLo5 = iLow(Symbol(), InpTimeframe, iLowest(Symbol(), InpTimeframe, MODE_LOW, 5, 1));`,
      ],
      buy: `(volSpike && Bid > volHi5)`,
      sell: `(volSpike && Bid < volLo5)`,
    }),
  },
  obv: {
    // MQL4 no tiene iOBV nativo; aproximamos con MFI bajo/alto como volumen-momentum.
    // O usamos diferencia de precio*volumen acumulada de N velas.
    logic: () => ({
      setup: [
        `double obvSum = 0; for(int oiI = 0; oiI < 20; oiI++) { double prev = iClose(Symbol(), InpTimeframe, oiI + 1); double curr = iClose(Symbol(), InpTimeframe, oiI); long v = iVolume(Symbol(), InpTimeframe, oiI); if(curr > prev) obvSum += v; else if(curr < prev) obvSum -= v; }`,
      ],
      buy: `obvSum > 0`,
      sell: `obvSum < 0`,
    }),
  },
  vwap: {
    logic: () => ({
      setup: [
        `double vwapNum = 0; double vwapDen = 0;`,
        `for(int vwI = 1; vwI <= 50; vwI++) { double tp = (iHigh(Symbol(), InpTimeframe, vwI) + iLow(Symbol(), InpTimeframe, vwI) + iClose(Symbol(), InpTimeframe, vwI)) / 3.0; long vol = iVolume(Symbol(), InpTimeframe, vwI); vwapNum += tp * vol; vwapDen += vol; }`,
        `double vwap = (vwapDen > 0) ? vwapNum / vwapDen : Bid;`,
      ],
      buy: `Bid > vwap`,
      sell: `Bid < vwap`,
    }),
  },
  mfi: {
    logic: (s) => {
      const lo = isReversal(s) ? 25 : 20;
      const hi = isReversal(s) ? 75 : 80;
      return {
        setup: [`double mfi0 = iMFI(Symbol(), InpTimeframe, 14, 0);`],
        buy: `mfi0 < ${lo}`,
        sell: `mfi0 > ${hi}`,
      };
    },
  },

  // S/R
  fib: {
    logic: () => ({
      setup: [
        `double fibHigh = iHigh(Symbol(), InpTimeframe, iHighest(Symbol(), InpTimeframe, MODE_HIGH, 50, 1));`,
        `double fibLow  = iLow(Symbol(), InpTimeframe, iLowest(Symbol(), InpTimeframe, MODE_LOW, 50, 1));`,
        `double fibRange = fibHigh - fibLow;`,
        `double fibTol = fibRange * 0.05;`,
      ],
      buy: `(fibRange > 0 && MathAbs(Bid - (fibLow + fibRange * 0.382)) < fibTol)`,
      sell: `(fibRange > 0 && MathAbs(Bid - (fibLow + fibRange * 0.618)) < fibTol)`,
    }),
  },
  pivots: {
    logic: () => ({
      setup: [
        `double pivYH = iHigh(Symbol(), PERIOD_D1, 1);`,
        `double pivYL = iLow(Symbol(), PERIOD_D1, 1);`,
        `double pivYC = iClose(Symbol(), PERIOD_D1, 1);`,
        `double pivP = (pivYH + pivYL + pivYC) / 3.0;`,
        `double pivR1 = 2.0 * pivP - pivYL;`,
        `double pivS1 = 2.0 * pivP - pivYH;`,
        `double pivTol = (pivYH - pivYL) * 0.1;`,
      ],
      buy: `(pivYH > pivYL && MathAbs(Bid - pivS1) < pivTol)`,
      sell: `(pivYH > pivYL && MathAbs(Bid - pivR1) < pivTol)`,
    }),
  },
  sr: {
    logic: () => ({
      setup: [
        `double srRes = iHigh(Symbol(), InpTimeframe, iHighest(Symbol(), InpTimeframe, MODE_HIGH, 50, 1));`,
        `double srSup = iLow(Symbol(), InpTimeframe, iLowest(Symbol(), InpTimeframe, MODE_LOW, 50, 1));`,
        `double srTol = (srRes - srSup) * 0.05;`,
      ],
      buy: `(srRes > srSup && MathAbs(Bid - srSup) < srTol)`,
      sell: `(srRes > srSup && MathAbs(Bid - srRes) < srTol)`,
    }),
  },
};

function buildIndicatorBlocksMQL4(indicators: string[], strategy: string) {
  const setupLines: string[] = [];
  const buyConds: string[] = [];
  const sellConds: string[] = [];
  const isOnly = indicators.length === 1;
  for (const id of indicators) {
    const def = INDICATOR_DEFS_MQL4[id];
    if (!def) continue;
    const { setup, buy, sell } = def.logic(strategy, isOnly);
    setupLines.push(...setup);
    buyConds.push(buy);
    sellConds.push(sell);
  }
  return { setupLines, buyConds, sellConds };
}

export function generateMQL4(bot: {
  id?: string;
  name: string;
  description?: string | null;
  strategy: string;
  parameters: BotParams;
}): string {
  const p = bot.parameters || {};
  const risk = p.risk || {};
  const stopLoss = risk.stopLoss || 1.5;
  const takeProfit = risk.takeProfit || 3.0;
  const posSize = risk.posSize || 2.0;
  const dailyLoss = risk.dailyLoss || 4.0;
  const leverage = p.leverage || 30;
  const pair = p.pair || 'EURUSD';
  const symbol = pair.replace('/', '');
  const indicators = p.indicators || [];
  const strategy = bot.strategy || 'momentum';
  const generatedDate = new Date().toISOString().split('T')[0];
  const magicNumber = Math.floor(Math.random() * 900000) + 100000;

  const tfKey = (p.timeframe && TIMEFRAME_TO_MQL4[p.timeframe])
    ? p.timeframe
    : (STRATEGY_DEFAULT_TF_MQL4[strategy] || 'M15');
  const timeframeMQL = TIMEFRAME_TO_MQL4[tfKey];

  const lotConf = p.lot || {};
  const lotMode = lotConf.mode === 'fixed' ? 'fixed' : 'auto';
  const fixedLotRaw = typeof lotConf.fixedLot === 'number' ? lotConf.fixedLot : 0.10;
  const fixedLot = Math.min(100, Math.max(0.01, fixedLotRaw));

  const strategyDescriptions: Record<string, string> = {
    scalping: 'Scalping rápido (M1-M5)', swing: 'Swing trading (H4-D1)',
    grid: 'Grid trading', momentum: 'Momentum',
    mean: 'Mean reversion', breakout: 'Breakout',
    dca: 'DCA', trend: 'Trend following',
    reversal: 'Reversal', hedge: 'Hedging',
  };

  const sanitizeName = bot.name.replace(/[^a-zA-Z0-9_]/g, '_');

  const ind = buildIndicatorBlocksMQL4(indicators, strategy);
  if (ind.buyConds.length === 0 && ind.sellConds.length === 0) {
    ind.setupLines.push(`double recentHigh = iHigh(Symbol(), InpTimeframe, iHighest(Symbol(), InpTimeframe, MODE_HIGH, 10, 1));`);
    ind.setupLines.push(`double recentLow  = iLow(Symbol(), InpTimeframe, iLowest(Symbol(), InpTimeframe, MODE_LOW, 10, 1));`);
    ind.buyConds.push(`Bid > recentHigh`);
    ind.sellConds.push(`Bid < recentLow`);
  }
  const buyExpr = ind.buyConds.length > 0 ? ind.buyConds.join(' && ') : 'false';
  const sellExpr = ind.sellConds.length > 0 ? ind.sellConds.join(' && ') : 'false';

  return `//+------------------------------------------------------------------+
//|                                              ${sanitizeName}.mq4 |
//|                              Generado por YudBot · ${generatedDate} |
//|                                          https://yudbot.com |
//+------------------------------------------------------------------+
#property copyright "YudBot"
#property link      "https://yudbot.com"
#property version   "1.00"
#property strict
#property description "${bot.description || bot.name}"
#property description "Estrategia: ${strategyDescriptions[strategy] || strategy}"
#property description "Par: ${pair} · Apalancamiento: 1:${leverage}"

extern string  _GENERAL              = "═══ CONFIGURACIÓN GENERAL ═══";
extern int     InpTimeframe          = ${timeframeMQL};
extern int     InpMagicNumber        = ${magicNumber};
extern int     InpSlippage           = 10;

extern string  _LOT                  = "═══ TAMAÑO DE LOTE ═══";
extern bool    InpUseFixedLot        = ${lotMode === 'fixed' ? 'true' : 'false'};
extern double  InpFixedLot           = ${fixedLot.toFixed(2)};

extern string  _RISK                 = "═══ GESTIÓN DE RIESGO ═══";
extern double  InpStopLoss           = ${stopLoss};
extern double  InpTakeProfit         = ${takeProfit};
extern double  InpRiskPerTrade       = ${posSize};
extern double  InpMaxDailyLoss       = ${dailyLoss};
extern int     InpLeverage           = ${leverage};

extern string  _TIME                 = "═══ HORARIO DE OPERACIÓN ═══";
extern bool    InpUseTimeFilter      = true;
extern int     InpStartHour          = 8;
extern int     InpEndHour            = 22;

double initialBalance;
double dailyStartBalance;
datetime lastDayCheck;
int lastBarTime = 0;

int OnInit()
{
   Print("═══════════════════════════════════════");
   Print("  ${bot.name}");
   Print("  Generado por YudBot · ${generatedDate}");
   Print("═══════════════════════════════════════");
   initialBalance = AccountBalance();
   dailyStartBalance = initialBalance;
   lastDayCheck = TimeCurrent();
   Print("Bot inicializado correctamente");
   Print("Balance inicial: ", initialBalance);
   Print("Apalancamiento: 1:", InpLeverage);
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) { Print("Bot detenido. Razón: ", reason); }

bool CheckDailyLoss()
{
   datetime now = TimeCurrent();
   if(TimeDay(now) != TimeDay(lastDayCheck))
   {
      dailyStartBalance = AccountBalance();
      lastDayCheck = now;
   }
   double dailyLossPct = ((dailyStartBalance - AccountBalance()) / dailyStartBalance) * 100.0;
   if(dailyLossPct >= InpMaxDailyLoss)
   {
      Print("⚠️ Pérdida diaria máxima alcanzada (", dailyLossPct, "%) - Bot pausado");
      return false;
   }
   return true;
}

bool IsTradingHours()
{
   if(!InpUseTimeFilter) return true;
   int hour = TimeHour(TimeCurrent());
   return (hour >= InpStartHour && hour < InpEndHour);
}

double ClampLotToSymbol(double lot)
{
   double minLot  = MarketInfo(Symbol(), MODE_MINLOT);
   double maxLot  = MarketInfo(Symbol(), MODE_MAXLOT);
   double stepLot = MarketInfo(Symbol(), MODE_LOTSTEP);
   if(stepLot <= 0) stepLot = 0.01;
   lot = MathFloor(lot / stepLot) * stepLot;
   if(lot < minLot) lot = minLot;
   if(lot > maxLot) lot = maxLot;
   return NormalizeDouble(lot, 2);
}

double CalculateLotSize(double stopLossPips)
{
   double balance = AccountBalance();
   double riskAmount = balance * (InpRiskPerTrade / 100.0);
   double tickValue = MarketInfo(Symbol(), MODE_TICKVALUE);
   if(tickValue <= 0 || stopLossPips <= 0) return ClampLotToSymbol(InpFixedLot);
   double lot = riskAmount / (stopLossPips * tickValue);
   return ClampLotToSymbol(lot);
}

double GetTradeLot(double stopLossPips)
{
   if(InpUseFixedLot) return ClampLotToSymbol(InpFixedLot);
   return CalculateLotSize(stopLossPips);
}

bool HasOpenPosition()
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderMagicNumber() == InpMagicNumber && OrderSymbol() == Symbol())
         return true;
   }
   return false;
}

void OnTick()
{
   if(!CheckDailyLoss()) return;
   if(!IsTradingHours()) return;
   if(HasOpenPosition()) return;

   if(Time[0] == lastBarTime) return;
   lastBarTime = Time[0];

   //--- Estrategia: ${strategy} · indicadores: ${indicators.join(', ') || '(ninguno)'}
   bool buySignal = false;
   bool sellSignal = false;

   ${ind.setupLines.join('\n   ')}

   if(${buyExpr}) buySignal = true;
   if(${sellExpr}) sellSignal = true;

   if(buySignal)
   {
      double sl = Ask * (1 - InpStopLoss/100.0);
      double tp = Ask * (1 + InpTakeProfit/100.0);
      double lot = GetTradeLot(MathAbs(Ask - sl) / Point);
      int ticket = OrderSend(Symbol(), OP_BUY, lot, Ask, InpSlippage, sl, tp, "${bot.name} BUY", InpMagicNumber, 0, clrGreen);
      if(ticket < 0) Print("Error al abrir BUY: ", GetLastError());
      else Print("BUY abierta · Ticket: ", ticket, " · Lote: ", lot);
   }
   else if(sellSignal)
   {
      double sl = Bid * (1 + InpStopLoss/100.0);
      double tp = Bid * (1 - InpTakeProfit/100.0);
      double lot = GetTradeLot(MathAbs(sl - Bid) / Point);
      int ticket = OrderSend(Symbol(), OP_SELL, lot, Bid, InpSlippage, sl, tp, "${bot.name} SELL", InpMagicNumber, 0, clrRed);
      if(ticket < 0) Print("Error al abrir SELL: ", GetLastError());
      else Print("SELL abierta · Ticket: ", ticket, " · Lote: ", lot);
   }
}

//+------------------------------------------------------------------+
//| END OF FILE — Generado por YudBot                             |
//+------------------------------------------------------------------+
`;
}
