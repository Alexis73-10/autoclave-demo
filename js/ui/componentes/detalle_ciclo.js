// DetalleCiclo (Componentes/DetalleCiclo.qml): fecha de inicio, programa, resultado y operador en una
// fila de cuatro campos y, debajo, la gráfica del ciclo. En la demo se añade «Ver tirilla».
import { h } from '../../core/dom.js';
import { t, idioma } from '../../core/i18n.js';
import { pos, textoResultado, colorResultado, sufijoFecha, numeroPrograma } from './menu_util.js';
import { crearGraficaMini } from './grafica_mini.js';
import { crearBotonPildora } from './boton_pildora.js';

const TX = { es: 'Ver tirilla', en: 'View ticket' };

/**
 * crearDetalleCiclo({ancho, alto, registro, alVerTirilla(registro)}) -> {el}
 * `registro`: ciclo del historial (js/sim/historial.js).
 */
export function crearDetalleCiclo({ ancho, alto, registro, alVerTirilla } = {}) {
  const el = pos(h('div', { class: 'mn-detalle' }), 0, 0, ancho, alto);
  const r = registro ?? {};
  const f = r.inicio ? sufijoFecha(r.inicio) : null;
  const util = ancho - 3 * 24;
  const campo = (rot, valor, w, color, detalle) => h('div', { class: 'mn-campo', style: { width: `${w}px` } },
    h('div', { class: 'mn-campo-rot', text: rot }),
    h('div', { class: 'mn-campo-val', text: valor, style: color ? { color } : {} }),
    detalle ? h('div', { class: 'mn-campo-det', text: detalle }) : null);
  const prog = r.numeroPrograma != null ? `${numeroPrograma(r.numeroPrograma)}${r.programaNombre ? ` · ${r.programaNombre}` : ''}` : '—';
  const detalleRes = r.resultado && r.resultado !== 'exitoso' ? (r.codigo ?? r.motivo ?? '') : '';
  const fila = pos(h('div', { class: 'mn-detalle-fila' },
    campo(t('menu.fecha_inicio'), f ? `${f.fecha}  ${f.hora}` : '—', util * 0.25),
    campo(t('menu.programa_dato'), prog, util * 0.37, 'var(--c-menu-naranja-texto)'),
    campo(t('menu.resultado_dato'), textoResultado(r.resultado), util * 0.2, colorResultado(r.resultado), detalleRes),
    campo(t('menu.operador'), r.operador || '—', util * 0.18)), 0, 0, ancho);
  el.append(fila);
  const boton = crearBotonPildora({ texto: TX[idioma()] ?? TX.es, primario: true, alPulsar: () => alVerTirilla?.(r) });
  pos(boton.el, ancho - parseFloat(boton.el.style.width), 116);
  el.append(boton.el);
  const g = crearGraficaMini({ ancho, alto: alto - 200, serie: r.serie ?? [] });
  pos(g.el, 0, 196);
  el.append(g.el);
  return { el };
}
