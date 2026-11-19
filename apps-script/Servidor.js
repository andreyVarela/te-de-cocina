/** @OnlyCurrentDoc */
// ↑ Limita el permiso a ESTA hoja (spreadsheets.currentonly). No quitar: sin él, Google pediría
//   acceso a todas las hojas de cálculo de Andrey.
// ============================================================================================
// Servidor.js · capa fina con APIs de Google (contrato §5, §6 y §8).
// doGet → `ver` · doPost → `apartar` / `soltar` · setup() → prepara la hoja (idempotente).
// Toda la decisión de negocio vive en Logica.js. Aquí: leer la hoja, lock, caché, escribir.
// Solo usa SpreadsheetApp (la hoja ligada), LockService, CacheService, ContentService y Utilities.
// `CATALOGO` lo agrega el build al generar Code.gs.
// ============================================================================================

var ZONA_HORARIA = 'America/Costa_Rica';
var HOJA = Object.freeze({ ARTICULOS: 'articulos', REGISTROS: 'registros', RESUMEN: 'resumen' });
var ENCABEZADOS = Object.freeze({
  articulos: ['id', 'que', 'producto', 'cantidad', 'orden', 'activo'],
  registros: ['id_articulo', 'tipo', 'nombre', 'hash_token', 'creado', 'estado', 'liberado', 'origen'],
});
var MARCA_PROTECCION = 'tdc: ';

// ------------------------------------------------------------------ entradas HTTP

function doGet(e) {
  return responder_(atender_(function () { return accionGet_(e); }));
}

function doPost(e) {
  return responder_(atender_(function () { return accionPost_(e); }));
}

function atender_(fn) {
  try {
    return fn();
  } catch (err) {
    // Nunca se registra el token ni el cuerpo: solo el error.
    console.error('error_interno: ' + (err && err.stack ? err.stack : err));
    return fallo('error_interno');
  }
}

/** Siempre HTTP 200 con JSON (Apps Script no deja fijar el status). Acepta objeto o JSON ya hecho. */
function responder_(respuesta) {
  var cuerpo = typeof respuesta === 'string' ? respuesta : JSON.stringify(respuesta);
  return ContentService.createTextOutput(cuerpo).setMimeType(ContentService.MimeType.JSON);
}

function accionGet_(e) {
  var p = (e && e.parameter) || {};
  if (p.accion !== 'ver') return fallo('accion_invalida');
  return ver_(p.token);
}

function accionPost_(e) {
  var contenido = e && e.postData && typeof e.postData.contents === 'string' ? e.postData.contents : '';
  if (!contenido || contenido.length > LIMITES.MAX_CUERPO_CARACTERES) return fallo('entrada_invalida', { campo: 'cuerpo' });
  var cuerpo;
  try {
    cuerpo = JSON.parse(contenido);
  } catch (err) {
    return fallo('entrada_invalida', { campo: 'cuerpo' });
  }
  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) return fallo('entrada_invalida', { campo: 'cuerpo' });
  if (cuerpo.accion === 'apartar') return apartar_(cuerpo);
  if (cuerpo.accion === 'soltar') return soltar_(cuerpo);
  return fallo('accion_invalida');
}

// ------------------------------------------------------------------ acciones

/** `ver`: sin lock; caché de 5 s por (generación, hash|anon). Token inválido = anónimo, no error. */
function ver_(token) {
  var hash = typeof token === 'string' && RE_TOKEN.test(token) ? sha256Hex_(token) : null;
  var cache = CacheService.getScriptCache();
  var clave = 'ver:' + (cache.get('ver:gen') || '0') + ':' + (hash || 'anon');
  var guardado = cache.get(clave);
  if (guardado) return guardado;

  var libro = libro_();
  var articulos = normalizarArticulos(leerTabla_(libro, HOJA.ARTICULOS).filas);
  var registros = normalizarRegistros(leerTabla_(libro, HOJA.REGISTROS).filas);
  var json = JSON.stringify(proyectarPublico(articulos, registros, hash, new Date()));
  try {
    cache.put(clave, json, LIMITES.CACHE_VER_SEGUNDOS);
  } catch (err) {
    console.warn('No se pudo guardar ver en caché: ' + err);
  }
  return json;
}

function apartar_(cuerpo) {
  var libro = libro_();
  var articulos = normalizarArticulos(leerTabla_(libro, HOJA.ARTICULOS).filas);
  var prep = prepararApartar(cuerpo, articulos, sha256Hex_);
  if (!prep.ok) return prep;
  var entrada = prep.entrada;

  return conLock_(function () {
    var limite = aplicarFrecuencia_(entrada.hash);
    if (limite) return limite;
    var tabla = leerTabla_(libro, HOJA.REGISTROS);
    var decision = decidirApartar(normalizarRegistros(tabla.filas), entrada, LIMITES);
    if (decision.accion === 'insertar') {
      var fila = decision.fila;
      var valores = {
        id_articulo: fila.id_articulo,
        tipo: fila.tipo,
        nombre: textoSeguroParaCelda(fila.nombre),
        hash_token: fila.hash_token,
        creado: new Date(),
        estado: fila.estado,
        liberado: '',
        origen: fila.origen,
      };
      var arreglo = [];
      for (var i = 0; i < tabla.ancho; i++) arreglo.push('');
      Object.keys(valores).forEach(function (k) { arreglo[tabla.indice[k]] = valores[k]; });
      tabla.hoja.appendRow(arreglo);
      SpreadsheetApp.flush();
      invalidarVer_();
    }
    return decision.respuesta;
  });
}

function soltar_(cuerpo) {
  var libro = libro_();
  var articulos = normalizarArticulos(leerTabla_(libro, HOJA.ARTICULOS).filas);
  var prep = prepararSoltar(cuerpo, articulos, sha256Hex_);
  if (!prep.ok) return prep;
  var entrada = prep.entrada;

  return conLock_(function () {
    var limite = aplicarFrecuencia_(entrada.hash);
    if (limite) return limite;
    var tabla = leerTabla_(libro, HOJA.REGISTROS);
    var decision = decidirSoltar(normalizarRegistros(tabla.filas), entrada);
    if (decision.filas.length) {
      var ahora = new Date();
      decision.filas.forEach(function (n) {
        // Comprobación: la fila sigue siendo de este artículo y este dispositivo (por si Andrey
        // borró filas mientras tanto). Si no, se aborta sin tocar nada.
        var actual = tabla.hoja.getRange(n, 1, 1, tabla.ancho).getValues()[0];
        var id = String(actual[tabla.indice.id_articulo]).trim().toLowerCase();
        var h = String(actual[tabla.indice.hash_token]).trim().toLowerCase();
        if (id !== entrada.articulo || h !== entrada.hash) throw new Error('La fila ' + n + ' cambió durante soltar');
        // Primero la fecha: si falla la segunda escritura, la fila sigue activa y reintentar la repara.
        tabla.hoja.getRange(n, tabla.indice.liberado + 1).setValue(ahora);
        tabla.hoja.getRange(n, tabla.indice.estado + 1).setValue('liberado');
      });
      SpreadsheetApp.flush();
      invalidarVer_();
    }
    return decision.respuesta;
  });
}

// ------------------------------------------------------------------ lock, frecuencia, caché, hash

function conLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LIMITES.LOCK_MS)) {
    return fallo('demasiadas_solicitudes', { motivo: 'ocupado', reintentar_en_s: 3 });
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/** Devuelve el error de frecuencia o null. Se llama dentro del lock. */
function aplicarFrecuencia_(hash) {
  var cache = CacheService.getScriptCache();
  var kd = 'rl:d:' + hash;
  var kg = 'rl:g';
  var actuales = cache.getAll([kd, kg]) || {};
  var r = controlFrecuencia(actuales[kd], actuales[kg], Date.now(), LIMITES);
  if (!r.ok) return r.error;
  cache.put(kd, r.dispositivo.valor, r.dispositivo.ttl_s);
  cache.put(kg, r.global.valor, r.global.ttl_s);
  return null;
}

function invalidarVer_() {
  // La escritura ya quedó en la hoja: un fallo de caché no debe convertirla en error_interno.
  try {
    CacheService.getScriptCache().put('ver:gen', String(Date.now()), 21600);
  } catch (e) {
    console.warn('No se pudo invalidar la caché de ver: ' + e);
  }
}

function sha256Hex_(texto) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = (bytes[i] + 256) % 256;
    hex += (b < 16 ? '0' : '') + b.toString(16);
  }
  return hex;
}

// ------------------------------------------------------------------ lectura de la hoja por encabezado

function libro_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  if (!libro) throw new Error('El script no está ligado a una hoja (ábrelo desde Extensiones → Apps Script).');
  return libro;
}

/** Lee una pestaña completa y la devuelve como objetos por encabezado (+ `fila`). */
function leerTabla_(libro, nombre) {
  var hoja = libro.getSheetByName(nombre);
  if (!hoja) throw new Error('Falta la pestaña «' + nombre + '». Corre setup().');
  var valores = hoja.getDataRange().getValues();
  var encabezados = (valores[0] || []).map(function (h) { return String(h).trim(); });
  var indice = {};
  encabezados.forEach(function (h, i) { if (h && !(h in indice)) indice[h] = i; });
  ENCABEZADOS[nombre].forEach(function (h) {
    if (!(h in indice)) throw new Error('Falta el encabezado «' + h + '» en «' + nombre + '». Corre setup().');
  });
  var filas = [];
  for (var r = 1; r < valores.length; r++) {
    var obj = { fila: r + 1 };
    ENCABEZADOS[nombre].forEach(function (h) { obj[h] = valores[r][indice[h]]; });
    filas.push(obj);
  }
  return { hoja: hoja, indice: indice, ancho: Math.max(encabezados.length, 1), filas: filas };
}

// ------------------------------------------------------------------ setup() (idempotente)

/**
 * Prepara la hoja. Se puede correr las veces que haga falta (también después de cambiar el
 * catálogo). No borra ni reordena registros: solo agrega lo que falte y actualiza `articulos`.
 */
function setup() {
  var libro = libro_();
  try {
    libro.setSpreadsheetTimeZone(ZONA_HORARIA);
  } catch (err) {
    console.warn('No pude fijar la zona horaria; ponla a mano en Archivo → Configuración: ' + err);
  }

  var articulos = prepararArticulos_(libro);
  var registros = prepararRegistros_(libro);
  prepararResumen_(libro, articulos, registros);
  invalidarVer_();
  SpreadsheetApp.flush();

  var activos = articulos.filter(function (a) { return a.activo === 'si'; }).length;
  var msg = 'Listo: ' + activos + ' artículos activos de ' + articulos.length + ' en «articulos». '
    + 'Pestañas «registros» y «resumen» listas. Zona horaria: ' + libro.getSpreadsheetTimeZone() + '.';
  console.log(msg);
  return msg;
}

function hojaO_(libro, nombre) {
  return libro.getSheetByName(nombre) || libro.insertSheet(nombre);
}

/** Asegura los encabezados en la fila 1 sin mover columnas existentes. Devuelve el índice (base 1). */
function asegurarEncabezados_(hoja, requeridos) {
  var ancho = Math.max(hoja.getLastColumn(), 1);
  var actuales = hoja.getRange(1, 1, 1, ancho).getValues()[0].map(function (h) { return String(h).trim(); });
  if (actuales.every(function (h) { return h === ''; })) actuales = [];
  var faltan = requeridos.filter(function (h) { return actuales.indexOf(h) === -1; });
  if (faltan.length) {
    hoja.getRange(1, actuales.length + 1, 1, faltan.length).setValues([faltan]);
    actuales = actuales.concat(faltan);
  }
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, actuales.length).setFontWeight('bold');
  var col = {};
  actuales.forEach(function (h, i) { if (h && !(h in col)) col[h] = i + 1; });
  return col;
}

function proteger_(rangoOHoja, descripcion) {
  var p = rangoOHoja.protect();
  p.setDescription(MARCA_PROTECCION + descripcion);
  p.setWarningOnly(true);
}

function quitarProteccionesPropias_(libro) {
  [SpreadsheetApp.ProtectionType.SHEET, SpreadsheetApp.ProtectionType.RANGE].forEach(function (tipo) {
    libro.getProtections(tipo).forEach(function (p) {
      if (String(p.getDescription()).indexOf(MARCA_PROTECCION) === 0) p.remove();
    });
  });
}

/** Upsert de CATALOGO por `id`: actualiza textos, `activo = si`; lo que ya no está queda `activo = no`. */
function prepararArticulos_(libro) {
  if (typeof CATALOGO === 'undefined' || !CATALOGO.length) {
    throw new Error('Falta CATALOGO: pega apps-script/Code.gs completo (lo genera node scripts/build.mjs).');
  }
  quitarProteccionesPropias_(libro);
  var hoja = hojaO_(libro, HOJA.ARTICULOS);
  var col = asegurarEncabezados_(hoja, ENCABEZADOS.articulos);
  var ancho = hoja.getLastColumn();
  var ultima = hoja.getLastRow();
  var datos = ultima > 1 ? hoja.getRange(2, 1, ultima - 1, ancho).getValues() : [];

  var porId = {};
  datos.forEach(function (fila, i) {
    var id = String(fila[col.id - 1]).trim().toLowerCase();
    if (id && !(id in porId)) porId[id] = i;
  });
  var enCatalogo = {};
  CATALOGO.forEach(function (a) {
    enCatalogo[a.id] = true;
    var i = porId[a.id];
    if (i === undefined) {
      var nueva = [];
      for (var k = 0; k < ancho; k++) nueva.push('');
      datos.push(nueva);
      i = datos.length - 1;
      porId[a.id] = i;
    }
    var f = datos[i];
    f[col.id - 1] = a.id;
    f[col.que - 1] = textoSeguroParaCelda(a.que);
    f[col.producto - 1] = textoSeguroParaCelda(a.producto);
    f[col.cantidad - 1] = a.cantidad;
    f[col.orden - 1] = a.orden;
    f[col.activo - 1] = 'si';
  });
  datos.forEach(function (f) {
    var id = String(f[col.id - 1]).trim().toLowerCase();
    if (id && !enCatalogo[id]) f[col.activo - 1] = 'no';
  });
  if (datos.length) {
    hoja.getRange(2, col.id, datos.length, 1).setNumberFormat('@');
    hoja.getRange(2, 1, datos.length, ancho).setValues(datos);
  }
  proteger_(hoja, 'la escribe setup() desde catalogo.json; no la edites a mano');

  return datos.map(function (f) {
    return {
      id: String(f[col.id - 1]).trim().toLowerCase(),
      que: String(f[col.que - 1]),
      producto: String(f[col.producto - 1]),
      orden: Number(f[col.orden - 1]),
      activo: String(f[col.activo - 1]).trim().toLowerCase(),
    };
  }).sort(function (a, b) { return a.orden - b.orden; });
}

function prepararRegistros_(libro) {
  var hoja = hojaO_(libro, HOJA.REGISTROS);
  var col = asegurarEncabezados_(hoja, ENCABEZADOS.registros);
  var filasNecesarias = LIMITES.MAX_FILAS_REGISTROS + 1;
  if (hoja.getMaxRows() < filasNecesarias) hoja.insertRowsAfter(hoja.getMaxRows(), filasNecesarias - hoja.getMaxRows());
  var n = hoja.getMaxRows() - 1;

  function lista_(nombre, valores) {
    var regla = SpreadsheetApp.newDataValidation().requireValueInList(valores, true).setAllowInvalid(false)
      .setHelpText('Opciones: ' + valores.join(' / ')).build();
    hoja.getRange(2, col[nombre], n, 1).setDataValidation(regla);
  }
  lista_('tipo', ['apartado', 'parecido']);
  lista_('estado', ['activo', 'liberado']);
  lista_('origen', ['invitado', 'admin']);
  ['id_articulo', 'nombre', 'hash_token'].forEach(function (h) { hoja.getRange(2, col[h], n, 1).setNumberFormat('@'); });
  ['creado', 'liberado'].forEach(function (h) { hoja.getRange(2, col[h], n, 1).setNumberFormat('d/m/yyyy h:mm am/pm'); });
  proteger_(hoja.getRange(1, 1, 1, hoja.getLastColumn()), 'encabezados: no los renombres (el script busca columnas por nombre)');
  return col;
}

/** Reescribe por completo la pestaña `resumen` (solo lectura, todo con fórmulas). */
function prepararResumen_(libro, articulos, colReg) {
  var hoja = hojaO_(libro, HOJA.RESUMEN);
  hoja.clear();
  hoja.clearConditionalFormatRules();
  var colArt = asegurarColumnasArticulos_(libro);

  var R = function (h) { var l = letraColumna(colReg[h]); return 'registros!$' + l + '$2:$' + l; };
  var A = function (h) { var l = letraColumna(colArt[h]); return 'articulos!$' + l + '$2:$' + l; };
  var activoReg = '((' + R('estado') + '="activo")+(' + R('estado') + '=""))';

  var activos = articulos.filter(function (a) { return a.activo === 'si'; });
  var primera = 5;
  var ultima = primera + Math.max(activos.length, 1) - 1;

  // Separador: la hoja en español usa «;». Se prueba con la cabecera y, si da error de fórmula, «,».
  var cabecera = '="Apartados: "&COUNTIF($D$' + primera + ':$D$' + ultima + ';"<>—")&" de "&COUNTIF('
    + A('activo') + ';"si")&" · Parecidos: "&(COUNTIFS(' + R('tipo') + ';"parecido";' + R('estado') + ';"activo")+COUNTIFS('
    + R('tipo') + ';"parecido";' + R('estado') + ';"";' + R('id_articulo') + ';"<>"))';
  var sep = elegirSeparador_(hoja.getRange('A1'), cabecera);
  var F = function (f) { return formulaConSeparador(f, sep); };

  hoja.getRange('A2').setValue('Solo lectura: se calcula sola. Para corregir algo, edita la pestaña «registros».');
  hoja.getRange(4, 1, 1, 6).setValues([['id', 'Artículo', 'Producto', 'Apartado por', 'Parecidos', 'Alerta']]).setFontWeight('bold');

  var filas = activos.map(function (a, i) {
    var r = primera + i;
    var cond = R('id_articulo') + '=$A' + r;
    return [
      a.id, a.que, a.producto,
      F('=IFERROR(INDEX(FILTER(' + R('nombre') + ';' + cond + ';' + R('tipo') + '="apartado";' + activoReg + ');1);"—")'),
      F('=IFERROR(TEXTJOIN(", ";TRUE;FILTER(' + R('nombre') + ';' + cond + ';' + R('tipo') + '="parecido";' + activoReg + '));"")'),
      F('=IF(COUNTIFS(' + R('id_articulo') + ';$A' + r + ';' + R('tipo') + ';"apartado";' + R('estado') + ';"activo")+COUNTIFS('
        + R('id_articulo') + ';$A' + r + ';' + R('tipo') + ';"apartado";' + R('estado') + ';"")>1;"Duplicado: libera uno en registros";"")'),
    ];
  });
  if (filas.length) {
    hoja.getRange(primera, 1, filas.length, 3).setValues(filas.map(function (f) { return f.slice(0, 3); }));
    hoja.getRange(primera, 4, filas.length, 3).setFormulas(filas.map(function (f) { return f.slice(3); }));
  }

  var fDesconocidos = ultima + 2;
  hoja.getRange(fDesconocidos, 1).setValue('Filas de «registros» con id_articulo que no existe:').setFontWeight('bold');
  hoja.getRange(fDesconocidos, 4).setFormula(F('=ARRAYFORMULA(IFERROR(TEXTJOIN(", ";TRUE;FILTER("fila "&ROW('
    + R('id_articulo') + ');' + R('id_articulo') + '<>"";ISNA(MATCH(' + R('id_articulo') + ';' + A('id') + ';0))));"Ninguna"))'));

  // Bitácora: lo último primero, con fecha y hora de Costa Rica.
  var fBitacora = fDesconocidos + 2;
  var ultimaCol = letraColumna(Math.max.apply(null, ENCABEZADOS.registros.map(function (h) { return colReg[h]; })));
  var q = function (h) { return letraColumna(colReg[h]); };
  hoja.getRange(fBitacora, 1).setValue('Bitácora (activos, lo último primero)').setFontWeight('bold');
  hoja.getRange(fBitacora + 1, 1).setFormula(F('=QUERY(registros!A:' + ultimaCol + ';"select ' + [q('id_articulo'), q('tipo'),
    q('nombre'), q('creado'), q('origen')].join(', ') + ' where ' + q('id_articulo') + ' is not null and (' + q('estado')
    + ' = \'activo\' or ' + q('estado') + ' is null) order by ' + q('creado') + ' desc";1)'));
  // Una hoja nueva trae 1000 filas: hay que crecerla antes de formatear la bitácora completa.
  var hasta = fBitacora + 1 + LIMITES.MAX_FILAS_REGISTROS;
  if (hoja.getMaxRows() < hasta) hoja.insertRowsAfter(hoja.getMaxRows(), hasta - hoja.getMaxRows());
  hoja.getRange(fBitacora + 2, 4, LIMITES.MAX_FILAS_REGISTROS, 1).setNumberFormat('d/m/yyyy h:mm am/pm');

  // Duplicado: texto + rojo (el color es solo refuerzo).
  var regla = SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('Duplicado')
    .setFontColor('#B8432C').setBold(true).setRanges([hoja.getRange(primera, 6, Math.max(activos.length, 1), 1)]).build();
  hoja.setConditionalFormatRules([regla]);
  hoja.setFrozenRows(4);
  hoja.getRange('A1').setFontWeight('bold');
  hoja.setColumnWidth(1, 130);
  hoja.setColumnWidth(2, 220);
  hoja.setColumnWidth(3, 220);
  hoja.setColumnWidth(4, 170);
  hoja.setColumnWidth(5, 220);
  hoja.setColumnWidth(6, 120);
  proteger_(hoja, 'resumen calculado; edita «registros» para corregir');
}

function asegurarColumnasArticulos_(libro) {
  return asegurarEncabezados_(libro.getSheetByName(HOJA.ARTICULOS), ENCABEZADOS.articulos);
}

/** Escribe la fórmula con «;»; si Sheets la rechaza (#ERROR!), usa «,». Devuelve el separador. */
function elegirSeparador_(celda, formulaPuntoYComa) {
  celda.setFormula(formulaPuntoYComa);
  SpreadsheetApp.flush();
  if (String(celda.getDisplayValue()).indexOf('#ERROR') !== 0) return ';';
  celda.setFormula(formulaConSeparador(formulaPuntoYComa, ','));
  SpreadsheetApp.flush();
  if (String(celda.getDisplayValue()).indexOf('#ERROR') === 0) {
    throw new Error('Sheets rechazó la fórmula del resumen con «;» y con «,». Revisa la configuración regional de la hoja.');
  }
  return ',';
}
