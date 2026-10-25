# MVP Functional — Semana 4

Proyecto: **Acopio Transparente**. Trabajo individual de Gustavo Adolfo Arcila Trujillo (`tavoarcila`).

En la semana 3 elegí la **opción A: contrato propio**. Esta semana quedó escrito, probado, desplegado en Stellar testnet y conectado al front: el administrador registra entradas y salidas firmando con Freighter, y el tablero público lee los datos directamente del contrato, sin wallet ni cuenta.

## Evidencia verificable

| Qué | Enlace |
|---|---|
| Video (producto + pitch, máx. 3 min) | **PENDIENTE: enlace de YouTube** |
| Producto en línea | [acopio-transparente.vercel.app](https://acopio-transparente.vercel.app) |
| Contrato en testnet (actual, v2) | [CABHUEGDEQUIKBZ2CO5C2FHRNRXUTHA5OEG5GIRYV7VMSLAU2KRV6FCX](https://stellar.expert/explorer/testnet/contract/CABHUEGDEQUIKBZ2CO5C2FHRNRXUTHA5OEG5GIRYV7VMSLAU2KRV6FCX) |
| Despliegue del contrato v2 | [d10bd2bd…](https://stellar.expert/explorer/testnet/tx/d10bd2bdd448a8ae6efd4b3c8d3abdbcb3c5f68f622b6ce198a489d8f257b4c8) |
| Contrato en testnet (v1, las pruebas de abajo) | [CBVTVCEEHRCWCRI3AO3ELDAJJ6W6AY7IUZ57QG37SHOHFZDYN2TUCIFU](https://stellar.expert/explorer/testnet/contract/CBVTVCEEHRCWCRI3AO3ELDAJJ6W6AY7IUZ57QG37SHOHFZDYN2TUCIFU) |
| Subida del código (WASM) | [ed9efb2c…](https://stellar.expert/explorer/testnet/tx/ed9efb2ced9020f6bef02dc939b0fbda06160d2128b8f3b608265158d51c11c8) |
| Despliegue del contrato (fija la cuenta administradora) | [17455f9d…](https://stellar.expert/explorer/testnet/tx/17455f9d01c09f50d1620092df91dd55dfecc71e12742155903a31fac32e5157) |
| `registrar_entrada`: lote #1, Alimentos, 5 unidades | [470461ef…](https://stellar.expert/explorer/testnet/tx/470461efbef19be28d2aaa1bdfa581a37c90ee98872675e95b6b3aadf1141788) |
| `registrar_salida`: lote #1 entregado | [b0f0fa8c…](https://stellar.expert/explorer/testnet/tx/b0f0fa8c50fb9067cfc7e30a8ea73892ae94907619ce858604a82efaf3b2333d) |
| `registrar_entrada`: lote #2, Cobijas, 20 unidades (pendiente) | [8b9b6b16…](https://stellar.expert/explorer/testnet/tx/8b9b6b16d61d3289b38d7fe6b6191883a9d0ec2879a43f3fa0d60a057d2fd204) |
| Cuenta administradora del centro | [GCWSE4EW…NTMW](https://stellar.expert/explorer/testnet/account/GCWSE4EWR7SIR4JSBCXCVHKFH2AHUEM7FTTMD6NUE6QYZH6VQ6VGNTMW) |

Las tres invocaciones se hicieron desde el front, firmadas con Freighter.

**Por qué hay un contrato v2 (25 de octubre de 2026).** La v1 extendía la vida de cada registro al máximo que permite la red (~180 días). Cuando el alquiler del almacenamiento en testnet se disparó, esa extensión subió el costo de un registro de 0,6 XLM a más de 3.800 XLM, por encima del máximo que admite una transacción, y el front ya no podía registrar. La v2 extiende la vida a una semana (un registro cuesta ~12,5 XLM de prueba). El historial se conserva más tiempo con `stellar contract extend` y, si un dato se archiva, se recupera con `stellar contract restore`: en Stellar archivar no es borrar. La v1 y sus transacciones siguen consultables en el explorador.

### Qué se construyó

- **Contrato** (`contrato/contracts/acopio`, Rust + Soroban SDK 28). Funciones de escritura: `registrar_entrada(categoria, cantidad, fecha)` y `registrar_salida(id_lote, destino, fecha)`. Funciones de lectura: `admin`, `total_lotes`, `obtener_lote` y `listar_lotes`. Las reglas se cumplen en la red, no en el front:
  - solo la cuenta administradora fijada al desplegar puede registrar;
  - una salida exige un lote existente y no entregado, y no puede tener fecha anterior a la entrada;
  - las fechas deben existir y no ser futuras;
  - el destino rechaza símbolos y secuencias de seis o más dígitos (posibles cédulas o teléfonos).
  - No hay función para editar ni borrar. Cada registro publica un evento visible en el explorador. 12 pruebas unitarias cubren estas reglas.
- **Servicios front↔contrato** (`frontend/src/lib/contrato.ts`): cliente TypeScript generado con `stellar contract bindings`. Las lecturas se simulan contra Stellar RPC. Las escrituras se simulan, se firman con Freighter, se envían y se espera la confirmación. Los errores del contrato se traducen a mensajes claros.
- **Front**: la pantalla de revisión muestra lo que se va a firmar y avisa si la cuenta no es la administradora. Los estados "esperando firma" y "confirmando" bloquean el doble toque. Al terminar se muestran el número de lote y el hash con enlace al explorador. El tablero suma entradas, salidas y pendientes, desglosa por categoría y deja que el donante busque su lote por número.

## Aprendizajes y ajustes priorizados

El aprendizaje técnico más grande fue que **Horizon no sirve para leer un contrato**. El Blueprint decía que el tablero consultaría Horizon. Horizon muestra que hubo una invocación, pero no lee el almacenamiento del contrato. El tablero se conectó entonces al **Stellar RPC**: simula funciones de solo lectura sin firma ni costo, y así se mantiene la promesa de un tablero sin wallet. Horizon queda solo para mostrar el estado de la red.

El segundo aprendizaje es que **las reglas tienen que vivir en el contrato y no en la pantalla**. Al principio la validación estaba solo en el front, que es justo lo que controla el administrador. Ahora el contrato rechaza por sí mismo una salida duplicada, una fecha futura o un destino con datos personales. El front repite las validaciones solo para dar mensajes claros antes de firmar.

El tercero salió de la primera prueba real: en el destino se escribió "Familia". No es un dato personal, pero tampoco es un lugar, y sin un lugar el veedor no puede revisar si el reparto fue proporcional. El texto libre deja ese hueco.

Ajustes ordenados por impacto y esfuerzo:

1. **Antes del cierre (alto impacto, bajo esfuerzo):** grabar el video y reforzar la ayuda del campo destino con ejemplos.
2. **Antes del cierre (alto impacto, esfuerzo medio):** reemplazar el destino libre por una lista de barrios y albergues del centro.
3. **Pendiente (impacto medio, esfuerzo alto):** salidas parciales de un lote y soporte para varios centros de acopio con su propio administrador.
4. **Pendiente:** la historia 1 del Blueprint (el donante registra su despacho). Hoy el donante recibe el número de lote como comprobante y lo consulta en el tablero.

## Riesgos y pendientes

**Reinicio de testnet.** La testnet de Stellar se reinicia periódicamente y borra contratos y datos. Si pasa antes del Demo Day, los enlaces de este documento dejarían de funcionar. Mitigación: el despliegue es repetible desde el repositorio (`stellar contract deploy` más `contrato/generar-cliente.sh`), y el front acepta un nuevo ID por la variable `NEXT_PUBLIC_CONTRACT_ID` sin tocar código. Los lotes de prueba sí habría que registrarlos de nuevo.

**Vida de los datos en Soroban.** Los datos de un contrato tienen un tiempo de vida (TTL) y expiran si nadie lo extiende. El contrato extiende cada lote al máximo permitido al escribirlo, pero para un uso de meses hace falta una tarea periódica que renueve ese tiempo o restaure lo archivado. Sin eso, el historial "inalterable" podría quedar inaccesible, aunque no alterado.

**Una sola cuenta administradora.** Si el administrador pierde su frase de recuperación, el centro no puede seguir registrando. Si alguien se la roba, podría escribir registros falsos (no borrar los existentes). Falta una función para rotar el administrador, idealmente con aprobación de varias cuentas.

**Escalabilidad del tablero.** El tablero lee todos los lotes, de 50 en 50. Con cientos de lotes funciona; con miles se volverá lento. La solución es un indexador de eventos o totales guardados en el contrato.

**Datos personales en texto libre.** El contrato bloquea cédulas y teléfonos, pero no puede detectar un nombre propio escrito como destino. Lo que se escribe en la red es público y no se borra. La lista cerrada de destinos reduce este riesgo, y es el ajuste prioritario.

**Adopción.** El mayor riesgo no es técnico: que un voluntario sobrecargado en plena emergencia instale Freighter y firme cada lote. Esto todavía no se ha probado con usuarios reales.

**Pendientes:** grabar y enlazar el video, registrar el proyecto en Apex, y la lista cerrada de destinos.

## Plan de validación con usuarios

**A quién.** A los tres actores del Problem Brief, cinco personas por perfil: (1) administradores o voluntarios de centros de acopio comunitarios de Pereira, que son quienes registran; (2) donantes que hayan entregado bienes en la emergencia del 10 de agosto; (3) veedores o líderes comunitarios, que revisan el reparto. Se les contacta por las juntas de acción comunal y los grupos de WhatsApp de barrio que se activaron en la emergencia.

**Con qué métodos.**
- **Prueba de usabilidad con escenario, no con instrucción.** Al voluntario se le dice: "Acaban de llegar 30 mercados al centro y necesitas dejarlos registrados". Al donante: "Donaste cobijas la semana pasada y quieres saber si se entregaron; este es tu número de lote". Se les pide pensar en voz alta y no se les ayuda.
- **Recorrido interno previo** del equipo en cada paso: ¿sabe qué quiere lograr? ¿ve cómo hacerlo? ¿entiende que es la acción correcta? ¿ve que avanzó?
- **Entrevista corta posterior** sobre el pasado, no sobre el futuro: "¿Cómo registraste las donaciones la última vez?".
- **Métrica técnica:** cada prueba deja su hash en el explorador.

**Hipótesis y criterio** (fijados antes de mirar resultados; 4 de 5 o más es cierta, 3 de 5 no concluyente, 2 de 5 o menos es falsa):

| # | Hipótesis | Cómo se observa |
|---|---|---|
| H1 | Creemos que un voluntario sin experiencia registra una entrada con Freighter sin ayuda, porque el formulario tiene solo tres datos. Lo sabremos si 4 de 5 lo logran en menos de dos minutos. | Prueba de usabilidad, cronómetro |
| H2 | Creemos que el voluntario entiende qué está firmando, porque la pantalla de revisión lo muestra antes de abrir Freighter. Lo sabremos si 4 de 5 explican con sus palabras qué quedó registrado. | Pregunta al final de la tarea |
| H3 | Creemos que el donante consulta su lote sin que se le pida, porque hoy no tiene forma de saber qué pasó con su donación. Lo sabremos si 4 de 5 encuentran el estado "Entregado" con su número de lote. | Prueba de usabilidad |
| H4 | Creemos que el aviso de espera evita el doble toque. Lo sabremos si no aparece ningún registro repetido en el contrato tras las pruebas. | Lectura del contrato |

Si H1 resulta falsa, se prioriza un modo de registro sin extensión (por ejemplo, una billetera integrada en la app) antes que cualquier funcionalidad nueva.
