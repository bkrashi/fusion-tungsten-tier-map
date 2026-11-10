// Shared helpers, state and data loading.
export const CONF = ['Confirmed','Reported','Sayari','Inferred'];
export const ICON = {Confirmed:'✔',Reported:'●',Sayari:'◆',Inferred:'?'};
export const CONF_LABEL = {Confirmed:'Confirmed',Reported:'Reported',Sayari:'Sayari record',Inferred:'Inferred'};
export const CONF_HELP = {
  Confirmed:'Stated in a primary or official source (USGS, UN, a regulator, the company itself).',
  Reported:'Reported by a credible NGO, academic or press source; not checked against a primary document.',
  Sayari:'Present in the Sayari knowledge graph (corporate registry, trade or watchlist record). Not independently confirmed.',
  Inferred:'Analyst inference or an illustrative link. There is no direct source.'};

const store = {
  get(k){ try{ return localStorage.getItem(k) }catch(e){ return null } },
  set(k,v){ try{ localStorage.setItem(k,v) }catch(e){} }
};
export { store };
let saved = null; try{ saved = JSON.parse(store.get('fw-conf')||'null') }catch(e){}
export const state = { conf:new Set(Array.isArray(saved)&&saved.length?saved.filter(c=>CONF.includes(c)):CONF) };
if(!state.conf.size) CONF.forEach(c=>state.conf.add(c));
const subs = {};
export const bus = { on(e,f){(subs[e]=subs[e]||[]).push(f)}, emit(e,d){(subs[e]||[]).forEach(f=>f(d))} };
export const confOn = c => state.conf.has(c);

export const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const badge = c => `<span class="badge" style="--cc:var(--c-${esc(c)})" data-icon="${ICON[c]||''}" data-tip="${esc(CONF_HELP[c]||'')}">${esc(CONF_LABEL[c]||c)}</span>`;
export const isDark = () => document.documentElement.dataset.theme === 'dark' ||
  (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);

const cache = {};
export function getJSON(name){ return cache[name] ||= fetch(`data/${name}`).then(r=>{ if(!r.ok) throw new Error(name+' '+r.status); return r.json(); }); }

const loaded = {};
export function loadScript(url){ return loaded[url] ||= new Promise((res,rej)=>{const s=document.createElement('script');s.src=url;s.onload=res;s.onerror=()=>rej(new Error('Failed to load '+url));document.head.appendChild(s)}); }

// Sources: loaded once by app.js, referenced everywhere by id.
export const SRC = {};
export async function loadSources(){ (await getJSON('sources.json')).forEach(s=>SRC[s.id]=s); return SRC; }
// Inline citation chips: cite(['S01','S04'])
export const cite = (ids=[]) => (ids||[]).map(id=>{ const s=SRC[id];
  if(!s) return `<span class="cite" title="Missing source">${esc(id)}</span>`;
  return `<a class="cite" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-tip="${esc(s.publisher+' · '+s.title+' ('+s.date+')')}">${esc(id)}</a>`; }).join('');
// Block list of sources with titles
export const srcList = (ids=[]) => ids?.length ? `<div class="src">Sources: ${ids.map(id=>{const s=SRC[id]; return s?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(id)} ${esc(s.publisher)}</a>`:esc(id)}).join(' · ')}</div>` : '';
// Render text with [S01] markers turned into citation chips
export const withCites = t => esc(t).replace(/\[((?:S|X)\d+(?:,\s*(?:S|X)\d+)*)\]/g,(_,g)=>cite(g.split(/,\s*/)));
