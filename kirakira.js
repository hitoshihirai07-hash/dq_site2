
// kirakira.js - CSV を読み込んで表を表示する共通スクリプト
// CSV 側の列名・順番はそのまま利用し、こちらからは一切変更しません。

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length === 0) return { header: [], rows: [] };

  // 通常は 0 行目がヘッダー。
  // ただし dq2_ocean_floor_blue.csv のように、
  // 0 行目が「海底, Unnamed: 1」で 1 行目が「番号, 入手物」のケースがあるので、
  // その場合だけ 1 行目をヘッダーとして扱う。
  let headerIndex = 0;
  if (lines.length > 1) {
    const firstCols = lines[0].split(",");
    const secondCols = lines[1].split(",");
    if (firstCols[0].trim() === "海底" && secondCols[0].trim() === "番号") {
      headerIndex = 1;
    }
  }

  const header = lines[headerIndex].split(",").map(h => h.trim());
  const rows = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length === 1 && cols[0].trim() === "") continue;

    const row = cols.map(c => c.trim());
    while (row.length < header.length) {
      row.push("");
    }
    rows.push(row);
  }

  return { header, rows };
}

function setupCsvTable(config) {
  const { csvPath, tableId, searchInputId } = config;

  const table = document.getElementById(tableId);
  if (!table) {
    console.warn("table not found:", tableId);
    return;
  }
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  const searchInput = document.getElementById(searchInputId);

  if (!thead || !tbody) {
    console.warn("thead/tbody missing in table:", tableId);
    return;
  }

  let header = [];
  let allRows = [];

  function render(filteredRows) {
    // ヘッダー
    thead.innerHTML = "";
    const trHead = document.createElement("tr");
    header.forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // ボディ
    tbody.innerHTML = "";
    const frag = document.createDocumentFragment();
    filteredRows.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach(cell => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  }

  function applyFilter() {
    const keyword = (searchInput && searchInput.value || "").trim().toLowerCase();
    if (!keyword) {
      render(allRows);
      return;
    }
    const filtered = allRows.filter(row => {
      const joined = row.join(" ").toLowerCase();
      return joined.includes(keyword);
    });
    render(filtered);
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilter);
  }

  fetch(csvPath)
    .then(res => {
      if (!res.ok) {
        throw new Error("CSV 読み込みに失敗しました: " + csvPath);
      }
      return res.text();
    })
    .then(text => {
      const parsed = parseCsv(text);
      header = parsed.header;
      allRows = parsed.rows;
      render(allRows);
    })
    .catch(err => {
      console.error(err);
      tbody.innerHTML = "<tr><td>データを読み込めませんでした</td></tr>";
    });
}

// ページごとに存在するテーブルを確認して初期化
document.addEventListener("DOMContentLoaded", function () {
  // DQ1 キラキラ
  if (document.getElementById("dq1-kira-table")) {
    setupCsvTable({
      csvPath: "dq1_kirakira.csv",
      tableId: "dq1-kira-table",
      searchInputId: "dq1-kira-search"
    });
  }
  // DQ1 ひみつの場所（赤）
  if (document.getElementById("dq1-secret-red-table")) {
    setupCsvTable({
      csvPath: "dq1_secret_place_red.csv",
      tableId: "dq1-secret-red-table",
      searchInputId: "dq1-secret-red-search"
    });
  }
  // DQ1 ひみつの場所（緑）
  if (document.getElementById("dq1-secret-green-table")) {
    setupCsvTable({
      csvPath: "dq1_secret_place_green.csv",
      tableId: "dq1-secret-green-table",
      searchInputId: "dq1-secret-green-search"
    });
  }

  // DQ2 キラキラ（青）
  if (document.getElementById("dq2-kira-blue-table")) {
    setupCsvTable({
      csvPath: "dq2_kirakira_blue.csv",
      tableId: "dq2-kira-blue-table",
      searchInputId: "dq2-kira-blue-search"
    });
  }
  // DQ2 キラキラ（赤）
  if (document.getElementById("dq2-kira-red-table")) {
    setupCsvTable({
      csvPath: "dq2_kirakira_red.csv",
      tableId: "dq2-kira-red-table",
      searchInputId: "dq2-kira-red-search"
    });
  }
  // DQ2 ひみつの場所（青）
  if (document.getElementById("dq2-secret-blue-table")) {
    setupCsvTable({
      csvPath: "dq2_secret_place_blue.csv",
      tableId: "dq2-secret-blue-table",
      searchInputId: "dq2-secret-blue-search"
    });
  }
  // DQ2 ひみつの場所（赤）
  if (document.getElementById("dq2-secret-red-table")) {
    setupCsvTable({
      csvPath: "dq2_secret_place_red.csv",
      tableId: "dq2-secret-red-table",
      searchInputId: "dq2-secret-red-search"
    });
  }

  // DQ2 海底：深海（赤）
  if (document.getElementById("dq2-deep-sea-red-table")) {
    setupCsvTable({
      csvPath: "dq2_deep_sea_red.csv",
      tableId: "dq2-deep-sea-red-table",
      searchInputId: "dq2-deep-sea-red-search"
    });
  }
  // DQ2 海底：海底マップ（青）
  if (document.getElementById("dq2-ocean-floor-blue-table")) {
    setupCsvTable({
      csvPath: "dq2_ocean_floor_blue.csv",
      tableId: "dq2-ocean-floor-blue-table",
      searchInputId: "dq2-ocean-floor-blue-search"
    });
  }
});
