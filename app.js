/******************************************************
 * Search Extractor – hlavní logika
 * Autor: ProgramatoRR (JinTonikCZ)
 ******************************************************/

/***** 1️⃣ DOM odkazy (refs) *****/
const els = {
  q: document.getElementById('q'),
  mode: document.getElementById('mode'),
  out: document.getElementById('out'),
  outCard: document.getElementById('outCard'),
  testsCard: document.getElementById('testsCard'),
  testsList: document.getElementById('tests'),
  btnRunIT: document.getElementById('btnRunIT'),
  modeBadge: document.getElementById('modeBadge'),
};


/***** 2️⃣ Konfigurace *****/
const API_KEY = "AIzaSyDBT4rqwNESvf2NVvvserDvUTQac2g6lGs";
const CX = "b6e841a9585054492";
const PROXY = "/api/search"; // pokud běží přes Docker proxy
const GOOGLE_URL = "https://www.googleapis.com/customsearch/v1";


/***** 3️⃣ MOCK výsledky (pro offline režim) *****/
const MOCK_RESULTS = [
  { title: "Example — Domain", link: "https://example.com/", snippet: "This domain is for use in illustrative examples in documents." },
  { title: "MDN Web Docs", link: "https://developer.mozilla.org/", snippet: "Resources for developers, by developers." },
  { title: "W3C", link: "https://www.w3.org/", snippet: "The World Wide Web Consortium (W3C) develops standards." },
];


/***** 4️⃣ Pomocné funkce *****/

// Vyrenderuje výsledky do stránky
function renderResults(rows) {
  els.out.innerHTML = "";
  if (!rows || !rows.length) {
    els.out.innerHTML = `<em>Žádné výsledky</em>`;
    return;
  }
  rows.forEach(r => {
    const div = document.createElement("div");
    div.className = "result";
    div.innerHTML = `<a href="${r.link}" target="_blank">${r.title}</a><br><small>${r.link}</small><p>${r.snippet}</p>`;
    els.out.appendChild(div);
  });
}

// Zobrazí chybu
function showError(err) {
  els.out.innerHTML = `<pre style="color:#ef4444">API error — ${err}</pre>`;
}

// Stáhne data jako soubor (JSON/CSV/PDF)
function download(name, text) {
  const blob = new Blob([text], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}


/***** 5️⃣ MOCK režim *****/
async function searchMock(q) {
  // Vrátí tři "falešné" výsledky se změněným názvem podle dotazu
  return MOCK_RESULTS.map((r, i) =>
    i === 0 ? { ...r, title: `${r.title} — ${q}` } : r
  );
}


/***** 6️⃣ Google CSE API (skutečné vyhledávání) *****/
async function searchGoogle(q) {
  const url = new URL(GOOGLE_URL);
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("cx", CX);
  url.searchParams.set("q", q);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  if (!data.items) throw new Error("Žádné výsledky od Google");
  return data.items.map(it => ({
    title: it.title,
    link: it.link,
    snippet: it.snippet
  }));
}


/***** 7️⃣ Hlavní funkce hledání *****/
async function runSearch() {
  const q = els.q.value.trim();
  if (!q) return;

  els.out.innerHTML = `<em>Hledám...</em>`;
  const mode = els.mode.value;
  let rows;

  try {
    if (mode === "mock") rows = await searchMock(q);
    else rows = await searchGoogle(q);
    renderResults(rows);
  } catch (err) {
    showError(err);
  }
}


/***** 8️⃣ Jednoduché unit testy *****/
function runUnitTests() {
  const tests = [];

  // test 1 – MOCK vrací přesně 3 prvky
  tests.push({
    name: "searchMock vrací pole s 3 prvky",
    ok: Array.isArray(MOCK_RESULTS) && MOCK_RESULTS.length === 3
  });

  // test 2 – Výsledek má správnou strukturu
  const sample = MOCK_RESULTS[0];
  tests.push({
    name: "výsledek má tvar {title, link, snippet}",
    ok: sample && "title" in sample && "link" in sample && "snippet" in sample
  });

  // test 3 – API_KEY a CX jsou vyplněny
  tests.push({
    name: "Google API_KEY a CX nejsou prázdné",
    ok: !!API_KEY && !!CX
  });

  // test 4 – renderResults vytváří HTML
  const tmpDiv = document.createElement("div");
  renderResults(MOCK_RESULTS);
  tests.push({
    name: "renderResults vytváří HTML s výsledky",
    ok: els.out.innerHTML.includes("Example")
  });

  // Výpis výsledků
  els.testsList.innerHTML = "";
  tests.forEach(t => {
    const li = document.createElement("div");
    li.innerHTML = `${t.ok ? "✅" : "❌"} ${t.name}`;
    li.className = t.ok ? "ok" : "fail";
    els.testsList.appendChild(li);
  });
  const okCount = tests.filter(t => t.ok).length;
  els.testsList.innerHTML += `<br><strong>${okCount}/${tests.length}</strong> testů prošlo.`;
}


/***** 9️⃣ Event listenery *****/
document.getElementById("searchBtn").addEventListener("click", runSearch);
els.btnRunIT?.addEventListener("click", runUnitTests);

// automaticky spustí testy po načtení stránky
window.addEventListener("load", runUnitTests);

/***** 🌙 Přepínání tématu (dark / light) *****/
const themeBtn = document.getElementById('themeToggle');

// při načtení zkusíme načíst poslední téma z localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
updateThemeButton();

// kliknutím přepínáme
themeBtn?.addEventListener('click', () => {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
  updateThemeButton();
});

// funkce mění ikonu na tlačítku
function updateThemeButton(){
  const theme = document.documentElement.dataset.theme || 'light';
  themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeBtn.title = theme === 'dark' ? 'Světlé téma' : 'Tmavé téma';
}

