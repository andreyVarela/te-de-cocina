/* app.js · vista del invitado (index.html). Requiere api.js antes (único acceso a datos: TDC.api).

   ===================== INTERFAZ CON EL BUILD (scripts/build.mjs) =====================
   El build deja la lista y la fecha escritas en el HTML (se leen sin JS). Sustitución
   de marcadores en texto, sin motor de plantillas.
     · {{x}}   → valor ESCAPADO para HTML (& < > " ').      · {{{X}}} → HTML crudo generado por el propio build.
   site/index.html  (→ dist/index.html)
     {{FECHA}}   «sábado 5 de diciembre» o «Por confirmar» si la fecha está vacía en evento.json
     {{HORA}}    «2:00 p. m.»            o «Por confirmar»   (es-CR, America/Costa_Rica)
     {{LUGAR}}   lugar de evento.json
     {{API_URL}} evento.json → api_url (URL /exec del Apps Script; va en <meta name="tdc:api-url">)
     {{{CATEGORIAS}}} concatenación de site/partes/categoria.html, una por `cat`, en orden de primera aparición
   site/partes/categoria.html
     {{cat}} · {{cat_id}} (slug ascii de cat: «bano») · {{kanji}} (de site/partes/categorias.json; '' si falta)
     {{n_texto}} («13 artículos» / «1 artículo») · {{{ARTICULOS}}} (concatenación de site/partes/articulo.html)
   site/partes/articulo.html
     {{id}} {{que}} {{producto}} {{tienda}} {{url}} {{imagen}} {{aviso}} ('' si no hay; la CSS lo oculta)
     {{precio}} texto final calculado por el build: «₡2 800» o, con cantidad > 1, «₡400 c/u · ₡1 600 en total»
     (nunca se copian `nota` ni `verificado`)
   Archivos a copiar a dist/: index.html (renderizado), app.js, api.js, estilos.css, img/ (si existe).
   demo.js es opcional (solo funciona en localhost con ?demo). No copiar site/partes/. robots.txt lo escribe el build.
   El protocolo con el Apps Script (GET ver / POST apartar y soltar) está documentado al inicio de api.js.
   ===========================================================================================================

   Estados de la vista: cargando · error (script caído o sin red: Apartar desactivado con la razón) ·
   vacío (no hay artículos) · listo · recargando. Por artículo: disponible · apartado por otro · mío ·
   parecidos (no bloquea) · apartando (1-3 s, sin doble envío) · conflicto (otro apartó primero, se
   conserva lo escrito) · sin poder soltar (navegador sin almacenamiento). */
(function () {
  'use strict';
  var api = window.TDC && window.TDC.api;
  if (!api || !document.querySelector) return;

  /* ---------- Crear nodos sin innerHTML: todo texto entra por textContent ---------- */
  function el(etiqueta, attrs, hijos) {
    var n = document.createElement(etiqueta);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else n.setAttribute(k, v === true ? '' : String(v));
      }
    }
    if (hijos) {
      if (!Array.isArray(hijos)) hijos = [hijos];
      for (var i = 0; i < hijos.length; i++) {
        var h = hijos[i];
        if (h === null || h === undefined || h === false) continue;
        n.appendChild(typeof h === 'string' ? document.createTextNode(h) : h);
      }
    }
    return n;
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }
  function simbolo(c) { return el('span', { class: 'simbolo', 'aria-hidden': 'true', text: c }); }

  var CLAVE_NOMBRE = 'tdc.nombre';
  var RECARGAR_TRAS_MS = 60000;
  var REINTENTO_VER_MS = 1500;

  var barra = document.getElementById('barra');
  var barraTexto = document.getElementById('barra-texto');
  var barraRecargar = document.getElementById('barra-recargar');
  var listaVacia = document.getElementById('lista-vacia');
  var avisoConexion = document.getElementById('aviso-conexion');

  var persistente = api.dispositivoPersistente();
  var global = 'cargando';           // cargando | listo | error
  var cargando = false;
  var ultimaCarga = 0;
  var articulos = [];                 // en orden del HTML
  var porId = {};

  /* ---------- Fecha «Por confirmar» atenuada; si ya hay fecha, la línea de WhatsApp solo habla de la dirección ---------- */
  var fechaPendiente = false;
  Array.prototype.forEach.call(document.querySelectorAll('[data-dato]'), function (dd) {
    if (/por confirmar/i.test(dd.textContent)) { dd.className += ' pendiente'; fechaPendiente = true; }
  });
  var lineaWhatsapp = document.getElementById('aviso-whatsapp');
  if (lineaWhatsapp && !fechaPendiente) lineaWhatsapp.textContent = 'Te paso la dirección y los detalles por WhatsApp.';

  /* ---------- Fotos: recuadro con el nombre si la imagen falla ---------- */
  function sinFoto(img) {
    var caja = img.parentNode;
    if (caja && caja.className.indexOf('sin-foto') === -1) caja.className += ' sin-foto';
  }
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.parentNode && / ?foto( |$)/.test(t.parentNode.className)) sinFoto(t);
  }, true);
  Array.prototype.forEach.call(document.querySelectorAll('.foto img'), function (img) {
    var src = img.getAttribute('src');
    if (!src || src.indexOf('{{') !== -1 || (img.complete && img.naturalWidth === 0 && img.currentSrc)) sinFoto(img);
  });


  /* ---------- Armar cada artículo ---------- */
  function prepararArticulo(li) {
    var queNodo = li.querySelector('.que');
    var a = {
      id: li.getAttribute('data-id'),
      li: li,
      que: queNodo ? queNodo.textContent.trim() : '',
      estado: null,                  // { apartado_por, parecidos, mio } cuando el servidor respondió
      activo: true,
      ocupado: false,
      nodos: {}
    };
    var cont = li.querySelector('.interaccion') || li.appendChild(el('div', { class: 'interaccion' }));
    a.nodos.estado = el('p', { class: 'estado' });
    a.nodos.parecidos = el('p', { class: 'parecidos', hidden: true });
    a.nodos.acciones = el('div', { class: 'acciones' });
    a.nodos.panel = el('div', { class: 'panel-slot' });
    a.nodos.mensaje = el('div', { class: 'mensaje', role: 'status', tabindex: '-1' });
    cont.appendChild(a.nodos.estado);
    cont.appendChild(a.nodos.parecidos);
    cont.appendChild(a.nodos.acciones);
    cont.appendChild(a.nodos.panel);
    cont.appendChild(a.nodos.mensaje);
    articulos.push(a);
    porId[a.id] = a;
    pintar(a);
    return a;
  }
  Array.prototype.forEach.call(document.querySelectorAll('.articulo[data-id]'), prepararArticulo);

  /* ---------- Vitrina desde la hoja ----------
     La pestaña «articulos» de la hoja es el panel de Andrey: `ver` trae el catálogo (`catalogo`) y aquí
     se dibuja igual que site/partes/articulo.html y categoria.html. Lo que trae el HTML es el respaldo
     mientras carga o si no hay conexión. Todo texto entra por textContent; enlaces y fotos, solo https. */
  var seccionLista = document.getElementById('lista');
  var pieLista = seccionLista ? seccionLista.querySelector('.lista-pie') : null;
  var kanji = (function () {
    var n = document.getElementById('tdc-kanji');
    try { return n ? JSON.parse(n.textContent) || {} : {}; } catch (e) { return {}; }
  })();
  function slugCat(t) {
    var s = String(t);
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'otros';
  }
  function urlSegura(u) { return typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }
  function colones(n) { return '₡' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function textoPrecio(precio, cantidad) {
    if (!precio) return 'Sin precio';
    return cantidad > 1 ? colones(precio) + ' c/u · ' + colones(precio * cantidad) + ' en total' : colones(precio);
  }
  function textoCantidad(n) { return n + (n === 1 ? ' artículo' : ' artículos'); }

  function crearTarjeta(x) {
    return el('li', { class: 'articulo', id: 'a-' + x.id, 'data-id': x.id }, [
      el('div', { class: 'foto' }, [
        el('span', { class: 'foto-texto' }),
        el('img', { alt: '', width: '112', height: '112', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' })
      ]),
      el('div', { class: 'cuerpo' }, [
        el('h4', { class: 'que' }),
        el('p', { class: 'producto' }),
        el('p', { class: 'precio' }),
        el('p', { class: 'aviso' }),
        el('p', { class: 'tienda' })
      ]),
      el('div', { class: 'interaccion', 'data-js': true })
    ]);
  }
  function ponerTexto(li, sel, t) { var n = li.querySelector(sel); if (n && n.textContent !== t) n.textContent = t; }
  function actualizarTarjeta(li, x) {
    ponerTexto(li, '.que', x.que);
    ponerTexto(li, '.foto-texto', x.que);
    ponerTexto(li, '.producto', x.producto || '');
    ponerTexto(li, '.precio', textoPrecio(x.precio_crc, x.cantidad || 1));
    ponerTexto(li, '.aviso', x.aviso || '');
    var foto = li.querySelector('.foto');
    var img = foto && foto.querySelector('img');
    var src = urlSegura(x.imagen);
    if (img && (img.getAttribute('src') || '') !== src) {
      foto.className = 'foto';
      if (src) img.setAttribute('src', src); else img.removeAttribute('src');
    }
    if (img && !src) sinFoto(img);
    var tienda = li.querySelector('.tienda');
    var url = urlSegura(x.url);
    var nombreTienda = x.tienda || '';
    var enlace = tienda && tienda.querySelector('a');
    var textoEnlace = nombreTienda ? 'Ver en ' + nombreTienda : 'Ver referencia';
    if (tienda && (!enlace ? url : enlace.getAttribute('href') !== url || enlace.firstChild.nodeValue !== textoEnlace)) {
      vaciar(tienda);
      if (url) {
        tienda.appendChild(el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, [
          textoEnlace,
          el('span', { class: 'sr', text: ' (se abre en otra pestaña)' }), ' ',
          el('span', { 'aria-hidden': 'true', text: '↗' })
        ]));
      }
    }
  }
  function seccionDe(cat) {
    var id = 'cat-' + slugCat(cat);
    var h3 = document.getElementById(id);
    var sec = h3 && h3.parentNode;
    if (!sec) {
      h3 = el('h3', { id: id }, [el('span', { class: 'kanji', lang: 'ja', 'aria-hidden': 'true', text: kanji[cat] || '' }), cat,
        el('span', { class: 'n' })]);
      sec = el('section', { class: 'cat', 'aria-labelledby': id }, [h3, el('ul', { class: 'articulos' })]);
    }
    return { sec: sec, ul: sec.querySelector('.articulos'), n: h3.querySelector('.n') };
  }
  /* Mueve un nodo solo si no está ya en su lugar (moverlo le quitaría el foco a quien está escribiendo). */
  function colocar(padre, nodo, antesDe) {
    if (antesDe === nodo || (nodo.parentNode === padre && nodo.nextSibling === (antesDe || null))) return;
    padre.insertBefore(nodo, antesDe || null);
  }
  function aplicarCatalogo(catalogo) {
    if (!seccionLista || !Array.isArray(catalogo)) return;
    var grupos = [];
    var porCat = {};
    var vistos = {};
    catalogo.forEach(function (x) {
      if (!x || typeof x.id !== 'string' || !x.id || vistos[x.id] || typeof x.que !== 'string' || !x.que) return;
      vistos[x.id] = true;
      var cat = typeof x.cat === 'string' && x.cat ? x.cat : 'Otros';
      if (!porCat[cat]) { porCat[cat] = { cat: cat, items: [] }; grupos.push(porCat[cat]); }
      porCat[cat].items.push(x);
    });
    var orden = [];
    var secAnterior = null;
    grupos.forEach(function (g) {
      var s = seccionDe(g.cat);
      colocar(seccionLista, s.sec, secAnterior ? secAnterior.nextSibling : (seccionLista.querySelector('.cat') || pieLista));
      secAnterior = s.sec;
      var liAnterior = null;
      g.items.forEach(function (x) {
        var a = porId[x.id] || prepararArticulo(crearTarjeta(x));
        actualizarTarjeta(a.li, x);
        a.que = x.que;
        colocar(s.ul, a.li, liAnterior ? liAnterior.nextSibling : s.ul.firstChild);
        liAnterior = a.li;
        orden.push(a);
      });
    });
    articulos.forEach(function (a) {
      if (vistos[a.id]) return;
      if (a.li.parentNode) a.li.parentNode.removeChild(a.li);
      delete porId[a.id];
    });
    articulos = orden;
    Array.prototype.forEach.call(seccionLista.querySelectorAll('.cat'), function (sec) {
      var ul = sec.querySelector('.articulos');
      if (!ul || !ul.children.length) { sec.parentNode.removeChild(sec); return; }
      var n = sec.querySelector('.n');
      if (n) n.textContent = textoCantidad(ul.children.length);
    });
    listaVacia.hidden = articulos.length > 0;
  }

  /* ---------- Textos ---------- */
  /* Nombre del artículo en paneles, mensajes y lectores de pantalla. Un solo lugar: si mañana hay que
     distinguir dos títulos iguales (p. ej. añadir `producto`), se cambia aquí. */
  function etiqueta(a) { return a.que; }
  function listaNombres(nombres) {
    if (nombres.length <= 1) return nombres.join('');
    return nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
  }
  function boton(texto, clase, sr, alTocar, extra) {
    var attrs = { type: 'button', class: 'boton ' + (clase || ''), onclick: alTocar };
    if (extra) for (var k in extra) attrs[k] = extra[k];
    return el('button', attrs, [texto, sr ? el('span', { class: 'sr', text: sr }) : null]);
  }

  /* ---------- Pintar un artículo (no toca el panel abierto) ---------- */
  function pintar(a) {
    var st = a.estado;
    var n = a.nodos;
    var desactivado = false;
    var clave, simb, texto;

    if (!a.activo) { clave = 'desconocido'; simb = '–'; texto = 'Este ya no se puede apartar'; desactivado = true; }
    else if (!st && global === 'error') { clave = 'desconocido'; simb = '?'; texto = 'Sin conexión'; desactivado = true; }
    else if (!st) { clave = 'cargando'; simb = '…'; texto = 'Viendo si está libre'; desactivado = true; }
    else if (st.mio === 'apartado') { clave = 'mio'; simb = '✓'; texto = 'Lo apartaste tú' + (st.apartado_por ? ' (' + st.apartado_por + ')' : ''); }
    else if (st.apartado_por) { clave = 'apartado'; simb = '✓'; texto = 'Apartado por ' + st.apartado_por; }
    else { clave = 'disponible'; simb = ''; texto = 'Disponible'; }   // el círculo vacío es el símbolo

    n.estado.setAttribute('data-estado', clave);
    vaciar(n.estado).appendChild(simbolo(simb));
    n.estado.appendChild(el('span', { text: texto }));
    a.li.setAttribute('data-estado', st && st.apartado_por && st.mio !== 'apartado' ? 'apartado' : clave);   // lo mío no se tacha

    var parecidos = st && st.parecidos ? st.parecidos : [];
    vaciar(n.parecidos);
    if (parecidos.length) {
      n.parecidos.appendChild(simbolo('≈'));
      n.parecidos.appendChild(el('span', {
        text: listaNombres(parecidos) + (parecidos.length === 1 ? ' lleva' : ' llevan') + ' algo parecido' +
          (st.mio === 'parecido' ? ' (tú entre ellos)' : '')
      }));
    }
    n.parecidos.hidden = !parecidos.length;

    vaciar(n.acciones);
    var describe = desactivado && global === 'error' ? 'barra-texto' : null;
    // El servidor no deja que un mismo celular aparte y marque «parecido» en el mismo artículo
    // (ya_registrado_distinto, apps-script/Logica.js): con algo mío solo ofrezco soltarlo.
    if (st && st.mio) {
      n.acciones.appendChild(boton(st.mio === 'parecido' ? 'Ya no llevo algo parecido' : 'Soltar mi apartado', 'boton-secundario',
        (st.mio === 'parecido' ? ' a: ' : ': ') + etiqueta(a), function () { abrirSoltar(a); }));
    } else {
      // Desactivado con aria-disabled (no `disabled`): sigue enfocable y al tocarlo explica por qué no responde.
      var extra = { 'aria-disabled': desactivado ? 'true' : null, 'aria-describedby': describe };
      if (!st || !st.apartado_por) {
        n.acciones.appendChild(boton('Apartar', 'boton-primario', ': ' + etiqueta(a), function () {
          if (desactivado) explicarDesactivado(a); else abrirPanel(a, 'apartado');
        }, extra));
      }
      n.acciones.appendChild(boton('Llevo algo parecido', 'boton-texto', ' a: ' + etiqueta(a), function () {
        if (desactivado) explicarDesactivado(a); else abrirPanel(a, 'parecido');
      }, extra));
    }
    n.acciones.hidden = !!a.panelAbierto;
  }

  function pintarTodo() { articulos.forEach(pintar); }

  /* ---------- Mensaje en la fila (éxito / error / conflicto) ---------- */
  function mensaje(a, tipo, lineas, acciones, enfocar) {
    var m = a.nodos.mensaje;
    vaciar(m);
    m.removeAttribute('data-motivo');
    if (!lineas) { m.removeAttribute('data-tipo'); return; }
    m.setAttribute('data-tipo', tipo);
    m.appendChild(simbolo(tipo === 'exito' ? '✓' : tipo === 'espera' ? '…' : '!'));
    var cuerpo = el('div', { class: 'mensaje-cuerpo' });
    lineas.forEach(function (t) { cuerpo.appendChild(el('p', { text: t })); });
    if (acciones && acciones.length) cuerpo.appendChild(el('div', { class: 'acciones' }, acciones));
    m.appendChild(cuerpo);
    if (enfocar) m.focus();
  }

  /* ---------- Panel: apartar o «llevo algo parecido» ---------- */
  var abierto = null;
  function cerrarPanel(a, devolverFoco) {
    if (!a || !a.panelAbierto) return;
    vaciar(a.nodos.panel);
    a.panelAbierto = null;
    if (abierto === a) abierto = null;
    pintar(a);
    if (devolverFoco) {
      var b = a.nodos.acciones.querySelector('button:not([disabled])');
      if (b) b.focus();
    }
  }

  function textoError(codigo, r) {
    var d = (r && r.datos) || {};
    switch (codigo) {
      case 'tope_dispositivo': return 'Ya apartaste ' + (d.tope || 5) + ' cosas desde este celular. Suelta una para apartar otra.';
      case 'demasiadas_solicitudes': return 'Espera un momento e intenta de nuevo.';
      case 'lista_cerrada': return 'La lista está cerrada por ahora. Escríbeme por WhatsApp.';
      case 'articulo_invalido': return 'Ese artículo ya no está en la lista.';
      case 'token_invalido': return 'Recarga la página e intenta de nuevo.';
      case 'ya_registrado_distinto':
        return d.tipo_actual === 'apartado' ? 'Ya apartaste este. Suéltalo primero si quieres cambiarlo.'
          : 'Ya marcaste este como «parecido». Suéltalo primero si quieres apartarlo.';
      default: return 'Algo falló y no se guardó. Intenta de nuevo; si sigue, escríbeme por WhatsApp.';
    }
  }
  /* Botón desactivado tocado: decir por qué en la fila, con salida. */
  function explicarDesactivado(a) {
    if (!a.activo) { mensaje(a, 'error', ['Este ya no se puede apartar.'], null, true); return; }
    if (global === 'error') {
      mensaje(a, 'error', ['Sin conexión: no se puede apartar ahora. Puedes reintentar en un momento.'],
        [boton('Reintentar', 'boton-primario', null, function () { cargar(false); })], true);
    } else {
      mensaje(a, 'espera', ['Cargando lo apartado; espera un momento.'], null, true);
    }
    a.nodos.mensaje.setAttribute('data-motivo', 'conexion');
  }
  function textoNombre(motivo) {
    return motivo === 'caracteres' ? 'Tu nombre necesita letras (sin símbolos raros)' : 'Escribe tu nombre (2 a 40 letras)';
  }

  function abrirPanel(a, tipo, nombrePrevio) {
    if (abierto && abierto !== a) cerrarPanel(abierto, false);
    mensaje(a, null, null);
    vaciar(a.nodos.panel);
    abierto = a;
    a.panelAbierto = tipo;

    var idCampo = 'n-' + a.id;
    var idError = 'e-' + a.id;
    var idCuenta = 'c-' + a.id;
    var guardado = nombrePrevio !== undefined ? nombrePrevio : (api.leer(CLAVE_NOMBRE) || '');

    var input = el('input', {
      id: idCampo, name: 'nombre', type: 'text', autocomplete: 'name', autocapitalize: 'words', spellcheck: 'false',
      enterkeyhint: 'done', 'aria-describedby': idError + ' ' + idCuenta, required: true
    });
    input.value = guardado;
    var error = el('p', { class: 'campo-error', id: idError, 'aria-live': 'polite' });
    var cuenta = el('p', { class: 'contador', id: idCuenta });
    var enviar = el('button', { type: 'submit', class: 'boton boton-primario', text: tipo === 'apartado' ? 'Apartar' : 'Confirmar' });
    var cancelar = boton('Cancelar', 'boton-texto', null, function () { cerrarPanel(a, true); });
    var aviso = el('div', { class: 'mensaje', role: 'status', tabindex: '-1' });

    function contar() {
      var l = api.largoNombre(api.normalizarNombre(input.value));
      cuenta.textContent = l + ' de 40';
      cuenta.setAttribute('data-pasado', l > 40 ? 'true' : 'false');
      if (l > 40) mostrarError('Te pasaste por ' + (l - 40) + (l - 40 === 1 ? ' letra' : ' letras') + ' (máximo 40)');
      else if (input.getAttribute('aria-invalid') === 'true' && api.validarNombre(input.value).ok) mostrarError('');
    }
    function mostrarError(t) {
      error.textContent = t;
      if (t) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
    function avisar(tipoMsj, lineas, acciones) {
      vaciar(aviso);
      if (!lineas) { aviso.removeAttribute('data-tipo'); return; }
      aviso.setAttribute('data-tipo', tipoMsj);
      aviso.appendChild(simbolo(tipoMsj === 'espera' ? '…' : '!'));
      var cuerpo = el('div', { class: 'mensaje-cuerpo' });
      lineas.forEach(function (t) { cuerpo.appendChild(el('p', { text: t })); });
      if (acciones) cuerpo.appendChild(el('div', { class: 'acciones' }, acciones));
      aviso.appendChild(cuerpo);
    }

    var titulo = el('p', { class: 'panel-titulo', id: 'pt-' + a.id, text: (tipo === 'apartado' ? 'Apartar: ' : 'Llevo algo parecido a: ') + etiqueta(a) });
    var form = el('form', { class: 'panel', novalidate: true, 'aria-labelledby': 'pt-' + a.id }, [
      titulo,
      el('p', {
        class: 'panel-ayuda', text: tipo === 'apartado'
          ? 'Solo tu nombre, nada más. Los demás verán solo tu primer nombre.'
          : 'No reserva nada: es para que yo sepa. Los demás verán solo tu primer nombre.'
      }),
      persistente ? null : el('p', { class: 'panel-privado' }, [el('span', { 'aria-hidden': 'true', text: '!' }),
        'Este navegador no guarda datos (puede ser modo privado). Puedes ' + (tipo === 'apartado' ? 'apartar' : 'marcarlo') +
        ' igual, pero para soltarlo después tendrás que avisarme por WhatsApp.']),
      el('div', { class: 'campo' }, [
        el('label', { for: idCampo, text: 'Tu nombre' }),
        input,
        el('div', { class: 'campo-pie' }, [error, cuenta])
      ]),
      el('div', { class: 'panel-acciones' }, [enviar, cancelar]),
      aviso
    ]);

    input.addEventListener('input', contar);
    form.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && !a.ocupado) { e.preventDefault(); cerrarPanel(a, true); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (a.ocupado) return;                       // doble toque = un solo envío
      var v = api.validarNombre(input.value);
      if (!v.ok) { mostrarError(textoNombre(v.motivo)); input.focus(); return; }
      mostrarError('');
      a.ocupado = true;
      enviar.disabled = true; enviar.setAttribute('aria-busy', 'true');
      enviar.textContent = tipo === 'apartado' ? 'Apartando…' : 'Guardando…';
      input.readOnly = true;
      avisar('espera', [(tipo === 'apartado' ? 'Apartando ' : 'Guardando ') + etiqueta(a) + '… Puede tardar unos segundos; no cierres la página.']);
      cancelar.disabled = true;

      api.apartar(a.id, v.nombre, tipo === 'parecido').then(function (r) {
        a.ocupado = false;
        input.readOnly = false;
        avisar(null, null);
        enviar.disabled = false; enviar.removeAttribute('aria-busy'); enviar.textContent = tipo === 'apartado' ? 'Apartar' : 'Confirmar';
        cancelar.disabled = false;

        if (r.ok) {
          api.guardar(CLAVE_NOMBRE, v.nombre);
          a.estado = { apartado_por: r.estado ? r.estado.apartado_por : null, parecidos: r.estado ? r.estado.parecidos || [] : [], mio: r.tipo || tipo };
          cerrarPanel(a, false);
          var lineas = [tipo === 'apartado' ? 'Listo, apartaste: ' + etiqueta(a) + '.' : 'Listo: llevas algo parecido a ' + etiqueta(a) + '.'];
          if (!persistente) lineas.push('Este navegador no guarda datos: si después no puedes llevarlo, avísame por WhatsApp y yo lo suelto.');
          else if (r.primero_en_dispositivo) lineas.push('Si después no puedes, vuelve aquí desde este mismo celular y toca «Soltar».');
          mensaje(a, 'exito', lineas, null, true);
          actualizarBarra();
          return;
        }

        switch (r.codigo) {
          case 'nombre_invalido':
            mostrarError(textoNombre(r.datos && r.datos.motivo)); input.focus(); return;
          case 'ya_apartado': {
            var por = (r.datos && r.datos.por) || 'Alguien';
            a.estado = a.estado || { parecidos: [], mio: null };
            a.estado.apartado_por = por;
            pintar(a);
            enviar.hidden = true;
            titulo.textContent = 'Ya lo apartó alguien';
            avisar('conflicto', [por + ' acaba de apartar este. Puedes elegir otro o marcar «Llevo algo parecido».'], [
              boton('Marcar «Llevo algo parecido»', 'boton-primario', null, function () { abrirPanel(a, 'parecido', input.value); })
            ]);
            aviso.focus();
            actualizarBarra();
            return;
          }
          case 'sin_conexion':
            avisar('error', ['No se guardó. Revisa tu conexión.'], [
              boton('Reintentar', 'boton-primario', null, function () { enviar.click(); })
            ]);
            aviso.focus();
            return;
          case 'articulo_invalido':
            a.activo = false;
            break;
          case 'ya_registrado_distinto':
            cargar(true);
            break;
        }
        avisar('error', [textoError(r.codigo, r)]);
        aviso.focus();
      });
    });

    a.nodos.panel.appendChild(form);
    pintar(a);
    contar();
    if (input.value && !api.validarNombre(input.value).ok) mostrarError('');
    input.focus();
  }

  /* ---------- Soltar (confirmación de un paso) ---------- */
  function abrirSoltar(a) {
    if (abierto && abierto !== a) cerrarPanel(abierto, false);
    mensaje(a, null, null);
    vaciar(a.nodos.panel);
    abierto = a;
    a.panelAbierto = 'soltar';
    var esParecido = a.estado && a.estado.mio === 'parecido';
    var textoSi = esParecido ? 'Sí, ya no lo llevo' : 'Sí, soltar';
    var si = el('button', { type: 'button', class: 'boton boton-primario', text: textoSi });
    var no = boton('No', 'boton-texto', null, function () { cerrarPanel(a, true); });
    var aviso = el('div', { class: 'mensaje', role: 'status', tabindex: '-1' });
    var panel = el('div', { class: 'panel', role: 'group', 'aria-labelledby': 'ps-' + a.id }, [
      el('p', { class: 'panel-titulo', id: 'ps-' + a.id, text: esParecido ? '¿Quitar tu «parecido» en ' + etiqueta(a) + '?' : '¿Soltar ' + etiqueta(a) + '?' }),
      el('p', { class: 'panel-ayuda', text: esParecido ? 'Ya no aparecerás como que llevas algo parecido.' : 'Quedará disponible para que otra persona lo aparte.' }),
      el('div', { class: 'panel-acciones' }, [si, no]),
      aviso
    ]);
    panel.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && !a.ocupado) { e.preventDefault(); cerrarPanel(a, true); }
    });
    si.addEventListener('click', function () {
      if (a.ocupado) return;
      a.ocupado = true;
      si.disabled = true; si.setAttribute('aria-busy', 'true'); si.textContent = 'Soltando…'; no.disabled = true;
      vaciar(aviso);
      aviso.setAttribute('data-tipo', 'espera');
      aviso.appendChild(simbolo('…'));
      aviso.appendChild(el('div', { class: 'mensaje-cuerpo' }, [el('p', { text: 'Soltando ' + etiqueta(a) + '… Puede tardar unos segundos.' })]));
      api.soltar(a.id).then(function (r) {
        a.ocupado = false;
        si.disabled = false; si.removeAttribute('aria-busy'); si.textContent = textoSi; no.disabled = false;
        vaciar(aviso); aviso.removeAttribute('data-tipo');
        if (r.ok) {
          a.estado = { apartado_por: r.estado ? r.estado.apartado_por : null, parecidos: r.estado ? r.estado.parecidos || [] : [], mio: null };
          cerrarPanel(a, false);
          mensaje(a, 'exito', [r.liberado
            ? (esParecido ? 'Listo, quitaste tu «parecido» en ' + etiqueta(a) + '.' : 'Listo, soltaste ' + etiqueta(a) + '. Quedó disponible.')
            : 'Esto ya estaba suelto. Arriba ves cómo está ahora.'], null, true);
          actualizarBarra();
          return;
        }
        vaciar(aviso);
        aviso.setAttribute('data-tipo', 'error');
        aviso.appendChild(simbolo('!'));
        var cuerpo = el('div', { class: 'mensaje-cuerpo' }, [el('p', {
          text: r.codigo === 'sin_conexion' ? 'No se soltó. Revisa tu conexión.' : textoError(r.codigo, r)
        })]);
        if (r.codigo === 'sin_conexion') cuerpo.appendChild(el('div', { class: 'acciones' }, [boton('Reintentar', 'boton-primario', null, function () { si.click(); })]));
        aviso.appendChild(cuerpo);
        aviso.focus();
      });
    });
    a.nodos.panel.appendChild(panel);
    pintar(a);
    si.focus();
  }

  /* ---------- Barra de estado de la página ---------- */
  function actualizarBarra(textoForzado) {
    barra.setAttribute('data-estado', global);
    if (textoForzado) { barraTexto.textContent = textoForzado; return; }
    avisoConexion.hidden = global !== 'error';
    if (global === 'cargando') { barraTexto.textContent = 'Cargando lo apartado…'; barraRecargar.hidden = true; return; }
    if (global === 'error') {
      barraTexto.textContent = 'Sin conexión: no se puede apartar';
      barraRecargar.textContent = 'Reintentar';
      barraRecargar.hidden = false;
      return;
    }
    var activos = articulos.filter(function (a) { return a.activo; });
    var apartados = activos.filter(function (a) { return a.estado && a.estado.apartado_por; }).length;
    barraTexto.textContent = apartados === 0 ? 'Nada apartado todavía' : apartados + ' de ' + activos.length + ' apartados';
    barraRecargar.textContent = 'Actualizar';
    barraRecargar.hidden = false;
  }

  /* ---------- Cargar estado desde el servidor ---------- */
  function cargar(silencioso) {
    if (cargando) return;
    cargando = true;
    var primera = global !== 'listo';
    if (primera) { global = 'cargando'; pintarTodo(); actualizarBarra(); }
    else if (!silencioso) actualizarBarra('Actualizando…');
    barraRecargar.disabled = true;

    // Contrato §7: un reintento automático de `ver` a los 1,5 s antes de dar el error.
    api.verLista().then(function (r) {
      if (r.ok) return r;
      return new Promise(function (listo) { setTimeout(listo, REINTENTO_VER_MS); }).then(function () { return api.verLista(); });
    }).then(function (r) {
      cargando = false;
      barraRecargar.disabled = false;
      if (r.ok && Array.isArray(r.articulos)) {
        aplicarCatalogo(r.catalogo);
        var vistos = {};
        r.articulos.forEach(function (x) {
          vistos[x.id] = true;
          var a = porId[x.id];
          if (!a) return;
          a.activo = true;
          a.estado = { apartado_por: x.apartado_por || null, parecidos: Array.isArray(x.parecidos) ? x.parecidos : [], mio: x.mio || null };
        });
        articulos.forEach(function (a) { if (!vistos[a.id]) a.activo = false; });
        articulos.forEach(function (a) { if (a.nodos.mensaje.getAttribute('data-motivo') === 'conexion') { mensaje(a, null, null); a.nodos.mensaje.removeAttribute('data-motivo'); } });
        global = 'listo';
        ultimaCarga = Date.now();
        pintarTodo();
        actualizarBarra();
        return;
      }
      if (primera) {
        global = 'error';
        pintarTodo();
        actualizarBarra();
      } else {
        actualizarBarra('No se pudo actualizar');
        barraRecargar.textContent = 'Reintentar';
      }
    });
  }

  barraRecargar.addEventListener('click', function () { cargar(false); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && global === 'listo' && Date.now() - ultimaCarga > RECARGAR_TRAS_MS) cargar(true);
  });

  cargar(false);
})();
