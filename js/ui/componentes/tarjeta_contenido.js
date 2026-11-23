// TarjetaContenido (Componentes/TarjetaContenido.qml): tarjeta blanca redondeada que llena el espacio
// disponible (flex: 1), con pie opcional separado por un divisor.
import { h } from '../../core/dom.js';

/** crearTarjetaContenido({pie=false}) -> {el, contenido, pie}. (x, y, ancho, alto se aceptan y se ignoran.) */
export function crearTarjetaContenido({ pie = false } = {}) {
  const contenido = h('div', { class: 'mn-tc-contenido' });
  const zonaPie = h('div', { class: 'mn-tc-pie' });
  const el = h('div', { class: 'mn-tarjeta-contenido' }, contenido);
  if (pie) el.append(h('div', { class: 'mn-tc-div' }), zonaPie);
  return { el, contenido, pie: zonaPie };
}
