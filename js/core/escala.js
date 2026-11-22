// Escala del lienzo de diseño 1200x1920 a la pantalla con letterbox (proporción fija).
// factor = min(anchoDisponible / 1200, altoDisponible / 1920), como Escala.factorPara
// del software, pero sin el lienzo flexible: lo que sobra queda como franja negra.
export const ANCHO = 1200;
export const ALTO = 1920;

let factor = 1;
const lienzo = () => document.getElementById('lienzo');

export function factorActual() { return factor; }

export function recalcular() {
  const marco = document.getElementById('marco');
  if (!marco) return;
  const cs = getComputedStyle(marco);
  const w = marco.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const h = marco.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  factor = (w > 0 && h > 0) ? Math.min(w / ANCHO, h / ALTO) : 1;
  const el = lienzo();
  if (el) el.style.transform = `scale(${factor})`;
}

/** Convierte coordenadas de pantalla (clientX/Y) a px de diseño del lienzo. */
export function aDiseno(clientX, clientY) {
  const r = lienzo().getBoundingClientRect();
  return { x: (clientX - r.left) / factor, y: (clientY - r.top) / factor };
}

export function iniciar() {
  recalcular();
  window.addEventListener('resize', recalcular);
  window.addEventListener('orientationchange', () => setTimeout(recalcular, 150));
  window.visualViewport?.addEventListener('resize', recalcular);
}
