#!/usr/bin/env bash
# Prueba de contrato contra la web app REAL de Apps Script (contrato §9, se corre después de
# que Andrey despliegue). Escribe filas de prueba con nombre «Prueba contrato» y las deja liberadas;
# Andrey puede borrarlas de la pestaña «registros» cuando quiera.
#
# Uso:  bash tests/contrato.sh                      (toma api_url de evento.json)
#       bash tests/contrato.sh https://script.google.com/macros/s/AKfy.../exec [articulo_id]
# Requiere: curl y node (para leer JSON). No usa secretos.
#
# Ojo con curl: se usa -L SIN -X POST. Apps Script responde 302 y la respuesta se lee con GET en
# script.googleusercontent.com (igual que hace fetch). Con -X POST curl repetiría el POST y fallaría.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
API="${1:-$(node -e 'process.stdout.write(require(process.argv[1]).api_url || "")' "$RAIZ/evento.json")}"
if [[ -z "$API" || "$API" == *XXXX* ]]; then
  echo "Falta la URL /exec: pásala como argumento o pégala en evento.json → api_url." >&2
  exit 2
fi

NOMBRE="Prueba contrato"
T1="$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
T2="$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
T3="$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
FALLOS=0
PASOS=0

get()  { curl -sS -L --max-time 30 "$API?$1"; }
post() { curl -sS -L --max-time 30 -H 'Content-Type: text/plain;charset=utf-8' --data-binary "$1" "$API"; }

# check "descripción" "<json>" "<expresión JS sobre r que debe ser true>"
check() {
  PASOS=$((PASOS + 1))
  if node -e '
    let r; try { r = JSON.parse(process.argv[1]); } catch { console.error("  respuesta no es JSON: " + process.argv[1].slice(0, 200)); process.exit(1); }
    const ok = (function (r) { return eval(process.argv[2]); })(r);
    if (!ok) { console.error("  respuesta: " + JSON.stringify(r).slice(0, 400)); process.exit(1); }
  ' "$2" "$3"; then
    echo "ok   $1"
  else
    echo "FALLA $1"; FALLOS=$((FALLOS + 1))
  fi
}

LLAVES_ART='r.articulos.every(a => JSON.stringify(Object.keys(a).sort()) === JSON.stringify(["apartado_por","id","mio","parecidos"]))'

# 1. ver anónimo: llaves exactas, nada privado
V="$(get 'accion=ver')"
check "ver: 200 tras redirect con el sobre ok" "$V" 'r.ok === true && typeof r.generado_en === "string" && Array.isArray(r.articulos)'
check "ver: llaves exactas en raíz y en cada artículo" "$V" "JSON.stringify(Object.keys(r).sort()) === '[\"articulos\",\"generado_en\",\"ok\"]' && $LLAVES_ART"
check "ver: sin token, mio = null en todo" "$V" 'r.articulos.every(a => a.mio === null)'
check "ver: no expone hash, creado, origen ni nombre completo" "$V" '!/hash_token|creado|origen|"nombre"|[0-9a-f]{64}/.test(JSON.stringify(r))'
check "ver: token inválido se ignora (no es error)" "$(get 'accion=ver&token=xyz')" 'r.ok === true && r.articulos.every(a => a.mio === null)'

# Artículo libre para probar (o el que pasen como 2.º argumento)
ART="${2:-$(node -e 'const r = JSON.parse(process.argv[1]); const a = r.articulos.find(x => x.apartado_por === null); process.stdout.write(a ? a.id : "")' "$V")}"
if [[ -z "$ART" ]]; then echo "No hay ningún artículo libre para probar; pasa uno como 2.º argumento." >&2; exit 2; fi
echo "     (artículo de prueba: $ART)"

# 2. apartar → repetido → otro dispositivo pierde → soltar con otro token no suelta → soltar → idempotente
A="{\"accion\":\"apartar\",\"articulo_id\":\"$ART\",\"nombre\":\"$NOMBRE\",\"tipo\":\"apartado\",\"token\":\"$T1\"}"
check "apartar: ok con nombre de pila" "$(post "$A")" "r.ok === true && r.repetido === false && r.nombre_pila === 'Prueba' && r.estado.apartado_por === 'Prueba'"
check "apartar otra vez (doble toque): repetido" "$(post "$A")" 'r.ok === true && r.repetido === true'
check "ver con mi token: mio = apartado" "$(get "accion=ver&token=$T1")" "r.articulos.find(a => a.id === '$ART').mio === 'apartado'"
check "otro dispositivo aparta lo mismo: ya_apartado{por}" \
  "$(post "{\"accion\":\"apartar\",\"articulo_id\":\"$ART\",\"nombre\":\"$NOMBRE\",\"tipo\":\"apartado\",\"token\":\"$T2\"}")" \
  "r.ok === false && r.codigo === 'ya_apartado' && r.datos.por === 'Prueba' && typeof r.mensaje === 'string'"
check "otro dispositivo: parecido sí entra (no bloquea)" \
  "$(post "{\"accion\":\"apartar\",\"articulo_id\":\"$ART\",\"nombre\":\"$NOMBRE\",\"tipo\":\"parecido\",\"token\":\"$T2\"}")" \
  "r.ok === true && r.estado.apartado_por === 'Prueba' && r.estado.parecidos.includes('Prueba')"
check "soltar con un token ajeno: no suelta nada (liberado false)" \
  "$(post "{\"accion\":\"soltar\",\"articulo_id\":\"$ART\",\"token\":\"$T3\"}")" \
  "r.ok === true && r.liberado === false && r.estado.apartado_por === 'Prueba'"
check "el del parecido suelta SOLO su parecido; mi apartado sigue" \
  "$(post "{\"accion\":\"soltar\",\"articulo_id\":\"$ART\",\"token\":\"$T2\"}")" \
  "r.ok === true && r.liberado === true && r.estado.apartado_por === 'Prueba' && r.estado.parecidos.length === 0"
check "soltar con mi token: liberado" "$(post "{\"accion\":\"soltar\",\"articulo_id\":\"$ART\",\"token\":\"$T1\"}")" \
  'r.ok === true && r.liberado === true && r.estado.apartado_por === null'
check "soltar otra vez: liberado false, sin error" "$(post "{\"accion\":\"soltar\",\"articulo_id\":\"$ART\",\"token\":\"$T1\"}")" \
  'r.ok === true && r.liberado === false'

# 3. errores del catálogo §6
check "nombre corto: nombre_invalido{corto}" \
  "$(post "{\"accion\":\"apartar\",\"articulo_id\":\"$ART\",\"nombre\":\"A\",\"tipo\":\"apartado\",\"token\":\"$T1\"}")" \
  "r.codigo === 'nombre_invalido' && r.datos.motivo === 'corto'"
check "token mal formado: token_invalido" \
  "$(post "{\"accion\":\"apartar\",\"articulo_id\":\"$ART\",\"nombre\":\"$NOMBRE\",\"tipo\":\"apartado\",\"token\":\"abc\"}")" \
  "r.codigo === 'token_invalido'"
check "artículo inexistente: articulo_invalido" \
  "$(post "{\"accion\":\"soltar\",\"articulo_id\":\"no-existe-prueba\",\"token\":\"$T1\"}")" "r.codigo === 'articulo_invalido'"
check "tipo raro: tipo_invalido" \
  "$(post "{\"accion\":\"apartar\",\"articulo_id\":\"$ART\",\"nombre\":\"$NOMBRE\",\"tipo\":\"regalo\",\"token\":\"$T1\"}")" "r.codigo === 'tipo_invalido'"
check "cuerpo no JSON: entrada_invalida" "$(post 'hola')" "r.codigo === 'entrada_invalida'"
check "GET con acción de escritura: accion_invalida" "$(get 'accion=apartar')" "r.codigo === 'accion_invalida'"

echo
echo "Pendiente manual (navegador, otro origen): en la consola de la página publicada, un POST con"
echo "Content-Type text/plain NO debe mostrar petición OPTIONS en la pestaña Red."
echo "Filas de prueba: nombre «$NOMBRE» en la pestaña registros, todas liberadas. Andrey puede borrarlas."
echo
if [[ $FALLOS -gt 0 ]]; then echo "$FALLOS de $PASOS comprobaciones fallaron."; exit 1; fi
echo "Las $PASOS comprobaciones pasaron."
