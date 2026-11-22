// Screen Wake Lock mientras corre un ciclo, donde el navegador lo soporte.
let candado = null;
let querido = false;

async function pedirAhora() {
  if (!('wakeLock' in navigator) || candado) return;
  try {
    candado = await navigator.wakeLock.request('screen');
    candado.addEventListener('release', () => { candado = null; });
  } catch { candado = null; }
}

export function mantenerPantalla(activo) {
  querido = activo;
  if (activo) pedirAhora();
  else if (candado) { candado.release().catch(() => {}); candado = null; }
}

// El navegador suelta el candado al ocultar la pestaña: se vuelve a pedir al volver.
document.addEventListener('visibilitychange', () => {
  if (querido && document.visibilityState === 'visible') pedirAhora();
});
