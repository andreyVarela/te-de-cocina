# ADR 0001 · Backend y hosting

Estado: propuesto (ATLAS, 2026-11-19). Requiere OK de Andrey antes de crear nada.
Contrato técnico que implementan FORGE y AURORA: `docs/arquitectura/contrato.md`.

## Decisión

1. **Backend: un proyecto de Supabase nuevo y aparte** (plan gratis, región `us-east-1`, no el de
   finanzas). Solo Postgres + PostgREST. Sin Auth para invitados, sin Realtime, sin Storage, sin
   Edge Functions. Toda escritura pasa por RPCs `security definer`; ninguna tabla es legible ni
   escribible directo con la clave pública.
2. **Hosting: GitHub Pages en `andreyVarela/te-de-cocina`, repo público** (en plan gratis Pages
   solo funciona en repos públicos). Se publica con GitHub Actions al hacer push a `main`.
3. **Frontend estático y simple, explícitamente:** HTML + CSS + JS vanilla, sin framework, sin
   bundler, sin `npm install`, **sin supabase-js** (se llama a `/rest/v1/rpc/<fn>` con `fetch`,
   un helper de ~20 líneas). El único «build» es `node scripts/build.mjs` (Node ≥ 18, solo módulos
   nativos) que lee `catalogo.json` + `evento.json` y genera `dist/` (HTML con la lista ya
   renderizada) y `supabase/seed/articulos.sql`. Lo corre la Action; también corre local.
4. **Vista de Andrey: enlace secreto** (`admin.html#s=<secreto>`), no el dashboard de Supabase.
   El secreto vive solo en la base como hash SHA-256 y en las notas de Andrey. El dashboard queda
   como respaldo para emergencias (SQL directo).

## Por qué

- **Supabase vs. Apps Script sobre hoja:** la exclusividad «máximo un apartado por artículo» se
  resuelve con un índice único parcial de Postgres; en Apps Script habría que simular transacciones
  con `LockService`, la latencia es de 1 a 3 s y el POST hace redirect 302 que rompe `fetch` en
  navegadores viejos. **Vs. servidor propio:** hay que mantener dominio, TLS y proceso para un
  evento de un día. Supabase da Postgres real, HTTPS y CORS abierto sin operar nada.
- **GitHub Pages público vs. privado:** en el repo no hay nada sensible. La clave pública de
  Supabase (anon/publishable) está hecha para publicarse; los nombres de invitados viven solo en la
  base; el secreto de admin nunca entra al repo. Las `nota` internas del catálogo no se publican en
  el sitio (el build las quita), aunque sí están en el JSON del repo: son comparaciones de precios,
  no datos personales. Si Andrey prefiere repo privado, la alternativa gratis es Cloudflare Pages o
  Netlify (aceptan repos privados); el resto del diseño no cambia.
- **Sin supabase-js:** pesa ~100 KB, trae dependencia a un CDN y no aporta nada para 7 RPCs. El
  objetivo es ≤ 300 KB y que corra en Android 7 / iOS 12 (`fetch` y `localStorage` existen ahí).
- **Fecha/hora en `evento.json`, no en la base:** es el dato más importante de la invitación y no
  debe depender de que Supabase esté despierto. Se edita una línea en GitHub (web o celular), la
  Action reconstruye y publica en ~1 min. Sin JS también se ve, porque el build la deja escrita en
  el HTML.
- **Enlace secreto vs. dashboard:** Andrey necesita ver y corregir desde el celular, en la fiesta.
  El dashboard pide login y SQL. Un secreto de 256 bits en el fragmento (`#`) no viaja a GitHub ni
  en `Referer`, y se rota con una consulta de una línea. Supabase Auth con magic link sería más
  «correcto» pero añade correo, sesiones y una pantalla de login para un solo usuario y tres
  semanas de vida.

## Riesgos y mitigaciones

- **Pausa por inactividad del plan gratis:** Supabase pausa un proyecto gratis tras **7 días sin
  actividad** y hay que reactivarlo a mano desde el dashboard (1 clic, ~2 min). Mitigación: (a)
  cada visita a la página hace una petición y cuenta como actividad; (b) un workflow de GitHub
  Actions con `cron` cada 3 días llama a `ver_lista` (gratis en repo público); (c) si de todas
  formas se pausa, la página muestra «No pude ver qué está apartado» con «Apartar» desactivado
  (edge case ya previsto) y Andrey reactiva. Plan gratis permite 2 proyectos activos: finanzas +
  este. Después del evento, Andrey puede pausarlo o borrarlo.
- **Abuso con la clave pública:** sin captcha de terceros (la página no está indexada y solo se
  reparte por WhatsApp; el único atacante realista es un bromista del grupo). Defensas en la base:
  validación de nombre, tope de 5 apartados activos por dispositivo, límite de frecuencia por
  dispositivo y global, tope total de filas. Recuperación en un toque: Andrey libera todo lo de un
  dispositivo desde su vista. Si hubiera abuso real, el siguiente paso sería Cloudflare Turnstile
  (gratis) validado en la RPC: queda como futuro.
- **Soltar depende del mismo dispositivo:** si el invitado cambia de celular o navega en privado,
  no puede soltar; la UI lo dice y Andrey libera. Decisión de producto ya tomada por defecto.
- **Sin Supabase CLI ni Docker en la máquina:** FORGE prueba la SQL en un cluster local desechable
  (`pg_ctl`, `psql`). La migración no usa `pgcrypto` ni nada fuera de Postgres estándar
  (`gen_random_uuid()` y `sha256()` son nativos desde PG13/PG11). Los roles `anon`,
  `authenticated` y `service_role` no existen en Postgres vanilla: el harness local los crea; la
  migración no.
- **Hotlink de fotos:** si una tienda bloquea el hotlink, se guarda copia optimizada en
  `site/img/`. Fuera del alcance de este ADR; lo decide AURORA caso por caso.

## Lo que Andrey debe crear o aprobar (exacto)

1. Proyecto de Supabase nuevo: nombre `te-de-cocina`, plan Free, región `us-east-1`, con una
   contraseña de base fuerte (se guarda en su gestor de contraseñas; no en el repo). En
   Authentication, desactivar «Allow new users to sign up».
2. Repo público `andreyVarela/te-de-cocina`, Pages con origen «GitHub Actions». URL resultante:
   `https://andreyvarela.github.io/te-de-cocina/`.
3. Se publican en `evento.json` (y por tanto en el HTML): la URL del proyecto y la clave
   **pública** (anon / publishable). **Nunca** la `service_role` ni la contraseña de la base.
4. El secreto de admin lo genera Andrey (`openssl rand -hex 32`), lo guarda en sus notas y lo
   registra en la base con una consulta de una línea en el SQL Editor (está en el contrato). No
   va en el repo, en el HTML ni en el chat.
