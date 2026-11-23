// ModalOperador (Componentes/ModalOperador.qml, T30-01): sin sesión y con
// operadores activos, el inicio del ciclo pide el operador. Tarjeta W-160 x 1300
// máx., título 36, divisor, cuerpo 28, lista de filas (mín. 96, radio 16, la marcada
// en seleccionSutil con borde 3 azul) y botones Cancelar / Iniciar ciclo (340x88).
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { abrirModal } from '../../core/capas.js';

/** abrirModalOperador({operadores:[{id, nombre}], alAceptar(operador), alCancelar}) -> { cerrar() } */
export function abrirModalOperador({ operadores = [], alAceptar = null, alCancelar = null } = {}) {
  let marcado = null;
  let accion = 'cancelar';
  const nota = h('div', { class: 'fc-mo-nota oculto', text: t('operador_ciclo.err_requerido') });
  const lista = h('div', { class: 'fc-mo-lista desplazable' });
  const bV = h('button', { class: 'fc-mc-volver' }, h('span', { text: t('operador_ciclo.cancelar') }));
  const bA = h('button', { class: 'fc-mc-accion', style: { background: 'var(--c-accion-primario)', color: 'var(--c-texto-sobre-accion)' } },
    h('span', { text: t('operador_ciclo.iniciar') }));
  const pintar = () => {
    lista.replaceChildren(...operadores.map((op) => {
      const fila = h('button', { class: `fc-mo-fila${marcado === op ? ' sel' : ''}`, text: op.nombre });
      fila.addEventListener('click', () => { marcado = op; nota.classList.add('oculto'); pintar(); });
      return fila;
    }));
    bA.classList.toggle('inactivo', !marcado);
  };
  pintar();
  const tarjeta = h('div', { class: 'fc-mc-tarjeta fc-mo-tarjeta fc-entrada' },
    h('div', { class: 'fc-mc-titulo', text: t('operador_ciclo.titulo') }), h('div', { class: 'fc-mc-linea' }),
    h('div', { class: 'fc-mo-cuerpo', text: t('operador_ciclo.cuerpo') }), nota, lista,
    h('div', { class: 'fc-mc-botones' }, bV, bA));
  tarjeta.addEventListener('pointerdown', (e) => e.stopPropagation());
  const cerrar = abrirModal(tarjeta, { cerrarAlTocarVelo: true,
    alCerrar: () => { if (accion === 'aceptar') alAceptar?.(marcado); else alCancelar?.(); } });
  bV.addEventListener('click', () => { accion = 'cancelar'; cerrar(); });
  bA.addEventListener('click', () => {
    if (!marcado) { nota.classList.remove('oculto'); return; }
    accion = 'aceptar'; cerrar();
  });
  return { cerrar: () => { accion = 'cancelar'; cerrar(); } };
}
