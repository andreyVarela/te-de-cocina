# Alcance mínimo (MVP): Té de cocina de Andrey

Estado: aprobado por Andrey. Fuente: el encargo de Andrey, `catalogo.json` (36 filas) y la invitación v1 (diseño y copy aprobados).

## Resumen
Una página para mandar por WhatsApp. Los invitados ven los 36 artículos (foto, nombre, precio aproximado, link a la tienda) y, sin cuenta, hacen una de tres cosas: **apartar** uno con su nombre, marcar **«Llevo algo parecido»**, o **soltar** lo que apartaron. Andrey tiene una vista aparte para ver quién apartó qué y corregir.

## Conceptos
- **Artículo**: cada fila de `catalogo.json`. Son 36 artículos apartables, aunque `que` se repita (sartén 20 cm y 24 cm; escoba y pala). Se distinguen por `producto`.
- **Apartado**: compromiso exclusivo. Máximo 1 persona por artículo. Nadie más puede apartarlo.
- **Parecido**: promesa no exclusiva. Dice «llevo algo parecido a esto, de donde sea». No reserva el artículo.
- **Estados visibles de un artículo**: `Disponible` · `Apartado por {nombre}`. Encima, de forma independiente: `{nombre} lleva algo parecido`.

## Historias de usuario y criterios de aceptación

### H1. Ver la lista
Como invitado, quiero ver qué falta y qué ya está apartado, para elegir sin preguntarle a nadie.
- Cada artículo muestra: foto, `que` (título), `producto` (subtítulo), precio aproximado, tienda con link y estado.
- El estado se dice **con texto** («Disponible», «Apartado por Ana») y un símbolo. Color y tachado son solo refuerzo. Verificable: en escala de grises se entiende todo igual.
- Se lee y se navega en un celular de 360 px de ancho sin scroll horizontal.
- Los artículos ya apartados siguen visibles (no desaparecen), para que se vea que la lista avanza.
- El link a la tienda abre en pestaña nueva. Debajo de la foto siempre aparece el nombre del producto como texto, por si el link falla.

### H2. Apartar un artículo
Como invitado, quiero apartar un artículo con mi nombre, para que nadie más lo repita.
- Al tocar «Apartar» se abre un formulario en la misma fila (hoja o panel). Pide **solo nombre**. No hay teléfono, correo, ni cuenta.
- Nombre: se recortan espacios; mínimo 2 y máximo 40 caracteres. Si no cumple, aparece un mensaje en texto junto al campo («Escribe tu nombre (2 a 40 letras)»), el foco queda en el campo y no se pierde lo escrito.
- Al confirmar, el artículo pasa a `Apartado por {nombre}` para todos. El invitado ve una confirmación en texto («Listo, apartaste: Licuadora»).
- Si es el primer apartado desde ese dispositivo, la confirmación le explica cómo soltarlo (ver H4).
- Doble toque en «Confirmar» crea **un solo** apartado.
- Un mismo invitado puede apartar más de un artículo.
- Botón con área táctil mínima de 44 px.

### H3. «Llevo algo parecido»
Como invitado, quiero decir que llevo otra cosa equivalente, sin que parezca una exigencia.
- Cada artículo tiene la acción secundaria «Llevo algo parecido», junto a «Apartar» y con menos peso visual.
- Pide **solo nombre**, igual que H2. No hay campo libre de «qué llevas».
- Al confirmar, el artículo muestra «{nombre} lleva algo parecido». **El artículo sigue disponible** para apartar (ver reglas).
- Un invitado no puede estar a la vez como «apartó» y «parecido» en el mismo artículo.
- Puede retirar su «parecido» con la misma lógica de H4.
- Copy sugerido, sin presión: «Nada es obligatorio». Usar el copy de la invitación v1; no inventar copy nuevo de exigencia.

### H4. Soltar lo que aparté
Como invitado, quiero soltar lo que aparté, para liberarlo si ya no puedo llevarlo.
- En los artículos que **yo** aparté (o marqué como parecido) desde este dispositivo aparece «Soltar», con confirmación de un paso («¿Soltar Licuadora?»).
- Al soltar, el artículo vuelve a `Disponible` para todos.
- Los artículos de otras personas **no** muestran «Soltar».
- Si el navegador no puede guardar datos (modo privado, celular viejo) o el invitado cambió de celular, aparece el texto «Para soltarlo, avísame por WhatsApp y yo lo suelto» (voz de Andrey en primera persona). Nunca falla en silencio.
- Soltar es idempotente: tocarlo dos veces no da error.

### H5. Vista de Andrey
Como Andrey, quiero ver quién apartó qué y poder corregir, para llegar al evento sin sorpresas.
- Se entra con un enlace secreto, no adivinable, que **no** aparece en la página pública. Sin ese enlace no se ve nada de la vista de Andrey.
- Muestra los 36 artículos con: estado, nombre **completo como lo escribió el invitado**, tipo (apartó / parecido), fecha y hora del registro. Cabecera con conteo: «X de 36 apartados · Y con parecido».
- Andrey puede: **liberar** un apartado, **quitar** un parecido, **corregir** un nombre (errores de dedo) y **apartar a nombre de alguien** (invitado que avisó por WhatsApp).
- Cada acción de Andrey se refleja en la página pública sin intervención adicional (al recargar basta).
- Se usa bien en celular. Estados con texto, no solo color.

### Requisito transversal: fecha y hora
- Fecha y hora son **un solo valor editable en un único lugar**, fuera de la lógica de la lista. Mientras estén vacíos se muestra «Por confirmar» (como hoy).
- Cambiarlas no exige tocar el código de apartar ni la lista. La forma concreta está en el ADR 0001.
- Formato para el invitado en español de Costa Rica y hora local (UTC-6, sin horario de verano): «sábado 5 de diciembre · 2:00 p. m.».

## Reglas de negocio

1. **Exclusividad (apartado).** Un artículo tiene como máximo un apartado activo. Se hace cumplir **en el servidor**, de forma atómica. La interfaz solo ayuda.
2. **Cantidad mayor a 1** (hoy: Bowls ×2, Tazas ×4, Toallas ×2). Cada fila es **un solo apartable**: quien aparta, lleva el lote completo. Es lo que ya dicen los títulos («Tazas (4)»). El precio unitario del catálogo se muestra como «₡400 c/u · ₡1 600 en total». No hay apartar por unidad en el MVP.
3. **Qué ve un invitado de lo que apartó otro.** Solo el **nombre de pila**, o sea la primera palabra de lo escrito («María José Vargas» se ve «María»). Nunca se muestra fecha, hora, dispositivo ni nada más. Andrey ve el texto completo en su vista. El texto se muestra siempre como texto plano, nunca como HTML.
4. **«Parecido» no bloquea.** Es una promesa, no una reserva. El artículo sigue disponible. Pueden marcar «parecido» varias personas en el mismo artículo. Andrey ve en su vista cuándo hay un apartado y un parecido sobre lo mismo, para resolver duplicados.
5. **Dos apartan a la vez.** Gana el primero que llega al servidor. Al segundo se le dice: «Ana acaba de apartar este. Puedes elegir otro o marcar "Llevo algo parecido"». Su nombre queda escrito en el formulario y la fila se actualiza al estado real. Nunca se muestra éxito falso.
6. **Soltar.** Solo quien apartó puede soltar, identificado por el mismo dispositivo (decisión por defecto, ver pregunta 3). Andrey puede liberar cualquier cosa desde su vista.
7. **Datos que se guardan.** Nombre, artículo, tipo (apartó / parecido), fecha y hora, e identificador anónimo del dispositivo. **Ni teléfono ni correo.** La página no se indexa en buscadores (el link se reparte solo por WhatsApp).
8. **Anti-abuso básico** (detalle técnico en el contrato): límite de longitud, límite de frecuencia por dispositivo y un tope de apartados por dispositivo. Propuesta mía, opcional: 5 apartados activos por dispositivo, para que nadie «aparte toda la lista» por accidente o por broma. Andrey puede liberar lo que sea.
9. **Contenido de `catalogo.json` hacia el invitado.** `nota` es nota interna para Andrey y **no se muestra** (algunas hablan de precios de otras tiendas). Lo que el invitado necesita saber (p. ej. «solo retiro en tienda» en Bambú e Incienso de EPA, hoy escrito dentro de `producto`) debe salir de un campo visible aparte. Se agrega un `id` estable a cada artículo; ahora no existe.
10. **Por país, canal o tipo de cliente:** no cambia nada. Es un solo evento, en Costa Rica, para invitados por WhatsApp.
11. **El artículo «Despensa»** (arroz, té verde, aceite…) se trata como cualquier otro: lo aparta una persona. Si Andrey quiere varias personas para la despensa, se resuelve con «Llevo algo parecido» o se parte la fila en el catálogo.

## Edge cases

| Caso | Comportamiento esperado |
|---|---|
| Sin conexión al abrir | Se ve la lista (contenido básico) con aviso de texto «No pude ver qué está apartado» y «Apartar» desactivado, con la razón escrita. No hay cola offline en el MVP. |
| Se pierde la conexión al confirmar | Mensaje «No se guardó. Revisa tu conexión» con botón Reintentar. Se conserva el nombre escrito. Nunca se muestra «Listo» sin confirmación del servidor. |
| Red lenta | Botón en estado «Guardando…» y bloqueado para evitar doble envío. |
| Nombre vacío o solo espacios | Se rechaza con mensaje en texto junto al campo. |
| Nombre muy largo (más de 40) | Se avisa en el campo (contador visible), no se corta en silencio. |
| Nombre con emojis, tildes, ñ, `<script>` | Se acepta lo razonable y siempre se muestra como texto plano. Sin HTML. |
| Dos invitados con el mismo nombre | Permitido. Andrey los distingue por la hora. |
| Imagen no carga (hotlink caído) | Se muestra un recuadro del mismo tamaño (sin saltos de diseño) con el nombre del artículo en texto. No es solo un icono roto. Si se repite, se guarda copia local, según el BRIEF. |
| Link de tienda roto (404) | El artículo sigue apartable. Siempre se ve el nombre del producto y la tienda en texto («búscalo en Pequeño Mundo»). Andrey corrige el link en el catálogo. No hay verificación automática en el MVP. |
| Celular viejo (Android 7+, iOS 12+ de referencia) | La lista se lee sin JavaScript moderno. No se depende de funciones recientes de CSS/JS sin alternativa. Sin `<dialog>` nativo como único recurso. `localStorage` en `try/catch`. Si el JS falla del todo: texto «Escríbele a Andrey por WhatsApp para apartar». Objetivo de peso: ≤ 300 KB sin contar imágenes, y imágenes con carga diferida. |
| Fuentes de Google no cargan | Las fuentes de respaldo del diseño (`Hiragino`, `Georgia`, `system-ui`) mantienen todo legible. |
| Refrescar mientras otro aparta | La lista se actualiza al recargar. Si se pierde la carrera, aplica la regla 5. |
| Invitado cambia de celular o borra datos | No puede soltar solo. Texto de ayuda: avisarle a Andrey (regla 6). |
| Andrey libera algo que alguien tiene abierto | Si el invitado intenta soltar algo ya liberado, no hay error: se le muestra el estado real. |
| Artículo «Solo retiro en tienda» (EPA) | Aviso visible antes de apartar. |

## Accesibilidad y diseño (restricciones, ya aprobadas)
Andrey es daltónico: ningún estado, error ni acción depende solo del color. El bermellón queda como acento decorativo. Los errores llevan texto. Los estados llevan palabra y símbolo. Foco visible. Botones de 44 px. `lang="ja"` en los kanji. Links subrayados. Paleta y tipografías de `invitacion-v1.html`.

## Fuera del MVP
- Cuentas, login, recuperar sesión, códigos por SMS o correo.
- Confirmar asistencia (RSVP), conteo de invitados, comida o bebida de la carnita.
- Pagos, aportes en dinero, compras dentro de la página o comparar precios.
- Apartar **por unidad** en artículos con cantidad mayor a 1.
- Campo libre de «qué llevas» o comentarios entre invitados.
- Notificaciones o mensajes automáticos por WhatsApp, correo o push.
- Editar el catálogo desde la interfaz (Andrey lo edita en `catalogo.json`).
- Buscar, filtrar, ordenar, favoritos.
- Verificación automática de links y precios.
- Exportar a CSV o imprimir la lista.
- Otros idiomas, modo oscuro, varios eventos.
- Dirección y mapa (se mandan por WhatsApp, según el BRIEF).
- Estadísticas.

## Estimación a grandes rasgos
Pantalla pública con estados y formulario (H1 a H4): 1 a 2 días de trabajo. Almacenamiento con escritura segura y exclusividad: 1 día. Vista de Andrey (H5): 1 día. Pruebas en celular viejo y sin conexión, ajustes de accesibilidad: 0,5 día. Total orientativo: 3 a 5 días de trabajo. La estimación definitiva depende del diseño técnico.

## Preguntas para Andrey (solo las que bloquean) con recomendación por defecto
1. **¿«Llevo algo parecido» bloquea el artículo?** Recomendación: **no**. Es una promesa, el artículo sigue disponible y se ve «Ana lleva algo parecido». Riesgo: puede llegar un regalo repetido. Lo ves en tu vista y lo resuelves por WhatsApp.
2. **Los artículos de 2 o 4 piezas (Bowls, Tazas, Toallas): ¿los lleva una sola persona?** Recomendación: **sí**, una persona lleva el lote completo. Más sencillo y evita regalos incompletos.
3. **¿Cómo suelta un invitado lo que apartó?** Recomendación: **desde el mismo celular y navegador**, con un botón «Soltar». Si cambió de celular, te avisa y tú lo liberas desde tu vista. Alternativa: código corto de 4 caracteres que se les muestra al apartar. Es más trabajo para el invitado y se pierde fácil.

Mientras no respondas, avanzamos con esas tres recomendaciones. Las demás decisiones (nombre de pila visible para todos, tope de 5 apartados por dispositivo, despensa como un solo artículo) se toman por defecto como están escritas arriba. Se pueden cambiar sin rehacer el diseño.

## Diferencias entre documentos (el catálogo manda)
- `invitacion-v1.html` aún usa productos antiguos (Novex, Tramontina, olla roja que da 404), precios distintos, 34 filas (junta sartenes y escoba/pala) y un Google Sheet como mecanismo de apartar. El `catalogo.json` verificado es el vigente. El copy de la invitación habla de «Novex, EPA, El Lagar y Pequeño Mundo», pero el catálogo solo usa Pequeño Mundo y EPA.
- Hay que revisar dos datos del catálogo. La tetera eléctrica dice 1200 W en `producto` y 400 W en el `url`. La mopa «no promete» que no suelte pelusa, y el título de Andrey lo pide.

## Integraciones
- Ninguna con terceros de cara al invitado, salvo links salientes a Pequeño Mundo y EPA y fotos hotlinkeadas de esas tiendas.
- Backend y hosting están en el ADR 0001 (el BRIEF propone Supabase nuevo y aparte y hosting estático gratis). Crear cuentas, proyectos o publicar requiere OK de Andrey en el chat.

