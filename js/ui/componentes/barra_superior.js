// BarraSuperior (Componentes/BarraSuperior.qml): barra transparente con el logo a la izquierda y el reloj
// y la fecha a la derecha. La usan Login, CambioClave y NuevoUsuario.
import { h } from '../../core/dom.js';
import { reloj, horaHM, fechaBarra } from './menu_util.js';
import { instalarPanelDemo } from './panel_demo.js';

/** crearBarraSuperior() -> {el, logo, destruir()} (el logo abre el panel oculto con 3 s de pulsación). */
export function crearBarraSuperior() {
  const logo = h('img', { class: 'mn-bs-logo mn-logo', src: 'assets/logo/logo-especifika-blanco.svg', alt: 'Especifika', draggable: 'false' });
  const hora = h('div', { class: 'mn-bs-hora' });
  const fecha = h('div', { class: 'mn-bs-fecha' });
  const el = h('div', { class: 'mn-barra-sup' }, logo, h('div', { class: 'mn-bs-reloj' }, hora, fecha));
  const detener = reloj((d) => { hora.textContent = horaHM(d); fecha.textContent = fechaBarra(d); });
  const quitar = instalarPanelDemo(logo);
  return { el, logo, destruir() { detener(); quitar?.(); } };
}
