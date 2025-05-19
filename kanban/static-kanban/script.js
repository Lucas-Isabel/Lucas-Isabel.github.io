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
  // Cria o modal
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal">
      <h2>Adicionar Card</h2>
      <textarea id="card-text" placeholder="Digite o conteúdo..." rows="4"></textarea>
      <div class="modal-actions">
        <button id="confirm-add">Confirmar</button>
        <button id="cancel-add">Cancelar</button>
      </div>
    </div>
  `;

  // Estilo básico inline (você pode migrar para o CSS se quiser)
  const style = document.createElement("style");
  style.textContent = `
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    .modal {
      background: white;
      padding: 20px;
      border-radius: 8px;
      width: 300px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .modal textarea {
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 10px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);

  // Eventos
  modal.querySelector("#confirm-add").onclick = () => {
    const text = modal.querySelector("#card-text").value.trim();
    if (text) {
      const column = boardData.columns.find(c => c.id === columnId);
      column.cards.push({ text });
      renderBoard();
      saveBoard();
    }
    modal.remove();
  };

  modal.querySelector("#cancel-add").onclick = () => modal.remove();
}

function saveBoard() {
  fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(boardData)
  });
}

loadBoard();
