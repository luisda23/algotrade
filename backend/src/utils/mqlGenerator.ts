// mqlGenerator.ts — Genera código MQL5 desde la config del bot
//
// Arquitectura:
//   INDICATOR_DEFS_MQL5 — metadata por indicador (handle declarations en
//   OnInit, IndicatorRelease en OnDeinit, y la lógica de buy/sell que se
//   inyecta en OnTick). Añadir un indicador nuevo solo requiere extender
//   este objeto.
//
//   buildIndicatorBlocks() — recorre los indicadores que el usuario
//   eligió y produce los 4 bloques de código que el template inyecta:
//   globals, inits, releases, OnTick logic.

interface BotParams {
  market?: string;
  pair?: string;
  leverage?: number;
  indicators?: string[];
  timeframe?: 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';
  lot?: {
    mode?: 'auto' | 'fixed';
    fixedLot?: number;
  };
  risk?: {
    stopLoss?: number;
    takeProfit?: number;
    posSize?: number;
    dailyLoss?: number;
  };
  news?: {
    enabled?: boolean;
    beforeMin?: number;
    afterMin?: number;
    impactMin?: 'high' | 'medium' | 'all';
    events?: string[];
  };
  funded?: { enabled?: boolean; firm?: string };
}

const TIMEFRAME_TO_MQL: Record<string, string> = {
  M1: 'PERIOD_M1', M5: 'PERIOD_M5', M15: 'PERIOD_M15', M30: 'PERIOD_M30',
  H1: 'PERIOD_H1', H4: 'PERIOD_H4', D1: 'PERIOD_D1',
};
const STRATEGY_DEFAULT_TIMEFRAME: Record<string, string> = {
  scalping: 'M5', momentum: 'M15', mean: 'M15', breakout: 'H1',
  swing: 'H4', trend: 'H1', reversal: 'M30', grid: 'M15',
  dca: 'H4', hedge: 'H1',
};

// ─────────────────────────────────────────────────────────────────────
//  INDICATOR DEFINITIONS (MQL5)
// ─────────────────────────────────────────────────────────────────────
type IndDef = {
  // Línea(s) de declaración global (para handles). Vacío si no hace falta.
  globals?: string;
  // Código que va en OnInit para crear el handle. Vacío si no hace falta.
  init?: string;
  // Línea para OnDeinit (IndicatorRelease).
  release?: string;
  // Devuelve setup + condiciones para inyectar en OnTick.
  logic: (strategy: string, isOnly: boolean) => { setup: string[]; buy: string; sell: string };
};

// Helpers para no repetir
const isReversal = (s: string) => s === 'mean' || s === 'reversal';

const INDICATOR_DEFS_MQL5: Record<string, IndDef> = {
  // ─── MOMENTUM ───
  rsi: {
    globals: 'int handleRSI;',
    init: '   handleRSI = iRSI(InpSymbol, InpTimeframe, 14, PRICE_CLOSE);\n   if(handleRSI == INVALID_HANDLE) { Print("Error creando RSI"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleRSI);',
    logic: (s) => {
      const lo = isReversal(s) ? 35 : 30;
      const hi = isReversal(s) ? 65 : 70;
      return {
        setup: [`double rsi[]; ArraySetAsSeries(rsi, true); CopyBuffer(handleRSI, 0, 0, 2, rsi);`],
        buy: `rsi[0] < ${lo}`,
        sell: `rsi[0] > ${hi}`,
      };
    },
  },
  stoch: {
    globals: 'int handleStoch;',
    init: '   handleStoch = iStochastic(InpSymbol, InpTimeframe, 5, 3, 3, MODE_SMA, STO_LOWHIGH);\n   if(handleStoch == INVALID_HANDLE) { Print("Error creando Stochastic"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleStoch);',
    logic: (s, only) => {
      const lo = isReversal(s) ? 25 : 20;
      const hi = isReversal(s) ? 75 : 80;
      const setup = [
        `double stochMain[], stochSignal[]; ArraySetAsSeries(stochMain, true); ArraySetAsSeries(stochSignal, true);`,
        `CopyBuffer(handleStoch, 0, 0, 2, stochMain);`,
        `CopyBuffer(handleStoch, 1, 0, 2, stochSignal);`,
      ];
      if (only) {
        return { setup, buy: `(stochMain[0] > stochSignal[0] && stochMain[1] <= stochSignal[1] && stochMain[0] < ${lo + 30})`, sell: `(stochMain[0] < stochSignal[0] && stochMain[1] >= stochSignal[1] && stochMain[0] > ${hi - 30})` };
      }
      return { setup, buy: `stochMain[0] < ${lo}`, sell: `stochMain[0] > ${hi}` };
    },
  },
  stochrsi: {
    // Stoch RSI profesional: aplica el estocástico al RSI (período 14) y
    // suaviza con %K (3 barras SMA) y %D (3 barras SMA de %K). Esto da
    // señales más fiables que el Stoch RSI crudo.
    //   Buy: %K cruza al alza %D en zona de sobreventa
    //   Sell: %K cruza a la baja %D en zona de sobrecompra
    globals: 'int handleStochRSI_internalRSI;',
    init: '   handleStochRSI_internalRSI = iRSI(InpSymbol, InpTimeframe, 14, PRICE_CLOSE);\n   if(handleStochRSI_internalRSI == INVALID_HANDLE) { Print("Error creando Stoch RSI"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleStochRSI_internalRSI);',
    logic: (s) => {
      const lo = isReversal(s) ? 25 : 20;
      const hi = isReversal(s) ? 75 : 80;
      return {
        setup: [
          // Necesitamos los últimos 16 valores de RSI para poder calcular
          // 3 valores de Stoch RSI consecutivos y luego suavizarlos.
          `double srsi_rsi[]; ArraySetAsSeries(srsi_rsi, true); CopyBuffer(handleStochRSI_internalRSI, 0, 0, 16, srsi_rsi);`,
          // Stoch RSI para los últimos 3 valores: cada uno usa una ventana de 14 RSI.
          `double srsi_K_raw[3];`,
          `for(int sri = 0; sri < 3; sri++) {`,
          `   double sri_lo = srsi_rsi[sri], sri_hi = srsi_rsi[sri];`,
          `   for(int sri2 = sri; sri2 < sri + 14; sri2++) { if(srsi_rsi[sri2] < sri_lo) sri_lo = srsi_rsi[sri2]; if(srsi_rsi[sri2] > sri_hi) sri_hi = srsi_rsi[sri2]; }`,
          `   srsi_K_raw[sri] = (sri_hi > sri_lo) ? (srsi_rsi[sri] - sri_lo) / (sri_hi - sri_lo) * 100.0 : 50.0;`,
          `}`,
          // %K = SMA(stochRsi, 3), %D = SMA(%K, 3) — pero como solo tenemos 3
          // valores raw, %K es la SMA de los 3 y %D necesita historial; para %D
          // usamos un pequeño tracking estático.
          `double srsi_K = (srsi_K_raw[0] + srsi_K_raw[1] + srsi_K_raw[2]) / 3.0;`,
          `static double srsi_D_prev1 = 50.0, srsi_D_prev2 = 50.0;`,
          `static double srsi_K_prev = 50.0;`,
          `double srsi_D = (srsi_K + srsi_D_prev1 + srsi_D_prev2) / 3.0;`,
          // Detección de cruce
          `bool srsi_crossUp   = (srsi_K_prev <= srsi_D_prev1 && srsi_K > srsi_D);`,
          `bool srsi_crossDown = (srsi_K_prev >= srsi_D_prev1 && srsi_K < srsi_D);`,
          // Actualizar historial estático (en orden inverso para no sobreescribir)
          `srsi_D_prev2 = srsi_D_prev1; srsi_D_prev1 = srsi_D; srsi_K_prev = srsi_K;`,
        ],
        buy: `(srsi_crossUp && srsi_K < ${lo + 30})`,
        sell: `(srsi_crossDown && srsi_K > ${hi - 30})`,
      };
    },
  },
  cci: {
    globals: 'int handleCCI;',
    init: '   handleCCI = iCCI(InpSymbol, InpTimeframe, 14, PRICE_TYPICAL);\n   if(handleCCI == INVALID_HANDLE) { Print("Error creando CCI"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleCCI);',
    logic: () => ({
      setup: [`double cci[]; ArraySetAsSeries(cci, true); CopyBuffer(handleCCI, 0, 0, 2, cci);`],
      buy: `cci[0] < -100`,
      sell: `cci[0] > 100`,
    }),
  },
  williams: {
    globals: 'int handleWPR;',
    init: '   handleWPR = iWPR(InpSymbol, InpTimeframe, 14);\n   if(handleWPR == INVALID_HANDLE) { Print("Error creando Williams %R"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleWPR);',
    logic: () => ({
      setup: [`double wpr[]; ArraySetAsSeries(wpr, true); CopyBuffer(handleWPR, 0, 0, 2, wpr);`],
      buy: `wpr[0] < -80`,
      sell: `wpr[0] > -20`,
    }),
  },
  roc: {
    globals: 'int handleMomentum;',
    init: '   handleMomentum = iMomentum(InpSymbol, InpTimeframe, 14, PRICE_CLOSE);\n   if(handleMomentum == INVALID_HANDLE) { Print("Error creando ROC"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleMomentum);',
    logic: () => ({
      // iMomentum devuelve precios donde 100 = sin cambio. Lo convertimos a ROC: (val - 100).
      setup: [
        `double momBuf[]; ArraySetAsSeries(momBuf, true); CopyBuffer(handleMomentum, 0, 0, 2, momBuf);`,
        `double roc = momBuf[0] - 100.0;`,
      ],
      buy: `roc > 0.5`,   // momentum positivo
      sell: `roc < -0.5`, // momentum negativo
    }),
  },

  // ─── TENDENCIA ───
  ema: {
    globals: 'int handleEMA_fast;\nint handleEMA_slow;',
    init: '   handleEMA_fast = iMA(InpSymbol, InpTimeframe, 9, 0, MODE_EMA, PRICE_CLOSE);\n   handleEMA_slow = iMA(InpSymbol, InpTimeframe, 21, 0, MODE_EMA, PRICE_CLOSE);\n   if(handleEMA_fast == INVALID_HANDLE || handleEMA_slow == INVALID_HANDLE) { Print("Error creando EMA"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleEMA_fast);\n   IndicatorRelease(handleEMA_slow);',
    logic: (_s, only) => {
      const setup = [
        `double emaFast[], emaSlow[]; ArraySetAsSeries(emaFast, true); ArraySetAsSeries(emaSlow, true);`,
        `CopyBuffer(handleEMA_fast, 0, 0, 2, emaFast);`,
        `CopyBuffer(handleEMA_slow, 0, 0, 2, emaSlow);`,
      ];
      if (only) {
        return { setup, buy: `(emaFast[0] > emaSlow[0] && emaFast[1] <= emaSlow[1])`, sell: `(emaFast[0] < emaSlow[0] && emaFast[1] >= emaSlow[1])` };
      }
      return { setup, buy: `emaFast[0] > emaSlow[0]`, sell: `emaFast[0] < emaSlow[0]` };
    },
  },
  sma: {
    globals: 'int handleSMA_fast;\nint handleSMA_slow;',
    init: '   handleSMA_fast = iMA(InpSymbol, InpTimeframe, 9, 0, MODE_SMA, PRICE_CLOSE);\n   handleSMA_slow = iMA(InpSymbol, InpTimeframe, 21, 0, MODE_SMA, PRICE_CLOSE);\n   if(handleSMA_fast == INVALID_HANDLE || handleSMA_slow == INVALID_HANDLE) { Print("Error creando SMA"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleSMA_fast);\n   IndicatorRelease(handleSMA_slow);',
    logic: (_s, only) => {
      const setup = [
        `double smaFast[], smaSlow[]; ArraySetAsSeries(smaFast, true); ArraySetAsSeries(smaSlow, true);`,
        `CopyBuffer(handleSMA_fast, 0, 0, 2, smaFast);`,
        `CopyBuffer(handleSMA_slow, 0, 0, 2, smaSlow);`,
      ];
      if (only) {
        return { setup, buy: `(smaFast[0] > smaSlow[0] && smaFast[1] <= smaSlow[1])`, sell: `(smaFast[0] < smaSlow[0] && smaFast[1] >= smaSlow[1])` };
      }
      return { setup, buy: `smaFast[0] > smaSlow[0]`, sell: `smaFast[0] < smaSlow[0]` };
    },
  },
  macd: {
    globals: 'int handleMACD;',
    init: '   handleMACD = iMACD(InpSymbol, InpTimeframe, 12, 26, 9, PRICE_CLOSE);\n   if(handleMACD == INVALID_HANDLE) { Print("Error creando MACD"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleMACD);',
    logic: (_s, only) => {
      const setup = [
        `double macdMain[], macdSignal[]; ArraySetAsSeries(macdMain, true); ArraySetAsSeries(macdSignal, true);`,
        `CopyBuffer(handleMACD, 0, 0, 2, macdMain);`,
        `CopyBuffer(handleMACD, 1, 0, 2, macdSignal);`,
      ];
      if (only) {
        return { setup, buy: `(macdMain[0] > macdSignal[0] && macdMain[1] <= macdSignal[1])`, sell: `(macdMain[0] < macdSignal[0] && macdMain[1] >= macdSignal[1])` };
      }
      return { setup, buy: `macdMain[0] > macdSignal[0]`, sell: `macdMain[0] < macdSignal[0]` };
    },
  },
  adx: {
    globals: 'int handleADX;',
    init: '   handleADX = iADX(InpSymbol, InpTimeframe, 14);\n   if(handleADX == INVALID_HANDLE) { Print("Error creando ADX"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleADX);',
    logic: () => ({
      // Buffer 0 = ADX (fuerza), 1 = +DI, 2 = -DI. Usamos +DI vs -DI para dirección con ADX>20 como filtro.
      setup: [
        `double adxMain[], adxPlus[], adxMinus[]; ArraySetAsSeries(adxMain, true); ArraySetAsSeries(adxPlus, true); ArraySetAsSeries(adxMinus, true);`,
        `CopyBuffer(handleADX, 0, 0, 2, adxMain);`,
        `CopyBuffer(handleADX, 1, 0, 2, adxPlus);`,
        `CopyBuffer(handleADX, 2, 0, 2, adxMinus);`,
      ],
      buy: `(adxMain[0] > 20 && adxPlus[0] > adxMinus[0])`,
      sell: `(adxMain[0] > 20 && adxPlus[0] < adxMinus[0])`,
    }),
  },
  ichi: {
    globals: 'int handleIchi;',
    init: '   handleIchi = iIchimoku(InpSymbol, InpTimeframe, 9, 26, 52);\n   if(handleIchi == INVALID_HANDLE) { Print("Error creando Ichimoku"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleIchi);',
    logic: (_s, only) => {
      // Ichimoku buffers: 0=Tenkan, 1=Kijun, 2=SenkouA, 3=SenkouB, 4=Chikou
      const setup = [
        `double ichiTenkan[], ichiKijun[], ichiSenkouA[], ichiSenkouB[]; ArraySetAsSeries(ichiTenkan, true); ArraySetAsSeries(ichiKijun, true); ArraySetAsSeries(ichiSenkouA, true); ArraySetAsSeries(ichiSenkouB, true);`,
        `CopyBuffer(handleIchi, 0, 0, 2, ichiTenkan);`,
        `CopyBuffer(handleIchi, 1, 0, 2, ichiKijun);`,
        `CopyBuffer(handleIchi, 2, 0, 1, ichiSenkouA);`,
        `CopyBuffer(handleIchi, 3, 0, 1, ichiSenkouB);`,
      ];
      if (only) {
        // Cruce Tenkan/Kijun (TK cross) + precio fuera del Kumo
        return { setup,
          buy: `(ichiTenkan[0] > ichiKijun[0] && ichiTenkan[1] <= ichiKijun[1] && bidPrice > ichiSenkouA[0])`,
          sell: `(ichiTenkan[0] < ichiKijun[0] && ichiTenkan[1] >= ichiKijun[1] && bidPrice < ichiSenkouB[0])`,
        };
      }
      return { setup, buy: `(ichiTenkan[0] > ichiKijun[0] && bidPrice > ichiSenkouA[0])`, sell: `(ichiTenkan[0] < ichiKijun[0] && bidPrice < ichiSenkouB[0])` };
    },
  },
  psar: {
    globals: 'int handleSAR;',
    init: '   handleSAR = iSAR(InpSymbol, InpTimeframe, 0.02, 0.2);\n   if(handleSAR == INVALID_HANDLE) { Print("Error creando Parabolic SAR"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleSAR);',
    logic: () => ({
      setup: [`double sar[]; ArraySetAsSeries(sar, true); CopyBuffer(handleSAR, 0, 0, 2, sar);`],
      buy: `bidPrice > sar[0]`,   // SAR debajo del precio = uptrend
      sell: `bidPrice < sar[0]`,  // SAR encima del precio = downtrend
    }),
  },
  supertrend: {
    // SuperTrend profesional: línea de trailing que alterna entre upper-band
    // y lower-band según la dirección de la tendencia. Cuando el precio cruza
    // la línea activa, la tendencia se invierte (esto genera la señal). La
    // línea no retrocede: en uptrend solo sube, en downtrend solo baja.
    //   Buy: trend acaba de cambiar a alcista (de -1 a +1)
    //   Sell: trend acaba de cambiar a bajista (de +1 a -1)
    globals: 'int handleST_ATR;',
    init: '   handleST_ATR = iATR(InpSymbol, InpTimeframe, 10);\n   if(handleST_ATR == INVALID_HANDLE) { Print("Error creando SuperTrend"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleST_ATR);',
    logic: () => ({
      setup: [
        `double stAtrBuf[]; ArraySetAsSeries(stAtrBuf, true); CopyBuffer(handleST_ATR, 0, 0, 1, stAtrBuf);`,
        `double stMid = (iHigh(InpSymbol, InpTimeframe, 1) + iLow(InpSymbol, InpTimeframe, 1)) / 2.0;`,
        `double stClosePrev = iClose(InpSymbol, InpTimeframe, 1);`,
        `double stBasicUp = stMid + 3.0 * stAtrBuf[0];`,
        `double stBasicDn = stMid - 3.0 * stAtrBuf[0];`,
        // Estado persistido entre barras
        `static double st_line = 0;`,
        `static int st_dir = 0; // 0=init, 1=up, -1=down`,
        `int st_prevDir = st_dir;`,
        `if(st_dir == 0) {`,
        `   st_dir = (stClosePrev > stMid) ? 1 : -1;`,
        `   st_line = (st_dir == 1) ? stBasicDn : stBasicUp;`,
        `} else if(st_dir == 1) {`,
        `   double newLine = MathMax(stBasicDn, st_line); // la línea no baja en uptrend`,
        `   if(stClosePrev < newLine) { st_dir = -1; st_line = stBasicUp; } else { st_line = newLine; }`,
        `} else {`,
        `   double newLine = MathMin(stBasicUp, st_line); // la línea no sube en downtrend`,
        `   if(stClosePrev > newLine) { st_dir = 1; st_line = stBasicDn; } else { st_line = newLine; }`,
        `}`,
        `bool st_buy_signal  = (st_dir == 1  && st_prevDir != 1);`,
        `bool st_sell_signal = (st_dir == -1 && st_prevDir != -1);`,
      ],
      buy: `st_buy_signal`,
      sell: `st_sell_signal`,
    }),
  },

  // ─── VOLATILIDAD ───
  bb: {
    globals: 'int handleBB;',
    init: '   handleBB = iBands(InpSymbol, InpTimeframe, 20, 0, 2.0, PRICE_CLOSE);\n   if(handleBB == INVALID_HANDLE) { Print("Error creando Bollinger"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleBB);',
    logic: (s) => {
      const setup = [
        `double bbUpper[], bbLower[], bbMiddle[]; ArraySetAsSeries(bbUpper, true); ArraySetAsSeries(bbLower, true); ArraySetAsSeries(bbMiddle, true);`,
        `CopyBuffer(handleBB, UPPER_BAND, 0, 1, bbUpper);`,
        `CopyBuffer(handleBB, LOWER_BAND, 0, 1, bbLower);`,
        `CopyBuffer(handleBB, BASE_LINE, 0, 1, bbMiddle);`,
      ];
      if (isReversal(s)) return { setup, buy: `bidPrice <= bbLower[0]`, sell: `bidPrice >= bbUpper[0]` };
      return { setup, buy: `bidPrice >= bbUpper[0]`, sell: `bidPrice <= bbLower[0]` };
    },
  },
  atr: {
    globals: 'int handleATR;',
    init: '   handleATR = iATR(InpSymbol, InpTimeframe, 14);\n   if(handleATR == INVALID_HANDLE) { Print("Error creando ATR"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleATR);',
    logic: () => ({
      // ATR como filtro: solo opera si la volatilidad actual es razonable
      // (>= 50% de su media en 50 barras). No genera dirección por sí mismo,
      // así que pareja con price-action: ruptura de 5 velas en alta volatilidad.
      setup: [
        `double atrBuf[]; ArraySetAsSeries(atrBuf, true); CopyBuffer(handleATR, 0, 0, 50, atrBuf);`,
        `double atrAvg = 0; for(int aiI = 0; aiI < 50; aiI++) atrAvg += atrBuf[aiI]; atrAvg /= 50.0;`,
        `bool atrActive = (atrBuf[0] >= atrAvg * 0.5);`,
        `double atrHigh5 = iHigh(InpSymbol, InpTimeframe, iHighest(InpSymbol, InpTimeframe, MODE_HIGH, 5, 1));`,
        `double atrLow5  = iLow(InpSymbol, InpTimeframe, iLowest(InpSymbol, InpTimeframe, MODE_LOW, 5, 1));`,
      ],
      buy: `(atrActive && bidPrice > atrHigh5)`,
      sell: `(atrActive && bidPrice < atrLow5)`,
    }),
  },
  donchian: {
    // Donchian = canal de N velas. Sin handle, calculamos in-place.
    logic: (s) => ({
      setup: [
        `double donHigh = iHigh(InpSymbol, InpTimeframe, iHighest(InpSymbol, InpTimeframe, MODE_HIGH, 20, 1));`,
        `double donLow  = iLow(InpSymbol, InpTimeframe, iLowest(InpSymbol, InpTimeframe, MODE_LOW, 20, 1));`,
      ],
      buy: isReversal(s) ? `bidPrice <= donLow` : `bidPrice >= donHigh`,
      sell: isReversal(s) ? `bidPrice >= donHigh` : `bidPrice <= donLow`,
    }),
  },
  kc: {
    // Keltner Channels = EMA20 ± ATR(10)*2. Reusamos handleATR si está, si
    // no creamos uno propio. Para simplicidad, creamos handles propios.
    globals: 'int handleKC_EMA;\nint handleKC_ATR;',
    init: '   handleKC_EMA = iMA(InpSymbol, InpTimeframe, 20, 0, MODE_EMA, PRICE_CLOSE);\n   handleKC_ATR = iATR(InpSymbol, InpTimeframe, 10);\n   if(handleKC_EMA == INVALID_HANDLE || handleKC_ATR == INVALID_HANDLE) { Print("Error creando Keltner"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleKC_EMA);\n   IndicatorRelease(handleKC_ATR);',
    logic: (s) => ({
      setup: [
        `double kcEma[], kcAtr[]; ArraySetAsSeries(kcEma, true); ArraySetAsSeries(kcAtr, true);`,
        `CopyBuffer(handleKC_EMA, 0, 0, 1, kcEma);`,
        `CopyBuffer(handleKC_ATR, 0, 0, 1, kcAtr);`,
        `double kcUpper = kcEma[0] + 2.0 * kcAtr[0];`,
        `double kcLower = kcEma[0] - 2.0 * kcAtr[0];`,
      ],
      buy: isReversal(s) ? `bidPrice <= kcLower` : `bidPrice >= kcUpper`,
      sell: isReversal(s) ? `bidPrice >= kcUpper` : `bidPrice <= kcLower`,
    }),
  },

  // ─── VOLUMEN ───
  vol: {
    // Volume: opera solo cuando el volumen actual supera el promedio reciente.
    logic: () => ({
      setup: [
        `long volNow = iVolume(InpSymbol, InpTimeframe, 0);`,
        `long volAvg = 0; for(int viI = 1; viI <= 20; viI++) volAvg += iVolume(InpSymbol, InpTimeframe, viI); volAvg /= 20;`,
        `bool volSpike = (volNow > volAvg * 1.5);`,
        `double volHi5 = iHigh(InpSymbol, InpTimeframe, iHighest(InpSymbol, InpTimeframe, MODE_HIGH, 5, 1));`,
        `double volLo5 = iLow(InpSymbol, InpTimeframe, iLowest(InpSymbol, InpTimeframe, MODE_LOW, 5, 1));`,
      ],
      buy: `(volSpike && bidPrice > volHi5)`,
      sell: `(volSpike && bidPrice < volLo5)`,
    }),
  },
  obv: {
    globals: 'int handleOBV;',
    init: '   handleOBV = iOBV(InpSymbol, InpTimeframe, VOLUME_TICK);\n   if(handleOBV == INVALID_HANDLE) { Print("Error creando OBV"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleOBV);',
    logic: () => ({
      // Comparamos OBV actual contra su media simple de 20 barras.
      setup: [
        `double obv[]; ArraySetAsSeries(obv, true); CopyBuffer(handleOBV, 0, 0, 20, obv);`,
        `double obvAvg = 0; for(int oiI = 0; oiI < 20; oiI++) obvAvg += obv[oiI]; obvAvg /= 20.0;`,
      ],
      buy: `obv[0] > obvAvg`,
      sell: `obv[0] < obvAvg`,
    }),
  },
  vwap: {
    // VWAP profesional: resetea al inicio de cada día UTC y acumula
    // typical_price * volumen. Es la referencia institucional clásica.
    //   Buy: precio cruza por encima del VWAP (de abajo a arriba)
    //   Sell: precio cruza por debajo del VWAP
    logic: () => ({
      setup: [
        `MqlDateTime vwap_dt; TimeToStruct(TimeCurrent(), vwap_dt);`,
        `static int vwap_day = 0;`,
        `static double vwap_cumPV = 0;`,
        `static double vwap_cumV = 0;`,
        `static double vwap_prev = 0;`,
        `static double vwap_prevPrice = 0;`,
        // Reset al cambiar de día
        `if(vwap_dt.day != vwap_day) {`,
        `   vwap_cumPV = 0; vwap_cumV = 0; vwap_day = vwap_dt.day;`,
        `}`,
        // Acumular barra que acaba de cerrar (bar 1)
        `double vwap_tp = (iHigh(InpSymbol, InpTimeframe, 1) + iLow(InpSymbol, InpTimeframe, 1) + iClose(InpSymbol, InpTimeframe, 1)) / 3.0;`,
        `long vwap_v = iVolume(InpSymbol, InpTimeframe, 1);`,
        `vwap_cumPV += vwap_tp * vwap_v;`,
        `vwap_cumV  += vwap_v;`,
        `double vwap = (vwap_cumV > 0) ? vwap_cumPV / vwap_cumV : bidPrice;`,
        // Detección de cruce sobre VWAP
        `bool vwap_crossUp   = (vwap_prev > 0 && vwap_prevPrice <= vwap_prev && bidPrice > vwap);`,
        `bool vwap_crossDown = (vwap_prev > 0 && vwap_prevPrice >= vwap_prev && bidPrice < vwap);`,
        `vwap_prev = vwap; vwap_prevPrice = bidPrice;`,
      ],
      buy: `vwap_crossUp`,
      sell: `vwap_crossDown`,
    }),
  },
  mfi: {
    globals: 'int handleMFI;',
    init: '   handleMFI = iMFI(InpSymbol, InpTimeframe, 14, VOLUME_TICK);\n   if(handleMFI == INVALID_HANDLE) { Print("Error creando MFI"); return INIT_FAILED; }',
    release: '   IndicatorRelease(handleMFI);',
    logic: (s) => {
      const lo = isReversal(s) ? 25 : 20;
      const hi = isReversal(s) ? 75 : 80;
      return {
        setup: [`double mfi[]; ArraySetAsSeries(mfi, true); CopyBuffer(handleMFI, 0, 0, 2, mfi);`],
        buy: `mfi[0] < ${lo}`,
        sell: `mfi[0] > ${hi}`,
      };
    },
  },

  // ─── SOPORTE / RESISTENCIA ───
  fib: {
    // Fibonacci simplificado: detecta swing high/low de las últimas 50 velas
    // y señala cuando el precio retrocede al 50% (zona de equilibrio).
    logic: () => ({
      setup: [
        `double fibHigh = iHigh(InpSymbol, InpTimeframe, iHighest(InpSymbol, InpTimeframe, MODE_HIGH, 50, 1));`,
        `double fibLow  = iLow(InpSymbol, InpTimeframe, iLowest(InpSymbol, InpTimeframe, MODE_LOW, 50, 1));`,
        `double fibRange = fibHigh - fibLow;`,
        `double fib50 = fibLow + fibRange * 0.5;`,
        `double fibTol = fibRange * 0.05;`,
      ],
      buy: `(fibRange > 0 && MathAbs(bidPrice - (fibLow + fibRange * 0.382)) < fibTol)`,
      sell: `(fibRange > 0 && MathAbs(bidPrice - (fibLow + fibRange * 0.618)) < fibTol)`,
    }),
  },
  pivots: {
    // Pivot Points clásicos del día anterior.
    logic: () => ({
      setup: [
        `double pivYH = iHigh(InpSymbol, PERIOD_D1, 1);`,
        `double pivYL = iLow(InpSymbol, PERIOD_D1, 1);`,
        `double pivYC = iClose(InpSymbol, PERIOD_D1, 1);`,
        `double pivP = (pivYH + pivYL + pivYC) / 3.0;`,
        `double pivR1 = 2.0 * pivP - pivYL;`,
        `double pivS1 = 2.0 * pivP - pivYH;`,
        `double pivTol = (pivYH - pivYL) * 0.1;`,
      ],
      buy: `(pivYH > pivYL && MathAbs(bidPrice - pivS1) < pivTol)`,
      sell: `(pivYH > pivYL && MathAbs(bidPrice - pivR1) < pivTol)`,
    }),
  },
  sr: {
    // S/R automático: usa los extremos de 50 velas como niveles. Buy cerca
    // del soporte, sell cerca de la resistencia.
    logic: () => ({
      setup: [
        `double srRes = iHigh(InpSymbol, InpTimeframe, iHighest(InpSymbol, InpTimeframe, MODE_HIGH, 50, 1));`,
        `double srSup = iLow(InpSymbol, InpTimeframe, iLowest(InpSymbol, InpTimeframe, MODE_LOW, 50, 1));`,
        `double srTol = (srRes - srSup) * 0.05;`,
      ],
      buy: `(srRes > srSup && MathAbs(bidPrice - srSup) < srTol)`,
      sell: `(srRes > srSup && MathAbs(bidPrice - srRes) < srTol)`,
    }),
  },
};

function buildIndicatorBlocks(indicators: string[], strategy: string) {
  const globals: string[] = [];
  const inits: string[] = [];
  const releases: string[] = [];
  const setupLines: string[] = [];
  const buyConds: string[] = [];
  const sellConds: string[] = [];

  const isOnly = indicators.length === 1;

  for (const id of indicators) {
    const def = INDICATOR_DEFS_MQL5[id];
    if (!def) continue; // ignora indicadores no implementados (no debería pasar con el wizard filtrado)
    if (def.globals) globals.push(def.globals);
    if (def.init) inits.push(def.init);
    if (def.release) releases.push(def.release);
    const { setup, buy, sell } = def.logic(strategy, isOnly);
    setupLines.push(...setup);
    buyConds.push(buy);
    sellConds.push(sell);
  }

  return { globals, inits, releases, setupLines, buyConds, sellConds };
}

export function generateMQL5(bot: {
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

  const tfKey = (p.timeframe && TIMEFRAME_TO_MQL[p.timeframe])
    ? p.timeframe
    : (STRATEGY_DEFAULT_TIMEFRAME[strategy] || 'M15');
  const timeframeMQL = TIMEFRAME_TO_MQL[tfKey];

  const lotConf = p.lot || {};
  const lotMode = lotConf.mode === 'fixed' ? 'fixed' : 'auto';
  const fixedLotRaw = typeof lotConf.fixedLot === 'number' ? lotConf.fixedLot : 0.10;
  const fixedLot = Math.min(100, Math.max(0.01, fixedLotRaw));

  const news = p.news || {};
  const newsEnabled = news.enabled !== false;
  const newsBefore = news.beforeMin ?? 30;
  const newsAfter = news.afterMin ?? 15;
  const newsImpactMQL = news.impactMin === 'all' ? 'CALENDAR_IMPORTANCE_LOW'
                     : news.impactMin === 'medium' ? 'CALENDAR_IMPORTANCE_MODERATE'
                     : 'CALENDAR_IMPORTANCE_HIGH';
  const NEWS_EVENT_PATTERNS: Record<string, string> = {
    'nfp': 'Nonfarm Payrolls', 'fomc': 'Federal Funds Rate|FOMC',
    'cpi-us': 'Consumer Price Index|CPI', 'powell': 'Powell|FOMC Press',
    'gdp-us': 'Gross Domestic Product|GDP', 'retail-us': 'Retail Sales',
    'unemp-us': 'Unemployment Rate', 'ism-us': 'ISM',
    'ecb-rate': 'Main Refinancing|Deposit Facility|ECB Interest',
    'ecb-press': 'ECB Press|Lagarde', 'cpi-eu': 'Consumer Price Index|CPI|HICP',
    'gdp-eu': 'Gross Domestic Product|GDP', 'pmi-eu': 'PMI',
    'boe-rate': 'Bank Rate|BOE Interest', 'cpi-uk': 'Consumer Price Index|CPI',
    'gdp-uk': 'Gross Domestic Product|GDP', 'boj-rate': 'BOJ Interest|Policy Rate',
  };
  const selectedEventIds = (news.events && Array.isArray(news.events))
    ? news.events
    : Object.keys(NEWS_EVENT_PATTERNS);
  const effectiveNewsEnabled = newsEnabled && selectedEventIds.length > 0;
  const newsPatternsStr = selectedEventIds
    .map(id => NEWS_EVENT_PATTERNS[id])
    .filter(Boolean)
    .join('||')
    .replace(/"/g, '\\"');
  const newsHasEventFilter = selectedEventIds.length > 0 && selectedEventIds.length < Object.keys(NEWS_EVENT_PATTERNS).length;
  const generatedDate = new Date().toISOString().split('T')[0];

  const strategyDescriptions: Record<string, string> = {
    scalping: 'Scalping rápido (1m-5m timeframe)',
    swing: 'Swing trading (4h-1d timeframe)',
    grid: 'Grid trading con niveles fijos',
    momentum: 'Momentum con detección de fuerza',
    mean: 'Mean reversion (reversión a la media)',
    breakout: 'Breakout de rango',
    dca: 'Dollar-cost averaging',
    trend: 'Trend following',
    reversal: 'Reversal',
    hedge: 'Hedging',
  };

  const sanitizeName = bot.name.replace(/[^a-zA-Z0-9_]/g, '_');

  // Construye los bloques del indicador-driven
  const ind = buildIndicatorBlocks(indicators, strategy);

  // Si el usuario no eligió indicadores, fallback de 10 velas para que el bot
  // siempre tenga señal en lugar de quedarse mudo
  if (ind.buyConds.length === 0 && ind.sellConds.length === 0) {
    ind.setupLines.push(`double recentHigh = iHigh(InpSymbol, InpTimeframe, iHighest(InpSymbol, InpTimeframe, MODE_HIGH, 10, 1));`);
    ind.setupLines.push(`double recentLow  = iLow(InpSymbol, InpTimeframe, iLowest(InpSymbol, InpTimeframe, MODE_LOW, 10, 1));`);
    ind.buyConds.push(`bidPrice > recentHigh`);
    ind.sellConds.push(`bidPrice < recentLow`);
  }

  const buyExpr = ind.buyConds.length > 0 ? ind.buyConds.join(' && ') : 'false';
  const sellExpr = ind.sellConds.length > 0 ? ind.sellConds.join(' && ') : 'false';

  return `//+------------------------------------------------------------------+
//|                                              ${sanitizeName}.mq5 |
//|                              Generado por YudBot · ${generatedDate} |
//|                                          https://yudbot.com |
//+------------------------------------------------------------------+
#property copyright "YudBot"
#property link      "https://yudbot.com"
#property version   "1.00"
#property description "${bot.description || bot.name}"
#property description "Estrategia: ${strategyDescriptions[strategy] || strategy}"
#property description "Par: ${pair} · Apalancamiento: 1:${leverage}"

#include <Trade\\Trade.mqh>
#include <Trade\\PositionInfo.mqh>
#include <Trade\\SymbolInfo.mqh>

input group    "═══ CONFIGURACIÓN GENERAL ═══"
input string         InpSymbol      = "${symbol}";
input ENUM_TIMEFRAMES InpTimeframe  = ${timeframeMQL};
input int            InpMagicNumber = ${Math.floor(Math.random() * 900000) + 100000};

input group    "═══ TAMAÑO DE LOTE ═══"
input bool     InpUseFixedLot      = ${lotMode === 'fixed' ? 'true' : 'false'};
input double   InpFixedLot         = ${fixedLot.toFixed(2)};

input group    "═══ GESTIÓN DE RIESGO ═══"
input double   InpStopLoss         = ${stopLoss};
input double   InpTakeProfit       = ${takeProfit};
input double   InpRiskPerTrade     = ${posSize};
input double   InpMaxDailyLoss     = ${dailyLoss};
input int      InpLeverage         = ${leverage};

input group    "═══ HORARIO DE OPERACIÓN ═══"
input bool     InpUseTimeFilter    = true;
input int      InpStartHour        = 8;
input int      InpEndHour          = 22;

input group    "═══ FILTRO DE NOTICIAS ═══"
input bool     InpFilterNews       = ${effectiveNewsEnabled};
input int      InpNewsMinutesBefore = ${newsBefore};
input int      InpNewsMinutesAfter  = ${newsAfter};
input ENUM_CALENDAR_EVENT_IMPORTANCE InpNewsMinImpact = ${newsImpactMQL};
input bool     InpNewsFilterByName  = ${newsHasEventFilter};
input string   InpNewsPatterns      = "${newsPatternsStr}";

CTrade        trade;
CPositionInfo position;
CSymbolInfo   symbolInfo;

double initialBalance;
double dailyStartBalance;
datetime lastDayCheck;

${ind.globals.join('\n')}

int OnInit()
{
   Print("═══════════════════════════════════════");
   Print("  ${bot.name}");
   Print("  Generado por YudBot · ${generatedDate}");
   Print("═══════════════════════════════════════");

   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetMarginMode();
   trade.SetTypeFillingBySymbol(InpSymbol);
   trade.SetDeviationInPoints(10);

   if(!symbolInfo.Name(InpSymbol))
   {
      Print("Error: No se puede acceder al símbolo ", InpSymbol);
      return(INIT_FAILED);
   }

${ind.inits.join('\n')}

   initialBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   dailyStartBalance = initialBalance;
   lastDayCheck = TimeCurrent();

   Print("Bot inicializado correctamente");
   Print("Balance inicial: ", initialBalance);
   Print("Apalancamiento: 1:", InpLeverage);

   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
${ind.releases.join('\n')}
}

bool EventMatchesPatterns(const string eventName, const string patterns)
{
   if(StringLen(patterns) == 0) return true;
   string lname = eventName;
   StringToLower(lname);
   string parts[];
   int n = StringSplit(patterns, '|', parts);
   for(int i = 0; i < n; i++)
   {
      string p = parts[i];
      if(StringLen(p) == 0) continue;
      string lp = p;
      StringToLower(lp);
      if(StringFind(lname, lp) >= 0) return true;
   }
   return false;
}

bool IsNewsTime()
{
   if(!InpFilterNews) return false;
   string base = StringSubstr(InpSymbol, 0, 3);
   string quote = StringSubstr(InpSymbol, 3, 3);
   datetime fromTime = TimeCurrent() - InpNewsMinutesAfter * 60;
   datetime toTime   = TimeCurrent() + InpNewsMinutesBefore * 60;
   string countries[2] = { base, quote };
   for(int c = 0; c < 2; c++)
   {
      MqlCalendarValue values[];
      int n = CalendarValueHistory(values, fromTime, toTime, NULL, countries[c]);
      for(int i = 0; i < n; i++)
      {
         MqlCalendarEvent ev;
         if(!CalendarEventById(values[i].event_id, ev)) continue;
         if(ev.importance < InpNewsMinImpact) continue;
         if(InpNewsFilterByName && !EventMatchesPatterns(ev.name, InpNewsPatterns)) continue;
         long evTime = (long)values[i].time;
         long now    = (long)TimeCurrent();
         long diff   = evTime - now;
         if(diff <= InpNewsMinutesBefore * 60 && diff >= -InpNewsMinutesAfter * 60) return true;
      }
   }
   return false;
}

bool CheckDailyLoss()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   MqlDateTime lastDt;
   TimeToStruct(lastDayCheck, lastDt);
   if(dt.day != lastDt.day)
   {
      dailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
      lastDayCheck = TimeCurrent();
   }
   double currentBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   double dailyLossPct = ((dailyStartBalance - currentBalance) / dailyStartBalance) * 100.0;
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
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   return (dt.hour >= InpStartHour && dt.hour < InpEndHour);
}

double ClampLotToSymbol(double lot)
{
   double minLot  = SymbolInfoDouble(InpSymbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(InpSymbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(InpSymbol, SYMBOL_VOLUME_STEP);
   if(stepLot <= 0) stepLot = 0.01;
   lot = MathFloor(lot / stepLot) * stepLot;
   if(lot < minLot) lot = minLot;
   if(lot > maxLot) lot = maxLot;
   return NormalizeDouble(lot, 2);
}

double CalculateLotSize(double stopLossPips)
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskAmount = balance * (InpRiskPerTrade / 100.0);
   double tickValue = SymbolInfoDouble(InpSymbol, SYMBOL_TRADE_TICK_VALUE);
   if(tickValue <= 0 || stopLossPips <= 0) return ClampLotToSymbol(InpFixedLot);
   double lot = riskAmount / (stopLossPips * tickValue);
   return ClampLotToSymbol(lot);
}

double GetTradeLot(double stopLossPips)
{
   if(InpUseFixedLot) return ClampLotToSymbol(InpFixedLot);
   return CalculateLotSize(stopLossPips);
}

void OnTick()
{
   if(!CheckDailyLoss()) return;
   if(!IsTradingHours()) return;
   if(IsNewsTime()) return;
   if(PositionsTotal() > 0) return;

   static datetime lastBarTime = 0;
   datetime currentBarTime = (datetime)SeriesInfoInteger(InpSymbol, InpTimeframe, SERIES_LASTBAR_DATE);
   if(currentBarTime == lastBarTime) return;
   lastBarTime = currentBarTime;

   //--- Estrategia: ${strategy} · indicadores: ${indicators.join(', ') || '(ninguno)'}
   double bidPrice = SymbolInfoDouble(InpSymbol, SYMBOL_BID);
   bool buySignal = false;
   bool sellSignal = false;

   ${ind.setupLines.join('\n   ')}

   if(${buyExpr}) buySignal = true;
   if(${sellExpr}) sellSignal = true;

   if(buySignal)
   {
      double ask = SymbolInfoDouble(InpSymbol, SYMBOL_ASK);
      double sl = ask * (1 - InpStopLoss/100.0);
      double tp = ask * (1 + InpTakeProfit/100.0);
      double lot = GetTradeLot(MathAbs(ask - sl) / SymbolInfoDouble(InpSymbol, SYMBOL_POINT));
      trade.Buy(lot, InpSymbol, ask, sl, tp, "${bot.name} BUY");
   }
   else if(sellSignal)
   {
      double bid = SymbolInfoDouble(InpSymbol, SYMBOL_BID);
      double sl = bid * (1 + InpStopLoss/100.0);
      double tp = bid * (1 - InpTakeProfit/100.0);
      double lot = GetTradeLot(MathAbs(sl - bid) / SymbolInfoDouble(InpSymbol, SYMBOL_POINT));
      trade.Sell(lot, InpSymbol, bid, sl, tp, "${bot.name} SELL");
   }
}

//+------------------------------------------------------------------+
//| END OF FILE — Generado por YudBot                             |
//+------------------------------------------------------------------+
`;
}
