// EncabezadoMenu (Componentes/EncabezadoMenu.qml): logo, hora y fecha centradas, campana con insignia
// y engranaje opcional. Rejilla de tres columnas sobre el fondo de la aplicación.
import { h, iconoColor } from '../../core/dom.js';
import { on } from '../../core/eventos.js';
import { sim } from '../../sim/motor.js';
import { aviso } from '../../core/capas.js';
import { t } from '../../core/i18n.js';
import { reloj, horaHM, fechaBarra } from './menu_util.js';
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
  const logo = h('img', { class: 'mn-enc-logo mn-logo', src: 'assets/logo/logo-especifika-blanco.svg', alt: 'Especifika', draggable: 'false' });
  const hora = h('div', { class: 'mn-enc-hora' });
  const fecha = h('div', { class: 'mn-enc-fecha' });
  const insignia = h('span', { class: 'mn-insignia oculto' });
  const campana = h('button', { class: 'mn-enc-boton', 'aria-label': t('notificaciones.grupo_alarmas'),
    onclick: () => (alCampana ?? abrirCampana)() }, iconoColor('campana', { tam: null, clase: 'mn-enc-ico' }), insignia);
  const derecha = h('div', { class: 'mn-enc-der' }, campana);
  if (conEngranaje) {
    derecha.append(h('button', { class: 'mn-enc-boton', 'aria-label': 'Configuración', onclick: () => alEngranaje?.() },
      iconoColor('engranaje', { tam: null, clase: 'mn-enc-ico' })));
  }
  const el = h('div', { class: 'mn-encabezado' },
    h('div', { class: 'mn-enc-izq' }, logo),
    h('div', { class: 'mn-enc-reloj' }, hora, fecha),
    derecha);

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
