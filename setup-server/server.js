const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = 8080;
const WEBHOOK_DIR = "/app/data/webhooks";
const INDEX_FILE = path.join(WEBHOOK_DIR, "index.jsonl");

fs.mkdirSync(WEBHOOK_DIR, { recursive: true });

function send(res, statusCode, contentType, body) {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendHtml(res, statusCode, body) {
  send(res, statusCode, "text/html; charset=utf-8", body);
}

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; max-width: 960px; }
    a { color: #0645ad; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function handleIndex(_req, res) {
  sendHtml(
    res,
    200,
    page(
      "Henosis",
      `<h1>Henosis</h1>
<p>Server is running.</p>
<ul>
  <li><a href="/healthz">Healthz</a></li>
</ul>`,
    ),
  );
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function handleGithubWebhook(req, res) {
  // TODO: verify x-hub-signature-256 against WEBHOOK_SECRET env var
  try {
    const bodyBuffer = await readRequestBody(req);
    const body = JSON.parse(bodyBuffer.toString("utf8"));
    const event = req.headers["x-github-event"] || "unknown";
    const delivery = req.headers["x-github-delivery"] || "unknown";
    const signature = req.headers["x-hub-signature-256"] || "";
    const timestamp = new Date().toISOString().replaceAll(":", "-");
    const filename = path.join(WEBHOOK_DIR, `${timestamp}-${event}-${delivery}.json`);

    fs.writeFileSync(
      filename,
      `${JSON.stringify(
        {
          headers: req.headers,
          body,
        },
        null,
        2,
      )}\n`,
    );

    const indexLine = {
      timestamp,
      event,
      action: body && typeof body === "object" ? body.action : undefined,
      repo: body && typeof body === "object" ? body.repository?.full_name : undefined,
      delivery,
      file: filename,
    };

    fs.appendFileSync(INDEX_FILE, `${JSON.stringify(indexLine)}\n`);

    send(res, 200, "application/json", JSON.stringify({ ok: true }));

    void signature;
  } catch (error) {
    send(
      res,
      400,
      "application/json",
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/") {
    handleIndex(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/healthz") {
    send(res, 200, "text/plain", "ok");
    return;
  }

  if (req.method === "POST" && url.pathname === "/github") {
    void handleGithubWebhook(req, res);
    return;
  }

  send(res, 404, "text/plain", "not found");
});

server.listen(PORT, () => {
  console.log(`Henosis server listening on ${PORT}`);
});
