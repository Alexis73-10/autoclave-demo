// DetalleCiclo (Componentes/DetalleCiclo.qml): fecha de inicio, programa, resultado y operador en una
// fila de cuatro campos y, debajo, la gráfica del ciclo. En la demo se añade «Ver tirilla».
// Columna flex que llena su contenedor; la gráfica toma el alto que sobra (mínimo 12rem).
import { h } from '../../core/dom.js';
import { t, idioma } from '../../core/i18n.js';
import { textoResultado, colorResultado, sufijoFecha, numeroPrograma } from './menu_util.js';
import { crearGraficaMini } from './grafica_mini.js';
import { crearBotonPildora } from './boton_pildora.js';

const TX = { es: 'Ver tirilla', en: 'View ticket' };

/**
 * crearDetalleCiclo({registro, alVerTirilla(registro)}) -> {el, destruir()}
 * `registro`: ciclo del historial (js/sim/historial.js). (ancho y alto se aceptan y se ignoran.)
 */
export function crearDetalleCiclo({ registro, alVerTirilla } = {}) {
  const r = registro ?? {};
  const f = r.inicio ? sufijoFecha(r.inicio) : null;
  const campo = (rot, valor, clase, color, detalle) => h('div', { class: `mn-campo ${clase}` },
    h('div', { class: 'mn-campo-rot', text: rot }),
    h('div', { class: 'mn-campo-val', text: valor, style: color ? { color } : {} }),
    detalle ? h('div', { class: 'mn-campo-det', text: detalle }) : null);
  const prog = r.numeroPrograma != null ? `${numeroPrograma(r.numeroPrograma)}${r.programaNombre ? ` · ${r.programaNombre}` : ''}` : '—';
  const detalleRes = r.resultado && r.resultado !== 'exitoso' ? (r.codigo ?? r.motivo ?? '') : '';
  const fila = h('div', { class: 'mn-detalle-fila' },
    campo(t('menu.fecha_inicio'), f ? `${f.fecha}  ${f.hora}` : '—', 'f'),
    campo(t('menu.programa_dato'), prog, 'p', 'var(--c-menu-naranja-texto)'),
    campo(t('menu.resultado_dato'), textoResultado(r.resultado), 'r', colorResultado(r.resultado), detalleRes),
    campo(t('menu.operador'), r.operador || '—', 'o'));
  const boton = crearBotonPildora({ texto: TX[idioma()] ?? TX.es, primario: true, alPulsar: () => alVerTirilla?.(r) });
  const g = crearGraficaMini({ serie: r.serie ?? [] });
  const el = h('div', { class: 'mn-detalle' }, fila, h('div', { class: 'mn-detalle-acciones' }, boton.el), g.el);
  return { el, destruir() { g.destruir?.(); } };
}
