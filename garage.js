const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js').catch(error => {
  console.error('3D-Fahrzeugmodell konnte nicht geladen werden:', error);
  return null;
});

const api = window.ZFCEmpire;
const main = document.querySelector('#main');
const lowDetail=matchMedia('(pointer:coarse)').matches||(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4;
const style = document.createElement('style');
style.textContent = `
.garage-studio{margin-top:20px;border-top:1px solid #39424a;border-bottom:1px solid #39424a;background:#161b20}
.garage-heading{display:flex;justify-content:space-between;gap:18px;align-items:end;padding:22px 24px 12px}
.garage-heading h2{margin:4px 0 0}
.garage-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:0;align-items:stretch}
.garage-stage{position:relative;min-width:0;min-height:390px;background:radial-gradient(ellipse at 50% 63%,#30383e 0,#1c2228 48%,#171b20 100%);overflow:hidden}
.garage-stage canvas{display:block;width:100%;height:390px;touch-action:none;cursor:grab}
.garage-stage canvas.is-dragging{cursor:grabbing}
.garage-label{position:absolute;left:18px;top:16px;padding:7px 10px;border:1px solid #ffffff25;background:#11161bdc;color:#d8e0e5;font-size:10px;letter-spacing:1px;pointer-events:none}
.garage-controls{padding:22px;border-left:1px solid #39424a;display:flex;flex-direction:column;gap:14px}
.garage-controls label{display:grid;gap:8px;color:#aab4bc;font-size:12px}
.garage-colors{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.garage-color-input{width:100%;height:48px;padding:4px;border:1px solid #515a62;background:#22282e}
.garage-save{margin-top:auto;min-height:42px}
.garage-fallback{padding:25px;color:#d7dce0;background:#1d2329}
@media(max-width:850px){.garage-layout{grid-template-columns:1fr}.garage-controls{border-left:0;border-top:1px solid #39424a}.garage-stage,.garage-stage canvas{min-height:320px;height:320px}.garage-heading{align-items:start;flex-direction:column}}
`;
style.textContent += `
.garage-controls .garage-save{background:#e3263a;border-color:#e3263a;color:white;font-weight:750}
.garage-controls .garage-save:hover{background:#c91f32}
`;
document.head.append(style);

const vec=(x,y,z)=>new THREE.Vector3(x,y,z);
let active=null;
let currentCar=null;
let renderer=null;
let scene=null;
let camera=null;
let pointerDown=null;
let lastFrame=0;
let animationFrame=0;
let resizeObserver=null;
let pendingCanvas=null;
let modelPaint={primary:'#e3263a',secondary:'#f0f2f3'};

function paint(color,slot,roughness=0.32,metalness=0.18){
  const result=new THREE.MeshStandardMaterial({color,roughness,metalness});
  result.userData.paintSlot=slot;
  return result;
}

function part(group,geometry,material,position,rotation){
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.copy(position);
  if(rotation)mesh.rotation.set(rotation.x,rotation.y,rotation.z);
  mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  return mesh;
}

function box(group,width,height,depth,position,material,bevel=0){
  const geometry=new THREE.BoxGeometry(width,height,depth);
  return part(group,geometry,material,position);
}

function cylinderBetween(group,start,end,radius,material,radialSegments=10){
  const direction=end.clone().sub(start),mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,direction.length(),radialSegments),material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(vec(0,1,0),direction.normalize());
  mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
}

function carBody(group,bodyMaterial){
  const sections=[
    {z:-2.55,w:.5,b:.38,t:.63},{z:-2.05,w:.59,b:.35,t:.79},{z:-1.35,w:.64,b:.35,t:.78},
    {z:-.72,w:.56,b:.38,t:.69},{z:-.05,w:.43,b:.4,t:.62},{z:.62,w:.35,b:.43,t:.59},
    {z:1.35,w:.27,b:.46,t:.56},{z:2.25,w:.16,b:.49,t:.53},{z:2.72,w:.08,b:.5,t:.52}
  ];
  const vertices=[],indices=[],segments=lowDetail?12:20;
  for(const section of sections){
    const center=(section.b+section.t)/2,half=(section.t-section.b)/2;
    for(let side=0;side<segments;side++){
      const angle=side/segments*Math.PI*2;
      vertices.push(Math.cos(angle)*section.w,center+Math.sin(angle)*half,section.z);
    }
  }
  for(let ring=0;ring<sections.length-1;ring++)for(let side=0;side<segments;side++){
    const a=ring*segments+side,b=ring*segments+(side+1)%segments,c=(ring+1)*segments+(side+1)%segments,d=(ring+1)*segments+side;
    indices.push(a,b,d,b,c,d);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  part(group,geometry,bodyMaterial,vec(0,0,0));
}

function wheel(group,x,z,radius,materials){
  const centerY=radius+.13;
  const tire=part(group,new THREE.CylinderGeometry(radius,radius,.38,lowDetail?20:40,1),materials.tire,vec(x,centerY,z),vec(0,0,Math.PI/2));
  tire.castShadow=true;
  for(const side of [-1,1]){
    const faceX=x+side*.196;
    part(group,new THREE.TorusGeometry(radius*.73,.045,6,lowDetail?16:28),materials.tread,vec(faceX,centerY,z),vec(0,Math.PI/2,0));
    part(group,new THREE.CylinderGeometry(radius*.62,radius*.62,.014,lowDetail?16:28),materials.rim,vec(faceX+side*.012,centerY,z),vec(0,0,Math.PI/2));
    part(group,new THREE.CylinderGeometry(radius*.17,radius*.17,.035,lowDetail?12:18),materials.hub,vec(faceX+side*.025,centerY,z),vec(0,0,Math.PI/2));
    const spokes=lowDetail?3:8;
    for(let spoke=0;spoke<spokes;spoke++){
      const angle=spoke*Math.PI*2/spokes,start=vec(faceX+side*.035,centerY+Math.sin(angle)*radius*.18,z+Math.cos(angle)*radius*.18),end=vec(faceX+side*.035,centerY+Math.sin(angle)*radius*.67,z+Math.cos(angle)*radius*.67);
      cylinderBetween(group,start,end,.018,materials.rim,6);
    }
  }
}

function wing(group,width,z,y,mainMaterial,accentMaterial,depth=.16){
  box(group,width,.09,depth,vec(0,y,z),mainMaterial);
  box(group,width*.83,.055,depth*.72,vec(0,y+.12,z-.14),accentMaterial);
  for(const side of [-1,1]){
    box(group,.055,.31,depth*1.35,vec(side*width*.47,y+.1,z-.03),mainMaterial);
    box(group,.12,.23,.11,vec(side*width*.5,y,z),accentMaterial);
  }
}

function curveTube(group,points,radius,material){
  const curve=new THREE.CatmullRomCurve3(points.map(point=>vec(...point)));
  return part(group,new THREE.TubeGeometry(curve,lowDetail?16:32,radius,lowDetail?6:8,false),material,vec(0,0,0));
}

function buildFormulaCar(primary,secondary){
  const car=new THREE.Group();
  const bodyMaterial=paint(primary,'primary'),accent=paint(secondary,'secondary',.28,.25);
  const dark=new THREE.MeshStandardMaterial({color:'#101418',roughness:.78,metalness:.18});
  const carbon=new THREE.MeshStandardMaterial({color:'#20272c',roughness:.53,metalness:.38});
  const glass=new THREE.MeshStandardMaterial({color:'#24323a',roughness:.18,metalness:.35});
  const silver=new THREE.MeshStandardMaterial({color:'#b9c3c7',roughness:.28,metalness:.8});
  const redHub=new THREE.MeshStandardMaterial({color:'#d8dde0',roughness:.3,metalness:.55});
  carBody(car,bodyMaterial);

  box(car,1.17,.4,1.08,vec(-.59,.55,-.72),bodyMaterial);
  box(car,1.17,.4,1.08,vec(.59,.55,-.72),bodyMaterial);
  for(const side of [-1,1]){
    box(car,.025,.13,.78,vec(side*1.18,.58,-.74),accent);
    box(car,.38,.035,.4,vec(side*.62,.58,-.24),carbon);
    box(car,.07,.045,.5,vec(side*.57,.79,-.66),accent);
    const mirror=part(car,new THREE.SphereGeometry(.12,12,10),bodyMaterial,vec(side*.58,.88,.68));mirror.scale.set(1.4,.72,.9);
    cylinderBetween(car,vec(side*.45,.79,.72),vec(side*.58,.87,.68),.025,carbon,7);
  }

  const cockpit=part(car,new THREE.SphereGeometry(1,28,20),dark,vec(0,.68,-.11));cockpit.scale.set(.35,.115,.52);
  const helmet=part(car,new THREE.SphereGeometry(.17,20,16),accent,vec(0,.82,-.05));helmet.scale.set(.9,1.15,1.08);
  const visor=part(car,new THREE.SphereGeometry(.12,16,10),glass,vec(0,.84,.06));visor.scale.set(1.04,.42,.56);
  curveTube(car,[[-.38,.72,-.3],[-.36,1.02,-.26],[-.27,1.22,-.2],[0,1.28,-.18],[.27,1.22,-.2],[.36,1.02,-.26],[.38,.72,-.3]],.035,silver);
  cylinderBetween(car,vec(0,1.25,-.19),vec(0,1.34,.3),.032,silver,8);
  part(car,new THREE.CylinderGeometry(.16,.24,.37,20),carbon,vec(0,.83,-1.08));
  part(car,new THREE.TorusGeometry(.18,.035,8,18),accent,vec(0,1.02,-1.22),vec(Math.PI/2,0,0));

  wing(car,3.16,2.48,.34,accent,bodyMaterial,.19);
  box(car,.16,.38,.12,vec(0,.49,2.15),carbon);
  wing(car,1.84,-2.44,1.38,bodyMaterial,accent,.16);
  box(car,1.42,.07,.12,vec(0,1.72,-2.43),accent);
  for(const side of [-1,1]){
    box(car,.06,.47,.15,vec(side*.83,1.48,-2.43),bodyMaterial);
    box(car,.08,.33,.14,vec(side*1.42,.46,2.42),accent);
    box(car,.08,.2,.56,vec(side*.38,.3,-2.33),carbon);
    box(car,.065,.12,.67,vec(side*.48,.28,1.43),carbon);
  }

  const wheelMaterials={tire:dark,tread:new THREE.MeshStandardMaterial({color:'#0a0d0f',roughness:.95}),rim:silver,hub:redHub};
  wheel(car,-1.19,1.72,.5,wheelMaterials);wheel(car,1.19,1.72,.5,wheelMaterials);
  wheel(car,-1.19,-1.83,.59,wheelMaterials);wheel(car,1.19,-1.83,.59,wheelMaterials);
  for(const side of [-1,1]){
    const frontHub=vec(side*1.19,.63,1.72),rearHub=vec(side*1.19,.72,-1.83),frontChassis=vec(side*.34,.53,1.38),rearChassis=vec(side*.42,.59,-1.35);
    cylinderBetween(car,frontHub,frontChassis,.027,silver,7);cylinderBetween(car,vec(side*1.19,.43,1.72),vec(side*.38,.46,.97),.022,carbon,7);
    cylinderBetween(car,rearHub,rearChassis,.03,silver,7);cylinderBetween(car,vec(side*1.19,.48,-1.83),vec(side*.42,.42,-.98),.024,carbon,7);
  }
  box(car,.68,.07,4.72,vec(0,.24,-.16),carbon);
  car.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
  return car;
}

function applyPaint(){
  if(!currentCar)return;
  const livery=api.getTeamLivery();modelPaint=livery;
  currentCar.traverse(object=>{
    if(!object.isMesh||!object.material?.userData?.paintSlot)return;
    object.material.color.set(object.material.userData.paintSlot==='primary'?livery.primary:livery.secondary);
  });
  for(const primary of document.querySelectorAll('#empirePrimary,#newEmpirePrimary'))primary.value=livery.primary;
  for(const secondary of document.querySelectorAll('#empireAccent,#newEmpireAccent'))secondary.value=livery.secondary;
}

function resize(){
  if(!active||!renderer||!camera)return;
  const width=active.canvas.parentElement?.clientWidth||900,height=active.canvas.parentElement?.clientHeight||390;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,lowDetail?1:1.5));renderer.setSize(width,height,false);
  camera.aspect=width/height;camera.updateProjectionMatrix();
}

function stopShowroom(){
  if(animationFrame)cancelAnimationFrame(animationFrame);animationFrame=0;
  resizeObserver?.disconnect();resizeObserver=null;
  if(renderer){renderer.renderLists?.dispose();renderer.dispose();renderer.forceContextLoss();}
  renderer=null;scene=null;camera=null;currentCar=null;active=null;pointerDown=null;
}

function startShowroom(){
  if(!animationFrame)animationFrame=requestAnimationFrame(animate);
}

function fallbackPreview(canvas){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const w=canvas.width,h=canvas.height,livery=api.getTeamLivery();
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#20272d';ctx.fillRect(0,0,w,h);
  ctx.save();ctx.translate(w/2,h/2);ctx.fillStyle='#080b0d';
  for(const z of [-105,98])for(const x of [-120,120])ctx.fillRect(w/2+x-22,h/2+z-16,44,65);
  ctx.fillStyle=livery.primary;ctx.beginPath();ctx.moveTo(w/2-19,h/2+130);ctx.lineTo(w/2-48,h/2+22);ctx.lineTo(w/2-25,h/2-112);ctx.lineTo(w/2-11,h/2-151);ctx.lineTo(w/2+11,h/2-151);ctx.lineTo(w/2+25,h/2-112);ctx.lineTo(w/2+48,h/2+22);ctx.lineTo(w/2+19,h/2+130);ctx.closePath();ctx.fill();
  ctx.fillStyle=livery.secondary;ctx.fillRect(w/2-6,h/2-140,12,230);ctx.restore();
}

function makePanel(){
  let panel=document.querySelector('#garageStudio');if(panel)return panel;
  panel=document.createElement('section');panel.id='garageStudio';panel.className='garage-studio';
  panel.innerHTML=`<div class="garage-heading"><div><div class="eyebrow">EMPIRE IDENTITY / TEAM LIVERY</div><h2>Dein Auto. Deine Farben.</h2></div><span class="tag">EIN EMPIRE · EIN DESIGN</span></div><div class="garage-layout"><div class="garage-stage"><canvas id="empireCar" width="1100" height="590" aria-label="Drehbares dreidimensionales Formel-Rennauto"></canvas><span class="garage-label">3D-SHOWROOM · FORMEL-RENNWAGEN</span></div><div class="garage-controls"><p class="muted">Wähle zwei Farben für beide Teamwagen. Ziehen dreht das Modell, das Mausrad zoomt.</p><div class="garage-colors"><label>Karosserie<input class="garage-color-input" id="empirePrimary" type="color"></label><label>Akzent<input class="garage-color-input" id="empireAccent" type="color"></label></div><button class="garage-save" id="saveEmpireLivery">Lackierung fürs Empire speichern</button><small class="muted">Dein Design gilt für Auto #26 und #27 und wird lokal gespeichert.</small></div></div>`;
  main.append(panel);return panel;
}

function initializeModel(canvas){
  if(!THREE){canvas.classList.add('garage-fallback');fallbackPreview(canvas);return;}
  if(active?.canvas===canvas){applyPaint();resize();startShowroom();return;}
  try{
  if(renderer)stopShowroom();
  scene=new THREE.Scene();scene.background=new THREE.Color('#20272d');scene.fog=new THREE.Fog('#20272d',18,38);
  camera=new THREE.PerspectiveCamera(31,1,.1,100);camera.position.set(7.8,6.7,9.7);camera.lookAt(0,.45,0);
  renderer=new THREE.WebGLRenderer({canvas,antialias:!lowDetail,alpha:false,powerPreference:'low-power'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=!lowDetail;if(!lowDetail)renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene.add(new THREE.HemisphereLight('#e9edf0','#273039',lowDetail?2.5:2.1));
  const key=new THREE.DirectionalLight('#fff1dd',lowDetail?2.5:3.2);key.position.set(-7,10,6);key.castShadow=!lowDetail;if(!lowDetail)key.shadow.mapSize.set(512,512);scene.add(key);
  const rim=new THREE.DirectionalLight('#81b9de',2);rim.position.set(5,4,-7);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(8,64),new THREE.MeshStandardMaterial({color:'#272e34',roughness:.38,metalness:.45}));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;floor.receiveShadow=true;scene.add(floor);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(6,.012,4,96),new THREE.MeshBasicMaterial({color:'#64717a'}));ring.rotation.x=Math.PI/2;ring.position.y=-.01;scene.add(ring);
  currentCar=buildFormulaCar(modelPaint.primary,modelPaint.secondary);currentCar.position.y=.02;scene.add(currentCar);
  active={canvas,clientWidth:canvas.clientWidth,clientHeight:canvas.clientHeight};
  canvas.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY};canvas.classList.add('is-dragging');canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!pointerDown)return;const dx=event.clientX-pointerDown.x,dy=event.clientY-pointerDown.y;pointerDown={x:event.clientX,y:event.clientY,moved:true};currentCar.rotation.y+=dx*.009;currentCar.rotation.x=THREE.MathUtils.clamp(currentCar.rotation.x+dy*.003,-.12,.24);});
  canvas.addEventListener('pointerup',event=>{pointerDown=null;canvas.classList.remove('is-dragging');if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);});
  canvas.addEventListener('pointercancel',()=>{pointerDown=null;canvas.classList.remove('is-dragging');});
  canvas.addEventListener('wheel',event=>{event.preventDefault();camera.position.multiplyScalar(Math.exp(event.deltaY*.0008));camera.position.clampLength(7,20);camera.lookAt(0,.45,0);},{passive:false});
  resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas.parentElement);resize();applyPaint();startShowroom();
  }catch(error){
    console.error('Der 3D-Showroom konnte nicht gestartet werden:',error);
    stopShowroom();
    canvas.classList.add('garage-fallback');fallbackPreview(canvas);
  }
}

function mount(){
  const creating=document.querySelector('#empireDialog')?.open;
  if(api.getPage()!=='settings'&&!creating){
    pendingCanvas=null;
    if(active?.canvas.closest('#empireDialog'))stopShowroom();
    return;
  }
  const panel=creating?document.querySelector('#empireDialog'):makePanel();
  const canvas=panel?.querySelector(creating?'#newEmpireCar':'#empireCar');
  if(!canvas)return;
  const livery=api.getTeamLivery();
  for(const input of panel.querySelectorAll(creating?'#newEmpirePrimary':'#empirePrimary'))input.value=livery.primary;
  for(const input of panel.querySelectorAll(creating?'#newEmpireAccent':'#empireAccent'))input.value=livery.secondary;
  if(active?.canvas===canvas){initializeModel(canvas);return;}
  if(pendingCanvas===canvas)return;
  pendingCanvas=canvas;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(pendingCanvas!==canvas)return;
    pendingCanvas=null;
    if(!canvas.isConnected||(creating&&!document.querySelector('#empireDialog')?.open))return;
    initializeModel(canvas);
  }));
}

function animate(now){
  const creating=active?.canvas.closest('#empireDialog')?.open;
  if(!active||!renderer||(api.getPage()!=='settings'&&!creating)||document.visibilityState==='hidden'){animationFrame=0;return;}
  const delta=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
  if(!pointerDown&&currentCar)currentCar.rotation.y+=delta*.16;
  renderer.render(scene,camera);
  animationFrame=requestAnimationFrame(animate);
}

document.body.addEventListener('input',event=>{
  if(!['empirePrimary','empireAccent','newEmpirePrimary','newEmpireAccent'].includes(event.target.id))return;
  const livery=api.getTeamLivery();
  const primaryIds=['empirePrimary','newEmpirePrimary'],secondaryIds=['empireAccent','newEmpireAccent'];
  api.setTeamLivery(primaryIds.includes(event.target.id)?event.target.value:livery.primary,secondaryIds.includes(event.target.id)?event.target.value:livery.secondary);
  applyPaint();
  if(!THREE)fallbackPreview(document.querySelector('#empireCar'));
});
document.body.addEventListener('click',event=>{
  if(event.target.id==='saveEmpireLivery'){
    const primary=document.querySelector('#empirePrimary').value,secondary=document.querySelector('#empireAccent').value;
    api.setTeamLivery(primary,secondary);
    const button=event.target;button.textContent='Lackierung gespeichert';setTimeout(()=>{if(button.isConnected)button.textContent='Lackierung fürs Empire speichern';},1500);
  }
});

const observer=new MutationObserver(mount);
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('zfc:empire-create',mount);
window.addEventListener('zfc:empire-close',()=>{if(active?.canvas.closest('#empireDialog'))stopShowroom();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='hidden'&&active&&(api.getPage()==='settings'||active.canvas.closest('#empireDialog')?.open))startShowroom();});
mount();
