import {getJSON,esc,badge,cite,withCites,CONF,CONF_HELP,confOn} from '../core.js';
let root,site;
export async function mount(el){
  root=el; site=await getJSON('site.json');
  const S=site.overview;
  el.innerHTML=`
  <div class="hero"><div class="eyebrow">${esc(S.eyebrow)}</div>
   <div class="herohead"><span class="wbox" aria-hidden="true"><i>74</i><b>W</b><small>183.84</small></span>
   <div><h1>${esc(S.headline)}</h1><p style="max-width:68ch">${withCites(S.summary)}</p></div></div>
   <p class="warn"><strong>Read this first:</strong> ${esc(S.caveat)}</p></div>
  <div class="grid g4" id="stats"></div>
  <div class="card" style="margin-top:16px"><h2>What a fusion plant needs</h2>
   <p class="note">Five raw-material groups appear in nearly every magnetic-confinement design. The highlighted row is the material this project traces.</p>
   <div class="tablewrap"><table class="tbl" id="mats"><thead><tr><th>Material</th><th>Fusion component</th><th>Top producing countries</th><th>Documented human-rights risks</th><th>Sources</th></tr></thead><tbody></tbody></table></div></div>
  <div class="grid g2" style="margin-top:16px;align-items:start">
   <div class="card"><h2>Why tungsten</h2><p>${withCites(site.recommendation.text)}</p><ol>${site.recommendation.reasons.map(r=>`<li>${withCites(r)}</li>`).join('')}</ol>
    <p class="note">${withCites(site.recommendation.runnerup)}</p></div>
   <div class="card"><h2>Start exploring</h2><div class="btnrow">
     <a class="btn primary" href="#systems">Systems map</a><a class="btn" href="#risks">The 5 risks</a><a class="btn" href="#brief">Policy brief</a><a class="btn" href="#method">Methodology</a></div>
     <h3>How to read confidence labels</h3>
     ${CONF.map(c=>`<p style="margin:.3em 0">${badge(c)} ${esc(CONF_HELP[c])}</p>`).join('')}</div></div>`;
  update();
}
export function update(){
  if(!root) return;
  root.querySelector('#stats').innerHTML=site.overview.stats.filter(s=>confOn(s.confidence)).map(s=>`<div class="card stat">
     <div class="num">${esc(s.value)}</div><div class="lbl">${esc(s.label)}</div>${badge(s.confidence)} ${cite(s.src)}</div>`).join('')||'<p class="empty">No figures match the confidence filter.</p>';
  root.querySelector('#mats tbody').innerHTML=site.materials.map(m=>`<tr class="${m.pick?'pick':''}">
    <td><strong>${esc(m.material)}</strong>${m.pick?'<br><span class="tag v">traced here</span>':''}</td>
    <td>${withCites(m.component)}</td><td>${withCites(m.producers)}</td><td>${withCites(m.risks)}</td><td>${cite(m.src)}</td></tr>`).join('');
}
