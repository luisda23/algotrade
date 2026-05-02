// app.jsx — main app shell with navigation between screens

function BotApp({ themeKey, mode, setMode, setThemeKey, startScreen = 'dashboard' }) {
  const t = resolveTheme(themeKey, mode);

  // Verificar si hay token guardado al iniciar
  const hasToken = (() => {
    try { return !!localStorage.getItem('token'); } catch (e) { return false; }
  })();

  const [screen, setScreen] = React.useState(hasToken ? startScreen : 'auth');
  const [selectedBot, setSelectedBot] = React.useState(null);
  const [accountSection, setAccountSection] = React.useState('home');
  const [tab, setTab] = React.useState('home');
  const [authed, setAuthed] = React.useState(hasToken);
  const [authError, setAuthError] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; }
  });
  const [userBots, setUserBots] = React.useState([]);

  const API_BASE = window.API_BASE || 'http://localhost:5000/api';

  // Cargar bots del usuario cuando está autenticado
  React.useEffect(() => {
    if (!authed) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_BASE}/bots`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUserBots(data);
        }
      })
      .catch(err => console.error('Error cargando bots:', err));
  }, [authed]);

  // Verificar pago de Stripe al regresar
  React.useEffect(() => {
    if (!authed) return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session');

    if (payment === 'success' && sessionId) {
      const token = localStorage.getItem('token');
      // Recuperar config del bot guardada antes del pago
      const botConfig = (() => {
        try { return JSON.parse(localStorage.getItem('pendingBotConfig') || 'null'); }
        catch (e) { return null; }
      })();

      fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, botConfig }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.bot) {
            setUserBots(prev => [...prev, data.bot]);
            localStorage.removeItem('pendingBotConfig');
          }
          // Limpiar query params
          window.history.replaceState({}, '', window.location.pathname);
          setScreen('dashboard');
          setTab('home');
        })
        .catch(err => console.error('Error verificando pago:', err));
    } else if (payment === 'cancel') {
      localStorage.removeItem('pendingBotConfig');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [authed]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setUserBots([]);
    setAuthed(false);
    setScreen('auth');
  };

  const handleAuth = async (data) => {
    setAuthError(null);

    // Por ahora Google y Apple no están implementados
    if (data.provider === 'google' || data.provider === 'apple') {
      setAuthError(`${data.provider} login próximamente disponible`);
      return;
    }

    if (data.provider === 'email') {
      try {
        const endpoint = data.mode === 'signup' ? '/auth/signup' : '/auth/login';
        const body = data.mode === 'signup'
          ? { email: data.email, password: data.password, name: data.email.split('@')[0] }
          : { email: data.email, password: data.password };

        const res = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const result = await res.json();

        if (!res.ok) {
          setAuthError(result.error || 'Error de autenticación');
          return;
        }

        // Guardar token y usuario
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        setCurrentUser(result.user);
        setAuthed(true);
        setScreen('dashboard');
      } catch (err) {
        setAuthError('Error conectando al servidor. ¿Está corriendo en localhost:5000?');
      }
    }
  };

  const onTabChange = (id) => {
    setTab(id);
    if (id === 'home') setScreen('dashboard');
    if (id === 'create') setScreen('wizard');
    if (id === 'guide') setScreen('deploy');
    if (id === 'account') { setAccountSection('home'); setScreen('account'); }
  };

  // Mapear screen a tab activo (para el sidebar)
  const activeTab = (() => {
    if (screen === 'dashboard' || screen === 'bot') return 'home';
    if (screen === 'wizard') return 'create';
    if (screen === 'deploy') return 'guide';
    if (screen === 'account') return 'account';
    return 'home';
  })();

  const renderScreen = () => {
    if (!authed || screen === 'auth') {
      return <Auth t={t} onAuth={handleAuth} onClose={null} authError={authError}/>;
    }
    if (screen === 'wizard') return <Wizard t={t} onClose={() => setScreen('dashboard')} onComplete={() => setScreen('dashboard')}/>;
    if (screen === 'bot' && selectedBot) {
      const allBots = [...userBots.map((b, i) => ({
        id: b.id, name: b.name,
        pair: b.parameters?.pair || 'EUR/USD',
        strategy: b.strategy || 'momentum',
        status: b.status === 'active' ? 'running' : 'stopped',
        pnl: b.totalProfit || 0, pnlPct: 0,
        winrate: b.winRate || 0, trades: 0,
        sparkline: [50, 52, 51, 54, 53, 55, 58, 57, 60, 62, 61, 63],
        tags: [b.parameters?.market || 'Forex'],
      })), ...MOCK_BOTS];
      const bot = allBots.find(b => b.id === selectedBot);
      if (!bot) return <Dashboard t={t} bots={MOCK_BOTS} currentUser={currentUser}
        onBot={(id) => { setSelectedBot(id); setScreen('bot'); }}
        onCreate={() => setScreen('wizard')}
        onProfile={() => { setTab('account'); setAccountSection('home'); setScreen('account'); }}
        onTab={setTab}/>;
      return <BotDetail t={t} bot={bot} onBack={() => setScreen('dashboard')} onDeploy={() => { setTab('guide'); setScreen('deploy'); }}/>;
    }
    if (screen === 'deploy') return <DeployGuide t={t} onBack={() => { setTab('home'); setScreen('dashboard'); }}/>;
    if (screen === 'account') return <Account t={t}
      initialSection={accountSection}
      currentUser={currentUser}
      onBack={() => { setTab('home'); setScreen('dashboard'); }}
      onLogout={handleLogout}/>;

    // Normalizar bots reales al formato esperado por Dashboard
    const normalizedUserBots = userBots.map((bot, i) => ({
      id: bot.id,
      name: bot.name,
      pair: bot.parameters?.pair || 'EUR/USD',
      strategy: bot.strategy || 'momentum',
      status: bot.status === 'active' ? 'running' : (bot.status || 'stopped'),
      pnl: bot.totalProfit || 0,
      pnlPct: 0,
      winrate: bot.winRate || 0,
      trades: bot.trades?.length || 0,
      sparkline: [50, 52, 51, 54, 53, 55, 58, 57, 60, 62, 61, 63],
      tags: [bot.parameters?.market || 'Forex'],
      market: bot.parameters?.market || 'Forex',
    }));

    return <Dashboard t={t}
      bots={normalizedUserBots.length > 0 ? normalizedUserBots : MOCK_BOTS}
      currentUser={currentUser}
      onBot={(id) => { setSelectedBot(id); setScreen('bot'); }}
      onCreate={() => setScreen('wizard')}
      onProfile={() => { setTab('account'); setAccountSection('home'); setScreen('account'); }}
      onTab={setTab}/>;
  };

  // Si no autenticado, mostrar solo Auth (sin layout)
  if (!authed || screen === 'auth') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: t.bg, color: t.text,
        fontFamily: t.fontBody,
        padding: '20px',
      }}>
        <div style={{
          width: '100%', maxWidth: 460,
          background: t.bgCard,
          borderRadius: 24,
          border: `1px solid ${t.border}`,
          overflow: 'hidden',
        }}>
          <Auth t={t} onAuth={handleAuth} onClose={null} authError={authError}/>
        </div>
      </div>
    );
  }

  // Si está en wizard, mostrar fullscreen sin sidebar
  if (screen === 'wizard') {
    return (
      <div style={{
        minHeight: '100vh', background: t.bg, color: t.text,
        fontFamily: t.fontBody,
      }}>
        <Wizard t={t} onClose={() => setScreen('dashboard')} onComplete={() => setScreen('dashboard')}/>
      </div>
    );
  }

  // Layout normal con sidebar
  return (
    <div style={{ fontFamily: t.fontBody }}>
      <WebLayout
        t={t}
        currentTab={activeTab}
        onTabChange={onTabChange}
        currentUser={currentUser}
        onLogout={handleLogout}>
        <div className="page-enter" key={screen}>
          {renderScreen()}
        </div>
      </WebLayout>
    </div>
  );
}

window.BotApp = BotApp;
