// Bus de eventos mínimo. Eventos usados: 'sim' (cada tick del simulador), 'idioma',
// 'tema', 'sesion', 'navegacion', 'alarma-nueva', 'ciclo-terminado', 'historial'.
const oyentes = new Map();

export function on(evento, fn) {
  if (!oyentes.has(evento)) oyentes.set(evento, new Set());
  oyentes.get(evento).add(fn);
  return () => oyentes.get(evento)?.delete(fn);
}

export function emit(evento, datos) {
  const fns = oyentes.get(evento);
  if (!fns) return;
  for (const fn of [...fns]) {
    try { fn(datos); } catch (e) { console.error(`[eventos] ${evento}:`, e); }
  }
}
