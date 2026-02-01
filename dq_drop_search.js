// dq_drop_search.js
// アイテム名 → ドロップするモンスターを逆引き

(() => {
  const PATHS = {
    dq1Monsters: "data/dq1_monsters.csv",
    dq2Monsters: "data/dq2_monsters.csv",
    dq1Items: "data/dq1_items.csv",
    dq2Items: "data/dq2_items.csv",
  };

  const els = {
    q: document.getElementById("drop-q"),
    suggest: document.getElementById("drop-suggest"),
    game: document.getElementById("drop-game"),
    match: document.getElementById("drop-match"),
    sort: document.getElementById("drop-sort"),
    clear: document.getElementById("drop-clear"),
    status: document.getElementById("drop-status"),
    results: document.getElementById("drop-results"),
  };

  if (!els.q || !els.suggest || !els.game || !els.match || !els.sort || !els.clear || !els.status || !els.results) {
    return;
  }

  // ---------------
  // CSV parser (DQ1/DQ2 DBページと同系)
  // ---------------
  function parseCSV(text) {
    if (!text) return [];
    // BOM
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ',') {
          row.push(field);
          field = "";
        } else if (c === '\n' || c === '\r') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          row.push(field);
          // 空行は捨てる
          if (row.length > 1 || (row[0] || "").trim() !== "") rows.push(row);
          row = [];
          field = "";
        } else {
          field += c;
        }
      }
    }

    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }

    return rows;
  }

  async function loadCSV(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`CSV fetch failed: ${path} (${res.status})`);
    const text = await res.text();
    const rows = parseCSV(text);
    if (!rows.length) return { header: [], data: [] };
    return { header: rows[0], data: rows.slice(1) };
  }

  // ---------------
  // 正規化・分割
  // ---------------
  function stripParen(s) {
    return String(s || "")
      .replace(/（[^）]*）/g, "")
      .replace(/\([^)]*\)/g, "");
  }

  function normalizeKey(s) {
    let t = stripParen(s).trim();
    if (!t) return "";
    if (t.normalize) t = t.normalize("NFKC");
    t = t.toLowerCase();
    // スペース類は除去
    t = t.replace(/[\s　]+/g, "");
    return t;
  }

  function tokenizeDrops(raw) {
    let s = String(raw || "").trim();
    if (!s) return [];
    if (s === "-" || s === "―" || s === "—") return [];

    // よくある区切りを統一
    s = s.replace(/[\r\n]+/g, "、");
    s = s.replace(/[，,\/／;；]+/g, "、");
    s = s.replace(/[・･]+/g, "、");
    s = s.replace(/、{2,}/g, "、");

    return s
      .split("、")
      .map(p => p.trim())
      .filter(p => p && p !== "-" && p !== "―" && p !== "—");
  }

  function simplifyArea(area) {
    return String(area || "")
      .replace(/[\r\n]+/g, " / ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toInt(v) {
    const n = parseInt(String(v || "").replace(/[^0-9-]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ---------------
  // インデックス
  // ---------------
  /** @type {Map<string, Array<object>>} */
  const dropIndex = new Map();
  /** @type {Map<string, string>} */
  const suggestMap = new Map();
  /** @type {string[]} */
  let allKeys = [];
  const stats = { DQ1: 0, DQ2: 0 };

  function addSuggest(name) {
    const disp = String(name || "").trim();
    if (!disp) return;
    const key = normalizeKey(disp);
    if (!key) return;
    if (!suggestMap.has(key)) {
      // 表示は括弧注釈を落としたものを優先
      const clean = stripParen(disp).trim() || disp;
      suggestMap.set(key, clean);
    }
  }

  function addDropEntry(entry) {
    if (!dropIndex.has(entry.itemKey)) dropIndex.set(entry.itemKey, []);
    dropIndex.get(entry.itemKey).push(entry);
  }

  function buildFromMonsters(game, header, data) {
    const idx = {};
    header.forEach((h, i) => {
      const k = String(h || "").trim();
      if (k) idx[k] = i;
    });

    const iName = idx["名前"];
    const iArea = idx["出現エリア"];
    const iExp = idx["経験値"];
    const iGold = idx["ゴールド"];

    // DQ2 は「備考(ドロップ)」→「ドロップ」に修正済みとのことなので両対応
    const iDrop = (idx["ドロップ"] !== undefined)
      ? idx["ドロップ"]
      : (idx["備考(ドロップ)"] !== undefined ? idx["備考(ドロップ)"] : undefined);

    if (iName === undefined || iArea === undefined || iExp === undefined || iGold === undefined || iDrop === undefined) {
      console.warn("drop search: required columns missing", { game, idx });
      return;
    }

    for (const row of data) {
      const monster = (row[iName] || "").trim();
      if (!monster) continue;

      const areaRaw = row[iArea] || "";
      const expRaw = row[iExp] || "";
      const goldRaw = row[iGold] || "";
      const dropRaw = row[iDrop] || "";

      const tokens = tokenizeDrops(dropRaw);
      for (const token of tokens) {
        const itemClean = stripParen(token).trim() || token.trim();
        const key = normalizeKey(itemClean);
        if (!key) continue;

        addSuggest(itemClean);

        addDropEntry({
          game,
          itemKey: key,
          itemName: itemClean,
          monster,
          area: simplifyArea(areaRaw),
          exp: toInt(expRaw),
          gold: toInt(goldRaw),
          dropRaw: String(dropRaw || "").trim(),
        });

        stats[game]++;
      }
    }
  }

  function fillSuggestDatalist() {
    const items = Array.from(suggestMap.entries())
      .map(([key, disp]) => ({ key, disp }))
      .sort((a, b) => a.disp.localeCompare(b.disp, "ja"));

    els.suggest.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const it of items) {
      const opt = document.createElement("option");
      opt.value = it.disp;
      frag.appendChild(opt);
    }
    els.suggest.appendChild(frag);
  }

  // ---------------
  // 描画
  // ---------------
  function render() {
    const rawQ = (els.q.value || "").trim();
    els.results.innerHTML = "";

    if (!rawQ) return;

    const mode = els.match.value;
    const keyQ = normalizeKey(rawQ);
    if (!keyQ) {
      els.results.innerHTML = '<div class="drop-empty">入力内容が短すぎるため、検索できませんでした。</div>';
      return;
    }

    let keys;
    if (mode === "EXACT") {
      keys = dropIndex.has(keyQ) ? [keyQ] : [];
    } else {
      // 部分一致
      keys = allKeys.filter(k => k.includes(keyQ));
    }

    if (!keys.length) {
      els.results.innerHTML = '<div class="drop-empty">該当するドロップが見つかりませんでした。</div>';
      return;
    }

    const target = els.game.value;
    const wantedGames = target === "ALL" ? ["DQ1", "DQ2"] : [target];

    /** @type {Array<object>} */
    const hits = [];
    for (const k of keys) {
      const arr = dropIndex.get(k) || [];
      const itemLabel = suggestMap.get(k) || (arr[0] ? arr[0].itemName : "");
      for (const e of arr) {
        if (!wantedGames.includes(e.game)) continue;
        hits.push({ ...e, itemLabel });
      }
    }

    // 重複排除（部分一致時に同じ行が混ざるのを抑える）
    const seen = new Set();
    const uniq = [];
    for (const h of hits) {
      const sig = `${h.game}|${h.itemKey}|${h.monster}|${h.area}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      uniq.push(h);
    }

    // 並び替え
    const sortMode = els.sort.value;
    uniq.sort((a, b) => {
      if (sortMode === "EXP_DESC") {
        if (b.exp !== a.exp) return b.exp - a.exp;
        if (b.gold !== a.gold) return b.gold - a.gold;
        return a.monster.localeCompare(b.monster, "ja");
      }
      if (sortMode === "GOLD_DESC") {
        if (b.gold !== a.gold) return b.gold - a.gold;
        if (b.exp !== a.exp) return b.exp - a.exp;
        return a.monster.localeCompare(b.monster, "ja");
      }
      if (sortMode === "MONSTER") {
        const m = a.monster.localeCompare(b.monster, "ja");
        if (m) return m;
        return a.area.localeCompare(b.area, "ja");
      }
      // AREA
      const ar = a.area.localeCompare(b.area, "ja");
      if (ar) return ar;
      return a.monster.localeCompare(b.monster, "ja");
    });

    // ゲーム別に分けて描画
    const byGame = { DQ1: [], DQ2: [] };
    for (const u of uniq) byGame[u.game].push(u);

    const frag = document.createDocumentFragment();

    for (const g of wantedGames) {
      const list = byGame[g] || [];
      if (!list.length) continue;

      const h2 = document.createElement("h2");
      h2.textContent = `${g}（${list.length}件）`;
      frag.appendChild(h2);

      const wrap = document.createElement("div");
      wrap.className = "table-wrap";

      const table = document.createElement("table");
      table.className = "drop-table";

      table.innerHTML = `
        <thead>
          <tr>
            <th>アイテム</th>
            <th>モンスター</th>
            <th>出現エリア</th>
            <th>経験値</th>
            <th>ゴールド</th>
            <th>ドロップ</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody = table.querySelector("tbody");
      const dbUrl = g === "DQ1" ? "dq1_db.html" : "dq2_db.html";

      // 表示件数の暴発を抑える（何かの事故で大量になった時の保険）
      const MAX_ROWS = 300;
      const sliced = list.slice(0, MAX_ROWS);

      for (const r of sliced) {
        const tr = document.createElement("tr");

        const tdItem = document.createElement("td");
        tdItem.textContent = r.itemLabel;

        const tdMon = document.createElement("td");
        tdMon.innerHTML = `<a href="${dbUrl}">${escapeHtml(r.monster)}</a>`;

        const tdArea = document.createElement("td");
        tdArea.textContent = r.area || "";

        const tdExp = document.createElement("td");
        tdExp.className = "small";
        tdExp.textContent = String(r.exp || "");

        const tdGold = document.createElement("td");
        tdGold.className = "small";
        tdGold.textContent = String(r.gold || "");

        const tdDrop = document.createElement("td");
        tdDrop.textContent = r.dropRaw || "";

        tr.appendChild(tdItem);
        tr.appendChild(tdMon);
        tr.appendChild(tdArea);
        tr.appendChild(tdExp);
        tr.appendChild(tdGold);
        tr.appendChild(tdDrop);
        tbody.appendChild(tr);
      }

      wrap.appendChild(table);
      frag.appendChild(wrap);

      if (list.length > MAX_ROWS) {
        const note = document.createElement("div");
        note.className = "drop-empty";
        note.textContent = `表示が多いため、先頭 ${MAX_ROWS} 件のみ表示しています。`;
        frag.appendChild(note);
      }
    }

    els.results.appendChild(frag);
  }

  // ---------------
  // 初期化
  // ---------------
  async function init() {
    try {
      els.status.textContent = "データ読み込み中…";

      const [dq1Mon, dq2Mon, dq1Items, dq2Items] = await Promise.all([
        loadCSV(PATHS.dq1Monsters),
        loadCSV(PATHS.dq2Monsters),
        loadCSV(PATHS.dq1Items),
        loadCSV(PATHS.dq2Items),
      ]);

      buildFromMonsters("DQ1", dq1Mon.header, dq1Mon.data);
      buildFromMonsters("DQ2", dq2Mon.header, dq2Mon.data);

      // アイテムCSVの名前も候補に追加（ドロップに無いアイテムでも候補に出せる）
      for (const pack of [dq1Items, dq2Items]) {
        const header = pack.header.map(h => String(h || "").trim());
        const nameIdx = header.indexOf("名前");
        if (nameIdx === -1) continue;
        for (const row of pack.data) {
          addSuggest(row[nameIdx]);
        }
      }

      // datalist
      fillSuggestDatalist();
      allKeys = Array.from(dropIndex.keys());

      els.status.textContent = `データ読み込み完了（DQ1: ${stats.DQ1}件 / DQ2: ${stats.DQ2}件）`;

      // events
      els.q.addEventListener("input", render);
      els.game.addEventListener("change", render);
      els.match.addEventListener("change", render);
      els.sort.addEventListener("change", render);
      els.clear.addEventListener("click", () => {
        els.q.value = "";
        els.q.focus();
        els.results.innerHTML = "";
      });

      // 初期入力があれば反映
      render();
    } catch (err) {
      console.error(err);
      els.status.textContent = "データ読み込みに失敗しました（CSVパスや列名を確認してください）";
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
