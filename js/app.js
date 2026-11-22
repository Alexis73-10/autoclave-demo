// Arranque de la demo: escala, tema, idioma, navegación como Main.qml, standby,
// wake lock durante el ciclo y registro del service worker con aviso de actualización.
import { iniciar as iniciarEscala } from './core/escala.js';
import './core/tema.js';
import * as router from './core/router.js';
import { on } from './core/eventos.js';
import { h } from './core/dom.js';
import { haySesion, cerrarSesion } from './core/sesion.js';
import { mantenerPantalla } from './core/wakelock.js';
import { cerrarModales } from './core/capas.js';
import { cerrarTeclado } from './core/teclado.js';
import { sim } from './sim/motor.js';
import { VERSION_DEMO } from '../version.js';

const STANDBY_MS = 10 * 60 * 1000;   // tiempo_standby por defecto del software (10 min)
let ultimoToque = Date.now();
let maquinaPrevia = null;

/** Pantalla principal según el estado de máquina (irAPrincipal de Main.qml). */
export function irAPrincipal() {
  const destino = sim.estado.maquina === 'CICLO' ? 'cicloEnCurso' : 'preciclo';
  return router.reiniciar(destino);
}

/** Avatar / engranaje con sesión: sin sesión → Login; con sesión → Opciones. */
export function abrirConfiguracion() {
  return router.push(haySesion() ? 'opciones' : 'login');
}

/** Standby: vuelve a Reposo y cierra la sesión (nunca durante CICLO o FALLA). */
export function irAReposo() {
  cerrarModales();
  cerrarTeclado();
  cerrarSesion();
  return router.reiniciar('reposo');
}

function vigilarSimulador(estado) {
  const m = estado.maquina;
  mantenerPantalla(m === 'CICLO');
  if (maquinaPrevia !== null && m !== maquinaPrevia) {
    const actual = router.actual();
    // Cambio automático a Ciclo en curso al iniciar (desde la principal) y vuelta a Preciclo al confirmar.
    if (m === 'CICLO' && actual === 'preciclo') router.reiniciar('cicloEnCurso');
    if (maquinaPrevia === 'CICLO' && m !== 'CICLO' && actual === 'cicloEnCurso') router.reiniciar('preciclo');
  }
  maquinaPrevia = m;
  // Standby
  if (m !== 'CICLO' && m !== 'FALLA' && Date.now() - ultimoToque > STANDBY_MS && router.actual() !== 'reposo') {
    ultimoToque = Date.now();
    irAReposo();
  }
}

function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    const avisar = () => {
      const caja = document.getElementById('capa-aviso');
      if (caja.querySelector('.aviso-actualizacion')) return;
      caja.append(h('button', {
        class: 'aviso-actualizacion',
        text: 'Actualización disponible — tocar para recargar',
        onclick: () => {
          reg.waiting?.postMessage({ tipo: 'activar' });
        },
      }));
    };
    if (reg.waiting && navigator.serviceWorker.controller) avisar();
    reg.addEventListener('updatefound', () => {
      const nuevo = reg.installing;
      nuevo?.addEventListener('statechange', () => {
        if (nuevo.state === 'installed' && navigator.serviceWorker.controller) avisar();
      });
    });
    // Buscar versión nueva al volver a la app estando en línea
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) reg.update().catch(() => {});
    });
  }).catch((e) => console.warn('[sw] no se registró:', e));
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return;
    recargando = true;
    location.reload();
  });
}

async function arrancar() {
  iniciarEscala();
  window.addEventListener('pointerdown', () => { ultimoToque = Date.now(); }, { capture: true, passive: true });
  // Sin menú contextual (pulsación larga) ni gestos de zoom en iOS
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault()));
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

  on('sim', vigilarSimulador);
  on('idioma', () => router.refrescar());
  on('tema', () => router.refrescar());

  sim.arrancar();
  await router.reiniciar('reposo');
  await router.push('intro');   // la intro se quita sola al terminar (pop)
  registrarServiceWorker();
  console.info(`Especifika Autoclave Demo ${VERSION_DEMO}`);
}

arrancar().catch((e) => console.error('[app] error al arrancar:', e));
