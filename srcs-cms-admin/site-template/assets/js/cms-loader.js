// site-template/assets/js/cms-loader.js
//
// Runtime content loader for pure-HTML pages. Include this script on
// every page. It reads SITE_ID from site.config.json, figures out the
// current page's slug from the URL, and fills in every element marked
// with a data-cms-block attribute using content from Supabase.
//
// Usage in HTML:
//   <h1 data-cms-block="hero_heading">Fallback heading</h1>
//   <div data-cms-block="hero_body" data-cms-html></div>          <!-- richtext -->
//   <img data-cms-block="hero_image" data-cms-type="image" src="fallback.jpg">
//   <a data-cms-block="cta_link" data-cms-type="url" href="#">Fallback</a>
//
// Fallback content already in the HTML is shown instantly and only
// replaced once Supabase responds — so pages never show a blank state.

import { getConfig, getSupabase } from "./supabase-client.js";

function pageSlugFromPath(pathname) {
  const last = pathname.split("/").filter(Boolean).pop() || "index.html";
  return last.replace(/\.html$/, "");
}

async function run() {
  const cfg = await getConfig();
  const supabase = await getSupabase();
  const slug = pageSlugFromPath(window.location.pathname);

  const { data: page, error: pageErr } = await supabase
    .from("pages")
    .select("id, title, meta_description")
    .eq("site_id", cfg.SITE_ID)
    .eq("slug", slug)
    .single();

  if (pageErr || !page) {
    console.warn("cms-loader: no CMS page found for slug", slug, pageErr);
    return;
  }

  if (page.title) document.title = page.title;
  if (page.meta_description) {
    let metaTag = document.querySelector('meta[name="description"]');
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.setAttribute("name", "description");
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute("content", page.meta_description);
  }

  const { data: blocks, error: blocksErr } = await supabase
    .from("content_blocks")
    .select("block_key, block_type, content, asset_id")
    .eq("page_id", page.id);

  if (blocksErr) {
    console.error("cms-loader:", blocksErr);
    return;
  }

  const assetIds = blocks.filter(b => b.asset_id).map(b => b.asset_id);
  let assetsById = {};
  if (assetIds.length) {
    const { data: assets } = await supabase
      .from("assets")
      .select("id, storage_path, alt_text")
      .in("id", assetIds);
    for (const a of assets || []) {
      const { data: pub } = supabase.storage.from("assets").getPublicUrl(a.storage_path);
      assetsById[a.id] = { url: pub.publicUrl, alt: a.alt_text };
    }
  }

  for (const block of blocks) {
    const target = document.querySelector(`[data-cms-block="${block.block_key}"]`);
    if (!target) continue;

    if (block.block_type === "image" && block.asset_id && assetsById[block.asset_id]) {
      target.src = assetsById[block.asset_id].url;
      if (assetsById[block.asset_id].alt) target.alt = assetsById[block.asset_id].alt;
    } else if (block.block_type === "url") {
      target.setAttribute("href", block.content || "#");
    } else if (target.hasAttribute("data-cms-html")) {
      target.innerHTML = block.content || "";
    } else {
      target.textContent = block.content || "";
    }
  }
}

run().catch(err => console.error("cms-loader failed:", err));
