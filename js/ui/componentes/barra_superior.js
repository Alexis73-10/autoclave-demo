// BarraSuperior (Componentes/BarraSuperior.qml): alto 176 transparente con el logo a la izquierda
// (245 de ancho, margen 24) y el reloj y la fecha a la derecha. La usan Login, CambioClave y NuevoUsuario.
import { h } from '../../core/dom.js';
import { pos, reloj, horaHM, fechaBarra } from './menu_util.js';
import { instalarPanelDemo } from './panel_demo.js';

/** crearBarraSuperior() -> {el, logo, destruir()} (el logo abre el panel oculto con 3 s de pulsación). */
export function crearBarraSuperior() {
  const el = pos(h('div', { class: 'mn-barra-sup' }), 0, 0, 1200, 176);
  const alto = 245 * 446 / 1666;
  const logo = h('img', { src: 'assets/logo/logo-especifika-blanco.svg', alt: '', draggable: 'false' });
  pos(logo, 24, 88 - alto / 2, 245, alto);
  const hora = h('div', { class: 'mn-bs-hora' });
  const fecha = h('div', { class: 'mn-bs-fecha' });
  el.append(logo, h('div', { class: 'mn-bs-reloj' }, hora, fecha));
  const detener = reloj((d) => { hora.textContent = horaHM(d); fecha.textContent = fechaBarra(d); });
  const quitar = instalarPanelDemo(logo);
  return { el, logo, destruir() { detener(); quitar?.(); } };
}
