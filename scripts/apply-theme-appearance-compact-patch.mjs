import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function exists(p) { return fs.existsSync(p); }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, c) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c, 'utf8'); }
function copyDir(src, dest) {
  if (!exists(src)) return;
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, item.name);
    const d = path.join(dest, item.name);
    if (item.isDirectory()) copyDir(s, d);
    else { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); }
  }
}
function patchFile(file, fn) {
  const p = path.join(root, file);
  if (!exists(p)) return false;
  const before = read(p);
  const after = fn(before);
  if (after !== before) write(p, after);
  return after !== before;
}

copyDir(path.join(patchRoot, 'src'), path.join(root, 'src'));

// CSS import
patchFile('src/main.tsx', (content) => {
  if (content.includes('advanced-theme-studio.css')) return content;
  const importLine = "import './styles/advanced-theme-studio.css';\n";
  if (content.includes("import './index.css'")) return content.replace("import './index.css';", "import './index.css';\n" + importLine.trim());
  if (content.includes('import "./index.css"')) return content.replace('import "./index.css";', 'import "./index.css";\n' + importLine.trim());
  return importLine + content;
});
patchFile('src/index.css', (content) => {
  if (content.includes('advanced-theme-studio.css')) return content;
  return content + "\n@import './styles/advanced-theme-studio.css';\n";
});

// App route
patchFile('src/App.tsx', (content) => {
  let next = content;
  if (!next.includes('admin/pages/Appearance') && !next.includes('./admin/pages/Appearance')) {
    next = "import Appearance from './admin/pages/Appearance';\n" + next;
  }
  if (!next.includes('path="/admin/appearance"')) {
    const route = '          <Route path="/admin/appearance" element={<Appearance />} />\n';
    const adminRouteRegex = /(\s*<Route\s+path="\/admin\/settings"[^\n]*\n)/;
    if (adminRouteRegex.test(next)) next = next.replace(adminRouteRegex, `$1${route}`);
    else {
      const routesClose = next.lastIndexOf('</Routes>');
      if (routesClose !== -1) next = next.slice(0, routesClose) + route + next.slice(routesClose);
    }
  }
  return next;
});

// Header mode toggle
patchFile('src/components/Layout.tsx', (content) => {
  let next = content;
  if (!next.includes('ThemeModeToggle')) {
    next = "import ThemeModeToggle from './ThemeModeToggle';\n" + next;
  }
  if (!next.includes('<ThemeModeToggle')) {
    const insertions = [
      { find: '<MiniCart', value: '<ThemeModeToggle />\n            <MiniCart' },
      { find: '<Link to="/cart"', value: '<ThemeModeToggle />\n            <Link to="/cart"' },
      { find: '<ShoppingCart', value: '<ThemeModeToggle />\n            <ShoppingCart' }
    ];
    let applied = false;
    for (const item of insertions) {
      if (next.includes(item.find)) { next = next.replace(item.find, item.value); applied = true; break; }
    }
    if (!applied) {
      const headerClose = next.indexOf('</header>');
      if (headerClose !== -1) next = next.slice(0, headerClose) + '\n            <ThemeModeToggle />\n' + next.slice(headerClose);
    }
  }
  // add recognizable class/attr to header if simple header tag exists
  next = next.replace(/<header(?![^>]*(data-carrtell-header|className=))/m, '<header data-carrtell-header="true"');
  return next;
});

// Quick links, if file exists
const quickLinkCandidates = [
  'src/admin/pages/QuickLinks.tsx',
  'src/admin/pages/AdminQuickLinks.tsx',
  'src/admin/pages/QuickLinksPage.tsx'
];
for (const file of quickLinkCandidates) {
  patchFile(file, (content) => {
    if (content.includes('/admin/appearance')) return content;
    const item = `\n  { title: 'ظاهر سایت', path: '/admin/appearance', description: 'تم‌های آماده، فونت‌ها و حالت روشن/تاریک' },`;
    if (content.includes('const quickLinks = [')) return content.replace('const quickLinks = [', 'const quickLinks = [' + item);
    if (content.includes('quickLinks = [')) return content.replace('quickLinks = [', 'quickLinks = [' + item);
    return content;
  });
}

// Sidebar link candidates
const sidebarCandidates = [
  'src/admin/AdminLayout.tsx',
  'src/admin/components/AdminLayout.tsx',
  'src/admin/components/Sidebar.tsx',
  'src/components/AdminLayout.tsx'
];
for (const file of sidebarCandidates) {
  patchFile(file, (content) => {
    if (content.includes('/admin/appearance')) return content;
    const link = `\n        <NavLink to="/admin/appearance" className={({ isActive }) => isActive ? 'active' : ''}>ظاهر سایت</NavLink>`;
    if (content.includes('</nav>')) return content.replace('</nav>', link + '\n      </nav>');
    return content;
  });
}

console.log('Carrtell Theme Appearance + Compact Header patch applied.');
