import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchRoot = path.join(root, '__patch__');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function patchApp() {
  const appPath = path.join(root, 'src', 'App.tsx');
  if (!fs.existsSync(appPath)) return;
  let app = fs.readFileSync(appPath, 'utf8');
  if (!app.includes('BlogPage')) {
    app = app.replace(/import\s+/, "import BlogPage from './pages/BlogPage';\nimport BlogPostPage from './pages/BlogPostPage';\nimport ");
  }
  if (!app.includes('BlogAdminPage')) {
    app = app.replace(/import\s+/, "import BlogAdminPage from './admin/pages/Blog';\nimport ");
  }
  if (!app.includes('path="/blog"')) {
    app = app.replace(/<Routes>/, '<Routes>\n        <Route path="/blog" element={<BlogPage />} />\n        <Route path="/blog/:slug" element={<BlogPostPage />} />');
  }
  if (!app.includes('path="/admin/blog"')) {
    app = app.replace(/<Routes>/, '<Routes>\n        <Route path="/admin/blog" element={<BlogAdminPage />} />');
  }
  fs.writeFileSync(appPath, app);
}

function patchQuickLinks() {
  const candidates = [
    path.join(root, 'src', 'admin', 'pages', 'QuickLinks.tsx'),
    path.join(root, 'src', 'admin', 'pages', 'AdminQuickLinks.tsx'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    let src = fs.readFileSync(file, 'utf8');
    if (src.includes('/admin/blog')) return;
    src = src.replace(/(\[\s*)/, `$1\n  { title: 'مدیریت مقالات', path: '/admin/blog', group: 'محتوا', icon: '📝' },\n  { title: 'مجله آموزشی سایت', path: '/blog', group: 'عمومی', icon: '📚' },`);
    fs.writeFileSync(file, src);
    return;
  }
}

copyDir(patchRoot, root);
patchApp();
patchQuickLinks();
console.log('✅ Blog / Content CMS patch applied. Run docs/sql/2026_blog_content_cms.sql in Supabase.');
