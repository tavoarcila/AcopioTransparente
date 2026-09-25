# Problem Brief

## Decisión del problema

### Problema elegido

Cuando una comunidad dona bienes durante una emergencia, no existe forma de verificar que esas donaciones lleguen a quienes las necesitan. Propuesto por Gustavo Arcila.

### Por qué elegimos este

Cumple con varios criterios de la Sesión 1 a la vez: hay partes que no confían entre sí (donante, administrador del centro de acopio, damnificado), se necesita un histórico que nadie pueda alterar después de creado, y hay un intermediario que hoy concentra toda la confianza sin ningún contrapeso. Además, no es un problema hipotético: se apoya en una observación directa durante el terremoto del 10 de agosto de 2026 en Pereira.

### Propuestas descartadas

Al participar de forma individual (por el esquema de mi tiempo libre no es posible de mi parte pertenecer a un equipo sin afectar su correcto funcionamiento), no hubo otras propuestas de compañeros que evaluar. La comparación se hizo frente a otras ideas consideradas al inicio —trazabilidad de café, certificación de horas de voluntariado, cupones no duplicables para negocios pequeños— y se eligió esta por estar respaldada en una observación directa y no en una hipótesis.

### Cómo tomamos la decisión

Proyecto individual: la decisión se tomó sola, sin votación ni debate de equipo, priorizando el problema con evidencia propia más fuerte.

---

## Problem Brief

### Encabezado

**Proyecto:** Acopio Transparente. Las donaciones entregadas en emergencias no se pueden rastrear desde que entran a un centro de acopio hasta que llegan a una familia afectada.

### Equipo y roles

Proyecto individual. Gustavo Arcila (GitHub: tavoarcila) asume los tres roles del proceso: investigación y definición del problema, desarrollo técnico sobre Stellar/Soroban, y documentación y entrega. Coordinación con el programa vía Discord y Apex.

### Problema y evidencia

Después del terremoto del 10 de agosto de 2026 en Pereira, se organizaron varios centros de acopio para recibir donaciones de la comunidad —ropa, mercados, kits de aseo— destinadas a las familias afectadas. Fui testigo directo de cómo algunos elementos de esas donaciones nunca llegaron a su destino: se quedaron en manos de quien administraba el centro de acopio o se repartieron con preferencia hacia conocidos, entendiendo que eran personas de bajos recursos, pero no damnificadas directamente, sin que nadie más tuviera forma de comprobarlo ni de reclamar. También fue común ver entregas que no correspondían a la necesidad real de cada hogar: comida para mascotas a familias sin mascotas, pañales o elementos de bebé a hogares sin niños pequeños, toallas higiénicas a hogares compuestos solo por adultos mayores, o pañales en tallas que no correspondían a nadie del grupo familiar.

Este no es un caso aislado ni exclusivo de esa emergencia puntual. Cada vez que ocurre un desastre natural en Colombia (inundaciones, deslizamientos, sismos), se repite el mismo patrón: se activan centros de acopio comunitarios de forma improvisada, gestionados por líderes locales sin ningún sistema de control, y la trazabilidad de lo donado depende exclusivamente de la buena memoria y la honestidad de quien está a cargo.

La evidencia aquí es observación directa durante la emergencia de agosto, no una fuente externa. No existe una cifra oficial de cuánto se pierde o se desvía en estos procesos, precisamente porque no hay ningún registro que permita medirlo, lo cual es en sí mismo parte del problema que este proyecto busca evidenciar. Si se revisan las redes sociales, se encuentra que prácticamente cualquier centro de acopio, sin importar quién lo administre, termina siendo objeto de críticas o de dudas sobre su manejo.

### Usuario y actores

El actor principal afectado es el damnificado, quien depende por completo del criterio de quien administra el centro de acopio, sin ningún canal para verificar si el reparto fue justo ni para reclamar si no lo fue. Hoy, si algo sale mal, su único recurso es el rumor o la queja informal, que rara vez cambia algo.

El segundo actor es el donante, que entrega bienes confiando en que van a ayudar a alguien, pero sin ninguna forma de confirmar que llegaron a destino. Hoy resuelve esto con fe ciega en la organización que recibe la donación, o evitando donar en especie y prefiriendo solo fundaciones grandes con reputación ya construida.

El tercer actor, casi siempre ignorado, es el propio administrador del centro de acopio: muchas veces actúa de buena fe, pero al no tener forma de demostrar que repartió correctamente, queda expuesto a sospechas que no puede refutar. Esto le cuesta credibilidad personal y comunitaria, incluso cuando hizo bien su trabajo.

### Flujo actual de valor

1. El donante entrega un bien (ropa, mercado, kit) en el centro de acopio.
2. Un voluntario o el administrador lo recibe, generalmente sin registro alguno o con una anotación informal en cuaderno.
3. El bien se almacena junto con el resto de donaciones, sin categorización ni conteo verificable.
4. El administrador decide, con su propio criterio, a qué familia o grupo entregar cada bien.
5. La entrega se realiza, normalmente sin ningún soporte que confirme quién la recibió.
6. Si un donante o una entidad de control pregunta a dónde fue una donación, la única respuesta posible es la palabra del administrador.

Ningún paso de este flujo responde a una obligación normativa formal en el caso de centros de acopio comunitarios (a diferencia de una ONG grande, que sí tiene auditorías). El intermediario que concentra toda la confianza es el administrador del centro de acopio, en los pasos 2, 4 y 5.

### Fricciones identificadas

La primera fricción ocurre en el paso 2: no hay registro de entrada verificable, así que desde el inicio del proceso ya se pierde la trazabilidad. La causa es la falta de una herramienta simple que cualquier voluntario pueda usar en el momento. Afecta directamente al donante, que pierde toda visibilidad desde el primer segundo.

La segunda fricción, más grave, ocurre en el paso 4: la decisión de a quién entregar cada bien es completamente discrecional y no queda documentada. La causa es que no existe ningún mecanismo, ni siquiera manual, que obligue a dejar constancia de ese criterio. Afecta al damnificado, que puede quedar por fuera del reparto sin ninguna explicación.

La tercera fricción ocurre en el paso 6: cuando surge una duda o un reclamo, no hay forma de resolverlo con evidencia, solo con la palabra de una de las partes. La causa es la ausencia total de un registro auditable por terceros. Afecta a los tres actores: el donante no puede confirmar nada, el damnificado no puede reclamar con sustento, y el administrador no puede defenderse de una acusación injusta.

Existe una cuarta fricción en el paso 4: la entrega no solo es discrecional en a quién se le da, sino también en qué se le da. Al no registrarse la composición o necesidad de cada familia (si tiene bebés, mascotas, adultos mayores), se entregan bienes que no corresponden a nadie del hogar mientras otra familia sí los necesitaba. La causa es la ausencia de cualquier mecanismo de registro de necesidad antes del reparto. Afecta tanto al damnificado, que recibe algo inútil mientras necesitaba otra cosa, como al donante, cuyo aporte termina desperdiciado o sin uso.

### Oportunidad e hipótesis

La oportunidad priorizada es la fricción del paso 6: la falta de un registro que un tercero pueda auditar sin depender de la palabra de quien administra el centro de acopio. Se elige porque es la raíz de las otras dos fricciones: al resolver el registro verificable de entrada y salida, se resuelve también la falta de trazabilidad y la discrecionalidad no documentada.

La hipótesis es que, si el registro de entrada y salida de donaciones se escribe en un lugar que ni el propio administrador puede alterar después, cambia lo que el donante y el damnificado pueden verificar por sí mismos, sin depender de la buena voluntad de un tercero. El donante podría consultar si su donación fue entregada y a qué grupo. El damnificado, o cualquier veedor comunitario, podría revisar si el reparto fue proporcional. Y el administrador, en lugar de quedar expuesto a sospechas sin defensa, tendría una forma objetiva de demostrar que actuó correctamente.

### Criterio de pertinencia

Este caso requiere un registro distribuido y no una base de datos tradicional porque se cumplen al menos dos criterios de la Sesión 1. Primero, hay varias partes que no confían plenamente entre sí —donante, administrador y damnificado— que necesitan compartir un mismo registro sin que ninguna tenga el poder de modificarlo unilateralmente; una base de datos tradicional la controlaría una sola de esas partes, exactamente la que se quiere hacer transparente. Segundo, el histórico no puede alterarse: si el administrador pudiera editar un registro después de un reclamo, el sistema no aportaría nada distinto a lo que ya existe hoy con un cuaderno o un Excel.

Siguiendo el criterio de la Sesión 2 sobre qué debe ir en la red y qué no, en Stellar solo se registraría lo que las partes necesitan verificar públicamente: el lote de entrada de una donación (categoría, cantidad, fecha) y su salida (a qué grupo se entregó y cuándo). Cualquier dato personal identificable de las familias beneficiarias —nombre, cédula, situación particular— quedaría fuera de la cadena, en una base de datos convencional, precisamente porque en un registro inmutable nada se puede borrar después.

### Supuestos y riesgos

El primer supuesto es que los voluntarios que operan un centro de acopio van a estar dispuestos a usar una herramienta digital adicional en medio de una emergencia, cuando ya están sobrecargados de trabajo. Si el registro no es más simple y rápido que anotar en un cuaderno, nadie lo va a usar, y el proyecto pierde su razón de ser.

El segundo supuesto es que hacer pública la información agregada de entradas y salidas (sin datos personales) es suficiente para generar confianza, sin necesitar verificar la identidad real de cada familia beneficiaria. Si el nivel de fraude solo se resuelve verificando identidad real, el alcance del MVP tendría que crecer bastante.

El tercer supuesto es que un centro de acopio real (o al menos un caso piloto) va a estar dispuesto a probar el sistema, aunque sea con un lote pequeño de donaciones. Si ninguna organización comunitaria accede a probarlo, la validación tendría que apoyarse solo en una demostración técnica, sin retroalimentación de usuarios reales.