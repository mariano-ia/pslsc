/* Envío de la respuesta (va / no va) de un jugador seleccionado.
   HANDOFF: conectar el envío acá. Recibe { name, email, dni, position, terms, waiver, clause8a, clause8b, answer: 'si' | 'no', sentAt } y tiene que devolver una
   Promise que se resuelve si quedó guardado y se rechaza si no. El mail es el dato para cruzar con la lista de
   seleccionados (se pide el mismo con el que se anotaron). dni (solo números), position (texto libre, una o más
   posiciones), terms (aceptó los términos y condiciones de /tryouts), waiver (aceptó el consentimiento y deslinde),
   clause8a y clause8b (autorizaciones separadas) solo se exigen en el 'si'; en el 'no' llegan como vengan. Si alguien responde dos veces, vale la última respuesta.
   Mientras no esté conectado, NO envía y NO finge éxito: muestra un error y deja un console.error.
   Para revisar el diseño de las dos respuestas sin backend, abrir la página con ?demo (ej. /tryouts/confirmar/?demo). */
function sendAnswer(data){
  if(/[?&]demo\b/.test(location.search)) return Promise.resolve({demo:true});
  return Promise.reject(new Error('Envío de la respuesta pendiente de implementar (ver HANDOFF en confirmar.js)'));
}

(function(){
  var form=document.getElementById('confirmar'), nm=document.getElementById('c-name'), ml=document.getElementById('c-mail'),
      ds=document.getElementById('c-dni'), ps=document.getElementById('c-pos'), tm=document.getElementById('c-terms'),
      wv=document.getElementById('c-waiver'), c8a=document.getElementById('c-8a'), c8b=document.getElementById('c-8b'),
      err=document.getElementById('c-err'), btns=form.querySelectorAll('.cf-btns button'), answer=null;
  function clear(){err.hidden=true;[nm,ml,ds,ps].forEach(function(el){el.classList.remove('err');});[tm,wv,c8a,c8b].forEach(function(el){el.parentNode.classList.remove('bad');});}
  [nm,ml,ds,ps,tm,wv,c8a,c8b].forEach(function(el){el.addEventListener('input',clear);el.addEventListener('change',clear);});
  function fail(msg,el){err.textContent=msg;err.hidden=false;el.classList.add('err');el.focus();}
  function failCk(msg,el){err.textContent=msg;err.hidden=false;el.parentNode.classList.add('bad');el.focus();}
  // Qué botón se tocó (más compatible que event.submitter).
  btns.forEach(function(b){b.addEventListener('click',function(){answer=b.value;});});
  function show(id){
    ['f-form','f-si','f-no'].forEach(function(x){document.getElementById(x).hidden=(x!==id);});
    form.scrollIntoView({behavior:'smooth',block:'start'});
  }
  form.addEventListener('submit',function(e){
    e.preventDefault(); clear();
    var name=nm.value.trim(), mail=ml.value.trim(), dni=ds.value.replace(/[.\s]/g,''), pos=ps.value.trim();
    if(!name) return fail('Falta tu nombre y apellido.',nm);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return fail('Revisá el mail: parece que falta algo.',ml);
    if(answer!=='si'&&answer!=='no') return;
    if(answer==='si'&&!/^\d{7,8}$/.test(dni)) return fail('Revisá tu DNI: tienen que ser 7 u 8 números.',ds);
    if(answer==='si'&&!pos) return fail('Contanos en qué posición jugás.',ps);
    if(answer==='si'&&!tm.checked) return failCk('Para confirmar, aceptá los términos y condiciones.',tm);
    if(answer==='si'&&!wv.checked) return failCk('Para confirmar, aceptá el consentimiento y deslinde de responsabilidad.',wv);
    if(answer==='si'&&!c8a.checked) return failCk('Para confirmar, autorizá la cláusula 8(a).',c8a);
    if(answer==='si'&&!c8b.checked) return failCk('Para confirmar, autorizá la cláusula 8(b).',c8b);
    btns.forEach(function(b){b.disabled=true;});
    sendAnswer({name:name, email:mail, dni:dni, position:pos, terms:tm.checked, waiver:wv.checked, clause8a:c8a.checked, clause8b:c8b.checked, answer:answer, sentAt:new Date().toISOString()}).then(function(){
      var pane=document.getElementById(answer==='si'?'f-si':'f-no'), first=name.split(/\s+/)[0];
      pane.querySelector('.cf-name').textContent=pane.querySelector('.cf-name').getAttribute('data-tpl').replace('{n}',first);
      pane.querySelector('.cf-mail').textContent=mail;
      show(pane.id);
    }).catch(function(x){
      console.error('[tryouts/confirmar]', x);
      err.textContent='No pudimos guardar tu respuesta. Probá de nuevo en un rato.'; err.hidden=false;
    }).then(function(){ btns.forEach(function(b){b.disabled=false;}); });
  });
  // Cambiar la respuesta: vuelve al form con los datos cargados.
  document.querySelectorAll('.cf-again').forEach(function(b){
    b.addEventListener('click',function(){ show('f-form'); btns[0].focus({preventScroll:true}); });
  });
  // Consentimiento y deslinde de responsabilidad: dialog sin salir del form (no se pierde lo cargado). También con #deslinde.
  // (Los términos y condiciones son las bases de /tryouts y se abren en otra pestaña: no pasan por acá.)
  var waiver=document.getElementById('deslinde');
  function openWaiver(){ if(!waiver.open) waiver.showModal(); waiver.querySelector('.bases-body').scrollTop=0; }
  document.querySelectorAll('.waiver-open').forEach(function(a){
    a.addEventListener('click',function(e){e.preventDefault();openWaiver();});
  });
  waiver.querySelectorAll('.bases-x,.bases-ok').forEach(function(b){b.addEventListener('click',function(){waiver.close();});});
  waiver.addEventListener('click',function(e){if(e.target===waiver) waiver.close();});
  if(location.hash==='#deslinde') openWaiver();
})();
