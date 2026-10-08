# CSS de las noticias

Desde el 28-09-2026 el CSS de la **nota individual** ya no está en el CSS adicional global del
sitio: cada nota lleva el suyo. El global solo conserva el del **archivo /news/** (la grilla de
cards), que es común a todas.

## Dónde está

En cada nota: editor de la nota → ícono de Ghostkit (o menú ⋮) → **Custom Code** → pestaña **CSS**.
Se guarda en el meta `ghostkit_custom_css` de la nota y Ghostkit lo imprime **solo en la página de
esa nota**, en el `<head>`, como `<style id="ghostkit-custom-css-inline-css">`. Verificado en vivo,
con sesión y sin sesión, en "Port St. Lucie SC Back at Soccerex Miami".

- Plantilla con comentarios: `_plantilla/noticia.css`
- La que se pega en cada nota (sin comentarios, ~5 KB): `_plantilla/noticia.min.css`

Las fuentes (Druk, Druk Text Wide, Proxima Nova) no van en la plantilla: ya están en el bloque
generado del CSS adicional global.

## Nota nueva: hay que pegarle la plantilla

**Una nota nueva nace sin estilo** (fondo blanco, títulos en la tipografía del tema, sin el hero
apilado en mobile) hasta que alguien le pegue `_plantilla/noticia.min.css` en su Custom Code → CSS.
Es el paso que no hay que olvidar al publicar.

## CSS propio de una nota

Si una nota necesita algo solo para ella, va **debajo** de la plantilla, en su mismo Custom Code, y
se deja copia en `noticias/<slug>/nota.css` con una línea de por qué.

## Cambiar el diseño de todas

Cambiar `_plantilla/noticia.css`, regenerar `noticia.min.css` y volver a pegarlo en las notas de
la lista de abajo. Ojo: si una nota tiene CSS propio debajo de la plantilla, reemplazar solo la
parte de la plantilla.

## Notas con la plantilla cargada (49) — cargadas el 28-09-2026

Todas las notas desde "Why the United Soccer League" (08-01-2026) en adelante, publicadas y
borradores. P = publicada, D = borrador.

| fecha | ID | estado | slug |
|---|---|---|---|
| 2026-01-08 | 12316 | P | why-the-united-soccer-league |
| 2026-01-16 | 12335 | P | meet-agostina-our-president |
| 2026-01-22 | 12342 | P | from-the-world-champion-argentine-national-team-to-port-st-lucie-sc-bernardo-romeo-named-sporting-director |
| 2026-02-06 | 12355 | P | this-is-our-harbor-a-place-meant-to-be-felt |
| 2026-02-27 | 12368 | P | port-st-lucie-sc-launches-official-usl-academy-with-direct-pathway-to-pro |
| 2026-03-25 | 12428 | P | sean-mcdaniel-joins-as-cro-to-lead-commercial-strategy |
| 2026-03-26 | 12447 | P | port-st-lucie-sc-teams-up-with-vixon |
| 2026-03-30 | 12424 | P | a-new-chapter-begins-academy-set-for-historic-usl-debut |
| 2026-04-02 | 12565 | P | expanded-tryouts-new-opportunity-across-additional-age-groups |
| 2026-04-07 | 12593 | P | adidas-joins-port-st-lucie-sc-as-official-kit-partner |
| 2026-04-10 | 12458 | P | academy-tryouts-registration-now-open |
| 2026-04-14 | 12620 | P | first-usl-academy-tryouts-mark-a-key-milestone-in-player-development |
| 2026-05-01 | 12645 | P | countdown-to-kickoff-reserve-team-begins-tra… |
| 2026-05-07 | 12655 | P | new-strategic-partnership-a-high-performance… |
| 2026-05-08 | 12671 | P | haiti-national-team-to-hold-world-cup-traini… |
| 2026-05-11 | 12681 | P | port-st-lucie-sc-earns-historic-first-win-in… |
| 2026-05-13 | 12818 | P | preparing-for-the-professional-debut-in-2027… |
| 2026-05-19 | 12836 | P | new-academy-tryouts-open-for-the-2026-season… |
| 2026-06-03 | 12879 | P | reserve-team-heads-to-miami-for-usl-a-league… |
| 2026-06-08 | 12896 | P | reserve-team-claims-dominant-road-victory-in… |
| 2026-06-10 | 12945 | P | experience-port-st-lucie-sc-at-freedomfest… |
| 2026-06-22 | 12990 | P | reserve-team-looks-ahead-after-road-test-aga… |
| 2026-06-24 | 13078 | P | founding-crew-be-the-first-to-get-on-board… |
| 2026-06-29 | 13177 | P | commanding-3-0-home-victory-in-usl-academy-l… |
| 2026-07-03 | 13281 | P | more-than-a-stadium-a-home-for-our-community… |
| 2026-07-06 | 13353 | P | a-community-celebration-to-remember |
| 2026-07-08 | 13415 | P | the-journey-continues-a-new-opportunity-to-j… |
| 2026-07-09 | 13425 | P | step-inside-our-future-home |
| 2026-07-10 | 13481 | P | reserve-team-hosts-miami-fc-in-usl-a-lea… |
| 2026-07-13 | 13534 | P | eyes-in-the-next-challenge |
| 2026-07-16 | 12942 | P | game-on-the-luca-fc-cup-is-here |
| 2026-07-20 | 13629 | D | founding-crew-thank-you-win-one-of-four-… |
| 2026-07-27 | 13837 | P | strengthening-preparations-for-the-profe… |
| 2026-07-27 | 13852 | P | next-match-awaits-at-home |
| 2026-07-31 | 13928 | D | supporting-local-students-at-the-back-to… |
| 2026-08-02 | 13941 | P | bernardo-romeo-represents-port-st-lucie-… |
| 2026-08-04 | 13997 | P | supporting-local-students-at-back-to-sch… |
| 2026-08-04 | 13999 | P | new-home-test-for-the-reserve-team |
| 2026-08-18 | 14191 | P | be-first-in-line-for-season-tickets |
| 2026-08-19 | 14207 | P | saturdays-of-soccer-and-community |
| 2026-08-27 | 14394 | P | u-s-soccer-visit-ahead-of-2027-professional-debut |
| 2026-09-02 | 14528 | P | why-become-a-founding-member |
| 2026-09-07 | 14543 | P | reserve-team-set-for-road-match |
| 2026-09-14 | 14605 | P | introducing-inside-port-st-lucie-sc |
| 2026-09-15 | 14612 | P | watch-parties-bring-soccer-fans-together-in-port-st-lucie |
| 2026-09-16 | 13902 | P | your-name-on-our-wall-of-history |
| 2026-09-25 | 14795 | P | port-st-lucie-sc-back-at-soccerex-miami |
| 2026-09-28 | 12351 | D | (sin slug) |
| 2026-09-28 | 14644 | D | (sin slug) |

(`…` = slug recortado en esta tabla; el ID es la referencia.)

## Notas SIN plantilla (7, de 2025)

12191, 12219, 12226, 12260, 12292, 12305 (borrador), 12308. Quedaron fuera a pedido de Santiago:
al sacar el CSS del global, **estas notas se ven con el estilo por defecto del tema**. Si se quiere
que se vean como el resto, se les pega la misma plantilla.
