// Partes comunes de Preciclo y Ciclo en curso (interno del frente ciclo):
// fondo, encabezado (logo, reloj, campana con insignia, engranaje), tarjeta de ciclo
// (CICLO ACTIVO / PROGRAMA / ESTADO), tarjeta de parámetros (6 columnas) y barra
// inferior personalizada (equipo, avatar). Coordenadas del mockup 1196x1917
// (PantallaPreciclo.qml / PantallaCicloEnCurso.qml); el contenedor .fc-mockup las escala.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { on } from '../../core/eventos.js';
import { tocar } from '../../core/sonido.js';
import { sim } from '../../sim/motor.js';
import * as historial from '../../sim/historial.js';
import { txt, fijarTexto, caja, iconoCaja, mascara, medir, fechaEncabezado, dos, EQUIPO_DEMO,
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
  const el = h('div', { class: 'fc-encabezado' });
  const logo = caja('img', 73, 57, 267, 267 * 42427 / 158611);
  logo.src = 'assets/logo/logo-especifika-blanco.svg'; logo.alt = 'especifika'; logo.draggable = false;
  const hora = txt('', { cx: 597.5, bl: 108, tam: 97, peso: 700, familia: 'reloj', color: 'var(--c-texto-sobre-accion)' });
  const fecha = txt('', { cx: 598, bl: 141, tam: 26, familia: 'reloj', color: 'var(--c-texto-sobre-accion)' });
  const campana = iconoCaja('campana', [888, 64, 51, 57], [5.85, 4.0, 42.15, 44.0]);
  const insignia = crearInsigniaCampana({ tam: 26, tamFuente: 17 });
  Object.assign(insignia.el.style, { left: '922px', top: '50px' });
  const zCampana = caja('button', 870, 40, 90, 95, 'fc-zona');
  zCampana.setAttribute('aria-label', t('notificaciones.titulo'));
  zCampana.addEventListener('click', () => alCampana?.());
  const engranaje = iconoCaja('engranaje', [1043, 64, 57, 58], [4.0, 4.0, 44.0, 44.0]);
  const zEng = caja('button', 1025, 45, 95, 95, 'fc-zona');
  zEng.setAttribute('aria-label', 'Menú');
  zEng.addEventListener('click', () => alEngranaje?.());
  // Panel oculto de la demo: pulsación larga de 3 s sobre el logo (zona táctil encima del <img>).
  const zLogo = caja('div', 60, 40, 293, 100, 'fc-zona');
  const quitarPanel = instalarPanelDemo(zLogo);
  el.append(logo, hora, fecha, campana, insignia.el, engranaje, zCampana, zEng, zLogo);
  const reloj = () => {
    const d = new Date();
    fijarTexto(hora, `${dos(d.getHours())}:${dos(d.getMinutes())}`);
    fijarTexto(fecha, fechaEncabezado(d));
  };
  reloj();
  const tReloj = setInterval(reloj, 1000);
  return { el, actualizar: (e) => insignia.actualizar(e), destruir: () => { clearInterval(tReloj); quitarPanel?.(); } };
}

/** Divisor vertical de 2 px centrado en cx. */
export function divisor(cx, y0, y1, color) {
  return caja('div', cx - 1, y0, 2, y1 - y0, 'fc-div', { background: color });
}

/** Etiqueta (TextoAjustable): texto completo si cabe, si no abrev.<clave>. */
export function etiqueta(clave, lx, bl, limite) {
  const disp = limite - lx - 4;
  const completo = t(clave);
  const abrevClave = `abrev.${clave}`;
  const abrev = t(abrevClave);
  const texto = medir(completo, 12, 600) <= disp || abrev === abrevClave ? completo : abrev;
  return txt(texto, { lx, bl, tam: 12, peso: 600, color: 'var(--c-texto-etiqueta)', ancho: disp });
}

/**
 * Tarjeta de ciclo: número, programa (con «toque para cambiar» opcional) y estado.
 * modo 'preciclo' | 'ciclo'. -> {el, fijar({numero, programa, ayuda, estado, vigente})}
 * estado = {tipo: 'listo'|'no_listo'|'ejecutando'|'exitoso'|'fallo'|'cancelado', texto}
 */
export function crearTarjetaCiclo({ alTocarPrograma = null } = {}) {
  const el = h('div', { class: 'fc-tarjeta-ciclo' });
  el.append(caja('div', 19, 404, 1159, 2, '', { background: 'var(--c-borde-tarjeta)' }),
    divisor(351, 219, 384, 'var(--c-divisor-ciclo)'), divisor(839, 219, 384, 'var(--c-divisor-ciclo)'));
  const rot = (cx, clave) => txt(t(clave), { cx, bl: 229, tam: 17, peso: 500, color: 'var(--c-texto-negro)' });
  el.append(rot(199, 'ciclo.activo'), rot(599.5, 'ciclo.programa'), rot(1011, 'ciclo.estado'));
  const numero = txt('', { cx: 200, bl: 333, tam: 103, peso: 700, familia: 'num', color: 'var(--c-texto-negro)' });
  const programa = txt('', { cx: 599, bl: 308, tam: 36, peso: 700, color: 'var(--c-texto-programa)' });
  const programa2 = caja('div', 351 + 12, 248, 464, 84, 'fc-programa-2l oculto');
  const ayuda = txt(t('selector_ciclo.ayuda'), { cx: 599, bl: 352, tam: 16, color: 'var(--c-texto-guia)' });
  const circulo = caja('div', 972, 256, 78, 78, 'fc-estado-circulo');
  const check = mascara('assets/iconos/mono/confirmar.svg', 62, 'var(--c-texto-sobre-accion)', 'fc-estado-check');
  const excl = h('span', { class: 'fc-estado-excl', text: '!' });
  const ejec = h('span', { class: 'fc-icono-ejecucion' },
    mascara('assets/imagenes/flechas.svg', 72, 'var(--c-texto-sobre-accion)', 'flechas'),
    mascara('assets/imagenes/engranaje_ejecucion.svg', 72, 'var(--c-texto-sobre-accion)', 'engranaje'));
  circulo.append(check, excl, ejec);
  const textoEstado = txt('', { cx: 1010, bl: 375, tam: 22, peso: 600, color: 'var(--c-naranja-texto)' });
  el.append(numero, programa, programa2, ayuda, circulo, textoEstado);
  if (alTocarPrograma) {
    const z1 = caja('button', 351, 219, 488, 165, 'fc-zona'); z1.addEventListener('click', alTocarPrograma);
    const z2 = caja('button', 34, 219, 317, 165, 'fc-zona'); z2.addEventListener('click', alTocarPrograma);
    el.append(z1, z2);
  }
  let previo = '';
  return {
    el,
    fijar({ numero: n = '', programa: p = '', ayuda: a = false, estado = {}, vigente = true, modo = 'preciclo' }) {
      const firma = [n, p, a, estado.tipo, estado.texto, vigente, modo].join('|');
      if (firma === previo) return;
      previo = firma;
      fijarTexto(numero, n || t('sistema.sin_lectura'));
      numero.style.color = vigente ? 'var(--c-texto-negro)' : 'var(--c-texto-guia)';
      const nombre = p || t('sistema.sin_lectura');
      const dosLineas = medir(nombre, 36, 700) > 464;
      fijarTexto(programa, nombre);
      programa.classList.toggle('oculto', dosLineas);
      programa2.classList.toggle('oculto', !dosLineas);
      programa2.textContent = nombre;
      if (dosLineas) programa2.style.fontSize = `${Math.max(14, Math.min(36, Math.floor(36 * 2 * 440 / medir(nombre, 36, 700))))}px`;
      ayuda.classList.toggle('oculto', !a);
      const tipo = estado.tipo || 'no_listo';
      const verde = tipo === 'listo' || tipo === 'ejecutando' || tipo === 'exitoso';
      circulo.dataset.tipo = tipo;
      if (modo === 'ciclo') { Object.assign(circulo.style, { left: '970px', top: '254px', width: '80px', height: '80px' }); textoEstado._fc.bl = 380; }
      circulo.classList.toggle('verde', verde);
      check.classList.toggle('oculto', !(tipo === 'listo' || tipo === 'exitoso'));
      excl.classList.toggle('oculto', verde);
      ejec.classList.toggle('oculto', tipo !== 'ejecutando');
      check.style.width = check.style.height = modo === 'ciclo' ? '64px' : '62px';
      textoEstado.style.top = `${(modo === 'ciclo' ? 380 : 375) - 0.858 * 22}px`;
      fijarTexto(textoEstado, estado.texto || '');
      textoEstado.style.color = verde ? 'var(--c-estado-ejecucion)' : 'var(--c-naranja-texto)';
    },
  };
}

/** Entradas mostradas por defecto (O3): temperatura de cámara, de referencia y presión. */
export const ENTRADAS = [
  { clave: 'temp_camara', tipo: 'temp', sensor: 'temp_camara', color: 'var(--c-valor-temp-camara)' },
  { clave: 'temp_referencia', tipo: 'temp', sensor: 'temp_ref', color: 'var(--c-valor-temp-referencia)' },
  { clave: 'pres_camara', tipo: 'pres', sensor: 'pres_camara', color: 'var(--c-valor-presion)' },
];

/** Tarjeta de parámetros (6 columnas). dy = 0 (Preciclo) o 151 (Ciclo en curso). -> {el, fijar(prog, sensores, vigente)} */
export function crearTarjetaParametros({ dy = 0 } = {}) {
  const el = h('div', { class: 'fc-tarjeta-param' });
  el.style.transform = `translateY(${dy}px)`;
  el.append(caja('div', 34, 425, 1129, 208, 'fc-param-marco'));
  [[222.2, 604], [410.3, 604], [598.5, 608], [786.7, 606], [974.8, 606]].forEach(([cx, y1]) =>
    el.append(divisor(cx, 452, y1, 'var(--c-divisor-param)')));
  const valor = (cx, color) => txt('', { cx, bl: 554, tam: 55, peso: 700, familia: 'num', color, ancho: 182 });
  const unidad = (cx, texto) => txt(texto, { cx, bl: 606, tam: 27, peso: 700, familia: 'num', color: 'var(--c-texto-unidad)' });
  const uT = t('unidades.temperatura'), uMin = t('unidades.tiempo'), uP = t('unidades.presion');
  el.append(iconoCaja('sensor_temperatura', [59.1, 448, 20, 33], [12.25, 4.0, 36.55, 44.0]),
    etiqueta('ciclo.temp_ester', 115.1, 469, 222.2));
  const vTemp = valor(128.1, 'var(--c-texto-negro)'); el.append(vTemp, unidad(127.6, uT));
  el.append(iconoCaja('sensor_tiempo', [246.7, 447, 35, 35], [5.9, 5.9, 42.1, 42.1]),
    etiqueta('ciclo.tiempo_est', 309.7, 467, 410.3));
  const vTiempo = valor(316.2, 'var(--c-texto-negro)'); el.append(vTiempo, unidad(322.7, uMin));
  el.append(iconoCaja('sensor_tiempo_secado', [437.4, 446, 27, 39], [10.05, 4.2, 37.95, 43.8], 'var(--c-texto-guia)'),
    etiqueta('ciclo.tiempo_sec', 493.4, 467, 598.5));
  const vSecado = valor(504.4, 'var(--c-texto-negro)'); el.append(vSecado, unidad(504.4, uMin));
  const vEntradas = ENTRADAS.map((en, i) => {
    const c0 = [598.5, 786.7, 974.8][i];
    const pres = en.tipo === 'pres';
    el.append(pres
      ? iconoCaja('sensor_presion', [c0 + 31.6, 450, 37, 31], [5.3, 8.0, 43.7, 40.85])
      : iconoCaja('sensor_temperatura_2', [c0 + 26.6, 448, 20, 33], [12.25, 4.0, 36.55, 44.0]),
    etiqueta(`ciclo.entrada_corta_${en.clave}`, c0 + (pres ? 99.6 : 73.6), pres ? 467 : 469, c0 + 188.2));
    const v = valor(c0 + 94.1, en.color);
    el.append(v, unidad(c0 + (pres ? 109.6 : 85.1), pres ? uP : uT));
    return v;
  });
  return {
    el,
    fijar(prog, sensores = {}, vigente = true) {
      fijarTexto(vTemp, fTempConsigna(param(prog, 'esterilizacion', 'temperatura_esterilizacion')));
      fijarTexto(vTiempo, fMin(param(prog, 'esterilizacion', 'tiempo_esterilizacion')));
      fijarTexto(vSecado, fMin(param(prog, 'secado', 'tiempo_secado')));
      [vTemp, vTiempo, vSecado].forEach((v) => { v.style.color = vigente ? 'var(--c-texto-negro)' : 'var(--c-texto-guia)'; });
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
 * -> {el, mx(v), celdaDerecha (nodo), celdaCentro (nodo)}
 */
export function crearBarraInferior({ avatarEn = 'derecha', alEquipo, alAvatar } = {}) {
  const ancho = 1159;
  const fx = ancho / 1128;
  const mx = (v) => v * fx;
  const el = caja('div', 19, 1746, ancho, 139, 'fc-barra-inferior');
  el.append(divisor(mx(313), 19, 125, 'var(--c-divisor-pie)'), divisor(mx(800), 19, 125, 'var(--c-divisor-pie)'));
  const equipo = caja('button', 0, 0, mx(313), 139, 'fc-zona fc-celda-equipo');
  const icono = caja('img', 71 - 5.5 - 34, 1763 - 5.5 - 1746, 94, 62);
  icono.src = 'assets/iconos/color/icono_autoclave.svg'; icono.alt = ''; icono.draggable = false;
  const pie = (bl, texto) => txt(texto, { lx: 36, bl: bl - 1746, tam: 17, peso: 600, color: 'var(--c-texto-pie)', ancho: mx(313) - 42 });
  equipo.append(icono, pie(1838, t('ciclo.modelo') + EQUIPO_DEMO.modelo), pie(1862, t('ciclo.serie') + EQUIPO_DEMO.serie));
  equipo.addEventListener('click', () => alEquipo?.());
  const celdaCentro = caja('div', mx(313), 0, mx(800) - mx(313), 139, 'fc-celda');
  const celdaDerecha = caja('div', mx(800), 0, ancho - mx(800), 139, 'fc-celda');
  const avatar = h('button', { class: 'fc-avatar', 'aria-label': t('acciones.iniciar_sesion') },
    h('img', { src: 'assets/iconos/color/usuario.svg', alt: '', draggable: 'false' }));
  avatar.addEventListener('click', () => alAvatar?.());
  (avatarEn === 'centro' ? celdaCentro : celdaDerecha).append(avatar);
  const demo = h('span', { class: 'marca-demo fc-marca-demo', text: 'DEMO' });
  celdaCentro.append(demo);
  el.append(equipo, celdaCentro, celdaDerecha);
  return { el, mx, celdaCentro, celdaDerecha, avatar, demo };
}

/** Número de ciclo para la cabecera de Preciclo (el siguiente al último). */
export function numeroSiguiente(e = sim.estado) {
  let ult = e?.ultimoCiclo?.numero ?? 0;
  try { for (const r of historial.listar?.() || []) ult = Math.max(ult, r.numero || 0); } catch { /* sin historial */ }
  const n = e?.siguienteNumero ?? ult + 1;
  return dos(n);
}
