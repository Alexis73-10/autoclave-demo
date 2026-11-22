// Catálogo de fallos provocables desde el panel oculto de la demo.
// Fuente: src/autoclave/state_machine/alarms/catalogo.py (nivel, bloqueo, despeje; línea
// citada en cada entrada), textos i18n reales `alarmas.<código>.{titulo,plantilla,accion}`
// e inventario A3 (§2 y §5). Prioridad IEC como ui_bridge._PRIORIDAD_POR_NIVEL:
// FALLO_CRITICO -> 'alta', ALARMA -> 'media', AVISO -> 'baja'.
//
// efecto:
//   'fallo'      aborta el ciclo: resultado FALLO, protocolo de fallo hasta cámara segura,
//                alarma bloqueante con despeje manual, carga NO ESTÉRIL.
//   'emergencia' paro de emergencia: resultado EMERGENCIA (cuenta como fallo), carga NO ESTÉRIL.
//   'aviso'      aviso no bloqueante que se despeja solo (despeje AUTO): el ciclo sigue.
//   'aviso_man'  aviso no bloqueante con despeje manual: el ciclo sigue (p. ej. SEN-11).
// `mecanismo` describe cómo lo provoca el simulador (física real o atajo documentado).
// La lógica que aplica cada fallo vive en ciclo.js (Corrida.inyectar).

const CAT = 'src/autoclave/state_machine/alarms/catalogo.py';

/** Fases backend en que aplica; 'ESPERA' = tras el resultado, antes de la entrega de la cámara. */
export const FALLOS = [
  { codigo: 'SIS-01', nivel: 'alta', efecto: 'emergencia', despeje: 'AUTO', origen: `${CAT}:196`,
    fases: ['PRECALENTAMIENTO', 'PRE_VACIO', 'CALENTAMIENTO', 'ESTERILIZACION', 'DESCOMPRESION', 'SECADO'],
    mecanismo: { es: 'Se pulsa el paro: todas las salidas se apagan; se libera solo a los ~8 s reales y la confirmación no espera la entrega.',
      en: 'The emergency stop is pressed: all outputs go off; it releases by itself after ~8 real s and confirmation does not wait for the chamber.' } },
  { codigo: 'SEN-02', nivel: 'alta', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:273`,
    fases: ['PRECALENTAMIENTO', 'PRE_VACIO', 'CALENTAMIENTO', 'ESTERILIZACION', 'DESCOMPRESION', 'SECADO'],
    mecanismo: { es: 'La sonda Principal deja de leer (SENSOR_AUSENTE); vuelve a leer cuando el protocolo termina de ventear.',
      en: 'The main probe stops reading (SENSOR_AUSENTE); it reads again once the failure protocol has vented.' } },
  { codigo: 'SEN-04', nivel: 'alta', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:285`,
    fases: ['PRECALENTAMIENTO', 'PRE_VACIO', 'CALENTAMIENTO', 'ESTERILIZACION', 'DESCOMPRESION', 'SECADO'],
    mecanismo: { es: 'El sensor de presión de cámara deja de leer; vapor cortado y descompresión solo por la válvula lenta.',
      en: 'The chamber pressure sensor stops reading; steam cut and venting only through the slow valve.' } },
  { codigo: 'CIC-02', nivel: 'media', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:334`,
    fases: ['PRE_VACIO'],
    mecanismo: { es: 'Falla la bomba de vacío: no se alcanza la presión baja del pulso; el disparo adelanta el tiempo límite real (timeout_bajo, 10 min).',
      en: 'The vacuum pump fails: the pulse low pressure is not reached; the trigger brings forward the real time limit (timeout_bajo, 10 min).' } },
  { codigo: 'CIC-03', nivel: 'media', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:336`,
    fases: ['CALENTAMIENTO'],
    mecanismo: { es: 'Se pierde el suministro de vapor en el calentamiento; el disparo adelanta el tiempo límite real (timeout_calentamiento).',
      en: 'Steam supply is lost during heating; the trigger brings forward the real time limit (timeout_calentamiento).' } },
  { codigo: 'CIC-04', nivel: 'media', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:338`,
    fases: ['ESTERILIZACION'],
    mecanismo: { es: 'Se pierde el suministro de vapor: la presión y la temperatura caen y la vigilancia real (debounce acumulado 5 s en 10 s) aborta.',
      en: 'Steam supply is lost: pressure and temperature fall and the real check (accumulated debounce 5 s in 10 s) aborts.' } },
  { codigo: 'CIC-12', nivel: 'media', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:373`, cargas: ['solido'],
    fases: ['ESTERILIZACION'],
    mecanismo: { es: 'Entran gases no condensables (aire) a la cámara: Tsat(P) supera al Principal; el disparo confirma la condición C-03 (simplificado).',
      en: 'Non-condensable gas (air) enters the chamber: Tsat(P) exceeds the main probe; the trigger confirms condition C-03 (simplified).' } },
  { codigo: 'CIC-05', nivel: 'media', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:340`,
    fases: ['DESCOMPRESION'],
    mecanismo: { es: 'La válvula de escape no responde; el disparo adelanta el tiempo límite real del modo de descompresión.',
      en: 'The exhaust valve does not respond; the trigger brings forward the real time limit of the exhaust mode.' } },
  { codigo: 'CIC-06', nivel: 'media', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:342`,
    fases: ['SECADO'],
    mecanismo: { es: 'Falla la bomba de vacío y entra aire: el secado pierde (o no logra) el vacío y la vigilancia real aborta.',
      en: 'The vacuum pump fails and air leaks in: drying loses (or never reaches) vacuum and the real check aborts.' } },
  { codigo: 'PUE-02', nivel: 'media', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:256`,
    fases: ['PRECALENTAMIENTO', 'PRE_VACIO', 'CALENTAMIENTO', 'ESTERILIZACION', 'DESCOMPRESION', 'SECADO'],
    mecanismo: { es: 'El sensor de Puerta 1 cerrada deja de detectarse unos segundos.',
      en: 'The Door 1 closed sensor stops being detected for a few seconds.' } },
  { codigo: 'SUM-01', nivel: 'alta', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:213`,
    fases: ['PRECALENTAMIENTO', 'PRE_VACIO', 'CALENTAMIENTO', 'ESTERILIZACION', 'DESCOMPRESION', 'SECADO'],
    mecanismo: { es: 'Corte eléctrico: todas las salidas se apagan unos segundos; al volver la energía corre el protocolo de fallo.',
      en: 'Power failure: all outputs go off for a few seconds; when power returns the failure protocol runs.' } },
  { codigo: 'COM-02', nivel: 'alta', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:466`,
    fases: ['PRECALENTAMIENTO', 'PRE_VACIO', 'CALENTAMIENTO', 'ESTERILIZACION', 'DESCOMPRESION', 'SECADO'],
    mecanismo: { es: 'Se pierde la comunicación con el módulo E/S unos segundos; el módulo apaga las salidas.',
      en: 'Communication with the I/O module is lost for a few seconds; the module switches outputs off.' } },
  { codigo: 'SEN-11', nivel: 'baja', efecto: 'aviso_man', despeje: 'MAN', origen: `${CAT}:326`, cargas: ['solido'],
    fases: ['ESTERILIZACION'],
    mecanismo: { es: 'La sonda de referencia deja de leer (como si el programa la usara de Referencia): el ciclo sigue y termina con observación.',
      en: 'The reference probe stops reading (as if the program used it as Reference): the cycle continues and ends with an observation.' } },
  { codigo: 'CIC-19', nivel: 'media', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:410`, cargas: ['liquido'],
    fases: ['ESTERILIZACION'],
    mecanismo: { es: 'Con carga líquida, la sonda de referencia deja de leer: la temperatura de la carga no se puede verificar y el ciclo aborta.',
      en: 'With a liquid load the reference probe stops reading: the load temperature cannot be verified and the cycle aborts.' } },
  { codigo: 'CIC-09', nivel: 'baja', efecto: 'aviso', despeje: 'AUTO', origen: `${CAT}:353`,
    fases: ['ESTERILIZACION'],
    mecanismo: { es: 'La sonda de referencia queda unos segundos fuera del rango de esterilización: aviso que se despeja solo y línea en la tirilla.',
      en: 'The reference probe is out of the sterilization range for a few seconds: a warning that clears itself and a ticket line.' } },
  { codigo: 'CIC-25', nivel: 'baja', efecto: 'aviso', despeje: 'AUTO', origen: `${CAT}:451`, cargas: ['liquido'],
    fases: ['DESCOMPRESION'],
    mecanismo: { es: 'Falla momentánea del aire comprimido en el enfriamiento con contrapresión: a los 10 s bajo el mínimo, aviso; se despeja al recuperarse.',
      en: 'Momentary compressed-air failure during counter-pressure cooling: after 10 s below the minimum, a warning; it clears on recovery.' } },
  { codigo: 'CIC-24', nivel: 'media', efecto: 'fallo', despeje: 'MAN', origen: `${CAT}:444`, cargas: ['liquido'],
    fases: ['DESCOMPRESION'],
    mecanismo: { es: 'Falla permanente del aire comprimido en el enfriamiento: CIC-25 a los 10 s y FALLO CIC-24 a los 60 s bajo el mínimo de contrapresión.',
      en: 'Permanent compressed-air failure during cooling: CIC-25 after 10 s and FAILURE CIC-24 after 60 s below the counter-pressure minimum.' } },
  { codigo: 'CIC-07', nivel: 'baja', efecto: 'aviso', despeje: 'AUTO', origen: `${CAT}:344`,
    fases: ['DESCOMPRESION', 'SECADO', 'ESPERA'],
    mecanismo: { es: 'La cámara tarda en enfriar tras el ciclo: «Esperando cámara segura» con el motivo de temperatura; el disparo adelanta timeout_temperatura.',
      en: 'The chamber is slow to cool after the cycle: «Waiting for safe chamber» with the temperature reason; the trigger brings forward timeout_temperatura.' } },
];

/** Alarmas que el simulador puede levantar sin estar en el panel (consecuencias o fuera de ciclo). */
export const ALARMAS_EXTRA = {
  'CIC-01': { nivel: 'media', bloqueante: true, despeje: 'MAN' },
  'PUE-01': { nivel: 'baja', bloqueante: true, despeje: 'AUTO' },
};

export function fallo(codigo) { return FALLOS.find((f) => f.codigo === codigo) || null; }

/** Nivel, bloqueo y despeje de cualquier código que pueda levantar el simulador. */
export function datosAlarma(codigo) {
  const f = fallo(codigo);
  if (f) return { nivel: f.nivel, bloqueante: f.efecto === 'fallo' || f.efecto === 'emergencia', despeje: f.despeje };
  return ALARMAS_EXTRA[codigo] || { nivel: 'media', bloqueante: true, despeje: 'MAN' };
}

/** Código visible (catalogo.codigo_visible: TARJETA_* -> MODULO_ES_*). */
export function codigoVisible(codigo) {
  return typeof codigo === 'string' && codigo.startsWith('TARJETA_') ? 'MODULO_ES_' + codigo.slice(8) : codigo;
}

/** Motivo genérico de una fase sin motivo propio (ciclo.py _MOTIVO_NO_REGISTRADO); sin clave i18n. */
export const MOTIVO_NO_REGISTRADO = {
  es: 'La fase terminó en fallo; el motivo detallado aún no se registra.',
  en: 'The phase ended in failure; the detailed reason is not recorded yet.',
};

/**
 * Sustituye {nombre} y {nombre:.Nf} (formato Python de las plantillas reales) con `valores`.
 * Un valor numérico sin formato sale con 1 decimal si no es entero.
 */
export function formatearPlantilla(texto, valores = {}) {
  return String(texto).replace(/\{(\w+)(?::\.(\d+)f)?\}/g, (todo, nombre, dec) => {
    if (!(nombre in valores)) return todo;
    const v = valores[nombre];
    if (typeof v === 'number' && Number.isFinite(v)) {
      if (dec != null) return v.toFixed(Number(dec));
      return Number.isInteger(v) ? String(v) : v.toFixed(1);
    }
    return v == null ? '' : String(v);
  });
}
