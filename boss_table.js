document.addEventListener("DOMContentLoaded", () => {
  const tbodies = document.querySelectorAll("tbody[data-csv]");
  tbodies.forEach(tbody => {
    const csvFile = tbody.getAttribute("data-csv");
    if (!csvFile) return;

    fetch(csvFile)
      .then(response => {
        if (!response.ok) {
          throw new Error("CSV load failed: " + response.status);
        }
        return response.text();
      })
      .then(text => {
        const rows = parseCSV(text);
        if (rows.length <= 1) return; // header only or empty

        // assume first row is header, skip it
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i];
          if (cols.length === 0 || (cols.length === 1 && cols[0] === "")) continue;

          const tr = document.createElement("tr");
          cols.forEach(col => {
            const td = document.createElement("td");
            td.textContent = col;
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        }
      })
      .catch(err => {
        console.error(err);
      });
  });
});

// very small CSV parser (handles commas and quotes in a basic way)
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
          // Escaped quote
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
