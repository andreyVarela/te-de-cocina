# ADR 0001 · Backend y hosting

Estado: aceptado por Andrey (2026-11-19). Sustituye la propuesta inicial con Supabase.
Contrato técnico que implementan FORGE y AURORA: `docs/arquitectura/contrato.md`.

## Decisión

1. **Backend: una hoja de Google Sheets + Apps Script en la cuenta de Google de Andrey.** Sin
   cuentas nuevas ni servicios aparte. El script va **ligado a la hoja** (Extensiones → Apps
   Script) y se publica como **web app** con «Ejecutar como: yo» y «Quién tiene acceso: cualquier
   persona». La URL `…/macros/s/<ID>/exec` es la API: `GET ?accion=ver` lee; `POST` con cuerpo
   JSON aparta y suelta. La hoja misma es la vista de Andrey: no hay `admin.html` ni secreto de
   admin.
2. **Hosting: GitHub Pages en `andreyVarela/te-de-cocina`, repo público** (ya aprobado), publicado
   con GitHub Actions al hacer push a `main`.
3. **Frontend estático y simple, explícitamente:** HTML + CSS + JS vanilla, sin framework ni
   bundler ni `npm install`. Un solo módulo de red, `site/api.js`, con `verLista`, `apartar` y
   `soltar`. El único «build» es `node scripts/build.mjs` (Node ≥ 18, solo módulos nativos) que
   lee `catalogo.json` + `evento.json` y genera `dist/` (HTML con la lista y la fecha ya
   renderizadas) y el archivo único `apps-script/Code.gs` que Andrey pega en el editor.
4. **Fecha/hora en `evento.json`**, junto con `api_url`. Es el único archivo que Andrey edita en
   GitHub; la Action reconstruye y publica en ~1 min.

## Por qué

- **Preferencia del Owner:** quiere «lo más simple, un JSON acomodado como base», uso único, sin
  crear cuentas. Un archivo estático no recibe escrituras; lo más cercano que sí las recibe, dentro
  de su cuenta de Google, es una hoja con un script. Además ve y corrige los datos en una hoja, que
  ya sabe usar, en vez de en un panel hecho a medida.
- **Supabase (descartado):** técnicamente mejor para exclusividad (índice único) y latencia, pero
  exige crear un proyecto nuevo, vigilar la pausa por inactividad del plan gratis y construir una
  vista de admin con secreto. Para 36 artículos y unas decenas de invitados, el Owner prefirió
  menos piezas. Se conserva el diseño anterior en el historial de este archivo por si hubiera que
  volver.
- **Servidor propio (descartado):** dominio, TLS y mantenimiento para un evento de un día.
- **La hoja como admin:** liberar = cambiar una celda; corregir nombre = editar una celda; apartar
  a nombre de alguien = una fila nueva. Una pestaña `resumen` con fórmulas muestra «quién apartó
  qué» legible desde el celular con la app de Sheets.

## Riesgos y mitigaciones

- **Latencia:** cada llamada tarda 0,5 a 2 s (hasta 5 s en frío). La UI muestra «Guardando…» y
  bloquea el botón; la lista se pinta primero desde el HTML estático y luego se completan estados.
- **Concurrencia / carrera al apartar:** Apps Script no tiene transacciones. Toda escritura toma
  `LockService.getScriptLock().waitLock(10000)`; dentro del lock se relee la pestaña `registros`,
  se comprueba que no haya apartado activo y se agrega la fila. Si no consigue el lock, responde
  `demasiadas_solicitudes` y la UI ofrece reintentar. Nunca se escribe fuera del lock.
- **Cuotas de Apps Script (cuenta gratuita):** 30 ejecuciones simultáneas por usuario y 6 min por
  ejecución. Una fiesta de WhatsApp no se acerca, pero un pico (todos abren el link a la vez)
  puede dar «too many simultaneous invocations»: el cliente reintenta `ver` una vez tras 1-2 s
  aleatorios y, si falla, muestra «No pude ver qué está apartado» (edge case previsto). `ver` se
  cachea 5 s en `CacheService` para absorber recargas.
- **CORS y redirecciones:** Apps Script no responde `OPTIONS`, así que el `POST` va con
  `Content-Type: text/plain` (petición «simple», sin preflight) y el JSON en el cuerpo. La
  respuesta llega tras un `302` a `script.googleusercontent.com`, que `fetch` sigue solo
  (`redirect: 'follow'`, por defecto). Lectura por `GET` con query string. Respuestas con
  `ContentService` y MIME JSON.
- **URL pública por diseño:** cualquiera con la URL puede llamar a la API (está en el HTML). El
  script corre como Andrey pero solo toca esta hoja (`getActiveSpreadsheet()`), no pide otros
  permisos y no expone nombres completos, hashes ni horas en `ver`. Anti-abuso en el script:
  validación de nombre, tope de 5 apartados por dispositivo, límite de frecuencia por dispositivo y
  global con `CacheService`, tope total de filas. Recuperación: Andrey filtra por `hash_token` en
  la hoja y libera todo lo de un dispositivo en bloque.
- **Redespliegue:** la URL cambia si se crea «Nueva implementación». Para actualizar código sin
  cambiar la URL: Implementar → Administrar implementaciones → lápiz → Versión: «Nueva versión» →
  Implementar.
- **Soltar depende del mismo dispositivo:** sin ese navegador no puede soltar; la UI lo dice y
  Andrey libera en la hoja. Decisión de producto aprobada.
- **Pruebas sin Apps Script local:** la lógica de negocio va en funciones puras (`Logica.js`, sin
  APIs de Google) que FORGE prueba con `node --test`; las APIs de Google quedan en una capa fina
  (`Servidor.js`). El contrato real se verifica con `curl` contra la web app desplegada (§9 del
  contrato).

## Lo que Andrey debe crear o aprobar (exacto)

1. Una **hoja de Google nueva** en su cuenta, nombre `te-de-cocina` (privada; no compartir).
   Archivo → Configuración → zona horaria «(GMT-06:00) Costa Rica».
2. Extensiones → Apps Script: pegar el contenido de `apps-script/Code.gs` (un solo archivo que
   genera el build), guardar, ejecutar `setup()` una vez y aceptar los permisos (solo «ver y
   administrar hojas de cálculo» de esa hoja). Eso crea las pestañas `articulos`, `registros` y
   `resumen` y carga los 36 artículos.
3. Implementar → Nueva implementación → Aplicación web → «Ejecutar como: yo», «Quién tiene
   acceso: cualquier persona» → copiar la URL `…/exec` y pegarla en `api_url` de `evento.json`.
4. Repo público `andreyVarela/te-de-cocina` con Pages origen «GitHub Actions» → URL
   `https://andreyvarela.github.io/te-de-cocina/`. En el repo se publica la `api_url` (pública por
   diseño). Nunca se publica el ID ni el enlace de la hoja.
