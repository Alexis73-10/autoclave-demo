// Compatibilidad con WebKit antiguo (iOS < 15.4), A2: sin estos dos, el router
// (`pila.at(-1)`) y el almacén y los programas (`structuredClone`) lanzaban una
// excepción en el arranque y la app se quedaba en el splash. Se importa primero en
// app.js. Solo rellena lo que falta; en navegadores actuales no hace nada.
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, 'at', {
    configurable: true, writable: true,
    value(i) { const n = Math.trunc(i) || 0; const k = n < 0 ? this.length + n : n; return k < 0 || k >= this.length ? undefined : this[k]; },
  });
}
if (!String.prototype.at) {
  Object.defineProperty(String.prototype, 'at', {
    configurable: true, writable: true,
    value(i) { const n = Math.trunc(i) || 0; const k = n < 0 ? this.length + n : n; return k < 0 || k >= this.length ? undefined : this[k]; },
  });
}
if (typeof globalThis.structuredClone !== 'function') {
  // Los datos de la demo son JSON puros (sin Date, Map ni ciclos).
  globalThis.structuredClone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
}
