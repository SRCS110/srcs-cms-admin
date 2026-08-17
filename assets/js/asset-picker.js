// cms-admin/assets/js/asset-picker.js
//
// A reusable "choose an image" modal, backed by the site's asset
// library in Supabase Storage. Used by the visual content editor for
// image-type blocks. Injects its own overlay into <body> the first
// time it's opened.
import { supabase } from "./supabase-client.js";
import { el } from "./utils.js";

let overlay = null;

function ensureOverlay() {
  if (overlay) return overlay;
  overlay = el("div", { class: "modal-overlay", id: "asset-picker-overlay" });
  document.body.appendChild(overlay);
  return overlay;
}

// Resolves to { id, url, fileName } when an image is chosen/uploaded,
// or null if the user cancels.
export function openAssetPicker(siteId) {
  return new Promise((resolve) => {
    const ov = ensureOverlay();
    ov.innerHTML = "";
    ov.classList.add("show");

    const modal = el("div", { class: "modal", style: "width:560px;max-width:92vw;" });
    modal.appendChild(el("h2", { text: "Choose an image" }));
    modal.appendChild(el("p", { class: "muted", style: "margin-top:-6px;margin-bottom:14px;", text: "Pick an existing image, or upload a new one." }));

    const grid = el("div", { class: "grid", style: "max-height:340px;overflow-y:auto;margin-bottom:16px;" });
    modal.appendChild(grid);

    const footerRow = el("div", { class: "modal-footer" });
    const uploadLabel = el("label", { class: "btn secondary", text: "Upload new image", style: "cursor:pointer;" });
    const uploadInput = el("input", { type: "file", accept: "image/*", style: "display:none;" });
    uploadLabel.appendChild(uploadInput);
    const cancelBtn = el("button", { class: "secondary", text: "Cancel" });
    cancelBtn.addEventListener("click", () => close(null));
    footerRow.appendChild(uploadLabel);
    footerRow.appendChild(cancelBtn);
    modal.appendChild(footerRow);

    ov.appendChild(modal);

    function close(result) {
      ov.classList.remove("show");
      ov.innerHTML = "";
      resolve(result);
    }

    async function loadAssets() {
      grid.innerHTML = "";
      grid.appendChild(el("p", { class: "muted", text: "Loading…" }));
      const { data: assets, error } = await supabase
        .from("assets")
        .select("id, storage_path, file_name, mime_type")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false });

      grid.innerHTML = "";
      if (error) {
        grid.appendChild(el("p", { style: "color:var(--lamp-ink,#c00);", text: error.message }));
        return;
      }
      if (!assets.length) {
        grid.appendChild(el("p", { class: "muted", text: "No images uploaded yet — upload one below." }));
        return;
      }
      for (const a of assets) {
        const { data: pub } = supabase.storage.from("assets").getPublicUrl(a.storage_path);
        const tile = el("div", { class: "asset-tile", style: "cursor:pointer;" });
        if ((a.mime_type || "").startsWith("image/")) {
          tile.appendChild(el("img", { src: pub.publicUrl, alt: a.file_name }));
        } else {
          tile.appendChild(el("div", { class: "muted", style: "padding:20px;text-align:center;font-size:11px;", text: a.file_name }));
        }
        tile.appendChild(el("div", { class: "meta", text: a.file_name }));
        tile.addEventListener("click", () => close({ id: a.id, url: pub.publicUrl, fileName: a.file_name }));
        grid.appendChild(tile);
      }
    }

    uploadInput.addEventListener("change", async () => {
      const file = uploadInput.files[0];
      if (!file) return;
      const path = `${siteId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("assets").upload(path, file);
      if (uploadErr) { alert(uploadErr.message); return; }

      const { data: row, error: insertErr } = await supabase
        .from("assets")
        .insert({ site_id: siteId, storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size })
        .select()
        .single();
      if (insertErr) { alert(insertErr.message); return; }

      const { data: pub } = supabase.storage.from("assets").getPublicUrl(row.storage_path);
      close({ id: row.id, url: pub.publicUrl, fileName: row.file_name });
    });

    loadAssets();
  });
}
