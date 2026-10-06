import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import "./Legal.css";

export default function Terms() {
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
            <FileText size={24} />
          </div>

          <p className="legal-kicker">GREENCORE</p>
          <h1>Terms of Service</h1>
          <p className="legal-intro">
            Please read these terms before using the GreenCore website and
            services.
          </p>

          <article className="legal-card">
            <section>
              <h2>1. Acceptance of Terms</h2>
              <p>
                By creating an account or using GreenCore, you agree to use
                the platform responsibly and in accordance with these terms.
              </p>
            </section>

            <section>
              <h2>2. Your Account</h2>
              <p>
                You are responsible for providing accurate account
                information and keeping your login credentials secure.
              </p>
            </section>

            <section>
              <h2>3. Orders and Payments</h2>
              <p>
                Product availability, pricing, orders, and payment processing
                are subject to the applicable information shown during
                checkout.
              </p>
            </section>

            <section>
              <h2>4. Responsible Use</h2>
              <p>
                You must not misuse the website, attempt unauthorized access,
                interfere with its operation, or use the service for unlawful
                purposes.
              </p>
            </section>

            <section>
              <h2>5. Changes</h2>
              <p>
                GreenCore may update these terms when necessary. Updated
                terms will be presented on this page.
              </p>
            </section>

            <section>
              <h2>6. Contact</h2>
              <p>
                If you have questions about these terms, please contact the
                GreenCore team through the website.
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
