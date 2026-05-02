// wizard.jsx — multi-step bot creation wizard with Claude generation

function Wizard({ t, onClose, onComplete }) {
  const [step, setStep] = React.useState(0);
  const [generating, setGenerating] = React.useState(false);
  const [generationDone, setGenerationDone] = React.useState(false);
  const [data, setData] = React.useState({
    name: 'Mi Bot Pro',
    market: 'forex',
    pair: 'EUR/USD',
    strategy: 'scalping',
    leverage: 30, // 1:30 estándar Forex EU
    indicators: ['rsi', 'ema'],
    news: ['reuters', 'forexfactory'],
    sentiment: true,
    risk: { stopLoss: 1.5, takeProfit: 3.0, posSize: 2, dailyLoss: 4 },
    funded: { enabled: false, firm: null },
  });

  const update = (patch) => setData(d => ({ ...d, ...patch }));
  const next = () => step < WIZARD_STEPS.length - 1 ? setStep(step + 1) : handleComplete();
  const prev = () => step > 0 ? setStep(step - 1) : onClose();

  // Al completar wizard: ir a Stripe Checkout para pagar el bot
  const handleComplete = async () => {
    const token = localStorage.getItem('token');
    if (!token) { onComplete(); return; }

    try {
      // Guardar la config del bot en localStorage para crearlo después del pago
      const botConfig = {
        name: data.name,
        description: `Bot ${data.strategy} en ${data.pair}`,
        strategy: data.strategy,
        parameters: {
          market: data.market,
          pair: data.pair,
          leverage: data.leverage,
          indicators: data.indicators,
          risk: data.risk,
          funded: data.funded,
        },
      };
      localStorage.setItem('pendingBotConfig', JSON.stringify(botConfig));

      // Crear sesión de Stripe Checkout para bot personalizado
      const apiBase = window.API_BASE || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/payments/checkout-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ botName: data.name }),
      });
      const result = await res.json();

      if (result.url) {
        window.location.href = result.url;
      } else {
        console.error('Error:', result);
        onComplete();
      }
    } catch (err) {
      console.error('Error en pago:', err);
      onComplete();
    }
  };

  const cur = WIZARD_STEPS[step];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: t.bg }}>
      {/* Header sticky con progreso */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: t.bg + 'ee', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${t.border}`,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button
              onClick={generating ? undefined : prev}
              disabled={generating}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                background: t.chip, border: 'none',
                cursor: generating ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.4 : 1,
                color: t.text,
                fontFamily: t.fontBody, fontSize: 13, fontWeight: 600,
              }}>
              <Icon name={step === 0 ? 'close' : 'arrowLeft'} size={16}/>
              {step === 0 ? 'Cerrar' : 'Atrás'}
            </button>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: t.textDim, fontWeight: 600 }}>
              {String(step + 1).padStart(2, '0')} / {String(WIZARD_STEPS.length).padStart(2, '0')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, paddingBottom: 16 }}>
            {WIZARD_STEPS.map((s, i) => (
              <div key={s.id} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= step ? t.accent : t.chip,
                transition: 'background 0.4s ease',
              }}/>
            ))}
          </div>
        </div>
      </div>

      {/* Title + subtitle */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 24px', width: '100%' }}>
        <div style={{
          fontFamily: '"Inter Tight", "Inter"',
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 800, letterSpacing: '-0.03em',
          lineHeight: 1.05, color: t.text,
        }}>{cur.title}</div>
        <div style={{
          fontFamily: t.fontBody, fontSize: 'clamp(14px, 1.4vw, 16px)',
          color: t.textDim, marginTop: 10,
        }}>{cur.subtitle}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '0 24px 120px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {step === 0 && <StepName t={t} data={data} update={update}/>}
          {step === 1 && <StepStrategy t={t} data={data} update={update}/>}
          {step === 2 && <StepIndicators t={t} data={data} update={update}/>}
          {step === 3 && <StepNews t={t} data={data} update={update}/>}
          {step === 4 && <StepRisk t={t} data={data} update={update}/>}
          {step === 5 && <StepFunded t={t} data={data} update={update}/>}
          {step === 6 && <StepGenerate t={t} data={data}
            onStart={() => { setGenerating(true); setGenerationDone(false); }}
            onDone={() => { setGenerating(false); setGenerationDone(true); }}
          />}
          {step === 7 && <StepReview t={t} data={data}/>}
        </div>
      </div>

      {/* Footer sticky con CTA */}
      <div style={{
        position: 'sticky', bottom: 0,
        padding: '16px 24px 24px',
        background: t.bg + 'ee', backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${t.border}`,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Botón Continuar — deshabilitado mientras se genera el bot */}
        {step === 6 ? (
          <button
            onClick={generationDone ? next : undefined}
            disabled={!generationDone}
            style={{
              width: '100%', height: 54, borderRadius: t.radius.lg, border: 'none',
              background: generationDone ? t.accent : t.chip,
              color: generationDone ? (t.isDark ? '#000' : '#fff') : t.textMute,
              cursor: generationDone ? 'pointer' : 'not-allowed',
              fontFamily: t.fontBody, fontSize: 16, fontWeight: t.weight.bold,
              letterSpacing: 0.2,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s ease',
              boxShadow: generationDone ? `0 8px 24px ${t.accent}33` : 'none',
            }}>
            {generating ? (
              <>
                <span style={{
                  width: 16, height: 16, borderRadius: 8,
                  border: `2px solid ${t.textMute}`, borderTopColor: 'transparent',
                  display: 'inline-block', animation: 'spin 0.8s linear infinite',
                }}/>
                Generando bot...
              </>
            ) : generationDone ? (
              <>Ver resumen <Icon name="arrowRight" size={18}/></>
            ) : (
              'Iniciando...'
            )}
          </button>
        ) : (
          <Button t={t} variant="accent" size="lg" full onClick={next} iconRight={step === WIZARD_STEPS.length - 1 ? 'check' : 'arrowRight'}>
            {step === WIZARD_STEPS.length - 1 ? `Comprar bot · €${getPriceFor(data)} · pago único` : 'Continuar'}
          </Button>
        )}
        {step === WIZARD_STEPS.length - 1 && (
          <div style={{ textAlign: 'center', marginTop: 8, fontFamily: t.fontBody, fontSize: 11, color: t.textDim }}>
            ✓ Pago único · El bot es tuyo para siempre · Sin mensualidades
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function getPriceFor(data) {
  return 9.99;
}

function Field({ t, label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, fontWeight: t.weight.med }}>{label}</div>
      {children}
    </div>
  );
}

function Input({ t, value, onChange, placeholder }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
      width: '100%', height: 52, padding: '0 16px',
      background: t.bgCard, border: `1px solid ${t.border}`,
      borderRadius: t.radius.lg, color: t.text,
      fontFamily: t.fontDisplay, fontSize: 17, fontWeight: t.weight.med,
      outline: 'none', boxSizing: 'border-box',
    }}/>
  );
}

function StepName({ t, data, update }) {
  const markets = [
    { id: 'forex', name: 'Forex', icon: 'globe', pairs: ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD','EUR/GBP','EUR/JPY','GBP/JPY','USD/CHF','NZD/USD','AUD/JPY','EUR/AUD'] },
    { id: 'indices', name: 'Índices', icon: 'trend', pairs: ['NAS100','US30','SPX500','GER40','UK100','JP225','FRA40','AUS200','HK50'] },
    { id: 'commodities', name: 'Materias Primas', icon: 'diamond', pairs: ['XAU/USD','XAG/USD','WTI','BRENT','NATGAS','COPPER'] },
    { id: 'crypto', name: 'Crypto CFDs', icon: 'flame', pairs: ['BTC/USD','ETH/USD','LTC/USD','XRP/USD'] },
  ];
  const open = isMarketOpen(data.market);
  return (
    <div>
      <Field t={t} label="Nombre del bot">
        <Input t={t} value={data.name} onChange={v => update({ name: v })}/>
      </Field>
      <Field t={t} label="Mercado">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {markets.map(m => (
            <button key={m.id} onClick={() => update({ market: m.id, pair: m.pairs[0] })} style={{
              padding: '18px 12px', borderRadius: t.radius.lg,
              background: data.market === m.id ? t.accent : t.bgCard,
              border: `1.5px solid ${data.market === m.id ? t.accent : t.border}`,
              color: data.market === m.id ? (t.isDark ? '#000' : '#fff') : t.text,
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8, fontFamily: t.fontBody, fontSize: 13, fontWeight: t.weight.bold,
              transition: 'all 0.15s ease',
              boxShadow: data.market === m.id ? `0 4px 14px ${t.accent}33` : 'none',
            }}>
              <Icon name={m.icon} size={22}/>
              {m.name}
            </button>
          ))}
        </div>
      </Field>
      <Card t={t} padding={12} style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, background: open ? t.posSoft : t.negSoft, border: `1px solid ${open ? t.pos : t.neg}33` }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: open ? t.pos : t.neg }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: t.fontDisplay, fontSize: 13, fontWeight: t.weight.bold, color: t.text }}>
            {MARKET_HOURS[data.market].name} · {open ? 'ABIERTO ahora' : 'CERRADO ahora'}
          </div>
          <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, marginTop: 1 }}>{MARKET_HOURS[data.market].note}</div>
        </div>
      </Card>
      <Field t={t} label="Par / Símbolo">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(markets.find(m => m.id === data.market)?.pairs || []).map(p => (
            <button key={p} onClick={() => update({ pair: p })} style={{
              padding: '10px 14px', borderRadius: t.radius.pill,
              background: data.pair === p ? t.text : t.chip,
              color: data.pair === p ? t.bg : t.text,
              border: 'none', cursor: 'pointer',
              fontFamily: t.fontMono, fontSize: 13, fontWeight: t.weight.bold,
            }}>{p}</button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function StepStrategy({ t, data, update }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {STRATEGIES.map(s => {
        const sel = data.strategy === s.id;
        return (
          <Card key={s.id} t={t} padding={14} onClick={() => update({ strategy: s.id })} style={{
            border: `1.5px solid ${sel ? t.accent : t.border}`, background: sel ? t.accentSoft : t.bgCard,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: t.radius.md, background: sel ? t.accent : t.chip, color: sel ? (t.isDark ? '#000' : '#fff') : t.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={s.icon} size={22}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.fontDisplay, fontSize: 15, fontWeight: t.weight.bold, color: t.text }}>{s.name}</div>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 2 }}>{s.desc}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <Chip t={t}>{s.timeframe}</Chip>
                  <Chip t={t} color={s.risk === 'Alto' ? t.neg : s.risk === 'Bajo' ? t.pos : t.accent}>Riesgo {s.risk}</Chip>
                </div>
              </div>
              {sel && <Icon name="check" size={20} color={t.accent}/>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function StepIndicators({ t, data, update }) {
  const toggle = (id) => {
    const has = data.indicators.includes(id);
    update({ indicators: has ? data.indicators.filter(i => i !== id) : [...data.indicators, id] });
  };
  const cats = [...new Set(INDICATORS.map(i => i.cat))];
  return (
    <div>
      <div style={{ padding: 12, marginBottom: 14, borderRadius: t.radius.lg, background: t.accentSoft, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Icon name="sparkle" size={16} color={t.accent} style={{ marginTop: 2 }}/>
        <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.text, lineHeight: 1.5 }}>
          <b>Claude</b> recomienda <b>RSI + EMA + ATR</b> según el histórico de tu mercado. Personaliza si quieres.
        </div>
      </div>
      <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, marginBottom: 14 }}>
        {data.indicators.length} de {INDICATORS.length} seleccionados · más indicadores = mejor confluencia (y precio más alto)
      </div>
      {cats.map(cat => (
        <Field key={cat} t={t} label={cat}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {INDICATORS.filter(i => i.cat === cat).map(i => {
              const sel = data.indicators.includes(i.id);
              return (
                <button key={i.id} onClick={() => toggle(i.id)} style={{
                  padding: '12px 14px', borderRadius: t.radius.md,
                  background: sel ? t.text : t.bgCard,
                  border: `1px solid ${sel ? t.text : t.border}`,
                  color: sel ? t.bg : t.text,
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: t.fontMono, fontSize: 13, fontWeight: t.weight.bold }}>{i.name}</div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 11, opacity: 0.7, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.desc}</div>
                  </div>
                  {sel && <Icon name="check" size={16}/>}
                </button>
              );
            })}
          </div>
        </Field>
      ))}
    </div>
  );
}

function StepNews({ t, data, update }) {
  const toggle = (id) => {
    const has = data.news.includes(id);
    update({ news: has ? data.news.filter(i => i !== id) : [...data.news, id] });
  };
  return (
    <div>
      <Card t={t} padding={14} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: t.radius.md, background: t.accentSoft, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="brain" size={18}/>
            </div>
            <div>
              <div style={{ fontFamily: t.fontDisplay, fontSize: 14, fontWeight: t.weight.bold, color: t.text }}>Sentiment con Claude</div>
              <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, marginTop: 1 }}>Pausa el bot ante noticias de alto impacto</div>
            </div>
          </div>
          <Toggle t={t} on={data.sentiment} onChange={v => update({ sentiment: v })}/>
        </div>
      </Card>
      <Field t={t} label="Fuentes de noticias">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {NEWS_SOURCES.map(s => {
            const sel = data.news.includes(s.id);
            return (
              <Card key={s.id} t={t} padding={12} onClick={() => toggle(s.id)} style={{ border: `1px solid ${sel ? t.accent : t.border}`, background: sel ? t.accentSoft : t.bgCard, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: t.radius.sm, background: t.chip, color: t.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: t.fontDisplay, fontSize: 13, fontWeight: t.weight.bold }}>{s.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: t.fontDisplay, fontSize: 14, fontWeight: t.weight.bold, color: t.text }}>{s.name}</div>
                  <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim }}>{s.cat}</div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: sel ? t.accent : 'transparent', border: `1.5px solid ${sel ? t.accent : t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.isDark ? '#000' : '#fff' }}>
                  {sel && <Icon name="check" size={14}/>}
                </div>
              </Card>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

function StepRisk({ t, data, update }) {
  const Slider = ({ label, value, min, max, step, suffix, onChange }) => (
    <Card t={t} padding={14} style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.textDim }}>{label}</div>
        <div style={{ fontFamily: t.fontMono, fontSize: 14, fontWeight: t.weight.bold, color: t.accent }}>{value}{suffix}</div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: t.accent, height: 4 }}/>
    </Card>
  );

  // Niveles de apalancamiento típicos (presets rápidos)
  const leverageOptions = [
    { value: 1, label: '1:1', desc: 'Sin apalancamiento', risk: 'Muy bajo' },
    { value: 10, label: '1:10', desc: 'Conservador', risk: 'Bajo' },
    { value: 30, label: '1:30', desc: 'Estándar EU (forex)', risk: 'Medio' },
    { value: 100, label: '1:100', desc: 'Estándar global', risk: 'Medio-alto' },
    { value: 200, label: '1:200', desc: 'Agresivo', risk: 'Alto' },
    { value: 500, label: '1:500', desc: 'Profesional', risk: 'Muy alto' },
  ];

  // Riesgo color y label según leverage (función dinámica)
  const leverageRiskColor = (val) => {
    if (val <= 10) return t.pos;
    if (val <= 30) return t.accent;
    if (val <= 100) return '#F59E0B';
    return t.neg;
  };

  const getLeverageInfo = (val) => {
    // Si coincide con un preset, devolverlo
    const preset = leverageOptions.find(o => o.value === val);
    if (preset) return preset;
    // Si no, calcular descripción según el rango
    if (val <= 5) return { value: val, desc: 'Muy conservador', risk: 'Muy bajo' };
    if (val <= 20) return { value: val, desc: 'Conservador', risk: 'Bajo' };
    if (val <= 50) return { value: val, desc: 'Moderado', risk: 'Medio' };
    if (val <= 150) return { value: val, desc: 'Estándar', risk: 'Medio-alto' };
    if (val <= 300) return { value: val, desc: 'Agresivo', risk: 'Alto' };
    return { value: val, desc: 'Muy agresivo', risk: 'Muy alto' };
  };

  const currentInfo = getLeverageInfo(data.leverage);
  const isCustom = !leverageOptions.find(o => o.value === data.leverage);

  return (
    <div>
      {/* Apalancamiento */}
      <div style={{
        fontFamily: t.fontBody, fontSize: 11, fontWeight: t.weight.bold,
        color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.8,
        marginBottom: 8, padding: '0 4px',
      }}>
        Apalancamiento
      </div>
      <Card t={t} padding={14} style={{ marginBottom: 14 }}>
        {/* Presets rápidos */}
        <div style={{
          fontFamily: t.fontBody, fontSize: 10, fontWeight: t.weight.bold,
          color: t.textMute, textTransform: 'uppercase', letterSpacing: 0.6,
          marginBottom: 8,
        }}>
          Presets rápidos
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {leverageOptions.map(opt => (
            <button key={opt.value} onClick={() => update({ leverage: opt.value })} style={{
              padding: '12px 8px', borderRadius: t.radius.md,
              background: data.leverage === opt.value ? t.accent : t.bgInset,
              border: `1.5px solid ${data.leverage === opt.value ? t.accent : t.border}`,
              color: data.leverage === opt.value ? (t.isDark ? '#000' : '#fff') : t.text,
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4,
              fontFamily: t.fontMono, fontSize: 14, fontWeight: t.weight.bold,
              transition: 'all 0.15s ease',
            }}>
              {opt.label}
              <span style={{
                fontFamily: t.fontBody, fontSize: 9, fontWeight: t.weight.med,
                opacity: data.leverage === opt.value ? 0.85 : 0.6,
                textTransform: 'none', letterSpacing: 0,
              }}>
                {opt.risk}
              </span>
            </button>
          ))}
        </div>

        {/* Input personalizado */}
        <div style={{
          fontFamily: t.fontBody, fontSize: 10, fontWeight: t.weight.bold,
          color: t.textMute, textTransform: 'uppercase', letterSpacing: 0.6,
          marginBottom: 8,
        }}>
          Personalizado
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          padding: '12px 14px', borderRadius: t.radius.md,
          background: isCustom ? t.accentSoft : t.bgInset,
          border: `1.5px solid ${isCustom ? t.accent : t.border}`,
          transition: 'all 0.15s ease',
        }}>
          <span style={{
            fontFamily: t.fontMono, fontSize: 16, fontWeight: t.weight.bold,
            color: t.text, flexShrink: 0,
          }}>
            1:
          </span>
          <input
            type="number"
            min="1"
            max="2000"
            value={data.leverage}
            onChange={e => {
              const val = parseInt(e.target.value) || 1;
              const clamped = Math.max(1, Math.min(2000, val));
              update({ leverage: clamped });
            }}
            style={{
              flex: 1, height: 32, padding: '0 10px',
              border: `1px solid ${t.border}`, borderRadius: t.radius.sm,
              background: t.bg, color: t.text,
              fontFamily: t.fontMono, fontSize: 16, fontWeight: t.weight.bold,
              outline: 'none', textAlign: 'center',
              MozAppearance: 'textfield',
            }}
          />
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <button onClick={() => update({ leverage: Math.min(2000, data.leverage + 5) })} style={{
              width: 32, height: 18, padding: 0, border: `1px solid ${t.border}`,
              borderRadius: 4, background: t.bg, color: t.text,
              cursor: 'pointer', fontSize: 10, fontWeight: t.weight.bold,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>+5</button>
            <button onClick={() => update({ leverage: Math.max(1, data.leverage - 5) })} style={{
              width: 32, height: 18, padding: 0, border: `1px solid ${t.border}`,
              borderRadius: 4, background: t.bg, color: t.text,
              cursor: 'pointer', fontSize: 10, fontWeight: t.weight.bold,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>-5</button>
          </div>
        </div>

        {/* Card informativo dinámico */}
        <div style={{
          padding: 10, borderRadius: t.radius.md, background: t.bgInset,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <Icon name="info" size={14} color={leverageRiskColor(data.leverage)} style={{ marginTop: 2, flexShrink: 0 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 12, fontWeight: t.weight.bold, color: t.text, marginBottom: 2 }}>
              1:{data.leverage} · {currentInfo.desc}
            </div>
            <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, lineHeight: 1.4 }}>
              Con $1,000 puedes operar hasta <b style={{ color: t.text }}>${(1000 * data.leverage).toLocaleString()}</b> en posiciones.
              Riesgo: <b style={{ color: leverageRiskColor(data.leverage) }}>
                {currentInfo.risk}
              </b>
            </div>
          </div>
        </div>
      </Card>

      {/* Otros parámetros de riesgo */}
      <div style={{
        fontFamily: t.fontBody, fontSize: 11, fontWeight: t.weight.bold,
        color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.8,
        marginBottom: 8, padding: '0 4px',
      }}>
        Stop Loss & Take Profit
      </div>
      <Slider label="Stop Loss" value={data.risk.stopLoss} min={0.5} max={10} step={0.1} suffix="%" onChange={v => update({ risk: { ...data.risk, stopLoss: v } })}/>
      <Slider label="Take Profit" value={data.risk.takeProfit} min={0.5} max={20} step={0.1} suffix="%" onChange={v => update({ risk: { ...data.risk, takeProfit: v } })}/>
      <Slider label="Tamaño posición" value={data.risk.posSize} min={0.5} max={10} step={0.1} suffix="% capital" onChange={v => update({ risk: { ...data.risk, posSize: v } })}/>
      <Slider label="Pérdida diaria máx." value={data.risk.dailyLoss} min={1} max={15} step={0.5} suffix="%" onChange={v => update({ risk: { ...data.risk, dailyLoss: v } })}/>

      <Card t={t} padding={14} style={{ background: t.posSoft, border: `1px solid ${t.pos}33`, marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="shield" size={18} color={t.pos} style={{ marginTop: 1 }}/>
          <div>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 13, fontWeight: t.weight.bold, color: t.text }}>
              Ratio R:R = 1:{(data.risk.takeProfit / data.risk.stopLoss).toFixed(1)}
            </div>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 2 }}>
              Apalancamiento 1:{data.leverage} · Buen balance riesgo/recompensa
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StepFunded({ t, data, update }) {
  return (
    <div>
      <Card t={t} padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 15, fontWeight: t.weight.bold, color: t.text }}>Es para cuenta de fondeo</div>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 2 }}>Solo prop firms que <b>permiten bots</b></div>
          </div>
          <Toggle t={t} on={data.funded.enabled} onChange={v => update({ funded: { ...data.funded, enabled: v } })}/>
        </div>
      </Card>
      {data.funded.enabled && (
        <Field t={t} label={`${FUNDED_FIRMS.length} prop firms compatibles`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FUNDED_FIRMS.map(f => {
              const sel = data.funded.firm === f.id;
              return (
                <Card key={f.id} t={t} padding={12} onClick={() => update({ funded: { ...data.funded, firm: f.id } })} style={{ border: `1.5px solid ${sel ? t.accent : t.border}`, background: sel ? t.accentSoft : t.bgCard }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: t.fontDisplay, fontSize: 15, fontWeight: t.weight.bold, color: t.text }}>{f.name}</div>
                      <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.pos, marginTop: 2 }}>✓ {f.note}</div>
                    </div>
                    {sel && <Icon name="check" size={18} color={t.accent}/>}
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                    <div><div style={{ fontFamily: t.fontBody, fontSize: 10, color: t.textDim, textTransform: 'uppercase' }}>Max DD</div><div style={{ fontFamily: t.fontMono, fontSize: 13, color: t.text, fontWeight: t.weight.bold }}>{f.maxDD}</div></div>
                    <div><div style={{ fontFamily: t.fontBody, fontSize: 10, color: t.textDim, textTransform: 'uppercase' }}>Daily DD</div><div style={{ fontFamily: t.fontMono, fontSize: 13, color: t.text, fontWeight: t.weight.bold }}>{f.dailyDD}</div></div>
                    <div><div style={{ fontFamily: t.fontBody, fontSize: 10, color: t.textDim, textTransform: 'uppercase' }}>Target</div><div style={{ fontFamily: t.fontMono, fontSize: 13, color: t.text, fontWeight: t.weight.bold }}>{f.target}</div></div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Field>
      )}
    </div>
  );
}

function StepGenerate({ t, data, onStart, onDone }) {
  const [phase, setPhase] = React.useState(0);
  const [completed, setCompleted] = React.useState(false);
  const phases = [
    'Conectando con Claude…',
    `Analizando 5 años de histórico de ${data.pair}`,
    `Calibrando ${data.indicators.length} indicadores técnicos`,
    'Backtesting estrategia · 10,000 simulaciones',
    'Optimizando parámetros con tus reglas',
    `Aplicando apalancamiento 1:${data.leverage}`,
    'Compilando archivo .ex5 para MetaTrader',
    'Bot generado correctamente',
  ];

  // Notificar al inicio
  React.useEffect(() => {
    if (onStart) onStart();
  }, []);

  // Avanzar fases con duraciones variables (más lentas para dar sensación de proceso real)
  React.useEffect(() => {
    if (completed) return;
    if (phase < phases.length - 1) {
      // Duraciones variables: 1.8s, 2.2s, 2.5s, 3s, 2s, 1.5s, 2s
      const durations = [1800, 2200, 2500, 3000, 2000, 1500, 2000];
      const dur = durations[phase] || 2000;
      const id = setTimeout(() => setPhase(p => p + 1), dur);
      return () => clearTimeout(id);
    }
    // Última fase: notificar onDone después de un breve delay
    const id = setTimeout(() => {
      setCompleted(true);
      if (onDone) onDone();
    }, 1200);
    return () => clearTimeout(id);
  }, [phase, completed]);

  return (
    <div>
      <Card t={t} padding={20} style={{
        background: `linear-gradient(135deg, ${t.accent}22, ${t.accent}08)`,
        border: `1px solid ${t.accent}44`, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24,
            background: `linear-gradient(135deg, ${t.accent}, ${t.accent}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            position: 'relative',
          }}>
            <Icon name="sparkle" size={22}/>
            <span style={{ position: 'absolute', inset: -4, borderRadius: 28, border: `2px solid ${t.accent}`, opacity: 0.4, animation: 'pulse 1.6s ease-out infinite' }}/>
          </div>
          <div>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 16, fontWeight: t.weight.bold, color: t.text }}>Claude está construyendo tu bot</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {phases.map((p, i) => {
            const done = i < phase;
            const active = i === phase;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: done || active ? 1 : 0.35 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 11,
                  background: done ? t.pos : active ? t.accent : t.chip,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {done ? <Icon name="check" size={14}/> : active ? (
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: '#fff', animation: 'pulse 1s ease-out infinite' }}/>
                  ) : null}
                </div>
                <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.text }}>{p}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function StepReview({ t, data }) {
  const price = getPriceFor(data);
  return (
    <div>
      <Card t={t} padding={16} style={{ marginBottom: 14, background: `linear-gradient(135deg, ${t.bgCard}, ${t.bgElev})` }}>
        <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Backtest · 90 días · generado por Claude
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
          <div style={{ flex: 1 }}><div style={{ fontFamily: t.fontMono, fontSize: 22, fontWeight: t.weight.bold, color: t.pos }}>+24.8%</div><div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, marginTop: 2 }}>ROI estimado</div></div>
          <div style={{ flex: 1 }}><div style={{ fontFamily: t.fontMono, fontSize: 22, fontWeight: t.weight.bold, color: t.text }}>71%</div><div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, marginTop: 2 }}>Winrate</div></div>
          <div style={{ flex: 1 }}><div style={{ fontFamily: t.fontMono, fontSize: 22, fontWeight: t.weight.bold, color: t.text }}>3.2%</div><div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, marginTop: 2 }}>Max DD</div></div>
        </div>
        <div style={{ marginTop: 14 }}>
          <Sparkline data={[10,12,11,15,14,18,17,22,25,23,28,32,30,35,38,42,40,46]} color={t.pos} width={332} height={50}/>
        </div>
      </Card>

      <Card t={t} padding={16} style={{ marginBottom: 14, background: t.accent, color: t.isDark ? '#000' : '#fff', border: 'none' }}>
        <div style={{ fontFamily: t.fontBody, fontSize: 11, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pago único · sin mensualidades</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span style={{ fontFamily: t.fontMono, fontSize: 38, fontWeight: t.weight.bold, letterSpacing: -1 }}>${price}</span>
          <span style={{ fontFamily: t.fontBody, fontSize: 14, opacity: 0.85 }}>una sola vez</span>
        </div>
        <div style={{ fontFamily: t.fontBody, fontSize: 12, opacity: 0.85, marginTop: 6, lineHeight: 1.5 }}>
          ✓ Bot tuyo para siempre · ✓ Updates incluidos · ✓ Soporte ilimitado · ✓ Cambia de broker cuando quieras
        </div>
      </Card>

      <Field t={t} label="Resumen de tu bot">
        <Card t={t} padding={0}>
          {[
            ['Nombre', data.name],
            ['Mercado', `${MARKET_HOURS[data.market]?.name} · ${data.pair}`],
            ['Estado', isMarketOpen(data.market) ? '🟢 Abierto' : '🔴 Cerrado'],
            ['Estrategia', STRATEGIES.find(s => s.id === data.strategy)?.name],
            ['Indicadores', `${data.indicators.length} activos`],
            ['Fuentes noticias', `${data.news.length} fuentes · Sentiment ${data.sentiment ? 'ON' : 'OFF'}`],
            ['Riesgo SL/TP', `${data.risk.stopLoss}% / ${data.risk.takeProfit}%`],
            ['Cuenta de fondeo', data.funded.enabled ? FUNDED_FIRMS.find(f => f.id === data.funded.firm)?.name || 'Sin elegir' : 'No'],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none' }}>
              <span style={{ fontFamily: t.fontBody, fontSize: 13, color: t.textDim }}>{k}</span>
              <span style={{ fontFamily: t.fontBody, fontSize: 13, color: t.text, fontWeight: t.weight.med, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </Card>
      </Field>
    </div>
  );
}

window.Wizard = Wizard;
