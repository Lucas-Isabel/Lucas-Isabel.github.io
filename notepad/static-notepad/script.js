const editor = document.getElementById("editor");
const update_status = document.getElementById("status");

const pathList = location.pathname.split("/").filter(p => p !== "");
const id = pathList.pop();

const API_URL = `https://5b2b-2804-14d-3291-5666-f08a-5e11-ce03-54a0.ngrok-free.app/api/notepad/${id}`;

async function loadContent() {
  try {
    const headers = {
      "Content-Type": "application/json",
      // Cabeçalho obrigatório para ignorar o aviso do ngrok gratuito
      "ngrok-skip-browser-warning": "69420",
    };

    document.querySelector("textarea").disabled = true;
    editor.value = "loading ...";

    const res = await fetch(API_URL, { method: "GET", headers });

    console.log("API_URL:", API_URL);
    console.log("res.status:", res.status);

    if (!res.ok) throw new Error(`Erro ${res.status}`);

    const json = await res.json();
    document.querySelector("textarea").disabled = false;
    editor.value = json.content || "default value";
  } catch (e) {
    console.error(e);
    editor.value = "default error value ...";
  }
}

async function saveContent() {
  try {
    const headers = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "69420",
    };
    await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ content: editor.value }),
    });
    update_status.textContent = "Salvo";
  } catch (e) {
    console.error(e);
    update_status.textContent = "Erro ao salvar";
  }
}


let timeout;
editor.addEventListener("input", () => {
  update_status.textContent = "Salvando...";
  clearTimeout(timeout);
  timeout = setTimeout(saveContent, 800);
});

loadContent();
