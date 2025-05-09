package main

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type ContentPayload struct {
	Content string `json:"content"`
}

var (
	mu sync.Mutex
)

func writeToFile(content string, filePath string) error {
	dir := filepath.Dir(filePath)

	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.WriteFile(filePath, []byte(content), 0644)
}

func readFromFile(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if errors.Is(err, os.ErrNotExist) {
		if err := writeToFile("", filePath); err != nil {
			return "", err
		}
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func handler(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "https://lucas-isabel.github.io" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
	}

	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set(
		"Access-Control-Allow-Headers",
		"Content-Type, ngrok-skip-browser-warning",
	)
	w.Header().Set("Content-Type", "application/json")

	// Responder ao preflight OPTIONS
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case http.MethodGet:
		handleGet(w, r)
	case http.MethodPost:
		handlePost(w, r)
	default:
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
	}
}

func handleGet(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/notepad/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		http.Error(w, "Nome do bloco de notas ausente", http.StatusBadRequest)
		return
	}
	noteName := parts[0]
	filePath := "data/" + noteName + ".txt"

	mu.Lock()
	defer mu.Unlock()

	content, err := readFromFile(filePath)
	if err != nil {
		http.Error(w, "Erro ao ler arquivo", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(ContentPayload{Content: content})
}

func handlePost(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/notepad/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		http.Error(w, "Nome do bloco de notas ausente", http.StatusBadRequest)
		return
	}
	noteName := parts[0]
	filePath := "data/" + noteName + ".txt"

	mu.Lock()
	defer mu.Unlock()

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Erro ao ler o corpo da requisição", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var payload ContentPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if err := writeToFile(payload.Content, filePath); err != nil {
		http.Error(w, "Erro ao escrever arquivo", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func contentHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// extrair o nome: /api/notepad/{name}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/content/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		baseUrl := "`${encodeURIComponent(name)}`"
		html := `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Redirecionar com Input</title>
</head>
<body>
  <h1>Ir para bloco de notas</h1>
  <input type="text" id="noteName" placeholder="Digite o nome do bloco" />
  <button onclick="goToNote()">Ir</button>

  <script>

    function goToNote() {
      const input = document.getElementById("noteName");
      const name = input.value.trim();

      if (name === "") {
        alert("Digite um nome válido.");
        return;
      }

      const finalURL = ` + baseUrl + `;
      window.location.href = finalURL;
    }
  </script>
</body>
</html>
`
		w.Write([]byte(html))
		return
	} else {
		noteName := parts[0]
		filePath := "data/" + noteName + ".txt"
		html := `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Bloco de Notas</title>
</head>
<body>
  <div id="dynamic-container">Carregando bloco de notas...</div>

  <script>
    async function loadTemplate() {
      let URL = "https://Lucas-Isabel.github.io/notepad/static-notepad"
      const html = await fetch(URL + "/index.html").then(res => res.text());

      const temp = document.createElement("div");
      temp.innerHTML = html;

      const templateBody = temp.querySelector("#container").innerHTML;
      document.getElementById("dynamic-container").innerHTML = templateBody;

      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = URL + "/style.css";
      document.head.appendChild(css);
	  console.log("` + filePath + `")	
      const script = document.createElement("script");
      script.src = URL + "/script.js";
      document.body.appendChild(script);
    }

    loadTemplate();
  </script>
</body>
</html>`
		w.Write([]byte(html))
	}

}

func main() {
	http.HandleFunc("/api/notepad/", handler)
	http.HandleFunc("/api/content/", contentHandler)
	log.Println("Servidor rodando em http://localhost:3009")
	log.Fatal(http.ListenAndServe(":3009", nil))
}
