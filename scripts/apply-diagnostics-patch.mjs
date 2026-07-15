import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'src', 'App.tsx');
const routesPath = path.join(root, 'src', 'admin', 'hooks', 'useAdminRoutes.ts');
const sidebarPath = path.join(root, 'src', 'admin', 'components', 'Sidebar.tsx');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8');
}

function ensureFile(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`File not found: ${path.relative(root, file)}`);
  }
}

function patchApp() {
  ensureFile(appPath);
  let source = read(appPath);

  if (!source.includes("./admin/pages/Diagnostics")) {
    const marker = /import\s+AdminSettings\s+from\s+['"]\.\/admin\/pages\/Settings['"];?/;
    if (marker.test(source)) {
      source = source.replace(marker, (match) => `${match}\nimport AdminDiagnostics from './admin/pages/Diagnostics';`);
    } else {
      const lastAdminImport = [...source.matchAll(/import\s+Admin\w+\s+from\s+['"]\.\/admin\/pages\/[^'"]+['"];?/g)].pop();
      if (lastAdminImport) {
        const index = lastAdminImport.index + lastAdminImport[0].length;
        source = `${source.slice(0, index)}\nimport AdminDiagnostics from './admin/pages/Diagnostics';${source.slice(index)}`;
      } else {
        source = `import AdminDiagnostics from './admin/pages/Diagnostics';\n${source}`;
      }
    }
  }

  if (!source.includes('path="diagnostics"')) {
    const settingsRoute = /<Route\s+path="settings"\s+element=\{<AdminSettings\s*\/>\}\s*\/>/;
    if (settingsRoute.test(source)) {
      source = source.replace(settingsRoute, `<Route path="diagnostics" element={<AdminDiagnostics />} />\n            $&`);
    } else {
      const adminRouteEnd = /(<\/Route>\s*\n\s*<\/Routes>)/;
      source = source.replace(adminRouteEnd, `            <Route path="diagnostics" element={<AdminDiagnostics />} />\n          $1`);
    }
  }

  write(appPath, source);
}

function patchAdminRoutes() {
  if (!fs.existsSync(routesPath)) return;
  let source = read(routesPath);

  if (!source.includes("| 'diagnostics'")) {
    source = source.replace("| 'settings'", "| 'diagnostics' | 'settings'");
  }

  if (!source.includes("/admin/diagnostics")) {
    const settingsItem = /\{\s*path:\s*['"]\/admin\/settings['"],\s*label:\s*['"][^'"]+['"],\s*icon:\s*['"]settings['"]\s*\}/;
    if (settingsItem.test(source)) {
      source = source.replace(settingsItem, `{ path: '/admin/diagnostics', label: 'تست سلامت', icon: 'diagnostics' },\n      $&`);
    } else {
      source = source.replace(/\]\s*,\s*\n\s*\[\]\s*\)/, `      { path: '/admin/diagnostics', label: 'تست سلامت', icon: 'diagnostics' },\n    ],\n    []\n  )`);
    }
  }

  write(routesPath, source);
}

function patchSidebar() {
  if (!fs.existsSync(sidebarPath)) return;
  let source = read(sidebarPath);

  if (source.includes('lucide-react') && !source.includes('Activity')) {
    source = source.replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/, (match, icons) => {
      return `import {${icons.trim()}, Activity } from 'lucide-react';`;
    });
  }

  if (!source.includes("| 'diagnostics'")) {
    source = source.replace("| 'settings'", "| 'diagnostics' | 'settings'");
  }

  if (!source.includes('diagnostics:')) {
    source = source.replace(/(\s+users:\s*Users,\n)/, `$1  diagnostics: Activity,\n`);
  }

  write(sidebarPath, source);
}

patchApp();
patchAdminRoutes();
patchSidebar();

console.log('Carrtell diagnostics route patched successfully.');
