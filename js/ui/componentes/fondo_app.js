// FondoApp: imagen de fondo (claro) o gradiente radial (oscuro), como Componentes/FondoApp.qml.
// Hijo position:absolute; inset:0 de la pantalla (cubre también las zonas seguras).
import { h } from '../../core/dom.js';

/** variante 'reposo' = el degradado de Reposo/Intro; por defecto el de las demás pantallas. */
export function crearFondoApp(variante = 'app') {
  return h('div', { class: `fondo-app fondo-${variante}`, 'data-solape-permitido': '' });
}
