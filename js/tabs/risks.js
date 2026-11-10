import {getJSON,loadScript,esc,badge,cite,withCites,confOn} from '../core.js';
let root,R,d3;
const meter=(n,cls)=>`<span class="meter ${cls}" aria-hidden="true">${[1,2,3,4,5].map(i=>`<span class="${i<=n?'on':''}"></span>`).join('')}</span>`;
const sevWord=n=>['','Low','Low','Moderate','High','Severe'][n];
const trWord=n=>['','Opaque','Weak','Partial','Good','Strong'][n];
const sevVar=n=>n>=4?'var(--sev-high)':n===3?'var(--sev-med)':'var(--sev-low)';
export async function mount(el){
  root=el; R=await getJSON('risks.json');
  await loadScript('https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js'); d3=window.d3;
  el.innerHTML=`<h1>Five human-rights risks along the tungsten chain</h1>
  <p class="note">Severity rates how grave and widespread the documented harm is. Traceability rates how well a fusion buyer could follow tungsten from that risk back to a named mine, using public records, trade data, smelter audits and Sayari. The ratings are analyst judgments based on the cited evidence.</p>
  <div class="grid g2" style="align-items:start">
   <div class="card matrix"><h2>Severity × traceability</h2><svg id="mx" viewBox="0 0 440 340" role="img" aria-label="Scatter of five risks by severity and traceability"></svg>
    <p class="note">Top-left is the worst place to be: grave harm that buyers cannot see. Click a dot to jump to its evidence.</p></div>
   <div class="card"><h2>Ranking</h2><table class="tbl"><thead><tr><th>#</th><th>Risk</th><th>Severity</th><th>Traceability</th></tr></thead><tbody id="rk"></tbody></table></div>
  </div>
  <div id="cards" class="grid" style="margin-top:16px"></div>`;
  update();
}
export function update(){
  const rows=R.filter(r=>confOn(r.confidence));
  root.querySelector('#rk').innerHTML=rows.map(r=>`<tr><td class="mono">${r.rank}</td><td><a href="#risks" data-jump="${r.id}">${esc(r.title)}</a><br><small>${esc(r.region)}</small></td>
   <td><span class="sev">${meter(r.severity,'s')} ${sevWord(r.severity)}</span></td><td><span class="sev">${meter(r.traceability,'t')} ${trWord(r.traceability)}</span></td></tr>`).join('');
  root.querySelector('#cards').innerHTML=rows.map(r=>`<article class="card" id="risk-${r.id}"><div class="risk" style="--sev:${sevVar(r.severity)}">
    <span class="rank">${r.rank}</span><h2 style="margin:0">${esc(r.title)}</h2>
    <div class="legend-row"><span>${esc(r.region)}</span><span class="sev">Severity ${meter(r.severity,'s')} ${sevWord(r.severity)}</span><span class="sev">Traceability ${meter(r.traceability,'t')} ${trWord(r.traceability)}</span>${badge(r.confidence)}</div>
    <p style="margin:.4em 0 0">${withCites(r.summary)}</p></div>
    <div class="split" style="margin-top:12px">
     <div class="factbox"><h4>Verified evidence</h4><ul>${r.evidence.map(e=>`<li>${withCites(e)}</li>`).join('')}</ul></div>
     <div class="factbox inf"><h4>Sayari findings &amp; inference</h4><ul>${(r.sayari||[]).map(e=>`<li>${withCites(e)}</li>`).join('')}${(r.inference||[]).map(e=>`<li><span class="tag i">inference</span> ${withCites(e)}</li>`).join('')}</ul></div>
    </div>
    <p class="note" style="margin-top:10px"><strong>Why this traceability score:</strong> ${withCites(r.trace_reason)}</p></article>`).join('');
  root.querySelectorAll('[data-jump]').forEach(a=>a.onclick=e=>{e.preventDefault(); focus(a.dataset.jump)});
  matrix(rows);
}
function focus(id){ const c=root.querySelector('#risk-'+id); if(c){ c.scrollIntoView({behavior:'smooth',block:'start'}); c.style.outline='2px solid var(--accent2)'; setTimeout(()=>c.style.outline='',1600);} }
function matrix(rows){
  const svg=d3.select(root.querySelector('#mx')); svg.selectAll('*').remove();
  const m={l:46,r:14,t:14,b:40},w=440-m.l-m.r,h=340-m.t-m.b;
  const x=d3.scaleLinear().domain([0.5,5.5]).range([0,w]), y=d3.scaleLinear().domain([0.5,5.5]).range([h,0]);
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  g.append('rect').attr('x',0).attr('y',0).attr('width',x(3)).attr('height',y(3)).attr('fill','var(--sev-high)').attr('fill-opacity',.07);
  g.append('g').attr('class','grid').selectAll('line').data([1,2,3,4,5]).join('line').attr('x1',d=>x(d)).attr('x2',d=>x(d)).attr('y1',0).attr('y2',h);
  g.append('g').attr('class','grid').selectAll('line').data([1,2,3,4,5]).join('line').attr('y1',d=>y(d)).attr('y2',d=>y(d)).attr('x1',0).attr('x2',w);
  g.append('g').attr('class','axis').attr('transform',`translate(0,${h})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>trWord(d)));
  g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(5).tickFormat(d=>d));
  g.selectAll('.axis text').attr('style','fill:var(--muted)');
  g.append('text').attr('x',w/2).attr('y',h+34).attr('text-anchor','middle').text('Traceability →');
  g.append('text').attr('transform',`translate(-32,${h/2}) rotate(-90)`).attr('text-anchor','middle').text('Severity →');
  g.append('text').attr('x',6).attr('y',14).attr('style','fill:var(--sev-high);font-weight:600').text('Grave and hidden');
  const jit={}; const pt=g.selectAll('g.pt').data(rows).join('g').attr('class','pt').style('cursor','pointer')
    .attr('transform',d=>{const k=d.severity+'-'+d.traceability; const j=(jit[k]=(jit[k]||0)+1)-1; return `translate(${x(d.traceability)+j*16},${y(d.severity)-j*6})`})
    .attr('tabindex',0).attr('role','button').attr('aria-label',d=>`${d.title}: severity ${d.severity}, traceability ${d.traceability}`)
    .attr('data-tip',d=>d.title).on('click',(e,d)=>focus(d.id)).on('keydown',(e,d)=>{if(e.key==='Enter')focus(d.id)});
  pt.append('circle').attr('r',13).attr('fill',d=>sevVar(d.severity)).attr('stroke','var(--panel)').attr('stroke-width',2);
  pt.append('text').attr('text-anchor','middle').attr('y',4).attr('style','fill:var(--panel);font-weight:700;font-size:12px').text(d=>d.rank);
}
export function show(f){ if(f?.risk) setTimeout(()=>focus(f.risk),50); }
