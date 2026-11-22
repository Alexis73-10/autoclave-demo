// Intro de arranque (Pantallas/IntroArranque.qml): animación de 3,5 s "del vapor a la precisión" —halo,
// voluta de vapor, logo que se dibuja, riel que baja y se vuelve barra de progreso— y salida suave al
// Reposo (pop). El progreso es simulado: en el equipo real lo da el arranque del control.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { pop } from '../../core/router.js';
import { VERSION_DEMO } from '../../../version.js';
import { crearFondoApp } from '../componentes/fondo_app.js';

const DURACION = 3.5;
const PROGRESO_S = 1.3;    // duración del arranque simulado tras la intro
const SALIDA_S = 1.0;
const W = 1200, H = 1920;
const clamp = (x) => Math.max(0, Math.min(1, x));
const outCubic = (x) => 1 - (1 - x) ** 3;
const inOutQuad = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const lerp = (a, b, x) => a + (b - a) * x;

const PROCESOS = ['iniciando_servicios', 'cargando_configuracion', 'abriendo_base_datos', 'conectando_modulo_es', 'verificando_sensores', 'preparando_interfaz'];

export function crear() {
  const el = h('div', { class: 'in-raiz' });
  const logoAlto = 480 * 446 / 1666;
  const centroLogoY = 0.38 * H;
  const yLineaInicial = centroLogoY + logoAlto / 2 + 30;
  const yBarra = 0.665 * H;

  const tapa = h('div', { class: 'in-tapa' });
  const halo = h('img', { class: 'in-halo', src: 'assets/fondos/halo_arranque.png', alt: '', draggable: 'false' });
  Object.assign(halo.style, { left: `${W / 2 - 256}px`, top: `${centroLogoY - 256}px` });
  const volutas = [0.40, 0.52, 0.62].map((x) => {
    const v = h('img', { class: 'in-voluta', src: 'assets/fondos/voluta_vapor.png', alt: '', draggable: 'false' });
    Object.assign(v.style, { left: `${W * x - 84}px`, top: `${centroLogoY - 336 * 0.2}px` });
    return v;
  });
  const logoImg = h('img', { src: 'assets/logo/logo-especifika-blanco.svg', alt: '', draggable: 'false' });
  Object.assign(logoImg.style, { left: '0', top: '0', width: '480px', height: `${logoAlto}px` });
  const logoCaja = h('div', { class: 'in-logo' }, logoImg);
  Object.assign(logoCaja.style, { top: `${centroLogoY - logoAlto / 2}px`, height: `${logoAlto}px` });
  const riel = h('div', { class: 'in-riel' });
  const relleno = h('div', { class: 'in-relleno' });
  const eslogan = (txt, y) => { const e = h('div', { class: 'in-eslogan', text: txt }); e.dataset.y = y; return e; };
  const eslogans = [eslogan('Tecnología para esterilizar.', 0.475 * H), eslogan('Ingeniería para responder.', 0.515 * H)];
  const proceso = h('div', { class: 'in-proceso' });
  proceso.style.top = `${yBarra + 7 + 34}px`;
  const pie = h('div', { class: 'in-pie', text: `Autoclave Demo  ·  ${t('arranque.version_software', { version: VERSION_DEMO })}` });
  el.append(crearFondoApp('reposo'), tapa, halo, ...volutas, logoCaja, riel, relleno, ...eslogans, proceso, pie);

  let raf = 0;
  let inicio = null;
  let terminado = false;
  let ultimoProceso = '';

  function frame(ahora) {
    if (terminado) return;
    inicio ??= ahora;
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
    const radio = W * (0.10 * pHalo + 1.0 * pRevela);
    halo.style.transform = `scale(${(4 * radio) / 512})`;
    halo.style.opacity = pHalo * (1 - pRevela);
    volutas.forEach((v, i) => {
      const a = [0.6, 0.7, 0.8][i];
      const p = inOutQuad(clamp((tt - a) / 0.6));
      v.style.transform = `translateY(${-H * 0.07 * p}px)`;
      v.style.opacity = 0.06 * Math.sin(Math.PI * p);
    });
    const wLogo = 480 * pDibujo;
    logoCaja.style.width = `${wLogo}px`;
    logoCaja.style.left = `${(W - wLogo) / 2}px`;
    logoImg.style.left = `${(wLogo - 480) / 2}px`;
    logoCaja.style.opacity = vs;
    const wRiel = pBaja > 0 ? lerp(0.56, 0.72, pBaja) * W : 0.56 * W * pDibujo;
    const hRiel = lerp(3, 14, pBaja);
    const cy = lerp(yLineaInicial, yBarra, pBaja);
    Object.assign(riel.style, { width: `${wRiel}px`, height: `${hRiel}px`, left: `${(W - wRiel) / 2}px`, top: `${cy - hRiel / 2}px`,
      borderRadius: `${hRiel / 2}px`, opacity: lerp(0.95, 0.25, pRiel) * vs, display: wRiel > 0 ? '' : 'none' });
    const wRel = 0.72 * W * fraccion;
    Object.assign(relleno.style, { width: `${wRel}px`, left: `${(W - 0.72 * W) / 2}px`, top: `${yBarra - 7}px`,
      opacity: 0.9 * vs, display: tt >= DURACION && wRel > 0 ? '' : 'none' });
    [pE1, pE2].forEach((p, i) => {
      const e = eslogans[i];
      e.style.top = `${Number(e.dataset.y) - 29 + 10 * (1 - p)}px`;
      e.style.opacity = 0.95 * p * vs;
    });
    const idx = Math.min(PROCESOS.length - 1, Math.floor(fraccion * PROCESOS.length));
    const nombre = tt >= DURACION ? PROCESOS[idx] : PROCESOS[0];
    if (nombre !== ultimoProceso) { ultimoProceso = nombre; proceso.textContent = t(`arranque.${nombre}`); }
    proceso.style.opacity = 0.9 * pTextos * vs;
    pie.style.opacity = 0.85 * pTextos * vs;

    if (s >= 1) { terminado = true; pop(); return; }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return { el, destruir() { terminado = true; cancelAnimationFrame(raf); } };
}
