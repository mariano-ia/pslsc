# Coach Reveal Challenge · registro de respuestas (`__CHALLENGE_API__`)

El juego del hero (`01b-hero-coleccion`) tiene premios para los tres primeros que contesten bien las tres preguntas
oficiales. Las bases oficiales están completas en el bloque (diálogo `#official-rules`). Lo que piden las bases y que
resuelve el servidor:

- Cada respuesta llega por el form del sitio, con el mail de la persona.
- **Solo cuenta la primera respuesta** de cada mail a cada pregunta.
- El sitio registra la **fecha y hora** en que recibió cada respuesta, y el **orden** de llegada (desempate).
- Cierre: **lunes 30/11/2026, 12:00 PM ET**. Lo que llega después no cuenta.
- Ganan los tres primeros que completan las tres correctas. No hay sorteo.

ActiveCampaign no alcanza para esto: guarda el último valor de cada campo, no la hora de cada respuesta. Hace falta
un registro propio (una función que agregue filas a una base o a una Google Sheet). ActiveCampaign sigue para los
mails (el permiso de marketing es opcional y aparte).

## Calendario

| Pregunta oficial | Se publica | `days[i]` |
|---|---|---|
| 1 | Viernes 27/11, 10:00 AM ET | `days[0]` |
| 2 | Sábado 28/11, 10:00 AM ET | `days[1]` |
| 3 | Domingo 29/11, 10:00 AM ET | `days[2]` |
| — (pista libre, sin pregunta) | Lunes 30/11, 10:00 AM ET | `days[3]`, sin `q`, `opts`, `a` ni `fact` |
| Cierre del challenge | Lunes 30/11, 12:00 PM ET | Desde acá `__COLECCION_API__` suma `a` y `fact` a las preguntas |
| Reveal | Lunes 30/11, 1:00 PM ET | Como en `charter-collection-state.md` |

**Importante para el estado (`__COLECCION_API__`):** hasta el cierre, las preguntas van **sin `a` ni `fact`**. `a` es
la respuesta correcta y `fact` la delata: si viajan antes, cualquiera las lee en la pestaña de red del navegador.
Desde el lunes 12:00 PM ET se suman (y el front muestra a cada persona cuántas acertó). Opcional: `challengeClosed: true`
desde el cierre.

## El endpoint

`POST __CHALLENGE_API__` con `Content-Type: application/json`. CORS abierto al dominio del sitio, sin caché.

```jsonc
{
  "email": "fan@email.com",       // el de la inscripción, igual en las tres
  "question": 1,                  // número oficial: 1, 2 o 3
  "day": 0,                       // índice en days[] (0 = viernes)
  "option": 1,                    // índice de la opción elegida (0–3)
  "answer": "USL League One",     // el texto de la opción, para leer la planilla sin cruzar índices
  "eligible": { "adult": true, "floridaResident": true, "rulesAccepted": true },   // casillas de la inscripción
  "marketing": false,             // si aceptó recibir mails (opcional)
  "clientTime": "2026-11-27T15:00:04.120Z"   // hora del navegador: solo referencia, NO sirve para rankear
}
```

Qué hace el servidor con cada envío:

1. Guarda la **hora del servidor** (`receivedAt`) y un **número de orden** creciente (`seq`). Esos dos son los que
   rankean, nunca `clientTime`.
2. Rechaza (`400`) si la pregunta todavía no se publicó o si llegó después del cierre (lunes 12:00 PM ET), si falta
   el mail o si alguna casilla de `eligible` no vino en `true`.
3. Si ese mail ya había contestado esa pregunta, guarda el envío igual (para auditoría) pero marca `first: false`:
   **cuenta el primero**.
4. Responde `200` con `{ "ok": true, "first": true|false }`. En error: `{ "ok": false, "message": "texto para la persona" }`
   (el front lo muestra tal cual y deja volver a elegir).

Mail en minúsculas y sin espacios antes de comparar.

## Cómo salen los ganadores

Al cierre, con la planilla:

1. Por mail, quedarse con la **primera** respuesta de cada pregunta (menor `seq`).
2. Quedarse con los mails cuyas tres primeras respuestas son correctas.
3. La hora en que completó el set es la de **su última** respuesta de esas tres (`receivedAt`; si hay empate, `seq`).
4. Ordenar por esa hora: los tres primeros son 1.º, 2.º y 3.º. Si hay menos de tres, hay menos premios.
5. Verificar elegibilidad (18+, Florida, no empleados del club ni de USL ni sus familias) y avisar por mail antes del
   jueves 3/12 a las 12:00 PM ET. Si alguien no califica o no responde en 48 h, sigue el próximo en orden.

## Qué hace el front

- Antes de la primera pregunta muestra los premios y la inscripción: mail, "I'm 18 or older and a Florida resident",
  "I agree to the Official Rules" y el permiso de mails (opcional, va a ActiveCampaign con `__AC_COLLECTION_FORM__`).
  También deja jugar sin inscribirse ("Just play for the clues"): esas respuestas no se mandan.
- Inscripto, cada respuesta se manda antes de darla por contestada. Si el envío falla, la persona puede volver a elegir.
- Si se inscribe tarde, las respuestas que ya había dado se mandan al inscribirse, en orden.
- Hasta el cierre no dice si la respuesta es correcta: muestra "Answer received" y la pista.
- Sin `__CHALLENGE_API__` configurado no deja inscribirse (lo dice en pantalla y en la consola). `?demo` simula el envío.
- El progreso queda en el navegador (`pslsc-charter-001`): el registro de verdad es el del servidor.
- El mail de la inscripción queda guardado en ese navegador: los días siguientes la persona contesta sin volver a
  escribirlo. Desde otro dispositivo se inscribe de nuevo con el mismo mail y el servidor junta sus respuestas.
- Collector Card: quien se inscribió la reclama con un toque, con el mail de la inscripción (el envío de la carta por
  mail es opcional y usa ActiveCampaign solo si marca el permiso). Quien juega sin inscribirse la reclama con mail y
  permiso, como antes. Se puede reclamar hasta el reveal (lunes 1:00 PM ET).
