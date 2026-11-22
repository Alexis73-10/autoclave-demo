// TarjetaContenido (Componentes/TarjetaContenido.qml): tarjeta blanca de radio 28 con pie opcional de 168.
import { h } from '../../core/dom.js';
import { pos } from './menu_util.js';

/** crearTarjetaContenido({x, y, ancho, alto, pie=false}) -> {el, contenido, pie}. */
export function crearTarjetaContenido({ x, y, ancho, alto, pie = false } = {}) {
  const contenido = h('div', { class: 'mn-tc-contenido' });
  const zonaPie = h('div', { class: 'mn-tc-pie' });
  const el = pos(h('div', { class: 'mn-tarjeta-contenido' }, contenido), x, y, ancho, alto);
  if (pie) {
    el.append(h('div', { class: 'mn-tc-div' }), zonaPie);
    contenido.style.bottom = '169px';
    zonaPie.style.height = '168px';
  }
  return { el, contenido, pie: zonaPie };
}
