// PanelTeclado: teclado en pantalla alfanumérico y numérico (Componentes/PanelTeclado.qml,
// TecladoAlfanumerico.qml, TecladoNumerico.qml y Tecla.qml del software real).
//
// API (compatible con el esqueleto anterior):
//   abrirAlfanumerico({titulo, valor, oculto, maxLargo, alEntregar(texto), alSiguiente, alTerminar, alCerrar})
//     Modo "en vivo": alEntregar recibe el texto en cada tecla, al abrir otro campo y "" al cancelar.
//     Solo para asignar texto a una propiedad. alSiguiente (opcional) abre el campo siguiente sin cerrar
//     el panel al Confirmar; alTerminar se llama al Confirmar cuando no hay siguiente.
//   abrirAlfanumericoAccion({titulo, valor, oculto, maxLargo, alEntregar(texto), alCerrar})
//     Una sola entrega al Confirmar con texto (Confirmar vacío no hace nada); para callbacks que ejecutan algo.
//   abrirNumerico({titulo, valor, unidad, min, max, decimales, alConfirmar(valor), alSiguiente, alTerminar, alCerrar})
//     Entrega en vivo cada valor válido; Confirmar fuera de rango muestra el rango en rojo y no cierra.
//   cerrarTeclado(), tecladoAbierto(), textoEnEdicion()
import { h, iconoMono } from './dom.js';
import { t } from './i18n.js';
import { tocar } from './sonido.js';

// Medidas (px de diseño; Tema/Teclado.qml + TecladoProvisional.qml)
const ANCHO_TECLA = 96, ALTO_ALFA = 120, SEP = 14, RADIO = 12, BORDE = 2;
const DESPL_FILA2 = 22, ANCHO_BORRAR = 206, ANCHO_CAPA = 110, ANCHO_CANCELAR = 190, ANCHO_CONFIRMAR = 220;
const ANCHO_NUM = 206, ALTO_NUM = 120, PASO = ANCHO_TECLA + SEP;
const MARGEN = 24, ANCHO_LIENZO = 1200, MIN_PRESIONADA_MS = 90;
const FILAS_LETRAS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
const FILAS_NUMEROS = ['1234567890', '@._-+*/=()', '¿?¡!:"\''];
const INICIO_FILA = [0, DESPL_FILA2, PASO];
const FILAS_NUM = ['789', '456', '123', '-0.'];

const capa = () => document.getElementById('capa-teclado');
let raiz = null;             // contenedor animado
let alfa = null, num = null; // sub-paneles
let activo = null;           // estado del campo abierto

// ── tecla ────────────────────────────────────────────────────────────────
function crearTecla({ texto, icono, variante = 'normal', x, y, w, alto, tam = 28, alPulsar, alPresionar, alSoltar }) {
  const el = h('div', { class: `tk tk-${variante}` });
  const s = el.style;
  s.left = `${x}px`; s.top = `${y}px`; s.width = `${w}px`; s.height = `${alto}px`;
  s.fontSize = `${tam}px`; s.borderRadius = `${RADIO}px`; s.borderWidth = `${BORDE}px`;
  const api = {
    el, marcada: false,
    fijar(txt) { if (!icono) el.textContent = txt; },
    marcar(v) { api.marcada = v; el.classList.toggle('tk-pres', v); },
  };
  if (icono) el.append(iconoMono(icono, { tam: 48, color: 'var(--c-texto-primario)' }));
  else el.textContent = texto ?? '';
  let desde = 0, quitar = null;
  const bajar = () => { el.classList.toggle('tk-pres', api.marcada); };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    clearTimeout(quitar);
    el.classList.add('tk-pres');
    desde = performance.now();
    tocar('tecla');
    alPresionar?.();
  });
  const soltar = (e, cancelado) => {
    if (!desde) return;
    const dentro = !cancelado && el.contains(document.elementFromPoint(e.clientX, e.clientY));
    const resto = Math.max(0, MIN_PRESIONADA_MS - (performance.now() - desde));
    desde = 0;
    clearTimeout(quitar);
    quitar = setTimeout(bajar, resto);
    alSoltar?.(dentro);
    if (dentro) alPulsar?.();
  };
  el.addEventListener('pointerup', (e) => soltar(e, false));
  el.addEventListener('pointercancel', (e) => soltar(e, true));
  return api;
}

// ── contenedor ───────────────────────────────────────────────────────────
function asegurarRaiz() {
  if (raiz) return;
  raiz = h('div', { class: 'teclado-panel' });
  const ocultar = h('div', { class: 'teclado-ocultar', onpointerdown: (e) => { e.preventDefault(); cerrarTeclado(); } },
    h('img', { src: 'assets/iconos/color/ocultar_teclado.svg', alt: '', width: 48, height: 48, draggable: 'false' }));
  raiz.append(ocultar);
  capa().append(raiz);
}

function mostrar(subpanel, altoTotal) {
  asegurarRaiz();
  for (const p of [alfa, num]) if (p) p.el.style.display = p === subpanel ? '' : 'none';
  raiz.style.height = `${altoTotal}px`;
  void raiz.offsetHeight;   // la transición parte de "cerrado" la primera vez
  raiz.classList.add('abierto');
}

export function tecladoAbierto() { return activo !== null; }
export function textoEnEdicion() { return activo?.texto ?? ''; }

export function cerrarTeclado() {
  const previo = activo;
  activo = null;
  detenerBorrado();
  raiz?.classList.remove('abierto');
  previo?.alCerrar?.();
}

/** Entrega lo escrito del campo vigente antes de abrir otro (modo en vivo). */
function guardarPendiente() {
  const a = activo;
  if (!a) return;
  const cb = a.tipo === 'alfa' ? a.alEntregarFn : a.alConfirmarFn;
  if (a.tipo === 'alfa') a.alEntregarFn = null; else a.alConfirmarFn = null;
  if (!cb || !a.enVivo) return;
  if (a.tipo === 'alfa') cb(a.texto);
  else if (valido(a)) cb(valorDe(a.texto));
}

// ── alfanumérico ─────────────────────────────────────────────────────────
function construirAlfa() {
  const anchoRej = INICIO_FILA[1] + 10 * PASO - SEP;       // 1108
  const anchoFila1 = 10 * PASO - SEP;                     // 1086
  const x0 = (ANCHO_LIENZO - anchoRej) / 2;
  const el = h('div', { class: 'teclado-sub' });
  const titulo = h('div', { class: 'teclado-titulo' });
  const valor = h('div', { class: 'teclado-valor' });
  const encabezado = h('div', { class: 'teclado-enc' }, titulo, valor);
  Object.assign(encabezado.style, { left: `${x0}px`, top: `${MARGEN}px`, width: `${anchoRej - 100}px` });
  const yRej = MARGEN + 86 + SEP;
  const rej = h('div', { class: 'teclado-rej' });
  Object.assign(rej.style, { left: `${x0}px`, top: `${yRej}px`, width: `${anchoRej}px`, height: `${4 * ALTO_ALFA + 3 * SEP}px` });
  el.append(encabezado, rej);
  const letras = [];
  for (let f = 0; f < 3; f++) {
    letras[f] = [];
    for (let c = 0; c < 10; c++) {
      const k = crearTecla({ x: INICIO_FILA[f] + c * PASO, y: f * (ALTO_ALFA + SEP), w: ANCHO_TECLA, alto: ALTO_ALFA, tam: 34,
        alPulsar: () => caracter(k.car) });
      k.car = '';
      letras[f][c] = k;
      rej.append(k.el);
    }
  }
  const yF3 = 2 * (ALTO_ALFA + SEP), yF4 = 3 * (ALTO_ALFA + SEP);
  const teclaAa = crearTecla({ x: 0, y: yF3, w: ANCHO_TECLA, alto: ALTO_ALFA, texto: t('teclado.aa'), alPulsar: () => tocarMayus() });
  const borrar = crearTecla({ x: anchoFila1 - ANCHO_BORRAR, y: yF3, w: ANCHO_BORRAR, alto: ALTO_ALFA, variante: 'borrar', icono: 'borrar',
    alPresionar: () => iniciarBorrado(), alSoltar: () => detenerBorrado() });
  const capaK = crearTecla({ x: 0, y: yF4, w: ANCHO_CAPA, alto: ALTO_ALFA, texto: t('teclado.capa_numeros'), alPulsar: () => cambiarCapa() });
  const cancelar = crearTecla({ x: ANCHO_CAPA + SEP, y: yF4, w: ANCHO_CANCELAR, alto: ALTO_ALFA, variante: 'cancelar',
    texto: t('acciones.cancelar'), alPulsar: () => cancelarAlfa() });
  const xEsp = ANCHO_CAPA + SEP + ANCHO_CANCELAR + SEP;
  const xConf = anchoFila1 - ANCHO_CONFIRMAR;
  const espacio = crearTecla({ x: xEsp, y: yF4, w: xConf - SEP - xEsp, alto: ALTO_ALFA, texto: t('teclado.espacio'), alPulsar: () => caracter(' ') });
  const confirmar = crearTecla({ x: xConf, y: yF4, w: ANCHO_CONFIRMAR, alto: ALTO_ALFA, variante: 'confirmar',
    texto: t('acciones.confirmar'), alPulsar: () => confirmarAlfa() });
  rej.append(teclaAa.el, borrar.el, capaK.el, cancelar.el, espacio.el, confirmar.el);
  return { el, titulo, valor, letras, teclaAa, capaK, alto: MARGEN + 86 + SEP + 4 * ALTO_ALFA + 3 * SEP + MARGEN };
}

function refrescarAlfa() {
  const a = activo;
  if (!a || a.tipo !== 'alfa') return;
  alfa.titulo.textContent = a.titulo;
  alfa.valor.textContent = a.oculto ? '•'.repeat(a.texto.length) : a.texto;
  alfa.valor.scrollLeft = alfa.valor.scrollWidth;   // con texto largo se ve el final
  const filas = a.capa === 'letras' ? FILAS_LETRAS : FILAS_NUMEROS;
  for (let f = 0; f < 3; f++) {
    for (let c = 0; c < 10; c++) {
      const k = alfa.letras[f][c];
      const car = filas[f][c] ?? '';
      k.car = car;
      k.el.style.display = car === '' ? 'none' : '';
      k.fijar(a.capa === 'letras' && a.mayus ? car.toUpperCase() : car);
    }
  }
  alfa.teclaAa.fijar(a.fijas ? t('teclado.aa').toUpperCase() : t('teclado.aa'));
  alfa.teclaAa.marcar(a.mayus);
  alfa.capaK.fijar(a.capa === 'letras' ? t('teclado.capa_numeros') : t('teclado.capa_letras'));
}

function entregarVivo(a) { if (a.enVivo && a.alEntregarFn) a.alEntregarFn(a.texto); }

function caracter(car) {
  const a = activo;
  if (!a || a.tipo !== 'alfa' || car === '') return;
  if (a.max > 0 && a.texto.length >= a.max) return;
  const esLetra = a.capa === 'letras' && car !== ' ';
  a.texto += esLetra && a.mayus ? car.toUpperCase() : car;
  if (!a.fijas && car !== ' ') a.mayus = false;
  refrescarAlfa();
  entregarVivo(a);
}

function tocarMayus() {
  const a = activo;
  if (!a) return;
  const ahora = performance.now();
  if (a.fijas) { a.fijas = false; a.mayus = false; }
  else if (ahora - (a.ultimoAa ?? -1e9) < 400) { a.fijas = true; a.mayus = true; }
  else a.mayus = !a.mayus;
  a.ultimoAa = ahora;
  refrescarAlfa();
}

function cambiarCapa() {
  const a = activo;
  if (!a) return;
  a.capa = a.capa === 'letras' ? 'numeros' : 'letras';
  refrescarAlfa();
}

let tBorrado = null, iBorrado = null;
function borrarUno() {
  const a = activo;
  if (!a) return;
  if (a.tipo === 'alfa') {
    a.texto = a.texto.slice(0, -1);
    if (!a.fijas) a.mayus = a.texto === '';   // tras borrar todo vuelve a mayúscula inicial
    refrescarAlfa();
    entregarVivo(a);
  } else {
    a.reemplazar = false;
    cambiarNum(a, a.texto.slice(0, -1));
  }
}
function iniciarBorrado() {
  detenerBorrado();
  borrarUno();
  tBorrado = setTimeout(() => { iBorrado = setInterval(borrarUno, 90); }, 450);
}
function detenerBorrado() { clearTimeout(tBorrado); clearInterval(iBorrado); tBorrado = iBorrado = null; }

function confirmarAlfa() {
  const a = activo;
  if (!a) return;
  if (!a.enVivo) {   // modo acción: una sola entrega, Confirmar vacío no hace nada
    if (a.texto.trim() === '') return;
    const cb = a.alEntregarFn;
    a.alEntregarFn = null;
    cerrarTeclado();
    cb?.(a.texto);
    return;
  }
  const cb = a.alEntregarFn;
  a.alEntregarFn = null;
  cb?.(a.texto);
  if (a.alSiguiente) a.alSiguiente();   // abre el campo siguiente sin cerrar el panel
  else { const fin = a.alTerminar; cerrarTeclado(); fin?.(); }
}

function cancelarAlfa() {
  const a = activo;
  if (!a) return;
  const cb = a.enVivo ? a.alEntregarFn : null;
  a.alEntregarFn = null;
  cerrarTeclado();
  cb?.('');
}

function abrirAlfa(o, enVivo) {
  guardarPendiente();
  const previo = activo;
  activo = null;
  if (previo?.alCerrar && previo.alCerrar !== o.alCerrar) previo.alCerrar();
  if (!alfa) { asegurarRaiz(); alfa = construirAlfa(); raiz.append(alfa.el); }
  const valor = String(o.valor ?? '');
  activo = { tipo: 'alfa', titulo: o.titulo ?? '', texto: valor, max: o.maxLargo ?? 0, oculto: o.oculto === true,
    mayus: valor === '', fijas: false, capa: 'letras', enVivo, alEntregarFn: o.alEntregar ?? null,
    alSiguiente: enVivo ? (o.alSiguiente ?? null) : null, alTerminar: o.alTerminar ?? null, alCerrar: o.alCerrar ?? null };
  refrescarAlfa();
  mostrar(alfa, alfa.alto);
}

export function abrirAlfanumerico(o = {}) { abrirAlfa(o, true); }
export function abrirAlfanumericoAccion(o = {}) { abrirAlfa(o, false); }

// ── numérico ─────────────────────────────────────────────────────────────
function valorDe(txt) {
  if (txt === '' || txt === '-' || txt === '.' || txt === '-.') return null;
  const n = Number(txt);
  return Number.isFinite(n) ? n : null;
}
const valido = (a) => { const v = valorDe(a.texto); return v !== null && v >= a.min && v <= a.max; };
const textoLimite = (v, dec) => (Number.isFinite(v) ? (dec > 0 ? v.toFixed(dec) : String(Math.round(v))) : '');

function construirNum() {
  const anchoRej = 4 * ANCHO_NUM + 3 * SEP;
  const x0 = (ANCHO_LIENZO - anchoRej) / 2;
  const el = h('div', { class: 'teclado-sub' });
  const titulo = h('div', { class: 'teclado-titulo' });
  const valor = h('span', { class: 'teclado-valor-num' });
  const unidad = h('span', { class: 'teclado-unidad' });
  const fila = h('div', { class: 'teclado-fila-valor' }, valor, unidad);
  const rango = h('div', { class: 'teclado-rango' });
  const encabezado = h('div', { class: 'teclado-enc' }, titulo, fila, rango);
  Object.assign(encabezado.style, { left: `${x0}px`, top: `${MARGEN}px`, width: `${anchoRej - 100}px` });
  const yRej = MARGEN + 120 + SEP;
  const rej = h('div', { class: 'teclado-rej' });
  Object.assign(rej.style, { left: `${x0}px`, top: `${yRej}px`, width: `${anchoRej}px`, height: `${4 * ALTO_NUM + 3 * SEP}px` });
  el.append(encabezado, rej);
  const teclas = {};
  FILAS_NUM.forEach((fl, f) => [...fl].forEach((c, i) => {
    const k = crearTecla({ x: i * (ANCHO_NUM + SEP), y: f * (ALTO_NUM + SEP), w: ANCHO_NUM, alto: ALTO_NUM, tam: 34, texto: c,
      alPulsar: () => teclaNum(c) });
    teclas[c] = k;
    rej.append(k.el);
  }));
  const xA = 3 * (ANCHO_NUM + SEP);
  rej.append(
    crearTecla({ x: xA, y: 0, w: ANCHO_NUM, alto: ALTO_NUM, variante: 'cancelar', texto: t('acciones.cancelar'), alPulsar: () => cancelarNum() }).el,
    crearTecla({ x: xA, y: ALTO_NUM + SEP, w: ANCHO_NUM, alto: ALTO_NUM, variante: 'borrar', icono: 'borrar',
      alPresionar: () => iniciarBorrado(), alSoltar: () => detenerBorrado() }).el,
    crearTecla({ x: xA, y: 2 * (ALTO_NUM + SEP), w: ANCHO_NUM, alto: 2 * ALTO_NUM + SEP, variante: 'confirmar',
      texto: t('acciones.confirmar'), alPulsar: () => confirmarNum() }).el,
  );
  return { el, titulo, valor, unidad, rango, teclas, alto: MARGEN + 120 + SEP + 4 * ALTO_NUM + 3 * SEP + MARGEN };
}

function refrescarNum() {
  const a = activo;
  if (!a || a.tipo !== 'num') return;
  num.titulo.textContent = a.titulo;
  num.valor.textContent = a.texto === '' ? ' ' : a.texto;
  num.unidad.textContent = a.unidad;
  num.rango.textContent = t('teclado.rango', { minimo: textoLimite(a.min, a.dec), maximo: textoLimite(a.max, a.dec), unidad: a.unidad }).trim();
  num.rango.classList.toggle('fuera', a.fuera);
  num.teclas['-'].el.style.opacity = a.min < 0 ? '' : '0.4';
  num.teclas['.'].el.style.opacity = a.dec > 0 ? '' : '0.4';
}

function cambiarNum(a, texto) {
  a.fuera = false;
  if (texto !== a.texto) {
    a.texto = texto;
    if (a.alConfirmarFn && valido(a)) { a.comprometido = true; a.alConfirmarFn(valorDe(a.texto)); }
  }
  refrescarNum();
}

function baseNum(a) { if (a.reemplazar) { a.reemplazar = false; return ''; } return a.texto; }

function teclaNum(c) {
  const a = activo;
  if (!a || a.tipo !== 'num') return;
  if (c === '-') {
    if (a.min >= 0) return;
    const base = baseNum(a);
    cambiarNum(a, base.startsWith('-') ? base.slice(1) : `-${base}`);
  } else if (c === '.') {
    if (a.dec <= 0) return;
    const base = baseNum(a);
    if (base.includes('.')) return cambiarNum(a, base);
    cambiarNum(a, base === '' ? '0.' : base === '-' ? '-0.' : `${base}.`);
  } else {
    let base = baseNum(a);
    if (base === '0') base = ''; else if (base === '-0') base = '-';
    const i = base.indexOf('.');
    if (i >= 0 && base.length - i - 1 >= a.dec) return cambiarNum(a, base);
    if (base.replace('-', '').length >= 12) return cambiarNum(a, base);
    cambiarNum(a, base + c);
  }
}

function confirmarNum() {
  const a = activo;
  if (!a) return;
  if (!valido(a)) { a.fuera = true; refrescarNum(); return; }
  const v = valorDe(a.texto);
  const cb = a.alConfirmarFn;
  a.alConfirmarFn = null;
  cb?.(v);
  if (a.alSiguiente) a.alSiguiente();
  else { const fin = a.alTerminar; cerrarTeclado(); fin?.(); }
}

function cancelarNum() {
  const a = activo;
  if (!a) return;
  const cb = a.alConfirmarFn;
  const restaurar = a.comprometido;
  const inicial = a.inicial;
  a.alConfirmarFn = null;
  cerrarTeclado();
  if (restaurar) cb?.(inicial);   // el valor se aplicó al escribir: se devuelve
}

export function abrirNumerico(o = {}) {
  guardarPendiente();
  const previo = activo;
  activo = null;
  if (previo?.alCerrar && previo.alCerrar !== o.alCerrar) previo.alCerrar();
  if (!num) { asegurarRaiz(); num = construirNum(); raiz.append(num.el); }
  const dec = o.decimales ?? 0;
  const ini = o.valor;
  const texto = ini == null || ini === '' || !Number.isFinite(Number(ini)) ? ''
    : (dec > 0 ? Number(ini).toFixed(dec) : String(Math.round(Number(ini))));
  activo = { tipo: 'num', titulo: o.titulo ?? '', unidad: o.unidad ?? '', min: o.min ?? -Infinity, max: o.max ?? Infinity, dec,
    texto, reemplazar: texto !== '', inicial: ini, comprometido: false, fuera: false, enVivo: true,
    alConfirmarFn: o.alConfirmar ?? null, alSiguiente: o.alSiguiente ?? null, alTerminar: o.alTerminar ?? null, alCerrar: o.alCerrar ?? null };
  refrescarNum();
  mostrar(num, num.alto);
}
