// DeslizadorInicio (Componentes/DeslizadorInicio.qml), versión simplificada:
// interruptor «holográfico» verde (INICIAR) o rojo (CANCELAR CICLO, variante
// "cancelar"). Medidas en u = alto/60: manija de 54u con margen 3u; texto de reposo
// 12u a la derecha de la manija con un punto que parpadea; al deslizar aparecen el
// texto completado a la izquierda, los anillos que giran y el carril de rayas. Solo
// completa si la manija llega al extremo derecho; si se suelta antes vuelve sola.
// Colores por mezcla reposo → listo con color-mix() según el avance (--p).
// Composición adaptable: ocupa la caja que le da su contenedor (100 % x 100 %), mide su
// tamaño real con observarTamano y convierte el puntero con aLocal (px reales).
import { h, observarTamano, aLocal } from '../../core/dom.js';

/**
 * crearDeslizador({variante, ancho, alto, texto, textoCompletado, dosLineas, manija, alCompletar})
 *   -> { el, habilitar(bool), fijarTexto(t), reiniciar(), destruir() }
 * `ancho`/`alto` (px del QML) se aceptan por compatibilidad; el tamaño lo da el CSS del contenedor.
 */
export function crearDeslizador({ variante = 'inicio', texto = '', textoCompletado = '',
  dosLineas = false, manija = null, alCompletar = null } = {}) {
  const tReposo = h('div', { class: 'fc-dz-texto reposo', text: texto });
  const tListo = h('div', { class: 'fc-dz-texto listo', text: textoCompletado });
  const contManija = h('div', { class: 'fc-dz-icono' });
  if (manija) contManija.append(manija);
  const mani = h('div', { class: 'fc-dz-manija' },
    h('div', { class: 'fc-dz-nucleo' }), h('div', { class: 'fc-dz-interior' }), h('div', { class: 'fc-dz-barrido' }),
    contManija);
  const anillos = h('div', { class: 'fc-dz-anillos' },
    h('span', { class: 'a1' }), h('span', { class: 'a2' }), h('span', { class: 'a3' }));
  const el = h('div', { class: `fc-desl ${variante === 'cancelar' ? 'cancelar' : 'inicio'}${dosLineas ? ' dos-lineas' : ''}`,
    role: 'slider', 'aria-label': texto, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' },
  h('div', { class: 'fc-dz-pista' }, h('div', { class: 'fc-dz-carril' }), h('div', { class: 'fc-dz-franja' })),
  tReposo, h('div', { class: 'fc-dz-punto reposo' }), tListo, h('div', { class: 'fc-dz-punto listo' }),
  anillos, mani);

  let ancho = 0, u = 1, margen = 3, diam = 54, maxX = 0;
  let p = 0;            // avance 0..1 (se conserva al cambiar de tamaño)
  let habilitado = true, bloqueado = false, arrastrando = false, desfase = 0, idPuntero = null;
  let raf = 0, tVuelta = 0;
  const xDe = (q) => margen + q * Math.max(0, maxX - margen);
  const pintar = () => {
    const x = xDe(p);
    el.style.setProperty('--p', p.toFixed(3));
    el.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    mani.style.transform = `translate3d(${x}px, ${margen}px, 0)`;
    anillos.style.transform = `translate3d(${x}px, ${margen}px, 0)`;
    el.classList.toggle('en-uso', p > 0.01);
  };
  const geometria = ({ ancho: w, alto: hh }) => {
    ancho = w;
    u = hh / 60;
    margen = 3 * u;
    diam = 54 * u;
    maxX = ancho - margen - diam;
    el.style.setProperty('--u', `${u}px`);
    el.style.setProperty('--d', `${diam}px`);
    el.style.setProperty('--m', `${margen}px`);
    const izq = margen + diam + 12 * u;
    tReposo.style.left = `${izq}px`;
    tReposo.style.width = `${Math.max(0, ancho - izq - 32 * u)}px`;
    tListo.style.left = `${15 * u}px`;
    tListo.style.width = `${Math.max(0, ancho - 15 * u - margen - diam - 12 * u)}px`;
    pintar();
  };
  const quitarObs = observarTamano(el, geometria);

  const volver = () => {
    cancelAnimationFrame(raf);
    const p0 = p, t0 = performance.now();
    const paso = (ahora) => {
      const f = Math.min(1, (ahora - t0) / 350);
      p = p0 * Math.pow(1 - f, 3);
      pintar();
      if (f < 1) raf = requestAnimationFrame(paso);
      else bloqueado = false;
    };
    raf = requestAnimationFrame(paso);
  };
  el.addEventListener('pointerdown', (ev) => {
    if (!habilitado || bloqueado) return;
    const px = aLocal(el, ev).x;
    const x = xDe(p);
    if (px < x - 10 * u || px > x + diam + 10 * u) return;   // solo desde la manija
    arrastrando = true; idPuntero = ev.pointerId; desfase = px - x;
    try { el.setPointerCapture?.(ev.pointerId); } catch { /* puntero sintético */ }
    cancelAnimationFrame(raf);
    el.classList.add('arrastre');
    ev.preventDefault();
  });
  el.addEventListener('pointermove', (ev) => {
    if (!arrastrando || ev.pointerId !== idPuntero) return;
    const x = Math.max(margen, Math.min(maxX, aLocal(el, ev).x - desfase));
    p = maxX > margen ? (x - margen) / (maxX - margen) : 0;
    pintar();
  });
  const soltar = (ev) => {
    if (!arrastrando || (ev && ev.pointerId !== idPuntero)) return;
    arrastrando = false;
    el.classList.remove('arrastre');
    if (p >= 0.995 && habilitado) {
      bloqueado = true;
      p = 1; pintar();
      try { alCompletar?.(); } catch (e) { console.error(e); }
      tVuelta = setTimeout(volver, 700);
    } else volver();
  };
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', soltar);
  el.addEventListener('lostpointercapture', soltar);
  pintar();
  return {
    el,
    habilitar(v) {
      habilitado = !!v;
      el.classList.toggle('deshabilitado', !habilitado);
      el.setAttribute('aria-disabled', habilitado ? 'false' : 'true');
      if (!habilitado && !bloqueado && p !== 0) volver();
    },
    fijarTexto(tx) { if (tReposo.textContent !== tx) { tReposo.textContent = tx; el.setAttribute('aria-label', tx); } },
    reiniciar() { clearTimeout(tVuelta); cancelAnimationFrame(raf); bloqueado = false; arrastrando = false; p = 0; pintar(); },
    destruir() { clearTimeout(tVuelta); cancelAnimationFrame(raf); quitarObs(); },
  };
}
