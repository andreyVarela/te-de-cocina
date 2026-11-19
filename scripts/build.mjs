#!/usr/bin/env node
// Build del Té de cocina: catalogo.json + evento.json + site/ → dist/ y apps-script/Code.gs
// Node ≥ 18, solo módulos nativos. Contrato: docs/arquitectura/contrato.md §2 y §8.
//
// Uso:
//   node scripts/build.mjs             → valida todo, genera dist/ (una página por evento + inicio) y apps-script/Code.gs
//   node scripts/build.mjs --solo-code → valida el catálogo y genera solo Code.gs (no necesita site/ ni evento.json)
//   node scripts/build.mjs --demo      → además copia site/demo.js a dist/ (solo para probar en localhost con ?demo)
//
// Interfaz con site/ (la documenta el README, sección «Plantillas»):
//   {{NOMBRE}}   texto escapado para HTML        {{{NOMBRE}}}  HTML que genera el build
//   {{#campo}}…{{/campo}} bloque solo si el campo tiene valor; {{^campo}}…{{/campo}} solo si no.

import { createHash } from 'node:crypto';
import { Script } from 'node:vm';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(RAIZ, 'site');
const DIST = join(RAIZ, 'dist');
const APPS_SCRIPT = join(RAIZ, 'apps-script');
const CODE_GS = join(APPS_SCRIPT, 'Code.gs');
const SOLO_CODE = process.argv.includes('--solo-code');
const CON_DEMO = process.argv.includes('--demo');
const EN_ACTIONS = process.env.GITHUB_ACTIONS === 'true';

const ZONA = 'America/Costa_Rica';
const POR_CONFIRMAR = 'Por confirmar';
const NBSP = '\u00a0';
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CAMPOS_CATALOGO = new Set(['id', 'cat', 'que', 'producto', 'aviso', 'tienda', 'url', 'imagen',
  'precio_crc', 'cantidad', 'verificado', 'nota']);
const CAMPOS_RAIZ_EVENTO = new Set(['api_url', 'eventos']);
const CAMPOS_EVENTO = new Set(['slug', 'nombre', 'empieza_en', 'lugar']);
// Archivos de site/ que se publican sí o sí (contrato §2 y §8). index.html es la plantilla de cada evento
// (sale como <slug>.html) e inicio.html la portada que enlaza a los eventos (sale como index.html).
const SITE_OBLIGATORIOS = ['index.html', 'inicio.html', 'app.js', 'api.js', 'estilos.css',
  'partes/articulo.html', 'partes/categoria.html', 'partes/evento.html'];
// Lo que nunca va a dist/: fuentes de plantillas y el simulador local.
const SITE_NO_PUBLICAR = (rel) => rel === 'partes' || rel.startsWith('partes/') || (rel === 'demo.js' && !CON_DEMO);
// APIs de Google prohibidas en Logica.js (debe ser pura para probarse en Node).
const RE_API_GOOGLE = /\b(SpreadsheetApp|LockService|CacheService|ContentService|Utilities|Session|PropertiesService|UrlFetchApp)\s*\./;

// ---------------------------------------------------------------- utilidades

class ErrorBuild extends Error {}
const errores = [];
const fallo = (msg) => errores.push(msg);
const aviso = (msg) => console.warn(EN_ACTIONS ? `::warning::${msg}` : `AVISO: ${msg}`);
const cortarSiHayErrores = () => {
  if (errores.length) throw new ErrorBuild(errores.map((e) => `  - ${e}`).join('\n'));
};

function leerJson(ruta, nombre) {
  if (!existsSync(ruta)) throw new ErrorBuild(`  - Falta ${nombre} en la raíz del repo.`);
  try {
    return JSON.parse(readFileSync(ruta, 'utf8'));
  } catch (e) {
    throw new ErrorBuild(`  - ${nombre} no es JSON válido (${e.message}). Revisa comas y comillas.`);
  }
}

const escaparHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// JSON seguro dentro de <script type="application/json">.
const jsonParaScript = (v) => JSON.stringify(v)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const slug = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ₡1 600 (espacio duro: el precio nunca se parte en dos líneas).
const colones = (n) => `₡${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}`;

function textoPrecio(precio, cantidad) {
  if (!precio) return 'Sin precio';
  if (cantidad > 1) return `${colones(precio)} c/u · ${colones(precio * cantidad)} en total`;
  return colones(precio);
}

// ---------------------------------------------------------------- catálogo

function validarCatalogo(catalogo) {
  if (!Array.isArray(catalogo) || catalogo.length === 0) {
    throw new ErrorBuild('  - catalogo.json debe ser una lista [ ... ] con al menos un artículo.');
  }
  const vistos = new Map();
  catalogo.forEach((a, i) => {
    const donde = `catalogo.json, artículo ${i + 1}${a && a.id ? ` («${a.id}»)` : ''}`;
    if (!a || typeof a !== 'object' || Array.isArray(a)) return fallo(`${donde}: debe ser un objeto { ... }.`);
    if (typeof a.id !== 'string' || !ID_RE.test(a.id) || a.id.length < 2 || a.id.length > 40) {
      fallo(`${donde}: «id» falta o no sirve. Usa minúsculas, números y guiones (2 a 40), p. ej. "olla-tapa-20".`);
    } else if (vistos.has(a.id)) {
      fallo(`${donde}: el id «${a.id}» se repite (ya lo usa el artículo ${vistos.get(a.id)}). Cada id es único.`);
    } else {
      vistos.set(a.id, i + 1);
    }
    for (const campo of ['cat', 'que', 'producto', 'tienda']) {
      if (typeof a[campo] !== 'string' || !a[campo].trim()) fallo(`${donde}: falta «${campo}» (texto).`);
    }
    if (typeof a.url !== 'string' || !/^https:\/\//.test(a.url)) fallo(`${donde}: «url» debe empezar con https://`);
    if (a.imagen !== undefined && a.imagen !== '' && (typeof a.imagen !== 'string' || !/^https:\/\//.test(a.imagen))) {
      fallo(`${donde}: «imagen» debe empezar con https:// (o quitarla y poner la foto en site/img/${a.id || '<id>'}.jpg).`);
    }
    if (!Number.isInteger(a.precio_crc) || a.precio_crc < 0) fallo(`${donde}: «precio_crc» debe ser un número entero sin decimales ni ₡.`);
    if (a.cantidad !== undefined && (!Number.isInteger(a.cantidad) || a.cantidad < 1)) fallo(`${donde}: «cantidad» debe ser un entero ≥ 1.`);
    if (a.aviso !== undefined && a.aviso !== null && typeof a.aviso !== 'string') fallo(`${donde}: «aviso» debe ser texto.`);
    for (const k of Object.keys(a)) if (!CAMPOS_CATALOGO.has(k)) aviso(`${donde}: campo desconocido «${k}» (se ignora).`);
  });
  cortarSiHayErrores();
}

// ---------------------------------------------------------------- evento

function validarEvento(evento) {
  if (!evento || typeof evento !== 'object' || Array.isArray(evento)) {
    throw new ErrorBuild('  - evento.json debe ser un objeto { ... }.');
  }
  for (const k of Object.keys(evento)) {
    if (!k.startsWith('_') && !CAMPOS_RAIZ_EVENTO.has(k)) fallo(`evento.json: campo desconocido «${k}».`);
  }
  for (const k of CAMPOS_RAIZ_EVENTO) if (!(k in evento)) fallo(`evento.json: falta «${k}».`);
  cortarSiHayErrores();

  if (!Array.isArray(evento.eventos) || evento.eventos.length === 0) {
    throw new ErrorBuild('  - evento.json: «eventos» debe ser una lista con al menos un evento [ { ... } ].');
  }
  const slugs = new Set();
  evento.eventos.forEach((ev, i) => {
    const donde = `evento.json, evento ${i + 1}`;
    if (!ev || typeof ev !== 'object' || Array.isArray(ev)) { fallo(`${donde}: debe ser un objeto { ... }.`); return; }
    for (const k of Object.keys(ev)) {
      if (!k.startsWith('_') && !CAMPOS_EVENTO.has(k)) fallo(`${donde}: campo desconocido «${k}».`);
    }
    for (const k of CAMPOS_EVENTO) if (!(k in ev)) fallo(`${donde}: falta «${k}».`);
    if (typeof ev.slug !== 'string' || !ID_RE.test(ev.slug) || ev.slug === 'index') {
      fallo(`${donde}: «slug» va en minúsculas y sin espacios (p. ej. "familia"); es el final del link.`);
    } else if (slugs.has(ev.slug)) {
      fallo(`${donde}: el «slug» "${ev.slug}" está repetido.`);
    } else {
      slugs.add(ev.slug);
    }
    if (typeof ev.nombre !== 'string' || !ev.nombre.trim()) fallo(`${donde}: «nombre» no puede ir vacío.`);
    const e = ev.empieza_en;
    if (e !== null && e !== '') {
      if (typeof e !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/.test(e)
          || Number.isNaN(Date.parse(e))) {
        fallo(`${donde}: «empieza_en» debe ser null (Por confirmar) o fecha y hora con zona, `
          + 'p. ej. "2026-12-05T14:00:00-06:00" (Costa Rica es -06:00).');
      }
    }
    if (typeof ev.lugar !== 'string' || !ev.lugar.trim()) fallo(`${donde}: «lugar» no puede ir vacío.`);
  });

  const apiUrl = String(evento.api_url ?? '').trim();
  const pendiente = !apiUrl || /XXXX/i.test(apiUrl);
  if (!pendiente) {
    if (/docs\.google\.com\/spreadsheets/i.test(apiUrl)) {
      fallo('evento.json: en «api_url» pegaste el enlace de la HOJA. Bórralo ya (el repo es público) y pega la URL '
        + 'de la aplicación web: Implementar → Administrar implementaciones → copiar la que termina en /exec.');
    } else if (/\/dev\/?$/.test(apiUrl)) {
      fallo('evento.json: «api_url» termina en /dev (solo funciona para ti). Usa la URL de la implementación, la que termina en /exec.');
    } else if (!/^https:\/\/script\.google\.com\/(a\/macros\/[^/\s]+|macros)\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(apiUrl)) {
      fallo('evento.json: «api_url» debe verse como https://script.google.com/macros/s/AKfy.../exec (copiada tal cual, sin espacios ni ?).');
    }
  }
  cortarSiHayErrores();
  if (pendiente) {
    aviso('evento.json todavía tiene la «api_url» de ejemplo: la página se publica, pero no podrá ver ni guardar '
      + 'apartados hasta que pegues la URL /exec de la aplicación web (README, paso 4).');
  }
  return pendiente ? '' : apiUrl;
}

function textosFecha(empiezaEn) {
  if (empiezaEn === null || empiezaEn === '') {
    return { FECHA: POR_CONFIRMAR, HORA: POR_CONFIRMAR, FECHA_HORA: POR_CONFIRMAR, FECHA_ISO: '', FECHA_ESTADO: 'pendiente' };
  }
  const fmt = new Intl.DateTimeFormat('es-CR', {
    timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'long',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(empiezaEn)).map((x) => [x.type, x.value]));
  const periodo = (p.dayPeriod || '').replace(/[\u202f\u00a0]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(' ', NBSP);
  const fecha = `${p.weekday} ${p.day} de ${p.month}`;
  const hora = `${p.hour}:${p.minute}${NBSP}${periodo}`;
  return { FECHA: fecha, HORA: hora, FECHA_HORA: `${fecha} · ${hora}`, FECHA_ISO: empiezaEn, FECHA_ESTADO: 'confirmada' };
}

// ---------------------------------------------------------------- plantillas

const RE_SECCION = /\{\{([#^])\s*([A-Za-z_]+)\s*\}\}([\s\S]*?)\{\{\/\s*\2\s*\}\}/g;
const RE_MARCA = /\{\{\{\s*([A-Za-z_]+)\s*\}\}\}|\{\{\s*([A-Za-z_]+)\s*\}\}/g;

function renderizar(plantilla, datos, html, archivo) {
  const conSecciones = plantilla.replace(RE_SECCION, (_, tipo, nombre, dentro) => {
    if (!(nombre in datos)) {
      fallo(`${archivo}: {{${tipo}${nombre}}} no existe. Disponibles: ${Object.keys(datos).join(', ')}.`);
      return '';
    }
    const v = datos[nombre];
    const lleno = v !== null && v !== undefined && v !== '' && v !== false;
    return (tipo === '#') === lleno ? dentro : '';
  });
  return conSecciones.replace(RE_MARCA, (_, crudo, texto) => {
    if (crudo) {
      if (!(crudo in html)) {
        fallo(`${archivo}: {{{${crudo}}}} no existe aquí. HTML disponible: ${Object.keys(html).join(', ') || '(ninguno)'}.`);
        return '';
      }
      return html[crudo]();
    }
    if (!(texto in datos)) {
      fallo(`${archivo}: {{${texto}}} no existe. Disponibles: ${Object.keys(datos).join(', ')}.`);
      return '';
    }
    return escaparHtml(datos[texto]);
  });
}

function leerParte(nombre) {
  const ruta = join(SITE, 'partes', nombre);
  if (!existsSync(ruta)) throw new ErrorBuild(`  - Falta site/partes/${nombre}.`);
  return readFileSync(ruta, 'utf8');
}

function imagenDe(a) {
  for (const ext of ['webp', 'avif', 'jpg', 'jpeg', 'png']) {
    if (existsSync(join(SITE, 'img', `${a.id}.${ext}`))) return `img/${a.id}.${ext}`;
  }
  return a.imagen || '';
}

function datosArticulo(a, i) {
  const cantidad = a.cantidad ?? 1;
  return {
    id: a.id,
    n: i + 1,
    cat: a.cat,
    cat_id: slug(a.cat),
    que: a.que,
    producto: a.producto,
    aviso: a.aviso || '',
    tienda: a.tienda,
    url: a.url,
    imagen: imagenDe(a),
    precio: textoPrecio(a.precio_crc, cantidad),
    precio_crc: a.precio_crc,
    cantidad,
  };
}

function leerKanji() {
  const ruta = join(SITE, 'partes', 'categorias.json');
  return existsSync(ruta) ? leerJson(ruta, 'site/partes/categorias.json') : {};
}

function htmlCategorias(articulos) {
  const parteCat = leerParte('categoria.html');
  const parteArt = leerParte('articulo.html');
  const kanji = leerKanji();
  const grupos = new Map();
  for (const a of articulos) {
    if (!grupos.has(a.cat)) grupos.set(a.cat, []);
    grupos.get(a.cat).push(a);
  }
  return [...grupos].map(([cat, lista]) => {
    if (!(cat in kanji)) aviso(`La categoría «${cat}» no está en site/partes/categorias.json: sale sin kanji.`);
    const datosCat = {
      cat, cat_id: slug(cat), kanji: kanji[cat] || '',
      n: lista.length, n_texto: `${lista.length} ${lista.length === 1 ? 'artículo' : 'artículos'}`,
    };
    return renderizar(parteCat, datosCat, {
      ARTICULOS: () => lista.map((a) => renderizar(parteArt, a, {}, 'site/partes/articulo.html')).join('\n'),
    }, 'site/partes/categoria.html');
  }).join('\n');
}

// ---------------------------------------------------------------- apps-script/Code.gs

function leerFuente(nombre) {
  const ruta = join(APPS_SCRIPT, nombre);
  if (!existsSync(ruta)) throw new ErrorBuild(`  - Falta apps-script/${nombre}. Sin él no se puede generar Code.gs.`);
  return readFileSync(ruta, 'utf8');
}

function generarCodeGs(catalogo) {
  const logica = leerFuente('Logica.js');
  const servidor = leerFuente('Servidor.js');
  const prohibida = logica.split('\n').findIndex((l) => !/^\s*(\/\/|\*|\/\*)/.test(l) && RE_API_GOOGLE.test(l));
  if (prohibida !== -1) {
    fallo(`apps-script/Logica.js, línea ${prohibida + 1}: usa una API de Google. Logica.js debe ser pura; muévelo a Servidor.js.`);
  }
  cortarSiHayErrores();
  // Semilla de la pestaña «articulos» (setup() solo llena lo que falte). Nunca nota ni verificado.
  const filas = catalogo.map((a) => `  ${JSON.stringify({
    id: a.id, cat: a.cat, que: a.que, producto: a.producto, tienda: a.tienda, url: a.url, imagen: a.imagen || '',
    precio_crc: a.precio_crc, cantidad: a.cantidad ?? 1, aviso: a.aviso || '',
  })}`);
  const codigo = `/** @OnlyCurrentDoc */
// GENERADO por scripts/build.mjs: no editar a mano. Se edita apps-script/Logica.js,
// apps-script/Servidor.js o catalogo.json y se corre: node scripts/build.mjs
// Cómo se usa: copiar TODO este archivo y pegarlo en Extensiones → Apps Script → Código.gs (README).
// Artículos: ${catalogo.length}. Huella: __HUELLA__

// ===================================================================== catálogo (desde catalogo.json)
const CATALOGO = [
${filas.join(',\n')}
];

${logica.trim()}

${servidor.trim()}
`;
  const huella = createHash('sha256').update(codigo).digest('hex').slice(0, 12);
  const final = codigo.replace('__HUELLA__', huella);
  try {
    new Script(final, { filename: 'Code.gs' });  // compila (no ejecuta): atrapa errores de sintaxis y nombres repetidos
  } catch (e) {
    throw new ErrorBuild(`  - Code.gs no compila: ${e.message}. Revisa Logica.js / Servidor.js.`);
  }
  if (!final.startsWith('/** @OnlyCurrentDoc */')) fallo('Code.gs: falta /** @OnlyCurrentDoc */ en la primera línea (limita el permiso a esta hoja).');
  for (const fn of ['doGet', 'doPost', 'setup']) {
    if (!new RegExp(`\\bfunction ${fn}\\s*\\(`).test(final)) fallo(`Code.gs: falta la función ${fn}() (Servidor.js).`);
  }
  cortarSiHayErrores();
  return { codigo: final, huella };
}

// ---------------------------------------------------------------- site → dist

function archivosDe(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.')) return [];
    const ruta = join(dir, e.name);
    return e.isDirectory() ? archivosDe(ruta) : [ruta];
  });
}

function construirSitio(catalogo, evento, apiUrl) {
  if (!existsSync(SITE) || !statSync(SITE).isDirectory()) {
    throw new ErrorBuild('  - No existe la carpeta site/ (el frontend). '
      + 'Sin ella no hay página que publicar. Para generar solo Code.gs: node scripts/build.mjs --solo-code');
  }
  for (const f of SITE_OBLIGATORIOS) {
    if (!existsSync(join(SITE, f))) fallo(`Falta site/${f}.`);
  }
  cortarSiHayErrores();

  const articulos = catalogo.map(datosArticulo);
  const todos = archivosDe(SITE);
  const version = createHash('sha256');
  for (const f of todos.sort()) version.update(relative(SITE, f)).update(readFileSync(f));
  version.update(JSON.stringify(catalogo)).update(JSON.stringify(evento));

  const datosBase = {
    API_URL: apiUrl,
    TOTAL_ARTICULOS: catalogo.length,
    VERSION: version.digest('hex').slice(0, 10),
  };
  let categorias = null;
  const catalogoJson = () => jsonParaScript(articulos.map((a) => ({
    id: a.id, cat: a.cat, que: a.que, producto: a.producto, aviso: a.aviso || null,
    precio: a.precio, tienda: a.tienda, url: a.url, imagen: a.imagen,
  })));
  const htmlEvento = {
    CATEGORIAS: () => (categorias ??= htmlCategorias(articulos)),
    CATALOGO_JSON: catalogoJson,
    ARTICULOS_JSON: catalogoJson,  // alias
    // Kanji por categoría: app.js los usa al dibujar categorías nuevas que Andrey agregue en la hoja.
    KANJI_JSON: () => jsonParaScript(leerKanji()),
  };
  const datosDeEvento = (ev) => ({
    ...datosBase,
    ...textosFecha(ev.empieza_en),
    EVENTO: ev.nombre.trim(),
    LUGAR: ev.lugar.trim(),
  });
  const parteEvento = leerParte('evento.html');
  const htmlInicio = {
    EVENTOS: () => evento.eventos.map((ev) => {
      const d = datosDeEvento(ev);
      return renderizar(parteEvento, { slug: ev.slug, nombre: d.EVENTO, fecha_hora: d.FECHA_HORA, lugar: d.LUGAR },
        {}, 'site/partes/evento.html');
    }).join('\n'),
  };

  const revisar = (html, origen) => {
    if (!/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) {
      fallo(`${origen}: falta <meta name="robots" content="noindex, nofollow"> (contrato §7).`);
    }
    const resto = /\{\{[^}]*\}{0,3}/.exec(html);
    if (resto) fallo(`${origen}: quedó un marcador sin reemplazar: «${resto[0]}». Revisa la sintaxis {{nombre}} / {{{NOMBRE}}}.`);
    return { html };
  };

  const salidas = new Map();
  for (const ruta of todos) {
    const rel = relative(SITE, ruta);
    if (SITE_NO_PUBLICAR(rel)) continue;  // partes/ = fuente de plantillas; demo.js solo con --demo
    if (rel === 'index.html') {
      // Plantilla de evento: una página por evento, todas contra la misma hoja y la misma lista.
      const plantilla = readFileSync(ruta, 'utf8');
      for (const ev of evento.eventos) {
        salidas.set(`${ev.slug}.html`, revisar(renderizar(plantilla, datosDeEvento(ev), htmlEvento, 'site/index.html'),
          `site/index.html (${ev.slug})`));
      }
    } else if (rel === 'inicio.html') {
      salidas.set('index.html', revisar(renderizar(readFileSync(ruta, 'utf8'), datosBase, htmlInicio, 'site/inicio.html'),
        'site/inicio.html'));
    } else if (!rel.includes('/') && rel.endsWith('.html')) {
      fallo(`site/${rel}: solo se publican site/index.html (plantilla de evento) y site/inicio.html (portada).`);
    } else {
      salidas.set(rel, { copiar: ruta });  // se copia tal cual
    }
  }
  cortarSiHayErrores();

  rmSync(DIST, { recursive: true, force: true });
  for (const [destino, salida] of salidas) {
    const ruta = join(DIST, destino);
    mkdirSync(dirname(ruta), { recursive: true });
    if (salida.html !== undefined) writeFileSync(ruta, salida.html);
    else cpSync(salida.copiar, ruta);
  }
  writeFileSync(join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  writeFileSync(join(DIST, '.nojekyll'), '');
  return salidas.size;
}

// ---------------------------------------------------------------- principal

try {
  const catalogo = leerJson(join(RAIZ, 'catalogo.json'), 'catalogo.json');
  validarCatalogo(catalogo);
  let evento = null;
  let apiUrl = '';
  if (!SOLO_CODE) {
    evento = leerJson(join(RAIZ, 'evento.json'), 'evento.json');
    apiUrl = validarEvento(evento);
  }

  const { codigo, huella } = generarCodeGs(catalogo);
  const anterior = existsSync(CODE_GS) ? readFileSync(CODE_GS, 'utf8') : '';
  if (codigo !== anterior) {
    writeFileSync(CODE_GS, codigo);
    if (EN_ACTIONS) {
      aviso('apps-script/Code.gs del repo no coincide con lo que genera el build: corre node scripts/build.mjs, '
        + 'haz commit de Code.gs, pégalo en Apps Script, corre setup() y publica «Nueva versión».');
    } else {
      aviso(`apps-script/Code.gs cambió (huella ${huella}): pégalo de nuevo en Apps Script, corre setup() y publica «Nueva versión» (README).`);
    }
  }
  console.log(`OK: ${catalogo.length} artículos validados; apps-script/Code.gs huella ${huella}.`);

  if (!SOLO_CODE) {
    const n = construirSitio(catalogo, evento, apiUrl);
    const fechas = evento.eventos.map((ev) => `${ev.slug}: ${textosFecha(ev.empieza_en).FECHA_HORA.replace(/\u00a0/g, ' ')}`);
    console.log(`OK: dist/ con ${n} archivos + robots.txt. ${fechas.join(' · ')} · API: ${apiUrl || '(pendiente)'}`);
  }
} catch (e) {
  if (e instanceof ErrorBuild) {
    console.error(`El build no se pudo completar:\n${e.message}`);
    if (EN_ACTIONS) console.error('::error::El build falló. Mira el detalle arriba.');
    process.exit(1);
  }
  throw e;
}
