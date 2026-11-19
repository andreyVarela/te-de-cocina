# Té de cocina de Andrey: mini app para apartar regalos

## Qué es
Andrey (el Owner) cumple años y se muda solo a un apartamento: hace una **carnita de cumpleaños + té de cocina**. Quiere una página para mandar por WhatsApp donde los invitados (familia y amigos, casi todos en celular, **sin cuenta en nada**) vean la lista de cosas que le faltan y **aparten** una directamente.

## Lo que pidió
- Cada artículo con **foto**, nombre, precio aproximado y **link a la tienda** que funcione.
- Botón **Apartar** en la misma página: el invitado pone su nombre y queda apartado para todos (nadie repite).
- Opción **«Llevo algo parecido»**: no quiere que parezca que exige cosas; cada quien lleva lo que quiera.
- Moderno, sencillo, minimalista, con toque **japonés/asiático**. Andrey es **daltónico**: nada depende solo del color.
- Fecha y hora: **por confirmar** (dejar fácil de cambiar). Lugar: «mi apartamento»; dirección por WhatsApp.

## Datos
- `catalogo.json`: lista verificada (cat, que, producto, tienda, precio_crc, url, imagen, verificado). Mayormente Pequeño Mundo, algo de EPA.
- `invitacion-v1.html`: primera versión (Artifact de claude.ai) ya revisada por IRIS: reutilizar paleta (washi #F3EFE6, sumi #1F1D1A, bermellón #B8432C), tipografías (Shippori Mincho + Zen Kaku Gothic New), copy y los ajustes de accesibilidad (botones de 44 px, `lang="ja"` en kanji, subrayado en links).

## Decisiones para ATLAS
- **Backend:** sin cuentas para invitados. Propuesta: un proyecto de **Supabase nuevo y aparte** (no el de finanzas) con una tabla `regalos`/`apartados` y escritura solo vía RPC (`apartar(item_id, nombre, parecido bool)`) con validación, límite de longitud y anti-abuso básico (rate limit o captcha ligero sin servicios pagos); lectura pública solo de lo necesario (item, apartado sí/no, nombre de pila). Alternativas válidas si ATLAS las justifica: Google Apps Script sobre una hoja, o un endpoint en un servidor propio de Andrey.
- **Hosting:** gratis. GitHub Pages en `andreyVarela` (repo privado con Pages, o público si no tiene datos sensibles) u otro estático.
- **Desapartar:** el invitado puede soltar lo que apartó él (código corto o mismo dispositivo); Andrey puede corregir desde un enlace de admin o desde Supabase.
- **Privacidad:** no pedir teléfono ni correo. Solo nombre.
- **Fotos:** usar la URL de imagen de la tienda (hotlink); si alguna no carga, guardar copia local optimizada.

## Reglas
- Crear cuentas, proyectos de Supabase, repos públicos o publicar: **solo con OK de Andrey en el chat**, mostrando antes qué se va a crear.
- Sin firmas de IA en commits. `main` por PR que mergea Andrey.
- Entregable: link público funcionando en celular + cómo cambiar fecha/hora + cómo ver quién apartó qué.
