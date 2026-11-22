// GENERADO por herramientas/generar_programas.py — no editar a mano.
// Transcripción de los programas de fábrica reales del Software de Autoclave
// (repo codigo_autoclave, rama dev, src/autoclave/cycles/factory/*.json).
// Origen de cada programa:
//   bowe_dick          nº 1  <- cycles/factory/bowe_dick.json
//   134_instrumental   nº 2  <- cycles/factory/instrumental_134.json
//   instrumental_121   nº 3  <- cycles/factory/instrumental_121.json
//   liquidos           nº 4  <- cycles/factory/liquidos.json
//   textiles           nº 5  <- cycles/factory/textiles.json
//   prion              nº 6  <- cycles/factory/prion.json

export const PROGRAMAS_FABRICA = [
  {
    id: "bowe_dick",  // bowe_dick.json:2
    numero: 1,
    nombreClave: "ciclos_fabrica.bowe_dick.nombre",
    displayName: "Bowie & Dick",
    habilitado: true,  // ausente = true
    sensores: {"temp_camara": "principal", "temp_2_camara": "no_en_uso", "temp_ref": "no_en_uso"},
    origen: "src/autoclave/cycles/factory/bowe_dick.json",
    parametros: {
      "globals": {
        "F0": { value: false, type: "bool" },  // bowe_dick.json:14
        "F0_objetivo": { value: 12, type: "float", unit: "min", min: 0, max: 60 },  // bowe_dick.json:15
        "ciclos_multiples": { value: true, type: "bool" },  // bowe_dick.json:16
        "presion_chaqueta": { value: 300, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 400 },  // bowe_dick.json:17
        "rango_presion_chaqueta": { value: 50, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // bowe_dick.json:18
        "delta_temp_chaqueta": { value: 1.5, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 5 },  // bowe_dick.json:19
        "margen_flujo_chaqueta": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 40 },  // bowe_dick.json:20
        "tipo_carga": { value: "solido", type: "enum", options: ["solido", "liquido"], unit: "" },  // bowe_dick.json:21
        "registro_carga_obligatorio": { value: false, type: "bool" },  // bowe_dick.json:22
        "impresion_carga": { value: "ninguna", type: "enum", options: ["ninguna", "lote", "lote_elementos"], unit: "" },  // bowe_dick.json:23
      },
      "precalentamiento": {
        "tiempo_precalentamiento": { value: 0, type: "int", unit: "min", min: 0, max: 3600 },  // bowe_dick.json:26
        "presion_precalentamiento": { value: 350, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // bowe_dick.json:27
        "timeout_precalentamiento": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // bowe_dick.json:28
      },
      "prevacio": {
        "conteo_pulso_a": { value: 4, unit: "", min: 0, max: 100 },  // bowe_dick.json:31
        "presion_alta_pulso_a": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // bowe_dick.json:32
        "tiempo_adicional_alto_a": { value: 0, unit: "seg", min: 0, max: 3600 },  // bowe_dick.json:33
        "presion_baja_pulso_a": { value: 50, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // bowe_dick.json:34
        "tiempo_adicional_bajo_a": { value: 0, unit: "seg", min: 0, max: 3600 },  // bowe_dick.json:35
        "conteo_pulso_b": { value: 0, unit: "", min: 0, max: 100 },  // bowe_dick.json:37
        "presion_alta_pulso_b": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // bowe_dick.json:38
        "tiempo_adicional_alto_b": { value: 0, unit: "seg", min: 0, max: 3600 },  // bowe_dick.json:39
        "presion_baja_pulso_b": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // bowe_dick.json:40
        "tiempo_adicional_bajo_b": { value: 0, unit: "seg", min: 0, max: 3600 },  // bowe_dick.json:41
        "conteo_pulso_c": { value: 0, unit: "", min: 0, max: 100 },  // bowe_dick.json:43
        "presion_alta_pulso_c": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // bowe_dick.json:44
        "tiempo_adicional_alto_c": { value: 0, unit: "seg", min: 0, max: 3600 },  // bowe_dick.json:45
        "presion_baja_pulso_c": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // bowe_dick.json:46
        "tiempo_adicional_bajo_c": { value: 0, unit: "seg", min: 0, max: 3600 },  // bowe_dick.json:47
        "conteo_pulso_d": { value: 0, unit: "", min: 0, max: 100 },  // bowe_dick.json:50
        "presion_alta_pulso_d": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // bowe_dick.json:51
        "tiempo_adicional_alto_d": { value: 0, unit: "seg", min: 0, max: 3600 },  // bowe_dick.json:52
        "presion_baja_pulso_d": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // bowe_dick.json:53
        "tiempo_adicional_bajo_d": { value: 0, unit: "seg", min: 0, max: 3600 },  // bowe_dick.json:54
        "timeout_bajo": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // bowe_dick.json:56
        "timeout_alto": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // bowe_dick.json:57
        "presion_inicio_vacio": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 15 },  // bowe_dick.json:58
        "timeout_descompresion": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // bowe_dick.json:59
      },
      "calentamiento": {
        "temperatura_calentamiento": { value: 134.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // bowe_dick.json:63
        "presion_add_calentamiento": { value: 11.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // bowe_dick.json:64
        "presion_add_liquido_calentamiento": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // bowe_dick.json:65
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // bowe_dick.json:66
        "timeout_calentamiento": { value: 60, type: "int", unit: "min", min: 1, max: 999 },  // bowe_dick.json:67
        "factor_calentamiento": { value: 50, type: "int", unit: "%", min: 0, max: 100 },  // bowe_dick.json:68
        "rango_calentamiento_temp": { value: 2.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 30 },  // bowe_dick.json:69
        "rango_calentamiento_pres": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // bowe_dick.json:70
        "tasa_calentamiento": { value: 50.0, type: "float", unit: "°C/min", clase: "diferencia", min: 0, max: 100 },  // bowe_dick.json:71
        "tasa_presion": { value: 100.0, type: "float", unit: "kPa/min", clase: "diferencia", min: 0, max: 300 },  // bowe_dick.json:72
        "tiempo_estable_preesterilizacion": { value: 3, type: "int", unit: "seg", min: 0, max: 1800 },  // bowe_dick.json:73
        "intervalo_segmentos_calor": { value: 2, type: "int", unit: "seg", min: 0, max: 30 },  // bowe_dick.json:74
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // bowe_dick.json:75
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // bowe_dick.json:76
        "escape_rapido_on": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // bowe_dick.json:77
        "escape_rapido_off": { value: 10, type: "int", unit: "seg", min: 0, max: 1000 },  // bowe_dick.json:78
        "rango_temp_estabilizacion": { value: 1.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 10 },  // bowe_dick.json:79
        "timeout_recuperacion_estabilizacion": { value: 5, type: "int", unit: "min", min: 1, max: 60 },  // bowe_dick.json:80
      },
      "esterilizacion": {
        "escape_lento_on_ester": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // bowe_dick.json:85
        "escape_lento_off_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // bowe_dick.json:86
        "escape_rapido_on_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // bowe_dick.json:87
        "escape_rapido_off_ester": { value: 400, type: "int", unit: "seg", min: 0, max: 1000 },  // bowe_dick.json:88
        "temperatura_esterilizacion": { value: 134.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // bowe_dick.json:89
        "tiempo_esterilizacion": { value: 3.5, type: "float", unit: "min", min: 0, max: 9999 },  // bowe_dick.json:90
        "factor_esterilizacion": { value: 70, type: "int", unit: "%", min: 0, max: 100 },  // bowe_dick.json:91
        "presion_add_esterilizacion": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // bowe_dick.json:92
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // bowe_dick.json:93
        "margen_chaqueta_est": { value: 8.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 30 },  // bowe_dick.json:94
        "intervalo_segmentos_ester": { value: 3, type: "int", unit: "seg", min: 0, max: 30 },  // bowe_dick.json:95
        "rango_temperatura_ester": { value: 3.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 50 },  // bowe_dick.json:96
        "rango_presion_ester": { value: 30.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // bowe_dick.json:97
        "brecha_segura_temperatura": { value: 0.3, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // bowe_dick.json:98
        "brecha_error_temperatura": { value: 0.1, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // bowe_dick.json:99
        "brecha_error_presion": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 10 },  // bowe_dick.json:100
        "brecha_segura_presion": { value: 1.5, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 20 },  // bowe_dick.json:101
        "timeout_excursion_referencia": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // bowe_dick.json:102
        "max_reinicios_exposicion": { value: 3, type: "int", min: 0, max: 10 },  // bowe_dick.json:103
      },
      "secado": {
        "modo": { value: 1, type: "int", unit: "", min: 1, max: 3 },  // bowe_dick.json:107
        "tiempo_secado": { value: 2.0, type: "float", unit: "min", min: 0, max: 120 },  // bowe_dick.json:108
        "presion_chaqueta_secado": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // bowe_dick.json:109
        "rango_chaqueta_secado": { value: 30, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // bowe_dick.json:110
        "presion_baja_secado": { value: 20, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 200 },  // bowe_dick.json:111
        "presion_alta_secado": { value: 80, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 300 },  // bowe_dick.json:112
        "timeout_pulso": { value: 10, type: "int", unit: "seg", min: 1, max: 600 },  // bowe_dick.json:113
      },
      "descompresion": {
        "modo": { value: 1, type: "int", unit: "", min: 0, max: 5 },  // bowe_dick.json:116
        "tiempo_pre_despresurizacion": { value: 0, type: "int", unit: "sec", min: 0, max: 3600 },  // bowe_dick.json:119
        "presion_fin_descompresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 20 },  // bowe_dick.json:122
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 1, max: 1000 },  // bowe_dick.json:125
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // bowe_dick.json:132
        "modo_1": {
          "timeout": { value: 10, type: "int", unit: "min", min: 1, max: 3600 },  // bowe_dick.json:140
        },
        "modo_2": {
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // bowe_dick.json:143
        },
        "modo_3": {
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // bowe_dick.json:146
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // bowe_dick.json:147
        },
        "modo_4": {
          "presion_camara_enfriamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // bowe_dick.json:150
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // bowe_dick.json:151
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // bowe_dick.json:152
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // bowe_dick.json:153
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // bowe_dick.json:154
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // bowe_dick.json:155
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // bowe_dick.json:156
        },
        "modo_5": {
          "presion_camara_enfriamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // bowe_dick.json:159
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // bowe_dick.json:160
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // bowe_dick.json:161
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // bowe_dick.json:162
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // bowe_dick.json:163
          "descompresion_lenta_rapida": { value: false, type: "bool", unit: "" },  // bowe_dick.json:164
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // bowe_dick.json:165
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // bowe_dick.json:166
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // bowe_dick.json:167
        },
      },
      "finalizacion": {
        "tiempo_espera_apertura": { value: 60, type: "int", unit: "seg", min: 0, max: 3600 },  // bowe_dick.json:171
        "temp_max_apertura": { value: 80.0, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // bowe_dick.json:172
        "timeout_temperatura": { value: 30, type: "int", unit: "min", min: 1, max: 120 },  // bowe_dick.json:173
        "apertura_automatica": { value: false, type: "bool", unit: "" },  // bowe_dick.json:174
      },
    },
  },
  {
    id: "134_instrumental",  // instrumental_134.json:2
    numero: 2,
    nombreClave: "ciclos_fabrica.134_instrumental.nombre",
    displayName: "instrumental 134",
    habilitado: true,  // ausente = true
    sensores: {"temp_camara": "principal", "temp_2_camara": "no_en_uso", "temp_ref": "no_en_uso"},
    origen: "src/autoclave/cycles/factory/instrumental_134.json",
    parametros: {
      "globals": {
        "F0": { value: false, type: "bool" },  // instrumental_134.json:14
        "F0_objetivo": { value: 12, type: "float", unit: "min", min: 0, max: 60 },  // instrumental_134.json:15
        "ciclos_multiples": { value: true, type: "bool" },  // instrumental_134.json:16
        "presion_chaqueta": { value: 300, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 400 },  // instrumental_134.json:17
        "rango_presion_chaqueta": { value: 50, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // instrumental_134.json:18
        "delta_temp_chaqueta": { value: 1.5, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 5 },  // instrumental_134.json:19
        "margen_flujo_chaqueta": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 40 },  // instrumental_134.json:20
        "tipo_carga": { value: "solido", type: "enum", options: ["solido", "liquido"], unit: "" },  // instrumental_134.json:21
        "registro_carga_obligatorio": { value: false, type: "bool" },  // instrumental_134.json:22
        "impresion_carga": { value: "lote_elementos", type: "enum", options: ["ninguna", "lote", "lote_elementos"], unit: "" },  // instrumental_134.json:23
      },
      "precalentamiento": {
        "tiempo_precalentamiento": { value: 0, type: "int", unit: "min", min: 0, max: 3600 },  // instrumental_134.json:26
        "presion_precalentamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_134.json:27
        "timeout_precalentamiento": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // instrumental_134.json:28
      },
      "prevacio": {
        "conteo_pulso_a": { value: 4, unit: "", min: 0, max: 100 },  // instrumental_134.json:31
        "presion_alta_pulso_a": { value: 80, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_134.json:32
        "tiempo_adicional_alto_a": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_134.json:33
        "presion_baja_pulso_a": { value: 30, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_134.json:34
        "tiempo_adicional_bajo_a": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_134.json:35
        "conteo_pulso_b": { value: 0, unit: "", min: 0, max: 100 },  // instrumental_134.json:37
        "presion_alta_pulso_b": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_134.json:38
        "tiempo_adicional_alto_b": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_134.json:39
        "presion_baja_pulso_b": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_134.json:40
        "tiempo_adicional_bajo_b": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_134.json:41
        "conteo_pulso_c": { value: 0, unit: "", min: 0, max: 100 },  // instrumental_134.json:43
        "presion_alta_pulso_c": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_134.json:44
        "tiempo_adicional_alto_c": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_134.json:45
        "presion_baja_pulso_c": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_134.json:46
        "tiempo_adicional_bajo_c": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_134.json:47
        "conteo_pulso_d": { value: 0, unit: "", min: 0, max: 100 },  // instrumental_134.json:50
        "presion_alta_pulso_d": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_134.json:51
        "tiempo_adicional_alto_d": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_134.json:52
        "presion_baja_pulso_d": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_134.json:53
        "tiempo_adicional_bajo_d": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_134.json:54
        "timeout_bajo": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // instrumental_134.json:56
        "timeout_alto": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // instrumental_134.json:57
        "presion_inicio_vacio": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 15 },  // instrumental_134.json:58
        "timeout_descompresion": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // instrumental_134.json:59
      },
      "calentamiento": {
        "temperatura_calentamiento": { value: 134.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // instrumental_134.json:63
        "presion_add_calentamiento": { value: 11.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // instrumental_134.json:64
        "presion_add_liquido_calentamiento": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // instrumental_134.json:65
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // instrumental_134.json:66
        "timeout_calentamiento": { value: 60, type: "int", unit: "min", min: 1, max: 999 },  // instrumental_134.json:67
        "factor_calentamiento": { value: 50, type: "int", unit: "%", min: 0, max: 100 },  // instrumental_134.json:68
        "rango_calentamiento_temp": { value: 2.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 30 },  // instrumental_134.json:69
        "rango_calentamiento_pres": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // instrumental_134.json:70
        "tasa_calentamiento": { value: 50.0, type: "float", unit: "°C/min", clase: "diferencia", min: 0, max: 100 },  // instrumental_134.json:71
        "tasa_presion": { value: 100.0, type: "float", unit: "kPa/min", clase: "diferencia", min: 0, max: 300 },  // instrumental_134.json:72
        "tiempo_estable_preesterilizacion": { value: 3, type: "int", unit: "seg", min: 0, max: 180 },  // instrumental_134.json:73
        "intervalo_segmentos_calor": { value: 2, type: "int", unit: "seg", min: 0, max: 30 },  // instrumental_134.json:74
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_134.json:75
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_134.json:76
        "escape_rapido_on": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_134.json:77
        "escape_rapido_off": { value: 10, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_134.json:78
        "rango_temp_estabilizacion": { value: 1.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 10 },  // instrumental_134.json:79
        "timeout_recuperacion_estabilizacion": { value: 5, type: "int", unit: "min", min: 1, max: 60 },  // instrumental_134.json:80
      },
      "esterilizacion": {
        "escape_lento_on_ester": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_134.json:84
        "escape_lento_off_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_134.json:85
        "escape_rapido_on_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_134.json:86
        "escape_rapido_off_ester": { value: 400, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_134.json:87
        "temperatura_esterilizacion": { value: 134.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // instrumental_134.json:88
        "tiempo_esterilizacion": { value: 3.5, type: "float", unit: "min", min: 0, max: 9999 },  // instrumental_134.json:89
        "factor_esterilizacion": { value: 70, type: "int", unit: "%", min: 0, max: 100 },  // instrumental_134.json:90
        "presion_add_esterilizacion": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // instrumental_134.json:91
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // instrumental_134.json:92
        "margen_chaqueta_est": { value: 8.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 30 },  // instrumental_134.json:93
        "intervalo_segmentos_ester": { value: 3, type: "int", unit: "seg", min: 0, max: 30 },  // instrumental_134.json:94
        "rango_temperatura_ester": { value: 3.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 50 },  // instrumental_134.json:95
        "rango_presion_ester": { value: 30.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // instrumental_134.json:96
        "brecha_segura_temperatura": { value: 0.3, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // instrumental_134.json:97
        "brecha_error_temperatura": { value: 0.1, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // instrumental_134.json:98
        "brecha_error_presion": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 10 },  // instrumental_134.json:99
        "brecha_segura_presion": { value: 1.5, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 20 },  // instrumental_134.json:100
        "timeout_excursion_referencia": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // instrumental_134.json:101
        "max_reinicios_exposicion": { value: 3, type: "int", min: 0, max: 10 },  // instrumental_134.json:102
      },
      "secado": {
        "modo": { value: 1, type: "int", unit: "", min: 1, max: 3 },  // instrumental_134.json:105
        "tiempo_secado": { value: 2.0, type: "float", unit: "min", min: 0, max: 120 },  // instrumental_134.json:106
        "presion_chaqueta_secado": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // instrumental_134.json:107
        "rango_chaqueta_secado": { value: 30, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // instrumental_134.json:108
        "presion_baja_secado": { value: 20, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 200 },  // instrumental_134.json:109
        "presion_alta_secado": { value: 80, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 300 },  // instrumental_134.json:110
        "timeout_pulso": { value: 10, type: "int", unit: "seg", min: 1, max: 600 },  // instrumental_134.json:111
      },
      "descompresion": {
        "modo": { value: 1, type: "int", unit: "", min: 0, max: 5 },  // instrumental_134.json:114
        "tiempo_pre_despresurizacion": { value: 0, type: "int", unit: "sec", min: 0, max: 3600 },  // instrumental_134.json:117
        "presion_fin_descompresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 20 },  // instrumental_134.json:120
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 1, max: 1000 },  // instrumental_134.json:123
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_134.json:130
        "modo_1": {
          "timeout": { value: 10, type: "int", unit: "min", min: 1, max: 3600 },  // instrumental_134.json:138
        },
        "modo_2": {
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // instrumental_134.json:141
        },
        "modo_3": {
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // instrumental_134.json:144
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // instrumental_134.json:145
        },
        "modo_4": {
          "presion_camara_enfriamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // instrumental_134.json:148
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // instrumental_134.json:149
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // instrumental_134.json:150
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // instrumental_134.json:151
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // instrumental_134.json:152
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // instrumental_134.json:153
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // instrumental_134.json:154
        },
        "modo_5": {
          "presion_camara_enfriamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // instrumental_134.json:157
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // instrumental_134.json:158
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // instrumental_134.json:159
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // instrumental_134.json:160
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // instrumental_134.json:161
          "descompresion_lenta_rapida": { value: false, type: "bool", unit: "" },  // instrumental_134.json:162
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // instrumental_134.json:163
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // instrumental_134.json:164
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // instrumental_134.json:165
        },
      },
      "finalizacion": {
        "tiempo_espera_apertura": { value: 60, type: "int", unit: "seg", min: 0, max: 3600 },  // instrumental_134.json:169
        "temp_max_apertura": { value: 80.0, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // instrumental_134.json:170
        "timeout_temperatura": { value: 30, type: "int", unit: "min", min: 1, max: 120 },  // instrumental_134.json:171
        "apertura_automatica": { value: false, type: "bool", unit: "" },  // instrumental_134.json:172
      },
    },
  },
  {
    id: "instrumental_121",  // instrumental_121.json:2
    numero: 3,
    nombreClave: "ciclos_fabrica.instrumental_121.nombre",
    displayName: "Instrumental 121°C",
    habilitado: true,  // ausente = true
    sensores: {"temp_camara": "principal", "temp_2_camara": "no_en_uso", "temp_ref": "no_en_uso"},
    origen: "src/autoclave/cycles/factory/instrumental_121.json",
    parametros: {
      "globals": {
        "F0": { value: false, type: "bool" },  // instrumental_121.json:14
        "F0_objetivo": { value: 12, type: "float", unit: "min", min: 0, max: 60 },  // instrumental_121.json:18
        "ciclos_multiples": { value: true, type: "bool" },  // instrumental_121.json:25
        "presion_chaqueta": { value: 300, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 400 },  // instrumental_121.json:29
        "rango_presion_chaqueta": { value: 50, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // instrumental_121.json:37
        "delta_temp_chaqueta": { value: 1.5, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 5 },  // instrumental_121.json:45
        "margen_flujo_chaqueta": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 40 },  // instrumental_121.json:53
        "tipo_carga": { value: "solido", type: "enum", options: ["solido", "liquido"], unit: "" },  // instrumental_121.json:61
        "registro_carga_obligatorio": { value: false, type: "bool" },  // instrumental_121.json:70
        "impresion_carga": { value: "lote_elementos", type: "enum", options: ["ninguna", "lote", "lote_elementos"], unit: "" },  // instrumental_121.json:71
      },
      "precalentamiento": {
        "tiempo_precalentamiento": { value: 0, type: "int", unit: "min", min: 0, max: 3600 },  // instrumental_121.json:74
        "presion_precalentamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_121.json:81
        "timeout_precalentamiento": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // instrumental_121.json:89
      },
      "prevacio": {
        "conteo_pulso_a": { value: 4, unit: "", min: 0, max: 100 },  // instrumental_121.json:98
        "presion_alta_pulso_a": { value: 80, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_121.json:104
        "tiempo_adicional_alto_a": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_121.json:111
        "presion_baja_pulso_a": { value: 30, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_121.json:117
        "tiempo_adicional_bajo_a": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_121.json:124
        "conteo_pulso_b": { value: 0, unit: "", min: 0, max: 100 },  // instrumental_121.json:130
        "presion_alta_pulso_b": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_121.json:136
        "tiempo_adicional_alto_b": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_121.json:143
        "presion_baja_pulso_b": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_121.json:149
        "tiempo_adicional_bajo_b": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_121.json:156
        "conteo_pulso_c": { value: 0, unit: "", min: 0, max: 100 },  // instrumental_121.json:162
        "presion_alta_pulso_c": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_121.json:168
        "tiempo_adicional_alto_c": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_121.json:175
        "presion_baja_pulso_c": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_121.json:181
        "tiempo_adicional_bajo_c": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_121.json:188
        "conteo_pulso_d": { value: 0, unit: "", min: 0, max: 100 },  // instrumental_121.json:194
        "presion_alta_pulso_d": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_121.json:200
        "tiempo_adicional_alto_d": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_121.json:207
        "presion_baja_pulso_d": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // instrumental_121.json:213
        "tiempo_adicional_bajo_d": { value: 0, unit: "sec", min: 0, max: 3600 },  // instrumental_121.json:220
        "timeout_bajo": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // instrumental_121.json:226
        "timeout_alto": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // instrumental_121.json:233
        "presion_inicio_vacio": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 15 },  // instrumental_121.json:240
        "timeout_descompresion": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // instrumental_121.json:248
      },
      "calentamiento": {
        "temperatura_calentamiento": { value: 121.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // instrumental_121.json:257
        "presion_add_calentamiento": { value: 11.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // instrumental_121.json:265
        "presion_add_liquido_calentamiento": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // instrumental_121.json:273
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // instrumental_121.json:281
        "timeout_calentamiento": { value: 60, type: "int", unit: "min", min: 1, max: 999 },  // instrumental_121.json:289
        "factor_calentamiento": { value: 50, type: "int", unit: "%", min: 0, max: 100 },  // instrumental_121.json:296
        "rango_calentamiento_temp": { value: 2.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 30 },  // instrumental_121.json:303
        "rango_calentamiento_pres": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // instrumental_121.json:311
        "tasa_calentamiento": { value: 50.0, type: "float", unit: "°C/min", clase: "diferencia", min: 0, max: 100 },  // instrumental_121.json:319
        "tasa_presion": { value: 100.0, type: "float", unit: "kPa/min", clase: "diferencia", min: 0, max: 300 },  // instrumental_121.json:327
        "tiempo_estable_preesterilizacion": { value: 3, type: "int", unit: "seg", min: 0, max: 180 },  // instrumental_121.json:335
        "intervalo_segmentos_calor": { value: 2, type: "int", unit: "seg", min: 0, max: 30 },  // instrumental_121.json:342
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_121.json:349
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_121.json:356
        "escape_rapido_on": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_121.json:363
        "escape_rapido_off": { value: 10, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_121.json:370
        "rango_temp_estabilizacion": { value: 1.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 10 },  // instrumental_121.json:377
        "timeout_recuperacion_estabilizacion": { value: 5, type: "int", unit: "min", min: 1, max: 60 },  // instrumental_121.json:385
      },
      "esterilizacion": {
        "escape_lento_on_ester": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_121.json:394
        "escape_lento_off_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_121.json:401
        "escape_rapido_on_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_121.json:408
        "escape_rapido_off_ester": { value: 400, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_121.json:415
        "temperatura_esterilizacion": { value: 121.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // instrumental_121.json:422
        "tiempo_esterilizacion": { value: 15.0, type: "float", unit: "min", min: 0, max: 9999 },  // instrumental_121.json:430
        "factor_esterilizacion": { value: 70, type: "int", unit: "%", min: 0, max: 100 },  // instrumental_121.json:437
        "presion_add_esterilizacion": { value: 11.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // instrumental_121.json:444
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // instrumental_121.json:452
        "margen_chaqueta_est": { value: 8.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 30 },  // instrumental_121.json:460
        "intervalo_segmentos_ester": { value: 3, type: "int", unit: "seg", min: 0, max: 30 },  // instrumental_121.json:468
        "rango_temperatura_ester": { value: 3.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 50 },  // instrumental_121.json:475
        "rango_presion_ester": { value: 30.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // instrumental_121.json:483
        "brecha_segura_temperatura": { value: 0.3, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // instrumental_121.json:491
        "brecha_error_temperatura": { value: 0.1, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // instrumental_121.json:499
        "brecha_error_presion": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 10 },  // instrumental_121.json:507
        "brecha_segura_presion": { value: 1.5, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 20 },  // instrumental_121.json:515
        "timeout_excursion_referencia": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // instrumental_121.json:523
        "max_reinicios_exposicion": { value: 3, type: "int", min: 0, max: 10 },  // instrumental_121.json:530
      },
      "secado": {
        "modo": { value: 1, type: "int", unit: "", min: 1, max: 3 },  // instrumental_121.json:538
        "tiempo_secado": { value: 2.0, type: "float", unit: "min", min: 0, max: 120 },  // instrumental_121.json:545
        "presion_chaqueta_secado": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // instrumental_121.json:552
        "rango_chaqueta_secado": { value: 30, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // instrumental_121.json:560
        "presion_baja_secado": { value: 20, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 200 },  // instrumental_121.json:568
        "presion_alta_secado": { value: 80, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 300 },  // instrumental_121.json:576
        "timeout_pulso": { value: 10, type: "int", unit: "seg", min: 1, max: 600 },  // instrumental_121.json:584
      },
      "descompresion": {
        "modo": { value: 1, type: "int", unit: "", min: 0, max: 5 },  // instrumental_121.json:593
        "tiempo_pre_despresurizacion": { value: 0, type: "int", unit: "sec", min: 0, max: 3600 },  // instrumental_121.json:600
        "presion_fin_descompresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 20 },  // instrumental_121.json:607
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 1, max: 1000 },  // instrumental_121.json:615
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // instrumental_121.json:622
        "modo_1": {
          "timeout": { value: 10, type: "int", unit: "min", min: 1, max: 3600 },  // instrumental_121.json:630
        },
        "modo_2": {
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // instrumental_121.json:639
        },
        "modo_3": {
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // instrumental_121.json:648
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // instrumental_121.json:656
        },
        "modo_4": {
          "presion_camara_enfriamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // instrumental_121.json:665
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // instrumental_121.json:673
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // instrumental_121.json:681
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // instrumental_121.json:689
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // instrumental_121.json:696
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // instrumental_121.json:703
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // instrumental_121.json:711
        },
        "modo_5": {
          "presion_camara_enfriamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // instrumental_121.json:720
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // instrumental_121.json:728
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // instrumental_121.json:736
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // instrumental_121.json:744
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // instrumental_121.json:751
          "descompresion_lenta_rapida": { value: false, type: "bool", unit: "" },  // instrumental_121.json:758
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // instrumental_121.json:763
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // instrumental_121.json:771
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // instrumental_121.json:779
        },
      },
      "finalizacion": {
        "tiempo_espera_apertura": { value: 60, type: "int", unit: "seg", min: 0, max: 3600 },  // instrumental_121.json:789
        "temp_max_apertura": { value: 80.0, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // instrumental_121.json:796
        "timeout_temperatura": { value: 30, type: "int", unit: "min", min: 1, max: 120 },  // instrumental_121.json:804
        "apertura_automatica": { value: false, type: "bool", unit: "" },  // instrumental_121.json:811
      },
    },
  },
  {
    id: "liquidos",  // liquidos.json:2
    numero: 4,
    nombreClave: "ciclos_fabrica.liquidos.nombre",
    displayName: "Líquidos",
    habilitado: true,  // ausente = true
    sensores: {"temp_camara": "principal", "temp_2_camara": "no_en_uso", "temp_ref": "no_en_uso"},
    origen: "src/autoclave/cycles/factory/liquidos.json",
    parametros: {
      "globals": {
        "F0": { value: false, type: "bool" },  // liquidos.json:14
        "F0_objetivo": { value: 12, type: "float", unit: "min", min: 0, max: 60 },  // liquidos.json:18
        "ciclos_multiples": { value: true, type: "bool" },  // liquidos.json:25
        "presion_chaqueta": { value: 300, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 400 },  // liquidos.json:29
        "rango_presion_chaqueta": { value: 50, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // liquidos.json:37
        "delta_temp_chaqueta": { value: 1.5, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 5 },  // liquidos.json:45
        "margen_flujo_chaqueta": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 40 },  // liquidos.json:53
        "tipo_carga": { value: "liquido", type: "enum", options: ["solido", "liquido"], unit: "" },  // liquidos.json:61
        "registro_carga_obligatorio": { value: false, type: "bool" },  // liquidos.json:70
        "impresion_carga": { value: "lote_elementos", type: "enum", options: ["ninguna", "lote", "lote_elementos"], unit: "" },  // liquidos.json:71
      },
      "precalentamiento": {
        "tiempo_precalentamiento": { value: 0, type: "int", unit: "min", min: 0, max: 3600 },  // liquidos.json:74
        "presion_precalentamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // liquidos.json:81
        "timeout_precalentamiento": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // liquidos.json:89
      },
      "prevacio": {
        "conteo_pulso_a": { value: 0, unit: "", min: 0, max: 100 },  // liquidos.json:98
        "presion_alta_pulso_a": { value: 80, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // liquidos.json:104
        "tiempo_adicional_alto_a": { value: 0, unit: "sec", min: 0, max: 3600 },  // liquidos.json:111
        "presion_baja_pulso_a": { value: 30, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // liquidos.json:117
        "tiempo_adicional_bajo_a": { value: 0, unit: "sec", min: 0, max: 3600 },  // liquidos.json:124
        "conteo_pulso_b": { value: 0, unit: "", min: 0, max: 100 },  // liquidos.json:130
        "presion_alta_pulso_b": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // liquidos.json:136
        "tiempo_adicional_alto_b": { value: 0, unit: "sec", min: 0, max: 3600 },  // liquidos.json:143
        "presion_baja_pulso_b": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // liquidos.json:149
        "tiempo_adicional_bajo_b": { value: 0, unit: "sec", min: 0, max: 3600 },  // liquidos.json:156
        "conteo_pulso_c": { value: 0, unit: "", min: 0, max: 100 },  // liquidos.json:162
        "presion_alta_pulso_c": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // liquidos.json:168
        "tiempo_adicional_alto_c": { value: 0, unit: "sec", min: 0, max: 3600 },  // liquidos.json:175
        "presion_baja_pulso_c": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // liquidos.json:181
        "tiempo_adicional_bajo_c": { value: 0, unit: "sec", min: 0, max: 3600 },  // liquidos.json:188
        "conteo_pulso_d": { value: 0, unit: "", min: 0, max: 100 },  // liquidos.json:194
        "presion_alta_pulso_d": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // liquidos.json:200
        "tiempo_adicional_alto_d": { value: 0, unit: "sec", min: 0, max: 3600 },  // liquidos.json:207
        "presion_baja_pulso_d": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // liquidos.json:213
        "tiempo_adicional_bajo_d": { value: 0, unit: "sec", min: 0, max: 3600 },  // liquidos.json:220
        "timeout_bajo": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // liquidos.json:226
        "timeout_alto": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // liquidos.json:233
        "presion_inicio_vacio": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 15 },  // liquidos.json:240
        "timeout_descompresion": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // liquidos.json:248
      },
      "calentamiento": {
        "temperatura_calentamiento": { value: 121.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // liquidos.json:257
        "presion_add_calentamiento": { value: 11.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // liquidos.json:265
        "presion_add_liquido_calentamiento": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // liquidos.json:273
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // liquidos.json:281
        "timeout_calentamiento": { value: 60, type: "int", unit: "min", min: 1, max: 999 },  // liquidos.json:289
        "factor_calentamiento": { value: 50, type: "int", unit: "%", min: 0, max: 100 },  // liquidos.json:296
        "rango_calentamiento_temp": { value: 2.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 30 },  // liquidos.json:303
        "rango_calentamiento_pres": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // liquidos.json:311
        "tasa_calentamiento": { value: 50.0, type: "float", unit: "°C/min", clase: "diferencia", min: 0, max: 100 },  // liquidos.json:319
        "tasa_presion": { value: 10.0, type: "float", unit: "kPa/min", clase: "diferencia", min: 0, max: 300 },  // liquidos.json:327
        "tiempo_estable_preesterilizacion": { value: 10, type: "int", unit: "seg", min: 0, max: 180 },  // liquidos.json:335
        "intervalo_segmentos_calor": { value: 2, type: "int", unit: "seg", min: 0, max: 30 },  // liquidos.json:342
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // liquidos.json:349
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // liquidos.json:356
        "escape_rapido_on": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // liquidos.json:363
        "escape_rapido_off": { value: 10, type: "int", unit: "seg", min: 0, max: 1000 },  // liquidos.json:370
        "rango_temp_estabilizacion": { value: 1.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 10 },  // liquidos.json:377
        "timeout_recuperacion_estabilizacion": { value: 5, type: "int", unit: "min", min: 1, max: 60 },  // liquidos.json:385
      },
      "esterilizacion": {
        "escape_lento_on_ester": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // liquidos.json:394
        "escape_lento_off_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // liquidos.json:401
        "escape_rapido_on_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // liquidos.json:408
        "escape_rapido_off_ester": { value: 400, type: "int", unit: "seg", min: 0, max: 1000 },  // liquidos.json:415
        "temperatura_esterilizacion": { value: 121.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // liquidos.json:422
        "tiempo_esterilizacion": { value: 15.0, type: "float", unit: "min", min: 0, max: 9999 },  // liquidos.json:430
        "factor_esterilizacion": { value: 70, type: "int", unit: "%", min: 0, max: 100 },  // liquidos.json:437
        "presion_add_esterilizacion": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // liquidos.json:444
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // liquidos.json:452
        "margen_chaqueta_est": { value: 8.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 30 },  // liquidos.json:460
        "intervalo_segmentos_ester": { value: 3, type: "int", unit: "seg", min: 0, max: 30 },  // liquidos.json:468
        "rango_temperatura_ester": { value: 3.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 50 },  // liquidos.json:475
        "rango_presion_ester": { value: 30.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // liquidos.json:483
        "brecha_segura_temperatura": { value: 0.3, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // liquidos.json:491
        "brecha_error_temperatura": { value: 0.1, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // liquidos.json:499
        "brecha_error_presion": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 10 },  // liquidos.json:507
        "brecha_segura_presion": { value: 1.5, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 20 },  // liquidos.json:515
        "timeout_excursion_referencia": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // liquidos.json:523
        "max_reinicios_exposicion": { value: 3, type: "int", min: 0, max: 10 },  // liquidos.json:530
      },
      "secado": {
        "modo": { value: 1, type: "int", unit: "", min: 1, max: 3 },  // liquidos.json:538
        "tiempo_secado": { value: 0.0, type: "float", unit: "min", min: 0, max: 120 },  // liquidos.json:545
        "presion_chaqueta_secado": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // liquidos.json:552
        "rango_chaqueta_secado": { value: 30, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // liquidos.json:560
        "presion_baja_secado": { value: 20, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 200 },  // liquidos.json:568
        "presion_alta_secado": { value: 80, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 300 },  // liquidos.json:576
        "timeout_pulso": { value: 10, type: "int", unit: "seg", min: 1, max: 600 },  // liquidos.json:584
      },
      "descompresion": {
        "modo": { value: 4, type: "int", unit: "", min: 0, max: 5 },  // liquidos.json:593
        "tiempo_pre_despresurizacion": { value: 0, type: "int", unit: "sec", min: 0, max: 3600 },  // liquidos.json:600
        "presion_fin_descompresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 20 },  // liquidos.json:607
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 1, max: 1000 },  // liquidos.json:615
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // liquidos.json:622
        "modo_1": {
          "timeout": { value: 10, type: "int", unit: "min", min: 1, max: 3600 },  // liquidos.json:630
        },
        "modo_2": {
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // liquidos.json:639
        },
        "modo_3": {
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // liquidos.json:648
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // liquidos.json:656
        },
        "modo_4": {
          "presion_camara_enfriamiento": { value: 300, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // liquidos.json:665
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // liquidos.json:673
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // liquidos.json:681
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // liquidos.json:689
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // liquidos.json:696
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // liquidos.json:703
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // liquidos.json:711
        },
        "modo_5": {
          "presion_camara_enfriamiento": { value: 300, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // liquidos.json:720
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // liquidos.json:728
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // liquidos.json:736
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // liquidos.json:744
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // liquidos.json:751
          "descompresion_lenta_rapida": { value: false, type: "bool", unit: "" },  // liquidos.json:758
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // liquidos.json:763
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // liquidos.json:771
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // liquidos.json:779
        },
      },
      "finalizacion": {
        "tiempo_espera_apertura": { value: 60, type: "int", unit: "seg", min: 0, max: 3600 },  // liquidos.json:789
        "temp_max_apertura": { value: 80.0, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // liquidos.json:796
        "timeout_temperatura": { value: 30, type: "int", unit: "min", min: 1, max: 120 },  // liquidos.json:804
        "apertura_automatica": { value: false, type: "bool", unit: "" },  // liquidos.json:811
      },
    },
  },
  {
    id: "textiles",  // textiles.json:2
    numero: 5,
    nombreClave: "ciclos_fabrica.textiles.nombre",
    displayName: "Textiles",
    habilitado: true,  // ausente = true
    sensores: {"temp_camara": "principal", "temp_2_camara": "no_en_uso", "temp_ref": "no_en_uso"},
    origen: "src/autoclave/cycles/factory/textiles.json",
    parametros: {
      "globals": {
        "F0": { value: false, type: "bool" },  // textiles.json:14
        "F0_objetivo": { value: 12, type: "float", unit: "min", min: 0, max: 60 },  // textiles.json:18
        "ciclos_multiples": { value: true, type: "bool" },  // textiles.json:25
        "presion_chaqueta": { value: 300, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 400 },  // textiles.json:29
        "rango_presion_chaqueta": { value: 50, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // textiles.json:37
        "delta_temp_chaqueta": { value: 1.5, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 5 },  // textiles.json:45
        "margen_flujo_chaqueta": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 40 },  // textiles.json:53
        "tipo_carga": { value: "solido", type: "enum", options: ["solido", "liquido"], unit: "" },  // textiles.json:61
        "registro_carga_obligatorio": { value: false, type: "bool" },  // textiles.json:70
        "impresion_carga": { value: "lote_elementos", type: "enum", options: ["ninguna", "lote", "lote_elementos"], unit: "" },  // textiles.json:71
      },
      "precalentamiento": {
        "tiempo_precalentamiento": { value: 0, type: "int", unit: "min", min: 0, max: 3600 },  // textiles.json:74
        "presion_precalentamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // textiles.json:81
        "timeout_precalentamiento": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // textiles.json:89
      },
      "prevacio": {
        "conteo_pulso_a": { value: 4, unit: "", min: 0, max: 100 },  // textiles.json:98
        "presion_alta_pulso_a": { value: 80, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // textiles.json:104
        "tiempo_adicional_alto_a": { value: 0, unit: "sec", min: 0, max: 3600 },  // textiles.json:111
        "presion_baja_pulso_a": { value: 30, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // textiles.json:117
        "tiempo_adicional_bajo_a": { value: 0, unit: "sec", min: 0, max: 3600 },  // textiles.json:124
        "conteo_pulso_b": { value: 0, unit: "", min: 0, max: 100 },  // textiles.json:130
        "presion_alta_pulso_b": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // textiles.json:136
        "tiempo_adicional_alto_b": { value: 0, unit: "sec", min: 0, max: 3600 },  // textiles.json:143
        "presion_baja_pulso_b": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // textiles.json:149
        "tiempo_adicional_bajo_b": { value: 0, unit: "sec", min: 0, max: 3600 },  // textiles.json:156
        "conteo_pulso_c": { value: 0, unit: "", min: 0, max: 100 },  // textiles.json:162
        "presion_alta_pulso_c": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // textiles.json:168
        "tiempo_adicional_alto_c": { value: 0, unit: "sec", min: 0, max: 3600 },  // textiles.json:175
        "presion_baja_pulso_c": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // textiles.json:181
        "tiempo_adicional_bajo_c": { value: 0, unit: "sec", min: 0, max: 3600 },  // textiles.json:188
        "conteo_pulso_d": { value: 0, unit: "", min: 0, max: 100 },  // textiles.json:194
        "presion_alta_pulso_d": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // textiles.json:200
        "tiempo_adicional_alto_d": { value: 0, unit: "sec", min: 0, max: 3600 },  // textiles.json:207
        "presion_baja_pulso_d": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // textiles.json:213
        "tiempo_adicional_bajo_d": { value: 0, unit: "sec", min: 0, max: 3600 },  // textiles.json:220
        "timeout_bajo": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // textiles.json:226
        "timeout_alto": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // textiles.json:233
        "presion_inicio_vacio": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 15 },  // textiles.json:240
        "timeout_descompresion": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // textiles.json:248
      },
      "calentamiento": {
        "temperatura_calentamiento": { value: 121.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // textiles.json:257
        "presion_add_calentamiento": { value: 11.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // textiles.json:265
        "presion_add_liquido_calentamiento": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // textiles.json:273
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // textiles.json:281
        "timeout_calentamiento": { value: 60, type: "int", unit: "min", min: 1, max: 999 },  // textiles.json:289
        "factor_calentamiento": { value: 50, type: "int", unit: "%", min: 0, max: 100 },  // textiles.json:296
        "rango_calentamiento_temp": { value: 2.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 30 },  // textiles.json:303
        "rango_calentamiento_pres": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // textiles.json:311
        "tasa_calentamiento": { value: 50.0, type: "float", unit: "°C/min", clase: "diferencia", min: 0, max: 100 },  // textiles.json:319
        "tasa_presion": { value: 100.0, type: "float", unit: "kPa/min", clase: "diferencia", min: 0, max: 300 },  // textiles.json:327
        "tiempo_estable_preesterilizacion": { value: 3, type: "int", unit: "seg", min: 0, max: 180 },  // textiles.json:335
        "intervalo_segmentos_calor": { value: 2, type: "int", unit: "seg", min: 0, max: 30 },  // textiles.json:342
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // textiles.json:349
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // textiles.json:356
        "escape_rapido_on": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // textiles.json:363
        "escape_rapido_off": { value: 10, type: "int", unit: "seg", min: 0, max: 1000 },  // textiles.json:370
        "rango_temp_estabilizacion": { value: 1.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 10 },  // textiles.json:377
        "timeout_recuperacion_estabilizacion": { value: 5, type: "int", unit: "min", min: 1, max: 60 },  // textiles.json:385
      },
      "esterilizacion": {
        "escape_lento_on_ester": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // textiles.json:394
        "escape_lento_off_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // textiles.json:401
        "escape_rapido_on_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // textiles.json:408
        "escape_rapido_off_ester": { value: 400, type: "int", unit: "seg", min: 0, max: 1000 },  // textiles.json:415
        "temperatura_esterilizacion": { value: 121.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // textiles.json:422
        "tiempo_esterilizacion": { value: 30.0, type: "float", unit: "min", min: 0, max: 9999 },  // textiles.json:430
        "factor_esterilizacion": { value: 70, type: "int", unit: "%", min: 0, max: 100 },  // textiles.json:437
        "presion_add_esterilizacion": { value: 11.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // textiles.json:444
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // textiles.json:452
        "margen_chaqueta_est": { value: 8.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 30 },  // textiles.json:460
        "intervalo_segmentos_ester": { value: 3, type: "int", unit: "seg", min: 0, max: 30 },  // textiles.json:468
        "rango_temperatura_ester": { value: 3.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 50 },  // textiles.json:475
        "rango_presion_ester": { value: 30.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // textiles.json:483
        "brecha_segura_temperatura": { value: 0.3, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // textiles.json:491
        "brecha_error_temperatura": { value: 0.1, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // textiles.json:499
        "brecha_error_presion": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 10 },  // textiles.json:507
        "brecha_segura_presion": { value: 1.5, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 20 },  // textiles.json:515
        "timeout_excursion_referencia": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // textiles.json:523
        "max_reinicios_exposicion": { value: 3, type: "int", min: 0, max: 10 },  // textiles.json:530
      },
      "secado": {
        "modo": { value: 1, type: "int", unit: "", min: 1, max: 3 },  // textiles.json:538
        "tiempo_secado": { value: 2.0, type: "float", unit: "min", min: 0, max: 120 },  // textiles.json:545
        "presion_chaqueta_secado": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // textiles.json:552
        "rango_chaqueta_secado": { value: 30, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // textiles.json:560
        "presion_baja_secado": { value: 20, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 200 },  // textiles.json:568
        "presion_alta_secado": { value: 80, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 300 },  // textiles.json:576
        "timeout_pulso": { value: 10, type: "int", unit: "seg", min: 1, max: 600 },  // textiles.json:584
      },
      "descompresion": {
        "modo": { value: 1, type: "int", unit: "", min: 0, max: 5 },  // textiles.json:593
        "tiempo_pre_despresurizacion": { value: 0, type: "int", unit: "sec", min: 0, max: 3600 },  // textiles.json:600
        "presion_fin_descompresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 20 },  // textiles.json:607
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 1, max: 1000 },  // textiles.json:615
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // textiles.json:622
        "modo_1": {
          "timeout": { value: 10, type: "int", unit: "min", min: 1, max: 3600 },  // textiles.json:630
        },
        "modo_2": {
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // textiles.json:639
        },
        "modo_3": {
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // textiles.json:648
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // textiles.json:656
        },
        "modo_4": {
          "presion_camara_enfriamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // textiles.json:665
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // textiles.json:673
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // textiles.json:681
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // textiles.json:689
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // textiles.json:696
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // textiles.json:703
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // textiles.json:711
        },
        "modo_5": {
          "presion_camara_enfriamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // textiles.json:720
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // textiles.json:728
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // textiles.json:736
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // textiles.json:744
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // textiles.json:751
          "descompresion_lenta_rapida": { value: false, type: "bool", unit: "" },  // textiles.json:758
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // textiles.json:763
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // textiles.json:771
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // textiles.json:779
        },
      },
      "finalizacion": {
        "tiempo_espera_apertura": { value: 60, type: "int", unit: "seg", min: 0, max: 3600 },  // textiles.json:789
        "temp_max_apertura": { value: 80.0, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // textiles.json:796
        "timeout_temperatura": { value: 30, type: "int", unit: "min", min: 1, max: 120 },  // textiles.json:804
        "apertura_automatica": { value: false, type: "bool", unit: "" },  // textiles.json:811
      },
    },
  },
  {
    id: "prion",  // prion.json:2
    numero: 6,
    nombreClave: "ciclos_fabrica.prion.nombre",
    displayName: "Prion 134°C",
    habilitado: false,  // prion.json:5
    sensores: {"temp_camara": "principal", "temp_2_camara": "no_en_uso", "temp_ref": "no_en_uso"},
    origen: "src/autoclave/cycles/factory/prion.json",
    parametros: {
      "globals": {
        "F0": { value: false, type: "bool" },  // prion.json:15
        "F0_objetivo": { value: 12, type: "float", unit: "min", min: 0, max: 60 },  // prion.json:16
        "ciclos_multiples": { value: true, type: "bool" },  // prion.json:17
        "presion_chaqueta": { value: 300, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 400 },  // prion.json:18
        "rango_presion_chaqueta": { value: 50, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // prion.json:19
        "delta_temp_chaqueta": { value: 1.5, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 5 },  // prion.json:20
        "margen_flujo_chaqueta": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 40 },  // prion.json:21
        "tipo_carga": { value: "solido", type: "enum", options: ["solido", "liquido"], unit: "" },  // prion.json:22
        "registro_carga_obligatorio": { value: false, type: "bool" },  // prion.json:23
        "impresion_carga": { value: "lote_elementos", type: "enum", options: ["ninguna", "lote", "lote_elementos"], unit: "" },  // prion.json:24
      },
      "precalentamiento": {
        "tiempo_precalentamiento": { value: 0, type: "int", unit: "min", min: 0, max: 3600 },  // prion.json:27
        "presion_precalentamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // prion.json:28
        "timeout_precalentamiento": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // prion.json:29
      },
      "prevacio": {
        "conteo_pulso_a": { value: 4, unit: "", min: 0, max: 100 },  // prion.json:32
        "presion_alta_pulso_a": { value: 80, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // prion.json:33
        "tiempo_adicional_alto_a": { value: 0, unit: "sec", min: 0, max: 3600 },  // prion.json:34
        "presion_baja_pulso_a": { value: 30, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // prion.json:35
        "tiempo_adicional_bajo_a": { value: 0, unit: "sec", min: 0, max: 3600 },  // prion.json:36
        "conteo_pulso_b": { value: 0, unit: "", min: 0, max: 100 },  // prion.json:38
        "presion_alta_pulso_b": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // prion.json:39
        "tiempo_adicional_alto_b": { value: 0, unit: "sec", min: 0, max: 3600 },  // prion.json:40
        "presion_baja_pulso_b": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // prion.json:41
        "tiempo_adicional_bajo_b": { value: 0, unit: "sec", min: 0, max: 3600 },  // prion.json:42
        "conteo_pulso_c": { value: 0, unit: "", min: 0, max: 100 },  // prion.json:44
        "presion_alta_pulso_c": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // prion.json:45
        "tiempo_adicional_alto_c": { value: 0, unit: "sec", min: 0, max: 3600 },  // prion.json:46
        "presion_baja_pulso_c": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // prion.json:47
        "tiempo_adicional_bajo_c": { value: 0, unit: "sec", min: 0, max: 3600 },  // prion.json:48
        "conteo_pulso_d": { value: 0, unit: "", min: 0, max: 100 },  // prion.json:51
        "presion_alta_pulso_d": { value: 160, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // prion.json:52
        "tiempo_adicional_alto_d": { value: 0, unit: "sec", min: 0, max: 3600 },  // prion.json:53
        "presion_baja_pulso_d": { value: 110, unit: "kPa", clase: "absoluto", min: 0, max: 1000 },  // prion.json:54
        "tiempo_adicional_bajo_d": { value: 0, unit: "sec", min: 0, max: 3600 },  // prion.json:55
        "timeout_bajo": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // prion.json:57
        "timeout_alto": { value: 10, type: "int", unit: "min", min: 0, max: 3600 },  // prion.json:58
        "presion_inicio_vacio": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 15 },  // prion.json:59
        "timeout_descompresion": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // prion.json:60
      },
      "calentamiento": {
        "temperatura_calentamiento": { value: 134.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // prion.json:64
        "presion_add_calentamiento": { value: 11.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // prion.json:65
        "presion_add_liquido_calentamiento": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // prion.json:66
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // prion.json:67
        "timeout_calentamiento": { value: 60, type: "int", unit: "min", min: 1, max: 999 },  // prion.json:68
        "factor_calentamiento": { value: 50, type: "int", unit: "%", min: 0, max: 100 },  // prion.json:69
        "rango_calentamiento_temp": { value: 2.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 30 },  // prion.json:70
        "rango_calentamiento_pres": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // prion.json:71
        "tasa_calentamiento": { value: 50.0, type: "float", unit: "°C/min", clase: "diferencia", min: 0, max: 100 },  // prion.json:72
        "tasa_presion": { value: 100.0, type: "float", unit: "kPa/min", clase: "diferencia", min: 0, max: 300 },  // prion.json:73
        "tiempo_estable_preesterilizacion": { value: 3, type: "int", unit: "seg", min: 0, max: 180 },  // prion.json:74
        "intervalo_segmentos_calor": { value: 2, type: "int", unit: "seg", min: 0, max: 30 },  // prion.json:75
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // prion.json:76
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // prion.json:77
        "escape_rapido_on": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // prion.json:78
        "escape_rapido_off": { value: 10, type: "int", unit: "seg", min: 0, max: 1000 },  // prion.json:79
        "rango_temp_estabilizacion": { value: 1.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 10 },  // prion.json:80
        "timeout_recuperacion_estabilizacion": { value: 5, type: "int", unit: "min", min: 1, max: 60 },  // prion.json:81
      },
      "esterilizacion": {
        "escape_lento_on_ester": { value: 1, type: "int", unit: "seg", min: 0, max: 1000 },  // prion.json:85
        "escape_lento_off_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // prion.json:86
        "escape_rapido_on_ester": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // prion.json:87
        "escape_rapido_off_ester": { value: 400, type: "int", unit: "seg", min: 0, max: 1000 },  // prion.json:88
        "temperatura_esterilizacion": { value: 134.0, type: "float", unit: "°C", clase: "absoluto", min: 100, max: 140 },  // prion.json:89
        "tiempo_esterilizacion": { value: 30, type: "float", unit: "min", min: 0, max: 9999 },  // prion.json:90
        "factor_esterilizacion": { value: 70, type: "int", unit: "%", min: 0, max: 100 },  // prion.json:91
        "presion_add_esterilizacion": { value: 15.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // prion.json:92
        "histeresis_cierre_camara": { value: 3.0, type: "float", unit: "kPa", clase: "diferencia", min: 1, max: 10 },  // prion.json:93
        "margen_chaqueta_est": { value: 8.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 30 },  // prion.json:94
        "intervalo_segmentos_ester": { value: 3, type: "int", unit: "seg", min: 0, max: 30 },  // prion.json:95
        "rango_temperatura_ester": { value: 3.0, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 50 },  // prion.json:96
        "rango_presion_ester": { value: 30.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // prion.json:97
        "brecha_segura_temperatura": { value: 0.3, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // prion.json:98
        "brecha_error_temperatura": { value: 0.1, type: "float", unit: "°C", clase: "diferencia", min: 0, max: 2 },  // prion.json:99
        "brecha_error_presion": { value: 2.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 10 },  // prion.json:100
        "brecha_segura_presion": { value: 1.5, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 20 },  // prion.json:101
        "timeout_excursion_referencia": { value: 5, type: "int", unit: "min", min: 1, max: 30 },  // prion.json:102
        "max_reinicios_exposicion": { value: 3, type: "int", min: 0, max: 10 },  // prion.json:103
      },
      "secado": {
        "modo": { value: 1, type: "int", unit: "", min: 1, max: 3 },  // prion.json:106
        "tiempo_secado": { value: 30, type: "float", unit: "min", min: 0, max: 120 },  // prion.json:107
        "presion_chaqueta_secado": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // prion.json:108
        "rango_chaqueta_secado": { value: 30, type: "int", unit: "kPa", clase: "diferencia", min: 0, max: 100 },  // prion.json:109
        "presion_baja_secado": { value: 20, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 200 },  // prion.json:110
        "presion_alta_secado": { value: 80, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 300 },  // prion.json:111
        "timeout_pulso": { value: 10, type: "int", unit: "seg", min: 1, max: 600 },  // prion.json:112
      },
      "descompresion": {
        "modo": { value: 1, type: "int", unit: "", min: 0, max: 5 },  // prion.json:115
        "tiempo_pre_despresurizacion": { value: 0, type: "int", unit: "sec", min: 0, max: 3600 },  // prion.json:118
        "presion_fin_descompresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 2, max: 20 },  // prion.json:121
        "escape_lento_on": { value: 1, type: "int", unit: "seg", min: 1, max: 1000 },  // prion.json:124
        "escape_lento_off": { value: 0, type: "int", unit: "seg", min: 0, max: 1000 },  // prion.json:131
        "modo_1": {
          "timeout": { value: 10, type: "int", unit: "min", min: 1, max: 3600 },  // prion.json:139
        },
        "modo_2": {
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // prion.json:142
        },
        "modo_3": {
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // prion.json:145
          "timeout": { value: 30, type: "int", unit: "min", min: 1, max: 3600 },  // prion.json:146
        },
        "modo_4": {
          "presion_camara_enfriamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // prion.json:149
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // prion.json:150
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // prion.json:151
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // prion.json:152
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // prion.json:153
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // prion.json:154
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // prion.json:155
        },
        "modo_5": {
          "presion_camara_enfriamiento": { value: 200, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // prion.json:158
          "temperatura_enfriamiento": { value: 80, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // prion.json:159
          "presion_despresurizacion_chaqueta": { value: 20.0, type: "float", unit: "kPa", clase: "diferencia", min: 5, max: 50 },  // prion.json:160
          "timeout_despresurizacion_chaqueta": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // prion.json:161
          "timeout_presurizacion_enfriamiento": { value: 3, type: "int", unit: "min", min: 1, max: 15 },  // prion.json:162
          "descompresion_lenta_rapida": { value: false, type: "bool", unit: "" },  // prion.json:163
          "presion_cambio": { value: 150, type: "int", unit: "kPa", clase: "absoluto", min: 0, max: 500 },  // prion.json:164
          "margen_fallo_contrapresion": { value: 10.0, type: "float", unit: "kPa", clase: "diferencia", min: 0, max: 30 },  // prion.json:165
          "timeout": { value: 120, type: "int", unit: "min", min: 1, max: 3600 },  // prion.json:166
        },
      },
      "finalizacion": {
        "tiempo_espera_apertura": { value: 60, type: "int", unit: "seg", min: 0, max: 3600 },  // prion.json:170
        "temp_max_apertura": { value: 80.0, type: "float", unit: "°C", clase: "absoluto", min: 0, max: 150 },  // prion.json:171
        "timeout_temperatura": { value: 30, type: "int", unit: "min", min: 1, max: 120 },  // prion.json:172
        "apertura_automatica": { value: false, type: "bool", unit: "" },  // prion.json:173
      },
    },
  },
];
