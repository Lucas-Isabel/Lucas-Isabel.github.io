const editor = document.getElementById("editor");
const status = document.getElementById("status");

// Extrai ID da URL (ex: /notepad/joaokkk -> "joaokkk")
const id = location.pathname.split("/").pop();

// Backend fictício para salvar e carregar
const API_URL = `https://seuservidor.com/api/notepad/${id}`;

async function loadContent() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Erro ao carregar");
    const json = await res.json();
    editor.value = json.content || "";
  } catch (e) {
    console.error(e);
    editor.value = "";
  }
}

let timeout;
editor.addEventListener("input", () => {
  status.textContent = "Salvando...";
  clearTimeout(timeout);
  timeout = setTimeout(saveContent, 800);
});

async function saveContent() {
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editor.value }),
    });
    status.textContent = "Salvo";
  } catch (e) {
    status.textContent = "Erro ao salvar";
  }
}

loadContent();
