// deploy-guide.jsx — Guía detallada para MT4/MT5

function DeployGuide({ t, onBack, bot }) {
  const [broker, setBroker] = React.useState(null);
  const [step, setStep] = React.useState(0);

  // Selección de broker (solo MT4/MT5)
  if (!broker) {
    return (
      <div style={{ paddingBottom: 130, background: t.bg, minHeight: '100%' }}>
        <ScreenHeader t={t} title="Implementar bot" subtitle="Vincula tu bot al broker" onBack={onBack}/>

        <div style={{ padding: '0 16px' }}>
          {/* Hero info */}
          <Card t={t} padding={16} style={{
            marginBottom: 20, background: t.accentSoft,
            border: `1px solid ${t.accent}33`,
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: t.radius.md,
              background: t.accent, color: t.isDark ? '#000' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name="bot" size={20}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: t.fontDisplay, fontSize: 15, fontWeight: t.weight.bold, color: t.text, marginBottom: 4 }}>
                Tu bot está listo
              </div>
              <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.text, lineHeight: 1.5 }}>
                Aprende a conectar tu bot a MetaTrader en menos de 5 minutos. Descarga el archivo desde el menú de tu bot.
              </div>
            </div>
          </Card>

          {/* Sección título */}
          <div style={{ fontFamily: t.fontBody, fontSize: 11, fontWeight: t.weight.bold, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            Selecciona tu plataforma
          </div>
        </div>

        {/* Brokers cards */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {BROKERS.map(b => (
            <Card key={b.id} t={t} padding={18} onClick={() => setBroker(b)} style={{
              cursor: 'pointer',
              border: `1.5px solid ${t.border}`,
              transition: 'all 0.15s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: t.radius.lg,
                  background: `linear-gradient(135deg, ${t.accent}, ${t.accent}99)`,
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: t.fontDisplay, fontSize: 16, fontWeight: t.weight.bold,
                  letterSpacing: 0.5,
                  boxShadow: `0 6px 16px ${t.accent}33`,
                }}>{b.logo}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontFamily: t.fontDisplay, fontSize: 17, fontWeight: t.weight.bold, color: t.text, letterSpacing: t.letterSpace }}>
                      {b.name}
                    </div>
                    {b.recommended && (
                      <div style={{
                        padding: '2px 8px', borderRadius: 99, background: t.posSoft,
                        color: t.pos, fontFamily: t.fontBody, fontSize: 9,
                        fontWeight: t.weight.bold, textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>
                        Recomendado
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 3 }}>
                    {b.cat}
                  </div>
                </div>
                <Icon name="arrowRight" size={20} color={t.textDim}/>
              </div>
            </Card>
          ))}

          {/* Info adicional */}
          <Card t={t} padding={14} style={{
            marginTop: 4, background: t.bgInset,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Icon name="info" size={16} color={t.textDim} style={{ marginTop: 2, flexShrink: 0 }}/>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, lineHeight: 1.5 }}>
              ¿No tienes MetaTrader? Pídeselo a tu broker. Casi todos los brokers de Forex y CFDs lo soportan (IC Markets, Pepperstone, FTMO, etc.).
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const isMT5 = broker.id === 'mt5';
  const fileExt = isMT5 ? '.mq5' : '.mq4';
  const compiledExt = isMT5 ? '.ex5' : '.ex4';
  const folderName = isMT5 ? 'MQL5' : 'MQL4';

  // Pasos detallados específicos para MT4/MT5
  const steps = [
    {
      title: 'Ten el archivo descargado',
      icon: 'download',
      body: `Antes de empezar, asegúrate de haber descargado el archivo ${fileExt} desde el menú de tu bot (Mis bots → seleccionar bot → "Descargar para MetaTrader ${isMT5 ? '5' : '4'}").`,
      details: [
        `El archivo es código fuente Expert Advisor (${fileExt})`,
        `${broker.name} lo compila automáticamente a ${compiledExt} al detectarlo`,
        'Si aún no lo has descargado, vuelve al detalle de tu bot',
      ],
    },
    {
      title: `Abre ${broker.name}`,
      icon: 'desktop',
      body: `Inicia ${broker.name} en tu ordenador (Windows o Mac con Wine). Si no lo tienes, descárgalo desde tu broker o desde metatrader${isMT5 ? '5' : '4'}.com`,
      details: [
        'Asegúrate de estar logueado en tu cuenta (real o demo)',
        'Recomendamos cuenta demo para los primeros días',
      ],
    },
    {
      title: 'Abre la carpeta de datos',
      icon: 'folder',
      body: `En ${broker.name}, ve al menú: Archivo → Abrir carpeta de datos. Se abrirá una ventana del explorador.`,
      details: [
        'Inglés: File → Open Data Folder',
        'Verás carpetas como: config, history, MQL' + (isMT5 ? '5' : '4'),
      ],
    },
    {
      title: 'Copia el archivo',
      icon: 'folder',
      body: `Entra en la carpeta ${folderName} → Experts. Pega aquí el archivo ${fileExt} que descargaste.`,
      details: [
        `Ruta exacta: ${folderName}/Experts/${(bot && bot.name) ? bot.name.replace(/[^a-zA-Z0-9_]/g, '_') : 'bot'}${fileExt}`,
        'Si la carpeta Experts no existe, créala',
        `MetaTrader lo compilará automáticamente a ${compiledExt}`,
      ],
    },
    {
      title: `Reinicia ${broker.name}`,
      icon: 'refresh',
      body: 'Cierra completamente la plataforma y vuelve a abrirla. El bot aparecerá en el panel "Navegador" → "Asesores Expertos".',
      details: [
        'En el panel izquierdo verás "Asesores Expertos"',
        'Tu bot aparecerá con el nombre que le pusiste',
      ],
    },
    {
      title: 'Activa AutoTrading',
      icon: 'check',
      body: 'En la barra superior, click en el botón "AutoTrading" hasta que se ponga VERDE. Sin esto el bot no opera.',
      details: [
        'Botón con icono de play en la barra de herramientas',
        'Verde = activo · Rojo = desactivado',
      ],
    },
    {
      title: 'Arrastra al gráfico',
      icon: 'drag',
      body: `Abre un gráfico del par que configuraste (ej: ${(bot && bot.pair) || 'EUR/USD'}). Arrastra el bot desde el navegador hasta el gráfico.`,
      details: [
        'Aparecerá una ventana de configuración',
        'Marca "Permitir trading automático"',
        'Click "Aceptar" → en la esquina superior derecha del gráfico verás 😊 verde',
      ],
    },
    {
      title: '¡Bot operando 24/7!',
      icon: 'check',
      body: 'Tu bot ya está funcionando. Puedes pausarlo, ajustarlo y monitorizarlo todo desde esta app.',
      details: [
        'IMPORTANTE: el ordenador debe estar encendido y MetaTrader abierto',
        'Alternativa: alquila un VPS (~$10/mes) para que opere 24/7 sin tu PC',
        'Recomendación: prueba 24-48h en demo antes de pasar a real',
      ],
    },
  ];

  const cur = steps[step];

  return (
    <div style={{ paddingBottom: 130, background: t.bg, minHeight: '100%' }}>
      <ScreenHeader t={t} title={broker.name} subtitle={`Paso ${step + 1} de ${steps.length} · ~5 min`} onBack={() => { setBroker(null); setStep(0); }}/>

      {/* Progress bar */}
      <div style={{ padding: '0 16px 18px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? t.accent : t.chip,
              transition: 'background 0.2s',
            }}/>
          ))}
        </div>
      </div>

      {/* Current step card */}
      <div style={{ padding: '0 16px' }}>
        <Card t={t} padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 21,
              background: `linear-gradient(135deg, ${t.accent}, ${t.accent}99)`,
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: t.fontMono, fontSize: 16, fontWeight: t.weight.bold,
              boxShadow: `0 4px 12px ${t.accent}44`,
            }}>{step + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: t.fontDisplay, fontSize: 20, fontWeight: t.weight.bold, color: t.text, letterSpacing: t.letterSpace, lineHeight: 1.2 }}>
                {cur.title}
              </div>
            </div>
          </div>

          <div style={{ fontFamily: t.fontBody, fontSize: 14, color: t.text, lineHeight: 1.6, marginBottom: 14 }}>
            {cur.body}
          </div>

          {/* Details list */}
          {cur.details && (
            <div style={{
              padding: 14, borderRadius: t.radius.lg,
              background: t.bgInset, border: `1px solid ${t.border}`,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {cur.details.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: 3, background: t.accent,
                    marginTop: 7, flexShrink: 0,
                  }}/>
                  <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, lineHeight: 1.5 }}>
                    {d}
                  </div>
                </div>
              ))}
            </div>
          )}

          {cur.action && (
            <Button t={t} variant="accent" size="md" full icon={cur.action.icon}
              onClick={cur.action.onClick}
              style={{ marginTop: 14 }}>
              {cur.action.label}
            </Button>
          )}
        </Card>
      </div>

      {/* Navigation */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 10 }}>
        {step > 0 && (
          <Button t={t} variant="ghost" size="md" onClick={() => setStep(step - 1)} icon="arrowLeft">
            Anterior
          </Button>
        )}
        <Button t={t} variant="primary" size="md" full
          onClick={() => step < steps.length - 1 ? setStep(step + 1) : onBack()}
          iconRight={step < steps.length - 1 ? 'arrowRight' : 'check'}>
          {step < steps.length - 1 ? 'Siguiente' : 'Finalizar'}
        </Button>
      </div>

      {/* Help card — abre tutorial en YouTube */}
      <div style={{ padding: '20px 16px 0' }}>
        <Card t={t} padding={14}
          onClick={() => {
            window.open('https://youtu.be/b_pSuUhsi40?si=_7D6b3zkOx5ZUr4R', '_blank');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div style={{
            width: 40, height: 40, borderRadius: t.radius.md,
            background: '#FF0000', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* YouTube icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 13, fontWeight: t.weight.bold, color: t.text }}>
              Ver video tutorial
            </div>
            <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, marginTop: 2 }}>
              Tutorial paso a paso en YouTube · MetaTrader {isMT5 ? '5' : '4'}
            </div>
          </div>
          <Icon name="arrowRight" size={16} color={t.textDim}/>
        </Card>
      </div>
    </div>
  );
}

window.DeployGuide = DeployGuide;
