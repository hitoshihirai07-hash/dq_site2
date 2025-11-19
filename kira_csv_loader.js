// kira_csv_loader.js
// data-csv 属性を持つ table に、指定された CSV の内容を読み込んで表示します。
async function loadCsvToTable(table, csvPath) {
  try {
    const res = await fetch(csvPath);
    if (!res.ok) {
      console.error("CSV の読み込みに失敗しました:", csvPath, res.status);
      return;
    }
    const text = await res.text();
    const lines = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter(function (l) { return l.trim() !== ""; });
    if (!lines.length) return;

    const headers = lines[0].split(",");

    let thead = table.querySelector("thead");
    if (!thead) {
      thead = document.createElement("thead");
      table.appendChild(thead);
    }
    let tbody = table.querySelector("tbody");
    if (!tbody) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }
    thead.innerHTML = "";
    tbody.innerHTML = "";

    const trHead = document.createElement("tr");
    headers.forEach(function (h) {
      const th = document.createElement("th");
      th.textContent = h.trim();
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length === 1 && cols[0].trim() === "") continue;
      const tr = document.createElement("tr");
      headers.forEach(function (_, idx) {
        const td = document.createElement("td");
        td.textContent = (cols[idx] || "").trim();
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
  } catch (e) {
    console.error("CSV 読み込み中にエラー:", csvPath, e);
  }
}

function initKiraTables() {
  const tables = document.querySelectorAll("table[data-csv]");
  tables.forEach(function (tbl) {
    const path = tbl.getAttribute("data-csv");
    if (path) {
      loadCsvToTable(tbl, path);
    }
  });
}

function setupKiraSearch() {
  const inputs = document.querySelectorAll('input[data-filter-table]');
  inputs.forEach(function (input) {
    input.addEventListener('input', function () {
      const tableId = input.getAttribute('data-filter-table');
      const table = document.getElementById(tableId);
      if (!table) return;
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      const rows = tbody.querySelectorAll('tr');
      const q = input.value.trim().toLowerCase();
      rows.forEach(function (row) {
        const text = row.textContent.toLowerCase();
        if (!q || text.indexOf(q) !== -1) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initKiraTables();
  setupKiraSearch();
});

