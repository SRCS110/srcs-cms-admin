// cms-admin/assets/js/utils.js
export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) node.appendChild(child);
  return node;
}

export function toast(message, isError = false) {
  const box = qs("#toast") || (() => {
    const t = el("div", { id: "toast" });
    document.body.appendChild(t);
    return t;
  })();
  box.textContent = message;
  box.className = isError ? "toast toast-error show" : "toast show";
  setTimeout(() => box.classList.remove("show"), 3000);
}

export function fmtBytes(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
}
