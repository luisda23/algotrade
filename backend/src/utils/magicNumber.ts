import crypto from 'crypto';

// Deriva un MagicNumber determinista del id del bot. El mismo bot SIEMPRE
// produce el mismo magic, así que regenerar el .mq5/.mq4 NO rompe el
// `HasOwnPosition()` que filtra posiciones por magic — el EA recién cargado
// reconoce las posiciones que tenía abiertas el .mq5 anterior y no abre
// duplicados.
//
// Antes esto era `Math.floor(Math.random() * 900000) + 100000`, lo que
// generaba un magic distinto por descarga y rompía la continuidad.
//
// Implementación:
//   - SHA-256 sobre botId, primeros 4 bytes interpretados como uint32 BE.
//   - AND 0x7fffffff para forzar bit alto a 0 (MQL int es signed 32-bit;
//     evitamos que Magic sea negativo en algunos brokers).
//   - Fallback si no hay botId (poco probable, pero el tipo de Bot lo
//     permite): hash determinista del nombre + strategy. Sigue siendo
//     reproducible para el mismo input.
export function deterministicMagicNumber(seed: string): number {
  const hash = crypto.createHash('sha256').update(seed).digest();
  return hash.readUInt32BE(0) & 0x7fffffff;
}
