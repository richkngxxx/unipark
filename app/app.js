'use strict';
// Cobertura real: ../data/coverage_es.json (verificada a fecha 2026-10). Sin tarifas inventadas.
let ZONES=[],DATA_ERR='';
const DUR=[15,30,60,90,120,180,240];
const K='unipark.v1';
const S=Object.assign({vehicles:[],sessions:[],history:[],pending:null},JSON.parse(localStorage.getItem(K)||'{}'));
const save=()=>localStorage.setItem(K,JSON.stringify(S));
let tab='park',zone=null,dur=60,veh=null,geoMsg='';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const eur=n=>n==null?'—':n.toFixed(2).replace('.',',')+' EUR';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
// Estimación solo con tarifa oficial verificada (tramos [minutos, EUR]); si no, null.
function maxMin(z){return z&&z.tariff?z.tariff.tiers[z.tariff.tiers.length-1][0]:240}
function price(z,m){if(!z||!z.tariff)return null;const t=z.tariff.tiers.find(x=>x[0]>=m);return t?t[1]:null}
function zById(id){return ZONES.find(x=>x.id===id)||{id,city:'Ciudad (datos antiguos)',scheme:'',apps:[],confidence:'unverified',tariff_url:'',source_url:''}}
const isV=z=>z&&z.confidence==='verified';
const badge=z=>isV(z)?'<span class="chip ok">Verificada</span>':'<span class="chip warn">En verificación</span>';
const fmtT=ms=>{ms=Math.max(0,ms);const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':':'')+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0')};
const fmtD=t=>new Date(t).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'});
function toast(t){const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',2500)}
// Matrícula: actual 1234BCD (sin vocales, Ñ ni Q) o provincial antigua (M1234AB)
function normPlate(p){return p.toUpperCase().replace(/[\s-]/g,'')}
function validPlate(p){return /^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/.test(p)||/^[A-Z]{1,2}\d{4}[A-Z]{1,2}$/.test(p)}
function dist(a,b,c,d){const r=x=>x*Math.PI/180,R=6371,dl=r(c-a),dn=r(d-b);const h=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function detect(){if(!navigator.geolocation){geoMsg='Geolocalización no disponible. Elige la ciudad manualmente.';render();return}
 geoMsg='Buscando tu ubicación…';render();
 navigator.geolocation.getCurrentPosition(p=>{const{latitude:a,longitude:b}=p.coords;if(!ZONES.length)return;let best=ZONES[0],bd=1e9;ZONES.forEach(z=>{const d=dist(a,b,z.lat,z.lng);if(d<bd){bd=d;best=z}});zone=best;geoMsg=`Ciudad más cercana: ${best.city} (a ${Math.round(bd)} km).`+(bd>30?' Estás lejos de las ciudades cubiertas; revisa la selección.':'');render()},
 ()=>{geoMsg='No se pudo obtener tu ubicación. Elige la ciudad manualmente.';render()},{timeout:10000,maximumAge:60000})}
function defVeh(){return S.vehicles.find(v=>v.def)||S.vehicles[0]||null}
function appCard(a,i){return `<div class="app"><strong>${esc(a.name)}</strong><div class="row">
 ${a.website?`<button data-a="checkout" data-i="${i}">Pagar en ${esc(a.name)} ↗</button><a class="b b2" href="${esc(a.website)}" target="_blank" rel="noopener">Web oficial</a>`:''}
 ${a.ios?`<a class="b b2" href="${esc(a.ios)}" target="_blank" rel="noopener">App Store</a>`:''}
 ${a.android?`<a class="b b2" href="${esc(a.android)}" target="_blank" rel="noopener">Google Play</a>`:''}</div></div>`}
function vParkView(){
 if(DATA_ERR)return `<div class="card"><p class="err">${esc(DATA_ERR)}</p></div>`;
 if(!ZONES.length)return '<div class="card"><p>Cargando ciudades…</p></div>';
 const v=veh&&S.vehicles.find(x=>x.id===veh)?veh:(defVeh()||{}).id;veh=v;
 if(S.pending){const p=S.pending,z=zById(p.zone);return `<div class="card"><h2>¿Has completado el pago?</h2><p>Hemos abierto <strong>${esc(p.app)}</strong> en otra pestaña para ${esc(p.plate)} · ${p.min} min · ${esc(z.city)}.</p><p class="mu">UniPark no puede comprobar el pago. Solo confirma si lo has hecho en la app o web oficial.</p><div class="row"><button class="bok" data-a="paid">Ya he pagado</button><button class="b2" data-a="notpaid">Aún no he pagado</button></div><p><a class="mu" href="${esc(p.url)}" target="_blank" rel="noopener">Volver a abrir ${esc(p.app)}</a></p></div>`}
 const z=zone,grp=c=>ZONES.filter(x=>x.confidence===c);
 const opts=(l,c)=>{const g=grp(c);return g.length?`<optgroup label="${l}">${g.map(x=>`<option value="${x.id}" ${z&&z.id===x.id?'selected':''}>${esc(x.city)}${x.scheme?' · '+esc(x.scheme):''}</option>`).join('')}</optgroup>`:''};
 const p=z?price(z,dur):null;
 return `<div class="card"><h2>1. Ciudad</h2><button class="b2" data-a="geo">📍 Detectar mi ciudad</button><p class="mu">${esc(geoMsg)}</p>
 <label class="mu">O elige manualmente</label><select id="zsel"><option value="">— Ciudad —</option>${opts('Verificadas','verified')}${opts('En verificación (datos parciales)','partial')}${opts('En verificación (sin confirmar)','unverified')}</select>
 ${z?`<div class="row">${badge(z)}<span class="mu">${esc(z.scheme||'Sistema no confirmado')}${z.operator?' · Operador: '+esc(z.operator):''}</span></div>${z.notes?`<p class="mu">${esc(z.notes)}</p>`:''}${z.source_url?`<p class="mu"><a href="${esc(z.source_url)}" target="_blank" rel="noopener">Fuente</a></p>`:''}`:''}</div>
 <div class="card"><h2>2. Vehículo</h2>${S.vehicles.length?`<select id="vsel">${S.vehicles.map(x=>`<option value="${x.id}" ${x.id===v?'selected':''}>${esc(x.plate)}${x.nick?' · '+esc(x.nick):''}</option>`).join('')}</select>`:`<p>No tienes vehículos. <button class="b2" data-t="vehicles">Añadir vehículo</button></p>`}</div>
 <div class="card"><h2>3. Duración</h2><div class="chips">${DUR.filter(d=>d<=maxMin(z)).map(d=>`<button class="chip ${d===dur?'on':''}" data-d="${d}">${d<60?d+' min':(d/60)+' h'}</button>`).join('')}</div>
 ${z&&isV(z)&&p!=null?`<p class="mu">Estimación según tarifa oficial (${esc(z.tariff.label)})</p><div class="price">${eur(p)}</div><p class="mu">Puede haber comisión de la app de pago. Comisión UniPark (beta): 0,00 EUR.</p>`:z?(z.tariff_url?`<p><a class="b b2" href="${esc(z.tariff_url)}" target="_blank" rel="noopener">Ver tarifas oficiales ↗</a></p>`:'<p class="mu">Tarifa oficial no disponible todavía. Consulta el parquímetro o la app oficial.</p>'):'<p class="mu">Elige una ciudad.</p>'}</div>
 <div class="card"><h2>4. Paga en una app oficial</h2>${z?(z.apps.length?(v?'':'<p class="mu">Añade un vehículo para iniciar el temporizador.</p>')+z.apps.map(appCard).join(''):'<p class="mu">No hay app oficial confirmada para esta ciudad. Usa el parquímetro.</p>'):'<p class="mu">Elige una ciudad para ver las apps aceptadas.</p>'}
 <p class="mu">UniPark no cobra ni valida el aparcamiento y no está afiliada a ningún operador ni ayuntamiento.</p></div>`}
function sessCard(s){const z=zById(s.zone),ap=s.app||'la app oficial',au=s.url||'#',left=s.end-Date.now(),cls=left<=0?'exp':left<10*60e3?'soon':'';
 return `<div class="card"><div class="row"><strong>${esc(s.plate)}</strong><span class="sp mu">${esc(z.city)} · ${esc(z.zone)}</span></div>
 <div class="cd ${cls}" data-cd="${s.id}">${left<=0?'Caducado':fmtT(left)}</div><p class="mu">${left<=0?'El tiempo ha terminado. Mueve el vehículo o paga de nuevo en la app oficial.':left<10*60e3?'Termina pronto.':''} Fin: ${fmtD(s.end)} · ${s.cost!=null?'Estimado: '+eur(s.cost):'Sin estimación de precio'}</p>
 <div class="row"><select data-ext="${s.id}" style="width:auto">${[15,30,60].map(m=>`<option value="${m}">+${m} min</option>`).join('')}</select><button class="b2" data-a="extend" data-id="${s.id}">Ampliar</button><button class="bd" data-a="finish" data-id="${s.id}">Finalizar</button></div>
 <p class="mu">Ampliar aquí solo actualiza tu temporizador: amplía también en <a href="${esc(au)}" target="_blank" rel="noopener">${esc(ap)}</a>.</p></div>`}
function vActive(){return ('Notification' in window&&Notification.permission==='default'?`<div class="card"><p>¿Quieres avisos antes de que caduque? (solo con la app abierta)</p><button class="b2" data-a="notif">Activar avisos</button></div>`:'')+
 (S.sessions.length?S.sessions.map(sessCard).join(''):'<div class="card"><p>No hay sesiones activas.</p></div>')}
function vVehicles(){return `<div class="card"><h2>Añadir vehículo</h2><form id="vf"><label class="mu">Matrícula</label><input id="pl" placeholder="1234ABC" autocomplete="off" maxlength="10"><div id="perr" class="err"></div><label class="mu">Apodo</label><input id="nk" placeholder="Mi coche"><label class="mu">Color</label><input id="co" placeholder="Blanco"><button type="submit">Guardar</button></form></div>`+
 S.vehicles.map(v=>`<div class="card row"><div class="sp"><strong>${esc(v.plate)}</strong> ${v.def?'<span class="chip on">Predeterminado</span>':''}<div class="mu">${esc(v.nick||'')} ${v.color?'· '+esc(v.color):''}</div></div>${v.def?'':`<button class="b2" data-a="def" data-id="${v.id}">Predeterminar</button>`}<button class="bd" data-a="del" data-id="${v.id}">Borrar</button></div>`).join('')}
function vHistory(){return S.history.length?`<div class="card row"><span class="sp mu">${S.history.length} tickets finalizados (guardados en este dispositivo)</span><button class="b2" data-a="clearh">Borrar historial</button></div>`+S.history.slice().reverse().map(h=>{const z=zById(h.zone);return `<div class="card"><div class="row"><strong>${esc(h.plate)}</strong><span class="sp mu">${esc(z.city)}${h.app?' · '+esc(h.app):''}</span><span>${h.cost!=null?eur(h.cost):''}</span></div><p class="mu">${fmtD(h.start)} → ${fmtD(h.finished)} · ${h.min} min · ${h.cost!=null?'importe estimado (tarifa oficial)':'sin estimación'}</p></div>`}).join(''):'<div class="card"><p>Aún no tienes tickets finalizados.</p></div>'}
function render(){document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
 $('#view').innerHTML={park:vParkView,active:vActive,vehicles:vVehicles,history:vHistory}[tab]();
 const zs=$('#zsel');if(zs)zs.onchange=()=>{zone=ZONES.find(x=>x.id===zs.value)||null;if(zone&&dur>maxMin(zone))dur=maxMin(zone);render()};
 const vs=$('#vsel');if(vs)vs.onchange=()=>{veh=vs.value};
 const vf=$('#vf');if(vf)vf.onsubmit=e=>{e.preventDefault();const p=normPlate($('#pl').value);if(!validPlate(p)){$('#perr').textContent='Matrícula no válida. Ejemplo: 1234BCD (4 números y 3 consonantes).';return}
  if(S.vehicles.some(v=>v.plate===p)){$('#perr').textContent='Ese vehículo ya existe.';return}
  S.vehicles.push({id:uid(),plate:p,nick:$('#nk').value.trim(),color:$('#co').value.trim(),def:!S.vehicles.length});save();toast('Vehículo guardado');render()}}
function notify(t,b){try{if('Notification' in window&&Notification.permission==='granted'){navigator.serviceWorker&&navigator.serviceWorker.ready.then(r=>r.showNotification(t,{body:b,icon:'icon.svg'})).catch(()=>new Notification(t,{body:b}))}}catch(e){}toast(t)}
document.addEventListener('click',e=>{const b=e.target.closest('button,[data-t]');if(!b)return;
 if(b.dataset.t){tab=b.dataset.t;render();return}
 if(b.dataset.d){dur=+b.dataset.d;render();return}
 const a=b.dataset.a,id=b.dataset.id;
 if(a==='geo')detect();
 if(a==='checkout'){const ap=zone&&zone.apps[+b.dataset.i];if(!ap)return;const v=S.vehicles.find(x=>x.id===veh);window.open(ap.website,'_blank','noopener');if(!v){toast('Añade un vehículo para guardar la sesión');return}S.pending={zone:zone.id,plate:v.plate,min:dur,cost:isV(zone)?price(zone,dur):null,app:ap.name,url:ap.website};save();render()}
 if(a==='paid'){const p=S.pending,now=Date.now();S.sessions.push({id:uid(),zone:p.zone,app:p.app,url:p.url,plate:p.plate,min:p.min,cost:p.cost,start:now,end:now+p.min*60e3,warned:false});S.pending=null;save();tab='active';toast('Temporizador iniciado');render()}
 if(a==='notpaid'){S.pending=null;save();toast('Sin cambios: no se ha iniciado ninguna sesión');render()}
 if(a==='extend'){const s=S.sessions.find(x=>x.id===id),m=+document.querySelector(`[data-ext="${id}"]`).value,z=zById(s.zone);s.end=Math.max(s.end,Date.now())+m*60e3;s.min+=m;const np=isV(z)?price(z,s.min):null;s.cost=np;s.warned=false;s.expN=false;save();toast(`+${m} min. Recuerda ampliar también en ${s.app||'la app oficial'}`);if(s.url)window.open(s.url,'_blank','noopener');render()}
 if(a==='finish'){const i=S.sessions.findIndex(x=>x.id===id);if(i<0)return;const s=S.sessions.splice(i,1)[0];s.finished=Math.min(Date.now(),s.end);S.history.push(s);save();toast('Sesión finalizada y guardada en el historial');render()}
 if(a==='notif'&&'Notification' in window)Notification.requestPermission().then(render);
 if(a==='def'){S.vehicles.forEach(v=>v.def=v.id===id);save();render()}
 if(a==='del'&&confirm('¿Borrar este vehículo?')){S.vehicles=S.vehicles.filter(v=>v.id!==id);if(S.vehicles.length&&!S.vehicles.some(v=>v.def))S.vehicles[0].def=true;save();render()}
 if(a==='clearh'&&confirm('¿Borrar todo el historial?')){S.history=[];save();render()}});
setInterval(()=>{let ch=false;S.sessions.forEach(s=>{const left=s.end-Date.now();
 if(left<=10*60e3&&left>0&&!s.warned){s.warned=true;ch=true;notify('Tu aparcamiento termina pronto',`${s.plate}: quedan ${Math.ceil(left/60e3)} min`)}
 if(left<=0&&!s.expN){s.expN=true;ch=true;notify('Tiempo de aparcamiento caducado',`${s.plate}: el tiempo ha terminado`)}
 const el=document.querySelector(`[data-cd="${s.id}"]`);if(el){el.textContent=left<=0?'Caducado':fmtT(left);el.className='cd '+(left<=0?'exp':left<10*60e3?'soon':'')}});if(ch){save();if(tab==='active')render()}},1000);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
fetch('../data/coverage_es.json').then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{ZONES=d.cities;render()}).catch(()=>{DATA_ERR='No se pudieron cargar las ciudades. Revisa tu conexión.';render()});
render();
