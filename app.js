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
    title: "Example — Domain",
    link: "https://example.com/",
    snippet: "This domain is for use in illustrative examples in documents."
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
 * Search functions
 * ================================================= */

/** Return mock data, with the first title annotated by the query (for visual feedback). */
async function searchMock(q) {
  return MOCK_RESULTS.map((r, i) =>
    i === 0 ? { ...r, title: `${r.title} — ${q}` } : r
  );
}

/** Call Google Custom Search JSON API */
async function searchGoogle(q) {
  const url = new URL(GOOGLE_URL);
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("cx", CX);
  url.searchParams.set("q", q);

  const res = await fetch(url);
  if (!res.ok) {
    // make the HTTP error readable
    const txt = await res.text().catch(() => String(res.status));
    throw new Error(`HTTP ${res.status} — ${txt}`);
  }
  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((it) => ({
    title: it.title,
    link: it.link,
    snippet: it.snippet ?? ""
  }));
}

/** Choose the source (mock vs Google) and render the results. */
async function runSearch() {
  const qEl = $("q");
  const modeEl = $("mode");
  const outEl = $("out");
  const q = (qEl?.value || "").trim();

  if (!q) return;
  document.body.classList.add("compact");
  outEl.innerHTML = "<em>Hledám…</em>";

  try {
    const useMock = modeEl?.value === "mock";
    const rows = useMock ? await searchMock(q) : await searchGoogle(q);
    renderResults(rows);
  } catch (e) {
    showError(e.message);
  }
}

/* =================================================
 * Rendering & helpers
 * ================================================= */

/** Render result cards to the page and keep a copy in `lastResults`. */
function renderResults(rows) {
  lastResults = rows || [];
  const out = $("out");
  out.innerHTML = "";

  if (!rows || rows.length === 0) {
    out.innerHTML = "<em>Zde se zobrazí výsledky…</em>";
    return;
  }

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

/** Convert array of rows to CSV string. */
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
 * ================================================= */

function runUnitTests() {
  const list = $("testsList");
  const scope = $("testsScope");
  if (!list || !scope) return;

  const tests = [];

  // 1) mock returns exactly three rows
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
  const before = $("out").innerHTML;
  renderResults(MOCK_RESULTS);
  const changed = $("out").innerHTML.includes("Example");
  $("out").innerHTML = before;
  tests.push({
    name: "renderResults creates HTML in the output container",
    ok: changed
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



