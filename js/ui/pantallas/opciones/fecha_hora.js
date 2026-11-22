// Opciones › Fecha y hora (OpcionesFechaHora.qml, solo lectura): hora grande, fecha, zona e instalación.
import { h } from '../../../core/dom.js';
import { t, hora } from '../../../core/i18n.js';
import { leer } from '../../../core/almacen.js';
import { fechaIso } from './_comun.js';

export function crear() {
  const grande = h('div', { class: 'op-hora-grande' });
  const iso = h('div', { class: 'op-kv-valor' });
  const fila = (rotulo, valor) => h('div', { class: 'op-kv' }, h('div', { class: 'op-kv-rotulo', text: rotulo }), valor);
  const instalacion = leer('op_instalacion', null) ?? (() => { const d = Date.now() - 120 * 86400000; return d; })();
  const el = h('div', { class: 'op-fh' },
    h('div', { class: 'op-hora-caja' }, grande),
    fila(t('fecha_hora.rotulo_fecha_iso'), iso),
    fila(t('fecha_hora.rotulo_zona'), h('div', { class: 'op-kv-valor', text: (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC').replace('_', ' ') })),
    fila(t('fecha_hora.rotulo_instalacion'), h('div', { class: 'op-kv-valor', text: fechaIso(instalacion) })),
    fila(t('fecha_hora.rotulo_fuente'), h('div', { class: 'op-kv-valor', text: t('fecha_hora.fuente_pc') })),
    h('div', { class: 'op-nota', text: t('fecha_hora.explicacion') }));
  function pintar() { const n = Date.now(); grande.textContent = hora(n, true); iso.textContent = fechaIso(n); }
  pintar();
  const id = setInterval(pintar, 1000);
  return { el, destruir() { clearInterval(id); } };
}
