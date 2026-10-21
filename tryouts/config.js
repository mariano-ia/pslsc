/* /tryouts · config. Es lo único que hay que tocar para conectar ActiveCampaign.
   Mientras esté vacío, el form valida pero no envía (ver tryouts.js > sendLead). */
window.TRYOUTS_CONFIG = {
  activeCampaign: {
    account: '',   // subdominio: https://<account>.activehosted.com
    formId: '',    // id del form "Tryouts Argentina 2026" (embed.php?id=N)
    fields: {      // campo nuestro -> name del campo en AC
      name: 'fullname',
      email: 'email',
      age: '',         // 18 a 25
      position: '',    // Arquero / Defensor / Mediocampista / Delantero
      experience: '',  // texto libre, opcional
      // Casillas de las bases (punto 13). Las 3 primeras siempre llegan en true; image puede ser false.
      terms: '',       // acepta bases y condiciones
      privacy: '',     // consiente tratamiento de datos personales
      health: '',      // consiente tratamiento del apto médico
      image: '',       // autoriza uso de imagen (opcional)
    },
  },
};
