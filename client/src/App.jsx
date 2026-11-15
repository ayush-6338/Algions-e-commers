import { Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import GuestRoute from './routes/GuestRoute.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';
import Layout from './components/layout/Layout.jsx';
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages.jsx';
import ShopPage from './pages/ShopPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import Home from './pages/Home.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ProfileAddressesPage from './pages/ProfileAddressesPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';

function ComingSoon({ title }) {
  return <section className="mx-auto max-w-2xl rounded-3xl bg-white px-6 py-14 text-center shadow-sm"><p className="text-xs uppercase tracking-[.2em] text-sky-700">SkyKart</p><h1 className="mt-2 text-3xl font-medium">{title}</h1><p className="mt-3 text-stone-600">Coming soon.</p><Link to="/shop" className="mt-6 inline-block rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Continue shopping</Link></section>;
}

function AppRoutes() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="shop" element={<ShopPage />} />
    <Route path="products/:slug" element={<ProductDetailPage />} />
    <Route element={<GuestRoute />}>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password/:token" element={<ResetPasswordPage />} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route path="cart" element={<CartPage />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="orders" element={<MyOrdersPage />} />
      <Route path="orders/:id/confirmation" element={<OrderConfirmationPage />} />
      <Route path="orders/:id" element={<OrderDetailPage />} />
      <Route path="profile" element={<ProfileAddressesPage />} />
      <Route element={<AdminRoute />}><Route path="admin" element={<ComingSoon title="Admin Dashboard" />} /></Route>
    </Route>
    <Route path="*" element={<ComingSoon title="Page not found" />} />
  </Route></Routes>;
}

export default function App() {
  return <AuthProvider><CartProvider><AppRoutes /></CartProvider></AuthProvider>;
}
