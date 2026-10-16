import { useEffect, useState } from "react";
import {
  ShieldCheck, LockKeyhole, Smartphone, Monitor, Mail, MessageSquare,
  Bell, Download, Trash2, FileText, Cookie, ChevronRight, Shield,
  CheckCircle2, AlertTriangle, Eye, KeyRound
} from "lucide-react";
import { Link } from "react-router-dom";
import "./PrivacyCenter.css";
import { request } from "../lib/api";

type Preference = "orderUpdates" | "promotions" | "recommendations" | "email" | "sms" | "push";

const PREFERENCES_KEY = "greencore-privacy-preferences";

const DEFAULT_PREFERENCES: Record<Preference, boolean> = {
  orderUpdates: true,
  promotions: false,
  recommendations: false,
  email: true,
  sms: false,
  push: false,
};

function loadPreferences(): Record<Preference, boolean> {
  try {
    const saved = localStorage.getItem(PREFERENCES_KEY);
    return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}


export default function PrivacyCenter() {
  const [preferences, setPreferences] = useState<Record<Preference, boolean>>(loadPreferences);

  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      setNotice("Browser storage is unavailable. Your preferences could not be saved.");
    }
  }, [preferences]);

  const [notice, setNotice] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);


  const toggle = (key: Preference) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
    setNotice("Preference saved in this browser. It is not yet synced to GreenCore servers or notification providers.");
  };


  const submitPasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");

    if (newPassword.length < 12) {
      setNotice("Your new password must contain at least 12 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice("The new password and confirmation do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await request<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      setNotice(result.message || "Password changed successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const downloadPreferences = () => {
    let accountProfile: unknown = null;

    // Export only the profile cache if a known key exists; never export tokens.
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of ["recyclepro-user", "user", "currentUser"]) {
        try {
          const raw = storage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
              const { access_token, refresh_token, token, password, ...safeProfile } = parsed;
              accountProfile = safeProfile;
              break;
            }
          }
        } catch {
          // Ignore non-JSON storage entries.
        }
      }
      if (accountProfile) break;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      accountProfile,
      communicationPreferences: preferences,
      scope: "Includes only a profile found in this browser's storage and saved preferences. This is not a complete server-side account or order-history export."
    };

    const file = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "greencore-account-data.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Your available profile data and communication preferences were exported.");
  };

  return (
    <main className="gc-privacy-center">
      <header className="gc-privacy-hero">
        <div className="gc-privacy-orbit gc-privacy-orbit-a" />
        <div className="gc-privacy-orbit gc-privacy-orbit-b" />
        <div className="gc-privacy-hero-top">
          <span className="gc-privacy-hero-icon"><ShieldCheck size={34} /></span>
          <span className="gc-privacy-status"><span /> PRIVACY CONTROL CENTRE</span>
        </div>
        <h1>Your privacy, <span>your choice.</span></h1>
        <p>Manage your security, communication preferences, and personal data in one place.</p>
        <div className="gc-privacy-assurance">
          <span><LockKeyhole size={16} /> Account security</span>
          <span><Eye size={16} /> Data transparency</span>
          <span><Shield size={16} /> Your choices matter</span>
        </div>
      </header>

      {notice && (
        <div className="gc-privacy-notice" role="status">
          <CheckCircle2 size={17} /><span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice">×</button>
        </div>
      )}

      <section className="gc-privacy-section">
        <div className="gc-privacy-section-heading">
          <span className="gc-privacy-section-icon"><KeyRound size={22} /></span>
          <div><span>PROTECT YOUR ACCOUNT</span><h2>Password & security</h2><p>Review security options for your GreenCore account.</p></div>
        </div>
        <div className="gc-privacy-grid gc-privacy-security-grid">
          <article
            className={`gc-privacy-card gc-privacy-password-card${showPasswordForm ? " is-expanded" : ""}`}
            onMouseEnter={() => setShowPasswordForm(true)}
            onMouseLeave={() => {
              const active = document.activeElement;
              if (!active || !active.closest(".gc-privacy-password-card")) {
                setShowPasswordForm(false);
              }
            }}
          >
            <div className="gc-password-card-heading">
              <span className="gc-privacy-card-icon"><LockKeyhole size={24} /></span>
              <h3>Change password</h3>
              <p>Keep your account secure with a strong, unique password.</p>
            </div>
            {!showPasswordForm ? (
              <button
                type="button"
                className="gc-password-open-button"
                onClick={() => { setNotice(""); setShowPasswordForm(true); }}
                onFocus={() => setShowPasswordForm(true)}
              >
                Change password <ChevronRight size={19} />
              </button>
            ) : (
              <form className="gc-privacy-password-form" onSubmit={submitPasswordChange}>
                <label>
                  Current password
                  <input type="password" autoComplete="current-password" placeholder="Enter your current password"
                    value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)}
                    required maxLength={128} />
                </label>
                <label>
                  New password
                  <input type="password" autoComplete="new-password" placeholder="Enter a new password"
                    value={newPassword} onChange={(event) => setNewPassword(event.target.value)}
                    required minLength={12} maxLength={128} aria-describedby="gc-password-guidance" />
                </label>
                <label>
                  Confirm new password
                  <input type="password" autoComplete="new-password" placeholder="Confirm your new password"
                    value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}
                    required minLength={12} maxLength={128} />
                </label>
                <div className="gc-password-guidance">
                  <ShieldCheck size={25} />
                  <span><strong>Use at least 12 characters</strong><small>Include letters, numbers and symbols. Avoid reusing a password from another site.</small></span>
                </div>
                <button type="submit" className="gc-privacy-primary-button" disabled={passwordLoading}>
                  {passwordLoading ? "Updating password…" : "Update password"} <LockKeyhole size={18} />
                </button>
                <button type="button" className="gc-privacy-cancel-button"
                  disabled={passwordLoading}
                  onClick={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setNotice("");
                    setShowPasswordForm(false);
                  }}>
                  Cancel
                </button>
              </form>
            )}
          </article>
          <article className="gc-privacy-card">
            <span className="gc-privacy-card-icon"><Smartphone size={22} /></span>
            <h3>Two-factor authentication</h3>
            <p>Add another verification step when signing in.</p>
            <span className="gc-privacy-unavailable">2FA setup is not configured</span>
            <button type="button" className="gc-privacy-outline-button" onClick={() => setNotice("Two-factor authentication is not active. A verified authentication backend must be configured before enabling it.")}>Learn about 2FA</button>
          </article>
          <article className="gc-privacy-card">
            <span className="gc-privacy-card-icon"><Monitor size={22} /></span>
            <h3>Active sessions & devices</h3>
            <p>Session details are not currently available in this dashboard.</p>
            <span className="gc-privacy-unavailable">Device session management unavailable</span>
            <button type="button" className="gc-privacy-outline-button" onClick={() => setNotice("No session list or revoke-all-sessions endpoint is connected yet.")}>Session information</button>
          </article>
        </div>
      </section>

      <section className="gc-privacy-section">
        <div className="gc-privacy-section-heading">
          <span className="gc-privacy-section-icon"><Bell size={22} /></span>
          <div><span>STAY IN CONTROL</span><h2>Communication preferences</h2><p>Choose your preferred updates. Choices are saved in this browser, but are not synced to server-side notification services.</p></div>
        </div>
        <div className="gc-privacy-preferences">
          {([
            ["email", "Email notifications", "Receive account messages by email.", Mail],
            ["sms", "SMS notifications", "Receive text messages when supported.", MessageSquare],
            ["push", "Push notifications", "Receive notifications on supported devices.", Bell],
            ["orderUpdates", "Order updates", "Get information about order progress.", CheckCircle2],
            ["promotions", "Promotions & offers", "Hear about special offers and campaigns.", Mail],
            ["recommendations", "Product recommendations", "Receive updates about products you may like.", Eye],
          ] as const).map(([key, title, description, Icon]) => (
            <div className="gc-privacy-preference" key={key}>
              <span className="gc-privacy-preference-icon"><Icon size={19} /></span>
              <span className="gc-privacy-preference-copy"><strong>{title}</strong><small>{description}</small></span>
              <button
                type="button"
                role="switch"
                aria-checked={preferences[key]}
                aria-label={title}
                className={`gc-privacy-switch${preferences[key] ? " is-on" : ""}`}
                onClick={() => toggle(key)}
              ><span /></button>
            </div>
          ))}
          <p className="gc-privacy-footnote">Preferences are saved locally in this browser; email, SMS, and push delivery are not connected to these settings.</p>
        </div>
      </section>

      <section className="gc-privacy-section">
        <div className="gc-privacy-section-heading">
          <span className="gc-privacy-section-icon"><Download size={22} /></span>
          <div><span>YOUR DATA BELONGS TO YOU</span><h2>Data & privacy rights</h2><p>Review your choices for personal data and account records.</p></div>
        </div>
        <div className="gc-privacy-grid gc-privacy-data-grid">
          <article className="gc-privacy-card">
            <span className="gc-privacy-card-icon"><Download size={22} /></span>
            <h3>Download my data</h3>
            <p>Export the profile available in this browser and your saved communication preferences as JSON.</p>
            <button type="button" className="gc-privacy-primary-button" onClick={downloadPreferences}>Export account data <Download size={16} /></button>
          </article>
          <article className="gc-privacy-card gc-privacy-danger-card">
            <span className="gc-privacy-card-icon"><Trash2 size={22} /></span>
            <h3>Delete account & data</h3>
            <p>Account deletion is permanent and must be handled through a verified server-side process.</p>
            <button type="button" className="gc-privacy-danger-button" onClick={() => setDeleteConfirm((value) => !value)}><Trash2 size={16} /> {deleteConfirm ? "Hide information" : "Review deletion process"}</button>
            {deleteConfirm && <div className="gc-privacy-delete-warning"><AlertTriangle size={17} /><span>No deletion request has been submitted. A secure deletion workflow and identity verification are required before this action can be offered.</span></div>}
          </article>
        </div>
      </section>

      <section className="gc-privacy-section">
        <div className="gc-privacy-section-heading">
          <span className="gc-privacy-section-icon"><FileText size={22} /></span>
          <div><span>READ THE DETAILS</span><h2>Legal & policy centre</h2><p>Review GreenCore's available legal information.</p></div>
        </div>
        <div className="gc-privacy-legal-list">
          <Link to="/terms" state={{ from: "privacy-settings" }} className="gc-privacy-legal-link"><span className="gc-privacy-legal-icon"><FileText size={20} /></span><span><strong>Terms of Service</strong><small>Review the terms governing use of GreenCore.</small></span><ChevronRight size={19} /></Link>
          <Link to="/privacy-policy" state={{ from: "privacy-settings" }} className="gc-privacy-legal-link"><span className="gc-privacy-legal-icon"><ShieldCheck size={20} /></span><span><strong>Privacy Policy</strong><small>Read how personal information is described in our policy.</small></span><ChevronRight size={19} /></Link>
          <button type="button" className="gc-privacy-legal-link" onClick={() => setNotice("Cookie preference controls are not configured yet. No cookie settings were changed.")}><span className="gc-privacy-legal-icon"><Cookie size={20} /></span><span><strong>Cookie preferences</strong><small>Cookie preference management is not configured yet.</small></span><ChevronRight size={19} /></button>
        </div>
      </section>

      <footer className="gc-privacy-footer">
        <ShieldCheck size={20} /><span><strong>Your privacy matters.</strong> Security and data requests should always be handled through verified, secure account workflows.</span>
      </footer>
    </main>
  );
}
