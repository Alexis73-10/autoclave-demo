// Opciones › Opciones avanzadas (OpcionesAvanzadas.qml): Manejo de ciclos (técnico e ingeniero) y Reasignación
// de entradas y salidas (solo ingeniero). Ambas SIMULADAS y navegables: los programas personalizados y los
// cambios de puertos solo existen en esta pantalla; nada peligroso se guarda.
import { h } from '../../../core/dom.js';
import { t } from '../../../core/i18n.js';
import { leer, guardar } from '../../../core/almacen.js';
import { abrirModal } from '../../../core/capas.js';
import { abrirAlfanumerico, abrirAlfanumericoAccion } from '../../../core/teclado.js';
import { sim } from '../../../sim/motor.js';
import { crearSelectorSegmentos } from '../../componentes/selector_segmentos.js';
import { crearBotonFormulario } from '../../componentes/boton_formulario.js';
import { crearDesplegable } from '../../componentes/desplegable.js';
import { crearCampoFormulario } from '../../componentes/campo_formulario.js';
import { abrirDialogoConfirmacion } from '../../componentes/dialogo_confirmacion.js';
import { chip, pad2, L } from './_comun.js';

// ---------------- Manejo de ciclos ----------------
function manejo(ctx) {
  const p = ctx.permiso();
  let sel = null;
  const msg = h('div', { class: 'op-nota' });
  const lista = h('div', { class: 'op-us-lista desplazable' });
  const acciones = h('div', { class: 'op-us-acciones' });
  const el = h('div', { class: 'op-mc' }, h('div', { class: 'op-nota', text: t('manejo_ciclos.explicacion') }), lista, msg, acciones);

  const extras = () => leer('op_programas_extra', []);
  const guardarExtras = (l) => guardar('op_programas_extra', l);
  const habil = () => leer('op_prog_habilitado', {});
  const todos = () => [
    ...(sim.programas() ?? []).map((x) => ({ id: x.id, numero: x.numero, nombre: x.nombre, fabrica: true, habilitado: (habil()[x.id] ?? x.habilitado) !== false })),
    ...extras().map((x) => ({ ...x, fabrica: false, habilitado: (habil()[x.id] ?? x.habilitado) !== false })),
  ];
  const actual = () => todos().find((x) => x.id === sel);
  const siguienteNumero = () => Math.max(10, ...todos().map((x) => x.numero)) + 1;
  const bloqueado = () => !p.editar;

  function pintar() {
    const a = actual();
    lista.replaceChildren(...todos().map((x) => h('button', { class: `op-us-fila${x.id === sel ? ' sel' : ''}`, type: 'button', onclick: () => { sel = x.id; msg.textContent = ''; pintar(); } },
      h('span', { class: 'op-fila-textos' }, h('span', { class: 'op-us-nombre' }, h('b', { text: `${pad2(x.numero)} · ${x.nombre}` })),
        h('span', { class: 'op-fila-sub', text: `${t(x.fabrica ? 'manejo_ciclos.de_fabrica' : 'manejo_ciclos.personalizado')} · ${t(x.habilitado ? 'manejo_ciclos.habilitado' : 'manejo_ciclos.deshabilitado')}` })),
      chip(t(x.habilitado ? 'manejo_ciclos.habilitado' : 'manejo_ciclos.deshabilitado').split(':')[0], x.habilitado ? 'ok' : 'aviso'))));
    const btn = (texto, ok, fn, primario) => crearBotonFormulario({ texto, primario, habilitado: !bloqueado() && ok, alPulsar: fn }).el;
    acciones.replaceChildren(
      btn(t('manejo_ciclos.crear'), true, crear, true),
      btn(t('manejo_ciclos.duplicar'), !!a, () => nombrar(a, `${a.nombre} (2)`)),
      btn(a && !a.habilitado ? t('manejo_ciclos.habilitar') : t('manejo_ciclos.deshabilitar'), !!a, () => alternar(a)),
      btn(t('manejo_ciclos.borrar'), !!a && !a.fabrica, () => borrar(a)));
    if (bloqueado()) msg.textContent = t(ctx.maquina() === 'CICLO' ? 'manejo_ciclos.en_ciclo' : 'manejo_ciclos.err_rol');
  }

  function alternar(a) {
    if (!a) return;
    if (a.id === sim.estado.programaId && a.habilitado) { msg.textContent = t('manejo_ciclos.err_programa_activo'); return; }
    const m = habil(); m[a.id] = !a.habilitado; guardar('op_prog_habilitado', m); sim.habilitarPrograma?.(a.id, !a.habilitado);
    ctx.bitacora('programa_habilitado', { entidad: a.nombre }); msg.textContent = t(a.habilitado ? 'manejo_ciclos.ok_deshabilitado' : 'manejo_ciclos.ok_habilitado', { nombre: a.nombre }); pintar();
  }
  function borrar(a) {
    if (!a || a.fabrica) { msg.textContent = t('manejo_ciclos.err_de_fabrica'); return; }
    abrirDialogoConfirmacion({ mensaje: t('manejo_ciclos.borrar_pregunta', { nombre: a.nombre }), alConfirmar: () => {
      guardarExtras(extras().filter((x) => x.id !== a.id)); sel = null; ctx.bitacora('programa_borrado', { entidad: a.nombre }); msg.textContent = t('manejo_ciclos.ok_borrado', { nombre: a.nombre }); pintar();
    } });
  }
  /** Pide el nombre y crea un programa personalizado (a partir de `base`). */
  function nombrar(base, sugerido = '') {
    abrirAlfanumericoAccion({ titulo: t('manejo_ciclos.nombre_nuevo'), valor: sugerido, maxLargo: 40, alEntregar: (v) => {
      const n = v.trim();
      if (!n || n.length > 40) { msg.textContent = t('manejo_ciclos.err_nombre_invalido'); return; }
      if (todos().some((x) => x.nombre.toLowerCase() === n.toLowerCase())) { msg.textContent = t('manejo_ciclos.err_nombre_repetido'); return; }
      const numero = siguienteNumero();
      guardarExtras([...extras(), { id: `personalizado_${numero}`, numero, nombre: n, habilitado: true }]);
      ctx.bitacora(base ? 'programa_duplicado' : 'programa_creado', { entidad: n }); msg.textContent = t('manejo_ciclos.ok_creado', { nombre: n, numero }); pintar();
    } });
  }
  function crear() {
    let baseId = todos()[0]?.id, cerrar;
    const dd = crearDesplegable({ opciones: todos().map((x) => ({ valor: x.id, texto: `${pad2(x.numero)} ${x.nombre}` })), valor: baseId, tituloLista: t('manejo_ciclos.crear_titulo'), alElegir: (v) => { baseId = v; dd.actualizar({ valor: v }); } });
    const sig = crearBotonFormulario({ texto: t('acciones.confirmar'), primario: true, alPulsar: () => { cerrar(); nombrar(todos().find((x) => x.id === baseId), ''); } });
    const no = crearBotonFormulario({ texto: t('acciones.cancelar'), alPulsar: () => cerrar() });
    cerrar = abrirModal(h('div', { class: 'op-modal ancho' }, h('div', { class: 'op-modal-titulo', text: t('manejo_ciclos.crear_titulo') }), h('div', { class: 'op-modal-texto', text: t('manejo_ciclos.crear_explicacion') }),
      dd.el, h('div', { class: 'op-modal-botones' }, no.el, sig.el)), { cerrarAlTocarVelo: true });
  }
  pintar();
  return { el };
}

// ---------------- Reasignación ----------------
const FUNCIONES = [
  { k: 'vapor_caldera', puerto: 'DO 02', tipo: 'DO', critica: true }, { k: 'descompresion_lenta', puerto: 'DO 06', tipo: 'DO', critica: false },
  { k: 'aire_comprimido_camara', puerto: 'DO 14', tipo: 'DO', critica: false }, { k: 'agua_chaqueta', puerto: 'DO 16', tipo: 'DO', critica: false },
  { k: 'buzer_alarma', puerto: 'DO 25', tipo: 'DO', critica: false }, { k: 'temp_2_camara', puerto: 'RTD 02', tipo: 'RTD', critica: false },
  { k: 'suministro_electrico', puerto: 'DI 14', tipo: 'DI', critica: true },
];
const LIBRES = { DO: ['DO 13', 'DO 24', 'DO 26', 'DO 27', 'DO 28'], RTD: ['RTD 05', 'RTD 06'], DI: ['DI 15', 'DI 16'] };

function reasignacion(ctx) {
  const p = ctx.permiso();
  const estado = FUNCIONES.map((f) => ({ ...f, actual: f.puerto, nuevo: f.puerto }));   // solo en memoria
  const tabla = h('div', { class: 'op-ra-tabla desplazable' });
  const msg = h('div', { class: 'op-nota' });
  const botones = h('div', { class: 'op-aj-botones' });
  const cambios = () => estado.filter((f) => f.nuevo !== f.actual);

  function pintar() {
    const c = cambios();
    ctx.pendiente(c.length > 0);
    tabla.replaceChildren(h('div', { class: 'op-ra-fila cab' }, ['col_funcion', 'col_actual', 'col_nuevo', 'col_tipo', 'col_critica'].map((k) => h('span', { text: t(`reasignacion.${k}`) }))),
      ...estado.map((f) => {
        const dd = crearDesplegable({ valor: f.nuevo, habilitado: p.editar, tituloLista: t('reasignacion.elegir_puerto', { funcion: t(`reasignacion.funcion_${f.k}`) }),
          opciones: [{ valor: f.actual, texto: `${f.actual} · ${t('reasignacion.puerto_es_actual')}` }, ...LIBRES[f.tipo].filter((x) => x !== f.actual).map((x) => ({ valor: x, texto: `${x} · ${t('reasignacion.puerto_libre')}` }))],
          alElegir: (v) => { f.nuevo = v; pintar(); } });
        return h('div', { class: 'op-ra-fila' }, h('span', { class: 'op-ra-fn', text: t(`reasignacion.funcion_${f.k}`) }), h('span', { text: f.actual }), h('span', { class: 'op-ra-nuevo' }, dd.el),
          h('span', { text: f.tipo === 'RTD' ? 'RTD' : f.tipo === 'DI' ? 'DI' : 'DO' }), h('span', { text: t(f.critica ? 'reasignacion.si' : 'reasignacion.no') }));
      }));
    botones.replaceChildren(
      crearBotonFormulario({ texto: t('reasignacion.aplicar'), primario: true, habilitado: p.editar && c.length > 0, alPulsar: () => aplicar(c) }).el,
      crearBotonFormulario({ texto: t('reasignacion.descartar'), habilitado: c.length > 0, alPulsar: () => { estado.forEach((f) => { f.nuevo = f.actual; }); pintar(); } }).el,
      crearBotonFormulario({ texto: t('reasignacion.restaurar_fabrica'), habilitado: p.editar, alPulsar: () => abrirDialogoConfirmacion({ mensaje: t('reasignacion.restaurar_texto'), alConfirmar: () => { estado.forEach((f) => { f.actual = f.nuevo = f.puerto; }); msg.textContent = t('reasignacion.guardado_sin_reinicio'); pintar(); } }) }).el);
  }

  function aplicar(c) {
    const criticas = c.filter((f) => f.critica);
    const paso4 = () => {   // reinicio
      abrirDialogoConfirmacion({ mensaje: `${t('reasignacion.reinicio_titulo')}\n\n${t('reasignacion.reiniciando')}`, textoConfirmar: t('reasignacion.confirmar_reinicio'), alConfirmar: () => {
        c.forEach((f) => { f.actual = f.nuevo; });
        ctx.bitacora('reasignacion_io', { entidad: c.map((f) => t(`reasignacion.funcion_${f.k}`)).join(', ') });
        msg.textContent = `${t('reasignacion.reiniciando')} ${L({ es: '(simulado; al salir de la pantalla se restablece)', en: '(simulated; it resets when you leave the screen)' })}`; pintar();
      } });
    };
    const paso3 = () => {   // contraseña
      const campo = crearCampoFormulario({ etiqueta: t('reasignacion.clave_titulo', { usuario: ctx.nombreUsuario || ctx.usuario }), marcador: '••••', oculto: true, valor: '', alTocar: () => abrirAlfanumerico({ titulo: t('reasignacion.clave_titulo', { usuario: ctx.usuario }), valor: '', oculto: true, alEntregar: (v) => { clave = v; campo.actualizar({ valor: v }); } }) });
      let clave = '', cerrar;
      const ok = crearBotonFormulario({ texto: t('reasignacion.continuar'), primario: true, alPulsar: () => { if (!clave) { campo.actualizar({ error: t('validacion.obligatorio') }); return; } cerrar(); paso4(); } });
      const no = crearBotonFormulario({ texto: t('acciones.cancelar'), alPulsar: () => cerrar() });
      cerrar = abrirModal(h('div', { class: 'op-modal ancho' }, h('div', { class: 'op-modal-titulo', text: t('reasignacion.clave_titulo', { usuario: ctx.nombreUsuario || ctx.usuario }) }), campo.el,
        h('div', { class: 'op-nota', text: L({ es: 'Demostración: escriba cualquier texto.', en: 'Demo: type any text.' }) }), h('div', { class: 'op-modal-botones' }, no.el, ok.el)), { cerrarAlTocarVelo: true });
    };
    const paso2 = () => {   // confirmación reforzada
      if (!criticas.length) { paso3(); return; }
      const f = criticas[0]; const nombre = t(`reasignacion.funcion_${f.k}`);
      let escrito = '', cerrar;
      const campo = crearCampoFormulario({ etiqueta: t('reasignacion.escribir_nombre'), marcador: nombre, valor: '', alTocar: () => abrirAlfanumerico({ titulo: t('reasignacion.escribir_nombre'), valor: '', alEntregar: (v) => { escrito = v.trim(); campo.actualizar({ valor: v, error: '' }); } }) });
      const ok = crearBotonFormulario({ texto: t('reasignacion.continuar'), primario: true, alPulsar: () => { if (escrito.toLowerCase() !== nombre.toLowerCase()) { campo.actualizar({ error: t('reasignacion.escribir_nombre') }); return; } cerrar(); paso3(); } });
      const no = crearBotonFormulario({ texto: t('acciones.cancelar'), alPulsar: () => cerrar() });
      cerrar = abrirModal(h('div', { class: 'op-modal ancho' }, h('div', { class: 'op-modal-titulo', text: t('reasignacion.reforzada_titulo') }), h('div', { class: 'op-modal-texto', text: t('reasignacion.reforzada_texto', { funcion: nombre }) }),
        campo.el, h('div', { class: 'op-modal-botones' }, no.el, ok.el)), { cerrarAlTocarVelo: true });
    };
    abrirDialogoConfirmacion({ mensaje: `${t('reasignacion.alerta_titulo')}\n\n${t('reasignacion.alerta_texto', { n: c.length })}${criticas.length ? `\n${t('reasignacion.alerta_criticas', { lista: criticas.map((f) => t(`reasignacion.funcion_${f.k}`)).join(', ') })}` : ''}`,
      textoConfirmar: t('reasignacion.continuar'), alConfirmar: paso2 });
  }
  pintar();
  return { el: h('div', { class: 'op-ra' }, h('div', { class: 'op-nota aviso', text: t('reasignacion.aviso') }), tabla, msg, botones), destruir() { ctx.pendiente(false); } };
}

export function crear(ctx) {
  const ing = ctx.rol === 'ingeniero';
  let seg = 'manejo';
  let hijo = null;
  const area = h('div', { class: 'op-av-area' });
  const tabs = crearSelectorSegmentos({ valor: 'manejo', habilitado: true, opciones: [{ valor: 'manejo', etiqueta: t('manejo_ciclos.segmento_manejo') },
    { valor: 'reasignacion', etiqueta: t('manejo_ciclos.segmento_reasignacion'), habilitada: ing }], alElegir: (v) => { seg = v; pintar(); } });
  function pintar() {
    hijo?.destruir?.();
    hijo = seg === 'manejo' ? manejo(ctx) : reasignacion(ctx);
    area.replaceChildren(hijo.el);
    tabs.actualizar({ valor: seg });
  }
  pintar();
  return { el: h('div', { class: 'op-av' }, tabs.el, area), destruir() { hijo?.destruir?.(); } };
}
