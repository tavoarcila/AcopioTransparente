#!/usr/bin/env bash
# Regenera el cliente TypeScript del contrato y lo copia al front.
#
# Úsalo después de redesplegar el contrato (por ejemplo, si la testnet se
# reinicia). Corre en Git Bash desde la carpeta `contrato`:
#   ./generar-cliente.sh            # usa el alias "acopio" de la CLI
#   ./generar-cliente.sh C...ID     # o un ID de contrato explícito
set -euo pipefail

ID_CONTRATO="${1:-acopio}"
DESTINO="../frontend/src/lib/contrato/cliente-generado.ts"
TEMPORAL="$(mktemp -d)"
trap 'rm -rf "$TEMPORAL"' EXIT

echo "Generando cliente para el contrato: $ID_CONTRATO"
stellar contract bindings typescript \
  --network testnet \
  --contract-id "$ID_CONTRATO" \
  --output-dir "$TEMPORAL" \
  --overwrite

{
  echo '/* eslint-disable */'
  echo '// ARCHIVO GENERADO: no editar a mano.'
  echo '// Cliente TypeScript del contrato, generado con `stellar contract bindings typescript`.'
  echo '// Para regenerarlo después de cambiar o redesplegar el contrato: contrato/generar-cliente.sh'
  echo '// Se desactiva eslint porque el generador usa @ts-ignore y estilos propios.'
  echo ''
  cat "$TEMPORAL/src/index.ts"
} > "$DESTINO"

echo "Cliente actualizado en $DESTINO"
