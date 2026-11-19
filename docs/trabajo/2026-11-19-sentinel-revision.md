# SENTINEL · Revisión de seguridad · apartar regalos · 2026-11-19

Rama `feat/apartar-regalos` @ 6579b4a contra `main`. Corrí `node --test tests/*.test.mjs` (25/25 en verde) y
`node scripts/build.mjs` (OK; `apps-script/Code.gs` quedó idéntico: huella `e07207ecde6d`, o sea que es la
concatenación fiel de `Logica.js` + `Servidor.js` + catálogo). Commits del diff sin firmas de IA (autor
andreyAlltruck, sin `Co-Authored-By`). `dist/` no contiene `api_url` (pendiente), ID de hoja ni marcadores `{{`.

**Veredicto: APROBADO** (0 críticos en el diff). Dos cosas a resolver **antes de mandar el link**: A1 (ya
estaba en `main`, no la introduce esta rama) y M1.

## Crítico
Ninguno.

## Alto
- **A1 · Enlace de una hoja de Google en el repo público (preexistente en `main`, fuera del diff).**
  `invitacion-v1.html:93-103` enlaza `docs.google.com/spreadsheets/d/ID_OMITIDO/edit`
  con rangos `H6…H39` («Apartar ↗» directo a celdas), es decir, la v1 asumía edición por enlace. El ADR dice
  «Nunca se publica el ID ni el enlace de la hoja» y el build lo rechaza en `evento.json`, pero este archivo lo
  esquiva. Acción: borrar `invitacion-v1.html` (y `BRIEF.md`, ver B3) del repo; poner esa hoja vieja en privado
  o eliminarla; como el ID ya está en el historial público, **no** reutilizarla como `te-de-cocina` (crear una nueva,
  como dice el README paso 1).

## Medio
- **M1 · Alcance OAuth del script.** No hay `appsscript.json`; sin `"oauthScopes": ["https://www.googleapis.com/auth/spreadsheets.currentonly"]`
  Apps Script detecta `…/auth/spreadsheets` (todas las hojas de Andrey). `README.md:22` y el ADR prometen «solo
  esta hoja». Daño real hoy: ninguno (el código es fijo y solo usa `getActiveSpreadsheet()`, Servidor.js:196), pero es
  mínimo privilegio y una afirmación de doc que no se cumple. Acción (FORGE): versionar `apps-script/appsscript.json`
  con ese scope + `timeZone: America/Costa_Rica` y añadir al README el paso «Configuración del proyecto → mostrar
  manifiesto → pegar», o quitar la frase del README.
- **M2 · Anti-abuso evadible rotando tokens (riesgo aceptado en ADR §Riesgos y contrato §11).** Tope 5
  (Logica.js:279-286) y 6/min (Servidor.js:167-177) son por hash; el único techo real es el global 30/min. Un bromista
  con un script: aparta los 36 artículos en ~2 min con cualquier nombre (suplantación inherente a «sin cuenta»), y en
  ~67 min llena las 2000 filas → `lista_cerrada` para todos (las filas liberadas también cuentan) hasta que Andrey
  borre filas. La recuperación «filtrar por `hash_token`» (README/ADR) no sirve si rota tokens: hay que filtrar por
  `creado`. `ver` (Servidor.js:67-84) no tiene límite y su caché es por hash: con tokens aleatorios cada GET lee la
  hoja completa (cuota de Apps Script, no datos). Para un grupo de WhatsApp es tolerable; sugerido: bajar el global a
  10-15/min, documentar en README «borrar filas por rango de `creado`», y dejar Turnstile como plan B.

## Bajo
- **B1 · Token de dispositivo en la URL** (`site/api.js:141`, `Servidor.js:46`): es la capacidad para `soltar` y
  viaja en el query string de `ver` (logs de Google/proxies). El contrato lo fija así; cambio barato: `POST {accion:'ver', token}`
  (el propio comentario de api.js:14-15 lo propone).
- **B2 · Actions fijadas por tag mayor** (`pages.yml:23,25,38,44,56`: `@v4`/`@v3`), no por SHA. Permisos del token sí
  son mínimos (`contents: read, pages: write, id-token: write`), sin secretos, sin npm, tests antes del deploy.
- **B3 · Firmas de IA y ruido fuera del diff / de herramienta.** `BRIEF.md:15` («Artifact de claude.ai») e
  `invitacion-v1.html:2` (`meta name="claude:viewport-fit-sides"`) ya están en `main`: salen con A1.
  `.impeccable/config.json` (sí en el diff) es config de una herramienta con «Orchestrator review» y referencia a
  `BRIEF.md`; el build no lo usa: quitarlo del repo.
- **B4 · `Logica.js:229`** `ahora || new Date()` rompe la regla propia «ni el reloj» (cabecera, línea 5); Servidor
  ya pasa la hora. Quitar el fallback.
- **B5 · Fórmulas desde el catálogo.** `setup()` escribe `que`/`producto` con `setValues` sin `textoSeguroParaCelda`
  (`Servidor.js:313-314, 398`). Son datos de Andrey, pero el build (`build.mjs:100-101`) podría rechazar textos que
  empiecen con `=+-@`.
- **B6 · Google Fonts** (`site/index.html:12-14`): dependencia externa en una página «sin dependencias»; opcional
  autohospedar (quita una petición a terceros y un punto de fallo).

## Lo bueno (verificado)
- Entrada: cuerpo ≤ 4000 chars, JSON objeto, campos string, orden del contrato (`Servidor.js:49-62`,
  `Logica.js:168-192`); pruebas positivas y negativas (logica 9/9b, servidor 25, contrato.sh 84-92).
- Carrera: `tryLock(10000)`, frecuencia + relectura + decisión + `appendRow` **dentro** del lock, `releaseLock` en
  `finally` (`Servidor.js:93-118, 154-164`); el test cuenta escrituras fuera del lock y exige 0 (servidor:232).
- Soltar: solo filas con **mi** hash; relee la fila y aborta si cambió (`Servidor.js:138-141`); lo de admin (hash
  vacío) es intocable; negativo con token ajeno en tres niveles (logica 6b, servidor:225, contrato.sh:71).
- Hoja: solo SHA-256 del token, nunca el token (servidor:205); comparación de hashes normalizados.
- Inyección de fórmulas: apóstrofo en `=+-@` (`Logica.js:359-362`); control chars `\u0000-\u001F\u007F` (tab/CR/NUL)
  rechazados antes de colapsar; `\s` Unicode (NBSP, U+2028…) colapsa a espacio; id/tipo/hash acotados por lista/regex.
- `ver`: solo `id`, pila, pilas de parecidos y `mio`; aserción sobre llaves y ausencia de nombre completo/hash/creado/origen
  (logica 8, servidor:222, contrato.sh:52). Token inválido = anónimo, no error.
- Errores: sobre genérico; el stack va solo a `console.error` (servidor 25 comprueba que no se filtra «registros»).
- `setup()`: solo `SpreadsheetApp` sobre la hoja ligada, `LockService`, `CacheService`; protecciones solo con aviso; no
  comparte ni abre permisos.
- Sitio: cero `innerHTML`; todo por `textContent`/`createTextNode` (`app.js:35-57`); `{{x}}` escapa `& < > " '`;
  `{{{X}}}` solo recibe `CATEGORIAS`/`ARTICULOS` generados por el propio build; `url` e `imagen` obligadas a `https://`
  (`build.mjs:103-106`) → sin `javascript:`/`data:`; `referrerpolicy="no-referrer"` en `<img>`, `rel="noopener noreferrer"`;
  `noindex` (el build lo exige) + `robots.txt`; `localStorage` en try/catch; `demo.js` solo en localhost y no se publica.
- Build: rechaza el enlace de la hoja y `/dev` en `api_url`, marcadores sin reemplazar, APIs de Google en `Logica.js`;
  compila `Code.gs` con `vm.Script`; nunca copia `nota`/`verificado`/precios/URLs al script.

→ FORGE: M1 (manifiesto), B3 (`.impeccable`), B4; opcional M2/B5. → Andrey: A1 (borrar v1 + hoja vieja privada).
→ NEXUS: `tests/contrato.sh` contra la web app real cuando exista la URL `/exec`.
