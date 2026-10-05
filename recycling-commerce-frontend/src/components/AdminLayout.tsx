import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const navigation = [
  {
    label: "Overview",
    to: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Products",
    to: "/admin/products",
    icon: Package,
  },
  {
    label: "Orders",
    to: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    label: "Inventory",
    to: "/admin/inventory",
    icon: Warehouse,
  },
  {
    label: "Customers",
    to: "/admin/customers",
    icon: Users,
  },
  {
    label: "Payments",
    to: "/admin/payments",
    icon: CircleDollarSign,
  },
  {
    label: "Shipments",
    to: "/admin/shipments",
    icon: Truck,
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = user?.email || "Administrator";
  const initials =
    user?.email?.slice(0, 2).toUpperCase() || "AD";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`rp-admin-shell ${collapsed ? "is-collapsed" : ""}`}>
      <div
        className={`rp-admin-mobile-backdrop ${
          mobileOpen ? "is-visible" : ""
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`rp-admin-sidebar ${
          mobileOpen ? "is-mobile-open" : ""
        }`}
      >
        <div className="rp-admin-brand">
          <div className="rp-admin-brand-mark">
            <span>↻</span>
          </div>

          {!collapsed && (
            <div className="rp-admin-brand-copy">
              <strong>GreenCore</strong>
              <span className="admin-vgyan-identity">
                A Vidyagyan Initiative
              </span>
              <span>CONTROL CENTER</span>
            </div>
          )}

          <button
            className="rp-admin-mobile-close"
            type="button"
            aria-label="Close admin navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="rp-admin-nav-label">
          {!collapsed && "WORKSPACE"}
        </div>

        <nav className="rp-admin-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `rp-admin-nav-item ${isActive ? "active" : ""}`
                }
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={19} strokeWidth={1.8} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && <ChevronRight className="nav-arrow" size={15} />}
              </NavLink>
            );
          })}
        </nav>

        <div className="rp-admin-sidebar-spacer" />

        <div className="rp-admin-nav-label">
          {!collapsed && "SYSTEM"}
        </div>

        <nav className="rp-admin-nav">
          <NavLink
            to="/admin/settings"
            title={collapsed ? "Settings" : undefined}
            className="rp-admin-nav-item"
            onClick={() => setMobileOpen(false)}
          >
            <Settings size={19} strokeWidth={1.8} />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </nav>

        <div className="rp-admin-user-card">
          <div className="rp-admin-avatar">{initials}</div>

          {!collapsed && (
            <div className="rp-admin-user-info">
              <strong>{displayName}</strong>
              <span>{String(user?.role || "ADMIN")}</span>
            </div>
          )}

          {!collapsed && (
            <button
              type="button"
              className="rp-admin-logout"
              title="Log out"
              onClick={handleLogout}
            >
              <LogOut size={17} />
            </button>
          )}
        </div>

        <button
          type="button"
          className="rp-admin-collapse"
          onClick={() => setCollapsed((value) => !value)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </aside>

      <div className="rp-admin-main">
        <header className="rp-admin-topbar">
          <button
            type="button"
            className="rp-admin-mobile-menu"
            aria-label="Open admin navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="rp-admin-breadcrumb">
            <span>GreenCore</span>
            <ChevronRight size={14} />
            <strong>Admin Control Center</strong>
          </div>

          <div className="rp-admin-topbar-right">
            <div className="rp-admin-live">
              <span className="rp-admin-live-dot" />
              System operational
            </div>

            <div className="rp-admin-top-avatar">{initials}</div>
          </div>
        </header>

        <main className="rp-admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
