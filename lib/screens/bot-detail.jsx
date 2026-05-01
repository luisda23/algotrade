// bot-detail.jsx — single bot detail with stats + controls

function BotDetail({ t, bot, onBack, onDeploy }) {
  const [tab, setTab] = React.useState('overview');
  const [status, setStatus] = React.useState(bot.status);
  const [updating, setUpdating] = React.useState(false);
  const isPos = bot.pnl >= 0;

  // Toggle Pausar/Reanudar
  const toggleStatus = async () => {
    setUpdating(true);
    const newStatus = status === 'running' ? 'paused' : 'running';
    try {
      const token = localStorage.getItem('token');
      await fetch(`${window.API_BASE || 'http://localhost:5000/api'}/bots/${bot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus === 'running' ? 'active' : 'paused' }),
      });
      setStatus(newStatus);
    } catch (err) {
      console.error('Error actualizando bot:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ paddingBottom: 130, minHeight: '100%', background: t.bg }}>
      <ScreenHeader t={t} title={bot.name} subtitle={`${bot.pair} · ${bot.strategy}`} onBack={onBack}/>

      {/* hero */}
      <div style={{ padding: '0 16px' }}>
        <Card t={t} padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusDot status={status} t={t}/>
            <span style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {status === 'running' ? 'Operando · Live' : 'Pausado'}
            </span>
          </div>
          <div style={{
            fontFamily: t.key === 'editorial' ? t.fontDisplay : t.fontMono,
            fontSize: 42, fontWeight: t.weight.bold, color: isPos ? t.pos : t.neg,
            marginTop: 8, letterSpacing: -1, lineHeight: 1,
          }}>
            {isPos ? '+' : ''}${Math.abs(bot.pnl).toFixed(2)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
            <span style={{ fontFamily: t.fontMono, fontSize: 14, color: isPos ? t.pos : t.neg, fontWeight: t.weight.bold }}>
              {isPos ? '▲' : '▼'} {Math.abs(bot.pnlPct).toFixed(2)}%
            </span>
            <span style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim }}>· {bot.started}</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <Sparkline data={bot.sparkline} color={isPos ? t.pos : t.neg} width={332} height={70}/>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button t={t}
              variant={status === 'running' ? 'soft' : 'success'}
              icon={status === 'running' ? 'pause' : 'play'}
              onClick={toggleStatus}
              disabled={updating}
              full>
              {updating ? '...' : (status === 'running' ? 'Pausar' : 'Reanudar')}
            </Button>
          </div>
        </Card>
      </div>

      {/* tabs */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', gap: 4, background: t.chip, padding: 4, borderRadius: t.radius.pill }}>
          {['overview', 'trades', 'config'].map(id => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, height: 36, borderRadius: t.radius.pill,
              background: tab === id ? t.bgElev : 'transparent',
              border: 'none', cursor: 'pointer',
              fontFamily: t.fontBody, fontSize: 13, fontWeight: t.weight.bold,
              color: tab === id ? t.text : t.textDim,
              textTransform: 'capitalize',
            }}>{id === 'overview' ? 'Resumen' : id === 'trades' ? 'Trades' : 'Config'}</button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <>
          <SectionHeader t={t} title="Métricas"/>
          <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <MetricCard t={t} label="Winrate" value={`${bot.winrate}%`} sub={`${bot.trades} trades`}/>
            <MetricCard t={t} label="Profit factor" value="2.34" sub="Excelente" subColor={t.pos}/>
            <MetricCard t={t} label="Max drawdown" value={`${bot.drawdown}%`} sub="dentro de límite" subColor={t.pos}/>
            <MetricCard t={t} label="Sharpe ratio" value="1.87" sub="Bueno"/>
          </div>

          {bot.isFunded && (
            <>
              <SectionHeader t={t} title={`Reglas ${bot.fundedFirm}`}/>
              <div style={{ padding: '0 16px' }}>
                <Card t={t} padding={16}>
                  <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, marginBottom: 12 }}>
                    {bot.fundedPhase}
                  </div>
                  <Rule t={t} label="Daily loss" used={1.2} max={5} unit="%"/>
                  <Rule t={t} label="Max drawdown" used={2.1} max={10} unit="%"/>
                  <Rule t={t} label="Profit target" used={6.4} max={10} unit="%"/>
                </Card>
              </div>
            </>
          )}

          <SectionHeader t={t} title="Descargar bot"/>
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Descargar para MT5 */}
            <Card t={t} padding={14} onClick={async () => {
              const token = localStorage.getItem('token');
              const res = await fetch(`${window.API_BASE || 'http://localhost:5000/api'}/bots/${bot.id}/download?format=mq5`, {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              if (!res.ok) {
                alert('Error al descargar el archivo.');
                return;
              }
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = bot.name.replace(/[^a-zA-Z0-9_]/g, '_') + '.mq5';
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            }} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: t.radius.lg,
                background: t.accent, color: t.isDark ? '#000' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontFamily: t.fontMono, fontSize: 13, fontWeight: t.weight.bold, letterSpacing: 0.5,
              }}>
                MT5
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.fontDisplay, fontSize: 14, fontWeight: t.weight.bold, color: t.text }}>
                  Descargar para MetaTrader 5
                </div>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 2 }}>
                  Archivo .mq5 · Recomendado
                </div>
              </div>
              <Icon name="download" size={18} color={t.textDim}/>
            </Card>

            {/* Descargar para MT4 */}
            <Card t={t} padding={14} onClick={async () => {
              const token = localStorage.getItem('token');
              const res = await fetch(`${window.API_BASE || 'http://localhost:5000/api'}/bots/${bot.id}/download?format=mq4`, {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              if (!res.ok) {
                alert('Error al descargar el archivo.');
                return;
              }
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = bot.name.replace(/[^a-zA-Z0-9_]/g, '_') + '.mq4';
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            }} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: t.radius.lg,
                background: t.bgInset, color: t.text,
                border: `1.5px solid ${t.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontFamily: t.fontMono, fontSize: 13, fontWeight: t.weight.bold, letterSpacing: 0.5,
              }}>
                MT4
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.fontDisplay, fontSize: 14, fontWeight: t.weight.bold, color: t.text }}>
                  Descargar para MetaTrader 4
                </div>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 2 }}>
                  Archivo .mq4 · Compatibilidad legado
                </div>
              </div>
              <Icon name="download" size={18} color={t.textDim}/>
            </Card>

            {/* Guía de implementación */}
            <Card t={t} padding={14} onClick={onDeploy} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginTop: 6 }}>
              <div style={{
                width: 48, height: 48, borderRadius: t.radius.lg, background: t.chip, color: t.text,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name="book" size={22}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.fontDisplay, fontSize: 14, fontWeight: t.weight.bold, color: t.text }}>
                  Guía de implementación
                </div>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 2 }}>
                  Cómo instalar el bot en MetaTrader · 8 pasos
                </div>
              </div>
              <Icon name="arrowRight" size={18} color={t.textDim}/>
            </Card>
          </div>
        </>
      )}

      {tab === 'trades' && (
        <div style={{ padding: '14px 16px 0' }}>
          <Card t={t} padding={0}>
            {[
              { side: 'BUY', pair: bot.pair, time: '14:32', pnl: 42.18, pct: 0.42 },
              { side: 'SELL', pair: bot.pair, time: '13:48', pnl: 28.50, pct: 0.28 },
              { side: 'BUY', pair: bot.pair, time: '12:15', pnl: -18.20, pct: -0.18 },
              { side: 'SELL', pair: bot.pair, time: '11:02', pnl: 64.30, pct: 0.64 },
              { side: 'BUY', pair: bot.pair, time: '09:47', pnl: 19.80, pct: 0.19 },
            ].map((tr, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 10,
                borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: tr.side === 'BUY' ? t.posSoft : t.negSoft,
                  color: tr.side === 'BUY' ? t.pos : t.neg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: t.fontMono, fontSize: 10, fontWeight: t.weight.bold,
                }}>{tr.side[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: t.fontMono, fontSize: 13, fontWeight: t.weight.bold, color: t.text }}>{tr.side} {tr.pair}</div>
                  <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim }}>Hoy · {tr.time}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: t.fontMono, fontSize: 13, fontWeight: t.weight.bold, color: tr.pnl >= 0 ? t.pos : t.neg }}>
                    {tr.pnl >= 0 ? '+' : ''}${Math.abs(tr.pnl).toFixed(2)}
                  </div>
                  <div style={{ fontFamily: t.fontMono, fontSize: 11, color: tr.pnl >= 0 ? t.pos : t.neg, opacity: 0.8 }}>
                    {tr.pnl >= 0 ? '+' : ''}{tr.pct}%
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'config' && (
        <div style={{ padding: '14px 16px 0' }}>
          <Card t={t} padding={0}>
            {[
              ['Estrategia', bot.strategy],
              ['Stop Loss', '1.5%'],
              ['Take Profit', '3.0%'],
              ['Tamaño posición', '2% capital'],
              ['Indicadores', 'RSI · EMA 50 · MACD'],
              ['Fuentes noticias', '4 activas'],
              ['Sentiment IA', 'Activado'],
            ].map(([k, v], i, arr) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', padding: '14px',
                borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none',
              }}>
                <span style={{ fontFamily: t.fontBody, fontSize: 13, color: t.textDim }}>{k}</span>
                <span style={{ fontFamily: t.fontBody, fontSize: 13, color: t.text, fontWeight: t.weight.med }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricCard({ t, label, value, sub, subColor }) {
  return (
    <Card t={t} padding={14}>
      <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontFamily: t.fontMono, fontSize: 22, fontWeight: t.weight.bold, color: t.text, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontFamily: t.fontBody, fontSize: 11, color: subColor || t.textDim, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

function Rule({ t, label, used, max, unit }) {
  const pct = (used / max) * 100;
  const danger = pct > 70;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim }}>{label}</span>
        <span style={{ fontFamily: t.fontMono, fontSize: 12, color: t.text, fontWeight: t.weight.bold }}>
          {used}{unit} / {max}{unit}
        </span>
      </div>
      <div style={{ height: 6, background: t.chip, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: danger ? t.neg : t.pos, borderRadius: 3,
        }}/>
      </div>
    </div>
  );
}

window.BotDetail = BotDetail;
