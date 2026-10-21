/* Envío de la solicitud.
   HANDOFF: conectar a ActiveCampaign con el mismo patrón que /school (ver school/README.md y school/school.js).
   Mientras config.js no esté completo, el form NO envía y NO finge éxito: muestra un error y deja un console.error.
   Para revisar el diseño de la confirmación sin backend, abrir la página con ?demo (ej. /tryouts/?demo). */
function sendLead(lead){
  var cfg=(window.TRYOUTS_CONFIG||{}).activeCampaign||{};
  if(/[?&]demo\b/.test(location.search)) return Promise.resolve({demo:true});
  if(!cfg.account||!cfg.formId) return Promise.reject(new Error('ActiveCampaign sin configurar: completar tryouts/config.js'));
  return Promise.reject(new Error('Envío a ActiveCampaign pendiente de implementar (ver HANDOFF en tryouts.js)'));
}

(function(){
  var form=document.getElementById('anotate'), nm=document.getElementById('t-name'), ml=document.getElementById('t-mail'),
      age=document.getElementById('t-age'), pos=document.getElementById('t-pos'), err=document.getElementById('t-err'),
      ck={terms:document.getElementById('t-terms'), privacy:document.getElementById('t-privacy'), health:document.getElementById('t-health'), image:document.getElementById('t-image')};
  function clear(){
    err.hidden=true;[nm,ml,age,pos].forEach(function(el){el.classList.remove('err');});
    age.classList.toggle('empty',!age.value);pos.classList.toggle('empty',!pos.value);
    Object.keys(ck).forEach(function(k){ck[k].parentNode.classList.remove('bad');});
  }
  [nm,ml,age,pos,ck.terms,ck.privacy,ck.health,ck.image].forEach(function(el){el.addEventListener('input',clear);el.addEventListener('change',clear);});
  function fail(msg,el){err.textContent=msg;err.hidden=false;el.classList.add('err');el.focus();}
  function failCk(msg,el){err.textContent=msg;err.hidden=false;el.parentNode.classList.add('bad');el.focus();}
  form.addEventListener('submit',function(e){
    e.preventDefault(); clear();
    var name=nm.value.trim(), mail=ml.value.trim();
    if(!name) return fail('Falta tu nombre y apellido.',nm);
    if(!age.value) return fail('Elegí tu edad.',age);
    if(!pos.value) return fail('Elegí tu posición.',pos);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return fail('Revisá el mail: parece que falta algo.',ml);
    // Las tres primeras casillas son obligatorias; la de imagen es opcional (bases, punto 10).
    if(!ck.terms.checked) return failCk('Para enviar, aceptá las bases y condiciones.',ck.terms);
    if(!ck.privacy.checked) return failCk('Para enviar, aceptá el tratamiento de tus datos personales.',ck.privacy);
    if(!ck.health.checked) return failCk('Para enviar, aceptá el tratamiento de tu apto médico.',ck.health);
    var lead={name:name, age:age.value, position:pos.value, email:mail, experience:document.getElementById('t-exp').value.trim(),
              terms:true, privacy:true, health:true, image:ck.image.checked};
    var btn=form.querySelector('button[type=submit]'); btn.disabled=true;
    sendLead(lead).then(function(){
      document.getElementById('ok-title').textContent='Listo, '+name.split(/\s+/)[0]+'.';
      document.getElementById('ok-mail').textContent=mail;
      document.getElementById('f-form').hidden=true; document.getElementById('f-ok').hidden=false;
    }).catch(function(x){
      console.error('[tryouts]', x);
      err.textContent='No pudimos enviar tu solicitud. Probá de nuevo en un rato.'; err.hidden=false;
    }).then(function(){ btn.disabled=false; });
  });
  document.getElementById('again').addEventListener('click',function(){
    form.reset(); clear(); document.getElementById('f-ok').hidden=true; document.getElementById('f-form').hidden=false; nm.focus();
  });
  var cp=document.getElementById('copy');
  cp.addEventListener('click',function(){
    var url=location.origin+'/tryouts/';
    function done(t){cp.textContent=t;setTimeout(function(){cp.textContent='Copiar link';},1800);}
    try{navigator.clipboard.writeText(url).then(function(){done('Copiado');},function(){done(url);});}catch(x){done(url);}
  });
  document.querySelectorAll('.q button').forEach(function(b){
    b.addEventListener('click',function(){
      var q=b.parentNode, p=q.querySelector('p'), open=p.hidden;
      document.querySelectorAll('.q').forEach(function(o){o.classList.remove('on');o.querySelector('p').hidden=true;o.querySelector('button').setAttribute('aria-expanded','false');o.querySelector('i').textContent='+';});
      if(open){q.classList.add('on');p.hidden=false;b.setAttribute('aria-expanded','true');b.querySelector('i').textContent='–';}
    });
  });
  // Bases y condiciones: se abren en un dialog sin salir del form (no se pierde lo cargado). También con /tryouts/#bases.
  var bases=document.getElementById('bases');
  function openBases(id){
    if(!bases.open) bases.showModal();
    var t=id&&id!=='bases'&&document.getElementById(id);
    var body=bases.querySelector('.bases-body'); body.scrollTop=t?t.offsetTop-body.offsetTop:0;
  }
  document.querySelectorAll('.bases-open').forEach(function(a){
    a.addEventListener('click',function(e){e.preventDefault();openBases(a.getAttribute('href').slice(1));});
  });
  bases.querySelectorAll('.bases-x,.bases-ok').forEach(function(b){b.addEventListener('click',function(){bases.close();});});
  bases.addEventListener('click',function(e){if(e.target===bases) bases.close();});
  if(location.hash==='#bases') openBases('bases');
  document.querySelectorAll('a[href="#anotate"]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();form.scrollIntoView({behavior:'smooth'});});});
})();
