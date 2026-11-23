// Tema claro/oscuro: como Apariencia + Colores.oscuro del software. Por defecto claro.
import { leer, guardar } from './almacen.js';
import { emit } from './eventos.js';

let vigente = leer('tema', 'claro') === 'oscuro' ? 'oscuro' : 'claro';
aplicar();

function aplicar() {
  document.documentElement.dataset.tema = vigente;
  // B6: la barra de estado (Android) toma el color del borde superior del fondo real
  // (--color-barra de base.css: #213F68 en claro, #070B10 en oscuro).
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = vigente === 'oscuro' ? '#070B10' : '#213F68';
}

export function tema() { return vigente; }
export function oscuro() { return vigente === 'oscuro'; }

export function fijarTema(nuevo) {
  if (nuevo !== 'claro' && nuevo !== 'oscuro') return;
  if (nuevo === vigente) return;
  vigente = nuevo;
  guardar('tema', nuevo);
  aplicar();
  emit('tema', nuevo);
}

export function alternarTema() { fijarTema(oscuro() ? 'claro' : 'oscuro'); }
