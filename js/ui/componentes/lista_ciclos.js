// ListaCiclos (Componentes/ListaCiclos.qml): encabezado y filas con las columnas Ciclo, Fecha, Hora,
// Programa y Resultado (u Operador). Seleccionable (chevron) y marcable (casillas). Rejilla fluida: en
// celular vertical la hora va debajo de la fecha. La lista llena su contenedor y el cuerpo se desplaza.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { textoResultado, colorResultado } from './menu_util.js';
import { mascara } from './menu_iconos.js';

/**
 * crearListaCiclos({seleccionable=false, marcable=false, conOperador=false, alElegir(fila), alMarcar(ids)})
 *   -> {el, fijar(filas), marcados() (Set de ids), vacia(texto), marcarElegida(id)}
 * Una fila: {id, numero, fecha, hora, programa, programaNombre, resultado ('exitoso'|'fallo'|'cancelado'), operador}.
 * (ancho y alto se aceptan y se ignoran.)
 */
export function crearListaCiclos({ seleccionable = false, marcable = false, conOperador = false, alElegir, alMarcar } = {}) {
  const clase = `mn-lista-ciclos${marcable ? ' marcable' : ''}${seleccionable ? ' seleccionable' : ''}`;
  const el = h('div', { class: clase });
  const marcados = new Set();
  let filas = [];
  let elegida = null;

  const claves = ['col_ciclo', 'col_fecha', 'col_hora', 'col_programa', conOperador ? 'col_operador' : 'col_resultado'];
  const cajaTodas = marcable ? crearCasilla(() => { marcarTodas(!todas()); }, t('menu.seleccionados')) : null;
  const cabecera = h('div', { class: 'mn-lc-cab mn-lc-rejilla' },
    marcable ? cajaTodas.el : null,
    claves.map((k, i) => h('span', { class: `mn-lc-c c${i}`, text: t(`menu.${k}`) })),
    seleccionable ? h('span', { class: 'mn-lc-chev' }) : null);
  const cuerpo = h('div', { class: 'mn-lc-cuerpo desplazable' });
  const aviso = h('div', { class: 'mn-lc-aviso' });
  el.append(cabecera, cuerpo, aviso);

  function crearCasilla(alCambiar, etiqueta = '') {
    const caja = h('span', { class: 'mn-casilla' });
    const zona = h('button', { class: 'mn-casilla-zona', 'aria-label': etiqueta || 'Marcar', onclick: (e) => { e.stopPropagation(); alCambiar(); } }, caja);
    return { el: zona, marcar(v) { caja.classList.toggle('marcada', v); caja.textContent = v ? '✓' : ''; } };
  }
  const todas = () => filas.length > 0 && filas.every((f) => marcados.has(f.id));
  function marcarTodas(v) {
    marcados.clear();
    if (v) filas.forEach((f) => marcados.add(f.id));
    refrescarMarcas();
    alMarcar?.([...marcados]);
  }
  const casillas = new Map();
  const nodosFila = new Map();
  function refrescarMarcas() {
    cajaTodas?.marcar(todas());
    for (const [id, c] of casillas) c.marcar(marcados.has(id));
  }

  function fijar(nuevas) {
    filas = nuevas ?? [];
    for (const id of [...marcados]) if (!filas.some((f) => f.id === id)) marcados.delete(id);
    casillas.clear();
    nodosFila.clear();
    cuerpo.replaceChildren();
    for (const f of filas) {
      const fila = h('div', { class: `mn-lc-fila mn-lc-rejilla${seleccionable ? ' tocable' : ''}`,
        role: seleccionable ? 'button' : null, onclick: () => seleccionable && alElegir?.(f) });
      if (marcable) {
        const c = crearCasilla(() => {
          if (marcados.has(f.id)) marcados.delete(f.id); else marcados.add(f.id);
          refrescarMarcas();
          alMarcar?.([...marcados]);
        });
        casillas.set(f.id, c);
        fila.append(c.el);
      }
      const prog = f.programa + (f.programaNombre && f.programaNombre !== '—' ? ` · ${f.programaNombre}` : '');
      fila.append(
        h('span', { class: 'mn-lc-c c0 num', text: String(f.numero ?? '') }),
        h('span', { class: 'mn-lc-c c1' }, h('span', { text: f.fecha }), h('span', { class: 'mn-lc-hora-sub', text: f.hora })),
        h('span', { class: 'mn-lc-c c2', text: f.hora }),
        h('span', { class: 'mn-lc-c c3 prog', text: prog }),
        conOperador
          ? h('span', { class: 'mn-lc-c c4', text: f.operador })
          : h('span', { class: 'mn-lc-c c4 res', text: textoResultado(f.resultado), style: { color: colorResultado(f.resultado) } }));
      if (seleccionable) fila.append(h('span', { class: 'mn-lc-chev' }, mascara('assets/iconos/mono/chevron_derecha.svg', null, 'var(--c-texto-primario)', 'mn-lc-chev-ico')));
      if (f.id === elegida) fila.classList.add('elegida');
      nodosFila.set(f.id, fila);
      cuerpo.append(fila);
    }
    refrescarMarcas();
  }
  return {
    el, fijar, marcados: () => marcados,
    vacia(txt) { aviso.textContent = txt ?? ''; aviso.style.display = txt ? '' : 'none'; },
    marcarElegida(id) {
      elegida = id ?? null;
      for (const [i, n] of nodosFila) n.classList.toggle('elegida', i === elegida);
    },
  };
}
