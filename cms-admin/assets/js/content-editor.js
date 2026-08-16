// cms-admin/assets/js/content-editor.js
import { supabase } from "./supabase-client.js";
import { getActiveSiteId } from "./auth.js";
import { el, qs, toast } from "./utils.js";

const siteId = getActiveSiteId();
if (!siteId) window.location.href = "/dashboard.html";

const pageSelect = qs("#page-select");
const blocksContainer = qs("#blocks-container");
const newPageForm = qs("#new-page-form");

async function loadPages() {
  const { data: pages, error } = await supabase
    .from("pages")
    .select("id, slug, title, published")
    .eq("site_id", siteId)
    .order("slug");
  if (error) return toast(error.message, true);

  pageSelect.innerHTML = "";
  for (const p of pages) {
    pageSelect.appendChild(el("option", { value: p.id, text: `${p.slug} — ${p.title}` }));
  }
  if (pages.length) loadBlocks(pages[0].id);
}

async function loadBlocks(pageId) {
  blocksContainer.innerHTML = "";
  const { data: blocks, error } = await supabase
    .from("content_blocks")
    .select("id, block_key, block_type, content, sort_order")
    .eq("page_id", pageId)
    .order("sort_order");
  if (error) return toast(error.message, true);

  for (const block of blocks) {
    blocksContainer.appendChild(renderBlockCard(block));
  }
  blocksContainer.appendChild(renderNewBlockCard(pageId));
}

function renderBlockCard(block) {
  const card = el("div", { class: "card" });
  card.appendChild(el("label", { class: "field-label", text: `${block.block_key} (${block.block_type})` }));

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
    loadBlocks(pageId);
  });
  card.appendChild(addBtn);
  return card;
}

pageSelect.addEventListener("change", () => loadBlocks(pageSelect.value));

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
