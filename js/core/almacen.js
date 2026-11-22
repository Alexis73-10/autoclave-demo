// Persistencia en localStorage con try/catch: la demo funciona aunque el almacenamiento
// falle (modo privado, cuota, bloqueado). Sin almacenamiento, se usa memoria.
const PREFIJO = 'acdemo:';
const memoria = new Map();

export function leer(clave, defecto = null) {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    if (crudo !== null) return JSON.parse(crudo);
  } catch { /* sin almacenamiento */ }
  return memoria.has(clave) ? structuredClone(memoria.get(clave)) : defecto;
}

export function guardar(clave, valor) {
  memoria.set(clave, structuredClone(valor));
  try { localStorage.setItem(PREFIJO + clave, JSON.stringify(valor)); return true; }
  catch { return false; }
}

export function borrar(clave) {
  memoria.delete(clave);
  try { localStorage.removeItem(PREFIJO + clave); } catch { /* nada */ }
}

/** Borra todos los datos de la demo (panel oculto › Reiniciar datos). */
export function borrarTodo() {
  memoria.clear();
  try {
    const claves = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIJO)) claves.push(k);
    }
    claves.forEach((k) => localStorage.removeItem(k));
  } catch { /* nada */ }
}
