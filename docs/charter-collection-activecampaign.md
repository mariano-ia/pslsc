# Charter Collection · ActiveCampaign (hero `01b-hero-coleccion` y ficha del DT `t01-coach`)

Lo que tiene que existir en ActiveCampaign para que se guarden los mails: el de la Collector (hero, durante el juego)
y el de la Card No. 001 (ficha del DT, desde el viernes). Sin esto el form valida, pero
**no envía** y le dice a la persona que no se guardó nada (nunca finge éxito). En el preview, `?demo` simula el envío.

## Qué hay que crear (lo hace quien administra ActiveCampaign)

| Qué | Detalle |
|---|---|
| **Form** "Charter Collection · Card No. 001" | Tipo inline. Al enviarse: suscribe a la lista general del club y pone la etiqueta `charter-collection-001`. Opción "Confirmación por mail" apagada (el juego no tiene pantalla de "confirmá tu mail") |
| Campo **Email** | El estándar del form |
| Campo **Consent** (texto o checkbox) | El hero manda `Yes` cuando la persona tilda "I agree to receive emails…" (el tilde es obligatorio para enviar) |
| **Form** "Charter Collection · Card No. 001 by email" | El de la ficha del DT. Igual que el anterior (mismo Email y Consent), pero pone la etiqueta `charter-card-001` |

El mail se pide **una sola vez**, en el paso "Claim your Collector Card" del panel del hero (no es un pop-up:
WordPress no deja editar lo que va en un pop-up). Aparece solo unos segundos después de la primera respuesta (si la
persona toca "Not now" no vuelve solo, pero queda a mano en el panel). La Collector se reclama solo ahí, durante el
juego: ninguna otra página lleva a reclamarla. No hay apuesta (se sacó el 05/11): después de la cuarta pregunta se
espera el reveal.

## Reemplazos en el bloque

| Placeholder | Valor |
|---|---|
| `__AC_ACCOUNT__` | Subdominio de la cuenta: `xxxx` de `xxxx.activehosted.com` |
| `__AC_COLLECTION_FORM__` | ID del form de la Collector (hero) |
| `__AC_CARD_FORM__` | ID del form de la Card No. 001 (ficha del DT) |
| `__AC_FIELD_CONSENT__` | Nombre del campo Consent en el form, tal cual: `field[NN]` |

`field[NN]` se ve en el código de inserción del form ("Embed" → HTML completo). El envío es el mismo POST directo a
`proc.php` que usan el newsletter y `/school` (`custom/ac-forms/ac-forms.js`).

## Mails que promete el hero

El paso de reclamo dice "Your Collector Card, now and in your inbox", "An email when each new clue unlocks" y "A
reminder on reveal day" (sin la de las pistas si ya contestó las cuatro). Se arman como automatización sobre la
etiqueta `charter-collection-001`:

| Cuándo | Mail |
|---|---|
| Apenas reclama | "Your Collector Card" con la imagen de la Inaugural Collector (una sola imagen para todos: el nombre y la foto quedan en el dispositivo de la persona) y link a la home. Sin link a Mi colección mientras no esté publicada. La pantalla le dice "Your card is on its way to …". La imagen sale del preview: Share → "Card only", sin foto ni nombre |
| Martes, miércoles y jueves, 10:00 AM ET | "Today's clue is live" con link a la home (no incluye la pista: se ve jugando) |
| Viernes, 10:00 AM ET | "Card No. 001 is revealed" con link a la home |

Quien se suma un miércoles recibe solo los mails que faltan. Ningún mail menciona el nombre del DT antes del viernes.

## Mail de la ficha del DT

En la ficha (`t01-coach`), al pie, "Want it? Leave your email and we'll send Card No. 001 to your inbox." con el mail
y el mismo tilde de consentimiento. Al enviar: "On its way · We sent Card No. 001 to …". Automatización sobre la
etiqueta `charter-card-001`:

| Cuándo | Mail |
|---|---|
| Apenas lo pide | "Card No. 001" con la imagen de la carta revelada del Head Coach y link a su ficha. Sin link a Mi colección: la carta se va a sumar a la colección cuando esté disponible |

## Lo que ActiveCampaign no resuelve

- **Founding Member:** el reclamo del hero no lo identifica (decidido con el dev, 06/11): todos reclaman como
  Inaugural Collector. Cruzar el mail con la base de socios fundadores necesita la API key, que no puede ir en el
  navegador; lo hace el servidor de Mi colección (ver `docs/charter-collection-server.md`) y, cuando responde
  `founder`, la carta se ajusta sola a Founding Member. En el preview: Mi colección con `?me=founder`.

## Errores que ve la persona

| Caso | Mensaje |
|---|---|
| Form sin configurar | "Something went wrong on our end. Nothing was saved, please try again later." |
| Sin conexión o ActiveCampaign no responde en 15 s | "We could not reach our server. Check your connection and try again." |
| ActiveCampaign rechaza el envío | El mensaje que devuelve ActiveCampaign |

En todos los casos el botón vuelve a habilitarse y el juego sigue: el hero nunca queda roto.
