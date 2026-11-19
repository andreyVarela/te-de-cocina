# Contrato técnico · Apartar regalos (módulo `regalos`)

Estado: aceptado (ATLAS, 2026-11-19; backend Sheet + Apps Script según `docs/adr/0001-backend-y-hosting.md`).
Alcance y reglas de negocio en `docs/producto/alcance.md` (manda si chocan). Lo implementan FORGE
(Apps Script, build, Action) y AURORA (HTML/CSS/JS). Nada de esto es código: es el contrato que
ambos cumplen y que NEXUS verifica.

## 1. Glosario (un nombre por concepto)

| Concepto | Nombre en datos y código | Notas |
|---|---|---|
| Artículo | `articulo`, `articulo_id` | Una fila de `catalogo.json`. 36 hoy. |
| Registro | `registro` | Una fila de la pestaña `registros`: alguien dijo algo sobre un artículo. |
| Apartado | `tipo = apartado` | Exclusivo: máximo 1 activo por artículo. |
| Parecido | `tipo = parecido` | No exclusivo: varios por artículo. |
| Liberar / soltar | `estado = liberado` | Borrado lógico. «Soltar» lo hace el invitado; «liberar», Andrey. |
| Dispositivo | `token` (cliente) → `hash_token` (hoja) | Identidad anónima. En la hoja solo el hash. |
| Nombre de pila | `nombre_pila` | Primera palabra de `nombre`, calculada en el servidor. |
| Acción | `accion` | Nombre de la operación en la API: `ver`, `apartar`, `soltar`. |

## 2. Fuentes de verdad y archivos

```
evento.json                 ← ÚNICO archivo que edita Andrey: fecha/hora, lugar, api_url
catalogo.json               ← catálogo (Andrey/PATRON lo editan); gana `id` estable y `aviso`
scripts/build.mjs           ← Node ≥ 18 sin dependencias: catalogo.json + evento.json → dist/ y apps-script/Code.gs
site/                       ← frontend (AURORA): index.html (+ partes/), app.js, api.js, estilos.css, img/
dist/                       ← salida publicada por Pages (lo genera la Action; no se versiona)
apps-script/Logica.js       ← funciones puras (validar, decidir, proyectar); sin APIs de Google; se prueban en Node
apps-script/Servidor.js     ← doGet/doPost, LockService, CacheService, SpreadsheetApp, setup()
apps-script/Code.gs         ← GENERADO por el build: Logica + Servidor + catálogo embebido; es lo único que Andrey pega
tests/logica.test.mjs       ← node --test sobre Logica.js
tests/contrato.sh           ← curl contra la web app real (NEXUS)
.github/workflows/pages.yml ← build + deploy a Pages en push a main
```
No existe `despertar.yml` (Apps Script no se pausa) ni `admin.html` ni secreto de admin.

### `evento.json`
```json
{
  "empieza_en": null,
  "lugar": "Mi apartamento",
  "api_url": "https://script.google.com/macros/s/XXXX/exec"
}
```
- `empieza_en`: `null` → «Por confirmar». Con valor, ISO 8601 con zona explícita:
  `"2026-12-05T14:00:00-06:00"`. El build lo formatea en `es-CR`, zona `America/Costa_Rica`,
  como «sábado 5 de diciembre · 2:00 p. m.» y lo deja escrito en el HTML (se ve sin JS y sin API).
- `api_url`: URL `/exec` de la web app. Es pública por diseño. No cambia al publicar «nueva
  versión» de la misma implementación.

### `catalogo.json`: cambios de esquema (datos, no código)
- Nuevo campo obligatorio **`id`**: slug `^[a-z0-9]+(-[a-z0-9]+)*$`, 2 a 40 caracteres, único.
  **No se cambia una vez publicado.** El build falla si falta o se repite. Ids propuestos, en el
  orden del archivo: `sarten-20, sarten-24, olla-tapa-20, arrocera, hervidor, licuadora,
  cuchillo-chef, tabla-bambu, utensilios-bambu, hermeticos, refractario, escurridor,
  basurero-cocina, panos, vajilla, bowls, cubiertos, palillos, vasos, tazas, tetera, escoba, pala,
  mopa, balde, tendedero, plancha, toallas, cortina-bano, accesorios-bano, basurero-bano,
  cepillo-inodoro, tapete, bambu-suerte, incienso, despensa`.
- Nuevo campo opcional **`aviso`** (visible al invitado, p. ej. «Solo retiro en tienda»); se saca
  de `producto` en Bambú e Incienso.
- `nota` y `verificado` son internos: el build **no** los copia a `dist/` ni a `Code.gs`.
- Quitar un artículo del JSON lo deja `activo = no` en la hoja al volver a correr `setup()`; no se borra.

## 3. Datos (la hoja `te-de-cocina`, tres pestañas)

Zona horaria de la hoja y del script: `America/Costa_Rica`. Las celdas de fecha guardan el
instante (Date); la API lo serializa en ISO UTC. Borrado lógico con `estado`. Fila 1 = encabezados
exactos (el script localiza columnas **por nombre de encabezado**, no por letra, para que Andrey
pueda ensanchar o reordenar sin romper nada; lo que no puede es renombrar encabezados).

### Pestaña `articulos` (la escribe `setup()`; Andrey no la toca)
| encabezado | tipo | notas |
|---|---|---|
| `id` | texto | slug de `catalogo.json` |
| `que` | texto | título |
| `producto` | texto | subtítulo |
| `cantidad` | número | ≥ 1 |
| `orden` | número | posición en el JSON |
| `activo` | `si` / `no` | `no` si desapareció del JSON |

### Pestaña `registros` (la escribe el script; Andrey edita para corregir)
| encabezado | tipo | quién la llena | notas |
|---|---|---|---|
| `id_articulo` | texto | script / Andrey | debe existir en `articulos` |
| `tipo` | `apartado` / `parecido` | script / Andrey | validación de datos (desplegable) |
| `nombre` | texto | script / Andrey | como lo escribió el invitado; Andrey puede corregirlo |
| `hash_token` | hex 64 | script | vacío si la fila la hizo Andrey |
| `creado` | fecha-hora | script / Andrey | el script pone `new Date()`; Andrey puede dejarlo vacío |
| `estado` | `activo` / `liberado` | script / Andrey | desplegable; **liberar = poner `liberado`** (o borrar la fila: también vale) |
| `liberado` | fecha-hora | script | cuándo se soltó; Andrey puede dejarlo vacío |
| `origen` | `invitado` / `admin` | script / Andrey | las filas a mano llevan `admin` |

Reglas que el script hace cumplir sobre esta pestaña (siempre dentro del lock, §5):
- Como máximo **una** fila `tipo = apartado` y `estado = activo` por `id_articulo`.
- Como máximo una fila activa por (`id_articulo`, `hash_token`) con hash no vacío.
- Las filas con `estado` vacío se tratan como `activo` (por si Andrey olvida la celda).
- Si Andrey crea a mano dos apartados activos del mismo artículo, `ver` devuelve el de la fila
  más alta y `resumen` lo marca en rojo con texto «Duplicado» (ver abajo).

### Pestaña `resumen` (la escribe `setup()` con fórmulas; solo lectura)
- Fila 1: `="Apartados: "&COUNTIFS(registros!B:B;"apartado";registros!F:F;"activo")&" de "&COUNTIF(articulos!F:F;"si")&" · Parecidos: "&COUNTIFS(registros!B:B;"parecido";registros!F:F;"activo")`.
- Bloque A (uno por artículo, en `orden`): `que` · `producto` · **Apartado por** (nombre completo
  del apartado activo, `IFERROR(INDEX(FILTER(…),1);"—")`) · **Parecidos** (`TEXTJOIN(", ";TRUE;FILTER(…))`) ·
  **Duplicado** (`SI(COUNTIFS(...)>1;"Duplicado";"")`).
- Bloque B (bitácora): `=QUERY(registros!A:H; "select A, B, C, E, H where F = 'activo' order by E desc"; 1)`
  → lo último que pasó, con fecha y hora en hora de Costa Rica.
Las fórmulas se escriben con `;` como separador porque la hoja estará en español/Costa Rica.
Estados con texto, no solo color (Andrey es daltónico): el rojo del «Duplicado» es refuerzo.

## 4. Superficies, tokens y quién lee qué

| Superficie | Consumidor | Entrada | Guard | Sobre |
|---|---|---|---|---|
| Pública | `dist/index.html` vía `site/api.js` | `GET api_url?accion=ver[&token=…]` · `POST api_url` (text/plain, JSON) | token de dispositivo (solo para «lo mío» y soltar) | §6 |
| Dueño | Andrey en la hoja | app de Sheets | su cuenta de Google | n/a |

- **URL de la web app:** pública por diseño; identifica el script, no a nadie. El script corre como
  Andrey pero solo usa `SpreadsheetApp.getActiveSpreadsheet()`, `LockService`, `CacheService` y
  `Utilities`. No pide ningún otro permiso.
- **Token de dispositivo:** 32 bytes aleatorios en hex (64 chars), generado por el cliente con
  `crypto.getRandomValues`, guardado en `localStorage['tdc.dispositivo']` dentro de `try/catch`
  (si no se puede guardar, token efímero y la UI avisa que no podrá soltar). El servidor valida
  `^[0-9a-f]{64}$` y guarda solo
  `hash_token = hex(Utilities.computeDigest(SHA_256, token, UTF_8))`. Nunca guarda el token.
  Por qué hash: si la hoja se comparte o se filtra una captura, nadie puede soltar lo de otro.
- **Lectura pública (`ver`):** solo `id`, nombre de pila del apartado, lista de nombres de pila
  de parecidos y `mio`. Nunca nombre completo, `hash_token`, `creado` ni `origen`.
- No hay token de admin: Andrey edita la hoja con su cuenta.

## 5. Funciones centrales (regla «una sola fuente»; viven en `Logica.js`, puras)

- `validarToken(token) → hash | error token_invalido`.
- `validarNombre(nombre) → nombre normalizado | error nombre_invalido{motivo}`: `trim`, colapsa
  espacios internos; rechaza < 2 (`corto`), > 40 (`largo`), caracteres de control
  `[\u0000-\u001F\u007F]` o sin ninguna letra Unicode `\p{L}` (`caracteres`). Tildes, ñ, emojis y
  `<script>` se aceptan: la UI siempre pinta con `textContent`.
- `nombrePila(nombre)` → primera palabra.
- `proyectarPublico(articulos, registros, hash)` → lo que devuelve `ver` (§6).
- `decidirApartar(registros, {articulo, nombre, tipo, hash}, limites)` → `{ accion: 'insertar' |
  'repetido' | 'error', fila?, respuesta }`. Toda la lógica de exclusividad, tope y duplicados está
  aquí; `Servidor.js` solo lee la hoja, llama a esta función y escribe lo que diga.
- `decidirSoltar(registros, {articulo, hash})` → filas a marcar `liberado` (0 o 1).
- Límites (constantes en `Logica.js`): `TOPE_APARTADOS_POR_DISPOSITIVO = 5`,
  `MAX_ESCRITURAS_POR_MINUTO_DISPOSITIVO = 6`, `MAX_ESCRITURAS_POR_MINUTO_GLOBAL = 30`,
  `MAX_FILAS_REGISTROS = 2000`, `CACHE_VER_SEGUNDOS = 5`, `LOCK_MS = 10000`.

En `Servidor.js` (capa fina con APIs de Google):
- **Lock:** toda escritura hace `LockService.getScriptLock().waitLock(LOCK_MS)`; si falla →
  `demasiadas_solicitudes{motivo:'ocupado', reintentar_en_s: 3}`. Dentro del lock: leer
  `registros` completo (`getDataRange().getValues()`), aplicar frecuencia, decidir, `appendRow` o
  `setValue`, `SpreadsheetApp.flush()`, invalidar la caché de `ver`, soltar el lock en `finally`.
  **La carrera se resuelve así:** dos `apartar` del mismo artículo se serializan; el segundo relee
  la hoja ya con la fila del primero y recibe `ya_apartado` con el nombre de pila del ganador.
- **Frecuencia (CacheService.getScriptCache):** claves `rl:d:<hash>` y `rl:g`, contador como texto
  con expiración 60 s; se incrementa dentro del lock (por eso no hace falta incremento atómico).
  Supera el máximo → `demasiadas_solicitudes{reintentar_en_s: 60}`. Afecta a `apartar` y `soltar`.
- **Tope de filas:** `registros` con ≥ `MAX_FILAS_REGISTROS` filas → `lista_cerrada`.
- **Caché de `ver`:** clave `ver:<hash|anon>`, 5 s. `ver` no toma el lock.
- **Hoja a prueba de Andrey:** columnas por encabezado; `estado` vacío = `activo`; `creado` vacío
  se tolera; `id_articulo` desconocido se ignora en `ver` y se marca en `resumen`.

## 6. API: entradas, sobre y errores

**Un solo sobre** (el mismo que implementa `site/api.js`), siempre HTTP 200 cuando el script respondió:
```
éxito:  { "ok": true,  ...campos }
error:  { "ok": false, "codigo": "<estable>", "mensaje": "<texto para mostrar>", "datos": { ... } }
```
Respuesta con `ContentService.createTextOutput(JSON.stringify(...)).setMimeType(JSON)`. Apps
Script no permite fijar el status HTTP, así que **todo lo de negocio viaja como 200 + `codigo`**.
Cualquier otra cosa (red caída, `fetch` rechazado, HTML de error de Google, JSON sin `ok`) es
error de transporte: la UI muestra «No se guardó. Revisa tu conexión» con Reintentar y conserva lo
escrito. Nunca «Listo» sin `ok: true`. Los `mensaje` son sugerencia (copy final AURORA con IRIS);
`codigo` y `datos` son contrato.

### Transporte
- `GET  {api_url}?accion=ver&token=<hex64 opcional>` → JSON (tras un 302 que `fetch` sigue).
- `POST {api_url}` con header `Content-Type: text/plain;charset=utf-8` y cuerpo
  `JSON.stringify({ accion, ...args })`. `doPost` parsea `e.postData.contents`. Sin preflight.
- `doGet` solo acepta `ver`; `doPost` acepta `apartar` y `soltar`. Otra cosa → `accion_invalida`.

### Catálogo de errores
| codigo | Cuándo | datos | mensaje sugerido |
|---|---|---|---|
| `accion_invalida` | `accion` desconocida o método equivocado | | (bug del cliente) |
| `entrada_invalida` | cuerpo no es JSON o faltan campos | `{ campo }` | (bug del cliente) |
| `articulo_invalido` | id no existe o `activo = no` | | «Ese artículo ya no está en la lista» |
| `nombre_invalido` | ver `validarNombre` | `{ motivo: 'corto'\|'largo'\|'caracteres' }` | «Escribe tu nombre (2 a 40 letras)» |
| `tipo_invalido` | fuera de `apartado\|parecido` | | (bug del cliente) |
| `token_invalido` | formato de `token` | | «Recarga la página e intenta de nuevo» |
| `ya_apartado` | otro apartó antes (carrera o lista vieja) | `{ por: 'Ana' }` | «Ana acaba de apartar este. Puedes elegir otro o marcar "Llevo algo parecido"» |
| `ya_registrado_distinto` | este dispositivo ya tiene el otro tipo activo en el artículo | `{ tipo_actual }` | «Ya marcaste este como "parecido". Suéltalo primero» |
| `tope_dispositivo` | ≥ 5 apartados activos del dispositivo | `{ tope: 5 }` | «Ya apartaste 5. Suelta uno para apartar otro» |
| `demasiadas_solicitudes` | frecuencia o lock ocupado | `{ motivo: 'frecuencia'\|'ocupado', reintentar_en_s }` | «Espera un momento e intenta de nuevo» |
| `lista_cerrada` | tope de filas | | «La lista está cerrada por ahora. Avísale a Andrey» |
| `error_interno` | excepción no prevista (se registra con `console.error`) | | «Algo falló. Intenta de nuevo o avísale a Andrey» |

### `ver` (GET) · `TDC.api.verLista()` en `api.js`
```
{ "ok": true, "generado_en": "<UTC ISO>",
  "articulos": [ { "id": "licuadora", "apartado_por": "Ana"|null, "parecidos": ["Luis","Marta"],
                   "mio": null | "apartado" | "parecido" } ] }
```
Todos los artículos activos (aunque no tengan registros), en `orden`. Solo nombres de pila. `mio`
se calcula con el hash del token si viene y es válido; si es inválido se ignora (`mio = null`), no
es error. Los textos y fotos no viajan: ya están en el HTML.

### `apartar` (POST) · `TDC.api.apartar(id, nombre, parecido)`
```
{ "ok": true, "articulo_id": "licuadora", "tipo": "apartado", "nombre": "María José",
  "nombre_pila": "María", "repetido": false, "primero_en_dispositivo": true,
  "estado": { "apartado_por": "María", "parecidos": [] } }
```
Orden dentro del lock: `accion`/campos → tipo → artículo → nombre → token → frecuencia → tope de
filas → si ya hay fila activa de este hash en el artículo: mismo tipo → `ok` con `repetido: true`
sin escribir (doble toque = un solo apartado); distinto → `ya_registrado_distinto` → si
`tipo = apartado`: ya hay apartado activo de otro → `ya_apartado{por}`; tope → `tope_dispositivo`
→ `appendRow` con `estado = activo`, `origen = invitado`, `creado = new Date()`.
`primero_en_dispositivo` = no existía ninguna fila (ni liberada) con ese hash.

### `soltar` (POST) · `TDC.api.soltar(id)`
```
{ "ok": true, "liberado": true|false, "estado": { "apartado_por": null, "parecidos": [] } }
```
Marca `estado = liberado` y `liberado = new Date()` en la fila activa de (`articulo`, `hash`).
Idempotente: si no hay nada activo, `liberado: false` con el estado real (cubre «Andrey liberó
algo que alguien tenía abierto»). Errores: `articulo_invalido`, `token_invalido`,
`demasiadas_solicitudes`.

## 7. Reglas de frontend que son contrato (AURORA, ya avisada)

- Vanilla HTML/CSS/JS, sin bundler ni npm. **Un solo módulo de red, `site/api.js`**, que exporta
  `TDC.api.verLista()`, `TDC.api.apartar(id, nombre, parecido)` y `TDC.api.soltar(id)` (global por iOS 12; el token de dispositivo lo maneja api.js por dentro)
  y devuelve siempre el sobre de §6; convierte cualquier fallo de red o respuesta sin `ok` en
  `{ ok:false, codigo:'sin_conexion' }` (código **solo del cliente**, no viaja). `api_url` viene
  inyectada por el build desde `evento.json`.
- `GET` para `ver`; `POST` con `Content-Type: text/plain;charset=utf-8` y cuerpo JSON para
  escribir; `redirect: 'follow'` (por defecto). Un reintento automático de `ver` tras 1-2 s si falla.
- Nombres y cualquier texto de la API: solo `textContent`. Jamás `innerHTML` con datos.
- `localStorage` en `try/catch`. Clave del token: `tdc.dispositivo`.
- Al cargar: lista desde el HTML estático, luego `TDC.api.verLista()` y pintar estados. Tras
  `apartar`/`soltar`: pintar con `estado` devuelto; si llega `ya_apartado`, pintar `datos.por` y
  conservar el nombre escrito. Botón «Guardando…» bloqueado mientras espera (puede tardar 2-5 s).
- `<meta name="robots" content="noindex, nofollow">` + `robots.txt` con `Disallow: /`.
- Imágenes: `loading="lazy"`, `referrerpolicy="no-referrer"`, recuadro de tamaño fijo con el nombre
  en texto si falla; copia optimizada en `site/img/` si una tienda bloquea el hotlink.

## 8. Build, seed y despliegue (FORGE)

- `scripts/build.mjs`: valida `catalogo.json` (ids únicos y con formato, `aviso` opcional,
  `precio_crc` entero), lee `evento.json`, renderiza lista y fecha en `dist/index.html` desde
  `site/index.html` (con parciales de `site/partes/`), copia `site/{app.js,api.js,estilos.css,img}` inyectando `api_url`,
  escribe `dist/robots.txt`, y **genera `apps-script/Code.gs`** = `Logica.js` + `Servidor.js` +
  `const CATALOGO = [...]` (solo `id, que, producto, cantidad, orden`; sin `nota`). Precio con
  cantidad > 1 («₡400 c/u · ₡1 600 en total») lo calcula el build. `Code.gs` se versiona con
  cabecera «GENERADO: no editar a mano».
- **Despliegue del script (lo más simple para Andrey: pegar, sin `clasp`).** `clasp` exigiría
  iniciar sesión con la cuenta de Google de Andrey desde la terminal de otro; descartado. Flujo:
  abrir la hoja → Extensiones → Apps Script → borrar el contenido de `Código.gs` → pegar
  `apps-script/Code.gs` → guardar → en el desplegable elegir `setup` → Ejecutar → aceptar permisos
  → Implementar → Nueva implementación → Aplicación web, «Ejecutar como: yo», «Cualquier persona»
  → copiar URL `/exec` a `evento.json`. **Actualizar código después:** pegar de nuevo, guardar,
  Implementar → Administrar implementaciones → lápiz → Versión «Nueva versión» → Implementar (la
  URL no cambia).
- `setup()` (idempotente, se puede repetir): crea las pestañas si faltan, escribe encabezados,
  validaciones de datos (`tipo`, `estado`, `origen`), protege la fila 1 y la pestaña `articulos`
  con aviso, hace upsert de `CATALOGO` por `id` (actualiza textos, `activo = si`, y `activo = no`
  a los que ya no están), escribe las fórmulas de `resumen` y fija la zona horaria del script en
  el manifiesto si es posible (si no, Andrey la pone en la hoja; ambas deben ser Costa Rica).
- `.github/workflows/pages.yml`: push a `main` → `actions/setup-node@v4` (Node 20) → `node
  scripts/build.mjs` → `actions/upload-pages-artifact` → `actions/deploy-pages`. Sin `npm ci`.

## 9. Pruebas de contrato

**FORGE, local, sin Google:** `tests/logica.test.mjs` con `node --test` carga `Logica.js` (sin
APIs de Google) y cubre, mínimo:
1. Doble `decidirApartar` mismo hash/artículo/tipo → segundo `repetido: true`, sin fila nueva.
2. Dos hashes, mismo artículo, `apartado` → segundo `ya_apartado` con `datos.por` = pila del primero.
3. Sexto apartado del mismo hash → `tope_dispositivo`; tras soltar uno, el sexto entra.
4. `parecido` no bloquea: dos parecidos + un apartado conviven; `ver` lista las tres pilas bien.
5. Mismo hash, `parecido` activo y luego `apartado` → `ya_registrado_distinto{tipo_actual:'parecido'}`.
6. `decidirSoltar` sin fila activa → 0 filas, respuesta `liberado: false`.
7. Nombres: `"  Ana   María "` → `"Ana María"`, pila `"Ana"`; `"A"` → corto; 41 chars → largo;
   `"<script>alert(1)</script>"` → se acepta (tiene letras); `"1234"` → caracteres; `"a\tb"` →
   caracteres; `"Ñandú 🎁"` → ok.
8. `proyectarPublico` nunca incluye `nombre` completo, `hash_token`, `creado` ni `origen`
   (aserción sobre las llaves del JSON). Filas con `estado` vacío cuentan como activas; filas
   con `id_articulo` desconocido se ignoran.
9. Artículo `activo = no` → `articulo_invalido`.

**NEXUS, contra la web app real** (`tests/contrato.sh` con `curl`, después de que Andrey
despliegue): `GET ?accion=ver` → 200 tras redirect, llaves exactas de §6; `POST apartar` con
token de prueba y artículo real → `ok`, luego el mismo `POST` → `repetido: true`, luego `soltar`
→ `liberado: true`, luego `soltar` → `liberado: false`; `POST` con `Content-Type: text/plain`
desde un origen distinto (navegador) no dispara preflight. Deja la hoja limpia (filas de prueba
con nombre «Prueba NEXUS» que Andrey puede borrar; el script no las distingue).

## 10. Operación para Andrey (resumen; el detalle va en el README que escribe FORGE)

- **Cambiar fecha/hora:** editar `empieza_en` en `evento.json` en GitHub → merge → 1 min.
- **Ver quién apartó qué:** abrir la hoja, pestaña `resumen` (cabecera «Apartados: X de 36 ·
  Parecidos: Y», uno por artículo con nombre completo, y la bitácora con fecha y hora).
- **Liberar un apartado o quitar un parecido:** en `registros`, poner `estado = liberado` en esa
  fila (o borrar la fila). Se refleja en la página en ≤ 5 s + recarga.
- **Corregir un nombre:** editar la celda `nombre` de la fila.
- **Apartar a nombre de alguien:** fila nueva en `registros`: `id_articulo` (de la pestaña
  `articulos`), `tipo`, `nombre`, `estado = activo`, `origen = admin`; lo demás vacío. Si ya había
  apartado activo, `resumen` muestra «Duplicado» y Andrey decide cuál libera.
- **Un bromista apartó mucho:** filtrar `registros` por `hash_token` y poner `liberado` a todas.
- **Cambiar el catálogo:** editar `catalogo.json` → merge (la página se actualiza) → pegar el nuevo
  `apps-script/Code.gs` y correr `setup()` otra vez → «Nueva versión» de la implementación.
- **Después del evento:** Implementar → Administrar implementaciones → Archivar. La hoja queda
  como recuerdo y lista de agradecimientos.

## 11. Futuro (anotado, fuera del MVP)

Cerrar la lista con una celda `cerrada = si` en una pestaña `config`; Cloudflare Turnstile si hay
abuso; apartar por unidad; copia local de todas las fotos; actualización sin recargar.

→ FORGE: `apps-script/{Logica.js,Servidor.js}`, `scripts/build.mjs` (incluye `Code.gs`),
`tests/logica.test.mjs`, `tests/contrato.sh`, `pages.yml`, README de operación (§3, §5, §6, §8-§10).
→ AURORA: `site/` según §7 (`api.js` con el sobre de §6) con el diseño aprobado y H1-H5.
→ NEXUS: §9 contra la web app real y el checklist del ADR antes de mandar el link.
