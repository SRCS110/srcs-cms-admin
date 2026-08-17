// cms-admin/assets/js/content-editor.js
import { supabase } from "./supabase-client.js";
import { getActiveSiteId } from "./auth.js";
import { el, qs, toast } from "./utils.js";
import { PAGE_SKELETONS } from "./page-skeletons.js";
import { openAssetPicker } from "./asset-picker.js";

const siteId = getActiveSiteId();
if (!siteId) window.location.href = "/dashboard.html";

const pageSelect = qs("#page-select");
const visualContainer = qs("#visual-preview");
const blocksHeading = qs("#blocks-heading");
const blocksContainer = qs("#blocks-container");
const newPageForm = qs("#new-page-form");

let pagesBySlug = {};
let currentSlug = null;

async function loadPages() {
  const { data: pages, error } = await supabase
    .from("pages")
    .select("id, slug, title, published")
    .eq("site_id", siteId)
    .order("slug");
  if (error) return toast(error.message, true);

  pagesBySlug = {};
  pageSelect.innerHTML = "";
  for (const p of pages) {
    pagesBySlug[p.slug] = p;
    pageSelect.appendChild(el("option", { value: p.slug, text: `${p.slug} — ${p.title}` }));
  }
  if (pages.length) loadPage(pages[0].slug);
}

async function loadPage(slug) {
  const page = pagesBySlug[slug];
  if (!page) return;
  currentSlug = slug;
  pageSelect.value = slug;

  const { data: blocks, error } = await supabase
    .from("content_blocks")
    .select("id, block_key, block_type, content, asset_id, sort_order")
    .eq("page_id", page.id)
    .order("sort_order");
  if (error) return toast(error.message, true);

  let blocksByKey = {};
  for (const b of blocks) blocksByKey[b.block_key] = b;

  const skeleton = PAGE_SKELETONS[slug];
  if (skeleton) {
    blocksByKey = await ensureSkeletonBlocks(page.id, skeleton, blocksByKey);
  }

  renderVisualPreview(skeleton, blocksByKey);
  renderAdditionalBlocks(page.id, skeleton, Object.values(blocksByKey));
}

// Make sure every block the skeleton expects actually exists as a row,
// so clicking into the preview always has something real to save to.
// Uses the same fallback copy that's baked into site-template's HTML,
// so creating these rows doesn't change what visitors currently see.
async function ensureSkeletonBlocks(pageId, skeleton, blocksByKey) {
  const missing = skeleton.blocks.filter((b) => !blocksByKey[b.key]);
  if (!missing.length) return blocksByKey;

  const rows = missing.map((b, i) => ({
    page_id: pageId,
    block_key: b.key,
    block_type: b.type,
    content: b.default || "",
    sort_order: 100 + i,
  }));
  const { data, error } = await supabase.from("content_blocks").insert(rows).select();
  if (error) {
    toast(error.message, true);
    return blocksByKey;
  }
  const merged = { ...blocksByKey };
  for (const row of data) merged[row.block_key] = row;
  return merged;
}

function renderVisualPreview(skeleton, blocksByKey) {
  visualContainer.innerHTML = "";

  if (!skeleton) {
    visualContainer.appendChild(
      el("p", { class: "muted", text: "No visual preview for this page yet — edit its fields below." })
    );
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.className = "visual-frame";
  visualContainer.appendChild(iframe);

  const bodyHtml = skeleton.render(blocksByKey);
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/assets/css/site-preview.css">
<link rel="stylesheet" href="/assets/css/editor-chrome.css">
</head><body>${bodyHtml}</body></html>`;
  iframe.srcdoc = doc;

  iframe.addEventListener("load", () => {
    const doc = iframe.contentDocument;

    doc.querySelectorAll("[data-block-key]:not(.hvs-url-block)").forEach((node) => {
      node.addEventListener("blur", async () => {
        const key = node.getAttribute("data-block-key");
        const isHtml = node.hasAttribute("data-html");
        const content = (isHtml ? node.innerHTML : node.textContent).trim();
        const block = blocksByKey[key];
        if (!block) return;
        await saveBlockContent(block.id, content);
      });
      // Enter submits single-line fields instead of inserting a newline.
      if (!node.hasAttribute("data-html")) {
        node.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); node.blur(); }
        });
      }
    });

    doc.querySelectorAll(".hvs-url-block").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const key = a.getAttribute("data-block-key");
        const block = blocksByKey[key];
        const current = a.getAttribute("data-url") || "";
        const next = prompt("Where should this link go?", current);
        if (next === null || !block) return;
        saveBlockContent(block.id, next).then(() => a.setAttribute("data-url", next));
      });
    });
  });
}

async function saveBlockContent(blockId, content) {
  const { error } = await supabase
    .from("content_blocks")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", blockId);
  if (error) return toast(error.message, true);
  toast("Saved");
}

function renderAdditionalBlocks(pageId, skeleton, allBlocks) {
  const skeletonKeys = new Set(skeleton ? skeleton.blocks.map((b) => b.key) : []);
  const extras = allBlocks.filter((b) => !skeletonKeys.has(b.block_key));

  blocksContainer.innerHTML = "";
  blocksHeading.textContent = skeleton
    ? "Additional blocks (not shown in the preview above)"
    : "Page content";

  for (const block of extras) blocksContainer.appendChild(renderBlockCard(block, pageId));
  blocksContainer.appendChild(renderNewBlockCard(pageId));
}

function renderBlockCard(block, pageId) {
  const card = el("div", { class: "card" });
  card.appendChild(el("label", { class: "field-label", text: `${block.block_key} (${block.block_type})` }));

  if (block.block_type === "image") {
    const preview = el("div", { style: "margin-bottom:10px;max-width:200px;" });
    if (block.asset_id) {
      supabase
        .from("assets")
        .select("storage_path, file_name")
        .eq("id", block.asset_id)
        .single()
        .then(({ data }) => {
          if (!data) return;
          const { data: pub } = supabase.storage.from("assets").getPublicUrl(data.storage_path);
          preview.appendChild(el("img", { src: pub.publicUrl, alt: data.file_name, style: "width:100%;border-radius:8px;" }));
        });
    } else {
      preview.appendChild(el("p", { class: "muted", text: "No image selected." }));
    }
    card.appendChild(preview);

    const row = el("div", { class: "row" });
    const chooseBtn = el("button", { text: "Choose image" });
    chooseBtn.addEventListener("click", async () => {
      const chosen = await openAssetPicker(siteId);
      if (!chosen) return;
      const { error } = await supabase
        .from("content_blocks")
        .update({ asset_id: chosen.id, updated_at: new Date().toISOString() })
        .eq("id", block.id);
      if (error) return toast(error.message, true);
      toast("Image updated");
      loadPage(currentSlug);
    });
    const deleteBtn = el("button", { class: "danger", text: "Delete" });
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete block "${block.block_key}"?`)) return;
      const { error } = await supabase.from("content_blocks").delete().eq("id", block.id);
      if (error) return toast(error.message, true);
      loadPage(currentSlug);
    });
    row.appendChild(chooseBtn);
    row.appendChild(deleteBtn);
    card.appendChild(row);
    return card;
  }

  const input = block.block_type === "richtext"
    ? el("textarea", { rows: "4" })
    : el("input", { type: "text" });
  input.value = block.content || "";
  card.appendChild(input);

  const row = el("div", { class: "row" });
  const saveBtn = el("button", { text: "Save" });
  saveBtn.addEventListener("click", async () => {
    const { error } = await supabase
      .from("content_blocks")
      .update({ content: input.value, updated_at: new Date().toISOString() })
      .eq("id", block.id);
    if (error) return toast(error.message, true);
    toast("Saved");
  });
  const deleteBtn = el("button", { class: "danger", text: "Delete" });
  deleteBtn.addEventListener("click", async () => {
    if (!confirm(`Delete block "${block.block_key}"?`)) return;
    const { error } = await supabase.from("content_blocks").delete().eq("id", block.id);
    if (error) return toast(error.message, true);
    card.remove();
  });
  row.appendChild(saveBtn);
  row.appendChild(deleteBtn);
  card.appendChild(row);
  return card;
}

function renderNewBlockCard(pageId) {
  const card = el("div", { class: "card" });
  card.appendChild(el("label", { class: "field-label", text: "Add a new block" }));
  const keyInput = el("input", { type: "text", placeholder: "block_key, e.g. hero_heading" });
  const typeSelect = el("select", {}, [
    el("option", { value: "text", text: "text" }),
    el("option", { value: "richtext", text: "richtext" }),
    el("option", { value: "image", text: "image" }),
    el("option", { value: "url", text: "url" }),
  ]);
  card.appendChild(keyInput);
  card.appendChild(typeSelect);
  const addBtn = el("button", { text: "Add block" });
  addBtn.addEventListener("click", async () => {
    if (!keyInput.value.trim()) return toast("block_key is required", true);
    const { error } = await supabase.from("content_blocks").insert({
      page_id: pageId,
      block_key: keyInput.value.trim(),
      block_type: typeSelect.value,
      content: "",
    });
    if (error) return toast(error.message, true);
    loadPage(currentSlug);
  });
  card.appendChild(addBtn);
  return card;
}

pageSelect.addEventListener("change", () => loadPage(pageSelect.value));

newPageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const slug = qs("#new-page-slug").value.trim();
  const title = qs("#new-page-title").value.trim();
  if (!slug) return toast("Page slug is required", true);
  const { error } = await supabase.from("pages").insert({ site_id: siteId, slug, title });
  if (error) return toast(error.message, true);
  qs("#new-page-slug").value = "";
  qs("#new-page-title").value = "";
  loadPages();
});

loadPages();
