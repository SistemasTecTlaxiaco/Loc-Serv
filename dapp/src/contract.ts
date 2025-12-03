// Helper stub to interact with Soroban
// Replace placeholders with actual soroban-client calls and wiring to the RPC endpoint.

export async function createUser(id: string, nombre: string) {
  // TODO: use soroban-client to invoke `UsuarioContract::crear_usuario` on the deployed contract
  console.log('createUser stub', id, nombre)
  return Promise.resolve()
}

export async function createService(id: string, nombre: string) {
  console.log('createService stub', id, nombre)
  return Promise.resolve()
}

export async function createContract(id: string) {
  console.log('createContract stub', id)
  return Promise.resolve()
}

export async function getContract(id: string) {
  console.log('getContract stub', id)
  return Promise.resolve(null)
}
