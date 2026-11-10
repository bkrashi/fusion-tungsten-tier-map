import {getJSON,esc,withCites} from '../core.js';
const item = s => typeof s==='string' ? withCites(s) : `<span class="tag ${s.v?'v':'i'}">${s.v?'verified':'inference'}</span> ${withCites(s.t)}`;
export async function mount(el){
  const B=(await getJSON('site.json')).brief;
  el.innerHTML=`<article class="card brief">
   <div class="memo-head"><span>TO</span><span>${esc(B.to)}</span><span>FROM</span><span>${esc(B.from)}</span><span>DATE</span><span>${esc(B.date)}</span><span>RE</span><span>${esc(B.re)}</span></div>
   <h1 style="font-size:1.9rem">${esc(B.title)}</h1>
   <p><strong>Bottom line.</strong> ${withCites(B.bottom)}</p>
   <h2>The problem</h2><ul>${B.problem.map(s=>`<li>${item(s)}</li>`).join('')}</ul>
   <h2>Fix 1 (technology): ${esc(B.tech.name)}</h2><p>${withCites(B.tech.what)}</p><ul>${B.tech.how.map(s=>`<li>${item(s)}</li>`).join('')}</ul>
   <h2>Fix 2 (policy): ${esc(B.policy.name)}</h2><p>${withCites(B.policy.what)}</p><ul>${B.policy.how.map(s=>`<li>${item(s)}</li>`).join('')}</ul>
   <h2>Costs and objections</h2><ul>${B.objections.map(s=>`<li>${item(s)}</li>`).join('')}</ul>
   <h2>Recommended next steps</h2><ol>${B.next.map(s=>`<li>${withCites(s)}</li>`).join('')}</ol>
   <div class="split" style="margin-top:18px">
    <div class="factbox"><h4>Verified facts this brief relies on</h4><ul>${B.facts.map(s=>`<li>${withCites(s)}</li>`).join('')}</ul></div>
    <div class="factbox inf"><h4>Inferences and judgments</h4><ul>${B.inferences.map(s=>`<li>${withCites(s)}</li>`).join('')}</ul></div>
   </div>
  </article>`;
}
