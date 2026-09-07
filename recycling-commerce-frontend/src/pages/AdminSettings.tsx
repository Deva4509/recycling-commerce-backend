import {
  Bell,
  Check,
  CircleCheck,
  Database,
  KeyRound,
  LockKeyhole,
  Mail,
  Save,
  Server,
  Settings2,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AdminSettings() {
  const { user } = useAuth();

  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
  });

  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    paymentAlerts: true,
    lowStockAlerts: true,
  });

  const [operations, setOperations] = useState({
    currency: "INR",
    timezone: "Asia/Kolkata",
    orderProcessing: true,
  });

  function handleSave() {
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  return (
    <section className="rp-admin-settings-page">
      <div className="rp-admin-settings-hero">
        <div>
          <span className="rp-admin-eyebrow">
            SYSTEM CONFIGURATION
          </span>

          <h1>Settings</h1>

          <p>
            Manage your GreenCore account, security and operational
            preferences.
          </p>
        </div>

        <button
          type="button"
          className="rp-admin-settings-save"
          onClick={handleSave}
        >
          {saved ? <Check size={17} /> : <Save size={17} />}
          {saved ? "Saved" : "Save Changes"}
        </button>
      </div>

      {saved && (
        <div className="rp-admin-settings-success">
          <CircleCheck size={17} />
          <span>Your settings have been saved.</span>
        </div>
      )}

      <div className="rp-admin-settings-grid">
        {/* PROFILE */}
        <section className="rp-admin-settings-card">
          <div className="rp-admin-settings-card-heading">
            <div className="rp-admin-settings-icon">
              <UserRound size={19} />
            </div>

            <div>
              <h2>Profile & Account</h2>
              <p>Manage your administrator account information.</p>
            </div>
          </div>

          <div className="rp-admin-settings-form-grid">
            <label>
              <span>FIRST NAME</span>
              <input
                value={profile.firstName}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    firstName: event.target.value,
                  })
                }
                placeholder="First name"
              />
            </label>

            <label>
              <span>LAST NAME</span>
              <input
                value={profile.lastName}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    lastName: event.target.value,
                  })
                }
                placeholder="Last name"
              />
            </label>

            <label className="full">
              <span>EMAIL ADDRESS</span>
              <div className="rp-admin-settings-input-with-icon">
                <Mail size={16} />
                <input
                  value={profile.email}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      email: event.target.value,
                    })
                  }
                  type="email"
                  placeholder="Email address"
                />
              </div>
            </label>

            <label className="full">
              <span>PHONE NUMBER</span>
              <input
                value={profile.phone}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    phone: event.target.value,
                  })
                }
                placeholder="+91"
              />
            </label>
          </div>

          <div className="rp-admin-settings-account-meta">
            <div>
              <span>ROLE</span>
              <strong>
                {String(user?.role || "ADMIN").toUpperCase()}
              </strong>
            </div>

            <div>
              <span>ACCOUNT</span>
              <strong className="settings-active">
                <i />
                ACTIVE
              </strong>
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section className="rp-admin-settings-card">
          <div className="rp-admin-settings-card-heading">
            <div className="rp-admin-settings-icon security">
              <ShieldCheck size={19} />
            </div>

            <div>
              <h2>Security</h2>
              <p>Protect your administrator account.</p>
            </div>
          </div>

          <div className="rp-admin-settings-security-row">
            <div className="settings-security-symbol">
              <LockKeyhole size={18} />
            </div>

            <div>
              <strong>Password</strong>
              <span>
                Change your account password and keep your account secure.
              </span>
            </div>

            <button type="button">
              <KeyRound size={15} />
              Change Password
            </button>
          </div>

          <div className="rp-admin-settings-security-row">
            <div className="settings-security-symbol">
              <ShieldCheck size={18} />
            </div>

            <div>
              <strong>Authentication</strong>
              <span>JWT authentication is enabled for this account.</span>
            </div>

            <span className="settings-enabled">
              <i />
              Enabled
            </span>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section className="rp-admin-settings-card">
          <div className="rp-admin-settings-card-heading">
            <div className="rp-admin-settings-icon notification">
              <Bell size={19} />
            </div>

            <div>
              <h2>Notifications</h2>
              <p>Choose which operational alerts you receive.</p>
            </div>
          </div>

          <div className="rp-admin-settings-toggle-list">
            <label className="rp-admin-settings-toggle">
              <div>
                <strong>Order alerts</strong>
                <span>Notify when new orders are created.</span>
              </div>

              <input
                type="checkbox"
                checked={notifications.orderAlerts}
                onChange={(event) =>
                  setNotifications({
                    ...notifications,
                    orderAlerts: event.target.checked,
                  })
                }
              />

              <span className="settings-toggle-ui" />
            </label>

            <label className="rp-admin-settings-toggle">
              <div>
                <strong>Payment alerts</strong>
                <span>Notify about important payment events.</span>
              </div>

              <input
                type="checkbox"
                checked={notifications.paymentAlerts}
                onChange={(event) =>
                  setNotifications({
                    ...notifications,
                    paymentAlerts: event.target.checked,
                  })
                }
              />

              <span className="settings-toggle-ui" />
            </label>

            <label className="rp-admin-settings-toggle">
              <div>
                <strong>Low-stock alerts</strong>
                <span>Notify when inventory reaches its threshold.</span>
              </div>

              <input
                type="checkbox"
                checked={notifications.lowStockAlerts}
                onChange={(event) =>
                  setNotifications({
                    ...notifications,
                    lowStockAlerts: event.target.checked,
                  })
                }
              />

              <span className="settings-toggle-ui" />
            </label>
          </div>
        </section>

        {/* OPERATIONS */}
        <section className="rp-admin-settings-card">
          <div className="rp-admin-settings-card-heading">
            <div className="rp-admin-settings-icon operations">
              <Store size={19} />
            </div>

            <div>
              <h2>Store & Operations</h2>
              <p>Configure core GreenCore operating preferences.</p>
            </div>
          </div>

          <div className="rp-admin-settings-form-grid">
            <label>
              <span>DEFAULT CURRENCY</span>
              <select
                value={operations.currency}
                onChange={(event) =>
                  setOperations({
                    ...operations,
                    currency: event.target.value,
                  })
                }
              >
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </label>

            <label>
              <span>TIMEZONE</span>
              <select
                value={operations.timezone}
                onChange={(event) =>
                  setOperations({
                    ...operations,
                    timezone: event.target.value,
                  })
                }
              >
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
              </select>
            </label>
          </div>

          <label className="rp-admin-settings-toggle operation-toggle">
            <div>
              <strong>Order processing</strong>
              <span>Allow administrators to process customer orders.</span>
            </div>

            <input
              type="checkbox"
              checked={operations.orderProcessing}
              onChange={(event) =>
                setOperations({
                  ...operations,
                  orderProcessing: event.target.checked,
                })
              }
            />

            <span className="settings-toggle-ui" />
          </label>
        </section>

        {/* SYSTEM */}
        <section className="rp-admin-settings-card system-card">
          <div className="rp-admin-settings-card-heading">
            <div className="rp-admin-settings-icon system">
              <Settings2 size={19} />
            </div>

            <div>
              <h2>System Information</h2>
              <p>Current GreenCore platform status.</p>
            </div>
          </div>

          <div className="rp-admin-system-list">
            <div>
              <div>
                <Server size={16} />
                <span>API Server</span>
              </div>

              <strong className="system-online">
                <i />
                Operational
              </strong>
            </div>

            <div>
              <div>
                <Database size={16} />
                <span>PostgreSQL Database</span>
              </div>

              <strong className="system-online">
                <i />
                Connected
              </strong>
            </div>

            <div>
              <div>
                <Settings2 size={16} />
                <span>GreenCore Version</span>
              </div>

              <strong>1.0.0</strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
