// cms-admin/assets/js/page-skeletons.js
//
// Visual/WYSIWYG previews for the pages that ship in site-template.
// Each skeleton's markup mirrors the real .html file in site-template/
// exactly (same tags, same classes) so it renders identically once
// site-preview.css is applied. If site-template's HTML changes, update
// the matching skeleton here too.
//
// Only the block_keys listed here render inside the visual preview.
// Anything else on the page (custom blocks someone added, image blocks,
// or any page whose slug has no skeleton) falls back to the plain list
// editor below the preview — we don't know how to visually place a
// block we don't have a template slot for.

function editAttrs(key, { html = false } = {}) {
  return `contenteditable="true" data-block-key="${key}"${html ? ' data-html="true"' : ""} class="hvs-editable"`;
}

function val(blocks, key, fallback) {
  return (blocks[key] && blocks[key].content) || fallback;
}

const NAV = `<nav><a href="#" onclick="return false">Home</a><a href="#" onclick="return false">About</a><a href="#" onclick="return false">Contact</a></nav>`;

function header(blocks) {
  return `<header class="site-header">
    <strong ${editAttrs("site_name")}>${val(blocks, "site_name", "Client Name")}</strong>
    ${NAV}
  </header>`;
}

function footer(blocks) {
  return `<footer class="site-footer">
    <span ${editAttrs("footer_text", { html: true })}>${val(blocks, "footer_text", "&copy; 2026 Client Name. All rights reserved.")}</span>
  </footer>`;
}

export const PAGE_SKELETONS = {
  index: {
    blocks: [
      { key: "site_name", type: "text", default: "Client Name" },
      { key: "hero_heading", type: "text", default: "Welcome to our site" },
      { key: "hero_body", type: "richtext", default: "This is placeholder content until the CMS loads." },
      { key: "hero_cta_link", type: "url", default: "/contact.html" },
      { key: "footer_text", type: "richtext", default: "&copy; 2026 Client Name. All rights reserved." },
    ],
    render(blocks) {
      return `
        ${header(blocks)}
        <section class="hero">
          <h1 ${editAttrs("hero_heading")}>${val(blocks, "hero_heading", "Welcome to our site")}</h1>
          <p ${editAttrs("hero_body", { html: true })}>${val(blocks, "hero_body", "This is placeholder content until the CMS loads.")}</p>
          <a class="btn hvs-url-block" data-block-key="hero_cta_link" data-url="${val(blocks, "hero_cta_link", "/contact.html")}" href="#" onclick="return false">Get in touch</a>
        </section>
        ${footer(blocks)}
      `;
    },
  },

  about: {
    blocks: [
      { key: "site_name", type: "text", default: "Client Name" },
      { key: "about_body", type: "richtext", default: "<p>Placeholder about-page copy until the CMS loads.</p>" },
      { key: "footer_text", type: "richtext", default: "&copy; 2026 Client Name. All rights reserved." },
    ],
    render(blocks) {
      return `
        ${header(blocks)}
        <main>
          <h1>About us</h1>
          <div ${editAttrs("about_body", { html: true })}>${val(blocks, "about_body", "<p>Placeholder about-page copy until the CMS loads.</p>")}</div>
        </main>
        ${footer(blocks)}
      `;
    },
  },

  contact: {
    blocks: [
      { key: "site_name", type: "text", default: "Client Name" },
      { key: "contact_email", type: "text", default: "hello@example.com" },
      { key: "footer_text", type: "richtext", default: "&copy; 2026 Client Name. All rights reserved." },
    ],
    render(blocks) {
      return `
        ${header(blocks)}
        <main>
          <h1>Contact</h1>
          <p>Email us at <a ${editAttrs("contact_email")} href="#" onclick="return false">${val(blocks, "contact_email", "hello@example.com")}</a></p>
        </main>
        ${footer(blocks)}
      `;
    },
  },
};
