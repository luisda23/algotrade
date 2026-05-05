// mqlGenerator.ts — Genera código MQL5 desde la config del bot

interface BotParams {
  market?: string;
  pair?: string;
  leverage?: number;
  indicators?: string[];
  // Timeframe del gráfico que el bot va a analizar
  timeframe?: 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';
  // Cómo calcular el tamaño de lote por operación
  lot?: {
    mode?: 'auto' | 'fixed'; // auto = % de riesgo · fixed = lote fijo
    fixedLot?: number;       // ej. 0.01, 0.10, 1.0 (solo si mode === 'fixed')
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
    events?: string[]; // ids seleccionados desde el wizard
  };
  funded?: { enabled?: boolean; firm?: string };
}

// Mapa de timeframe del wizard al enum de MQL5/MQL4
const TIMEFRAME_TO_MQL: Record<string, string> = {
  M1: 'PERIOD_M1',
  M5: 'PERIOD_M5',
  M15: 'PERIOD_M15',
  M30: 'PERIOD_M30',
  H1: 'PERIOD_H1',
  H4: 'PERIOD_H4',
  D1: 'PERIOD_D1',
};

// Default sugerido por estrategia si el usuario no eligió ninguno
const STRATEGY_DEFAULT_TIMEFRAME: Record<string, string> = {
  scalping:  'M5',
  momentum:  'M15',
  mean:      'M15',
  breakout:  'H1',
  swing:     'H4',
  trend:     'H1',
  reversal:  'M30',
  grid:      'M15',
  dca:       'H4',
  hedge:     'H1',
};

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

  // Timeframe: usa el del wizard o el default sugerido para la estrategia
  const tfKey = (p.timeframe && TIMEFRAME_TO_MQL[p.timeframe])
    ? p.timeframe
    : (STRATEGY_DEFAULT_TIMEFRAME[strategy] || 'M15');
  const timeframeMQL = TIMEFRAME_TO_MQL[tfKey];

  // Lot sizing: auto (riesgo %) por defecto, fixed si el usuario lo pide
  const lotConf = p.lot || {};
  const lotMode = lotConf.mode === 'fixed' ? 'fixed' : 'auto';
  const fixedLotRaw = typeof lotConf.fixedLot === 'number' ? lotConf.fixedLot : 0.10;
  // Sanity bound: nunca > 100 lotes ni < 0.01
  const fixedLot = Math.min(100, Math.max(0.01, fixedLotRaw));
  const news = p.news || {};
  const newsEnabled = news.enabled !== false;
  const newsBefore = news.beforeMin ?? 30;
  const newsAfter = news.afterMin ?? 15;
  const newsImpactMQL = news.impactMin === 'all' ? 'CALENDAR_IMPORTANCE_LOW'
                     : news.impactMin === 'medium' ? 'CALENDAR_IMPORTANCE_MODERATE'
                     : 'CALENDAR_IMPORTANCE_HIGH';
  // Mapeo id -> patrones que matchean en el calendario de MT5
  // (multiple patterns separados por |, evaluado como substring case-insensitive)
  const NEWS_EVENT_PATTERNS: Record<string, string> = {
    'nfp':       'Nonfarm Payrolls',
    'fomc':      'Federal Funds Rate|FOMC',
    'cpi-us':    'Consumer Price Index|CPI',
    'powell':    'Powell|FOMC Press',
    'gdp-us':    'Gross Domestic Product|GDP',
    'retail-us': 'Retail Sales',
    'unemp-us':  'Unemployment Rate',
    'ism-us':    'ISM',
    'ecb-rate':  'Main Refinancing|Deposit Facility|ECB Interest',
    'ecb-press': 'ECB Press|Lagarde',
    'cpi-eu':    'Consumer Price Index|CPI|HICP',
    'gdp-eu':    'Gross Domestic Product|GDP',
    'pmi-eu':    'PMI',
    'boe-rate':  'Bank Rate|BOE Interest',
    'cpi-uk':    'Consumer Price Index|CPI',
    'gdp-uk':    'Gross Domestic Product|GDP',
    'boj-rate':  'BOJ Interest|Policy Rate',
  };
  const selectedEventIds = (news.events && Array.isArray(news.events))
    ? news.events
    : Object.keys(NEWS_EVENT_PATTERNS); // si no llega array, asumimos todos
  // Si el usuario marcó "Ninguno" (events=[]), su intent es NO filtrar por eventos.
  // Desactivamos el filtro completo en lugar de pausar en todos (que sería lo opuesto).
  const effectiveNewsEnabled = newsEnabled && selectedEventIds.length > 0;
  const newsPatternsStr = selectedEventIds
    .map(id => NEWS_EVENT_PATTERNS[id])
    .filter(Boolean)
    .join('||')
    .replace(/"/g, '\\"');
  const newsHasEventFilter = selectedEventIds.length > 0 && selectedEventIds.length < Object.keys(NEWS_EVENT_PATTERNS).length;
  const generatedDate = new Date().toISOString().split('T')[0];

  // Mapear estrategia a comentario descriptivo
  const strategyDescriptions: Record<string, string> = {
    scalping: 'Scalping rápido (1m-5m timeframe)',
    swing: 'Swing trading (4h-1d timeframe)',
    grid: 'Grid trading con niveles fijos',
    momentum: 'Momentum con detección de fuerza',
    mean: 'Mean reversion (reversión a la media)',
    breakout: 'Breakout de rango',
    dca: 'Dollar-cost averaging',
    arb: 'Arbitraje',
    ai: 'IA predictiva',
  };

  const sanitizeName = bot.name.replace(/[^a-zA-Z0-9_]/g, '_');

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

//--- Configuración del bot (parámetros editables)
input group    "═══ CONFIGURACIÓN GENERAL ═══"
input string         InpSymbol      = "${symbol}";       // Símbolo a operar
input ENUM_TIMEFRAMES InpTimeframe  = ${timeframeMQL};   // Timeframe del análisis
input int            InpMagicNumber = ${Math.floor(Math.random() * 900000) + 100000};           // Número mágico (identificador único)

input group    "═══ TAMAÑO DE LOTE ═══"
input bool     InpUseFixedLot      = ${lotMode === 'fixed' ? 'true' : 'false'};              // true = lote fijo · false = auto por riesgo %
input double   InpFixedLot         = ${fixedLot.toFixed(2)};               // Lote a usar si InpUseFixedLot = true

input group    "═══ GESTIÓN DE RIESGO ═══"
input double   InpStopLoss         = ${stopLoss};        // Stop Loss (%)
input double   InpTakeProfit       = ${takeProfit};      // Take Profit (%)
input double   InpRiskPerTrade     = ${posSize};         // Riesgo por operación (% capital, modo auto)
input double   InpMaxDailyLoss     = ${dailyLoss};       // Pérdida diaria máxima (%)
input int      InpLeverage         = ${leverage};        // Apalancamiento (1:X)

input group    "═══ HORARIO DE OPERACIÓN ═══"
input bool     InpUseTimeFilter    = true;               // Usar filtro horario
input int      InpStartHour        = 8;                  // Hora inicio (UTC)
input int      InpEndHour          = 22;                 // Hora fin (UTC)

input group    "═══ FILTRO DE NOTICIAS ═══"
input bool     InpFilterNews       = ${effectiveNewsEnabled};       // Pausar bot durante noticias
input int      InpNewsMinutesBefore = ${newsBefore};                // Minutos antes de la noticia
input int      InpNewsMinutesAfter  = ${newsAfter};                 // Minutos después de la noticia
input ENUM_CALENDAR_EVENT_IMPORTANCE InpNewsMinImpact = ${newsImpactMQL}; // Impacto mínimo a evitar
input bool     InpNewsFilterByName  = ${newsHasEventFilter};        // Filtrar solo eventos específicos
input string   InpNewsPatterns      = "${newsPatternsStr}";          // Patrones separados por || (no editar)

//--- Variables globales
CTrade        trade;
CPositionInfo position;
CSymbolInfo   symbolInfo;

double initialBalance;
double dailyStartBalance;
datetime lastDayCheck;
${indicators.includes('rsi') ? 'int handleRSI;' : ''}
${indicators.includes('ema') ? 'int handleEMA_fast;\nint handleEMA_slow;' : ''}
${indicators.includes('macd') ? 'int handleMACD;' : ''}
${indicators.includes('bb') ? 'int handleBB;' : ''}
${indicators.includes('atr') ? 'int handleATR;' : ''}

//+------------------------------------------------------------------+
//| Initialization                                                   |
//+------------------------------------------------------------------+
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

${indicators.includes('rsi') ? `   handleRSI = iRSI(InpSymbol, InpTimeframe, 14, PRICE_CLOSE);
   if(handleRSI == INVALID_HANDLE) { Print("Error creando RSI"); return INIT_FAILED; }` : ''}
${indicators.includes('ema') ? `   handleEMA_fast = iMA(InpSymbol, InpTimeframe, 9, 0, MODE_EMA, PRICE_CLOSE);
   handleEMA_slow = iMA(InpSymbol, InpTimeframe, 21, 0, MODE_EMA, PRICE_CLOSE);
   if(handleEMA_fast == INVALID_HANDLE || handleEMA_slow == INVALID_HANDLE) { Print("Error creando EMA"); return INIT_FAILED; }` : ''}
${indicators.includes('macd') ? `   handleMACD = iMACD(InpSymbol, InpTimeframe, 12, 26, 9, PRICE_CLOSE);
   if(handleMACD == INVALID_HANDLE) { Print("Error creando MACD"); return INIT_FAILED; }` : ''}
${indicators.includes('bb') ? `   handleBB = iBands(InpSymbol, InpTimeframe, 20, 0, 2.0, PRICE_CLOSE);
   if(handleBB == INVALID_HANDLE) { Print("Error creando Bollinger"); return INIT_FAILED; }` : ''}
${indicators.includes('atr') ? `   handleATR = iATR(InpSymbol, InpTimeframe, 14);
   if(handleATR == INVALID_HANDLE) { Print("Error creando ATR"); return INIT_FAILED; }` : ''}

   initialBalance = AccountInfoDouble(ACCOUNT_BALANCE);
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
${indicators.includes('rsi') ? '   IndicatorRelease(handleRSI);' : ''}
${indicators.includes('ema') ? '   IndicatorRelease(handleEMA_fast);\n   IndicatorRelease(handleEMA_slow);' : ''}
${indicators.includes('macd') ? '   IndicatorRelease(handleMACD);' : ''}
${indicators.includes('bb') ? '   IndicatorRelease(handleBB);' : ''}
${indicators.includes('atr') ? '   IndicatorRelease(handleATR);' : ''}
}

//+------------------------------------------------------------------+
//| Comprueba si el nombre del evento coincide con alguno de los     |
//| patrones (separados por "||"), comparación case-insensitive.     |
//+------------------------------------------------------------------+
bool EventMatchesPatterns(const string eventName, const string patterns)
{
   if(StringLen(patterns) == 0) return true; // Sin filtro, todos pasan
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

//+------------------------------------------------------------------+
//| Filtro de noticias: usa el calendario económico de MetaTrader    |
//| para evitar operar en ventanas alrededor de eventos relevantes.  |
//+------------------------------------------------------------------+
bool IsNewsTime()
{
   if(!InpFilterNews) return false;

   // Buscar la divisa base y cotizada del símbolo (ej. EURUSD → EUR, USD)
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

         // Si el usuario pidió filtrar por evento específico, comprueba el nombre
         if(InpNewsFilterByName && !EventMatchesPatterns(ev.name, InpNewsPatterns))
            continue;

         long evTime = (long)values[i].time;
         long now    = (long)TimeCurrent();
         long diff   = evTime - now;
         if(diff <= InpNewsMinutesBefore * 60 && diff >= -InpNewsMinutesAfter * 60)
         {
            return true;
         }
      }
   }
   return false;
}

//+------------------------------------------------------------------+
//| Verificar pérdida diaria máxima                                  |
//+------------------------------------------------------------------+
bool CheckDailyLoss()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   MqlDateTime lastDt;
   TimeToStruct(lastDayCheck, lastDt);

   // Reset diario
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

//+------------------------------------------------------------------+
//| Verificar horario de operación                                   |
//+------------------------------------------------------------------+
bool IsTradingHours()
{
   if(!InpUseTimeFilter) return true;
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   return (dt.hour >= InpStartHour && dt.hour < InpEndHour);
}

//+------------------------------------------------------------------+
//| Acota un lote a los límites del símbolo (min/max/step)           |
//+------------------------------------------------------------------+
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

//+------------------------------------------------------------------+
//| Lote calculado por % de riesgo y distancia al SL                 |
//+------------------------------------------------------------------+
double CalculateLotSize(double stopLossPips)
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskAmount = balance * (InpRiskPerTrade / 100.0);
   double tickValue = SymbolInfoDouble(InpSymbol, SYMBOL_TRADE_TICK_VALUE);
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
//| Lógica principal de la estrategia                                |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!CheckDailyLoss()) return;
   if(!IsTradingHours()) return;
   if(IsNewsTime()) return; // Pausado por noticia inminente / reciente
   if(PositionsTotal() > 0) return; // Solo una posición a la vez

   // Verificar si hay nuevas barras
   static datetime lastBarTime = 0;
   datetime currentBarTime = (datetime)SeriesInfoInteger(InpSymbol, InpTimeframe, SERIES_LASTBAR_DATE);
   if(currentBarTime == lastBarTime) return;
   lastBarTime = currentBarTime;

   //--- Obtener señales según estrategia: ${strategyDescriptions[strategy] || strategy}
   bool buySignal = false;
   bool sellSignal = false;

${generateStrategyLogic(strategy, indicators)}

   //--- Ejecutar órdenes
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

// Genera la lógica específica de la estrategia
//
// Diseño: cada indicador del usuario aporta su propia señal de compra/venta.
// Las señales se combinan con AND (todos deben estar de acuerdo) para entrar
// con confirmación, evitando falsos positivos. Si el usuario marca 0 indicadores,
// usamos un fallback de price-action simple (rango de N velas) para que el bot
// AÚN OPERE en lugar de quedarse en silencio para siempre.
//
// La estrategia "breakout" usa siempre Donchian (ruptura de rango) — los
// indicadores son confirmación opcional. La estrategia "mean" invierte la
// dirección al usar Bollinger (banda inferior = compra).
function generateStrategyLogic(strategy: string, indicators: string[]): string {
  const has = (id: string) => indicators.includes(id);
  const setup: string[] = [];
  const buyConds: string[] = [];
  const sellConds: string[] = [];

  // Precio actual (lo necesitan varias estrategias)
  setup.push(`double bidPrice = SymbolInfoDouble(InpSymbol, SYMBOL_BID);`);

  // ── RSI ── sobreventa = buy, sobrecompra = sell (estándar)
  if (has('rsi')) {
    setup.push(`double rsi[]; ArraySetAsSeries(rsi, true); CopyBuffer(handleRSI, 0, 0, 2, rsi);`);
    if (strategy === 'mean' || strategy === 'reversal') {
      // Mean reversion: aún más estricto (35/65 para más oportunidades)
      buyConds.push(`rsi[0] < 35`);
      sellConds.push(`rsi[0] > 65`);
    } else {
      buyConds.push(`rsi[0] < 30`);
      sellConds.push(`rsi[0] > 70`);
    }
  }

  // ── EMA cross ── EMA rápida cruza la lenta
  if (has('ema')) {
    setup.push(`double emaFast[], emaSlow[]; ArraySetAsSeries(emaFast, true); ArraySetAsSeries(emaSlow, true);`);
    setup.push(`CopyBuffer(handleEMA_fast, 0, 0, 2, emaFast);`);
    setup.push(`CopyBuffer(handleEMA_slow, 0, 0, 2, emaSlow);`);
    if (indicators.length === 1) {
      // Si EMA es el único indicador, usar el cruce exacto (más selectivo)
      buyConds.push(`(emaFast[0] > emaSlow[0] && emaFast[1] <= emaSlow[1])`);
      sellConds.push(`(emaFast[0] < emaSlow[0] && emaFast[1] >= emaSlow[1])`);
    } else {
      // Si hay más indicadores, EMA solo confirma la dirección de tendencia
      buyConds.push(`emaFast[0] > emaSlow[0]`);
      sellConds.push(`emaFast[0] < emaSlow[0]`);
    }
  }

  // ── MACD ── histograma cambia de signo / línea cruza señal
  if (has('macd')) {
    setup.push(`double macdMain[], macdSignal[]; ArraySetAsSeries(macdMain, true); ArraySetAsSeries(macdSignal, true);`);
    setup.push(`CopyBuffer(handleMACD, 0, 0, 2, macdMain);`);
    setup.push(`CopyBuffer(handleMACD, 1, 0, 2, macdSignal);`);
    if (indicators.length === 1) {
      // Solo MACD: cruce exacto de línea principal con la señal
      buyConds.push(`(macdMain[0] > macdSignal[0] && macdMain[1] <= macdSignal[1])`);
      sellConds.push(`(macdMain[0] < macdSignal[0] && macdMain[1] >= macdSignal[1])`);
    } else {
      // Con más indicadores: MACD solo confirma momento (positivo o negativo)
      buyConds.push(`macdMain[0] > macdSignal[0]`);
      sellConds.push(`macdMain[0] < macdSignal[0]`);
    }
  }

  // ── Bollinger Bands ──
  if (has('bb')) {
    setup.push(`double bbUpper[], bbLower[], bbMiddle[]; ArraySetAsSeries(bbUpper, true); ArraySetAsSeries(bbLower, true); ArraySetAsSeries(bbMiddle, true);`);
    setup.push(`CopyBuffer(handleBB, UPPER_BAND, 0, 1, bbUpper);`);
    setup.push(`CopyBuffer(handleBB, LOWER_BAND, 0, 1, bbLower);`);
    setup.push(`CopyBuffer(handleBB, BASE_LINE, 0, 1, bbMiddle);`);
    if (strategy === 'mean' || strategy === 'reversal') {
      // Mean reversion: tocar banda = entrar contra la dirección
      buyConds.push(`bidPrice <= bbLower[0]`);
      sellConds.push(`bidPrice >= bbUpper[0]`);
    } else {
      // Trend / breakout / momentum: ruptura de banda = entrar a favor
      buyConds.push(`bidPrice >= bbUpper[0]`);
      sellConds.push(`bidPrice <= bbLower[0]`);
    }
  }

  // ── ATR ── solo se usa como filtro de volatilidad mínima (no señal por sí mismo)
  // No añade condición de buy/sell, pero el handle existe y se podría usar para
  // dimensionar SL dinámico en futuras versiones.

  // ── Lógica específica de estrategia ──
  if (strategy === 'breakout') {
    // Breakout siempre usa Donchian de 20 velas, indicadores confirman
    setup.push(`double high20 = iHigh(InpSymbol, InpTimeframe, iHighest(InpSymbol, InpTimeframe, MODE_HIGH, 20, 1));`);
    setup.push(`double low20  = iLow(InpSymbol, InpTimeframe, iLowest(InpSymbol, InpTimeframe, MODE_LOW, 20, 1));`);
    buyConds.push(`bidPrice > high20`);
    sellConds.push(`bidPrice < low20`);
  }

  if (strategy === 'trend') {
    // Trend following: requiere precio sobre/debajo de EMA50 si está disponible
    if (has('ema')) {
      // Ya se añadió la lógica de EMA, no duplicamos
    } else {
      // Fallback: usar EMA50 directa
      setup.push(`double ema50 = iMA(InpSymbol, InpTimeframe, 50, 0, MODE_EMA, PRICE_CLOSE);`);
      buyConds.push(`bidPrice > ema50`);
      sellConds.push(`bidPrice < ema50`);
    }
  }

  // Fallback si el usuario no eligió indicadores ni estrategias con lógica propia:
  // ruptura del rango de las últimas 10 velas (price action puro). Garantiza que
  // el bot SIEMPRE pueda generar señales en lugar de quedarse en silencio.
  if (buyConds.length === 0 && sellConds.length === 0) {
    setup.push(`double recentHigh = iHigh(InpSymbol, InpTimeframe, iHighest(InpSymbol, InpTimeframe, MODE_HIGH, 10, 1));`);
    setup.push(`double recentLow  = iLow(InpSymbol, InpTimeframe, iLowest(InpSymbol, InpTimeframe, MODE_LOW, 10, 1));`);
    buyConds.push(`bidPrice > recentHigh`);
    sellConds.push(`bidPrice < recentLow`);
  }

  const buyExpr = buyConds.length > 0 ? buyConds.join(' && ') : 'false';
  const sellExpr = sellConds.length > 0 ? sellConds.join(' && ') : 'false';

  return `   // Estrategia: ${strategy} · ${indicators.length} indicador(es): ${indicators.join(', ') || '(ninguno)'}
   ${setup.join('\n   ')}

   // Buy: TODAS las condiciones de los indicadores deben cumplirse
   if(${buyExpr}) buySignal = true;
   // Sell: TODAS las condiciones de los indicadores deben cumplirse
   if(${sellExpr}) sellSignal = true;`;
}
