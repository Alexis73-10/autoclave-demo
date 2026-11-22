// BarraInferiorMenu (Componentes/BarraInferiorMenu.qml): tarjeta de 139 de alto con tres celdas
// (Atrás | Cerrar sesión | Inicio) separadas por divisores a 313 y 800 (de 1128).
import { h } from '../../core/dom.js';
import { pos } from './menu_util.js';
import { mascara } from './menu_iconos.js';

/**
 * crearBarraInferiorMenu({x=54, y=1749, ancho=1085, alAtras, alInicio, alCerrarSesion,
 *   atrasHabilitado=true, inicioActivo=true, cerrarSesionVisible=false, personalizada=false})
 *   -> {el, contenido, fx}. `personalizada` quita celdas y divisores y deja `contenido`
 *   (caja 1:1 con la barra) a quien llama (Reportes pone Inicio y Salir).
 */
export function crearBarraInferiorMenu({ x = 54, y = 1749, ancho = 1085, alAtras, alInicio, alCerrarSesion,
  atrasHabilitado = true, inicioActivo = true, cerrarSesionVisible = false, personalizada = false } = {}) {
  const el = pos(h('div', { class: 'mn-barra' }), x, y, ancho, 139);
  const fx = ancho / 1128;
  const contenido = pos(h('div', { class: 'mn-barra-contenido' }), 0, 0, ancho, 139);
  if (!personalizada) {
    el.append(pos(h('div', { class: 'mn-barra-div' }), 313 * fx - 1, 19, 2, 106),
      pos(h('div', { class: 'mn-barra-div' }), 800 * fx - 1, 19, 2, 106));
    const celda = (x0, w, icono, color, op, habilitado) => {
      const c = pos(h('div', { class: 'mn-celda' }), x0, 0, w, 139);
      c.style.opacity = habilitado ? '' : '0.4';
      c.append(pos(mascara(`assets/iconos/color/${icono}.svg`, 70, color), w / 2 - 35, 34.5));
      if (habilitado) c.addEventListener('click', op);
      return c;
    };
    el.append(celda(0, 313 * fx, 'back_icon', 'var(--c-icono-barra-menu)', () => alAtras?.(), atrasHabilitado));
    if (cerrarSesionVisible) el.append(celda(313 * fx, (800 - 313) * fx, 'logout_icon', 'var(--c-texto-negro)', () => alCerrarSesion?.(), true));
    el.append(celda(800 * fx, (1128 - 800) * fx, 'home_icon', 'var(--c-icono-barra-menu)', () => alInicio?.(), inicioActivo));
  }
  el.append(contenido);
  return { el, contenido, fx };
}
