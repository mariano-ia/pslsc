# Sede 2027 · datos a confirmar

La página del estadio temporal (`pages/sede.html`, bloques `native/sede/v01…v08`) está armada con
**datos ficticios** hasta que el club confirme la sede. Esta es la lista completa de lo que hay que
reemplazar y dónde está. En el código, cada bloque lo marca con `HANDOFF:` en su comentario de cabecera.

## Confirmados (no tocar)
- El estadio propio (Walton & One) abre **a principios de 2028** y tiene **6,000 asientos**.
- Ticket Deposit de **$35**, se aplica al saldo al elegir asiento.

## Ficticios (reemplazar)

| Dato | Valor de ejemplo | Dónde |
|---|---|---|
| Nombre de la sede | Treasure Coast Field | v01 (lead + ticket), v04 (próximo partido + filas de local), v05 (lead), v06 (SVG + aria-label), v07 (respuesta 1) |
| Ciudad | Fort Pierce, FL | v01 (ticket), v04 (próximo partido), v06 (dirección) |
| Desde cuándo | March 2027 | v01 (lead + ticket), v04 (vacío de Results) |
| Capacidad · distancia · partidos de local · estacionamiento | 5,200 · 25’ · 15 · 1,400 | v02 |
| Seis capítulos del recorrido (texto de cada ficha) | Aerial view … Family zone | v03 (fichas `data-tour-info`) |
| Segundo de inicio de cada capítulo | todos en `0` | v03 (`data-start` de cada botón) |
| Liga, rivales, fechas, horarios, estadios visitantes | USL League One · Gulf Coast United, Carolina Harbor FC, Bayou City SC, Lakeshore FC, Pine Valley SC | v04 (próximo partido + 5 filas) |
| Escudo del rival | placeholder "GCU" | v04 (`.venue-next__opp`; sumar el escudo a `assets/crests/`) |
| Zonas y precios | Supporters $18 · Family $22 · Sideline $30 · Hospitality $85 | v05 (botones + fichas `data-zone-info`) |
| Venta de entradas sueltas | On sale January 2027 | v05 (Single match) |
| Dirección | 2400 Harbor Rd, Fort Pierce, FL 34950 | v06 (texto + link de Google Maps) |
| Tiempo de viaje | 25 MIN | v02, v06 (SVG), v07 (respuesta 4) |
| Estacionamiento · puertas · bolsos · accesibilidad | Lot B $10 · 90 min · clear bag · secciones 104 y 112 | v06 (tarjetas) |
| Shuttle y salida de la I-95 | Civic Center, exit 129 | v07 (respuesta 4) |
| Avance de obra | 38% | v08 |

## Pendientes de contenido o destino
- **Video del drone de la sede** (marketing): hoy hero (v01) y recorrido (v03) usan `assets/videos/hero-v2.mp4`
  (la obra del estadio propio). Al llegar: cambiar video + poster en los dos bloques y sacar las etiquetas
  "Reference footage".
- **¿El Ticket Deposit aplica a la sede?** Confirmar con el club. Hoy la FAQ (v07, pregunta 3) dice que sí.
- **"Visit the stadium site"** (v08): deshabilitado hasta que el micrositio del Groundbreaking esté online.
- **Links sin destino**: "Add to calendar" y "Full schedule" (v04). "Buy tickets" y "Single match" (v05) van a
  la home de la ticketera (`tickets.portstluciesc.com`); cambiar por el evento real.
- **Permalink de la página**: la nav apunta a `/2027-venue/` (ver `native/home/00-nav.html`).
