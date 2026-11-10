import {CONF,state,bus,esc,getJSON,CONF_HELP,CONF_LABEL,ICON,isDark,store,loadSources} from './core.js';

const TABS = [['overview','Overview'],['systems','Systems Map'],['risks','Risks'],['brief','Policy Brief'],['method','Methodology']];
const mounted = {};
const view = document.getElementById('view'), loader = document.getElementById('loader');

const nav = document.getElementById('nav');
nav.innerHTML = TABS.map(([id,l])=>`<a href="#${id}" data-tab="${id}">${l}</a>`).join('');
const menuBtn = document.getElementById('menuBtn');
menuBtn.onclick = () => { const o=nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded',o); };
nav.onclick = e => { if(e.target.closest('a')){nav.classList.remove('open');menuBtn.setAttribute('aria-expanded',false)} };

document.getElementById('themeBtn').onclick = () => {
  const t = isDark()?'light':'dark'; document.documentElement.dataset.theme=t; store.set('fw-theme',t); bus.emit('theme',t);
};

const fb = document.getElementById('filters');
CONF.forEach(c=>{
  const b=document.createElement('button'); b.className='chip'; b.style.setProperty('--cc',`var(--c-${c})`);
  b.dataset.c=c; b.dataset.tip=CONF_HELP[c]; b.setAttribute('aria-pressed',state.conf.has(c));
  b.innerHTML=`${ICON[c]} ${CONF_LABEL[c]}`;
  b.onclick=()=>{
    if(state.conf.has(c)){ if(state.conf.size>1) state.conf.delete(c); } else state.conf.add(c);
    store.set('fw-conf',JSON.stringify([...state.conf]));
    fb.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',state.conf.has(x.dataset.c)));
    bus.emit('filter');
  };
  fb.appendChild(b);
});

const tip = document.getElementById('tip');
const showTip = (t,x,y) => { tip.textContent=t; tip.hidden=false; const w=tip.offsetWidth; tip.style.left=Math.min(innerWidth-w-8,Math.max(8,x+12))+'px'; tip.style.top=(y+16)+'px'; };
document.addEventListener('pointermove',e=>{ const el=e.target.closest?.('[data-tip]'); if(el&&e.pointerType!=='touch') showTip(el.dataset.tip,e.clientX,e.clientY); else tip.hidden=true; });
document.addEventListener('focusin',e=>{ const el=e.target.closest?.('[data-tip]'); if(el){const r=el.getBoundingClientRect(); showTip(el.dataset.tip,r.left,r.bottom-12)} });
document.addEventListener('focusout',()=>tip.hidden=true);

// Router: plain #tab hashes. In-tab focus is passed through state.focus (set by search).
export const nav2 = { focus:null };
function parse(){ const id=location.hash.slice(1)||'overview'; return TABS.some(t=>t[0]===id)?id:'overview'; }
let current=null, token=0;
async function route(){
  const id=parse(); const my=++token;
  nav.querySelectorAll('a').forEach(a=>{ if(a.dataset.tab===id)a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current')});
  document.title = `${TABS.find(t=>t[0]===id)[1]} · Fusion Tungsten Tier Map`;
  if(!mounted[id]){
    const sec=document.createElement('section'); sec.className='tab'; sec.id='tab-'+id; sec.hidden=true; view.appendChild(sec);
    mounted[id]={sec,mod:null}; loader.hidden=false;
    try{
      const mod=await import(`./tabs/${id}.js`);
      await mod.mount(sec); mounted[id].mod=mod;
    }catch(err){ console.error(err); sec.innerHTML=`<div class="empty">This section did not load (${esc(err.message)}). Reload the page to try again.</div>`; }
    loader.hidden=true;
  }
  if(my!==token) return;
  Object.entries(mounted).forEach(([k,v])=>{ v.sec.hidden = k!==id; });
  const m=mounted[id]; m.mod?.show?.(nav2.focus); nav2.focus=null;
  if(current!==id){ window.scrollTo({top:0}); view.focus({preventScroll:true}); }
  current=id;
}
addEventListener('hashchange',route);
bus.on('filter',()=>Object.values(mounted).forEach(m=>m.mod?.update?.()));
bus.on('theme',t=>Object.values(mounted).forEach(m=>m.mod?.theme?.(t)));

function go(tab,focus){ nav2.focus=focus||null; if(location.hash==='#'+tab) route(); else location.hash=tab; }

async function search(){
  const input=document.getElementById('q'), list=document.getElementById('results');
  const [ents,risks,srcs,site]=await Promise.all([getJSON('entities.json'),getJSON('risks.json'),getJSON('sources.json'),getJSON('site.json')]);
  document.getElementById('updated').textContent=site.updated; document.getElementById('legal').textContent=site.legal;
  const idx=[
    ...ents.map(e=>({t:e.name,s:`Tier ${e.tier} · ${e.country}`,k:(e.name+' '+(e.aliases||[]).join(' ')+' '+e.role+' '+e.country).toLowerCase(),go:['systems',{node:e.id}]})),
    ...risks.map(r=>({t:r.title,s:'risk · '+r.region,k:(r.title+' '+r.region+' '+r.summary).toLowerCase(),go:['risks',{risk:r.id}]})),
    ...srcs.map(s=>({t:s.title,s:`source ${s.id} · ${s.publisher}`,k:(s.id+' '+s.title+' '+s.publisher).toLowerCase(),go:['method',{q:s.id}]}))];
  let sel=-1,items=[];
  const render=()=>{ list.innerHTML=items.map((r,i)=>`<li role="option" id="r${i}" aria-selected="${i===sel}" data-i="${i}">${esc(r.t)}<small>${esc(r.s)}</small></li>`).join('')||'<li>No matches</li>'; list.hidden=false; };
  input.oninput=()=>{ const q=input.value.trim().toLowerCase(); if(!q){list.hidden=true;return} items=idx.filter(r=>r.k.includes(q)).slice(0,8); sel=-1; render(); };
  const pick=i=>{ const r=items[i]; if(!r)return; go(...r.go); list.hidden=true; input.value=''; input.blur(); };
  list.onclick=e=>{ const li=e.target.closest('li[data-i]'); if(li)pick(+li.dataset.i); };
  input.onkeydown=e=>{
    if(e.key==='ArrowDown'){sel=Math.min(items.length-1,sel+1);render();e.preventDefault()}
    else if(e.key==='ArrowUp'){sel=Math.max(0,sel-1);render();e.preventDefault()}
    else if(e.key==='Enter'){pick(sel<0?0:sel)} else if(e.key==='Escape'){list.hidden=true}
  };
  document.addEventListener('click',e=>{ if(!e.target.closest('.search'))list.hidden=true; });
}
window.__go = go;
loadSources().then(()=>{ route(); search().catch(console.error); }).catch(e=>{ view.innerHTML=`<div class="empty">Data did not load (${esc(e.message)}). If you opened the file directly, serve the folder over HTTP: <code>python3 -m http.server 8000</code>.</div>`; });
