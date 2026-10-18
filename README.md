# Acopio Transparente

## Requisitos

- Node.js 20 o superior y npm.
- Extensión [Freighter](https://www.freighter.app/) en el navegador, configurada en **Testnet** y con la cuenta fondeada (botón "Fund with Friendbot"). Solo hace falta para registrar; el tablero público funciona sin ella.

Solo para compilar o desplegar el contrato:

- [Rust](https://rustup.rs/) 1.84 o superior, con el target `wasm32v1-none` (`rustup target add wasm32v1-none`). En Windows sirve la toolchain `stable-x86_64-pc-windows-gnu`.
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) 28 o superior (en Windows: `winget install Stellar.StellarCLI`).

## Instalación

```bash
cd frontend
npm install
```

## Cómo correrlo

```bash
cd frontend
npm run dev
```

Abre http://localhost:3000. El front ya apunta al contrato desplegado en testnet. Para usar otro despliegue, crea `frontend/.env.local` con:

```
NEXT_PUBLIC_CONTRACT_ID=C...
```

## Contrato (opcional)

```bash
cd contrato
cargo test                      # pruebas unitarias
stellar contract build          # compila a WASM

# Desplegar en testnet (la cuenta admin es la que podrá registrar)
stellar keys generate despliegue --network testnet --fund
stellar contract deploy --wasm target/wasm32v1-none/release/acopio.wasm \
  --source-account despliegue --network testnet --alias acopio \
  -- --admin <DIRECCION_G_DEL_ADMIN>

./generar-cliente.sh            # regenera el cliente TypeScript del front (Git Bash)
```
