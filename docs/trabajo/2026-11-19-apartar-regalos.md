---
tarjeta: 2026-11-19-apartar-regalos
sistema: texto
agente: patron, atlas, forge, aurora
estado: bloqueada
fecha: 2026-11-19
tags: [trabajo, agente/forge, agente/aurora]
---

# Té de cocina: mini app para apartar regalos

**Resultado:** construida y revisada en la rama `feat/apartar-regalos` (repo público `andreyVarela/te-de-cocina`, Pages por Actions). Espera a Andrey para subir `main`, crear la hoja y desplegar el script.

## Qué se hizo
- PATRON: alcance MVP (`docs/producto/alcance.md`), con H1-H4 y las reglas por defecto aprobadas por Andrey (parecido no bloquea, los lotes los lleva una sola persona, soltar desde el mismo celular).
- ATLAS (Fable): ADR 0001 y contrato. Primero diseñó Supabase; Andrey pidió algo más simple y quedó **Google Sheet + Apps Script** con la página en GitHub Pages. La hoja es la vista de Andrey (pestaña `resumen`).
- FORGE: `apps-script/` (lógica pura + servidor con lock, hash del token, límites anti-abuso y protección contra fórmulas), `scripts/build.mjs`, pruebas, `pages.yml` y README. Catálogo con `id` estable y `aviso`.
- AURORA: `site/` vanilla (sin framework), con los 5 estados, sin innerHTML, token de dispositivo en localStorage y demo local con `?demo`.
- Orquestador: renombré en el catálogo los títulos repetidos (sartenes, escoba y pala). Reescribí el historial local antes de publicar para tapar el ID de una hoja vieja que venía en `invitacion-v1.html`.

## Verificación
- `node --test tests/*.test.mjs`: 27/27. `node scripts/build.mjs`: OK.
- El historial no tiene el ID de la hoja vieja, ni secretos, ni firmas de IA.
- Sin verificar todavía: `tests/contrato.sh` contra la web app real (falta la URL `/exec`) y la prueba en un celular físico.

## Revisiones
- IRIS: CAMBIOS (0 P0, 4 P1, 7 P2) → AURORA los corrigió. Contraste AA medido.
- SENTINEL (Fable): APROBADO. Lo medio y bajo se corrigió en el mismo ciclo (alcance `@OnlyCurrentDoc`, límite global 15/min, acciones fijadas por SHA). El hallazgo alto preexistente (enlace a una hoja en `invitacion-v1.html`) se tapó del historial antes del primer push.
- ECHO: sin bloqueos; 3 P1 de copy y flujo corregidos por AURORA. Reporte: `2026-11-19-echo-prueba.md`.
- Fable usado en: ATLAS (diseño de un módulo nuevo con escritura pública) y SENTINEL (escritura pública sin auth).

## Pendientes
- Andrey: subir `main` (el guard bloquea el push a la rama protegida), crear la hoja, pegar `Code.gs`, correr `setup()`, implementar la web app, pasar la URL `/exec` y poner privada la hoja vieja.
- Orquestador: PR feat → main, `api_url` en `evento.json`, `bash tests/contrato.sh <URL>` y prueba en celular contra el link real.
- Backlog (fuera del MVP): «Llevaré otra cosa» sin elegir artículo (ECHO P1-b); copia local de fotos si alguna tienda bloquea el hotlink (IRIS P1-3); token por POST en `ver` (SENTINEL B1).
