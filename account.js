const api=window.ZFCEmpire;
const main=document.querySelector('#main');
const nav=document.querySelector('#nav');
const saveKey='zfc-racing-empire-v1';
const SUPABASE_MODULE='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const style=document.createElement('style');
style.textContent=`
.account-tools{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-left:14px;flex-wrap:wrap}
.account-locked #stats,.account-locked aside nav,.account-locked #teamTop{display:none!important}
.account-tools button{font-size:12px;white-space:nowrap}
.account-user{color:#c7d0d6;font-size:12px;max-width:190px;overflow:hidden;text-overflow:ellipsis}
.home-wrap{max-width:1160px;margin:0 auto;padding:28px 30px 54px}
.home-masthead{position:relative;min-height:360px;display:flex;align-items:flex-end;overflow:hidden;padding:40px;background:linear-gradient(110deg,#111519 0%,#1c2228 58%,#3b1d23 100%);border-bottom:3px solid #e3263a}
.home-masthead:before{content:"";position:absolute;right:-6%;top:-15%;width:55%;height:130%;border:1px solid #aeb8bf33;transform:skewX(-18deg);background:repeating-linear-gradient(120deg,transparent 0 34px,#ffffff05 35px 36px)}
.home-masthead:after{content:"10 ROUNDS / ONE EMPIRE";position:absolute;right:38px;top:32px;color:#d5dbe0;font-size:10px;font-weight:800;letter-spacing:2px}
.home-copy{position:relative;z-index:1;max-width:620px}.home-copy h1{font-size:clamp(36px,5vw,64px);line-height:.98;letter-spacing:0;text-transform:uppercase}.home-copy p{max-width:500px;color:#bac3c9;font-size:16px;margin:18px 0 24px}
.home-actions{display:flex;gap:10px;flex-wrap:wrap}.home-actions button{padding:12px 18px}.home-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:0;border-bottom:1px solid #39424a}
.home-section{padding:27px 28px;border-right:1px solid #39424a}.home-section:last-child{border-right:0}.home-section h2{margin:5px 0 18px}.home-steps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.home-step{padding:12px 0;border-top:1px solid #39424a}.home-step b{display:block;color:#edf0f2;margin-bottom:3px}.home-step span{color:#aab4bc;font-size:12px}.home-goal{display:flex;justify-content:space-between;gap:14px;padding:10px 0;border-bottom:1px solid #39424a;color:#d4dce1;font-size:13px}
.home-status{color:#efb8bd;font-size:12px;min-height:18px}.home-login{width:min(440px,calc(100vw - 30px));padding:0;border:1px solid #535d65;background:#181d22;color:#eef1f3;max-height:90vh;overflow:auto}
.home-login::backdrop,.empire-create::backdrop{background:#05070bd9;backdrop-filter:blur(5px)}
.home-dialog-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #39424a}.home-dialog-content{display:grid;gap:14px;padding:20px}.home-dialog-content label,.empire-create label{display:grid;gap:6px;color:#aab4bc;font-size:12px}.home-dialog-content input,.empire-create input{width:100%}.home-dialog-actions{display:flex;gap:8px}.home-dialog-actions button{flex:1}.auth-warning{padding:10px;border-left:3px solid #e3263a;background:#e3263a12;color:#d9c7c9;font-size:12px}
.empire-create{width:min(940px,calc(100vw - 24px));max-height:94vh;padding:0;border:1px solid #535d65;background:#171c21;color:#eef1f3;overflow:auto}
.empire-create form{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:0}.empire-create-head{grid-column:1/-1;padding:20px 24px;border-bottom:1px solid #39424a}.empire-create-fields{padding:24px;display:grid;align-content:start;gap:16px}.empire-create-car{padding:18px;border-left:1px solid #39424a;background:#13181d}.empire-create-car canvas{display:block;width:100%;height:220px;touch-action:none}.empire-create-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;padding:16px 24px;border-top:1px solid #39424a}
.empire-launch{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;overflow:hidden;background:radial-gradient(ellipse at center,#293139 0,#13181d 58%,#090b0e 100%);opacity:0;transition:opacity .45s ease}
.empire-launch.visible{opacity:1}.empire-launch-inner{position:relative;width:min(760px,88vw);text-align:center;transform:translateY(24px);opacity:0;transition:transform .7s cubic-bezier(.2,.7,.2,1),opacity .5s ease}.empire-launch.visible .empire-launch-inner{transform:translateY(0);opacity:1}
.empire-launch-kicker{color:#d9e0e4;font-size:11px;font-weight:800;letter-spacing:3px}.empire-launch-name{margin:18px 0 24px;color:#f3f5f6;font-size:clamp(28px,6vw,66px);line-height:1.04;letter-spacing:0;overflow-wrap:anywhere}
.empire-launch-livery{display:flex;width:min(460px,75vw);height:12px;margin:0 auto;overflow:hidden;transform:skewX(-22deg)}.empire-launch-livery-primary,.empire-launch-livery-accent{width:50%;transform:scaleX(0);transform-origin:left center}.empire-launch.visible .empire-launch-livery-primary{background:var(--launch-primary);animation:livery-reveal .9s .35s ease-out forwards}.empire-launch.visible .empire-launch-livery-accent{background:var(--launch-accent);animation:livery-reveal .9s .75s ease-out forwards}
.empire-launch-subtitle{margin-top:22px;color:#aab4bc;font-size:12px;letter-spacing:2px;text-transform:uppercase}
@keyframes livery-reveal{to{transform:scaleX(1)}}
.music-frame{position:fixed;width:1px;height:1px;opacity:.001;pointer-events:none;left:-2px;bottom:0;border:0}
.music-volume{display:flex;align-items:center;gap:5px;color:#cbd3d8;font-size:11px;white-space:nowrap}.music-volume input{width:82px;padding:0;accent-color:#e3263a}
@media(max-width:850px){.home-wrap{padding:16px}.home-masthead{min-height:330px;padding:25px}.home-grid{grid-template-columns:1fr}.home-section{border-right:0;border-bottom:1px solid #39424a;padding:22px 6px}.empire-create form{grid-template-columns:1fr}.empire-create-car{border-left:0;border-top:1px solid #39424a}.account-tools{margin-left:0}}
@media(max-width:520px){.home-steps{grid-template-columns:1fr}.home-masthead:after{right:15px;top:15px;font-size:8px}.home-copy h1{font-size:38px}.home-section{padding-left:0;padding-right:0}.empire-create-fields{padding:18px}.empire-create-actions{padding:14px 18px}}
`;
document.head.append(style);

let client=null;
let currentUser=null;
let saveTimer=0;
let musicFrame=null;
let musicPlaying=false;
let musicVolume=100;
let loginMode='signin';
let loadedUserId=null;

function configured(){
  const config=window.ZFC_SUPABASE_CONFIG||{};
  return typeof config.url==='string'&&/^https:\/\/[\w-]+\.supabase\.co$/.test(config.url)&&typeof (config.anonKey||config.publishableKey)==='string'&&!(config.anonKey||config.publishableKey).includes('YOUR_');
}

function createToolbar(){
  const topbar=document.querySelector('.topbar');
  if(!topbar||document.querySelector('#accountTools'))return;
  const tools=document.createElement('div');tools.id='accountTools';tools.className='account-tools';
  tools.innerHTML='<button type="button" id="musicToggle" title="Hintergrundmusik">♫ Musik aus</button><label class="music-volume" title="Musiklautstärke">Lautstärke<input id="musicVolume" type="range" min="0" max="100" value="100" aria-label="Musiklautstärke"></label><button type="button" id="accountToggle" class="primary">Anmelden</button>';
  topbar.append(tools);updateToolbar();
}

function updateToolbar(){
  const login=document.querySelector('#accountToggle'),music=document.querySelector('#musicToggle');
  if(login){login.textContent=currentUser?(currentUser.email||'Konto')+' · Abmelden':'Anmelden';login.title=currentUser?'Abmelden':'Mit Supabase anmelden';}
  if(music)music.textContent=musicPlaying?'♫ Musik an':'♫ Musik aus';
}

function ensureDialogs(){
  if(!document.querySelector('#loginDialog')){
    const dialog=document.createElement('dialog');dialog.id='loginDialog';dialog.className='home-login';
    dialog.innerHTML='<div class="home-dialog-head"><div><div class="eyebrow">RACING EMPIRE ACCOUNT</div><h2 id="authTitle">Anmelden</h2></div><button type="button" data-close-dialog="loginDialog" aria-label="Schließen">×</button></div><form id="authForm" class="home-dialog-content"><label>E-Mail<input id="authEmail" type="email" autocomplete="email" required maxlength="254"></label><label>Passwort<input id="authPassword" type="password" autocomplete="current-password" required minlength="8" maxlength="128"></label><div class="home-dialog-actions"><button type="button" id="authModeToggle">Konto erstellen</button><button class="primary" id="authSubmit" type="submit">Anmelden</button></div><div id="authStatus" class="home-status" role="status"></div><div id="authConfigWarning" class="auth-warning hide">Supabase ist noch nicht eingerichtet. Ergänze Projekt-URL und Publishable/Anon-Key in <b>supabase-config.js</b>. Eine Anmeldung ist bis dahin nicht möglich.</div></form>';
    document.body.append(dialog);
  }
  if(!document.querySelector('#empireDialog')){
    const dialog=document.createElement('dialog');dialog.id='empireDialog';dialog.className='empire-create';
      dialog.innerHTML='<form id="empireForm"><div class="empire-create-head"><div class="eyebrow">DEIN TEAM / DEIN EMPIRE</div><h2>Unternehmen erstellen</h2><p class="muted">Name und zweifarbige Lackierung bilden die Identität deines Rennstalls.</p></div><div class="empire-create-fields"><label>Unternehmensname<input id="newEmpireName" required minlength="2" maxlength="40" placeholder="z. B. Aurora Motorsport"></label><label>Karosseriefarbe<input id="newEmpirePrimary" type="color" value="#e3263a"></label><label>Akzentfarbe<input id="newEmpireAccent" type="color" value="#f0f2f3"></label><div id="empireStatus" class="home-status" role="status"></div></div><div class="empire-create-car"><div class="eyebrow">3D-FAHRZEUGVORSCHAU</div><canvas id="newEmpireCar" width="900" height="480" aria-label="Formel-Rennwagen mit deiner Lackierung"></canvas><small class="muted">Modell ziehen, um es zu drehen.</small></div><div class="empire-create-actions"><button type="button" data-close-dialog="empireDialog">Abbrechen</button><button class="primary" type="submit">Empire gründen</button></div></form>';
    document.body.append(dialog);
  }
}

function showHome(){
  const state=api.getState();
  main.innerHTML=`<div class="home-wrap"><section class="home-masthead"><div class="home-copy"><div class="eyebrow">ZFC MOTORSPORT GROUP / MANAGER CAREER</div><h1>Racing Empire</h1><p>Gründe deinen Rennstall, baue ein Team mit eigener Identität und kämpfe dich über zehn Rennwochenenden an die Spitze.</p><div class="home-actions"><button class="primary" data-home-action="create">Empire erstellen</button><button data-home-action="continue">Spiel öffnen</button></div></div></section><div class="home-grid"><section class="home-section"><div class="eyebrow">SO FUNKTIONIERT DAS SPIEL</div><h2>Vom ersten Gebäude bis zum Titel</h2><div class="home-steps"><div class="home-step"><b>01 · HQ aufbauen</b><span>Werkstatt, Labor, Simulator und weitere Einrichtungen frei platzieren.</span></div><div class="home-step"><b>02 · Crew einsetzen</b><span>Fachkräfte einstellen, Gebäuden zuweisen und ihre Arbeit verbessern.</span></div><div class="home-step"><b>03 · Auto entwickeln</b><span>Fahrer trainieren, Forschung betreiben und dein zweifarbiges Design festlegen.</span></div><div class="home-step"><b>04 · Rennen fahren</b><span>Strategie wählen, zehn verschiedene Strecken absolvieren und Punkte sammeln.</span></div></div></section><section class="home-section"><div class="eyebrow">DEIN ZIEL</div><h2>Die Meisterschaft gewinnen</h2><div class="home-goal"><span>10 Rennwochenenden</span><b>Kalender</b></div><div class="home-goal"><span>Punkte für beide Fahrer</span><b>Wertung</b></div><div class="home-goal"><span>Campus, Crew und Forschung</span><b>Management</b></div><div class="home-goal"><span>${state.mode==='sandbox'?'Sandbox':'Story-Modus'} · Saison ${state.season}</span><b>${state.races} Rennen</b></div><p class="muted" style="margin-top:14px">Konto anmelden, damit dein Empire deinem Supabase-Profil zugeordnet und zwischen Geräten gespeichert wird. Gastspielstände bleiben lokal.</p></section></div></div>`;
}

const showHomeWithoutHQ=showHome;showHome=function(){showHomeWithoutHQ();main.innerHTML=main.innerHTML.replace('01 · HQ aufbauen','01 · Fahrerteam aufbauen').replace('Werkstatt, Labor, Simulator und weitere Einrichtungen frei platzieren.','Finde und verpflichte Talente aus 15 Fahrerprofilen für dein Team.').replace('Campus, Crew und Forschung','Fahrer, Strategie und Forschung');};

function showCreateEmpire(){
  ensureDialogs();
  const state=api.getState(),livery=api.getTeamLivery();
    document.querySelector('#newEmpireName').value=currentUser?.user_metadata?.company_name||'';
    document.querySelector('#newEmpirePrimary').value=livery.primary||'#e3263a';
    document.querySelector('#newEmpireAccent').value=livery.secondary||'#f0f2f3';
  document.querySelector('#empireStatus').textContent=currentUser?`Angemeldet als ${currentUser.email}.`:'';
  document.querySelector('#empireDialog').showModal();
    window.dispatchEvent(new Event('zfc:empire-create'));
}

function showLogin(){
  ensureDialogs();
  document.querySelector('#authConfigWarning').classList.toggle('hide',configured());
  document.querySelector('#authStatus').textContent='';
  document.querySelector('#loginDialog').showModal();
}

function renderRoute(){
  createToolbar();ensureDialogs();
  if(!currentUser){
    document.body.classList.add('account-locked');
    if(api.getPage()!=='home'){main.dataset.accountRoute='';api.setPage('home');return;}
  }else document.body.classList.remove('account-locked');
  if(api.getPage()==='home'){
    if(main.dataset.accountRoute!=='home'){main.dataset.accountRoute='home';showHome();main.innerHTML=main.innerHTML.replace('01 · HQ aufbauen','01 · Fahrerteam aufbauen').replace('Werkstatt, Labor, Simulator und weitere Einrichtungen frei platzieren.','Finde und verpflichte Talente aus 15 Fahrerprofilen für dein Team.');}
  }else main.dataset.accountRoute='';
  updateToolbar();
}

function goToPage(page){
  document.querySelector(`#nav [data-page="${page}"]`)?.click();
}

function makeFreshEmpire(name,primary,secondary){
  api.createEmpire(name,primary,secondary);
}

function validCloudSave(value){
  if(!value||typeof value!=='object'||value.v!==1||typeof value.name!=='string'||value.name.length<2||value.name.length>40)return false;
  if(!Number.isFinite(value.cash)||value.cash<0||!Number.isInteger(value.round)||value.round<0||value.round>9)return false;
  return value.tiles&&Array.isArray(value.drivers)&&value.drivers.length===2&&Array.isArray(value.standings)&&value.standings.length===6&&/^#[0-9a-f]{6}$/i.test(value.color);
}

function applyCloudSave(value){
  if(!validCloudSave(value))throw Error('Der gespeicherte Empire-Spielstand ist ungültig.');
  api.replaceSave(value);
}

async function loadPlayerEmpire(user){
  if(!client||loadedUserId===user.id)return;
  loadedUserId=user.id;
  const {data,error}=await client.from('empire_saves').select('save_data').eq('user_id',user.id).maybeSingle();
  if(error){loadedUserId=null;showAuthMessage(error.message);return;}
  if(data?.save_data){
    try{applyCloudSave(data.save_data);document.querySelector('#empireDialog')?.close();}
    catch(error){loadedUserId=null;showAuthMessage(error.message);}
  }else if(api.getState().name!=='Phoenix Racing')scheduleCloudSave(api.getState());
  else showCreateEmpire();
  updateToolbar();
}

function showAuthMessage(message){
  const status=document.querySelector('#authStatus');if(status)status.textContent=message;
}

function scheduleCloudSave(value){
  if(!client||!currentUser||!value)return;
  clearTimeout(saveTimer);
  const snapshot=JSON.parse(JSON.stringify(value));
  saveTimer=setTimeout(async()=>{
    const {error}=await client.from('empire_saves').upsert({user_id:currentUser.id,company_name:snapshot.name,save_data:snapshot,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if(error)console.error('Supabase-Speicherung fehlgeschlagen:',error.message);
  },650);
}

async function initializeSupabase(){
  if(!configured())return;
  try{
    const {createClient}=await import(SUPABASE_MODULE);
    const config=window.ZFC_SUPABASE_CONFIG;
    client=createClient(config.url,config.anonKey||config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    if(data.session){currentUser=data.session.user;await loadPlayerEmpire(currentUser);}
    client.auth.onAuthStateChange((_event,session)=>{
      setTimeout(async()=>{
        currentUser=session?.user||null;
        if(currentUser)await loadPlayerEmpire(currentUser);
        else{loadedUserId=null;updateToolbar();}
      },0);
    });
  }catch(error){console.error('Supabase-Verbindung fehlgeschlagen:',error);const status=document.querySelector('#authStatus');if(status)status.textContent='Supabase konnte nicht verbunden werden. Prüfe Projekt-URL, Publishable-Key und Netzwerk.';}
}

function toggleMusic(){
  if(musicFrame){musicFrame.remove();musicFrame=null;musicPlaying=false;updateToolbar();return;}
  musicFrame=document.createElement('iframe');musicFrame.className='music-frame';musicFrame.title='ZFC Racing Empire Hintergrundmusik';musicFrame.allow='autoplay; encrypted-media; picture-in-picture';musicFrame.referrerPolicy='strict-origin-when-cross-origin';musicFrame.src=`https://www.youtube-nocookie.com/embed/uX6jCay0c6I?autoplay=1&loop=1&playlist=uX6jCay0c6I&controls=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;musicFrame.addEventListener('load',()=>{sendMusicCommand('unMute');sendMusicCommand('setVolume',[musicVolume]);sendMusicCommand('playVideo');setTimeout(()=>{sendMusicCommand('unMute');sendMusicCommand('setVolume',[musicVolume]);sendMusicCommand('playVideo');},700);});document.body.append(musicFrame);musicPlaying=true;updateToolbar();
}

function sendMusicCommand(func,args=[]){
  musicFrame?.contentWindow?.postMessage(JSON.stringify({event:'command',func,args}),'*');
}

function setMusicVolume(value){
  musicVolume=Math.max(0,Math.min(100,Number(value)||0));
  if(musicVolume>0){sendMusicCommand('unMute');sendMusicCommand('setVolume',[musicVolume]);}
  else sendMusicCommand('mute');
}

function setLoginMode(mode){
  loginMode=mode;document.querySelector('#authTitle').textContent=mode==='signin'?'Anmelden':'Konto erstellen';document.querySelector('#authSubmit').textContent=mode==='signin'?'Anmelden':'Registrieren';document.querySelector('#authModeToggle').textContent=mode==='signin'?'Konto erstellen':'Zum Login';document.querySelector('#authPassword').autocomplete=mode==='signin'?'current-password':'new-password';
}

async function submitAuth(event){
  event.preventDefault();
  if(!client){showAuthMessage('Supabase ist nicht eingerichtet. Du kannst lokal als Gast spielen.');return;}
  const email=document.querySelector('#authEmail').value.trim(),password=document.querySelector('#authPassword').value;
  showAuthMessage(loginMode==='signin'?'Anmeldung läuft …':'Konto wird erstellt …');
  const result=loginMode==='signin'?await client.auth.signInWithPassword({email,password}):await client.auth.signUp({email,password,options:{data:{}}});
  if(result.error){showAuthMessage(result.error.message);return;}
  currentUser=result.data.user||result.data.session?.user||null;
  if(result.data.session&&currentUser){document.querySelector('#loginDialog').close();await loadPlayerEmpire(currentUser);updateToolbar();}
  else showAuthMessage('Prüfe dein E-Mail-Postfach und bestätige die Anmeldung, bevor du dich einloggst.');
}

function submitEmpire(event){
  event.preventDefault();
  const name=document.querySelector('#newEmpireName').value.trim(),primary=document.querySelector('#newEmpirePrimary').value,secondary=document.querySelector('#newEmpireAccent').value;
  if(name.length<2||name.length>40){document.querySelector('#empireStatus').textContent='Der Unternehmensname muss 2 bis 40 Zeichen haben.';return;}
  const dialog=document.querySelector('#empireDialog');
  dialog.close();
  try{makeFreshEmpire(name,primary,secondary);}
  catch(error){document.querySelector('#empireStatus').textContent=error.message;dialog.showModal();return;}
  if(currentUser&&client)client.auth.updateUser({data:{company_name:name}}).then(({error})=>{if(error)console.error('Profilname konnte nicht aktualisiert werden:',error.message);});
  showEmpireLaunch(name,primary,secondary);
}

function showEmpireLaunch(name,primary,secondary){
  document.querySelector('.empire-launch')?.remove();
  const overlay=document.createElement('section');overlay.className='empire-launch';
  overlay.style.setProperty('--launch-primary',primary);overlay.style.setProperty('--launch-accent',secondary);
  overlay.innerHTML='<div class="empire-launch-inner"><div class="empire-launch-kicker">RACING EMPIRE · TEAM CONFIRMED</div><h1 class="empire-launch-name"></h1><div class="empire-launch-livery"><span class="empire-launch-livery-primary"></span><span class="empire-launch-livery-accent"></span></div><div class="empire-launch-subtitle">Deine Saison beginnt jetzt</div></div>';
  overlay.querySelector('.empire-launch-name').textContent=name;
  document.body.append(overlay);
  requestAnimationFrame(()=>overlay.classList.add('visible'));
  setTimeout(()=>{overlay.classList.remove('visible');setTimeout(()=>overlay.remove(),500);api.setPage('overview');},4000);
}

function bindEvents(){
  window.addEventListener('zfc:save',()=>scheduleCloudSave(api.getState()));
  document.body.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.id==='accountToggle'){
      if(currentUser){client?.auth.signOut();currentUser=null;loadedUserId=null;updateToolbar();goToPage('home');}
      else showLogin();
    }
    if(button.id==='musicToggle')toggleMusic();
    if(button.dataset.homeAction==='create'){
      if(currentUser){loadPlayerEmpire(currentUser);}else showLogin();
    }
    if(button.dataset.homeAction==='continue'){
      if(currentUser)loadPlayerEmpire(currentUser);else showLogin();
    }
    if(button.dataset.closeDialog){document.querySelector('#'+button.dataset.closeDialog)?.close();}
    if(button.id==='authModeToggle')setLoginMode(loginMode==='signin'?'signup':'signin');
  });
  document.querySelector('#authForm').addEventListener('submit',submitAuth);
  document.querySelector('#empireForm').addEventListener('submit',submitEmpire);
  nav.addEventListener('click',event=>{if(!currentUser){event.preventDefault();event.stopImmediatePropagation();api.setPage('home');showLogin();}});
  document.body.addEventListener('input',event=>{if(event.target.id==='musicVolume')setMusicVolume(event.target.value);});
  document.querySelector('#empireDialog').addEventListener('close',()=>{const canvas=document.querySelector('#newEmpireCar');if(canvas)canvas.dispatchEvent(new Event('pointercancel',{bubbles:true}));});
  api.subscribeSave(value=>scheduleCloudSave(value));
}

const observer=new MutationObserver(()=>requestAnimationFrame(renderRoute));
observer.observe(nav,{childList:true});observer.observe(main,{childList:true});
createToolbar();ensureDialogs();bindEvents();
if(api.getPage()==='home'){main.dataset.accountRoute='home';showHome();}
updateToolbar();
initializeSupabase();
