import SeoManager from './components/seo/SeoManager';
import OtpLoginPage from './pages/OtpLoginPage';
import SmsSettings from './admin/pages/SmsSettings';
import InventoryPro from './admin/pages/InventoryPro';
import RouteRegistryPage from './pages/RouteRegistryPage';
import ReportBugPage from './pages/ReportBugPage';

import QuickLinks from './admin/pages/QuickLinks';
import BugReports from './admin/pages/BugReports';

import SmartSales from './admin/pages/SmartSales';
import SystemHealth from './admin/pages/SystemHealth';
import Appearance from './admin/pages/Appearance';
import Staff from './admin/pages/Staff';
import Roles from './admin/pages/Roles';
import CustomersCRM from './admin/pages/CustomersCRM';
import AdminAuthenticity from './admin/pages/Authenticity';
import AdminReturns from './admin/pages/Returns';
import AuthenticityCheckPage from './pages/AuthenticityCheckPage';
import ReturnsPage from './pages/profile/ReturnsPage';
import SeoSettings from './admin/pages/SeoSettings';
import SystemSettingsCenter from './admin/pages/SystemSettingsCenter';
import BlogAdminPage from './admin/pages/Blog';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import AdminSupport from "./admin/pages/Support";
import NotificationCenterPage from './pages/NotificationCenterPage';
import NotificationsAdminPage from './admin/pages/Notifications';
import SupportPage from "./pages/SupportPage";
import LoyaltyAdminPage from './admin/pages/Loyalty';
import WalletPage from './pages/WalletPage';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import GlobalRouteGuard from './auth/GlobalRouteGuard';
import AdminRouteGuard from './admin/auth/AdminRouteGuard';
import AdminLogin from './admin/pages/AdminLogin';
import AdminSetup from './admin/pages/AdminSetup';
import AdminAccounts from './admin/pages/AdminAccounts';
import UnauthorizedPage from './pages/UnauthorizedPage';
import Header from './components/Layout';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import MobileBottomNav from './components/MobileBottomNav';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import StoreCollectionPage from './pages/StoreCollectionPage';
import ProductDetailPage from './pages/ProductDetailPage';
import BookPage from './pages/BookPage';
import DashboardPage from './pages/DashboardPage';
import InvestorPage from './pages/InvestorPage';
import PackageListPage from './pages/PackageListPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import ServicePaymentPage from './pages/ServicePaymentPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
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
import AdminQuickLinks from './admin/pages/AdminQuickLinks';
import AdminSmsLogs from './admin/pages/SmsLogs';
import AdminServiceRequests from './admin/pages/ServiceRequests';
import AdminServiceBookingSettings from './admin/pages/ServiceBookingSettings';
import AdminServiceCatalog from './admin/pages/ServiceCatalog';
import OperationsCenter from './admin/pages/OperationsCenter';
import PhoneOrder from './admin/pages/PhoneOrder';
import AdminDispatch from './admin/pages/Dispatch';
import AdminPaymentSettings from './admin/pages/PaymentSettings';
import DriverDashboard from "./driver/pages/DriverDashboard";
import DriverJobDetail from "./driver/pages/DriverJobDetail";
import AuditLogs from './admin/pages/AuditLogs';
import AdminNavigationAudit from './admin/pages/AdminNavigationAudit';

import AdminHealthButton from './admin/components/AdminHealthButton';
import AdminRouteRegistry from './admin/pages/AdminRouteRegistry';

import CampaignsAdminPage from './pages/CampaignsAdminPage';
import AdminDiscountsCampaignsPage from './pages/AdminDiscountsCampaignsPage';
import PaymentSettings from './admin/pages/PaymentSettings';

function SiteLayout() {
  const location = useLocation();
  const isMobileStandalone = location.pathname === '/book' || location.pathname.startsWith('/service-payment/') || (location.pathname === '/dashboard' && location.hash.includes('orders'));
  return <div className={isMobileStandalone ? 'ct-mobile-standalone-route' : ''}><SeoManager /><Header /><div className="ct-site-content"><Outlet /></div><Footer /><WhatsAppButton /><MobileBottomNav /></div>;
}

function App() {
  return (
    <Router>
      <AdminHealthButton />
      <div className="ct-app-shell min-h-screen font-vazir">
        <AdminRouteGuard>
        <GlobalRouteGuard>
        <Routes>
        <Route path="/login-otp" element={<OtpLoginPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="/admin/sms-settings" element={<SmsSettings />} />
          <Route path="/admin/discounts" element={<AdminDiscountsCampaignsPage />} />

          <Route path="/admin/navigation-audit" element={<AdminNavigationAudit />} />
          <Route path="/admin/smart-sales" element={<SmartSales />} />
        <Route path="/admin/quick-links" element={<AdminQuickLinks />} />
        <Route path="/admin/settings" element={<SystemSettingsCenter />} />
          <Route path="/admin/appearance" element={<Appearance />} />
        <Route path="/admin/seo" element={<SeoSettings />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/blog" element={<BlogAdminPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/admin/notifications" element={<NotificationsAdminPage />} />
          <Route path="/notifications" element={<NotificationCenterPage />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/profile/support" element={<SupportPage />} />
          <Route path="/admin/loyalty" element={<LoyaltyAdminPage />} />
          <Route path="/profile/wallet" element={<WalletPage />} />
          <Route element={<SiteLayout />}>
            <Route path="/" element={<ShopPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/shop" element={<Navigate to="/" replace />} />
            <Route path="/shop/product/:id" element={<ProductDetailPage />} />
            <Route path="/shop/all-products" element={<StoreCollectionPage kind="all" />} />
            <Route path="/shop/special-offers" element={<StoreCollectionPage kind="special" />} />
            <Route path="/shop/featured" element={<StoreCollectionPage kind="featured" />} />
            <Route path="/shop/packages" element={<StoreCollectionPage kind="packages" />} />
            <Route path="/package-categories/:categoryId" element={<PackageListPage />} />
            <Route path="/shop/packages/:carId" element={<PackageListPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/service-payment/:requestId" element={<ServicePaymentPage />} />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/invoice/:orderId" element={<InvoicePage />} />
            <Route path="/review/:orderId" element={<ReviewPage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/investor" element={<InvestorPage />} />
            <Route path="/driver" element={<DriverPage />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="operations-center" element={<OperationsCenter />} />
            <Route path="phone-order" element={<PhoneOrder />} />
            <Route path="quick-links" element={<AdminQuickLinks />} />
            <Route path="inventory" element={<InventoryPro />} />
            <Route path="campaigns" element={<CampaignsAdminPage />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="sms-logs" element={<AdminSmsLogs />} />
            <Route path="service-requests" element={<AdminServiceRequests />} />
            <Route path="service-booking-settings" element={<AdminServiceBookingSettings />} />
            <Route path="service-catalog" element={<AdminServiceCatalog />} />
            <Route path="dispatch" element={<AdminDispatch />} />
            <Route path="payment-settings" element={<PaymentSettings />} />
            <Route path="oil-specs" element={<AdminOilSpecs />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="home-content" element={<AdminHomeContent />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="cars" element={<AdminCars />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="admin-accounts" element={<AdminAccounts />} />
            <Route path="roles" element={<Roles />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
                <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/driver/jobs/:id" element={<DriverJobDetail />} />
          <Route path="/profile/returns" element={<ReturnsPage />} />
          <Route path="/authenticity" element={<AuthenticityCheckPage />} />
          <Route path="/admin/returns" element={<AdminReturns />} />
          <Route path="/admin/authenticity" element={<AdminAuthenticity />} />
  <Route path="/admin/customers-crm" element={<CustomersCRM />} />
          <Route path="/admin/staff" element={<Staff />} />
          <Route path="/admin/system-health" element={<SystemHealth />} />
  <Route path="/admin/bug-reports" element={<BugReports />} />
  <Route path="/report-bug" element={<ReportBugPage />} />

          <Route path="/admin/route-registry" element={<AdminRouteRegistry />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
        </GlobalRouteGuard>
        </AdminRouteGuard>
      </div>
    </Router>
  );
}

export default App;
