/* demo.js · SOLO PARA PROBAR EN LOCAL. api.js lo carga únicamente si la página corre en
   localhost / 127.0.0.1 / file:// y la URL trae ?demo. En el sitio publicado nunca se usa.
   Simula las acciones del Apps Script (ver, apartar, soltar) en memoria (sessionStorage), con el
   mismo sobre {ok, codigo, mensaje, datos} y los mismos códigos del contrato.
   Variantes: ?demo · ?demo=dormido · ?demo=intermitente (falla el primer `ver`) · ?demo=conflicto · ?demo=lento · ?demo=privado
   · ?demo=panel (como si Andrey editara la hoja: esconde el 2.º, renombra el 1.º y agrega dos nuevos)
   Añade &reiniciar para borrar el estado simulado. Latencia normal simulada: 1,2 s (como Apps Script). */
(function () {
  'use strict';
  var CLAVE = 'tdc.demo.estado';

  var foto = null;   // catálogo leído del HTML la primera vez (después el DOM ya lo redibuja app.js)
  function ids() {
    if (!foto) {
      foto = Array.prototype.map.call(document.querySelectorAll('.articulo[data-id]'), function (li) {
        var cat = li.closest('.cat');
        var h3 = cat && cat.querySelector('h3');
        var enlace = li.querySelector('.tienda a');
        return {
          id: li.getAttribute('data-id'), cat: h3 ? h3.childNodes[1].nodeValue : 'Otros',
          que: (li.querySelector('.que') || {}).textContent || '', producto: (li.querySelector('.producto') || {}).textContent || '',
          tienda: enlace ? enlace.firstChild.nodeValue.replace(/^Ver en /, '') : '', url: enlace ? enlace.getAttribute('href') : '',
          imagen: (li.querySelector('.foto img') || { getAttribute: function () { return ''; } }).getAttribute('src') || '',
          precio_crc: 1000, cantidad: 1, aviso: ''
        };
      });
    }
    if (modo !== 'panel') return foto;
    var lista = foto.filter(function (x, i) { return i !== 1; }).map(function (x, i) {
      return i === 0 ? Object.assign({}, x, { que: x.que + ' (editado en la hoja)', aviso: 'Aviso nuevo desde la hoja' }) : x;
    });
    lista.splice(2, 0, { id: 'wok-negro', cat: lista[0].cat, que: 'Wok negro', producto: 'Wok de hierro 30 cm', tienda: 'Novex',
      url: 'https://novex.cr/', imagen: '', precio_crc: 12500, cantidad: 1, aviso: '' });
    lista.push({ id: 'planta', cat: 'Plantas', que: 'Una planta', producto: 'Potus en maceta', tienda: '', url: 'javascript:alert(1)',
      imagen: 'http://inseguro/x.jpg', precio_crc: 0, cantidad: 2, aviso: '' });
    return lista;
  }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  function hace(min) { return new Date(Date.now() - min * 60000).toISOString(); }
  var OTRO1 = 'a1b2c3' + new Array(59).join('0'), OTRO2 = '9f8e7d' + new Array(59).join('1');

  function semilla() {
    var a = ids();
    var r = [];
    function reg(i, tipo, nombre, disp, min, origen) {
      if (a[i]) r.push({ id: uuid(), articulo_id: a[i].id, tipo: tipo, nombre: nombre, dispositivo_hash: disp, origen: origen || 'invitado', creado_en: hace(min), liberado_en: null });
    }
    reg(5, 'apartado', 'María José Vargas', OTRO1, 300);
    reg(14, 'apartado', 'Ana', OTRO2, 240);
    reg(14, 'parecido', 'Marta Solís', null, 200, 'admin');
    reg(19, 'parecido', 'Luis', OTRO1, 120);
    reg(19, 'parecido', 'Ñandú 🎁 Pérez', OTRO2, 60);
    reg(27, 'apartado', '<script>alert(1)</script> Tía Rosa', OTRO2, 30);
    return { registros: r };
  }

  var estado;
  try {
    if (/[?&]reiniciar/.test(location.search)) sessionStorage.removeItem(CLAVE);
    estado = JSON.parse(sessionStorage.getItem(CLAVE) || 'null');
  } catch (e) { estado = null; }
  if (!estado) estado = semilla();
  function persistir() { try { sessionStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin persistencia */ } }
  persistir();

  var conflictoUsado = false;

  function pila(n) { return n.split(' ')[0]; }
  function activos() { return estado.registros.filter(function (g) { return !g.liberado_en; }); }
  function estadoDe(id) {
    var ap = null, par = [];
    activos().forEach(function (g) {
      if (g.articulo_id !== id) return;
      if (g.tipo === 'apartado') ap = pila(g.nombre); else par.push(pila(g.nombre));
    });
    return { apartado_por: ap, parecidos: par };
  }
  function error(codigo, mensaje, datos) { return { ok: false, codigo: codigo, mensaje: mensaje, datos: datos || {} }; }
  function existe(id) { return ids().some(function (a) { return a.id === id; }); }

  function apartar(d, origen) {
    var args = { p_articulo_id: d.articulo_id, p_nombre: d.nombre, p_tipo: d.tipo, p_token: d.token };
    if (args.p_tipo !== 'apartado' && args.p_tipo !== 'parecido') return error('tipo_invalido', 'tipo inválido');
    if (!existe(args.p_articulo_id)) return error('articulo_invalido', 'Ese artículo ya no está en la lista');
    var v = window.TDC.api.validarNombre(args.p_nombre);
    if (!v.ok) return error('nombre_invalido', 'Escribe tu nombre (2 a 40 letras)', { motivo: v.motivo });
    var h = null;
    if (origen === 'invitado') {
      if (!/^[0-9a-f]{64}$/.test(args.p_token || '')) return error('token_invalido', 'Recarga la página e intenta de nuevo');
      h = args.p_token;
      var mio = activos().filter(function (g) { return g.articulo_id === args.p_articulo_id && g.dispositivo_hash === h; })[0];
      if (mio && mio.tipo === args.p_tipo) return ok(mio, true);
      if (mio) return error('ya_registrado_distinto', 'Ya marcaste este', { tipo_actual: mio.tipo });
      if (args.p_tipo === 'apartado' && activos().filter(function (g) { return g.dispositivo_hash === h && g.tipo === 'apartado'; }).length >= 5) {
        return error('tope_dispositivo', 'Ya apartaste 5', { tope: 5 });
      }
    }
    if (args.p_tipo === 'apartado' && modo === 'conflicto' && !conflictoUsado && origen === 'invitado') {
      conflictoUsado = true;
      estado.registros.push({ id: uuid(), articulo_id: args.p_articulo_id, tipo: 'apartado', nombre: 'Ana Lucía', dispositivo_hash: OTRO2, origen: 'invitado', creado_en: hace(0), liberado_en: null });
      persistir();
    }
    var gan = activos().filter(function (g) { return g.articulo_id === args.p_articulo_id && g.tipo === 'apartado'; })[0];
    if (args.p_tipo === 'apartado' && gan) return error('ya_apartado', pila(gan.nombre) + ' acaba de apartar este', { por: pila(gan.nombre) });
    var primero = h ? !estado.registros.some(function (g) { return g.dispositivo_hash === h; }) : false;
    var nuevo = { id: uuid(), articulo_id: args.p_articulo_id, tipo: args.p_tipo, nombre: v.nombre, dispositivo_hash: h, origen: origen, creado_en: new Date().toISOString(), liberado_en: null };
    estado.registros.push(nuevo);
    persistir();
    return ok(nuevo, false, primero);
  }
  function ok(g, repetido, primero) {
    return { ok: true, registro_id: g.id, articulo_id: g.articulo_id, tipo: g.tipo, nombre: g.nombre, nombre_pila: pila(g.nombre), repetido: !!repetido, primero_en_dispositivo: !!primero, estado: estadoDe(g.articulo_id) };
  }

  var fn = {
    ver: function (a) {
      a = { p_token: a.token };
      var catalogo = ids();
      return { ok: true, generado_en: new Date().toISOString(), catalogo: catalogo, articulos: catalogo.map(function (x) {
        var e = estadoDe(x.id);
        var mio = null;
        activos().forEach(function (g) { if (g.articulo_id === x.id && a.p_token && g.dispositivo_hash === a.p_token) mio = g.tipo; });
        return { id: x.id, apartado_por: e.apartado_por, parecidos: e.parecidos, mio: mio };
      }) };
    },
    apartar: function (d) { return apartar(d, 'invitado'); },
    soltar: function (d) {
      var a = { p_articulo_id: d.articulo_id, p_token: d.token };
      if (!existe(a.p_articulo_id)) return error('articulo_invalido', 'Ese artículo ya no está en la lista');
      var n = 0;
      activos().forEach(function (g) { if (g.articulo_id === a.p_articulo_id && g.dispositivo_hash === a.p_token) { g.liberado_en = new Date().toISOString(); n++; } });
      persistir();
      return { ok: true, liberado: n > 0, estado: estadoDe(a.p_articulo_id) };
    }
  };

  var modo = 'si';
  var llamadas = {};
  window.TDC_DEMO = {
    llamar: function (nombre, args, variante) {
      modo = variante;
      var espera = variante === 'lento' ? 4000 : 1200;
      return new Promise(function (resolver) {
        setTimeout(function () {
          llamadas[nombre] = (llamadas[nombre] || 0) + 1;
          window.TDC_DEMO.llamadas = llamadas;
          if (variante === 'intermitente' && nombre === 'ver' && llamadas.ver === 1) return resolver({ ok: false, codigo: 'sin_conexion', datos: { detalle: 'demo: falla la primera vez' } });
          if (variante === 'dormido') return resolver({ ok: false, codigo: 'sin_conexion', datos: { detalle: 'demo dormido' } });
          if (!fn[nombre]) return resolver({ ok: false, codigo: 'sin_conexion', datos: { detalle: 'acción desconocida' } });
          resolver(JSON.parse(JSON.stringify(fn[nombre](args))));
        }, espera);
      });
    }
  };
})();
