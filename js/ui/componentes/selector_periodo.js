// SelectorPeriodo (Componentes/SelectorPeriodo.qml): filtros en píldora y, debajo, flechas circulares
// con el rótulo del periodo en negrita.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { mascara } from './menu_iconos.js';

/**
 * crearSelectorPeriodo({conAnio=false, periodo='dia', rotulo='', esActual=true, alElegir(p), alMover(pasos)})
 *   -> {el, actualizar({periodo, rotulo, esActual})}   (ancho se acepta y se ignora)
 */
export function crearSelectorPeriodo({ conAnio = false, periodo = 'dia', rotulo = '', esActual = true, alElegir, alMover } = {}) {
  const filtros = conAnio
    ? [['dia', 'reportes.periodo_dia'], ['semana', 'reportes.periodo_semana'], ['mes', 'reportes.periodo_mes'], ['anio', 'reportes.periodo_anio']]
    : [['dia', 'menu.filtro_diario'], ['semana', 'menu.filtro_semanal'], ['mes', 'menu.filtro_mensual']];
  const botones = filtros.map(([p, clave]) => h('button', { class: 'mn-filtro', dataset: { p }, text: t(clave),
    onclick: () => alElegir?.(p) }));
  const fila = h('div', { class: 'mn-filtros' }, botones);
  const flecha = (atras, op) => {
    const ic = mascara('assets/iconos/mono/chevron_derecha.svg', null, 'var(--c-texto-primario)', 'mn-flecha-ico');
    if (atras) ic.style.transform = 'rotate(180deg)';
    return h('button', { class: 'mn-flecha', 'aria-label': atras ? '‹' : '›', onclick: op }, ic);
  };
  const anterior = flecha(true, () => alMover?.(-1));
  const siguiente = flecha(false, () => alMover?.(1));
  const rot = h('div', { class: 'mn-rotulo-periodo' });
  const nav = h('div', { class: 'mn-nav-periodo' }, anterior, rot, siguiente);
  const el = h('div', { class: 'mn-selector-periodo' }, fila, nav);
  const actualizar = (d) => {
    if (d.periodo != null) periodo = d.periodo;
    if (d.rotulo != null) rotulo = d.rotulo;
    if (d.esActual != null) esActual = d.esActual;
    for (const b of botones) b.classList.toggle('marcado', b.dataset.p === periodo);
    rot.textContent = rotulo;
    siguiente.classList.toggle('deshabilitado', esActual);
    siguiente.disabled = esActual;
  };
  actualizar({});
  return { el, actualizar };
}
