#!/usr/bin/env node
/**
 * Preview server with annotation POST endpoint.
 *
 * Serves static files from the working directory AND accepts POST to /_annotations
 * to write annotation JSON to .annotations.json in the served directory.
 *
 * Usage: node preview-server.js [port] [directory]
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const port = parseInt(process.argv[2], 10) || 8765;
const directory = process.argv[3] || ".";
const dirAbs = path.resolve(directory);
const templatesDir = path.resolve(path.join(__dirname, "../..", "templates"));

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const MAX_BODY = 10 * 1024 * 1024; // 10MB

function sendJSON(res, status, data, extraHeaders) {
  const body = JSON.stringify(data);
  res.writeHead(
    status,
    Object.assign(
      {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
      extraHeaders || {},
    ),
  );
  res.end(body);
}

function sendError(res, status, message) {
  res.writeHead(status, { "Content-Type": "text/plain" });
  res.end(message);
}

function serveFile(res, filePath, baseDir) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    return sendError(res, 403, "Forbidden");
  }
  fs.stat(resolved, (err, stats) => {
    if (err || !stats.isFile()) {
      return sendError(res, 404, "Not found");
    }
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    fs.readFile(resolved, (readErr, data) => {
      if (readErr) return sendError(res, 500, "Read error");
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": data.length,
        "Cache-Control": "no-cache",
      });
      res.end(data);
    });
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  // /_version — file mtime for live-reload polling
  if (req.method === "GET" && pathname === "/_version") {
    const file = parsed.query.file;
    if (!file) return sendError(res, 400, "Missing file param");
    const fullPath = path.resolve(path.join(dirAbs, file.replace(/^\//, "")));
    if (!fullPath.startsWith(dirAbs + path.sep) && fullPath !== dirAbs) {
      return sendError(res, 403, "Forbidden");
    }
    fs.stat(fullPath, (err, stats) => {
      if (err) return sendError(res, 404, "File not found");
      sendJSON(res, 200, { mtime: Math.floor(stats.mtimeMs / 1000) });
    });
    return;
  }

  // POST /_annotations
  if (req.method === "POST" && pathname === "/_annotations") {
    const length = parseInt(req.headers["content-length"] || "0", 10);
    if (length > MAX_BODY) return sendError(res, 413, "Request body too large");
    const chunks = [];
    req.on("data", (chunk) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > MAX_BODY) {
        sendError(res, 413, "Request body too large");
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString());
        if (!data.annotations || !Array.isArray(data.annotations)) {
          return sendError(res, 400, "Missing or invalid annotations array");
        }
        const outPath = path.join(dirAbs, ".annotations.json");
        fs.writeFile(outPath, JSON.stringify(data, null, 2), (err) => {
          if (err) return sendError(res, 500, err.message);
          sendJSON(res, 200, {
            ok: true,
            file: outPath,
            count: data.annotations.length,
          });
        });
      } catch (e) {
        sendError(res, 400, "Invalid JSON");
      }
    });
    return;
  }

  // GET /_plugin/* — serve from templates/ directory
  if (req.method === "GET" && pathname.startsWith("/_plugin/")) {
    const relPath = pathname.slice("/_plugin/".length);
    const filePath = path.join(templatesDir, relPath);
    return serveFile(res, filePath, templatesDir);
  }

  // GET — static file serving from dirAbs
  if (req.method === "GET") {
    let filePath = path.join(dirAbs, pathname);
    // Serve index.html for directory requests
    if (pathname.endsWith("/")) filePath = path.join(filePath, "index.html");
    return serveFile(res, filePath, dirAbs);
  }

  sendError(res, 404, "Not Found");
});

server.listen(port, () => {
  process.stderr.write(
    `Preview server listening on http://localhost:${port} serving ${dirAbs}\n`,
  );
});
