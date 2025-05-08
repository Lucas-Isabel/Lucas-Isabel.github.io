const editor = document.getElementById("editor");
const status = document.getElementById("status");

const pathList = location.pathname.split("/").filter(p => p !== "");
const id = pathList.pop();

const API_URL = `https://5b2b-2804-14d-3291-5666-f08a-5e11-ce03-54a0.ngrok-free.app/api/notepad/${id}`;

async function loadContent() {
  try {
    document.querySelector("textarea").disabled = true;
    editor.value = "loading ..."
    console.log("API_URL:", API_URL);
    const res = await fetch(API_URL);
    console.log("res.status:", res.status);
    const text = await res.text();
    console.log("res.text():", text);

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
