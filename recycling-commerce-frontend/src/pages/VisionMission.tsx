import {
  ArrowUpRight,
  Atom,
  Earth,
  Heart,
  Leaf,
  Orbit,
  Recycle,
  ShieldCheck,
  Sparkles,
  Target,
  TreePine,
  Waves,
  Zap,
} from "lucide-react";

export default function VisionMission() {
  return (
    <main className="vm-future-page">
      {/* HERO */}
      <section className="vm-future-hero">
        <div className="vm-grid-overlay" />
        <div className="vm-noise" />

        <div className="vm-glow vm-glow-one" />
        <div className="vm-glow vm-glow-two" />
        <div className="vm-glow vm-glow-three" />

        <div className="vm-future-container">
          <div className="vm-hero-layout">
            <div className="vm-hero-copy">
              <div className="vm-future-eyebrow">
                <span className="vm-eyebrow-dot" />
                THE FUTURE OF CIRCULAR LIVING
              </div>

              <h1>
                Reimagining
                <br />
                <span>what comes</span>
                <br />
                <em>next.</em>
              </h1>

              <p>
                We are building a future where materials
                stay valuable, waste becomes opportunity,
                and sustainable choices become part of
                everyday life.
              </p>

              <div className="vm-hero-actions">
                <a href="/calculator" className="vm-primary-button">
                  <Sparkles size={17} />
                  <span>Discover your impact</span>
                  <ArrowUpRight size={17} />
                </a>

                <div className="vm-scroll-indicator">
                  <span className="vm-scroll-line" />
                  SCROLL TO EXPLORE
                </div>
              </div>
            </div>

            {/* FUTURISTIC ORBIT */}
            <div className="vm-orbit-stage">
              <div className="vm-orbit-label vm-orbit-label-top">
                <span />
                CIRCULAR SYSTEM
              </div>

              <div className="vm-orbit-circle vm-orbit-circle-outer" />
              <div className="vm-orbit-circle vm-orbit-circle-middle" />
              <div className="vm-orbit-circle vm-orbit-circle-inner" />

              <div className="vm-orbit-dash vm-orbit-dash-one" />
              <div className="vm-orbit-dash vm-orbit-dash-two" />

              <div className="vm-core-glow" />

              <div className="vm-core">
                <Recycle size={62} strokeWidth={1.5} />

                <span>RECYCLE</span>
                <strong>REDEFINE</strong>
              </div>

              <div className="vm-orbit-node vm-node-one">
                <Leaf size={17} />
              </div>

              <div className="vm-orbit-node vm-node-two">
                <Waves size={17} />
              </div>

              <div className="vm-orbit-node vm-node-three">
                <TreePine size={17} />
              </div>

              <div className="vm-orbit-node vm-node-four">
                <Atom size={17} />
              </div>

              <div className="vm-orbit-label vm-orbit-label-bottom">
                <span>01</span>
                PEOPLE · PLANET · PROGRESS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VISION */}
      <section className="vm-future-section vm-vision-section">
        <div className="vm-future-container">
          <div className="vm-section-index">
            <span>01</span>
            <div />
            OUR VISION
          </div>

          <div className="vm-big-card vm-vision-card">
            <div className="vm-card-glow" />

            <div className="vm-card-content">
              <div className="vm-card-icon">
                <Earth size={27} />
              </div>

              <span className="vm-card-kicker">
                A WORLD BEYOND WASTE
              </span>

              <h2>
                Nothing useful
                <br />
                should have to
                <br />
                <em>become waste.</em>
              </h2>

              <p>
                We imagine a world where products,
                materials, and resources continuously
                move through a circular system — creating
                value again and again instead of being
                discarded after one use.
              </p>

              <div className="vm-card-stat-row">
                <div>
                  <strong>01</strong>
                  <span>LONGER LIFE</span>
                </div>

                <div>
                  <strong>∞</strong>
                  <span>REUSE</span>
                </div>

                <div>
                  <strong>01</strong>
                  <span>PLANET</span>
                </div>
              </div>
            </div>

            <div className="vm-vision-visual">
              <div className="vm-visual-ring ring-one" />
              <div className="vm-visual-ring ring-two" />
              <div className="vm-visual-ring ring-three" />

              <div className="vm-vision-center">
                <Leaf size={52} />
              </div>

              <span className="vm-visual-tag tag-one">
                MATERIAL
              </span>

              <span className="vm-visual-tag tag-two">
                REUSE
              </span>

              <span className="vm-visual-tag tag-three">
                FUTURE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="vm-future-section vm-mission-section">
        <div className="vm-future-container">
          <div className="vm-section-index">
            <span>02</span>
            <div />
            OUR MISSION
          </div>

          <div className="vm-big-card vm-mission-card">
            <div className="vm-mission-visual">
              <div className="vm-mission-grid" />

              <div className="vm-mission-center">
                <Target size={48} />
                <span>ACT</span>
              </div>

              <div className="vm-mission-point point-one">
                <Leaf size={16} />
              </div>

              <div className="vm-mission-point point-two">
                <Recycle size={16} />
              </div>

              <div className="vm-mission-point point-three">
                <Heart size={16} />
              </div>
            </div>

            <div className="vm-card-content">
              <div className="vm-card-icon">
                <Target size={27} />
              </div>

              <span className="vm-card-kicker">
                TURN INTENTION INTO ACTION
              </span>

              <h2>
                Make every
                <br />
                recycling action
                <br />
                <em>count.</em>
              </h2>

              <p>
                Our mission is to make sustainable living
                easier to understand and easier to act on.
                We connect responsible recycling with
                practical products, transparent information,
                and measurable impact.
              </p>

              <div className="vm-mission-points">
                <div>
                  <span>01</span>
                  <strong>MAKE IT SIMPLE</strong>
                </div>

                <div>
                  <span>02</span>
                  <strong>MAKE IT MEANINGFUL</strong>
                </div>

                <div>
                  <span>03</span>
                  <strong>MAKE IT LAST</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="vm-principles-section">
        <div className="vm-future-container">
          <div className="vm-principles-heading">
            <div className="vm-section-index">
              <span>03</span>
              <div />
              OUR PRINCIPLES
            </div>

            <h2>
              Designed for a
              <br />
              <em>better system.</em>
            </h2>

            <p>
              These principles shape how GreenCore
              thinks, builds, and grows.
            </p>
          </div>

          <div className="vm-principles-grid">
            <article className="vm-principle-card">
              <div className="vm-principle-number">01</div>

              <div className="vm-principle-icon">
                <Leaf size={24} />
              </div>

              <h3>Sustainability First</h3>

              <p>
                We prioritize choices that reduce
                environmental pressure and preserve
                resources for the future.
              </p>

              <div className="vm-principle-line" />
              <span>PLANET / PRIORITY</span>
            </article>

            <article className="vm-principle-card">
              <div className="vm-principle-number">02</div>

              <div className="vm-principle-icon">
                <Recycle size={24} />
              </div>

              <h3>Circular Thinking</h3>

              <p>
                We design around the idea that useful
                materials should continue moving through
                the economy.
              </p>

              <div className="vm-principle-line" />
              <span>MATERIAL / CIRCULARITY</span>
            </article>

            <article className="vm-principle-card">
              <div className="vm-principle-number">03</div>

              <div className="vm-principle-icon">
                <ShieldCheck size={24} />
              </div>

              <h3>Trust by Design</h3>

              <p>
                Clear information, responsible practices,
                and honest communication are fundamental
                to everything we build.
              </p>

              <div className="vm-principle-line" />
              <span>TRUST / TRANSPARENCY</span>
            </article>

            <article className="vm-principle-card">
              <div className="vm-principle-number">04</div>

              <div className="vm-principle-icon">
                <Heart size={24} />
              </div>

              <h3>People & Planet</h3>

              <p>
                Sustainable systems work when people can
                participate. We make responsible choices
                approachable for everyone.
              </p>

              <div className="vm-principle-line" />
              <span>PEOPLE / PLANET</span>
            </article>
          </div>
        </div>
      </section>

      {/* FUTURE CTA */}
      <section className="vm-future-cta-section">
        <div className="vm-future-container">
          <div className="vm-future-cta">
            <div className="vm-cta-grid" />
            <div className="vm-cta-glow" />

            <div className="vm-cta-content">
              <div className="vm-section-index vm-cta-index">
                <span>04</span>
                <div />
                THE NEXT STEP
              </div>

              <h2>
                The future isn't
                <br />
                somewhere <em>ahead.</em>
                <br />
                It's something we build.
              </h2>

              <p>
                Every recycled kilogram, every reused
                material, and every conscious choice moves
                us closer to a circular future.
              </p>

              <div className="vm-cta-buttons">
                <a href="/calculator">
                  <span>Calculate your impact</span>
                  <ArrowUpRight size={18} />
                </a>

                <a href="/shop" className="vm-cta-secondary">
                  Explore GreenCore
                </a>
              </div>
            </div>

            <div className="vm-cta-visual">
              <div className="vm-cta-circle cta-circle-one" />
              <div className="vm-cta-circle cta-circle-two" />
              <div className="vm-cta-circle cta-circle-three" />

              <div className="vm-cta-core">
                <Zap size={43} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
