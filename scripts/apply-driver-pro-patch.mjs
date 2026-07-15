import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const patchRoot = path.join(root, "__patch__");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) copyRecursive(path.join(src, item), path.join(dest, item));
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("copied", path.relative(root, dest));
}

copyRecursive(path.join(patchRoot, "src"), path.join(root, "src"));

const appPath = path.join(root, "src", "App.tsx");
if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, "utf8");

  const imports = [
    `import DriverDashboard from "./driver/pages/DriverDashboard";`,
    `import DriverJobDetail from "./driver/pages/DriverJobDetail";`,
  ];

  for (const line of imports) {
    if (!app.includes(line)) {
      const lastImport = [...app.matchAll(/^import .*;$/gm)].pop();
      if (lastImport) {
        const insertAt = lastImport.index + lastImport[0].length;
        app = app.slice(0, insertAt) + "\n" + line + app.slice(insertAt);
      } else {
        app = line + "\n" + app;
      }
    }
  }

  const routesToAdd = [
    `<Route path="/driver/dashboard" element={<DriverDashboard />} />`,
    `<Route path="/driver/jobs/:id" element={<DriverJobDetail />} />`,
  ];

  for (const route of routesToAdd) {
    if (!app.includes(route)) {
      const routesClose = app.lastIndexOf("</Routes>");
      if (routesClose !== -1) {
        app = app.slice(0, routesClose) + `        ${route}\n` + app.slice(routesClose);
      } else {
        console.warn("Routes block not found. Add manually:", route);
      }
    }
  }

  fs.writeFileSync(appPath, app);
  console.log("updated src/App.tsx");
} else {
  console.warn("src/App.tsx not found. Add routes manually:");
  console.warn(`import DriverDashboard from "./driver/pages/DriverDashboard";`);
  console.warn(`import DriverJobDetail from "./driver/pages/DriverJobDetail";`);
  console.warn(`<Route path="/driver/dashboard" element={<DriverDashboard />} />`);
  console.warn(`<Route path="/driver/jobs/:id" element={<DriverJobDetail />} />`);
}

fs.rmSync(patchRoot, { recursive: true, force: true });
console.log("Driver Pro patch applied.");
