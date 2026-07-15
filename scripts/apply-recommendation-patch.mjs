import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function file(rel) { return path.join(root, rel); }
function read(rel) { return fs.existsSync(file(rel)) ? fs.readFileSync(file(rel), 'utf8') : ''; }
function write(rel, content) { fs.writeFileSync(file(rel), content); }

function patchApp() {
  const rel = 'src/App.tsx';
  let s = read(rel);
  if (!s) return console.warn('App.tsx پیدا نشد. Route را دستی اضافه کن.');

  if (!s.includes("./pages/MyCarProductsPage")) {
    s = s.replace(/import ProductDetailPage from '.\/pages\/ProductDetailPage';\n/, (m) => `${m}import MyCarProductsPage from './pages/MyCarProductsPage';\n`);
    if (!s.includes("./pages/MyCarProductsPage")) {
      s = s.replace(/import ShopPage from '.\/pages\/ShopPage';\n/, (m) => `${m}import MyCarProductsPage from './pages/MyCarProductsPage';\n`);
    }
  }

  if (!s.includes("./admin/pages/RecommendationSettings")) {
    s = s.replace(/import AdminPaymentSettings from '.\/admin\/pages\/PaymentSettings';\n/, (m) => `${m}import AdminRecommendationSettings from './admin/pages/RecommendationSettings';\n`);
    if (!s.includes("./admin/pages/RecommendationSettings")) {
      s = s.replace(/import AdminSettings from '.\/admin\/pages\/Settings';\n/, (m) => `${m}import AdminRecommendationSettings from './admin/pages/RecommendationSettings';\n`);
    }
  }

  if (!s.includes('path="/my-car/products"')) {
    s = s.replace(/<Route path="\/shop" element={<ShopPage \/>} \/>\n/, (m) => `${m}            <Route path="/my-car/products" element={<MyCarProductsPage />} />\n`);
  }

  if (!s.includes('path="recommendations"')) {
    s = s.replace(/<Route path="settings" element={<AdminSettings \/>} \/>\n/, (m) => `            <Route path="recommendations" element={<AdminRecommendationSettings />} />\n${m}`);
    if (!s.includes('path="recommendations"')) {
      s = s.replace(/<Route path="payment-settings" element={<AdminPaymentSettings \/>} \/>\n/, (m) => `${m}            <Route path="recommendations" element={<AdminRecommendationSettings />} />\n`);
    }
  }

  write(rel, s);
  console.log('App.tsx patch شد.');
}

function patchAdminRoutes() {
  const rel = 'src/admin/hooks/useAdminRoutes.ts';
  let s = read(rel);
  if (!s) return console.warn('useAdminRoutes.ts پیدا نشد. منوی ادمین را دستی اضافه کن.');
  if (s.includes("/admin/recommendations")) return console.log('منوی پیشنهادها قبلاً وجود دارد.');
  s = s.replace(/\{ path: '\/admin\/settings', label: 'تنظیمات', icon: 'settings' \},\n/, "      { path: '/admin/recommendations', label: 'پیشنهاد هوشمند', icon: 'settings' },\n      { path: '/admin/settings', label: 'تنظیمات', icon: 'settings' },\n");
  write(rel, s);
  console.log('useAdminRoutes.ts patch شد.');
}

patchApp();
patchAdminRoutes();
console.log('Carrtell recommendation patch applied.');
