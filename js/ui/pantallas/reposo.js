// Reposo (Pantallas/Reposo.qml): logo, reloj gigante con contorno blanco y fecha. Tocar cualquier punto
// despierta y va a la pantalla principal. El logo abre el panel oculto de la demo con 3 s de pulsación.
import { h } from '../../core/dom.js';
import { irAPrincipal } from '../../app.js';
import { crearFondoApp } from '../componentes/fondo_app.js';
import { instalarPanelDemo } from '../componentes/panel_demo.js';
import { reloj, horaHM, fechaBarra } from '../componentes/menu_util.js';

export function crear() {
  const logo = h('img', { class: 'rps-logo', src: 'assets/logo/logo-especifika-blanco.svg', alt: '', draggable: 'false' });
  const hora = h('div', { class: 'rps-hora' });
  const fecha = h('div', { class: 'rps-fecha' });
  const el = h('div', { class: 'rps-raiz' }, crearFondoApp('reposo'), h('div', { class: 'rps-columna' }, logo, hora, fecha));
  const detener = reloj((d) => { hora.textContent = horaHM(d); fecha.textContent = fechaBarra(d); });
  let largo = false;
  let id = null;
  const quitarPanel = instalarPanelDemo(logo);
  logo.addEventListener('pointerdown', () => { largo = false; clearTimeout(id); id = setTimeout(() => { largo = true; }, 2900); });
  el.addEventListener('click', () => {
    if (largo) { largo = false; return; }   // la pulsación larga del logo no despierta el equipo
    irAPrincipal();
  });
  return { el, destruir() { detener(); quitarPanel?.(); clearTimeout(id); } };
}
