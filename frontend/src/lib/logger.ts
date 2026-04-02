/**
 * Logger utilitário que só emite logs em desenvolvimento.
 * Em produção (NODE_ENV === 'production'), todos os logs são suprimidos.
 */
const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  log: (...args: unknown[]) => { if (isDev) console.log(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  error: (...args: unknown[]) => { if (isDev) console.error(...args); },
  info: (...args: unknown[]) => { if (isDev) console.info(...args); },
  debug: (...args: unknown[]) => { if (isDev) console.debug(...args); },
};
