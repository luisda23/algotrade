/* Catálogo bilingüe ES/EN compartido entre app.html y app-en.html.
 *
 * El backend devuelve respuestas JSON con `{ code, error|message, args? }`.
 * El frontend usa `window.t(code, args)` para traducir el `code` al idioma
 * activo (definido por `window.APP_LANG`). Si el `code` no existe en el
 * catálogo, `t()` devuelve `null` y el frontend cae al `error`/`message`
 * literal en inglés que viene en la respuesta. Mejor inglés que pantalla
 * en blanco.
 *
 * Mantener sincronizado con `backend/src/utils/responses.ts` (constante RC).
 */
(function () {
  const MSG = {
    // ───── Comunes ─────
    'common.server_error':              { es: 'Error en el servidor',                                          en: 'Server error' },
    'common.not_found':                 { es: 'No encontrado',                                                  en: 'Not found' },
    'common.user_not_found':            { es: 'Usuario no encontrado',                                          en: 'User not found' },

    // ───── Auth: validación ─────
    'auth.email_password_name_required':{ es: 'Email, contraseña y nombre requeridos',                          en: 'Email, password and name required' },
    'auth.email_password_required':     { es: 'Email y contraseña requeridos',                                  en: 'Email and password required' },
    'auth.email_invalid':               { es: 'Email no válido',                                                en: 'Invalid email' },
    'auth.email_too_long':              { es: 'Email demasiado largo',                                          en: 'Email too long' },
    'auth.email_in_use':                { es: 'Ese email ya está en uso',                                       en: 'That email is already in use' },
    'auth.name_invalid':                { es: 'Nombre inválido (2-80 caracteres)',                              en: 'Invalid name (2-80 characters)' },
    'auth.password_required':           { es: 'Contraseña requerida',                                           en: 'Password required' },
    'auth.password_too_short':          { es: 'La contraseña debe tener al menos 8 caracteres',                 en: 'Password must be at least 8 characters' },
    'auth.password_too_long':           { es: 'La contraseña es demasiado larga',                               en: 'Password is too long' },
    'auth.password_needs_upper':        { es: 'La contraseña necesita al menos una mayúscula',                  en: 'Password must contain at least one uppercase letter' },
    'auth.password_needs_lower':        { es: 'La contraseña necesita al menos una minúscula',                  en: 'Password must contain at least one lowercase letter' },
    'auth.password_needs_digit':        { es: 'La contraseña necesita al menos un número',                      en: 'Password must contain at least one number' },
    'auth.password_needs_upper_digit':  { es: 'La contraseña necesita una mayúscula y un número',               en: 'Password must contain an uppercase letter and a number' },
    'auth.password_same_as_current':    { es: 'La nueva contraseña debe ser distinta de la actual',             en: 'New password must differ from the current one' },
    'auth.passwords_required':          { es: 'Contraseña actual y nueva son requeridas',                       en: 'Current and new password are required' },
    'auth.current_password_wrong':      { es: 'La contraseña actual no es correcta',                            en: 'Current password is incorrect' },

    // ───── Auth: credenciales / sesión ─────
    'auth.invalid_credentials':         { es: 'Credenciales inválidas',                                         en: 'Invalid credentials' },
    'auth.token_required':              { es: 'Token requerido',                                                en: 'Token required' },
    'auth.token_invalid':               { es: 'Token inválido',                                                 en: 'Invalid token' },
    'auth.token_pending':               { es: 'Token de login pendiente. Completa la verificación primero.',   en: 'Pending login token. Complete verification first.' },
    'auth.session_expired':             { es: 'Sesión expirada. Inicia sesión de nuevo.',                       en: 'Session expired. Sign in again.' },
    'auth.session_validation_error':    { es: 'Error al validar la sesión',                                     en: 'Failed to validate session' },
    'auth.login_pending_required':      { es: 'Token de login requerido',                                       en: 'Login token required' },
    'auth.login_pending_invalid':       { es: 'Token de login inválido',                                        en: 'Invalid login token' },
    'auth.login_pending_expired':       { es: 'El intento de login ha caducado. Vuelve a iniciar sesión.',      en: 'Login attempt has expired. Sign in again.' },
    'auth.no_pending_code':             { es: 'No hay código pendiente. Vuelve a iniciar sesión.',              en: 'No pending code. Sign in again.' },

    // ───── Auth: códigos / MFA / reset ─────
    'auth.code_invalid_format':         { es: 'Código inválido (6 dígitos)',                                    en: 'Invalid code (6 digits)' },
    'auth.code_incorrect':              { es: 'Código incorrecto',                                              en: 'Incorrect code' },
    'auth.code_expired':                { es: 'El código ha caducado. Vuelve a pedir el cambio.',               en: 'The code has expired. Request the change again.' },
    'auth.code_too_many_attempts':      { es: 'Demasiados intentos. Vuelve a pedir el cambio.',                 en: 'Too many attempts. Request the change again.' },
    'auth.code_resend_cooldown':        { es: 'Espera un minuto antes de pedir otro código',                    en: 'Wait a minute before requesting another code' },
    'auth.code_send_fail':              { es: 'No se pudo enviar el código. Intenta de nuevo.',                 en: 'Could not send the code. Try again.' },
    'auth.reset_link_invalid':          { es: 'Enlace inválido o ya usado. Pide uno nuevo.',                    en: 'Link invalid or already used. Request a new one.' },
    'auth.reset_link_expired':          { es: 'El enlace ha caducado. Pide uno nuevo.',                         en: 'The link has expired. Request a new one.' },
    'auth.reset_email_fail':            { es: 'No se pudo enviar el email',                                     en: 'Could not send the email' },
    'auth.no_pending_email_change':     { es: 'No hay cambio de email pendiente',                               en: 'No pending email change' },
    'auth.email_taken_during_change':   { es: 'Ese email se ha registrado mientras esperabas. Prueba con otro.',en: 'That email was registered while you waited. Try another.' },

    // ───── Auth: rate limits ─────
    'rate.login':                       { es: 'Demasiados intentos de login. Espera 5 minutos antes de volver a intentarlo.', en: 'Too many login attempts. Wait 5 minutes before trying again.' },
    'rate.signup':                      { es: 'Demasiadas cuentas creadas desde esta IP. Espera una hora.',     en: 'Too many accounts created from this IP. Wait one hour.' },
    'rate.forgot':                      { es: 'Demasiadas solicitudes. Espera una hora.',                       en: 'Too many requests. Wait one hour.' },
    'rate.code':                        { es: 'Demasiados intentos de código. Espera unos minutos.',            en: 'Too many code attempts. Wait a few minutes.' },

    // ───── Auth: éxito ─────
    'auth.signup_ok':                   { es: 'Cuenta creada. Inicia sesión para verificar tu email.',          en: 'Account created. Sign in to verify your email.' },
    'auth.login_ok':                    { es: 'Login exitoso',                                                  en: 'Login successful' },
    'auth.login_complete':              { es: 'Login completado',                                               en: 'Login complete' },
    'auth.profile_updated':             { es: 'Perfil actualizado',                                             en: 'Profile updated' },
    'auth.email_change_requested':      { es: 'Te hemos enviado un código al nuevo email',                      en: 'We sent a code to your new email' },
    'auth.email_updated':               { es: 'Email actualizado',                                              en: 'Email updated' },
    'auth.password_reset_ok':           { es: 'Contraseña restablecida. Ya puedes iniciar sesión.',             en: 'Password reset. You can sign in now.' },
    'auth.password_updated':            { es: 'Contraseña actualizada',                                         en: 'Password updated' },
    'auth.forgot_ok':                   { es: 'Si ese email está registrado, te llegará un enlace en breve.',   en: 'If that email is registered, you will receive a link shortly.' },
    'auth.code_sent':                   { es: 'Código enviado',                                                 en: 'Code sent' },
    'auth.lang_updated':                { es: 'Idioma actualizado',                                             en: 'Language updated' },
    'auth.nothing_to_update':           { es: 'Nada que actualizar',                                            en: 'Nothing to update' },
    'auth.logout_everywhere_ok':        { es: 'Sesión cerrada en todos los dispositivos',                       en: 'Signed out from all devices' },

    // ───── Bots ─────
    'bot.not_found':                    { es: 'Bot no encontrado',                                              en: 'Bot not found' },
    'bot.list_fail':                    { es: 'Error al obtener bots',                                          en: 'Failed to load bots' },
    'bot.get_fail':                     { es: 'Error al obtener el bot',                                        en: 'Failed to load bot' },
    'bot.update_fail':                  { es: 'Error al actualizar el bot',                                     en: 'Failed to update bot' },
    'bot.updated':                      { es: 'Bot actualizado',                                                en: 'Bot updated' },
    'bot.delete_fail':                  { es: 'Error al eliminar el bot',                                       en: 'Failed to delete bot' },
    'bot.deleted':                      { es: 'Bot eliminado',                                                  en: 'Bot deleted' },
    'bot.download_fail':                { es: 'Error al descargar el bot',                                      en: 'Failed to download bot' },
    'bot.create_deprecated':            { es: 'Crear bots requiere un pago previo. Usa el wizard.',             en: 'Bot creation requires a paid order. Use the wizard.' },

    // ───── Pagos ─────
    'pay.gateway_down':                 { es: 'Pasarela de pago no configurada',                                en: 'Payment gateway not configured' },
    'pay.checkout_fail':                { es: 'Error al crear sesión de pago',                                  en: 'Failed to create checkout session' },
    'pay.config_required':              { es: 'Configuración del bot requerida',                                en: 'Bot configuration required' },
    'pay.name_invalid':                 { es: 'Nombre de bot inválido (1-60 caracteres)',                       en: 'Invalid bot name (1-60 characters)' },
    'pay.strategy_invalid':             { es: 'Estrategia no válida',                                           en: 'Invalid strategy' },
    'pay.order_not_found':              { es: 'Orden no encontrada o ya procesada',                             en: 'Order not found or already processed' },
    'pay.not_confirmed':                { es: 'Pago no confirmado',                                             en: 'Payment not confirmed' },
    'pay.foreign_order':                { es: 'La orden no pertenece a este usuario',                           en: 'Order does not belong to this user' },
    'pay.already_verified':             { es: 'Pago ya verificado',                                             en: 'Payment already verified' },
    'pay.verified':                     { es: 'Pago verificado y bot creado',                                   en: 'Payment verified and bot created' },
    'pay.verify_fail':                  { es: 'Error al verificar el pago',                                     en: 'Failed to verify payment' },
    'pay.recover_ok':                   { es: '{count} bot(s) recuperado(s)',                                   en: '{count} bot(s) recovered' },
    'pay.recover_fail':                 { es: 'Error recuperando bots',                                         en: 'Failed to recover bots' },

    // ───── Brokers ─────
    'broker.fields_required':           { es: 'Broker, API key y secret requeridos',                            en: 'Broker, API key and secret required' },
    'broker.duplicate':                 { es: 'Ya tienes una conexión con este broker',                         en: 'You already have a connection to this broker' },
    'broker.connect_ok':                { es: 'Broker conectado',                                               en: 'Broker connected' },
    'broker.connect_fail':              { es: 'Error al conectar el broker',                                    en: 'Failed to connect broker' },
    'broker.list_fail':                 { es: 'Error al obtener conexiones',                                    en: 'Failed to load connections' },
    'broker.not_found':                 { es: 'Conexión no encontrada',                                         en: 'Connection not found' },
    'broker.disconnect_ok':             { es: 'Broker desconectado',                                            en: 'Broker disconnected' },
    'broker.disconnect_fail':           { es: 'Error al desconectar el broker',                                 en: 'Failed to disconnect broker' },

    // ───── Marketplace ─────
    'mp.templates_fail':                { es: 'Error al obtener plantillas',                                    en: 'Failed to load templates' },
    'mp.template_not_found':            { es: 'Plantilla no encontrada',                                        en: 'Template not found' },
    'mp.template_get_fail':             { es: 'Error al obtener la plantilla',                                  en: 'Failed to load template' },
    'mp.template_required':             { es: 'Plantilla requerida',                                            en: 'Template required' },
    'mp.bot_purchased':                 { es: 'Bot comprado',                                                   en: 'Bot purchased' },
    'mp.bot_purchase_fail':             { es: 'Error al comprar el bot',                                        en: 'Failed to purchase bot' },
  };

  // Traduce un code al idioma activo, interpolando args. Devuelve null si
  // no hay entrada — el caller debe caer al fallback de la respuesta.
  function t(code, args) {
    if (!code) return null;
    const entry = MSG[code];
    if (!entry) return null;
    const lang = window.APP_LANG === 'en' ? 'en' : 'es';
    let str = entry[lang] || entry.en || entry.es;
    if (str && args && typeof args === 'object') {
      Object.keys(args).forEach(function (k) {
        str = str.split('{' + k + '}').join(String(args[k]));
      });
    }
    return str;
  }

  // Normaliza una respuesta de error/éxito del backend a un string legible.
  // Acepta:
  //   - { code, error, args }            → traducir code, fallback a error
  //   - { code, message, args }          → traducir code, fallback a message
  //   - { error: 'literal' }             → devolver literal
  //   - { message: 'literal' }           → devolver literal
  //   - string                           → devolver tal cual
  function tResp(payload) {
    if (!payload) return null;
    if (typeof payload === 'string') return payload;
    const args = payload.args && typeof payload.args === 'object' ? payload.args : undefined;
    const localized = t(payload.code, args);
    if (localized) return localized;
    return payload.error || payload.message || null;
  }

  window.t = t;
  window.tResp = tResp;
})();
