// Pila de pantallas, como el StackView `pila` de Main.qml.
//
// Cada pantalla es un módulo en js/ui/pantallas/<archivo>.js que exporta:
//   export function crear(params) -> { el: HTMLElement, alMostrar?(), alOcultar?(), destruir?() }
// y se registra en PANTALLAS (abajo) con su nombre. La pantalla debe tener la clase
// "pantalla" (posición absoluta, ocupa todo el lienzo) y reconstruir sus textos al
// recibir el evento 'idioma' (o simplemente volver a crearse: ver refrescar()).
import { emit } from './eventos.js';

export const PANTALLAS = {
  reposo: () => import('../ui/pantallas/reposo.js'),
  intro: () => import('../ui/pantallas/intro.js'),
  login: () => import('../ui/pantallas/login.js'),
  cambioClave: () => import('../ui/pantallas/cambio_clave.js'),
  preciclo: () => import('../ui/pantallas/preciclo.js'),
  cicloEnCurso: () => import('../ui/pantallas/ciclo_en_curso.js'),
  menu: () => import('../ui/pantallas/menu_principal.js'),
  reportes: () => import('../ui/pantallas/reportes.js'),
  opciones: () => import('../ui/pantallas/opciones.js'),
  nuevoUsuario: () => import('../ui/pantallas/nuevo_usuario.js'),
  tirilla: () => import('../ui/pantallas/tirilla.js'),
};

const pila = [];   // [{nombre, params, inst}]
const contenedor = () => document.getElementById('pila');

async function instanciar(nombre, params) {
  const cargar = PANTALLAS[nombre];
  if (!cargar) throw new Error(`Pantalla desconocida: ${nombre}`);
  const mod = await cargar();
  const inst = mod.crear(params || {});
  inst.el.classList.add('pantalla');
  inst.el.dataset.pantalla = nombre;
  return inst;
}

function ocultarTope() {
  const tope = pila.at(-1);
  if (!tope) return;
  tope.inst.alOcultar?.();
  tope.inst.el.classList.add('oculto');
}

function mostrarTope() {
  const tope = pila.at(-1);
  if (!tope) return;
  tope.inst.el.classList.remove('oculto');
  tope.inst.alMostrar?.();
  emit('navegacion', { nombre: tope.nombre, params: tope.params, profundidad: pila.length });
}

function destruir(entrada) {
  entrada.inst.alOcultar?.();
  entrada.inst.destruir?.();
  entrada.inst.el.remove();
}

export async function push(nombre, params) {
  const inst = await instanciar(nombre, params);
  ocultarTope();
  pila.push({ nombre, params, inst });
  contenedor().append(inst.el);
  mostrarTope();
}

export function pop() {
  if (pila.length <= 1) return;
  destruir(pila.pop());
  mostrarTope();
}

/** Vuelve hasta la pantalla `nombre` (si está en la pila), destruyendo las de encima. */
export function popHasta(nombre) {
  while (pila.length > 1 && pila.at(-1).nombre !== nombre) destruir(pila.pop());
  mostrarTope();
}

/** Reemplaza toda la pila por una sola pantalla. */
export async function reiniciar(nombre, params) {
  while (pila.length) destruir(pila.pop());
  const inst = await instanciar(nombre, params);
  pila.push({ nombre, params, inst });
  contenedor().append(inst.el);
  mostrarTope();
}

/** Reemplaza la pantalla de arriba. */
export async function reemplazar(nombre, params) {
  const inst = await instanciar(nombre, params);
  if (pila.length) destruir(pila.pop());
  pila.push({ nombre, params, inst });
  contenedor().append(inst.el);
  mostrarTope();
}

export function actual() { return pila.at(-1)?.nombre ?? null; }
export function profundidad() { return pila.length; }
export function enPila(nombre) { return pila.some((p) => p.nombre === nombre); }

/** Vuelve a crear todas las pantallas de la pila (tras cambiar idioma, tema o reiniciar datos). */
export async function refrescar() {
  const copia = pila.map(({ nombre, params }) => ({ nombre, params }));
  while (pila.length) destruir(pila.pop());
  for (const { nombre, params } of copia) {
    const inst = await instanciar(nombre, params);
    inst.el.classList.add('oculto');
    pila.push({ nombre, params, inst });
    contenedor().append(inst.el);
  }
  mostrarTope();
}
