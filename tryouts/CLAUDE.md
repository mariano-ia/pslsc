# /tryouts · contexto para trabajar esta página

Landing de inscripción a las **pruebas de jugadores de Port St. Lucie SC en Buenos Aires**.
Domingo 8 de noviembre de 2026 · jugadores de 18 a 25 años · sin costo. El detalle técnico está en `README.md`.

## De dónde viene

- Nace de un reel del influencer Valentín Scarsini (@elscarso) que presentó al club como "uno de los clubes más
  nuevos del mundo". La respuesta fue tan grande que el club organiza pruebas con quienes se anoten.
- Se diseñó primero en un lienzo de diseño (Claude, artefacto "Wireframes · Micrositio del Estadio PSLSC",
  página "Tryouts Argentina · /tryouts") y después se pasó a esta carpeta. **Desde ahora la fuente de verdad es este código.**

## Reglas de contenido (no romper)

- **Sin promesas.** Es una evaluación para que el staff vea jugar. Nunca prometer lugar en el plantel, contrato
  ni pase a Estados Unidos (regla del brief de comunicación).
- **Copy en español rioplatense (voseo)**, con algo de inglés solo en kickers y títulos cortos o palabras que el
  fútbol ya usa: "No promises. No shortcuts.", "Show us your game.", "How it works", "Matchday", "Kit list", "FAQ".
  Todo lo que hay que entender para anotarse (form, legales, respuestas) va en español.
- En pantalla se dice **"pruebas"**, no "tryouts" (la URL sigue siendo `/tryouts`). Barra: "Pruebas oficiales".
- **Apto médico obligatorio**, pero **no se sube en el form** (decisión de UX: menos fricción, datos de salud solo de
  los seleccionados). Se avisa en tres lugares: línea arriba del botón, primera pregunta frecuente y lista de qué llevar.
  A los seleccionados se lo pide el mail de ActiveCampaign.

## Formulario

- Campos: nombre y apellido\*, edad\* (selector 18 a 25) y posición\* (Arquero, Defensor, Mediocampista, Delantero)
  en una misma fila, mail\*, experiencia / trayectoria previa (opcional).
- El mail es el dato prioritario para el club.
- **Bases y condiciones:** son las del documento legal "Bases y condiciones de preinscripción y participación"
  (puntos 1 a 12), en el `<dialog id="bases">` de `index.html`. Se abren sin salir del form (no se pierde lo cargado)
  y también con `/tryouts/#bases`. Los `[corchetes]` resaltados son datos que el club todavía tiene que completar.
- **Casillas:** el punto 13 del documento no va en las bases: son las 4 casillas del form, separadas y sin
  preseleccionar. Obligatorias: bases y condiciones, datos personales y apto médico. **Opcional:** uso de imagen
  (el punto 10 la define como "aceptación separada"). El texto de cada casilla está resumido para que se acepte rápido;
  el texto completo está en las bases.
- Envío: **pendiente** conectar ActiveCampaign en `tryouts.js > sendLead` con el mismo patrón que `/school`
  (`school/README.md`, `school/school.js`). Sin config no envía y no finge éxito. `?demo` muestra la confirmación.

## Confirmación de los seleccionados (`/tryouts/confirmar/`)

- Una sola página igual para todos (decisión de Mariano, 26-oct-2026: nada de links personalizados). Nombre y apellido +
  mail, aclarando que sean **los mismos con los que se anotaron**, y dos botones: **"Sí, voy a ir"** / **"No puedo ir"**.
- Título: **"Quedaste seleccionado para la prueba."** ("para la prueba" para que no se lea como seleccionado para el club),
  con una línea chica debajo: es para quienes recibieron el mail (el link es el mismo para todos y puede circular).
  La pregunta **"¿Te vemos el 8 de noviembre?"** es el título de la tarjeta, pegada a los dos botones, y es neutral a
  propósito: el "no" le sirve al club tanto como el "sí".
- Sede: **Benavídez**, provincia de Buenos Aires. Si confirman, les llega otro mail con el grupo asignado y el horario.
- El apto médico se avisa **antes** de responder (es requisito para ir) y se repite en la respuesta del "sí".
- En el "no" no se dice "nos vemos en la próxima" (sin promesas): se agradece el aviso y, en condicional, si el club
  organiza otra prueba, les escribe.
- Se puede cambiar la respuesta volviendo al mismo link; vale la última.
- El envío lo conecta Santi (`confirmar/confirmar.js > sendAnswer`).

## Estructura de la página

1. Barra del club (igual a `/school`, sin links para no generar fugas) con "Pruebas oficiales".
2. Hero "Pruebas en Buenos Aires" + form (CTA "Enviar solicitud").
3. "No promises. No shortcuts." · lo que es / lo que no es.
4. "Cuatro pasos hasta la cancha" + kit list.
5. "Built in Florida. Con ADN argentino." · bandera en la obra + datos (2025, 2027, 6,000 asientos).
6. Preguntas frecuentes (la primera, abierta: apto médico).
7. Footer: el mismo del sitio (`native/home/09-cierre-footer.html`).

## Estética

Misma del sitio del club: negro `#0C0C0A`, aquamarine `#AAF6E6`, crema `#F3F0EA`, Red Marine `#FF0033` solo como
acento fino. Ferryman en el título del hero, Druk en títulos de sección, Druk Text Wide en kickers y botones,
Proxima Nova en texto. Mobile-first, breakpoint a 900px. Regla de marca: nada de naranja.

## A confirmar

Sede y horario · og:image · los `[corchetes]` de las bases (lugar y horario, mail de contacto y de privacidad,
fecha límite de preinscripción, medio de confirmación, presentación del apto y cobertura, apoyo y gastos de viaje).
