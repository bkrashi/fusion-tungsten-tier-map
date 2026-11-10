import {getJSON,loadScript,esc,badge,cite,withCites,confOn} from '../core.js';
const TIERS=['Tier 0 · Deployment','Tier 1 · Component manufacturing','Tier 2 · Powder, APT & refining','Tier 3 · Concentrate processing & trade','Tier 4 · Mine'];
let d3,root,ents,rels,geo,byId={},svg,g,nodes,links,nodeSel,linkSel,sel=null,zoom,W=900,H=640;
const rowY=t=>70+t*((H-110)/4);
const D3='https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js', TOPO='https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js';

export async function mount(el){
  root=el;
  el.innerHTML=`<h1>Systems map</h1>
  <p class="note">Tier 0 is where tungsten is deployed in a fusion machine; Tier 4 is the mine. Click a node to trace its upstream (toward mines) and downstream (toward reactors). Solid lines have a record behind them; dashed lines are inferred routes. The Sayari flags shown are graph-level risk indicators, not findings of wrongdoing.</p>
  <div class="subtabs" role="tablist"><button class="btn small primary" data-v="tiers" role="tab" aria-selected="true">Tier diagram</button><button class="btn small" data-v="world" role="tab" aria-selected="false">World map of flows</button></div>
  <div id="v-tiers">
   <div class="maptools"><button class="btn small" id="zin" aria-label="Zoom in">+</button><button class="btn small" id="zout" aria-label="Zoom out">−</button><button class="btn small" id="zreset">Reset view</button><button class="btn small" id="clr">Clear selection</button></div>
   <div class="tierwrap"><svg id="net" role="img" aria-label="Tungsten supply chain tier network. Use Tab to move between nodes and Enter to select."></svg>
   <aside class="card sidepanel" id="side" aria-live="polite"><h3>Select a node</h3><p>Pick any box to see its role, Sayari risk flags, the evidence for each link, and sources.</p></aside></div>
   <div class="card tablewrap" style="margin-top:16px"><h2>Tier table</h2><table class="tbl" id="tiertbl"><thead><tr><th>Tier</th><th>Entity</th><th>Country</th><th>Sayari risk flags</th><th>Evidence for link</th><th>Confidence</th></tr></thead><tbody></tbody></table></div>
  </div>
  <div id="v-world" hidden>
   <div class="legend-row" id="wlegend"></div>
   <div class="mapwrap"><svg id="worldmap" viewBox="0 0 960 500" role="img" aria-label="World map of tungsten mine production and trade flows"></svg></div>
   <div class="grid g2" style="margin-top:12px;align-items:start"><div class="card" id="wside" aria-live="polite"><h3>Select a country or flow</h3><p>Shaded countries mine tungsten (USGS 2025 estimates). Arcs are trade and supply links; hover or tap for the evidence.</p></div>
   <div class="card"><h3>Flow list</h3><div id="flowlist"></div></div></div>
  </div>`;
  el.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>view(b.dataset.v)); if(location.search.includes('world')) setTimeout(()=>view('world'),0);
  await loadScript(D3); await loadScript(TOPO); d3=window.d3;
  [ents,rels,geo]=await Promise.all([getJSON('entities.json'),getJSON('relationships.json'),getJSON('geo.json')]);
  ents.forEach(e=>byId[e.id]=e);
  draw(); table(); await world();
  root.querySelector('#zin').onclick=()=>svg.transition().call(zoom.scaleBy,1.4);
  root.querySelector('#zout').onclick=()=>svg.transition().call(zoom.scaleBy,1/1.4);
  root.querySelector('#zreset').onclick=()=>svg.transition().call(zoom.transform,d3.zoomIdentity);
  root.querySelector('#clr').onclick=()=>select(null);
  new ResizeObserver(()=>{ const w=root.querySelector('#net').clientWidth; if(w&&Math.abs(w-W)>40&&!root.hidden) draw(); }).observe(root.querySelector('#net'));
}
function view(v){
  root.querySelectorAll('[data-v]').forEach(b=>{const on=b.dataset.v===v; b.classList.toggle('primary',on); b.setAttribute('aria-selected',on)});
  root.querySelector('#v-tiers').hidden=v!=='tiers'; root.querySelector('#v-world').hidden=v!=='world';
  if(v==='tiers') draw();
}
const flagList = e => (e.flags||[]).length?e.flags.map(f=>`<code>${esc(f)}</code>`).join(' '):'<span style="color:var(--muted)">none returned</span>';
function draw(){
  svg=d3.select(root.querySelector('#net')); svg.selectAll('*').remove();
  W=root.querySelector('#net').clientWidth||900; H=root.querySelector('#net').clientHeight||640;
  const per={}; ents.forEach(e=>per[e.tier]=(per[e.tier]||0)+1); const idx={};
  nodes=ents.map(e=>{ const i=idx[e.tier]=(idx[e.tier]||0), n=per[e.tier]; idx[e.tier]++; const step=(W-40)/n;
    return {...e,tw:Math.min(170,step-10),x:20+step*(i+.5),y:rowY(e.tier)}; });
  const nb={}; nodes.forEach(n=>nb[n.id]=n);
  links=rels.filter(r=>nb[r.from]&&nb[r.to]).map(r=>({...r,source:nb[r.from],target:nb[r.to]}));
  zoom=d3.zoom().scaleExtent([.4,3]).on('zoom',e=>g.attr('transform',e.transform));
  svg.call(zoom).on('dblclick.zoom',null);
  g=svg.append('g');
  const band=g.append('g').attr('class','band');
  TIERS.forEach((t,i)=>{ band.append('line').attr('x1',0).attr('x2',W).attr('y1',rowY(i)-26).attr('y2',rowY(i)-26); band.append('text').attr('x',8).attr('y',rowY(i)-31).text(t); });
  linkSel=g.append('g').selectAll('path').data(links).join('path').attr('class',d=>'net-link '+(d.confidence==='Inferred'?'claim':''))
    .attr('stroke-width',d=>d.type==='ownership'?1.5:2.2)
    .attr('data-tip',d=>`${byId[d.from].name} → ${byId[d.to].name} · ${d.product||d.type} (${d.confidence}). ${d.evidence}`);
  nodeSel=g.append('g').selectAll('g').data(nodes).join('g').attr('class','net-node').attr('tabindex',0).attr('role','button')
    .attr('aria-label',d=>`${d.name}, ${d.country}, tier ${d.tier}, ${d.confidence}`).attr('data-tip',d=>`${d.name} · ${d.country} · ${d.confidence}`)
    .on('click',(e,d)=>{e.stopPropagation();select(d.id)}).on('keydown',(e,d)=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();select(d.id)} });
  nodeSel.append('rect').attr('rx',5).attr('height',36).attr('y',-18).attr('width',d=>d.tw).attr('x',d=>-d.tw/2)
    .attr('stroke',d=>`var(--c-${d.confidence})`);
  nodeSel.append('text').attr('text-anchor','middle').attr('y',-2).text(d=>{const m=Math.floor(d.tw/5.8);return d.name.length>m?d.name.slice(0,m-1)+'…':d.name});
  nodeSel.append('text').attr('text-anchor','middle').attr('y',12).attr('style','font-size:9.5px;fill:var(--muted)').text(d=>d.country+((d.flags||[]).some(f=>/forced|uflpa|xinjiang|sanction|conflict|child/i.test(f))?' · ⚑':''));
  nodeSel.call(d3.drag().on('drag',(e,d)=>{d.x=e.x;d.y=e.y;tick()}));
  svg.on('click',()=>select(null));
  tick(); update(); if(sel) select(sel.id,true);
}
function tick(){
  nodeSel.attr('transform',d=>`translate(${d.x},${d.y})`);
  linkSel.attr('d',d=>{ const sx=d.source.x,sy=d.source.y,tx=d.target.x,ty=d.target.y,my=(sy+ty)/2; return `M${sx},${sy}C${sx},${my} ${tx},${my} ${tx},${ty}`; });
}
export function update(){
  if(nodeSel){
    nodeSel.style('display',d=>confOn(d.confidence)?null:'none');
    linkSel.style('display',d=>confOn(d.confidence)&&confOn(d.source.confidence)&&confOn(d.target.confidence)?null:'none');
  }
  if(root&&ents) table();
  if(root&&geo&&wsvg) worldUpdate();
}
// rel.from = supplier (upstream), rel.to = buyer (downstream)
function walk(start,dir){
  const seen=new Set([start]),edges=new Set(),q=[start];
  while(q.length){ const x=q.shift(); rels.forEach(r=>{ const [a,b]=dir==='up'?[r.to,r.from]:[r.from,r.to]; if(a===x){ edges.add(r.id); if(!seen.has(b)){seen.add(b);q.push(b)} } }); }
  return {seen,edges};
}
function select(id,keep){
  sel=id?byId[id]:null; const side=root.querySelector('#side');
  if(!sel){ nodeSel.classed('dim',false); linkSel.classed('dim',false).classed('hl',false); side.innerHTML='<h3>Select a node</h3><p>Pick any box to see its role, Sayari risk flags, the evidence for each link, and sources.</p>'; return; }
  const up=walk(id,'up'),down=walk(id,'down'),on=new Set([...up.seen,...down.seen]),eon=new Set([...up.edges,...down.edges]);
  nodeSel.classed('dim',d=>!on.has(d.id)); linkSel.classed('dim',d=>!eon.has(d.id)).classed('hl',d=>eon.has(d.id));
  const conn=rels.filter(r=>r.from===id||r.to===id);
  side.innerHTML=`<h3>${esc(sel.name)}</h3>${badge(sel.confidence)}
   <dl class="kv" style="margin:12px 0"><dt>Tier</dt><dd>${esc(TIERS[sel.tier])}</dd><dt>Country</dt><dd>${esc(sel.country)}</dd><dt>Role</dt><dd>${withCites(sel.role)}</dd>
   <dt>Sayari flags</dt><dd>${flagList(sel)}</dd><dt>Evidence</dt><dd>${withCites(sel.evidence)}</dd>
   ${sel.sayari_id?`<dt>Sayari ID</dt><dd><a href="https://graph.sayari.com/resource/entity/${esc(sel.sayari_id)}" target="_blank" rel="noopener noreferrer"><code>${esc(sel.sayari_id)}</code> ↗</a><br><small>Sayari login required</small></dd>`:''}</dl>
   <p>${cite(sel.src)}</p>
   <details open><summary>Links (${conn.length})</summary><ul>${conn.map(r=>`<li>${esc(byId[r.from].name)} → ${esc(byId[r.to].name)} <small>(${esc(r.product||r.type)})</small> ${badge(r.confidence)}<br><small>${withCites(r.evidence)}</small></li>`).join('')||'<li>No links recorded.</li>'}</ul></details>`;
}
function table(){
  const rows=[...ents].sort((a,b)=>a.tier-b.tier).filter(e=>confOn(e.confidence));
  root.querySelector('#tiertbl tbody').innerHTML=rows.map(e=>{
    const up=rels.filter(r=>r.to===e.id);
    return `<tr><td class="mono">T${e.tier}</td><td><strong>${esc(e.name)}</strong></td><td>${esc(e.country)}</td><td>${flagList(e)}</td>
    <td>${up.length?up.map(r=>`<div><small>← ${esc(byId[r.from]?.name)}: ${withCites(r.evidence)}</small></div>`).join(''):`<small>${withCites(e.evidence)}</small>`}</td><td>${badge(e.confidence)}</td></tr>`}).join('');
}
export function show(f){ if(f?.node&&byId[f.node]&&nodeSel){ view('tiers'); select(f.node,true); } }
export function theme(){}

// ---------- world map ----------
let wsvg,proj,arcSel,prodSel;
const KIND={supply:'var(--accent2)',corridor:'var(--c-Sayari)',risk:'var(--sev-high)'};
async function world(){
  const topo=await getJSON('countries-110m.json');
  const land=topojson.feature(topo,topo.objects.countries);
  wsvg=d3.select(root.querySelector('#worldmap'));
  proj=d3.geoNaturalEarth1().fitExtent([[6,6],[954,494]],{type:'Sphere'});
  const path=d3.geoPath(proj);
  const prod={}; geo.producers.forEach(p=>prod[p.id]=p);
  const max=d3.max(geo.producers,p=>p.tonnes);
  const color=d3.scaleSqrt().domain([0,max]).range([0.18,1]);
  wsvg.append('path').attr('d',path({type:'Sphere'})).attr('fill','var(--sea)');
  prodSel=wsvg.append('g').selectAll('path').data(land.features).join('path')
    .attr('d',path).attr('class',d=>prod[d.id]?'prod':'land')
    .attr('fill',d=>prod[d.id]?'var(--accent2)':null).attr('fill-opacity',d=>prod[d.id]?color(prod[d.id].tonnes):null)
    .attr('data-tip',d=>prod[d.id]?`${prod[d.id].name}: ${prod[d.id].tonnes.toLocaleString()} t W mine production (${prod[d.id].year} est.)`:null)
    .on('click',(e,d)=>{ const p=prod[d.id]; if(p) wside(`<h3>${esc(p.name)}</h3><p><strong>${p.tonnes.toLocaleString()} t</strong> tungsten content, ${esc(p.year)} estimate (${(p.tonnes/geo.world_total*100).toFixed(1)}% of world).</p><p>${withCites(p.note||'')}</p><p>${cite(p.src)}</p>`); });
  const gArc=wsvg.append('g');
  arcSel=gArc.selectAll('path').data(geo.flows).join('path')
    .attr('class',d=>'arc'+(d.confidence==='Inferred'?' dash':''))
    .attr('d',d=>{ const a=proj(d.from),b=proj(d.to),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],k=.22; return `M${a}Q${mx+dy*k},${my-dx*k} ${b}`; })
    .attr('stroke',d=>KIND[d.kind]||'var(--accent)').attr('stroke-width',d=>1.2+(d.weight||1)*.7)
    .attr('data-tip',d=>`${d.fromName} → ${d.toName}: ${d.label}`)
    .on('click',(e,d)=>wside(`<h3>${esc(d.fromName)} → ${esc(d.toName)}</h3>${badge(d.confidence)}<p>${withCites(d.label)}</p>${d.hs?`<p><small>HS ${esc(d.hs)}</small></p>`:''}<p>${cite(d.src)}</p>`));
  const gn=wsvg.append('g').selectAll('g').data(geo.nodes).join('g').attr('class','node').attr('transform',d=>`translate(${proj([d.lon,d.lat])})`)
    .attr('data-tip',d=>d.name+' · '+d.role);
  gn.append('circle').attr('r',4.5).attr('fill',d=>d.type==='deploy'?'var(--accent)':d.type==='mfg'?'var(--link)':'var(--ink)');
  gn.append('text').attr('x',d=>d.dx??7).attr('y',d=>d.dy??3).attr('text-anchor',d=>d.anchor||'start').text(d=>d.short||d.name);
  root.querySelector('#wlegend').innerHTML=`<span><span class="sw" style="background:var(--accent2);opacity:.35"></span><span class="sw" style="background:var(--accent2)"></span>Tungsten mine output (darker = more)</span>
   <span><span class="sw" style="background:var(--accent2);height:3px"></span>Documented supply link</span><span><span class="sw" style="background:var(--c-Sayari);height:3px"></span>Sayari trade corridor (HS 2611/8101)</span>
   <span><span class="sw" style="background:var(--sev-high);height:3px"></span>Risk route (smuggling, conflict)</span><span>Dashed = inferred</span>`;
  worldUpdate();
}
function worldUpdate(){
  arcSel.style('display',d=>confOn(d.confidence)?null:'none');
  root.querySelector('#flowlist').innerHTML='<ul style="padding-left:18px;margin:0">'+geo.flows.filter(f=>confOn(f.confidence)).map(f=>`<li><strong>${esc(f.fromName)} → ${esc(f.toName)}</strong> ${badge(f.confidence)}<br><small>${withCites(f.label)}</small></li>`).join('')+'</ul>';
}
function wside(h){ root.querySelector('#wside').innerHTML=h; }
