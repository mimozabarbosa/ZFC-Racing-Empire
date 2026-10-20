const api=window.ZFCEmpire;
delete window.ZFCHQ;
const main=document.querySelector('#main');
const nav=document.querySelector('#nav');
const priceFormat=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const style=document.createElement('style');
style.textContent=`
.driver-market{max-width:1280px;margin:0 auto;padding:24px 30px 48px}
.driver-market-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:20px}
.driver-market-summary{display:flex;gap:10px;flex-wrap:wrap}
.driver-market-summary span{padding:8px 11px;background:#1a1f24;border:1px solid #39424a;color:#cbd3d8;font-size:12px}
.driver-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#39424a;border:1px solid #39424a}
.driver-offer{display:flex;flex-direction:column;gap:12px;padding:18px;background:#171c21;min-width:0}
.driver-offer-top{display:flex;align-items:start;justify-content:space-between;gap:12px}
.driver-offer h2{font-size:20px;margin:2px 0 0;overflow-wrap:anywhere}
.driver-tier{font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:5px 7px;border:1px solid #53606b;color:#cbd3d8;white-space:nowrap}
.driver-tier[data-tier="Rookie"]{border-color:#67737b}.driver-tier[data-tier="Talent"]{border-color:#34aa9a;color:#83d8cc}.driver-tier[data-tier="Profi"]{border-color:#ed822b;color:#ffb36e}.driver-tier[data-tier="Elite"]{border-color:#e3263a;color:#ff8d97}
.driver-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.driver-stat{border-top:1px solid #39424a;padding-top:8px}.driver-stat small{display:block;color:#aab4bc;font-size:10px;text-transform:uppercase}.driver-stat b{font-size:20px;font-variant-numeric:tabular-nums}
.driver-price{margin-top:auto;padding-top:10px;border-top:1px solid #39424a;font-size:20px;font-weight:800;color:#f0f2f3}
.driver-seat-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.driver-seat-actions button{padding:9px 6px;font-size:11px;white-space:nowrap}
.driver-empty{grid-column:1/-1;padding:42px;text-align:center;color:#aab4bc;background:#171c21}
.driver-tier-guide{color:#aab4bc;font-size:11px;margin:14px 0 0}
@media(max-width:1000px){.driver-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.driver-market{padding:16px}.driver-market-head{align-items:start;flex-direction:column}.driver-grid{grid-template-columns:1fr}.driver-offer{padding:15px}}
`;
document.head.append(style);

function installTab(){
  let button=nav.querySelector('[data-page="drivers"]');
  if(!button){button=document.createElement('button');button.dataset.page='drivers';button.textContent='♟  Fahrermarkt';nav.append(button);}
  button.classList.toggle('active',api.getPage()==='drivers');
}

function renderMarket(){
  if(api.getPage()!=='drivers')return;
  installTab();
  const state=api.getState(),offers=api.getDriversForSale();
  main.innerHTML=`<div class="driver-market"><header class="driver-market-head"><div><div class="eyebrow">DRIVER MARKET / TRANSFERS</div><h1>Finde dein Fahrerduo.</h1><p class="muted">15 zufällige Talente mit unterschiedlichen Fähigkeiten und Ablösesummen.</p></div><div class="driver-market-summary"><span>Budget <b>${priceFormat.format(state.cash)}</b></span><span>#26 <b>${state.drivers[0].name}</b></span><span>#27 <b>${state.drivers[1].name}</b></span></div></header><div class="driver-grid">${offers.length?offers.map(driver=>`<article class="driver-offer"><div class="driver-offer-top"><div><div class="eyebrow">FAHRERPROFIL</div><h2>${driver.name}</h2></div><span class="driver-tier" data-tier="${driver.tier}">${driver.tier}</span></div><div class="driver-stats"><div class="driver-stat"><small>Tempo</small><b>${driver.skill}</b></div><div class="driver-stat"><small>Konstanz</small><b>${driver.consistency}</b></div></div><div class="driver-price">${priceFormat.format(driver.price)}</div><div class="driver-seat-actions"><button data-buy-driver="${driver.id}:0">Für Sitz #26 verpflichten</button><button data-buy-driver="${driver.id}:1">Für Sitz #27 verpflichten</button></div></article>`).join(''):'<div class="driver-empty"><h2>Der aktuelle Transfermarkt ist leer.</h2><p>Deine 15 verfügbaren Talente wurden verpflichtet.</p></div>'}</div><p class="driver-tier-guide">Rookie · Talent · Profi · Elite. Preis und Fahrerwerte werden für jeden neuen Spielstand zufällig bestimmt.</p></div>`;
  installTab();
}

function persistState(){
  try{localStorage.setItem('zfc-racing-empire-v1',JSON.stringify(api.getState()));window.dispatchEvent(new Event('zfc:save'));api.setPage('drivers');return true;}
  catch(error){console.error('Spielstand konnte nicht gespeichert werden:',error);return false;}
}

api.hireDriver=(id,seat)=>{
  const state=api.getState(),index=state.driverMarket.findIndex(driver=>driver.id===id);
  if(index<0||!Number.isInteger(seat)||seat<0||seat>1)return false;
  const driver=state.driverMarket[index];
  if(state.mode!=='sandbox'&&state.cash<driver.price)return false;
  if(state.mode!=='sandbox')state.cash-=driver.price;
  state.drivers[seat]={name:driver.name,skill:driver.skill,consistency:driver.consistency};
  state.driverMarket.splice(index,1);state.driverPurchases=(state.driverPurchases||0)+1;
  state.log.unshift(driver.name+' wurde für '+new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(driver.price)+' verpflichtet.');
  state.log=state.log.slice(0,30);return persistState();
};

api.trainDriver=seat=>{
  const state=api.getState(),driver=state.drivers[seat],cost=45000;
  if(!driver||driver.skill>=100&&driver.consistency>=100||state.mode!=='sandbox'&&state.cash<cost)return false;
  if(state.mode!=='sandbox')state.cash-=cost;
  driver.skill=Math.min(100,driver.skill+Math.min(7,3+Math.floor(state.trained/3)));
  driver.consistency=Math.min(100,driver.consistency+2);state.trained++;
  return persistState();
};

api.upgradeCar=key=>{
  const state=api.getState(),car=state.car,cost=Math.round((65000+car[key]*1800)*(key==='aero'?1:1));
  if(!['motor','aero','grip','reliability'].includes(key)||car[key]>=100||state.mode!=='sandbox'&&state.cash<cost)return false;
  if(state.mode!=='sandbox')state.cash-=cost;
  car[key]=Math.min(100,car[key]+Math.min(8,3+Math.floor(state.researches/3)));state.researches++;
  return persistState();
};

main.addEventListener('click',event=>{
  const button=event.target.closest('[data-buy-driver]');
  if(!button)return;
  const [id,seat]=button.dataset.buyDriver.split(':');
  api.hireDriver(id,Number(seat));
});

document.addEventListener('click',event=>{
  const training=event.target.closest('[data-train]');
  if(training){event.preventDefault();event.stopPropagation();api.trainDriver(Number(training.dataset.train));return;}
  const research=event.target.closest('[data-research]');
  if(research){event.preventDefault();event.stopPropagation();api.upgradeCar(research.dataset.research);}
},true);

function removeHQInstructions(){
  if(api.getPage()==='settings'&&main.innerHTML.includes('Entwicklungsbüro und Simulator bauen.'))main.innerHTML=main.innerHTML.replace('1. Entwicklungsbüro und Simulator bauen.<br>2. Ingenieur einstellen, Fahrer trainieren und Auto verbessern.<br>3. Sponsor sichern und Rennen starten.<br>4. Quests abholen, Grundstück ausbauen, nächste Saison erreichen.','1. Stelle dein Fahrerduo im Fahrermarkt zusammen.<br>2. Wähle deine zweifarbige Empire-Lackierung.<br>3. Entwickle dein Fahrzeug und sichere Sponsoren.<br>4. Fahre zehn Rennwochenenden und sammle Meisterschaftspunkte.');
  if(api.getPage()==='research')main.innerHTML=main.innerHTML.replace('Forschung benötigt ein Entwicklungsbüro und einen Ingenieur. Mehr Laborstufen und Ingenieure erhöhen den Fortschritt je Upgrade.','Forschung ist direkt über dein Unternehmensbudget verfügbar. Mit jedem dritten Upgrade steigt die Entwicklungsleistung.').replace('Ein Windkanal senkt die Kosten für Aerodynamik um bis zu 40 %.','Deine Forschung verbessert beide Fahrerwagen für kommende Rennwochenenden.');
  if(api.getPage()==='overview')main.innerHTML=main.innerHTML.replace('erweitere deinen Campus','verpflichte neue Fahrer').replace('Deine Missionen ansehen','Fahrermarkt öffnen');
  if(api.getPage()==='team')main.innerHTML=main.innerHTML.replaceAll('Benötigt einen Simulator auf dem Campus.','Training ist direkt verfügbar.').replace('Menschen machen den Unterschied.','Stelle zwei Fahrer zusammen und entwickle ihr Potenzial.');
}

const observer=new MutationObserver(()=>{
  installTab();
  if(api.getPage()==='drivers'&&main.dataset.driverMarket!=='ready'){
    main.dataset.driverMarket='ready';renderMarket();
  }else if(api.getPage()!=='drivers')main.dataset.driverMarket='';
  removeHQInstructions();
});
observer.observe(nav,{childList:true});observer.observe(main,{childList:true});
installTab();
if(api.getPage()==='drivers'){main.dataset.driverMarket='ready';renderMarket();}
