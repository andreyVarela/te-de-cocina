# Té de cocina de Andrey

Página para apartar regalos sin cuenta. Los invitados abren el link de WhatsApp, apartan algo con su
nombre o marcan «Llevo algo parecido». Tú ves y corriges todo en una hoja de Google.

- **Página:** GitHub Pages (se publica sola al llegar algo a `main`).
- **Datos:** una hoja de Google tuya, `te-de-cocina`, con un script pegado (Apps Script).
- **Lo único que editas a mano:** `evento.json` (fecha, hora, lugar y la URL del script).

---

## 1. Poner a andar la hoja (una sola vez, ~10 min, desde la compu)

1. En Google Drive: **Nuevo → Hojas de cálculo**. Nómbrala `te-de-cocina`. No la compartas.
2. **Archivo → Configuración → Zona horaria:** «(GMT-06:00) Costa Rica». Guardar.
3. **Extensiones → Apps Script.** Se abre el editor con un archivo `Código.gs`.
4. Borra todo lo que tenga `Código.gs`. Abre [`apps-script/Code.gs`](apps-script/Code.gs) en GitHub,
   botón **Copy raw file**, y pégalo. Guarda (ícono de disquete o Ctrl/Cmd + S).
5. Arriba, en el desplegable de funciones, elige **`setup`** y toca **Ejecutar**.
   - Te pide permisos: **Revisar permisos** → tu cuenta → «Google no ha verificado esta app» →
     **Configuración avanzada** → **Ir a … (no seguro)** → **Permitir**. Es normal: el script es
     tuyo y solo pide manejar esta hoja.
   - Al terminar, el registro dice «Listo: 36 artículos activos…». En la hoja aparecen las
     pestañas `articulos`, `registros` y `resumen`.
6. **Implementar → Nueva implementación** → engranaje → **Aplicación web**.
   - Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier usuario**.
   - **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`).

## 2. Conectar la página (una sola vez)

1. En GitHub abre `evento.json` → lápiz (Edit) → pega la URL en `api_url`:
   ```json
   "api_url": "https://script.google.com/macros/s/AKfy.../exec"
   ```
   Pega la que termina en `/exec`. **Nunca** pegues el enlace de la hoja (el repo es público; el
   build lo rechaza si lo intentas).
2. **Commit changes.** Si GitHub te ofrece abrir un PR, ábrelo y dale **Merge**.
3. Solo la primera vez: repo → **Settings → Pages → Source: GitHub Actions**.
4. En ~1 minuto queda en `https://andreyvarela.github.io/te-de-cocina/`. En la pestaña **Actions**
   ves si salió bien (check verde) o el error en español.

## 3. Cambiar fecha u hora (desde el celular)

1. En GitHub (navegador o app) abre `evento.json` → lápiz.
2. Cambia `empieza_en`:
   - Por confirmar: `"empieza_en": null`
   - Con fecha: `"empieza_en": "2026-12-05T14:00:00-06:00"` (año-mes-día, T, hora en 24 h, y
     siempre `-06:00`). Eso se ve como «sábado 5 de diciembre · 2:00 p. m.».
3. Commit (y Merge si te pide PR). En ~1 minuto se actualiza. Si escribiste algo mal, la página
   no se rompe: Actions marca el error y la versión anterior sigue publicada.

## 4. Ver quién apartó qué

Abre la hoja (sirve la app de Sheets en el celular) → pestaña **`resumen`**:

- Arriba: «Apartados: X de 36 · Parecidos: Y».
- Una fila por artículo: **Apartado por** (nombre completo), **Parecidos** y **Alerta**
  («Duplicado: libera uno en registros», en texto y en rojo).
- Debajo: filas con un `id_articulo` que no existe (si escribiste uno mal) y la **bitácora**
  con fecha y hora, lo último primero.

`resumen` es de solo lectura. Las correcciones se hacen en **`registros`**.

## 5. Corregir cosas (pestaña `registros`)

Los cambios se ven en la página en unos 5 segundos (el invitado recarga).

| Quiero… | Hago esto |
|---|---|
| Liberar un apartado o quitar un parecido | En esa fila, `estado` → **liberado** (o borra la fila completa). |
| Corregir un nombre mal escrito | Edita la celda `nombre`. |
| Apartar a nombre de alguien que me escribió | Fila nueva al final: `id_articulo` (cópialo de la pestaña `articulos` o de `resumen`), `tipo` = apartado o parecido, `nombre`, `estado` = activo, `origen` = admin. Lo demás vacío. |
| Un bromista apartó mucho | Filtra por la columna `hash_token` (su dispositivo) y pon **liberado** en todas. |
| Me salió «Duplicado» | Hay dos apartados activos del mismo artículo: libera el que sobre. La página muestra el de más arriba. |

Reglas para no romper nada: no cambies los **nombres** de los encabezados (fila 1). Puedes
mover columnas, ensancharlas o agregar las tuyas. No edites `articulos` (la escribe `setup`).

## 6. Actualizar el script sin cambiar la URL

Cuando cambie `apps-script/Code.gs` (por un arreglo o porque cambió el catálogo):

1. Copia el `Code.gs` nuevo (del repo, o si editaste el catálogo desde la web: **Actions** → la
   última ejecución → **Artifacts → Code.gs**).
2. Apps Script → borra todo `Código.gs` → pega → guarda.
3. Si cambió el catálogo: elige `setup` → **Ejecutar** (no borra registros; lo que sacaste del
   catálogo queda `activo = no`).
4. **Implementar → Gestionar implementaciones** → lápiz → Versión: **Nueva versión** →
   **Implementar**. La URL sigue igual.

**No** uses «Nueva implementación» para actualizar: eso crea otra URL y habría que cambiar `api_url`.

## 7. Después del evento

Implementar → Gestionar implementaciones → **Archivar**. La página deja de aceptar apartados y la
hoja queda como recuerdo y lista de agradecimientos.

---

## Para desarrolladores

Contrato: [`docs/arquitectura/contrato.md`](docs/arquitectura/contrato.md) · decisión:
[`docs/adr/0001-backend-y-hosting.md`](docs/adr/0001-backend-y-hosting.md).

```bash
node scripts/build.mjs              # dist/ + apps-script/Code.gs (falla con mensaje claro si algo falta)
node scripts/build.mjs --solo-code  # solo Code.gs (no necesita site/ ni evento.json)
node scripts/build.mjs --demo       # incluye site/demo.js (probar en localhost con ?demo)
node --test tests/*.test.mjs        # lógica pura + humo de Code.gs con dobles de Google
bash tests/contrato.sh [URL_EXEC]   # contra la web app real (después de desplegar)
```

- `apps-script/Logica.js`: reglas puras (sin APIs de Google; el build lo verifica).
  `apps-script/Servidor.js`: doGet/doPost, lock, caché, `setup()`. `apps-script/Code.gs` lo genera
  el build: no se edita a mano.
- Node ≥ 18, sin dependencias ni `npm install`.

### Plantillas (interfaz build ↔ `site/`)

El build renderiza solo los `.html` de la raíz de `site/` (`index.html` o `plantilla.html` →
`dist/index.html`). JS y CSS se copian tal cual (los marcadores en comentarios de JS no se tocan).

- `{{nombre}}` → texto escapado para HTML. `{{{NOMBRE}}}` → HTML que genera el build.
  `{{#campo}}…{{/campo}}` solo si tiene valor; `{{^campo}}…{{/campo}}` solo si está vacío.
- Marcador desconocido o sin reemplazar = el build falla diciendo cuál.

| Dónde | Marcadores |
|---|---|
| `site/index.html` | `{{FECHA}}` («sábado 5 de diciembre» o «Por confirmar») · `{{HORA}}` («2:00 p. m.» o «Por confirmar») · `{{FECHA_HORA}}` · `{{FECHA_ISO}}` · `{{FECHA_ESTADO}}` (`pendiente`/`confirmada`) · `{{LUGAR}}` · `{{API_URL}}` (vacío si aún es la de ejemplo) · `{{TOTAL_ARTICULOS}}` · `{{VERSION}}` · `{{{CATEGORIAS}}}` · `{{{CATALOGO_JSON}}}` = `{{{ARTICULOS_JSON}}}` (JSON seguro para `<script type="application/json">`) |
| `site/partes/categoria.html` | `{{cat}}` · `{{cat_id}}` (slug ascii) · `{{kanji}}` (de `site/partes/categorias.json`) · `{{n}}` · `{{n_texto}}` · `{{{ARTICULOS}}}` |
| `site/partes/articulo.html` | `{{id}}` · `{{n}}` · `{{cat}}` · `{{cat_id}}` · `{{que}}` · `{{producto}}` · `{{aviso}}` ('' si no hay) · `{{tienda}}` · `{{url}}` · `{{imagen}}` (usa `site/img/<id>.{webp,avif,jpg,jpeg,png}` si existe) · `{{precio}}` («₡2 800» o «₡400 c/u · ₡1 600 en total») · `{{precio_crc}}` · `{{cantidad}}` |

Se publica: `index.html`, todo lo demás de `site/` salvo `partes/` y `demo.js` (este solo con
`--demo`), más `robots.txt` (`Disallow: /`) y `.nojekyll`. `nota` y `verificado` nunca salen del
repo hacia `dist/` ni hacia `Code.gs`.
