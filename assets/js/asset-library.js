// cms-admin/assets/js/asset-library.js
import { supabase } from "./supabase-client.js";
import { getActiveSiteId } from "./auth.js";
import { el, qs, toast, fmtBytes } from "./utils.js";

const siteId = getActiveSiteId();
if (!siteId) window.location.href = "/dashboard.html";

const grid = qs("#asset-grid");
const uploadInput = qs("#upload-input");

async function loadAssets() {
  grid.innerHTML = "";
  const { data: assets, error } = await supabase
    .from("assets")
    .select("id, storage_path, file_name, mime_type, size_bytes, alt_text")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });
  if (error) return toast(error.message, true);

  for (const asset of assets) {
    const { data: pub } = supabase.storage.from("assets").getPublicUrl(asset.storage_path);
    const tile = el("div", { class: "asset-tile" });
    if ((asset.mime_type || "").startsWith("image/")) {
      tile.appendChild(el("img", { src: pub.publicUrl, alt: asset.alt_text || "" }));
    } else {
      tile.appendChild(el("div", { class: "muted", style: "padding:24px;text-align:center;", text: asset.file_name }));
    }
    const meta = el("div", { class: "meta" });
    meta.appendChild(el("div", { text: asset.file_name }));
    meta.appendChild(el("div", { text: fmtBytes(asset.size_bytes) }));

    const copyBtn = el("button", { class: "secondary", text: "Copy URL", style: "width:100%;margin-top:4px;" });
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(pub.publicUrl);
      toast("URL copied");
    });

    const deleteBtn = el("button", { class: "danger", text: "Delete", style: "width:100%;margin-top:4px;" });
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete "${asset.file_name}"?`)) return;
      await supabase.storage.from("assets").remove([asset.storage_path]);
      const { error: delErr } = await supabase.from("assets").delete().eq("id", asset.id);
      if (delErr) return toast(delErr.message, true);
      tile.remove();
    });

    meta.appendChild(copyBtn);
    meta.appendChild(deleteBtn);
    tile.appendChild(meta);
    grid.appendChild(tile);
  }
}

uploadInput.addEventListener("change", async () => {
  for (const file of uploadInput.files) {
    const path = `${siteId}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("assets").upload(path, file);
    if (uploadErr) { toast(uploadErr.message, true); continue; }

    const { error: insertErr } = await supabase.from("assets").insert({
      site_id: siteId,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });
    if (insertErr) toast(insertErr.message, true);
  }
  uploadInput.value = "";
  loadAssets();
});

loadAssets();
