---
tarjeta: 2026-11-19-apartar-regalos
sistema: texto
agente: echo
estado: hecha
fecha: 2026-11-19
tags: [trabajo, agente/echo]
---

# Prueba humana · apartar regalos (demo local)

**Resultado:** sin bloqueos. 0 P0, 3 P1 (molestan), 5 detalles. Anchos 390 y 360 px, y 260 px para simular texto +50 %.

## Personas

- **Tía Marta (62, poca práctica):** apartó en 3 toques y vio «Lo apartaste tú» con cómo soltar. Soltar pide confirmación y responde «Quedó disponible». Nombre vacío: muestra el error y no pierde nada.
- **Sofía (conflicto y mala señal):** el conflicto ofrece el «parecido» directo y no da un falso éxito. Lento (4 s): «Apartando…» y termina bien. Dormido: «Sin conexión» con Reintentar, y la lista se sigue viendo.
- **Pablo (algo parecido):** lo logra, con dudas (P1-b y P1-c).

## P1 (molesta)

- a) Fecha y hora dicen «Por confirmar» sin decir cuándo se sabrá. La dirección solo aparece en texto pequeño gris. Hace falta algo como «Te aviso la fecha por WhatsApp».
- b) No hay cómo decir «llevo otra cosa» sin elegir un artículo. «Llevo algo parecido» siempre depende de un artículo y es un link con poco peso.
- c) Después de marcar «parecido» desaparece «Apartar», y «Soltar» no dice qué suelta. En la prueba salió el nombre de otra persona prellenado (mismo navegador, nombre guardado de antes).

## Detalles

- El nombre queda prellenado aunque se use `?reiniciar`, porque se guarda en el celular.
- El aviso de modo privado aparece al cargar, antes de que la persona haga nada, y asusta.
- Después de un conflicto, el panel sigue titulado «Apartar:» pero sin botón Apartar.
- Sin conexión, los botones apagados no dicen nada al tocarlos.
- En las confirmaciones, las dos sartenes ya se distinguen (corregido en el catálogo).

## Visual

Página de un solo tema claro (`color-scheme: light`, sin reglas oscuras): con el sistema en modo oscuro se ve igual. Con texto al ~150 % no hay desbordes.
