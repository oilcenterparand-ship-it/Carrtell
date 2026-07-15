import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/Layout';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import BookPage from './pages/BookPage';
import DashboardPage from './pages/DashboardPage';
import InvestorPage from './pages/InvestorPage';
import PackageListPage from './pages/PackageListPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import InvoicePage from './pages/InvoicePage';
import ReviewPage from './pages/ReviewPage';
import DriverPage from './pages/DriverPage';
import AdminLayout from './admin/layouts/AdminLayout';
import AdminDashboard from './admin/pages/Dashboard';
import AdminProducts from './admin/pages/Products';
import AdminPackages from './admin/pages/Packages';
import AdminCars from './admin/pages/Cars';
import AdminUsers from './admin/pages/Users';
import AdminSettings from './admin/pages/Settings';
import AdminCategories from './admin/pages/Categories';
import AdminOilSpecs from './admin/pages/OilSpecs';
import AdminHomeContent from './admin/pages/HomeContent';
import AdminBrands from './admin/pages/Brands';
import AdminOrders from './admin/pages/Orders';
import AdminReviews from './admin/pages/Reviews';
import AdminSmsLogs from './admin/pages/SmsLogs';
import AdminServiceRequests from './admin/pages/ServiceRequests';
import AdminPaymentSettings from './admin/pages/PaymentSettings';

function SiteLayout() {
  return <><Header /><Outlet /><Footer /><WhatsAppButton /></>;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-navy-950 text-white font-vazir">
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/product/:id" element={<ProductDetailPage />} />
            <Route path="/package-categories/:categoryId" element={<PackageListPage />} />
            <Route path="/shop/packages/:carId" element={<PackageListPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/invoice/:orderId" element={<InvoicePage />} />
            <Route path="/review/:orderId" element={<ReviewPage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<DashboardPage />} />
            <Route path="/investor" element={<InvestorPage />} />
            <Route path="/driver" element={<DriverPage />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="sms-logs" element={<AdminSmsLogs />} />
            <Route path="service-requests" element={<AdminServiceRequests />} />
            <Route path="payment-settings" element={<AdminPaymentSettings />} />
            <Route path="oil-specs" element={<AdminOilSpecs />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="home-content" element={<AdminHomeContent />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="cars" element={<AdminCars />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
