// Sesión y usuarios de DEMOSTRACIÓN. No son cuentas del software real: ni nombres,
// ni contraseñas, ni hashes vienen del repo. PIN de todas las cuentas: 1234 (visible en Login).
// Roles reales del software (auth/roles.py): admin, ingeniero, tecnico.
import { leer, guardar } from './almacen.js';
import { emit } from './eventos.js';

export const PIN_DEMO = '1234';

const USUARIOS_BASE = [
  { usuario: 'admin', nombre: 'Admin demo', rol: 'admin', activo: true, sistema: true },
  { usuario: 'ingeniero', nombre: 'Ingeniero demo', rol: 'ingeniero', activo: true, sistema: true },
  { usuario: 'tecnico', nombre: 'Técnico demo', rol: 'tecnico', activo: true, sistema: false },
];

/** Operadores (Opciones › Usuarios › Operadores; se piden al iniciar un ciclo sin sesión, T30-01). */
const OPERADORES_BASE = [
  { id: 1, nombre: 'Operador demo 1', activo: true },
  { id: 2, nombre: 'Operador demo 2', activo: true },
];

let actual = null;   // {usuario, nombre, rol}

export function usuarios() { return leer('usuarios', USUARIOS_BASE); }
export function guardarUsuarios(lista) { guardar('usuarios', lista); emit('sesion', actual); }
export function operadores() { return leer('operadores', OPERADORES_BASE); }
export function guardarOperadores(lista) { guardar('operadores', lista); }

export function usuarioActual() { return actual; }
export function rol() { return actual?.rol ?? null; }
export function haySesion() { return actual !== null; }

/** Devuelve null si entra, o la clave i18n del error. */
export function iniciarSesion(usuario, clave) {
  const u = usuarios().find((x) => x.usuario.toLowerCase() === String(usuario).trim().toLowerCase() && !x.eliminado);
  if (!u || clave !== PIN_DEMO) return 'sesion.credenciales_invalidas';
  if (!u.activo) return 'sesion.credenciales_invalidas';
  actual = { usuario: u.usuario, nombre: u.nombre, rol: u.rol };
  emit('sesion', actual);
  return null;
}

export function cerrarSesion() {
  if (!actual) return;
  actual = null;
  emit('sesion', null);
}
