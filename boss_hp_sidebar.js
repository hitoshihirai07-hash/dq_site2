// boss_hp_sidebar.js
// ボスHP計算ツール本体（DQI / DQII 両対応）
// - dq1_boss_multiunit.csv / dq2_boss_multiunit.csv からボス情報を読み込み
// - メインのボスHPのみ計算対象
// - 補助・取り巻きは一覧表示のみ（計算には含めない）
// - ダメージ適用ごとに簡易ログを残し、「クリア」でログも消す

(function () {
  "use strict";

  function loadCsv(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) {
        throw new Error("CSV の読み込みに失敗しました: " + path);
      }
      return res.text();
    });
  }

  function parseBossCsv(text, game) {
    var lines = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter(function (l) { return l.trim() !== ""; });

    if (!lines.length) {
      return { game: game, bosses: {} };
    }

    var header = lines[0].split(",");
    function idx(name) {
      var i = header.indexOf(name);
      return i >= 0 ? i : -1;
    }

    var idxBossName = idx("ボス戦名");
    var idxUnitName = idx("個体名");
    var idxCount    = idx("体数");
    var idxHp       = idx("HP");
    var idxPlace    = idx("出現場所");

    var bosses = {};

    for (var i = 1; i < lines.length; i++) {
      var cols = lines[i].split(",");
      if (cols.length === 1 && cols[0].trim() === "") continue;
      // 途中に再度ヘッダー行が入っている場合（例：ボス戦名,個体名,...）はスキップ
      if (cols[0].trim() === header[0].trim()) continue;

      var bossName = idxBossName >= 0 ? (cols[idxBossName] || "").trim() : "";
      if (!bossName) continue;

      var unitName = idxUnitName >= 0 ? (cols[idxUnitName] || "").trim() : bossName;
      var count    = idxCount    >= 0 ? (cols[idxCount]    || "").trim() : "";
      var hpStr    = idxHp       >= 0 ? (cols[idxHp]       || "").trim() : "";
      var place    = idxPlace    >= 0 ? (cols[idxPlace]    || "").trim() : "";

      var hp = parseInt(hpStr, 10);
      // HP が不明または 0 以下の行はボス候補から除外
      if (isNaN(hp) || hp <= 0) continue;

      if (!bosses[bossName]) {
        bosses[bossName] = {
          name: bossName,
          game: game,
          main: null,
          helpers: []
        };
      }

      var entry = {
        bossName: bossName,
        unitName: unitName,
        count: count,
        hp: hp,
        place: place
      };

      if (!bosses[bossName].main) {
        bosses[bossName].main = entry;
      } else {
        bosses[bossName].helpers.push(entry);
      }
    }

    return { game: game, bosses: bosses };
  }

  function initBossHpTool(root) {
    var dq1Path = root.getAttribute("data-dq1-csv");
    var dq2Path = root.getAttribute("data-dq2-csv");

    var gameSelect   = root.querySelector('[data-role="game-select"]');
    var bossSelect   = root.querySelector('[data-role="boss-select"]');
    var maxHpEl      = root.querySelector('[data-role="max-hp"]');
    var currentHpEl  = root.querySelector('[data-role="current-hp"]');
    var percentEl    = root.querySelector('[data-role="percent"]');
    var damageInput  = root.querySelector('[data-role="damage-input"]');
    var applyBtn     = root.querySelector('[data-role="apply"]');
    var clearBtn     = root.querySelector('[data-role="clear"]');
    var alertEl      = root.querySelector('[data-role="alert"]');
    var helpersBox   = root.querySelector('[data-role="helpers"]');
    var helpersList  = root.querySelector('[data-role="helpers-list"]');
    var logBox       = root.querySelector('[data-role="hp-log"]');
    var logList      = root.querySelector('[data-role="hp-log-list"]');

    if (!gameSelect || !bossSelect || !maxHpEl || !currentHpEl || !percentEl || !damageInput || !applyBtn || !clearBtn) {
      return;
    }

    var dataByGame = {
      DQ1: {},
      DQ2: {}
    };

    var currentGame = "";
    var currentBossKey = "";
    var currentBoss = null;
    var maxHp = 0;
    var currentHp = 0;
    var logCounter = 0;

    function setAlert(msg) {
      if (!alertEl) return;
      alertEl.textContent = msg || "";
    }

    function formatPercent(hp, maxHp) {
      if (!maxHp || maxHp <= 0) return "-";
      var p = (hp / maxHp) * 100;
      return p.toFixed(1) + "%";
    }

    function updateDisplay() {
      maxHpEl.textContent = maxHp > 0 ? String(maxHp) : "-";
      currentHpEl.textContent = currentHp > 0 ? String(currentHp) : (maxHp > 0 ? "0" : "-");
      percentEl.textContent = maxHp > 0 ? formatPercent(currentHp, maxHp) : "-";
    }

    function clearHelpers() {
      if (!helpersBox || !helpersList) return;
      helpersList.innerHTML = "";
      helpersBox.style.display = "none";
    }

    function renderHelpers(boss) {
      clearHelpers();
      if (!boss || !helpersBox || !helpersList) return;
      if (!boss.helpers || !boss.helpers.length) return;

      boss.helpers.forEach(function (h) {
        var li = document.createElement("li");
        var parts = [];
        if (h.unitName) parts.push(h.unitName);
        if (h.count) parts.push(h.count + "体");
        if (h.hp) parts.push("HP " + h.hp);
        helpersList.appendChild(li);
        li.textContent = parts.join(" / ");
      });
      helpersBox.style.display = "";
    }

    function clearLog() {
      if (!logList) return;
      logList.innerHTML = "";
      logCounter = 0;
    }

    function appendLog(damage) {
      if (!logList || !currentBoss) return;
      logCounter += 1;

      var li = document.createElement("li");
      var bossLabel = currentBoss.name || currentBoss.main && currentBoss.main.bossName || "";
      var beforeHp = currentHp + damage;
      if (beforeHp > maxHp) beforeHp = maxHp;

      var line = "#" + logCounter + " ";
      if (bossLabel) {
        line += bossLabel + "：";
      }
      line += String(damage) + "ダメージ → ";
      line += "HP " + currentHp + " / " + maxHp;
      line += "（" + formatPercent(currentHp, maxHp) + "）";

      li.textContent = line;
      logList.appendChild(li);

      if (logBox) {
        logBox.style.display = "";
      }
    }

    function resetStateForBoss(boss) {
      currentBoss = boss || null;
      if (!boss || !boss.main) {
        maxHp = 0;
        currentHp = 0;
        updateDisplay();
        clearHelpers();
        clearLog();
        return;
      }
      maxHp = boss.main.hp || 0;
      currentHp = maxHp;
      updateDisplay();
      renderHelpers(boss);
      clearLog();
    }

    function fillBossOptions(gameKey) {
      bossSelect.innerHTML = "";
      var opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "-- ボスを選択 --";
      bossSelect.appendChild(opt0);

      var bosses = dataByGame[gameKey] || {};
      // CSV 上の並び順（実際に戦う順）をそのまま使うため、並べ替えは行わない
      Object.keys(bosses).forEach(function (name) {
        var opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        bossSelect.appendChild(opt);
      });

      bossSelect.disabled = Object.keys(bosses).length === 0;
    }

    // CSV 読み込み
    var promises = [];

    if (dq1Path) {
      promises.push(
        loadCsv(dq1Path).then(function (txt) {
          var parsed = parseBossCsv(txt, "DQ1");
          dataByGame.DQ1 = parsed.bosses;
        }).catch(function (e) {
          console.error(e);
        })
      );
    }

    if (dq2Path) {
      promises.push(
        loadCsv(dq2Path).then(function (txt) {
          var parsed = parseBossCsv(txt, "DQ2");
          dataByGame.DQ2 = parsed.bosses;
        }).catch(function (e) {
          console.error(e);
        })
      );
    }

    Promise.all(promises).then(function () {
      // 読み込み完了後の初期化
      updateDisplay();
      clearHelpers();
      clearLog();
    });

    gameSelect.addEventListener("change", function () {
      var val = gameSelect.value || "";
      currentGame = val;
      currentBossKey = "";
      resetStateForBoss(null);
      setAlert("");

      if (!val) {
        bossSelect.innerHTML = "";
        var opt0 = document.createElement("option");
        opt0.value = "";
        opt0.textContent = "-- ボスを選択 --";
        bossSelect.appendChild(opt0);
        bossSelect.disabled = true;
        return;
      }

      fillBossOptions(val);
    });

    bossSelect.addEventListener("change", function () {
      var key = bossSelect.value || "";
      currentBossKey = key;
      setAlert("");

      if (!currentGame || !key) {
        resetStateForBoss(null);
        return;
      }
      var bosses = dataByGame[currentGame] || {};
      var boss = bosses[key];
      resetStateForBoss(boss);
    });

    applyBtn.addEventListener("click", function () {
      if (!currentBoss) {
        setAlert("先にボスを選択してください。");
        return;
      }
      var v = parseInt(damageInput.value, 10);
      if (isNaN(v) || v < 0) {
        setAlert("ダメージを正しく入力してください。");
        return;
      }
      setAlert("");

      var before = currentHp;
      currentHp -= v;
      if (currentHp < 0) currentHp = 0;
      updateDisplay();
      appendLog(v);

      damageInput.value = "";
      damageInput.focus();
    });

    clearBtn.addEventListener("click", function () {
      setAlert("");
      if (!currentBoss || !currentBoss.main) {
        currentHp = 0;
        maxHp = 0;
        updateDisplay();
        clearHelpers();
        clearLog();
        return;
      }
      currentHp = currentBoss.main.hp || 0;
      maxHp = currentBoss.main.hp || 0;
      updateDisplay();
      clearLog();
    });

    damageInput.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        applyBtn.click();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var tools = document.querySelectorAll(".boss-hp-tool");
    for (var i = 0; i < tools.length; i++) {
      initBossHpTool(tools[i]);
    }
  });
})();
