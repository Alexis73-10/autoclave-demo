// Medición de texto, ajuste de letra e iconos por máscara del frente "menú" (composición adaptable).
import { h, medida, observarTamano } from '../../core/dom.js';

let _ctx = null;
/** Ancho (px) que ocuparía un texto con la letra dada. */
export function medir(txt, tam, peso = 400, familia = 'Montserrat') {
  _ctx ??= document.createElement('canvas').getContext('2d');
  _ctx.font = `${peso} ${tam}px ${familia}, sans-serif`;
  return _ctx.measureText(String(txt ?? '')).width;
}

/** Compatibilidad: HorizontalFit con medidas fijas (px). Preferir encajar(). */
export function ajustar(el, ancho, tam, peso = 400, min = 12.5, familia = 'Montserrat') {
  const w = medir(el.textContent, tam, peso, familia);
  el.style.fontSize = `${w > ancho ? Math.max(Math.max(12.5, min), Math.floor(tam * ancho / w)) : tam}px`;
}

const MIN_TEXTO = 12.5;   // px reales: nunca menos de 12 px (B4)

/**
 * HorizontalFit adaptable: baja la letra de `el` (texto de una línea, white-space: nowrap) hasta que
 * quepa en su caja, sin bajar de 12,5 px, y lo recalcula cuando cambia el tamaño. Nunca pone «…».
 * La letra de partida es la del CSS. Devuelve la función que deja de observar.
 */
export function encajar(el, min = MIN_TEXTO) {
  const ajustarYa = () => {
    el.style.fontSize = '';
    const base = parseFloat(getComputedStyle(el).fontSize) || 16;
    const disponible = el.clientWidth;
    const necesario = el.scrollWidth;
    if (disponible > 0 && necesario > disponible + 0.5) {
      el.style.fontSize = `${Math.max(min, Math.floor(base * disponible / necesario * 10) / 10)}px`;
    }
  };
  el._reencajar = ajustarYa;
  // la letra definitiva llega al cargar la fuente: se vuelve a medir entonces
  try { document.fonts?.ready?.then(() => { if (el.isConnected) ajustarYa(); }); } catch { /* sin FontFaceSet */ }
  return observarTamano(el, ajustarYa);
}

/** Icono SVG por máscara (también los de color/ que no tienen variante mono). tam: px o medida CSS; null = CSS. */
export function mascara(ruta, tam, color, clase = '') {
  const el = h('span', { class: `mn-mascara ${clase}` });
  const dim = tam == null ? {} : { width: medida(tam), height: medida(tam) };
  Object.assign(el.style, { ...dim, backgroundColor: color,
    webkitMaskImage: `url("${ruta}")`, maskImage: `url("${ruta}")` });
  return el;
}

/** Compatibilidad: icono de color (el tamaño lo pone el CSS de quien lo usa). */
export function iconoCaja(nombre, _cajaM, _tinta, carpeta = 'color') {
  return h('img', { class: 'mn-icono-caja', src: `assets/iconos/${carpeta}/${nombre}.svg`, alt: '', draggable: 'false' });
}
