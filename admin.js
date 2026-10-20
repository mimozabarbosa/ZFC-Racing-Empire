import './garage.js';

const api = window.ZFCEmpire;
const main = document.querySelector('#main');
const nav = document.querySelector('#nav');
const style = document.createElement('style');
style.textContent = `
.admin-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,.9fr);gap:16px;align-items:start}
.admin-canvas{display:block;width:100%;height:auto;aspect-ratio:1000/590;border:1px solid #39424a;background:#54724b;cursor:crosshair;touch-action:none}
.admin-controls{display:grid;gap:12px}.admin-controls label{display:grid;gap:6px;color:var(--muted);font-size:12px}
.admin-controls input,.admin-controls select{width:100%}.admin-help{font-size:12px;color:var(--muted);line-height:1.6}
.admin-swatches{display:flex;gap:8px;flex-wrap:wrap}.admin-swatch{width:32px;height:32px;padding:0;border:2px solid #fff8;border-radius:3px}.admin-swatch:hover{transform:translateY(-2px)}
.admin-preview{width:100%;height:auto;aspect-ratio:2.2/1;background:#181d21;border:1px solid #39424a}
.admin-bar{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.mode-current{border-left:3px solid var(--gold);padding:10px 12px;background:#e3263a12}
.mode-card{min-height:245px;display:flex;flex-direction:column;align-items:flex-start}.mode-card button{margin-top:auto}.mode-chip{display:inline-flex;align-items:center;gap:7px;color:var(--muted);font-size:12px}
@media(max-width:950px){.admin-layout{grid-template-columns:1fr}}
`;
 document.head.append(style);

const pages=[['modes','◈','Spielmodi'],['admin','▤','Admin-Werkstatt']];
const palette=[
  {name:'Signalrot',primary:'#e3263a',secondary:'#f1eee8'},
  {name:'Papaya',primary:'#ff8000',secondary:'#17191c'},
  {name:'Elektrisch Blau',primary:'#1689ff',secondary:'#e7edf4'},
  {name:'Racing Green',primary:'#12664f',secondary:'#d8e0dc'},
  {name:'Titanium',primary:'#aab5be',secondary:'#252b30'},
  {name:'Volt',primary:'#c8ef26',secondary:'#151a1f'}
];
let trackIndex=0;
let liveryNumber=26;
let trackPoints=[];
let drawing=false;
let drawDistance=0;
let trackDrawPending=false;

function scheduleTrackDraw(){
  if(trackDrawPending)return;
  trackDrawPending=true;
  requestAnimationFrame(()=>{trackDrawPending=false;drawTrackEditor();});
}

function installTabs(){
  if(!nav)return;
  for(const [id,icon,label] of pages){
    let button=nav.querySelector(`[data-page="${id}"]`);
    if(!button){button=document.createElement('button');button.dataset.page=id;button.innerHTML=`${icon} &nbsp; ${label}`;nav.append(button);}
    button.classList.toggle('active',api.getPage()===id);
  }
}

function modeView(){
  const state=api.getState();
  main.innerHTML=`<section class="hero"><div><div class="eyebrow">RACING EMPIRE / SPIELVARIANTEN</div><h1>Dein Team. Deine Regeln.</h1><p class="muted">Wähle zwischen Karriere mit Zielen und freiem Aufbau.</p></div></section><div class="mode-current">Aktiver Spielstand: <b>${state.mode==='sandbox'?'Sandbox':'Story-Modus'}</b> · Saison ${state.season} · ${state.races} Rennen</div><div class="grid gap"><section class="card mode-card"><div class="eyebrow">KARRIERE</div><h2>Story-Modus</h2><p class="muted">Baue dein Team vom kleinen Rennstall zum Racing Empire aus. Missionen, Meisterschaft, Sponsoren und Saisonfortschritt bleiben aktiv.</p><span class="mode-chip">◆ Fortschritt & Quests</span><button class="primary" data-mode-start="story">Neues Story-Spiel beginnen</button></section><section class="card mode-card"><div class="eyebrow">FREIER AUFBAU</div><h2>Sandbox</h2><p class="muted">Gestalte Campus, Team und Fahrzeug ohne Bau- oder Entwicklungskosten. Rennen bleiben spielbar; dein Budget wird nicht durch Käufe oder Rennkosten reduziert.</p><span class="mode-chip">◆ Unbegrenztes Baubudget</span><button class="primary" data-mode-start="sandbox">Sandbox-Spiel beginnen</button></section></div><p class="muted gap">Ein Modusstart erstellt nach deiner Bestätigung einen neuen lokalen Spielstand. Sichere den bisherigen Stand vorher über „Spielstand“ als JSON.</p>`;
}

function adminView(){
  const names=api.getTrackNames();
  const currentTrack=api.getState().round;
  trackIndex=Math.min(trackIndex,names.length-1);
  trackPoints=api.getTrackPoints(trackIndex);
  const livery=api.getLivery(liveryNumber);
  main.innerHTML=`<section class="hero"><div><div class="eyebrow">RACE OPERATIONS / ADMIN</div><h1>Rennstrecke & Fahrzeugdesign</h1><p class="muted">Entwirf Streckenverläufe und die Lackierung deines Fahrerduos.</p></div></section><div class="two gap"><section class="card"><div class="eyebrow">STRECKENEDITOR</div><h2>Freihand zeichnen</h2><div class="admin-layout"><canvas id="trackEditor" class="admin-canvas" width="1000" height="590" aria-label="Streckeneditor"></canvas><div class="admin-controls"><label>Rennwochenende<select id="trackChoice">${names.map((name,index)=>`<option value="${index}" ${index===trackIndex?'selected':''}>${name}${index===currentTrack?' · nächste Runde':''}</option>`).join('')}</select></label><p class="admin-help">Halte die Maustaste gedrückt und zeichne eine geschlossene Runde. Der gespeicherte Entwurf ersetzt den Streckenverlauf dieser Runde in der Rennsimulation.</p><button class="primary" data-admin-action="save-track">Strecke speichern</button><button data-admin-action="reset-track">Entwurf zurücksetzen</button><span id="trackStatus" class="muted">${api.getState().admin.tracks[String(trackIndex)]?'Eigener Streckenverlauf gespeichert.':'Standardlayout wird verwendet.'}</span></div></div></section><section class="card"><div class="eyebrow">LIVERY STUDIO</div><h2>Fahrzeuglackierung</h2><div class="admin-controls"><label>Fahrzeug<select id="liveryChoice"><option value="26" ${liveryNumber===26?'selected':''}>#26 · ${api.getState().drivers[0].name}</option><option value="27" ${liveryNumber===27?'selected':''}>#27 · ${api.getState().drivers[1].name}</option></select></label><canvas id="liveryPreview" class="admin-preview" width="720" height="330" aria-label="Lackierungsvorschau"></canvas><div class="admin-bar"><label>Grundfarbe<input id="liveryPrimary" type="color" value="${livery.primary}"></label><label>Akzentfarbe<input id="liverySecondary" type="color" value="${livery.secondary}"></label><label>Design<select id="liveryPattern"><option value="stripe" ${livery.pattern==='stripe'?'selected':''}>Rennstreifen</option><option value="split" ${livery.pattern==='split'?'selected':''}>Zweiteilig</option><option value="solid" ${livery.pattern==='solid'?'selected':''}>Einfarbig</option></select></label></div><div class="admin-swatches">${palette.map((item,index)=>`<button class="admin-swatch" data-palette="${index}" style="background:${item.primary}" title="${item.name}" aria-label="${item.name}"></button>`).join('')}</div><button class="primary" data-admin-action="save-livery">Lackierung speichern</button><small class="muted">Eigenständige Motorsport-Farbkombinationen ohne Teamlogos.</small></div></section></div>`;
  drawTrackEditor();drawLiveryPreview();
}

function canvasPoint(event,canvas){
  const bounds=canvas.getBoundingClientRect();
  return [Math.min(.97,Math.max(.03,(event.clientX-bounds.left)/bounds.width)),Math.min(.97,Math.max(.03,(event.clientY-bounds.top)/bounds.height))];
}

function drawTrackEditor(){
  const canvas=document.querySelector('#trackEditor');
  if(!canvas)return;
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#55764d';ctx.fillRect(0,0,w,h);
  for(let i=0;i<110;i++){const x=(i*157+33)%w,y=(i*93+23)%h;ctx.fillStyle=i%2?'#608456':'#4d6b47';ctx.beginPath();ctx.arc(x,y,8+i%8,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle='#e5e0c4';ctx.lineWidth=76;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
  trackPoints.forEach((point,index)=>index?ctx.lineTo(point[0]*w,point[1]*h):ctx.moveTo(point[0]*w,point[1]*h));ctx.closePath();ctx.stroke();
  ctx.strokeStyle='#ac3440';ctx.lineWidth=66;ctx.beginPath();trackPoints.forEach((point,index)=>index?ctx.lineTo(point[0]*w,point[1]*h):ctx.moveTo(point[0]*w,point[1]*h));ctx.closePath();ctx.stroke();
  ctx.strokeStyle='#42494d';ctx.lineWidth=54;ctx.beginPath();trackPoints.forEach((point,index)=>index?ctx.lineTo(point[0]*w,point[1]*h):ctx.moveTo(point[0]*w,point[1]*h));ctx.closePath();ctx.stroke();
  ctx.strokeStyle='#c9c9bb';ctx.lineWidth=2;ctx.setLineDash([9,12]);ctx.beginPath();trackPoints.forEach((point,index)=>index?ctx.lineTo(point[0]*w,point[1]*h):ctx.moveTo(point[0]*w,point[1]*h));ctx.closePath();ctx.stroke();ctx.setLineDash([]);
}

function drawLiveryPreview(){
  const canvas=document.querySelector('#liveryPreview');
  if(!canvas)return;
  const ctx=canvas.getContext('2d'),livery=api.getLivery(liveryNumber),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#181d21';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#aeb6bc';ctx.font='bold 16px system-ui';ctx.fillText(`CAR #${liveryNumber}`,28,32);
  ctx.save();ctx.translate(w/2,h/2+12);ctx.rotate(-Math.PI/2);
  ctx.fillStyle='#090b0d';ctx.beginPath();ctx.roundRect(-205,-48,410,96,29);ctx.fill();
  ctx.fillStyle=livery.primary;ctx.beginPath();ctx.moveTo(-190,-42);ctx.lineTo(125,-42);ctx.lineTo(173,-29);ctx.lineTo(194,-19);ctx.lineTo(194,19);ctx.lineTo(173,29);ctx.lineTo(125,42);ctx.lineTo(-190,42);ctx.closePath();ctx.fill();
  ctx.fillStyle=livery.secondary;
  if(livery.pattern==='stripe'){ctx.beginPath();ctx.moveTo(-176,-10);ctx.lineTo(167,-10);ctx.lineTo(181,-5);ctx.lineTo(181,3);ctx.lineTo(-176,3);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-176,14);ctx.lineTo(145,14);ctx.lineTo(162,19);ctx.lineTo(-176,19);ctx.closePath();ctx.fill();}
  if(livery.pattern==='split'){ctx.beginPath();ctx.moveTo(9,-42);ctx.lineTo(195,-20);ctx.lineTo(195,20);ctx.lineTo(9,42);ctx.closePath();ctx.fill();}
  ctx.fillStyle='#172027';ctx.beginPath();ctx.moveTo(21,-25);ctx.lineTo(99,-22);ctx.lineTo(129,0);ctx.lineTo(99,22);ctx.lineTo(21,25);ctx.closePath();ctx.fill();
  ctx.fillStyle='#07090a';ctx.fillRect(-157,-65,68,20);ctx.fillRect(86,-65,70,20);ctx.fillRect(-157,45,68,20);ctx.fillRect(86,45,70,20);
  ctx.fillStyle='#eff2f4';ctx.font='bold 25px system-ui';ctx.textAlign='center';ctx.fillText(String(liveryNumber),-40,9);ctx.restore();
}

function captureLivery(){
  const old=api.getLivery(liveryNumber);
  return {primary:document.querySelector('#liveryPrimary')?.value||old.primary,secondary:document.querySelector('#liverySecondary')?.value||old.secondary,pattern:document.querySelector('#liveryPattern')?.value||old.pattern};
}

function refreshExternalPage(){
  installTabs();
  const current=api.getPage();
  if(current!=='admin'&&current!=='modes'){main.dataset.externalPage='';return;}
  if(main.dataset.externalPage===current&&main.innerHTML.trim())return;
  main.dataset.externalPage=current;
  if(current==='admin')adminView();else modeView();
}

main.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  if(button.dataset.modeStart){api.startMode(button.dataset.modeStart);return;}
  if(button.dataset.palette!==undefined){
    const colors=palette[Number(button.dataset.palette)];
    document.querySelector('#liveryPrimary').value=colors.primary;document.querySelector('#liverySecondary').value=colors.secondary;
    const preview=api.getLivery(liveryNumber);preview.primary=colors.primary;preview.secondary=colors.secondary;api.saveLivery(liveryNumber,preview);drawLiveryPreview();return;
  }
  const action=button.dataset.adminAction;
  if(action==='save-track'){
    if(trackPoints.length<6){document.querySelector('#trackStatus').textContent='Zeichne zuerst eine Runde mit mindestens sechs Punkten.';return;}
    api.saveTrack(trackIndex,trackPoints);document.querySelector('#trackStatus').textContent='Gespeichert. Diese Form wird beim nächsten Rennen auf dieser Strecke gefahren.';
  }
  if(action==='reset-track'){
    api.saveTrack(trackIndex,api.getTrackPoints(-1));trackPoints=api.getTrackPoints(-1);drawTrackEditor();document.querySelector('#trackStatus').textContent='Standardlayout wiederhergestellt.';
  }
  if(action==='save-livery'){api.saveLivery(liveryNumber,captureLivery());drawLiveryPreview();}
});

main.addEventListener('change',event=>{
  if(event.target.id==='trackChoice'){trackIndex=Number(event.target.value);trackPoints=api.getTrackPoints(trackIndex);adminView();}
  if(event.target.id==='liveryChoice'){liveryNumber=Number(event.target.value);const livery=api.getLivery(liveryNumber);document.querySelector('#liveryPrimary').value=livery.primary;document.querySelector('#liverySecondary').value=livery.secondary;document.querySelector('#liveryPattern').value=livery.pattern;drawLiveryPreview();}
  if(['liveryPrimary','liverySecondary','liveryPattern'].includes(event.target.id)){api.saveLivery(liveryNumber,captureLivery());drawLiveryPreview();}
});

main.addEventListener('pointerdown',event=>{
  if(event.target.id!=='trackEditor'||event.button!==0)return;
  drawing=true;drawDistance=0;trackPoints=[];trackPoints.push(canvasPoint(event,event.target));event.target.setPointerCapture(event.pointerId);drawTrackEditor();
});
main.addEventListener('pointermove',event=>{
  if(!drawing||event.target.id!=='trackEditor')return;
  let changed=false;
  const samples=event.getCoalescedEvents?.();
  for(const sample of samples?.length?samples:[event]){
    const point=canvasPoint(sample,event.target),last=trackPoints.at(-1),dx=(point[0]-last[0])*event.target.width,dy=(point[1]-last[1])*event.target.height;
    drawDistance+=Math.hypot(dx,dy);
    if(drawDistance>8&&trackPoints.length<250){trackPoints.push(point);drawDistance=0;changed=true;}
  }
  if(changed)scheduleTrackDraw();
});
main.addEventListener('pointerup',event=>{if(drawing&&event.target.id==='trackEditor'){drawing=false;drawTrackEditor();}});
main.addEventListener('pointercancel',event=>{if(drawing&&event.target.id==='trackEditor'){drawing=false;drawTrackEditor();}});

adminView=function(){
  const names=api.getTrackNames(),currentTrack=api.getState().round;
  trackIndex=Math.min(trackIndex,names.length-1);trackPoints=api.getTrackPoints(trackIndex);
  main.innerHTML=`<section class="hero"><div><div class="eyebrow">RACE OPERATIONS / TRACK DESIGN</div><h1>Dein Streckenlayout.</h1><p class="muted">Zeichne eine freie Rennrunde und speichere sie für ein Rennwochenende.</p></div></section><section class="card"><div class="row"><div><div class="eyebrow">STRECKENEDITOR</div><h2>Freihand zeichnen</h2></div><label>Rennen<select id="trackChoice">${names.map((name,index)=>`<option value="${index}" ${index===trackIndex?'selected':''}>${name}${index===currentTrack?' · nächste Runde':''}</option>`).join('')}</select></label></div><div class="admin-layout"><canvas id="trackEditor" class="admin-canvas" width="1000" height="590" aria-label="Strecke frei zeichnen"></canvas><div class="admin-controls"><p class="admin-help">Maustaste oder Finger gedrückt halten und die ganze Runde am Stück zeichnen. Der Entwurf wird weich geglättet und direkt im Rennen gefahren.</p><button class="primary" data-admin-action="save-track">Strecke speichern</button><button data-admin-action="reset-track">Standardlayout wiederherstellen</button><span id="trackStatus" class="muted">${api.getState().admin.tracks[String(trackIndex)]?'Eigener Streckenverlauf gespeichert.':'Standardlayout wird verwendet.'}</span></div></div></section>`;
  drawTrackEditor();
};

const observer=new MutationObserver(refreshExternalPage);
observer.observe(nav,{childList:true});observer.observe(main,{childList:true});
refreshExternalPage();
