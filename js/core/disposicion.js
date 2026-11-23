// Disposición adaptable (reemplaza al letterbox de escala.js, parte B).
//
// La interfaz ocupa toda la ventana. Este módulo publica en <html>:
//   data-orient = "v" (vertical) | "h" (horizontal)  → por PROPORCIÓN (ancho/alto >= 1,05 → h),
//                                                        no por ancho; con histéresis para no
//                                                        oscilar cerca del cuadrado.
//   data-tam    = "s" | "m" | "l"                    → por la dimensión MENOR de la ventana:
//                                                        s < 480 px (celulares), m < 740 (celular
//                                                        grande en horizontal, tableta pequeña),
//                                                        l >= 740 (tabletas).
//   data-standalone = "1" cuando corre instalada (display-mode: standalone o navigator.standalone).
//   --vw, --vh (px) = tamaño útil de la ventana (en iOS, innerHeight es más fiable que 100vh).
// y emite on('disposicion', {orient, tam, ancho, alto, standalone}) solo cuando cambia
// orient o tam (las pantallas NO se recrean al girar: el cambio es por CSS; lo que mide se
// redibuja con observarTamano() de dom.js).
import { emit } from './eventos.js';

const raiz = document.documentElement;
let estado = { orient: null, tam: null, ancho: 0, alto: 0, standalone: false };

function esStandalone() {
  try {
    if (new URLSearchParams(location.search).get('standalone') === '1') return true;   // pruebas
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    if (window.matchMedia?.('(display-mode: fullscreen)').matches) return true;
  } catch { /* sin matchMedia */ }
  return navigator.standalone === true;
}

function medir() {
  const vv = window.visualViewport;
  // visualViewport se encoge con el teclado del sistema en iOS: para la disposición se usa
  // la ventana (innerWidth/innerHeight), que no cambia al abrir el teclado.
  const ancho = Math.max(1, Math.round(window.innerWidth || document.documentElement.clientWidth || vv?.width || 1));
  const alto = Math.max(1, Math.round(window.innerHeight || document.documentElement.clientHeight || vv?.height || 1));
  return { ancho, alto };
}

export function recalcular() {
  const { ancho, alto } = medir();
  const r = ancho / alto;
  let orient = estado.orient;
  if (orient === 'h') orient = r < 0.95 ? 'v' : 'h';
  else if (orient === 'v') orient = r >= 1.05 ? 'h' : 'v';
  else orient = r >= 1 ? 'h' : 'v';
  const menor = Math.min(ancho, alto);
  const tam = menor < 480 ? 's' : menor < 740 ? 'm' : 'l';
  const standalone = esStandalone();
  raiz.style.setProperty('--vw', `${ancho}px`);
  raiz.style.setProperty('--vh', `${alto}px`);
  const cambio = orient !== estado.orient || tam !== estado.tam || standalone !== estado.standalone;
  estado = { orient, tam, ancho, alto, standalone };
  raiz.dataset.orient = orient;
  raiz.dataset.tam = tam;
  if (standalone) raiz.dataset.standalone = '1'; else delete raiz.dataset.standalone;
  if (cambio) emit('disposicion', { ...estado });
  return estado;
}

export const disposicion = () => ({ ...estado });
export const horizontal = () => estado.orient === 'h';

let pendiente = 0;
function programar() {
  cancelAnimationFrame(pendiente);
  pendiente = requestAnimationFrame(recalcular);
}

export function iniciar() {
  recalcular();
  window.addEventListener('resize', programar);
  window.addEventListener('orientationchange', () => { programar(); setTimeout(recalcular, 250); });
  try { window.matchMedia('(display-mode: standalone)').addEventListener?.('change', programar); } catch { /* */ }
}
