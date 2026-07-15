import fs from "fs";
import path from "path";

const root = process.cwd();
const files = [
  ["src/admin/pages/Branches.tsx", "src/admin/pages/Branches.tsx"],
  ["src/admin/pages/ServiceFleet.tsx", "src/admin/pages/ServiceFleet.tsx"],
  ["src/admin/services/branchesApi.ts", "src/admin/services/branchesApi.ts"],
  ["src/admin/services/serviceFleetApi.ts", "src/admin/services/serviceFleetApi.ts"],
  ["docs/sql/2026_branches_service_fleet.sql", "docs/sql/2026_branches_service_fleet.sql"],
];

function copyFile(src, dest) {
  const source = path.join(root, src);
  const target = path.join(root, dest);
  if (!fs.existsSync(source)) {
    console.warn(`skip missing ${src}`);
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`copied ${dest}`);
}

for (const [src, dest] of files) copyFile(src, dest);

const appPath = path.join(root, "src/App.tsx");
if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, "utf8");
  if (!app.includes("admin/pages/Branches")) {
    const lastImport = app.match(/import[^;]+;\s*(?=\n(?!import))/);
    app = app.replace(lastImport?.[0] || "", `${lastImport?.[0] || ""}\nimport Branches from "./admin/pages/Branches";\nimport ServiceFleet from "./admin/pages/ServiceFleet";\n`);
  }
  if (!app.includes('path="/admin/branches"')) {
    app = app.replace(/<Route\s+path="\/admin\/([^\"]+)"[^>]*\/>/, (match) => `${match}\n          <Route path="/admin/branches" element={<Branches />} />\n          <Route path="/admin/service-fleet" element={<ServiceFleet />} />`);
  }
  fs.writeFileSync(appPath, app);
  console.log("patched src/App.tsx routes when possible");
}

const candidates = [
  "src/admin/AdminLayout.tsx",
  "src/admin/components/AdminLayout.tsx",
  "src/components/AdminLayout.tsx",
  "src/pages/Admin.tsx",
];
for (const relative of candidates) {
  const filePath = path.join(root, relative);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, "utf8");
  if (!content.includes("/admin/branches")) {
    const marker = content.includes("/admin/finance") ? "/admin/finance" : content.includes("/admin/settings") ? "/admin/settings" : null;
    if (marker) {
      const lineMatch = content.split("\n").find((line) => line.includes(marker));
      if (lineMatch) {
        const indent = lineMatch.match(/^\s*/)?.[0] || "";
        const insert = `${indent}<Link to="/admin/branches">شعب</Link>\n${indent}<Link to="/admin/service-fleet">ناوگان سرویس</Link>\n`;
        content = content.replace(lineMatch, `${insert}${lineMatch}`);
      }
    }
    fs.writeFileSync(filePath, content);
    console.log(`patched menu candidate ${relative}`);
  }
}

console.log("Branches + Service Fleet patch applied. Now run docs/sql/2026_branches_service_fleet.sql in Supabase.");
