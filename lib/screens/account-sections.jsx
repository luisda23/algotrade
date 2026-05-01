// account-sections.jsx — Profile, Billing, Brokers, Referrals, Security, Notifications detail pages

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────
function ProfileSection({ t, onBack }) {
  const u = MOCK_USER;
  const initials = u.name.split(' ').map(n => n[0]).slice(0, 2).join('');
  return (
    <div style={{ paddingBottom: 130, background: t.bg, minHeight: '100%' }}>
      <ScreenHeader t={t} title="Perfil" onBack={onBack}/>
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 24px' }}>
          <div style={{
            width: 88, height: 88, borderRadius: 44,
            background: `linear-gradient(135deg, ${t.accent}, ${t.accent}99)`,
            color: t.isDark ? '#000' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: t.fontDisplay, fontSize: 32, fontWeight: t.weight.bold,
          }}>{initials}</div>
          <button style={{
            marginTop: 12, background: t.chip, border: 'none', cursor: 'pointer',
            color: t.accent, fontFamily: t.fontBody, fontSize: 13, fontWeight: t.weight.bold,
            padding: '8px 16px', borderRadius: t.radius.pill,
          }}>Cambiar foto</button>
        </div>

        <SectionLabel t={t}>Datos personales</SectionLabel>
        <Card t={t} padding={0}>
          <ProfileField t={t} label="Nombre completo" value={u.name}/>
          <ProfileField t={t} label="Email" value={u.email} verified/>
          <ProfileField t={t} label="Teléfono" value="+34 612 345 678"/>
          <ProfileField t={t} label="País" value="España" isLast/>
        </Card>

        <SectionLabel t={t}>Cuenta</SectionLabel>
        <Card t={t} padding={0}>
          <ProfileField t={t} label="ID de usuario" value={u.id} mono/>
          <ProfileField t={t} label="Vinculado con" value="Google" icon="google"/>
          <ProfileField t={t} label="Miembro desde" value={u.joined} isLast/>
        </Card>
      </div>
    </div>
  );
}

function ProfileField({ t, label, value, verified, mono, icon, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '14px 16px',
      borderBottom: !isLast ? `1px solid ${t.border}` : 'none', gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          {icon && <Icon name={icon} size={14}/>}
          <div style={{
            fontFamily: mono ? t.fontMono : t.fontBody, fontSize: 14, fontWeight: t.weight.med,
            color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{value}</div>
          {verified && <Chip t={t} color={t.pos} style={{ fontSize: 9, padding: '2px 6px' }}>● Verificado</Chip>}
        </div>
      </div>
      <Icon name="arrowRight" size={14} color={t.textMute}/>
    </div>
  );
}

// ─────────────────────────────────────────────
// BILLING — payment methods + purchases
// ─────────────────────────────────────────────
function BillingSection({ t, onBack }) {
  const totalPaid = MOCK_PURCHASES.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  return (
    <div style={{ paddingBottom: 130, background: t.bg, minHeight: '100%' }}>
      <ScreenHeader t={t} title="Pagos y bots" onBack={onBack}/>
      <div style={{ padding: '0 16px' }}>
        {/* Summary card */}
        <Card t={t} padding={20} style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Total invertido en bots
          </div>
          <div style={{
            fontFamily: t.fontMono, fontSize: 32, fontWeight: t.weight.bold, color: t.text,
            marginTop: 4, letterSpacing: -1,
          }}>${totalPaid}</div>
          <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 4 }}>
            {MOCK_PURCHASES.filter(p => p.status === 'paid').length} bots comprados · sin suscripción mensual
          </div>
        </Card>

        <SectionLabel t={t}>Historial de compras</SectionLabel>
        <Card t={t} padding={0}>
          {MOCK_PURCHASES.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12,
              borderBottom: i < MOCK_PURCHASES.length - 1 ? `1px solid ${t.border}` : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: t.radius.md,
                background: p.status === 'paid' ? t.posSoft : p.status === 'refunded' ? t.negSoft : t.accentSoft,
                color: p.status === 'paid' ? t.pos : p.status === 'refunded' ? t.neg : t.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name={p.status === 'credit' ? 'gift' : 'receipt'} size={16}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: t.weight.med, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.bot}</div>
                <div style={{ fontFamily: t.fontMono, fontSize: 11, color: t.textDim, marginTop: 1 }}>
                  {p.date} · {p.method}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: t.fontMono, fontSize: 14, fontWeight: t.weight.bold,
                  color: p.amount < 0 ? t.pos : t.text,
                }}>
                  {p.amount < 0 ? '+' : ''}${Math.abs(p.amount)}
                </div>
                <div style={{
                  fontFamily: t.fontBody, fontSize: 10, marginTop: 1,
                  color: p.status === 'paid' ? t.pos : p.status === 'refunded' ? t.neg : t.accent,
                  textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: t.weight.bold,
                }}>{p.status === 'paid' ? '✓ Pagado' : p.status === 'refunded' ? '↩ Reembolso' : 'Crédito'}</div>
              </div>
            </div>
          ))}
        </Card>

        <div style={{
          fontFamily: t.fontBody, fontSize: 11, color: t.textMute,
          padding: '16px 4px 0', lineHeight: 1.5,
        }}>
          Los pagos son procesados de forma segura por Stripe. La app es gratis — solo pagas cuando creas un bot. Una vez comprado el bot es tuyo para siempre.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BROKERS — connected accounts with API keys
// ─────────────────────────────────────────────
function BrokersSection({ t, onBack }) {
  return (
    <div style={{ paddingBottom: 130, background: t.bg, minHeight: '100%' }}>
      <ScreenHeader t={t} title="Brokers conectados" onBack={onBack}/>
      <div style={{ padding: '0 16px' }}>
        <Card t={t} padding={16} style={{ background: t.accentSoft, border: `1px solid ${t.accent}33`, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Icon name="shield" size={20} color={t.accent}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: t.fontBody, fontSize: 13, fontWeight: t.weight.bold, color: t.text }}>API keys cifradas AES-256</div>
              <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 2, lineHeight: 1.5 }}>
                Tus claves nunca se envían en texto plano. Recomendamos crear keys con permisos de solo trading (sin retiros).
              </div>
            </div>
          </div>
        </Card>

        <SectionLabel t={t}>Conectados</SectionLabel>
        {MOCK_BROKERS.map(b => (
          <div key={b.id} style={{ marginBottom: 10 }}>
            <Card t={t} padding={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: t.radius.md,
                  background: t.chip, color: t.text, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="link" size={20}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontFamily: t.fontDisplay, fontSize: 15, fontWeight: t.weight.bold, color: t.text }}>{b.name}</div>
                    <Chip t={t} color={b.status === 'connected' ? t.pos : t.accent} style={{ fontSize: 9, padding: '2px 6px' }}>
                      {b.status === 'connected' ? '● Conectado' : '● Pendiente'}
                    </Chip>
                  </div>
                  <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 2 }}>
                    {b.type} · {b.linkedAt}
                  </div>
                </div>
                <Icon name="settings" size={16} color={t.textMute}/>
              </div>
              {b.status === 'connected' && (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
                  marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.border}`,
                }}>
                  <div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 9, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>Permisos</div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 11, fontWeight: t.weight.med, color: t.text, marginTop: 2 }}>{b.perms}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 9, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>Bots</div>
                    <div style={{ fontFamily: t.fontMono, fontSize: 11, fontWeight: t.weight.bold, color: t.text, marginTop: 2 }}>{b.botsUsing} activos</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 9, color: t.textDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>Última sync</div>
                    <div style={{ fontFamily: t.fontMono, fontSize: 11, fontWeight: t.weight.bold, color: t.pos, marginTop: 2 }}>{b.lastSync}</div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ))}

        <button style={{
          width: '100%', height: 50, borderRadius: t.radius.lg, border: `1.5px dashed ${t.border}`,
          background: 'transparent', color: t.accent, cursor: 'pointer',
          fontFamily: t.fontBody, fontSize: 14, fontWeight: t.weight.bold,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginTop: 12,
        }}>
          <Icon name="plus" size={16}/> Conectar nuevo broker
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUPPORT — Chatbot conversacional inteligente
// ─────────────────────────────────────────────

// Knowledge base con keywords expandidas y respuestas variadas
const FAQ_DATABASE = [
  {
    id: 'comprar',
    keywords: ['compr', 'precio', 'cuesta', 'pago', 'pagar', 'paypal', 'tarjeta', 'cobr', 'cuanto vale', 'costo', 'caro', 'barato', 'cuanto sale'],
    question: '¿Cómo compro un bot?',
    answer: 'Cada bot cuesta €9.99 (pago único, sin suscripciones).\n\n1. Abre el wizard desde "Empezar" en el dashboard\n2. Configura tu bot en 8 pasos\n3. Al final, click en "Comprar bot"\n4. Pagas con tarjeta vía Stripe (seguro)\n5. Tu bot aparece en "Mis bots" automáticamente',
  },
  {
    id: 'descargar',
    keywords: ['descarg', 'archivo', 'donde esta', 'donde está', 'baj', 'obtener'],
    question: '¿Cómo descargo el archivo de mi bot?',
    answer: 'Para descargar tu bot:\n\n1. Ve a "Mis bots" (Inicio)\n2. Click en el bot que quieres\n3. Baja hasta "Descargar bot"\n4. Elige "MetaTrader 5" (.mq5) o "MetaTrader 4" (.mq4)\n5. El archivo se descarga a tu PC\n\nDespués sigue la guía de implementación para instalarlo.',
  },
  {
    id: 'instalar',
    keywords: ['instal', 'meter', 'poner el bot', 'colocar', 'ejecutar', 'añadir', 'agregar', 'experts'],
    question: '¿Cómo instalo el bot en MetaTrader?',
    answer: '1. Abre MetaTrader 4 o 5\n2. Menú: Archivo → Abrir carpeta de datos\n3. Entra en MQL5/Experts (o MQL4/Experts)\n4. Pega el archivo .mq5 o .mq4\n5. Cierra y vuelve a abrir MetaTrader\n6. El bot aparecerá en "Asesores Expertos"\n7. Activa "AutoTrading" (botón verde)\n8. Arrastra el bot a un gráfico\n\nVer la sección Guía para video tutorial.',
  },
  {
    id: 'mt4mt5',
    keywords: ['mt4', 'mt5', 'metatrader', 'metatrader 4', 'metatrader 5', 'que version', 'cual version', 'diferencia'],
    question: '¿Qué diferencia hay entre MT4 y MT5?',
    answer: 'Son dos versiones de MetaTrader:\n\n• MT4: La versión clásica. Más popular en Forex. Archivos .mq4 / .ex4\n• MT5: La versión moderna. Soporta más mercados (acciones, futuros). Archivos .mq5 / .ex5\n\n¿Cuál usar?\n• Si tu broker te da las dos opciones → usa MT5\n• Si solo te ofrecen MT4 → usa MT4\n\nNuestros bots funcionan perfectamente en ambas. Solo descarga el archivo correspondiente.',
  },
  {
    id: 'extension',
    keywords: ['ex5', 'ex4', 'compilado', 'codigo', 'fuente', 'porque mq5', 'porque mq4'],
    question: '¿Por qué descargo .mq5 y no .ex5?',
    answer: 'El archivo .mq5 es el código fuente. MetaTrader lo compila automáticamente a .ex5 cuando lo detecta en la carpeta Experts.\n\nVentajas de .mq5:\n• Puedes ver el código del bot (transparencia)\n• Funciona en cualquier MetaTrader\n• No necesitas servidor de compilación\n\nEs la práctica estándar de la industria.',
  },
  {
    id: 'apalancamiento',
    keywords: ['apalancamiento', 'apalanc', 'leverage', '1:30', '1:100', '1:500', '1:90', 'que apalanc'],
    question: '¿Qué apalancamiento elijo?',
    answer: 'Depende del mercado y tu tolerancia al riesgo:\n\n• 1:1 - Sin apalancamiento (muy conservador)\n• 1:10 - Conservador (recomendado para crypto)\n• 1:30 - Estándar EU para Forex\n• 1:100 - Estándar global\n• 1:500 - Profesional (alto riesgo)\n\nCon $1,000 y 1:30 puedes operar hasta $30,000. Más apalancamiento = más riesgo de liquidación.\n\nPuedes configurar el valor exacto que quieras (ej: 1:90).',
  },
  {
    id: 'parar',
    keywords: ['parar', 'pausar', 'detener', 'stop', 'apagar', 'desactivar', 'cerrar bot', 'quitar'],
    question: '¿Cómo paro mi bot?',
    answer: 'Tienes 3 formas de parar el bot:\n\n1. EN METATRADER: Click derecho en el gráfico → Asesores Expertos → Eliminar\n2. AUTOTRADING OFF: Click en el botón "AutoTrading" hasta que esté en rojo\n3. CIERRA METATRADER: Si no está abierto, no opera\n\nLas posiciones abiertas NO se cierran automáticamente. Ciérralas manualmente si quieres.',
  },
  {
    id: 'ftmo',
    keywords: ['ftmo', 'mff', 'myforex', 'fondeo', 'fondeada', 'prop firm', 'prop', 'the5ers', 'fundednext', 'e8', 'lux'],
    question: '¿Funciona con FTMO o cuentas de fondeo?',
    answer: 'Sí. La mayoría de prop firms permiten Expert Advisors:\n\n• FTMO ✅ (sin HFT)\n• MyForexFunds ✅\n• The5ers ✅\n• FundedNext ✅\n• E8 Funding ✅\n• Lux Trading ✅\n\nIMPORTANTE: Cuando crees el bot, en "Cuenta de Fondeo" selecciona tu prop firm para que el bot respete sus reglas (drawdown, pérdida diaria).',
  },
  {
    id: 'noFunciona',
    keywords: ['no funciona', 'error', 'falla', 'no opera', 'problema', 'no hace nada', 'no abre', 'no entra', 'no se ejecuta'],
    question: 'El bot no opera, ¿qué hago?',
    answer: 'Checklist típico:\n\n✅ AutoTrading activado (botón VERDE en MetaTrader)\n✅ Bot tiene 😊 verde en esquina superior derecha del gráfico\n✅ "Permitir trading automático" marcado al arrastrar al gráfico\n✅ Símbolo del gráfico coincide con InpSymbol del bot\n✅ Mercado abierto (Forex cerrado fines de semana)\n✅ Filtro horario UTC dentro de rango (8-22 por defecto)\n✅ Suficiente margen libre en la cuenta\n\nRevisa la pestaña "Diario" en MetaTrader para ver mensajes del bot.',
  },
  {
    id: 'vps',
    keywords: ['vps', 'servidor', '24/7', 'siempre', 'pc encendido', 'computadora', 'computador', 'horario', 'todo el dia', 'todo el día'],
    question: '¿Necesito el PC encendido todo el tiempo?',
    answer: 'Sí, MetaTrader debe estar abierto para que el bot opere.\n\nOpciones:\n\n1. PC ENCENDIDO 24/7: Funciona pero consume luz\n2. VPS ALQUILADO (~$10/mes): Mejor opción. El bot opera en un servidor remoto\n   • Recomendados: Contabo, ForexVPS, AccuWeb\n3. CUENTA AWS/AZURE: Más caro pero más control\n\nEl VPS es lo más práctico: bajo costo, opera 24/7, sin consumir tu electricidad.',
  },
  {
    id: 'reembolso',
    keywords: ['reembolso', 'devolucion', 'devolución', 'cancelar', 'refund', 'devolver', 'recuperar dinero'],
    question: '¿Puedo pedir un reembolso?',
    answer: 'Política de reembolsos:\n\n• Si el archivo .mq5/.mq4 no se descarga: reembolso 100%\n• Si tienes problemas técnicos no resueltos en 7 días: reembolso 100%\n• Si simplemente no estás satisfecho: caso por caso\n\nEscríbenos a soporte@algotrade.app con el ID del bot y motivo.',
  },
  {
    id: 'broker',
    keywords: ['broker', 'que broker', 'cual broker', 'recomienda broker', 'donde abrir cuenta', 'icmarkets', 'pepperstone', 'oanda', 'xm'],
    question: '¿Qué broker me recomiendas?',
    answer: 'Cualquier broker que ofrezca MetaTrader 4 o 5 funciona. Algunos recomendados:\n\n• IC Markets — spreads bajos, regulado\n• Pepperstone — bueno para scalping\n• OANDA — confiable, USA\n• XM — muchas plataformas\n• FBS — apalancamiento alto\n\nO si prefieres prop firm:\n• FTMO, MyForexFunds, The5ers\n\nEvita brokers no regulados.',
  },
  {
    id: 'cuanto-gano',
    keywords: ['cuanto gano', 'cuanto puedo ganar', 'rentabilidad', 'ganancias', 'profit', 'beneficio', 'rendimiento'],
    question: '¿Cuánto puedo ganar con un bot?',
    answer: 'Depende de muchos factores:\n\n• Tu capital inicial\n• Apalancamiento elegido\n• Configuración del bot\n• Volatilidad del mercado\n• Suerte (los mercados son impredecibles)\n\nNo prometemos rentabilidades específicas. El trading conlleva riesgo de pérdida total.\n\nRECOMENDACIÓN: Empieza con poco dinero hasta confirmar que funciona.',
  },
  {
    id: 'modificar',
    keywords: ['modificar', 'cambiar', 'editar', 'ajustar', 'configurar', 'parametros', 'parámetros'],
    question: '¿Puedo modificar mi bot?',
    answer: 'Sí, hay 2 formas:\n\n1. EDITAR PARÁMETROS EN METATRADER:\n   Click derecho en el bot → Cambiar parámetros\n   Modifica: Stop Loss, Take Profit, Lote, etc.\n\n2. EDITAR CÓDIGO (avanzado):\n   Abre el archivo .mq5 con MetaEditor (incluido en MetaTrader)\n   Modifica el código\n   Guarda → MetaTrader recompila\n\nSi quieres una estrategia totalmente nueva, mejor crea otro bot desde el wizard.',
  },
  {
    id: 'cuantos-bots',
    keywords: ['cuantos bots', 'varios bots', 'multiples', 'múltiples', 'al mismo tiempo', 'a la vez'],
    question: '¿Puedo tener varios bots a la vez?',
    answer: '¡Sí! Puedes tener todos los bots que quieras.\n\n• Cada bot opera en su propio gráfico\n• Pueden operar diferentes pares (EUR/USD, BTC/USD, XAU/USD, etc.)\n• Cada uno tiene su Magic Number único (no se confunden)\n\nPrecaución: Cuanto más bots, más recursos consume tu PC/VPS.',
  },
  {
    id: 'mac',
    keywords: ['mac', 'macos', 'apple', 'osx', 'macbook'],
    question: '¿Funciona en Mac?',
    answer: 'MetaTrader es nativo de Windows, pero hay opciones para Mac:\n\n1. MetaTrader oficial para Mac: Algunos brokers lo ofrecen\n2. Wine + CrossOver: Ejecutar la versión Windows en Mac\n3. Parallels / VMware: Máquina virtual con Windows\n4. VPS Windows: Lo más práctico, opera 24/7\n\nEl bot (.mq5/.mq4) funciona igual sin importar el sistema operativo.',
  },
  {
    id: 'soporte',
    keywords: ['soporte', 'humano', 'persona', 'hablar con alguien', 'contacto', 'email'],
    question: '¿Cómo contacto soporte humano?',
    answer: 'Para soporte humano:\n\n• Email: soporte@algotrade.app\n• Tiempo de respuesta: 24-48h\n\nIncluye en tu mensaje:\n• Tu email registrado\n• ID del bot (si aplica)\n• Descripción detallada del problema\n• Capturas de pantalla si es posible',
  },
];

// Detectar saludos, agradecimientos y respuestas casuales
const CONVERSATIONAL = {
  saludos: {
    triggers: ['hola', 'buenas', 'buenos', 'hey', 'que tal', 'qué tal', 'hi', 'hello', 'saludos'],
    responses: [
      '¡Hola! ¿En qué puedo ayudarte hoy?',
      '¡Hola! Soy el asistente de AlgoTrade. ¿Qué necesitas?',
      '¡Buenas! Cuéntame, ¿en qué te ayudo?',
    ],
  },
  agradecimiento: {
    triggers: ['gracias', 'thanks', 'thank you', 'mil gracias', 'genial', 'perfecto', 'excelente', 'ok'],
    responses: [
      '¡De nada! Si tienes otra pregunta, aquí estoy.',
      '¡Un placer! ¿Algo más en lo que pueda ayudarte?',
      '¡Para servirte! Si necesitas algo más, escríbeme.',
    ],
  },
  despedida: {
    triggers: ['adios', 'adiós', 'bye', 'chao', 'hasta luego', 'nos vemos'],
    responses: [
      '¡Hasta luego! Que tengas buenos trades 📈',
      '¡Adiós! Vuelve cuando quieras.',
      '¡Hasta pronto! Suerte con tus bots.',
    ],
  },
  positivo: {
    triggers: ['si', 'sí', 'claro', 'por supuesto', 'exacto', 'efectivamente'],
    responses: [
      '¿Qué pregunta tienes? Cuéntame para poder ayudarte.',
      'Genial. ¿En qué te ayudo?',
    ],
  },
  negativo: {
    triggers: ['no', 'nada', 'nope', 'jamás', 'nunca'],
    responses: [
      'Vale, si cambias de opinión escríbeme.',
      'Sin problema. Si tienes alguna pregunta más adelante, aquí estaré.',
    ],
  },
  ayuda: {
    triggers: ['ayuda', 'ayudame', 'ayúdame', 'help', 'que puedes hacer', 'que sabes', 'qué sabes'],
    responses: [
      'Puedo ayudarte con:\n\n• Comprar y descargar bots\n• Instalar bots en MT4/MT5\n• Configurar apalancamiento (cualquier valor)\n• Cuentas de fondeo (FTMO, MFF, etc.)\n• Resolver errores comunes\n• Recomendar brokers\n• VPS y operación 24/7\n\nEscríbeme tu pregunta o elige una de las preguntas frecuentes.',
    ],
  },
};

// Normalizar texto: quitar acentos y minúsculas
function normalize(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!,.;:]/g, '')
    .trim();
}

// Pick aleatorio de array
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Buscar respuesta inteligente
function findBestAnswer(query) {
  if (!query || query.trim().length < 2) {
    return { answer: 'Escribe tu pregunta y trataré de ayudarte.' };
  }

  const q = normalize(query);

  // 1. Detectar conversacional (saludo, agradecimiento, etc.)
  for (const [type, data] of Object.entries(CONVERSATIONAL)) {
    for (const trigger of data.triggers) {
      // Match exacto, palabra completa, o frase
      if (q === trigger || q.split(' ').includes(trigger) || q.startsWith(trigger + ' ')) {
        return { answer: randomFrom(data.responses) };
      }
    }
  }

  // 2. Buscar coincidencias por keywords (con normalización)
  let bestMatch = null;
  let bestScore = 0;

  for (const faq of FAQ_DATABASE) {
    let score = 0;
    for (const kw of faq.keywords) {
      const nKw = normalize(kw);
      if (q.includes(nKw)) {
        score += nKw.length * 2; // Más peso a coincidencias largas
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  // 3. Si encontramos algo razonable, devolverlo
  if (bestScore >= 4) return bestMatch;

  // 4. Si no encontramos buena coincidencia
  return {
    answer: 'Hmm, no estoy seguro de a qué te refieres. ¿Puedes reformular?\n\nPuedo ayudarte con:\n• Compra y descarga de bots\n• Instalación en MT4/MT5\n• Apalancamiento\n• FTMO y prop firms\n• Errores comunes\n• Brokers recomendados\n• VPS\n\nO escribe "ayuda" para ver qué puedo hacer.',
  };
}

function SupportSection({ t, onBack }) {
  const [messages, setMessages] = React.useState([
    {
      from: 'bot',
      text: '¡Hola! Soy el asistente de AlgoTrade 🤖\n\nPuedo ayudarte con cualquier duda sobre tus bots: comprar, descargar, instalar en MT4/MT5, configurar apalancamiento, FTMO, errores, brokers...\n\nEscríbeme tu pregunta o usa los botones de abajo.',
    },
  ]);
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const [showFaqs, setShowFaqs] = React.useState(true);
  const [showFollowUp, setShowFollowUp] = React.useState(false); // ¿He resuelto tu duda?
  const [showFaqsAgain, setShowFaqsAgain] = React.useState(false); // Mostrar FAQs de nuevo
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing, showFollowUp, showFaqsAgain]);

  // Detectar si la respuesta es "real" (no un fallback) — para preguntar follow-up
  const isRealAnswer = (text) => {
    return !text.includes('no estoy seguro') && !text.includes('Hmm, no estoy seguro');
  };

  // Simular tiempo de "pensar" del bot
  const simulateBotResponse = (userText, getAnswer, opts = {}) => {
    const userMsg = { from: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setShowFaqs(false);
    setShowFaqsAgain(false);
    setShowFollowUp(false);
    setTyping(true);
    setInput('');

    setTimeout(() => {
      const answer = getAnswer();
      const botMsg = { from: 'bot', text: answer };
      setMessages(prev => [...prev, botMsg]);
      setTyping(false);
      // Mostrar follow-up solo si hubo respuesta real (no saludo ni fallback)
      if (opts.askFollowUp !== false && isRealAnswer(answer) && !opts.isConversational) {
        setTimeout(() => setShowFollowUp(true), 400);
      }
    }, 600 + Math.random() * 700);
  };

  // Click en una pregunta frecuente — respuesta directa
  const handleFaqClick = (faq) => {
    simulateBotResponse(faq.question, () => faq.answer);
  };

  // Pregunta libre — usar el motor de búsqueda
  const handleAsk = (text) => {
    if (!text.trim()) return;
    // Detectar si es solo conversacional (saludo, etc.) para no mostrar follow-up
    const result = findBestAnswer(text);
    const q = normalize(text);
    const isConversational = Object.values(CONVERSATIONAL).some(c =>
      c.triggers.some(tg => q === tg || q.split(' ').includes(tg))
    );
    simulateBotResponse(text, () => result.answer, { isConversational });
  };

  // ¿He resuelto tu duda? → Sí
  const handleResolved = () => {
    setShowFollowUp(false);
    const userMsg = { from: 'user', text: 'Sí, gracias' };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: '¡Genial! Me alegro de haberte ayudado 😊\n\nSi tienes otra duda, aquí estaré.',
      }]);
      setTyping(false);
      setShowFaqsAgain(true);
    }, 600);
  };

  // ¿He resuelto tu duda? → No
  const handleNotResolved = () => {
    setShowFollowUp(false);
    const userMsg = { from: 'user', text: 'No, sigo con la duda' };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: 'Vale, prueba con otra pregunta o escríbela con otras palabras. Aquí tienes las preguntas frecuentes 👇',
      }]);
      setTyping(false);
      setShowFaqsAgain(true);
    }, 600);
  };

  // Top 6 preguntas frecuentes (sin "demo")
  const popularFaqs = FAQ_DATABASE.filter(f => ['comprar', 'descargar', 'instalar', 'apalancamiento', 'ftmo', 'noFunciona'].includes(f.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <ScreenHeader t={t} title="Soporte" subtitle="Asistente automático" onBack={onBack}/>

      {/* Chat messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '0 16px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '12px 14px', borderRadius: t.radius.lg,
              background: msg.from === 'user' ? t.accent : t.bgCard,
              color: msg.from === 'user' ? (t.isDark ? '#000' : '#fff') : t.text,
              border: msg.from === 'user' ? 'none' : `1px solid ${t.border}`,
              fontFamily: t.fontBody, fontSize: 13, lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              boxShadow: msg.from === 'user' ? `0 4px 12px ${t.accent}22` : 'none',
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Indicador "escribiendo..." */}
        {typing && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '14px 16px', borderRadius: t.radius.lg,
              background: t.bgCard, border: `1px solid ${t.border}`,
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: 3, background: t.textDim,
                animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0s',
              }}/>
              <span style={{
                width: 6, height: 6, borderRadius: 3, background: t.textDim,
                animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.2s',
              }}/>
              <span style={{
                width: 6, height: 6, borderRadius: 3, background: t.textDim,
                animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.4s',
              }}/>
            </div>
          </div>
        )}

        {/* Quick FAQs (solo al inicio o al volver a preguntar) */}
        {(showFaqs || showFaqsAgain) && (
          <div style={{ marginTop: 8 }}>
            <div style={{
              fontFamily: t.fontBody, fontSize: 10, fontWeight: t.weight.bold,
              color: t.textMute, textTransform: 'uppercase', letterSpacing: 0.6,
              marginBottom: 8, padding: '0 4px',
            }}>
              Preguntas frecuentes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {popularFaqs.map((faq, i) => (
                <button key={i}
                  onClick={() => handleFaqClick(faq)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px', borderRadius: t.radius.md,
                    background: t.bgCard, border: `1px solid ${t.border}`,
                    color: t.text, cursor: 'pointer',
                    fontFamily: t.fontBody, fontSize: 13, fontWeight: t.weight.med,
                    transition: 'all 0.15s ease',
                  }}>
                  {faq.question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ¿He resuelto tu duda? — botones después de respuesta */}
        {showFollowUp && !typing && (
          <div style={{ marginTop: 4 }}>
            <div style={{
              fontFamily: t.fontBody, fontSize: 12, color: t.textDim,
              textAlign: 'center', marginBottom: 8,
            }}>
              ¿He resuelto tu duda?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleResolved} style={{
                flex: 1, height: 42, borderRadius: t.radius.pill,
                background: t.pos, color: '#fff', border: 'none',
                cursor: 'pointer', fontFamily: t.fontBody, fontSize: 13,
                fontWeight: t.weight.bold,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Icon name="check" size={14}/> Sí, gracias
              </button>
              <button onClick={handleNotResolved} style={{
                flex: 1, height: 42, borderRadius: t.radius.pill,
                background: t.bgCard, color: t.text,
                border: `1px solid ${t.border}`,
                cursor: 'pointer', fontFamily: t.fontBody, fontSize: 13,
                fontWeight: t.weight.bold,
              }}>
                No, otra pregunta
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef}/>
      </div>

      {/* Input area */}
      <div style={{
        padding: '12px 16px 24px', background: t.bg,
        borderTop: `1px solid ${t.border}`,
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAsk(input); }}
          placeholder="Escribe tu pregunta..."
          style={{
            flex: 1, height: 44, padding: '0 16px',
            borderRadius: t.radius.pill, border: `1px solid ${t.border}`,
            background: t.bgCard, color: t.text,
            fontFamily: t.fontBody, fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={() => handleAsk(input)}
          disabled={!input.trim()}
          style={{
            width: 44, height: 44, borderRadius: 22, border: 'none',
            background: input.trim() ? t.accent : t.chip,
            color: input.trim() ? (t.isDark ? '#000' : '#fff') : t.textMute,
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Icon name="arrowRight" size={18}/>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECURITY — 2FA, sessions, activity log
// ─────────────────────────────────────────────
function SecuritySection({ t, onBack }) {
  return (
    <div style={{ paddingBottom: 130, background: t.bg, minHeight: '100%' }}>
      <ScreenHeader t={t} title="Seguridad" onBack={onBack}/>
      <div style={{ padding: '0 16px' }}>
        <SectionLabel t={t}>Acceso</SectionLabel>
        <Card t={t} padding={0}>
          <ToggleRow t={t} icon="lock" label="Autenticación 2FA" detail="App autenticadora · activado" on/>
          <ToggleRow t={t} icon="key" label="Face ID" detail="Pedir al abrir la app" on/>
          <ToggleRow t={t} icon="shield" label="Bloqueo automático" detail="Tras 5 min inactivo" isLast/>
        </Card>

        <SectionLabel t={t}>Contraseña</SectionLabel>
        <Card t={t} padding={0}>
          <AccountRow t={t} icon="lock" label="Cambiar contraseña" detail="Última actualización: hace 2 meses" isLast/>
        </Card>

        <SectionLabel t={t}>Actividad reciente</SectionLabel>
        <Card t={t} padding={0}>
          {MOCK_LOGS.map((l, i) => (
            <div key={l.id} style={{
              display: 'flex', alignItems: 'flex-start', padding: '12px 16px', gap: 12,
              borderBottom: i < MOCK_LOGS.length - 1 ? `1px solid ${t.border}` : 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: t.radius.md,
                background: t.chip, color: t.text, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={l.icon} size={14}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 13, fontWeight: t.weight.med, color: t.text }}>{l.text}</div>
                <div style={{ fontFamily: t.fontMono, fontSize: 10, color: t.textDim, marginTop: 2 }}>{l.time}{l.device !== '—' ? ' · ' + l.device : ''}</div>
              </div>
            </div>
          ))}
        </Card>

        <div style={{ padding: '20px 4px 0' }}>
          <button style={{
            width: '100%', height: 46, borderRadius: t.radius.lg, border: `1px solid ${t.neg}33`,
            background: t.negSoft, color: t.neg, cursor: 'pointer',
            fontFamily: t.fontBody, fontSize: 13, fontWeight: t.weight.bold,
          }}>Cerrar sesión en todos los dispositivos</button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ t, icon, label, detail, on, isLast }) {
  const [val, setVal] = React.useState(!!on);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12,
      borderBottom: !isLast ? `1px solid ${t.border}` : 'none',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: t.radius.md, background: t.chip, color: t.text, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={16}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: t.weight.med, color: t.text }}>{label}</div>
        {detail && <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textDim, marginTop: 1 }}>{detail}</div>}
      </div>
      <button onClick={() => setVal(!val)} style={{
        width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        background: val ? t.pos : t.chip, position: 'relative', transition: 'background 0.15s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: val ? 20 : 2, width: 22, height: 22, borderRadius: 11,
          background: '#fff', transition: 'left 0.15s',
        }}/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────
function NotificationsSection({ t, onBack }) {
  return (
    <div style={{ paddingBottom: 130, background: t.bg, minHeight: '100%' }}>
      <ScreenHeader t={t} title="Notificaciones" onBack={onBack}/>
      <div style={{ padding: '0 16px' }}>
        <SectionLabel t={t}>Bots y trading</SectionLabel>
        <Card t={t} padding={0}>
          <ToggleRow t={t} icon="bot" label="Trades ejecutados" detail="Cada vez que un bot abre/cierra" on/>
          <ToggleRow t={t} icon="bell" label="Alertas de riesgo" detail="Drawdown, stop loss alcanzado" on/>
          <ToggleRow t={t} icon="shield" label="Reglas de prop firm" detail="Cerca del límite diario" on/>
          <ToggleRow t={t} icon="news" label="Noticias relevantes" detail="Eventos que afecten tus pares" isLast/>
        </Card>

        <SectionLabel t={t}>Cuenta</SectionLabel>
        <Card t={t} padding={0}>
          <ToggleRow t={t} icon="card" label="Pagos y compras" detail="Confirmaciones, recibos" on/>
          <ToggleRow t={t} icon="lock" label="Seguridad" detail="Inicios de sesión sospechosos" on isLast/>
        </Card>

        <SectionLabel t={t}>Marketing</SectionLabel>
        <Card t={t} padding={0}>
          <ToggleRow t={t} icon="spark" label="Tips y educación" detail="Newsletter mensual" isLast/>
        </Card>

        <SectionLabel t={t}>Canales</SectionLabel>
        <Card t={t} padding={0}>
          <ToggleRow t={t} icon="bell" label="Push notifications" on/>
          <ToggleRow t={t} icon="mail" label="Email" on/>
          <ToggleRow t={t} icon="globe" label="SMS" detail="+34 612 345 678" isLast/>
        </Card>
      </div>
    </div>
  );
}

window.ProfileSection = ProfileSection;
window.BillingSection = BillingSection;
window.BrokersSection = BrokersSection;
window.SupportSection = SupportSection;
window.SecuritySection = SecuritySection;
window.NotificationsSection = NotificationsSection;
window.ToggleRow = ToggleRow;
