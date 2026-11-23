// VentanaFlotante (Componentes/VentanaFlotante.qml): ventana de solo
// visualización sobre la pantalla. Velo (tocarlo cierra), tarjeta radio 26 a 34 px
// de cada borde, título 32 Bold en línea base 78, botón cerrar (aro gris con X)
// de 88, línea en y 124 y la zona de contenido debajo (margen 48, 36 abajo).
// Composición adaptable: tamaño relativo a la ventana; la zona es una columna flex.
import { h } from '../../core/dom.js';
import { abrirModal } from '../../core/capas.js';

/**
 * abrirVentanaFlotante({titulo, altoTarjeta = 1200, contenido, alCerrar})
 *   -> { el (tarjeta), zona (contenedor del contenido), cerrar(), fijarTitulo(t) }
 * `contenido`: nodo o función (zona) => nodo. La zona tiene la clase .desplazable
 * si `desplazable` es true (por defecto false: el contenido decide).
 */
export function abrirVentanaFlotante({ titulo = '', altoTarjeta = 1200, contenido = null,
  alCerrar = null, desplazable = false } = {}) {
  // Alto relativo a la ventana (altoTarjeta en px del QML sobre 1920).
  const alto = `min(var(--fc-alto-modal), calc(var(--vh, 100vh) * ${Math.min(1, altoTarjeta / 1760).toFixed(3)}))`;
  const titEl = h('div', { class: 'fc-vf-titulo', text: titulo });
  const zona = h('div', { class: `fc-vf-zona${desplazable ? ' desplazable' : ''}` });
  const botonCerrar = h('button', { class: 'fc-vf-cerrar', 'aria-label': 'Cerrar' },
    h('span', { class: 'fc-vf-cerrar-aro' }), h('span', { class: 'fc-vf-x a' }), h('span', { class: 'fc-vf-x b' }));
  const tarjeta = h('div', { class: 'fc-vf-tarjeta fc-entrada', style: { height: alto } },
    h('div', { class: 'fc-vf-cab' }, titEl, botonCerrar), h('div', { class: 'fc-vf-linea' }), zona);
  tarjeta.addEventListener('pointerdown', (e) => e.stopPropagation());
  let cerrarModal = null;
  const api = {
    el: tarjeta, zona,
    cerrar: () => cerrarModal?.(),
    fijarTitulo: (texto) => { titEl.textContent = texto; },
  };
  botonCerrar.addEventListener('click', () => api.cerrar());
  if (typeof contenido === 'function') { const n = contenido(zona); if (n) zona.append(n); }
  else if (contenido) zona.append(contenido);
  cerrarModal = abrirModal(tarjeta, { cerrarAlTocarVelo: true, alCerrar });
  return api;
}
