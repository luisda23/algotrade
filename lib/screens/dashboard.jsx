// dashboard.jsx — Web premium dashboard

function Dashboard({ t, bots, onBot, onCreate, onTab, onProfile, currentUser }) {
  const safeBots = bots && bots.length > 0 ? bots : [];
  const total = safeBots.reduce((a, b) => a + (b.pnl || 0), 0);
  const running = safeBots.filter(b => b.status === 'running').length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const userName = currentUser?.name || 'Trader';

  const isPos = total >= 0;

  return (
    <WebContainer>
      {/* HERO sección */}
      <section style={{ marginBottom: 'clamp(32px, 5vw, 56px)' }}>
        <div style={{
          fontSize: 13, color: t.textDim,
          textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600,
          marginBottom: 8,
        }}>
          {greeting}
        </div>
        <h1 style={{
          fontFamily: '"Inter Tight", "Inter", sans-serif',
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          margin: '0 0 12px',
          color: t.text,
        }}>
          {userName}
        </h1>
        <p style={{
          fontSize: 'clamp(15px, 1.4vw, 18px)',
          color: t.textDim,
          maxWidth: 540,
          lineHeight: 1.5,
          margin: 0,
        }}>
          Resumen de tu actividad de trading. Crea, monitorea y descarga bots desde aquí.
        </p>
      </section>

      {/* STATS GRID */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 'clamp(32px, 5vw, 56px)',
      }}>
        <StatCard t={t} label="Total P&L (30d)" value={`${isPos ? '+' : ''}$${Math.abs(total).toFixed(2)}`} sub="Live" subColor={t.pos} highlight={isPos ? t.pos : t.neg} large/>
        <StatCard t={t} label="Bots activos" value={`${running}/${safeBots.length}`} sub="Operando ahora"/>
        <StatCard t={t} label="Trades hoy" value="0" sub="Sin operaciones"/>
        <StatCard t={t} label="Winrate" value="—" sub="Sin trades"/>
      </section>

      {/* CREAR NUEVO BOT */}
      <section style={{ marginBottom: 'clamp(32px, 5vw, 56px)' }}>
        <div onClick={onCreate} style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '24px 28px',
          borderRadius: 20,
          background: t.isDark ? '#0F0F0F' : '#0A0A0A',
          color: '#fff',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(0,0,0,0.25)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: '#fff', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="plus" size={28}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: '"Inter Tight"', fontSize: 22, fontWeight: 700,
              letterSpacing: '-0.02em', marginBottom: 4,
            }}>
              Crear nuevo bot
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
              Wizard guiado · 8 pasos · €9.99 pago único
            </div>
          </div>
          <div style={{
            padding: '12px 20px', borderRadius: 999,
            background: '#fff', color: '#000',
            fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
            flexShrink: 0,
          }}>
            Empezar
            <Icon name="arrowRight" size={16}/>
          </div>
        </div>
      </section>

      {/* MIS BOTS */}
      <section>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 20,
        }}>
          <h2 style={{
            fontFamily: '"Inter Tight"',
            fontSize: 'clamp(22px, 2.4vw, 28px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: 0,
            color: t.text,
          }}>
            Mis bots
          </h2>
          <span style={{ fontSize: 13, color: t.textDim }}>
            {safeBots.length} {safeBots.length === 1 ? 'bot' : 'bots'}
          </span>
        </div>

        {safeBots.length === 0 ? (
          <EmptyState t={t} onCreate={onCreate}/>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {safeBots.map(b => <BotCard key={b.id} t={t} bot={b} onClick={() => onBot(b.id)}/>)}
          </div>
        )}
      </section>

      {/* PULSO DEL MERCADO */}
      <section style={{ marginTop: 'clamp(40px, 6vw, 80px)' }}>
        <h2 style={{
          fontFamily: '"Inter Tight"',
          fontSize: 'clamp(22px, 2.4vw, 28px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          margin: '0 0 20px',
          color: t.text,
        }}>
          Pulso del mercado
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}>
          <MarketCard t={t} sym="BTC/USDT" price="67,842.10" change="+2.34%" up/>
          <MarketCard t={t} sym="EUR/USD" price="1.0847" change="-0.42%"/>
          <MarketCard t={t} sym="NAS100" price="18,421.80" change="+1.18%" up/>
          <MarketCard t={t} sym="XAU/USD" price="2,658.40" change="+0.78%" up/>
        </div>
      </section>
    </WebContainer>
  );
}

// ─── Components ───
function StatCard({ t, label, value, sub, subColor, highlight, large }) {
  return (
    <div style={{
      padding: '24px 24px',
      borderRadius: 16,
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      transition: 'border-color 0.2s ease',
    }}
    onMouseEnter={(e) => e.currentTarget.style.borderColor = t.borderStrong}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = t.border}>
      <div style={{
        fontSize: 11, color: t.textDim,
        textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600,
        marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: '"Inter Tight"',
        fontSize: large ? 'clamp(28px, 3vw, 40px)' : 'clamp(22px, 2.2vw, 28px)',
        fontWeight: 800, letterSpacing: '-0.03em',
        color: highlight || t.text,
        lineHeight: 1,
        marginBottom: 8,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: subColor || t.textDim, fontWeight: 500 }}>
          {subColor && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: subColor, marginRight: 6, verticalAlign: 'middle' }}/>}
          {sub}
        </div>
      )}
    </div>
  );
}

function BotCard({ t, bot, onClick }) {
  const isPos = (bot.pnl || 0) >= 0;
  return (
    <div onClick={onClick} style={{
      padding: '20px',
      borderRadius: 16,
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = t.borderStrong; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = t.border; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: t.chip, color: t.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name="bot" size={22}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: '"Inter Tight"', fontSize: 16, fontWeight: 700,
            color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {bot.name}
          </div>
          <div style={{ fontSize: 12, color: t.textDim, marginTop: 2 }}>
            {bot.pair} · {bot.strategy}
          </div>
        </div>
        <div style={{
          padding: '4px 8px', borderRadius: 6,
          fontSize: 10, fontWeight: 700,
          background: bot.status === 'running' ? t.posSoft : t.chip,
          color: bot.status === 'running' ? t.pos : t.textDim,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {bot.status === 'running' ? 'Live' : 'Pausado'}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 22, fontWeight: 700,
            color: isPos ? t.pos : t.neg,
            lineHeight: 1,
          }}>
            {isPos ? '+' : ''}${Math.abs(bot.pnl || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>
            P&L total
          </div>
        </div>
        <Sparkline data={bot.sparkline} color={isPos ? t.pos : t.neg} width={120} height={40}/>
      </div>
    </div>
  );
}

function MarketCard({ t, sym, price, change, up }) {
  return (
    <div style={{
      padding: '16px 18px',
      borderRadius: 12,
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <div style={{ fontFamily: '"Inter Tight"', fontSize: 13, fontWeight: 600, color: t.text }}>{sym}</div>
        <div style={{ fontFamily: '"JetBrains Mono"', fontSize: 14, color: t.textDim, marginTop: 2 }}>{price}</div>
      </div>
      <div style={{
        fontFamily: '"JetBrains Mono"', fontSize: 13, fontWeight: 700,
        color: up ? t.pos : t.neg,
      }}>
        {up ? '▲' : '▼'} {change}
      </div>
    </div>
  );
}

function EmptyState({ t, onCreate }) {
  return (
    <div style={{
      padding: '48px 24px',
      borderRadius: 16,
      background: t.bgCard,
      border: `1.5px dashed ${t.border}`,
      textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 32,
        background: t.chip,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Icon name="bot" size={32} color={t.textDim}/>
      </div>
      <h3 style={{
        fontFamily: '"Inter Tight"', fontSize: 20, fontWeight: 700,
        margin: '0 0 8px', color: t.text,
      }}>
        Aún no tienes bots
      </h3>
      <p style={{ color: t.textDim, fontSize: 14, margin: '0 0 20px', maxWidth: 360, marginInline: 'auto' }}>
        Crea tu primer bot en 5 minutos con el wizard guiado.
      </p>
      <button onClick={onCreate} style={{
        padding: '12px 24px', borderRadius: 12,
        background: t.text, color: t.bg,
        border: 'none', cursor: 'pointer',
        fontFamily: t.fontBody, fontSize: 14, fontWeight: 600,
      }}>
        Crear mi primer bot →
      </button>
    </div>
  );
}

window.Dashboard = Dashboard;
