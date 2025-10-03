// ===== 0) Téma (light/dark) =====
const THEME_KEY = "se-theme";
function getSystemTheme(){ return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  const icon = theme === "dark" ? "🌙" : "☀️";
  document.getElementById("themeToggle").textContent = icon;
}
(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved || getSystemTheme());
})();
document.getElementById("themeToggle").addEventListener("click", ()=>{
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  applyTheme(next); localStorage.setItem(THEME_KEY, next);
});

// ===== 1) Google CSE API nastavení =====
const API_KEY = "AIzaSyDBT4rqwNESvf2NVvvserDvUTQac2g6lGs";   // <-- sem vlož svůj klíč
const CX      = "b6e841a9585054492";   // <-- tvůj CSE ID (CX)
let lastResults = [];

// ===== 2) Pomocné funkce =====
const $ = (s)=>document.querySelector(s);
function download(filename, text, mime="application/octet-stream"){
  const blob = new Blob([text], {type:mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}
function toCSV(rows){
  const esc = (s)=> `"${String(s??"").replace(/"/g,'""')}"`;
  const header = ["title","link","snippet"];
  const lines = [header.join(",")];
  rows.forEach(r=>lines.push([esc(r.title),esc(r.link),esc(r.snippet)].join(",")));
  return lines.join("\n");
}

// ===== 3) MOCK režim =====
const MOCK_RESULTS = [
  { title: "Example — Domain", link: "https://example.com/", snippet: "This domain is for use in illustrative examples in documents." },
  { title: "MDN Web Docs", link: "https://developer.mozilla.org/", snippet: "Resources for developers, by developers." },
  { title: "W3C", link: "https://www.w3.org/", snippet: "The World Wide Web Consortium (W3C) develops standards." }
];
async function searchMock(q){
  return MOCK_RESULTS.map((r,i)=> i===0 ? ({...r, title:`${r.title} — ${q}`}) : r);
}

// ===== 4) Google CSE API =====
async function searchGoogle(q){
  if(!API_KEY || !CX) throw new Error("Chyba: Chybí GOOGLE_API_KEY nebo GOOGLE_CX.");
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("cx",  CX);
  url.searchParams.set("q",   q);

  const res = await fetch(url);
  if(!res.ok){
    const txt = await res.text();
    throw new Error(`API error: ${res.status} — ${txt}`);
  }
  const data = await res.json();
  return (data.items || []).map(it => ({
    title: it.title || "", link: it.link || "", snippet: it.snippet || it.snippetText || ""
  }));
}

// ===== 5) UI a exporty =====
function renderResults(list){
  if(!list.length){ $("#out").innerHTML = "<em>Žádné výsledky.</em>"; return; }
  $("#out").innerHTML = list.map(item => `
    <div class="result">
      <div><a href="${item.link}" target="_blank" rel="noreferrer">${item.title}</a></div>
      <div class="muted" style="font-size:13px">${item.link}</div>
      <div>${item.snippet}</div>
    </div>
  `).join("");
}

async function runSearch(){
  const q = $("#q").value.trim();
  if(!q){ $("#out").innerHTML = "<em>Zadejte dotaz…</em>"; return; }
  $("#out").innerHTML = "<em>Načítám…</em>";
  try{
    const mode = $("#mode").value;
    const results = (mode === "mock") ? await searchMock(q) : await searchGoogle(q);
    lastResults = results; renderResults(results);
  }catch(e){
    $("#out").innerHTML = `<div class="fail">${e.message}</div>`;
  }
}

$("#run").addEventListener("click", runSearch);
$("#q").addEventListener("keydown", (e)=>{ if(e.key==="Enter") runSearch(); });
$("#dlJson").addEventListener("click", ()=>{ if(lastResults.length) download("results.json", JSON.stringify(lastResults,null,2), "application/json"); });
$("#dlCsv").addEventListener("click",  ()=>{ if(lastResults.length) download("results.csv", toCSV(lastResults), "text/csv"); });

// ===== 6) Mini unit-test runner (na MOCK) =====
const tests = [];
function test(name, fn){ tests.push({name, fn}); }
function expect(val){
  return {
    toBeTruthy(){ if(!val) throw new Error("Expected truthy, got "+val); },
    toBeArray(){ if(!Array.isArray(val)) throw new Error("Expected array"); },
    toHaveKeys(keys){ keys.forEach(k=>{ if(!(k in val)) throw new Error("Missing key: "+k); }); },
    toBeType(t){ if(typeof val!==t) throw new Error(`Expected type ${t}, got ${typeof val}`); },
  };
}
test("searchMock vrací pole s 3 prvky", async ()=>{
  const res = await searchMock("demo"); expect(res).toBeArray(); if(res.length!==3) throw new Error("Expected length=3");
});
test("výsledek má tvar {title, link, snippet}", async ()=>{
  const [first] = await searchMock("demo");
  expect(first).toHaveKeys(["title","link","snippet"]); expect(first.title).toBeType("string");
});
(async function runTests(){
  const box = $("#tests"); let passed = 0;
  for(const t of tests){
    const row = document.createElement("div"); row.className = "result";
    try{ await t.fn(); row.innerHTML = `<span class="ok">✔</span> ${t.name}`; passed++; }
    catch(e){ row.innerHTML = `<span class="fail">✖</span> ${t.name} — <span class="muted">${e.message}</span>`; }
    box.appendChild(row);
  }
  const sum = document.createElement("div"); sum.style.marginTop="8px";
  sum.innerHTML = `<strong>${passed}/${tests.length}</strong> testů prošlo.`; box.appendChild(sum);
})();
