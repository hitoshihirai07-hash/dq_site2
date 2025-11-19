
// boss_hp_global.js
// dq1_boss_multiunit.csv / dq2_boss_multiunit.csv からボスHPを読み込んで
// トップページ右側の計算ツールで利用する。

(function () {
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          const next = text[i + 1];
          if (next === '"') {
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
        } else if (c === "\n" || c === "\r") {
          if (current.length > 0 || row.length > 0) {
            row.push(current);
            rows.push(row);
            row = [];
            current = "";
          }
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

  function buildBossesFromRows(rows, gameTag) {
    if (!rows || rows.length <= 1) return [];

    const header = rows[0];
    const idxBoss = header.indexOf("ボス戦名");
    const idxUnit = header.indexOf("個体名");
    const idxCount = header.indexOf("体数");
    const idxHP = header.indexOf("HP");

    if (idxBoss === -1 || idxHP === -1) return [];

    const map = new Map();

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (!cols || !cols.length) continue;

      const bossName = (cols[idxBoss] || "").trim();
      if (!bossName) continue;

      const unitName = idxUnit >= 0 ? (cols[idxUnit] || "").trim() : "";
      const countRaw = idxCount >= 0 ? (cols[idxCount] || "").trim() : "";
      const hpRaw = (cols[idxHP] || "").trim();

      const count = countRaw ? parseInt(countRaw, 10) : null;
      const hp = hpRaw ? parseInt(hpRaw.replace(/[^0-9]/g, ""), 10) : null;

      let boss = map.get(bossName);
      if (!boss) {
        boss = {
          game: gameTag,
          name: bossName,
          mainHp: null,
          mainUnitName: "",
          helpers: []
        };
        map.set(bossName, boss);
      }

      const isMain = unitName === bossName || (!boss.mainUnitName && unitName);
      if (isMain) {
        boss.mainUnitName = unitName || bossName;
        if (hp != null && !isNaN(hp)) {
          boss.mainHp = hp;
        }
      } else {
        boss.helpers.push({
          name: unitName || bossName,
          count: count,
          hp: hp
        });
      }
    }

    const list = [];
    map.forEach((value) => {
      if (value.mainHp == null || isNaN(value.mainHp)) {
        return;
      }
      list.push({
        game: value.game,
        name: value.name,
        mainHp: value.mainHp,
        helpers: value.helpers || []
      });
    });

    return list;
  }

  function setupBossHpTool(root, bosses) {
    if (!bosses || !bosses.length) return;

    const select = root.querySelector("[data-role='boss-select']");
    const maxHpSpan = root.querySelector("[data-role='max-hp']");
    const currentHpSpan = root.querySelector("[data-role='current-hp']");
    const percentSpan = root.querySelector("[data-role='percent']");
    const damageInput = root.querySelector("[data-role='damage-input']");
    const applyBtn = root.querySelector("[data-role='apply']");
    const clearBtn = root.querySelector("[data-role='clear']");
    const alertBox = root.querySelector("[data-role='alert']");
    const helpersBox = root.querySelector("[data-role='helpers']");
    const helpersList = root.querySelector("[data-role='helpers-list']");

    if (!select || !maxHpSpan || !currentHpSpan || !percentSpan || !damageInput || !applyBtn || !clearBtn) {
      return;
    }

    let currentIndex = -1;
    let maxHp = 0;
    let currentHp = 0;
    let halfAlertShown = false;

    function formatHp(n) {
      if (isNaN(n)) n = 0;
      return String(n);
    }

    function renderHelpers() {
      if (!helpersBox || !helpersList) return;
      helpersList.innerHTML = "";
      if (currentIndex < 0) {
        helpersBox.style.display = "none";
        return;
      }
      const b = bosses[currentIndex];
      if (!b || !b.helpers || !b.helpers.length) {
        helpersBox.style.display = "none";
        return;
      }
      helpersBox.style.display = "block";
      b.helpers.forEach((h) => {
        const li = document.createElement("li");
        let text = h.name;
        if (h.count != null && !isNaN(h.count)) {
          text += " / " + h.count + "体";
        }
        if (h.hp != null && !isNaN(h.hp)) {
          text += " / HP " + h.hp;
        }
        li.textContent = text;
        helpersList.appendChild(li);
      });
    }

    function updateDisplay() {
      if (currentIndex < 0) {
        maxHpSpan.textContent = "-";
        currentHpSpan.textContent = "-";
        percentSpan.textContent = "-";
        if (alertBox) alertBox.textContent = "";
        if (helpersBox) helpersBox.style.display = "none";
        return;
      }
      maxHpSpan.textContent = formatHp(maxHp);
      currentHpSpan.textContent = formatHp(currentHp);
      if (maxHp > 0) {
        let pct = Math.round((currentHp / maxHp) * 100);
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;
        percentSpan.textContent = pct + "%";
      } else {
        percentSpan.textContent = "-";
      }
    }

    function setBoss(index) {
      const b = bosses[index];
      currentIndex = index;
      halfAlertShown = false;
      if (alertBox) alertBox.textContent = "";
      if (!b) {
        maxHp = 0;
        currentHp = 0;
      } else {
        maxHp = Number(b.mainHp) || 0;
        currentHp = maxHp;
      }
      damageInput.value = "";
      renderHelpers();
      updateDisplay();
    }

    // セレクトにボス名を追加（ゲーム別にまとめて表示）
    bosses
      .slice()
      .sort((a, b) => {
        const ga = a.game.localeCompare(b.game, "ja");
        if (ga !== 0) return ga;
        return a.name.localeCompare(b.name, "ja");
      })
      .forEach((b, index) => {
        const opt = document.createElement("option");
        opt.value = String(index);
        opt.textContent = "[" + b.game + "] " + b.name;
        select.appendChild(opt);
      });

    select.addEventListener("change", () => {
      const v = select.value;
      if (v === "") {
        currentIndex = -1;
        updateDisplay();
        renderHelpers();
      } else {
        setBoss(parseInt(v, 10));
      }
    });

    applyBtn.addEventListener("click", () => {
      if (currentIndex < 0) return;
      const dmg = Number(damageInput.value);
      if (!(dmg > 0)) return;

      const prevHp = currentHp;
      currentHp = Math.max(0, currentHp - dmg);
      updateDisplay();

      if (!halfAlertShown && maxHp > 0 && prevHp > maxHp / 2 && currentHp <= maxHp / 2) {
        if (alertBox) {
          alertBox.textContent = "HPが半分を下回りました。行動変化に注意。";
        }
        halfAlertShown = true;
      }
    });

    clearBtn.addEventListener("click", () => {
      if (currentIndex < 0) return;
      currentHp = maxHp;
      halfAlertShown = false;
      if (alertBox) alertBox.textContent = "";
      damageInput.value = "";
      updateDisplay();
    });

    updateDisplay();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector(".boss-hp-tool");
    if (!root) return;

    const bossesAll = [];

    Promise.all([
      fetch("dq1_boss_multiunit.csv").then((res) => (res.ok ? res.text() : "")),
      fetch("dq2_boss_multiunit.csv").then((res) => (res.ok ? res.text() : ""))
    ])
      .then(([t1, t2]) => {
        if (t1) {
          const rows1 = parseCSV(t1);
          bossesAll.push(...buildBossesFromRows(rows1, "DQ1"));
        }
        if (t2) {
          const rows2 = parseCSV(t2);
          bossesAll.push(...buildBossesFromRows(rows2, "DQ2"));
        }
        if (!bossesAll.length) return;
        setupBossHpTool(root, bossesAll);
      })
      .catch((err) => {
        console.error(err);
      });
  });
})();
