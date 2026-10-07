/**
 * PSLSC Soccer School — config de la landing (/school).
 *
 * Es el ÚNICO archivo que hay que tocar para conectar ActiveCampaign y analytics.
 * Mientras activeCampaign no esté completo, el formulario NO envía: muestra un error y deja un
 * console.error. Nunca finge éxito. Ver school/README.md → "Conectar ActiveCampaign".
 */
export const CONFIG = {
  activeCampaign: {
    // Subdominio de la cuenta (https://<account>.activehosted.com), del código de embed de AC.
    account: '',
    // Id del form "Soccer School — Pre-registration" (el N de embed.php?id=N).
    formId: '',
    // Campo nuestro → `name` del campo en el form de AC (copiar del export "full embed").
    fields: {
      parentName: 'fullname',   // campo estándar "Full Name" de AC
      email: 'email',           // campo estándar de AC
      kidsAges: '',             // checkbox con opciones 5…13 (valores "5"…"13"), p. ej. 'field[50][]'
      consent: '',              // checkbox de consentimiento, p. ej. 'field[51][]'
      utm_source: '',           // ocultos, p. ej. 'field[52]'
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
    },
  },
  analytics: {
    metaPixelId: '',            // vacío = no se carga el pixel
    ga4Id: '',                  // vacío = no se carga GA4 (formato 'G-XXXXXXX')
  },
};
