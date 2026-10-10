import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AdminLayout from "./components/AdminLayout";
import AdminRoute from "./components/AdminRoute";
import CustomerRoute from "./components/CustomerRoute";
import PageMotion from "./components/motion/PageMotion";
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
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderDetails from "./pages/OrderDetails";
import Orders from "./pages/Orders";
import ProductDetails from "./pages/ProductDetails";
import Register from "./pages/Register";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Shop from "./pages/Shop";
import VisionMission from "./pages/VisionMission";
import Vidyagyan from "./pages/Vidyagyan";
import Contact from "./pages/Contact";
import Donation from "./pages/Donation";

import { useAuth } from "./context/AuthContext";
import Gallery from "./pages/Gallery";




function GreenCoreScrollAnimations() {
  useEffect(() => {
    const root = document.querySelector(".greencore-route-page");

    if (!root) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      return;
    }

    /*
     * These are intentionally broad enough to work across the existing
     * GreenCore pages without requiring every page to be rewritten.
     */
    const selectors = [
      "section",
      "article",
      ".card",
      ".product-card",
      ".category-card",
      ".shop-card",
      ".gallery-card",
      ".team-card",
      ".feature-card",
      ".impact-card",
      ".mission-card",
      ".vision-card",
      ".contact-card",
      ".calculator-card",
      ".stat-card",
      ".info-card",
      ".faq-item",
      ".testimonial-card",
      ".product-detail-card",
      ".checkout-card",
      ".account-card",
      ".order-card",
      ".admin-card",
    ];

    const elements = Array.from(
      root.querySelectorAll<HTMLElement>(selectors.join(","))
    ).filter((element): element is HTMLElement => {
      if (element.closest("nav, footer")) {
        return false;
      }

      if (element.dataset.motionReady === "true") {
        return false;
      }

      return true;
    });

    /*
     * Prevent nested sections/cards from creating an excessive amount
     * of animation. Only animate the meaningful visible elements.
     */
    const visibleCandidates = elements.filter((element) => {
      const rect = element.getBoundingClientRect();

      return rect.width > 80 && rect.height > 30;
    });

    visibleCandidates.forEach((element, index) => {
      element.dataset.motionReady = "true";
      element.classList.add("gc-scroll-reveal");

      /*
       * Alternate directions to create a more cinematic/futuristic
       * vertical rhythm.
       */
      if (index % 4 === 1) {
        element.classList.add("gc-reveal-from-top");
      } else if (index % 4 === 2) {
        element.classList.add("gc-reveal-from-right");
      } else if (index % 4 === 3) {
        element.classList.add("gc-reveal-from-left");
      } else {
        element.classList.add("gc-reveal-from-bottom");
      }

      element.style.setProperty(
        "--gc-reveal-delay",
        `${Math.min(index % 5, 4) * 55}ms`
      );
    });

    /*
     * Text inside major sections gets a smaller staggered reveal.
     */
    const textElements = Array.from(
      root.querySelectorAll<HTMLElement>(
        "h1, h2, h3, h4, .section-title, .hero-title, .hero-subtitle"
      )
    ).filter((element): element is HTMLElement => {
      if (element.closest("nav, footer")) {
        return false;
      }

      if (element.dataset.textMotionReady === "true") {
        return false;
      }

      return true;
    });

    textElements.forEach((element, index) => {
      element.dataset.textMotionReady = "true";
      element.classList.add("gc-text-reveal");

      element.style.setProperty(
        "--gc-text-delay",
        `${Math.min(index % 4, 3) * 70}ms`
      );
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("gc-is-visible");

          /*
           * Once revealed, stop observing it.
           * This prevents the page from repeatedly flashing while scrolling.
           */
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.10,
        rootMargin: "0px 0px -7% 0px",
      }
    );

    visibleCandidates.forEach((element) => observer.observe(element));
    textElements.forEach((element) => observer.observe(element));

    /*
     * Hero content should appear immediately instead of waiting for
     * the user to scroll.
     */
    root
      .querySelectorAll(
        ".hero, .home-hero, .shop-hero, .page-hero, .auth-page"
      )
      .forEach((hero) => {
        if (hero instanceof HTMLElement) {
          hero.classList.add("gc-hero-ready");
        }
      });

    return () => {
      observer.disconnect();

      visibleCandidates.forEach((element) => {
        element.classList.remove(
          "gc-scroll-reveal",
          "gc-reveal-from-top",
          "gc-reveal-from-right",
          "gc-reveal-from-left",
          "gc-reveal-from-bottom",
          "gc-is-visible"
        );

        delete element.dataset.motionReady;
        element.style.removeProperty("--gc-reveal-delay");
      });

      textElements.forEach((element) => {
        element.classList.remove("gc-text-reveal");
        delete element.dataset.textMotionReady;
        element.style.removeProperty("--gc-text-delay");
      });
    };
  }, []);

  return null;
}

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

      <GreenCoreScrollAnimations />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname + location.search}
          className="greencore-route-page"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.32,
            ease: "easeInOut",
          }}
        >

      <Routes>
        {/* =====================================================
            ADMIN APPLICATION
            ===================================================== */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<PageMotion><AdminDashboard /></PageMotion>} />
            <Route path="/admin/products" element={<PageMotion><AdminProducts /></PageMotion>} />
            <Route path="/admin/inventory" element={<PageMotion><AdminInventory /></PageMotion>} />
            <Route path="/admin/orders" element={<PageMotion><AdminOrders /></PageMotion>} />
            <Route path="/admin/customers" element={<PageMotion><AdminCustomers /></PageMotion>} />
            <Route path="/admin/payments" element={<PageMotion><AdminPayments /></PageMotion>} />
            <Route path="/admin/shipments" element={<PageMotion><AdminShipments /></PageMotion>} />
            <Route path="/admin/settings" element={<PageMotion><AdminSettings /></PageMotion>} />
          </Route>
        </Route>

        {/* =====================================================
            CUSTOMER APPLICATION
            ===================================================== */}
        <Route path="/" element={<PageMotion><Home /></PageMotion>} />
        <Route path="/shop" element={<PageMotion><Shop /></PageMotion>} />
        <Route path="/donate" element={<PageMotion><Donation /></PageMotion>} />
        <Route path="/calculator" element={<PageMotion><Calculator /></PageMotion>} />
        <Route path="/vision-mission" element={<PageMotion><VisionMission /></PageMotion>} />
        <Route path="/vidyagyan" element={<PageMotion><Vidyagyan /></PageMotion>} />
        <Route path="/cart" element={<PageMotion><Cart /></PageMotion>} />

        <Route element={<CustomerRoute />}>
          <Route path="/checkout" element={<PageMotion><Checkout /></PageMotion>} />
          <Route path="/account" element={<PageMotion><Account /></PageMotion>} />
          <Route path="/account/orders" element={<PageMotion><Orders /></PageMotion>} />
          <Route
            path="/account/orders/:orderId"
            element={<PageMotion><OrderDetails /></PageMotion>}
          />
          <Route
            path="/order-confirmation/:orderId"
            element={<PageMotion><OrderConfirmation /></PageMotion>}
          />
        </Route>

        <Route path="/login" element={<PageMotion><Login /></PageMotion>} />
        <Route path="/register" element={<PageMotion><Register /></PageMotion>} />
        <Route path="/terms" element={<PageMotion><Terms /></PageMotion>} />
        <Route path="/privacy" element={<PageMotion><Privacy /></PageMotion>} />
        <Route path="/product/:slug" element={<PageMotion><ProductDetails /></PageMotion>} />

        <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/contact" element={<PageMotion><Contact /></PageMotion>} />
        <Route path="/gallery" element={<PageMotion><Gallery /></PageMotion>} />
</Routes>
        </motion.div>
      </AnimatePresence>

      {showCustomerChrome && <Footer />}
    </>
  );
}

export default App;
