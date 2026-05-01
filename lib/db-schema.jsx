// db-schema.jsx — visual PostgreSQL schema diagram (entity-relationship)
// Each table is a card. Relations are drawn with SVG paths.

const SCHEMA_TABLES = [
  // ──────── auth & users ────────
  {
    id: 'users', name: 'users', x: 40, y: 40, group: 'auth',
    desc: 'Datos básicos del cliente',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'email', t: 'citext', uniq: true },
      { n: 'password_hash', t: 'text', nullable: true },
      { n: 'name', t: 'text' },
      { n: 'avatar_url', t: 'text' },
      { n: 'phone', t: 'text' },
      { n: 'country', t: 'text' },
      { n: 'kyc_status', t: 'enum', note: 'none, pending, verified' },
      { n: 'referral_code', t: 'text', uniq: true },
      { n: 'referred_by', t: 'uuid', fk: 'users.id', nullable: true },
      { n: 'stripe_customer_id', t: 'text' },
      { n: 'created_at', t: 'timestamptz' },
      { n: 'last_login_at', t: 'timestamptz' },
    ],
  },
  {
    id: 'auth_providers', name: 'auth_providers', x: 380, y: 40, group: 'auth',
    desc: 'Vinculación con Google, Apple, etc.',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'user_id', t: 'uuid', fk: 'users.id' },
      { n: 'provider', t: 'enum', note: 'google, apple, email' },
      { n: 'provider_user_id', t: 'text' },
      { n: 'email_verified', t: 'bool' },
      { n: 'linked_at', t: 'timestamptz' },
    ],
  },
  {
    id: 'sessions', name: 'sessions', x: 720, y: 40, group: 'auth',
    desc: 'Tokens de sesión activos',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'user_id', t: 'uuid', fk: 'users.id' },
      { n: 'refresh_token_hash', t: 'text' },
      { n: 'device', t: 'text' },
      { n: 'ip', t: 'inet' },
      { n: 'expires_at', t: 'timestamptz' },
    ],
  },

  // ──────── bots ────────
  {
    id: 'bots', name: 'bots', x: 40, y: 410, group: 'bots',
    desc: 'Cada bot creado o comprado',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'user_id', t: 'uuid', fk: 'users.id' },
      { n: 'name', t: 'text' },
      { n: 'source', t: 'enum', note: 'created, marketplace' },
      { n: 'marketplace_bot_id', t: 'uuid', fk: 'marketplace_bots.id', nullable: true },
      { n: 'broker_id', t: 'uuid', fk: 'broker_connections.id', nullable: true },
      { n: 'pair', t: 'text' },
      { n: 'market', t: 'enum', note: 'forex, crypto, stocks…' },
      { n: 'strategy', t: 'jsonb', note: 'config completa del bot' },
      { n: 'risk_config', t: 'jsonb', note: 'SL, TP, position size' },
      { n: 'is_funded', t: 'bool' },
      { n: 'funded_firm', t: 'text', nullable: true },
      { n: 'status', t: 'enum', note: 'running, paused, stopped' },
      { n: 'price_paid', t: 'numeric(10,2)' },
      { n: 'created_at', t: 'timestamptz' },
    ],
  },
  {
    id: 'marketplace_bots', name: 'marketplace_bots', x: 40, y: 880, group: 'bots',
    desc: 'Catálogo de bots premium en venta',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'author_id', t: 'uuid', fk: 'users.id' },
      { n: 'name', t: 'text' },
      { n: 'description', t: 'text' },
      { n: 'price', t: 'numeric(10,2)' },
      { n: 'config', t: 'jsonb' },
      { n: 'rating_avg', t: 'numeric(2,1)' },
      { n: 'reviews_count', t: 'int' },
      { n: 'subscribers_count', t: 'int' },
      { n: 'badge', t: 'text' },
      { n: 'is_active', t: 'bool' },
      { n: 'published_at', t: 'timestamptz' },
    ],
  },
  {
    id: 'trades', name: 'trades', x: 380, y: 410, group: 'bots',
    desc: 'Cada operación ejecutada por un bot',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'bot_id', t: 'uuid', fk: 'bots.id' },
      { n: 'user_id', t: 'uuid', fk: 'users.id' },
      { n: 'side', t: 'enum', note: 'buy, sell, long, short' },
      { n: 'pair', t: 'text' },
      { n: 'entry_price', t: 'numeric(20,8)' },
      { n: 'exit_price', t: 'numeric(20,8)', nullable: true },
      { n: 'qty', t: 'numeric(20,8)' },
      { n: 'pnl', t: 'numeric(12,2)', nullable: true },
      { n: 'fees', t: 'numeric(12,2)' },
      { n: 'broker_order_id', t: 'text' },
      { n: 'status', t: 'enum', note: 'open, closed, cancelled' },
      { n: 'opened_at', t: 'timestamptz' },
      { n: 'closed_at', t: 'timestamptz', nullable: true },
    ],
  },
  {
    id: 'bot_stats', name: 'bot_stats_daily', x: 720, y: 410, group: 'bots',
    desc: 'Snapshot diario por bot (rollup)',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'bot_id', t: 'uuid', fk: 'bots.id' },
      { n: 'date', t: 'date' },
      { n: 'pnl_day', t: 'numeric(12,2)' },
      { n: 'pnl_total', t: 'numeric(12,2)' },
      { n: 'trades', t: 'int' },
      { n: 'winrate', t: 'numeric(5,2)' },
      { n: 'drawdown', t: 'numeric(5,2)' },
      { n: 'equity_close', t: 'numeric(14,2)' },
    ],
  },

  // ──────── brokers ────────
  {
    id: 'broker_connections', name: 'broker_connections', x: 1060, y: 40, group: 'brokers',
    desc: 'Vinculación a brokers vía API',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'user_id', t: 'uuid', fk: 'users.id' },
      { n: 'broker', t: 'enum', note: 'binance, mt5, ibkr, bybit…' },
      { n: 'account_alias', t: 'text', note: 'p.ej. "FTMO 200K"' },
      { n: 'api_key_encrypted', t: 'bytea', note: 'AES-256-GCM' },
      { n: 'api_secret_encrypted', t: 'bytea' },
      { n: 'permissions', t: 'text[]', note: 'read, trade, margin' },
      { n: 'is_funded_account', t: 'bool' },
      { n: 'funded_firm', t: 'text', nullable: true },
      { n: 'funded_phase', t: 'text', nullable: true },
      { n: 'last_sync_at', t: 'timestamptz' },
      { n: 'status', t: 'enum', note: 'pending, connected, error' },
    ],
  },

  // ──────── billing ────────
  {
    id: 'payment_methods', name: 'payment_methods', x: 1060, y: 410, group: 'billing',
    desc: 'Tarjetas guardadas (Stripe)',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'user_id', t: 'uuid', fk: 'users.id' },
      { n: 'stripe_pm_id', t: 'text' },
      { n: 'brand', t: 'text', note: 'visa, mastercard…' },
      { n: 'last4', t: 'char(4)' },
      { n: 'exp_month', t: 'int' },
      { n: 'exp_year', t: 'int' },
      { n: 'is_default', t: 'bool' },
    ],
  },
  {
    id: 'purchases', name: 'purchases', x: 1060, y: 740, group: 'billing',
    desc: 'Pago one-time por bot',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'user_id', t: 'uuid', fk: 'users.id' },
      { n: 'bot_id', t: 'uuid', fk: 'bots.id' },
      { n: 'marketplace_bot_id', t: 'uuid', fk: 'marketplace_bots.id', nullable: true },
      { n: 'payment_method_id', t: 'uuid', fk: 'payment_methods.id' },
      { n: 'stripe_payment_intent', t: 'text' },
      { n: 'amount', t: 'numeric(10,2)' },
      { n: 'currency', t: 'char(3)' },
      { n: 'status', t: 'enum', note: 'paid, refunded, failed' },
      { n: 'referral_credit_id', t: 'uuid', fk: 'referral_credits.id', nullable: true },
      { n: 'created_at', t: 'timestamptz' },
    ],
  },

  // ──────── referrals ────────
  {
    id: 'referrals', name: 'referrals', x: 380, y: 880, group: 'referrals',
    desc: 'Quién invitó a quién',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'referrer_id', t: 'uuid', fk: 'users.id' },
      { n: 'referred_id', t: 'uuid', fk: 'users.id' },
      { n: 'code_used', t: 'text' },
      { n: 'first_purchase_at', t: 'timestamptz', nullable: true },
      { n: 'reward_paid', t: 'bool' },
      { n: 'reward_amount', t: 'numeric(10,2)' },
      { n: 'created_at', t: 'timestamptz' },
    ],
  },
  {
    id: 'referral_credits', name: 'referral_credits', x: 720, y: 880, group: 'referrals',
    desc: 'Saldos a favor por referidos',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'user_id', t: 'uuid', fk: 'users.id' },
      { n: 'amount', t: 'numeric(10,2)' },
      { n: 'reason', t: 'text', note: 'invite_bonus, signup_credit' },
      { n: 'used_at', t: 'timestamptz', nullable: true },
      { n: 'expires_at', t: 'timestamptz' },
    ],
  },

  // ──────── ops ────────
  {
    id: 'notifications', name: 'notification_prefs', x: 1060, y: 1080, group: 'ops',
    desc: 'Canales y categorías por user',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'user_id', t: 'uuid', fk: 'users.id' },
      { n: 'category', t: 'enum', note: 'trades, risk, news, billing…' },
      { n: 'channel', t: 'enum', note: 'push, email, sms' },
      { n: 'enabled', t: 'bool' },
    ],
  },
  {
    id: 'audit_log', name: 'audit_log', x: 720, y: 1190, group: 'ops',
    desc: 'Log de seguridad y actividad',
    fields: [
      { n: 'id', t: 'uuid', pk: true },
      { n: 'user_id', t: 'uuid', fk: 'users.id' },
      { n: 'event', t: 'text', note: 'login, bot.create, broker.connect…' },
      { n: 'metadata', t: 'jsonb' },
      { n: 'ip', t: 'inet' },
      { n: 'device', t: 'text' },
      { n: 'created_at', t: 'timestamptz' },
    ],
  },
];

const GROUP_COLORS = {
  auth: { bg: '#EEF2FF', border: '#6366F1', text: '#3730A3', label: 'Auth & Users' },
  bots: { bg: '#ECFDF5', border: '#10B981', text: '#065F46', label: 'Bots & Trading' },
  brokers: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', label: 'Broker Connections' },
  billing: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', label: 'Billing (Stripe)' },
  referrals: { bg: '#FCE7F3', border: '#EC4899', text: '#9D174D', label: 'Referrals' },
  ops: { bg: '#F3F4F6', border: '#6B7280', text: '#1F2937', label: 'Ops & Logs' },
};

function DBSchema() {
  const W = 1480;
  const H = 1380;

  // pre-compute table positions for relation drawing
  const tables = SCHEMA_TABLES;
  const tMap = Object.fromEntries(tables.map(t => [t.id, t]));

  // calculate height per table
  const tableHeight = (t) => 68 + t.fields.length * 22 + 12;
  const tableWidth = 280;

  // build relations (from fk references)
  const relations = [];
  tables.forEach(t => {
    t.fields.forEach((f, idx) => {
      if (!f.fk) return;
      const targetId = f.fk.split('.')[0].replace(/s$/, ''); // marketplace_bots.id → marketplace_bot
      const target = tMap[f.fk.split('.')[0]] || tMap[targetId + 's'];
      if (!target) return;
      relations.push({ from: t.id, fromField: idx, to: target.id, label: f.n });
    });
  });

  return (
    <div style={{
      width: W, height: H, background: '#FAFAF8', position: 'relative',
      borderRadius: 8, border: '1px solid #e5e5e5', overflow: 'hidden',
      fontFamily: '-apple-system, system-ui, sans-serif',
    }}>
      {/* dotted bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}/>

      {/* relation lines */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="#94A3B8"/>
          </marker>
        </defs>
        {relations.map((r, i) => {
          const from = tMap[r.from];
          const to = tMap[r.to];
          if (!from || !to) return null;
          const fromX = from.x + tableWidth;
          const fromY = from.y + 68 + r.fromField * 22 + 11;
          const toX = to.x;
          const toY = to.y + 40;
          // route — different connectors based on direction
          let path;
          if (toX > fromX) {
            const midX = (fromX + toX) / 2;
            path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
          } else {
            // route around
            const offset = 20;
            const turnX = Math.min(fromX, toX) - 40;
            path = `M ${fromX} ${fromY} L ${fromX + offset} ${fromY} L ${fromX + offset} ${fromY + 20} L ${turnX} ${fromY + 20} L ${turnX} ${toY} L ${toX} ${toY}`;
          }
          return (
            <g key={i}>
              <path d={path} fill="none" stroke="#94A3B8" strokeWidth={1.5} markerEnd="url(#arrow)" strokeDasharray={r.from === r.to ? '4 4' : '0'}/>
            </g>
          );
        })}
      </svg>

      {/* group labels */}
      <div style={{ position: 'absolute', top: 14, left: 16, display: 'flex', gap: 8, flexWrap: 'wrap', zIndex: 5 }}>
        {Object.entries(GROUP_COLORS).map(([k, g]) => (
          <div key={k} style={{
            padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600,
            background: g.bg, color: g.text, border: `1px solid ${g.border}`,
          }}>
            <span style={{ marginRight: 6, color: g.border }}>●</span>{g.label}
          </div>
        ))}
      </div>

      {/* tables */}
      {tables.map(table => {
        const g = GROUP_COLORS[table.group];
        return (
          <div key={table.id} style={{
            position: 'absolute', left: table.x, top: table.y, width: tableWidth,
            background: '#fff', borderRadius: 10,
            border: `1.5px solid ${g.border}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            {/* header */}
            <div style={{
              padding: '10px 14px', background: g.bg,
              borderBottom: `1px solid ${g.border}33`,
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: g.text, letterSpacing: 0.2 }}>
                {table.name}
              </div>
              <div style={{ fontSize: 10, color: g.text, opacity: 0.7, marginTop: 2 }}>{table.desc}</div>
            </div>
            {/* fields */}
            <div>
              {table.fields.map((f, i) => (
                <div key={f.n} style={{
                  display: 'flex', alignItems: 'center', padding: '4px 14px', gap: 8,
                  borderBottom: i < table.fields.length - 1 ? '1px solid #F3F4F6' : 'none',
                  fontSize: 11, lineHeight: '14px', height: 22, boxSizing: 'border-box',
                }}>
                  <div style={{ width: 14, fontSize: 9, color: '#94A3B8', flexShrink: 0 }}>
                    {f.pk ? <span style={{ color: '#F59E0B', fontWeight: 700 }}>PK</span> :
                     f.fk ? <span style={{ color: '#6366F1', fontWeight: 700 }}>FK</span> :
                     f.uniq ? <span style={{ color: '#10B981', fontWeight: 700 }}>UQ</span> : ''}
                  </div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: f.pk || f.fk ? 600 : 400,
                    color: '#1F2937', minWidth: 0, flexShrink: 0,
                  }}>{f.n}</div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#64748B',
                    flex: 1, textAlign: 'right',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{f.t}{f.nullable ? '?' : ''}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* legend bottom-left */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, background: '#fff',
        padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e5e5',
        fontSize: 11, lineHeight: 1.6, color: '#475569', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>Leyenda</div>
        <div><span style={{ color: '#F59E0B', fontWeight: 700, fontFamily: 'monospace' }}>PK</span> Primary Key &nbsp; <span style={{ color: '#6366F1', fontWeight: 700, fontFamily: 'monospace' }}>FK</span> Foreign Key &nbsp; <span style={{ color: '#10B981', fontWeight: 700, fontFamily: 'monospace' }}>UQ</span> Unique</div>
        <div>Tipo <code style={{ background: '#F1F5F9', padding: '0 4px', borderRadius: 3 }}>?</code> = nullable. Cifrado con <code style={{ background: '#F1F5F9', padding: '0 4px', borderRadius: 3 }}>bytea</code> usa AES-256-GCM con KMS.</div>
      </div>
    </div>
  );
}

window.DBSchema = DBSchema;
