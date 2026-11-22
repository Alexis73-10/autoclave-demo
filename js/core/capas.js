// Capas sobre la pila: modales (con velo) y avisos breves.
// abrirModal(el, {alCerrar, cerrarAlTocarVelo}) -> función cerrar().
import { h } from './dom.js';

const capaModal = () => document.getElementById('capa-modal');
const abiertos = [];

export function abrirModal(contenido, { alCerrar, cerrarAlTocarVelo = false } = {}) {
  const velo = h('div', { class: 'velo-modal' });
  const caja = h('div', { class: 'contenedor-modal' }, contenido);
  const raiz = h('div', { class: 'raiz-modal' }, velo, caja);
  let cerrado = false;
  const cerrar = () => {
    if (cerrado) return;
    cerrado = true;
    raiz.remove();
    const i = abiertos.indexOf(cerrar);
    if (i >= 0) abiertos.splice(i, 1);
    alCerrar?.();
  };
  if (cerrarAlTocarVelo) velo.addEventListener('click', cerrar);
  capaModal().append(raiz);
  abiertos.push(cerrar);
  return cerrar;
}

export function hayModalAbierto() { return abiertos.length > 0; }
export function cerrarModales() { [...abiertos].reverse().forEach((c) => c()); }

/** Aviso breve (toast) en la capa de avisos. */
export function aviso(texto, ms = 2500) {
  const el = h('div', { class: 'aviso-breve', text: texto });
  document.getElementById('capa-aviso').append(el);
  setTimeout(() => el.remove(), ms);
}
