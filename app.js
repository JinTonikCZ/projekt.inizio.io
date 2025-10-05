/***************************************************
 * Search Extractor – main client logic

 ***************************************************/

/* ========== Configuration ========== ========================================*/

const API_KEY     = "AIzaSyDBT4rqwNESvf2NVvvserDvUTQac2g6lGs";
const CX          = "b6e841a9585054492";
const GOOGLE_URL  = "https://www.googleapis.com/customsearch/v1";
let lastResults = [];

/*============================================================================== */
const MOCK_RESULTS = [
  {
    title: "inizio",
    link: "https://www.inizio.cz/",
    snippet: "Inizio je webová laboratoř ."
  },
  {
    title: "MDN Web Docs",
    link: "https://developer.mozilla.org/",
    snippet: "Resources for developers, by developers."
  },
  {
    title: "W3C",
    link: "https://www.w3.org/",
    snippet: "The World Wide Web Consortium (W3C) develops standards."
  }
];

/* ========== Small DOM helper ========== */
const $ = (id) => document.getElementById(id);

/* =================================================
 * Funkce vyhledávání
 * ================================================= */

/**
 * searchMock(q)
 * - Vrací statické výsledky z pole MOCK_RESULTS.
 * - Používá se, když je vybrán režim MOCK (bez API).
 * - Do prvního výsledku doplní hledaný dotaz pro vizuální efekt.
 */
async function searchMock(q) {
  return MOCK_RESULTS.map((r, i) =>
    i === 0 ? { ...r, title: `${r.title} — ${q}` } : r
  );
}

/**
 * searchGoogle(q)
 * - Provádí reálné vyhledávání přes Google Custom Search API.
 * - Sestaví URL s parametry klíče, ID a dotazu.
 * - Vrátí pole výsledků (title, link, snippet).
 */

async function searchGoogle(q) {
    // 1️ Vytvoření URL s parametry

  const url = new URL(GOOGLE_URL);
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("cx", CX);
  url.searchParams.set("q", q);
  
  // 2️  Odeslání HTTP požadavku
  const res = await fetch(url);
  
  // 3️ Ošetření chyb – pokud API nevrátí 200 OK
  if (!res.ok) {
    // make the HTTP error readable
    const txt = await res.text().catch(() => String(res.status));
    throw new Error(`HTTP ${res.status} — ${txt}`);
  }
  
    // 4️ Zpracování odpovědi JSON
  const data = await res.json();
  if (!data.items) return [];

    // 5️ Zjednodušení výsledků pro renderování
  return data.items.map((it) => ({
    title: it.title,
    link: it.link,
    snippet: it.snippet ?? ""
  }));
}

/** ===============================================================
 *  Hlavní funkce runSearch()
 * ===============================================================
 * - Spouští vyhledávání podle zadaného dotazu.
 * - Rozhoduje, zda použít mockovaná data nebo Google API.
 * - Zobrazí text "Hledám..." a následně výsledky nebo chybu.
 */async function runSearch() {
  const qEl = $("q");     // vstupní pole
  const modeEl = $("mode");   // výběr režimu
  const outEl = $("out");     // výstupní kontejner
  const q = (qEl?.value || "").trim();    // získání dotazu

  if (!q) return;        // pokud je pole prázdné → konec
  document.body.classList.add("compact");    // zmenší "hero" oblast
  outEl.innerHTML = "<em>Hledám…</em>";   // zobrazení textu během načítání

  try {
    // kontrola režimu (mock nebo reálné API)
    const useMock = modeEl?.value === "mock";
        // vyhledávání podle zvoleného režimu
    const rows = useMock ? await searchMock(q) : await searchGoogle(q);
        // zobrazení výsledků
    renderResults(rows);
  } catch (e) {
        // v případě chyby (např. API key nefunguje)
    showError(e.message);
  }
}

/* =================================================
 * Rendering & helpers
 * ================================================= */

/**  Vykreslení výsledků na stránku
 *    - uložíme kopii do lastResults pro exporty. */
function renderResults(rows) {
  lastResults = rows || [];
  const out = $("out");
  out.innerHTML = "";
  
  // Pokud nic nepřišlo, zobraz krátkou zprávu a skonči
  if (!rows || rows.length === 0) {
    out.innerHTML = "<em>Zde se zobrazí výsledky…</em>";
    return;
  }
  
  // Každý výsledek vykreslíme jako „kartu“
  rows.forEach((r) => {
    const li = document.createElement("div");
    li.className = "result";
    li.innerHTML = `
      <div class="result__title">
        <a href="${r.link}" target="_blank" rel="noopener">${escapeHtml(r.title)}</a>
      </div>
      <div class="result__link">${escapeHtml(r.link)}</div>
      <div class="result__snippet">${escapeHtml(r.snippet)}</div>
    `;
    out.appendChild(li);
  });
}

/** Bezpečné vypsání textu do HTML (zabrání XSS)
 *  Nahrazuje speciální znaky (&, <, >) HTML entitami.
 */function escapeHtml(x) {
  return String(x)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Vykreslí chybovou kartu do sekce s výsledky.
 *  Zároveň vynuluje lastResults (aby se nestahovaly staré údaje).
 */function showError(msg) {
  lastResults = [];
  const out = $("out");
  out.innerHTML = `
    <div class="card fail">
      <pre>${escapeHtml(String(msg))}</pre>
    </div>
  `;
}

/**FUNKCE STAZENI -- Stáhne libovolný text jako soubor (např. JSON/CSV).
 */function download(name, text) {
  const blob = new Blob([text], { type: "application/octet-stream" }); //*  Vytvoří Blob → dočasnou URL → simulace kliknutí na <a download>.

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Převod pole objektů (title/link/snippet) do CSV řetězce. */
function toCSV(rows) {
  const esc = (s = "") => `"${String(s).replace(/"/g, '""')}"`;
  const header = ["title", "link", "snippet"];
  const lines = [header.join(",")];
  rows.forEach((r) => {
    lines.push([esc(r.title), esc(r.link), esc(r.snippet)].join(","));
  });
  return lines.join("\n");
}

/** Update the small badge showing the active mode (Mock / Google). */
function updateModeBadge() {
  const modeEl = $("mode");
  const badge = $("modeBadge");
  if (!badge || !modeEl) return;
  badge.textContent = modeEl.value === "mock" ? "MOCK (no API)" : "Google CSE API";
}

/* =================================================
 * Unit tests – run on button click (pure client-side)

 
/** Spustí jednoduché unit testy (zobrazí výsledky v seznamu).
 *  – 1) MOCK pole má 3 prvky
 *  – 2) řádek má klíče {title, link, snippet}
 *  – 3) API_KEY a CX nejsou prázdné (sanita kontrola)
 *  – 4) renderResults skutečně něco vloží do DOM
 */
// * ================================================= */

/**
 * runUnitTests()
 * - Testuje základ: strukturu MOCK_RESULTS, přítomnost polí,
 *   že render přidá do DOMu obsah atd.
 * - Nezávislé na Google API (běží čistě na mocku).
 */
function runUnitTests() {
  const list = $("testsList");
  const scope = $("testsScope");
  if (!list || !scope) return;

  const tests = [];

  // 1) MOCK vrací pole o délce 3  
  tests.push({
  
    name: "searchMock returns an array of 3 items",
    ok: Array.isArray(MOCK_RESULTS) && MOCK_RESULTS.length === 3
  });

  // 2) row shape is {title, link, snippet}
  const s = MOCK_RESULTS[0] || {};
  tests.push({
    name: "row shape is {title, link, snippet}",
    ok: "title" in s && "link" in s && "snippet" in s
  });

  // 3) Google keys look non-empty (not validating actual values here)
  tests.push({
    name: "Google API key / CX are present (non-empty)",
    ok: !!API_KEY && !!CX
  });

  // 4) renderResults produces HTML output for non-empty input and restores empty
// 4) renderResults opravdu zapíše něco do #out (počtem .result)
const out   = $("out");
const backup = out.innerHTML;
const prev  = out.querySelectorAll(".result").length;

renderResults(MOCK_RESULTS);

const now = out.querySelectorAll(".result").length;
const ok  = now > prev;

out.innerHTML = backup;

tests.push({
  name: "renderResults creates HTML in the output container",
  ok
});


  // ----- print results -----
  list.innerHTML = "";
  tests.forEach((t) => {
    const div = document.createElement("div");
    div.className = t.ok ? "ok" : "fail";
    div.textContent = `${t.ok ? "✔" : "✖"} ${t.name}`;
    list.appendChild(div);
  });

  const okCount = tests.filter((t) => t.ok).length;
  list.insertAdjacentHTML(
    "beforeend",
    `<br><strong>${okCount}/${tests.length}</strong> testů prošlo.`
  );
  scope.textContent = "— hotovo";
}

/* =================================================
 * Theme (light/dark)
 * ================================================= */

function applySavedTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.dataset.theme = saved;
  updateThemeButtonUI();
}

function toggleTheme() {
  const cur = document.documentElement.dataset.theme || "light";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
  updateThemeButtonUI();
}

function updateThemeButtonUI() {
  const btn = $("themeToggle");
  if (!btn) return;
  const t = document.documentElement.dataset.theme || "light";
  btn.textContent = t === "dark" ? "🌙" : "🔆";
  btn.title = t === "dark" ? "Switch to light theme" : "Switch to dark theme";
}

/* =================================================
 * Safe init (after DOM is ready)
 * ================================================= */

(function ready(fn) {
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
})(() => {
  // Apply saved theme and set initial icon
  applySavedTheme();

  // Hook up UI actions (each with null guard)
  $("themeToggle")?.addEventListener("click", toggleTheme);
  $("searchBtn")?.addEventListener("click", runSearch);
  $("q")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // prevent form submission (if any)
    runSearch();
  }
});
  $("mode")?.addEventListener("change", updateModeBadge);
  $("btnRunIT")?.addEventListener("click", runUnitTests);

  $("dJson")?.addEventListener("click", () =>
    download("results.json", JSON.stringify(lastResults ?? [], null, 2))
  );
  $("dCsv")?.addEventListener("click", () =>
    download("results.csv", toCSV(lastResults ?? []))
  );
  $("dPdf")?.addEventListener("click", async () => {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) return alert("jsPDF is not loaded (CDN).");

    const doc = new jsPDF();
    let y = 10;
    (lastResults ?? []).forEach((r, i) => {
      doc.text(`${i + 1}. ${r.title}`, 10, y); y += 6;
      doc.text(`${r.link}`, 10, y);           y += 6;
      doc.text(`${(r.snippet || "").slice(0, 120)}`, 10, y); y += 10;
    });
    doc.save("results.pdf");
  });

  // Footer year
  $("year") && ($("year").textContent = new Date().getFullYear());

  // Initial badge
  updateModeBadge();
});








