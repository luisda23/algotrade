// themes.jsx — Mono theme (Black & White professional)
// Single, clean, professional aesthetic

const THEMES = {
  mono: {
    name: 'AlgoTrade',
    tagline: 'Professional trading bots',
    dark: {
      bg: '#000000',
      bgElev: '#0D0D0D',
      bgCard: '#141414',
      bgInset: '#080808',
      border: 'rgba(255,255,255,0.08)',
      borderStrong: 'rgba(255,255,255,0.16)',
      text: '#FFFFFF',
      textDim: '#A0A0A0',
      textMute: '#666666',
      accent: '#FFFFFF', // White accent on dark
      accentSoft: 'rgba(255,255,255,0.08)',
      pos: '#00C853',
      posSoft: 'rgba(0,200,83,0.12)',
      neg: '#FF3B30',
      negSoft: 'rgba(255,59,48,0.12)',
      chip: 'rgba(255,255,255,0.06)',
    },
    light: {
      bg: '#FAFAFA',
      bgElev: '#FFFFFF',
      bgCard: '#FFFFFF',
      bgInset: '#F0F0F0',
      border: 'rgba(0,0,0,0.08)',
      borderStrong: 'rgba(0,0,0,0.18)',
      text: '#000000',
      textDim: '#666666',
      textMute: '#999999',
      accent: '#000000', // Black accent on light
      accentSoft: 'rgba(0,0,0,0.06)',
      pos: '#00A848',
      posSoft: 'rgba(0,168,72,0.08)',
      neg: '#E5342A',
      negSoft: 'rgba(229,52,42,0.08)',
      chip: 'rgba(0,0,0,0.05)',
    },
    fontDisplay: '"Inter Tight", "Inter", "SF Pro Display", system-ui',
    fontBody: '"Inter", "SF Pro Text", system-ui',
    fontMono: '"JetBrains Mono", "SF Mono", "IBM Plex Mono", monospace',
    radius: { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 },
    weight: { normal: 400, med: 500, bold: 600 },
    letterSpace: -0.2,
  },
};

// Resolve theme: returns flat token object including helpers
function resolveTheme(themeKey, mode) {
  // Always use 'mono' theme regardless of input
  const t = THEMES.mono;
  const c = t[mode];
  return {
    ...t,
    ...c,
    mode,
    key: 'mono',
    isDark: mode === 'dark',
  };
}

window.THEMES = THEMES;
window.resolveTheme = resolveTheme;
