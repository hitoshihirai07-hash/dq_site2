
document.addEventListener('DOMContentLoaded', () => {
  // DQ1主人公ページの経験値テーブルを探す
  const table = document.querySelector('#dq1-exp-table');
  if (!table) return;

  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  // ★ CSV のパス：実際に置いた場所に合わせて変更してください
  // 例）csv フォルダ配下に置くなら: "./csv/dq1_experience value table.csv"
  const csvPath = './csv/dq1_experience value table.csv';

  fetch(csvPath)
    .then((res) => {
      if (!res.ok) {
        throw new Error('HTTP error ' + res.status);
      }
      return res.text();
    })
    .then((text) => {
      const lines = text.trim().split(/\\r?\\n/);

      // ヘッダーだけだった場合
      if (lines.length <= 1) {
        tbody.innerHTML = '<tr><td colspan="2">データがありません。</td></tr>';
        return;
      }

      // 「読み込み中…」を消す
      tbody.innerHTML = '';

      // 1行目はヘッダー（レベル,DQ1主人公）なので飛ばす
      lines.slice(1).forEach((line) => {
        if (!line.trim()) return;

        // 最初のカンマだけで区切る
        const commaIndex = line.indexOf(',');
        if (commaIndex === -1) return;

        const level = line.slice(0, commaIndex).trim();
        if (!level) return; // レベルが空ならスキップ

        let exp = line.slice(commaIndex + 1).trim();

        // "12345" みたいにダブルクオートで囲まれていたら外す
        if (exp.startsWith('"') && exp.endsWith('"')) {
          exp = exp.slice(1, -1);
        }

        // ★ exp が空でもそのままセルを作る → 画面上は空白
        const tr = document.createElement('tr');
        const tdLv = document.createElement('td');
        const tdExp = document.createElement('td');

        tdLv.textContent = level;
        tdExp.textContent = exp; // "" の場合は空白セル

        tr.appendChild(tdLv);
        tr.appendChild(tdExp);
        tbody.appendChild(tr);
      });

      // 何も行が追加されなかった場合
      if (!tbody.children.length) {
        tbody.innerHTML =
          '<tr><td colspan="2">有効なデータがありません。</td></tr>';
      }
    })
    .catch((err) => {
      console.error(err);
      tbody.innerHTML =
        '<tr><td colspan="2">経験値テーブルの読み込みに失敗しました。</td></tr>';
    });
});
