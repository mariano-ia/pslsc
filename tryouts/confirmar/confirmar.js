/* Envío de la respuesta (va / no va) de un jugador seleccionado.
   HANDOFF: conectar el envío acá. Recibe { name, email, position, terms, answer: 'si' | 'no', sentAt } y tiene que devolver una
   Promise que se resuelve si quedó guardado y se rechaza si no. El mail es el dato para cruzar con la lista de
   seleccionados (se pide el mismo con el que se anotaron). position (texto libre, una o más posiciones) y
   terms (aceptó los términos y condiciones) solo se exigen en el 'si'; en el 'no' llegan como vengan. Si alguien responde dos veces, vale la última respuesta.
   Mientras no esté conectado, NO envía y NO finge éxito: muestra un error y deja un console.error.
   Para revisar el diseño de las dos respuestas sin backend, abrir la página con ?demo (ej. /tryouts/confirmar/?demo). */
function sendAnswer(data){
  if(/[?&]demo\b/.test(location.search)) return Promise.resolve({demo:true});
  return Promise.reject(new Error('Envío de la respuesta pendiente de implementar (ver HANDOFF en confirmar.js)'));
}

(function(){
  var form=document.getElementById('confirmar'), nm=document.getElementById('c-name'), ml=document.getElementById('c-mail'),
      ps=document.getElementById('c-pos'), tm=document.getElementById('c-terms'),
      err=document.getElementById('c-err'), btns=form.querySelectorAll('.cf-btns button'), answer=null;
  function clear(){err.hidden=true;[nm,ml,ps].forEach(function(el){el.classList.remove('err');});tm.parentNode.classList.remove('bad');}
  [nm,ml,ps,tm].forEach(function(el){el.addEventListener('input',clear);el.addEventListener('change',clear);});
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
    var name=nm.value.trim(), mail=ml.value.trim(), pos=ps.value.trim();
    if(!name) return fail('Falta tu nombre y apellido.',nm);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return fail('Revisá el mail: parece que falta algo.',ml);
    if(answer!=='si'&&answer!=='no') return;
    if(answer==='si'&&!pos) return fail('Contanos en qué posición jugás.',ps);
    if(answer==='si'&&!tm.checked) return failCk('Para confirmar, aceptá los términos y condiciones.',tm);
    btns.forEach(function(b){b.disabled=true;});
    sendAnswer({name:name, email:mail, position:pos, terms:tm.checked, answer:answer, sentAt:new Date().toISOString()}).then(function(){
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
  // Términos y condiciones: dialog sin salir del form (no se pierde lo cargado). También con #terminos.
  var terms=document.getElementById('terminos');
  function openTerms(){ if(!terms.open) terms.showModal(); terms.querySelector('.bases-body').scrollTop=0; }
  document.querySelectorAll('.terms-open').forEach(function(a){
    a.addEventListener('click',function(e){e.preventDefault();openTerms();});
  });
  terms.querySelectorAll('.bases-x,.bases-ok').forEach(function(b){b.addEventListener('click',function(){terms.close();});});
  terms.addEventListener('click',function(e){if(e.target===terms) terms.close();});
  if(location.hash==='#terminos') openTerms();
})();
