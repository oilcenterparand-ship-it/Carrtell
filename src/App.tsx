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
import Technicians from './admin/pages/Technicians';
import ServiceFleet from './admin/pages/ServiceFleet';
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
import { useLayoutEffect } from 'react';
import CarrtellPageLoader from './components/CarrtellPageLoader';
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
import IndustrialProductsPage from './pages/IndustrialProductsPage';
import CategoryJourneyPage from './pages/CategoryJourneyPage';
import BookPage from './pages/BookPage';
import DashboardPage from './pages/DashboardPage';
import InvestorPage from './pages/InvestorPage';
import PackageListPage from './pages/PackageListPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import ServicePaymentPage from './pages/ServicePaymentPage';
import DownloadsPage from './pages/DownloadsPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import InvoicePage from './pages/InvoicePage';
import ReviewPage from './pages/ReviewPage';
import DriverLoginPage from './pages/DriverLoginPage';
import AdminLayout from './admin/layouts/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
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
import ServiceOperationsBoard from './admin/pages/ServiceOperationsBoard';
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
import Finance from './admin/pages/Finance';
import Suppliers from './admin/pages/Suppliers';
import Purchases from './admin/pages/Purchases';
import InvestorReport from './admin/pages/InvestorReport';
import Branches from './admin/pages/Branches';
import Diagnostics from './admin/pages/Diagnostics';


function ScrollToTop() {
  const location = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const reset = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    reset();
    const frame = window.requestAnimationFrame(reset);
    return () => window.cancelAnimationFrame(frame);
  }, [location.key, location.pathname, location.search]);

  return null;
}
function SiteLayout() {
  const location = useLocation();
  const isMobileStandalone = location.pathname === '/book' || location.pathname.startsWith('/service-payment/') || location.pathname === '/dashboard';
  const hideStoreHeader = location.pathname === '/dashboard';
  return <div className={isMobileStandalone ? 'ct-mobile-standalone-route' : ''}><SeoManager />{!hideStoreHeader && <Header />}<div className="ct-site-content"><Outlet /></div><Footer /><WhatsAppButton /><MobileBottomNav /></div>;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <CarrtellPageLoader />
      <AdminHealthButton />
      <div className="ct-app-shell min-h-screen font-vazir">
        <AdminRouteGuard>
          <GlobalRouteGuard>
            <Routes>
              <Route path="/login-otp" element={<OtpLoginPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/setup" element={<AdminSetup />} />
              <Route path="/driver/login" element={<DriverLoginPage />} />

              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/notifications" element={<NotificationCenterPage />} />
              <Route path="/profile/support" element={<SupportPage />} />
              <Route path="/profile/wallet" element={<WalletPage />} />
              <Route path="/profile/returns" element={<ReturnsPage />} />
              <Route path="/authenticity" element={<AuthenticityCheckPage />} />
              <Route path="/report-bug" element={<ReportBugPage />} />

              <Route element={<SiteLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/shop/product/:id" element={<ProductDetailPage />} />
                <Route path="/industrial" element={<IndustrialProductsPage />} />
                <Route path="/categories" element={<CategoryJourneyPage />} />
                <Route path="/category/:slug" element={<CategoryJourneyPage />} />
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
                <Route path="/download" element={<DownloadsPage />} />
              </Route>

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="operations-center" element={<OperationsCenter />} />
                <Route path="dispatch" element={<AdminDispatch />} />
                <Route path="service-operations" element={<ServiceOperationsBoard />} />
                <Route path="service-requests" element={<AdminServiceRequests />} />
                <Route path="technicians" element={<Technicians />} />
                <Route path="service-fleet" element={<ServiceFleet />} />
                <Route path="service-booking-settings" element={<AdminServiceBookingSettings />} />
                <Route path="service-catalog" element={<AdminServiceCatalog />} />
                <Route path="branches" element={<Branches />} />

                <Route path="orders" element={<AdminOrders />} />
                <Route path="phone-order" element={<PhoneOrder />} />
                <Route path="payment-settings" element={<PaymentSettings />} />

                <Route path="products" element={<AdminProducts />} />
                <Route path="inventory" element={<InventoryPro />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="packages" element={<AdminPackages />} />
                <Route path="cars" element={<AdminCars />} />
                <Route path="oil-specs" element={<AdminOilSpecs />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="purchases" element={<Purchases />} />

                <Route path="customers-crm" element={<CustomersCRM />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="notifications" element={<NotificationsAdminPage />} />
                <Route path="returns" element={<AdminReturns />} />
                <Route path="authenticity" element={<AdminAuthenticity />} />
                <Route path="loyalty" element={<LoyaltyAdminPage />} />
                <Route path="sms-logs" element={<AdminSmsLogs />} />

                <Route path="home-content" element={<AdminHomeContent />} />
                <Route path="campaigns" element={<CampaignsAdminPage />} />
                <Route path="discounts" element={<AdminDiscountsCampaignsPage />} />
                <Route path="smart-sales" element={<SmartSales />} />
                <Route path="blog" element={<BlogAdminPage />} />
                <Route path="seo" element={<SeoSettings />} />
                <Route path="appearance" element={<Appearance />} />

                <Route path="finance" element={<Finance />} />
                <Route path="investor-report" element={<InvestorReport />} />

                <Route path="admin-accounts" element={<AdminAccounts />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="staff" element={<Staff />} />
                <Route path="roles" element={<Roles />} />
                <Route path="audit-logs" element={<AuditLogs />} />

                <Route path="settings" element={<SystemSettingsCenter />} />
                <Route path="sms-settings" element={<SmsSettings />} />
                <Route path="system-health" element={<SystemHealth />} />
                <Route path="diagnostics" element={<Diagnostics />} />
                <Route path="navigation-audit" element={<AdminNavigationAudit />} />
                <Route path="bug-reports" element={<BugReports />} />
                <Route path="quick-links" element={<AdminQuickLinks />} />
                <Route path="route-registry" element={<AdminRouteRegistry />} />
              </Route>

              <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />
              <Route path="/driver/dashboard" element={<DriverDashboard />} />
              <Route path="/driver/jobs/:id" element={<DriverJobDetail />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Routes>
          </GlobalRouteGuard>
        </AdminRouteGuard>
      </div>
    </Router>
  );
}

export default App;
