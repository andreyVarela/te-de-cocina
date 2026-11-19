/* api.js · ÚNICO módulo de acceso a datos. Backend: Google Sheet + Apps Script (web app).
   La UI (app.js) no conoce URLs, fetch ni formatos de red: solo llama a
     TDC.api.verLista()                     → { ok:true, articulos:[{ id, apartado_por, parecidos:[...], mio }] }
     TDC.api.apartar(id, nombre, parecido)  → { ok:true, tipo, nombre, nombre_pila, repetido, primero_en_dispositivo, estado:{ apartado_por, parecidos } }
     TDC.api.soltar(id)                     → { ok:true, liberado, estado:{ apartado_por, parecidos } }
   Siempre resuelven (nunca rechazan) con el sobre del contrato:
     error de negocio:   { ok:false, codigo, mensaje, datos }   (códigos del contrato §6)
     error de transporte (sin red, redirect fallido, HTML de error de Google, tiempo agotado, sin URL):
                         { ok:false, codigo:'sin_conexion', mensaje, datos:{ detalle } }   (código solo del cliente)
   La UI decide SIEMPRE por `codigo`, nunca por el texto.

   ==== PROTOCOLO con el Apps Script (contrato §6) ====
   · URL: <meta name="tdc:api-url" content="{{API_URL}}"> (el build la toma de evento.json → api_url).
   · Lista:   GET  {API_URL}?accion=ver&token=<token>        (token para calcular `mio`; si se prefiere que
              el token no viaje en la URL, cambiar a POST {accion:'ver', token} aquí y en el script).
   · Apartar: POST {API_URL}  body JSON {accion:'apartar', articulo_id, nombre, tipo:'apartado'|'parecido', token}
   · Soltar:  POST {API_URL}  body JSON {accion:'soltar', articulo_id, token}
   · Content-Type text/plain;charset=utf-8 (sin preflight CORS). fetch sigue el redirect 302 de Apps Script.
   · Respuesta: JSON con el sobre de arriba, HTTP 200 siempre que el script terminó.
   =====================================================================================

   Token de dispositivo: 32 bytes aleatorios en hex en localStorage['tdc.dispositivo'] (try/catch). Si el
   navegador no deja guardar, se usa uno efímero y TDC.api.dispositivoPersistente() devuelve false.

   Modo demo (solo local): con ?demo en localhost / 127.0.0.1 / file:// se carga demo.js y no se toca la red.
   Variantes: ?demo · ?demo=dormido · ?demo=conflicto · ?demo=lento · ?demo=privado · &reiniciar.
   JS clásico (sin módulos, sin ?. ni ??) para iOS 12 / Android 7. */
(function () {
  'use strict';

  var CLAVE_TOKEN = 'tdc.dispositivo';
  var TIEMPO_LIMITE_MS = 20000;   // Apps Script en frío puede tardar varios segundos

  function urlApi() {
    var m = document.querySelector('meta[name="tdc:api-url"]');
    var v = m ? (m.getAttribute('content') || '').trim() : '';
    return v.indexOf('{{') === -1 ? v : '';   // marcador sin reemplazar = sin configuración
  }

  /* ---------- Modo demo (solo local) ---------- */
  var demo = null;
  (function () {
    var h = location.hostname;
    var local = location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
    var md = local && /[?&]demo(?:=([a-z-]+))?(?:&|$)/.exec(location.search);
    if (md) demo = md[1] || 'si';
  })();
  var demoListo = null;
  function cargarDemo() {
    if (!demoListo) {
      demoListo = new Promise(function (resolver) {
        var s = document.createElement('script');
        var actual = document.currentScript || document.querySelector('script[src$="api.js"]');
        s.src = (actual && actual.src ? actual.src.replace(/api\.js(\?.*)?$/, '') : '') + 'demo.js';
        s.onload = function () { resolver(window.TDC_DEMO || null); };
        s.onerror = function () { resolver(null); };
        document.head.appendChild(s);
      });
    }
    return demoListo;
  }
  if (demo) cargarDemo();

  /* ---------- Almacenamiento (siempre en try/catch) ---------- */
  function leer(clave) {
    if (demo === 'privado') return null;
    try { return window.localStorage.getItem(clave); } catch (e) { return null; }
  }
  function guardar(clave, valor) {
    if (demo === 'privado') return false;
    try { window.localStorage.setItem(clave, valor); return window.localStorage.getItem(clave) === valor; } catch (e) { return false; }
  }

  /* ---------- Token de dispositivo ---------- */
  function hexAleatorio(bytes) {
    var arr = new Uint8Array(bytes);
    var c = window.crypto || window.msCrypto;
    if (c && c.getRandomValues) c.getRandomValues(arr);
    else for (var i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
    var s = '';
    for (var j = 0; j < arr.length; j++) s += (arr[j] < 16 ? '0' : '') + arr[j].toString(16);
    return s;
  }
  var disp = null;
  function dispositivo() {
    if (disp) return disp;
    var t = leer(CLAVE_TOKEN);
    if (t && /^[0-9a-f]{64}$/.test(t)) disp = { token: t, persistente: true };
    else {
      var nuevo = hexAleatorio(32);
      disp = { token: nuevo, persistente: guardar(CLAVE_TOKEN, nuevo) };
    }
    return disp;
  }

  /* ---------- Nombre: misma regla que el servidor (el servidor manda) ---------- */
  var reLetra;
  try { reLetra = new RegExp('\\p{L}', 'u'); } catch (e) { reLetra = /[A-Za-zÀ-ÖØ-öø-ÿĀ-žΑ-ωА-я]/; }
  function normalizarNombre(s) { return String(s || '').replace(/\s+/g, ' ').replace(/^ | $/g, ''); }
  function largoNombre(s) { return Array.from ? Array.from(s).length : s.length; }   // emoji = 1, como char_length
  function validarNombre(s) {
    var recortado = String(s || '').trim();
    // Control (tab, salto de línea…) se revisa ANTES de colapsar espacios: "a\tb" se rechaza, como en el servidor.
    if (/[\x00-\x1F\x7F]/.test(recortado)) return { ok: false, motivo: 'caracteres', nombre: recortado };
    var n = normalizarNombre(recortado);
    var l = largoNombre(n);
    if (l < 2) return { ok: false, motivo: 'corto', nombre: n };
    if (l > 40) return { ok: false, motivo: 'largo', nombre: n };
    if (/[\x00-\x1F\x7F]/.test(n) || !reLetra.test(n)) return { ok: false, motivo: 'caracteres', nombre: n };
    return { ok: true, nombre: n };
  }

  /* ---------- Transporte ---------- */
  function errorTransporte(detalle) {
    return { ok: false, codigo: 'sin_conexion', mensaje: 'No se guardó. Revisa tu conexión', datos: { detalle: detalle } };
  }
  function interpretar(res) {
    if (!res.ok) return errorTransporte('HTTP ' + res.status);
    return res.text().then(function (texto) {
      var cuerpo;
      try { cuerpo = JSON.parse(texto); } catch (e) { return errorTransporte('respuesta no JSON'); }   // p. ej. página de error de Google
      if (!cuerpo || typeof cuerpo !== 'object' || typeof cuerpo.ok !== 'boolean') return errorTransporte('sobre inválido');
      if (!cuerpo.ok && typeof cuerpo.codigo !== 'string') return errorTransporte('sobre sin código');
      if (!cuerpo.ok && !cuerpo.datos) cuerpo.datos = {};
      return cuerpo;
    }, function () { return errorTransporte('cuerpo ilegible'); });
  }
  function llamar(accion, datos) {
    if (demo) {
      return cargarDemo().then(function (d) { return d ? d.llamar(accion, datos, demo) : errorTransporte('demo.js no cargó'); });
    }
    var url = urlApi();
    if (!url || typeof fetch !== 'function') return Promise.resolve(errorTransporte('sin configuración'));

    var controlador = typeof AbortController === 'function' ? new AbortController() : null;
    var temporizador = controlador ? setTimeout(function () { controlador.abort(); }, TIEMPO_LIMITE_MS) : null;
    var opciones = { redirect: 'follow', credentials: 'omit', cache: 'no-store' };
    var destino = url;
    if (accion === 'ver') {
      opciones.method = 'GET';
      destino = url + (url.indexOf('?') === -1 ? '?' : '&') + 'accion=ver&token=' + encodeURIComponent(datos.token || '');
    } else {
      opciones.method = 'POST';
      opciones.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
      var cuerpo = { accion: accion };
      for (var k in datos) if (Object.prototype.hasOwnProperty.call(datos, k)) cuerpo[k] = datos[k];
      opciones.body = JSON.stringify(cuerpo);
    }
    if (controlador) opciones.signal = controlador.signal;

    return fetch(destino, opciones)
      .then(interpretar, function (e) { return errorTransporte(e && e.name === 'AbortError' ? 'tiempo agotado' : 'red'); })
      .then(function (r) { if (temporizador) clearTimeout(temporizador); return r; });
  }

  window.TDC = window.TDC || {};
  window.TDC.api = {
    verLista: function () { return llamar('ver', { token: dispositivo().token }); },
    apartar: function (id, nombre, parecido) {
      return llamar('apartar', { articulo_id: id, nombre: nombre, tipo: parecido ? 'parecido' : 'apartado', token: dispositivo().token });
    },
    soltar: function (id) { return llamar('soltar', { articulo_id: id, token: dispositivo().token }); },
    dispositivoPersistente: function () { return dispositivo().persistente; },
    validarNombre: validarNombre,
    normalizarNombre: normalizarNombre,
    largoNombre: largoNombre,
    leer: leer,
    guardar: guardar,
    demo: demo
  };
})();
