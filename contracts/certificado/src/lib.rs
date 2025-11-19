#![no_std]

use soroban_sdk::{contract, contractimpl, Env, String, Map, Vec, symbol_short};

// Claves de almacenamiento
const LOCALES_KEY: soroban_sdk::Symbol = symbol_short!("LOCALES");
const SERVICIOS_KEY: soroban_sdk::Symbol = symbol_short!("SERVICIOS");
const ASIG_KEY: soroban_sdk::Symbol = symbol_short!("ASIG"); // Reducido a 4 caracteres

#[contract]
pub struct LocServContract;

#[contractimpl]
impl LocServContract {
    // Registrar un local
    pub fn registrar_local(env: Env, id_local: i32, nombre: String, direccion: String) {
        let mut locales: Map<i32, (String, String)> = env
            .storage()
            .persistent()
            .get(&LOCALES_KEY)
            .unwrap_or(Map::new(&env));

        if locales.contains_key(id_local) {
            panic!("El local ya existe");
        }

        locales.set(id_local, (nombre, direccion));
        env.storage().persistent().set(&LOCALES_KEY, &locales);
    }

    // Registrar un servicio
    pub fn registrar_servicio(env: Env, id_servicio: i32, nombre: String, descripcion: String) {
        let mut servicios: Map<i32, (String, String)> = env
            .storage()
            .persistent()
            .get(&SERVICIOS_KEY)
            .unwrap_or(Map::new(&env));

        if servicios.contains_key(id_servicio) {
            panic!("El servicio ya existe");
        }

        servicios.set(id_servicio, (nombre, descripcion));
        env.storage().persistent().set(&SERVICIOS_KEY, &servicios);
    }

    // Asignar un servicio a un local
    pub fn asignar_servicio(env: Env, id_local: i32, id_servicio: i32) {
        let locales: Map<i32, (String, String)> = env
            .storage()
            .persistent()
            .get(&LOCALES_KEY)
            .unwrap_or(Map::new(&env));

        let servicios: Map<i32, (String, String)> = env
            .storage()
            .persistent()
            .get(&SERVICIOS_KEY)
            .unwrap_or(Map::new(&env));

        if !locales.contains_key(id_local) {
            panic!("El local no existe");
        }

        if !servicios.contains_key(id_servicio) {
            panic!("El servicio no existe");
        }

        let mut asignaciones: Map<i32, Vec<i32>> = env
            .storage()
            .persistent()
            .get(&ASIG_KEY)
            .unwrap_or(Map::new(&env));

        let mut servicios_asignados = asignaciones.get(id_local).unwrap_or(Vec::new(&env));
        servicios_asignados.push_back(id_servicio);

        asignaciones.set(id_local, servicios_asignados);
        env.storage().persistent().set(&ASIG_KEY, &asignaciones);
    }

    // Obtener servicios asignados a un local
    pub fn obtener_servicios(env: Env, id_local: i32) -> Vec<i32> {
        let asignaciones: Map<i32, Vec<i32>> = env
            .storage()
            .persistent()
            .get(&ASIG_KEY)
            .unwrap_or(Map::new(&env));

        asignaciones.get(id_local).unwrap_or(Vec::new(&env))
    }
}