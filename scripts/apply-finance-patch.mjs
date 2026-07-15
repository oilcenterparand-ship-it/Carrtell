import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appPath = path.join(root, "src", "App.tsx");
const candidates = [
  path.join(root, "src", "admin", "AdminLayout.tsx"),
  path.join(root, "src", "admin", "components", "AdminLayout.tsx"),
  path.join(root, "src", "components", "AdminLayout.tsx"),
];

function patchFile(file, updater) {
  if (!fs.existsSync(file)) return false;
  const before = fs.readFileSync(file, "utf8");
  const after = updater(before);
  if (after !== before) fs.writeFileSync(file, after);
  return true;
}

patchFile(appPath, (src) => {
  let out = src;
  if (!out.includes("./admin/pages/Finance")) {
    out = `import Finance from "./admin/pages/Finance";\n` + out;
  }
  if (!out.includes('path="/admin/finance"') && !out.includes("path='/admin/finance'")) {
    out = out.replace(/<Route\s+path=["']\/admin\/diagnostics["'][^>]*\/>/, (m) => `${m}\n          <Route path="/admin/finance" element={<Finance />} />`);
    if (!out.includes('path="/admin/finance"')) {
      out = out.replace(/<Route\s+path=["']\/admin\/orders["'][^>]*\/>/, (m) => `${m}\n          <Route path="/admin/finance" element={<Finance />} />`);
    }
  }
  return out;
});

for (const layoutPath of candidates) {
  patchFile(layoutPath, (src) => {
    if (src.includes('/admin/finance')) return src;
    const financeLink = `\n  { to: "/admin/finance", label: "مالی و سود" },`;
    let out = src;
    out = out.replace(/(const\s+[^=]*nav[^=]*=\s*\[)/, `$1${financeLink}`);
    out = out.replace(/(const\s+[^=]*menu[^=]*=\s*\[)/, `$1${financeLink}`);
    return out;
  });
}

console.log("Carrtell finance patch applied.");
