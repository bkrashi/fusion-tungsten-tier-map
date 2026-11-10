import {getJSON,esc,badge,withCites,confOn} from '../core.js';
let S=[],root,sortK='id',sortD=1;
const COLS=[['id','ID'],['title','Title'],['publisher','Publisher'],['date','Date'],['type','Type'],['confidence','Confidence']];
export async function mount(el){
  root=el; const M=(await getJSON('site.json')).method; S=await getJSON('sources.json');
  el.innerHTML=`<h1>Methodology</h1><div class="grid g2" style="align-items:start">
   <div class="card"><h2>Tools</h2><dl class="kv">${M.tools.map(t=>`<dt>${esc(t.name)}</dt><dd>${withCites(t.use)}</dd>`).join('')}</dl>
    <h3 style="margin-top:16px">Steps</h3><ol>${M.steps.map(s=>`<li>${withCites(s)}</li>`).join('')}</ol></div>
   <div class="card"><h2>Confidence levels</h2>${M.confidence.map(([c,d])=>`<p style="margin:.4em 0">${badge(c)} ${esc(d)}</p>`).join('')}
    <h3 style="margin-top:16px">Ratings</h3><ul>${M.ratings.map(s=>`<li>${withCites(s)}</li>`).join('')}</ul></div>
   <div class="card" style="grid-column:1/-1"><h2>Queries run</h2><div class="tablewrap"><table class="tbl"><thead><tr><th>Tool</th><th>Query</th><th>Result</th></tr></thead>
    <tbody>${M.queries.map(q=>`<tr><td>${esc(q.tool)}</td><td><code>${esc(q.q)}</code></td><td><small>${withCites(q.r)}</small></td></tr>`).join('')}</tbody></table></div></div>
   <div class="card"><h2>Data limits</h2><ul>${M.limits.map(s=>`<li>${withCites(s)}</li>`).join('')}</ul></div>
   <div class="card"><h2>What we could not confirm</h2><ul>${M.gaps.map(s=>`<li>${withCites(s)}</li>`).join('')}</ul></div>
  </div>
  <h2 style="margin-top:24px">Evidence locker</h2>
  <p class="note">Every source cited on this site. The ID matches the citation chips used throughout.</p>
  <div class="controls"><input id="evq" type="search" placeholder="Filter sources…" aria-label="Filter sources"><select id="evt" aria-label="Filter by type"><option value="">All types</option>${[...new Set(S.map(s=>s.type))].sort().map(t=>`<option>${esc(t)}</option>`).join('')}</select><span id="evn" class="note"></span></div>
  <div class="card tablewrap"><table class="tbl"><thead><tr>${COLS.map(([k,l])=>`<th data-k="${k}" tabindex="0" aria-sort="none" style="cursor:pointer">${l}</th>`).join('')}<th>Link</th><th>Supports</th></tr></thead><tbody id="evb"></tbody></table></div>`;
  el.querySelector('#evq').oninput=update; el.querySelector('#evt').onchange=update;
  el.querySelectorAll('th[data-k]').forEach(th=>{ const f=()=>{ const k=th.dataset.k; sortD=sortK===k?-sortD:1; sortK=k; update(); }; th.onclick=f; th.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();f()}}; });
  update();
}
export function show(f){ if(f?.q!==undefined){ root.querySelector('#evq').value=f.q; update(); root.querySelector('#evq').scrollIntoView({block:'center'}); } }
export function update(){
  if(!root) return;
  const q=root.querySelector('#evq').value.toLowerCase(), t=root.querySelector('#evt').value;
  const rows=S.filter(s=>confOn(s.confidence)&&(!t||s.type===t)&&(!q||JSON.stringify(s).toLowerCase().includes(q))).sort((a,b)=>String(a[sortK]).localeCompare(String(b[sortK]),undefined,{numeric:true})*sortD);
  root.querySelectorAll('th[data-k]').forEach(th=>th.setAttribute('aria-sort',th.dataset.k===sortK?(sortD>0?'ascending':'descending'):'none'));
  root.querySelector('#evb').innerHTML=rows.map(s=>`<tr id="src-${s.id}"><td class="mono"><strong>${esc(s.id)}</strong></td><td>${esc(s.title)}</td><td>${esc(s.publisher)}</td><td class="mono">${esc(s.date)}</td><td>${esc(s.type)}</td><td>${badge(s.confidence)}</td>
   <td><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Open ↗</a><br><small>accessed ${esc(s.accessed)}</small></td><td><small>${esc(s.notes)}</small></td></tr>`).join('')||'<tr><td colspan="8">No sources match the current filters.</td></tr>';
  root.querySelector('#evn').textContent=`${rows.length} of ${S.length} sources`;
}
