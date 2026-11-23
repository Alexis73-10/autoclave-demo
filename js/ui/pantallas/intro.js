// Intro de arranque (Pantallas/IntroArranque.qml): animación de 3,5 s "del vapor a la precisión" —halo,
// voluta de vapor, logo que se dibuja, riel que baja y se vuelve barra de progreso— y salida suave al
// Reposo (pop). El progreso es simulado: en el equipo real lo da el arranque del control.
//
// Composición adaptable: cada cuadro mide la ventana real (W x H) y anima en proporción. El logo mide un
// 40 % del ancho en vertical y un 25 % en horizontal (como la intro real a 1920x1200), acotado por el
// alto y por los márgenes, de modo que nunca se recorta; el riel y la barra son 1,4 y 1,8 veces el logo.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { pop } from '../../core/router.js';
import { VERSION_DEMO } from '../../../version.js';
import { crearFondoApp } from '../componentes/fondo_app.js';

const DURACION = 3.5;
const PROGRESO_S = 1.3;    // duración del arranque simulado tras la intro
const SALIDA_S = 1.0;
const ASPECTO_LOGO = 446 / 1666;
const clamp = (x) => Math.max(0, Math.min(1, x));
const outCubic = (x) => 1 - (1 - x) ** 3;
const inOutQuad = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const lerp = (a, b, x) => a + (b - a) * x;

const PROCESOS = ['iniciando_servicios', 'cargando_configuracion', 'abriendo_base_datos', 'conectando_modulo_es', 'verificando_sensores', 'preparando_interfaz'];

// Posiciones verticales (fracción del alto) de la intro real: vertical 1200x1920 y horizontal 1920x1200.
const POS = {
  v: { logo: 0.38, e1: 0.475, e2: 0.515, barra: 0.665, proceso: 0.69, pie: 0.925, anchoLogo: 0.40 },
  h: { logo: 0.275, e1: 0.43, e2: 0.49, barra: 0.73, proceso: 0.785, pie: 0.935, anchoLogo: 0.25 },
};

/** Geometría de la intro para una ventana W x H (px reales). */
function geometria(W, H, margen) {
  const p = W >= H ? POS.h : POS.v;
  // el logo no pasa de su fracción del ancho, del 16 % del alto ni del ancho útil (sin recorte)
  const logoW = Math.max(60, Math.min(W * p.anchoLogo, (H * 0.16) / ASPECTO_LOGO, (W - 2 * margen) / 1.8));
  const logoH = logoW * ASPECTO_LOGO;
  const k = logoW / 480;   // escala respecto a la intro del QML
  const centroLogoY = p.logo * H;
  return { p, logoW, logoH, k, centroLogoY, yLineaInicial: centroLogoY + logoH / 2 + 30 * k, yBarra: p.barra * H };
}

export function crear() {
  const el = h('div', { class: 'in-raiz', 'data-solape-permitido': '' });
  const tapa = h('div', { class: 'in-tapa' });
  const halo = h('img', { class: 'in-halo', src: 'assets/fondos/halo_arranque.png', alt: '', draggable: 'false', 'data-recorte-permitido': '' });
  const volutas = [0.40, 0.52, 0.62].map((x) => {
    const v = h('img', { class: 'in-voluta', src: 'assets/fondos/voluta_vapor.png', alt: '', draggable: 'false', 'data-recorte-permitido': '' });
    v.dataset.x = x;
    return v;
  });
  const logoImg = h('img', { class: 'in-logo-img', src: 'assets/logo/logo-especifika-blanco.svg', alt: 'Especifika', draggable: 'false' });
  const logoCaja = h('div', { class: 'in-logo', 'data-recorte-permitido': '' }, logoImg);
  const riel = h('div', { class: 'in-riel' });
  const relleno = h('div', { class: 'in-relleno' });
  const eslogans = [h('div', { class: 'in-eslogan', text: 'Tecnología para esterilizar.' }), h('div', { class: 'in-eslogan', text: 'Ingeniería para responder.' })];
  const proceso = h('div', { class: 'in-proceso' });
  const pie = h('div', { class: 'in-pie', text: `Autoclave Demo  ·  ${t('arranque.version_software', { version: VERSION_DEMO })}` });
  el.append(crearFondoApp('reposo'), tapa, halo, ...volutas, logoCaja, riel, relleno, ...eslogans, proceso, pie);

  let raf = 0;
  let inicio = null;
  let terminado = false;
  let ultimoProceso = '';

  function frame(ahora) {
    if (terminado) return;
    inicio ??= ahora;
    const W = el.clientWidth || window.innerWidth;
    const H = el.clientHeight || window.innerHeight;
    const margen = parseFloat(getComputedStyle(el).getPropertyValue('--margen-intro')) || 16;
    const g = geometria(W, H, margen);
    const tt = Math.min(DURACION, (ahora - inicio) / 1000);
    const extra = Math.max(0, (ahora - inicio) / 1000 - DURACION);   // tras la intro
    const fraccion = clamp(extra / PROGRESO_S);
    const s = clamp((extra - PROGRESO_S - 0.15) / SALIDA_S);
    const tramo = (a, b) => clamp((tt - a) / (b - a));
    const pHalo = outCubic(tramo(0, 0.6)), pRevela = inOutQuad(tramo(0.6, 1.4)), pDibujo = outCubic(tramo(1.4, 2.2));
    const pBaja = inOutQuad(tramo(2.2, 2.65)), pRiel = inOutQuad(tramo(2.6, 3.0));
    const pE1 = outCubic(tramo(2.55, 3.05)), pE2 = outCubic(tramo(2.75, 3.25)), pTextos = inOutQuad(tramo(3.0, 3.5));
    const vs = 1 - inOutQuad(clamp((s - 0.4) / 0.6));

    tapa.style.opacity = 1 - pRevela;
    // halo: crece desde el centro del logo hasta cubrir la ventana
    const radio = Math.max(W, H) * (0.10 * pHalo + 1.0 * pRevela);
    Object.assign(halo.style, { left: `${W / 2 - 256}px`, top: `${g.centroLogoY - 256}px`,
      transform: `scale(${(4 * radio) / 512})`, opacity: pHalo * (1 - pRevela) });
    volutas.forEach((v, i) => {
      const a = [0.6, 0.7, 0.8][i];
      const p = inOutQuad(clamp((tt - a) / 0.6));
      const vw = 168 * g.k, vh = 336 * g.k;
      Object.assign(v.style, { width: `${vw}px`, height: `${vh}px`, left: `${W * Number(v.dataset.x) - vw / 2}px`,
        top: `${g.centroLogoY - vh * 0.2}px`, transform: `translateY(${-H * 0.07 * p}px)`, opacity: 0.06 * Math.sin(Math.PI * p) });
    });
    // logo que se dibuja de izquierda a derecha desde el centro (revelado); al terminar, sin recorte
    const wLogo = g.logoW * pDibujo;
    Object.assign(logoCaja.style, { width: `${wLogo}px`, height: `${g.logoH}px`, left: `${(W - wLogo) / 2}px`,
      top: `${g.centroLogoY - g.logoH / 2}px`, opacity: vs, overflow: pDibujo >= 1 ? 'visible' : 'hidden' });
    Object.assign(logoImg.style, { width: `${g.logoW}px`, height: `${g.logoH}px`, left: `${(wLogo - g.logoW) / 2}px` });
    const anchoBarra = g.logoW * 1.8;
    const wRiel = pBaja > 0 ? lerp(g.logoW * 1.4, anchoBarra, pBaja) : g.logoW * 1.4 * pDibujo;
    const grosor = Math.max(5, 14 * g.k);
    const hRiel = lerp(Math.max(2, 3 * g.k), grosor, pBaja);
    const cy = lerp(g.yLineaInicial, g.yBarra, pBaja);
    Object.assign(riel.style, { width: `${wRiel}px`, height: `${hRiel}px`, left: `${(W - wRiel) / 2}px`, top: `${cy - hRiel / 2}px`,
      borderRadius: `${hRiel / 2}px`, opacity: lerp(0.95, 0.25, pRiel) * vs, display: wRiel > 0 ? '' : 'none' });
    const wRel = anchoBarra * fraccion;
    Object.assign(relleno.style, { width: `${wRel}px`, height: `${grosor}px`, borderRadius: `${grosor / 2}px`, left: `${(W - anchoBarra) / 2}px`,
      top: `${g.yBarra - grosor / 2}px`, opacity: 0.9 * vs, display: tt >= DURACION && wRel > 0 ? '' : 'none' });
    [pE1, pE2].forEach((p, i) => {
      const e = eslogans[i];
      e.style.top = `${(i ? g.p.e2 : g.p.e1) * H + 10 * g.k * (1 - p)}px`;
      e.style.opacity = 0.95 * p * vs;
    });
    const idx = Math.min(PROCESOS.length - 1, Math.floor(fraccion * PROCESOS.length));
    const nombre = tt >= DURACION ? PROCESOS[idx] : PROCESOS[0];
    if (nombre !== ultimoProceso) { ultimoProceso = nombre; proceso.textContent = t(`arranque.${nombre}`); }
    proceso.style.top = `${Math.max(g.p.proceso * H, g.yBarra + grosor)}px`;
    proceso.style.opacity = 0.9 * pTextos * vs;
    pie.style.top = `${g.p.pie * H}px`;
    pie.style.opacity = 0.85 * pTextos * vs;

    if (s >= 1) { terminado = true; pop(); return; }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return { el, destruir() { terminado = true; cancelAnimationFrame(raf); } };
}
