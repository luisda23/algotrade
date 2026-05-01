// ui.jsx — themed primitive components
// All components accept a `t` prop (resolved theme tokens)

function Sparkline({ data, color, neg, height = 32, width = 80, fill = true }) {
  // Fallback si no hay datos
  if (!data || !Array.isArray(data) || data.length === 0) {
    data = [50, 52, 51, 54, 53, 55, 58, 57, 60];
  }
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = width, h = height;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return [x, y];
  });
  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const fillD = `${pathD} L${w},${h} L0,${h} Z`;
  const c = color || (neg ? '#FF4757' : '#00D17A');
  const id = React.useId();
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={c} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {fill && <path d={fillD} fill={`url(#spark-${id})`} />}
      <path d={pathD} fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Themed button
function Button({ t, variant = 'primary', size = 'md', icon, iconRight, full, onClick, children, style = {} }) {
  const sizes = {
    sm: { h: 36, px: 14, fs: 14, gap: 6 },
    md: { h: 48, px: 18, fs: 15, gap: 8 },
    lg: { h: 56, px: 22, fs: 16, gap: 10 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: t.text, color: t.bg, border: 'none' },
    accent: { bg: t.accent, color: t.isDark ? '#000' : '#fff', border: 'none' },
    ghost: { bg: 'transparent', color: t.text, border: `1px solid ${t.borderStrong}` },
    soft: { bg: t.chip, color: t.text, border: 'none' },
    danger: { bg: t.negSoft, color: t.neg, border: 'none' },
    success: { bg: t.posSoft, color: t.pos, border: 'none' },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} style={{
      height: s.h, padding: `0 ${s.px}px`, gap: s.gap,
      background: v.bg, color: v.color, border: v.border,
      borderRadius: t.radius.lg,
      fontFamily: t.fontBody, fontSize: s.fs, fontWeight: t.weight.bold,
      letterSpacing: t.letterSpace,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', width: full ? '100%' : 'auto',
      transition: 'transform 0.08s ease, opacity 0.15s ease',
      ...style,
    }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {icon && <Icon name={icon} size={s.fs + 3} />}
      {children}
      {iconRight && <Icon name={iconRight} size={s.fs + 3} />}
    </button>
  );
}

function Card({ t, children, style = {}, padding = 16, onClick, raised = true }) {
  return (
    <div onClick={onClick} style={{
      background: t.bgCard,
      borderRadius: t.radius.xl,
      padding,
      border: raised ? `1px solid ${t.border}` : 'none',
      boxShadow: raised && !t.isDark ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

function Chip({ t, children, color, icon, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 9px',
      background: color ? `${color}22` : t.chip,
      color: color || t.textDim,
      borderRadius: t.radius.pill,
      fontFamily: t.fontBody, fontSize: 11, fontWeight: t.weight.med,
      letterSpacing: 0.2, textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {icon && <Icon name={icon} size={12}/>}
      {children}
    </span>
  );
}

function Toggle({ t, on, onChange }) {
  return (
    <button onClick={() => onChange && onChange(!on)} style={{
      width: 44, height: 26, borderRadius: 13, border: 'none',
      background: on ? t.accent : t.chip,
      position: 'relative', cursor: 'pointer',
      transition: 'background 0.18s',
      padding: 0,
    }}>
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: 10,
        background: '#fff', transition: 'left 0.18s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}/>
    </button>
  );
}

// Status dot — animated for "running"
function StatusDot({ status, t }) {
  const colors = { running: t.pos, paused: '#F5A623', stopped: t.neg, error: t.neg };
  const c = colors[status] || t.textDim;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ position: 'relative', width: 8, height: 8 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: 4, background: c }}/>
        {status === 'running' && (
          <span style={{
            position: 'absolute', inset: -2, borderRadius: 6, background: c,
            opacity: 0.4, animation: 'pulse 1.6s ease-out infinite',
          }}/>
        )}
      </span>
    </span>
  );
}

// Section header
function SectionHeader({ t, title, action, actionOnClick }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '20px 20px 12px',
    }}>
      <h2 style={{
        margin: 0, fontFamily: t.fontDisplay,
        fontSize: 18, fontWeight: t.weight.bold,
        letterSpacing: t.letterSpace, color: t.text,
        whiteSpace: 'nowrap',
      }}>{title}</h2>
      {action && (
        <button onClick={actionOnClick} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: t.accent, fontFamily: t.fontBody,
          fontSize: 13, fontWeight: t.weight.med, padding: 0,
        }}>{action}</button>
      )}
    </div>
  );
}

// Tab bar (bottom nav)
function TabBar({ t, tabs, active, onChange }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
      paddingBottom: 24, paddingTop: 8,
      background: t.isDark
        ? 'linear-gradient(to top, ' + t.bg + ' 60%, transparent)'
        : 'linear-gradient(to top, ' + t.bg + ' 60%, transparent)',
    }}>
      <div style={{
        margin: '0 16px',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        background: t.bgElev,
        borderRadius: t.radius.pill,
        border: `1px solid ${t.border}`,
        padding: 6,
        boxShadow: t.isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.06)',
      }}>
        {tabs.map(tab => {
          const isActive = tab.id === active;
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)} style={{
              flex: 1, height: 44, borderRadius: 22,
              background: isActive ? t.text : 'transparent',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6,
              color: isActive ? t.bg : t.textDim,
              fontFamily: t.fontBody, fontSize: 13, fontWeight: t.weight.bold,
              transition: 'background 0.18s, color 0.18s',
            }}>
              <Icon name={tab.icon} size={20}/>
              {isActive && <span>{tab.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Header (in-screen header, not iOS nav bar)
function ScreenHeader({ t, title, subtitle, leading, trailing, onBack }) {
  return (
    <div style={{
      padding: '16px 20px 12px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {(onBack || leading) && (
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: 19,
          background: t.chip, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: t.text, padding: 0,
        }}>
          {leading || <Icon name="arrowLeft" size={18}/>}
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontDisplay, fontSize: 19, fontWeight: t.weight.bold,
          color: t.text, letterSpacing: t.letterSpace,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</div>
        {subtitle && (
          <div style={{
            fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 2,
          }}>{subtitle}</div>
        )}
      </div>
      {trailing}
    </div>
  );
}

Object.assign(window, {
  Sparkline, Button, Card, Chip, Toggle, StatusDot,
  SectionHeader, TabBar, ScreenHeader,
});
