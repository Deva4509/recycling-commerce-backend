import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./components/AdminLayout";
import AdminRoute from "./components/AdminRoute";
import CustomerRoute from "./components/CustomerRoute";
import Footer from "./components/layout/Footer";
import Navbar from "./components/layout/Navbar";

import AdminDashboard from "./pages/AdminDashboard";
import AdminCustomers from "./pages/AdminCustomers";
import AdminInventory from "./pages/AdminInventory";
import AdminOrders from "./pages/AdminOrders";
import AdminPayments from "./pages/AdminPayments";
import AdminShipments from "./pages/AdminShipments";
import AdminSettings from "./pages/AdminSettings";
import AdminProducts from "./pages/AdminProducts";

import Account from "./pages/Account";
import Calculator from "./pages/Calculator";
import Cart from "./pages/Cart";
import Categories from "./pages/Categories";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderDetails from "./pages/OrderDetails";
import Orders from "./pages/Orders";
import ProductDetails from "./pages/ProductDetails";
import Register from "./pages/Register";
import Shop from "./pages/Shop";
import VisionMission from "./pages/VisionMission";

import { useAuth } from "./context/AuthContext";

function App() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const role = String(user?.role || "").toUpperCase();

  const isAdminSession =
    !isLoading &&
    isAuthenticated &&
    (role === "ADMIN" || role === "STAFF");

  const showCustomerChrome =
    !isLoading && !isAdminSession;

  return (
    <>
      {showCustomerChrome && <Navbar />}

      <Routes>
        {/* =====================================================
            ADMIN APPLICATION
            ===================================================== */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/shipments" element={<AdminShipments />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* =====================================================
            CUSTOMER APPLICATION
            ===================================================== */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/vision-mission" element={<VisionMission />} />
        <Route path="/cart" element={<Cart />} />

        <Route element={<CustomerRoute />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/account" element={<Account />} />
          <Route path="/account/orders" element={<Orders />} />
          <Route
            path="/account/orders/:orderId"
            element={<OrderDetails />}
          />
          <Route
            path="/order-confirmation/:orderId"
            element={<OrderConfirmation />}
          />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:slug" element={<ProductDetails />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showCustomerChrome && <Footer />}
    </>
  );
}

export default App;
