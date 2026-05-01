// dashboard.jsx — main bots dashboard

function Dashboard({ t, bots, onBot, onCreate, onTab, onProfile, currentUser }) {
  const safeBots = bots && bots.length > 0 ? bots : [];
  const total = safeBots.reduce((a, b) => a + (b.pnl || 0), 0);
  const running = safeBots.filter(b => b.status === 'running').length;
  const totalPct = safeBots.length > 0
    ? (safeBots.reduce((a, b) => a + (b.pnlPct || 0), 0) / safeBots.length).toFixed(2)
    : '0.00';

  // Saludo dinámico según hora
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const userName = currentUser?.name || 'Trader';

  return (
    <div style={{ paddingBottom: 130 }}>
      {/* top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px 8px',
      }}>
        <div>
          <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            {greeting}
          </div>
          <div style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: t.weight.bold, color: t.text, letterSpacing: t.letterSpace }}>
            {userName}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onProfile} style={{
            width: 40, height: 40, borderRadius: t.radius.lg, background: t.chip, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.text, cursor: 'pointer',
          }}>
            <Icon name="user" size={20}/>
          </button>
        </div>
      </div>

      {/* portfolio hero card */}
      <div style={{ padding: '8px 16px 0' }}>
        <Card t={t} padding={20} style={{
          background: t.key === 'institutional'
            ? `linear-gradient(135deg, ${t.bgCard} 0%, ${t.bgElev} 100%)`
            : t.bgCard,
          position: 'relative', overflow: 'hidden',
        }}>
          {t.key === 'fintech' && (
            <div style={{
              position: 'absolute', right: -40, top: -40, width: 180, height: 180,
              borderRadius: 90, background: `radial-gradient(circle, ${t.accent}33 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}/>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Total P&L · 30 días
            </div>
            <Chip t={t} icon="dot" color={t.pos}>Live</Chip>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
            <div style={{
              fontFamily: t.key === 'editorial' ? t.fontDisplay : t.fontMono,
              fontSize: 38, fontWeight: t.weight.bold, color: t.text,
              letterSpacing: -1, lineHeight: 1,
            }}>
              {total >= 0 ? '+' : ''}${total.toFixed(2)}
            </div>
            <div style={{
              fontFamily: t.fontMono, fontSize: 14, fontWeight: t.weight.bold,
              color: total >= 0 ? t.pos : t.neg,
              padding: '3px 8px', borderRadius: t.radius.sm,
              background: total >= 0 ? t.posSoft : t.negSoft,
            }}>
              {totalPct >= 0 ? '+' : ''}{totalPct}%
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 14 }}>
            <Stat t={t} label="Bots activos" value={`${running}/${bots.length}`}/>
            <Stat t={t} label="Trades hoy" value="38"/>
            <Stat t={t} label="Winrate" value="67%"/>
          </div>
          <div style={{ marginTop: 16 }}>
            <Sparkline data={[10,14,12,18,22,19,28,32,30,38,42,40,46,50,48,54,58]} color={t.pos} width={356} height={48}/>
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card t={t} padding={14} style={{
          background: t.key === 'institutional' ? t.accent + '12' : t.accentSoft,
          border: `1px solid ${t.accent}33`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: t.radius.lg,
            background: t.accent, color: t.isDark ? '#000' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="plus" size={22}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 15, fontWeight: t.weight.bold, color: t.text }}>
              Crear nuevo bot
            </div>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 1 }}>
              Wizard guiado · 5 min · IA assistant incluida
            </div>
          </div>
          <button onClick={onCreate} style={{
            background: t.accent, color: t.isDark ? '#000' : '#fff', border: 'none',
            padding: '8px 14px', borderRadius: t.radius.pill, cursor: 'pointer',
            fontFamily: t.fontBody, fontSize: 13, fontWeight: t.weight.bold,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            Empezar <Icon name="arrowRight" size={14}/>
          </button>
        </Card>
      </div>

      {/* My bots */}
      <SectionHeader t={t} title="Mis bots"/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
        {bots.map(b => <BotRow key={b.id} t={t} bot={b} onClick={() => onBot(b.id)}/>)}
      </div>

      {/* Market pulse */}
      <SectionHeader t={t} title="Pulso del mercado"/>
      <div style={{ padding: '0 16px' }}>
        <Card t={t} padding={0}>
          {[
            { name: 'BTC/USDT', price: '67,842.10', chg: 2.34, spark: [10,12,11,15,18,16,22,25] },
            { name: 'EUR/USD', price: '1.0847', chg: -0.42, spark: [25,22,24,20,18,21,17,15] },
            { name: 'NAS100', price: '18,421.80', chg: 1.18, spark: [15,18,16,20,19,22,24,26] },
            { name: 'XAU/USD', price: '2,658.40', chg: 0.78, spark: [12,14,13,16,15,18,17,20] },
          ].map((m, i, arr) => (
            <div key={m.name} style={{
              display: 'flex', alignItems: 'center', padding: '12px 14px',
              borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.fontMono, fontSize: 14, fontWeight: t.weight.bold, color: t.text }}>
                  {m.name}
                </div>
                <div style={{ fontFamily: t.fontMono, fontSize: 11, color: t.textDim, marginTop: 2 }}>
                  {m.price}
                </div>
              </div>
              <Sparkline data={m.spark} color={m.chg >= 0 ? t.pos : t.neg} width={64} height={28}/>
              <div style={{
                width: 64, textAlign: 'right',
                fontFamily: t.fontMono, fontSize: 13, fontWeight: t.weight.bold,
                color: m.chg >= 0 ? t.pos : t.neg,
              }}>
                {m.chg >= 0 ? '+' : ''}{m.chg}%
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Stat({ t, label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: t.fontBody, fontSize: 10, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontFamily: t.fontMono, fontSize: 16, fontWeight: t.weight.bold, color: t.text, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function BotRow({ t, bot, onClick }) {
  const isPos = bot.pnl >= 0;
  return (
    <Card t={t} padding={0} onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: 14, gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: t.radius.lg,
          background: bot.isFunded ? t.accentSoft : t.chip,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: bot.isFunded ? t.accent : t.text, flexShrink: 0, position: 'relative',
        }}>
          <Icon name="bot" size={22}/>
          <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
            <StatusDot status={bot.status} t={t}/>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: t.fontDisplay, fontSize: 14, fontWeight: t.weight.bold, color: t.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 200,
          }}>{bot.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: t.fontMono, fontSize: 11, color: t.textDim }}>{bot.pair}</span>
            <span style={{ width: 2, height: 2, borderRadius: 1, background: t.textDim }}/>
            <span style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{bot.strategy}</span>
            {bot.marketKey && (
              <Chip t={t} color={isMarketOpen(bot.marketKey) ? t.pos : t.neg} style={{ fontSize: 9, padding: '2px 6px' }}>
                {isMarketOpen(bot.marketKey) ? '● Open' : '● Closed'}
              </Chip>
            )}
            {bot.isFunded && <Chip t={t} color={t.accent} style={{ fontSize: 9, padding: '2px 6px' }}>{bot.fundedFirm}</Chip>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: t.fontMono, fontSize: 14, fontWeight: t.weight.bold,
            color: isPos ? t.pos : t.neg,
          }}>
            {isPos ? '+' : ''}${Math.abs(bot.pnl).toFixed(2)}
          </div>
          <div style={{ fontFamily: t.fontMono, fontSize: 11, color: isPos ? t.pos : t.neg, opacity: 0.8 }}>
            {isPos ? '▲' : '▼'} {Math.abs(bot.pnlPct).toFixed(2)}%
          </div>
        </div>
      </div>
      <div style={{ padding: '0 14px 12px' }}>
        <Sparkline data={bot.sparkline} color={isPos ? t.pos : t.neg} width={332} height={24}/>
      </div>
    </Card>
  );
}

window.Dashboard = Dashboard;
