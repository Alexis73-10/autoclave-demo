// Bitácora de la demo: eventos simulados (sembrados a partir de la fecha actual) más las acciones
// que se hacen en la sesión de demostración. Solo se guarda en el navegador (almacen.js).
import { leer, guardar } from '../../../core/almacen.js';
import { t, existe } from '../../../core/i18n.js';

const CLAVE = 'op_bitacora';
const MAX = 300;

/** Categoría (bitacora.CATEGORIAS) de cada evento. */
const CATEGORIA = {
  login_ok: 'usuarios_sesion', logout: 'usuarios_sesion', cambio_clave: 'usuarios_sesion', login_bloqueado: 'usuarios_sesion',
  usuario_creado: 'usuarios_sesion', usuario_desactivado: 'usuarios_sesion', usuario_reactivado: 'usuarios_sesion',
  usuario_eliminado: 'usuarios_sesion', usuario_rol_cambiado: 'usuarios_sesion', clave_restablecida: 'usuarios_sesion',
  operador_creado: 'usuarios_sesion', operador_desactivado: 'usuarios_sesion', operador_reactivado: 'usuarios_sesion',
  param_ciclo_cambio: 'configuracion', param_sistema_cambio: 'configuracion', idioma_configurado: 'configuracion',
  unidades_configuradas: 'configuracion', programa_creado: 'configuracion', programa_duplicado: 'configuracion',
  programa_habilitado: 'configuracion', programa_borrado: 'configuracion', reasignacion_io: 'configuracion',
  catalogo_carga: 'configuracion', correo_configurado: 'configuracion',
  mantenimiento_registrado: 'mantenimiento_calibracion', mantenimiento_configurado: 'mantenimiento_calibracion',
  calibracion_atm_ok: 'mantenimiento_calibracion',
  falla_reconocida: 'seguridad', modo_prueba_entra: 'seguridad', ciclo_confirmado_sin_entrega: 'seguridad',
  ciclo_iniciado: 'sistema', ciclo_cancelado: 'sistema', respaldo_exportado: 'sistema', respaldo_restaurado: 'sistema',
  equipo_instalado: 'sistema', apagar_equipo: 'sistema',
};

export const CATEGORIAS = ['seguridad', 'configuracion', 'usuarios_sesion', 'mantenimiento_calibracion', 'sistema'];

function sembrar() {
  const base = []; const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dia = 86400000;
  const ev = (d, h, m, usuario, evento, extra = {}) => base.push({ ms: hoy.getTime() - d * dia + (h * 60 + m) * 60000, usuario, evento, ...extra });
  ev(9, 8, 2, 'ingeniero', 'login_ok');
  ev(9, 8, 5, 'ingeniero', 'param_sistema_cambio', { entidad: 'tiempo_standby', anterior: '10', nuevo: '10' });
  ev(8, 9, 40, 'admin', 'login_ok');
  ev(8, 9, 44, 'admin', 'usuario_creado', { entidad: 'tecnico', nuevo: 'tecnico' });
  ev(7, 14, 10, 'tecnico', 'login_ok');
  ev(7, 14, 21, 'tecnico', 'mantenimiento_registrado', { nuevo: t('opciones.mant_tipo_preventivo') });
  ev(6, 8, 15, 'ingeniero', 'login_ok');
  ev(6, 8, 30, 'ingeniero', 'calibracion_atm_ok');
  ev(5, 10, 1, 'tecnico', 'login_ok');
  ev(5, 10, 12, 'tecnico', 'param_ciclo_cambio', { entidad: 'Esterilización · Tiempo de esterilización', anterior: '3,0', nuevo: '3,5' });
  ev(4, 7, 55, 'ingeniero', 'login_ok');
  ev(3, 11, 20, 'admin', 'login_ok');
  ev(3, 11, 26, 'admin', 'operador_creado', { entidad: 'Operador demo 2' });
  ev(2, 8, 5, 'tecnico', 'login_ok');
  ev(2, 8, 18, 'tecnico', 'falla_reconocida', { entidad: 'CIC-04' });
  ev(1, 15, 30, 'ingeniero', 'login_ok');
  ev(1, 15, 42, 'ingeniero', 'respaldo_exportado');
  return base;
}

export function registrar(evento, { usuario = '', entidad = '', anterior = '', nuevo = '' } = {}) {
  const lista = leer(CLAVE, null) ?? [];
  lista.push({ ms: Date.now(), usuario, evento, entidad, anterior, nuevo });
  guardar(CLAVE, lista.slice(-MAX));
}

/** Entradas (más reciente primero): semilla + sesión + ciclos del historial si existe. */
export async function listar() {
  let ciclos = [];
  try {
    const m = await import('../../../sim/historial.js');
    ciclos = (m.listar?.() ?? []).flatMap((c) => [
      { ms: c.inicio, usuario: c.operador || 'Operador demo 1', evento: 'ciclo_iniciado', nuevo: c.operador || 'Operador demo 1' },
      ...(c.resultado === 'cancelado' ? [{ ms: c.fin ?? c.inicio, usuario: c.operador || 'Operador demo 1', evento: 'ciclo_cancelado', nuevo: String(c.numero ?? '') }] : []),
    ]);
  } catch { /* sin historial todavía */ }
  const todas = [...sembrar(), ...(leer(CLAVE, null) ?? []), ...ciclos].filter((e) => e.ms);
  return todas.sort((a, b) => b.ms - a.ms);
}

export function categoriaDe(evento) { return CATEGORIA[evento] ?? 'sistema'; }

export function frase(e) {
  const clave = `bitacora.ev.${e.evento}`;
  if (existe(clave)) return t(clave, { entidad: e.entidad ?? '', anterior: e.anterior ?? '', nuevo: e.nuevo ?? '' });
  return t('bitacora.ev_generico', { evento: e.evento, entidad: e.entidad ?? '' });
}
