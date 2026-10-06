import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import "./Legal.css";

export default function Privacy() {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <div className="legal-glow legal-glow-one" />
        <div className="legal-glow legal-glow-two" />

        <div className="legal-container">
          <Link to="/register" className="legal-back-button">
            <ArrowLeft size={16} />
            <span>Back to Register</span>
          </Link>

          <div className="legal-icon">
            <ShieldCheck size={24} />
          </div>

          <p className="legal-kicker">GREENCORE</p>
          <h1>Privacy Policy</h1>
          <p className="legal-intro">
            This page explains how GreenCore handles information when you use
            the website.
          </p>

          <article className="legal-card">
            <section>
              <h2>1. Information We Collect</h2>
              <p>
                Information may include details you provide when creating an
                account, placing an order, contacting GreenCore, or using
                website features.
              </p>
            </section>

            <section>
              <h2>2. How Information Is Used</h2>
              <p>
                Information may be used to provide account functionality,
                process orders, communicate with you, improve the platform,
                and provide requested services.
              </p>
            </section>

            <section>
              <h2>3. Payment Information</h2>
              <p>
                Sensitive payment credentials such as card numbers, CVV
                values, and UPI PINs should be entered only through the
                authorized payment gateway checkout and are not stored by
                GreenCore as ordinary account data.
              </p>
            </section>

            <section>
              <h2>4. Account Security</h2>
              <p>
                Please keep your password confidential and contact GreenCore
                if you believe your account has been accessed without your
                permission.
              </p>
            </section>

            <section>
              <h2>5. Cookies and Local Storage</h2>
              <p>
                GreenCore may use browser storage and similar technologies to
                support website functionality, preferences, shopping
                experiences, and authentication behavior.
              </p>
            </section>

            <section>
              <h2>6. Updates</h2>
              <p>
                This privacy policy may be updated as the GreenCore platform
                evolves. Changes will be reflected on this page.
              </p>
            </section>
          </article>

          <div className="legal-actions">
            <Link to="/register" className="legal-action-secondary">
              <ArrowLeft size={16} />
              Back to Register
            </Link>

            <Link to="/login" className="legal-action-primary">
              Go to Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
