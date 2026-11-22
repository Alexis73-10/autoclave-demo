// Ventana flotante del Menú y Reportes (misma forma que Componentes/VentanaFlotante.qml): velo, tarjeta
// de radio 26 a 34 px de cada borde, título 32 Bold (línea base 78), botón cerrar de 88, línea en y 124
// y zona de contenido debajo (margen 48 y 36 abajo).
import { h } from '../../core/dom.js';
import { abrirModal } from '../../core/capas.js';
import { pos, texto } from './menu_util.js';

/**
 * abrirVentanaMenu({titulo, altoTarjeta=1500, contenido (nodo | (zona, api) => nodo|void), alCerrar})
 *   -> {el, zona, ancho (de la zona), alto (de la zona), cerrar(), fijarTitulo(t)}
 */
export function abrirVentanaMenu({ titulo = '', altoTarjeta = 1500, contenido = null, alCerrar = null } = {}) {
  const alto = Math.min(altoTarjeta, 1920 - 160);
  const ancho = 1200 - 68;
  const tit = texto(titulo, { x: 48, bl: 78, tam: 32, peso: 700, color: 'var(--c-texto-primario)' });
  tit.style.width = `${ancho - 48 - 88 - 28 - 24}px`;
  const zona = pos(h('div', { class: 'vm-zona' }), 48, 150, ancho - 96, alto - 150 - 36);
  const cerrarBtn = pos(h('button', { class: 'vm-cerrar', 'aria-label': 'Cerrar' },
    h('span', { class: 'vm-aro' }), h('span', { class: 'vm-x a' }), h('span', { class: 'vm-x b' })), ancho - 88 - 28, 24, 88, 88);
  const tarjeta = pos(h('div', { class: 'vm-tarjeta' }, tit, cerrarBtn,
    pos(h('div', { class: 'vm-linea' }), 48, 124, ancho - 96, 2), zona), 34, (1920 - alto) / 2, ancho, alto);
  const raiz = pos(h('div', { class: 'vm-raiz' }, tarjeta), 0, 0, 1200, 1920);
  raiz.style.position = 'relative';
  let cerrarModal = null;
  const api = { el: tarjeta, zona, ancho: zona.clientWidth || ancho - 96, alto: alto - 150 - 36,
    cerrar: () => cerrarModal?.(), fijarTitulo: (x) => { tit.textContent = x; } };
  raiz.addEventListener('pointerdown', (e) => { if (e.target === raiz) api.cerrar(); });
  cerrarBtn.addEventListener('click', () => api.cerrar());
  cerrarModal = abrirModal(raiz, { alCerrar });
  if (typeof contenido === 'function') { const n = contenido(zona, api); if (n) zona.append(n); }
  else if (contenido) zona.append(contenido);
  return api;
}
