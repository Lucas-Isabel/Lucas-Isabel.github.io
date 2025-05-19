const boardName = decodeURIComponent(window.location.pathname.split('/').pop());

const apiBase = `/api/kanban/${boardName}`;

async function fetchBoard() {
  try {
    const res = await fetch(apiBase);
    if (!res.ok) throw new Error('Falha ao carregar quadro');
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return { columns: [] };
  }
}

function createCardElement(card, columnId, index) {
  const cardEl = document.createElement('div');
  cardEl.className = 'card';
  cardEl.contentEditable = 'true';
  cardEl.style.border = '1px solid #ccc';
  cardEl.style.padding = '8px';
  cardEl.style.marginBottom = '8px';
  cardEl.style.borderRadius = '4px';
  cardEl.style.backgroundColor = '#fff';
  cardEl.dataset.index = index;
  cardEl.dataset.column = columnId;
  cardEl.textContent = card.text || '';
  cardEl.addEventListener('blur', () => {
    // opcional: salvar automaticamente ao perder o foco
  });
  return cardEl;
}

function renderBoard(data) {
  const columns = {
    todo: data.columns.find(c => c.id === 'todo'),
    inprogress: data.columns.find(c => c.id === 'inprogress'),
    done: data.columns.find(c => c.id === 'done'),
  };

  for (const colId of ['todo', 'inprogress', 'done']) {
    const colDiv = document.querySelector(`.column[data-id="${colId}"] .cards`);
    colDiv.innerHTML = '';
    const colData = columns[colId] || { cards: [] };
    colData.cards.forEach((card, i) => {
      const cardEl = createCardElement(card, colId, i);
      colDiv.appendChild(cardEl);
    });
  }
}

function gatherBoardData() {
  const columns = ['todo', 'inprogress', 'done'];
  const boardData = { columns: [] };

  for (const colId of columns) {
    const colDiv = document.querySelector(`.column[data-id="${colId}"] .cards`);
    const cards = Array.from(colDiv.children).map(cardEl => ({
      text: cardEl.textContent.trim()
    })).filter(card => card.text !== '');
    boardData.columns.push({ id: colId, cards });
  }

  return boardData;
}

async function saveBoard() {
  const data = gatherBoardData();
  try {
    const res = await fetch(apiBase, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao salvar quadro');
    alert('Quadro salvo com sucesso!');
  } catch (e) {
    alert('Erro ao salvar quadro: ' + e.message);
  }
}

function addCard(columnId) {
  const colDiv = document.querySelector(`.column[data-id="${columnId}"] .cards`);
  const cardEl = createCardElement({ text: '' }, columnId, colDiv.children.length);
  colDiv.appendChild(cardEl);
  cardEl.focus();
}

window.onload = async () => {
  const data = await fetchBoard();

  // Se não tem as 3 colunas, cria estrutura padrão
  if (!data.columns || !Array.isArray(data.columns) || data.columns.length === 0) {
    data.columns = [
      { id: 'todo', cards: [] },
      { id: 'inprogress', cards: [] },
      { id: 'done', cards: [] },
    ];
  }

  renderBoard(data);
};
