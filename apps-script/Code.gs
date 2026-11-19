/** @OnlyCurrentDoc */
// GENERADO por scripts/build.mjs: no editar a mano. Se edita apps-script/Logica.js,
// apps-script/Servidor.js o catalogo.json y se corre: node scripts/build.mjs
// Cómo se usa: copiar TODO este archivo y pegarlo en Extensiones → Apps Script → Código.gs (README).
// Artículos: 36. Huella: 4aba371caef4

// ===================================================================== catálogo (desde catalogo.json)
const CATALOGO = [
  {"id":"sarten-20","que":"Sartén antiadherente 20 cm","producto":"Sartén antiadherente aluminio 20cm","cantidad":1,"orden":1},
  {"id":"sarten-24","que":"Sartén antiadherente 24 cm","producto":"Sartén antiadherente aluminio 24cm","cantidad":1,"orden":2},
  {"id":"olla-tapa-20","que":"Olla con tapa","producto":"Olla antiadherente con tapa aluminio 20cm","cantidad":1,"orden":3},
  {"id":"arrocera","que":"Olla arrocera","producto":"Olla arrocera 10 tazas Westinghouse","cantidad":1,"orden":4},
  {"id":"hervidor","que":"Hervidor eléctrico","producto":"Tetera eléctrica 1.8lt 1200w","cantidad":1,"orden":5},
  {"id":"licuadora","que":"Licuadora","producto":"Licuadora jarra plástica 1.5lt 600w","cantidad":1,"orden":6},
  {"id":"cuchillo-chef","que":"Cuchillo de chef","producto":"Cuchillo chef acero inoxidable 8in","cantidad":1,"orden":7},
  {"id":"tabla-bambu","que":"Tabla de picar de bambú","producto":"Tabla picar bambú 30x23cm","cantidad":1,"orden":8},
  {"id":"utensilios-bambu","que":"Utensilios de bambú","producto":"Utensilios cocina bambú 30cm 3unds","cantidad":1,"orden":9},
  {"id":"hermeticos","que":"Recipientes herméticos","producto":"Recipiente hermético cuadrado vidrio 0.32-0.8lt 2pcs","cantidad":1,"orden":10},
  {"id":"refractario","que":"Refractario de vidrio","producto":"Refractario rectangular vidrio borosilicato 1.6lt-3lt 2pcs","cantidad":1,"orden":11},
  {"id":"escurridor","que":"Escurridor de platos","producto":"Escurridor platos con bandeja plástico 35x31x13cm 2pcs","cantidad":1,"orden":12},
  {"id":"basurero-cocina","que":"Basurero de cocina con pedal","producto":"Basurero manual y pedal plástico 10lt","cantidad":1,"orden":13},
  {"id":"panos","que":"Paños de cocina","producto":"Paño microfibra 40x40cm 15unds","cantidad":1,"orden":14},
  {"id":"vajilla","que":"Vajilla","producto":"Vajilla cerámica 12pcs","cantidad":1,"orden":15},
  {"id":"bowls","que":"Bowls para ramen o sopa (2)","producto":"Bowl grande temperado 9in","cantidad":2,"orden":16},
  {"id":"cubiertos","que":"Cubiertos para 4","producto":"Cubiertos imitación madera acero inoxidable 16pcs","cantidad":1,"orden":17},
  {"id":"palillos","que":"Palillos (chopsticks)","producto":"Palillos chinos madera 200unds","cantidad":1,"orden":18},
  {"id":"vasos","que":"Vasos","producto":"Vaso liso vidrio 14oz 3unds","cantidad":1,"orden":19},
  {"id":"tazas","que":"Tazas (4)","producto":"Taza básica blanca 324.4ml","cantidad":4,"orden":20},
  {"id":"tetera","que":"Tetera","producto":"Tetera acero inoxidable 2.5lt","cantidad":1,"orden":21},
  {"id":"escoba","que":"Escoba","producto":"Escoba y palo madera 120cm","cantidad":1,"orden":22},
  {"id":"pala","que":"Pala para basura","producto":"Pala basura plástica 27.5x21x80cm","cantidad":1,"orden":23},
  {"id":"mopa","que":"Mopa de microfibra (que no suelte pelusa)","producto":"Mopa limpieza plana poliéster 43x14x5cm","cantidad":1,"orden":24},
  {"id":"balde","que":"Balde","producto":"Balde 18 litros con agarradera","cantidad":1,"orden":25},
  {"id":"tendedero","que":"Tendedero plegable","producto":"Tendedero vertical plástico y acero 68x68x170cm","cantidad":1,"orden":26},
  {"id":"plancha","que":"Plancha","producto":"Plancha vapor Westinghouse 1200w","cantidad":1,"orden":27},
  {"id":"toallas","que":"Toallas de baño (2)","producto":"Toalla baño blanca Algodón 68x135cm","cantidad":2,"orden":28},
  {"id":"cortina-bano","que":"Cortina de baño","producto":"Cortina baño tela poliéster 180x180cm","cantidad":1,"orden":29},
  {"id":"accesorios-bano","que":"Set de accesorios de baño","producto":"Dispensador jabón con base vidrio 3pcs","cantidad":1,"orden":30},
  {"id":"basurero-bano","que":"Basurero de baño","producto":"Basurero redondo tapa vaivén plástico 9lt","cantidad":1,"orden":31},
  {"id":"cepillo-inodoro","que":"Cepillo para inodoro","producto":"Cepillo inodoro plástico 12x12x37cm 2pcs","cantidad":1,"orden":32},
  {"id":"tapete","que":"Tapete de entrada","producto":"Alfombra entrada fibra coco y caucho 40x60cm","cantidad":1,"orden":33},
  {"id":"bambu-suerte","que":"Bambú de la suerte","producto":"Lucky bambú 10 cm","cantidad":1,"orden":34},
  {"id":"incienso","que":"Incienso","producto":"Incienso","cantidad":1,"orden":35},
  {"id":"despensa","que":"Algo para la despensa (arroz, té verde, aceite…)","producto":"Arroz 99% entero Don Pedro 1.8kg","cantidad":1,"orden":36}
];

// ============================================================================================
// Logica.js · reglas de negocio PURAS del Té de cocina (contrato §5 y §6).
// Sin APIs de Google: se prueba en Node (tests/logica.test.mjs) y el build la concatena en
// apps-script/Code.gs. Servidor.js solo lee la hoja, llama a estas funciones y escribe lo que digan.
// Regla de oro: aquí no se lee la hoja, ni la caché, ni el reloj (la hora entra por parámetro).
// ============================================================================================

var LIMITES = Object.freeze({
  TOPE_APARTADOS_POR_DISPOSITIVO: 5,
  MAX_ESCRITURAS_POR_MINUTO_DISPOSITIVO: 6,
  MAX_ESCRITURAS_POR_MINUTO_GLOBAL: 15,
  MAX_FILAS_REGISTROS: 2000,
  CACHE_VER_SEGUNDOS: 5,
  LOCK_MS: 10000,
  VENTANA_FRECUENCIA_S: 60,
  MAX_CUERPO_CARACTERES: 4000,
});

var TIPOS = ['apartado', 'parecido'];
var RE_TOKEN = /^[0-9a-f]{64}$/;
var RE_CONTROL = /[\u0000-\u001F\u007F]/;
var RE_LETRA = /\p{L}/u;

// Mensajes sugeridos (copy final: AURORA con IRIS). `codigo` y `datos` son contrato; esto no.
var MENSAJES = Object.freeze({
  accion_invalida: 'Esa acción no existe. Recarga la página e intenta de nuevo.',
  entrada_invalida: 'Faltan datos en la solicitud. Recarga la página e intenta de nuevo.',
  articulo_invalido: 'Ese artículo ya no está en la lista.',
  nombre_invalido: 'Escribe tu nombre (2 a 40 letras).',
  tipo_invalido: 'Opción no válida. Recarga la página e intenta de nuevo.',
  token_invalido: 'Recarga la página e intenta de nuevo.',
  ya_apartado: 'Alguien acaba de apartar este. Puedes elegir otro o marcar "Llevo algo parecido".',
  ya_registrado_distinto: 'Ya marcaste este artículo de otra forma. Suéltalo primero.',
  tope_dispositivo: 'Ya apartaste 5. Suelta uno para apartar otro.',
  demasiadas_solicitudes: 'Espera un momento e intenta de nuevo.',
  lista_cerrada: 'La lista está cerrada por ahora. Avísale a Andrey.',
  error_interno: 'Algo falló. Intenta de nuevo o avísale a Andrey.',
});

/** Sobre de error del contrato §6: { ok:false, codigo, mensaje, datos }. */
function fallo(codigo, datos, mensaje) {
  return {
    ok: false,
    codigo: codigo,
    mensaje: mensaje || MENSAJES[codigo] || MENSAJES.error_interno,
    datos: datos || {},
  };
}

// ------------------------------------------------------------------ normalización de la hoja

function texto_(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function clave_(v) {
  return texto_(v).toLowerCase();
}

/**
 * Filas de la pestaña `articulos` (objetos por encabezado) → [{ id, orden, activo }] en `orden`.
 * `activo` es falso solo si la celda dice «no» (o FALSE): así un «Sí» escrito a mano no rompe nada.
 */
function normalizarArticulos(filas) {
  var lista = [];
  (filas || []).forEach(function (f, i) {
    var id = clave_(f.id);
    if (!id) return;
    var act = clave_(f.activo);
    var orden = Number(f.orden);
    lista.push({
      id: id,
      orden: isFinite(orden) && texto_(f.orden) !== '' ? orden : 100000 + i,
      activo: !(act === 'no' || act === 'false'),
    });
  });
  lista.sort(function (a, b) { return a.orden - b.orden; });
  return lista;
}

/**
 * Filas de la pestaña `registros` (objetos por encabezado + `fila` = número de fila en la hoja)
 * → registros normalizados. Hoja a prueba de Andrey: `estado` vacío = activo, mayúsculas y
 * espacios no importan, filas sin `id_articulo` se ignoran.
 */
function normalizarRegistros(filas) {
  var lista = [];
  (filas || []).forEach(function (f) {
    var id = clave_(f.id_articulo);
    if (!id) return;
    var estado = clave_(f.estado);
    lista.push({
      fila: f.fila,
      id_articulo: id,
      tipo: clave_(f.tipo),
      nombre: texto_(f.nombre),
      hash_token: clave_(f.hash_token),
      estado: estado === '' ? 'activo' : estado,
      origen: clave_(f.origen),
    });
  });
  return lista;
}

function esActivo_(r) {
  return r.estado === 'activo' && TIPOS.indexOf(r.tipo) !== -1;
}

// ------------------------------------------------------------------ validaciones (una sola fuente)

/**
 * Valida el token de dispositivo y devuelve su hash. `hashear(texto) → hex64` lo inyecta quien
 * llama (Servidor.js usa SHA-256 de Utilities; las pruebas, node:crypto). Nunca se guarda el token.
 */
function validarToken(token, hashear) {
  if (typeof token !== 'string' || !RE_TOKEN.test(token)) return fallo('token_invalido');
  return { ok: true, hash: String(hashear(token)).toLowerCase() };
}

/** Recorta, rechaza control, colapsa espacios internos y mide en caracteres reales (emoji = 1). */
function validarNombre(nombre) {
  if (typeof nombre !== 'string') return fallo('nombre_invalido', { motivo: 'corto' });
  var recortado = nombre.trim();
  var limpio = recortado.replace(/\s+/g, ' ');
  var largo = Array.from(limpio).length;
  if (largo < 2) return fallo('nombre_invalido', { motivo: 'corto' });
  if (largo > 40) return fallo('nombre_invalido', { motivo: 'largo' });
  if (RE_CONTROL.test(recortado) || !RE_LETRA.test(limpio)) {
    return fallo('nombre_invalido', { motivo: 'caracteres' });
  }
  return { ok: true, nombre: limpio };
}

/** Primera palabra del nombre. Si Andrey dejó el nombre vacío en la hoja, «Alguien». */
function nombrePila(nombre) {
  var t = texto_(nombre);
  if (!t) return 'Alguien';
  return t.split(/\s+/)[0];
}

function validarArticulo(id, articulos) {
  var buscado = clave_(id);
  for (var i = 0; i < articulos.length; i++) {
    if (articulos[i].id === buscado) {
      return articulos[i].activo ? { ok: true, id: buscado } : fallo('articulo_invalido');
    }
  }
  return fallo('articulo_invalido');
}

function esObjeto_(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function faltaCampo_(cuerpo, campos) {
  for (var i = 0; i < campos.length; i++) {
    var v = cuerpo[campos[i]];
    if (typeof v !== 'string') return fallo('entrada_invalida', { campo: campos[i] });
  }
  return null;
}

/**
 * Valida el cuerpo de `apartar` en el orden del contrato:
 * campos → tipo → artículo → nombre → token. Devuelve { ok, entrada:{articulo,nombre,tipo,hash} }.
 */
function prepararApartar(cuerpo, articulos, hashear) {
  if (!esObjeto_(cuerpo)) return fallo('entrada_invalida', { campo: 'cuerpo' });
  var falta = faltaCampo_(cuerpo, ['articulo_id', 'nombre', 'tipo', 'token']);
  if (falta) return falta;
  if (TIPOS.indexOf(cuerpo.tipo) === -1) return fallo('tipo_invalido');
  var art = validarArticulo(cuerpo.articulo_id, articulos);
  if (!art.ok) return art;
  var nom = validarNombre(cuerpo.nombre);
  if (!nom.ok) return nom;
  var tok = validarToken(cuerpo.token, hashear);
  if (!tok.ok) return tok;
  return { ok: true, entrada: { articulo: art.id, nombre: nom.nombre, tipo: cuerpo.tipo, hash: tok.hash } };
}

/** Valida el cuerpo de `soltar`: campos → artículo → token. */
function prepararSoltar(cuerpo, articulos, hashear) {
  if (!esObjeto_(cuerpo)) return fallo('entrada_invalida', { campo: 'cuerpo' });
  var falta = faltaCampo_(cuerpo, ['articulo_id', 'token']);
  if (falta) return falta;
  var art = validarArticulo(cuerpo.articulo_id, articulos);
  if (!art.ok) return art;
  var tok = validarToken(cuerpo.token, hashear);
  if (!tok.ok) return tok;
  return { ok: true, entrada: { articulo: art.id, hash: tok.hash } };
}

// ------------------------------------------------------------------ estado y proyección pública

/** Estado público de un artículo: solo nombres de pila. Gana el apartado de la fila más arriba. */
function estadoArticulo(registros, articuloId) {
  var apartadoPor = null;
  var parecidos = [];
  registros.forEach(function (r) {
    if (r.id_articulo !== articuloId || !esActivo_(r)) return;
    if (r.tipo === 'apartado') {
      if (apartadoPor === null) apartadoPor = nombrePila(r.nombre);
    } else {
      parecidos.push(nombrePila(r.nombre));
    }
  });
  return { apartado_por: apartadoPor, parecidos: parecidos };
}

/**
 * Respuesta de `ver` (§6): todos los artículos activos en `orden`, con nombre de pila del apartado,
 * pilas de parecidos y `mio`. Nunca nombre completo, hash_token, creado ni origen.
 * `hash` puede ser null (token ausente o inválido → mio = null). `ahora` (Date) lo pasa quien llama.
 */
function proyectarPublico(articulos, registros, hash, ahora) {
  var activos = registros.filter(esActivo_);
  var mios = {};
  if (hash) {
    activos.forEach(function (r) {
      if (r.hash_token !== hash) return;
      if (mios[r.id_articulo] !== 'apartado') mios[r.id_articulo] = r.tipo;
    });
  }
  var lista = articulos.filter(function (a) { return a.activo; }).map(function (a) {
    var e = estadoArticulo(activos, a.id);
    return { id: a.id, apartado_por: e.apartado_por, parecidos: e.parecidos, mio: mios[a.id] || null };
  });
  return { ok: true, generado_en: ahora.toISOString(), articulos: lista };
}

// ------------------------------------------------------------------ decisiones de escritura

/**
 * Decide un `apartar` (siempre se llama DENTRO del lock, con `registros` recién leídos).
 * Orden: tope de filas → fila activa propia (repetido / ya_registrado_distinto) → ya_apartado →
 * tope_dispositivo → insertar. Devuelve { accion: 'insertar'|'repetido'|'error', fila?, respuesta }.
 * La fila no trae `creado`: lo pone Servidor.js con la hora real.
 */
function decidirApartar(registros, entrada, limites) {
  var lim = limites || LIMITES;
  if (registros.length >= lim.MAX_FILAS_REGISTROS) {
    return { accion: 'error', respuesta: fallo('lista_cerrada') };
  }
  var activos = registros.filter(esActivo_);
  var hash = entrada.hash;
  var articulo = entrada.articulo;

  var propia = null;
  for (var i = 0; i < activos.length; i++) {
    if (activos[i].id_articulo === articulo && activos[i].hash_token === hash) { propia = activos[i]; break; }
  }
  if (propia) {
    if (propia.tipo === entrada.tipo) {
      return {
        accion: 'repetido',
        respuesta: {
          ok: true, articulo_id: articulo, tipo: propia.tipo, nombre: propia.nombre,
          nombre_pila: nombrePila(propia.nombre), repetido: true, primero_en_dispositivo: false,
          estado: estadoArticulo(activos, articulo),
        },
      };
    }
    var msgDistinto = propia.tipo === 'parecido'
      ? 'Ya marcaste este como "Llevo algo parecido". Suéltalo primero.'
      : 'Ya apartaste este. Suéltalo primero si prefieres marcar "Llevo algo parecido".';
    return { accion: 'error', respuesta: fallo('ya_registrado_distinto', { tipo_actual: propia.tipo }, msgDistinto) };
  }

  if (entrada.tipo === 'apartado') {
    var estado = estadoArticulo(activos, articulo);
    if (estado.apartado_por !== null) {
      return {
        accion: 'error',
        respuesta: fallo('ya_apartado', { por: estado.apartado_por },
          estado.apartado_por + ' acaba de apartar este. Puedes elegir otro o marcar "Llevo algo parecido".'),
      };
    }
    var mios = activos.filter(function (r) { return r.hash_token === hash && r.tipo === 'apartado'; }).length;
    if (mios >= lim.TOPE_APARTADOS_POR_DISPOSITIVO) {
      var tope = lim.TOPE_APARTADOS_POR_DISPOSITIVO;
      return {
        accion: 'error',
        respuesta: fallo('tope_dispositivo', { tope: tope }, 'Ya apartaste ' + tope + '. Suelta uno para apartar otro.'),
      };
    }
  }

  var fila = {
    id_articulo: articulo, tipo: entrada.tipo, nombre: entrada.nombre, hash_token: hash,
    estado: 'activo', origen: 'invitado',
  };
  var primero = !registros.some(function (r) { return r.hash_token === hash; });
  return {
    accion: 'insertar',
    fila: fila,
    respuesta: {
      ok: true, articulo_id: articulo, tipo: entrada.tipo, nombre: entrada.nombre,
      nombre_pila: nombrePila(entrada.nombre), repetido: false, primero_en_dispositivo: primero,
      estado: estadoArticulo(activos.concat([fila]), articulo),
    },
  };
}

/**
 * Decide un `soltar` (dentro del lock). Solo toca filas activas de (artículo, MI hash): lo de otro
 * dispositivo o lo que Andrey apartó a mano (hash vacío) nunca se suelta desde aquí.
 * Idempotente: sin fila activa → liberado:false con el estado real.
 */
function decidirSoltar(registros, entrada) {
  var hash = entrada.hash;
  var filas = [];
  var quedan = [];
  registros.forEach(function (r) {
    if (esActivo_(r) && hash && r.id_articulo === entrada.articulo && r.hash_token === hash) filas.push(r.fila);
    else quedan.push(r);
  });
  return {
    filas: filas,
    respuesta: { ok: true, liberado: filas.length > 0, estado: estadoArticulo(quedan, entrada.articulo) },
  };
}

// ------------------------------------------------------------------ frecuencia (CacheService)

/**
 * Contador de ventana fija guardado como texto «n:expiraMs». Devuelve si se permite, el valor a
 * guardar y su expiración en segundos. Se usa dentro del lock (no necesita incremento atómico).
 */
function decidirFrecuencia(valor, ahoraMs, maximo, ventanaS) {
  var n = 0;
  var expira = 0;
  var m = /^(\d+):(\d+)$/.exec(texto_(valor));
  if (m) { n = Number(m[1]); expira = Number(m[2]); }
  if (!m || expira <= ahoraMs) { n = 0; expira = ahoraMs + ventanaS * 1000; }
  var ttl = Math.max(1, Math.ceil((expira - ahoraMs) / 1000));
  if (n + 1 > maximo) return { permitido: false, reintentar_en_s: ttl };
  return { permitido: true, valor: (n + 1) + ':' + expira, ttl_s: ttl };
}

/** Aplica el límite por dispositivo y el global a la vez. Si alguno niega, no cuenta ninguno. */
function controlFrecuencia(valorDispositivo, valorGlobal, ahoraMs, limites) {
  var lim = limites || LIMITES;
  var d = decidirFrecuencia(valorDispositivo, ahoraMs, lim.MAX_ESCRITURAS_POR_MINUTO_DISPOSITIVO, lim.VENTANA_FRECUENCIA_S);
  var g = decidirFrecuencia(valorGlobal, ahoraMs, lim.MAX_ESCRITURAS_POR_MINUTO_GLOBAL, lim.VENTANA_FRECUENCIA_S);
  if (!d.permitido || !g.permitido) {
    var espera = Math.max(d.permitido ? 0 : d.reintentar_en_s, g.permitido ? 0 : g.reintentar_en_s);
    return { ok: false, error: fallo('demasiadas_solicitudes', { motivo: 'frecuencia', reintentar_en_s: espera }) };
  }
  return { ok: true, dispositivo: d, global: g };
}

// ------------------------------------------------------------------ utilidades para la hoja

/**
 * Texto de un invitado listo para escribir en una celda sin que Sheets lo convierta en fórmula
 * («=IMPORTXML(...)», «+1», «-x», «@a»): se antepone un apóstrofo, que Sheets no muestra.
 */
function textoSeguroParaCelda(valor) {
  var t = valor === null || valor === undefined ? '' : String(valor);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

/** Cambia el separador de argumentos de una fórmula (`;` ↔ `,`) sin tocar lo que va entre comillas. */
function formulaConSeparador(formula, separador) {
  var otro = separador === ',' ? ';' : ',';
  var dentro = false;
  var salida = '';
  for (var i = 0; i < formula.length; i++) {
    var c = formula.charAt(i);
    if (c === '"') dentro = !dentro;
    salida += !dentro && c === otro ? separador : c;
  }
  return salida;
}

/** Letra de columna (1 → A, 27 → AA). */
function letraColumna(n) {
  var s = '';
  while (n > 0) {
    var r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

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
        tabla.hoja.getRange(n, tabla.indice.estado + 1).setValue('liberado');
        tabla.hoja.getRange(n, tabla.indice.liberado + 1).setValue(ahora);
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
  CacheService.getScriptCache().put('ver:gen', String(Date.now()), 21600);
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
