// Opciones › Parámetros del ciclo (OpcionesParametrosCiclo.qml): programa → fases → parámetros reales del
// simulador (sim.programas()/sim.programa(id)), con rótulo, unidad y rango; edición con el teclado numérico
// y guardado con sim.guardarParametro. También sensores de temperatura y entradas mostradas.
import { h } from '../../../core/dom.js';
import { t } from '../../../core/i18n.js';
import { leer, guardar } from '../../../core/almacen.js';
import { existe } from '../../../core/i18n.js';
import { sim } from '../../../sim/motor.js';
import { PROGRAMAS_FABRICA } from '../../../sim/programas_fabrica.js';
import { crearDesplegable } from '../../componentes/desplegable.js';
import { crearSelectorSegmentos } from '../../componentes/selector_segmentos.js';
import { crearBotonFormulario } from '../../componentes/boton_formulario.js';
import { crearFilaInterruptor } from '../../componentes/fila_interruptor.js';
import { abrirAjuste, textoValor } from './_ajuste.js';
import { cabeceraSub, filaNav, nota, pad2, fechaHoraIso, L } from './_comun.js';

const ORDEN = ['globals', 'precalentamiento', 'prevacio', 'calentamiento', 'esterilizacion', 'descompresion', 'secado', 'finalizacion'];
const SENSORES = ['temp_camara', 'temp_2_camara', 'temp_ref'];
const ROLES_SENSOR = ['principal', 'referencia', 'no_en_uso'];
const ENTRADAS = ['temp_camara', 'temp_2_camara', 'temp_referencia', 'temp_drenaje', 'pres_camara', 'pres_chaqueta'];

/** Opciones de un parámetro enumerado (o null si es numérico/booleano). */
function opcionesDe(seccion, nombre, def, tipoCarga) {
  if (seccion === 'descompresion' && nombre === 'modo') {
    const permitidos = tipoCarga === 'liquido' ? [0, 4, 5] : [0, 1, 2, 3];
    return permitidos.map((n) => ({ valor: n, texto: `${n} · ${t(`modos_programa.descompresion_${n}_nombre`)}` }));
  }
  if (seccion === 'secado' && nombre === 'modo') return [1, 2, 3].map((n) => ({ valor: n, texto: `${n} · ${t(`modos_programa.secado_${n}_nombre`)}` }));
  const lista = def?.options ?? def?.opciones;
  if (Array.isArray(lista) && lista.length) {
    return lista.map((o) => ({ valor: o, texto: existe(`opciones.valor_${o}`) ? t(`opciones.valor_${o}`) : String(o) }));
  }
  return null;
}

const UNIDAD = { sec: 's', seg: 's', min: 'min' };

/** Valor de fábrica de un parámetro (ruta 'seccion.nombre' o 'seccion.modo_N.nombre'). */
function defectoFabrica(progId, seccion, nombre) {
  let nodo = PROGRAMAS_FABRICA.find((x) => x.id === progId)?.parametros;
  for (const k of [...seccion.split('.'), nombre]) nodo = nodo?.[k];
  return nodo && typeof nodo === 'object' && 'value' in nodo ? nodo.value : undefined;
}

function infoParametro(progId, seccion, nombre, def, tipoCarga) {
  const valor = def?.value ?? def?.valor;
  const defecto = defectoFabrica(progId, seccion, nombre) ?? def?.default ?? valor;
  const opciones = opcionesDe(seccion, nombre, def, tipoCarga);
  const tipo = typeof valor === 'boolean' ? 'bool' : (opciones ? 'enum' : 'numero');
  const decimales = def?.type === 'int' ? 0 : 1;
  return { valor, defecto, opciones, tipo, decimales, unidad: UNIDAD[def?.unit] ?? def?.unit ?? '', min: def?.min, max: def?.max };
}

/** Hojas de una sección: [{ruta, nombre, def}]; los grupos modo_N solo si N es el modo vigente. */
function hojasSeccion(x, s) {
  const params = x?.parametros?.[s] ?? {};
  const modo = params.modo?.value;
  const salida = [];
  for (const [nombre, def] of Object.entries(params)) {
    if (def && typeof def === 'object' && 'value' in def) salida.push({ ruta: s, nombre, def });
    else if (def && typeof def === 'object' && nombre === `modo_${modo}`) {
      for (const [n2, d2] of Object.entries(def)) if (d2 && 'value' in d2) salida.push({ ruta: `${s}.${nombre}`, nombre: n2, def: d2 });
    }
  }
  return salida;
}

export function crear(ctx) {
  const p = ctx.permiso();
  const lista = () => sim.programas() ?? [];
  let progId = lista().some((x) => x.id === sim.estado.programaId) ? sim.estado.programaId : lista()[0]?.id;
  let vista = ctx.params?.vistaCiclo ?? 'programa';   // 'programa' | 'sec:<clave>' | 'sensores' | 'entradas'
  const cuerpo = h('div', { class: 'op-pc' });
  const set = (v) => { vista = v; if (ctx.params) ctx.params.vistaCiclo = v; pintar(); };
  const prog = () => sim.programa(progId) ?? lista().find((x) => x.id === progId);
  const etiquetaProg = (x) => `${pad2(x.numero ?? 0)} ${x.nombre}`;
  const habilitado = (x) => (typeof sim.habilitarPrograma === 'function' ? x.habilitado : (leer('op_prog_habilitado', {})[x.id] ?? x.habilitado)) !== false;
  const modificaciones = () => leer('op_ultima_mod', {});

  function selector() {
    const dd = crearDesplegable({ rotulo: t('selector_programa.titulo'), valor: progId, tituloLista: t('selector_programa.elegir'), textoSinValor: t('selector_programa.ninguno'),
      opciones: lista().map((x) => ({ valor: x.id, texto: etiquetaProg(x), aviso: habilitado(x) ? '' : `(${t('manejo_ciclos.deshabilitado').split(':')[0].toLowerCase()})` })),
      alElegir: (v) => { progId = v; pintar(); } });
    return dd.el;
  }

  // ---------------- Vista programa ----------------
  function pintarPrograma() {
    const x = prog();
    const filas = [];
    if (x) {
      const params = x.parametros ?? {};
      const secciones = ORDEN.filter((s) => params[s] && Object.keys(params[s]).length);
      for (const s of (secciones.length ? secciones : ORDEN)) {
        const dif = hojasSeccion(x, s).some(({ ruta, nombre, def }) => { const i = infoParametro(x.id, ruta, nombre, def, x.tipoCarga); return i.valor !== i.defecto; });
        filas.push(filaNav({ titulo: `${t(`opciones.secciones_programa.${s}`)}${dif ? ' *' : ''}`, alto: '', alToque: () => set(`sec:${s}`) }));
      }
      filas.push(h('div', { class: 'op-linea' }));
      filas.push(filaNav({ titulo: t('opciones.sensores_titulo'), alToque: () => set('sensores') }));
      filas.push(filaNav({ titulo: t('opciones.entradas_titulo'), alToque: () => set('entradas') }));
    }
    const habil = x ? crearFilaInterruptor({ etiqueta: L({ es: 'Programa habilitado', en: 'Program enabled' }), detalle: habilitado(x) ? '' : t('opciones.programa_deshabilitado'),
      marcado: habilitado(x), bloqueado: !p.editar, ultima: true,
      alAlternar: (v) => { const m = leer('op_prog_habilitado', {}); m[x.id] = v; guardar('op_prog_habilitado', m); sim.habilitarPrograma?.(x.id, v);
        ctx.bitacora('programa_habilitado', { entidad: x.nombre, nuevo: t(v ? 'manejo_ciclos.habilitado' : 'manejo_ciclos.deshabilitado').split(':')[0] }); pintar(); } }) : null;
    cuerpo.replaceChildren(...[selector(),
      x && x.editable === false ? nota(t('opciones.programa_no_editable'), 'aviso') : null,
      x && !habilitado(x) ? nota(t('opciones.programa_deshabilitado'), 'aviso') : null,
      x ? h('div', { class: 'op-lista desplazable' }, filas, habil?.el, nota(t('opciones.gestion_movida'))) : nota(t('selector_programa.vacio'))].filter(Boolean));
  }

  // ---------------- Vista sección ----------------
  function pintarSeccion(s) {
    const x = prog();
    const mods = modificaciones();
    const filas = hojasSeccion(x, s).map(({ ruta, nombre, def }) => {
      const i = infoParametro(x.id, ruta, nombre, def, x.tipoCarga);
      const clave = `parametros.${ruta}.${nombre}`;
      const titulo = existe(clave) ? t(clave) : nombre;
      const dif = i.valor !== i.defecto;
      return filaNav({ titulo: `${titulo}${dif ? ' *' : ''}`, valor: textoValor(i.valor, i), unidad: i.tipo === 'numero' ? i.unidad : '', alToque: () => editar(x, ruta, nombre, titulo, i, mods[`${x.id}.${ruta}.${nombre}`]) });
    });
    cuerpo.replaceChildren(cabeceraSub({ titulo: t(`opciones.secciones_programa.${s}`), sub: `${t('opciones.secciones.parametros_ciclo')} · ${etiquetaProg(x)}`, alVolver: () => set('programa') }),
      h('div', { class: 'op-lista desplazable' }, filas.length ? filas : nota(t('opciones.no_se_ejecuta')), nota(t('opciones.leyenda_defecto'))));
  }

  function editar(x, s, nombre, titulo, i, mod) {
    const editable = p.editar && x.editable !== false;
    const dk = `parametros_desc.${s}.${nombre}`;
    const desc = existe(dk) ? t(dk) : '';
    abrirAjuste({ titulo, descripcion: desc, unidad: i.unidad, actual: i.valor, defecto: i.defecto, min: i.min ?? 0, max: i.max ?? 9999, decimales: i.decimales, tipo: i.tipo, opciones: i.opciones ?? [],
      editable, motivo: editable ? '' : t(p.motivo || 'opciones.programa_no_editable'),
      ultima: mod ? t('opciones.ultima_modificacion', { usuario: mod.usuario, fecha: fechaHoraIso(mod.ms) }) : t('opciones.sin_cambios'),
      alGuardar: (v) => {
        const r = sim.guardarParametro(x.id, s, nombre, v);
        if (typeof r === 'string') return r;
        const m = modificaciones(); m[`${x.id}.${s}.${nombre}`] = { usuario: ctx.usuario, ms: Date.now() }; guardar('op_ultima_mod', m);
        ctx.bitacora('param_ciclo_cambio', { entidad: `${titulo}`, anterior: textoValor(i.valor, i), nuevo: textoValor(v, i) });
        pintar();
        return null;
      } });
  }

  // ---------------- Vista sensores ----------------
  function pintarSensores() {
    const clave = `op_sensores_${progId}`;
    let roles = leer(clave, null) ?? { temp_camara: 'principal', temp_2_camara: 'no_en_uso', temp_ref: 'referencia' };
    const aviso = h('div', { class: 'op-nota error' });
    const conteo = h('div', { class: 'op-nota' });
    const tarjetas = h('div', { class: 'op-sens-tarjetas' });
    const cuenta = () => ({ principal: SENSORES.filter((k) => roles[k] === 'principal').length, referencia: SENSORES.filter((k) => roles[k] === 'referencia').length });
    function pintarT() {
      const c = cuenta();
      conteo.textContent = t('opciones.sensores_conteo', { principal: c.principal, referencia: c.referencia });
      const valido = c.principal === 1 && c.referencia <= 2;
      aviso.textContent = valido ? '' : t('opciones.err_asignacion');
      guardarBtn.actualizar({ habilitado: p.editar && valido });
      tarjetas.replaceChildren(...SENSORES.map((k) => h('div', { class: 'op-sens-tarjeta' }, h('div', { class: 'op-sens-nombre', text: t(`sensores_ciclo.${k}`) }),
        crearSelectorSegmentos({ valor: roles[k], habilitado: p.editar, opciones: ROLES_SENSOR.map((r) => ({ valor: r, etiqueta: t(`sensores_ciclo.rol_${r}`) })),
          alElegir: (v) => {
            if (v === 'principal') for (const o of SENSORES) if (o !== k && roles[o] === 'principal') roles[o] = 'no_en_uso';
            roles[k] = v; ctx.pendiente(true); pintarT();
          } }).el)));
    }
    const guardarBtn = crearBotonFormulario({ texto: t('acciones.guardar'), primario: true, ancho: 320, alPulsar: () => {
      guardar(clave, roles); ctx.pendiente(false); ctx.bitacora('ROLES_SENSOR', { entidad: etiquetaProg(prog()) }); ctx.avisar(t('opciones.guardando').replace('…', ' ✓')); set('programa');
    } });
    cuerpo.replaceChildren(cabeceraSub({ titulo: t('opciones.sensores_titulo'), sub: etiquetaProg(prog()), alVolver: () => { ctx.pendiente(false); set('programa'); } }),
      h('div', { class: 'op-lista desplazable' }, nota(t('opciones.sensores_instruccion')), conteo, tarjetas, nota(t('opciones.sensores_nota')), aviso, h('div', { class: 'op-bloque-btn' }, guardarBtn.el)));
    pintarT();
  }

  // ---------------- Vista entradas mostradas ----------------
  function pintarEntradas() {
    const clave = 'op_entradas_mostradas';
    const actual = leer(clave, null) ?? ['temp_camara', 'temp_referencia', 'pres_camara'];
    const sel = [actual[0], actual[1] ?? '', actual[2] ?? ''];
    const aviso = h('div', { class: 'op-nota error' });
    const opciones = (n) => [...(n === 0 ? [] : [{ valor: '', texto: t('opciones.entrada_ninguna') }]), ...ENTRADAS.map((k) => ({ valor: k, texto: t(`io.ai.${k}`) }))];
    const dds = [0, 1, 2].map((n) => crearDesplegable({ rotulo: t('opciones.entrada_fila', { n: n + 1 }), valor: sel[n], opciones: opciones(n), tituloLista: t('opciones.entrada_fila', { n: n + 1 }), habilitado: p.editar,
      alElegir: (v) => { sel[n] = v; dds[n].actualizar({ valor: v }); ctx.pendiente(true); validar(); } }));
    function validar() {
      const usadas = sel.filter(Boolean);
      const rep = new Set(usadas).size !== usadas.length;
      aviso.textContent = !sel[0] ? t('opciones.err_entrada_1_obligatoria') : rep ? t('opciones.err_entradas_repetidas') : '';
      guardarBtn.actualizar({ habilitado: p.editar && !aviso.textContent });
    }
    const guardarBtn = crearBotonFormulario({ texto: t('acciones.guardar'), primario: true, ancho: 320, alPulsar: () => { guardar(clave, sel.filter(Boolean)); ctx.pendiente(false); set('programa'); } });
    cuerpo.replaceChildren(cabeceraSub({ titulo: t('opciones.entradas_titulo'), sub: etiquetaProg(prog()), alVolver: () => { ctx.pendiente(false); set('programa'); } }),
      h('div', { class: 'op-lista desplazable' }, nota(t('opciones.entradas_nota')), h('div', { class: 'op-pc-entradas' }, dds.map((d) => d.el)), aviso, h('div', { class: 'op-bloque-btn' }, guardarBtn.el)));
    validar();
  }

  function pintar() {
    if (vista === 'sensores') pintarSensores();
    else if (vista === 'entradas') pintarEntradas();
    else if (vista.startsWith('sec:')) pintarSeccion(vista.slice(4));
    else pintarPrograma();
  }
  pintar();
  return { el: cuerpo, atras() { if (vista !== 'programa') { ctx.pendiente(false); set('programa'); return true; } return false; } };
}
