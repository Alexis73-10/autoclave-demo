// Panel OCULTO de la demo. Se abre con una pulsación larga de 3 s sobre el logo.
// Contiene: fallos provocables (sim.fallosDisponibles / sim.dispararFallo), reiniciar los datos de la demo,
// cambiar de idioma, alternar el modo oscuro y la versión.
//
// Uso desde cualquier pantalla con logo:
//   import { instalarPanelDemo } from '../componentes/panel_demo.js';
//   const quitar = instalarPanelDemo(elementoLogo);   // llamar a quitar() en destruir()
import { h, pulsacionLarga } from '../../core/dom.js';
import { t, idioma, fijarIdioma } from '../../core/i18n.js';
import { oscuro, alternarTema } from '../../core/tema.js';
import { abrirModal, aviso } from '../../core/capas.js';
import { borrarTodo } from '../../core/almacen.js';
import { on } from '../../core/eventos.js';
import { sim } from '../../sim/motor.js';
import { VERSION_DEMO } from '../../../version.js';

// Textos propios del panel (no existen en el software real).
const TX = {
  es: { titulo: 'Panel de la demo', cerrar: 'Cerrar', idioma: 'Idioma', tema: 'Modo oscuro', activar: 'Activar', desactivar: 'Desactivar',
    fallos: 'Fallos provocables', soloCiclo: 'Solo durante un ciclo', sinFallos: 'Sin fallos disponibles',
    reiniciar: 'Reiniciar los datos de la demo', confirmar: 'Tocar de nuevo para confirmar', version: 'Versión de la demo',
    disparado: 'Fallo provocado', fases: 'Fases' },
  en: { titulo: 'Demo panel', cerrar: 'Close', idioma: 'Language', tema: 'Dark mode', activar: 'Turn on', desactivar: 'Turn off',
    fallos: 'Faults you can trigger', soloCiclo: 'Only during a cycle', sinFallos: 'No faults available',
    reiniciar: 'Reset the demo data', confirmar: 'Tap again to confirm', version: 'Demo version',
    disparado: 'Fault triggered', fases: 'Phases' },
};
const tx = (k) => (TX[idioma()] ?? TX.es)[k];

let abierto = null;   // {cerrar}

/** Abre el panel (también se puede llamar directamente, p. ej. desde la consola). */
export function abrirPanelDemo() {
  if (abierto) return abierto;
  const lista = h('div', { class: 'pd-lista desplazable' });
  let maquinaPintada = null;

  const pintarFallos = () => {
    const estado = sim.estado;
    maquinaPintada = estado.maquina;
    lista.replaceChildren();
    let fallos = [];
    try { fallos = sim.fallosDisponibles() ?? []; } catch { fallos = []; }
    if (!fallos.length) { lista.append(h('div', { class: 'pd-vacio', text: tx('sinFallos') })); return; }
    for (const f of fallos) {
      const solo = Array.isArray(f.fases) && f.fases.length > 0;
      const habilitado = !solo || estado.maquina === 'CICLO';
      const fila = h('button', { class: `pd-fallo${habilitado ? '' : ' pd-deshabilitado'}`, disabled: !habilitado,
        onclick: () => {
          try { sim.dispararFallo(f.codigo); aviso(`${tx('disparado')}: ${f.codigoVisible ?? f.codigo}`); } catch (e) { console.warn('[demo] fallo', e); }
        } },
        h('span', { class: 'pd-fallo-cod', text: f.codigoVisible ?? f.codigo }),
        h('span', { class: 'pd-fallo-tit', text: f.titulo ?? '' }),
        h('span', { class: 'pd-fallo-efe', text: [f.efecto, solo && !habilitado ? tx('soloCiclo') : ''].filter(Boolean).join(' · ') }));
      lista.append(fila);
    }
  };

  const botonIdioma = (cod, etiqueta) => h('button', { class: `pd-seg${idioma() === cod ? ' activo' : ''}`, text: etiqueta,
    onclick: () => { fijarIdioma(cod); } });
  const botonTema = h('button', { class: 'pd-btn', onclick: () => { alternarTema(); } });
  const botonReiniciar = h('button', { class: 'pd-btn pd-peligro', text: tx('reiniciar') });
  let armado = null;
  botonReiniciar.addEventListener('click', () => {
    if (!armado) {
      botonReiniciar.textContent = tx('confirmar');
      armado = setTimeout(() => { armado = null; botonReiniciar.textContent = tx('reiniciar'); }, 4000);
      return;
    }
    clearTimeout(armado);
    try { borrarTodo(); sim.reiniciarDatos?.(); } catch (e) { console.warn('[demo] reinicio', e); }
    location.reload();
  });

  const cerrarBtn = h('button', { class: 'pd-cerrar', 'aria-label': tx('cerrar') },
    h('span', { class: 'pd-x a' }), h('span', { class: 'pd-x b' }));
  const tarjeta = h('div', { class: 'pd-tarjeta' },
    h('div', { class: 'pd-titulo', text: tx('titulo') }), cerrarBtn,
    h('div', { class: 'pd-linea' }),
    h('div', { class: 'pd-fila' }, h('span', { class: 'pd-rot', text: tx('idioma') }),
      h('div', { class: 'pd-segs' }, botonIdioma('es', 'Español'), botonIdioma('en', 'English'))),
    h('div', { class: 'pd-fila' }, h('span', { class: 'pd-rot', text: tx('tema') }), botonTema),
    h('div', { class: 'pd-sec', text: tx('fallos') }),
    lista,
    h('div', { class: 'pd-pie' }, botonReiniciar,
      h('div', { class: 'pd-version', text: `${tx('version')}: ${VERSION_DEMO}` })));
  tarjeta.addEventListener('pointerdown', (e) => e.stopPropagation());
  const pintarTema = () => { botonTema.textContent = oscuro() ? tx('desactivar') : tx('activar'); };
  pintarTema();
  pintarFallos();

  const raiz = h('div', { class: 'pd-raiz' }, tarjeta);
  const quitarSim = on('sim', (e) => { if (e.maquina !== maquinaPintada) pintarFallos(); });
  const quitarTema = on('tema', pintarTema);
  const quitarIdioma = on('idioma', () => { cerrarModal(); setTimeout(abrirPanelDemo, 60); });   // se rehace en el idioma nuevo
  const cerrarModal = abrirModal(raiz, { cerrarAlTocarVelo: false, alCerrar: () => { quitarSim(); quitarTema(); quitarIdioma(); clearTimeout(armado); abierto = null; } });
  raiz.addEventListener('pointerdown', (e) => { if (e.target === raiz) cerrarModal(); });
  cerrarBtn.addEventListener('click', () => cerrarModal());
  abierto = { cerrar: cerrarModal };
  return abierto;
}

/**
 * Instala la pulsación larga de 3 s sobre el logo para abrir el panel.
 * Devuelve la función que la quita (llamar en destruir()).
 */
export function instalarPanelDemo(elementoLogo) {
  if (!elementoLogo) return () => {};
  elementoLogo.style.pointerEvents = 'auto';   // las imágenes no reciben eventos por defecto
  elementoLogo.style.touchAction = 'none';
  return pulsacionLarga(elementoLogo, 3000, () => abrirPanelDemo());
}
