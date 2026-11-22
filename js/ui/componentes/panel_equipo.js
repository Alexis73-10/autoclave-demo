// PanelEquipo (Componentes/PanelEquipo.qml): información del equipo. PanelModal de
// alto 1500; filas de 76 (rótulo 22 Medium gris a la izquierda, valor 26 SemiBold
// a la derecha, divisor 1). «Apagar equipo» (píldora roja) solo fuera de CICLO y
// donde se permita (la pantalla de ciclo lo oculta, AJ-01). En la demo no apaga.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { aviso } from '../../core/capas.js';
import { sim } from '../../sim/motor.js';
import { VERSION_DEMO } from '../../../version.js';
import { abrirPanelModal } from './_panel_modal.js';
import { abrirModalConfirmacion } from './modal_confirmacion.js';
import { EQUIPO_DEMO, loc } from './_ciclo_util.js';

function filas() {
  const e = sim.estado || {};
  const ult = e.ultimoCiclo;
  const dato = (v) => (v == null || v === '' ? t('sistema.sin_lectura') : String(v));
  return [
    ['modelo', EQUIPO_DEMO.modelo],
    ['serie', EQUIPO_DEMO.serie],
    ['clase', t('equipo.clase_piso')],
    ['puertas', String(e.numPuertas ?? 2)],
    ['tipo_puerta', t('equipo.tipo_puerta_motorized')],
    ['puerta_pantalla', '1'],
    ['ciclos_realizados', dato(e.ciclosRealizados ?? ult?.numero)],
    ['ultimo_ciclo', ult ? `${String(ult.numero ?? '').padStart(2, '0')} · ${ult.programaNombre ?? ''}` : t('sistema.sin_lectura')],
    ['version_software', EQUIPO_DEMO.version || loc({ es: `Demo ${VERSION_DEMO} (simulada)`, en: `Demo ${VERSION_DEMO} (simulated)` })],
    ['version_modulo_es', null],
  ];
}

/** abrirPanelEquipo({permiteApagar = true}) -> { cerrar() } */
export function abrirPanelEquipo({ permiteApagar = true } = {}) {
  const lista = h('div', { class: 'fc-pe-lista desplazable' }, filas().map(([clave, valor]) =>
    h('div', { class: 'fc-pe-fila' },
      h('span', { class: 'fc-pe-rotulo', text: t(`equipo.${clave}`) }),
      h('span', { class: `fc-pe-valor${valor == null ? ' no-disp' : ''}`, text: valor ?? t('equipo.no_disponible') }))));
  const puede = permiteApagar && sim.estado?.maquina !== 'CICLO';
  const contenido = h('div', { class: 'fc-pe-contenido' }, lista);
  if (puede) {
    contenido.append(h('div', { class: 'fc-pe-apagar' }, h('button', {
      class: 'fc-pe-boton-apagar', text: t('equipo.apagar'),
      onclick: () => abrirModalConfirmacion({
        titulo: t('equipo.apagar'), cuerpo: t('equipo.apagar_pregunta'),
        textoVolver: t('acciones.cancelar'), textoAccion: t('equipo.apagar'), colorAccion: 'var(--c-peligro-fuerte)',
        alAceptar: () => aviso(loc({ es: 'Demostración: el equipo no se apaga.', en: 'Demo: the unit does not shut down.' })),
      }),
    })));
  }
  return abrirPanelModal({ titulo: t('equipo.titulo'), altoTarjeta: 1500, contenido });
}
