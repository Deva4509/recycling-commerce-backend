import { Link, useLocation } from "react-router-dom";
import { siteBrand } from "../../config/brand";
import {
  ArrowUpRight,
  Facebook,
  Instagram,
  Leaf,
  Linkedin,
  Mail,
  MapPin,
  Recycle,
  Sparkles,
  Twitter,
} from "lucide-react";

const exploreLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
];

const accountLinks = [
  { label: "Login", to: "/login" },
  { label: "Register", to: "/register" },
  { label: "Cart", to: "/cart" },
];

export default function Footer() {
  const location = useLocation();
  const compact = location.pathname === "/login" || location.pathname === "/register";

  return (
    <footer className={`rp-footer ${compact ? "rp-footer-compact" : ""}`}>
      <div className="rp-footer-orb rp-footer-orb-one" />
      <div className="rp-footer-orb rp-footer-orb-two" />

      <div className="rp-footer-container">

        {!compact && (
          <>
            <section className="rp-footer-cta">
              <div className="rp-footer-cta-icon">
                <Sparkles size={21} />
              </div>

              <div className="rp-footer-cta-copy">
                <span>THE CIRCULAR LIFESTYLE</span>
                <h2>Give everyday materials a second life.</h2>
                <p>
                  Discover beautiful products made from recycled, reclaimed
                  and upcycled materials.
                </p>
              </div>

              <Link to="/shop" className="rp-footer-cta-button">
                Explore products
                <ArrowUpRight size={17} />
              </Link>
            </section>

            <div className="rp-footer-divider" />
          </>
        )}

        <div className="rp-footer-grid">

          <div className="rp-footer-brand">
            <Link to="/" className="rp-footer-logo">
              <span className="rp-footer-logo-mark">
                <Leaf size={22} strokeWidth={2.3} />
              </span>
              <span className="rp-footer-logo-copy">
                <span>
                  Green<span>Core</span>
                </span>
                <small className="rp-footer-logo-subtitle">
                  {siteBrand.initiativeLabel}
                </small>
              </span>
            </Link>

            {!compact && (
              <>
                <div className="footer-vgyan-identity">
                  <strong>{siteBrand.initiativeLabel}</strong>
                  <span>{siteBrand.leadershipStatement}.</span>
                </div>

                <p className="rp-footer-brand-description">
                  A modern marketplace for thoughtful products created from
                  materials that deserve a second life.
                </p>

                <p className="rp-footer-institutional">
                  {siteBrand.leadershipStatement}.
                </p>

                <div className="rp-footer-contact">
                  <div>
                    <MapPin size={15} />
                    <span>Building a greener future</span>
                  </div>

                  <a href="mailto:hello@greencore.com">
                    <Mail size={15} />
                    <span>hello@greencore.com</span>
                  </a>
                </div>
              </>
            )}
          </div>

          <div className="rp-footer-links">
            <span className="rp-footer-heading">DISCOVER</span>

            {exploreLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
                <ArrowUpRight size={13} />
              </Link>
            ))}
          </div>

          <div className="rp-footer-links">
            <span className="rp-footer-heading">GREENCORE</span>

            <Link to="/shop">
              Materials
              <ArrowUpRight size={13} />
            </Link>

            <Link to="/shop">
              Our impact
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="rp-footer-links">
            <span className="rp-footer-heading">VIDYAGYAN</span>

            <Link to="/vidyagyan">
              GreenCore initiative
              <ArrowUpRight size={13} />
            </Link>

            <Link to="/vidyagyan">
              Institutional leadership
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {!compact && (
            <div className="rp-footer-impact">
              <div className="rp-footer-impact-icon">
                <Recycle size={21} />
              </div>

              <span className="rp-footer-impact-label">OUR IMPACT</span>

              <h3>Waste becomes worth.</h3>

              <p>
                Every purchase keeps useful materials in circulation and helps
                move us toward a more circular future.
              </p>

              <div className="rp-footer-impact-tags">
                <span>RECYCLE</span>
                <span>REUSE</span>
                <span>REIMAGINE</span>
              </div>
            </div>
          )}
        </div>

        <div className="rp-footer-bottom">
          <span>© 2026 GreenCore. All rights reserved.</span>

          <div className="rp-footer-socials">
            <a href="#" aria-label="Instagram">
              <Instagram size={16} />
            </a>
            <a href="#" aria-label="Facebook">
              <Facebook size={16} />
            </a>
            <a href="#" aria-label="Twitter">
              <Twitter size={16} />
            </a>
            <a href="#" aria-label="LinkedIn">
              <Linkedin size={16} />
            </a>
          </div>

          <span>Designed for a circular future.</span>
        </div>

      </div>
    </footer>
  );
}
