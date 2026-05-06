const MODEL = "google/gemini-3.1-flash-image-preview";
const MAX_BODY_BYTES = 8 * 1024 * 1024;

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return sendJson(res, 500, {
        error: "Missing OPENROUTER_API_KEY",
        detail: "Set OPENROUTER_API_KEY in your Vercel project environment variables."
      });
    }

    const body = await readJsonBody(req);
    const prompt = String(body.prompt || "").trim();
    const imageDataUrl = String(body.imageDataUrl || "").trim();
    const aspectRatio = String(body.aspectRatio || "4:5");
    const imageSize = String(process.env.OPENROUTER_IMAGE_SIZE || "").trim();

    if (!prompt) return sendJson(res, 400, { error: "Missing prompt" });
    if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(imageDataUrl)) {
      return sendJson(res, 400, { error: "Upload a PNG, JPG, or WebP selfie first." });
    }

    const payload = {
      model: MODEL,
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
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://valyra.vercel.app",
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
      return sendJson(res, openRouterResponse.status, { error: "OpenRouter generation failed", detail });
    }

    const images = extractGeneratedImages(result);
    const imageUrl = images[0] || "";

    if (!imageUrl) {
      return sendJson(res, 502, {
        error: "No image returned from OpenRouter",
        detail: result?.choices?.[0]?.message?.content || "The model response did not include an image."
      });
    }

    return sendJson(res, 200, {
      imageUrl,
      images,
      model: MODEL,
      content: result?.choices?.[0]?.message?.content || ""
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      error: "Unexpected server error",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new Error("Invalid JSON body.");
    }
  }

  const chunks = [];
  let bytes = 0;

  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => {
      bytes += chunk.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", resolve);
    req.on("error", reject);
  });

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON body.");
  }
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

