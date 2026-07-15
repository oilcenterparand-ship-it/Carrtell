import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8');
}

function findFiles(dir, names = []) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...findFiles(full, names));
    else if (names.length === 0 || names.some((n) => item.toLowerCase().includes(n.toLowerCase()))) out.push(full);
  }
  return out;
}

function addImport(content) {
  if (content.includes('AdminHealthShortcuts')) return content;
  return `import AdminHealthShortcuts from '../components/AdminHealthShortcuts';\n` + content;
}

function injectInQuickLinks(file) {
  let content = read(file);
  if (!content || content.includes('<AdminHealthShortcuts')) return false;
  const rel = path.relative(path.dirname(file), path.join(root, 'src/admin/components/AdminHealthShortcuts')).replace(/\\/g, '/');
  const importPath = rel.startsWith('.') ? rel : './' + rel;
  content = `import AdminHealthShortcuts from '${importPath}';\n` + content;

  // Put the shortcut immediately after the first return wrapper when possible.
  const patterns = [
    /return\s*\(\s*<([^>]+)>/,
    /return\s*\(\s*<>/,
  ];
  let injected = false;
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const insertAt = match.index + match[0].length;
      content = content.slice(0, insertAt) + `\n      <AdminHealthShortcuts />\n` + content.slice(insertAt);
      injected = true;
      break;
    }
  }

  if (!injected) {
    content += `\n\n// Carrtell health shortcuts component is available at src/admin/components/AdminHealthShortcuts.tsx\n`;
  }
  write(file, content);
  return true;
}

function injectSidebarLink(file) {
  let content = read(file);
  if (!content || content.includes('/admin/navigation-audit')) return false;

  const linkBlock = `
        <Link to="/admin/navigation-audit" className="admin-nav-link">
          🛠 تست سلامت مسیرها
        </Link>`;

  // Try inserting before closing nav if it exists.
  if (content.includes('</nav>')) {
    content = content.replace('</nav>', `${linkBlock}\n      </nav>`);
    write(file, content);
    return true;
  }

  // Try adding to common menu arrays.
  const arrayPatterns = [/const\s+adminLinks\s*=\s*\[/, /const\s+menuItems\s*=\s*\[/, /const\s+navigation\s*=\s*\[/];
  for (const p of arrayPatterns) {
    const match = content.match(p);
    if (match) {
      const insertAt = match.index + match[0].length;
      content = content.slice(0, insertAt) + `\n  { label: 'تست سلامت مسیرها', title: 'تست سلامت مسیرها', href: '/admin/navigation-audit', to: '/admin/navigation-audit', icon: '🛠' },` + content.slice(insertAt);
      write(file, content);
      return true;
    }
  }

  return false;
}

copyRecursive(patchRoot, root);

let quickLinksPatched = false;
const adminPages = findFiles(path.join(root, 'src/admin'), ['quick', 'links', 'dashboard']);
for (const file of adminPages) {
  const content = read(file);
  if (/quick|links|داسترسی|دسترسی|dashboard|داشبورد/i.test(file + content)) {
    if (injectInQuickLinks(file)) {
      quickLinksPatched = true;
      break;
    }
  }
}

let sidebarPatched = false;
const layoutFiles = findFiles(path.join(root, 'src'), ['layout', 'sidebar', 'admin']);
for (const file of layoutFiles) {
  const content = read(file);
  if (content.includes('/admin') && (content.includes('Link') || content.includes('NavLink'))) {
    if (injectSidebarLink(file)) {
      sidebarPatched = true;
      break;
    }
  }
}

console.log('✅ Carrtell Admin Health Shortcut patch applied.');
console.log(`QuickLinks/Dashboard card: ${quickLinksPatched ? 'patched' : 'component copied, manual placement may be needed'}`);
console.log(`Sidebar link: ${sidebarPatched ? 'patched' : 'not detected; use /admin/quick-links'}`);
console.log('Test: /admin/navigation-audit');
