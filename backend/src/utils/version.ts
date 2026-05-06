// Versión del backend que generó un .mq5/.mq4. Se embebe en el header de cada
// archivo descargado para que un usuario pueda decirnos "estoy en versión X"
// sin que tengamos que adivinar qué build estaba activa cuando bajó el bot.
//
// Resolución:
//   1. RAILWAY_GIT_COMMIT_SHA — Railway lo inyecta automáticamente en cada
//      deploy. Truncamos a 7 chars (formato git short SHA).
//   2. process.env.BUILD_VERSION — override manual si se quiere fijar
//      (por ejemplo en CI con un tag custom).
//   3. 'dev' — local development sin git context.

const railwaySha = process.env.RAILWAY_GIT_COMMIT_SHA;
const override = process.env.BUILD_VERSION;

export const BUILD_VERSION: string =
  override ||
  (railwaySha ? railwaySha.slice(0, 7) : 'dev');
