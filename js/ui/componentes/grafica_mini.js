// Gráfica del ciclo de solo lectura para el detalle de un ciclo (Historial / Último ciclo / Reportes):
// réplica de la apariencia de GraficaCiclo.qml (título, leyenda, cuadrícula, eje de temperatura a la
// izquierda y de presión a la derecha, eje de tiempo en minutos y divisores de fase). Sin cursor ni zoom.
// Se dibuja al tamaño real de su caja y se redibuja con los mismos datos al cambiar (observarTamano, B5).
import { h, observarTamano } from '../../core/dom.js';
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

function pasoX(minTotal, marcasMax) {
  for (const p of [1, 2, 5, 10, 15, 30, 60]) if (minTotal / p <= marcasMax) return p;
  return 60;
}

/**
 * crearGraficaMini({serie:[{t(s), tc, tr, pc, fase}]}) -> {el, destruir()}
 * Sin serie muestra «Gráfica no disponible». (ancho y alto se aceptan y se ignoran.)
 */
export function crearGraficaMini({ serie = [] } = {}) {
  const el = h('div', { class: 'mn-grafica' });
  if (!serie || serie.length < 2) {
    el.append(h('div', { class: 'mn-grafica-vacia', text: t('menu.grafica_no_disponible') }));
    return { el, destruir() {} };
  }
  const leyenda = h('div', { class: 'mn-g-leyenda' });
  [['var(--c-serie-grafica1)', 'ciclo.serie_temp_camara'], ['var(--c-serie-grafica2)', 'ciclo.serie_temp_ref'], ['var(--c-serie-grafica3)', 'ciclo.serie_presion']]
    .forEach(([c, k]) => leyenda.append(h('span', { class: 'mn-g-item' }, h('i', { style: { background: c } }), t(k))));
  const area = h('div', { class: 'mn-g-area', 'data-solape-permitido': '' });
  el.append(h('div', { class: 'mn-g-cab' }, h('div', { class: 'mn-g-titulo', text: t('ciclo.grafica') }), leyenda), area);

  const minTotal = Math.max(1, serie[serie.length - 1].t / 60);
  const maxT = maximoBonito(Math.max(...serie.map((p) => Math.max(p.tc ?? 0, p.tr ?? 0))));
  const maxP = maximoBonito(Math.max(...serie.map((p) => p.pc ?? 0)));

  function dibujar({ ancho, alto }) {
    const fs = Math.max(12.5, Math.min(16, ancho / 45));   // letra de los ejes (px reales, nunca < 12)
    const L = fs * 3.4, R = ancho - fs * 3.6, T = fs * 2.2, B = alto - fs * 3.6;
    if (R - L < 40 || B - T < 30) { area.replaceChildren(); return; }
    const px = (min) => L + (min / minTotal) * (R - L);
    const pyT = (v) => B - (v / maxT) * (B - T);
    const pyP = (v) => B - (v / maxP) * (B - T);
    const svg = s('svg', { width: ancho, height: alto, viewBox: `0 0 ${ancho} ${alto}` });
    const marcasY = B - T > 160 ? 5 : B - T > 70 ? 4 : 2;
    const txt = (x, y, ancla, contenido, clase = 'mn-g-eje') => {
      const e = s('text', { x, y, 'text-anchor': ancla, class: clase, 'font-size': fs });
      e.textContent = contenido;
      return e;
    };
    for (let i = 0; i <= marcasY; i++) {
      const y = B - i * (B - T) / marcasY;
      svg.append(s('line', { x1: L, x2: R, y1: y, y2: y, stroke: i === 0 ? 'var(--c-grafica-eje)' : 'var(--c-grafica-cuadricula)', 'stroke-width': 1.2 }));
      svg.append(txt(L - fs * 0.6, y + fs * 0.35, 'end', String(Math.round(i * maxT / marcasY * 10) / 10)),
        txt(R + fs * 0.6, y + fs * 0.35, 'start', String(Math.round(i * maxP / marcasY * 10) / 10)));
    }
    svg.append(txt(L - fs * 0.6, T - fs * 0.9, 'end', '°C', 'mn-g-unidad'), txt(R + fs * 0.6, T - fs * 0.9, 'start', 'kPa', 'mn-g-unidad'));
    const paso = pasoX(minTotal, Math.max(2, Math.floor((R - L) / (fs * 4))));
    for (let m = 0; m <= minTotal + 1e-6; m += paso) {
      svg.append(s('line', { x1: px(m), x2: px(m), y1: B, y2: B + 6, stroke: 'var(--c-grafica-eje)', 'stroke-width': 1.5 }));
      svg.append(txt(px(m), B + fs * 1.6, 'middle', String(m)));
    }
    svg.append(txt((L + R) / 2, alto - fs * 0.5, 'middle', t('ciclo.grafica_eje_tiempo'), 'mn-g-unidad'));
    let previa = null;
    for (const p of serie) {
      if (p.fase && p.fase !== previa) {
        if (previa !== null) svg.append(s('line', { x1: px(p.t / 60), x2: px(p.t / 60), y1: T, y2: B, stroke: 'var(--c-grafica-divisor-fase)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }));
        previa = p.fase;
      }
    }
    const linea = (clave, py, color) => {
      const d = serie.filter((p) => p[clave] != null).map((p, i) => `${i ? 'L' : 'M'}${px(p.t / 60).toFixed(1)} ${py(p[clave]).toFixed(1)}`).join(' ');
      return s('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    };
    svg.append(linea('pc', pyP, 'var(--c-serie-grafica3)'), linea('tr', pyT, 'var(--c-serie-grafica2)'), linea('tc', pyT, 'var(--c-serie-grafica1)'));
    area.replaceChildren(svg);
  }
  const quitar = observarTamano(area, dibujar);
  return { el, destruir: quitar };
}
