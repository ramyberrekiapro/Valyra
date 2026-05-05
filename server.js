import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const model = "google/gemini-3.1-flash-image-preview";
const maxBodyBytes = 20 * 1024 * 1024;

await loadEnvFile();

const port = Number(process.env.PORT || 3000);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"]
]);

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        model,
        configured: Boolean(process.env.OPENROUTER_API_KEY)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/generate") {
      await handleGenerate(request, response);
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      sendJson(response, 404, { error: "API route not found" });
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    await serveStatic(url.pathname, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, {
      error: "Unexpected server error",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(port, () => {
  console.log(`Valyra running at http://localhost:${port}`);
});

async function handleGenerate(request, response) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    sendJson(response, 500, {
      error: "Missing OPENROUTER_API_KEY",
      detail: "Create a .env file from .env.example and add your OpenRouter key."
    });
    return;
  }

  const body = await readJsonBody(request);
  const prompt = String(body.prompt || "").trim();
  const imageDataUrl = String(body.imageDataUrl || "").trim();
  const aspectRatio = String(body.aspectRatio || "4:5");
  const imageSize = String(process.env.OPENROUTER_IMAGE_SIZE || "").trim();

  if (!prompt) {
    sendJson(response, 400, { error: "Missing prompt" });
    return;
  }

  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(imageDataUrl)) {
    sendJson(response, 400, { error: "Upload a PNG, JPG, or WebP selfie first." });
    return;
  }

  const payload = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageDataUrl } }
        ]
      }
    ],
    modalities: ["image", "text"],
    image_config: {
      aspect_ratio: aspectRatio,
      ...(imageSize ? { image_size: imageSize } : {})
    }
  };

  const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || `http://localhost:${port}`,
      "X-Title": "Valyra"
    },
    body: JSON.stringify(payload)
  });

  const resultText = await openRouterResponse.text();
  let result;

  try {
    result = JSON.parse(resultText);
  } catch {
    result = { raw: resultText };
  }

  if (!openRouterResponse.ok) {
    const detail = getOpenRouterErrorDetail(result, resultText);
    console.error("OpenRouter generation failed", {
      status: openRouterResponse.status,
      detail,
      metadata: result?.error?.metadata
    });
    sendJson(response, openRouterResponse.status, {
      error: "OpenRouter generation failed",
      detail
    });
    return;
  }

  const images = extractGeneratedImages(result);
  const imageUrl = images[0] || "";

  if (!imageUrl) {
    sendJson(response, 502, {
      error: "No image returned from OpenRouter",
      detail: result?.choices?.[0]?.message?.content || "The model response did not include an image."
    });
    return;
  }

  sendJson(response, 200, {
    imageUrl,
    images,
    model,
    content: result?.choices?.[0]?.message?.content || ""
  });
}

function extractGeneratedImages(result) {
  const message = result?.choices?.[0]?.message;
  const directImages = Array.isArray(message?.images)
    ? message.images
        .map((image) => image?.image_url?.url || image?.imageUrl?.url || "")
        .filter(Boolean)
    : [];

  if (directImages.length) return directImages;

  if (Array.isArray(message?.content)) {
    return message.content
      .filter((part) => part?.type === "image_url" || part?.image_url || part?.imageUrl)
      .map((part) => part?.image_url?.url || part?.imageUrl?.url || "")
      .filter(Boolean);
  }

  return [];
}

function getOpenRouterErrorDetail(result, fallback) {
  const raw = result?.error?.metadata?.raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      const providerMessage = parsed?.error?.message || parsed?.message;

      if (providerMessage) {
        return `${result?.error?.message || "Provider returned error"}: ${providerMessage}`;
      }
    } catch {
      if (raw.trim()) return raw.trim();
    }
  }

  return result?.error?.message || result?.message || fallback || "OpenRouter generation failed";
}

async function serveStatic(pathname, response) {
  const safePath = normalizePath(pathname === "/" ? "/index.html" : pathname);

  if (!safePath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  const filePath = path.join(publicDir, safePath);

  try {
    const stat = await fs.stat(filePath);
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(publicDir) || !stat.isFile()) {
      sendText(response, 404, "Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes.get(ext) || "application/octet-stream";
    const content = await fs.readFile(filePath);

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    response.end(content);
  } catch {
    const fallbackPath = path.join(publicDir, "index.html");
    const content = await fs.readFile(fallbackPath);

    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    });
    response.end(content);
  }
}

function normalizePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");

  if (normalized.includes("..")) return "";

  return normalized.replace(/^[/\\]/, "");
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function sendText(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];

    request.on("data", (chunk) => {
      bytes += chunk.byteLength;

      if (bytes > maxBodyBytes) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

async function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");

  try {
    const content = await fs.readFile(envPath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional in production environments where env vars are injected.
  }
}
