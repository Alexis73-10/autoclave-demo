// GraficaCiclo (Componentes/GraficaCiclo.qml): temperatura de cámara, de
// referencia (eje izquierdo, °C) y presión (eje derecho, kPa) contra el tiempo.
// Tarjeta 1129 x 794 base (radio 30): título, leyenda, botones «Tiempos» y pantalla
// completa (o CERRAR), separador, ejes con pasos limpios (grafica_ejes.js),
// divisores de fase punteados con su icono, curvas de 3 px (SVG), cursor con un
// dedo (globo con mm:ss y valores; se oculta a los 5 s), zoom con dos dedos (ZOM-03,
// factor por eje, punto medio desplaza), rueda = X y Ctrl+rueda = Y (pruebas en PC),
// límites ZOM-04, restablecimiento a los 20 s con 300 ms InOutQuad (ZOM-06) y lupa
// (56 x 56) que restablece al tocarla (ZOM-07).
//
// crearGraficaCiclo({ancho = 1129, alto = 794, pantallaCompleta = false, alPantallaCompleta, alCerrar})
//   -> {el, fijar({serie, tiempos, tiempoActualS}), restablecerAhora(), destruir()}
// serie = [{t (s), tc, tr, pc, fase}]; tiempos = fases del ciclo [{fase, estado, duracionS}].
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import * as Ejes from './grafica_ejes.js';
import { txt, caja, mascara, fMmSs } from './_ciclo_util.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const FASES = ['precalentamiento', 'vacio', 'calentamiento', 'esterilizacion', 'descompresion', 'secado'];
const normFase = (f) => { const s = String(f || '').toLowerCase(); return s === 'pre_vacio' || s === 'prevacio' ? 'vacio' : s; };
const etiquetaNum = (v) => { const r = Math.round(v * 100) / 100; return Number.isInteger(r) ? String(r) : r.toFixed(1); };

export function crearGraficaCiclo({ ancho = 1129, alto = 794, pantallaCompleta = false, alPantallaCompleta = null, alCerrar = null } = {}) {
  const dw = ancho - 1129;
  const extra = alto - 794;
  const yb = (v) => v + extra;
  const X0 = 93, X1 = 1035 + dw, YA = 279, YB = yb(709);
  const SERIES = [
    { clave: 'tc', nombre: t('ciclo.serie_temp_camara'), abrev: t('abrev.ciclo.serie_temp_camara'), color: 'var(--c-serie-grafica1)', eje: 'izq', unidad: t('unidades.temperatura') },
    { clave: 'tr', nombre: t('ciclo.serie_temp_ref'), abrev: t('abrev.ciclo.serie_temp_ref'), color: 'var(--c-serie-grafica2)', eje: 'izq', unidad: t('unidades.temperatura') },
    { clave: 'pc', nombre: t('ciclo.serie_presion'), abrev: t('abrev.ciclo.serie_presion'), color: 'var(--c-serie-grafica3)', eje: 'der', unidad: t('unidades.presion') },
  ];

  const el = h('div', { class: 'fc-grafica', style: { width: `${ancho}px`, height: `${alto}px` } });
  el.append(txt(t('ciclo.grafica'), { lx: 48, bl: 62, tam: 26, peso: 700, color: 'var(--c-grafica-titulo)' }));
  el.append(caja('div', 88, 92, 840 - 88 + dw, 26, 'fc-gr-leyenda'));
  el.lastChild.append(...SERIES.map((s) => h('span', { class: 'fc-gr-ley' }, h('i', { style: { background: s.color } }), s.nombre)));

  // botones
  let menuTiempos = null;
  if (!pantallaCompleta) {
    const bT = caja('button', 856 + dw, 43, 154, 58, 'fc-gr-boton fc-gr-tiempos');
    bT.append(h('span', { text: t('ciclo.tiempos') }), mascara('assets/iconos/color/chevron_abajo.svg', 14, 'var(--c-grafica-texto)', 'chev'));
    menuTiempos = caja('div', 856 + dw + 154 - 420, 43 + 58 + 8, 420, null, 'fc-gr-menu oculto');
    bT.addEventListener('click', (e) => { e.stopPropagation(); menuTiempos.classList.toggle('oculto'); bT.classList.toggle('abierto'); pintarTiempos(); });
    const bP = caja('button', 1037 + dw, 43, 58, 58, 'fc-gr-boton');
    bP.append(mascara('assets/iconos/mono/pantalla_completa.svg', 40, 'var(--c-grafica-titulo)'));
    bP.addEventListener('click', () => alPantallaCompleta?.());
    el.append(bT, bP);
  } else {
    const bC = caja('button', 885 + dw, 43, 210, 58, 'fc-gr-boton', {});
    bC.append(h('span', { text: t('acciones.cerrar') }));
    bC.addEventListener('click', () => alCerrar?.());
    el.append(bC);
  }
  el.append(caja('div', 61, 146, 1069 - 61 + dw, 2, '', { background: 'var(--c-grafica-separador)' }));
  el.append(txt(t('unidades.temperatura'), { lx: 21, bl: 246, tam: 20, color: 'var(--c-grafica-texto-eje)' }),
    txt(t('unidades.presion'), { lx: 1075 + dw, bl: 245, tam: 20, color: 'var(--c-grafica-texto-eje)' }));
  const capaEjes = h('div', { class: 'fc-gr-capa' });
  const capaFases = h('div', { class: 'fc-gr-capa' });
  el.append(capaFases, capaEjes);
  el.append(txt(t('ciclo.grafica_eje_tiempo'), { cx: 564 + dw / 2, bl: yb(779), tam: 20, color: 'var(--c-grafica-titulo-eje)' }));

  // curvas (SVG recortado al área de trazado)
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'fc-gr-svg');
  svg.setAttribute('width', ancho); svg.setAttribute('height', alto);
  const idClip = `fcClip${Math.random().toString(36).slice(2, 8)}`;
  svg.innerHTML = `<defs><clipPath id="${idClip}"><rect/></clipPath></defs><g clip-path="url(#${idClip})"></g>`;
  const rectClip = svg.querySelector('rect');
  const g = svg.querySelector('g');
  const lineas = SERIES.map((s) => {
    const pl = document.createElementNS(SVGNS, 'polyline');
    pl.setAttribute('fill', 'none'); pl.setAttribute('stroke-width', '3');
    pl.setAttribute('stroke-linejoin', 'round'); pl.setAttribute('stroke-linecap', 'round');
    pl.style.stroke = s.color;
    g.append(pl);
    return pl;
  });
  el.append(svg);

  // lupa
  const lupa = caja('button', 1059 - 6 - 56 + dw, YA + 6, 56, 56, 'fc-gr-lupa oculto');
  lupa.append(h('span', { class: 'fondo' }), mascara('assets/iconos/color/lupa.svg', 30, 'var(--c-grafica-zoom-icono)'));
  // cursor
  const cursor = h('div', { class: 'fc-gr-cursor oculto' });
  const lineaCursor = caja('div', 0, 272, 3, YB - 272 - 8, 'fc-gr-linea-cursor');
  const puntos = SERIES.map((s) => { const p = h('i', { class: 'fc-gr-punto' }); p.style.background = s.color; return p; });
  const globo = h('div', { class: 'fc-gr-globo' });
  const horaGlobo = h('div', { class: 'fc-gr-gh' });
  const filasGlobo = SERIES.map((s) => {
    const v = h('span', { class: 'v' });
    globo.append(h('div', { class: 'fc-gr-gf' }, h('i', { style: { background: s.color } }), h('span', { class: 'n', text: s.abrev !== `abrev.ciclo.serie_${s.clave}` ? s.abrev : s.nombre }), v));
    return v;
  });
  globo.prepend(horaGlobo);
  cursor.append(lineaCursor, ...puntos, globo);
  const toque = caja('div', 68, YA - 20, 1059 - 68 + dw, YB - (YA - 20), 'fc-gr-toque');
  el.append(lupa, cursor, toque);
  if (menuTiempos) el.append(menuTiempos);

  // ---- estado ----
  let datos = { t: [], tc: [], tr: [], pc: [] };
  let inicios = [];
  let tiempos = [];
  let tActualMin = 0;
  let completa = Ejes.vistaCompleta(Ejes.ejeX(0), Ejes.ejeY(0), Ejes.ejeY(0));
  let ventanaZoom = null, desde = null, avance = 0, tTrans = 0;
  let cursorMin = NaN;
  let huella = null;
  let tOcultar = 0, tRest = 0, rafTrans = 0, pendiente = false, rafPint = 0;
  const ventana = () => (desde ? Ejes.interpolarVentana(desde, completa, avance) : (ventanaZoom || completa));
  const conVentana = () => ventanaZoom !== null || desde !== null;
  const xDe = (tm) => { const v = ventana(); return X0 + (tm - v.t0) / ((v.t1 - v.t0) || 1) * (X1 - X0); };
  const yDe = (val, eje) => { const v = ventana(); const a = eje === 'der' ? v.yDer0 : v.yIzq0; const b = eje === 'der' ? v.yDer1 : v.yIzq1; return YB - (val - a) / ((b - a) || 1) * (YB - YA); };

  function pintarEjes() {
    const v = ventana();
    const cv = conVentana();
    const ez = Ejes.ejeX(tActualMin);
    const marcasX = cv ? Ejes.marcasVentana(v.t0, v.t1, Ejes.DIVISIONES_X) : Array.from({ length: Math.round(ez.maximo / ez.paso) + 1 }, (_, i) => i * ez.paso);
    const ejeI = Ejes.ejeY(maxDe('izq')), ejeD = Ejes.ejeY(maxDe('der'));
    const mI = cv ? Ejes.marcasVentana(v.yIzq0, v.yIzq1, Ejes.DIVISIONES_Y) : Array.from({ length: Ejes.DIVISIONES_Y + 1 }, (_, i) => i * ejeI.paso);
    const mD = cv ? Ejes.marcasVentana(v.yDer0, v.yDer1, Ejes.DIVISIONES_Y) : Array.from({ length: Ejes.DIVISIONES_Y + 1 }, (_, i) => i * ejeD.paso);
    const nodos = [];
    for (const m of mI) {
      const y = yDe(m, 'izq');
      nodos.push(caja('div', 68, y - 0.6, 1059 - 68 + dw, 1.2, 'fc-gr-grid' + (Math.abs(y - YB) < 0.5 ? ' eje' : '')));
      const e = h('div', { class: 'fc-gr-ey izq', text: etiquetaNum(m) }); e.style.top = `${y - 3}px`; nodos.push(e);
    }
    for (const m of mD) { const e = h('div', { class: 'fc-gr-ey der', text: etiquetaNum(m) }); e.style.top = `${yDe(m, 'der') - 3}px`; e.style.left = `${1075 + dw}px`; nodos.push(e); }
    if (cv) nodos.push(caja('div', 68, YB - 0.6, 1059 - 68 + dw, 1.2, 'fc-gr-grid eje'));
    for (const m of marcasX) {
      const x = xDe(m);
      nodos.push(caja('div', x - 0.6, YB, 1.2, 6, 'fc-gr-tick'));
      nodos.push(txt(etiquetaNum(m), { cx: x, bl: yb(741), tam: 20, color: 'var(--c-grafica-texto-eje)' }));
    }
    capaEjes.replaceChildren(...nodos);
    // fases
    const nf = [];
    inicios.forEach((f, i) => {
      const fin = i + 1 < inicios.length ? inicios[i + 1].inicioMin : tActualMin;
      if (f.inicioMin > 0 && f.inicioMin >= v.t0 && f.inicioMin <= v.t1) nf.push(caja('div', xDe(f.inicioMin) - 0.75, 164, 1.5, YB - 164, 'fc-gr-divfase'));
      const a = xDe(Math.max(f.inicioMin, v.t0)), b = xDe(Math.min(fin, v.t1));
      if (b - a > 40) {
        const ic = mascara(`assets/iconos/mono/fase_${f.clave}.svg`, 52, 'var(--c-grafica-icono-fase)', 'fc-gr-icofase');
        Object.assign(ic.style, { left: `${(a + b) / 2 - 26}px`, top: `${205 - 26}px` });
        nf.push(ic);
      }
    });
    capaFases.replaceChildren(...nf);
  }
  function maxDe(eje) {
    let m = 0;
    SERIES.forEach((s) => { if (s.eje !== eje) return; for (const v of datos[s.clave]) if (v != null && v > m) m = v; });
    return m;
  }
  function pintarCurvas() {
    const v = ventana();
    const cv = conVentana();
    rectClip.setAttribute('x', cv ? X0 - 3 : 0); rectClip.setAttribute('y', YA - (cv ? 3 : 10));
    rectClip.setAttribute('width', cv ? X1 - X0 + 6 : ancho); rectClip.setAttribute('height', YB - (YA - (cv ? 3 : 10)) + 2);
    const tr = Ejes.tramoVentana(datos.t, v.t0, v.t1);
    const xs = datos.t.slice(tr.desde, tr.hasta + 1);
    SERIES.forEach((s, i) => {
      const d = Ejes.decimar(xs, datos[s.clave].slice(tr.desde, tr.hasta + 1), v.t0, v.t1, X1 - X0);
      let pts = '';
      for (let k = 0; k < d.x.length; k++) pts += `${xDe(d.x[k]).toFixed(1)},${yDe(d.y[k], s.eje).toFixed(1)} `;
      lineas[i].setAttribute('points', pts);
    });
  }
  function pintarCursor() {
    const n = datos.t.length;
    if (isNaN(cursorMin) || !n) { cursor.classList.add('oculto'); return; }
    // índice más cercano
    let lo = 0, hi = n - 1;
    while (lo < hi) { const mm = (lo + hi) >> 1; if (datos.t[mm] < cursorMin) lo = mm + 1; else hi = mm; }
    if (lo > 0 && Math.abs(datos.t[lo - 1] - cursorMin) < Math.abs(datos.t[lo] - cursorMin)) lo--;
    const tc = datos.t[lo];
    const v = ventana();
    if (conVentana() && (tc < v.t0 || tc > v.t1)) { cursor.classList.add('oculto'); return; }
    cursor.classList.remove('oculto');
    const x = xDe(tc);
    lineaCursor.style.left = `${x - 1.5}px`;
    SERIES.forEach((s, i) => {
      const val = datos[s.clave][lo];
      const y = val == null ? null : yDe(val, s.eje);
      const ver = y != null && (!conVentana() || (y >= YA - 0.5 && y <= YB + 0.5));
      puntos[i].style.display = ver ? '' : 'none';
      if (ver) puntos[i].style.transform = `translate(${x - 9}px, ${y - 9}px)`;
      filasGlobo[i].textContent = val == null ? t('sistema.sin_lectura') : `${val.toFixed(1)} ${s.unidad}`;
    });
    horaGlobo.textContent = `${fMmSs(tc * 60) || '0:00'} ${t('unidades.tiempo')}`;
    const gw = 236;
    let gx = x + 28;
    if (gx + gw > 1059 + dw) gx = x - 28 - gw;
    globo.style.transform = `translate(${Math.max(68, gx)}px, ${YA + 4}px)`;
  }
  function pintarTiempos() {
    if (!menuTiempos || menuTiempos.classList.contains('oculto')) return;
    menuTiempos.replaceChildren(...(tiempos || []).map((f) => h('div', { class: 'fc-gr-mfila' },
      h('span', { text: t(`fases.${normFase(f.fase)}`) }),
      h('span', { class: 'v', text: f.duracionS != null ? (fMmSs(f.duracionS) || t('sistema.sin_lectura')) : t('sistema.sin_lectura') }))));
  }
  function pintar() {
    rafPint = 0; pendiente = false;
    pintarEjes(); pintarCurvas(); pintarCursor();
    lupa.classList.toggle('oculto', ventanaZoom === null);
  }
  const pedirPintar = () => { if (!rafPint) rafPint = requestAnimationFrame(pintar); };

  function fijarVentanaZoom(v) {
    const a = Ejes.acotarVentana(v, completa);
    ventanaZoom = Ejes.esVistaCompleta(a, completa) ? null : a;
  }
  function ventanaParaGesto() {
    const v = Ejes.interpolarVentana(ventana(), ventana(), 0);
    if (desde) { cancelAnimationFrame(rafTrans); desde = null; fijarVentanaZoom(v); }
    return v;
  }
  function restablecerVista() {
    clearTimeout(tRest);
    if (!ventanaZoom) return;
    desde = ventanaZoom; ventanaZoom = null; avance = 0; tTrans = performance.now();
    const paso = (ahora) => {
      const f = Math.min(1, (ahora - tTrans) / 300);
      avance = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      if (f >= 1) desde = null;
      pintar();
      if (f < 1) rafTrans = requestAnimationFrame(paso);
    };
    rafTrans = requestAnimationFrame(paso);
  }
  function restablecerAhora() { clearTimeout(tRest); cancelAnimationFrame(rafTrans); desde = null; ventanaZoom = null; gesto = null; pedirPintar(); }
  const tocado = () => { clearTimeout(tRest); tRest = setTimeout(restablecerVista, 20000); };
  lupa.addEventListener('click', restablecerVista);

  // ---- puntero: cursor con un dedo, zoom con dos ----
  const punteros = new Map();
  let gesto = null, dosDedos = false;
  const local = (ev) => {
    const r = el.getBoundingClientRect();
    const s = r.width / ancho || 1;
    return { x: (ev.clientX - r.left) / s, y: (ev.clientY - r.top) / s };
  };
  const tDesdeX = (px) => {
    const ts = datos.t; if (!ts.length) return NaN;
    const v = ventana();
    let tm = v.t0 + (px - X0) / (X1 - X0) * (v.t1 - v.t0);
    if (conVentana()) tm = Math.max(v.t0, Math.min(v.t1, tm));
    return Math.max(ts[0], Math.min(ts[ts.length - 1], tm));
  };
  const moverCursor = (px) => {
    cursorMin = tDesdeX(px); pintarCursor();
    clearTimeout(tOcultar); tOcultar = setTimeout(() => { cursorMin = NaN; pintarCursor(); }, 5000);
  };
  function actualizarGesto() {
    tocado();
    const ps = [...punteros.values()];
    if (ps.length >= 2) {
      dosDedos = true;
      const pts = { xa: ps[0].x, ya: ps[0].y, xb: ps[1].x, yb: ps[1].y };
      if (!gesto) gesto = { inicio: pts, ventana: ventanaParaGesto() };
      else { fijarVentanaZoom(Ejes.ventanaPorGesto(gesto.ventana, gesto.inicio, pts, { x0: X0, x1: X1, y0: YA, y1: YB }, 40)); pedirPintar(); }
    } else if (ps.length === 1) { gesto = null; if (!dosDedos) moverCursor(ps[0].x); }
    else { gesto = null; dosDedos = false; }
  }
  // Táctil con eventos touch (en Android Chrome los punteros táctiles pueden
  // cancelarse al llegar el segundo dedo); mouse y lápiz con eventos pointer.
  const deToques = (ev) => {
    punteros.clear();
    for (const tq of ev.touches) punteros.set(`t${tq.identifier}`, local(tq));
    actualizarGesto();
    if (ev.cancelable) ev.preventDefault();
  };
  for (const n of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) toque.addEventListener(n, deToques, { passive: false });
  const esTactil = (ev) => ev.pointerType === 'touch';
  toque.addEventListener('pointerdown', (ev) => { if (esTactil(ev)) return; toque.setPointerCapture?.(ev.pointerId); punteros.set(ev.pointerId, local(ev)); actualizarGesto(); ev.preventDefault(); });
  toque.addEventListener('pointermove', (ev) => { if (esTactil(ev) || !punteros.has(ev.pointerId)) return; punteros.set(ev.pointerId, local(ev)); actualizarGesto(); });
  const fuera = (ev) => { if (esTactil(ev) || !punteros.delete(ev.pointerId)) return; actualizarGesto(); };
  toque.addEventListener('pointerup', fuera);
  toque.addEventListener('pointercancel', fuera);
  toque.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const p = local(ev);
    const enY = ev.ctrlKey;
    const frac = enY ? (YB - p.y) / (YB - YA) : (p.x - X0) / (X1 - X0);
    fijarVentanaZoom(Ejes.ventanaPorRueda(ventanaParaGesto(), enY ? 'y' : 'x', Math.pow(1.25, -ev.deltaY / 120), Math.max(0, Math.min(1, frac))));
    tocado(); pedirPintar();
  }, { passive: false });
  const cerrarMenu = (e) => { if (menuTiempos && !menuTiempos.contains(e.target)) { menuTiempos.classList.add('oculto'); el.querySelector('.fc-gr-tiempos')?.classList.remove('abierto'); } };
  el.addEventListener('pointerdown', cerrarMenu, true);

  function fijar({ serie = [], tiempos: ti = [], tiempoActualS = null } = {}) {
    const n = serie.length;
    const tm = new Array(n), tc = new Array(n), trr = new Array(n), pc = new Array(n);
    const ini = []; const vistas = new Set();
    for (let i = 0; i < n; i++) {
      const s = serie[i];
      tm[i] = s.t / 60; tc[i] = s.tc ?? null; trr[i] = s.tr ?? null; pc[i] = s.pc ?? null;
      const f = normFase(s.fase);
      if (f && FASES.includes(f) && !vistas.has(f)) { vistas.add(f); ini.push({ clave: f, inicioMin: ini.length ? tm[i] : 0 }); }
    }
    const t0 = tm.length ? tm[0] : null;
    if (!Ejes.continuaDatos(huella, tm) || (huella && huella.primero !== t0)) restablecerAhora();
    huella = Ejes.huellaDatos(tm);
    datos = { t: tm, tc, tr: trr, pc };
    inicios = ini;
    tiempos = ti;
    tActualMin = tiempoActualS != null ? tiempoActualS / 60 : (n ? tm[n - 1] : 0);
    completa = Ejes.vistaCompleta(Ejes.ejeX(tActualMin), Ejes.ejeY(maxDe('izq')), Ejes.ejeY(maxDe('der')));
    if (ventanaZoom) fijarVentanaZoom(ventanaZoom);
    pintarTiempos();
    pedirPintar();
  }
  pintar();
  return {
    el, fijar, restablecerAhora,
    destruir() { clearTimeout(tOcultar); clearTimeout(tRest); cancelAnimationFrame(rafTrans); cancelAnimationFrame(rafPint); },
  };
}
