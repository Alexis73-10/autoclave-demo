// Gráfica del ciclo de solo lectura para el detalle de un ciclo (Historial / Último ciclo): réplica de la
// apariencia de GraficaCiclo.qml (título, leyenda, cuadrícula, eje de temperatura a la izquierda y de presión
// a la derecha, eje de tiempo en minutos y divisores de fase). Sin cursor ni zoom.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, a = {}, ...hijos) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(a)) e.setAttribute(k, v);
  hijos.forEach((x) => e.append(x));
  return e;
};

const MANTISAS = [1, 2, 2.5, 3, 4, 5, 6, 8, 10];
/** Máximo de eje "bonito": dato * 1,05 redondeado con mantisas de la gráfica real. */
function maximoBonito(v) {
  const base = Math.max(v, 1) * 1.05;
  const exp = 10 ** Math.floor(Math.log10(base));
  for (const m of MANTISAS) if (m * exp >= base) return m * exp;
  return 10 * exp;
}

function pasoX(minTotal) {
  for (const p of [1, 2, 5, 10, 15, 30, 60]) if (minTotal / p <= 8) return p;
  return 60;
}

/**
 * crearGraficaMini({ancho, alto, serie:[{t(s), tc, tr, pc, fase}]}) -> {el}
 * Sin serie muestra «Gráfica no disponible».
 */
export function crearGraficaMini({ ancho, alto, serie = [] } = {}) {
  const el = h('div', { class: 'mn-grafica', style: { width: `${ancho}px`, height: `${alto}px` } });
  if (!serie || serie.length < 2) {
    el.append(h('div', { class: 'mn-grafica-vacia', text: t('menu.grafica_no_disponible') }));
    return { el };
  }
  const L = 100, R = ancho - 100, T = 150, B = alto - 96;
  const minTotal = Math.max(1, serie[serie.length - 1].t / 60);
  const maxT = maximoBonito(Math.max(...serie.map((p) => Math.max(p.tc ?? 0, p.tr ?? 0))));
  const maxP = maximoBonito(Math.max(...serie.map((p) => p.pc ?? 0)));
  const px = (min) => L + (min / minTotal) * (R - L);
  const pyT = (v) => B - (v / maxT) * (B - T);
  const pyP = (v) => B - (v / maxP) * (B - T);
  const svg = s('svg', { width: ancho, height: alto, viewBox: `0 0 ${ancho} ${alto}` });
  // cuadrícula y ejes Y
  for (let i = 0; i <= 5; i++) {
    const y = B - i * (B - T) / 5;
    svg.append(s('line', { x1: L, x2: R, y1: y, y2: y, stroke: i === 0 ? 'var(--c-grafica-eje)' : 'var(--c-grafica-cuadricula)', 'stroke-width': 1.2 }));
    const a = s('text', { x: L - 12, y: y + 7, 'text-anchor': 'end', class: 'mn-g-eje' });
    a.textContent = String(Math.round(i * maxT / 5 * 10) / 10);
    const b = s('text', { x: R + 12, y: y + 7, 'text-anchor': 'start', class: 'mn-g-eje' });
    b.textContent = String(Math.round(i * maxP / 5 * 10) / 10);
    svg.append(a, b);
  }
  const uT = s('text', { x: L - 12, y: T - 24, 'text-anchor': 'end', class: 'mn-g-unidad' }); uT.textContent = '°C';
  const uP = s('text', { x: R + 12, y: T - 24, 'text-anchor': 'start', class: 'mn-g-unidad' }); uP.textContent = 'kPa';
  svg.append(uT, uP);
  // eje X
  const paso = pasoX(minTotal);
  for (let m = 0; m <= minTotal + 1e-6; m += paso) {
    svg.append(s('line', { x1: px(m), x2: px(m), y1: B, y2: B + 6, stroke: 'var(--c-grafica-eje)', 'stroke-width': 1.5 }));
    const x = s('text', { x: px(m), y: B + 34, 'text-anchor': 'middle', class: 'mn-g-eje' }); x.textContent = String(m);
    svg.append(x);
  }
  const tx = s('text', { x: (L + R) / 2, y: alto - 24, 'text-anchor': 'middle', class: 'mn-g-unidad' });
  tx.textContent = t('ciclo.grafica_eje_tiempo');
  svg.append(tx);
  // divisores de fase
  let previa = null;
  for (const p of serie) {
    if (p.fase && p.fase !== previa) {
      if (previa !== null) svg.append(s('line', { x1: px(p.t / 60), x2: px(p.t / 60), y1: T - 20, y2: B, stroke: 'var(--c-grafica-divisor-fase)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }));
      previa = p.fase;
    }
  }
  // curvas
  const linea = (clave, py, color) => {
    const d = serie.filter((p) => p[clave] != null).map((p, i) => `${i ? 'L' : 'M'}${px(p.t / 60).toFixed(1)} ${py(p[clave]).toFixed(1)}`).join(' ');
    return s('path', { d, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  };
  svg.append(linea('pc', pyP, 'var(--c-serie-grafica3)'), linea('tr', pyT, 'var(--c-serie-grafica2)'), linea('tc', pyT, 'var(--c-serie-grafica1)'));
  el.append(h('div', { class: 'mn-g-titulo', text: t('ciclo.grafica') }));
  const leyenda = h('div', { class: 'mn-g-leyenda' });
  [['var(--c-serie-grafica1)', 'ciclo.serie_temp_camara'], ['var(--c-serie-grafica2)', 'ciclo.serie_temp_ref'], ['var(--c-serie-grafica3)', 'ciclo.serie_presion']]
    .forEach(([c, k]) => leyenda.append(h('span', { class: 'mn-g-item' }, h('i', { style: { background: c } }), t(k))));
  el.append(leyenda, svg);
  return { el };
}
