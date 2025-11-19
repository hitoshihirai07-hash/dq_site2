// site_search.js
// トップページ右側の「サイト内検索」用スクリプト
// ・ページ単位の検索（タイトル／キーワード）
// ・CSV やモンスターデータ内のアイテム名などの検索
// の両方に対応しています。

// ---------------------
// ページ一覧（リンク先単位）
// ---------------------
const SITE_SEARCH_PAGES = [
  // 基本・全体（存在しないページは今後作成予定の想定）
  {
    title: "サイトの使い方",
    url: "howto.html",
    keywords: "使い方 サイト構成 探し方 見方 説明"
  },
  {
    title: "プレイ方針・注意点",
    url: "policy.html",
    keywords: "プレイ方針 注意点 ネタバレ 周回 RTA 方針"
  },
  {
    title: "メモ・小ネタ",
    url: "memo.html",
    keywords: "メモ 小ネタ 周回 RTA 備忘録 ちょっとした情報"
  },
  {
    title: "このサイトについて",
    url: "about.html",
    keywords: "このサイトについて 参考サイト 情報源"
  },
  {
    title: "更新履歴",
    url: "history.html",
    keywords: "更新履歴 更新情報 変更履歴"
  },

  // 共通
  {
    title: "世界地図（DQ1・DQ2）",
    url: "worldmap.html",
    keywords: "世界地図 マップ DQ1 DQ2 位置 関係"
  },

  // DQ1
  {
    title: "DQI ストーリー攻略",
    url: "dq1_story.html",
    keywords: "DQ1 ドラクエ1 ストーリー 攻略 進行 章 ボス カンダタ ようじゅつし ドラゴン ゴーレム りゅうおう 竜王"
  },
  {
    title: "DQI ボス攻略一覧",
    url: "dq1_boss_list.html",
    keywords: "DQ1 ドラクエ1 ボス一覧 HP 経験値 ゴールド りゅうおう 竜王 カンダタ ようじゅつし ゴーレム"
  },
  {
    title: "DQI データベース（アイテム・呪文・モンスター）",
    url: "dq1_db.html",
    keywords: "DQ1 データベース アイテム 装備 どうぐ 呪文 特技 モンスター ステータス ドロップ"
  },
  {
    title: "DQI キラキラの場所一覧",
    url: "dq1_kirakira.html",
    keywords: "DQ1 キラキラ フィールド 位置 場所 アイテム ちからのたね"
  },
  {
    title: "DQI ひみつの場所一覧",
    url: "dq1_secret_place.html",
    keywords: "DQ1 ひみつの場所 秘密の場所 隠しポイント アイテム ちからのたね"
  },
  {
    title: "DQI 町・ダンジョン内アイテム一覧",
    url: "dq1_room_items.html",
    keywords: "DQ1 町 ダンジョン アイテム 部屋 ツボ タル タンス 地面 ガライ マイラ ラダトーム ちからのたね"
  },
  {
    title: "DQI ちいさなメダルまとめ",
    url: "dq1_medal.html",
    keywords: "DQ1 ちいさなメダル メダル 景品 場所 入手"
  },

  // DQ2
  {
    title: "DQII ボス攻略一覧",
    url: "dq2_boss_list.html",
    keywords: "DQ2 ドラクエ2 ボス一覧 HP 経験値 ゴールド"
  },
  {
    title: "DQII データベース（アイテム・呪文・モンスター）",
    url: "dq2_db.html",
    keywords: "DQ2 データベース アイテム 装備 どうぐ 呪文 特技 モンスター ステータス ドロップ"
  },
  {
    title: "DQII キラキラの場所一覧",
    url: "dq2_kirakira.html",
    keywords: "DQ2 キラキラ フィールド 海辺 深海 位置 場所 アイテム ちからのたね"
  },
  {
    title: "DQII ひみつの場所一覧",
    url: "dq2_secret_place.html",
    keywords: "DQ2 ひみつの場所 秘密の場所 隠しポイント アイテム ちからのたね"
  },
  {
    title: "DQII 町・ダンジョン内アイテム一覧",
    url: "dq2_room_items.html",
    keywords: "DQ2 町 ダンジョン アイテム 部屋 ツボ タル タンス 地面 ローレシア サマルトリア ムーンブルク ちからのたね"
  },
  {
    title: "DQII ちいさなメダルまとめ",
    url: "dq2_medal.html",
    keywords: "DQ2 ちいさなメダル メダル 景品 場所 入手"
  }
];

// ---------------------
// アイテム系データソース
// ---------------------
// 各 CSV 内の行を「検索対象」としてまとめておき、アイテム名や場所名で横断検索します。
const ITEM_SOURCES = [
  // DQ1: キラキラ / ひみつの場所 / 町・ダンジョン / メダル / モンスタードロップ
  {
    label: "DQI キラキラ",
    csvPath: "dq1_kiraakira.csv",
    url: "dq1_kirakira.html"
  },
  {
    label: "DQI ひみつの場所",
    csvPath: "dq1_secret_place.csv",
    url: "dq1_secret_place.html"
  },
  {
    label: "DQI 町・ダンジョン内アイテム",
    csvPath: "dq1_room_items.csv",
    url: "dq1_room_items.html"
  },
  {
    label: "DQI メダル入手場所",
    csvPath: "dq1_medal.csv",
    url: "dq1_medal.html"
  },
  {
    label: "DQI メダル景品",
    csvPath: "dq1_prize.csv",
    url: "dq1_medal.html"
  },
  {
    label: "DQI モンスタードロップ",
    csvPath: "data/dq1_monsters.csv",
    url: "dq1_db.html"
  },

  // DQ2: キラキラ / ひみつの場所 / 町・ダンジョン / メダル / モンスタードロップ
  {
    label: "DQII キラキラ",
    csvPath: "dq2_kirakira.csv",
    url: "dq2_kirakira.html"
  },
  {
    label: "DQII ひみつの場所",
    csvPath: "dq2_secret_place.csv",
    url: "dq2_secret_place.html"
  },
  {
    label: "DQII 町・ダンジョン内アイテム",
    csvPath: "dq2_room_items.csv",
    url: "dq2_room_items.html"
  },
  {
    label: "DQII メダル入手場所",
    csvPath: "medal - dq2_medal.csv",
    url: "dq2_medal.html"
  },
  {
    label: "DQII メダル景品",
    csvPath: "medal - dq2_prize.csv",
    url: "dq2_medal.html"
  },
  {
    label: "DQII モンスタードロップ",
    csvPath: "data/dq2_monsters.csv",
    url: "dq2_db.html"
  }
];

// CSV の 1 行ごとをまとめたインデックス
let ITEM_INDEX = [];
let ITEM_INDEX_LOADED = false;

// 簡易 CSV パーサー（カンマ区切り前提、ダブルクォート埋め込みなどは考慮しない）
function parseSimpleCsv(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter(line => line.trim() !== "");
  if (lines.length === 0) return { header: [], rows: [] };

  const header = lines[0].split(",").map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length === 1 && cols[0].trim() === "") continue;
    const row = cols.map(c => c.trim());
    // 列数が足りなければヘッダーに合わせて補完
    while (row.length < header.length) row.push("");
    rows.push(row);
  }

  return { header, rows };
}

// 全 ITEM_SOURCES を読み込んで ITEM_INDEX を作る
function loadItemIndex() {
  if (ITEM_INDEX_LOADED) return;
  ITEM_INDEX_LOADED = true;

  ITEM_SOURCES.forEach(src => {
    fetch(src.csvPath)
      .then(res => {
        if (!res.ok) {
          // 存在しない CSV はスキップ
          console.warn("item search: CSV 読み込み失敗:", src.csvPath);
          return null;
        }
        return res.text();
      })
      .then(text => {
        if (!text) return;
        const parsed = parseSimpleCsv(text);
        const header = parsed.header;
        parsed.rows.forEach(row => {
          const textLower = row.join(" ").toLowerCase();
          ITEM_INDEX.push({
            source: src,
            header,
            row,
            textLower
          });
        });
      })
      .catch(err => {
        console.warn("item search: CSV 読み込み中にエラー:", src.csvPath, err);
      });
  });
}

// ---------------------
// メイン初期化
// ---------------------
function initSiteSearch() {
  // input / results は data-role 優先、なければ id で探す
  const input =
    document.querySelector('[data-role="site-search-input"]') ||
    document.getElementById("site-search-input");
  const container =
    document.querySelector('[data-role="site-search-results"]') ||
    document.getElementById("site-search-results");

  if (!input || !container) {
    return;
  }

  function renderResults() {
    const q = (input.value || "").trim().toLowerCase();
    container.innerHTML = "";

    if (q === "") {
      // 未入力のときは何も表示しない
      return;
    }

    // 1) ページ単位のヒット
    const pageHits = SITE_SEARCH_PAGES.filter(p => {
      const hay = (p.title + " " + (p.keywords || "")).toLowerCase();
      return hay.indexOf(q) !== -1;
    }).slice(0, 30);

    // 2) アイテム・場所など、CSV 内のヒット
    const itemHits = ITEM_INDEX.filter(entry => entry.textLower.indexOf(q) !== -1).slice(0, 50);

    if (!pageHits.length && !itemHits.length) {
      const ul = document.createElement("ul");
      ul.className = "site-search-results-list";
      const li = document.createElement("li");
      li.textContent = "該当するページやデータが見つかりませんでした。";
      ul.appendChild(li);
      container.appendChild(ul);
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "site-search-results-list";

    // ページ候補
    pageHits.forEach(p => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = p.url;
      a.textContent = p.title;
      li.appendChild(a);
      ul.appendChild(li);
    });

    // データ内ヒット（アイテム名・場所名など）
    itemHits.forEach(entry => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = entry.source.url;

      // 行の内容をざっくり 1 行にまとめる（場所 / 詳細 / アイテム名 など）
      const rowSummary = entry.row.join(" / ").replace(/\s+/g, " ").trim();
      a.textContent = entry.source.label + "：" + rowSummary;

      li.appendChild(a);
      ul.appendChild(li);
    });

    container.appendChild(ul);
  }

  input.addEventListener("input", renderResults);
}

// DOMContentLoaded で初期化＆アイテムインデックス読み込み
document.addEventListener("DOMContentLoaded", function () {
  initSiteSearch();
  loadItemIndex();
});
