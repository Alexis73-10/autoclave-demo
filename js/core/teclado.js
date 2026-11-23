// PanelTeclado: teclado en pantalla alfanumérico y numérico (Componentes/PanelTeclado.qml,
// TecladoAlfanumerico.qml, TecladoNumerico.qml y Tecla.qml del software real).
//
// API (compatible con el esqueleto anterior):
//   abrirAlfanumerico({titulo, valor, oculto, maxLargo, alEntregar(texto), alSiguiente, alTerminar, alCerrar, campo})
//     Modo "en vivo": alEntregar recibe el texto en cada tecla, al abrir otro campo y "" al cancelar.
//     Solo para asignar texto a una propiedad. alSiguiente (opcional) abre el campo siguiente sin cerrar
//     el panel al Confirmar; alTerminar se llama al Confirmar cuando no hay siguiente.
//   abrirAlfanumericoAccion({titulo, valor, oculto, maxLargo, alEntregar(texto), alCerrar, campo})
//     Una sola entrega al Confirmar con texto (Confirmar vacío no hace nada); para callbacks que ejecutan algo.
//   abrirNumerico({titulo, valor, unidad, min, max, decimales, alConfirmar(valor), alSiguiente, alTerminar, alCerrar, campo})
//     Entrega en vivo cada valor válido; Confirmar fuera de rango muestra el rango en rojo y no cierra.
//   cerrarTeclado(), tecladoAbierto(), textoEnEdicion()
//
// Composición adaptable: el panel ocupa el ancho de la ventana (el contenido se limita en tabletas y en
// horizontal) y su alto sale del alto real de la ventana; las teclas miden al menos 44 px de alto. Al
// abrir fija --alto-teclado (px) y la clase `teclado-abierto` en <html> (base.css da ese padding a los
// .desplazable) y lleva el campo en edición —la opción `campo`, o si falta el último elemento tocado en
// #pila / #capa-modal— al centro de la parte visible por encima del teclado. Al cerrar los quita.
import { h, iconoMono } from './dom.js';
import { t } from './i18n.js';
import { tocar } from './sonido.js';
import { on } from './eventos.js';

const MIN_PRESIONADA_MS = 90;
const FILAS_LETRAS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
const FILAS_NUMEROS = ['1234567890', '@._-+*/=()', '¿?¡!:"\''];
const FILAS_NUM = ['789', '456', '123', '-0.'];
// Proporciones de las teclas especiales (Tema/Teclado.qml: tecla 96, borrar 206, capa 110, cancelar 190, confirmar 220)
const EXCEPCION_TECLA = 'tecla del teclado en pantalla: alto mínimo de 44 px; el ancho lo limitan las 10 columnas';

const capa = () => document.getElementById('capa-teclado');
const raizHtml = document.documentElement;
let raiz = null;             // contenedor animado
let alfa = null, num = null; // sub-paneles
let activo = null;           // estado del campo abierto
let campoActual = null;      // elemento que se está editando (para no taparlo)
let ultimoTocado = null;     // último elemento tocado en #pila / #capa-modal

// Último elemento tocado (si quien abre no pasa `campo`)
document.addEventListener('pointerdown', (e) => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  if (el.closest('#pila') || el.closest('#capa-modal')) ultimoTocado = el;
}, { capture: true, passive: true });

// ── tecla ────────────────────────────────────────────────────────────────
function crearTecla({ texto, icono, variante = 'normal', clase = '', alPulsar, alPresionar, alSoltar }) {
  const el = h('button', { class: `tk tk-${variante} ${clase}`, type: 'button', 'data-toque-excepcion': EXCEPCION_TECLA });
  const api = {
    el, marcada: false,
    fijar(txt) { if (!icono) el.textContent = txt; },
    marcar(v) { api.marcada = v; el.classList.toggle('tk-pres', v); },
  };
  if (icono) el.append(iconoMono(icono, { tam: null, color: 'var(--c-texto-primario)', clase: 'tk-ico' }));
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

const fila = (clase, ...teclas) => h('div', { class: `teclado-fila ${clase}` }, ...teclas.map((k) => k.el ?? k));

// ── contenedor ───────────────────────────────────────────────────────────
function asegurarRaiz() {
  if (raiz) return;
  raiz = h('div', { class: 'teclado-panel' });
  const ocultar = h('button', { class: 'teclado-ocultar', type: 'button', 'aria-label': 'Ocultar teclado',
    onpointerdown: (e) => { e.preventDefault(); cerrarTeclado(); } },
    h('img', { src: 'assets/iconos/color/ocultar_teclado.svg', alt: '', draggable: 'false' }));
  raiz.append(ocultar);
  capa().append(raiz);
  // al girar o cambiar el tamaño, se recalcula el alto y se vuelve a llevar el campo a la vista
  on('disposicion', () => { if (activo) requestAnimationFrame(acomodar); });
  window.addEventListener('resize', () => { if (activo) requestAnimationFrame(acomodar); });
}

/** Alto de las teclas según el alto real de la ventana (mínimo 44 px). */
function medirTeclas() {
  const alto = window.innerHeight || 640;
  const ancho = window.innerWidth || 360;
  const horizontal = ancho > alto;
  const compacto = alto < 520;
  // fracción del alto que puede ocupar el teclado (encabezado incluido)
  const fraccion = horizontal ? (compacto ? 0.66 : 0.5) : 0.42;
  const encabezado = compacto ? 40 : 76;
  const tecla = Math.round(Math.max(44, Math.min(compacto ? 52 : 84, (alto * fraccion - encabezado - 24) / 4.3)));
  raiz.style.setProperty('--alto-tecla', `${tecla}px`);
  raiz.classList.toggle('compacto', compacto);
}

function mostrar(subpanel) {
  asegurarRaiz();
  for (const p of [alfa, num]) if (p) p.el.style.display = p === subpanel ? '' : 'none';
  medirTeclas();
  void raiz.offsetHeight;   // la transición parte de "cerrado" la primera vez
  raiz.classList.add('abierto');
  raizHtml.classList.add('teclado-abierto');
  acomodar();
  // tras el cambio de composición (barras que se ocultan) y al terminar la subida, otra vez
  requestAnimationFrame(() => requestAnimationFrame(acomodar));
  setTimeout(acomodar, 420);
}

/** Fija --alto-teclado y lleva el campo en edición al centro de la parte visible sobre el teclado. */
function acomodar() {
  if (!activo || !raiz) return;
  medirTeclas();
  const alto = Math.round(raiz.getBoundingClientRect().height);
  raizHtml.style.setProperty('--alto-teclado', `${alto}px`);
  llevarALaVista(campoActual, alto);
}

function contenedorDesplazable(el) {
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
    const cs = getComputedStyle(a);
    if (/(auto|scroll)/.test(cs.overflowY) && a.scrollHeight > a.clientHeight + 1) return a;
  }
  return null;
}

function llevarALaVista(campo, altoTeclado) {
  if (!campo || !campo.isConnected) return;
  const topeTeclado = (window.innerHeight || 0) - altoTeclado;
  // (no se usa scrollIntoView: también desplaza los contenedores con overflow:hidden —la pantalla, el
  // lienzo— y descuadraría la composición; se desplaza solo el panel .desplazable que contiene el campo)
  const desp = contenedorDesplazable(campo);
  if (!desp) return;
  // centro de la zona del panel que queda visible por encima del teclado
  const rd = desp.getBoundingClientRect();
  const arriba = Math.max(rd.top, 0);
  const abajo = Math.min(rd.bottom, topeTeclado);
  const rc = campo.getBoundingClientRect();
  if (abajo - arriba < 8) return;
  const delta = (rc.top + rc.height / 2) - (arriba + abajo) / 2;
  // si el campo no cabe, que se vea su parte de arriba
  const ajuste = rc.height > abajo - arriba ? rc.top - arriba - 4 : delta;
  desp.scrollTop += ajuste;
}

export function tecladoAbierto() { return activo !== null; }
export function textoEnEdicion() { return activo?.texto ?? ''; }

export function cerrarTeclado() {
  const previo = activo;
  activo = null;
  campoActual = null;
  detenerBorrado();
  raiz?.classList.remove('abierto');
  raizHtml.classList.remove('teclado-abierto');
  raizHtml.style.setProperty('--alto-teclado', '0px');
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

function elegirCampo(o) {
  const c = o.campo instanceof Element ? o.campo : ultimoTocado;
  return c?.isConnected ? c : null;
}

// ── alfanumérico ─────────────────────────────────────────────────────────
function construirAlfa() {
  const titulo = h('div', { class: 'teclado-titulo' });
  const valor = h('div', { class: 'teclado-valor', 'data-recorte-permitido': 'muestra el final del texto largo, como el campo del QML' });
  const encabezado = h('div', { class: 'teclado-enc' }, titulo, valor);
  const letras = [];
  const filasLetras = [];
  for (let f = 0; f < 3; f++) {
    letras[f] = [];
    for (let c = 0; c < 10; c++) {
      const k = crearTecla({ alPulsar: () => caracter(k.car), clase: 'tk-letra' });
      k.car = '';
      letras[f][c] = k;
    }
  }
  const teclaAa = crearTecla({ texto: t('teclado.aa'), clase: 'tk-aa', alPulsar: () => tocarMayus() });
  const borrar = crearTecla({ variante: 'borrar', icono: 'borrar', clase: 'tk-ancha', alPresionar: () => iniciarBorrado(), alSoltar: () => detenerBorrado() });
  const capaK = crearTecla({ texto: t('teclado.capa_numeros'), clase: 'tk-capa', alPulsar: () => cambiarCapa() });
  const cancelar = crearTecla({ variante: 'cancelar', clase: 'tk-esp-cancelar', texto: t('acciones.cancelar'), alPulsar: () => cancelarAlfa() });
  const espacio = crearTecla({ texto: t('teclado.espacio'), clase: 'tk-espacio', alPulsar: () => caracter(' ') });
  const confirmar = crearTecla({ variante: 'confirmar', clase: 'tk-esp-confirmar', texto: t('acciones.confirmar'), alPulsar: () => confirmarAlfa() });
  filasLetras.push(
    fila('f1', ...letras[0]),
    fila('f2', ...letras[1]),
    fila('f3', teclaAa, ...letras[2].slice(0, 7), borrar),
    fila('f4', capaK, cancelar, espacio, confirmar));
  // las teclas 8 a 10 de la tercera fila no existen en esta capa (solo 7 letras)
  letras[2].slice(7).forEach((k) => { k.el.style.display = 'none'; });
  const rej = h('div', { class: 'teclado-rej alfa' }, ...filasLetras);
  const el = h('div', { class: 'teclado-sub' }, h('div', { class: 'teclado-marco alfa' }, encabezado, rej));
  return { el, titulo, valor, letras, teclaAa, capaK };
}

function refrescarAlfa() {
  const a = activo;
  if (!a || a.tipo !== 'alfa') return;
  alfa.titulo.textContent = a.titulo;
  alfa.valor.textContent = a.oculto ? '•'.repeat(a.texto.length) : a.texto;
  alfa.valor.scrollLeft = alfa.valor.scrollWidth;   // con texto largo se ve el final
  const filas = a.capa === 'letras' ? FILAS_LETRAS : FILAS_NUMEROS;
  for (let f = 0; f < 3; f++) {
    for (let c = 0; c < (f === 2 ? 7 : 10); c++) {
      const k = alfa.letras[f][c];
      const car = filas[f][c] ?? '';
      k.car = car;
      k.el.style.visibility = car === '' ? 'hidden' : '';
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
  campoActual = elegirCampo(o);
  refrescarAlfa();
  mostrar(alfa);
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
  const titulo = h('div', { class: 'teclado-titulo' });
  const valor = h('span', { class: 'teclado-valor-num' });
  const unidad = h('span', { class: 'teclado-unidad' });
  const filaValor = h('div', { class: 'teclado-fila-valor' }, valor, unidad);
  const rango = h('div', { class: 'teclado-rango' });
  const encabezado = h('div', { class: 'teclado-enc' }, titulo, filaValor, rango);
  const teclas = {};
  const rej = h('div', { class: 'teclado-rej num' });
  FILAS_NUM.forEach((fl, f) => [...fl].forEach((c, i) => {
    const k = crearTecla({ texto: c, alPulsar: () => teclaNum(c) });
    k.el.style.gridRow = String(f + 1);
    k.el.style.gridColumn = String(i + 1);
    teclas[c] = k;
    rej.append(k.el);
  }));
  const cancelar = crearTecla({ variante: 'cancelar', texto: t('acciones.cancelar'), alPulsar: () => cancelarNum() });
  const borrar = crearTecla({ variante: 'borrar', icono: 'borrar', alPresionar: () => iniciarBorrado(), alSoltar: () => detenerBorrado() });
  const confirmar = crearTecla({ variante: 'confirmar', texto: t('acciones.confirmar'), alPulsar: () => confirmarNum() });
  Object.assign(cancelar.el.style, { gridRow: '1', gridColumn: '4' });
  Object.assign(borrar.el.style, { gridRow: '2', gridColumn: '4' });
  Object.assign(confirmar.el.style, { gridRow: '3 / span 2', gridColumn: '4' });
  rej.append(cancelar.el, borrar.el, confirmar.el);
  const el = h('div', { class: 'teclado-sub' }, h('div', { class: 'teclado-marco num' }, encabezado, rej));
  return { el, titulo, valor, unidad, rango, teclas };
}

function refrescarNum() {
  const a = activo;
  if (!a || a.tipo !== 'num') return;
  num.titulo.textContent = a.titulo;
  num.valor.textContent = a.texto === '' ? ' ' : a.texto;
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
  campoActual = elegirCampo(o);
  refrescarNum();
  mostrar(num);
}
