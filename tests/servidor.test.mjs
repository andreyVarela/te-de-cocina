// Prueba de humo de apps-script/Code.gs (lo que Andrey pega) con dobles en memoria de las APIs de
// Google. No reemplaza tests/contrato.sh contra la web app real: atrapa errores de la capa fina
// (encabezados, appendRow, lock, caché, setup idempotente) antes de pegar nada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const RAIZ = new URL('..', import.meta.url);
execFileSync(process.execPath, ['scripts/build.mjs', '--solo-code'], { cwd: RAIZ, stdio: 'pipe' });
const CODE = readFileSync(new URL('apps-script/Code.gs', RAIZ), 'utf8');
const CATALOGO = JSON.parse(readFileSync(new URL('catalogo.json', RAIZ), 'utf8'));
// Un artículo real cualquiera (el segundo), para no atar las pruebas a lo que tenga el catálogo hoy.
const ART = CATALOGO[1].id;

// ---------------------------------------------------------------- dobles de Google

const encadenable = () => new Proxy(function () {}, { get: (t, k) => (k === 'build' ? () => ({}) : () => encadenable()) });

function a1(ref) {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  let c = 0;
  for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64;
  return [Number(m[2]), c];
}

function crearMundo() {
  const estado = { lockOcupado: false, enLock: false, escriturasFueraDeLock: 0, flushes: 0 };
  const cache = new Map();

  class Hoja {
    constructor(nombre) { this.nombre = nombre; this.d = []; this.maxRows = 1000; }
    getName() { return this.nombre; }
    getLastRow() { return this.d.length; }
    getLastColumn() { return this.d.reduce((m, f) => Math.max(m, f.length), 0); }
    getMaxRows() { return Math.max(this.maxRows, this.d.length); }
    insertRowsAfter(_, n) { this.maxRows += n; }
    getDataRange() { return new Rango(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); }
    getRange(r, c, nr = 1, nc = 1) {
      if (typeof r === 'string') {
        const [fr, fc] = a1(r);
        return new Rango(this, fr, fc, 1, 1);
      }
      // Como Sheets: pedir filas más allá del máximo de la hoja lanza «out of bounds».
      if (r + nr - 1 > this.getMaxRows()) throw new Error(`Rango fuera de la hoja ${this.nombre}: fila ${r + nr - 1} > ${this.getMaxRows()}`);
      return new Rango(this, r, c, nr, nc);
    }
    appendRow(fila) {
      if (this.nombre === 'registros' && !estado.enLock) estado.escriturasFueraDeLock++;
      this.d.push([...fila]);
    }
    leer(r, c) { return (this.d[r - 1] || [])[c - 1] ?? ''; }
    escribir(r, c, v) {
      if (this.nombre === 'registros' && r > 1 && !estado.enLock && estado.vigilarLock) estado.escriturasFueraDeLock++;
      while (this.d.length < r) this.d.push([]);
      const f = this.d[r - 1];
      while (f.length < c) f.push('');
      f[c - 1] = v;
    }
    clear() { this.d = []; return this; }
    protect() { return encadenable(); }
    setFrozenRows() {}
    setColumnWidth() {}
    clearConditionalFormatRules() {}
    setConditionalFormatRules() {}
  }

  class Rango {
    constructor(h, r, c, nr, nc) { Object.assign(this, { h, r, c, nr, nc }); }
    getValues() {
      return Array.from({ length: this.nr }, (_, i) => Array.from({ length: this.nc }, (_, j) => this.h.leer(this.r + i, this.c + j)));
    }
    setValues(v) { v.forEach((f, i) => f.forEach((x, j) => this.h.escribir(this.r + i, this.c + j, x))); return this; }
    setValue(v) { this.h.escribir(this.r, this.c, v); return this; }
    setFormula(f) { return this.setValue(f); }
    setFormulas(v) { return this.setValues(v); }
    getDisplayValue() { return estado.rechazarPuntoYComa && String(this.h.leer(this.r, this.c)).includes(';') ? '#ERROR!' : 'ok'; }
    setNumberFormat() { return this; }
    setFontWeight() { return this; }
    setDataValidation() { return this; }
    protect() { return encadenable(); }
  }

  const hojas = new Map();
  const libro = {
    zona: 'America/New_York',
    getSheetByName: (n) => hojas.get(n) || null,
    insertSheet: (n) => { const h = new Hoja(n); hojas.set(n, h); return h; },
    setSpreadsheetTimeZone(z) { this.zona = z; },
    getSpreadsheetTimeZone() { return this.zona; },
    getProtections: () => [],
  };

  const globales = {
    console: { log() {}, warn() {}, error: (...a) => { estado.ultimoError = a.join(' '); } },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => libro,
      flush: () => { estado.flushes++; },
      newDataValidation: encadenable,
      newConditionalFormatRule: encadenable,
      ProtectionType: { SHEET: 'SHEET', RANGE: 'RANGE' },
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => { if (estado.lockOcupado) return false; estado.enLock = true; return true; },
        releaseLock: () => { estado.enLock = false; },
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (cache.has(k) ? cache.get(k) : null),
        getAll: (ks) => Object.fromEntries(ks.filter((k) => cache.has(k)).map((k) => [k, cache.get(k)])),
        put: (k, v) => { cache.set(k, String(v)); },
      }),
    },
    ContentService: {
      MimeType: { JSON: 'JSON' },
      createTextOutput: (s) => ({ mime: null, setMimeType(m) { this.mime = m; return this; }, getContent: () => s }),
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      computeDigest: (_, t) => [...createHash('sha256').update(t, 'utf8').digest()].map((b) => (b > 127 ? b - 256 : b)),
    },
  };
  const ctx = createContext(globales);
  runInContext(CODE, ctx, { filename: 'Code.gs' });
  const llamar = (fn, e) => {
    const salida = runInContext(fn, ctx)(e);
    assert.equal(salida.mime, 'JSON');
    return JSON.parse(salida.getContent());
  };
  return {
    estado, cache, hojas, ctx,
    setup: () => runInContext('setup', ctx)(),
    ver: (token) => llamar('doGet', { parameter: token === undefined ? { accion: 'ver' } : { accion: 'ver', token } }),
    get: (parameter) => llamar('doGet', { parameter }),
    post: (cuerpo) => llamar('doPost', { postData: { contents: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo) } }),
    tabla(nombre) {
      const [enc, ...filas] = hojas.get(nombre).d;
      return filas.map((f) => Object.fromEntries(enc.map((h, i) => [h, f[i] ?? ''])));
    },
  };
}

const tok = () => randomBytes(32).toString('hex');
const sha = (t) => createHash('sha256').update(t).digest('hex');
const apartar = (articulo_id, nombre, token, tipo = 'apartado') => ({ accion: 'apartar', articulo_id, nombre, tipo, token });

// ---------------------------------------------------------------- pruebas

test('setup() crea las tres pestañas, carga el catálogo y es idempotente', () => {
  const m = crearMundo();
  m.setup();
  assert.deepEqual([...m.hojas.keys()].sort(), ['articulos', 'registros', 'resumen']);
  assert.equal(m.hojas.get('articulos').d[0].join(','), 'id,que,producto,cantidad,orden,activo');
  assert.equal(m.hojas.get('registros').d[0].join(','), 'id_articulo,tipo,nombre,hash_token,creado,estado,liberado,origen');
  let arts = m.tabla('articulos');
  assert.equal(arts.length, CATALOGO.length);
  assert.ok(arts.every((a) => a.activo === 'si'));
  assert.deepEqual(arts.map((a) => a.id), CATALOGO.map((a) => a.id));
  assert.equal(m.hojas.get('resumen').d[0][0].startsWith('="Apartados: "'), true);
  assert.equal(m.ctx.SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'America/Costa_Rica');

  m.setup();
  assert.equal(m.tabla('articulos').length, CATALOGO.length);

  runInContext('CATALOGO.pop()', m.ctx);  // quitar un artículo del JSON
  m.setup();
  arts = m.tabla('articulos');
  assert.equal(arts.length, CATALOGO.length);  // no se borra
  assert.equal(arts.at(-1).activo, 'no');
  assert.equal(m.ver().articulos.length, CATALOGO.length - 1);
});

test('Code.gs limita el permiso a esta hoja y setup() no deja fórmulas desde el catálogo', () => {
  assert.ok(CODE.startsWith('/** @OnlyCurrentDoc */'));
  const m = crearMundo();
  runInContext('CATALOGO[0].que = "=IMPORTDATA(\\"http://x\\")"; CATALOGO[0].producto = "+1"', m.ctx);
  m.setup();
  const [a] = m.tabla('articulos');
  assert.equal(a.que, '\'=IMPORTDATA("http://x")');
  assert.equal(a.producto, "'+1");
});

test('setup() usa «,» si Sheets rechaza «;» y las fórmulas no traen restos del otro separador', () => {
  const m = crearMundo();
  m.estado.rechazarPuntoYComa = true;
  m.setup();
  const formulas = m.hojas.get('resumen').d.flat().filter((v) => typeof v === 'string' && v.startsWith('='));
  assert.ok(formulas.length > CATALOGO.length);
  for (const f of formulas) assert.ok(!f.replace(/"[^"]*"/g, '').includes(';'), f);
});

test('flujo completo: ver, apartar, repetido, carrera, soltar solo con mi token', () => {
  const m = crearMundo();
  m.setup();
  m.estado.vigilarLock = true;
  const t1 = tok();
  const t2 = tok();

  const v0 = m.ver();
  assert.deepEqual(Object.keys(v0).sort(), ['articulos', 'generado_en', 'ok']);
  assert.deepEqual(v0.articulos[0], { id: CATALOGO[0].id, apartado_por: null, parecidos: [], mio: null });

  const a = m.post(apartar(ART, '  María   José Vargas ', t1));
  assert.equal(a.ok, true);
  assert.deepEqual(a, {
    ok: true, articulo_id: ART, tipo: 'apartado', nombre: 'María José Vargas', nombre_pila: 'María',
    repetido: false, primero_en_dispositivo: true, estado: { apartado_por: 'María', parecidos: [] },
  });
  const [fila] = m.tabla('registros');
  assert.equal(fila.hash_token, sha(t1));
  assert.equal(fila.estado, 'activo');
  assert.equal(fila.origen, 'invitado');
  assert.ok(fila.creado instanceof Date || Object.prototype.toString.call(fila.creado) === '[object Date]');
  assert.ok(!JSON.stringify(m.hojas.get('registros').d).includes(t1), 'el token nunca se guarda');

  assert.equal(m.post(apartar(ART, 'María José Vargas', t1)).repetido, true);
  assert.equal(m.tabla('registros').length, 1);

  const carrera = m.post(apartar(ART, 'Luis', t2));
  assert.equal(carrera.codigo, 'ya_apartado');
  assert.deepEqual(carrera.datos, { por: 'María' });

  const parecido = m.post(apartar(ART, 'Luis Mora', t2, 'parecido'));
  assert.deepEqual(parecido.estado, { apartado_por: 'María', parecidos: ['Luis'] });

  // ver refleja lo escrito (caché invalidada) y `mio` depende del token.
  const lic = (v) => v.articulos.find((x) => x.id === ART);
  assert.deepEqual(lic(m.ver(t1)), { id: ART, apartado_por: 'María', parecidos: ['Luis'], mio: 'apartado' });
  assert.equal(lic(m.ver(t2)).mio, 'parecido');
  assert.equal(lic(m.ver('no-es-token')).mio, null);
  assert.ok(!JSON.stringify(m.ver(t1)).includes('Vargas'));

  // Otro token no suelta lo mío.
  assert.deepEqual(m.post({ accion: 'soltar', articulo_id: ART, token: tok() }),
    { ok: true, liberado: false, estado: { apartado_por: 'María', parecidos: ['Luis'] } });
  const s = m.post({ accion: 'soltar', articulo_id: ART, token: t1 });
  assert.deepEqual(s, { ok: true, liberado: true, estado: { apartado_por: null, parecidos: ['Luis'] } });
  assert.equal(m.tabla('registros')[0].estado, 'liberado');
  assert.ok(m.tabla('registros')[0].liberado);
  assert.equal(m.post({ accion: 'soltar', articulo_id: ART, token: t1 }).liberado, false);
  assert.equal(m.estado.escriturasFueraDeLock, 0, 'nunca se escribe registros fuera del lock');
});

test('lock ocupado → demasiadas_solicitudes{ocupado} y no se escribe nada', () => {
  const m = crearMundo();
  m.setup();
  m.estado.lockOcupado = true;
  const r = m.post(apartar(ART, 'Ana', tok()));
  assert.equal(r.codigo, 'demasiadas_solicitudes');
  assert.deepEqual(r.datos, { motivo: 'ocupado', reintentar_en_s: 3 });
  assert.equal(m.tabla('registros').length, 0);
});

test('frecuencia: la 7.ª escritura del mismo dispositivo en un minuto se rechaza', () => {
  const m = crearMundo();
  m.setup();
  const t = tok();
  const ids = CATALOGO.map((a) => a.id);
  for (let i = 0; i < 3; i++) {
    assert.equal(m.post(apartar(ids[i], 'Ana', t)).ok, true);
    assert.equal(m.post({ accion: 'soltar', articulo_id: ids[i], token: t }).ok, true);
  }
  const r = m.post(apartar(ids[5], 'Ana', t));
  assert.equal(r.codigo, 'demasiadas_solicitudes');
  assert.equal(r.datos.motivo, 'frecuencia');
});

test('nombres con =, +, - o @ se guardan como texto, no como fórmula', () => {
  const m = crearMundo();
  m.setup();
  m.post(apartar(ART, '=IMPORTXML("http://x";"//a")', tok()));
  assert.equal(m.tabla('registros')[0].nombre, '\'=IMPORTXML("http://x";"//a")');
});

test('columnas reordenadas por Andrey: el script escribe por encabezado', () => {
  const m = crearMundo();
  m.setup();
  const h = m.hojas.get('registros');
  h.d[0] = ['nota de Andrey', 'nombre', 'estado', 'id_articulo', 'tipo', 'hash_token', 'creado', 'liberado', 'origen'];
  const t = tok();
  assert.equal(m.post(apartar('tazas', 'Rosa', t, 'parecido')).ok, true);
  const [f] = m.tabla('registros');
  assert.equal(f.nombre, 'Rosa');
  assert.equal(f.id_articulo, 'tazas');
  assert.equal(f.hash_token, sha(t));
  assert.equal(f['nota de Andrey'], '');
  // Fila a mano de Andrey, sin estado ni hash: cuenta como activa.
  h.d.push(['', 'Tía Rosa Vargas', '', ART, 'apartado', '', '', '', 'admin']);
  const lic = m.ver().articulos.find((x) => x.id === ART);
  assert.equal(lic.apartado_por, 'Tía');
});

test('entradas inválidas y errores internos usan el sobre sin filtrar detalles', () => {
  const m = crearMundo();
  m.setup();
  assert.equal(m.get({ accion: 'apartar' }).codigo, 'accion_invalida');
  assert.equal(m.get({}).codigo, 'accion_invalida');
  assert.equal(m.post({ accion: 'ver' }).codigo, 'accion_invalida');
  assert.equal(m.post('no es json').codigo, 'entrada_invalida');
  assert.equal(m.post('[1,2]').codigo, 'entrada_invalida');
  assert.equal(m.post('x'.repeat(5000)).codigo, 'entrada_invalida');
  assert.equal(m.post({ accion: 'apartar', articulo_id: ART }).codigo, 'entrada_invalida');
  assert.equal(m.post(apartar(ART, 'A', tok())).codigo, 'nombre_invalido');
  assert.equal(m.post(apartar(ART, 'Ana', 'abc')).codigo, 'token_invalido');
  m.hojas.delete('registros');
  const r = m.ver();
  assert.deepEqual(Object.keys(r).sort(), ['codigo', 'datos', 'mensaje', 'ok']);
  assert.equal(r.codigo, 'error_interno');
  assert.ok(!r.mensaje.includes('registros'), 'el mensaje público no trae detalles internos');
  assert.match(m.estado.ultimoError, /Falta la pestaña «registros»/);
});
