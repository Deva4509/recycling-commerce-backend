import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
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
  X,
} from "lucide-react";
import {
  getAdminSettings,
  updateAdminPassword,
  updateAdminProfile,
  updateAdminSettings,
  type AdminSettingsResponse,
} from "../lib/api";

export default function AdminSettings() {
  const { user, uploadProfilePhoto } = useAuth();
  const [data, setData] = useState<AdminSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [orderAlerts, setOrderAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [orderProcessing, setOrderProcessing] = useState(true);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      const result = await getAdminSettings();

      setData(result);

      setFirstName(result.profile.first_name || "");
      setLastName(result.profile.last_name || "");
      setPhone(result.profile.phone || "");

      setOrderAlerts(result.settings.order_alerts);
      setPaymentAlerts(result.settings.payment_alerts);
      setLowStockAlerts(result.settings.low_stock_alerts);
      setCurrency(result.settings.default_currency || "INR");
      setTimezone(result.settings.timezone || "Asia/Kolkata");
      setOrderProcessing(result.settings.order_processing_enabled);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load administrator settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      await updateAdminProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
      });

      await updateAdminSettings({
        order_alerts: orderAlerts,
        payment_alerts: paymentAlerts,
        low_stock_alerts: lowStockAlerts,
        default_currency: currency,
        timezone,
        order_processing_enabled: orderProcessing,
      });

      setMessage("Changes saved successfully.");
      await loadSettings();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save changes."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      setPasswordSaving(true);

      await updateAdminPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setPasswordMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        setPasswordOpen(false);
        setPasswordMessage("");
      }, 1200);
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Unable to change password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rp-admin-settings-page">
        <div className="rp-admin-settings-loading">
          <Settings2 size={24} />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-admin-settings-page">
      <div className="rp-admin-settings-hero">
        <div>
          <div className="rp-admin-settings-eyebrow">
            SYSTEM CONFIGURATION
          </div>
          <h1>Settings</h1>
          <p>
            Manage your GreenCore account, security and operational preferences.
          </p>
        </div>

        <button
          type="button"
          className="rp-admin-settings-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Settings2 size={17} /> : <Save size={17} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && (
        <div className="rp-admin-settings-success">
          <CircleCheck size={18} />
          <span>{message}</span>
        </div>
      )}

      <div className="rp-admin-settings-grid">
        <section className="rp-admin-settings-card">
          <div className="rp-admin-settings-card-heading admin-profile-heading">
            <div className="admin-profile-photo-preview">
              {user?.profile_photo_url ? (
                <img src={user.profile_photo_url} alt="Administrator profile" />
              ) : (
                <UserRound size={34} />
              )}
            </div>
            <div className="admin-profile-heading-copy">
              <h2>Profile &amp; Account</h2>
              <p>Manage your administrator account information.</p>
              <div className="admin-profile-photo-controls">
                <strong>Profile photo</strong>
                <span>JPG, PNG or WebP · Maximum 5 MB</span>
                <label className="admin-profile-change-photo admin-profile-change-photo-neon">
                  <span className="admin-photo-camera" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M4 7.5h3l1.5-2h7l1.5 2h3A1.5 1.5 0 0 1 21.5 9v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                  </span>
                  <span className="admin-photo-button-label">{photoUploading ? "Uploading..." : "Change photo"}</span>
                  <span className="admin-photo-chevron" aria-hidden="true">›</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={photoUploading}
                    aria-label="Change administrator profile photo"
                    onChange={async (event) => {
                      const input = event.currentTarget;
                      const file = input.files?.[0];
                      input.value = "";
                      if (!file) return;

                      setMessage("");
                      if (file.size > 5 * 1024 * 1024) {
                        setMessage("Choose a profile photo smaller than 5 MB.");
                        return;
                      }

                      setPhotoUploading(true);
                      try {
                        const result = await uploadProfilePhoto(file);
                        setMessage(
                          result.success
                            ? "Profile photo updated successfully."
                            : result.error || "Unable to update profile photo."
                        );
                      } finally {
                        setPhotoUploading(false);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="rp-admin-settings-form-grid">
            <label>
              <span>FIRST NAME</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
              />
            </label>

            <label>
              <span>LAST NAME</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last name"
              />
            </label>
          </div>

          <label className="rp-admin-settings-full-field">
            <span>EMAIL ADDRESS</span>
            <div className="rp-admin-settings-input-with-icon">
              <Mail size={17} />
              <input
                value={data?.profile.email || ""}
                readOnly
                aria-label="Email address"
              />
            </div>
          </label>

          <label className="rp-admin-settings-full-field">
            <span>PHONE NUMBER</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91"
            />
          </label>

          <div className="rp-admin-settings-account-meta">
            <div>
              <span>ROLE</span>
              <strong>ADMIN</strong>
            </div>
            <div>
              <span>ACCOUNT</span>
              <strong className="rp-admin-settings-active">
                <i />
                ACTIVE
              </strong>
            </div>
          </div>
        </section>

        <section className="rp-admin-settings-card">
          <div className="rp-admin-settings-card-heading">
            <div className="rp-admin-settings-icon">
              <ShieldCheck size={21} />
            </div>
            <div>
              <h2>Security</h2>
              <p>Protect administrator account.</p>
            </div>
          </div>

          <div className="rp-admin-settings-security-row">
            <div className="rp-admin-settings-security-icon">
              <LockKeyhole size={19} />
            </div>
            <div>
              <strong>Password</strong>
              <span>Change your account password and keep your account secure.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPasswordOpen(true);
                setPasswordError("");
                setPasswordMessage("");
              }}
            >
              <KeyRound size={16} />
              Change Password
            </button>
          </div>

          <div className="rp-admin-settings-security-row">
            <div className="rp-admin-settings-security-icon">
              <ShieldCheck size={19} />
            </div>
            <div>
              <strong>Authentication</strong>
              <span>JWT authentication is enabled for this account.</span>
            </div>
            <b className="rp-admin-settings-enabled">
              <i />
              Enabled
            </b>
          </div>
        </section>

        <section className="rp-admin-settings-card">
          <div className="rp-admin-settings-card-heading">
            <div className="rp-admin-settings-icon">
              <Bell size={21} />
            </div>
            <div>
              <h2>Notifications</h2>
              <p>Choose which operational events require your attention.</p>
            </div>
          </div>

          <div className="rp-admin-settings-toggle-list">
            <label className="rp-admin-settings-toggle">
              <div>
                <strong>Order Alerts</strong>
                <span>Notify when new orders require attention.</span>
              </div>
              <input
                type="checkbox"
                checked={orderAlerts}
                onChange={(event) => setOrderAlerts(event.target.checked)}
              />
              <span className="settings-toggle-ui" />
            </label>

            <label className="rp-admin-settings-toggle">
              <div>
                <strong>Payment Alerts</strong>
                <span>Notify about payment failures and updates.</span>
              </div>
              <input
                type="checkbox"
                checked={paymentAlerts}
                onChange={(event) => setPaymentAlerts(event.target.checked)}
              />
              <span className="settings-toggle-ui" />
            </label>

            <label className="rp-admin-settings-toggle">
              <div>
                <strong>Low Stock Alerts</strong>
                <span>Notify when inventory reaches its threshold.</span>
              </div>
              <input
                type="checkbox"
                checked={lowStockAlerts}
                onChange={(event) => setLowStockAlerts(event.target.checked)}
              />
              <span className="settings-toggle-ui" />
            </label>
          </div>
        </section>

        <section className="rp-admin-settings-card">
          <div className="rp-admin-settings-card-heading">
            <div className="rp-admin-settings-icon">
              <Store size={21} />
            </div>
            <div>
              <h2>Store &amp; Operations</h2>
              <p>Configure core GreenCore operating preferences.</p>
            </div>
          </div>

          <div className="rp-admin-settings-form-grid">
            <label>
              <span>DEFAULT CURRENCY</span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </label>

            <label>
              <span>TIMEZONE</span>
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Asia/Singapore">Asia/Singapore</option>
              </select>
            </label>
          </div>

          <label className="rp-admin-settings-toggle">
            <div>
              <strong>Order Processing</strong>
              <span>Allow normal order processing operations.</span>
            </div>
            <input
              type="checkbox"
              checked={orderProcessing}
              onChange={(event) => setOrderProcessing(event.target.checked)}
            />
            <span className="settings-toggle-ui" />
          </label>
        </section>

        <section className="rp-admin-settings-card">
          <div className="rp-admin-settings-card-heading">
            <div className="rp-admin-settings-icon">
              <Server size={21} />
            </div>
            <div>
              <h2>System Information</h2>
              <p>Current GreenCore platform configuration.</p>
            </div>
          </div>

          <div className="rp-admin-system-list">
            <div>
              <span><Database size={16} /> Database</span>
              <strong>PostgreSQL</strong>
            </div>
            <div>
              <span><Server size={16} /> Backend</span>
              <strong>FastAPI</strong>
            </div>
            <div>
              <span><ShieldCheck size={16} /> Authentication</span>
              <strong>JWT / HS256</strong>
            </div>
            <div>
              <span><Check size={16} /> Settings Storage</span>
              <strong>Database-backed</strong>
            </div>
          </div>
        </section>
      </div>

      {passwordOpen &&
        createPortal(
          <div
            className="rp-admin-settings-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !passwordSaving) {
                setPasswordOpen(false);
              }
            }}
          >
          <div className="rp-admin-settings-modal">
            <div className="rp-admin-settings-modal-header">
              <div>
                <span>ACCOUNT SECURITY</span>
                <h2>Change Password</h2>
              </div>
              <button
                type="button"
                onClick={() => !passwordSaving && setPasswordOpen(false)}
                disabled={passwordSaving}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handlePasswordChange}>
              <label>
                <span>CURRENT PASSWORD</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              <label>
                <span>NEW PASSWORD</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label>
                <span>CONFIRM NEW PASSWORD</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              {passwordError && (
                <div className="rp-admin-settings-password-error">
                  {passwordError}
                </div>
              )}

              {passwordMessage && (
                <div className="rp-admin-settings-success">
                  <CircleCheck size={17} />
                  {passwordMessage}
                </div>
              )}

              <div className="rp-admin-settings-modal-actions">
                <button
                  type="button"
                  onClick={() => setPasswordOpen(false)}
                  disabled={passwordSaving}
                >
                  Cancel
                </button>
                <button type="submit" disabled={passwordSaving}>
                  <KeyRound size={16} />
                  {passwordSaving ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
          </div>,
          document.body
        )}
    </div>
  );
}
