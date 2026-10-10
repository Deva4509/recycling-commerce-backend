import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Globe2,
  Heart,
  Leaf,
  LockKeyhole,
  Mail,
  Recycle,
  ShieldCheck,
  Sprout,
  TreePine,
  Users,
  Wallet,
} from "lucide-react";
import "./Donation.css";

const donationOptions = [100, 250, 500, 1000, 5000];

const impactItems = [
  {
    icon: Recycle,
    title: "Recycling infrastructure",
    description: "Support collection, sorting and responsible recycling.",
  },
  {
    icon: Users,
    title: "Community awareness",
    description: "Help communities learn practical waste-management habits.",
  },
  {
    icon: Leaf,
    title: "Green innovation",
    description: "Encourage sustainable ideas and responsible product reuse.",
  },
  {
    icon: TreePine,
    title: "Environmental impact",
    description: "Support initiatives focused on reducing avoidable waste.",
  },
];

export default function Donation() {
  const [amount, setAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [notice, setNotice] = useState("");

  const donationAmount =
    customAmount.trim() !== "" ? Number(customAmount) : amount ?? 0;

  const selectAmount = (value: number) => {
    setAmount(value);
    setCustomAmount("");
    setNotice("");
  };

  const handleDonate = () => {
    setNotice("");

    if (
      !Number.isFinite(donationAmount) ||
      donationAmount < 10 ||
      !Number.isSafeInteger(donationAmount)
    ) {
      setNotice("Enter a whole-number donation of at least ₹10.");
      return;
    }

    if (!anonymous && !name.trim()) {
      setNotice("Enter your name or choose anonymous donation.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setNotice("Enter a valid email address for your donation receipt.");
      return;
    }

    setNotice(
      "Donation form validated. Connect the verified GreenCore donation API and Razorpay checkout to accept payments."
    );
  };

  return (
    <main className="donation-page">
      <div className="donation-background-glow donation-glow-one" />
      <div className="donation-background-glow donation-glow-two" />

      <section className="donation-hero">
        <div className="donation-hero-copy">
          <span className="donation-eyebrow">
            <span className="donation-eyebrow-dot" />
            MAKE A DIFFERENCE
          </span>

          <h1>
            Donate for a
            <span> Greener Tomorrow</span>
          </h1>

          <p className="donation-hero-description">
            Support GreenCore in building a cleaner, greener and more
            sustainable future. Your contribution can help advance recycling,
            environmental awareness and responsible reuse under Vidyagyan
            leadership.
          </p>

          <div className="donation-hero-benefits">
            <div>
              <span className="donation-round-icon">
                <Recycle size={23} />
              </span>
              <span>Support<br />recycling</span>
            </div>
            <div>
              <span className="donation-round-icon">
                <Users size={23} />
              </span>
              <span>Empower<br />communities</span>
            </div>
            <div>
              <span className="donation-round-icon">
                <ShieldCheck size={23} />
              </span>
              <span>Build a<br />sustainable future</span>
            </div>
          </div>
        </div>

        <div className="donation-hero-art" aria-hidden="true">
          <div className="donation-orbit donation-orbit-one" />
          <div className="donation-orbit donation-orbit-two" />
          <div className="donation-planet">
            <Globe2 size={146} strokeWidth={0.8} />
          </div>
          <div className="donation-plant">
            <Sprout size={110} strokeWidth={1.3} />
          </div>
          <div className="donation-art-caption">
            <Leaf size={21} />
            <span>Small actions. Lasting impact.</span>
          </div>
        </div>

        <aside className="donation-leadership-card">
          <div className="donation-leadership-icon">
            <Sprout size={38} />
          </div>
          <div>
            <h2>
              Green<span>Core</span>
            </h2>
            <p className="donation-initiative">A Vidyagyan Initiative</p>
          </div>
          <p className="donation-leadership-copy">
            <Leaf size={17} />
            <span>
              Officially approved and led by Vidyagyan for a cleaner, greener
              and more sustainable future.
            </span>
          </p>
        </aside>
      </section>

      <section className="donation-content-grid">
        <div className="donation-information-column">
          <section className="donation-panel donation-helps-panel">
            <div className="donation-panel-heading">
              <span className="donation-panel-icon">
                <Heart size={22} />
              </span>
              <div>
                <h2>How Your Donation Helps</h2>
                <p>Your support can contribute to environmental initiatives.</p>
              </div>
            </div>

            <div className="donation-impact-grid">
              {impactItems.map((item) => {
                const Icon = item.icon;
                return (
                  <article className="donation-impact-item" key={item.title}>
                    <span className="donation-impact-icon">
                      <Icon size={26} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="donation-panel donation-goals-panel">
            <div className="donation-panel-heading">
              <span className="donation-panel-icon">
                <Sprout size={22} />
              </span>
              <div>
                <h2>Our Impact Goals</h2>
                <p>Help us work toward a more sustainable future.</p>
              </div>
            </div>

            <div className="donation-goals-grid">
              <div>
                <Recycle size={25} />
                <strong>Responsible</strong>
                <span>recycling</span>
              </div>
              <div>
                <Users size={25} />
                <strong>Community</strong>
                <span>awareness</span>
              </div>
              <div>
                <Sprout size={25} />
                <strong>Green</strong>
                <span>innovation</span>
              </div>
              <div>
                <Globe2 size={25} />
                <strong>Cleaner</strong>
                <span>environment</span>
              </div>
            </div>

            <p className="donation-goals-note">
              These are areas of focus, not verified impact totals.
            </p>
          </section>
        </div>

        <section className="donation-panel donation-form-panel">
          <div className="donation-form-heading">
            <div className="donation-panel-heading">
              <span className="donation-panel-icon">
                <Wallet size={22} />
              </span>
              <div>
                <h2>Choose Your Contribution</h2>
                <p>Every contribution counts.</p>
              </div>
            </div>

            <div className="donation-frequency" aria-label="Donation frequency">
              <button
                type="button"
                className={frequency === "once" ? "active" : ""}
                onClick={() => setFrequency("once")}
              >
                One-time
              </button>
              <button
                type="button"
                className={frequency === "monthly" ? "active" : ""}
                onClick={() => setFrequency("monthly")}
              >
                Monthly
              </button>
            </div>
          </div>

          {frequency === "monthly" && (
            <div className="donation-frequency-note">
              Monthly contributions are a design option. Recurring billing
              must be configured and authorized before it can be used.
            </div>
          )}

          <div className="donation-amount-grid">
            {donationOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={
                  !customAmount && amount === value ? "selected" : ""
                }
                aria-pressed={!customAmount && amount === value}
                onClick={() => selectAmount(value)}
              >
                ₹{value.toLocaleString("en-IN")}
              </button>
            ))}
          </div>

          <label className="donation-field-label" htmlFor="donation-amount">
            Or enter a custom amount (₹)
          </label>

          <div className="donation-input-wrap donation-amount-input">
            <span>₹</span>
            <input
              id="donation-amount"
              type="number"
              min="10"
              step="1"
              inputMode="numeric"
              placeholder="Enter donation amount (minimum ₹10)"
              value={customAmount}
              onChange={(event) => {
                setCustomAmount(event.target.value);
                setAmount(null);
                setNotice("");
              }}
            />
          </div>

          <div className="donation-form-divider" />

          <h3 className="donation-donor-heading">Donor Information</h3>

          <div className="donation-donor-grid">
            <label>
              <span>Full Name {!anonymous && "*"}</span>
              <div className="donation-input-wrap">
                <Users size={18} />
                <input
                  type="text"
                  placeholder="Enter your name"
                  autoComplete="name"
                  value={name}
                  disabled={anonymous}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            </label>

            <label>
              <span>Email Address *</span>
              <div className="donation-input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </label>
          </div>

          <label className="donation-anonymous">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(event) => setAnonymous(event.target.checked)}
            />
            <span className="donation-custom-checkbox">
              <CheckCircle2 size={15} />
            </span>
            <span>Donate anonymously</span>
            <CircleHelp size={16} />
            <small>Your name will not be displayed publicly.</small>
          </label>

          <div className="donation-summary">
            <span>Your contribution</span>
            <strong>
              ₹{Math.max(0, donationAmount || 0).toLocaleString("en-IN")}
            </strong>
            <span>{frequency === "once" ? "One-time" : "Monthly"}</span>
          </div>

          <button
            type="button"
            className="donation-submit-button"
            onClick={handleDonate}
          >
            <ShieldCheck size={19} />
            Continue to Donate
            <ArrowRight size={19} />
          </button>

          {notice && (
            <p className="donation-form-notice" role="status">
              {notice}
            </p>
          )}

          <p className="donation-secure-note">
            <LockKeyhole size={15} />
            Secure payment integration required. Payment details should be
            handled by the authorized payment gateway.
          </p>
        </section>
      </section>

      <section className="donation-bottom-grid">
        <article className="donation-bottom-card">
          <span className="donation-bottom-icon">
            <ShieldCheck size={28} />
          </span>
          <div>
            <h2>Transparency &amp; Trust</h2>
            <p>
              GreenCore aims to support environmental initiatives responsibly.
              Donation allocation and reporting should be published clearly.
            </p>
            <Link to="/vision-mission">
              Our mission <ArrowRight size={15} />
            </Link>
          </div>
        </article>

        <article className="donation-bottom-card">
          <span className="donation-bottom-icon">
            <FileText size={28} />
          </span>
          <div>
            <h2>View Your Donation History</h2>
            <p>
              Access your account to review available order information. A
              dedicated donation history will require donation records.
            </p>
            <Link to="/account">
              My account <ArrowRight size={15} />
            </Link>
          </div>
        </article>
      </section>

      <section className="donation-trust-strip">
        <div>
          <LockKeyhole size={23} />
          <span>
            <strong>Secure payments</strong>
            <small>Gateway-based checkout</small>
          </span>
        </div>
        <div>
          <ShieldCheck size={23} />
          <span>
            <strong>Data protection</strong>
            <small>Minimize sensitive data</small>
          </span>
        </div>
        <div>
          <FileText size={23} />
          <span>
            <strong>Transparent use</strong>
            <small>Clear donation reporting</small>
          </span>
        </div>
        <div>
          <Sprout size={23} />
          <span>
            <strong>Vidyagyan leadership</strong>
            <small>A Vidyagyan Initiative</small>
          </span>
        </div>
      </section>

      <div className="donation-back-link">
        <Link to="/">
          <ChevronRight size={15} />
          Back to GreenCore
        </Link>
      </div>
    </main>
  );
}
