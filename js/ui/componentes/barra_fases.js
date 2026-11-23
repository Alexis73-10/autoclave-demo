// BarraFases (Componentes/BarraFases.qml) + ConectorFase: círculos de 85 (escalados)
// con centros repartidos en columnas iguales, conectores de 7 de alto y etiqueta 13,5
// SemiBold debajo (piso 12,2 px). Composición adaptable: mide su ancho real con
// observarTamano y dispone círculos, conectores y etiquetas en px reales; si los nombres
// no caben usa abreviaturas de la demo y, si aún no caben, etiquetas en dos alturas. Compara cada arreglo de fases con el
// anterior y elige por círculo un modo como el QML: fijar (primera carga, 2 s tras
// mostrarse, otro ciclo), fraccion, cierre (sube a 1 en 300 ms y 300 ms después el
// conector se llena en 600 ms; la siguiente entra tras 900 ms), salto y terminacion.
// Un único requestAnimationFrame mueve niveles, conectores, ondas y vapor.
//
// crearBarraFases() -> {el, fijar(fases, {vigente, cicloId}), fijarVisible(bool), destruir()}
// fases = sim.estado.ciclo.fases: [{fase, estado, fraccion}]
import { h, observarTamano } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { medir, loc, escalaU, LETRA_MIN } from './_ciclo_util.js';
import { crearCirculoFase } from './circulo_fase.js';

// Abreviaturas propias de la demo (el software no las tiene: allí el ancho siempre alcanza).
const ABREV = {
  precalentamiento: { es: 'Precal.', en: 'Preheat' }, vacio: { es: 'Vacío', en: 'Vacuum' },
  calentamiento: { es: 'Calent.', en: 'Heating' }, esterilizacion: { es: 'Ester.', en: 'Steril.' },
  descompresion: { es: 'Descom.', en: 'Exhaust' }, secado: { es: 'Secado', en: 'Drying' },
};
const T = { cierreMs: 300, conectorMs: 600, saltoMs: 400 };
const inOutQuad = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const outQuad = (x) => 1 - (1 - x) * (1 - x);

function crearConector() {
  const relleno = h('div', { class: 'fc-con-relleno' });
  const el = h('div', { class: 'fc-conector' }, relleno);
  let p = 0, tween = null;
  const pintar = () => { relleno.style.transform = `scaleX(${p.toFixed(4)})`; };
  pintar();
  return {
    el,
    progreso: () => p,
    terminar() { if (tween) { p = tween.hasta; tween = null; pintar(); } },
    aplicar(modo, lleno, ahora) {
      this.terminar();
      const obj = lleno ? 1 : 0;
      if (modo === 'fijar') { p = obj; pintar(); }
      else if (modo === 'cierre' && lleno) { p = 0; tween = { desde: 0, hasta: 1, t0: ahora + T.cierreMs, dur: T.conectorMs, ease: inOutQuad }; pintar(); }
      else tween = { desde: p, hasta: obj, t0: ahora, dur: T.saltoMs, ease: outQuad };
    },
    paso(ahora) {
      if (!tween) return false;
      const f = Math.max(0, Math.min(1, (ahora - tween.t0) / tween.dur));
      p = tween.desde + (tween.hasta - tween.desde) * tween.ease(f);
      if (f >= 1) tween = null;
      pintar();
      return true;
    },
  };
}

export function crearBarraFases() {
  const el = h('div', { class: 'fc-barra-fases', 'data-solape-permitido': '' });
  let items = [];          // [{circulo, conector, etiqueta, nombre, abrev}]
  let ancho = 0;
  let previas = [];
  let claves = '';
  let primera = true, tPrimera = 0;
  let vigente = true, visible = true, cicloId = null;
  let raf = 0, tAnt = 0;

  // Geometría en px reales (QML: columnas de 188, círculos de 85, etiqueta a 16 del círculo).
  function disponer() {
    const n = items.length;
    if (!n || !ancho) return;
    const u = escalaU();
    const cw = ancho / n;
    const D = Math.round(Math.max(30, Math.min(cw * 0.8, Math.max(36, 85 * u))));
    const fs = Math.max(LETRA_MIN, 13.5 * u);
    const cabe = (txts, w) => txts.every((x) => medir(x, fs, 600) <= w - 2);
    const nombres = items.map((it) => it.nombre), cortos = items.map((it) => it.abrev);
    let textos = nombres, dosAlturas = false;
    if (!cabe(nombres, cw)) {
      if (cabe(cortos, cw)) textos = cortos;
      else { dosAlturas = true; textos = cabe(nombres, 2 * cw) ? nombres : cortos; }
    }
    const lh = Math.ceil(fs * 1.25);
    const gap = Math.max(4, Math.round(16 * u));
    const cy = D / 2;
    const hc = Math.max(3, Math.round(7 * D / 85));
    items.forEach((it, i) => {
      const cx = cw * (i + 0.5);
      it.circulo.fijarTamano(D);
      Object.assign(it.circulo.el.style, { left: `${cx - D / 2}px`, top: '0px' });
      const fila = dosAlturas && i % 2 === 1 ? 1 : 0;
      const wEt = dosAlturas ? 2 * cw : cw;
      Object.assign(it.etiqueta.style, { left: `${cx - wEt / 2}px`, width: `${wEt}px`, top: `${D + gap + fila * lh}px`,
        fontSize: `${fs}px`, lineHeight: `${lh}px` });
      if (it.etiqueta.textContent !== textos[i]) it.etiqueta.textContent = textos[i];
      if (it.conector) {
        const x0 = cw * (i - 0.5) + D / 2 - 1;
        Object.assign(it.conector.el.style, { left: `${x0}px`, width: `${Math.max(0, cw - D + 2)}px`, top: `${cy - hc / 2}px`, height: `${hc}px` });
      }
    });
    el.style.height = `${D + gap + (dosAlturas ? 2 : 1) * lh}px`;
  }
  const quitarObs = observarTamano(el, ({ ancho: w }) => { if (w !== ancho) { ancho = w; disponer(); } });
  const colorEtiqueta = (e) => (e === 'completada' ? 'var(--c-fase-etiqueta)' : e === 'activa' ? 'var(--c-fase-etiqueta-activa)' : 'var(--c-fase-pendiente-etiqueta)');

  function construir(fases) {
    el.replaceChildren();
    const n = fases.length;
    items = fases.map((f, i) => {
      const conector = i > 0 ? crearConector() : null;
      const circulo = crearCirculoFase({ fase: f.fase });
      const nombre = t(`fases.${f.fase}`) === `fases.${f.fase}` ? '' : t(`fases.${f.fase}`);
      const etiqueta = h('div', { class: 'fc-bf-etiqueta', text: nombre });
      if (conector) el.append(conector.el);
      return { circulo, conector, etiqueta, nombre, abrev: ABREV[f.fase] ? loc(ABREV[f.fase]) : nombre };
    });
    void n;
    // círculos encima de los conectores (z como el QML)
    items.forEach((it) => el.append(it.circulo.el, it.etiqueta));
    previas = [];
    disponer();
  }

  function rearmarPrimera() {
    primera = true;
    clearTimeout(tPrimera);
    tPrimera = setTimeout(() => { primera = false; }, 2000);
  }

  function fijar(fases = [], { vigente: v = true, cicloId: id = null } = {}) {
    vigente = v;
    const nuevas = fases.map((f) => ({ fase: f.fase, estado: f.estado || 'pendiente', fraccion: f.fraccion ?? null }));
    const k = nuevas.map((f) => f.fase).join('|');
    if (k !== claves || id !== cicloId) { claves = k; cicloId = id; construir(nuevas); rearmarPrimera(); }
    const n = nuevas.length;
    if (!n) return;
    const ahora = performance.now();
    const fij = primera || previas.length !== n;
    const completadas = [];
    if (!fij) for (let i = 0; i < n; i++) if (nuevas[i].estado === 'completada' && previas[i].estado !== 'completada') completadas.push(i);
    const igual = (a, b) => (a === null || b === null ? a === b : Math.abs(a - b) < 1e-6);
    const modos = [], modosCon = [], retardos = [];
    for (let i = 0; i < n; i++) {
      const q = nuevas[i];
      let modo = 'nada', modoCon = 'nada', retardo = 0;
      if (fij) { modo = 'fijar'; modoCon = 'fijar'; }
      else {
        const p = previas[i];
        const cambio = p.estado !== q.estado;
        if (cambio && (q.estado === 'fallida' || q.estado === 'interrumpida')) modo = 'terminacion';
        else if (cambio) {
          if (completadas.length >= 2) modo = 'salto';
          else if (completadas.length === 1 && i === completadas[0]) modo = 'cierre';
          else if (q.estado === 'activa') {
            modo = 'entrada';
            if (i > 0 && completadas.length === 1 && completadas[0] === i - 1) retardo = T.cierreMs + T.conectorMs;
          } else modo = 'fijar';
        } else if (!igual(p.fraccion, q.fraccion)) modo = q.estado === 'activa' ? 'fraccion' : 'fijar';
        if (i > 0) {
          const ln = nuevas[i - 1].estado === 'completada', lp = previas[i - 1].estado === 'completada';
          if (ln !== lp) modoCon = !ln ? 'fijar' : (completadas.length === 1 && completadas[0] === i - 1 ? 'cierre' : 'salto');
        }
      }
      modos.push(modo); modosCon.push(modoCon); retardos.push(retardo);
    }
    const grande = modos.some((x) => x !== 'nada' && x !== 'fraccion') || modosCon.some((x) => x !== 'nada');
    if (grande) items.forEach((it) => { it.circulo.terminar(); it.conector?.terminar(); });
    // última completada mientras hay una activa: burbujas
    const a = nuevas.findIndex((f) => f.estado === 'activa');
    let iBurb = -1;
    if (a >= 0) for (let j = a - 1; j >= 0; j--) if (nuevas[j].estado === 'completada') { iBurb = j; break; }
    for (let i = 0; i < n; i++) {
      const it = items[i];
      if (modos[i] !== 'nada') it.circulo.aplicar(modos[i], nuevas[i], retardos[i]);
      if (modosCon[i] !== 'nada' && it.conector) it.conector.aplicar(modosCon[i], nuevas[i - 1].estado === 'completada', ahora);
      it.circulo.fijarBurbujas(i === iBurb);
      it.circulo.fijarVigente(vigente);
      it.etiqueta.style.color = colorEtiqueta(nuevas[i].estado);
    }
    previas = nuevas;
    primera = false; clearTimeout(tPrimera);
    arrancar();
  }

  function cuadro(ahora) {
    const dt = Math.min(0.05, tAnt ? (ahora - tAnt) / 1000 : 0.016);
    tAnt = ahora;
    let sigue = false;
    items.forEach((it, i) => {
      if (it.conector && it.conector.paso(ahora)) sigue = true;
      it.circulo.fijarVapor(i > 0 && it.conector && it.conector.progreso() >= 1);
      if (it.circulo.paso(dt, ahora)) sigue = true;
    });
    raf = sigue && visible ? requestAnimationFrame(cuadro) : 0;
    if (!raf) tAnt = 0;
  }
  function arrancar() { if (!raf && visible) { tAnt = 0; raf = requestAnimationFrame(cuadro); } }

  return {
    el, fijar,
    fijarVisible(v) {
      visible = !!v;
      items.forEach((it) => it.circulo.fijarVisible(visible));
      if (visible) { rearmarPrimera(); arrancar(); } else { cancelAnimationFrame(raf); raf = 0; }
    },
    disponer,
    destruir() { cancelAnimationFrame(raf); raf = 0; clearTimeout(tPrimera); quitarObs(); },
  };
}
