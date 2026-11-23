// BarraInferiorMenu (Componentes/BarraInferiorMenu.qml): tarjeta con tres celdas (Atrás | Cerrar sesión |
// Inicio) en proporción 313 : 487 : 328 y divisores entre celdas. Alto var(--alto-barra-inferior).
import { h } from '../../core/dom.js';
import { mascara } from './menu_iconos.js';

/**
 * Celda de la barra: botón con icono (assets/iconos/color/<icono>.svg pintado con `color`) y rótulo
 * opcional. vacia=true deja el hueco sin control.
 */
export function celdaBarra({ icono, color = 'var(--c-icono-barra-menu)', rotulo = '', alPulsar, habilitado = true, vacia = false, etiqueta = '' } = {}) {
  if (vacia) return h('div', { class: 'mn-celda vacia' });
  const c = h('button', { class: `mn-celda${rotulo ? ' con-rotulo' : ''}`, 'aria-label': etiqueta || rotulo || icono });
  c.append(mascara(`assets/iconos/color/${icono}.svg`, null, color, 'mn-celda-ico'));
  if (rotulo) c.append(h('span', { class: 'mn-celda-rot', text: rotulo }));
  if (!habilitado) { c.disabled = true; c.classList.add('deshabilitada'); }
  c.addEventListener('click', () => { if (!c.disabled) alPulsar?.(); });
  return c;
}

/**
 * crearBarraInferiorMenu({alAtras, alInicio, alCerrarSesion, atrasHabilitado=true, inicioActivo=true,
 *   cerrarSesionVisible=false, personalizada=false}) -> {el, contenido, fx}
 * `personalizada` deja la barra vacía: quien llama agrega tres celdas (celdaBarra) a `contenido`.
 * (x, y, ancho se aceptan por compatibilidad y se ignoran: la barra ocupa el ancho de su contenedor.)
 */
export function crearBarraInferiorMenu({ alAtras, alInicio, alCerrarSesion, atrasHabilitado = true, inicioActivo = true,
  cerrarSesionVisible = false, personalizada = false } = {}) {
  const el = h('div', { class: 'mn-barra' });
  if (!personalizada) {
    el.append(
      celdaBarra({ icono: 'back_icon', etiqueta: 'Atrás', alPulsar: () => alAtras?.(), habilitado: atrasHabilitado }),
      cerrarSesionVisible
        ? celdaBarra({ icono: 'logout_icon', color: 'var(--c-texto-negro)', etiqueta: 'Cerrar sesión', alPulsar: () => alCerrarSesion?.() })
        : celdaBarra({ vacia: true }),
      celdaBarra({ icono: 'home_icon', etiqueta: 'Inicio', alPulsar: () => alInicio?.(), habilitado: inicioActivo }));
  }
  return { el, contenido: el, fx: 1 };
}
