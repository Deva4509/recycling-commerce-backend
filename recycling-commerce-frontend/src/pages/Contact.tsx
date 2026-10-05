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
    <main className="contact-page relative isolate overflow-x-clip bg-[#01140d] text-white">
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


      {/* =====================================================
          CONTACT EXTRA INFORMATION — V5
          ===================================================== */}

      <section className="contact-extra-v5">

        {/* HELP CATEGORIES */}
        <div className="contact-help-hub">

          <div className="contact-v5-section-head">
            <div>
              <span className="contact-v5-eyebrow">
                HOW GREENCORE CAN HELP
              </span>

              <h2>
                One place for every
                <span> GreenCore question.</span>
              </h2>
            </div>

            <p>
              Whether you are checking an order, exploring our products,
              asking about payments, or sharing an idea, find the support
              path that matches what you need.
            </p>
          </div>

          <div className="contact-help-grid">

            <article className="contact-help-card contact-help-orders">
              <div className="contact-help-icon">01</div>

              <div className="contact-help-content">
                <span>ORDERS &amp; DELIVERY</span>
                <h3>Need help with an order?</h3>
                <p>
                  Track your order, understand delivery timelines,
                  shipping partners and what happens after checkout.
                </p>
              </div>

              <b>↗</b>
            </article>

            <article className="contact-help-card contact-help-products">
              <div className="contact-help-icon">02</div>

              <div className="contact-help-content">
                <span>PRODUCTS &amp; MATERIALS</span>
                <h3>Want to know more?</h3>
                <p>
                  Learn about recycled, reclaimed and upcycled materials
                  used across the GreenCore collection.
                </p>
              </div>

              <b>↗</b>
            </article>

            <article className="contact-help-card contact-help-payments">
              <div className="contact-help-icon">03</div>

              <div className="contact-help-content">
                <span>PAYMENTS &amp; ACCOUNT</span>
                <h3>Payment question?</h3>
                <p>
                  Get help with payment methods, refunds, invoices and
                  account-related questions.
                </p>
              </div>

              <b>↗</b>
            </article>

            <article className="contact-help-card contact-help-ideas">
              <div className="contact-help-icon">04</div>

              <div className="contact-help-content">
                <span>SUSTAINABILITY IDEAS</span>
                <h3>Have a sustainability idea?</h3>
                <p>
                  Share your ideas, feedback or collaboration opportunities
                  that could help create a more circular future.
                </p>
              </div>

              <b>↗</b>
            </article>

          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="contact-quick-links">

          <div className="contact-v5-section-head compact">
            <div>
              <span className="contact-v5-eyebrow">
                BEFORE YOU CONTACT US
              </span>

              <h2>Quick help &amp; useful links</h2>
            </div>

            <p>
              You might find what you need even faster using these
              frequently used paths.
            </p>
          </div>

          <div className="contact-quick-grid">

            <a href="/account/orders" className="contact-quick-card">
              <span className="contact-quick-number">01</span>
              <div>
                <strong>Track my order</strong>
                <small>Check real-time order status</small>
              </div>
              <b>→</b>
            </a>

            <a href="/account/orders" className="contact-quick-card">
              <span className="contact-quick-number">02</span>
              <div>
                <strong>Initiate a return</strong>
                <small>Start a return request</small>
              </div>
              <b>→</b>
            </a>

            <a href="/contact" className="contact-quick-card">
              <span className="contact-quick-number">03</span>
              <div>
                <strong>Delivery information</strong>
                <small>Shipping &amp; timelines</small>
              </div>
              <b>→</b>
            </a>

            <a href="/contact" className="contact-quick-card">
              <span className="contact-quick-number">04</span>
              <div>
                <strong>Payment help</strong>
                <small>Methods &amp; failed payments</small>
              </div>
              <b>→</b>
            </a>

            <a href="/shop" className="contact-quick-card">
              <span className="contact-quick-number">05</span>
              <div>
                <strong>Product guidance</strong>
                <small>Materials &amp; usage</small>
              </div>
              <b>→</b>
            </a>

          </div>
        </div>

        {/* VIDYAGYAN RELATIONSHIP */}
        <section className="contact-v5-leadership">

          <div className="contact-v5-leadership-copy">
            <span className="contact-v5-eyebrow">
              INSTITUTIONAL LEADERSHIP
            </span>

            <h2>
              GreenCore
              <span>A Vidyagyan Initiative</span>
            </h2>

            <p>
              GreenCore is a Vidyagyan-led recycling and circular-commerce
              initiative focused on sustainability, innovation, and giving
              recycled materials a second life.
            </p>

            <a href="/vidyagyan" className="contact-v5-learn">
              Learn more <span>→</span>
            </a>
          </div>

          <div className="contact-v5-flow">

            <div className="contact-flow-node">
              <strong>VIDYAGYAN</strong>
              <span>Leadership &amp; Change</span>
            </div>

            <i>→</i>

            <div className="contact-flow-node active">
              <strong>GREENCORE</strong>
              <span>Circular Commerce &amp; Innovation</span>
            </div>

            <i>→</i>

            <div className="contact-flow-node">
              <strong>IMPACT</strong>
              <span>Cleaner Planet &amp; Stronger Communities</span>
            </div>

          </div>
        </section>

        {/* SUPPORT PROMISE */}
        <section className="contact-support-promise">

          <div className="contact-promise-title">
            <span className="contact-v5-eyebrow">
              OUR SUPPORT PROMISE
            </span>

            <h2>
              A better experience,
              <span>a greener future.</span>
            </h2>
          </div>

          <div className="contact-promise-grid">

            <article>
              <span>01</span>
              <div>
                <strong>Clear communication</strong>
                <p>We keep you informed at every step.</p>
              </div>
            </article>

            <article>
              <span>02</span>
              <div>
                <strong>Customer-first support</strong>
                <p>Your questions and concerns matter to us.</p>
              </div>
            </article>

            <article>
              <span>03</span>
              <div>
                <strong>Built around sustainability</strong>
                <p>Every interaction helps build a more circular world.</p>
              </div>
            </article>

          </div>
        </section>

        {/* FAQ */}
        <section className="contact-v5-faq">

          <div className="contact-v5-section-head compact">
            <div>
              <span className="contact-v5-eyebrow">
                FREQUENT QUESTIONS
              </span>

              <h2>Quick answers</h2>

              <p className="contact-faq-intro">
                Here are some common questions. Can't find what you're
                looking for? Send us a message.
              </p>
            </div>
          </div>

          <div className="contact-faq-grid">

            <details>
              <summary>
                How can I track my order?
                <span>+</span>
              </summary>
              <p>
                You can check your order information from your GreenCore
                account and order details.
              </p>
            </details>

            <details>
              <summary>
                What payment methods do you accept?
                <span>+</span>
              </summary>
              <p>
                GreenCore supports available online payment methods
                through its secure payment gateway as well as Cash on Delivery
                where available.
              </p>
            </details>

            <details>
              <summary>
                What is your return policy?
                <span>+</span>
              </summary>
              <p>
                Contact the GreenCore support team with your order details
                for return and order-support guidance.
              </p>
            </details>

            <details>
              <summary>
                Are your products made from recycled materials?
                <span>+</span>
              </summary>
              <p>
                GreenCore focuses on products made from recycled, reclaimed,
                recovered and upcycled materials.
              </p>
            </details>

          </div>
        </section>

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
