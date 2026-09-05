import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Leaf, PackageCheck, Recycle, ShoppingBag, Sparkles, TreePine } from "lucide-react";
import { Link } from "react-router-dom";
import FAQ from "../components/home/FAQ";

const benefits = [
  { icon: Recycle, title: "Waste, reimagined", text: "We turn recovered materials into products worth keeping." },
  { icon: PackageCheck, title: "Thoughtfully made", text: "Every product is selected for quality, usefulness and longevity." },
  { icon: TreePine, title: "Better for the planet", text: "Small everyday choices can keep valuable materials in circulation." },
];

const materials = [
  { label: "RECYCLED", name: "Cotton", value: "34%", icon: Leaf },
  { label: "RECLAIMED", name: "Wood", value: "28%", icon: TreePine },
  { label: "RECOVERED", name: "Glass", value: "21%", icon: Recycle },
  { label: "UPCYCLED", name: "Paper", value: "17%", icon: PackageCheck },
];

export default function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-background" />
        <div className="home-hero-grid" />
        <div className="home-container home-hero-layout">
          <motion.div
            className="home-hero-content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="home-eyebrow">
              <span><Sparkles size={14} /></span>
              SUSTAINABLE MARKETPLACE
            </div>

            <h1>
              Products that give{" "}
              <span className="home-highlight">waste</span>{" "}
              a second life.
            </h1>

            <p>
              Discover beautifully designed everyday products made from
              recovered, recycled and upcycled materials.
            </p>

            <div className="home-hero-actions">
              <Link to="/shop" className="home-primary-button">
                Explore the collection <ArrowRight size={17} />
              </Link>
              <a href="#why-recycle" className="home-secondary-button">
                Why recycled?
              </a>
            </div>

            <div className="home-proof">
              <div className="home-proof-avatars">
                <span>R</span><span>E</span><span>C</span><span>Y</span>
              </div>
              <div>
                <strong>Designed for conscious living</strong>
                <small>Made to be used, loved and reused.</small>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="home-hero-art"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="home-art-glow" />
            <div className="home-art-ring home-art-ring-one" />
            <div className="home-art-ring home-art-ring-two" />

            <motion.div
              className="home-art-orb"
              animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="home-art-orb-inner">
                <Leaf size={100} strokeWidth={1.1} />
              </div>
            </motion.div>

            <div className="home-floating-card home-floating-card-top">
              <div className="home-floating-icon"><Recycle size={17} /></div>
              <div>
                <span>OUR IMPACT</span>
                <strong>Materials in motion</strong>
              </div>
            </div>

            <div className="home-floating-card home-floating-card-bottom">
              <TreePine size={18} />
              <div>
                <strong>1 choice</strong>
                <span>can create a ripple</span>
              </div>
            </div>

            <div className="home-art-tag">
              <CheckCircle2 size={15} />
              CIRCULAR BY DESIGN
            </div>
          </motion.div>
        </div>

        <div className="home-scroll-cue">
          <span /> SCROLL TO EXPLORE
        </div>
      </section>

      <section className="home-stats">
        <div className="home-container home-stats-grid">
          <div><strong>4</strong><span>material collections</span></div>
          <div><strong>100%</strong><span>recovered-material focus</span></div>
          <div><strong>∞</strong><span>possibilities for reuse</span></div>
          <div><strong>1</strong><span>planet we share</span></div>
        </div>
      </section>

      <section className="home-section" id="why-recycle">
        <div className="home-container">
          <div className="home-section-heading">
            <div>
              <p className="home-kicker">THE RECYCLEPRO IDEA</p>
              <h2>
                Good design shouldn't have to
                <em> cost the earth.</em>
              </h2>
            </div>
            <p>
              Recyclepro brings sustainable products together in one place,
              making the better choice feel effortless.
            </p>
          </div>

          <div className="home-benefits-grid">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.article
                  className="home-benefit-card"
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -7 }}
                >
                  <div className="home-benefit-number">0{index + 1}</div>
                  <div className="home-benefit-icon"><Icon size={22} /></div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.text}</p>
                  <span className="home-card-arrow"><ArrowRight size={16} /></span>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-materials">
        <div className="home-container">
          <div className="home-materials-header">
            <div>
              <p className="home-kicker">EXPLORE MATERIALS</p>
              <h2>From discarded to <em>desired.</em></h2>
            </div>
            <Link to="/shop" className="home-text-link">
              View all products <ArrowRight size={16} />
            </Link>
          </div>

          <div className="home-materials-grid">
            {materials.map((material, index) => {
              const Icon = material.icon;
              return (
                <motion.div
                  className={`home-material-card home-material-${index + 1}`}
                  key={material.name}
                  whileHover={{ y: -8 }}
                >
                  <div className="home-material-number">0{index + 1}</div>
                  <div className="home-material-symbol"><Icon size={22} /></div>
                  <div className="home-material-copy">
                    <span>{material.label}</span>
                    <h3>{material.name}</h3>
                  </div>
                  <strong>{material.value}</strong>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <FAQ />

      <section className="home-cta">
        <div className="home-cta-glow" />
        <div className="home-container home-cta-inner">
          <div className="home-cta-icon"><ShoppingBag size={27} /></div>
          <div>
            <p className="home-kicker">MAKE THE NEXT CHOICE COUNT</p>
            <h2>
              Your next everyday product
              <br />
              can be part of the <em>solution.</em>
            </h2>
          </div>
          <Link to="/shop" className="home-cta-button">
            Shop sustainably <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
