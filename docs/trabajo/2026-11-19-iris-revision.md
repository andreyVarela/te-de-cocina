# IRIS · Revisión UI · apartar regalos (site/) · 2026-11-19

Pantalla: lista pública de regalos · modo Operar (con tramo Guiar en la intro). **Veredicto: CAMBIOS (0 P0, 4 P1, 7 P2).**
Revisado en navegador real (demo local, iframe a 360 px y ventana ancha), capturas de AURORA (01-16) y CSS/JS. Contraste medido: texto suave 5,97:1, bermellón sobre washi 4,72:1, blanco sobre bermellón 5,42:1, sumi 14,65:1 → todo AA. No hay scroll horizontal a 360 (página de 11 378 px, 36 filas). Nada depende solo del color.

## Tus 5 preguntas
**(a) Fotos vacías en la captura 03.** Es la captura, no un bloqueo. Probé las URLs con curl: Pequeño Mundo (33 de 36 fotos) responde 200 sin Referer y **403 con un Referer ajeno**; EPA (3) responde 200 siempre. `articulo.html` ya manda `referrerpolicy="no-referrer"`, por eso en Chrome real cargan (las vi). Hoy funciona, pero depende de un detalle de la tienda y de rutas con hash de caché. Recomiendo copia local (P1 abajo).
**(b) Mismo título en dos filas.** Se distinguen en la lista (el subtítulo «20cm»/«24cm» no se tacha y la foto lleva la medida), pero **se confunden en las confirmaciones**: «Apartar: Juego de sartenes antiadherentes», «¿Soltar Juego de sartenes…?», «Listo, apartaste: Juego de sartenes…». Quien aparta la de 20 cm no sabe confirmar cuál. Además «Juego» sugiere que hay que llevar las dos.
**(c) Título tachado.** Legible (sigue a 14,65:1) y no exige: el texto «Apartado por María» manda, el tachado solo refuerza, y «Llevo algo parecido» sigue ofrecido. Se queda para lo de otros. **Falla en lo propio**: tras apartar, mi regalo sale tachado y atenuado junto a «Lo apartaste tú» y «Soltar» (verificado en vivo).
**(d) Voz.** Está mezclada. La invitación habla Andrey en primera persona («Cumplo años», «te los paso», «la opción más barata que encontré»), pero luego «Avísale a Andrey… y él lo suelta», «para que Andrey sepa». Unifica a primera persona de Andrey en lo humano («Avísame por WhatsApp y yo lo suelto»). Los fallos técnicos, en neutro («No se pudo ver qué está apartado»), porque «No pude…» suena a persona. Ojo: el alcance H4 dice literalmente «avísale a Andrey»; PATRON debe actualizarlo.
**(e) Barra animada.** Aceptable, no la quitaría por bloqueo: 3 px, 1,1 s, y ya está el texto «Puede tardar unos segundos; no cierres la página». Pero son tres señales a la vez (botón «Apartando…», símbolo «…», barra). Con `prefers-reduced-motion` queda una barra quieta al 40 %, que parece progreso falso. Preferiría quitarla; si se queda, ocultarla en reduced-motion.

## P1 (piden cambios)
1. **Cuál sartén** · app.js:283, 326, 387, 402, 312, 343 y sr en 176/179/182 usan solo `a.que`. Cambio: en `catalogo.json` renombrar `que` a «Sartén antiadherente 20 cm (1 de 2)» / «(2 de 2)», o que el panel/mensajes añadan `producto`. Directriz: Nielsen 2 (lenguaje) y H1 (se distinguen por `producto`).
2. **Lo mío tachado** · app.js:160 (`data-estado` del li vale `apartado` también si es mío) + estilos.css:177-178. Cambio: `st.apartado_por && st.mio !== 'apartado' ? 'apartado' : clave`; así mi fila conserva foto y título completos.
3. **Fotos** · articulo.html (`src="{{imagen}}"`). Cambio: copiar las 36 a `site/img/` (≈200 px, JPG/WebP ~8-15 KB c/u, ≈0,4 MB en total, ya con `loading="lazy"`) y que el build use la local; la URL de la tienda queda solo en el link. Evita 403 futuro, cambios de ruta y bloqueos en navegadores de WhatsApp.
4. **Lo que más importa queda lejos** · index.html:34-44. La primera fila llega tras ~2 pantallas a 360 px y «Nada es obligatorio» (lo que baja la presión) está en 14 px gris. Cambio: dejar los 3 pasos en una línea cada uno, subir «Nada es obligatorio…» a 16 px junto al título de la lista, y mover el párrafo de «Soltar» (index.html:42) al pie de la lista (la confirmación ya lo explica, app.js:328).

## P2
- Voz mixta (ver d): index.html:42-43, 52; app.js:223, 229, 287, 327, 438.
- Barra de espera (ver e): estilos.css:235-236 y 248; en reduced-motion ocultarla.
- Barra sticky de 2 líneas a 360 px come ~64 px de un celular chico: estilos.css:115-121. Cambio: texto de una línea («3 de 36 apartados») o no sticky.
- Estado sin conexión se repite 36 veces: app.js:151. Cambio: texto corto «Sin conexión» por fila; la razón completa ya está en la barra (`aria-describedby`).
- Foco programático en el mensaje de éxito dibuja un aro bermellón que lee como alerta: app.js:329, estilos.css:53. Cambio: `.mensaje:focus { outline-color: var(--texto); }`.
- «Llevo algo parecido» queda 10 px a la derecha del estado cuando es el único botón: estilos.css:194. Cambio: `margin-left:-10px` en ese caso.
- «la opción más barata que encontré» (index.html:37) puede sonar a «trae lo barato»; mejor «con una opción de referencia».

## Bien
- Estado con texto + símbolo de forma (círculo vacío / ✓ / ? / …), borde punteado en lo desactivado: se entiende en grises y para Andrey.
- Un solo primario por fila (negro), «Llevo algo parecido» con menos peso; bermellón solo en sello, kanji, foco y error con «!» y texto; 44 px reales en botones, links de tienda y «Actualizar».
- Conflicto, error de red, nombre largo (contador + «Te pasaste por 5 letras») y fallo de foto con el nombre escrito: ningún éxito falso, el nombre se conserva.

## Doc ↔ código
- alcance.md H4 fija «avísale a Andrey»; el código lo cumple, pero choca con la voz de la invitación (ver d).
- alcance.md Cantidad/títulos: «Se distinguen por `producto`», pero la UI de confirmación no lo muestra (P1-1).

→ AURORA: P1-2, P1-4 y los P2 de CSS/JS. → PATRON/catálogo: P1-1 (títulos) y la frase de H4. → ATLAS/FORGE: P1-3 (copia local en el build). → ECHO: repetir flujo apartar/soltar en celular viejo tras los cambios.
