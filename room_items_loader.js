// room_items_loader.js
// data-csv を持つ table に CSV を読み込み、
// data-filter-table を持つ入力で簡易検索できるようにします。
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

function initRoomTables() {
  const tables = document.querySelectorAll("table[data-csv]");
  tables.forEach(function (tbl) {
    const path = tbl.getAttribute("data-csv");
    if (path) {
      loadCsvToTable(tbl, path);
    }
  });

  const inputs = document.querySelectorAll("input[data-filter-table]");
  inputs.forEach(function (inp) {
    const targetId = inp.getAttribute("data-filter-table");
    if (!targetId) return;
    const table = document.getElementById(targetId);
    if (!table) return;

    inp.addEventListener("input", function () {
      const keyword = inp.value.trim().toLowerCase();
      const tbody = table.querySelector("tbody");
      if (!tbody) return;
      const rows = tbody.querySelectorAll("tr");
      rows.forEach(function (tr) {
        const text = tr.textContent || "";
        const hit = text.toLowerCase().indexOf(keyword) !== -1;
        tr.style.display = hit || keyword === "" ? "" : "none";
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", initRoomTables);
