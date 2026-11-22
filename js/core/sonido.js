// Sonido: el equipo real usa un zumbador físico (devices/buzer/buzer.py), no archivos de audio.
// La demo lo imita con WebAudio. Solo suena después del primer toque del usuario
// (exigencia de los navegadores móviles y del modo exposición).
let ctx = null;
let habilitado = false;
let repeticion = null;

function desbloquear() {
  if (habilitado) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume?.();
    habilitado = true;
  } catch { habilitado = false; }
}
window.addEventListener('pointerdown', desbloquear, { once: false, passive: true });

function pitido(freq, ms, vol = 0.18) {
  if (!habilitado || !ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.setValueAtTime(0, ctx.currentTime + ms / 1000);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + ms / 1000 + 0.02);
}

/** Patrones aproximados del zumbador: 'alta' (rápido), 'media', 'baja', 'fin' (fin de ciclo), 'tecla'. */
const PATRONES = {
  alta: [[2400, 120], [0, 80], [2400, 120], [0, 80], [2400, 120], [0, 500]],
  media: [[2000, 250], [0, 250], [2000, 250], [0, 1250]],
  baja: [[1600, 200], [0, 2800]],
  fin: [[1800, 300], [0, 150], [2200, 500]],
  tecla: [[2600, 25]],
};

export function tocar(patron) {
  const pasos = PATRONES[patron];
  if (!pasos) return;
  let t = 0;
  for (const [f, ms] of pasos) {
    if (f > 0) setTimeout(() => pitido(f, ms), t);
    t += ms;
  }
  return t;
}

/** Repite un patrón de alarma hasta detener(). */
export function repetir(patron) {
  detener();
  const ciclo = () => { const dur = tocar(patron) || 1000; repeticion = setTimeout(ciclo, dur); };
  ciclo();
}

export function detener() { clearTimeout(repeticion); repeticion = null; }
