//! Pruebas del contrato. Corren en un entorno local de Soroban, no en la red.
#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{Env, String};

/// 17 de octubre de 2026 a las 12:00 UTC, en segundos Unix.
const AHORA: u64 = 1_792_238_400;
/// La misma fecha en formato AAAAMMDD.
const HOY: u32 = 20261017;

/// Despliega el contrato con un admin nuevo y el reloj fijado en `AHORA`.
fn preparar() -> (Env, AcopioTransparenteClient<'static>, Address) {
    let env = Env::default();
    env.ledger().set_timestamp(AHORA);
    let admin = Address::generate(&env);
    let id = env.register(AcopioTransparente, (admin.clone(),));
    let cliente = AcopioTransparenteClient::new(&env, &id);
    (env, cliente, admin)
}

/// Extrae la salida de un lote entregado; falla la prueba si sigue pendiente.
fn salida_de(lote: &Lote) -> Salida {
    match &lote.entrega {
        Entrega::Entregada(salida) => salida.clone(),
        Entrega::Pendiente => panic!("el lote debía estar entregado"),
    }
}

fn texto(env: &Env, valor: &str) -> String {
    String::from_str(env, valor)
}

#[test]
fn fecha_a_dias_coincide_con_el_calendario() {
    assert_eq!(fecha_a_dias(20000101), Some(10_957));
    assert_eq!(fecha_a_dias(HOY), Some((AHORA / SEGUNDOS_POR_DIA) as i64));
    assert_eq!(fecha_a_dias(20240229), Some(19_782));
    assert_eq!(fecha_a_dias(20260229), None); // 2026 no es bisiesto
    assert_eq!(fecha_a_dias(20260431), None);
    assert_eq!(fecha_a_dias(20261300), None);
    assert_eq!(fecha_a_dias(19991231), None);
}

#[test]
fn registra_entrada_y_asigna_ids_consecutivos() {
    let (env, cliente, admin) = preparar();
    env.mock_all_auths();

    let id1 = cliente.registrar_entrada(&Categoria::Agua, &120, &HOY);
    let id2 = cliente.registrar_entrada(&Categoria::Ropa, &30, &20261010);

    assert_eq!((id1, id2), (1, 2));
    assert_eq!(cliente.total_lotes(), 2);
    assert_eq!(cliente.admin(), admin);

    let lote = cliente.obtener_lote(&1);
    assert_eq!(lote.categoria, Categoria::Agua);
    assert_eq!(lote.cantidad, 120);
    assert_eq!(lote.fecha_entrada, HOY);
    assert_eq!(lote.registrada_en, AHORA);
    assert_eq!(lote.entrega, Entrega::Pendiente);
}

#[test]
fn la_entrada_exige_la_firma_del_admin() {
    let (env, cliente, admin) = preparar();
    env.mock_all_auths();
    cliente.registrar_entrada(&Categoria::Agua, &1, &HOY);

    // La única firma que el contrato pidió fue la del admin.
    let firmas = env.auths();
    assert_eq!(firmas.len(), 1);
    assert_eq!(firmas[0].0, admin);
}

#[test]
#[should_panic]
fn sin_firma_del_admin_se_rechaza() {
    let (_env, cliente, _admin) = preparar();
    // Sin mock_all_auths: nadie firmó.
    cliente.registrar_entrada(&Categoria::Agua, &1, &HOY);
}

#[test]
fn rechaza_cantidad_invalida() {
    let (env, cliente, _) = preparar();
    env.mock_all_auths();
    assert_eq!(
        cliente.try_registrar_entrada(&Categoria::Agua, &0, &HOY),
        Err(Ok(Error::CantidadInvalida))
    );
    assert_eq!(
        cliente.try_registrar_entrada(&Categoria::Agua, &(CANTIDAD_MAXIMA + 1), &HOY),
        Err(Ok(Error::CantidadInvalida))
    );
    assert_eq!(cliente.total_lotes(), 0);
}

#[test]
fn rechaza_fechas_invalidas_o_futuras() {
    let (env, cliente, _) = preparar();
    env.mock_all_auths();
    assert_eq!(
        cliente.try_registrar_entrada(&Categoria::Agua, &5, &20260231),
        Err(Ok(Error::FechaInvalida))
    );
    assert_eq!(
        cliente.try_registrar_entrada(&Categoria::Agua, &5, &20261018),
        Err(Ok(Error::FechaFutura))
    );
}

#[test]
fn registra_salida_enlazada_a_su_entrada() {
    let (env, cliente, _) = preparar();
    env.mock_all_auths();
    let id = cliente.registrar_entrada(&Categoria::Alimentos, &50, &20261015);

    cliente.registrar_salida(&id, &texto(&env, "Albergue Villa Santana"), &HOY);

    let salida = salida_de(&cliente.obtener_lote(&id));
    assert_eq!(salida.destino, texto(&env, "Albergue Villa Santana"));
    assert_eq!(salida.fecha, HOY);
    assert_eq!(salida.registrada_en, AHORA);
}

#[test]
fn no_entrega_dos_veces_el_mismo_lote() {
    let (env, cliente, _) = preparar();
    env.mock_all_auths();
    let id = cliente.registrar_entrada(&Categoria::Agua, &10, &HOY);
    cliente.registrar_salida(&id, &texto(&env, "Barrio Cuba"), &HOY);

    assert_eq!(
        cliente.try_registrar_salida(&id, &texto(&env, "Otro barrio"), &HOY),
        Err(Ok(Error::LoteYaEntregado))
    );
    // El destino original sigue intacto.
    let salida = salida_de(&cliente.obtener_lote(&id));
    assert_eq!(salida.destino, texto(&env, "Barrio Cuba"));
}

#[test]
fn rechaza_salida_de_lote_inexistente() {
    let (env, cliente, _) = preparar();
    env.mock_all_auths();
    assert_eq!(
        cliente.try_registrar_salida(&7, &texto(&env, "Barrio Cuba"), &HOY),
        Err(Ok(Error::LoteNoExiste))
    );
}

#[test]
fn rechaza_salida_antes_de_la_entrada() {
    let (env, cliente, _) = preparar();
    env.mock_all_auths();
    let id = cliente.registrar_entrada(&Categoria::Agua, &10, &HOY);
    assert_eq!(
        cliente.try_registrar_salida(&id, &texto(&env, "Barrio Cuba"), &20261016),
        Err(Ok(Error::SalidaAntesDeEntrada))
    );
}

#[test]
fn rechaza_destinos_con_datos_personales_o_simbolos() {
    let (env, cliente, _) = preparar();
    env.mock_all_auths();
    let id = cliente.registrar_entrada(&Categoria::Agua, &10, &HOY);

    for malo in ["ab", "Cédula 1088123456", "Tel 3001234567", "<script>", "Barrio; DROP"] {
        assert_eq!(
            cliente.try_registrar_salida(&id, &texto(&env, malo), &HOY),
            Err(Ok(Error::DestinoInvalido)),
            "debió rechazar {malo:?}"
        );
    }
    // Tildes, ñ y números cortos (manzana, casa) sí se permiten.
    cliente.registrar_salida(&id, &texto(&env, "Vereda La Ñata, Mz 12 #3-45"), &HOY);
}

#[test]
fn lista_lotes_por_paginas() {
    let (env, cliente, _) = preparar();
    env.mock_all_auths();
    for cantidad in 1..=5u32 {
        cliente.registrar_entrada(&Categoria::Otros, &cantidad, &HOY);
    }

    let pagina = cliente.listar_lotes(&2, &2);
    assert_eq!(pagina.len(), 2);
    assert_eq!(pagina.get(0).map(|l| l.id), Some(2));
    assert_eq!(pagina.get(1).map(|l| l.id), Some(3));

    assert_eq!(cliente.listar_lotes(&0, &100).len(), 5);
    assert_eq!(cliente.listar_lotes(&6, &10).len(), 0);
}
