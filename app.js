/* ---------- 0) Téma ---------- */
const THEME_KEY = "se-theme";

function systemTheme() {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("themeToggle").textContent = theme === "dark" ? "🌙" : "☀️";
}
(function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || systemTheme());
})();
document.getElementById("themeToggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
});

/* ---------- 1) Konst / utils ----------=======================================================
 */
const API_KEY = "AIzaSyDBT4rqwNESvf2NVvvserDvUTQac2g6lGs";    
const CX      = "b6e841a9585054492";     
/* =======================================================
 */


const $ = (s) => document.querySelector(s);

function download(name, text, mime) {
  const blob = new Blob([text], { type: mime || "application/octet-stream" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
function toCSV(rows) {
  const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const head = ["title", "link", "snippet"];
  const out = [head.join(",")];
  rows.forEach(r => out.push([esc(r.title), esc(r.link), esc(r.snippet)].join(",")));
  return out.join("\n");
}

let lastResults = [];

/* ---------- 2) MOCK ---------- */
const MOCK_BASE = [
  { title:"Example — Domain", link:"https://example.com/", snippet:"This domain is for use in illustrative examples in documents." },
  { title:"MDN Web Docs",     link:"https://developer.mozilla.org/", snippet:"Resources for developers, by developers." },
  { title:"W3C",              link:"https://www.w3.org/", snippet:"The World Wide Web Consortium (W3C) develops standards." }
];
async function searchMock(q) {
  // 3 статических результата (стабильно для юнит-тестов)
  return MOCK_BASE.map((r,i) => i===0 ? ({...r, title: `${r.title} — ${q}`}) : r);
}

/* ---------- 3) Google CSE API ---------- */
async function searchGoogle(q) {
  if (!API_KEY || !CX) throw new Error("Chyba: Chybí GOOGLE_API_KEY nebo GOOGLE_CX.");
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("cx",  CX);
  url.searchParams.set("q",   q);

  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error: ${res.status} — ${txt}`);
  }
  const data = await res.json();
  return (data.items || []).map(it => ({
    title: it.title || "",
    link: it.link || "",
    snippet: it.snippet || it.snippetText || ""
  }));
}

/* ---------- 4) UI ---------- */
function renderResults(list) {
  if (!list.length) {
    $("#out").innerHTML = "<em>Žádné výsledky.</em>";
    return;
  }
  $("#out").innerHTML = list.map(item => `
    <div class="result">
      <div><a href="${item.link}" target="_blank" rel="noreferrer">${item.title}</a></div>
      <div class="muted" style="font-size:13px">${item.link}</div>
      <div>${item.snippet}</div>
    </div>
  `).join("");
}

async function runSearch() {
  const q = $("#q").value.trim();
  if (!q) { $("#out").innerHTML = "<em>Zadejte dotaz…</em>"; return; }

  document.body.classList.add("compact");
  $("#out").innerHTML = "<em>Načítám…</em>";

  try {
    const mode = $("#mode").value;
    const results = (mode === "mock") ? await searchMock(q) : await searchGoogle(q);
    lastResults = results;
    renderResults(results);
  } catch (e) {
    $("#out").innerHTML = `<div class="fail">${e.message}</div>`;
  }
}

$("#run").addEventListener("click", runSearch);
$("#q").addEventListener("keydown", (e) => { if (e.key === "Enter") runSearch(); });

/* ---------- 5) Exporty ---------- */
document.getElementById("dlJson").addEventListener("click", () => {
  if (!lastResults.length) return;
  download("results.json", JSON.stringify(lastResults, null, 2), "application/json");
});
document.getElementById("dlCsv").addEventListener("click", () => {
  if (!lastResults.length) return;
  download("results.csv", toCSV(lastResults), "text/csv");
});
document.getElementById("dlPdf").addEventListener("click", () => {
  if (!lastResults.length) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:"pt", format:"a4" });

  const margin = 40, lineH = 16, pageH = doc.internal.pageSize.getHeight(), maxW = 515;
  let y = margin;

  doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text("Search Extractor — 1st page results", margin, y); y += 24;

  const q = $("#q").value.trim() || "(bez dotazu)";
  doc.setFont("helvetica","normal"); doc.setFontSize(11);
  doc.text(`Dotaz: ${q}`, margin, y); y += 18;

  lastResults.forEach((r, i) => {
    if (y + 3*lineH > pageH - margin) { doc.addPage(); y = margin; }

    doc.setFont("helvetica","bold"); doc.setFontSize(12);
    doc.splitTextToSize(`${i+1}. ${r.title || ""}`, maxW).forEach(t => { doc.text(t, margin, y); y += lineH; });

    doc.setTextColor(120); doc.setFont("helvetica","normal"); doc.setFontSize(10);
    doc.splitTextToSize(r.link || "", maxW).forEach(t => { doc.text(t, margin, y); y += lineH; });
    doc.setTextColor(0);

    doc.setFontSize(11);
    doc.splitTextToSize(r.snippet || "", maxW).forEach(t => {
      if (y + lineH > pageH - margin) { doc.addPage(); y = margin; }
      doc.text(t, margin, y); y += lineH;
    });

    y += 8;
  });

  doc.save("results.pdf");
});

/* copyright year */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- 6) Mini unit-test runner (na MOCK) ---------- */
const tests = [];
function test(name, fn){ tests.push({ name, fn }); }
function expect(val){
  return {
    toBeArray(){ if (!Array.isArray(val)) throw new Error("Expected array"); },
    toHaveKeys(keys){ keys.forEach(k => { if (!(k in val)) throw new Error("Missing key: "+k); }); },
    toBeType(t){ if (typeof val !== t) throw new Error(`Expected ${t}, got ${typeof val}`); }
  };
}

test("searchMock vrací pole s 3 prvky", async () => {
  const res = await searchMock("demo");
  expect(res).toBeArray();
  if (res.length !== 3) throw new Error("Expected length=3");
});
test("výsledek má tvar {title, link, snippet}", async () => {
  const [first] = await searchMock("demo");
  expect(first).toHaveKeys(["title","link","snippet"]);
  expect(first.title).toBeType("string");
});

(async function runTests(){
  const box = $("#tests");
  let ok = 0;
  for (const t of tests){
    const row = document.createElement("div");
    row.className = "result";
    try { await t.fn(); row.innerHTML = `<span class="ok">✔</span> ${t.name}`; ok++; }
    catch(e){ row.innerHTML = `<span class="fail">✖</span> ${t.name} — <span class="muted">${e.message}</span>`; }
    box.appendChild(row);
  }
  const sum = document.createElement("div");
  sum.style.marginTop = "8px";
  sum.innerHTML = `<strong>${ok}/${tests.length}</strong> testů prošlo.`;
  box.appendChild(sum);
})();




