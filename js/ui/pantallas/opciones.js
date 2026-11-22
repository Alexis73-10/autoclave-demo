// Pantalla Opciones (Opciones.qml): encabezado, título de sección con hamburguesa, riel/cajón de
// secciones filtrado por rol, contenido y barra inferior (Atrás / Cerrar sesión / Inicio).
// Cada sección vive en js/ui/pantallas/opciones/<seccion>.js: crear(ctx) -> {el, atras?(), destruir?()}.
import { h, iconoMono } from '../../core/dom.js';
import { t, hora as horaTxt } from '../../core/i18n.js';
import { on } from '../../core/eventos.js';
import { rol as rolActual, usuarioActual, cerrarSesion } from '../../core/sesion.js';
import { aviso } from '../../core/capas.js';
import * as router from '../../core/router.js';
import { sim } from '../../sim/motor.js';
import { abrirDialogoConfirmacion } from '../componentes/dialogo_confirmacion.js';
import { abrirPanelNotificaciones, resumenNotificaciones } from '../componentes/panel_notificaciones.js';
import { seccionesVisibles, seccionInicial, permiso } from './opciones/_comun.js';
import { registrar } from './opciones/_bitacora.js';
import { instalarPanelDemo } from '../componentes/panel_demo.js';

const MODULOS = {
  parametros_ciclo: () => import('./opciones/parametros_ciclo.js'),
  parametros_sistema: () => import('./opciones/parametros_equipo.js'),
  entradas_salidas: () => import('./opciones/entradas_salidas.js'),
  mantenimiento: () => import('./opciones/mantenimiento.js'),
  opciones_avanzadas: () => import('./opciones/avanzadas.js'),
  usuarios: () => import('./opciones/usuarios.js'),
  conectividad: () => import('./opciones/conectividad.js'),
  fecha_hora: () => import('./opciones/fecha_hora.js'),
  info_sistema: () => import('./opciones/info_sistema.js'),
  bitacora: () => import('./opciones/bitacora.js'),
  respaldo: () => import('./opciones/respaldo.js'),
  catalogo_carga: () => import('./opciones/catalogo_carga.js'),
};

export function crear(params = {}) {
  const rol = rolActual();
  const visibles = seccionesVisibles(rol);
  let actual = visibles.some((s) => s.clave === params.seccion) ? params.seccion : seccionInicial(rol);
  let cajonAbierto = false;
  let instancia = null;      // sección montada
  let pendiente = false;     // cambios sin guardar
  let token = 0;
  const limpiezas = [];

  // ---- Encabezado (EncabezadoMenu: logo, reloj/fecha, campana con insignia, engranaje) ----
  const reloj = h('div', { class: 'op-reloj' });
  const fecha = h('div', { class: 'op-fecha' });
  const insignia = h('span', { class: 'op-insignia' });
  const campana = h('button', { class: 'op-campana', type: 'button', 'aria-label': t('notificaciones.titulo'), onclick: abrirNotificaciones },
    iconoMono('campana', { tam: 57, color: 'var(--c-texto-sobre-accion)' }), insignia);
  const engranaje = h('button', { class: 'op-engranaje', type: 'button', onclick: irAMenu },
    iconoMono('engranaje', { tam: 58, color: 'var(--c-texto-sobre-accion)' }));
  // Panel oculto de la demo: pulsación larga de 3 s sobre el logo (zona táctil encima del <img>).
  const zonaLogo = h('div', { class: 'op-logo-zona', style: { position: 'absolute', left: '60px', top: '40px', width: '293px', height: '100px' } });
  const encabezado = h('div', { class: 'op-encabezado' },
    h('img', { class: 'op-logo', src: 'assets/logo/logo-especifika-blanco.svg', alt: '' }), reloj, fecha, campana, engranaje, zonaLogo);
  const quitarPanelDemo = instalarPanelDemo(zonaLogo);

  function pintarReloj() {
    const d = new Date();
    reloj.textContent = horaTxt(d);
    fecha.textContent = `${d.getDate()} ${t(`fecha.meses.${d.getMonth()}`)}  -  ${d.getFullYear()}`;
    const r = resumenNotificaciones();
    insignia.textContent = String(r.conteo);
    insignia.style.display = r.conteo > 0 ? '' : 'none';
    insignia.classList.toggle('urgente', !!r.urgente);
  }
  pintarReloj();
  const idReloj = setInterval(pintarReloj, 1000);
  limpiezas.push(() => clearInterval(idReloj));

  function abrirNotificaciones() { abrirPanelNotificaciones(); }
  function irAMenu() { confirmarSalida(() => (router.enPila('menu') ? router.popHasta('menu') : router.reiniciar('menu'))); }

  // ---- Título con hamburguesa ----
  const titulo = h('div', { class: 'op-titulo' });
  const hamburguesa = h('button', { class: 'op-hamburguesa', type: 'button', 'aria-label': t('opciones.titulo'), onclick: () => alternarCajon() },
    h('i'), h('i'), h('i'));

  // ---- Riel / cajón ----
  const riel = h('div', { class: 'op-riel' });
  const velo = h('div', { class: 'op-velo', onclick: () => alternarCajon(false) });
  function pintarRiel() {
    riel.replaceChildren(...visibles.map((s) => h('button', { class: `op-riel-item${s.clave === actual ? ' activa' : ''}`, type: 'button',
      onclick: () => elegirSeccion(s.clave) },
      iconoMono(s.icono, { tam: 54, color: s.clave === actual ? 'var(--c-accion-primario)' : 'var(--c-texto-primario)' }),
      h('span', { class: 'op-riel-texto', text: t(`opciones.secciones.${s.clave}`) }))));
    riel.classList.toggle('abierto', cajonAbierto);
    velo.classList.toggle('visible', cajonAbierto);
  }
  function alternarCajon(v) { cajonAbierto = v ?? !cajonAbierto; pintarRiel(); }

  // ---- Contenido ----
  const banda = h('div', { class: 'op-banda' });
  const area = h('div', { class: 'op-area' });
  const contenido = h('div', { class: 'op-contenido' }, banda, area);

  function pintarBanda() {
    const p = permiso(actual, rol, sim.estado.maquina);
    const txt = p.ver && p.motivo && !['conectividad.motivo_rol', 'gestion_usuarios.motivo_rol'].includes(p.motivo) ? t(p.motivo) : '';
    banda.textContent = txt;
    banda.style.display = txt ? '' : 'none';
  }

  function confirmarSalida(siguiente) {
    if (!pendiente) { siguiente(); return; }
    abrirDialogoConfirmacion({ mensaje: t('opciones.salir_pregunta'), textoConfirmar: t('opciones.salir_confirmar'),
      textoCancelar: t('acciones.cancelar'), alConfirmar: () => { pendiente = false; siguiente(); } });
  }

  function elegirSeccion(clave) {
    cajonAbierto = false;
    if (clave === actual && instancia) { pintarRiel(); return; }
    confirmarSalida(() => { actual = clave; pendiente = false; for (const k of Object.keys(params)) if (k.startsWith('vista')) delete params[k]; pintarRiel(); montar(); });
  }

  async function montar() {
    const mi = ++token;
    params.seccion = actual;   // el router recrea la pantalla (idioma/tema) en la misma sección
    instancia?.destruir?.();
    instancia = null;
    area.replaceChildren();
    titulo.textContent = actual ? t(`opciones.secciones.${actual}`).toUpperCase() : t('opciones.titulo');
    pintarBanda();
    if (!actual) { area.append(h('div', { class: 'op-vacio', text: t('opciones.sin_secciones') })); return; }
    const mod = await MODULOS[actual]();
    if (mi !== token) return;
    const ctx = {
      rol, params, usuario: usuarioActual()?.usuario ?? '', nombreUsuario: usuarioActual()?.nombre ?? '',
      permiso: () => permiso(actual, rol, sim.estado.maquina),
      maquina: () => sim.estado.maquina,
      avisar: aviso,
      pendiente: (v) => { pendiente = !!v; },
      bitacora: (evento, datos) => registrar(evento, { usuario: usuarioActual()?.usuario ?? '', ...datos }),
    };
    instancia = mod.crear(ctx);
    instancia.el.classList.add('op-seccion');
    area.append(instancia.el);
  }

  // ---- Barra inferior ----
  function celda(clase, icono, fn) {
    return h('button', { class: `op-celda ${clase}`, type: 'button', onclick: fn },
      iconoMono(icono, { tam: 70, color: 'var(--c-icono-barra-menu)' }));
  }
  const barra = h('div', { class: 'op-barra' },
    celda('atras', 'flecha_atras', () => {
      if (cajonAbierto) { alternarCajon(false); return; }
      if (instancia?.atras?.()) return;
      confirmarSalida(() => router.pop());
    }),
    h('i', { class: 'op-div d1' }),
    celda('sesion', 'salir_sesion', () => confirmarSalida(() => {
      cerrarSesion();
      router.reiniciar('menu');
    })),
    h('i', { class: 'op-div d2' }),
    celda('inicio', 'casa', () => confirmarSalida(async () => {
      const app = await import('../../app.js');
      app.irAPrincipal();
    })));

  const el = h('div', { class: 'op' },
    encabezado,
    h('div', { class: 'op-tarjeta' }, hamburguesa, titulo, h('div', { class: 'op-divisor' }), contenido, velo, riel),
    barra);

  limpiezas.push(on('sim', () => pintarBanda()));
  pintarRiel();
  montar();

  return {
    el,
    destruir() { limpiezas.forEach((f) => f()); quitarPanelDemo?.(); instancia?.destruir?.(); token++; },
  };
}
