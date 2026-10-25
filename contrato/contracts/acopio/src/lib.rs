//! # Contrato Acopio Transparente
//!
//! Registra en Stellar (Soroban) la entrada y la salida de cada lote de
//! donaciones de un centro de acopio, de modo que nadie, ni siquiera el
//! administrador, pueda alterar el historial después.
//!
//! Reglas que el contrato hace cumplir en la red (no dependen del front):
//! - Solo la cuenta administradora del centro puede registrar.
//! - Cada lote recibe un identificador consecutivo que empieza en 1.
//! - Una salida solo se acepta para un lote que exista y no haya sido entregado.
//! - Las fechas deben existir en el calendario y no pueden ser futuras.
//! - No hay funciones para editar ni borrar: el registro es inalterable.
//!
//! Regla de datos: aquí solo va lo que varias partes necesitan verificar
//! (lote, categoría, cantidad, fechas y destino general). Nunca datos personales.
#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, String,
    Vec,
};

/// Cantidad máxima de unidades por lote. Ataja errores de digitación.
pub const CANTIDAD_MAXIMA: u32 = 1_000_000;

/// Longitud mínima del destino, en bytes UTF-8.
pub const DESTINO_MIN_BYTES: u32 = 3;

/// Longitud máxima del destino, en bytes UTF-8. El front limita a 60
/// caracteres; se deja margen porque una letra con tilde ocupa 2 bytes.
pub const DESTINO_MAX_BYTES: u32 = 120;

/// Cantidad de dígitos seguidos a partir de la cual el destino parece una
/// cédula o un teléfono y se rechaza.
const DIGITOS_DATO_PERSONAL: u32 = 6;

/// Máximo de lotes que devuelve una sola consulta de `listar_lotes`.
pub const LIMITE_PAGINA: u32 = 50;

/// Ledgers aproximados en un día (un ledger cada ~5 segundos).
const LEDGERS_POR_DIA: u32 = 17_280;

/// Si a un dato le queda menos de esta vida, se le extiende.
const UMBRAL_TTL: u32 = LEDGERS_POR_DIA;

/// Vida a la que se extiende un dato: una semana.
///
/// Antes se extendía al máximo de la red (~180 días), pero el alquiler del
/// almacenamiento en testnet subió tanto que esa extensión hacía que cada
/// registro costara miles de XLM y la transacción ni se podía armar. Una
/// semana es barata; para conservar el historial más tiempo se extiende
/// aparte con `stellar contract extend`, y si un dato llega a archivarse no
/// se pierde: se restaura con `stellar contract restore`.
const OBJETIVO_TTL: u32 = 7 * LEDGERS_POR_DIA;

/// Segundos en un día, para pasar el reloj de la red a días calendario.
const SEGUNDOS_POR_DIA: u64 = 86_400;

/// Categorías de donación que maneja un centro de acopio.
///
/// Es la misma lista del front (`frontend/src/lib/dominio.ts`). Al ser un
/// enum, la red rechaza cualquier categoría que no esté aquí.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Categoria {
    Alimentos,
    Agua,
    Ropa,
    Cobijas,
    Higiene,
    Medicamentos,
    Otros,
}

/// Datos de la entrega de un lote.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Salida {
    /// Destino general: barrio, vereda o albergue. Nunca una persona.
    pub destino: String,
    /// Fecha de entrega declarada, en formato AAAAMMDD (por ejemplo 20261017).
    pub fecha: u32,
    /// Momento real en que la red aceptó el registro (segundos Unix, UTC).
    pub registrada_en: u64,
}

/// Estado de entrega de un lote.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Entrega {
    /// El lote sigue en el centro de acopio.
    Pendiente,
    /// El lote ya salió; trae los datos de la salida.
    Entregada(Salida),
}

/// Un lote de donaciones tal como queda guardado en la red.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Lote {
    /// Identificador consecutivo, empieza en 1.
    pub id: u32,
    pub categoria: Categoria,
    /// Unidades recibidas (cajas, bolsas, paquetes).
    pub cantidad: u32,
    /// Fecha de recepción declarada, en formato AAAAMMDD.
    pub fecha_entrada: u32,
    /// Momento real en que la red aceptó la entrada (segundos Unix, UTC).
    pub registrada_en: u64,
    /// `Pendiente` hasta que se registre la salida.
    pub entrega: Entrega,
}

/// Claves de almacenamiento del contrato.
#[contracttype]
#[derive(Clone)]
enum Clave {
    /// Cuenta del centro de acopio autorizada para registrar.
    Admin,
    /// Cantidad de lotes registrados; también es el último id asignado.
    TotalLotes,
    /// Un lote por id.
    Lote(u32),
}

/// Errores que devuelve el contrato. El número es el que ve el front.
#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// No existe un lote con ese identificador.
    LoteNoExiste = 1,
    /// El lote ya tiene una salida registrada.
    LoteYaEntregado = 2,
    /// La cantidad es 0 o supera `CANTIDAD_MAXIMA`.
    CantidadInvalida = 3,
    /// La fecha no existe en el calendario o no tiene formato AAAAMMDD.
    FechaInvalida = 4,
    /// La fecha es posterior a la fecha actual de la red.
    FechaFutura = 5,
    /// El destino está vacío, es muy largo, tiene símbolos no permitidos
    /// o parece contener una cédula o un teléfono.
    DestinoInvalido = 6,
    /// La fecha de salida es anterior a la fecha de entrada del lote.
    SalidaAntesDeEntrada = 7,
}

/// Evento que se publica al registrar una entrada. Lo ve cualquiera en el explorador.
#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EntradaRegistrada {
    #[topic]
    pub id_lote: u32,
    pub categoria: Categoria,
    pub cantidad: u32,
    pub fecha: u32,
}

/// Evento que se publica al registrar una salida.
#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SalidaRegistrada {
    #[topic]
    pub id_lote: u32,
    pub destino: String,
    pub fecha: u32,
}

#[contract]
pub struct AcopioTransparente;

#[contractimpl]
impl AcopioTransparente {
    /// Se ejecuta una sola vez, al desplegar el contrato.
    ///
    /// # Argumentos
    /// * `admin` - cuenta del centro de acopio, la única que podrá registrar.
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&Clave::Admin, &admin);
        env.storage().instance().set(&Clave::TotalLotes, &0u32);
        extender_instancia(&env);
    }

    /// Registra la entrada de un lote nuevo y devuelve su identificador.
    ///
    /// Exige la firma del administrador.
    ///
    /// # Argumentos
    /// * `categoria` - tipo de donación.
    /// * `cantidad` - unidades recibidas, entre 1 y `CANTIDAD_MAXIMA`.
    /// * `fecha` - fecha de recepción en formato AAAAMMDD, no futura.
    ///
    /// # Errores
    /// `CantidadInvalida`, `FechaInvalida`, `FechaFutura`.
    pub fn registrar_entrada(
        env: Env,
        categoria: Categoria,
        cantidad: u32,
        fecha: u32,
    ) -> Result<u32, Error> {
        leer_admin(&env).require_auth();

        if cantidad == 0 || cantidad > CANTIDAD_MAXIMA {
            return Err(Error::CantidadInvalida);
        }
        validar_fecha_pasada(&env, fecha)?;

        // El nuevo id es el total actual + 1, así los ids nunca se repiten.
        let id = leer_total(&env) + 1;
        let lote = Lote {
            id,
            categoria,
            cantidad,
            fecha_entrada: fecha,
            registrada_en: env.ledger().timestamp(),
            entrega: Entrega::Pendiente,
        };

        guardar_lote(&env, &lote);
        env.storage().instance().set(&Clave::TotalLotes, &id);
        extender_instancia(&env);

        EntradaRegistrada {
            id_lote: id,
            categoria,
            cantidad,
            fecha,
        }
        .publish(&env);

        Ok(id)
    }

    /// Registra la entrega de un lote existente, enlazada a su entrada por `id_lote`.
    ///
    /// Exige la firma del administrador. Un lote solo se puede entregar una vez.
    ///
    /// # Argumentos
    /// * `id_lote` - identificador que devolvió `registrar_entrada`.
    /// * `destino` - barrio, vereda o albergue. Nunca el nombre ni la cédula de una persona.
    /// * `fecha` - fecha de entrega en formato AAAAMMDD, no futura ni anterior a la entrada.
    ///
    /// # Errores
    /// `LoteNoExiste`, `LoteYaEntregado`, `DestinoInvalido`, `FechaInvalida`,
    /// `FechaFutura`, `SalidaAntesDeEntrada`.
    pub fn registrar_salida(
        env: Env,
        id_lote: u32,
        destino: String,
        fecha: u32,
    ) -> Result<(), Error> {
        leer_admin(&env).require_auth();

        let mut lote = leer_lote(&env, id_lote)?;
        if lote.entrega != Entrega::Pendiente {
            return Err(Error::LoteYaEntregado);
        }
        validar_destino(&destino)?;
        validar_fecha_pasada(&env, fecha)?;
        if fecha < lote.fecha_entrada {
            return Err(Error::SalidaAntesDeEntrada);
        }

        lote.entrega = Entrega::Entregada(Salida {
            destino: destino.clone(),
            fecha,
            registrada_en: env.ledger().timestamp(),
        });
        guardar_lote(&env, &lote);
        extender_instancia(&env);

        SalidaRegistrada {
            id_lote,
            destino,
            fecha,
        }
        .publish(&env);

        Ok(())
    }

    /// Devuelve la cuenta administradora del centro de acopio.
    pub fn admin(env: Env) -> Address {
        leer_admin(&env)
    }

    /// Devuelve cuántos lotes se han registrado (también es el último id).
    pub fn total_lotes(env: Env) -> u32 {
        leer_total(&env)
    }

    /// Devuelve un lote por su identificador.
    ///
    /// # Errores
    /// `LoteNoExiste`.
    pub fn obtener_lote(env: Env, id_lote: u32) -> Result<Lote, Error> {
        leer_lote(&env, id_lote)
    }

    /// Lista lotes por páginas, en orden de id, para armar el tablero público.
    ///
    /// # Argumentos
    /// * `desde` - primer id a incluir (los ids empiezan en 1; 0 se trata como 1).
    /// * `limite` - cuántos lotes devolver; se recorta a `LIMITE_PAGINA`.
    pub fn listar_lotes(env: Env, desde: u32, limite: u32) -> Vec<Lote> {
        let total = leer_total(&env);
        let limite = limite.min(LIMITE_PAGINA);
        let mut lotes = Vec::new(&env);

        let mut id = desde.max(1);
        while id <= total && lotes.len() < limite {
            // Si un lote expiró en el almacenamiento se salta en vez de fallar la consulta.
            if let Ok(lote) = leer_lote(&env, id) {
                lotes.push_back(lote);
            }
            id += 1;
        }
        lotes
    }
}

// ---------------------------------------------------------------------------
// Funciones internas
// ---------------------------------------------------------------------------

/// Lee la cuenta administradora. Siempre existe porque se fija en el constructor.
fn leer_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&Clave::Admin)
        .expect("el constructor siempre guarda el admin")
}

/// Lee cuántos lotes hay registrados.
fn leer_total(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&Clave::TotalLotes)
        .unwrap_or(0)
}

/// Lee un lote o devuelve `LoteNoExiste`.
fn leer_lote(env: &Env, id: u32) -> Result<Lote, Error> {
    env.storage()
        .persistent()
        .get(&Clave::Lote(id))
        .ok_or(Error::LoteNoExiste)
}

/// Guarda un lote y, si le queda poca vida en el almacenamiento, se la
/// extiende a `OBJETIVO_TTL`. Ver `OBJETIVO_TTL` para el porqué del límite.
fn guardar_lote(env: &Env, lote: &Lote) {
    let clave = Clave::Lote(lote.id);
    env.storage().persistent().set(&clave, lote);
    env.storage()
        .persistent()
        .extend_ttl(&clave, UMBRAL_TTL, OBJETIVO_TTL);
}

/// Extiende la vida de los datos de instancia (admin y total de lotes) si
/// les queda poca.
fn extender_instancia(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(UMBRAL_TTL, OBJETIVO_TTL);
}

/// Valida que una fecha AAAAMMDD exista y no sea posterior al día actual de la red.
///
/// El reloj de la red está en UTC. En Colombia (UTC-5) el día local nunca va
/// adelante del día UTC, así que una fecha de "hoy" en Colombia siempre pasa.
fn validar_fecha_pasada(env: &Env, fecha: u32) -> Result<(), Error> {
    let dias_fecha = fecha_a_dias(fecha).ok_or(Error::FechaInvalida)?;
    let dias_hoy = (env.ledger().timestamp() / SEGUNDOS_POR_DIA) as i64;
    if dias_fecha > dias_hoy {
        return Err(Error::FechaFutura);
    }
    Ok(())
}

/// Convierte una fecha AAAAMMDD en días desde 1970-01-01.
///
/// Devuelve `None` si la fecha no existe (por ejemplo 20260231) o el año está
/// fuera de 2000-2100. Usa el algoritmo `days_from_civil` de Howard Hinnant.
fn fecha_a_dias(fecha: u32) -> Option<i64> {
    let anio = (fecha / 10_000) as i64;
    let mes = ((fecha / 100) % 100) as i64;
    let dia = (fecha % 100) as i64;

    if !(2000..=2100).contains(&anio) || !(1..=12).contains(&mes) || dia < 1 {
        return None;
    }
    let bisiesto = (anio % 4 == 0 && anio % 100 != 0) || anio % 400 == 0;
    let dias_del_mes = match mes {
        2 if bisiesto => 29,
        2 => 28,
        4 | 6 | 9 | 11 => 30,
        _ => 31,
    };
    if dia > dias_del_mes {
        return None;
    }

    // Se corre el año para que empiece en marzo y febrero quede al final.
    let a = if mes <= 2 { anio - 1 } else { anio };
    let era = a / 400;
    let anio_era = a - era * 400;
    let mes_desde_marzo = (mes + 9) % 12;
    let dia_anio = (153 * mes_desde_marzo + 2) / 5 + dia - 1;
    let dia_era = anio_era * 365 + anio_era / 4 - anio_era / 100 + dia_anio;
    Some(era * 146_097 + dia_era - 719_468)
}

/// Valida el destino de una salida.
///
/// Rechaza textos vacíos o muy largos, símbolos que podrían usarse para
/// inyectar HTML, y seis o más dígitos seguidos (parecen cédula o teléfono).
/// Es una segunda barrera: el front ya aplica las mismas reglas.
fn validar_destino(destino: &String) -> Result<(), Error> {
    let largo = destino.len();
    if !(DESTINO_MIN_BYTES..=DESTINO_MAX_BYTES).contains(&largo) {
        return Err(Error::DestinoInvalido);
    }

    let mut bytes = [0u8; DESTINO_MAX_BYTES as usize];
    let bytes = &mut bytes[..largo as usize];
    destino.copy_into_slice(bytes);

    let mut digitos_seguidos = 0u32;
    for &byte in bytes.iter() {
        // Los bytes >= 0x80 son parte de letras con tilde o ñ en UTF-8: se permiten.
        let permitido = byte >= 0x80
            || byte.is_ascii_alphanumeric()
            || matches!(byte, b' ' | b'.' | b',' | b'#' | b'-');
        if !permitido {
            return Err(Error::DestinoInvalido);
        }

        if byte.is_ascii_digit() {
            digitos_seguidos += 1;
            if digitos_seguidos >= DIGITOS_DATO_PERSONAL {
                return Err(Error::DestinoInvalido);
            }
        } else {
            digitos_seguidos = 0;
        }
    }
    Ok(())
}

#[cfg(test)]
mod test;
