const MODEL = "google/gemini-3.1-flash-image-preview";
const STORAGE_KEY = "valyra.session.v1";
const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;

const looks = [
  {
    id: "nose-refinement",
    title: "Subtle Nose Refinement",
    category: "Nose",
    ratio: "portrait",
    aspectRatio: "4:5",
    edit: "make the nose bridge and tip look slightly more refined and balanced while preserving the person's natural nose character"
  },
  {
    id: "soft-lip-volume",
    title: "Soft Lip Volume",
    category: "Lips",
    ratio: "square",
    aspectRatio: "1:1",
    edit: "add soft natural lip volume and gentle definition while keeping the mouth shape realistic"
  },
  {
    id: "soft-eye-lift",
    title: "Soft Eye Lift",
    category: "Eyes",
    ratio: "tall",
    aspectRatio: "3:4",
    edit: "slightly lift the brow and outer eye area for a refreshed eye look while keeping expression natural"
  },
  {
    id: "skin-refresh",
    title: "Skin Refresh",
    category: "Skin",
    ratio: "portrait",
    aspectRatio: "4:3",
    edit: "gently even skin tone, soften minor texture, brighten the under-eye area, and keep natural pores and lighting"
  },
  {
    id: "face-contour",
    title: "Soft Face Contour",
    category: "Contour",
    ratio: "tall",
    aspectRatio: "3:4",
    edit: "create subtle cheek, jawline, and lower-face contouring while preserving the person's natural face shape"
  }
];

const categories = ["All", ...Array.from(new Set(looks.map((look) => look.category)))];
const state = {
  selfie: "",
  results: looks.map((look) => ({ ...look, status: "idle", imageUrl: "", error: "" })),
  activeCategory: "All",
  selectedId: "",
  generating: false,
  darkMode: false,
  serverConfigured: null
};

const activeGenerations = new Map();

const elements = {
  uploadPanel: document.querySelector("#uploadPanel"),
  workspace: document.querySelector("#workspace"),
  uploadButton: document.querySelector("#uploadButton"),
  uploadForm: document.querySelector("#uploadForm"),
  selfieInput: document.querySelector("#selfieInput"),
  originalImage: document.querySelector("#originalImage"),
  generateAll: document.querySelector("#generateAll"),
  replacePhoto: document.querySelector("#replacePhoto"),
  clearSession: document.querySelector("#clearSession"),
  themeToggle: document.querySelector("#themeToggle"),
  filterGroup: document.querySelector("#filterGroup"),
  progressText: document.querySelector("#progressText"),
  progressCount: document.querySelector("#progressCount"),
  progressBar: document.querySelector("#progressBar"),
  statusMessage: document.querySelector("#statusMessage"),
  gallery: document.querySelector("#gallery"),
  tileTemplate: document.querySelector("#tileTemplate"),
  retryFailed: document.querySelector("#retryFailed"),
  dialog: document.querySelector("#resultDialog"),
  closeDialog: document.querySelector("#closeDialog"),
  compareBefore: document.querySelector("#compareBefore"),
  compareAfter: document.querySelector("#compareAfter"),
  compareAfterWrap: document.querySelector("#compareAfterWrap"),
  compareDivider: document.querySelector("#compareDivider"),
  compareSlider: document.querySelector("#compareSlider"),
  dialogOriginal: document.querySelector("#dialogOriginal"),
  dialogPreview: document.querySelector("#dialogPreview"),
  dialogTitle: document.querySelector("#dialogTitle"),
  downloadResult: document.querySelector("#downloadResult"),
  regenerateResult: document.querySelector("#regenerateResult")
};

loadSession();
bindEvents();
render();
checkServerHealth();

function bindEvents() {
  elements.uploadButton.addEventListener("click", () => elements.selfieInput.click());
  elements.selfieInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  });

  for (const eventName of ["dragenter", "dragover"]) {
    elements.uploadButton.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.uploadButton.classList.add("dragover");
    });
  }

  for (const eventName of ["dragleave", "drop"]) {
    elements.uploadButton.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.uploadButton.classList.remove("dragover");
    });
  }

  elements.uploadButton.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });

  elements.generateAll.addEventListener("click", () => generateLooks(state.results.filter((result) => result.status !== "done")));
  elements.retryFailed.addEventListener("click", () => generateLooks(state.results.filter((result) => result.status === "failed")));
  elements.replacePhoto.addEventListener("click", resetForNewPhoto);
  elements.clearSession.addEventListener("click", clearSession);
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.closeDialog.addEventListener("click", () => elements.dialog.close());
  elements.compareSlider.addEventListener("input", updateComparePosition);
  elements.downloadResult.addEventListener("click", downloadSelected);
  elements.regenerateResult.addEventListener("click", regenerateSelected);
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) elements.dialog.close();
  });
}

async function handleFile(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    setStatus("Upload a JPG, PNG, or WebP selfie.", "Upload blocked");
    return;
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    setStatus("Choose an image under 8 MB for faster generation.", "Upload blocked");
    return;
  }

  try {
    setStatus("Preparing selfie for AI editing...", "Processing");
    const imageDataUrl = await resizeImage(file);
    state.selfie = imageDataUrl;
    state.results = looks.map((look) => ({ ...look, status: "idle", imageUrl: "", error: "" }));
    state.selectedId = "";
    saveSession();
    render();
    generateLooks(state.results);
  } catch (error) {
    setStatus(error.message || "Could not read that image.", "Upload failed");
  }
}

async function resizeImage(file) {
  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(rawDataUrl);
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.86);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = src;
  });
}

function generateLooks(targets) {
  if (!state.selfie || targets.length === 0) return;

  if (state.serverConfigured === false) {
    setStatus("Add OPENROUTER_API_KEY to .env, restart the server, then generate the gallery.", "Setup needed");
    return;
  }

  const nextTargets = targets.filter((target) => !activeGenerations.has(target.id));

  if (nextTargets.length === 0) return;

  setStatus(`Starting ${nextTargets.length} separate OpenRouter calls...`, "Generating");

  for (const target of nextTargets) {
    generateSingle(target.id, state.selfie);
  }
}

async function generateSingle(id, selfieSnapshot) {
  const result = state.results.find((item) => item.id === id);
  if (!result) return;

  const generationToken = createGenerationToken();
  activeGenerations.set(id, generationToken);
  updateResult(id, { status: "loading", error: "" });
  setStatus(`Generating ${result.title}...`, "Generating");
  syncGenerationState();

  try {
    const data = await requestPreviewGeneration(result, selfieSnapshot);
    if (state.selfie !== selfieSnapshot) return;
    updateResult(id, { status: "done", imageUrl: data.imageUrl, error: "" });
  } catch (error) {
    if (state.selfie !== selfieSnapshot) return;
    updateResult(id, { status: "failed", error: error.message || "Generation failed." });
  } finally {
    if (activeGenerations.get(id) === generationToken) {
      activeGenerations.delete(id);
    }
    syncGenerationState();
  }
}

async function requestPreviewGeneration(result, selfieSnapshot) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildPrompt(result),
      imageDataUrl: selfieSnapshot,
      aspectRatio: result.aspectRatio
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.error || "Generation failed.");
  }

  if (!data.imageUrl) {
    throw new Error("The model did not return an image.");
  }

  return data;
}

function createGenerationToken() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function syncGenerationState() {
  state.generating = activeGenerations.size > 0;

  const done = state.results.filter((result) => result.status === "done").length;
  const failed = state.results.filter((result) => result.status === "failed").length;
  const total = state.results.length;

  if (state.generating) {
    setStatus(`${activeGenerations.size} preview${activeGenerations.size === 1 ? "" : "s"} still generating. Finished images appear as soon as they return.`, "Generating");
  } else if (done === total) {
    setStatus("Gallery complete. Open any tile to compare with the original.", "Complete");
  } else if (failed > 0) {
    const firstFailure = state.results.find((result) => result.status === "failed" && result.error);
    setStatus(`${failed} previews failed. ${firstFailure?.error || "You can retry them."}`, "Needs retry");
  } else {
    setStatus("Ready to generate previews.", "Ready");
  }

  render();
}

function buildPrompt(look) {
  return [
    "Edit the provided selfie into a realistic cosmetic facial preview.",
    `Requested look: ${look.title}.`,
    `Specific edit: ${look.edit}.`,
    "Preserve the person's identity, age, ethnicity, facial structure, pose, expression, hairstyle, lighting, camera angle, and background.",
    "Keep the edit subtle, natural, believable, and suitable for a beauty consultation preview.",
    "Do not make the person look like a different person. Do not over-smooth skin. Do not create a glamour portrait. Do not add text, labels, watermarks, extra people, medical markings, before/after panels, or collage layouts.",
    "Return one clean edited image only."
  ].join(" ");
}

function updateResult(id, patch) {
  state.results = state.results.map((result) => (result.id === id ? { ...result, ...patch } : result));
  saveSession();
  render();
}

function render() {
  document.documentElement.dataset.theme = state.darkMode ? "dark" : "light";
  elements.uploadPanel.classList.toggle("hidden", Boolean(state.selfie));
  elements.workspace.classList.toggle("hidden", !state.selfie);

  if (state.selfie) {
    elements.originalImage.src = state.selfie;
    elements.dialogOriginal.src = state.selfie;
    elements.compareBefore.src = state.selfie;
  }

  renderFilters();
  renderGallery();
  renderProgress();
}

function renderFilters() {
  elements.filterGroup.replaceChildren();

  for (const category of categories) {
    const button = document.createElement("button");
    button.className = `filter-chip${state.activeCategory === category ? " active" : ""}`;
    button.type = "button";
    button.textContent = category;
    button.addEventListener("click", () => {
      state.activeCategory = category;
      saveSession();
      render();
    });
    elements.filterGroup.append(button);
  }
}

function renderGallery() {
  elements.gallery.replaceChildren();

  const filtered = state.results.filter((result) => state.activeCategory === "All" || result.category === state.activeCategory);

  for (const result of filtered) {
    const tile = elements.tileTemplate.content.firstElementChild.cloneNode(true);
    const image = tile.querySelector(".tile-image");
    const saveButton = tile.querySelector(".save-button");
    const title = tile.querySelector(".tile-title");
    const category = tile.querySelector(".tile-category");
    const placeholder = tile.querySelector(".tile-placeholder");

    tile.dataset.ratio = result.ratio;
    tile.classList.toggle("loaded", result.status === "done");
    tile.classList.toggle("failed", result.status === "failed");
    tile.title = result.error || result.title;
    placeholder.dataset.error = result.error || "Generation failed";
    image.alt = `${result.title} generated preview`;
    image.src = result.imageUrl || "";
    title.textContent = result.title;
    category.textContent = result.category;
    saveButton.disabled = result.status !== "done";
    saveButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openResult(result.id);
    });
    tile.addEventListener("click", () => {
      if (result.status === "done") openResult(result.id);
      if (result.status === "failed") generateLooks([result]);
    });

    elements.gallery.append(tile);
  }
}

function renderProgress() {
  const done = state.results.filter((result) => result.status === "done").length;
  const loading = state.results.filter((result) => result.status === "loading").length;
  const failed = state.results.filter((result) => result.status === "failed").length;
  const available = state.results.filter((result) => result.status !== "done" && !activeGenerations.has(result.id)).length;
  const total = state.results.length;
  const percent = Math.round((done / total) * 100);

  elements.progressCount.textContent = `${done}/${total}`;
  elements.progressBar.style.width = `${percent}%`;
  elements.generateAll.disabled = !state.selfie || done === total || available === 0;
  elements.retryFailed.disabled = failed === 0;

  if (loading > 0) {
    elements.progressText.textContent = "Generating";
  } else if (done === total) {
    elements.progressText.textContent = "Complete";
  } else if (failed > 0) {
    elements.progressText.textContent = "Needs retry";
  } else {
    elements.progressText.textContent = "Ready";
  }
}

function setStatus(message, label = "Status") {
  elements.statusMessage.textContent = message;
  elements.progressText.textContent = label;
}

function openResult(id) {
  const result = state.results.find((item) => item.id === id);
  if (!result || result.status !== "done") return;

  state.selectedId = id;
  elements.dialogTitle.textContent = result.title;
  elements.compareBefore.src = state.selfie;
  elements.compareAfter.src = result.imageUrl;
  elements.dialogPreview.src = result.imageUrl;
  elements.compareAfter.alt = `${result.title} generated preview`;
  elements.dialogPreview.alt = `${result.title} generated preview`;
  elements.compareSlider.value = "50";
  updateComparePosition();
  elements.dialog.showModal();
}

function updateComparePosition() {
  const value = Number(elements.compareSlider.value);
  const position = `${value}%`;
  elements.compareAfterWrap.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
  elements.compareDivider.style.left = position;
}

function downloadSelected() {
  const result = state.results.find((item) => item.id === state.selectedId);
  if (!result?.imageUrl) return;

  const anchor = document.createElement("a");
  anchor.href = result.imageUrl;
  anchor.download = `valyra-${result.id}.png`;
  anchor.click();
}

function regenerateSelected() {
  const id = state.selectedId;
  if (!id) return;

  elements.dialog.close();
  generateLooks(state.results.filter((result) => result.id === id));
}

function resetForNewPhoto() {
  activeGenerations.clear();
  state.generating = false;
  state.selfie = "";
  state.results = looks.map((look) => ({ ...look, status: "idle", imageUrl: "", error: "" }));
  state.selectedId = "";
  state.activeCategory = "All";
  elements.selfieInput.value = "";
  saveSession();
  render();
}

function clearSession() {
  resetForNewPhoto();
  localStorage.removeItem(STORAGE_KEY);
  setStatus("Session cleared.", "Ready");
}

function toggleTheme() {
  state.darkMode = !state.darkMode;
  saveSession();
  render();
}

function saveSession() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selfie: state.selfie,
        results: state.results,
        activeCategory: state.activeCategory,
        darkMode: state.darkMode,
        savedAt: new Date().toISOString()
      })
    );
  } catch {
    setStatus("The session is too large for local storage. Results will remain available until this tab closes.", "Storage full");
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);

    state.selfie = saved.selfie || "";
    state.activeCategory = saved.activeCategory || "All";
    state.darkMode = Boolean(saved.darkMode);

    if (Array.isArray(saved.results)) {
      state.results = looks.map((look) => {
        const savedResult = saved.results.find((result) => result.id === look.id);
        return {
          ...look,
          status: savedResult?.status === "done" ? "done" : "idle",
          imageUrl: savedResult?.imageUrl || "",
          error: ""
        };
      });
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function checkServerHealth() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();

    if (!data.configured) {
      state.serverConfigured = false;
      setStatus("Add OPENROUTER_API_KEY to .env before generating real AI edits.", "Setup needed");
    } else if (!state.selfie) {
      state.serverConfigured = true;
      setStatus(`Ready to generate with ${MODEL}.`, "Ready");
    } else {
      state.serverConfigured = true;
    }
  } catch {
    state.serverConfigured = false;
    setStatus("Server health check failed. Restart the app server.", "Offline");
  }
}
