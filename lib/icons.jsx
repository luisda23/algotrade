// icons.jsx — minimal stroke icons. all 24x24, single color via currentColor.
// Use: <Icon name="bot" size={24} color="..." />

const ICON_PATHS = {
  bot: <><rect x="4" y="7" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" fill="none"/><circle cx="9" cy="13" r="1.3" fill="currentColor"/><circle cx="15" cy="13" r="1.3" fill="currentColor"/><path d="M12 4v3M9 19v2M15 19v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></>,
  chart: <><path d="M4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M4 16l4-5 4 3 4-7 4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  candlestick: <><path d="M7 4v4M7 14v6M17 4v6M17 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><rect x="5" y="8" width="4" height="6" stroke="currentColor" strokeWidth="1.6" fill="none"/><rect x="15" y="10" width="4" height="6" stroke="currentColor" strokeWidth="1.6" fill="none"/></>,
  news: <><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M7 9h10M7 12h10M7 15h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></>,
  brain: <><path d="M9 5a3 3 0 00-3 3v8a3 3 0 003 3h6a3 3 0 003-3V8a3 3 0 00-3-3 3 3 0 00-3-2 3 3 0 00-3 2z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/><path d="M12 5v14M9 9h2M9 13h2M13 11h2M13 15h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  bolt: <><path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></>,
  play: <><path d="M7 5l11 7-11 7V5z" fill="currentColor"/></>,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></>,
  stop: <><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></>,
  plus: <><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  arrowLeft: <><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  arrowUp: <><path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  arrowDown: <><path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  check: <><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  close: <><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>,
  settings: <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></>,
  home: <><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></>,
  sparkle: <><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.9"/></>,
  user: <><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></>,
  store: <><path d="M3 8l1-4h16l1 4M3 8h18M3 8v12h18V8M9 13h6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" strokeLinecap="round"/></>,
  book: <><path d="M4 4h6a3 3 0 013 3v13a2 2 0 00-2-2H4V4zM20 4h-6a3 3 0 00-3 3v13a2 2 0 012-2h7V4z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></>,
  bell: <><path d="M6 9a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/><path d="M10 21a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></>,
  search: <><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>,
  filter: <><path d="M4 5h16l-6 8v6l-4-2v-4L4 5z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.6" fill="none"/></>,
  globe: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9z" stroke="currentColor" strokeWidth="1.6" fill="none"/></>,
  zap: <><path d="M14 3l-9 11h6l-1 7 9-11h-6l1-7z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></>,
  target: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6" fill="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
  trend: <><path d="M3 17l6-6 4 4 8-9" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 6h7v7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.6" fill="none"/></>,
  download: <><path d="M12 4v12M6 11l6 6 6-6M4 21h16" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  link: <><path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  flame: <><path d="M12 3c1 4 5 5 5 11a5 5 0 01-10 0c0-3 2-4 2-7 1 1 2 2 3 0z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></>,
  diamond: <><path d="M6 3h12l3 6-9 12L3 9l3-6z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/><path d="M3 9h18M9 3l-3 6 6 12M15 3l3 6-6 12" stroke="currentColor" strokeWidth="1.4" fill="none"/></>,
  dot: <><circle cx="12" cy="12" r="4" fill="currentColor"/></>,
  more: <><circle cx="6" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="18" cy="12" r="1.6" fill="currentColor"/></>,
  flask: <><path d="M9 3v6L4 19a2 2 0 002 3h12a2 2 0 002-3l-5-10V3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/><path d="M9 3h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M7 14h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/></>,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" opacity="0.7"/></>,
  exchange: <><path d="M3 8h14l-3-3M21 16H7l3 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  spark: <><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></>,
  google: <><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.3-.9 2.4-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5z" fill="#4285F4"/><path d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6C4.7 19.9 8.1 22 12 22z" fill="#34A853"/><path d="M6.4 13.9c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.3H3c-.7 1.4-1.1 3-1.1 4.7s.4 3.3 1.1 4.7l3.4-2.8z" fill="#FBBC04"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 2.9 14.7 2 12 2 8.1 2 4.7 4.1 3 7.3l3.4 2.6C7.2 7.7 9.4 5.9 12 5.9z" fill="#EA4335"/></>,
  apple: <><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="currentColor"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 10h18" stroke="currentColor" strokeWidth="1.6"/><circle cx="17" cy="14" r="1.4" fill="currentColor"/></>,
  card: <><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 10h18M7 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></>,
  key: <><circle cx="8" cy="14" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M11 13l8-8 2 2-2 2 2 2-2 2-2-2-2 2" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" strokeLinecap="round"/></>,
  users: <><circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/><circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M16 14c2.8 0 5 2.2 5 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></>,
  gift: <><rect x="3" y="9" width="18" height="11" rx="1" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 13h18M12 9v11M8 9c-2 0-3-1-3-2.5S6 4 8 4c2 0 4 5 4 5s2-5 4-5c2 0 3 1 3 2.5S18 9 16 9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></>,
  receipt: <><path d="M5 3v18l2-1.5L9 21l2-1.5 2 1.5 2-1.5 2 1.5 2-1.5V3l-2 1.5L17 3l-2 1.5L13 3l-2 1.5L9 3 7 4.5 5 3z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" stroke="currentColor" strokeWidth="1.6" fill="none"/></>,
  log: <><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>,
};

function Icon({ name, size = 24, color, style = {}, strokeWidth }) {
  const path = ICON_PATHS[name];
  if (!path) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      style={{ color: color || 'currentColor', flexShrink: 0, ...style }}
      strokeWidth={strokeWidth}
    >
      {path}
    </svg>
  );
}

window.Icon = Icon;
