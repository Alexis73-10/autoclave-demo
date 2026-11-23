// Partes comunes de Preciclo y Ciclo en curso (interno del frente ciclo):
// fondo, encabezado (logo, reloj, campana con insignia, engranaje), tarjeta de ciclo
// (CICLO ACTIVO / PROGRAMA / ESTADO), tarjeta de parámetros (6 columnas) y barra
// inferior personalizada (equipo, avatar). Composición adaptable (v1.1): layout fluido
// con flex/grid; las proporciones salen de --fc-u (px reales por px del QML, con piso
// de letra 12,2 px y toques de 44 px), ver css/frente_ciclo.css.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { on } from '../../core/eventos.js';
import { tocar } from '../../core/sonido.js';
import { sim } from '../../sim/motor.js';
import * as historial from '../../sim/historial.js';
import { fijarTexto, encajar, mascara, fechaEncabezado, dos, EQUIPO_DEMO,
  fTempConsigna, fTempLectura, fMin, fPres, param } from './_ciclo_util.js';
import { crearInsigniaCampana } from './panel_notificaciones.js';
import { instalarPanelDemo } from './panel_demo.js';

// ---- sonidos (una sola suscripción global: alarma alta y fin de ciclo) ----
let sonidosInstalados = false;
export function instalarSonidos() {
  if (sonidosInstalados) return;
  sonidosInstalados = true;
  on('alarma-nueva', (a) => { if (a && (a.nivel === 'alta' || !a.nivel)) tocar('alta'); });
  on('ciclo-terminado', () => tocar('fin'));
}

/** Fondo (FondoApp): imagen en claro, gradiente radial en oscuro (CSS). */
export function crearFondo() { return h('div', { class: 'fc-fondo-app' }); }

/** Encabezado: {el, actualizar(estado), destruir()} */
export function crearEncabezado({ alCampana, alEngranaje } = {}) {
  const logo = h('img', { class: 'fc-enc-logo-img', src: 'assets/logo/logo-especifika-blanco.svg', alt: 'especifika', draggable: 'false' });
  // Panel oculto de la demo: pulsación larga de 3 s sobre el logo.
  // Marca DEMO discreta bajo el logo (la demo no la tiene en la barra inferior: allí no siempre hay sitio).
  const zLogo = h('div', { class: 'fc-enc-logo' }, logo, h('span', { class: 'marca-demo fc-marca-demo', text: 'DEMO' }));
  const quitarPanel = instalarPanelDemo(zLogo);
  const hora = h('div', { class: 'fc-enc-hora' });
  const fecha = h('div', { class: 'fc-enc-fecha' });
  const reloj = h('div', { class: 'fc-enc-reloj' }, hora, fecha);
  const insignia = crearInsigniaCampana();
  const bCampana = h('button', { class: 'fc-enc-boton campana', 'aria-label': t('notificaciones.titulo') },
    h('img', { src: 'assets/iconos/color/campana.svg', alt: '', draggable: 'false' }), insignia.el);
  bCampana.addEventListener('click', () => alCampana?.());
  const bEng = h('button', { class: 'fc-enc-boton engranaje', 'aria-label': 'Menú' },
    h('img', { src: 'assets/iconos/color/engranaje.svg', alt: '', draggable: 'false' }));
  bEng.addEventListener('click', () => alEngranaje?.());
  const el = h('header', { class: 'fc-encabezado' }, zLogo, reloj, h('div', { class: 'fc-enc-der' }, bCampana, bEng));
  const pintarReloj = () => {
    const d = new Date();
    fijarTexto(hora, `${dos(d.getHours())}:${dos(d.getMinutes())}`);
    fijarTexto(fecha, fechaEncabezado(d));
  };
  pintarReloj();
  const tReloj = setInterval(pintarReloj, 1000);
  return { el, actualizar: (e) => insignia.actualizar(e), destruir: () => { clearInterval(tReloj); quitarPanel?.(); } };
}

/**
 * Tarjeta de ciclo: número, programa (con «toque para cambiar» opcional) y estado.
 * -> {el, fijar({numero, programa, ayuda, estado, vigente, modo})}
 * estado = {tipo: 'listo'|'no_listo'|'ejecutando'|'exitoso'|'fallo'|'cancelado', texto}
 */
export function crearTarjetaCiclo({ alTocarPrograma = null } = {}) {
  const tag = alTocarPrograma ? 'button' : 'div';
  const rot = (clave) => h('div', { class: 'fc-tc-rot fc-encaja', text: t(clave) });
  const numero = h('div', { class: 'fc-tc-numero fc-encaja' });
  const programa = h('div', { class: 'fc-tc-programa' });
  const ayuda = h('div', { class: 'fc-tc-ayuda fc-ayuda', text: t('selector_ciclo.ayuda') });
  const check = mascara('assets/iconos/mono/confirmar.svg', null, 'var(--c-texto-sobre-accion)', 'fc-estado-check');
  const excl = h('span', { class: 'fc-estado-excl', text: '!' });
  const ejec = h('span', { class: 'fc-icono-ejecucion' },
    mascara('assets/imagenes/flechas.svg', null, 'var(--c-texto-sobre-accion)', 'flechas'),
    mascara('assets/imagenes/engranaje_ejecucion.svg', null, 'var(--c-texto-sobre-accion)', 'engranaje'));
  const circulo = h('div', { class: 'fc-estado-circulo' }, check, excl, ejec);
  const textoEstado = h('div', { class: 'fc-tc-estado-texto fc-encaja' });
  const cNum = h(tag, { class: 'fc-tc-col numero' }, rot('ciclo.activo'), numero);
  const cProg = h(tag, { class: 'fc-tc-col programa' }, rot('ciclo.programa'), programa, ayuda);
  const cEst = h('div', { class: 'fc-tc-col estado' }, rot('ciclo.estado'), circulo, textoEstado);
  if (alTocarPrograma) [cNum, cProg].forEach((b) => b.addEventListener('click', alTocarPrograma));
  const el = h('div', { class: 'fc-tarjeta-ciclo' }, cNum, cProg, cEst);
  let previo = '';
  return {
    el,
    ajustar() { if (!ayuda.classList.contains('oculto')) ajustarAyuda(ayuda); },
    fijar({ numero: n = '', programa: p = '', ayuda: a = false, estado = {}, vigente = true, modo = 'preciclo' }) {
      const firma = [n, p, a, estado.tipo, estado.texto, vigente, modo].join('|');
      if (firma === previo) return;
      previo = firma;
      fijarTexto(numero, n || t('sistema.sin_lectura'));
      numero.classList.toggle('sin-datos', !vigente);
      programa.textContent = p || t('sistema.sin_lectura');
      ayuda.classList.toggle('oculto', !a);
      if (a) ajustarAyuda(ayuda);
      const tipo = estado.tipo || 'no_listo';
      const verde = tipo === 'listo' || tipo === 'ejecutando' || tipo === 'exitoso';
      circulo.dataset.tipo = tipo;
      circulo.classList.toggle('verde', verde);
      check.classList.toggle('oculto', !(tipo === 'listo' || tipo === 'exitoso'));
      excl.classList.toggle('oculto', verde);
      ejec.classList.toggle('oculto', tipo !== 'ejecutando');
      fijarTexto(textoEstado, estado.texto || '');
      textoEstado.classList.toggle('verde', verde);
    },
  };
}

/** «Toque para cambiar de ciclo»: una línea si cabe con la letra nominal o reducida; si no, dos. */
export function ajustarAyuda(el) {
  el.classList.remove('envuelve');
  el.classList.add('fc-encaja');
  encajar(el);
  if (el.scrollWidth > el.clientWidth + 0.5) { el.classList.remove('fc-encaja'); el.style.fontSize = ''; el.classList.add('envuelve'); }
}

/** Entradas mostradas por defecto (O3): temperatura de cámara, de referencia y presión. */
export const ENTRADAS = [
  { clave: 'temp_camara', tipo: 'temp', sensor: 'temp_camara', color: 'var(--c-valor-temp-camara)' },
  { clave: 'temp_referencia', tipo: 'temp', sensor: 'temp_ref', color: 'var(--c-valor-temp-referencia)' },
  { clave: 'pres_camara', tipo: 'pres', sensor: 'pres_camara', color: 'var(--c-valor-presion)' },
];

/** Etiqueta (TextoAjustable): texto completo si cabe en una línea, si no abrev.<clave>. */
function crearEtiqueta(clave) {
  const completo = t(clave);
  const ak = `abrev.${clave}`;
  const abrev = t(ak);
  const el = h('span', { class: 'fc-pc-rot', text: completo });
  el._fc = { completo, abrev: abrev === ak ? completo : abrev };
  return el;
}
/** Elige completo/abreviado según el ancho actual (lo llama la tarjeta al cambiar de tamaño).
 *  Si ni el abreviado cabe al lado del icono, el icono pasa arriba (columna .apilada); si aun
 *  así no cabe en una línea, se envuelve en palabras. */
function ajustarEtiqueta(el) {
  const { completo, abrev } = el._fc;
  const col = el.closest('.fc-pc-col');
  const cabe = () => el.scrollWidth <= el.clientWidth + 0.5;
  el.classList.remove('envuelve');
  col?.classList.remove('apilada');
  el.style.whiteSpace = 'nowrap';          // se mide en una línea aunque el CSS permita envolver
  el.textContent = completo;
  if (!cabe() && abrev !== completo) el.textContent = abrev;
  if (!cabe() && col) {
    col.classList.add('apilada');
    el.textContent = completo;
    if (!cabe() && abrev !== completo) el.textContent = abrev;
  }
  if (!cabe()) el.classList.add('envuelve');
  el.style.whiteSpace = '';
}

/** Tarjeta de parámetros (6 columnas). -> {el, fijar(prog, sensores, vigente), ajustar()} */
export function crearTarjetaParametros() {
  const columnas = [];
  const etiquetas = [];
  const col = (icono, clave, color, unidad) => {
    const et = crearEtiqueta(clave);
    etiquetas.push(et);
    const valor = h('div', { class: 'fc-pc-valor fc-encaja' });
    if (color) valor.style.color = color;
    const c = h('div', { class: 'fc-pc-col' },
      h('div', { class: 'fc-pc-cab' }, icono, et), h('div', { class: 'fc-pc-med' }, valor, h('div', { class: 'fc-pc-unidad', text: unidad })));
    columnas.push(c);
    return valor;
  };
  const uT = t('unidades.temperatura'), uMin = t('unidades.tiempo'), uP = t('unidades.presion');
  const ico = (n, color = null) => (color
    ? mascara(`assets/iconos/mono/${n}.svg`, null, color, 'fc-pc-ico')
    : h('img', { class: 'fc-pc-ico', src: `assets/iconos/color/${n}.svg`, alt: '', draggable: 'false' }));
  const vTemp = col(ico('sensor_temperatura'), 'ciclo.temp_ester', null, uT);
  const vTiempo = col(ico('sensor_tiempo'), 'ciclo.tiempo_est', null, uMin);
  const vSecado = col(ico('sensor_tiempo_secado', 'var(--c-texto-guia)'), 'ciclo.tiempo_sec', null, uMin);
  const vEntradas = ENTRADAS.map((en) => col(ico(en.tipo === 'pres' ? 'sensor_presion' : 'sensor_temperatura_2'),
    `ciclo.entrada_corta_${en.clave}`, en.color, en.tipo === 'pres' ? uP : uT));
  const el = h('div', { class: 'fc-tarjeta-param' }, columnas);
  const ajustar = () => {
    etiquetas.forEach(ajustarEtiqueta);
    [vTemp, vTiempo, vSecado, ...vEntradas].forEach((v) => encajar(v));
  };
  return {
    el, ajustar,
    fijar(prog, sensores = {}, vigente = true) {
      fijarTexto(vTemp, fTempConsigna(param(prog, 'esterilizacion', 'temperatura_esterilizacion')));
      fijarTexto(vTiempo, fMin(param(prog, 'esterilizacion', 'tiempo_esterilizacion')));
      fijarTexto(vSecado, fMin(param(prog, 'secado', 'tiempo_secado')));
      [vTemp, vTiempo, vSecado].forEach((v) => v.classList.toggle('sin-datos', !vigente));
      ENTRADAS.forEach((en, i) => {
        const raw = vigente ? sensores?.[en.sensor] : null;
        fijarTexto(vEntradas[i], en.tipo === 'pres' ? fPres(raw) : fTempLectura(raw));
        vEntradas[i].style.color = vigente ? en.color : 'var(--c-texto-guia)';
      });
    },
  };
}

/**
 * Barra inferior personalizada (BarraInferiorMenu personalizada): celda izquierda
 * equipo (abre el panel), avatar en la celda indicada ('centro' | 'derecha').
 * -> {el, mx(v), celdaCentro (nodo), celdaDerecha (nodo), avatar, demo}
 */
export function crearBarraInferior({ avatarEn = 'derecha', alEquipo, alAvatar } = {}) {
  const modelo = h('span', { class: 'fc-bi-texto', text: t('ciclo.modelo') + EQUIPO_DEMO.modelo });
  const serie = h('span', { class: 'fc-bi-texto', text: t('ciclo.serie') + EQUIPO_DEMO.serie });
  const equipo = h('button', { class: 'fc-celda-equipo', 'aria-label': t('equipo.titulo') },
    h('img', { class: 'fc-bi-icono', src: 'assets/iconos/color/icono_autoclave.svg', alt: '', draggable: 'false' }),
    h('span', { class: 'fc-bi-textos' }, modelo, serie));
  equipo.addEventListener('click', () => alEquipo?.());
  const celdaCentro = h('div', { class: 'fc-celda centro' });
  const celdaDerecha = h('div', { class: 'fc-celda derecha' });
  const avatar = h('button', { class: 'fc-avatar', 'aria-label': t('acciones.iniciar_sesion') },
    h('img', { src: 'assets/iconos/color/usuario.svg', alt: '', draggable: 'false' }));
  avatar.addEventListener('click', () => alAvatar?.());
  (avatarEn === 'centro' ? celdaCentro : celdaDerecha).append(avatar);
  // La marca DEMO va en el encabezado (crearEncabezado); se conserva el nodo por compatibilidad.
  const demo = h('span', { class: 'marca-demo fc-marca-demo', text: 'DEMO' });
  const el = h('footer', { class: `fc-barra-inferior avatar-${avatarEn}` }, equipo, celdaCentro, celdaDerecha);
  return { el, mx: (v) => v, celdaCentro, celdaDerecha, avatar, demo };
}

/** Número de ciclo para la cabecera de Preciclo (el siguiente al último). */
export function numeroSiguiente(e = sim.estado) {
  let ult = e?.ultimoCiclo?.numero ?? 0;
  try { for (const r of historial.listar?.() || []) ult = Math.max(ult, r.numero || 0); } catch { /* sin historial */ }
  const n = e?.siguienteNumero ?? ult + 1;
  return dos(n);
}
