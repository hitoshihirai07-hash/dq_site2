
document.addEventListener('DOMContentLoaded', () => {
  // 初期ステータスと経験値テーブルを両方処理するスクリプト
  const INITIAL_CSV_PATH = './dq_Initial value.csv';
  const EXP_CSV_PATH = './dq1_experience value table.csv';

  function isEmpty(value) {
    if (value === null || value === undefined) return true;
    const s = String(value).trim();
    if (s === '') return true;
    if (s.toLowerCase && s.toLowerCase() === 'nan') return true;
    return false;
  }

  function fillInitialStats() {
    const tbody = document.querySelector('#initial-stats-table tbody');
    if (!tbody) return;

    fetch(INITIAL_CSV_PATH)
      .then(res => {
        if (!res.ok) throw new Error('初期ステータスCSV読み込み失敗');
        return res.text();
      })
      .then(text => {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length <= 1) {
          tbody.innerHTML = "<tr><td colspan='8' class='status-empty'>データがありません。</td></tr>";
          return;
        }

        const header = lines[0].split(',');
        const rows = lines.slice(1).map(line => line.split(','));

        const idxName = header.indexOf('キャラ名');
        const idxLv = header.indexOf('初期レベル');
        const idxStr = header.indexOf('ちから');
        const idxDef = header.indexOf('みのまもり');
        const idxAgi = header.indexOf('すばやさ');
        const idxVit = header.indexOf('たいりょく');
        const idxInt = header.indexOf('かしこさ');
        const idxLuk = header.indexOf('うんのよさ');

        let target = null;
        rows.forEach(cols => {
          if (!cols[idxName]) return;
          if (cols[idxName].trim() === 'DQ1主人公') {
            target = cols;
          }
        });

        tbody.innerHTML = '';

        if (!target) {
          tbody.innerHTML = "<tr><td colspan='8' class='status-empty'>DQ1主人公のデータが見つかりませんでした。</td></tr>";
          return;
        }

        const tr = document.createElement('tr');

        function tdAt(idx) {
          const td = document.createElement('td');
          td.textContent = (idx >= 0 && idx < target.length) ? (target[idx] || '') : '';
          return td;
        }

        tr.appendChild(tdAt(idxName));
        tr.appendChild(tdAt(idxLv));
        tr.appendChild(tdAt(idxStr));
        tr.appendChild(tdAt(idxDef));
        tr.appendChild(tdAt(idxAgi));
        tr.appendChild(tdAt(idxVit));
        tr.appendChild(tdAt(idxInt));
        tr.appendChild(tdAt(idxLuk));

        tbody.appendChild(tr);
      })
      .catch(err => {
        console.error(err);
        tbody.innerHTML = "<tr><td colspan='8' class='status-empty'>データの読み込みに失敗しました。</td></tr>";
      });
  }

  function fillExpTable() {
    const tbody = document.querySelector('#dq1-exp-table tbody');
    if (!tbody) return;

    fetch(EXP_CSV_PATH)
      .then(res => {
        if (!res.ok) throw new Error('経験値CSV読み込み失敗');
        return res.text();
      })
      .then(text => {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length <= 1) {
          tbody.innerHTML = "<tr><td colspan='2' class='status-empty'>データがありません。</td></tr>";
          return;
        }

        const header = lines[0].split(',');
        const idxLv = header.indexOf('レベル');
        const idxExp = header.indexOf('DQ1主人公');

        tbody.innerHTML = '';

        lines.slice(1).forEach(line => {
          if (!line.trim()) return;
          const cols = line.split(',');
          const level = (idxLv >= 0 && idxLv < cols.length) ? cols[idxLv].trim() : '';
          let exp = (idxExp >= 0 && idxExp < cols.length) ? cols[idxExp].trim() : '';

          if (!level) return;
          // exp が空欄の行（41以降など）は非表示
          if (isEmpty(exp)) return;

          const tr = document.createElement('tr');

          const tdLv = document.createElement('td');
          tdLv.textContent = level;
          tr.appendChild(tdLv);

          const tdExp = document.createElement('td');
          tdExp.textContent = exp;
          tr.appendChild(tdExp);

          tbody.appendChild(tr);
        });

        if (!tbody.hasChildNodes()) {
          tbody.innerHTML = "<tr><td colspan='2' class='status-empty'>有効なデータがありません。</td></tr>";
        }
      })
      .catch(err => {
        console.error(err);
        tbody.innerHTML = "<tr><td colspan='2' class='status-empty'>経験値テーブルの読み込みに失敗しました。</td></tr>";
      });
  }

  // 実行
  fillInitialStats();
  fillExpTable();
});
