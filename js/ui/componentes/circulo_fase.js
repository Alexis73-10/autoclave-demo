// CirculoFaseLiquido (Componentes/CirculoFaseLiquido.qml): círculo de 85 de una
// fase con llenado líquido. Estados pendiente / activa / completada / fallida /
// interrumpida. El líquido es un polígono (36 pasos) recortado al círculo con
// superficie ondulada (amplitud 2 solo en la activa con datos vigentes, φ 0→2π cada
// 2500 ms); nivel con tope 0,90 mientras la fase está activa (0,25 sin fracción).
// Vapor decorativo (tanda 34, VAP-01..05): vapor del tubo (tope 90), bocanadas desde
// la superficie (tope 12) y burbujas en la última completada (tope 20); solo
// círculos (divs redondos movidos con transform), sin canvas. La animación la mueve
// barra_fases.js con un único requestAnimationFrame (paso(dt)).
// Composición adaptable: el diámetro real lo fija barra_fases (fijarTamano(d), px); el
// líquido (SVG con viewBox 85) y las partículas (capa de 85 escalada) conservan la
// geometría del QML.
//
// crearCirculoFase({fase, tope = 0.90, indeterminado = 0.25})
//   -> {el, aplicar(modo, {estado, fraccion}, retardoMs), paso(dt, ahora) -> bool (sigue animando),
//       fijarVapor(bool), fijarBurbujas(bool), fijarVigente(bool), fijarTamano(d), estado()}
import { h } from '../../core/dom.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const W = 85, R = W / 2;
const T = { cierreMs: 300, entradaMs: 700, subidaMs: 950, bajadaMs: 1200, saltoMs: 400 };
const EASE = {
  lineal: (x) => x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  outQuad: (x) => 1 - (1 - x) * (1 - x),
};
let sec = 0;
const rnd = (a, b) => a + (b - a) * Math.random();
const alfa = (edad, vida, pico) => { const f = edad / vida; return pico * (f < 0.15 ? f / 0.15 : Math.max(0, (1 - f) / 0.85)); };
const radioVisible = (x, y, r) => { const dx = x - R, dy = y - R; return Math.min(r, R - 1 - Math.sqrt(dx * dx + dy * dy)); };

export function crearCirculoFase({ fase = '', tope = 0.90, indeterminado = 0.25 } = {}) {
  const topeEf = Math.min(tope, 0.90);
  const id = `fcLiq${++sec}`;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${W}`);
  svg.setAttribute('class', 'fc-cf-liquido');
  svg.innerHTML = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">`
    + `<stop offset="0" class="ini"/><stop offset="1" class="fin"/></linearGradient></defs>`
    + `<path fill="url(#${id})"/>`;
  const camino = svg.querySelector('path');
  const capaVapor = h('div', { class: 'fc-cf-particulas' });
  const icono = h('img', { class: 'fc-cf-icono', src: `assets/iconos/color/fase_${fase}.svg`, alt: '', draggable: 'false' });
  const el = h('div', { class: 'fc-circulo-fase', dataset: { estado: 'pendiente' }, 'data-solape-permitido': '' }, svg, capaVapor, icono);

  let estado = 'pendiente', fraccion = null, nivel = 0, vigente = true, visibleExt = true;
  let tween = null;          // {desde, hasta, t0, dur, ease, retardo}
  let faseOnda = 0, amp = 0;
  let vaporHab = false, burbHab = false;
  const vTubo = [], vBoc = [], vBurb = [];
  let acT = 0, acB = 0, acU = 0;
  const pool = [];
  let enUso = 0;

  const objetivo = () => (estado === 'completada' ? 1
    : estado === 'activa' ? (typeof fraccion === 'number' && isFinite(fraccion) ? Math.min(Math.max(0, fraccion), topeEf) : Math.min(indeterminado, topeEf))
      : 0);
  const nivelVisual = () => (estado === 'completada' ? Math.min(1, Math.max(0, nivel)) : Math.min(topeEf, Math.max(0, nivel)));
  const ySup = (x) => {
    const lam = W * 0.85;
    const onda = (Math.sin(2 * Math.PI * x / lam + faseOnda) + 0.35 * Math.sin(2 * Math.PI * 1.7 * x / lam - 1.3 * faseOnda)) / 1.35;
    return W * (1 - nivelVisual()) + amp * onda;
  };
  let ultimoD = '';
  function dibujarLiquido() {
    const nv = nivelVisual();
    const lleno = estado === 'completada' && nivel >= 0.999;
    el.classList.toggle('lleno', lleno);
    if (!(estado === 'activa' || estado === 'completada') || nv <= 0 || lleno) {
      if (ultimoD) { camino.setAttribute('d', ''); ultimoD = ''; }
      return;
    }
    const N = 36, sup = [], inf = [];
    for (let k = 0; k <= N; k++) {
      const th = Math.PI * k / N;
      const x = R - R * Math.cos(th);
      const dx = x - R;
      const hh = Math.sqrt(Math.max(0, R * R - dx * dx));
      const y = Math.min(R + hh, Math.max(R - hh, ySup(x)));
      sup.push(`${x.toFixed(2)},${y.toFixed(2)}`);
      inf.push(`${x.toFixed(2)},${(R + hh).toFixed(2)}`);
    }
    const d = `M${sup.join('L')}L${inf.reverse().join('L')}Z`;
    if (d !== ultimoD) { camino.setAttribute('d', d); ultimoD = d; }
  }
  function pintarEstado() {
    el.dataset.estado = estado;
    el.classList.toggle('activa', estado === 'activa');
  }
  function vaciar() {
    vTubo.length = 0; vBoc.length = 0; vBurb.length = 0; acT = acB = acU = 0;
    for (let i = 0; i < enUso; i++) pool[i].style.display = 'none';
    enUso = 0;
  }
  function particula(i) {
    if (!pool[i]) { const p = h('i', { class: 'fc-cf-p' }); pool[i] = p; capaVapor.append(p); }
    return pool[i];
  }

  function terminar() { if (tween) { nivel = tween.hasta; tween = null; } }
  function aplicar(modo, d, retardoMs = 0) {
    terminar();
    estado = d.estado || 'pendiente';
    fraccion = d.fraccion ?? null;
    pintarEstado();
    const obj = objetivo();
    const ahora = performance.now();
    if (modo === 'fijar') nivel = obj;
    else if (modo === 'terminacion') nivel = 0;
    else if (modo === 'entrada') { nivel = 0; tween = { desde: 0, hasta: obj, t0: ahora + retardoMs, dur: T.entradaMs, ease: EASE.outCubic }; }
    else {
      let dur, ease;
      if (modo === 'cierre') { dur = T.cierreMs; ease = EASE.outCubic; }
      else if (modo === 'salto') { dur = T.saltoMs; ease = EASE.outQuad; }
      else if (obj >= nivel) { dur = T.subidaMs; ease = EASE.lineal; }
      else { dur = T.bajadaMs; ease = EASE.outCubic; }
      tween = { desde: nivel, hasta: obj, t0: ahora, dur, ease };
    }
    if (['pendiente', 'fallida', 'interrumpida'].includes(estado)) vaciar();
    dibujarLiquido();
  }

  function paso(dt, ahora) {
    let sigue = false;
    if (tween) {
      const f = Math.max(0, Math.min(1, (ahora - tween.t0) / tween.dur));
      nivel = tween.desde + (tween.hasta - tween.desde) * tween.ease(f);
      if (f >= 1) tween = null;
      sigue = true;
    }
    const ampObj = estado === 'activa' && vigente ? 2 : 0;
    if (amp !== ampObj) { amp += Math.sign(ampObj - amp) * Math.min(Math.abs(ampObj - amp), dt * 2 / 0.3); sigue = true; }
    if (amp > 0) { faseOnda = (faseOnda + dt * 2 * Math.PI / 2.5) % (2 * Math.PI); sigue = true; }
    if (sigue || amp > 0) dibujarLiquido();

    // ---- partículas ----
    const base = vigente && visibleExt;
    const vaporActivo = estado === 'activa' && base;
    const tuboActivo = vaporActivo && vaporHab;
    const burbActivas = burbHab && estado === 'completada' && base;
    if (!base && enUso) vaciar();
    if (tuboActivo) { acT += dt; while (acT >= 0.03) { acT -= 0.03; if (vTubo.length < 90) {
      const ang = rnd(-13, 13) * Math.PI / 180, v = 60 * rnd(0.85, 1.15);
      vTubo.push({ x: 1, y: R + rnd(-0.25, 0.25) * 7, vx: v * Math.cos(ang), vy: v * Math.sin(ang), rt0: R - rnd(5, 10), edad: 0, vida: rnd(2.2, 2.8) });
    } } } else acT = 0;
    if (vaporActivo) { acB += dt; while (acB >= 0.2) { acB -= 0.2; if (vBoc.length < 12) {
      const x = W * rnd(0.15, 0.85);
      vBoc.push({ x, y: ySup(x), vx: rnd(-3, 3), vy: -rnd(14, 24), edad: 0, vida: rnd(1.3, 1.8) });
    } } } else acB = 0;
    if (burbActivas) { acU += dt; while (acU >= 0.12) { acU -= 0.12; if (vBurb.length < 20) {
      const x = W * rnd(0.125, 0.875), dx = x - R;
      vBurb.push({ x, y: R + Math.sqrt(Math.max(0, R * R - dx * dx)) - 5, vy: rnd(18, 34), r0: rnd(1.8, 3.6), edad: 0 });
    } } } else acU = 0;

    let n = 0;
    const damp = Math.max(0, 1 - 2.4 * dt);
    const dibujar = (x, y, rv, a, clase) => {
      if (rv < 1) return;
      const p = particula(n++);
      if (p.style.display === 'none') p.style.display = '';
      if (p._c !== clase) { p.className = `fc-cf-p ${clase}`; p._c = clase; }
      p.style.transform = `translate3d(${(x - rv).toFixed(1)}px,${(y - rv).toFixed(1)}px,0) scale(${(rv / 10).toFixed(3)})`;
      p.style.opacity = a.toFixed(2);
    };
    for (let i = vTubo.length - 1; i >= 0; i--) {
      const o = vTubo[i]; o.edad += dt;
      if (o.edad >= o.vida) { vTubo.splice(i, 1); continue; }
      o.vx *= damp; o.vy *= damp;
      const dx = o.x - R, dy = o.y - R, d = Math.sqrt(dx * dx + dy * dy) || 1;
      const w = Math.min(1, o.edad * 1.6) * 48;
      o.x += (o.vx + (-dy / d) * w) * dt; o.y += (o.vy + (dx / d) * w) * dt;
      const d2 = Math.sqrt((o.x - R) ** 2 + (o.y - R) ** 2) || 1;
      const corr = (Math.max(0, o.rt0 - 3 * o.edad) - d2) * Math.min(1, 3 * dt);
      o.x += (o.x - R) / d2 * corr; o.y += (o.y - R) / d2 * corr;
      dibujar(o.x, o.y, radioVisible(o.x, o.y, 2 + 5.5 * o.edad), alfa(o.edad, o.vida, 0.77), o.y < ySup(o.x) ? 'fondo' : 'vapor');
    }
    for (let i = vBoc.length - 1; i >= 0; i--) {
      const o = vBoc[i]; o.edad += dt;
      if (o.edad >= o.vida) { vBoc.splice(i, 1); continue; }
      o.vy -= 16 * dt; o.x += o.vx * dt; o.y += o.vy * dt;
      dibujar(o.x, o.y, radioVisible(o.x, o.y, 3 + 4 * o.edad), alfa(o.edad, o.vida, 1), o.y < ySup(o.x) ? 'fondo' : 'vapor');
    }
    for (let i = vBurb.length - 1; i >= 0; i--) {
      const o = vBurb[i]; o.edad += dt;
      o.x += rnd(-0.25, 0.25); o.y -= o.vy * dt;
      const rv = radioVisible(o.x, o.y, o.r0 + 0.6 * o.edad);
      if (rv < 1 && o.edad > 0.15) { vBurb.splice(i, 1); continue; }
      dibujar(o.x, o.y, rv, 1, 'burbuja');
    }
    for (let i = n; i < enUso; i++) pool[i].style.display = 'none';
    enUso = n;
    return sigue || amp > 0 || n > 0 || tuboActivo || vaporActivo || burbActivas;
  }

  return {
    el, aplicar, paso, terminar,
    fijarVapor(v) { vaporHab = !!v; },
    fijarTamano(d) {
      el.style.width = el.style.height = `${d}px`;
      capaVapor.style.transform = `scale(${(d / W).toFixed(4)})`;
    },
    fijarBurbujas(v) { burbHab = !!v; },
    fijarVisible(v) { visibleExt = !!v; if (!visibleExt) vaciar(); },
    fijarVigente(v) { vigente = !!v; if (!vigente) vaciar(); },
    estado: () => estado,
  };
}
