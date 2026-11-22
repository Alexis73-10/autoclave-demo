// EncabezadoMenu (Componentes/EncabezadoMenu.qml): logo, hora y fecha centradas, campana con insignia
// y engranaje opcional. Alto 177 sobre el fondo de la aplicación.
import { h } from '../../core/dom.js';
import { on } from '../../core/eventos.js';
import { sim } from '../../sim/motor.js';
import { aviso } from '../../core/capas.js';
import { t } from '../../core/i18n.js';
import { pos, texto, reloj, horaHM, fechaBarra } from './menu_util.js';
import { iconoCaja } from './menu_iconos.js';
import { instalarPanelDemo } from './panel_demo.js';

let panelNotif = null;
try { panelNotif = await import('./panel_notificaciones.js'); } catch { panelNotif = null; }

/** Abre el cuadro de la campana (PanelNotificaciones del frente ciclo). */
export function abrirCampana() {
  if (panelNotif?.abrirPanelNotificaciones) return panelNotif.abrirPanelNotificaciones();
  aviso(t('notificaciones.grupo_alarmas'));
  return null;
}

/**
 * crearEncabezadoMenu({conEngranaje=false, alCampana, alEngranaje}) -> {el, logo, destruir()}
 * alCampana por defecto abre el panel de notificaciones. El logo abre el panel oculto con 3 s de pulsación.
 */
export function crearEncabezadoMenu({ conEngranaje = false, alCampana = null, alEngranaje = null } = {}) {
  const el = pos(h('div', { class: 'mn-encabezado' }), 0, 0, 1200, 177);
  const logo = h('img', { src: 'assets/logo/logo-especifika-blanco.svg', alt: '', draggable: 'false' });
  pos(logo, 73, 57, 267, 267 * 42427 / 158611);
  const hora = texto('', { cx: 597.5, bl: 108, tam: 97, peso: 700, familia: 'var(--familia-reloj)', color: 'var(--c-texto-sobre-accion)', clase: 'mn-hora' });
  const fecha = texto('', { cx: 598, bl: 141, tam: 26, familia: 'var(--familia-reloj)', color: 'var(--c-texto-sobre-accion)', pre: true });
  const campana = iconoCaja('campana', [888, 64, 51, 57], [5.85, 4.0, 42.15, 44.0]);
  const insignia = pos(h('div', { class: 'mn-insignia oculto' }), 922, 50, 26, 25);
  el.append(logo, hora, fecha, campana, insignia);
  if (conEngranaje) el.append(iconoCaja('engranaje', [1043, 64, 57, 58], [4, 4, 44, 44]));
  el.append(pos(h('div', { class: 'mn-zona', onclick: () => (alCampana ?? abrirCampana)() }), 870, 40, 90, 95));
  if (conEngranaje) el.append(pos(h('div', { class: 'mn-zona', onclick: () => alEngranaje?.() }), 1020, 40, 100, 95));

  const detener = reloj((d) => { hora.textContent = horaHM(d); fecha.textContent = fechaBarra(d); });
  const pintarInsignia = (estado) => {
    let r = { conteo: (estado?.alarmas ?? []).length, urgente: false, parpadeo: false };
    try { if (panelNotif?.resumenNotificaciones) r = panelNotif.resumenNotificaciones(estado); } catch { /* conserva el conteo simple */ }
    insignia.classList.toggle('oculto', !(r.conteo > 0));
    insignia.classList.toggle('urgente', !!r.urgente);
    insignia.classList.toggle('parpadeo', !!r.parpadeo);
    const txt = String(r.conteo);
    if (insignia.textContent !== txt) insignia.textContent = txt;
  };
  pintarInsignia(sim.estado);
  const quitarSim = on('sim', pintarInsignia);
  const quitarPanel = instalarPanelDemo(logo);
  return { el, logo, destruir() { detener(); quitarSim(); quitarPanel?.(); } };
}
