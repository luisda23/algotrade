// app-state.jsx — mock data for trading bot app
// Pricing: ONE-TIME purchase, lifetime ownership

const MARKET_HOURS = {
  // ISO weekday 1-7, hours in UTC
  forex: { name: 'Forex', open24h: false, sessions: [{ d: [1,2,3,4,5], h: [22, 22] }], note: 'Dom 22:00 → Vie 22:00 UTC' },
  crypto: { name: 'Crypto', open24h: true, note: '24/7 — siempre abierto' },
  indices: { name: 'Índices US', open24h: false, sessions: [{ d: [1,2,3,4,5], h: [13, 21] }], note: 'L-V 13:30 → 21:00 UTC' },
  stocks: { name: 'Acciones US', open24h: false, sessions: [{ d: [1,2,3,4,5], h: [13, 21] }], note: 'L-V NYSE/NASDAQ' },
  commodities: { name: 'Commodities', open24h: false, sessions: [{ d: [1,2,3,4,5], h: [22, 22] }], note: 'Casi 24h L-V' },
  options: { name: 'Opciones', open24h: false, sessions: [{ d: [1,2,3,4,5], h: [13, 21] }], note: 'L-V horario US' },
};

function isMarketOpen(marketKey) {
  const m = MARKET_HOURS[marketKey];
  if (!m) return true;
  if (m.open24h) return true;
  const now = new Date();
  const d = now.getUTCDay() || 7;
  const h = now.getUTCHours();
  return m.sessions?.some(s => s.d.includes(d) && h >= s.h[0] && h < s.h[1]);
}

const MOCK_BOTS = [
  {
    id: 'bot-1', name: 'EUR/USD Scalper Pro', pair: 'EUR/USD', market: 'Forex', marketKey: 'forex',
    strategy: 'Scalping + EMA Cross', status: 'running', isFunded: true, fundedFirm: 'FTMO',
    fundedPhase: 'Funded · $200K', pnl: 2847.32, pnlPct: 14.23, winrate: 68, trades: 142, drawdown: 2.1,
    sparkline: [12,14,13,16,18,17,21,24,22,28,31,29,34,38,36,42], started: 'Hace 12 días', price: 149,
  },
  {
    id: 'bot-2', name: 'BTC Grid Master', pair: 'BTC/USDT', market: 'Crypto · Spot', marketKey: 'crypto',
    strategy: 'Grid Trading', status: 'running', isFunded: false,
    pnl: 1248.50, pnlPct: 8.32, winrate: 74, trades: 89, drawdown: 4.2,
    sparkline: [20,22,19,21,25,23,27,30,28,32,35,33,36,38,40,42], started: 'Hace 28 días', price: 199,
  },
  {
    id: 'bot-3', name: 'NASDAQ Swing AI', pair: 'NAS100', market: 'Índices', marketKey: 'indices',
    strategy: 'IA + Sentiment', status: 'paused', isFunded: true, fundedFirm: 'MyForexFunds',
    fundedPhase: 'Phase 1 · $100K', pnl: -312.18, pnlPct: -1.87, winrate: 52, trades: 31, drawdown: 3.8,
    sparkline: [25,28,26,30,32,29,27,25,22,24,21,19,22,20,18,17], started: 'Hace 4 días', price: 249,
  },
];

const MARKETPLACE_BOTS = [
  { id: 'mk-1', name: 'Goldman Quant V2', author: 'QuantLab', rating: 4.9, reviews: 1284, price: 449, pair: 'Multi-asset', winrate: 71, drawdown: '3.2%', subscribers: 8421, badge: 'Top seller' },
  { id: 'mk-2', name: 'FTMO Phase Killer', author: 'PropTraderAI', rating: 4.8, reviews: 892, price: 199, pair: 'Forex majors', winrate: 64, drawdown: '4.1%', subscribers: 5217, badge: 'Funded ready' },
  { id: 'mk-3', name: 'BTC Reversal Hunter', author: 'CryptoForge', rating: 4.7, reviews: 612, price: 159, pair: 'BTC/USDT', winrate: 69, drawdown: '5.3%', subscribers: 3104, badge: 'New' },
  { id: 'mk-4', name: 'News Trader Elite', author: 'AlphaDesk', rating: 4.9, reviews: 2104, price: 599, pair: 'Forex + Indices', winrate: 76, drawdown: '2.8%', subscribers: 12483, badge: 'Premium' },
];

const WIZARD_STEPS = [
  { id: 'name', title: 'Nombre & Mercado', subtitle: 'Cómo se llama tu bot y dónde opera' },
  { id: 'strategy', title: 'Estrategia', subtitle: 'Qué tipo de trader es' },
  { id: 'indicators', title: 'Indicadores', subtitle: 'Las señales para entrar y salir' },
  { id: 'news', title: 'Noticias & Sentiment', subtitle: 'Análisis fundamental con Claude' },
  { id: 'risk', title: 'Gestión de Riesgo', subtitle: 'Cómo proteger tu capital' },
  { id: 'funded', title: 'Cuenta de Fondeo', subtitle: 'Reglas de prop firm (opcional)' },
  { id: 'generate', title: 'Generar con Claude', subtitle: 'IA analiza el mercado y construye tu bot' },
  { id: 'review', title: 'Revisar & Comprar', subtitle: 'Backtest + compra única' },
];

const STRATEGIES = [
  { id: 'scalping', name: 'Scalping', desc: 'Operaciones rápidas (segundos a minutos)', icon: 'bolt', risk: 'Alto', timeframe: '1m – 5m' },
  { id: 'swing', name: 'Swing Trading', desc: 'Posiciones de días a semanas', icon: 'trend', risk: 'Medio', timeframe: '4h – 1d' },
  { id: 'grid', name: 'Grid Trading', desc: 'Compra y vende en niveles definidos', icon: 'layers', risk: 'Medio', timeframe: 'Continuo' },
  { id: 'dca', name: 'DCA', desc: 'Dollar-cost averaging acumulativo', icon: 'diamond', risk: 'Bajo', timeframe: 'Programado' },
  { id: 'arb', name: 'Arbitraje', desc: 'Aprovecha diferencias entre exchanges', icon: 'exchange', risk: 'Bajo', timeframe: 'Microsegundos' },
  { id: 'mean', name: 'Mean Reversion', desc: 'Apuesta a la reversión a la media', icon: 'target', risk: 'Medio', timeframe: '15m – 4h' },
  { id: 'momentum', name: 'Momentum', desc: 'Sigue la fuerza del movimiento', icon: 'zap', risk: 'Medio', timeframe: '5m – 1h' },
  { id: 'breakout', name: 'Breakout', desc: 'Entra en rupturas de rango', icon: 'bolt', risk: 'Alto', timeframe: '15m – 4h' },
  { id: 'ai', name: 'IA Predictiva (Claude)', desc: 'Modelo entrenado con datos del mercado', icon: 'brain', risk: 'Variable', timeframe: 'Adaptativo' },
];

const INDICATORS = [
  // Tendencia
  { id: 'ema', name: 'EMA', desc: 'Media Móvil Exponencial', cat: 'Tendencia' },
  { id: 'sma', name: 'SMA', desc: 'Media Móvil Simple', cat: 'Tendencia' },
  { id: 'wma', name: 'WMA', desc: 'Media Móvil Ponderada', cat: 'Tendencia' },
  { id: 'macd', name: 'MACD', desc: 'Convergencia/Divergencia', cat: 'Tendencia' },
  { id: 'ichi', name: 'Ichimoku', desc: 'Nube Kinkō Hyō', cat: 'Tendencia' },
  { id: 'adx', name: 'ADX', desc: 'Fuerza de tendencia', cat: 'Tendencia' },
  { id: 'psar', name: 'Parabolic SAR', desc: 'Stop-and-reverse', cat: 'Tendencia' },
  { id: 'aroon', name: 'Aroon', desc: 'Identifica nuevos máximos/mínimos', cat: 'Tendencia' },
  { id: 'dmi', name: 'DMI', desc: 'Directional Movement Index', cat: 'Tendencia' },
  // Momentum
  { id: 'rsi', name: 'RSI', desc: 'Relative Strength Index', cat: 'Momentum' },
  { id: 'stoch', name: 'Estocástico', desc: 'Oscilador estocástico', cat: 'Momentum' },
  { id: 'stochrsi', name: 'Stoch RSI', desc: 'Estocástico aplicado al RSI', cat: 'Momentum' },
  { id: 'cci', name: 'CCI', desc: 'Commodity Channel Index', cat: 'Momentum' },
  { id: 'williams', name: 'Williams %R', desc: 'Sobrecompra/sobreventa', cat: 'Momentum' },
  { id: 'roc', name: 'ROC', desc: 'Rate of Change', cat: 'Momentum' },
  { id: 'tsi', name: 'TSI', desc: 'True Strength Index', cat: 'Momentum' },
  { id: 'awesome', name: 'Awesome Osc.', desc: 'Awesome Oscillator', cat: 'Momentum' },
  // Volatilidad
  { id: 'bb', name: 'Bollinger', desc: 'Bandas de Bollinger', cat: 'Volatilidad' },
  { id: 'atr', name: 'ATR', desc: 'Average True Range', cat: 'Volatilidad' },
  { id: 'kc', name: 'Keltner', desc: 'Canales de Keltner', cat: 'Volatilidad' },
  { id: 'donchian', name: 'Donchian', desc: 'Canales Donchian', cat: 'Volatilidad' },
  { id: 'std', name: 'Std Dev', desc: 'Desviación estándar', cat: 'Volatilidad' },
  { id: 'chaikinvol', name: 'Chaikin Vol', desc: 'Chaikin Volatility', cat: 'Volatilidad' },
  // Volumen
  { id: 'vol', name: 'Volume', desc: 'Volumen base', cat: 'Volumen' },
  { id: 'obv', name: 'OBV', desc: 'On Balance Volume', cat: 'Volumen' },
  { id: 'vwap', name: 'VWAP', desc: 'Precio medio ponderado', cat: 'Volumen' },
  { id: 'mfi', name: 'MFI', desc: 'Money Flow Index', cat: 'Volumen' },
  { id: 'cmf', name: 'CMF', desc: 'Chaikin Money Flow', cat: 'Volumen' },
  { id: 'ad', name: 'A/D Line', desc: 'Accumulation/Distribution', cat: 'Volumen' },
  { id: 'eom', name: 'EOM', desc: 'Ease of Movement', cat: 'Volumen' },
  // Soporte/Resistencia
  { id: 'fib', name: 'Fibonacci', desc: 'Retrocesos Fibonacci', cat: 'S/R' },
  { id: 'pivots', name: 'Pivot Points', desc: 'Niveles diarios/semanales', cat: 'S/R' },
  { id: 'sr', name: 'Soportes/Resist.', desc: 'Detección automática', cat: 'S/R' },
  { id: 'orderblock', name: 'Order Blocks', desc: 'SMC / Smart Money', cat: 'S/R' },
  { id: 'fvg', name: 'Fair Value Gap', desc: 'Imbalances de precio', cat: 'S/R' },
  { id: 'liquidity', name: 'Liquidity Pools', desc: 'Zonas de liquidez', cat: 'S/R' },
  // Patrones de Velas
  { id: 'engulfing', name: 'Engulfing', desc: 'Velas envolventes', cat: 'Patrones' },
  { id: 'doji', name: 'Doji', desc: 'Indecisión del mercado', cat: 'Patrones' },
  { id: 'hammer', name: 'Hammer/Hanging', desc: 'Reversión', cat: 'Patrones' },
  { id: 'morningstar', name: 'Morning/Evening Star', desc: 'Reversión 3 velas', cat: 'Patrones' },
  // Avanzados
  { id: 'supertrend', name: 'Supertrend', desc: 'Filtro de tendencia', cat: 'Avanzados' },
  { id: 'heikin', name: 'Heikin Ashi', desc: 'Velas suavizadas', cat: 'Avanzados' },
  { id: 'renko', name: 'Renko', desc: 'Filtra ruido por precio', cat: 'Avanzados' },
  { id: 'volprofile', name: 'Volume Profile', desc: 'Perfil POC/VAH/VAL', cat: 'Avanzados' },
  { id: 'mtf', name: 'Multi-timeframe', desc: 'Confluencia entre TFs', cat: 'Avanzados' },
  { id: 'elliott', name: 'Elliott Waves', desc: 'Análisis ondulatorio', cat: 'Avanzados' },
  { id: 'harmonic', name: 'Harmonic Patterns', desc: 'Gartley, Bat, Crab, etc.', cat: 'Avanzados' },
];

const NEWS_SOURCES = [
  { id: 'reuters', name: 'Reuters', cat: 'Premium' },
  { id: 'bloomberg', name: 'Bloomberg', cat: 'Premium' },
  { id: 'forexfactory', name: 'ForexFactory', cat: 'Calendar' },
  { id: 'investing', name: 'Investing.com', cat: 'Calendar' },
  { id: 'twitter', name: 'X / Twitter', cat: 'Social' },
  { id: 'reddit', name: 'r/wallstreetbets', cat: 'Social' },
  { id: 'fed', name: 'FED Press', cat: 'Macro' },
  { id: 'ecb', name: 'BCE Press', cat: 'Macro' },
  { id: 'cryptopanic', name: 'CryptoPanic', cat: 'Crypto' },
  { id: 'coindesk', name: 'CoinDesk', cat: 'Crypto' },
];

// Prop firms — solo las que permiten bots / EAs
const FUNDED_FIRMS = [
  { id: 'ftmo', name: 'FTMO', maxDD: '10%', dailyDD: '5%', target: '10%', botsAllowed: true, note: 'EAs permitidos sin HFT' },
  { id: 'mff', name: 'MyForexFunds', maxDD: '12%', dailyDD: '5%', target: '8%', botsAllowed: true, note: 'EAs permitidos' },
  { id: 'the5', name: 'The5ers', maxDD: '8%', dailyDD: '4%', target: '6%', botsAllowed: true, note: 'EAs permitidos' },
  { id: 'funded', name: 'FundedNext', maxDD: '10%', dailyDD: '5%', target: '8%', botsAllowed: true, note: 'EAs permitidos' },
  { id: 'e8', name: 'E8 Funding', maxDD: '8%', dailyDD: '5%', target: '8%', botsAllowed: true, note: 'EAs sin restricciones' },
  { id: 'maven', name: 'Maven Trading', maxDD: '10%', dailyDD: '5%', target: '8%', botsAllowed: true, note: 'EAs permitidos' },
  { id: 'forexcap', name: 'ForexCapital', maxDD: '10%', dailyDD: '5%', target: '10%', botsAllowed: true, note: 'EAs OK · Forex' },
  { id: 'goat', name: 'Goat Funded', maxDD: '10%', dailyDD: '5%', target: '8%', botsAllowed: true, note: 'EAs y bots permitidos' },
  { id: 'finotive', name: 'Finotive Funding', maxDD: '10%', dailyDD: '5%', target: '8%', botsAllowed: true, note: 'EAs · sin copy' },
  { id: 'apex', name: 'Apex Trader (Futuros)', maxDD: '6%', dailyDD: '3%', target: '6%', botsAllowed: true, note: 'Bots de futuros OK' },
  { id: 'topstep', name: 'TopstepFX', maxDD: '6%', dailyDD: '3%', target: '6%', botsAllowed: true, note: 'EAs permitidos' },
  { id: 'lux', name: 'Lux Trading Firm', maxDD: '8%', dailyDD: '4%', target: '7%', botsAllowed: true, note: 'EAs permitidos' },
];

const BROKERS = [
  { id: 'mt5', name: 'MetaTrader 5', logo: 'MT5', cat: 'Forex · Índices · Commodities', recommended: true },
  { id: 'mt4', name: 'MetaTrader 4', logo: 'MT4', cat: 'Forex · CFDs' },
];

window.MARKET_HOURS = MARKET_HOURS;
window.isMarketOpen = isMarketOpen;
window.MOCK_BOTS = MOCK_BOTS;
window.MARKETPLACE_BOTS = MARKETPLACE_BOTS;
window.WIZARD_STEPS = WIZARD_STEPS;
window.STRATEGIES = STRATEGIES;
window.INDICATORS = INDICATORS;
window.NEWS_SOURCES = NEWS_SOURCES;
window.FUNDED_FIRMS = FUNDED_FIRMS;
window.BROKERS = BROKERS;
