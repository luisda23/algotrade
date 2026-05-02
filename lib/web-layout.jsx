// web-layout.jsx — Layout web responsive (sidebar desktop / bottom tabs mobile)

function WebLayout({ t, currentTab, onTabChange, currentUser, onLogout, children }) {
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: 'home' },
    { id: 'create', label: 'Crear bot', icon: 'plus' },
    { id: 'guide', label: 'Guía MT4/MT5', icon: 'book' },
    { id: 'account', label: 'Cuenta', icon: 'user' },
  ];

  const sidebarBg = t.isDark ? '#0A0A0A' : '#FAFAFA';
  const mainBg = t.isDark ? '#000000' : '#FFFFFF';

  // ── DESKTOP LAYOUT ──
  if (!isMobile) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        minHeight: '100vh',
        background: mainBg,
        color: t.text,
      }}>
        {/* Sidebar */}
        <aside style={{
          background: sidebarBg,
          borderRight: `1px solid ${t.border}`,
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}>
          {/* Logo */}
          <a href="/" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 12px 24px',
            textDecoration: 'none',
            color: t.text,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: t.isDark ? '#fff' : '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <path d="M5 22 L11 16 L17 19 L23 11 L28 8" stroke={t.isDark ? '#000' : '#fff'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="28" cy="8" r="2.5" fill={t.isDark ? '#000' : '#fff'}/>
              </svg>
            </div>
            <span style={{
              fontFamily: '"Inter Tight", sans-serif',
              fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px',
            }}>AlgoTrade</span>
          </a>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map(item => {
              const active = currentTab === item.id;
              return (
                <button key={item.id}
                  onClick={() => onTabChange(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 12px', borderRadius: 10,
                    background: active ? (t.isDark ? '#fff' : '#000') : 'transparent',
                    color: active ? (t.isDark ? '#000' : '#fff') : t.textDim,
                    border: 'none', cursor: 'pointer',
                    fontFamily: t.fontBody, fontSize: 14, fontWeight: 500,
                    textAlign: 'left', width: '100%',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = t.chip; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  <Icon name={item.icon} size={18}/>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User card al pie */}
          <div style={{ marginTop: 'auto', padding: '16px 12px 8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px',
              background: t.chip,
              borderRadius: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 18,
                background: t.isDark ? '#fff' : '#000',
                color: t.isDark ? '#000' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Inter Tight"', fontSize: 14, fontWeight: 700,
                flexShrink: 0,
              }}>{(currentUser?.name || 'U')[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser?.name || 'Usuario'}
                </div>
                <div style={{ fontSize: 11, color: t.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser?.email || ''}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{
          background: mainBg,
          minHeight: '100vh',
          overflow: 'auto',
        }}>
          {children}
        </main>
      </div>
    );
  }

  // ── MOBILE LAYOUT ──
  return (
    <div style={{
      minHeight: '100vh',
      background: mainBg,
      color: t.text,
      paddingBottom: 80,
    }}>
      {/* Top bar mobile */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        background: mainBg + 'ee',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${t.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: t.isDark ? '#fff' : '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M5 22 L11 16 L17 19 L23 11 L28 8" stroke={t.isDark ? '#000' : '#fff'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="28" cy="8" r="2.5" fill={t.isDark ? '#000' : '#fff'}/>
            </svg>
          </div>
          <span style={{ fontFamily: '"Inter Tight"', fontSize: 16, fontWeight: 700 }}>AlgoTrade</span>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Bottom tab bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-around',
        padding: '8px 8px 16px',
        background: mainBg + 'ee',
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${t.border}`,
      }}>
        {navItems.map(item => {
          const active = currentTab === item.id;
          return (
            <button key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '8px 12px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: active ? t.text : t.textDim,
                fontFamily: t.fontBody, fontSize: 10, fontWeight: 600,
                flex: 1,
              }}>
              <Icon name={item.icon} size={20}/>
              {item.label.split(' ')[0]}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Container para contenido (max-width responsive)
function WebContainer({ children, padded = true, narrow = false }) {
  return (
    <div style={{
      maxWidth: narrow ? 800 : 1280,
      margin: '0 auto',
      padding: padded ? 'clamp(20px, 4vw, 48px) clamp(16px, 3vw, 40px)' : 0,
      width: '100%',
    }}>
      {children}
    </div>
  );
}

window.WebLayout = WebLayout;
window.WebContainer = WebContainer;
