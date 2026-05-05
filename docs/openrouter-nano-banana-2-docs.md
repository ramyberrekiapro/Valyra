# Using `google/gemini-3.1-flash-image-preview` (Nano Banana 2) on OpenRouter

## TL;DR
- **What it is:** Google's "Nano Banana 2" — a multimodal image-generation/editing model based on Gemini 3 Flash, released Feb 26, 2026. On OpenRouter it is exposed via `/api/v1/chat/completions` (OpenAI-compatible), with a 65,536-token context window, accepts text + up to ~14 reference images, and returns both text and a base64-encoded PNG in the assistant message's `images` array. OpenRouter lists pricing at **$0.50 per 1M input tokens** and **$3 per 1M output tokens** on the model page; the per-image cost is effectively ~$0.045 (0.5K), ~$0.067 (1K, default), ~$0.101 (2K), and ~$0.151 (4K) based on tokens consumed by the rendered image.
- **How to call it:** POST JSON to `https://openrouter.ai/api/v1/chat/completions` with `Authorization: Bearer <OPENROUTER_API_KEY>`, `model: "google/gemini-3.1-flash-image-preview"`, `modalities: ["image", "text"]`, and a standard OpenAI-style `messages` array. Attach reference images using content parts of `type: "image_url"` whose `url` is either a public HTTPS URL or a `data:image/...;base64,...` data URL. Optionally pass an `image_config` object with `aspect_ratio` and/or `image_size`.
- **Quirks specific to this model:** It is the only OpenRouter model that supports the extended aspect ratios `1:4`, `4:1`, `1:8`, `8:1` and the `0.5K` image size; it always returns text *and* image (it cannot do image-only output); it accepts up to ~14 reference images per request; outputs are PNG with an invisible SynthID watermark; it is a **preview** model, so rate limits and pricing can change without deprecation notice.

---

## Key Findings

| Property | Value |
|---|---|
| OpenRouter slug | `google/gemini-3.1-flash-image-preview` |
| Aliases | "Nano Banana 2", `gemini-3.1-flash-image-preview` |
| Released | Feb 26, 2026 (preview) |
| Endpoint | `POST https://openrouter.ai/api/v1/chat/completions` |
| Context window | 65,536 tokens |
| Max output | 65,536 tokens (image output: up to 2,520 tokens per image at 4K) |
| Input modalities | text, image |
| Output modalities | text **and** image (both are always returned) |
| Required parameter | `modalities: ["image", "text"]` |
| Image input formats | PNG, JPEG, WEBP, HEIC, HEIF (Gemini API standard) |
| Image input attach methods | Public URL or base64 data URL inside `image_url` content part |
| Inline payload cap (Gemini API) | 20 MB total request size; otherwise upload separately |
| Reference images | Up to ~14 per request (per Google docs) |
| Output format | Base64-encoded PNG data URL, in `message.images[i].image_url.url` |
| Supported `image_config.aspect_ratio` | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, plus model-exclusive `1:4`, `4:1`, `1:8`, `8:1` |
| Supported `image_config.image_size` | `0.5K` (model-exclusive), `1K` (default), `2K`, `4K` |
| OpenRouter list price | $0.50 / 1M input tokens, $3 / 1M output tokens (per the model page) |
| Effective per-image cost | ~$0.045 (0.5K), ~$0.067 (1K), ~$0.101 (2K), ~$0.151 (4K) per Google's $60/1M image-output-token rate |
| Provider | Google AI Studio (with fallbacks; 2 providers visible on OpenRouter) |
| Watermark | SynthID (invisible) on every generated image |

---

## Details

### 1. What this model is

`google/gemini-3.1-flash-image-preview` is Google's flash-tier native image generation and editing model in the Gemini 3 family. It is built on the Gemini 3 Flash base and is the high-throughput counterpart to `google/gemini-3-pro-image-preview` (Nano Banana Pro). According to Google's model card and OpenRouter's model page, it offers:

- **Text-to-image generation** with control over aspect ratio and resolution.
- **Image editing / image-to-image** — including localized edits, multi-turn conversational editing, and editing with up to 14 reference images while preserving identity, character, and object consistency.
- **Multimodal understanding inputs** — text, images (and Gemini 3 Flash supports audio/video/PDFs natively, but image generation is the primary use of this preview model).
- **Search/web grounding** for accurate rendering of real-world subjects.
- **Configurable thinking levels** (`minimal`, `high`) on Vertex/AI Studio; on OpenRouter these are exposed via the `reasoning` parameter when supported.
- **Always-on dual modality output**: it returns both text and at least one image. You cannot get image-only output from this model — you must include `"text"` in the `modalities` array.

Outputs are PNG with an embedded SynthID watermark. The model is in **Preview**, which Google's pricing page explicitly notes "may change before becoming stable and have more restrictive rate limits."

### 2. Calling it via the OpenRouter API

OpenRouter exposes an OpenAI-compatible Chat Completions API. The base URL, authentication, and headers are exactly the same as for any other OpenRouter model.

- **Base URL:** `https://openrouter.ai/api/v1`
- **Endpoint for this model:** `POST /chat/completions`
- **Authentication header:** `Authorization: Bearer <OPENROUTER_API_KEY>` (keys begin with `sk-or-...`)
- **Required header:** `Content-Type: application/json`
- **Optional attribution headers (used for OpenRouter app leaderboards):**
  - `HTTP-Referer: <YOUR_SITE_URL>`
  - `X-Title: <YOUR_APP_NAME>` (also accepted as `X-OpenRouter-Title`)

Minimum request body for image generation:

```json
{
  "model": "google/gemini-3.1-flash-image-preview",
  "modalities": ["image", "text"],
  "messages": [
    { "role": "user", "content": "A cinematic close-up of a ripe banana on a black marble counter, dramatic studio lighting" }
  ]
}
```

You may also use the **OpenAI SDK** directly by setting `base_url` to `https://openrouter.ai/api/v1` and passing your OpenRouter key.

### 3. Attaching images to requests (image-to-image / editing)

Multimodal input uses the OpenAI vision content-part schema. The `image_url.url` field accepts **either** a publicly reachable HTTPS URL **or** a `data:image/<mime>;base64,<...>` data URL.

```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "Edit this photo: replace the sky with a dramatic orange sunset; preserve subject, lighting on the foreground, and overall composition." },
    { "type": "image_url", "image_url": { "url": "https://example.com/photo.jpg" } },
    { "type": "image_url", "image_url": { "url": "data:image/png;base64,iVBORw0KGgo..." } }
  ]
}
```

Important rules and limits:

- **Format the data URL precisely:** `data:image/png;base64,<BASE64>` (or `image/jpeg`, `image/webp`, `image/heic`, `image/heif`). The MIME type must match the bytes.
- **OpenRouter recommends placing the text part first**, then images, due to how content parts are parsed. If images must come first, put the text in a `system` message.
- **Multiple images:** send each as a separate `image_url` content part. Gemini 3.1 Flash Image supports up to **~14 reference images** for compositional editing.
- **Inline payload cap:** The underlying Gemini API enforces a **20 MB total request size** (including base64-encoded images and prompt). If you need to exceed this, host the images and pass URLs instead.
- **Supported MIME types (Gemini):** `image/png`, `image/jpeg`, `image/webp`, `image/heic`, `image/heif`. Other formats (SVG, GIF, BMP, TIFF) must be converted first.
- **Per-image processing cost (input):** Each input image is billed by Google as ~1,120 input tokens per reference image for this model.
- **For pure text-to-image,** simply omit the `image_url` parts.

### 4. Multimodal message format (text + images)

The OpenAI-compatible content array is the canonical shape. A user message can be either a plain string or an array of typed content parts:

```json
"messages": [
  {
    "role": "system",
    "content": "You are an expert image editor. Make precise, minimal edits and preserve subject identity."
  },
  {
    "role": "user",
    "content": [
      { "type": "text",
        "text": "Combine these two reference photos into a single product hero shot at sunrise." },
      { "type": "image_url",
        "image_url": { "url": "https://example.com/product.png" } },
      { "type": "image_url",
        "image_url": { "url": "data:image/jpeg;base64,/9j/4AAQ..." } }
    ]
  }
]
```

For multi-turn conversational editing, simply append the previous assistant message (which contains both `content` text and an `images` array) and the new user instruction. To feed a previously generated image back into a follow-up edit, take the base64 data URL from `message.images[0].image_url.url` and resubmit it as an `image_url` content part on the next user turn.

### 5. Model-specific parameters and quirks

- **`modalities` is required.** Use `["image", "text"]`. The model will refuse or degrade to text-only otherwise.
- **`image_config` (top-level field)** is the OpenRouter-specific knob for image generation:
  - `image_config.aspect_ratio`: one of `"1:1"`, `"2:3"`, `"3:2"`, `"3:4"`, `"4:3"`, `"4:5"`, `"5:4"`, `"9:16"`, `"16:9"`, `"21:9"`, and uniquely `"1:4"`, `"4:1"`, `"1:8"`, `"8:1"` for this model.
  - `image_config.image_size`: one of `"0.5K"` (this model only), `"1K"` (default), `"2K"`, `"4K"`. **Case-sensitive — uppercase `K` is required.** Lowercase `1k` is rejected by the upstream Gemini API.
- **`image_config.font_inputs`** and **`image_config.super_resolution_references`** are **not supported** on this model — they are Sourceful-only.
- **Output is always text + image.** Do not pass `modalities: ["image"]`; that is reserved for image-only models like Flux/Sourceful.
- **Reasoning/thinking levels.** Gemini 3.1 Flash Image supports thinking modes (`minimal`/`high`). On OpenRouter these are surfaced through the `reasoning` parameter when applicable, e.g. `{"reasoning": {"enabled": true}}`. For lowest latency on image generation, leave it disabled (default).
- **Streaming** works (`stream: true`); generated image data arrives in `delta.images[]` chunks.
- **No free tier:** Google explicitly states there is no free quota for this model. You must have credits on your OpenRouter account.
- **Watermarking:** Every output has an invisible SynthID watermark — you cannot disable it.

### 6. Code examples

#### 6a. Node.js / JavaScript — text-only request (generate image from prompt)

```javascript
// npm install node-fetch  (or use built-in fetch on Node 18+)
import fs from "node:fs";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://your-app.example.com", // optional
    "X-Title": "Your App Name"                       // optional
  },
  body: JSON.stringify({
    model: "google/gemini-3.1-flash-image-preview",
    modalities: ["image", "text"],
    messages: [
      { role: "user",
        content: "A photorealistic still life: a single ripe banana on matte black slate, soft top-down studio light, 50mm lens." }
    ],
    image_config: {
      aspect_ratio: "16:9",
      image_size: "2K"
    }
  })
});

const data = await res.json();
const message = data.choices[0].message;

console.log("Text:", message.content);

// Save each returned image
(message.images ?? []).forEach((img, i) => {
  const dataUrl = img.image_url.url;             // "data:image/png;base64,...."
  const base64  = dataUrl.split(",")[1];
  fs.writeFileSync(`out_${i}.png`, Buffer.from(base64, "base64"));
});
```

#### 6b. Node.js / JavaScript — text + image edit (multimodal)

```javascript
import fs from "node:fs";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Encode a local image as a data URL
function fileToDataURL(path, mime = "image/jpeg") {
  const b64 = fs.readFileSync(path).toString("base64");
  return `data:${mime};base64,${b64}`;
}

const inputDataUrl = fileToDataURL("./input.jpg", "image/jpeg");

const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "google/gemini-3.1-flash-image-preview",
    modalities: ["image", "text"],
    messages: [
      {
        role: "user",
        content: [
          { type: "text",
            text: "Replace the daytime sky with a dramatic orange-and-purple sunset. Keep the subject, foreground lighting, and composition identical." },
          { type: "image_url",
            image_url: { url: inputDataUrl } }
        ]
      }
    ],
    image_config: { aspect_ratio: "3:2", image_size: "1K" }
  })
});

const data = await res.json();
const img  = data.choices[0].message.images[0].image_url.url;
fs.writeFileSync("edited.png", Buffer.from(img.split(",")[1], "base64"));
```

#### 6c. JavaScript via the OpenAI SDK (drop-in)

```javascript
import OpenAI from "openai";
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey:  process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://your-app.example.com",
    "X-Title": "Your App Name"
  }
});

const result = await client.chat.completions.create({
  model: "google/gemini-3.1-flash-image-preview",
  modalities: ["image", "text"],
  // image_config is OpenRouter-specific; pass it through extra_body / as a raw field:
  // (the SDK forwards unknown fields)
  // @ts-ignore
  image_config: { aspect_ratio: "1:1", image_size: "1K" },
  messages: [
    { role: "user",
      content: [
        { type: "text", text: "Make this product photo look like a watercolor illustration." },
        { type: "image_url",
          image_url: { url: "https://example.com/product.png" } }
      ] }
  ]
});

console.log(result.choices[0].message.content);
```

#### 6d. Python — text-only

```python
import os, base64, json, requests

OPENROUTER_API_KEY = os.environ["OPENROUTER_API_KEY"]

payload = {
    "model": "google/gemini-3.1-flash-image-preview",
    "modalities": ["image", "text"],
    "messages": [
        { "role": "user",
          "content": "A cinematic product photo of a matte black mechanical keyboard on a wooden desk, warm window light." }
    ],
    "image_config": { "aspect_ratio": "16:9", "image_size": "2K" }
}

resp = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://your-app.example.com",  # optional
        "X-Title":       "Your App Name",                  # optional
    },
    json=payload,
    timeout=120,
)
resp.raise_for_status()
data = resp.json()

msg = data["choices"][0]["message"]
print("Text:", msg.get("content"))

for i, img in enumerate(msg.get("images", []) or []):
    data_url = img["image_url"]["url"]              # data:image/png;base64,....
    b64 = data_url.split(",", 1)[1]
    with open(f"out_{i}.png", "wb") as f:
        f.write(base64.b64decode(b64))
```

#### 6e. Python — text + image (image editing)

```python
import os, base64, requests, mimetypes

OPENROUTER_API_KEY = os.environ["OPENROUTER_API_KEY"]

def file_to_data_url(path: str) -> str:
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:{mime};base64,{b64}"

input_url = file_to_data_url("input.jpg")

payload = {
    "model": "google/gemini-3.1-flash-image-preview",
    "modalities": ["image", "text"],
    "messages": [
        {
            "role": "user",
            "content": [
                { "type": "text",
                  "text": "Combine these two reference images into a single hero shot at golden hour, preserving identity of both subjects." },
                { "type": "image_url",
                  "image_url": { "url": input_url } },
                { "type": "image_url",
                  "image_url": { "url": "https://example.com/reference.png" } }
            ]
        }
    ],
    "image_config": { "aspect_ratio": "3:2", "image_size": "1K" }
}

resp = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}",
             "Content-Type":  "application/json"},
    json=payload, timeout=180
)
resp.raise_for_status()
img = resp.json()["choices"][0]["message"]["images"][0]["image_url"]["url"]
open("edited.png", "wb").write(base64.b64decode(img.split(",", 1)[1]))
```

#### 6f. Python via the OpenAI SDK

```python
from openai import OpenAI
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ["OPENROUTER_API_KEY"],
)

result = client.chat.completions.create(
    model="google/gemini-3.1-flash-image-preview",
    modalities=["image", "text"],
    extra_body={"image_config": {"aspect_ratio": "1:1", "image_size": "1K"}},
    messages=[{
        "role": "user",
        "content": [
            {"type": "text",  "text": "Turn this sketch into a polished concept-art render."},
            {"type": "image_url",
             "image_url": {"url": "https://example.com/sketch.png"}}
        ]
    }],
)
print(result.choices[0].message.content)
# result.choices[0].message.images is the SDK passthrough field
```

### 7. Response shape

```json
{
  "id": "gen-...",
  "model": "google/gemini-3.1-flash-image-preview",
  "choices": [{
    "index": 0,
    "finish_reason": "stop",
    "message": {
      "role": "assistant",
      "content": "Here's the image you requested.",
      "images": [
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
          }
        }
      ]
    }
  }],
  "usage": { "prompt_tokens": 123, "completion_tokens": 1120, "total_tokens": 1243 }
}
```

When streaming, image bytes arrive in `chunk.choices[0].delta.images[]` chunks; aggregate the data URL across chunks before decoding.

### 8. Rate limits and special considerations

- **OpenRouter platform-level rate limits (paid keys):** dynamic — each $1 of credit on your account ≈ 1 RPS, capped at 500 RPS globally. Rate limits are governed account-wide; creating extra keys does not raise them. There is no enforced fixed RPM for paid users beyond this.
- **Free models / low-credit accounts:** 20 RPM. Daily cap is 50 free-model requests/day if you have purchased <$10 in credits, raised to 1,000/day once you've ever purchased ≥$10. *This model is **not free** — there is no `:free` variant — so paid limits apply.*
- **Upstream Gemini limits:** Preview models have "more restrictive rate limits" per Google's pricing docs and these flow through OpenRouter. If you receive `429`s, slow down and use exponential backoff.
- **Negative balance:** A negative credit balance returns `402` errors.
- **DDoS protection:** Cloudflare may block extreme bursts even within your dollar-bucket allowance.
- **Pricing reconciliation:** OpenRouter's model page shows headline rates of **$0.50/M input** and **$3/M output**, while Google's official pricing for direct API use lists $0.25/M (text input), $1.50/M (text output), and **$60/M for image-output tokens** — meaning image generation cost in practice is dominated by image-output tokens (747/1120/1680/2520 tokens per image at 0.5K/1K/2K/4K respectively), not by the headline text-token rates. Treat the OpenRouter listed token prices as a reference and look at actual cost per generation in your Activity dashboard for the real number; expect roughly $0.045–$0.151 per image depending on `image_size`.
- **Provider routing:** OpenRouter routes this model to Google AI Studio (and listed two providers as of last check, with automatic failover for uptime).
- **`include_usage`/`usage: { include: true }`** in the request is recommended in production so the response includes precise token counts and you can audit per-image spend.
- **Prompt order:** Place text content parts before image content parts whenever possible.
- **Output is always text + image.** Account for this in token budgeting and downstream parsing — every successful response will populate both `message.content` and `message.images`.
- **PDF, audio, video as inputs:** While Gemini 3 Flash supports these, the **image preview** model is image-focused; for general-purpose multimodal inference use `google/gemini-3-flash-preview` instead.
- **Watermark / safety:** Outputs carry SynthID. The model will refuse content violating Google's safety policies, including violent or sexual content involving minors.

---

## Caveats

- **Pricing inconsistency between sources.** OpenRouter's product page lists `$0.50/M input` and `$3/M output` tokens for `google/gemini-3.1-flash-image-preview`. Google AI Developer pricing simultaneously documents `$0.25/M` text input, `$1.50/M` text output, and `$60/M` image-output tokens for the same model. The likely reconciliation is that OpenRouter is showing a blended/headline rate while in practice charging by token category as reported by the upstream provider; image-output tokens (which dominate cost per generated image) cost far more than text-output tokens. Always confirm cost in your OpenRouter Activity dashboard. The per-image figures of $0.045 / $0.067 / $0.101 / $0.151 (0.5K / 1K / 2K / 4K) come directly from Google's pricing page as of early 2026.
- **Preview status.** Google states preview models "may change before becoming stable and have more restrictive rate limits." API shape, supported parameters (especially `image_config`), and pricing can change without the deprecation timelines that apply to GA models.
- **OpenRouter docs are evolving.** The image-generation guide explicitly highlights `google/gemini-3.1-flash-image-preview` as the only model supporting `0.5K` and the extended ratios (`1:4`, `4:1`, `1:8`, `8:1`) as of the documentation snapshot used here. Other models on OpenRouter that support `image_config` may not accept the same values.
- **Reference-image limit.** Google's own notebook says "up to 14 reference images" for Nano Banana 2; Vertex's limits docs cap HTTP-URL inputs at 10 image files per request. The effective ceiling depends on transport (inline base64 vs URL) and the 20 MB total inline-payload cap.
- **No published OpenRouter-specific RPM/RPD for this exact model.** Limits are inherited from OpenRouter's general paid-account dynamic rate limit ($1 ≈ 1 RPS) plus whatever upstream Gemini preview throttling applies; both can change.
- **`image_config` not part of the OpenAI spec.** When using strongly-typed SDK clients (e.g., `openai` Python or TypeScript), pass `image_config` via `extra_body` (Python) or as a raw extra field (TS) — otherwise the SDK may strip it.
- **Always-on text output.** You cannot suppress text in the response. If you want pure image bytes, ignore `message.content` and read `message.images[0].image_url.url`.
- **SynthID watermark cannot be disabled.** All outputs from this model are marked.