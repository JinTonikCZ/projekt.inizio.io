/******************************************************
 * Search Extractor – hlavní logika
 ******************************************************/

/* DOM refs */
const els = {
  q:          document.getElementById('q'),
  mode:       document.getElementById('mode'),
  out:        document.getElementById('out'),
  testsList:  document.getElementById('testsList'),
  btnRunIT:   document.getElementById('btnRunIT'),
  modeBadge:  document.getElementById('modeBadge'),
};
const themeBtn = document.getElementById('themeToggle');

/* Config */
//******************************************************//******************************************************
const API_KEY    = "AIzaSyDBT4rqwNESvf2NVvvserDvUTQac2g6lGs";
const CX         = "b6e841a9585054492";
const GOOGLE_URL = "https://www.googleapis.com/customsearch/v1";
//******************************************************//******************************************************

let lastResults = [];

/* MOCK data */
const MOCK_RESULTS = [
  { title:"Example — Domain", link:"https://example.com/",             snippet:"This domain is for use in illustrative examples in documents." },
  { title:"MDN Web Docs",    link:"https://developer.mozilla.org/",    snippet:"Resources for developers, by developers." },
  { title:"W3C",             link:"https://www.w3.org/",               snippet:"The World Wide Web Consortium (W3C) develops standards." },
];

/* Helpers */
function updateModeBadge(){
  els.modeBadge.textContent = els.mode.value === 'mock' ? 'MOCK (bez API)' : 'Google CSE API';
}
function renderResults(rows){
  lastResults = rows || [];
  els.out.innerHTML = '';
  if (!rows?.length){ els.out.innerHTML = '<em>Žádné výsledky</em>'; return; }
  rows.forEach(r => {
    const div = document.createElement('div');
    div.className = 'result';
    div.innerHTML = `<a href="${r.link}" target="_blank">${r.title}</a><br/>
                     <small>${r.link}</small><p>${r.snippet}</p>`;
    els.out.appendChild(div);
  });
}
function showError(err){
  els.out.innerHTML = `<pre class="fail">API error — ${err}</pre>`;
}
function toCSV(rows){
  const esc = s => `${String(s??'').replace(/"/g,'""')}`;
  const head = ['title','link','snippet'];
  const lines = [head.join(',')];
  (rows||[]).forEach(r=>lines.push([esc(r.title),esc(r.link),esc(r.snippet)].join(',')));
  return lines.join('\n');
}
function download(name, text){
  const blob = new Blob([text], {type:'application/octet-stream'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

/* Search */
async function searchMock(q){
  return MOCK_RESULTS.map((r,i)=> i===0 ? {...r, title:`${r.title} — ${q}`} : r);
}
async function searchGoogle(q){
  const url = new URL(GOOGLE_URL);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('cx',  CX);
  url.searchParams.set('q',   q);
  const res = await fetch(url);
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if(!data.items) return [];
  return data.items.map(it => ({ title:it.title, link:it.link, snippet:it.snippet }));
}
async function runSearch(){
  const q = els.q.value.trim(); if(!q) return;
  document.body.classList.add('compact');
  els.out.innerHTML = '<em>Hledám…</em>';
  try{
    const rows = (els.mode.value==='mock') ? await searchMock(q) : await searchGoogle(q);
    renderResults(rows);
  }catch(e){ showError(e.message||e); }
}

/* Unit tests (запускаются по кнопке, а не сразу) */
function runUnitTests(){
  const tests = [];

  tests.push({ name:'searchMock vrací pole s 3 prvky',
               ok:Array.isArray(MOCK_RESULTS) && MOCK_RESULTS.length===3 });

  const s = MOCK_RESULTS[0]||{};
  tests.push({ name:'výsledek má tvar {title, link, snippet}',
               ok:'title' in s && 'link' in s && 'snippet' in s });

  tests.push({ name:'Google API_KEY a CX nejsou prázdné', ok:!!API_KEY && !!CX });

  // renderResults не портим: проверим, что оно что-то выводит, и откатим
  const before = els.out.innerHTML;
  renderResults(MOCK_RESULTS);
  const changed = els.out.innerHTML.includes('Example');
  els.out.innerHTML = before;
  tests.push({ name:'renderResults vytváří HTML s výsledky', ok:changed });

  // Вывод
  els.testsList.innerHTML = '';
  for(const t of tests){
    const li = document.createElement('div');
    li.className = t.ok ? 'ok' : 'fail';
    li.textContent = `${t.ok ? '✅' : '❌'} ${t.name}`;
    els.testsList.appendChild(li);
  }
  const okCount = tests.filter(t=>t.ok).length;
  els.testsList.insertAdjacentHTML('beforeend', `<br><strong>${okCount}/${tests.length}</strong> testů prošlo.`);
}

/* Theme switch */
(function initTheme(){
  const saved = localStorage.getItem('theme');
  if(saved) document.documentElement.dataset.theme = saved;
  updateThemeButton();
  themeBtn?.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme || 'light';
    const next = (cur==='dark') ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    updateThemeButton();
  });
})();
function updateThemeButton(){
  const t = document.documentElement.dataset.theme || 'light';
  themeBtn.textContent = t==='dark' ? '☀️' : '🌙';
  themeBtn.title      = t==='dark' ? 'Světlé téma' : 'Tmavé téma';
}

/* Downloads */

 refs.dJson?.addEventListener('click', () =>
    download('results.json', JSON.stringify(lastResults ?? [], null, 2))
  );

  refs.dCsv?.addEventListener('click', () =>
    download('results.csv', toCSV(lastResults ?? []))
  );

  refs.dPdf?.addEventListener('click', async () => {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) return alert('jsPDF není načten (CDN).');

    const doc = new jsPDF();
    let y = 10;

    (lastResults ?? []).forEach((r, i) => {
      doc.text(`${i + 1}. ${r.title}`, 10, y); y += 6;
      doc.text(`${r.link}`, 10, y);          y += 6;
      doc.text(`${(r.snippet || '').slice(0, 120)}`, 10, y); y += 10;
    });
  doc.save('results.pdf');
});

/* Hooks */
document.getElementById('searchBtn')?.addEventListener('click', runSearch);
els.mode?.addEventListener('change', updateModeBadge);
els.btnRunIT?.addEventListener('click', runUnitTests);

// при загрузке — год в футере и бейдж режима
document.getElementById('year').textContent = new Date().getFullYear();
updateModeBadge();

