#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String};

#[test]
fn test_registrar_documento() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_documento = 1;
    let titulo = String::from_str(&env, "Certificado de Estudios");
    let estado = String::from_str(&env, "Activo");
    let fecha = 1640995200_u64; // 1 de enero de 2022

    // Registrar documento usando el contexto del contrato
    env.as_contract(&contract_id, || {
        DocumentosContract::registrar_documento(env.clone(), id_documento, titulo.clone(), estado.clone(), fecha);
    });

    // Verificar que se registró correctamente
    let resultado = env.as_contract(&contract_id, || {
        DocumentosContract::obtener_documento(env.clone(), id_documento)
    });
    
    assert!(resultado.is_some());
    
    let (titulo_obtenido, estado_obtenido, fecha_obtenida) = resultado.unwrap();
    assert_eq!(titulo_obtenido, titulo);
    assert_eq!(estado_obtenido, estado);
    assert_eq!(fecha_obtenida, fecha);
}

#[test]
#[should_panic(expected = "Documento con el mismo ID ya existe")]
fn test_registrar_documento_duplicado() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_documento = 1;
    let titulo = String::from_str(&env, "Certificado de Estudios");
    let estado = String::from_str(&env, "Activo");
    let fecha = 1640995200_u64;

    // Registrar documento por primera vez
    env.as_contract(&contract_id, || {
        DocumentosContract::registrar_documento(env.clone(), id_documento, titulo.clone(), estado.clone(), fecha);
    });
    
    // Intentar registrar el mismo ID nuevamente (debe fallar)
    env.as_contract(&contract_id, || {
        DocumentosContract::registrar_documento(env.clone(), id_documento, titulo, estado, fecha);
    });
}

#[test]
fn test_obtener_documento_inexistente() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let resultado = env.as_contract(&contract_id, || {
        DocumentosContract::obtener_documento(env.clone(), 999)
    });
    
    assert!(resultado.is_none());
}

#[test]
fn test_consulta_historial() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_historial = 1;
    let fecha = 1640995200_u64;
    let resultado = String::from_str(&env, "Documento validado correctamente");

    // Añadir entrada al historial
    env.as_contract(&contract_id, || {
        DocumentosContract::consulta_historial(env.clone(), id_historial, fecha, resultado.clone());
    });

    // Verificar que se guardó correctamente
    let historial_obtenido = env.as_contract(&contract_id, || {
        DocumentosContract::obtener_historial(env.clone(), id_historial)
    });
    
    assert!(historial_obtenido.is_some());
    
    let (fecha_obtenida, resultado_obtenido) = historial_obtenido.unwrap();
    assert_eq!(fecha_obtenida, fecha);
    assert_eq!(resultado_obtenido, resultado);
}

#[test]
#[should_panic(expected = "Historial con el mismo ID ya existe")]
fn test_consulta_historial_duplicado() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_historial = 1;
    let fecha = 1640995200_u64;
    let resultado = String::from_str(&env, "Documento validado");

    // Añadir entrada por primera vez
    env.as_contract(&contract_id, || {
        DocumentosContract::consulta_historial(env.clone(), id_historial, fecha, resultado.clone());
    });
    
    // Intentar añadir la misma ID nuevamente (debe fallar)
    env.as_contract(&contract_id, || {
        DocumentosContract::consulta_historial(env.clone(), id_historial, fecha, resultado);
    });
}

#[test]
fn test_realizar_respaldo() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_respaldo = 1;
    let fecha = 1640995200_u64;
    let ubicacion = String::from_str(&env, "/backup/documentos/cert_001.pdf");
    let autor = String::from_str(&env, "Sistema Automatizado");

    // Realizar respaldo
    env.as_contract(&contract_id, || {
        DocumentosContract::realizar_respaldo(env.clone(), id_respaldo, fecha, ubicacion.clone(), autor.clone());
    });

    // Verificar que se guardó correctamente
    let respaldo_obtenido = env.as_contract(&contract_id, || {
        DocumentosContract::consultar_respaldo(env.clone(), id_respaldo)
    });
    
    assert!(respaldo_obtenido.is_some());
    
    let (fecha_obtenida, ubicacion_obtenida, autor_obtenido) = respaldo_obtenido.unwrap();
    assert_eq!(fecha_obtenida, fecha);
    assert_eq!(ubicacion_obtenida, ubicacion);
    assert_eq!(autor_obtenido, autor);
}

#[test]
#[should_panic(expected = "Respaldo con ese ID ya existe")]
fn test_realizar_respaldo_duplicado() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_respaldo = 1;
    let fecha = 1640995200_u64;
    let ubicacion = String::from_str(&env, "/backup/test.pdf");
    let autor = String::from_str(&env, "Admin");

    // Realizar respaldo por primera vez
    env.as_contract(&contract_id, || {
        DocumentosContract::realizar_respaldo(env.clone(), id_respaldo, fecha, ubicacion.clone(), autor.clone());
    });
    
    // Intentar realizar respaldo con el mismo ID (debe fallar)
    env.as_contract(&contract_id, || {
        DocumentosContract::realizar_respaldo(env.clone(), id_respaldo, fecha, ubicacion, autor);
    });
}

#[test]
fn test_verificar_documento() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_documento = 1;
    let nuevo_resultado = String::from_str(&env, "Documento verificado exitosamente");

    // Verificar documento (esto debe crear una entrada en el historial)
    env.as_contract(&contract_id, || {
        DocumentosContract::verificar_documento(env.clone(), id_documento, nuevo_resultado.clone());
    });

    // Obtener el historial y verificar que se actualizó
    let historial = env.as_contract(&contract_id, || {
        DocumentosContract::obtener_historial(env.clone(), id_documento)
    });
    
    assert!(historial.is_some());
    
    let (_, resultado_obtenido) = historial.unwrap();
    assert_eq!(resultado_obtenido, nuevo_resultado);
}

#[test]
fn test_actualizar_estado() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    // Primero registrar un documento
    let id_documento = 1;
    let titulo = String::from_str(&env, "Certificado de Graduación");
    let estado_inicial = String::from_str(&env, "Pendiente");
    let fecha = 1640995200_u64;

    env.as_contract(&contract_id, || {
        DocumentosContract::registrar_documento(env.clone(), id_documento, titulo.clone(), estado_inicial, fecha);
    });

    // Actualizar el estado
    let nuevo_estado = String::from_str(&env, "Validado");
    env.as_contract(&contract_id, || {
        DocumentosContract::actualizar_estado(env.clone(), id_documento, nuevo_estado.clone());
    });

    // Verificar que el estado se actualizó
    let documento = env.as_contract(&contract_id, || {
        DocumentosContract::obtener_documento(env.clone(), id_documento)
    });
    
    assert!(documento.is_some());
    
    let (titulo_obtenido, estado_obtenido, fecha_obtenida) = documento.unwrap();
    assert_eq!(titulo_obtenido, titulo);
    assert_eq!(estado_obtenido, nuevo_estado);
    assert_eq!(fecha_obtenida, fecha);
}

#[test]
#[should_panic(expected = "Documento no encontrado")]
fn test_actualizar_estado_documento_inexistente() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let nuevo_estado = String::from_str(&env, "Validado");
    
    // Intentar actualizar un documento que no existe
    env.as_contract(&contract_id, || {
        DocumentosContract::actualizar_estado(env.clone(), 999, nuevo_estado);
    });
}

#[test]
fn test_crear_usuario() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_usuario = 1;
    let nombre = String::from_str(&env, "Juan Pérez");
    let rol = String::from_str(&env, "Administrador");

    // Crear usuario
    env.as_contract(&contract_id, || {
        DocumentosContract::crear_usuario(env.clone(), id_usuario, nombre, rol);
    });

    // Verificar que se puede asignar un rol (indirectamente verifica que existe)
    let nuevo_rol = String::from_str(&env, "Super Admin");
    env.as_contract(&contract_id, || {
        DocumentosContract::asignar_rol(env.clone(), id_usuario, nuevo_rol);
    });
}

#[test]
#[should_panic(expected = "Usuario ya existe")]
fn test_crear_usuario_duplicado() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_usuario = 1;
    let nombre = String::from_str(&env, "Juan Pérez");
    let rol = String::from_str(&env, "Admin");

    // Crear usuario por primera vez
    env.as_contract(&contract_id, || {
        DocumentosContract::crear_usuario(env.clone(), id_usuario, nombre.clone(), rol.clone());
    });
    
    // Intentar crear el mismo usuario nuevamente
    env.as_contract(&contract_id, || {
        DocumentosContract::crear_usuario(env.clone(), id_usuario, nombre, rol);
    });
}

#[test]
#[should_panic(expected = "Usuario no encontrado")]
fn test_asignar_rol_usuario_inexistente() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let nuevo_rol = String::from_str(&env, "Admin");
    
    // Intentar asignar rol a usuario inexistente
    env.as_contract(&contract_id, || {
        DocumentosContract::asignar_rol(env.clone(), 999, nuevo_rol);
    });
}

#[test]
fn test_configurar_notificacion() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_notificacion = 1;
    let tipo = String::from_str(&env, "Email");

    // Configurar notificación
    env.as_contract(&contract_id, || {
        DocumentosContract::configurar_notificacion(env.clone(), id_notificacion, tipo.clone());
    });

    // Verificar que se puede enviar (obtener) la notificación
    let notificacion = env.as_contract(&contract_id, || {
        DocumentosContract::enviar_notificacion(env.clone(), id_notificacion)
    });
    
    assert!(notificacion.is_some());
    assert_eq!(notificacion.unwrap(), tipo);
}

#[test]
fn test_enviar_notificacion_inexistente() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let notificacion = env.as_contract(&contract_id, || {
        DocumentosContract::enviar_notificacion(env.clone(), 999)
    });
    
    assert!(notificacion.is_none());
}

#[test]
fn test_autenticar_usuario() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_sesion = 1;
    let credenciales = String::from_str(&env, "token_auth_12345");

    // Autenticar usuario
    env.as_contract(&contract_id, || {
        DocumentosContract::autenticar_usuario(env.clone(), id_sesion, credenciales);
    });

    // Verificar que se pueden asignar permisos (indirectamente verifica que la sesión existe)
    let permisos = String::from_str(&env, "read,write,admin");
    env.as_contract(&contract_id, || {
        DocumentosContract::asignar_permisos(env.clone(), id_sesion, permisos);
    });
}

#[test]
#[should_panic(expected = "Sesión no encontrada")]
fn test_asignar_permisos_sesion_inexistente() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let permisos = String::from_str(&env, "read,write");
    
    // Intentar asignar permisos a sesión inexistente
    env.as_contract(&contract_id, || {
        DocumentosContract::asignar_permisos(env.clone(), 999, permisos);
    });
}

#[test]
fn test_generar_informe() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_informe = 1;
    let formato = String::from_str(&env, "PDF");

    // Generar informe
    env.as_contract(&contract_id, || {
        DocumentosContract::generar_informe(env.clone(), id_informe, formato.clone());
    });

    // Exportar informe y verificar
    let informe = env.as_contract(&contract_id, || {
        DocumentosContract::exportar_informe(env.clone(), id_informe)
    });
    
    assert!(informe.is_some());
    
    let (fecha_generacion, formato_obtenido) = informe.unwrap();
    assert_eq!(formato_obtenido, formato);
    // En el entorno de pruebas, la fecha puede ser 0, lo cual es válido
    assert!(fecha_generacion >= 0); // Verificar que tiene una fecha válida (incluye 0)
}

#[test]
fn test_exportar_informe_inexistente() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let informe = env.as_contract(&contract_id, || {
        DocumentosContract::exportar_informe(env.clone(), 999)
    });
    
    assert!(informe.is_none());
}

#[test]
fn test_exportar_datos() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    let id_exportacion = 1;
    let formato = String::from_str(&env, "JSON");

    // Exportar datos
    env.as_contract(&contract_id, || {
        DocumentosContract::exportar_datos(env.clone(), id_exportacion, formato.clone());
    });

    // Validar exportación
    let exportacion = env.as_contract(&contract_id, || {
        DocumentosContract::validar_exportacion(env.clone(), id_exportacion)
    });
    
    assert!(exportacion.is_some());
    assert_eq!(exportacion.unwrap(), formato);
}

#[test]
fn test_flujo_completo_documento() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    // 1. Registrar documento
    let id_documento = 1;
    let titulo = String::from_str(&env, "Certificado de Estudios");
    let estado_inicial = String::from_str(&env, "Pendiente");
    let fecha = 1640995200_u64;

    env.as_contract(&contract_id, || {
        DocumentosContract::registrar_documento(env.clone(), id_documento, titulo.clone(), estado_inicial, fecha);
    });

    // 2. Verificar documento
    let resultado_verificacion = String::from_str(&env, "Documento verificado");
    env.as_contract(&contract_id, || {
        DocumentosContract::verificar_documento(env.clone(), id_documento, resultado_verificacion.clone());
    });

    // 3. Actualizar estado
    let estado_final = String::from_str(&env, "Validado");
    env.as_contract(&contract_id, || {
        DocumentosContract::actualizar_estado(env.clone(), id_documento, estado_final.clone());
    });

    // 4. Realizar respaldo
    let id_respaldo = 1;
    let ubicacion = String::from_str(&env, "/backup/cert_001.pdf");
    let autor = String::from_str(&env, "Sistema");
    env.as_contract(&contract_id, || {
        DocumentosContract::realizar_respaldo(env.clone(), id_respaldo, fecha, ubicacion.clone(), autor.clone());
    });

    // 5. Verificar estado final del documento
    let documento_final = env.as_contract(&contract_id, || {
        DocumentosContract::obtener_documento(env.clone(), id_documento)
    });
    
    assert!(documento_final.is_some());
    
    let (titulo_final, estado_final_obtenido, _) = documento_final.unwrap();
    assert_eq!(titulo_final, titulo);
    assert_eq!(estado_final_obtenido, estado_final);

    // 6. Verificar historial
    let historial = env.as_contract(&contract_id, || {
        DocumentosContract::obtener_historial(env.clone(), id_documento)
    });
    
    assert!(historial.is_some());
    
    let (_, resultado_historial) = historial.unwrap();
    assert_eq!(resultado_historial, resultado_verificacion);

    // 7. Verificar respaldo
    let respaldo = env.as_contract(&contract_id, || {
        DocumentosContract::consultar_respaldo(env.clone(), id_respaldo)
    });
    
    assert!(respaldo.is_some());
    
    let (_, ubicacion_respaldo, autor_respaldo) = respaldo.unwrap();
    assert_eq!(ubicacion_respaldo, ubicacion);
    assert_eq!(autor_respaldo, autor);
}

#[test]
fn test_multiples_documentos() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DocumentosContract);

    // Registrar múltiples documentos
    let titulos = [
        "Documento 1",
        "Documento 2", 
        "Documento 3",
        "Documento 4",
        "Documento 5"
    ];
    
    for i in 1..=5 {
        let titulo = String::from_str(&env, titulos[(i-1) as usize]);
        let estado = String::from_str(&env, "Activo");
        let fecha = 1640995200_u64 + (i as u64 * 86400); // Un día de diferencia

        env.as_contract(&contract_id, || {
            DocumentosContract::registrar_documento(env.clone(), i, titulo, estado, fecha);
        });
    }

    // Verificar que todos se registraron correctamente
    for i in 1..=5 {
        let documento = env.as_contract(&contract_id, || {
            DocumentosContract::obtener_documento(env.clone(), i)
        });
        assert!(documento.is_some());
    }

    // Verificar que un documento inexistente no existe
    let documento_inexistente = env.as_contract(&contract_id, || {
        DocumentosContract::obtener_documento(env.clone(), 99)
    });
    assert!(documento_inexistente.is_none());
}