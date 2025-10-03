const API_KEY = "AIzaSyDBT4rqwNESvf2NVvvserDvUTQac2g6lGs";   // ← сюда вставь свой ключ
const CX = "b6e841a9585054492";        // ← твой CX ID
let lastResults = [];

// 1) vyhledávání
async function searchGoogle(q) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error: " + res.status);
  const data = await res.json();
  return (data.items || []).map(it => ({
    title: it.title,
    link: it.link,
    snippet: it.snippet
  }));
}

// 2) spuštění hledání
async function runSearch() {
  const q = document.getElementById("q").value;
  document.getElementById("out").innerHTML = "<em>Načítám...</em>";
  try {
    const results = await searchGoogle(q);
    lastResults = results;
    renderResults(results);
  } catch (e) {
    document.getElementById("out").innerHTML = "<span style='color:red'>" + e.message + "</span>";
  }
}

// 3) vykreslení výsledků
function renderResults(list) {
  if (!list.length) {
    document.getElementById("out").innerHTML = "<em>Žádné výsledky.</em>";
    return;
  }
  document.getElementById("out").innerHTML = list.map(r => `
    <div class="result">
      <strong><a href="${r.link}" target="_blank">${r.title}</a></strong><br>
      <small>${r.link}</small><br>
      <p>${r.snippet}</p>
    </div>
  `).join("");
}

// 4) JSON export
function downloadJSON() {
  if (!lastResults.length) return;
  const blob = new Blob([JSON.stringify(lastResults, null, 2)], {type: "application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "results.json";
  a.click();
}

// 5) CSV export
function downloadCSV() {
  if (!lastResults.length) return;
  const header = "title,link,snippet\n";
  const rows = lastResults.map(r => `"${r.title}","${r.link}","${r.snippet}"`).join("\n");
  const blob = new Blob([header + rows], {type: "text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "results.csv";
  a.click();
}

// 6) unit test
async function runTests() {
  const testsDiv = document.getElementById("tests");
  try {
    const res = await searchGoogle("test");
    if (Array.isArray(res) && res.length > 0 && res[0].title) {
      testsDiv.innerHTML = "<div class='ok'>✔ API vrací výsledky ve správném formátu</div>";
    } else {
      throw new Error("Výstup je prázdný nebo nesprávný");
    }
  } catch (e) {
    testsDiv.innerHTML = "<div class='fail'>✖ Test selhal: " + e.message + "</div>";
  }
}
runTests();
