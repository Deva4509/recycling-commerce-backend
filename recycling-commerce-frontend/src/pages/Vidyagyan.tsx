import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Recycle,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { siteBrand } from "../config/brand";

const focusAreas = [
  {
    icon: Recycle,
    number: "01",
    title: "Recycling",
    text: "Giving recovered materials a more useful second life through practical circular-commerce solutions.",
  },
  {
    icon: Leaf,
    number: "02",
    title: "Reuse",
    text: "Encouraging products and choices that keep valuable materials in circulation for longer.",
  },
  {
    icon: Zap,
    number: "03",
    title: "Innovation",
    text: "Combining sustainability, technology, and practical ideas to create a modern GreenCore experience.",
  },
  {
    icon: Target,
    number: "04",
    title: "Responsible Consumption",
    text: "Helping customers make more conscious choices through accessible sustainable products.",
  },
];

const operatingModel = [
  {
    icon: ShieldCheck,
    step: "01",
    title: "Leadership & Approval",
    text: "Vidyagyan provides the institutional leadership, approval, and oversight framework for GreenCore.",
  },
  {
    icon: Leaf,
    step: "02",
    title: "GreenCore Initiative",
    text: "GreenCore operates as the focused sustainability, recycling, and circular-commerce initiative.",
  },
  {
    icon: Workflow,
    step: "03",
    title: "Circular Commerce",
    text: "The platform connects sustainable products, customers, innovation, and responsible consumption.",
  },
  {
    icon: Sparkles,
    step: "04",
    title: "Practical Impact",
    text: "The goal is to turn recovered and discarded materials into useful products and meaningful everyday choices.",
  },
];

export default function Vidyagyan() {
  return (
    <main className="vidyagyan-page">
      {/* =====================================================
          HERO
          ===================================================== */}
      <section className="vidyagyan-hero">
        <div className="vidyagyan-hero-grid" />
        <div className="vidyagyan-orbit vidyagyan-orbit-one" />
        <div className="vidyagyan-orbit vidyagyan-orbit-two" />
        <div className="vidyagyan-glow vidyagyan-glow-one" />
        <div className="vidyagyan-glow vidyagyan-glow-two" />

        <div className="vidyagyan-container vidyagyan-hero-layout">
          <div className="vidyagyan-hero-copy">
            <div className="vidyagyan-eyebrow">
              <span>
                <Sparkles size={14} />
              </span>
              {siteBrand.organizationName.toUpperCase()}
              <i />
              INSTITUTIONAL LEADERSHIP
            </div>

            <p className="vidyagyan-hero-kicker">
              {siteBrand.initiativeLabel}
            </p>

            <h1>
              GreenCore
              <span>under {siteBrand.organizationName}</span>
            </h1>

            <p className="vidyagyan-lead">
              {siteBrand.leadershipStatement}.
            </p>

            <p className="vidyagyan-intro">
              GreenCore is a sustainability, recycling, and circular-commerce
              initiative focused on innovation, responsible consumption, and
              giving recovered materials a second life.
            </p>

            <div className="vidyagyan-hero-actions">
              <Link to="/shop" className="vidyagyan-button vidyagyan-button-primary">
                Explore GreenCore
                <ArrowRight size={17} />
              </Link>

              <a
                href="#relationship"
                className="vidyagyan-button vidyagyan-button-secondary"
              >
                Understand the relationship
                <ArrowDown size={16} />
              </a>
            </div>
          </div>

          <div className="vidyagyan-hero-visual">
            <div className="vidyagyan-status-card">
              <div className="vidyagyan-status-top">
                <span className="vidyagyan-status-dot" />
                INSTITUTIONAL STATUS
                <span>01</span>
              </div>

              <div className="vidyagyan-status-core">
                <div className="vidyagyan-status-icon">
                  <ShieldCheck size={30} />
                </div>

                <div>
                  <strong>Officially approved</strong>
                  <p>and led by Vidyagyan</p>
                </div>
              </div>

              <div className="vidyagyan-status-line">
                <span />
              </div>

              <div className="vidyagyan-status-footer">
                <span>VIDYAGYAN</span>
                <b>→</b>
                <span>GREENCORE</span>
              </div>
            </div>

            <div className="vidyagyan-hero-orb">
              <div className="vidyagyan-orb-ring ring-a" />
              <div className="vidyagyan-orb-ring ring-b" />
              <div className="vidyagyan-orb-ring ring-c" />

              <div className="vidyagyan-orb-core">
                <Leaf size={35} />
              </div>

              <span className="vidyagyan-orb-label orb-label-top">
                LEADERSHIP
              </span>
              <span className="vidyagyan-orb-label orb-label-right">
                INNOVATION
              </span>
              <span className="vidyagyan-orb-label orb-label-bottom">
                IMPACT
              </span>
              <span className="vidyagyan-orb-label orb-label-left">
                SUSTAINABILITY
              </span>
            </div>
          </div>
        </div>

        <div className="vidyagyan-scroll-hint">
          <span>SCROLL TO EXPLORE</span>
          <ArrowDown size={14} />
        </div>
      </section>

      {/* =====================================================
          RELATIONSHIP
          ===================================================== */}
      <section
        className="vidyagyan-container vidyagyan-section vidyagyan-relationship-section"
        id="relationship"
      >
        <div className="vidyagyan-section-heading">
          <p className="vidyagyan-kicker">THE RELATIONSHIP</p>
          <h2>
            One institutional umbrella.
            <br />
            <span>One focused initiative.</span>
          </h2>
        </div>

        <div className="vidyagyan-relationship-grid">
          <div className="vidyagyan-relationship-copy">
            <div className="vidyagyan-mini-icon">
              <Users size={20} />
            </div>

            <h3>Why GreenCore operates under Vidyagyan</h3>

            <p>
              GreenCore operates as a focused sustainability and
              circular-commerce initiative under Vidyagyan leadership.
              This creates a clear institutional framework while allowing
              GreenCore to remain focused on its own products, customers,
              sustainability mission, and digital commerce experience.
            </p>

            <div className="vidyagyan-check-list">
              <div>
                <CheckCircle2 size={17} />
                <span>Institutional leadership</span>
              </div>
              <div>
                <CheckCircle2 size={17} />
                <span>Official approval and oversight</span>
              </div>
              <div>
                <CheckCircle2 size={17} />
                <span>Focused GreenCore execution</span>
              </div>
            </div>
          </div>

          <div className="vidyagyan-relationship-map">
            <div className="vidyagyan-map-node map-primary">
              <span>01</span>
              <strong>VIDYAGYAN</strong>
              <small>Institutional Leadership &amp; Umbrella</small>
            </div>

            <div className="vidyagyan-map-connector">
              <span />
              <ArrowDown size={16} />
              <span />
            </div>

            <div className="vidyagyan-map-node">
              <span>02</span>
              <strong>GREENCORE</strong>
              <small>A Vidyagyan Initiative</small>
            </div>

            <div className="vidyagyan-map-connector">
              <span />
              <ArrowDown size={16} />
              <span />
            </div>

            <div className="vidyagyan-map-node">
              <span>03</span>
              <strong>CIRCULAR COMMERCE</strong>
              <small>Products • Customers • Sustainability • Innovation</small>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOCUS AREAS
          ===================================================== */}
      <section className="vidyagyan-focus-section">
        <div className="vidyagyan-container">
          <div className="vidyagyan-section-heading vidyagyan-heading-centered">
            <p className="vidyagyan-kicker">WHAT GREENCORE FOCUSES ON</p>
            <h2>
              Turning sustainability
              <br />
              <span>into everyday action.</span>
            </h2>
            <p className="vidyagyan-heading-description">
              GreenCore brings the institutional framework of Vidyagyan
              together with a practical circular-commerce experience.
            </p>
          </div>

          <div className="vidyagyan-focus-grid">
            {focusAreas.map((area) => {
              const Icon = area.icon;

              return (
                <article className="vidyagyan-focus-card" key={area.number}>
                  <div className="vidyagyan-card-top">
                    <span>{area.number}</span>
                    <Icon size={21} />
                  </div>

                  <h3>{area.title}</h3>
                  <p>{area.text}</p>

                  <div className="vidyagyan-card-line" />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          OFFICIAL HIERARCHY
          ===================================================== */}
      <section
        className="vidyagyan-container vidyagyan-section"
        id="leadership"
      >
        <div className="vidyagyan-section-heading">
          <p className="vidyagyan-kicker">OFFICIAL HIERARCHY</p>
          <h2>
            From leadership
            <br />
            <span>to real-world impact.</span>
          </h2>
        </div>

        <div className="vidyagyan-hierarchy-panel">
          <div className="vidyagyan-hierarchy-track" />

          <div className="vidyagyan-hierarchy-item">
            <div className="vidyagyan-hierarchy-number">01</div>
            <div className="vidyagyan-hierarchy-content">
              <p>INSTITUTIONAL UMBRELLA</p>
              <h3>Vidyagyan</h3>
              <span>Official Leadership &amp; Institutional Oversight</span>
            </div>
            <ShieldCheck size={23} />
          </div>

          <div className="vidyagyan-hierarchy-item active">
            <div className="vidyagyan-hierarchy-number">02</div>
            <div className="vidyagyan-hierarchy-content">
              <p>SUSTAINABILITY INITIATIVE</p>
              <h3>GreenCore</h3>
              <span>A Vidyagyan Initiative</span>
            </div>
            <Leaf size={23} />
          </div>

          <div className="vidyagyan-hierarchy-item">
            <div className="vidyagyan-hierarchy-number">03</div>
            <div className="vidyagyan-hierarchy-content">
              <p>PLATFORM</p>
              <h3>Circular Commerce</h3>
              <span>Products • Customers • Sustainability • Innovation</span>
            </div>
            <Recycle size={23} />
          </div>

          <div className="vidyagyan-hierarchy-item">
            <div className="vidyagyan-hierarchy-number">04</div>
            <div className="vidyagyan-hierarchy-content">
              <p>IMPACT</p>
              <h3>Responsible Choices</h3>
              <span>Recycling • Reuse • Innovation • Responsible Consumption</span>
            </div>
            <Target size={23} />
          </div>
        </div>
      </section>

      {/* =====================================================
          OPERATING MODEL
          ===================================================== */}
      <section className="vidyagyan-operating-section">
        <div className="vidyagyan-container">
          <div className="vidyagyan-section-heading">
            <p className="vidyagyan-kicker">HOW THE INITIATIVE WORKS</p>
            <h2>
              A clear path from
              <br />
              <span>leadership to action.</span>
            </h2>
          </div>

          <div className="vidyagyan-operating-grid">
            {operatingModel.map((item) => {
              const Icon = item.icon;

              return (
                <article className="vidyagyan-operating-card" key={item.step}>
                  <div className="vidyagyan-operating-number">{item.step}</div>

                  <div className="vidyagyan-operating-icon">
                    <Icon size={21} />
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.text}</p>

                  <div className="vidyagyan-operating-arrow">
                    <ArrowRight size={15} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          TRUST / PURPOSE
          ===================================================== */}
      <section className="vidyagyan-container vidyagyan-section">
        <div className="vidyagyan-trust-panel">
          <div className="vidyagyan-trust-main">
            <div className="vidyagyan-trust-icon">
              <ShieldCheck size={28} />
            </div>

            <div>
              <p className="vidyagyan-kicker">OFFICIAL STATUS</p>
              <h2>GreenCore is a Vidyagyan Initiative.</h2>
              <p>
                {siteBrand.leadershipStatement}. The institutional
                relationship is intentionally clear while GreenCore remains
                the primary public-facing recycling and circular-commerce
                platform.
              </p>
            </div>
          </div>

          <div className="vidyagyan-trust-badges">
            <span>
              <CheckCircle2 size={15} />
              Officially approved
            </span>
            <span>
              <CheckCircle2 size={15} />
              Led by Vidyagyan
            </span>
            <span>
              <CheckCircle2 size={15} />
              Sustainability-focused
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          GREENCORE PURPOSE
          ===================================================== */}
      <section className="vidyagyan-container vidyagyan-section">
        <div className="vidyagyan-purpose-panel">
          <div className="vidyagyan-purpose-visual">
            <div className="purpose-circle circle-one" />
            <div className="purpose-circle circle-two" />
            <div className="purpose-circle circle-three" />

            <div className="purpose-core">
              <Recycle size={38} />
            </div>
          </div>

          <div className="vidyagyan-purpose-content">
            <p className="vidyagyan-kicker">GREENCORE'S ROLE</p>
            <h2>
              Turning waste
              <br />
              <span>into value.</span>
            </h2>

            <p>
              GreenCore gives recovered, recycled, reclaimed, and upcycled
              materials a path toward useful products while connecting
              sustainability with modern digital commerce.
            </p>

            <Link to="/shop" className="vidyagyan-text-link">
              Discover GreenCore products
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
          ===================================================== */}
      <section className="vidyagyan-final">
        <div className="vidyagyan-final-grid" />

        <div className="vidyagyan-container vidyagyan-final-inner">
          <p className="vidyagyan-kicker">THE NEXT STEP</p>

          <h2>
            Explore what
            <br />
            <span>GreenCore is building.</span>
          </h2>

          <p>
            Discover sustainable products and experience a circular-commerce
            platform operating under Vidyagyan leadership.
          </p>

          <Link to="/shop" className="vidyagyan-button vidyagyan-button-primary">
            Explore GreenCore
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
