// Ayudantes de DOM compartidos por todas las pantallas.

/**
 * h('div', {class: 'x', onclick: fn, style: {left: '10px'}, dataset: {id: 1}}, hijo1, 'texto', [hijos])
 * Atributos que empiezan con "on" se registran como eventos.
 */
export function h(tag, attrs = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  agregar(el, hijos);
  return el;
}

function agregar(el, hijos) {
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo == null || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
}

/** Medida CSS: un número son px; un texto ('1.5rem', 'var(--ico-m)') se usa tal cual. */
export const medida = (v) => (typeof v === 'number' ? `${v}px` : String(v));

/** Icono como IconoColor del software: SVG monocromo pintado con el color dado (máscara CSS).
 *  tam: número (px) o medida CSS; tam = null deja el tamaño al CSS (clase). */
export function iconoMono(nombre, { tam = 48, color = 'currentColor', clase = '' } = {}) {
  const url = `assets/iconos/mono/${nombre}.svg`;
  const dim = tam == null ? {} : { width: medida(tam), height: medida(tam) };
  return h('span', {
    class: `icono-mono ${clase}`,
    style: {
      ...dim, display: 'inline-block', flex: 'none',
      backgroundColor: color,
      webkitMaskImage: `url("${url}")`, maskImage: `url("${url}")`,
      webkitMaskSize: 'contain', maskSize: 'contain',
      webkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      webkitMaskPosition: 'center', maskPosition: 'center',
    },
  });
}

/** Icono a color (assets/iconos/color/<nombre>.svg). */
export function iconoColor(nombre, { tam = 48, clase = '' } = {}) {
  const dim = tam == null ? {} : { width: medida(tam), height: medida(tam) };
  return h('img', { class: `icono-color ${clase}`, src: `assets/iconos/color/${nombre}.svg`, alt: '',
    draggable: 'false', style: dim });
}

/** Pulsación larga (p. ej. 3 s sobre el logo para el panel oculto). Devuelve la función que la quita. */
export function pulsacionLarga(el, ms, fn) {
  let t = null;
  const cancelar = () => { clearTimeout(t); t = null; };
  const empezar = (e) => { cancelar(); t = setTimeout(() => { t = null; fn(e); }, ms); };
  el.addEventListener('pointerdown', empezar);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, cancelar));
  return () => { cancelar(); el.removeEventListener('pointerdown', empezar); };
}

/** Vacía un nodo. */
export function vaciar(el) { while (el.firstChild) el.firstChild.remove(); }

/**
 * Observa el tamaño de un elemento (ResizeObserver; B5: la gráfica y todo lo que se dibuja
 * a su tamaño se redibuja al girar). fn({ancho, alto}) se llama al inicio y en cada cambio,
 * agrupado por cuadro. Devuelve la función que deja de observar.
 */
export function observarTamano(el, fn) {
  let raf = 0, ultimo = '';
  const avisar = () => {
    raf = 0;
    const r = el.getBoundingClientRect();
    const ancho = Math.round(r.width), alto = Math.round(r.height);
    const clave = `${ancho}x${alto}`;
    if (clave === ultimo || ancho === 0 || alto === 0) return;
    ultimo = clave;
    fn({ ancho, alto });
  };
  const pedir = () => { if (!raf) raf = requestAnimationFrame(avisar); };
  let ro = null;
  if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(pedir); ro.observe(el); }
  window.addEventListener('resize', pedir);
  pedir();
  return () => { ro?.disconnect(); window.removeEventListener('resize', pedir); cancelAnimationFrame(raf); };
}

/** Coordenadas de un evento de puntero relativas a un elemento, en px CSS reales. */
export function aLocal(el, ev) {
  const r = el.getBoundingClientRect();
  return { x: ev.clientX - r.left, y: ev.clientY - r.top, ancho: r.width, alto: r.height };
}
