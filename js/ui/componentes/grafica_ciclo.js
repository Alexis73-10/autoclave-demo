// GraficaCiclo (Componentes/GraficaCiclo.qml): temperatura de cámara, de
// referencia (eje izquierdo, °C) y presión (eje derecho, kPa) contra el tiempo.
// Tarjeta (radio 30 del QML): título, leyenda, botones «Tiempos» y pantalla completa
// (o CERRAR), separador, ejes con pasos limpios (grafica_ejes.js), divisores de fase
// punteados con su icono, curvas de 3 px (SVG), cursor con un dedo (globo con mm:ss y
// valores; se oculta a los 5 s), zoom con dos dedos (ZOM-03, factor por eje, punto medio
// desplaza), rueda = X y Ctrl+rueda = Y (pruebas en PC), límites ZOM-04,
// restablecimiento a los 20 s con 300 ms InOutQuad (ZOM-06) y lupa que restablece al
// tocarla (ZOM-07).
// Composición adaptable (v1.1): la tarjeta ocupa la caja que le da su contenedor; el
// área de trazado mide su tamaño real con observarTamano y se dibuja en px reales (SVG
// del tamaño real, textos de ejes de 12,2 px o más, márgenes según el tamaño). Al girar
// se redibuja con los MISMOS datos y la misma ventana de zoom (valores absolutos).
//
// crearGraficaCiclo({ancho, alto, pantallaCompleta = false, alPantallaCompleta, alCerrar})
//   -> {el, extra (ranura en la cabecera), fijar({serie, tiempos, tiempoActualS}), restablecerAhora(), destruir()}
// serie = [{t (s), tc, tr, pc, fase}]; tiempos = fases del ciclo [{fase, estado, duracionS}].
// `ancho`/`alto` (px del QML) se aceptan por compatibilidad y no mandan.
import { h, observarTamano, aLocal } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import * as Ejes from './grafica_ejes.js';
import { mascara, fMmSs, medir, escalaU, LETRA_MIN } from './_ciclo_util.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const FASES = ['precalentamiento', 'vacio', 'calentamiento', 'esterilizacion', 'descompresion', 'secado'];
const normFase = (f) => { const s = String(f || '').toLowerCase(); return s === 'pre_vacio' || s === 'prevacio' ? 'vacio' : s; };
const etiquetaNum = (v) => { const r = Math.round(v * 100) / 100; return Number.isInteger(r) ? String(r) : r.toFixed(1); };

export function crearGraficaCiclo({ pantallaCompleta = false, alPantallaCompleta = null, alCerrar = null } = {}) {
  const abrevDe = (clave, nombre) => { const a = t(`abrev.${clave}`); return a === `abrev.${clave}` ? nombre : a; };
  const SERIES = [
    { clave: 'tc', nombre: t('ciclo.serie_temp_camara'), abrev: abrevDe('ciclo.serie_temp_camara', t('ciclo.serie_temp_camara')), color: 'var(--c-serie-grafica1)', eje: 'izq', unidad: t('unidades.temperatura') },
    { clave: 'tr', nombre: t('ciclo.serie_temp_ref'), abrev: abrevDe('ciclo.serie_temp_ref', t('ciclo.serie_temp_ref')), color: 'var(--c-serie-grafica2)', eje: 'izq', unidad: t('unidades.temperatura') },
    { clave: 'pc', nombre: t('ciclo.serie_presion'), abrev: abrevDe('ciclo.serie_presion', t('ciclo.serie_presion')), color: 'var(--c-serie-grafica3)', eje: 'der', unidad: t('unidades.presion') },
  ];

  // ---- cabecera (título, leyenda, botones) ----
  const titulo = h('div', { class: 'fc-gr-titulo', text: t('ciclo.grafica') });
  const leyenda = h('div', { class: 'fc-gr-leyenda' }, SERIES.map((s) => h('span', { class: 'fc-gr-ley' },
    h('i', { style: { background: s.color } }), h('span', { class: 'larga', text: s.nombre }), h('span', { class: 'corta', text: s.abrev }))));
  const botones = h('div', { class: 'fc-gr-botones' });
  let menuTiempos = null, bT = null;
  if (!pantallaCompleta) {
    bT = h('button', { class: 'fc-gr-boton fc-gr-tiempos' }, h('span', { text: t('ciclo.tiempos') }),
      mascara('assets/iconos/color/chevron_abajo.svg', null, 'var(--c-grafica-texto)', 'chev'));
    menuTiempos = h('div', { class: 'fc-gr-menu desplazable oculto', 'data-solape-permitido': '' });   // menú emergente: tapa la gráfica a propósito
    bT.addEventListener('click', (e) => { e.stopPropagation(); menuTiempos.classList.toggle('oculto'); bT.classList.toggle('abierto'); pintarTiempos(); });
    const bP = h('button', { class: 'fc-gr-boton fc-gr-completa', 'aria-label': t('ciclo.grafica') },
      mascara('assets/iconos/mono/pantalla_completa.svg', null, 'var(--c-grafica-titulo)'));
    bP.addEventListener('click', () => alPantallaCompleta?.());
    botones.append(bT, bP);
  } else {
    const bC = h('button', { class: 'fc-gr-boton fc-gr-cerrar' }, h('span', { text: t('acciones.cerrar') }));
    bC.addEventListener('click', () => alCerrar?.());
    botones.append(bC);
  }
  const extra = h('div', { class: 'fc-gr-extra' });   // ranura para la píldora de fin de ciclo
  const cab = h('div', { class: 'fc-gr-cab' }, h('div', { class: 'fc-gr-cab-izq' }, titulo, leyenda), extra, botones);

  // ---- área de trazado ----
  const area = h('div', { class: 'fc-gr-area' });
  const capaEjes = h('div', { class: 'fc-gr-capa' });
  const capaFases = h('div', { class: 'fc-gr-capa', 'data-solape-permitido': '' });
  const uIzq = h('div', { class: 'fc-gr-unidad', text: t('unidades.temperatura') });
  const uDer = h('div', { class: 'fc-gr-unidad der', text: t('unidades.presion') });
  const tituloX = h('div', { class: 'fc-gr-titulo-x', text: t('ciclo.grafica_eje_tiempo') });
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'fc-gr-svg');
  svg.setAttribute('data-solape-permitido', '');
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
  const lupa = h('button', { class: 'fc-gr-lupa oculto', 'aria-label': 'Zoom' }, h('span', { class: 'fondo' }),
    mascara('assets/iconos/color/lupa.svg', null, 'var(--c-grafica-zoom-icono)'));
  const cursor = h('div', { class: 'fc-gr-cursor oculto', 'data-solape-permitido': '' });
  const lineaCursor = h('div', { class: 'fc-gr-linea-cursor' });
  const puntos = SERIES.map((s) => { const p = h('i', { class: 'fc-gr-punto' }); p.style.background = s.color; return p; });
  const globo = h('div', { class: 'fc-gr-globo' });
  const horaGlobo = h('div', { class: 'fc-gr-gh' });
  const filasGlobo = SERIES.map((s) => {
    const v = h('span', { class: 'v' });
    globo.append(h('div', { class: 'fc-gr-gf' }, h('i', { style: { background: s.color } }), h('span', { class: 'n', text: s.abrev }), v));
    return v;
  });
  globo.prepend(horaGlobo);
  cursor.append(lineaCursor, ...puntos, globo);
  const toque = h('div', { class: 'fc-gr-toque' });
  area.append(capaFases, capaEjes, uIzq, uDer, tituloX, svg, toque, lupa, cursor);

  const el = h('div', { class: `fc-grafica${pantallaCompleta ? ' completa' : ''}` }, cab, h('div', { class: 'fc-gr-sep' }), area);
  if (menuTiempos) el.append(menuTiempos);

  // ---- geometría (px reales del área) ----
  let G = { W: 0, H: 0, fe: 14, X0: 0, X1: 0, YA: 0, YB: 0, gx0: 0, gx1: 0, ico: 30, umbral: 30 };
  let areaW = 0, areaH = 0;
  function geometria() {
    const W = areaW, H = areaH;
    const k = Math.min(W / 1129, H / 560);
    const fe = Math.max(LETRA_MIN, Math.min(20, 20 * k));
    const mI = Ejes.ejeY(maxDe('izq')).maximo, mD = Ejes.ejeY(maxDe('der')).maximo;
    const anchoEt = (v) => medir(etiquetaNum(v), fe, 400) + 2;
    const lblI = Math.max(anchoEt(mI), medir(t('unidades.temperatura'), fe), anchoEt(mI / 2) + 4);
    const lblD = Math.max(anchoEt(mD), medir(t('unidades.presion'), fe), anchoEt(mD / 2) + 4);
    const pad = Math.max(6, 0.018 * W);
    const gx0 = pad + lblI + fe * 0.6;
    const gx1 = W - pad - lblD - fe * 0.6;
    const ins = Math.min(fe * 1.25, (gx1 - gx0) * 0.03);
    const ico = Math.round(Math.max(18, Math.min(52, 52 * k)));
    const YA = Math.max(ico + fe * 0.4, fe * 1.4) + 6;
    const YB = H - fe * 3.6;
    G = { W, H, fe, X0: gx0 + ins, X1: gx1 - ins, YA, YB, gx0, gx1, ico, umbral: Math.max(20, 40 * escalaU()) };
    area.style.setProperty('--fe', `${fe}px`);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    Object.assign(uIzq.style, { left: `${pad}px`, top: `${YA - fe * 1.9}px` });
    Object.assign(uDer.style, { right: `${pad}px`, top: `${YA - fe * 1.9}px` });
    Object.assign(tituloX.style, { left: `${G.X0}px`, width: `${G.X1 - G.X0}px`, top: `${YB + fe * 2.1}px` });
    const tl = Math.max(44, Math.round(56 * k));
    Object.assign(lupa.style, { width: `${tl}px`, height: `${tl}px`, left: `${gx1 - tl}px`, top: `${YA + 4}px` });
    Object.assign(lineaCursor.style, { top: `${YA - 7}px`, height: `${YB - YA - 1}px` });
    el.classList.toggle('estrecha', el.clientWidth < 620);
  }

  // ---- estado ----
  let datos = { t: [], tc: [], tr: [], pc: [] };
  let inicios = [];
  let tiempos = [];
  let tActualMin = 0;
  let completa = Ejes.vistaCompleta(Ejes.ejeX(0), Ejes.ejeY(0), Ejes.ejeY(0));
  let ventanaZoom = null, desde = null, avance = 0, tTrans = 0;
  let cursorMin = NaN;
  let huella = null;
  let tOcultar = 0, tRest = 0, rafTrans = 0, rafPint = 0;
  const ventana = () => (desde ? Ejes.interpolarVentana(desde, completa, avance) : (ventanaZoom || completa));
  const conVentana = () => ventanaZoom !== null || desde !== null;
  const xDe = (tm) => { const v = ventana(); return G.X0 + (tm - v.t0) / ((v.t1 - v.t0) || 1) * (G.X1 - G.X0); };
  const yDe = (val, eje) => { const v = ventana(); const a = eje === 'der' ? v.yDer0 : v.yIzq0; const b = eje === 'der' ? v.yDer1 : v.yIzq1; return G.YB - (val - a) / ((b - a) || 1) * (G.YB - G.YA); };
  const abs = (cls, estilo, texto) => { const n = h('div', { class: cls }); if (texto != null) n.textContent = texto; Object.assign(n.style, estilo); return n; };

  function pintarEjes() {
    const v = ventana();
    const cv = conVentana();
    const { fe, gx0, gx1, YB } = G;
    const ez = Ejes.ejeX(tActualMin);
    const marcasX = cv ? Ejes.marcasVentana(v.t0, v.t1, Ejes.DIVISIONES_X) : Array.from({ length: Math.round(ez.maximo / ez.paso) + 1 }, (_, i) => i * ez.paso);
    const ejeI = Ejes.ejeY(maxDe('izq')), ejeD = Ejes.ejeY(maxDe('der'));
    const mI = cv ? Ejes.marcasVentana(v.yIzq0, v.yIzq1, Ejes.DIVISIONES_Y) : Array.from({ length: Ejes.DIVISIONES_Y + 1 }, (_, i) => i * ejeI.paso);
    const mD = cv ? Ejes.marcasVentana(v.yDer0, v.yDer1, Ejes.DIVISIONES_Y) : Array.from({ length: Ejes.DIVISIONES_Y + 1 }, (_, i) => i * ejeD.paso);
    const nodos = [];
    // etiquetas de Y: si no caben (gráfica baja) se omiten alternadas; la cuadrícula se conserva
    const sepY = (lst, eje) => (lst.length > 1 ? Math.abs(yDe(lst[1], eje) - yDe(lst[0], eje)) : 1e9);
    const saltoY = (lst, eje) => { let s = 1; while (s < lst.length && sepY(lst, eje) * s < fe * 1.2) s++; return s; };
    const sI = saltoY(mI, 'izq'), sD = saltoY(mD, 'der');
    mI.forEach((m, i) => {
      const y = yDe(m, 'izq');
      nodos.push(abs('fc-gr-grid' + (Math.abs(y - YB) < 0.5 ? ' eje' : ''), { left: `${gx0}px`, top: `${y - 0.6}px`, width: `${gx1 - gx0}px`, height: '1.2px' }));
      if (i % sI === 0) nodos.push(abs('fc-gr-ey izq', { right: `${G.W - gx0 + fe * 0.6}px`, top: `${y}px` }, etiquetaNum(m)));
    });
    mD.forEach((m, i) => { if (i % sD === 0) nodos.push(abs('fc-gr-ey der', { left: `${gx1 + fe * 0.6}px`, top: `${yDe(m, 'der')}px` }, etiquetaNum(m))); });
    if (cv) nodos.push(abs('fc-gr-grid eje', { left: `${gx0}px`, top: `${YB - 0.6}px`, width: `${gx1 - gx0}px`, height: '1.2px' }));
    // etiquetas de X: se omiten alternadas si no caben
    const xs = marcasX.map((m) => ({ m, x: xDe(m), w: medir(etiquetaNum(m), fe) }));
    let salto = 1;
    const choca = (s) => xs.some((a, i) => i % s === 0 && i + s < xs.length && xs[i + s].x - a.x < (a.w + xs[i + s].w) / 2 + fe * 0.5);
    while (salto < xs.length && choca(salto)) salto++;
    xs.forEach(({ m, x }, i) => {
      nodos.push(abs('fc-gr-tick', { left: `${x - 0.6}px`, top: `${YB}px`, width: '1.2px', height: '6px' }));
      if (i % salto === 0) nodos.push(abs('fc-gr-ex', { left: `${x}px`, top: `${YB + fe * 0.5}px` }, etiquetaNum(m)));
    });
    capaEjes.replaceChildren(...nodos);
    // fases
    const nf = [];
    const yTop = G.YA - G.ico - fe * 0.4;
    inicios.forEach((f, i) => {
      const fin = i + 1 < inicios.length ? inicios[i + 1].inicioMin : tActualMin;
      if (f.inicioMin > 0 && f.inicioMin >= v.t0 && f.inicioMin <= v.t1) nf.push(abs('fc-gr-divfase', { left: `${xDe(f.inicioMin) - 0.75}px`, top: `${yTop}px`, width: '1.5px', height: `${YB - yTop}px` }));
      const a = xDe(Math.max(f.inicioMin, v.t0)), b = xDe(Math.min(fin, v.t1));
      if (b - a > G.ico * 0.85) {
        const ic = mascara(`assets/iconos/mono/fase_${f.clave}.svg`, G.ico, 'var(--c-grafica-icono-fase)', 'fc-gr-icofase');
        Object.assign(ic.style, { left: `${(a + b) / 2 - G.ico / 2}px`, top: `${yTop - 2}px` });
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
    const { X0, X1, YA, YB, W } = G;
    rectClip.setAttribute('x', cv ? X0 - 3 : 0); rectClip.setAttribute('y', YA - (cv ? 3 : 10));
    rectClip.setAttribute('width', cv ? X1 - X0 + 6 : W); rectClip.setAttribute('height', YB - (YA - (cv ? 3 : 10)) + 2);
    const tr = Ejes.tramoVentana(datos.t, v.t0, v.t1);
    const xs = datos.t.slice(tr.desde, tr.hasta + 1);
    SERIES.forEach((s, i) => {
      const d = Ejes.decimar(xs, datos[s.clave].slice(tr.desde, tr.hasta + 1), v.t0, v.t1, Math.max(50, X1 - X0));
      let pts = '';
      for (let k = 0; k < d.x.length; k++) pts += `${xDe(d.x[k]).toFixed(1)},${yDe(d.y[k], s.eje).toFixed(1)} `;
      lineas[i].setAttribute('points', pts);
    });
  }
  function pintarCursor() {
    const n = datos.t.length;
    if (isNaN(cursorMin) || !n || !G.W) { cursor.classList.add('oculto'); return; }
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
      const ver = y != null && (!conVentana() || (y >= G.YA - 0.5 && y <= G.YB + 0.5));
      puntos[i].style.display = ver ? '' : 'none';
      if (ver) puntos[i].style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      filasGlobo[i].textContent = val == null ? t('sistema.sin_lectura') : `${val.toFixed(1)} ${s.unidad}`;
    });
    horaGlobo.textContent = `${fMmSs(tc * 60) || '0:00'} ${t('unidades.tiempo')}`;
    const gw = globo.offsetWidth || 160;
    let gx = x + 16;
    if (gx + gw > G.gx1) gx = x - 16 - gw;
    const gh = globo.offsetHeight || 100;
    globo.style.transform = `translate(${Math.max(2, Math.min(G.W - gw - 2, gx))}px, ${Math.max(0, Math.min(G.YA + 4, G.H - gh - 2))}px)`;
  }
  function pintarTiempos() {
    if (!menuTiempos || menuTiempos.classList.contains('oculto')) return;
    menuTiempos.replaceChildren(...(tiempos || []).map((f) => h('div', { class: 'fc-gr-mfila' },
      h('span', { text: t(`fases.${normFase(f.fase)}`) }),
      h('span', { class: 'v', text: f.duracionS != null ? (fMmSs(f.duracionS) || t('sistema.sin_lectura')) : t('sistema.sin_lectura') }))));
    // el menú se ancla bajo el botón (posición real del botón dentro de la tarjeta)
    const rb = bT.getBoundingClientRect(), re = el.getBoundingClientRect();
    Object.assign(menuTiempos.style, { top: `${rb.bottom - re.top + 6}px`, right: `${re.right - rb.right}px`,
      maxHeight: `${Math.max(120, re.bottom - rb.bottom - 16)}px` });
  }
  function pintar() {
    rafPint = 0;
    if (!G.W) return;
    pintarEjes(); pintarCurvas(); pintarCursor();
    lupa.classList.toggle('oculto', ventanaZoom === null);
  }
  const pedirPintar = () => { if (!rafPint) rafPint = requestAnimationFrame(pintar); };

  const quitarObs = observarTamano(area, ({ ancho, alto }) => {
    areaW = ancho; areaH = alto;
    geometria();
    pintar();
    pintarTiempos();
  });

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
  const local = (ev) => { const p = aLocal(area, ev); return { x: p.x, y: p.y }; };
  const tDesdeX = (px) => {
    const ts = datos.t; if (!ts.length) return NaN;
    const v = ventana();
    let tm = v.t0 + (px - G.X0) / ((G.X1 - G.X0) || 1) * (v.t1 - v.t0);
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
      else { fijarVentanaZoom(Ejes.ventanaPorGesto(gesto.ventana, gesto.inicio, pts, { x0: G.X0, x1: G.X1, y0: G.YA, y1: G.YB }, G.umbral)); pedirPintar(); }
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
  toque.addEventListener('pointerdown', (ev) => { if (esTactil(ev)) return; try { toque.setPointerCapture?.(ev.pointerId); } catch { /* puntero sintético */ } punteros.set(ev.pointerId, local(ev)); actualizarGesto(); ev.preventDefault(); });
  toque.addEventListener('pointermove', (ev) => { if (esTactil(ev) || !punteros.has(ev.pointerId)) return; punteros.set(ev.pointerId, local(ev)); actualizarGesto(); });
  const fuera = (ev) => { if (esTactil(ev) || !punteros.delete(ev.pointerId)) return; actualizarGesto(); };
  toque.addEventListener('pointerup', fuera);
  toque.addEventListener('pointercancel', fuera);
  toque.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const p = local(ev);
    const enY = ev.ctrlKey;
    const frac = enY ? (G.YB - p.y) / ((G.YB - G.YA) || 1) : (p.x - G.X0) / ((G.X1 - G.X0) || 1);
    fijarVentanaZoom(Ejes.ventanaPorRueda(ventanaParaGesto(), enY ? 'y' : 'x', Math.pow(1.25, -ev.deltaY / 120), Math.max(0, Math.min(1, frac))));
    tocado(); pedirPintar();
  }, { passive: false });
  const cerrarMenu = (e) => { if (menuTiempos && !menuTiempos.contains(e.target) && !bT.contains(e.target)) { menuTiempos.classList.add('oculto'); bT.classList.remove('abierto'); } };
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
    const antes = [completa.yIzq1, completa.yDer1];
    datos = { t: tm, tc, tr: trr, pc };
    inicios = ini;
    tiempos = ti;
    tActualMin = tiempoActualS != null ? tiempoActualS / 60 : (n ? tm[n - 1] : 0);
    completa = Ejes.vistaCompleta(Ejes.ejeX(tActualMin), Ejes.ejeY(maxDe('izq')), Ejes.ejeY(maxDe('der')));
    if (ventanaZoom) fijarVentanaZoom(ventanaZoom);
    // el ancho de las etiquetas de Y puede cambiar con el máximo
    if (areaW && (antes[0] !== completa.yIzq1 || antes[1] !== completa.yDer1)) geometria();
    pintarTiempos();
    pedirPintar();
  }
  return {
    el, extra, fijar, restablecerAhora,
    destruir() { clearTimeout(tOcultar); clearTimeout(tRest); cancelAnimationFrame(rafTrans); cancelAnimationFrame(rafPint); quitarObs(); },
  };
}
