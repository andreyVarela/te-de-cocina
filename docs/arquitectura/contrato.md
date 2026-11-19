# Contrato técnico · Apartar regalos (módulo `regalos`)

Estado: propuesto (ATLAS, 2026-11-19). Decisiones de fondo en `docs/adr/0001-backend-y-hosting.md`;
alcance y reglas de negocio en `docs/producto/alcance.md` (manda sobre este documento si chocan).
Lo implementan FORGE (SQL, build, Action) y AURORA (HTML/CSS/JS). Nada de esto es código: es el
contrato que ambos deben cumplir y que NEXUS verifica.

## 1. Glosario (un nombre por concepto)

| Concepto | Nombre en datos y código | Notas |
|---|---|---|
| Artículo | `articulo`, `articulo_id` | Una fila de `catalogo.json`. 36 hoy. |
| Registro | `registro` | Una fila de `registros`: alguien dijo algo sobre un artículo. |
| Apartado | `tipo = 'apartado'` | Exclusivo: máximo 1 activo por artículo. |
| Parecido | `tipo = 'parecido'` | No exclusivo: varios por artículo. |
| Liberar / soltar | `liberado_en` | Borrado lógico. «Soltar» lo hace el invitado; «liberar», Andrey. |
| Dispositivo | `token` (cliente) → `dispositivo_hash` (base) | Identidad anónima. En la base solo el hash. |
| Secreto de admin | `secreto` → `admin_secreto.hash` | Solo hash en la base. |
| Nombre de pila | `nombre_pila` | Primera palabra de `nombre`, calculada en el servidor. |

## 2. Fuentes de verdad y archivos

```
evento.json                 ← ÚNICO lugar editable por Andrey: fecha/hora, lugar, URL y clave pública de Supabase
catalogo.json               ← catálogo (Andrey/PATRON lo editan); gana `id` estable y `aviso`
scripts/build.mjs           ← Node ≥ 18 sin dependencias: catalogo.json + evento.json → dist/ y supabase/seed/articulos.sql
site/                       ← fuente del frontend (AURORA): plantilla.html, admin.html, app.js, admin.js, estilos.css, img/
dist/                       ← salida publicada por Pages (lo genera la Action; no se versiona)
supabase/migrations/0001_esquema.sql   ← tablas, índices, funciones, grants (idempotente)
supabase/seed/articulos.sql            ← upsert de los 36 artículos (generado por el build; sí se versiona)
tests/local/                ← harness de FORGE contra Postgres local (ver §9)
.github/workflows/pages.yml ← build + deploy a Pages en push a main
.github/workflows/despertar.yml ← cron cada 3 días: POST a ver_lista (mantiene vivo el proyecto gratis)
```

### `evento.json`
```json
{
  "empieza_en": null,
  "lugar": "Mi apartamento",
  "supabase_url": "https://XXXX.supabase.co",
  "supabase_clave_publica": "sb_publishable_... o eyJ... (anon)"
}
```
- `empieza_en`: `null` → se muestra «Por confirmar». Si tiene valor, ISO 8601 con zona explícita:
  `"2026-12-05T14:00:00-06:00"`. El build lo formatea en `es-CR`, zona `America/Costa_Rica`,
  como «sábado 5 de diciembre · 2:00 p. m.» y lo deja escrito en el HTML (se ve sin JS y sin base).
- Cambiar la fecha = editar esta línea en GitHub (web o app), merge a `main`, esperar ~1 min.
- Aquí **solo** va la clave pública. La `service_role` y la contraseña de la base jamás.

### `catalogo.json`: cambios de esquema (datos, no código)
- Nuevo campo obligatorio **`id`**: slug `^[a-z0-9]+(-[a-z0-9]+)*$`, 2 a 40 caracteres, único.
  **No se cambia nunca una vez publicado** (es la llave de los registros). El build falla si falta
  o se repite. Ids propuestos, en el orden del archivo:
  `sarten-20, sarten-24, olla-tapa-20, arrocera, hervidor, licuadora, cuchillo-chef, tabla-bambu,
  utensilios-bambu, hermeticos, refractario, escurridor, basurero-cocina, panos, vajilla, bowls,
  cubiertos, palillos, vasos, tazas, tetera, escoba, pala, mopa, balde, tendedero, plancha, toallas,
  cortina-bano, accesorios-bano, basurero-bano, cepillo-inodoro, tapete, bambu-suerte, incienso,
  despensa`.
- Nuevo campo opcional **`aviso`** (texto visible al invitado, p. ej. «Solo retiro en tienda»).
  Hoy eso está dentro de `producto` en Bambú e Incienso: se saca de ahí y se pone en `aviso`.
- `nota` y `verificado` son internos: el build **no** los copia a `dist/`.
- Quitar un artículo del JSON lo marca `activo = false` en la base (no se borra: puede tener registros).

## 3. Datos (Postgres, esquema `public`)

Todo en UTC (`timestamptz`); se muestra en `America/Costa_Rica` en el cliente. Borrado lógico en
`registros`. **RLS activado en las cuatro tablas y sin políticas**: nadie que no sea el dueño
(`postgres`) toca una tabla directo; `anon` y `authenticated` sin privilegios sobre tablas.

```sql
articulos (
  id        text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(id) between 2 and 40),
  que       text not null,         -- título (copia para la vista de Andrey)
  producto  text not null,         -- subtítulo (copia)
  cantidad  int  not null default 1 check (cantidad >= 1),
  orden     int  not null,         -- posición en catalogo.json
  activo    boolean not null default true,
  actualizado_en timestamptz not null default now()
)

registros (
  id              uuid primary key default gen_random_uuid(),
  articulo_id     text not null references articulos(id),
  tipo            text not null check (tipo in ('apartado','parecido')),
  nombre          text not null check (char_length(nombre) between 2 and 40),
  dispositivo_hash text check (dispositivo_hash ~ '^[0-9a-f]{64}$'),   -- null si lo creó Andrey
  origen          text not null default 'invitado' check (origen in ('invitado','admin')),
  creado_en       timestamptz not null default now(),
  liberado_en     timestamptz,                                           -- borrado lógico
  liberado_por    text check (liberado_por in ('invitado','admin'))
)
-- Exclusividad (regla 1 del alcance) y condición de carrera: lo decide la base, no la UI.
create unique index registros_un_apartado_activo
  on registros (articulo_id) where tipo = 'apartado' and liberado_en is null;
-- Un dispositivo no puede estar dos veces activo en el mismo artículo (ni apartado+parecido, ni doble parecido).
create unique index registros_un_dispositivo_por_articulo
  on registros (articulo_id, dispositivo_hash) where liberado_en is null and dispositivo_hash is not null;
create index registros_dispositivo_idx on registros (dispositivo_hash, creado_en desc);
create index registros_activos_idx on registros (articulo_id) where liberado_en is null;

admin_secreto (
  id         smallint primary key default 1 check (id = 1),  -- una sola fila
  hash       text not null check (hash ~ '^[0-9a-f]{64}$'),
  creado_en  timestamptz not null default now()
)

admin_intentos (                      -- solo fallos; para frenar fuerza bruta
  ocurrido_en timestamptz not null default now()
)
```

Sin tabla de eventos: no hay bus. Nombres reservados para logs y futuro:
`regalos.registro.creado`, `regalos.registro.liberado`, `regalos.registro.corregido`.

## 4. Superficies, tokens y quién lee qué

| Superficie | Consumidor | Prefijo | Guard | Sobre |
|---|---|---|---|---|
| Pública | `dist/index.html` con clave pública | `POST /rest/v1/rpc/{ver_lista,apartar,soltar}` | token de dispositivo (solo para «lo mío») | §6 |
| Admin | `dist/admin.html` con clave pública | `POST /rest/v1/rpc/admin_*` | `p_secreto` validado por `_admin_autorizar` | §6 |
| Dueño | Andrey en SQL Editor | psql / dashboard | rol `postgres` | n/a |

Tipos de token:
- **Clave pública de Supabase** (anon/publishable): identifica el proyecto, no a nadie. Va en el
  header `apikey`. Es pública por diseño. Permite ejecutar **solo** las 8 funciones de §6.
- **Token de dispositivo**: 32 bytes aleatorios en hex (64 chars), generado por el cliente con
  `crypto.getRandomValues`, guardado en `localStorage['tdc.dispositivo']` (en `try/catch`; si no se
  puede guardar se usa uno efímero y la UI avisa que no podrá soltar). Viaja como `p_token` en cada
  RPC. El servidor valida `^[0-9a-f]{64}$`, calcula
  `dispositivo_hash = encode(sha256(convert_to(p_token,'UTF8')),'hex')` y **nunca guarda el token**.
  Por qué hash: si la base o un screenshot del dashboard se filtra, nadie puede soltar lo de otro.
- **Secreto de admin**: 32 bytes hex generados por Andrey (`openssl rand -hex 32`). Se registra una
  vez en el SQL Editor:
  `insert into admin_secreto (hash) values (encode(sha256(convert_to('<SECRETO>','UTF8')),'hex')) on conflict (id) do update set hash = excluded.hash, creado_en = now();`
  (eso mismo lo rota). Viaja en el fragmento del enlace `admin.html#s=<SECRETO>`; `admin.js` lo
  lee de `location.hash`, lo guarda en `sessionStorage` y lo manda como `p_secreto` en cada RPC.
  Nunca va en query string, repo, HTML ni chat.
- Rol `authenticated`: sin ningún permiso (no hay cuentas). En el dashboard: Auth → desactivar signups.

Grants (lo central del modelo de seguridad):
```sql
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public;  -- PostgREST expone a PUBLIC por defecto
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function ver_lista(text), apartar(text,text,text,text), soltar(text,text),
  admin_ver(text), admin_liberar(text,uuid), admin_corregir_nombre(text,uuid,text),
  admin_apartar(text,text,text,text), admin_liberar_dispositivo(text,text) to anon;
```
Toda función pública es `security definer`, `set search_path = ''` (referencias calificadas
`public.`), dueño `postgres`. Las auxiliares `_...` no reciben grant.

## 5. Funciones centrales (regla «una sola fuente»)

- `_dispositivo_hash(p_token text) returns text`: valida formato y devuelve el hash; error `token_invalido`.
- `_validar_nombre(p_nombre text) returns text`: `btrim`, colapsa espacios internos a uno; rechaza
  si `char_length` < 2 (`nombre_invalido/corto`), > 40 (`nombre_invalido/largo`), contiene
  caracteres de control `[\x00-\x1F\x7F]` o no contiene al menos una letra `[[:alpha:]]`
  (`nombre_invalido/caracteres`). Tildes, ñ, emojis y `<script>` se aceptan: se muestran siempre
  como texto plano (`textContent`), nunca como HTML. Devuelve el nombre normalizado.
- `_nombre_pila(p_nombre text) returns text`: `split_part(p_nombre, ' ', 1)`.
- `_admin_autorizar(p_secreto text)`: si en `admin_intentos` hay ≥ 10 fallos en los últimos 10 min →
  `demasiados_intentos`; si `encode(sha256(...))` ≠ `admin_secreto.hash` (o no hay fila) → inserta
  fallo y `secreto_invalido`. Mensaje accionable sin detalle interno: «Enlace de admin inválido».
- `_estado_articulo(p_articulo_id text) returns jsonb`: `{ apartado_por: pila|null, parecidos: [pila,...] }`.
- `_verificar_limites(p_hash text)` (solo escrituras de invitado), dentro de
  `pg_advisory_xact_lock(hashtext('regalos.escritura'))` que serializa todas las escrituras (a esta
  escala es gratis y hace exactos los conteos):
  - `count(*) from registros where creado_en > now() - interval '1 minute'` > 30 → `demasiadas_solicitudes`
  - igual, filtrado por `dispositivo_hash`, > 6 → `demasiadas_solicitudes`
  - `count(*) from registros` ≥ 2000 → `lista_cerrada` (freno total; Andrey limpia desde el dashboard)
  Conteos incluyen filas liberadas (borrado lógico = también sirve de bitácora de ritmo).
- Tope (regla 8): al apartar, `count(*) where dispositivo_hash = h and tipo = 'apartado' and liberado_en is null` ≥ 5 → `tope_dispositivo`.

## 6. RPCs: firma exacta, sobre y errores

**Un solo sobre para las dos superficies**, siempre HTTP 200 cuando la función terminó:
```
éxito:  { "ok": true,  ...campos }
error:  { "ok": false, "codigo": "<estable>", "mensaje": "<texto para mostrar>", "datos": { ... } }
```
Por qué 200 y no 4xx: PostgREST convierte `raise` en 400 genérico y complica llevar datos (quién
ganó la carrera). El cliente decide por `codigo`. Todo lo que **no** sea 200 con `ok` presente
(red caída, 401 por clave mal pegada, 5xx, proyecto pausado) es error de transporte: la UI muestra
«No se guardó. Revisa tu conexión» con Reintentar y conserva lo escrito. Nunca «Listo» sin `ok: true`.

Los `mensaje` de abajo son sugerencia; el copy final lo cierra AURORA con IRIS. `codigo` es contrato.

### Catálogo de errores
| codigo | Cuándo | datos | mensaje sugerido |
|---|---|---|---|
| `articulo_invalido` | id no existe o `activo = false` | | «Ese artículo ya no está en la lista» |
| `nombre_invalido` | ver `_validar_nombre` | `{ motivo: 'corto'\|'largo'\|'caracteres' }` | «Escribe tu nombre (2 a 40 letras)» |
| `tipo_invalido` | `p_tipo` fuera de `apartado\|parecido` | | (bug del cliente) |
| `token_invalido` | formato de `p_token` | | «Recarga la página e intenta de nuevo» |
| `ya_apartado` | otro apartó antes (carrera o lista vieja) | `{ por: 'Ana' }` | «Ana acaba de apartar este. Puedes elegir otro o marcar "Llevo algo parecido"» |
| `ya_registrado_distinto` | este dispositivo ya tiene el otro tipo activo en el artículo | `{ tipo_actual }` | «Ya marcaste este como "parecido". Suéltalo primero» |
| `tope_dispositivo` | ≥ 5 apartados activos del dispositivo | `{ tope: 5 }` | «Ya apartaste 5. Suelta uno para apartar otro» |
| `demasiadas_solicitudes` | límite de frecuencia | `{ reintentar_en_s: 60 }` | «Espera un momento e intenta de nuevo» |
| `lista_cerrada` | freno total | | «La lista está cerrada por ahora. Avísale a Andrey» |
| `secreto_invalido` | admin | | «Enlace de admin inválido» |
| `demasiados_intentos` | admin, ≥ 10 fallos / 10 min | `{ reintentar_en_s: 600 }` | «Demasiados intentos. Espera 10 minutos» |
| `registro_invalido` | admin: uuid no existe | | «Ese registro ya no existe» |

### Públicas

`ver_lista(p_token text default null) returns jsonb` · `stable`
```
{ "ok": true, "generado_en": "<UTC ISO>",
  "articulos": [ { "id": "licuadora", "apartado_por": "Ana"|null, "parecidos": ["Luis","Marta"],
                   "mio": null | "apartado" | "parecido" } ] }
```
Devuelve **todos** los artículos activos (aunque no tengan registros), en `orden`. Solo nombres de
pila; nunca fecha, hora ni hash (regla 3). `mio` se calcula con el hash del token si viene: así la
UI sabe qué puede soltar aunque Andrey haya liberado algo entre medio. Los nombres y fotos no
viajan: ya están en el HTML. Si `p_token` es inválido se ignora (`mio = null`), no es error.

`apartar(p_articulo_id text, p_nombre text, p_tipo text, p_token text) returns jsonb`
```
{ "ok": true, "registro_id": "<uuid>", "articulo_id": "licuadora", "tipo": "apartado",
  "nombre": "María José", "nombre_pila": "María", "repetido": false,
  "primero_en_dispositivo": true, "estado": { "apartado_por": "María", "parecidos": [] } }
```
Orden interno: validar tipo → artículo → nombre → hash → lock global → límites → si ya hay un
registro activo de este dispositivo en el artículo: mismo tipo → `ok` con `repetido: true`
(doble toque = un solo apartado, regla H2); distinto → `ya_registrado_distinto` → si
`tipo = 'apartado'`, tope → `insert`. **Carrera:** si el `insert` lanza `unique_violation` por
`registros_un_apartado_activo`, se captura, se relee el ganador y se devuelve `ya_apartado`
con `datos.por`. Nunca se hace «check-then-insert» sin capturar la excepción.
`primero_en_dispositivo` = no existía ningún registro (ni liberado) de ese hash; la UI lo usa para
explicar «Soltar» una sola vez.

`soltar(p_articulo_id text, p_token text) returns jsonb`
```
{ "ok": true, "liberado": true|false, "estado": { "apartado_por": null, "parecidos": [] } }
```
`update registros set liberado_en = now(), liberado_por = 'invitado' where articulo_id = … and
dispositivo_hash = … and liberado_en is null`. Idempotente: si no había nada activo, `liberado:
false` y el estado real (cubre «Andrey liberó algo que alguien tenía abierto»). Errores:
`articulo_invalido`, `token_invalido`, `demasiadas_solicitudes` (cuenta sobre `liberado_en` del
dispositivo en el último minuto, > 10).

### Admin (todas empiezan por `_admin_autorizar(p_secreto)`; sin tope ni límite de frecuencia salvo intentos fallidos)

`admin_ver(p_secreto text) returns jsonb`
```
{ "ok": true, "resumen": { "articulos": 36, "apartados": 12, "parecidos": 3 },
  "registros": [ { "id": "<uuid>", "articulo_id": "licuadora", "que": "Licuadora", "producto": "…",
                   "tipo": "apartado", "nombre": "María José Vargas", "origen": "invitado",
                   "creado_en": "<UTC ISO>", "dispositivo": "3fa9c1" | null } ] }
```
Solo registros activos, ordenados por `orden` del artículo y `creado_en`. `dispositivo` = primeros
6 hex del hash: sirve para ver que varios registros son del mismo celular y para
`admin_liberar_dispositivo`. La hora se formatea en el cliente en `America/Costa_Rica`.

`admin_liberar(p_secreto text, p_registro_id uuid) returns jsonb` → `{ ok, liberado: bool }`
Sirve para liberar un apartado y para quitar un parecido (misma acción). Idempotente.

`admin_corregir_nombre(p_secreto text, p_registro_id uuid, p_nombre text) returns jsonb` → `{ ok, nombre, nombre_pila }`
Pasa por `_validar_nombre`. Solo registros activos (`registro_invalido` si no).

`admin_apartar(p_secreto text, p_articulo_id text, p_nombre text, p_tipo text) returns jsonb`
Mismo sobre que `apartar`; `origen = 'admin'`, `dispositivo_hash = null`. Respeta exclusividad
(`ya_apartado`), no aplica tope ni frecuencia. `primero_en_dispositivo` siempre `false`.

`admin_liberar_dispositivo(p_secreto text, p_dispositivo_prefijo text) returns jsonb` → `{ ok, liberados: n }`
Prefijo de 6 a 64 hex. Libera todo lo activo de ese dispositivo (recuperación ante bromas).

## 7. Reglas de frontend que son contrato (AURORA)

- Vanilla HTML/CSS/JS, sin bundler, sin npm, sin supabase-js. Helper único
  `rpc(nombre, args)` → `fetch(\`${url}/rest/v1/rpc/${nombre}\`, { method:'POST', headers:{ apikey,
  'Authorization': 'Bearer '+apikey, 'Content-Type':'application/json' }, body })`. Si `!res.ok` o
  el body no trae `ok` → error de transporte.
- Nombres y cualquier texto de la base: solo `textContent`. Jamás `innerHTML` con datos.
- `localStorage` siempre en `try/catch`. Clave del token: `tdc.dispositivo`.
- Al cargar: `ver_lista(token)`. Tras `apartar`/`soltar`: pintar con el `estado` devuelto; si llega
  `ya_apartado`, pintar `datos.por` y conservar el nombre escrito.
- `<meta name="robots" content="noindex, nofollow">` + `robots.txt` con `Disallow: /`.
- Imágenes: `loading="lazy"`, `referrerpolicy="no-referrer"`, recuadro de tamaño fijo con el
  nombre en texto si falla. Si una tienda bloquea el hotlink, copia optimizada en `site/img/`.
- `admin.html`: lee `location.hash`, lo guarda en `sessionStorage`, limpia el hash de la barra
  (`history.replaceState`) para que no quede en capturas. Sin secreto → solo el texto «Abre el
  enlace de admin que tienes guardado».

## 8. Build, seed y despliegue (FORGE)

- `scripts/build.mjs`: valida `catalogo.json` (ids únicos y con formato, `aviso` opcional,
  `precio_crc` entero), lee `evento.json`, renderiza la lista y la fecha en `dist/index.html`
  y `dist/admin.html` desde `site/*`, copia `site/{app.js,admin.js,estilos.css,img}`, escribe
  `dist/robots.txt`, y genera `supabase/seed/articulos.sql` con
  `insert into articulos (id, que, producto, cantidad, orden) values (...) on conflict (id) do update set que = excluded.que, producto = excluded.producto, cantidad = excluded.cantidad, orden = excluded.orden, activo = true, actualizado_en = now();`
  seguido de `update articulos set activo = false where id not in (<ids del json>);`.
  Precio con cantidad > 1: «₡400 c/u · ₡1 600 en total» lo calcula el build (una sola fuente).
- `supabase/migrations/0001_esquema.sql`: idempotente (`create table if not exists`, `create
  index if not exists`, `create or replace function`, grants repetibles). Se aplica pegándolo en
  el SQL Editor del proyecto, o con `psql "<connection string del session pooler>"` si Andrey
  pasa la contraseña por un canal privado. Luego `supabase/seed/articulos.sql`. Luego el `insert`
  del secreto (§4) lo corre Andrey.
- `.github/workflows/pages.yml`: en push a `main` → `actions/setup-node@v4` (Node 20) → `node
  scripts/build.mjs` → `actions/upload-pages-artifact` → `actions/deploy-pages`. Sin `npm ci`.
- `.github/workflows/despertar.yml`: `cron: '0 12 */3 * *'` → `curl -fsS -X POST
  "$URL/rest/v1/rpc/ver_lista" -H "apikey: $CLAVE" -H "Content-Type: application/json" -d '{}'`,
  con URL y clave como variables del repo (son públicas; no son secretos).

## 9. Pruebas de contrato (FORGE prueba local; NEXUS verifica contra el proyecto real)

- `tests/local/arriba.sh`: `initdb` en el scratchpad, `pg_ctl start` en puerto libre, `create role
  anon nologin; create role authenticated nologin;` (solo local: en Supabase existen), aplica
  migración + seed, inserta un secreto de prueba. `abajo.sh` destruye el cluster.
- `tests/local/contrato.sql` (psql, con `\set ON_ERROR_STOP 1`), mínimo:
  1. `set role anon;` → `select * from registros` falla con permiso denegado; `select
     ver_lista()` funciona.
  2. Doble `apartar` mismo token/artículo/tipo → segundo `repetido: true`, una sola fila.
  3. Dos tokens, mismo artículo, `tipo = 'apartado'` → segundo `ya_apartado` con `datos.por`.
     Carrera real: dos sesiones `psql` con `begin` + `apartar` sin commit → una queda esperando y
     al commit de la primera recibe `ya_apartado` (no excepción cruda).
  4. Sexto apartado del mismo token → `tope_dispositivo`.
  5. 7 escrituras en un minuto del mismo token → `demasiadas_solicitudes`.
  6. `soltar` dos veces → segunda `liberado: false`, `ok: true`.
  7. Nombres: `"  Ana   María "` → `"Ana María"`, pila `"Ana"`; `"A"` → corto; 41 chars → largo;
     `"<script>alert(1)</script>"` → se acepta (tiene letras) y se guarda tal cual, la defensa es
     `textContent` en la UI; `"1234"` → caracteres; `E'a\tb'` → caracteres; `"Ñandú 🎁"` → ok.
  8. `admin_ver('malo')` × 10 → el 11.º da `demasiados_intentos`.
  9. `ver_lista` nunca devuelve `creado_en`, `nombre` completo ni `dispositivo_hash`.
- Drift contra el servidor real (NEXUS, tras desplegar): `curl` a `ver_lista` y a `apartar` con un
  artículo y token de prueba, comparar llaves del JSON con este documento, y `soltar`. Se
  verifica el servidor vivo, no un snapshot.

## 10. Operación para Andrey (resumen; el detalle va en el README que escribe FORGE)

- **Cambiar fecha/hora:** editar `empieza_en` en `evento.json` → merge → 1 min.
- **Ver quién apartó qué:** abrir el enlace de admin guardado. Liberar, corregir nombre, apartar a
  nombre de alguien y liberar todo lo de un dispositivo están ahí.
- **Rotar el secreto:** volver a correr el `insert … on conflict` de §4 con un secreto nuevo.
- **Proyecto pausado:** dashboard → Restore. Mientras, la página dice que no pudo ver lo apartado.
- **Después del evento:** pausar o borrar el proyecto; la lista de nombres se puede exportar desde
  el dashboard (Table Editor → CSV) si quiere agradecer.

## 11. Futuro (anotado, fuera del MVP)

Cerrar la lista con un interruptor (`admin_cerrar`), Cloudflare Turnstile si hay abuso, apartar
por unidad, Supabase Auth con magic link para Andrey, copia local de todas las fotos, ver cambios
en vivo (Realtime) en vez de recargar.

→ FORGE: migración, seed, build, workflows y harness local (§3-§5, §8, §9).
→ AURORA: `site/` según §7 con el diseño aprobado de `invitacion-v1.html` y el alcance H1-H5.
→ NEXUS: verificar §9 contra el proyecto real y el checklist del ADR antes de mandar el link.
