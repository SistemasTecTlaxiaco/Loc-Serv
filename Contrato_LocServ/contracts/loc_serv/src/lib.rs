#![no_std]
#![cfg_attr(test, macro_use)]

use soroban_sdk::{contract, contractimpl, Env, Map, Vec, String, Error, Bytes};
use soroban_sdk::xdr::{ScErrorType, ScErrorCode, ToXdr};

const USUARIOS_KEY: &str = "usuarios";
const CALIFICACIONES_KEY: &str = "calificaciones";
const TRANSACCIONES_KEY: &str = "transacciones";
const SERVICIOS_KEY: &str = "servicios";
const CONTRATOS_KEY: &str = "contratos";

#[contract]
pub struct UsuarioContract;

#[contractimpl]
impl UsuarioContract {
    pub fn crear_usuario(
        env: Env,
        id_usuario: String,
        nombre: String,
        ag_patemo: String,
        ag_matemo: String,
        correo: String,
        direccion: i32,
    ) -> Result<(), Error> {
        let mut usuarios: Map<String, (String, String, String, String, i32)> = env
            .storage()
            .persistent()
            .get(&USUARIOS_KEY)
            .unwrap_or(Map::new(&env));

        if usuarios.contains_key(id_usuario.clone()) {
            return Err(Error::from_type_and_code(ScErrorType::Contract, ScErrorCode::InvalidInput));
        }

        usuarios.set(id_usuario.clone(), (nombre, ag_patemo, ag_matemo, correo, direccion));
        env.storage().persistent().set(&USUARIOS_KEY, &usuarios);
        Ok(())
    }

    pub fn actualizar_cuenta(
        env: Env,
        id_usuario: String,
        nuevo_correo: String,
        nueva_direccion: i32,
    ) -> Result<(), Error> {
        let mut usuarios: Map<String, (String, String, String, String, i32)> = env
            .storage()
            .persistent()
            .get(&USUARIOS_KEY)
            .unwrap_or(Map::new(&env));

        if let Some((nombre, ag_patemo, ag_matemo, _, _)) = usuarios.get(id_usuario.clone()) {
            usuarios.set(id_usuario, (nombre, ag_patemo, ag_matemo, nuevo_correo, nueva_direccion));
            env.storage().persistent().set(&USUARIOS_KEY, &usuarios);
            Ok(())
        } else {
            Err(Error::from_type_and_code(ScErrorType::Contract, ScErrorCode::InvalidInput))
        }
    }

    pub fn agregar_servicio(
        env: Env,
        id_usuario: String,
        id_servicio: String,
    ) -> Result<(), Error> {
        // Construir la clave concatenando "SERVICIOS_" con id_usuario usando Bytes
        let mut key_bytes = Bytes::from_slice(&env, b"SERVICIOS_");
        key_bytes.append(&id_usuario.to_xdr(&env));

        // Usar key_bytes directamente como clave
        let mut servicios: Vec<String> = env
            .storage()
            .persistent()
            .get(&key_bytes)
            .unwrap_or(Vec::new(&env));

        servicios.push_back(id_servicio);
        env.storage().persistent().set(&key_bytes, &servicios);
        Ok(())
    }
}

#[contract]
pub struct ServicioContract;

#[contractimpl]
impl ServicioContract {
    pub fn crear_servicio(
        env: Env,
        id_servicio: String,
        nombre: String,
        categoria: String,
        descripcion: String,
        disponibilidad: i128,
        precio: i128,
    ) -> Result<(), Error> {
        let mut servicios: Map<String, (String, String, String, i128, i128)> = env
            .storage()
            .persistent()
            .get(&SERVICIOS_KEY)
            .unwrap_or(Map::new(&env));

        if servicios.contains_key(id_servicio.clone()) {
            return Err(Error::from_type_and_code(ScErrorType::Contract, ScErrorCode::InvalidInput));
        }

        servicios.set(id_servicio, (nombre, categoria, descripcion, disponibilidad, precio));
        env.storage().persistent().set(&SERVICIOS_KEY, &servicios);
        Ok(())
    }

    pub fn modificar_servicio(
        env: Env,
        id_servicio: String,
        nuevos_datos: (String, String, String, i128, i128),
    ) -> Result<(), Error> {
        let mut servicios: Map<String, (String, String, String, i128, i128)> = env
            .storage()
            .persistent()
            .get(&SERVICIOS_KEY)
            .unwrap_or(Map::new(&env));

        if !servicios.contains_key(id_servicio.clone()) {
            return Err(Error::from_type_and_code(ScErrorType::Contract, ScErrorCode::InvalidInput));
        }

        servicios.set(id_servicio, nuevos_datos);
        env.storage().persistent().set(&SERVICIOS_KEY, &servicios);
        Ok(())
    }
}

#[contract]
pub struct ContratoContract;

#[contractimpl]
impl ContratoContract {
    pub fn crear_contrato(
        env: Env,
        id_contrato: String,
        id_servicio: String,
        id_usuario: String,
        fecha_inicio: String,
        fecha_fin: String,
        monto_total: i128,
    ) -> Result<(), Error> {
        let mut contratos: Map<String, (String, String, String, String, i128)> = env
            .storage()
            .persistent()
            .get(&CONTRATOS_KEY)
            .unwrap_or(Map::new(&env));

        if contratos.contains_key(id_contrato.clone()) {
            return Err(Error::from_type_and_code(ScErrorType::Contract, ScErrorCode::InvalidInput));
        }

        contratos.set(id_contrato, (id_servicio, id_usuario, fecha_inicio, fecha_fin, monto_total));
        env.storage().persistent().set(&CONTRATOS_KEY, &contratos);
        Ok(())
    }

    pub fn consultar_estado_contrato(
        env: Env,
        id_contrato: String,
    ) -> Option<(String, String, String, String, i128)> {
        let contratos: Map<String, (String, String, String, String, i128)> = env
            .storage()
            .persistent()
            .get(&CONTRATOS_KEY)
            .unwrap_or(Map::new(&env));

        contratos.get(id_contrato)
    }
}

#[contract]
pub struct CalificacionContract;

#[contractimpl]
impl CalificacionContract {
    pub fn agregar_calificacion(
        env: Env,
        id_calificacion: String,
        id_servicio: String,
        id_usuario: String,
        valor: i32,
        comentario: String,
        fecha: u64,
    ) -> Result<(), Error> {
        let mut calificaciones: Map<String, (String, String, i32, String, u64)> = env
            .storage()
            .persistent()
            .get(&CALIFICACIONES_KEY)
            .unwrap_or(Map::new(&env));

        calificaciones.set(id_calificacion, (id_servicio, id_usuario, valor, comentario, fecha));
        env.storage().persistent().set(&CALIFICACIONES_KEY, &calificaciones);
        Ok(())
    }

    pub fn consultar_calificacion(
        env: Env,
        id_calificacion: String,
    ) -> Option<(String, String, i32, String, u64)> {
        let calificaciones: Map<String, (String, String, i32, String, u64)> = env
            .storage()
            .persistent()
            .get(&CALIFICACIONES_KEY)
            .unwrap_or(Map::new(&env));

        calificaciones.get(id_calificacion)
    }
}

#[contract]
pub struct TransaccionContract;

#[contractimpl]
impl TransaccionContract {
    pub fn generar_transaccion(
        env: Env,
        id_transaccion: String,
        id_contrato: String,
        monto: i128,
        metodo_pago: String,
        fecha_pago: u64,
    ) -> Result<(), Error> {
        let mut transacciones: Map<String, (String, i128, String, u64, String)> = env
            .storage()
            .persistent()
            .get(&TRANSACCIONES_KEY)
            .unwrap_or(Map::new(&env));

        let estado = String::from_str(&env, "Pendiente");
        transacciones.set(id_transaccion, (id_contrato, monto, metodo_pago, fecha_pago, estado));
        env.storage().persistent().set(&TRANSACCIONES_KEY, &transacciones);
        Ok(())
    }

    pub fn confirmar_pago(env: Env, id_transaccion: String) -> Result<(), Error> {
        let mut transacciones: Map<String, (String, i128, String, u64, String)> = env
            .storage()
            .persistent()
            .get(&TRANSACCIONES_KEY)
            .unwrap_or(Map::new(&env));

        if let Some((id_contrato, monto, metodo_pago, fecha_pago, _)) =
            transacciones.get(id_transaccion.clone())
        {
            let estado = String::from_str(&env, "Completado");
            transacciones.set(id_transaccion, (id_contrato, monto, metodo_pago, fecha_pago, estado));
            env.storage().persistent().set(&TRANSACCIONES_KEY, &transacciones);
            Ok(())
        } else {
            Err(Error::from_type_and_code(ScErrorType::Contract, ScErrorCode::InvalidInput))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{Address, Bytes, Env};
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_crear_usuario() {
        let env = Env::default();
        env.mock_all_auths();

        // Generar una dirección para el contrato
        let contract_address = Address::generate(&env);

        // Registrar el contrato con el archivo WASM
        let wasm_bytes = Bytes::from_slice(&env, include_bytes!("../../../target/wasm32-unknown-unknown/release/loc_serv.wasm"));
        env.register_contract_wasm(&contract_address, wasm_bytes);

        let id_usuario = String::from_str(&env, "user1");
        let nombre = String::from_str(&env, "Juan");
        let ag_patemo = String::from_str(&env, "Perez");
        let ag_matemo = String::from_str(&env, "Gomez");
        let correo = String::from_str(&env, "juan@example.com");
        let direccion = 123;

        // Crear un usuario
        let result = env.as_contract(&contract_address, || {
            UsuarioContract::crear_usuario(
                env.clone(),
                id_usuario.clone(),
                nombre,
                ag_patemo,
                ag_matemo,
                correo,
                direccion,
            )
        });
        assert!(result.is_ok(), "Failed to create user: {:?}", result);

        // Intentar crear el mismo usuario nuevamente (debe fallar)
        let result = env.as_contract(&contract_address, || {
            UsuarioContract::crear_usuario(
                env.clone(),
                id_usuario.clone(),
                String::from_str(&env, "Otro"),
                String::from_str(&env, "Otro"),
                String::from_str(&env, "Otro"),
                String::from_str(&env, "otro@example.com"),
                456,
            )
        });
        assert!(result.is_err(), "Expected error when creating duplicate user");

        // Verificar que el usuario se creó correctamente
        let usuario = env.as_contract(&contract_address, || {
            let usuarios: Map<String, (String, String, String, String, i32)> = env
                .storage()
                .persistent()
                .get(&USUARIOS_KEY)
                .unwrap_or(Map::new(&env));
            usuarios.get(id_usuario)
        });
        assert!(usuario.is_some(), "Usuario no encontrado en el almacenamiento");
        let usuario = usuario.unwrap();
        assert_eq!(usuario.0, String::from_str(&env, "Juan"));
        assert_eq!(usuario.4, 123);
    }

    #[test]
    fn test_agregar_servicio() {
        let env = Env::default();
        env.mock_all_auths();

        // Generar una dirección para el contrato
        let contract_address = Address::generate(&env);

        // Registrar el contrato con el archivo WASM
        let wasm_bytes = Bytes::from_slice(&env, include_bytes!("../../../target/wasm32-unknown-unknown/release/loc_serv.wasm"));
        env.register_contract_wasm(&contract_address, wasm_bytes);

        let id_usuario = String::from_str(&env, "user1");
        let id_servicio = String::from_str(&env, "service1");

        // Agregar un servicio
        let result = env.as_contract(&contract_address, || {
            UsuarioContract::agregar_servicio(
                env.clone(),
                id_usuario.clone(),
                id_servicio.clone(),
            )
        });
        assert!(result.is_ok(), "Failed to add service: {:?}", result);

        // Verificar que el servicio se agregó correctamente
        let servicios: Vec<String> = env.as_contract(&contract_address, || {
            let mut key_bytes = Bytes::from_slice(&env, b"SERVICIOS_");
            key_bytes.append(&id_usuario.to_xdr(&env));
            env.storage()
                .persistent()
                .get(&key_bytes)
                .unwrap_or(Vec::new(&env))
        });
        assert_eq!(servicios.len(), 1, "El servicio no se agregó al almacenamiento");
        assert_eq!(servicios.get(0).unwrap(), id_servicio);
    }

    #[test]
    fn test_crear_contrato() {
        let env = Env::default();
        env.mock_all_auths();

        // Generar una dirección para el contrato
        let contract_address = Address::generate(&env);

        // Registrar el contrato con el archivo WASM
        let wasm_bytes = Bytes::from_slice(&env, include_bytes!("../../../target/wasm32-unknown-unknown/release/loc_serv.wasm"));
        env.register_contract_wasm(&contract_address, wasm_bytes);

        let id_contrato = String::from_str(&env, "contract1");
        let id_servicio = String::from_str(&env, "service1");
        let id_usuario = String::from_str(&env, "user1");
        let fecha_inicio = String::from_str(&env, "2023-01-01");
        let fecha_fin = String::from_str(&env, "2023-12-31");
        let monto_total = 1000;

        // Crear un contrato
        let result = env.as_contract(&contract_address, || {
            ContratoContract::crear_contrato(
                env.clone(),
                id_contrato.clone(),
                id_servicio,
                id_usuario,
                fecha_inicio,
                fecha_fin,
                monto_total,
            )
        });
        assert!(result.is_ok(), "Failed to create contract: {:?}", result);

        // Intentar crear el mismo contrato nuevamente (debe fallar)
        let result = env.as_contract(&contract_address, || {
            ContratoContract::crear_contrato(
                env.clone(),
                id_contrato.clone(),
                String::from_str(&env, "service2"),
                String::from_str(&env, "user2"),
                String::from_str(&env, "2024-01-01"),
                String::from_str(&env, "2024-12-31"),
                2000,
            )
        });
        assert!(result.is_err(), "Expected error when creating duplicate contract");

        // Verificar que el contrato se creó correctamente
        let contrato = env.as_contract(&contract_address, || {
            let contratos: Map<String, (String, String, String, String, i128)> = env
                .storage()
                .persistent()
                .get(&CONTRATOS_KEY)
                .unwrap_or(Map::new(&env));
            contratos.get(id_contrato)
        });
        assert!(contrato.is_some(), "Contrato no encontrado en el almacenamiento");
        let contrato = contrato.unwrap();
        assert_eq!(contrato.4, 1000);
    }
}