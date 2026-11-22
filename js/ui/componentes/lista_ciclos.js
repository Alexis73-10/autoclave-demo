// ListaCiclos (Componentes/ListaCiclos.qml): encabezado de 56 y filas de 76 con las columnas
// Ciclo, Fecha, Hora, Programa y Resultado (u Operador). Seleccionable (chevron) y marcable (casillas).
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { pos, texto, textoResultado, colorResultado } from './menu_util.js';
import { mascara, ajustar } from './menu_iconos.js';

/**
 * crearListaCiclos({ancho, alto, seleccionable=false, marcable=false, conOperador=false, alElegir(fila), alMarcar(ids)})
 *   -> {el, fijar(filas), marcados() (Set de ids), vacia(texto)}
 * Una fila: {id, numero, fecha, hora, programa, programaNombre, resultado ('exitoso'|'fallo'|'cancelado'), operador}.
 */
export function crearListaCiclos({ ancho, alto, seleccionable = false, marcable = false, conOperador = false, alElegir, alMarcar } = {}) {
  const el = pos(h('div', { class: 'mn-lista-ciclos' }), 0, 0, ancho, alto);
  const casilla = marcable ? 84 : 0;
  const util = ancho - casilla;
  const frac = [0.13, 0.19, 0.12, 0.32, 0.24 - (seleccionable ? 0.05 : 0)];
  const xCol = (i) => casilla + frac.slice(0, i).reduce((a, b) => a + b, 0) * util;
  const wCol = (i) => frac[i] * util - 12;
  const marcados = new Set();
  let filas = [];

  const cabecera = pos(h('div', { class: 'mn-lc-cab' }), 0, 0, ancho, 56);
  const claves = ['col_ciclo', 'col_fecha', 'col_hora', 'col_programa', conOperador ? 'col_operador' : 'col_resultado'];
  const cajaTodas = marcable ? crearCasilla(() => { marcarTodas(!todas()); }) : null;
  if (cajaTodas) cabecera.append(cajaTodas.el);
  claves.forEach((k, i) => {
    const c = texto(t(`menu.${k}`), { x: xCol(i), w: wCol(i), y: 14, tam: 20, peso: 600, color: 'var(--c-texto-secundario)' });
    ajustar(c, wCol(i), 20, 600, 14);
    cabecera.append(c);
  });
  const cuerpo = pos(h('div', { class: 'mn-lc-cuerpo desplazable' }), 0, 56, ancho, alto - 56);
  const aviso = h('div', { class: 'mn-lc-aviso' });
  el.append(cabecera, cuerpo, aviso);

  function crearCasilla(alCambiar) {
    const caja = h('div', { class: 'mn-casilla' });
    const zona = pos(h('div', { class: 'mn-casilla-zona', onclick: (e) => { e.stopPropagation(); alCambiar(); } }, caja), 0, 0, 84, 76);
    caja.style.left = '8px';
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
  function refrescarMarcas() {
    cajaTodas?.marcar(todas());
    for (const [id, c] of casillas) c.marcar(marcados.has(id));
  }

  function fijar(nuevas) {
    filas = nuevas ?? [];
    for (const id of [...marcados]) if (!filas.some((f) => f.id === id)) marcados.delete(id);
    casillas.clear();
    cuerpo.replaceChildren();
    const contenedor = h('div', { class: 'mn-lc-filas', style: { height: `${filas.length * 76}px` } });
    filas.forEach((f, idx) => {
      const fila = pos(h('div', { class: `mn-lc-fila${seleccionable ? ' tocable' : ''}`,
        onclick: () => seleccionable && alElegir?.(f) }), 0, idx * 76, ancho, 76);
      const celda = (i, txt, o = {}) => {
        const c = texto(txt, { x: xCol(i), w: wCol(i), y: 26, tam: 24, interlineado: 24, ...o });
        c.style.whiteSpace = 'nowrap';
        fila.append(c);
        ajustar(c, wCol(i), 24, o.peso ?? 400, 14);
      };
      celda(0, f.numero, { peso: 700, color: 'var(--c-texto-primario)' });
      celda(1, f.fecha, { color: 'var(--c-texto-primario)' });
      celda(2, f.hora, { color: 'var(--c-texto-primario)' });
      celda(3, f.programa + (f.programaNombre && f.programaNombre !== '—' ? ` · ${f.programaNombre}` : ''), { color: 'var(--c-menu-naranja-texto)' });
      if (conOperador) celda(4, f.operador, { color: 'var(--c-texto-primario)' });
      else celda(4, textoResultado(f.resultado), { peso: 700, color: colorResultado(f.resultado) });
      if (seleccionable) {
        const k = 22 / 39.5;
        fila.append(pos(mascara('assets/iconos/mono/chevron_derecha.svg', 48 * k, 'var(--c-texto-primario)'),
          ancho - 8 - 35.2 * k, 38 - 24 * k));
      }
      if (marcable) {
        const c = crearCasilla(() => {
          if (marcados.has(f.id)) marcados.delete(f.id); else marcados.add(f.id);
          refrescarMarcas();
          alMarcar?.([...marcados]);
        });
        casillas.set(f.id, c);
        fila.append(c.el);
      }
      contenedor.append(fila);
    });
    cuerpo.append(contenedor);
    refrescarMarcas();
  }
  return {
    el, fijar, marcados: () => marcados,
    vacia(txt) { aviso.textContent = txt ?? ''; aviso.style.display = txt ? '' : 'none'; },
  };
}
