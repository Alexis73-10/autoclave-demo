// Preciclo (Pantallas/PantallaPreciclo.qml, vertical): encabezado, tarjeta de ciclo
// (número, programa con selector, estado Listo / No preparado), tarjeta de
// parámetros, tarjeta «ALARMAS Y AVISOS» (filas de seguridad + alarmas activas),
// ABRIR/CERRAR PUERTA, Carga, deslizador INICIAR (o RECONOCER FALLA en FALLA) y
// barra inferior (equipo, avatar). Coordenadas del mockup 1196x1917.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { on } from '../../core/eventos.js';
import * as router from '../../core/router.js';
import { haySesion, usuarioActual, operadores } from '../../core/sesion.js';
import { sim } from '../../sim/motor.js';
import { abrirConfiguracion } from '../../app.js';
import { caja, txt, iconoPuerta, textosAlarma } from '../componentes/_ciclo_util.js';
import { crearFondo, crearEncabezado, crearTarjetaCiclo, crearTarjetaParametros, crearBarraInferior,
  numeroSiguiente, instalarSonidos } from '../componentes/_comun_pantalla_ciclo.js';
import { abrirPanelNotificaciones } from '../componentes/panel_notificaciones.js';
import { abrirPanelEquipo } from '../componentes/panel_equipo.js';
import { crearSeccionEstadoSeguro, crearFilaAlarma } from '../componentes/seccion_estado_seguro.js';
import { abrirDetalleAlarma } from '../componentes/ventana_detalle_alarma.js';
import { abrirSelectorPrograma, motivoNoTocable } from '../componentes/selector_programa.js';
import { crearDeslizador } from '../componentes/deslizador.js';
import { abrirModalOperador } from '../componentes/modal_operador.js';
import { abrirVentanaCarga, resumenCarga } from '../componentes/ventana_carga.js';

export function crear() {
  instalarSonidos();
  const quitar = [];
  const raiz = h('div', { class: 'fc-pantalla' });
  const m = h('div', { class: 'fc-mockup' });
  raiz.append(crearFondo(), m);

  const enc = crearEncabezado({ alCampana: () => abrirPanelNotificaciones(), alEngranaje: () => router.push('menu') });
  m.append(enc.el);
  m.append(caja('div', 19, 177, 1159, 1746 - 10 - 177, 'fc-tarjeta-principal'));
  const tCiclo = crearTarjetaCiclo({ alTocarPrograma: () => abrirSelectorPrograma() });
  const tParam = crearTarjetaParametros({ dy: 0 });
  m.append(tCiclo.el, tParam.el);

  // ---- tarjeta de alarmas y avisos ----
  m.append(caja('div', 34, 655, 1130, 944, 'fc-tarjeta-alarmas'),
    txt(t('ciclo.alarmas_titulo'), { lx: 81, bl: 717, tam: 27, peso: 700, color: 'var(--c-texto-titulo)' }),
    caja('div', 81, 737, 1035, 2, '', { background: 'var(--c-linea-alarmas)' }));
  const avisoTexto = h('div', { class: 'fc-aviso-alarmas oculto' });
  const seguridad = crearSeccionEstadoSeguro({ grupo: '' });
  const lista = h('div', { class: 'fc-lista-alarmas desplazable' });
  const zona = caja('div', 81, 739, 1035, 1598 - 739, 'fc-zona-alarmas');
  zona.append(avisoTexto, seguridad.el, lista);
  const vacio = txt(t('ciclo.sin_alarmas'), { cx: 598.5, bl: 1176, tam: 28, color: 'var(--c-texto-vacio)' });
  m.append(zona, vacio);
  let tAviso = 0;
  const mostrarAviso = (texto) => {
    avisoTexto.textContent = sim.ultimoRechazo?.texto || texto; avisoTexto.classList.remove('oculto');
    clearTimeout(tAviso); tAviso = setTimeout(() => avisoTexto.classList.add('oculto'), 5000);
  };

  // ---- botón ABRIR / CERRAR PUERTA ----
  const puerta = 1;
  const bPuerta = caja('button', 41, 1615, 298, 110, 'fc-boton-accion puerta');
  const circPuerta = caja('span', 64 - 41, 1629 - 1615, 84, 84, 'fc-ba-circulo');
  const txtPuerta = h('span', { class: 'fc-ba-texto' });
  Object.assign(txtPuerta.style, { left: `${172 - 41}px`, top: `${1676 - 1615 - 0.858 * 17}px`, width: `${298 - (172 - 41) - 12}px` });
  bPuerta.append(circPuerta, txtPuerta);
  let puertaAbierta = null;
  bPuerta.addEventListener('click', () => {
    const st = sim.estado.puertas?.[puerta];
    const abierta = st === 'ABIERTA' || st === 'ABRIENDO';
    const r = abierta ? sim.cerrarPuerta(puerta) : sim.abrirPuerta(puerta);
    if (typeof r === 'string' && r) mostrarAviso(t(r));
  });

  // ---- botón Carga ----
  const bCarga = caja('button', 365, 1615, 790 - 365, 110, 'fc-boton-carga');
  const barras = h('span', { class: 'fc-carga-barras' }, [4, 2, 6, 2, 3, 6, 2, 4, 2, 5].map((w) => h('i', { style: { width: `${w}px` } })));
  const resumen = h('span', { class: 'fc-carga-resumen' });
  bCarga.append(barras, h('span', { class: 'fc-carga-col' },
    h('span', { class: 'fc-carga-titulo', text: t('registro_carga.boton').toUpperCase() }), resumen));
  const pintarCarga = () => { resumen.textContent = resumenCarga(); };
  bCarga.addEventListener('click', () => abrirVentanaCarga({ alCerrar: pintarCarga }));
  pintarCarga();

  // ---- deslizador INICIAR ----
  const desl = crearDeslizador({ variante: 'inicio', ancho: 332, alto: 110, texto: t('modulos.iniciar_deslizar'),
    textoCompletado: t('modulos.iniciando_deslizar'), manija: h('span', { class: 'fc-play' }), alCompletar: iniciar });
  Object.assign(desl.el.style, { position: 'absolute', left: '815px', top: '1616px' });

  function iniciar() {
    const lanzar = (operador) => {
      const r = sim.iniciarCiclo({ operador });
      if (r) mostrarAviso(t(r));
    };
    const ops = (operadores() || []).filter((o) => o.activo !== false && !o.eliminado);
    if (!haySesion() && ops.length) {
      abrirModalOperador({ operadores: ops, alAceptar: (op) => lanzar(op?.nombre) });
    } else lanzar(usuarioActual()?.nombre ?? null);
  }

  // ---- RECONOCER FALLA ----
  const bFalla = caja('button', 845, 1616, 302, 110, 'fc-boton-accion falla oculto');
  const circFalla = caja('span', 866 - 845, 1629 - 1616, 84, 84, 'fc-ba-circulo');
  circFalla.append(h('span', { class: 'fc-ba-excl', text: '!' }));
  const txtFalla = h('span', { class: 'fc-ba-texto', text: t('modulos.reconocer_falla') });
  Object.assign(txtFalla.style, { left: `${980 - 845}px`, top: `${1676 - 1616 - 0.858 * 17}px`, width: `${302 - (980 - 845) - 12}px` });
  bFalla.append(circFalla, txtFalla);
  bFalla.addEventListener('click', () => { const r = sim.resetFalla(); if (typeof r === 'string' && r) mostrarAviso(t(r)); });
  m.append(bPuerta, bCarga, desl.el, bFalla);

  // ---- barra inferior ----
  const barra = crearBarraInferior({ avatarEn: 'derecha', alEquipo: () => abrirPanelEquipo({ permiteApagar: true }),
    alAvatar: () => abrirConfiguracion() });
  m.append(barra.el);

  // ---- actualización ----
  let firmaAlarmas = '';
  function pintar(e) {
    if (!e) return;
    const vigente = e.datosVigentes !== false;
    enc.actualizar(e);
    const prog = sim.programa(e.programaId);
    const listo = e.maquina === 'PREPARADO' && !!e.listo;
    const clave = e.maquina === 'FALLA' ? 'fallo' : listo ? 'listo' : 'no_preparado';
    tCiclo.fijar({ numero: numeroSiguiente(e), programa: prog?.nombre ?? '', ayuda: motivoNoTocable(e) === '',
      estado: { tipo: listo ? 'listo' : 'no_listo', texto: t(`estados.${clave}`) }, vigente });
    tParam.fijar(prog, e.sensores, vigente);

    seguridad.actualizar(e);
    seguridad.el.style.paddingBottom = seguridad.conteo() > 0 ? '12px' : '0';
    const alarmas = e.alarmas || [];
    const firma = alarmas.map((a) => `${a.id}|${a.nivel}|${a.titulo}`).join(';');
    if (firma !== firmaAlarmas) {
      firmaAlarmas = firma;
      lista.replaceChildren(...alarmas.map((a) => crearFilaAlarma({ nivel: a.nivel, texto: textosAlarma(a).titulo,
        alTocar: () => abrirDetalleAlarma(a, { obtener: (es) => (es?.alarmas || []).find((x) => x.id === a.id) || null }) }).el));
    }
    vacio.classList.toggle('oculto', !(alarmas.length === 0 && seguridad.conteo() === 0 && vigente));

    const st = e.puertas?.[puerta];
    const abierta = st === 'ABIERTA' || st === 'ABRIENDO';
    if (abierta !== puertaAbierta) {
      puertaAbierta = abierta;
      txtPuerta.textContent = abierta ? t('ciclo.cerrar_puerta') : t('ciclo.abrir_puerta');
      circPuerta.replaceChildren(iconoPuerta(puerta, abierta, 42, 'var(--c-abrir-puerta-texto)'));
    }
    bPuerta.disabled = !vigente;
    bPuerta.classList.toggle('inactivo', !vigente);

    const enFalla = e.maquina === 'FALLA';
    const inicioVisible = listo && !e.modoPrueba && vigente;
    desl.el.classList.toggle('oculto', !inicioVisible);
    desl.habilitar(inicioVisible);
    bFalla.classList.toggle('oculto', !(enFalla && vigente));
  }
  pintar(sim.estado);
  quitar.push(on('sim', pintar));

  return {
    el: raiz,
    alMostrar() { pintarCarga(); pintar(sim.estado); },
    destruir() { quitar.forEach((q) => q()); enc.destruir(); desl.destruir(); clearTimeout(tAviso); },
  };
}
