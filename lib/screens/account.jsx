// account.jsx — user account hub: profile, billing, brokers, referrals, security, notifications
// Uses sub-routes via internal state.

const MOCK_USER = {
  id: 'usr_a8f3k2',
  name: 'Marco Bellini',
  email: 'marco.bellini@gmail.com',
  avatar: null, // initial-only
  joined: '14 mar 2024',
  provider: 'google',
  verified: true,
  totalSpent: 547,
  botsOwned: 3,
};

const MOCK_PAYMENT_METHODS = [
  { id: 'pm_1', brand: 'visa', last4: '4242', exp: '08/27', isDefault: true },
  { id: 'pm_2', brand: 'mastercard', last4: '8810', exp: '11/26', isDefault: false },
];

const MOCK_PURCHASES = [
  { id: 'inv_001', date: '12 oct 2024', bot: 'EUR/USD Scalper Pro', amount: 149, status: 'paid', method: 'Visa •• 4242' },
  { id: 'inv_002', date: '28 sep 2024', bot: 'BTC Grid Master', amount: 199, status: 'paid', method: 'Visa •• 4242' },
  { id: 'inv_003', date: '02 sep 2024', bot: 'NASDAQ Swing AI', amount: 249, status: 'refunded', method: 'Mastercard •• 8810' },
  { id: 'inv_004', date: '14 mar 2024', bot: 'Crédito introductorio', amount: -50, status: 'credit', method: '—' },
];

const MOCK_BROKERS = [
  { id: 'br_1', name: 'Binance', type: 'Crypto', status: 'connected', linkedAt: 'Hace 22 días', perms: 'Spot + Futuros', botsUsing: 1, lastSync: '2 min' },
  { id: 'br_2', name: 'MetaTrader 5 (FTMO)', type: 'Forex prop', status: 'connected', linkedAt: 'Hace 18 días', perms: 'Read + Trade', botsUsing: 1, lastSync: '12 seg' },
  { id: 'br_3', name: 'Interactive Brokers', type: 'Stocks/Indices', status: 'pending', linkedAt: 'Pendiente', perms: '—', botsUsing: 0, lastSync: '—' },
];

const MOCK_LOGS = [
  { id: 1, type: 'login', text: 'Inicio de sesión desde Madrid, ES', time: 'Hace 12 min', icon: 'lock', device: 'iPhone 15 Pro · Safari' },
  { id: 2, type: 'bot', text: 'Bot "EUR/USD Scalper Pro" creado', time: 'Hace 12 días', icon: 'bot', device: '—' },
  { id: 3, type: 'pay', text: 'Pago $149 procesado · Visa •• 4242', time: 'Hace 12 días', icon: 'card', device: '—' },
  { id: 4, type: 'broker', text: 'Broker FTMO conectado', time: 'Hace 18 días', icon: 'link', device: 'API key cifrada AES-256' },
  { id: 5, type: 'login', text: 'Inicio de sesión desde Barcelona, ES', time: 'Hace 22 días', icon: 'lock', device: 'iPhone 15 Pro · Safari' },
  { id: 6, type: 'bot', text: 'Bot "BTC Grid Master" creado', time: 'Hace 28 días', icon: 'bot', device: '—' },
];

function Account({ t, onBack, onLogout, initialSection = 'home', currentUser }) {
  const [section, setSection] = React.useState(initialSection);

  const renderSection = () => {
    if (section === 'profile') return <ProfileSection t={t} onBack={() => setSection('home')} currentUser={currentUser}/>;
    if (section === 'billing') return <BillingSection t={t} onBack={() => setSection('home')}/>;
    if (section === 'brokers') return <BrokersSection t={t} onBack={() => setSection('home')}/>;
    if (section === 'security') return <SecuritySection t={t} onBack={() => setSection('home')}/>;
    if (section === 'notifications') return <NotificationsSection t={t} onBack={() => setSection('home')}/>;
    if (section === 'support') return <SupportSection t={t} onBack={() => setSection('home')}/>;
    return <AccountHome t={t} onBack={onBack} onSection={setSection} onLogout={onLogout} currentUser={currentUser}/>;
  };
  return renderSection();
}

// ─────────────────────────────────────────────
// Account home — list of sub-sections
// ─────────────────────────────────────────────
function AccountHome({ t, onBack, onSection, onLogout, currentUser }) {
  // Mezclar datos reales del usuario con datos mock para campos no-críticos
  const u = {
    ...MOCK_USER,
    name: currentUser?.name || MOCK_USER.name,
    email: currentUser?.email || MOCK_USER.email,
    id: currentUser?.id || MOCK_USER.id,
  };
  const initials = u.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ paddingBottom: 130, background: t.bg, minHeight: '100%' }}>
      <ScreenHeader t={t} title="Mi cuenta" onBack={onBack}/>

      {/* User card */}
      <div style={{ padding: '0 16px 16px' }}>
        <Card t={t} padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 32,
              background: `linear-gradient(135deg, ${t.accent}, ${t.accent}99)`,
              color: t.isDark ? '#000' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: t.fontDisplay, fontSize: 22, fontWeight: t.weight.bold,
              flexShrink: 0,
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: t.fontDisplay, fontSize: 18, fontWeight: t.weight.bold,
                color: t.text, letterSpacing: t.letterSpace,
              }}>
                {u.name}
                {u.verified && <Icon name="check" size={16} color={t.pos} style={{ marginLeft: 6, verticalAlign: 'middle' }}/>}
              </div>
              <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.textDim, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Icon name={u.provider === 'google' ? 'google' : u.provider === 'apple' ? 'apple' : 'mail'} size={14}/>
                {u.email}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
            <UserStat t={t} label="Bots" value={u.botsOwned}/>
            <UserStat t={t} label="Total gastado" value={`$${u.totalSpent}`}/>
            <UserStat t={t} label="Miembro desde" value={u.joined.split(' ').slice(1).join(' ')}/>
          </div>
        </Card>
      </div>

      {/* Sections */}
      <div style={{ padding: '0 16px' }}>
        <SectionLabel t={t}>Cuenta</SectionLabel>
        <Card t={t} padding={0}>
          <AccountRow t={t} icon="user" label="Perfil" detail="Nombre, email, foto" onClick={() => onSection('profile')}/>
          <AccountRow t={t} icon="card" label="Pagos y bots" detail={`${MOCK_PURCHASES.length} compras · pago seguro Stripe`} onClick={() => onSection('billing')}/>
          <AccountRow t={t} icon="link" label="Brokers conectados" detail={`${MOCK_BROKERS.filter(b => b.status === 'connected').length} activos`} onClick={() => onSection('brokers')} isLast/>
        </Card>

        <SectionLabel t={t}>Seguridad y privacidad</SectionLabel>
        <Card t={t} padding={0}>
          <AccountRow t={t} icon="shield" label="Seguridad" detail="2FA, contraseña, sesiones" onClick={() => onSection('security')}/>
          <AccountRow t={t} icon="bell" label="Notificaciones" detail="Trades, alertas, marketing" onClick={() => onSection('notifications')} isLast/>
        </Card>

        <SectionLabel t={t}>Soporte</SectionLabel>
        <Card t={t} padding={0}>
          <AccountRow t={t} icon="mail" label="Contactar soporte" detail="Asistente con preguntas frecuentes" onClick={() => onSection('support')} isLast/>
        </Card>

        <div style={{ padding: '24px 4px 0' }}>
          <button onClick={onLogout} style={{
            width: '100%', height: 50, borderRadius: t.radius.lg, border: `1px solid ${t.border}`,
            background: 'transparent', color: t.neg, cursor: 'pointer',
            fontFamily: t.fontBody, fontSize: 14, fontWeight: t.weight.bold,
          }}>
            Cerrar sesión
          </button>
          <div style={{
            textAlign: 'center', padding: '14px 16px',
            fontFamily: t.fontMono, fontSize: 10, color: t.textMute,
          }}>
            ID: {u.id} · v1.0.4
          </div>
        </div>
      </div>
    </div>
  );
}

function UserStat({ t, label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: t.fontBody, fontSize: 10, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontFamily: t.fontDisplay, fontSize: 16, fontWeight: t.weight.bold, color: t.text, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function SectionLabel({ t, children }) {
  return (
    <div style={{
      fontFamily: t.fontBody, fontSize: 11, color: t.textDim,
      textTransform: 'uppercase', letterSpacing: 0.6,
      padding: '20px 4px 8px',
    }}>{children}</div>
  );
}

function AccountRow({ t, icon, label, detail, onClick, isLast }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: !isLast ? `1px solid ${t.border}` : 'none', textAlign: 'left',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: t.radius.md,
        background: t.chip, color: t.text, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: t.weight.med, color: t.text }}>{label}</div>
        {detail && <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 1 }}>{detail}</div>}
      </div>
      <Icon name="arrowRight" size={14} color={t.textMute}/>
    </button>
  );
}

window.Account = Account;
window.MOCK_USER = MOCK_USER;
window.MOCK_PAYMENT_METHODS = MOCK_PAYMENT_METHODS;
window.MOCK_PURCHASES = MOCK_PURCHASES;
window.MOCK_BROKERS = MOCK_BROKERS;
window.MOCK_LOGS = MOCK_LOGS;
window.UserStat = UserStat;
window.SectionLabel = SectionLabel;
window.AccountRow = AccountRow;
