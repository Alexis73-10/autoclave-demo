// Ventana flotante del Menú y Reportes (misma forma que Componentes/VentanaFlotante.qml): velo, tarjeta
// redondeada casi a pantalla completa, título en negrita, botón cerrar (aro con X), línea divisoria y
// zona de contenido debajo. Tamaño relativo a la ventana; la zona es una columna flex (el contenido
// largo se desplaza dentro con .desplazable).
import { h } from '../../core/dom.js';
import { abrirModal } from '../../core/capas.js';

/** Botón cerrar (aro con X) de las ventanas del frente. */
export function botonCerrar(alPulsar, etiqueta = 'Cerrar') {
  const b = h('button', { class: 'vm-cerrar', 'aria-label': etiqueta }, h('span', { class: 'vm-aro' }, h('span', { class: 'vm-x a' }), h('span', { class: 'vm-x b' })));
  b.addEventListener('click', () => alPulsar?.());
  return b;
}

/**
 * abrirVentanaMenu({titulo, altoTarjeta=1500, contenido (nodo | (zona, api) => nodo|void), alCerrar})
 *   -> {el, zona, ancho, alto (de la zona, px reales al abrir), cerrar(), fijarTitulo(t)}
 * altoTarjeta (px de diseño del QML) solo decide si la ventana es alta (>= 1000: llena la altura
 * disponible) o se ajusta a su contenido.
 */
export function abrirVentanaMenu({ titulo = '', altoTarjeta = 1500, contenido = null, alCerrar = null } = {}) {
  const tit = h('div', { class: 'vm-titulo', text: titulo });
  const zona = h('div', { class: 'vm-zona' });
  let cerrarModal = null;
  const cerrar = botonCerrar(() => cerrarModal?.());
  const tarjeta = h('div', { class: `vm-tarjeta${altoTarjeta >= 1000 ? ' alta' : ''}` },
    h('div', { class: 'vm-cab' }, tit, cerrar), h('div', { class: 'vm-linea' }), zona);
  const api = { el: tarjeta, zona, ancho: 0, alto: 0, cerrar: () => cerrarModal?.(), fijarTitulo: (x) => { tit.textContent = x; } };
  cerrarModal = abrirModal(tarjeta, { alCerrar, cerrarAlTocarVelo: true });
  api.ancho = zona.clientWidth;
  api.alto = zona.clientHeight;
  if (typeof contenido === 'function') { const n = contenido(zona, api); if (n) zona.append(n); }
  else if (contenido) zona.append(contenido);
  return api;
}
