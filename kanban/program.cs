using System;

using System.IO;

using System.Net;

using System.Text;

using System.Threading;

using System.Text.Json;

using System.Threading.Tasks;

class Program

{

private static readonly object _lock = new object();

private const string AllowedOrigin = "https://lucas-isabel.github.io";



static async Task Main()

{

    var listener = new HttpListener();

    listener.Prefixes.Add("http://localhost:3009/api/kanban/");

    listener.Prefixes.Add("http://localhost:3009/api/content/");

    listener.Start();

    Console.WriteLine("Servidor rodando em http://localhost:3009");



    while (true)

    {

        var context = await listener.GetContextAsync();

        _ = Task.Run(() => HandleRequest(context));

    }

}



private static void HandleRequest(HttpListenerContext context)

{

    var req = context.Request;

    var res = context.Response;



    // CORS

    var origin = req.Headers["Origin"];

    if (origin == AllowedOrigin)

    {

        res.Headers.Add("Access-Control-Allow-Origin", origin);

    }

    res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    res.Headers.Add("Access-Control-Allow-Headers", "Content-Type, ngrok-skip-browser-warning");



    if (req.HttpMethod == "OPTIONS")

    {

        res.StatusCode = (int)HttpStatusCode.OK;

        res.Close();

        return;

    }



    try

    {

        if (req.Url.AbsolutePath.StartsWith("/api/kanban/"))

        {

            HandleKanbanRequest(context);

        }

        else if (req.Url.AbsolutePath.StartsWith("/api/content/"))

        {

            HandleContentRequest(context);

        }

        else

        {

            res.StatusCode = (int)HttpStatusCode.NotFound;

            WriteStringResponse(res, "Rota não encontrada");

        }

    }

    catch (Exception ex)

    {

        res.StatusCode = (int)HttpStatusCode.InternalServerError;

        WriteStringResponse(res, "Erro interno do servidor: " + ex.Message);

    }

}



private static void HandleKanbanRequest(HttpListenerContext context)

{

    var req = context.Request;

    var res = context.Response;



    var parts = req.Url.AbsolutePath.Substring("/api/kanban/".Length).Split('/', StringSplitOptions.RemoveEmptyEntries);

    if (parts.Length == 0)

    {

        res.StatusCode = (int)HttpStatusCode.BadRequest;

        WriteStringResponse(res, "Nome do quadro ausente");

        return;

    }



    string boardName = parts[0];

    string filePath = Path.Combine("data", boardName + ".json");



    lock (_lock)

    {

        if (req.HttpMethod == "GET")

        {

            res.ContentType = "application/json";



            var content = ReadFromFile(filePath);

            WriteStringResponse(res, content);

        }

        else if (req.HttpMethod == "POST")

        {

            using var reader = new StreamReader(req.InputStream, req.ContentEncoding);

            var body = reader.ReadToEnd();



            // Validar JSON

            try

            {

                JsonDocument.Parse(body);

            }

            catch

            {

                res.StatusCode = (int)HttpStatusCode.BadRequest;

                WriteStringResponse(res, "JSON inválido");

                return;

            }



            WriteToFile(filePath, body);

            res.StatusCode = (int)HttpStatusCode.OK;

            res.Close();

        }

        else

        {

            res.StatusCode = (int)HttpStatusCode.MethodNotAllowed;

            WriteStringResponse(res, "Método não permitido");

        }

    }

}



private static void HandleContentRequest(HttpListenerContext context)

{

    var req = context.Request;

    var res = context.Response;

    res.ContentType = "text/html; charset=utf-8";

    res.StatusCode = (int)HttpStatusCode.OK;



    if (req.HttpMethod == "OPTIONS")

    {

        res.Close();

        return;

    }



    var parts = req.Url.AbsolutePath.Substring("/api/content/".Length).Split('/', StringSplitOptions.RemoveEmptyEntries);



    if (parts.Length == 0)

    {

        // Página para digitar o nome do quadro

        var html = @"<!DOCTYPE html>

<html lang='pt-BR'><head>  <meta charset='UTF-8'>  <title>Redirecionar para Quadro</title></head><body>  <h1>Ir para quadro Kanban</h1>  <input type='text' id='boardName' placeholder='Digite o nome do quadro' /><button onclick='goToBoard()'>Ir</button>

  <script>
  
    function goToBoard() {
  
      const input = document.getElementById('boardName');
  
      const name = input.value.trim();
  
      if (name === '') {
  
        alert('Digite um nome válido.');
  
        return;
  
      }
  
      window.location.href = '/api/content/' + encodeURIComponent(name);
  
    }
  
  </script></body></html>";WriteStringResponse(res, html);

    }

    else

    {

        // Página do quadro kanban

        string boardName = parts[0];

        string html = $@"<!DOCTYPE html>

<html lang='pt-BR'><head>  <meta charset='UTF-8' />  <title>Kanban</title></head><body>  <div id='dynamic-container'>Carregando quadro kanban...</div>  <script>
  
    async function loadTemplate() {{
  
      let URL = 'https://Lucas-Isabel.github.io/kanban/static-kanban';
  
      const html = await fetch(URL + '/index.html').then(res => res.text());
  

  
      const temp = document.createElement('div');
  
      temp.innerHTML = html;
  

  
      const templateBody = temp.querySelector('#container').innerHTML;
  
      document.getElementById('dynamic-container').innerHTML = templateBody;
  

  
      const css = document.createElement('link');
  
      css.rel = 'stylesheet';
  
      css.href = URL + '/style.css';
  
      document.head.appendChild(css);
  

  
      const script = document.createElement('script');
  
      script.src = URL + '/script.js';
  
      document.body.appendChild(script);
  

  
      fetchBoard();
  
    }}
  

  
    loadTemplate();
  
  </script></body></html>";WriteStringResponse(res, html);

    }

}



private static string ReadFromFile(string filePath)

{

    if (!File.Exists(filePath))

    {

        Directory.CreateDirectory(Path.GetDirectoryName(filePath));

        var defaultContent = "{\"columns\":[]}";

        File.WriteAllText(filePath, defaultContent, Encoding.UTF8);

        return defaultContent;

    }

    return File.ReadAllText(filePath, Encoding.UTF8);

}



private static void WriteToFile(string filePath, string content)

{

    Directory.CreateDirectory(Path.GetDirectoryName(filePath));

    File.WriteAllText(filePath, content, Encoding.UTF8);

}



private static void WriteStringResponse(HttpListenerResponse response, string content)

{

    byte[] buffer = Encoding.UTF8.GetBytes(content);

    response.ContentLength64 = buffer.Length;

    using var output = response.OutputStream;

    output.Write(buffer, 0, buffer.Length);

}

}

