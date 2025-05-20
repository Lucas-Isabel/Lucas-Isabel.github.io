class Card {

constructor(id, title, description, priority = 0, hardest = 0) {

  this.id = id;

  this.title = title;

  this.description = description;

  this.priority = priority;

  this.hardest = hardest;

}

}

class Column {

constructor(id, title) {

  this.id = id;

  this.title = title;

  this.cards = [];

}



addCard(card) {

  this.cards.push(card);

}

}

class Board {

constructor(title) {

  this.title = title;

  this.columns = [

    new Column("todo", "A Fazer"),

    new Column("inprogress", "Em Progresso"),

    new Column("done", "Concluído")

  ];

}



getColumn(id) {

  return this.columns.find(col => col.id === id);

}



loadData(data) {

  for (const col of this.columns) {

    const loadedCol = data.columns.find(c => c.id === col.id);

    if (loadedCol) {

      col.cards = loadedCol.cards.map(c => new Card(c.id, c.title, c.description, c.priority, c.hardest));

    }

  }

}



toJSON() {

  return {

    title: this.title,

    columns: this.columns.map(col => ({

      id: col.id,

      title: col.title,

      cards: col.cards

    }))

  };

}

}

const boardName = window.location.pathname.split("/").pop();

const apiUrl = `/api/kanban/${boardName}`;

const board = new Board(boardName);

async function loadBoard() {

try {

  const res = await fetch(apiUrl);

  const data = await res.json();

  board.loadData(data);

  renderBoard();

} catch (err) {

  console.error("Erro ao carregar quadro:", err);

}

}

function renderBoard() {

for (const column of board.columns) {

  const colDiv = document.querySelector(`.column[data-id='${column.id}'] .cards`);

  colDiv.innerHTML = "";

  for (const card of column.cards) {

    GenerateCard(card, colDiv);

  }

}



function GenerateCard(card, colDiv) {

  const cardEl = document.createElement("div");

  cardEl.className = "card";

  cardEl.id = card.id;



  const titleEl = document.createElement("h3");

  titleEl.textContent = card.title || "Sem título";



  const descEl = document.createElement("p");

  descEl.textContent = card.description || "Sem descrição";



  const priorityEl = document.createElement("small");

  priorityEl.textContent = `Prioridade: ${card.priority ?? 0}`;



  const hardestEl = document.createElement("small");

  hardestEl.textContent = `Dificuldade: ${card.hardest ?? 0}`;



  cardEl.appendChild(titleEl);

  cardEl.appendChild(descEl);

  cardEl.appendChild(priorityEl);

  cardEl.appendChild(document.createElement("br")); // quebra de linha

  cardEl.appendChild(hardestEl);



  colDiv.appendChild(cardEl);

}

}

function addCard(columnId) {

const modal = document.createElement("div");

modal.className = "modal-overlay";

modal.innerHTML = `

  <div class="modal">

    <h2>Novo Card</h2>

    <input id="card-title" type="text" placeholder="Título" />

    <textarea id="card-description" placeholder="Descrição" rows="3"></textarea>

    <input id="card-priority" type="number" placeholder="Prioridade" min="0" />

    <input id="card-hardest" type="number" placeholder="Dificuldade" min="0" />

    <div class="modal-actions">

      <button id="confirm-add">Confirmar</button>

      <button id="cancel-add">Cancelar</button>

    </div>

  </div>

`;



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

    display: flex;

    flex-direction: column;

    gap: 10px;

  }

  .modal input, .modal textarea {

    width: 100%;

    padding: 6px;

    box-sizing: border-box;

  }

  .modal-actions {

    display: flex;

    justify-content: flex-end;

    gap: 10px;

  }

`;

document.head.appendChild(style);

document.body.appendChild(modal);



modal.querySelector("#confirm-add").onclick = () => {

  const title = modal.querySelector("#card-title").value.trim();

  const description = modal.querySelector("#card-description").value.trim();

  const priority = parseInt(modal.querySelector("#card-priority").value.trim()) || 0;

  const hardest = parseInt(modal.querySelector("#card-hardest").value.trim()) || 0;



  if (!title) {

    alert("Título é obrigatório.");

    return;

  }



  const newCard = new Card(crypto.randomUUID(), title, description,

  priority,

  hardest);

  board.getColumn(columnId).addCard(newCard);

  renderBoard();

  saveBoard();

  

  modal.remove();

};



modal.querySelector("#cancel-add").onclick = () => modal.remove();

}

function saveBoard() {

fetch(apiUrl, {

  method: "POST",

  headers: { "Content-Type": "application/json" },

  body: JSON.stringify(board.toJSON())

});

}

loadBoard();

