LocServ dApp

Instrucciones rápidas:

1. Instalar dependencias

```bash
cd dapp
npm install
```

2. Ejecutar en desarrollo

```bash
npm run dev
```

3. Conectar con Soroban

- Despliega el contrato con `soroban` CLI o usa tu nodo/sandbox local.
- En `src/contract.ts` reemplaza los stubs con llamadas reales usando `soroban-client`.
	- Nota: `soroban-client` no está incluido por defecto en `package.json` para evitar problemas de instalación.
		Instálalo por separado si lo necesitas:

```bash
npm install soroban-client
```

4. Notas

- El frontend creado es una base. Debes completar `src/contract.ts` para que haga llamadas al contrato desplegado.
- Para tests en Rust, asegúrate de compilar el wasm:

```bash
cd contracts/loc_serv
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
cargo test
```
