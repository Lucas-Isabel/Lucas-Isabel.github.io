// Extrai o nome do quadro da URL
let boardName = window.location.pathname.split("/").pop();

// Constrói o caminho relativo
let apiUrl = `/api/kanban/${boardName}`;

let boardData = {
  columns: [
    { id: "todo", cards: [] },
    { id: "inprogress", cards: [] },
    { id: "done", cards: [] }
  ]
};

async function loadBoard() {
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    for (const col of boardData.columns) {
      const loadedCol = data.columns.find(c => c.id === col.id);
      if (loadedCol) {
        col.cards = loadedCol.cards;
      }
    }

    renderBoard();
  } catch (err) {
    console.error("Erro ao carregar quadro:", err);
  }
}

function renderBoard() {
  for (const column of boardData.columns) {
    const colDiv = document.querySelector(`.column[data-id='${column.id}'] .cards`);
    colDiv.innerHTML = "";
    for (const card of column.cards) {
      const cardEl = document.createElement("div");
      cardEl.className = "card";
      cardEl.textContent = card.text;
      colDiv.appendChild(cardEl);
    }
  }
}

function addCard(columnId) {
  const text = prompt("Digite o conteúdo do card:");
  if (!text) return;

  const column = boardData.columns.find(c => c.id === columnId);
  column.cards.push({ text });
  renderBoard();
  saveBoard();
}

function saveBoard() {
  fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(boardData)
  });
}

loadBoard();
