const editor = document.getElementById("editor");
const status = document.getElementById("status");

const pathList = location.pathname.split("/");
const id = pathList.pop();

const API_URL = `https://seuservidor.com/api/notepad/${id}`;

async function loadContent() {
  try {
    document.querySelector("textarea").disabled = true;
    editor.value = "loading ..."
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Erro ao carregar");
    document.querySelector("textarea").disabled = false
    const json = await res.json();
    editor.value = json.content || "default value";
  } catch (e) {
    console.error(e);
    editor.value = "default error value ...";
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
