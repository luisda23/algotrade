// mql4Generator.ts — Genera código MQL4 (MetaTrader 4) desde la config del bot

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
  funded?: { enabled?: boolean; firm?: string };
}

// MQL4 acepta los mismos identificadores de timeframe que MQL5 (PERIOD_M1, etc.)
const TIMEFRAME_TO_MQL4: Record<string, string> = {
  M1: 'PERIOD_M1',
  M5: 'PERIOD_M5',
  M15: 'PERIOD_M15',
  M30: 'PERIOD_M30',
  H1: 'PERIOD_H1',
  H4: 'PERIOD_H4',
  D1: 'PERIOD_D1',
};

const STRATEGY_DEFAULT_TF_MQL4: Record<string, string> = {
  scalping: 'M5', momentum: 'M15', mean: 'M15', breakout: 'H1',
  swing: 'H4', trend: 'H1', reversal: 'M30', grid: 'M15',
  dca: 'H4', hedge: 'H1',
};

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

  // Timeframe del wizard o default por estrategia
  const tfKey = (p.timeframe && TIMEFRAME_TO_MQL4[p.timeframe])
    ? p.timeframe
    : (STRATEGY_DEFAULT_TF_MQL4[strategy] || 'M15');
  const timeframeMQL = TIMEFRAME_TO_MQL4[tfKey];

  // Lot mode + sanity bound
  const lotConf = p.lot || {};
  const lotMode = lotConf.mode === 'fixed' ? 'fixed' : 'auto';
  const fixedLotRaw = typeof lotConf.fixedLot === 'number' ? lotConf.fixedLot : 0.10;
  const fixedLot = Math.min(100, Math.max(0.01, fixedLotRaw));

  const strategyDescriptions: Record<string, string> = {
    scalping: 'Scalping rápido (M1-M5)',
    swing: 'Swing trading (H4-D1)',
    grid: 'Grid trading',
    momentum: 'Momentum',
    mean: 'Mean reversion',
    breakout: 'Breakout',
    dca: 'DCA',
    arb: 'Arbitraje',
    ai: 'IA predictiva',
  };

  const sanitizeName = bot.name.replace(/[^a-zA-Z0-9_]/g, '_');

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

//--- Configuración del bot
extern string  _GENERAL              = "═══ CONFIGURACIÓN GENERAL ═══";
extern int     InpTimeframe          = ${timeframeMQL};   // Timeframe del análisis
extern int     InpMagicNumber        = ${magicNumber};        // Número mágico (identificador único)
extern int     InpSlippage           = 10;             // Slippage máximo (puntos)

extern string  _LOT                  = "═══ TAMAÑO DE LOTE ═══";
extern bool    InpUseFixedLot        = ${lotMode === 'fixed' ? 'true' : 'false'};            // true = lote fijo · false = auto por riesgo %
extern double  InpFixedLot           = ${fixedLot.toFixed(2)};             // Lote a usar si InpUseFixedLot = true

extern string  _RISK                 = "═══ GESTIÓN DE RIESGO ═══";
extern double  InpStopLoss           = ${stopLoss};        // Stop Loss (%)
extern double  InpTakeProfit         = ${takeProfit};      // Take Profit (%)
extern double  InpRiskPerTrade       = ${posSize};         // Riesgo por operación (% capital, modo auto)
extern double  InpMaxDailyLoss       = ${dailyLoss};       // Pérdida diaria máxima (%)
extern int     InpLeverage           = ${leverage};        // Apalancamiento (1:X)

extern string  _TIME                 = "═══ HORARIO DE OPERACIÓN ═══";
extern bool    InpUseTimeFilter      = true;           // Usar filtro horario
extern int     InpStartHour          = 8;              // Hora inicio (UTC)
extern int     InpEndHour            = 22;             // Hora fin (UTC)

//--- Variables globales
double initialBalance;
double dailyStartBalance;
datetime lastDayCheck;
int lastBarTime = 0;

//+------------------------------------------------------------------+
//| Initialization                                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("═══════════════════════════════════════");
   Print("  ${bot.name}");
   Print("  Generado por YudBot · ${generatedDate}");
   Print("  Estrategia: ${strategyDescriptions[strategy] || strategy}");
   Print("═══════════════════════════════════════");

   initialBalance = AccountBalance();
   dailyStartBalance = initialBalance;
   lastDayCheck = TimeCurrent();

   Print("Bot inicializado correctamente");
   Print("Balance inicial: ", initialBalance);
   Print("Apalancamiento: 1:", InpLeverage);

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Deinitialization                                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Bot detenido. Razón: ", reason);
}

//+------------------------------------------------------------------+
//| Verificar pérdida diaria máxima                                  |
//+------------------------------------------------------------------+
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

//+------------------------------------------------------------------+
//| Verificar horario de operación                                   |
//+------------------------------------------------------------------+
bool IsTradingHours()
{
   if(!InpUseTimeFilter) return true;
   int hour = TimeHour(TimeCurrent());
   return (hour >= InpStartHour && hour < InpEndHour);
}

//+------------------------------------------------------------------+
//| Acota un lote a los límites del símbolo (min/max/step)           |
//+------------------------------------------------------------------+
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

//+------------------------------------------------------------------+
//| Lote por % de riesgo                                             |
//+------------------------------------------------------------------+
double CalculateLotSize(double stopLossPips)
{
   double balance = AccountBalance();
   double riskAmount = balance * (InpRiskPerTrade / 100.0);
   double tickValue = MarketInfo(Symbol(), MODE_TICKVALUE);
   if(tickValue <= 0 || stopLossPips <= 0) return ClampLotToSymbol(InpFixedLot);
   double lot = riskAmount / (stopLossPips * tickValue);
   return ClampLotToSymbol(lot);
}

//+------------------------------------------------------------------+
//| Lote final: respeta el modo (fijo o auto) elegido por el usuario |
//+------------------------------------------------------------------+
double GetTradeLot(double stopLossPips)
{
   if(InpUseFixedLot) return ClampLotToSymbol(InpFixedLot);
   return CalculateLotSize(stopLossPips);
}

//+------------------------------------------------------------------+
//| Verificar si hay posiciones abiertas                             |
//+------------------------------------------------------------------+
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

//+------------------------------------------------------------------+
//| Lógica principal — se ejecuta en cada tick                       |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!CheckDailyLoss()) return;
   if(!IsTradingHours()) return;
   if(HasOpenPosition()) return; // Solo una posición a la vez

   // Solo evaluar en una nueva barra
   if(Time[0] == lastBarTime) return;
   lastBarTime = Time[0];

   //--- Obtener señales según estrategia: ${strategyDescriptions[strategy] || strategy}
   bool buySignal = false;
   bool sellSignal = false;

${generateStrategyLogic(strategy, indicators)}

   //--- Ejecutar órdenes
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

// Genera la lógica específica de la estrategia (MQL4)
//
// Mismo diseño que el generador MQL5: cada indicador aporta su propia
// condición de buy/sell, se combinan con AND. Si el usuario no eligió
// indicadores, fallback a ruptura de rango de 10 velas para que el bot
// siempre tenga lógica activa.
function generateStrategyLogic(strategy: string, indicators: string[]): string {
  const has = (id: string) => indicators.includes(id);
  const setup: string[] = [];
  const buyConds: string[] = [];
  const sellConds: string[] = [];

  // RSI
  if (has('rsi')) {
    setup.push(`double rsi0 = iRSI(Symbol(), InpTimeframe, 14, PRICE_CLOSE, 0);`);
    if (strategy === 'mean' || strategy === 'reversal') {
      buyConds.push(`rsi0 < 35`);
      sellConds.push(`rsi0 > 65`);
    } else {
      buyConds.push(`rsi0 < 30`);
      sellConds.push(`rsi0 > 70`);
    }
  }

  // EMA cross
  if (has('ema')) {
    setup.push(`double emaFast0 = iMA(Symbol(), InpTimeframe, 9, 0, MODE_EMA, PRICE_CLOSE, 0);`);
    setup.push(`double emaSlow0 = iMA(Symbol(), InpTimeframe, 21, 0, MODE_EMA, PRICE_CLOSE, 0);`);
    if (indicators.length === 1) {
      // EMA cruce exacto si es el único indicador
      setup.push(`double emaFast1 = iMA(Symbol(), InpTimeframe, 9, 0, MODE_EMA, PRICE_CLOSE, 1);`);
      setup.push(`double emaSlow1 = iMA(Symbol(), InpTimeframe, 21, 0, MODE_EMA, PRICE_CLOSE, 1);`);
      buyConds.push(`(emaFast0 > emaSlow0 && emaFast1 <= emaSlow1)`);
      sellConds.push(`(emaFast0 < emaSlow0 && emaFast1 >= emaSlow1)`);
    } else {
      buyConds.push(`emaFast0 > emaSlow0`);
      sellConds.push(`emaFast0 < emaSlow0`);
    }
  }

  // MACD
  if (has('macd')) {
    setup.push(`double macdMain0   = iMACD(Symbol(), InpTimeframe, 12, 26, 9, PRICE_CLOSE, MODE_MAIN, 0);`);
    setup.push(`double macdSignal0 = iMACD(Symbol(), InpTimeframe, 12, 26, 9, PRICE_CLOSE, MODE_SIGNAL, 0);`);
    if (indicators.length === 1) {
      setup.push(`double macdMain1   = iMACD(Symbol(), InpTimeframe, 12, 26, 9, PRICE_CLOSE, MODE_MAIN, 1);`);
      setup.push(`double macdSignal1 = iMACD(Symbol(), InpTimeframe, 12, 26, 9, PRICE_CLOSE, MODE_SIGNAL, 1);`);
      buyConds.push(`(macdMain0 > macdSignal0 && macdMain1 <= macdSignal1)`);
      sellConds.push(`(macdMain0 < macdSignal0 && macdMain1 >= macdSignal1)`);
    } else {
      buyConds.push(`macdMain0 > macdSignal0`);
      sellConds.push(`macdMain0 < macdSignal0`);
    }
  }

  // Bollinger Bands
  if (has('bb')) {
    setup.push(`double bbUpper = iBands(Symbol(), InpTimeframe, 20, 2, 0, PRICE_CLOSE, MODE_UPPER, 0);`);
    setup.push(`double bbLower = iBands(Symbol(), InpTimeframe, 20, 2, 0, PRICE_CLOSE, MODE_LOWER, 0);`);
    if (strategy === 'mean' || strategy === 'reversal') {
      buyConds.push(`Bid <= bbLower`);
      sellConds.push(`Bid >= bbUpper`);
    } else {
      buyConds.push(`Bid >= bbUpper`);
      sellConds.push(`Bid <= bbLower`);
    }
  }

  // Estrategia breakout: Donchian forzado además de los indicadores
  if (strategy === 'breakout') {
    setup.push(`double high20 = iHigh(Symbol(), InpTimeframe, iHighest(Symbol(), InpTimeframe, MODE_HIGH, 20, 1));`);
    setup.push(`double low20  = iLow(Symbol(), InpTimeframe, iLowest(Symbol(), InpTimeframe, MODE_LOW, 20, 1));`);
    buyConds.push(`Bid > high20`);
    sellConds.push(`Bid < low20`);
  }

  if (strategy === 'trend' && !has('ema')) {
    setup.push(`double trendEMA50 = iMA(Symbol(), InpTimeframe, 50, 0, MODE_EMA, PRICE_CLOSE, 0);`);
    buyConds.push(`Bid > trendEMA50`);
    sellConds.push(`Bid < trendEMA50`);
  }

  // Fallback price-action si no hay indicadores ni lógica específica
  if (buyConds.length === 0 && sellConds.length === 0) {
    setup.push(`double recentHigh = iHigh(Symbol(), InpTimeframe, iHighest(Symbol(), InpTimeframe, MODE_HIGH, 10, 1));`);
    setup.push(`double recentLow  = iLow(Symbol(), InpTimeframe, iLowest(Symbol(), InpTimeframe, MODE_LOW, 10, 1));`);
    buyConds.push(`Bid > recentHigh`);
    sellConds.push(`Bid < recentLow`);
  }

  const buyExpr = buyConds.length > 0 ? buyConds.join(' && ') : 'false';
  const sellExpr = sellConds.length > 0 ? sellConds.join(' && ') : 'false';

  return `   // Estrategia: ${strategy} · ${indicators.length} indicador(es): ${indicators.join(', ') || '(ninguno)'}
   ${setup.join('\n   ')}

   // Buy: TODAS las condiciones deben cumplirse
   if(${buyExpr}) buySignal = true;
   // Sell: TODAS las condiciones deben cumplirse
   if(${sellExpr}) sellSignal = true;`;
}
