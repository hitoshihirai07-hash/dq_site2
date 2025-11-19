document.addEventListener("DOMContentLoaded", () => {
  const listRoot = document.querySelector('[data-role="boss-list"]');
  const detailRoot = document.querySelector('[data-role="boss-detail"]');

  // 軽い見た目調整用のスタイルを追加
  const style = document.createElement("style");
  style.textContent = `
    table.boss-index-table {
      border-collapse: collapse;
      width: 100%;
      max-width: 900px;
    }
    table.boss-index-table th,
    table.boss-index-table td {
      border: 1px solid #ddd;
      padding: 4px 6px;
      font-size: 13px;
    }
    table.boss-index-table th {
      background: #f5f5f5;
    }
    .boss-main-block {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 10px 12px;
      margin: 8px 0 12px;
      font-size: 13px;
      background: #ffffff;
    }
    .boss-main-block h3 {
      margin: 0 0 6px;
      font-size: 15px;
    }
    .boss-main-block p {
      margin: 3px 0;
    }
    table.boss-sub-table {
      border-collapse: collapse;
      width: 100%;
      max-width: 900px;
      margin-top: 8px;
      background: #ffffff;
    }
    table.boss-sub-table th,
    table.boss-sub-table td {
      border: 1px solid #666;
      padding: 4px 6px;
      font-size: 12px;
    }
    table.boss-sub-table th {
      background: #f0f0f0;
      text-align: center;
    }
    table.boss-sub-table td:nth-child(2),
    table.boss-sub-table td:nth-child(3),
    table.boss-sub-table td:nth-child(4),
    table.boss-sub-table td:nth-child(5) {
      text-align: right;
    }
  `;
  document.head && document.head.appendChild(style);

  if (listRoot) {
    setupBossList(listRoot);
  }
  if (detailRoot) {
    setupBossDetail(detailRoot);
  }
});

function setupBossList(root) {
  const csvFile = root.getAttribute("data-csv");
  const detailPage = root.getAttribute("data-detail") || "dq1_boss_detail.html";
  if (!csvFile) return;

  fetch(csvFile)
    .then((res) => {
      if (!res.ok) throw new Error("CSV load failed: " + res.status);
      return res.text();
    })
    .then((text) => {
      const rows = parseCSV(text);
      if (!rows || rows.length <= 1) return;

      const header = rows[0];
      const idxBoss = header.indexOf("ボス戦名");
      const idxPlace = header.indexOf("出現場所");
      const idxHP = header.indexOf("HP");
      const idxExp = header.indexOf("経験値");
      const idxGold = header.indexOf("ゴールド");

      if (idxBoss === -1) return;

      const bosses = new Map();
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        const bossName = cols[idxBoss] || "";
        if (!bossName) continue;
        if (!bosses.has(bossName)) {
          bosses.set(bossName, {
            name: bossName,
            place: idxPlace >= 0 ? (cols[idxPlace] || "") : "",
            hp: idxHP >= 0 ? (cols[idxHP] || "") : "",
            exp: idxExp >= 0 ? (cols[idxExp] || "") : "",
            gold: idxGold >= 0 ? (cols[idxGold] || "") : "",
          });
        }
      }

      const table = document.createElement("table");
      table.className = "boss-index-table";
      const thead = document.createElement("thead");
      const trh = document.createElement("tr");
      ["ボス戦名", "出現場所", "HP", "経験値", "ゴールド"].forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        trh.appendChild(th);
      });
      thead.appendChild(trh);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      for (const info of bosses.values()) {
        const tr = document.createElement("tr");

        const tdName = document.createElement("td");
        const a = document.createElement("a");
        a.textContent = info.name;
        a.href = detailPage + "?boss=" + encodeURIComponent(info.name);
        tdName.appendChild(a);

        const tdPlace = document.createElement("td");
        tdPlace.textContent = info.place || "";

        const tdHP = document.createElement("td");
        tdHP.textContent = info.hp || "";

        const tdExp = document.createElement("td");
        tdExp.textContent = info.exp || "";

        const tdGold = document.createElement("td");
        tdGold.textContent = info.gold || "";

        tr.appendChild(tdName);
        tr.appendChild(tdPlace);
        tr.appendChild(tdHP);
        tr.appendChild(tdExp);
        tr.appendChild(tdGold);
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      root.appendChild(table);
    })
    .catch((err) => console.error(err));
}

// 行動パターンの文字列を「①〜⑳」で自動改行
function formatPattern(raw) {
  if (!raw) return "";

  // HTMLエスケープ
  let s = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // ②〜⑳ の前で改行を入れる（①は先頭に来る想定なので改行しない）
  // ①こうげき②…③… → ①こうげき<br>②…<br>③…
  s = s.replace(/(?!^)([②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])/g, "<br>$1");

  return s;
}

function setupBossDetail(root) {
  const csvFile = root.getAttribute("data-csv");
  if (!csvFile) return;

  const params = new URLSearchParams(window.location.search);
  const bossName = params.get("boss");
  if (!bossName) {
    root.textContent = "ボスが指定されていません。";
    return;
  }

  fetch(csvFile)
    .then((res) => {
      if (!res.ok) throw new Error("CSV load failed: " + res.status);
      return res.text();
    })
    .then((text) => {
      const rows = parseCSV(text);
      if (!rows || rows.length <= 1) {
        root.textContent = "データが見つかりません。";
        return;
      }

      const header = rows[0];
      const idxBoss = header.indexOf("ボス戦名");
      const idxUnit = header.indexOf("個体名");
      const idxCount = header.indexOf("体数");
      const idxHP = header.indexOf("HP");
      const idxExp = header.indexOf("経験値");
      const idxGold = header.indexOf("ゴールド");
      const idxPlace = header.indexOf("出現場所");
      const idxNote = header.indexOf("特徴メモ");
      const idxPattern = header.indexOf("行動パターン");
      const idxSrc = header.indexOf("参考元");

      if (idxBoss === -1) {
        root.textContent = "ボス名の列が見つかりません。";
        return;
      }

      const units = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (!cols[idxBoss] || cols[idxBoss] !== bossName) continue;
        units.push({
          unit: idxUnit >= 0 ? (cols[idxUnit] || "") : "",
          count: idxCount >= 0 ? (cols[idxCount] || "") : "",
          hp: idxHP >= 0 ? (cols[idxHP] || "") : "",
          exp: idxExp >= 0 ? (cols[idxExp] || "") : "",
          gold: idxGold >= 0 ? (cols[idxGold] || "") : "",
          place: idxPlace >= 0 ? (cols[idxPlace] || "") : "",
          note: idxNote >= 0 ? (cols[idxNote] || "") : "",
          pattern: idxPattern >= 0 ? (cols[idxPattern] || "") : "",
          src: idxSrc >= 0 ? (cols[idxSrc] || "") : "",
        });
      }

      if (!units.length) {
        root.textContent = "指定されたボスのデータが見つかりません。";
        return;
      }

      // メイン（ボス本体）とサブを分ける
      let mainUnit = units.find((u) => u.unit === bossName);
      if (!mainUnit) {
        mainUnit = units[0];
      }
      const subUnits = units.filter((u) => u !== mainUnit);

      root.innerHTML = "";

      // 見出し
      const h2 = document.createElement("h2");
      h2.textContent = bossName;
      root.appendChild(h2);

      // 出現場所（最初に見つかったもの）
      const place = mainUnit.place || (units.find((u) => u.place)?.place || "");
      if (place) {
        const pPlace = document.createElement("p");
        pPlace.textContent = "出現場所：" + place;
        root.appendChild(pPlace);
      }

      // ===== ボス本体のまとめ表示 =====
      const mainSection = document.createElement("section");
      mainSection.className = "boss-main-block";

      const h3 = document.createElement("h3");
      const countLabel = mainUnit.count ? `（${mainUnit.count}体）` : "";
      h3.textContent = (mainUnit.unit || bossName) + countLabel;
      mainSection.appendChild(h3);

      const pStatus = document.createElement("p");
      const statusParts = [];
      if (mainUnit.hp) statusParts.push("HP：" + mainUnit.hp);
      if (mainUnit.exp) statusParts.push("経験値：" + mainUnit.exp);
      if (mainUnit.gold) statusParts.push("ゴールド：" + mainUnit.gold);
      pStatus.textContent = statusParts.join(" / ");
      mainSection.appendChild(pStatus);

      if (mainUnit.note) {
        const pNote = document.createElement("p");
        pNote.textContent = "特徴・メモ：" + mainUnit.note;
        mainSection.appendChild(pNote);
      }

      if (mainUnit.pattern) {
        const pPattern = document.createElement("p");
        pPattern.innerHTML = "行動パターン：" + formatPattern(mainUnit.pattern);
        mainSection.appendChild(pPattern);
      }

      if (mainUnit.src) {
        const pSrc = document.createElement("p");
        pSrc.textContent = "参考元：" + mainUnit.src;
        mainSection.appendChild(pSrc);
      }

      root.appendChild(mainSection);

      // ===== 子分などサブ個体の一覧（いる場合だけ） =====
      if (subUnits.length) {
        const h3subs = document.createElement("h3");
        h3subs.textContent = "編成・同行モンスター";
        root.appendChild(h3subs);

        const table = document.createElement("table");
        table.className = "boss-sub-table";

        const thead = document.createElement("thead");
        const trh = document.createElement("tr");
        ["個体名", "体数", "HP", "経験値", "ゴールド", "行動パターン", "メモ"].forEach((label) => {
          const th = document.createElement("th");
          th.textContent = label;
          trh.appendChild(th);
        });
        thead.appendChild(trh);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        subUnits.forEach((u) => {
          const tr = document.createElement("tr");
          const formattedPattern = u.pattern ? formatPattern(u.pattern) : "";
          const cols = [
            u.unit,
            u.count,
            u.hp,
            u.exp,
            u.gold,
            formattedPattern,
            u.note || "",
          ];
          cols.forEach((val, index) => {
            const td = document.createElement("td");
            if (index === 5 && typeof val === "string" && val.includes("<br>")) {
              td.innerHTML = val; // 行動パターン列だけ <br> を解釈
            } else {
              td.textContent = val || "";
            }
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        root.appendChild(table);
      }
    })
    .catch((err) => {
      console.error(err);
      root.textContent = "読み込み中にエラーが発生しました。";
    });
}

// simple CSV parser（外部ライブラリは使わない）
function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(current);
        current = "";
      } else if (c === "\r") {
        // ignore
      } else if (c === "\n") {
        row.push(current);
        rows.push(row);
        row = [];
        current = "";
      } else {
        current += c;
      }
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}
