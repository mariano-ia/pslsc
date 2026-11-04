# Charter Collection · ActiveCampaign (hero de campaña `01b-hero-coleccion`)

Lo que tiene que existir en ActiveCampaign para que el mail del juego se guarde. Sin esto el form valida, pero
**no envía** y le dice a la persona que no se guardó nada (nunca finge éxito). En el preview, `?demo` simula el envío.

## Qué hay que crear (lo hace quien administra ActiveCampaign)

| Qué | Detalle |
|---|---|
| **Form** "Charter Collection · Card No. 001" | Tipo inline. Al enviarse: suscribe a la lista general del club y pone la etiqueta `charter-collection-001`. Opción "Confirmación por mail" apagada (el juego no tiene pantalla de "confirmá tu mail") |
| Campo **Email** | El estándar del form |
| Campo **Consent** (texto o checkbox) | El hero manda `Yes` cuando la persona tilda "I agree to receive emails…" (el tilde es obligatorio para enviar) |
| Campo **Guess** (texto, 60 caracteres) | La apuesta del jueves: el nombre que escribió la persona. Va vacío en el primer envío |

El mismo mail puede llegar **dos veces**: al reclamar la Collector (después de la primera pregunta, opcional) y al
fijar la apuesta del jueves (obligatorio para apostar). El segundo envío actualiza el contacto y completa **Guess**.

## Reemplazos en el bloque

| Placeholder | Valor |
|---|---|
| `__AC_ACCOUNT__` | Subdominio de la cuenta: `xxxx` de `xxxx.activehosted.com` |
| `__AC_COLLECTION_FORM__` | ID del form (número) |
| `__AC_FIELD_CONSENT__` | Nombre del campo Consent en el form, tal cual: `field[NN]` |
| `__AC_FIELD_GUESS__` | Nombre del campo Guess: `field[NN]` |

`field[NN]` se ve en el código de inserción del form ("Embed" → HTML completo). El envío es el mismo POST directo a
`proc.php` que usan el newsletter y `/school` (`custom/ac-forms/ac-forms.js`).

## Mails que promete el hero

El panel de reclamo dice "An email when the next clue unlocks" y "A reminder on reveal day". Se arman como
automatización sobre la etiqueta `charter-collection-001`:

| Cuándo | Mail |
|---|---|
| Martes, miércoles y jueves, 10:00 AM ET | "Today's clue is live" con link a la home (no incluye la pista: se ve jugando) |
| Viernes, 10:00 AM ET | "Card No. 001 is revealed" con link a la home |

Quien se suma un miércoles recibe solo los mails que faltan. Ningún mail menciona el nombre del DT antes del viernes.

## Lo que ActiveCampaign no resuelve

- **Founding Member:** cruzar el mail con la base de socios fundadores necesita la API key, que no puede ir en el
  navegador. Lo hace el servidor (ver `docs/charter-card-schema.md` y la etapa 6 del plan). Hasta entonces nadie sale
  como founder, salvo en el preview con `?demo=founder`.
- **Resultado de la apuesta:** el hero lo calcula en el dispositivo con `guessMatch` del estado del viernes. Si el club
  quiere mandar un mail "You called it", se filtra por **Guess** a mano después del reveal.

## Errores que ve la persona

| Caso | Mensaje |
|---|---|
| Form sin configurar | "Something went wrong on our end. Nothing was saved, please try again later." |
| Sin conexión o ActiveCampaign no responde en 15 s | "We could not reach our server. Check your connection and try again." |
| ActiveCampaign rechaza el envío | El mensaje que devuelve ActiveCampaign |

En todos los casos el botón vuelve a habilitarse y el juego sigue: el hero nunca queda roto.
