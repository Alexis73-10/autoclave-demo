// PanelModal (Componentes/PanelModal.qml), interno del frente ciclo: velo (tocarlo
// cierra), tarjeta centrada de ancho W-96 y alto min(altoTarjeta, H-192), radio 28,
// título 36 Bold en (48, 40), divisor 2, zona y botón Cerrar azul 360x88 abajo.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { abrirModal } from '../../core/capas.js';

export function abrirPanelModal({ titulo = '', textoCerrar = t('acciones.cerrar'), altoTarjeta = 1300,
  contenido = null, alCerrar = null, ajustarAlto = false } = {}) {
  const zona = h('div', { class: 'fc-pm-zona' });
  const boton = h('button', { class: 'fc-pm-cerrar', text: textoCerrar });
  const tarjeta = h('div', { class: 'fc-pm-tarjeta fc-entrada' },
    h('div', { class: 'fc-pm-titulo', text: titulo }), h('div', { class: 'fc-pm-linea' }), zona, boton);
  tarjeta.style.height = ajustarAlto ? 'auto' : `${Math.min(altoTarjeta, 1920 - 192)}px`;
  if (ajustarAlto) tarjeta.style.maxHeight = `${Math.min(altoTarjeta, 1920 - 192)}px`;
  tarjeta.addEventListener('pointerdown', (e) => e.stopPropagation());
  if (typeof contenido === 'function') { const n = contenido(zona); if (n) zona.append(n); }
  else if (contenido) zona.append(contenido);
  const cerrar = abrirModal(tarjeta, { cerrarAlTocarVelo: true, alCerrar });
  boton.addEventListener('click', () => cerrar());
  return { el: tarjeta, zona, cerrar };
}
