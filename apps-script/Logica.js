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
