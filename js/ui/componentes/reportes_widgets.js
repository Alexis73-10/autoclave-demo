// Componentes de la pantalla Reportes (Componentes/TarjetaIndicador, GraficaDona, GraficaArea,
// ListaProgramasReporte, CalendarioEjecucion, MesMiniatura, PanelDiaCalendario, AnilloProgreso,
// ListaAlarmasPeriodo y ListaOperadores del software real). Reciben los datos ya calculados por
// reporte_calculo.js y solo dibujan.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { abrirModal } from '../../core/capas.js';
import { textoResultado, colorResultado } from './menu_util.js';
import { ajustar } from './menu_iconos.js';
import { ASPECTO, ORDEN_CONTEO } from './reporte_calculo.js';

const NS = 'http://www.w3.org/2000/svg';
export const s = (tag, a = {}, ...hijos) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(a)) e.setAttribute(k, v);
  hijos.forEach((x) => e.append(x));
  return e;
};

/** Sección de Reportes: tarjeta de radio 24 con borde 2 y título de 30 Bold. */
export function seccion(titulo, ...hijos) {
  return h('div', { class: `rp-seccion${titulo ? '' : ' sin-titulo'}` }, titulo ? h('div', { class: 'rp-sec-titulo', text: titulo }) : null, ...hijos);
}

// ── tarjeta de indicador ─────────────────────────────────────────────────
export function tarjetaIndicador(d) {
  const c = d.comparacion;
  const flecha = c.flecha === 'ninguna' ? null
    : c.flecha === 'igual' ? h('span', { class: 'rp-ind-igual', style: { background: c.color } })
      : h('span', { class: `rp-ind-flecha ${c.flecha}`, style: { borderTopColor: c.flecha === 'abajo' ? c.color : 'transparent', borderBottomColor: c.flecha === 'arriba' ? c.color : 'transparent' } });
  const comp = h('div', { class: 'rp-ind-comp' }, c.sinDatos ? null : flecha,
    h('span', { class: c.sinDatos ? 'sin-datos' : '', text: c.sinDatos ? c.textoSinDatos : c.texto, style: { color: c.sinDatos ? 'var(--c-texto-guia)' : c.color } }));
  const el = h('div', { class: 'rp-indicador', 'data-clave': d.clave },
    h('div', { class: 'rp-ind-titulo', text: d.titulo }), h('div', { class: 'rp-ind-valor', text: d.valor }), comp,
    h('div', { class: 'rp-ind-pie', text: d.pie }));
  if (d.mini?.length > 1) {
    const w = 100, hh = 44;
    const pts = d.mini.map((p) => [p.x * w, hh - p.y * hh]);
    const linea = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const area = `${linea} L${pts.at(-1)[0].toFixed(1)} ${hh} L${pts[0][0].toFixed(1)} ${hh} Z`;
    el.append(h('div', { class: 'rp-ind-mini' }, s('svg', { width: w, height: hh, viewBox: `0 0 ${w} ${hh}` },
      s('path', { d: area, fill: c.color, 'fill-opacity': 0.15 }),
      s('path', { d: linea, fill: 'none', stroke: c.color, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }))));
  }
  return el;
}

// ── dona ─────────────────────────────────────────────────────────────────
export function graficaDona(d, ancho) {
  const D = 220, G = 34, r = (D - G) / 2, C = 2 * Math.PI * r;
  const svg = s('svg', { width: D, height: D, viewBox: `0 0 ${D} ${D}`, class: 'rp-dona-svg' });
  svg.append(s('circle', { cx: D / 2, cy: D / 2, r, fill: 'none', 'stroke-width': G, stroke: d.vacia ? 'var(--c-borde-campo)' : 'var(--c-borde-divisor)' }));
  if (!d.vacia) {
    for (const p of d.porciones) {
      if (p.fraccion <= 0) continue;
      svg.append(s('circle', { cx: D / 2, cy: D / 2, r, fill: 'none', 'stroke-width': G, stroke: p.color,
        'stroke-dasharray': `${p.fraccion * C} ${C}`, 'stroke-dashoffset': -p.inicio * C, transform: `rotate(-90 ${D / 2} ${D / 2})` }));
    }
  }
  const centro = h('div', { class: `rp-dona-centro${d.vacia ? ' vacia' : ''}`, text: d.vacia ? d.textoVacio : d.centro });
  const zona = h('div', { class: 'rp-dona-zona' }, svg, centro);
  const filas = d.porciones.map((p) => h('div', { class: 'rp-dona-fila' },
    h('i', { style: { background: p.color } }), h('span', { class: 'rot', text: p.rotulo }),
    h('b', { text: String(p.cantidad) }), h('em', { text: d.vacia ? '' : p.porcentaje })));
  return h('div', { class: 'rp-dona', style: { width: `${ancho}px` } }, zona, h('div', { class: 'rp-dona-leyenda' }, filas));
}

// ── gráfica de área (ciclos por día) ─────────────────────────────────────
export function graficaArea(serie, ancho, alto = 380) {
  const el = h('div', { class: 'rp-area', style: { width: `${ancho}px`, height: `${alto}px` } });
  if (serie.vacia) { el.append(h('div', { class: 'rp-area-vacia', text: t('reportes.graf_vacia') })); return el; }
  const L = 56, R = ancho - 24, T = 24, B = alto - 52;
  const svg = s('svg', { width: ancho, height: alto, viewBox: `0 0 ${ancho} ${alto}` });
  for (const m of serie.ejeY.marcas) {
    const y = B - m.y * (B - T);
    svg.append(s('line', { x1: L, x2: R, y1: y, y2: y, stroke: m.valor === 0 ? 'var(--c-grafica-eje)' : 'var(--c-grafica-cuadricula)', 'stroke-width': 1.2 }));
    const tx = s('text', { x: L - 12, y: y + 7, 'text-anchor': 'end', class: 'rp-eje' }); tx.textContent = String(m.valor);
    svg.append(tx);
  }
  const px = (x) => L + x * (R - L);
  const py = (y) => B - y * (B - T);
  const pts = (clave) => serie.puntos.map((p) => [px(p.x), py(p[clave])]);
  const camino = (arr) => {   // curva suave (Catmull-Rom) acotada a la zona de trazado
    const f = (v) => v.toFixed(1);
    const cy = (v) => Math.min(B, Math.max(T, v));
    let d = `M${f(arr[0][0])} ${f(arr[0][1])}`;
    for (let i = 0; i < arr.length - 1; i++) {
      const p0 = arr[i - 1] ?? arr[i], p1 = arr[i], p2 = arr[i + 1], p3 = arr[i + 2] ?? p2;
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(cy(p1[1] + (p2[1] - p0[1]) / 6))} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(cy(p2[1] - (p3[1] - p1[1]) / 6))} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  };
  const tot = pts('yTotal'), comp = pts('yCompletados');
  svg.append(
    s('path', { d: `${camino(tot)} L${tot.at(-1)[0].toFixed(1)} ${B} L${tot[0][0].toFixed(1)} ${B} Z`, fill: 'var(--c-accion-primario)', 'fill-opacity': 0.14 }),
    s('path', { d: camino(tot), fill: 'none', stroke: 'var(--c-accion-primario)', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
    s('path', { d: camino(comp), fill: 'none', stroke: 'var(--c-menu-verde)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  serie.puntos.forEach((p, i) => {
    if (p.conFallo) svg.append(s('circle', { cx: tot[i][0], cy: tot[i][1], r: 8, fill: 'var(--c-peligro-texto)', stroke: 'var(--c-fondo-tarjeta)', 'stroke-width': 2 }));
  });
  for (const m of serie.ejeX) {
    const tx = s('text', { x: px(m.x), y: B + 34, 'text-anchor': 'middle', class: 'rp-eje' }); tx.textContent = m.texto;
    svg.append(tx);
  }
  el.append(svg);
  return el;
}

// ── por programa ─────────────────────────────────────────────────────────
export function listaProgramas(programas) {
  if (!programas.length) return h('div', { class: 'rp-vacio', text: t('reportes.prog_vacia') });
  return h('div', { class: 'rp-programas' }, programas.map((p) => h('div', { class: 'rp-prog' },
    h('div', { class: 'rp-prog-num', text: p.numero }),
    h('div', { class: 'rp-prog-nom', text: p.nombre }),
    h('div', { class: 'rp-prog-det', text: p.detalle }),
    h('div', { class: 'rp-prog-pct', text: `${p.exitoPct}%  ·  ${p.total}`, style: { color: p.color } }),
    h('div', { class: 'rp-prog-barra' }, h('div', { style: { width: `${Math.max(0, Math.min(1, p.ancho)) * 100}%`, background: p.color } })))));
}

// ── anillo de progreso (mantenimiento) ───────────────────────────────────
export function anilloProgreso({ fraccion, color, texto, titulo, diametro = 200, grosor = 18 }) {
  const r = (diametro - grosor) / 2, C = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraccion || 0));
  const svg = s('svg', { width: diametro, height: diametro, viewBox: `0 0 ${diametro} ${diametro}` },
    s('circle', { cx: diametro / 2, cy: diametro / 2, r, fill: 'none', stroke: 'var(--c-fondo-pista)', 'stroke-width': grosor }),
    s('circle', { cx: diametro / 2, cy: diametro / 2, r, fill: 'none', stroke: color, 'stroke-width': grosor, 'stroke-linecap': 'round',
      'stroke-dasharray': `${f * C} ${C}`, transform: `rotate(-90 ${diametro / 2} ${diametro / 2})` }));
  return h('div', { class: 'rp-anillo' },
    h('div', { class: 'rp-anillo-zona', style: { width: `${diametro}px`, height: `${diametro}px` } }, svg, h('div', { class: 'rp-anillo-txt', text: texto })),
    h('div', { class: 'rp-anillo-tit', text: titulo }));
}

// ── alarmas del periodo ──────────────────────────────────────────────────
function filaAlarma(g, alElegir) {
  return h('div', { class: 'rp-alarma', onclick: () => alElegir?.(g) },
    h('span', { class: 'rp-al-barra', style: { background: g.color } }),
    h('div', { class: 'rp-al-tit', text: g.titulo }),
    h('div', { class: 'rp-al-cod', text: `${g.codigoVisible}  ·  ${g.nivelRotulo}` }),
    h('div', { class: 'rp-al-cant', text: String(g.cantidad) }));
}

export function listaAlarmas(a, alElegir) {
  if (a.vacia) return h('div', { class: 'rp-vacio', text: t('reportes.alarmas_vacia') });
  const leyenda = h('div', { class: 'rp-al-leyenda' }, a.niveles.filter((n) => n.cantidad > 0).map((n) =>
    h('span', {}, h('i', { style: { background: n.color } }), String(n.cantidad))));
  const barra = h('div', { class: 'rp-al-stack' }, a.niveles.filter((n) => n.fraccion > 0).map((n) => h('div', { style: { width: `${n.fraccion * 100}%`, background: n.color } })));
  const cuerpo = h('div', { class: 'rp-alarmas' },
    h('div', { class: 'rp-al-total' }, h('b', { text: String(a.total) }), leyenda), barra,
    a.filas.map((g) => filaAlarma(g, alElegir)));
  if (a.hayMas) {
    cuerpo.append(h('button', { class: 'rp-al-ver', text: t('reportes.alarmas_ver_todas'), onclick: () => {
      const cerrar = h('button', { class: 'vm-cerrar', 'aria-label': 'Cerrar' }, h('span', { class: 'vm-aro' }), h('span', { class: 'vm-x a' }), h('span', { class: 'vm-x b' }));
      const lista = h('div', { class: 'rp-al-modal-lista desplazable' }, a.todas.map((g) => filaAlarma(g, alElegir)));
      const tarjeta = h('div', { class: 'rp-al-modal' }, h('div', { class: 'rp-al-modal-tit', text: t('reportes.lista_alarmas_titulo') }), cerrar, lista);
      const raiz = h('div', { class: 'rp-al-modal-raiz' }, tarjeta);
      const cerrarModal = abrirModal(raiz);
      raiz.addEventListener('pointerdown', (e) => { if (e.target === raiz) cerrarModal(); });
      cerrar.addEventListener('click', () => cerrarModal());
    } }));
  }
  return cuerpo;
}

// ── operadores ───────────────────────────────────────────────────────────
export function listaOperadores(o, anchoNombre = 161) {
  if (o.vacia) return h('div', { class: 'rp-vacio', text: t('reportes.oper_vacia') });
  const nombre = (txt) => { const n = h('div', { class: 'rp-oper-nom', text: txt }); ajustar(n, anchoNombre, 24, 600, 14); return n; };
  const cuerpo = h('div', { class: 'rp-operadores' }, o.filas.map((f) => h('div', { class: 'rp-oper' },
    h('div', { class: `rp-oper-av${f.sinOperador ? ' sin' : ''}`, text: f.iniciales }),
    nombre(f.nombre), h('div', { class: 'rp-oper-cant', text: String(f.cantidad) }),
    h('div', { class: 'rp-oper-barra' }, h('div', { style: { width: `${f.fraccion * 100}%` } })))));
  if (o.otros) cuerpo.append(h('div', { class: 'rp-oper otros' }, nombre(o.otros.texto), h('div', { class: 'rp-oper-cant', text: String(o.otros.cantidad) })));
  return cuerpo;
}

// ── calendario de ejecución ──────────────────────────────────────────────
/** Círculo de un día (diámetro d) según su aspecto. */
export function circuloDia(c, d, { elegido = false } = {}) {
  const el = h('div', { class: `rp-dia forma-${c.forma}${elegido ? ' elegido' : ''}`, style: { width: `${d}px`, height: `${d}px` } });
  const st = el.style;
  if (c.relleno) st.background = c.relleno;
  st.borderWidth = `${Math.max(1, (c.grosor || 1) * 2)}px`;
  st.borderColor = c.borde;
  st.borderStyle = c.punteado ? 'dashed' : 'solid';
  if (c.dia != null) {
    const n = h('span', { text: String(c.dia), style: { fontSize: `${Math.max(1, Math.round(d * 0.38))}px` } });
    if (c.forma === 'solido' || c.forma === 'azul') n.style.color = 'var(--c-fondo-tarjeta)';
    el.append(n);
  }
  if (c.punto) el.append(h('i', { class: 'rp-dia-punto', style: { background: c.punto, width: `${d * 0.28}px`, height: `${d * 0.28}px`, right: `${-d * 0.02}px`, top: `${d * 0.02}px` } }));
  if (c.forma === 'deshabilitado') el.style.opacity = 0.4;
  return el;
}

/**
 * calendarioEjecucion(cal, ancho, {diaElegido, alDia(fecha), alMes(mesIdx), alPrograma(num), alVerAnio, puedeVerAnio})
 */
export function calendarioEjecucion(cal, ancho, { diaElegido = null, alDia, alMes, alPrograma, alVerAnio, puedeVerAnio = false } = {}) {
  const el = h('div', { class: 'rp-calendario', style: { width: `${ancho}px` } });
  const sel = cal.programas.find((p) => p.numero === cal.programa);
  const boton = h('button', { class: 'rp-cal-prog', onclick: () => {
    const lista = h('div', { class: 'rp-cal-lista' }, cal.programas.map((p) => h('button', { class: `rp-cal-op${p.numero === cal.programa ? ' marcado' : ''}`, text: p.etiqueta,
      onclick: () => { cerrar(); alPrograma?.(p.numero); } })));
    const raiz = h('div', { class: 'rp-al-modal-raiz' }, lista);
    const cerrar = abrirModal(raiz);
    raiz.addEventListener('pointerdown', (e) => { if (e.target === raiz) cerrar(); });
  } }, h('span', { text: sel?.etiqueta ?? '—' }), h('b', { text: '▾' }));
  const cab = h('div', { class: 'rp-cal-cab' },
    h('div', { class: 'rp-cal-tit' }, h('div', { class: 'tit', text: t('reportes.cal_titulo') }), h('div', { class: 'sub', text: cal.titulo }),
      cal.puedeVerAnio ? h('button', { class: 'rp-cal-anio', text: t('reportes.cal_ver_anio'), onclick: () => alVerAnio?.() }) : null),
    cal.sinProgramas ? null : h('div', { class: 'rp-cal-selector' }, boton));
  el.append(cab);
  if (cal.sinProgramas) { el.append(h('div', { class: 'rp-vacio', text: cal.textoSinProgramas })); return el; }
  el.append(h('div', { class: 'rp-cal-chips' }, cal.conteo.map((c) => h('div', { class: 'rp-cal-chip' },
    circuloDia({ ...c, dia: null }, 32), h('b', { text: String(c.cantidad) }), h('span', { text: c.rotulo })))));
  if (cal.vista === 'anio') {
    const ancho3 = Math.floor((ancho - 14 * 2) / 3);
    el.append(h('div', { class: 'rp-meses', style: { gridTemplateColumns: `repeat(3, ${ancho3}px)` } }, cal.meses.map((m) => {
      const lado = Math.floor((ancho3 - 32) / 7);
      const mini = h('div', { class: `rp-mes${m.habilitado ? '' : ' deshabilitado'}`, onclick: () => m.habilitado && alMes?.(m.mes) },
        h('div', { class: 'rp-mes-nom', text: m.nombre }),
        h('div', { class: 'rp-mes-grid', style: { gridTemplateColumns: `repeat(7, ${lado}px)` } },
          m.semanas.flat().map((c) => (c.vacia ? h('div', { style: { width: `${lado}px`, height: `${lado}px` } })
            : h('div', { class: 'rp-mes-celda', style: { width: `${lado}px`, height: `${lado}px` } }, circuloDia(c, Math.max(8, lado - 4)))))),
        h('div', { class: 'rp-mes-res', text: m.resumen }));
      return mini;
    })));
  } else {
    const celda = Math.floor(ancho / 7);
    const dias = h('div', { class: 'rp-cal-diassem' }, cal.diasSemana.map((d) => h('span', { text: d, style: { width: `${celda}px` } })));
    const grid = h('div', { class: 'rp-cal-grid', style: { gridTemplateColumns: `repeat(7, ${celda}px)` } },
      cal.semanas.flat().map((c) => {
        if (c.vacia) return h('div', { style: { width: `${celda}px`, height: `${celda}px` } });
        const elegido = diaElegido && diaElegido === `${c.fecha.getFullYear()}-${c.fecha.getMonth()}-${c.fecha.getDate()}`;
        const caja = h('div', { class: `rp-cal-celda${c.enPeriodo ? '' : ' atenuada'}`, style: { width: `${celda}px`, height: `${celda}px` },
          onclick: () => c.tocable && alDia?.(c.fecha) }, circuloDia(c, celda - 14, { elegido }));
        return caja;
      }));
    el.append(dias, grid);
  }
  el.append(h('div', { class: 'rp-cal-leyenda-estados' }, ORDEN_CONTEO.map((e) => h('span', {},
    circuloDia({ ...ASPECTO[e], dia: null }, 28), t(`reportes.estado_${e}`)))));
  el.append(h('div', { class: 'rp-cal-leyenda', text: cal.leyenda }));
  return el;
}

/** Panel del día seleccionado (o la invitación a tocar un día). */
export function panelDiaCalendario(panel, textoToque, alCiclo) {
  const el = h('div', { class: 'rp-panel-dia desplazable' });
  if (!panel) { el.append(h('div', { class: 'rp-panel-vacio', text: textoToque })); return el; }
  el.append(h('div', { class: 'rp-pd-tit', text: panel.titulo }),
    h('div', { class: 'rp-pd-estado' }, circuloDia({ ...panel, dia: null }, 44), h('b', { text: panel.estadoRotulo })),
    h('div', { class: 'rp-pd-expl', text: panel.explicacion }), h('div', { class: 'rp-pd-linea' }));
  if (!panel.intentos.length) { el.append(h('div', { class: 'rp-pd-expl', text: t('reportes.cal_sin_intentos') })); return el; }
  for (const c of panel.intentos) {
    const d = new Date(c.inicio);
    const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    el.append(h('div', { class: 'rp-pd-fila', onclick: () => alCiclo?.(c) },
      h('div', { class: 'izq' }, h('b', { text: `${c.numero} · ${hora}` }), h('span', { text: c.operador || '—' })),
      h('div', { class: 'der' }, h('b', { text: textoResultado(c.resultado), style: { color: colorResultado(c.resultado) } }),
        h('span', { text: c.resultado !== 'exitoso' ? (c.motivo ?? c.codigo ?? '') : '' }))));
  }
  return el;
}

