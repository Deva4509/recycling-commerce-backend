import { FormEvent, useState } from "react";
import { request } from "../lib/api";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Leaf,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    setError("");

    try {
      await request<{ message: string }>("/contact", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone") || null,
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });

      form.reset();
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send your message right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="contact-page">
      <div className="contact-page-container">
<section className="contact-hero">
          <div className="contact-hero-content">
            <div className="contact-kicker">
              <Sparkles size={15} />
              GET IN TOUCH
            </div>

            <h1>
              Let&apos;s make a
              <span> greener difference.</span>
            </h1>

            <p>
              Have a question, need help with an order, or want to work with
              GreenCore? Our team would love to hear from you.
            </p>

            <div className="contact-hero-links">
              <a href="mailto:dy3819@vidyagyan.in">
                <Mail size={17} />
                dy3819@vidyagyan.in
              </a>
              <a href="tel:+919999999999">
                <Phone size={17} />
                +91 99999 99999
              </a>
            </div>
          </div>

          <div className="contact-hero-art">
            <div className="contact-orbit contact-orbit-one" />
            <div className="contact-orbit contact-orbit-two" />
            <div className="contact-leaf-icon">
              <Leaf size={82} strokeWidth={1.2} />
            </div>
            <div className="contact-eco-badge">
              <Leaf size={14} />
              BETTER FOR THE PLANET
            </div>
          </div>
        </section>

        <section className="contact-grid">
          <div className="contact-info-column">
            <div className="contact-section-kicker">CONTACT INFORMATION</div>
            <h2>We&apos;re here to help.</h2>
            <p className="contact-info-intro">
              Reach us through any of the channels below. For the fastest
              response, send us a message using the contact form.
            </p>

            <div className="contact-info-cards">
              <a href="mailto:dy3819@vidyagyan.in" className="contact-info-card">
                <span className="contact-info-icon">
                  <Mail size={20} />
                </span>
                <span>
                  <small>Email us</small>
                  <strong>dy3819@vidyagyan.in</strong>
                </span>
              </a>

              <a href="tel:+919999999999" className="contact-info-card">
                <span className="contact-info-icon">
                  <Phone size={20} />
                </span>
                <span>
                  <small>Call us</small>
                  <strong>+91 99999 99999</strong>
                </span>
              </a>

              <div className="contact-info-card">
                <span className="contact-info-icon">
                  <MapPin size={20} />
                </span>
                <span>
                  <small>Visit us</small>
                  <strong>India</strong>
                </span>
              </div>

              <div className="contact-info-card">
                <span className="contact-info-icon">
                  <Clock3 size={20} />
                </span>
                <span>
                  <small>Support hours</small>
                  <strong>Mon – Sat, 9 AM – 6 PM</strong>
                </span>
              </div>
            </div>

            <div className="contact-help-card">
              <Leaf size={21} />
              <div>
                <strong>Have a sustainability idea?</strong>
                <p>
                  We&apos;re always interested in ideas that can help create a
                  more circular future.
                </p>
              </div>
            </div>
          </div>

          <div className="contact-form-card">
            <div className="contact-form-heading">
              <div>
                <div className="contact-section-kicker">SEND A MESSAGE</div>
                <h2>How can we help?</h2>
              </div>
              <Send size={22} />
            </div>

            {submitted ? (
              <div className="contact-success">
                <CheckCircle2 size={48} />
                <h3>Message received!</h3>
                <p>
                  Thanks for reaching out. Our team will get back to you as
                  soon as possible.
                </p>
                <button
                  type="button"
                  className="contact-secondary-button"
                  onClick={() => setSubmitted(false)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-form-row">
                  <label>
                    Full name
                    <input
                      name="name"
                      type="text"
                      placeholder="Your name"
                      required
                    />
                  </label>

                  <label>
                    Email address
                    <input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                </div>

                <div className="contact-form-row">
                  <label>
                    Phone number
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </label>

                  <label>
                    Subject
                    <select name="subject" defaultValue="" required>
                      <option value="" disabled>
                        Select a topic
                      </option>
                      <option value="order">Order support</option>
                      <option value="product">Product question</option>
                      <option value="returns">Returns & refunds</option>
                      <option value="partnership">Partnership</option>
                      <option value="recycling">Recycling enquiry</option>
                      <option value="other">Something else</option>
                    </select>
                  </label>
                </div>

                <label>
                  Message
                  <textarea
                    name="message"
                    placeholder="Tell us how we can help..."
                    rows={7}
                    required
                  />
                </label>

                {error && (
                  <div className="contact-form-error" role="alert">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="contact-submit-button"
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send message"}
                  {!submitting && <ArrowRight size={18} />}
                </button>

                <p className="contact-form-note">
                  We&apos;ll use your information only to respond to your
                  enquiry.
                </p>
              </form>
            )}
          </div>
        </section>

        <section className="contact-bottom-cta">
          <div>
            <div className="contact-section-kicker">MAKE A DIFFERENCE</div>
            <h2>Ready to choose circular?</h2>
            <p>
              Explore products designed with sustainability and everyday use
              in mind.
            </p>
          </div>

          <Link to="/shop" className="contact-cta-button">
            Explore the shop
            <ArrowRight size={18} />
          </Link>
        </section>
      </div>
    </main>
  );
}
