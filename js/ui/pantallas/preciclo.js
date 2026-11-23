// Preciclo (Pantallas/PantallaPreciclo.qml): encabezado, tarjeta de ciclo (número,
// programa con selector, estado Listo / No preparado), tarjeta de parámetros, tarjeta
// «ALARMAS Y AVISOS» (filas de seguridad + alarmas activas), ABRIR/CERRAR PUERTA, Carga,
// deslizador INICIAR (o RECONOCER FALLA en FALLA) y barra inferior (equipo, avatar).
// Composición adaptable (v1.1): grid fluido. Vertical = orden del QML. Horizontal =
// tarjeta y parámetros a la izquierda (desplazables si no caben), acciones siempre
// visibles abajo a la izquierda y ALARMAS Y AVISOS a la derecha. La rotación solo cambia
// el CSS (mismos nodos, sin recrear).
import { h, observarTamano } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { on } from '../../core/eventos.js';
import * as router from '../../core/router.js';
import { haySesion, usuarioActual, operadores } from '../../core/sesion.js';
import { sim } from '../../sim/motor.js';
import { abrirConfiguracion } from '../../app.js';
import { iconoPuerta, textosAlarma, encajarTodo, fijarTexto } from '../componentes/_ciclo_util.js';
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

  const enc = crearEncabezado({ alCampana: () => abrirPanelNotificaciones(), alEngranaje: () => router.push('menu') });
  const tCiclo = crearTarjetaCiclo({ alTocarPrograma: () => abrirSelectorPrograma() });
  const tParam = crearTarjetaParametros();
  const sup = h('div', { class: 'fc-pre-sup desplazable' }, tCiclo.el, tParam.el);

  // ---- tarjeta de alarmas y avisos ----
  const avisoTexto = h('div', { class: 'fc-aviso-alarmas oculto' });
  const seguridad = crearSeccionEstadoSeguro({ grupo: '' });
  const lista = h('div', { class: 'fc-lista-alarmas desplazable' });
  const vacio = h('div', { class: 'fc-vacio-alarmas', text: t('ciclo.sin_alarmas') });
  const zona = h('div', { class: 'fc-zona-alarmas' }, avisoTexto, seguridad.el, lista, vacio);
  const tAlarmas = h('section', { class: 'fc-tarjeta-alarmas' },
    h('div', { class: 'fc-ta-titulo', text: t('ciclo.alarmas_titulo') }), zona);
  let tAviso = 0;
  const mostrarAviso = (texto) => {
    avisoTexto.textContent = sim.ultimoRechazo?.texto || texto; avisoTexto.classList.remove('oculto');
    clearTimeout(tAviso); tAviso = setTimeout(() => avisoTexto.classList.add('oculto'), 5000);
  };

  // ---- botón ABRIR / CERRAR PUERTA ----
  const puerta = 1;
  const circPuerta = h('span', { class: 'fc-ba-circulo' });
  const txtPuerta = h('span', { class: 'fc-ba-texto' });
  const bPuerta = h('button', { class: 'fc-boton-accion puerta' }, circPuerta, txtPuerta);
  let puertaAbierta = null;
  bPuerta.addEventListener('click', () => {
    const st = sim.estado.puertas?.[puerta];
    const abierta = st === 'ABIERTA' || st === 'ABRIENDO';
    const r = abierta ? sim.cerrarPuerta(puerta) : sim.abrirPuerta(puerta);
    if (typeof r === 'string' && r) mostrarAviso(t(r));
  });

  // ---- botón Carga ----
  const barras = h('span', { class: 'fc-carga-barras' }, [4, 2, 6, 2, 3, 6, 2, 4, 2, 5].map((w) => h('i', { style: { width: `${w}px` } })));
  const resumen = h('span', { class: 'fc-carga-resumen fc-encaja' });
  const bCarga = h('button', { class: 'fc-boton-carga' }, barras, h('span', { class: 'fc-carga-col' },
    h('span', { class: 'fc-carga-titulo', text: t('registro_carga.boton').toUpperCase() }), resumen));
  const pintarCarga = () => { fijarTexto(resumen, resumenCarga()); };
  bCarga.addEventListener('click', () => abrirVentanaCarga({ alCerrar: pintarCarga }));
  pintarCarga();

  // ---- deslizador INICIAR / RECONOCER FALLA (misma ranura) ----
  const desl = crearDeslizador({ variante: 'inicio', texto: t('modulos.iniciar_deslizar'),
    textoCompletado: t('modulos.iniciando_deslizar'), manija: h('span', { class: 'fc-play' }), alCompletar: iniciar });
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
  const bFalla = h('button', { class: 'fc-boton-accion falla oculto' },
    h('span', { class: 'fc-ba-circulo' }, h('span', { class: 'fc-ba-excl', text: '!' })),
    h('span', { class: 'fc-ba-texto', text: t('modulos.reconocer_falla') }));
  bFalla.addEventListener('click', () => { const r = sim.resetFalla(); if (typeof r === 'string' && r) mostrarAviso(t(r)); });
  const acciones = h('div', { class: 'fc-pre-acciones' }, bPuerta, bCarga, h('div', { class: 'fc-ranura-desl' }, desl.el, bFalla));

  // ---- barra inferior ----
  const barra = crearBarraInferior({ avatarEn: 'derecha', alEquipo: () => abrirPanelEquipo({ permiteApagar: true }),
    alAvatar: () => abrirConfiguracion() });

  const principal = h('div', { class: 'fc-tarjeta-principal' }, sup, tAlarmas, acciones);
  const raiz = h('div', { class: 'pantalla fc-pantalla fc-preciclo' },
    crearFondo(), enc.el, h('main', { class: 'fc-cuerpo' }, principal), barra.el);

  // Reencaje de textos al cambiar de tamaño (giro incluido): mismos nodos.
  const equipo = barra.el.querySelector('.fc-celda-equipo');
  const ajustar = () => {
    tParam.ajustar();
    encajarTodo(raiz);
    tCiclo.ajustar();
    equipo.classList.remove('compacta');
    const tx = equipo.querySelector('.fc-bi-textos');
    if (tx.scrollWidth > tx.clientWidth + 1) equipo.classList.add('compacta');
  };
  quitar.push(observarTamano(raiz, ajustar));
  // las medidas de texto cambian cuando termina de cargar Montserrat
  const alCargarFuente = () => requestAnimationFrame(ajustar);
  document.fonts?.load?.('600 12px Montserrat').then(alCargarFuente, () => {});
  document.fonts?.addEventListener?.('loadingdone', alCargarFuente);
  quitar.push(() => document.fonts?.removeEventListener?.('loadingdone', alCargarFuente));

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
    seguridad.el.style.paddingBottom = seguridad.conteo() > 0 ? '0.75rem' : '0';
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
      circPuerta.replaceChildren(iconoPuerta(puerta, abierta, '1em', 'var(--c-abrir-puerta-texto)'));
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
    alMostrar() { pintarCarga(); pintar(sim.estado); requestAnimationFrame(ajustar); },
    destruir() { quitar.forEach((q) => q()); enc.destruir(); desl.destruir(); clearTimeout(tAviso); },
  };
}
