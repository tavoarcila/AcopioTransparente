# Product Blueprint — Acopio Transparente

## Priorización de historias

De las 7 historias propuestas, estas son las que pasan al backlog del MVP, priorizadas por si bloquean o no la trazabilidad básica:

| # | Historia | Prioridad |
|---|----------------------------------------------------------------------|----------------|
| 1 | Empresa/donante registra la salida de un lote                        | Imprescindible |
| 2 | Administrador registra la entrada de un lote                         | Imprescindible |
| 3 | Administrador registra la salida/entrega de un lote                  | Imprescindible |
| 4 | Donante consulta si su donación fue entregada                        | Imprescindible |
| 7 | El registro no puede editarse ni borrarse después de creado          | Imprescindible |
| 5 | Veedor consulta agregados de entrada/salida por periodo              | Debería        |
| 6 | Fundación genera reporte agregado para sus propios donantes          | Podría         |

**Criterio de priorización:** las historias 1, 2, 3 y 4 son imprescindibles porque sin ellas no existe trazabilidad alguna — son el ciclo completo mínimo (donar → recibir → entregar → verificar). La 7 no es una pantalla sino una garantía que da Stellar por diseño, así que se cumple automáticamente al construir sobre la red, no se construye aparte. La 5 mejora la transparencia pero el sistema funciona sin ella. La 6 depende de tener datos reales acumulados, por lo que tiene sentido dejarla para después de validar el flujo central.

## Propuesta de valor

Acopio Transparente le da al donante y al damnificado algo que hoy no existe: una forma de confirmar, sin depender de la palabra de nadie, que una donación salió de donde salió y llegó a donde dijo que iba a llegar. Hoy, como se documentó en el Problem Brief, esa confirmación depende enteramente de la buena fe del administrador del centro de acopio, registrada (en el mejor caso) en un cuaderno o un Excel que la misma persona a auditar controla.

El resultado que obtiene el usuario es verificación independiente: el donante puede consultar en cualquier momento si su aporte fue entregado, el damnificado o un veedor comunitario puede revisar si el reparto fue proporcional, y el administrador honesto obtiene una defensa objetiva ante cualquier sospecha. Elegiría esta solución en vez de seguir con el cuaderno porque el registro, una vez escrito en Stellar, no puede ser alterado ni siquiera por quien lo creó — algo que ningún sistema tradicional de hoja de cálculo o papel puede garantizar.

La diferencia central frente a cómo se resuelve hoy no es la velocidad ni la comodidad, es la naturaleza de la garantía: pasar de "confía en mi palabra" a "verifícalo tú mismo".

## Flujo de usuario

1. **Entrada:** el voluntario del centro de acopio recibe una donación y la registra (categoría, cantidad, fecha) usando una wallet conectada a la app. La transacción queda escrita en Stellar testnet.
2. **Clasificación interna:** el centro de acopio organiza internamente lo recibido (este paso no requiere blockchain, es logística física).
3. **Salida:** cuando se entrega el lote a una familia o grupo, el voluntario registra la salida, enlazada al lote de entrada correspondiente.
4. **Consulta:** cualquier persona (donante, damnificado, veedor) entra al tablero público y ve, sin necesidad de cuenta ni login, cuánto ha entrado, cuánto ha salido y qué queda pendiente, agregado por categoría y fecha.
5. **Salida del flujo:** el donante cierra el ciclo con la certeza de que su aporte fue registrado como entregado; no hay una acción final que "complete" nada más allá de esa confirmación visual.

Las tres partes del recorrido son: entrada (el voluntario con la donación en la mano, sin necesitar conocimiento técnico previo), pasos intermedios (registrar entrada → clasificar → registrar salida, cada uno con un verbo y un responsable claro), y salida (el momento en que cualquiera puede verificar el resultado sin pedirle explicaciones a nadie).

## Alcance del MVP

**Funcionalidad central (imprescindible):**
- Registrar entrada de un lote de donación (categoría, cantidad, fecha) escribiéndolo en Stellar.
- Registrar salida/entrega de un lote, enlazada a su entrada.
- Tablero público de consulta (sin login) que muestra entradas, salidas y pendientes agregados.

**Funcionalidad deseable (fuera del MVP de 5 semanas):**
- Notificaciones automáticas al donante cuando su lote se marca como entregado.
- Reportes descargables en PDF para que una fundación los use con sus propios donantes.
- Perfil público verificado para cada centro de acopio.
- Verificación de identidad real de las familias beneficiarias (hoy solo se registran categorías agregadas, nunca datos personales).

**Justificación del recorte:** las tres funciones centrales ya resuelven, por sí solas, la pregunta que motiva todo el proyecto — "¿llegó o no llegó la donación?" — sin necesitar identidad verificada, notificaciones ni reportes. Un sistema que solo responde esa pregunta sigue siendo valioso y demostrable en un Demo Day de tres minutos; añadir identidad o reportes ahora distraería tiempo de desarrollo sin cambiar la respuesta a la pregunta central.

## Lean Canvas

Ver archivo adjunto `lean-canvas-acopio-transparente.png`.

## Backlog priorizado (Kanban)

Tablero: https://github.com/users/tavoarcila/projects/1/views/1

|                 Historia                        | Columna | Criterio de aceptación      
|-------------------------------------------------|-------- |---------------------------------------------------------------------------------------------------------------|
| Registrar entrada de lote                       |  Ready  | Dado un lote físico recibido, cuando el voluntario completa el formulario de entrada (categoría, cantidad, fecha), entonces la transacción aparece en el explorador de Stellar testnet con esos tres datos. |
| Registrar salida de lote                        |  Ready  | Dado un lote con entrada ya registrada, cuando el voluntario registra su salida hacia un beneficiario, entonces la transacción queda enlazada al lote de entrada original en Stellar testnet, con fecha y destino. |
| Consultar donación entregada en tablero público | Backlog | Dado un lote registrado en Stellar, cuando cualquier persona entra al tablero público sin necesidad de login ni wallet, entonces puede ver si ese lote fue marcado como entregado, con fecha. |
| Garantizar que el registro sea inalterable      | Ready   | Dado un registro ya escrito en Stellar, cuando cualquier actor (incluido el propio administrador) intenta modificarlo o eliminarlo, entonces la red lo rechaza. Es una propiedad garantizada por el diseño del contrato sobre Soroban, no requiere pantalla aparte. |

## Arquitectura inicial

El sistema tiene tres capas. La **interfaz** es una aplicación web simple (pensada para celular, ya que la usará un voluntario en el momento de recibir o entregar una donación) construida en Next.js, con una wallet Freighter conectada para firmar las transacciones. La **lógica** vive en un contrato inteligente escrito en Rust sobre Soroban, que expone dos funciones principales: `registrar_entrada(categoria, cantidad, fecha)` y `registrar_salida(id_lote, destino, fecha)`, enlazando cada salida a su entrada correspondiente por un identificador de lote.

La red **Stellar** entra en el punto donde cualquiera de esas dos funciones se invoca: la transacción se firma con Freighter, se envía a la testnet, y una vez confirmada queda disponible para consulta pública a través de Horizon (la API de Stellar). El tablero público no escribe nada en la red, solo lee: consulta Horizon periódicamente y agrega los datos (entradas menos salidas) para mostrarlos sin necesidad de que el visitante tenga wallet ni cuenta.

Los datos sensibles (si en una fase posterior se necesitara identificar a una familia beneficiaria) nunca entrarían al contrato ni a la cadena; vivirían en una base de datos convencional fuera de Stellar, conectada solo por un identificador no reversible, siguiendo el criterio de qué va en la red y qué no, visto en la Sesión 2.

## Uso de Stellar y justificación

El proyecto usa tres componentes de Stellar, cada uno resolviendo una necesidad específica del criterio de pertinencia definido en el Problem Brief. **Soroban** aloja el contrato inteligente que registra cada entrada y salida: se eligió sobre simplemente guardar los datos como pagos nativos de Stellar porque se necesita lógica propia (enlazar una salida a su entrada, validar que no se repita un registro), algo que solo un contrato permite, no una transacción simple. **Freighter** es la wallet que firma cada registro: garantiza que cada entrada o salida tenga un autor identificable (la cuenta del centro de acopio), sin que Acopio Transparente tenga que gestionar contraseñas ni credenciales propias. **Horizon** es la API que consulta la red para armar el tablero público: permite que cualquier persona vea el estado agregado de un centro de acopio sin necesitar wallet, login ni conocimiento técnico, cumpliendo la promesa central del proyecto de que la verificación no dependa de confiar en nadie.

Se descartó usar Ethereum u otra red por el criterio visto en la Sesión 2: Stellar no cobra comisión a quien sostiene la red y está diseñada para transacciones simples y frecuentes, que es exactamente el patrón de uso esperado (muchos registros pequeños de entrada y salida), a diferencia de redes pensadas para lógica más compleja y costosa por transacción.
