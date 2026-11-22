// Medición de texto, ajuste de letra e iconos por máscara del frente "menú".
import { h } from '../../core/dom.js';

let _ctx = null;
/** Ancho (px de diseño) que ocuparía un texto. */
export function medir(txt, tam, peso = 400, familia = 'Montserrat') {
  _ctx ??= document.createElement('canvas').getContext('2d');
  _ctx.font = `${peso} ${tam}px ${familia}, sans-serif`;
  return _ctx.measureText(String(txt ?? '')).width;
}

/** HorizontalFit: baja la letra de un texto hasta `min` px si no cabe en `ancho` (nunca recorta). */
export function ajustar(el, ancho, tam, peso = 400, min = 14, familia = 'Montserrat') {
  const w = medir(el.textContent, tam, peso, familia);
  el.style.fontSize = `${w > ancho ? Math.max(min, Math.floor(tam * ancho / w)) : tam}px`;
}

/** Icono SVG por máscara (también los de color/ que no tienen variante mono). */
export function mascara(ruta, tam, color) {
  const el = h('span', { class: 'mn-mascara' });
  Object.assign(el.style, { width: `${tam}px`, height: `${tam}px`, backgroundColor: color,
    webkitMaskImage: `url("${ruta}")`, maskImage: `url("${ruta}")` });
  return el;
}

/** Icono de 48x48 cuya tinta llena la caja [x,y,w,h] del mockup (componente Icono del QML). */
export function iconoCaja(nombre, cajaM, tinta = [0, 0, 48, 48], carpeta = 'color') {
  const e = cajaM[3] / (tinta[3] - tinta[1]);
  const w = 48 * e;
  const el = h('img', { src: `assets/iconos/${carpeta}/${nombre}.svg`, alt: '', draggable: 'false' });
  Object.assign(el.style, { position: 'absolute', width: `${w}px`, height: `${w}px`,
    left: `${cajaM[0] + cajaM[2] / 2 - (tinta[0] + tinta[2]) / 2 * e}px`, top: `${cajaM[1] - tinta[1] * e}px` });
  return el;
}
