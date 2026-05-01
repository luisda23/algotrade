// auth.jsx — login / signup with Gmail, Apple, email

function Auth({ t, onAuth, onClose, authError }) {
  const [mode, setMode] = React.useState('login'); // login | signup
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    await onAuth({ provider: 'email', email, password, mode });
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100%', background: t.bg, color: t.text,
      paddingBottom: 40, position: 'relative', overflow: 'hidden',
    }}>

      {/* Top-left close */}
      {onClose && (
        <button onClick={onClose} style={{
          position: 'absolute', top: 18, left: 18, zIndex: 5,
          width: 36, height: 36, borderRadius: 18, background: t.chip, border: 'none',
          color: t.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="close" size={18}/>
        </button>
      )}

      {/* Logo / brand */}
      <div style={{ padding: '60px 24px 28px', textAlign: 'center', position: 'relative' }}>
        <div style={{
          width: 76, height: 76, borderRadius: 22,
          background: t.isDark ? '#FFFFFF' : '#000000',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: t.isDark
            ? '0 16px 40px rgba(255,255,255,0.15)'
            : '0 16px 40px rgba(0,0,0,0.25)',
          marginBottom: 20, position: 'relative', overflow: 'hidden',
        }}>
          {/* Logo SVG: gráfico ascendente con candle */}
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 32 L14 24 L22 28 L30 16 L38 12"
              stroke={t.isDark ? '#000' : '#FFF'}
              strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>
            <circle cx="38" cy="12" r="3" fill={t.isDark ? '#000' : '#FFF'}/>
            <rect x="20" y="20" width="4" height="10" rx="0.5"
              fill={t.isDark ? '#000' : '#FFF'} opacity="0.85"/>
            <line x1="22" y1="17" x2="22" y2="20"
              stroke={t.isDark ? '#000' : '#FFF'}
              strokeWidth="1.3" strokeLinecap="round" opacity="0.85"/>
            <line x1="22" y1="30" x2="22" y2="33"
              stroke={t.isDark ? '#000' : '#FFF'}
              strokeWidth="1.3" strokeLinecap="round" opacity="0.85"/>
          </svg>
        </div>
        <div style={{
          fontFamily: t.fontDisplay, fontSize: 13, fontWeight: t.weight.bold,
          color: t.text, letterSpacing: 3, textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          AlgoTrade
        </div>
        <div style={{
          fontFamily: t.fontDisplay, fontSize: 34, fontWeight: t.weight.bold,
          color: t.text, letterSpacing: t.letterSpace, lineHeight: 1.1,
        }}>
          {mode === 'login' ? 'Bienvenido' : 'Crea tu cuenta'}
        </div>
        <div style={{
          fontFamily: t.fontBody, fontSize: 15, color: t.textDim,
          marginTop: 8, padding: '0 12px',
        }}>
          {mode === 'login' ? 'Tus bots de trading te están esperando' : 'Empieza gratis. Solo pagas cuando creas un bot.'}
        </div>
      </div>

      {/* Email + password */}
      <div style={{ paddingTop: 12 }}/>
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Input t={t} icon="mail" placeholder="tu@email.com" value={email} onChange={setEmail} type="email"/>
        <Input t={t} icon="lock" placeholder="Contraseña" value={password} onChange={setPassword} type="password"/>
        {mode === 'login' && (
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={() => alert('Función próximamente. Por ahora contacta soporte: soporte@algotrade.app')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: t.accent, fontFamily: t.fontBody, fontSize: 13, fontWeight: t.weight.med,
              }}>¿Olvidaste tu contraseña?</button>
          </div>
        )}
      </div>

      {/* Error message */}
      {authError && (
        <div style={{ padding: '12px 24px 0' }}>
          <div style={{
            background: '#fee', color: '#c33', padding: '10px 14px',
            borderRadius: t.radius.md, fontFamily: t.fontBody, fontSize: 13,
            border: '1px solid #fcc',
          }}>
            ⚠️ {authError}
          </div>
        </div>
      )}

      {/* Submit */}
      <div style={{ padding: '20px 24px 0' }}>
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', height: 54, borderRadius: t.radius.lg, border: 'none',
          background: t.accent, color: t.isDark ? '#000' : '#fff',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          fontFamily: t.fontBody, fontSize: 16, fontWeight: t.weight.bold,
          letterSpacing: 0.2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: `0 8px 24px ${t.accent}44`,
        }}>
          {loading ? 'Cargando...' : (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta')}
          {!loading && <Icon name="arrowRight" size={18}/>}
        </button>
      </div>

      {/* Toggle login/signup */}
      <div style={{ textAlign: 'center', padding: '20px 24px 0' }}>
        <span style={{ fontFamily: t.fontBody, fontSize: 14, color: t.textDim }}>
          {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
        </span>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: t.accent, fontFamily: t.fontBody, fontSize: 14, fontWeight: t.weight.bold,
          padding: 0,
        }}>
          {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </div>

      {/* Legal */}
      <div style={{
        textAlign: 'center', padding: '32px 32px 0',
        fontFamily: t.fontBody, fontSize: 11, color: t.textMute, lineHeight: 1.6,
      }}>
        Al continuar aceptas los <span style={{ color: t.textDim, textDecoration: 'underline' }}>Términos</span> y la <span style={{ color: t.textDim, textDecoration: 'underline' }}>Política de privacidad</span>. La app es gratis. Solo pagas cuando creas un bot.
      </div>
    </div>
  );
}

function Input({ t, icon, placeholder, value, onChange, type = 'text' }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{
      height: 54, borderRadius: t.radius.lg,
      background: t.bgElev, border: `1px solid ${focus ? t.accent : t.border}`,
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
      transition: 'border-color 0.15s',
    }}>
      <Icon name={icon} size={18} color={t.textDim}/>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: t.text, fontFamily: t.fontBody, fontSize: 15,
        }}
      />
    </div>
  );
}

window.Auth = Auth;
window.AuthInput = Input;
