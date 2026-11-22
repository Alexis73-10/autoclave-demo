// DeslizadorInicio (Componentes/DeslizadorInicio.qml), versión simplificada:
// interruptor «holográfico» verde (INICIAR) o rojo (CANCELAR CICLO, variante
// "cancelar"). Medidas en u = alto/60: manija de 54u con margen 3u; texto de reposo
// 12u a la derecha de la manija con un punto que parpadea; al deslizar aparecen el
// texto completado a la izquierda, los anillos que giran y el carril de rayas. Solo
// completa si la manija llega al extremo derecho; si se suelta antes vuelve sola.
// Colores por mezcla reposo → listo con color-mix() según el avance (--p).
import { h } from '../../core/dom.js';

/**
 * crearDeslizador({variante, ancho, alto, texto, textoCompletado, dosLineas, manija, alCompletar})
 *   -> { el, habilitar(bool), fijarTexto(t), reiniciar(), destruir() }
 */
export function crearDeslizador({ variante = 'inicio', ancho = 332, alto = 110, texto = '', textoCompletado = '',
  dosLineas = false, manija = null, alCompletar = null } = {}) {
  const u = alto / 60;
  const margen = 3 * u;
  const diam = 54 * u;
  const maxX = ancho - margen - diam;
  const tReposo = h('div', { class: 'fc-dz-texto reposo', text: texto });
  const tListo = h('div', { class: 'fc-dz-texto listo', text: textoCompletado });
  const contManija = h('div', { class: 'fc-dz-icono' });
  if (manija) contManija.append(manija);
  const mani = h('div', { class: 'fc-dz-manija' },
    h('div', { class: 'fc-dz-nucleo' }), h('div', { class: 'fc-dz-interior' }), h('div', { class: 'fc-dz-barrido' }),
    contManija);
  const anillos = h('div', { class: 'fc-dz-anillos' },
    h('span', { class: 'a1' }), h('span', { class: 'a2' }), h('span', { class: 'a3' }));
  const el = h('div', { class: `fc-desl ${variante === 'cancelar' ? 'cancelar' : 'inicio'}${dosLineas ? ' dos-lineas' : ''}` },
    h('div', { class: 'fc-dz-pista' }, h('div', { class: 'fc-dz-carril' }), h('div', { class: 'fc-dz-franja' })),
    tReposo, h('div', { class: 'fc-dz-punto reposo' }), tListo, h('div', { class: 'fc-dz-punto listo' }),
    anillos, mani);
  Object.assign(el.style, { width: `${ancho}px`, height: `${alto}px` });
  el.style.setProperty('--u', `${u}px`);
  el.style.setProperty('--d', `${diam}px`);
  el.style.setProperty('--m', `${margen}px`);
  tReposo.style.left = `${margen + diam + 12 * u}px`;
  tReposo.style.width = `${ancho - (margen + diam + 12 * u) - 32 * u}px`;
  tListo.style.left = `${15 * u}px`;
  tListo.style.width = `${ancho - 15 * u - margen - diam - 12 * u}px`;

  let x = margen, habilitado = true, bloqueado = false, arrastrando = false, desfase = 0, idPuntero = null;
  let raf = 0, tVuelta = 0;
  const pintar = () => {
    const p = maxX > margen ? Math.max(0, Math.min(1, (x - margen) / (maxX - margen))) : 0;
    el.style.setProperty('--p', p.toFixed(3));
    mani.style.transform = `translate3d(${x}px, ${margen}px, 0)`;
    anillos.style.transform = `translate3d(${x}px, ${margen}px, 0)`;
    el.classList.toggle('en-uso', p > 0.01);
  };
  const volver = () => {
    cancelAnimationFrame(raf);
    const x0 = x, t0 = performance.now();
    const paso = (ahora) => {
      const f = Math.min(1, (ahora - t0) / 350);
      x = x0 + (margen - x0) * (1 - Math.pow(1 - f, 3));
      pintar();
      if (f < 1) raf = requestAnimationFrame(paso);
      else { bloqueado = false; }
    };
    raf = requestAnimationFrame(paso);
  };
  el.addEventListener('pointerdown', (ev) => {
    if (!habilitado || bloqueado) return;
    const r = el.getBoundingClientRect();
    const escala = r.width / ancho || 1;
    const px = (ev.clientX - r.left) / escala;
    if (px < x - 10 * u || px > x + diam + 10 * u) return;   // solo desde la manija
    arrastrando = true; idPuntero = ev.pointerId; desfase = px - x;
    el.setPointerCapture?.(ev.pointerId);
    cancelAnimationFrame(raf);
    el.classList.add('arrastre');
    ev.preventDefault();
  });
  el.addEventListener('pointermove', (ev) => {
    if (!arrastrando || ev.pointerId !== idPuntero) return;
    const r = el.getBoundingClientRect();
    const escala = r.width / ancho || 1;
    x = Math.max(margen, Math.min(maxX, (ev.clientX - r.left) / escala - desfase));
    pintar();
  });
  const soltar = (ev) => {
    if (!arrastrando || (ev && ev.pointerId !== idPuntero)) return;
    arrastrando = false;
    el.classList.remove('arrastre');
    if (x >= maxX - 0.5 && habilitado) {
      bloqueado = true;
      x = maxX; pintar();
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
      if (!habilitado && !bloqueado && x !== margen) volver();
    },
    fijarTexto(tx) { if (tReposo.textContent !== tx) tReposo.textContent = tx; },
    reiniciar() { clearTimeout(tVuelta); cancelAnimationFrame(raf); bloqueado = false; arrastrando = false; x = margen; pintar(); },
    destruir() { clearTimeout(tVuelta); cancelAnimationFrame(raf); },
  };
}
