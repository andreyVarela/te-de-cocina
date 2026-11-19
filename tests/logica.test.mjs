// Pruebas de apps-script/Logica.js (contrato §9). Correr: node --test tests/
// Logica.js se carga como script clásico (como en Apps Script, sin módulos): si usara una API de
// Google, aquí fallaría con ReferenceError. Mismo realm que la prueba para que deepEqual compare bien.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInThisContext } from 'node:vm';

const EXPORTA = ['LIMITES', 'validarToken', 'validarNombre', 'nombrePila', 'validarArticulo', 'prepararApartar',
  'prepararSoltar', 'proyectarPublico', 'decidirApartar', 'decidirSoltar', 'normalizarArticulos',
  'normalizarRegistros', 'estadoArticulo', 'decidirFrecuencia', 'controlFrecuencia', 'textoSeguroParaCelda',
  'formulaConSeparador', 'letraColumna'];
const codigo = readFileSync(new URL('../apps-script/Logica.js', import.meta.url), 'utf8');
const L = runInThisContext(`(function () {\n${codigo}\n;return { ${EXPORTA.join(', ')} };\n})()`, { filename: 'Logica.js' });

const sha = (t) => createHash('sha256').update(t, 'utf8').digest('hex');
const nuevoToken = () => randomBytes(32).toString('hex');
const T1 = nuevoToken();
const T2 = nuevoToken();
const H1 = sha(T1);
const H2 = sha(T2);

const ARTICULOS = L.normalizarArticulos([
  { id: 'licuadora', orden: 2, activo: 'si' },
  { id: 'sarten-20', orden: 1, activo: 'si' },
  { id: 'tazas', orden: 3, activo: 'si' },
  { id: 'vieja', orden: 4, activo: 'no' },
]);

/** Simula la hoja `registros`: lee (normaliza) y escribe como lo hace Servidor.js dentro del lock. */
function hoja(filasIniciales = []) {
  const filas = filasIniciales.map((f, i) => ({ fila: i + 2, ...f }));
  return {
    filas,
    leer: () => L.normalizarRegistros(filas),
    apartar(entrada) {
      const d = L.decidirApartar(this.leer(), entrada, L.LIMITES);
      if (d.accion === 'insertar') filas.push({ ...d.fila, fila: filas.length + 2, creado: new Date(), liberado: '' });
      return d;
    },
    soltar(entrada) {
      const d = L.decidirSoltar(this.leer(), entrada);
      for (const n of d.filas) {
        const f = filas.find((x) => x.fila === n);
        f.estado = 'liberado';
        f.liberado = new Date();
      }
      return d;
    },
  };
}
const ent = (articulo, nombre, tipo, hash) => ({ articulo, nombre, tipo, hash });

// ---------------------------------------------------------------- §9.1 doble toque

test('1. doble apartar mismo hash/artículo/tipo → el segundo es repetido y no agrega fila', () => {
  const h = hoja();
  const a = h.apartar(ent('licuadora', 'María José', 'apartado', H1));
  assert.equal(a.accion, 'insertar');
  assert.equal(a.respuesta.repetido, false);
  assert.equal(a.respuesta.primero_en_dispositivo, true);
  const b = h.apartar(ent('licuadora', 'María José', 'apartado', H1));
  assert.equal(b.accion, 'repetido');
  assert.equal(b.respuesta.ok, true);
  assert.equal(b.respuesta.repetido, true);
  assert.equal(b.respuesta.primero_en_dispositivo, false);
  assert.equal(h.filas.length, 1);
});

// ---------------------------------------------------------------- §9.2 carrera dentro del lock

test('2. carrera: dos hashes apartan lo mismo; serializados por el lock, el segundo recibe ya_apartado{por}', () => {
  const h = hoja();
  // Dentro del lock cada petición relee la hoja; la segunda ya ve la fila de la primera.
  const ganador = h.apartar(ent('licuadora', 'Ana Lucía Mora', 'apartado', H1));
  const perdedor = h.apartar(ent('licuadora', 'Luis', 'apartado', H2));
  assert.equal(ganador.accion, 'insertar');
  assert.equal(perdedor.accion, 'error');
  assert.equal(perdedor.respuesta.ok, false);
  assert.equal(perdedor.respuesta.codigo, 'ya_apartado');
  assert.deepEqual(perdedor.respuesta.datos, { por: 'Ana' });
  assert.match(perdedor.respuesta.mensaje, /^Ana acaba de apartar este/);
  assert.equal(h.filas.length, 1);
});

test('2b. carrera simulada sin releer (decisión con la foto vieja) sí duplicaría: por eso se lee DENTRO del lock', () => {
  const h = hoja();
  const foto = h.leer();  // ambos leyeron antes de escribir
  const a = L.decidirApartar(foto, ent('licuadora', 'Ana', 'apartado', H1), L.LIMITES);
  const b = L.decidirApartar(foto, ent('licuadora', 'Luis', 'apartado', H2), L.LIMITES);
  assert.equal(a.accion, 'insertar');
  assert.equal(b.accion, 'insertar');  // documenta el porqué del lock + relectura
});

// ---------------------------------------------------------------- §9.3 tope

test('3. sexto apartado del mismo dispositivo → tope_dispositivo; tras soltar uno, entra', () => {
  const h = hoja();
  const ids = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
  for (const id of ids.slice(0, 5)) assert.equal(h.apartar(ent(id, 'Ana', 'apartado', H1)).accion, 'insertar');
  const sexto = h.apartar(ent('a6', 'Ana', 'apartado', H1));
  assert.equal(sexto.respuesta.codigo, 'tope_dispositivo');
  assert.deepEqual(sexto.respuesta.datos, { tope: 5 });
  // Parecidos no cuentan para el tope.
  assert.equal(h.apartar(ent('a6', 'Ana', 'parecido', H1)).accion, 'insertar');
  assert.equal(h.soltar({ articulo: 'a6', hash: H1 }).respuesta.liberado, true);
  assert.equal(h.soltar({ articulo: 'a1', hash: H1 }).respuesta.liberado, true);
  assert.equal(h.apartar(ent('a6', 'Ana', 'apartado', H1)).accion, 'insertar');
});

// ---------------------------------------------------------------- §9.4 parecido no bloquea

test('4. parecido no bloquea: dos parecidos + un apartado conviven y ver muestra las tres pilas', () => {
  const h = hoja();
  assert.equal(h.apartar(ent('licuadora', 'Luis Pérez', 'parecido', H1)).accion, 'insertar');
  assert.equal(h.apartar(ent('licuadora', 'Marta Solís', 'parecido', nuevoToken())).accion, 'insertar');
  const ap = h.apartar(ent('licuadora', 'Ana Vargas', 'apartado', H2));
  assert.equal(ap.accion, 'insertar');
  assert.deepEqual(ap.respuesta.estado, { apartado_por: 'Ana', parecidos: ['Luis', 'Marta'] });
  const ver = L.proyectarPublico(ARTICULOS, h.leer(), H1, new Date());
  const lic = ver.articulos.find((a) => a.id === 'licuadora');
  assert.deepEqual(lic, { id: 'licuadora', apartado_por: 'Ana', parecidos: ['Luis', 'Marta'], mio: 'parecido' });
});

// ---------------------------------------------------------------- §9.5 tipo distinto

test('5. mismo hash con parecido activo pide apartado → ya_registrado_distinto{tipo_actual:parecido}', () => {
  const h = hoja();
  h.apartar(ent('licuadora', 'Luis', 'parecido', H1));
  const r = h.apartar(ent('licuadora', 'Luis', 'apartado', H1));
  assert.equal(r.respuesta.codigo, 'ya_registrado_distinto');
  assert.deepEqual(r.respuesta.datos, { tipo_actual: 'parecido' });
  const r2 = hoja([{ id_articulo: 'tazas', tipo: 'apartado', nombre: 'Luis', hash_token: H1, estado: 'activo' }])
    .apartar(ent('tazas', 'Luis', 'parecido', H1));
  assert.deepEqual(r2.respuesta.datos, { tipo_actual: 'apartado' });
});

// ---------------------------------------------------------------- §9.6 soltar

test('6. soltar sin fila activa → 0 filas y liberado:false con el estado real', () => {
  const h = hoja([{ id_articulo: 'licuadora', tipo: 'apartado', nombre: 'Ana', hash_token: H2, estado: 'activo' }]);
  const r = h.soltar({ articulo: 'licuadora', hash: H1 });
  assert.deepEqual(r.filas, []);
  assert.deepEqual(r.respuesta, { ok: true, liberado: false, estado: { apartado_por: 'Ana', parecidos: [] } });
});

test('6b. soltar solo suelta lo de MI token (ni lo de otro ni lo que Andrey apartó a mano)', () => {
  const h = hoja([
    { id_articulo: 'licuadora', tipo: 'apartado', nombre: 'Ana', hash_token: H2, estado: 'activo' },
    { id_articulo: 'tazas', tipo: 'apartado', nombre: 'Tía Rosa', hash_token: '', estado: 'activo', origen: 'admin' },
  ]);
  assert.equal(h.soltar({ articulo: 'licuadora', hash: H1 }).respuesta.liberado, false);
  assert.equal(h.soltar({ articulo: 'tazas', hash: H1 }).respuesta.liberado, false);
  assert.equal(h.soltar({ articulo: 'tazas', hash: '' }).respuesta.liberado, false);
  assert.ok(h.filas.every((f) => f.estado === 'activo'));
  const mio = h.soltar({ articulo: 'licuadora', hash: H2 });
  assert.deepEqual(mio.filas, [2]);
  assert.deepEqual(mio.respuesta.estado, { apartado_por: null, parecidos: [] });
  // Idempotente: la segunda vez no hay nada que soltar y no es error.
  assert.equal(h.soltar({ articulo: 'licuadora', hash: H2 }).respuesta.liberado, false);
});

// ---------------------------------------------------------------- §9.7 nombres

test('7. validarNombre y nombrePila', () => {
  assert.deepEqual(L.validarNombre('  Ana   María '), { ok: true, nombre: 'Ana María' });
  assert.equal(L.nombrePila('Ana María'), 'Ana');
  const motivo = (n) => L.validarNombre(n).datos?.motivo;
  assert.equal(motivo('A'), 'corto');
  assert.equal(motivo('   '), 'corto');
  assert.equal(motivo(''), 'corto');
  assert.equal(motivo('a'.repeat(41)), 'largo');
  assert.equal(L.validarNombre('a'.repeat(40)).ok, true);
  assert.equal(L.validarNombre('<script>alert(1)</script>').ok, true);
  assert.equal(motivo('1234'), 'caracteres');
  assert.equal(motivo('a\tb'), 'caracteres');
  assert.equal(motivo('An\u0000a'), 'caracteres');
  assert.equal(motivo('🎁🎁'), 'caracteres');
  assert.deepEqual(L.validarNombre('Ñandú 🎁'), { ok: true, nombre: 'Ñandú 🎁' });
  assert.equal(L.validarNombre('Ana\n').ok, true);  // salto final se recorta
  assert.equal(L.validarNombre('😀'.repeat(39) + 'a').ok, true);  // emoji cuenta 1
  assert.equal(L.validarNombre('Ana').codigo, undefined);
  assert.equal(L.validarNombre('A').codigo, 'nombre_invalido');
  assert.equal(L.nombrePila(''), 'Alguien');
});

// ---------------------------------------------------------------- §9.8 proyección pública

test('8. ver: solo id/apartado_por/parecidos/mio, estado vacío = activo, ids desconocidos se ignoran', () => {
  const h = hoja([
    { id_articulo: 'licuadora', tipo: 'apartado', nombre: 'María José Vargas', hash_token: H1, estado: 'activo', origen: 'invitado', creado: new Date() },
    { id_articulo: 'tazas', tipo: 'Apartado', nombre: 'Tía Rosa', hash_token: '', estado: '', origen: 'admin' },
    { id_articulo: 'no-existe', tipo: 'apartado', nombre: 'Fantasma', hash_token: '', estado: 'activo' },
    { id_articulo: 'sarten-20', tipo: 'apartado', nombre: 'Ex', hash_token: H2, estado: 'liberado' },
    { id_articulo: 'vieja', tipo: 'apartado', nombre: 'Viejo', hash_token: H1, estado: 'activo' },
  ]);
  const ver = L.proyectarPublico(ARTICULOS, h.leer(), H1, new Date('2026-11-19T18:00:00Z'));
  assert.deepEqual(Object.keys(ver).sort(), ['articulos', 'generado_en', 'ok']);
  assert.equal(ver.generado_en, '2026-11-19T18:00:00.000Z');
  assert.deepEqual(ver.articulos.map((a) => a.id), ['sarten-20', 'licuadora', 'tazas']);  // en orden y sin inactivos
  for (const a of ver.articulos) assert.deepEqual(Object.keys(a).sort(), ['apartado_por', 'id', 'mio', 'parecidos']);
  const json = JSON.stringify(ver);
  for (const prohibido of ['María José', 'Vargas', H1, H2, 'hash_token', 'creado', 'origen', 'nombre', 'Fantasma', 'invitado', 'admin']) {
    assert.ok(!json.includes(prohibido), `ver no debe incluir «${prohibido}»`);
  }
  assert.deepEqual(ver.articulos[1], { id: 'licuadora', apartado_por: 'María', parecidos: [], mio: 'apartado' });
  assert.deepEqual(ver.articulos[2], { id: 'tazas', apartado_por: 'Tía', parecidos: [], mio: null });
  assert.deepEqual(ver.articulos[0], { id: 'sarten-20', apartado_por: null, parecidos: [], mio: null });
  // Sin hash (token ausente o inválido): mio siempre null.
  assert.ok(L.proyectarPublico(ARTICULOS, h.leer(), null, new Date()).articulos.every((a) => a.mio === null));
});

test('8b. dos apartados activos a mano en el mismo artículo → ver muestra el de la fila más arriba', () => {
  const h = hoja([
    { id_articulo: 'licuadora', tipo: 'apartado', nombre: 'Primero', estado: 'activo' },
    { id_articulo: 'licuadora', tipo: 'apartado', nombre: 'Segundo', estado: 'activo' },
  ]);
  assert.equal(L.estadoArticulo(h.leer(), 'licuadora').apartado_por, 'Primero');
});

// ---------------------------------------------------------------- §9.9 artículo inactivo y validación de entrada

test('9. prepararApartar: orden de validación y articulo_invalido para activo = no', () => {
  const ok = { articulo_id: 'licuadora', nombre: ' Ana ', tipo: 'apartado', token: T1 };
  const p = L.prepararApartar(ok, ARTICULOS, sha);
  assert.deepEqual(p, { ok: true, entrada: { articulo: 'licuadora', nombre: 'Ana', tipo: 'apartado', hash: H1 } });
  const cod = (c) => L.prepararApartar({ ...ok, ...c }, ARTICULOS, sha).codigo;
  assert.equal(cod({ articulo_id: 'vieja' }), 'articulo_invalido');
  assert.equal(cod({ articulo_id: 'no-existe' }), 'articulo_invalido');
  assert.equal(cod({ tipo: 'regalo' }), 'tipo_invalido');
  assert.equal(cod({ nombre: 'A' }), 'nombre_invalido');
  assert.equal(cod({ token: 'abc' }), 'token_invalido');
  assert.equal(cod({ token: T1.toUpperCase() }), 'token_invalido');
  assert.equal(cod({ token: undefined }), 'entrada_invalida');
  assert.deepEqual(L.prepararApartar({ ...ok, nombre: 5 }, ARTICULOS, sha).datos, { campo: 'nombre' });
  assert.equal(L.prepararApartar(null, ARTICULOS, sha).codigo, 'entrada_invalida');
  // Orden del contrato: tipo antes que artículo, artículo antes que nombre, nombre antes que token.
  assert.equal(cod({ tipo: 'x', articulo_id: 'vieja' }), 'tipo_invalido');
  assert.equal(cod({ articulo_id: 'vieja', nombre: 'A' }), 'articulo_invalido');
  assert.equal(cod({ nombre: 'A', token: 'x' }), 'nombre_invalido');
  // soltar
  assert.equal(L.prepararSoltar({ articulo_id: 'vieja', token: T1 }, ARTICULOS, sha).codigo, 'articulo_invalido');
  assert.equal(L.prepararSoltar({ articulo_id: 'licuadora', token: 'x' }, ARTICULOS, sha).codigo, 'token_invalido');
  assert.deepEqual(L.prepararSoltar({ articulo_id: 'licuadora', token: T1 }, ARTICULOS, sha),
    { ok: true, entrada: { articulo: 'licuadora', hash: H1 } });
});

test('9b. todo error usa el sobre {ok:false, codigo, mensaje, datos}', () => {
  const r = L.prepararApartar({ articulo_id: 'vieja', nombre: 'Ana', tipo: 'apartado', token: T1 }, ARTICULOS, sha);
  assert.deepEqual(Object.keys(r).sort(), ['codigo', 'datos', 'mensaje', 'ok']);
  assert.equal(r.ok, false);
  assert.equal(typeof r.mensaje, 'string');
});

// ---------------------------------------------------------------- anti-abuso

test('lista_cerrada: con MAX_FILAS_REGISTROS filas no se agrega nada (ni siquiera repetidos)', () => {
  const lim = { ...L.LIMITES, MAX_FILAS_REGISTROS: 3 };
  const filas = L.normalizarRegistros([1, 2, 3].map((i) => ({ fila: i + 1, id_articulo: 'x' + i, tipo: 'parecido', nombre: 'A', estado: 'liberado' })));
  assert.equal(L.decidirApartar(filas, ent('licuadora', 'Ana', 'apartado', H1), lim).respuesta.codigo, 'lista_cerrada');
});

test('frecuencia: 6 por dispositivo por minuto, ventana fija, y el global corta a todos', () => {
  const lim = L.LIMITES;
  let d;
  let g;
  const t0 = 1_000_000;
  for (let i = 0; i < 6; i++) {
    const r = L.controlFrecuencia(d, g, t0 + i * 1000, lim);
    assert.equal(r.ok, true);
    d = r.dispositivo.valor;
    g = r.global.valor;
  }
  const septimo = L.controlFrecuencia(d, g, t0 + 10_000, lim);
  assert.equal(septimo.ok, false);
  assert.equal(septimo.error.codigo, 'demasiadas_solicitudes');
  assert.equal(septimo.error.datos.motivo, 'frecuencia');
  assert.equal(septimo.error.datos.reintentar_en_s, 50);
  assert.equal(L.controlFrecuencia(d, g, t0 + 60_000, lim).ok, true);  // ventana vencida
  assert.equal(lim.MAX_ESCRITURAS_POR_MINUTO_GLOBAL, 15);
  assert.equal(L.controlFrecuencia(undefined, `14:${t0 + 60_000}`, t0, lim).ok, true);
  assert.equal(L.controlFrecuencia(undefined, `15:${t0 + 60_000}`, t0, lim).ok, false);
});

test('textoSeguroParaCelda: un nombre nunca se vuelve fórmula en la hoja', () => {
  assert.equal(L.textoSeguroParaCelda('=IMPORTXML("http://x";"//a")'), '\'=IMPORTXML("http://x";"//a")');
  assert.equal(L.textoSeguroParaCelda('+Ana'), "'+Ana");
  assert.equal(L.textoSeguroParaCelda('-Ana'), "'-Ana");
  assert.equal(L.textoSeguroParaCelda('@Ana'), "'@Ana");
  assert.equal(L.textoSeguroParaCelda('Ana = Luis'), 'Ana = Luis');
});

test('Logica.js no lee el reloj: proyectarPublico exige `ahora`', () => {
  assert.ok(!/new Date\(|Date\.now\(/.test(codigo.replace(/^\s*(\/\/|\*).*$/gm, '')));
  assert.throws(() => L.proyectarPublico(ARTICULOS, [], null));
});

test('formulaConSeparador respeta el texto entre comillas', () => {
  const f = '=IFERROR(TEXTJOIN(", ";TRUE;FILTER(A:A;B:B="x;y"));"")';
  assert.equal(L.formulaConSeparador(f, ','), '=IFERROR(TEXTJOIN(", ",TRUE,FILTER(A:A,B:B="x;y")),"")');
  assert.equal(L.formulaConSeparador(L.formulaConSeparador(f, ','), ';'), f);
  assert.equal(L.letraColumna(1), 'A');
  assert.equal(L.letraColumna(8), 'H');
  assert.equal(L.letraColumna(27), 'AA');
});
