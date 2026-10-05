import { ArrowDown, CheckCircle2, Leaf, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { siteBrand } from "../../config/brand";

type VidyagyanLeadershipProps = {
  compact?: boolean;
};

export default function VidyagyanLeadership({
  compact = false,
}: VidyagyanLeadershipProps) {
  return (
    <section
      className={`vidyagyan-leadership ${
        compact ? "vidyagyan-leadership-compact" : ""
      }`}
    >
      <div className="vidyagyan-leadership-inner">
        <div className="vidyagyan-leadership-heading">
          <span className="vidyagyan-eyebrow">
            <ShieldCheck size={14} />
            INSTITUTIONAL LEADERSHIP
          </span>

          <h2>Led by Vidyagyan.</h2>

          <p>
            GreenCore operates as an officially approved initiative led by
            Vidyagyan, connecting sustainability, innovation, technology and
            circular commerce.
          </p>
        </div>

        <div className="vidyagyan-hierarchy">
          <div className="vidyagyan-level">
            <div className="vidyagyan-level-icon">
              <ShieldCheck size={22} />
            </div>

            <div>
              <strong>{siteBrand.organizationName}</strong>
              <span>{siteBrand.organizationRole}</span>
            </div>
          </div>

          <ArrowDown className="vidyagyan-arrow" size={20} />

          <div className="vidyagyan-level active">
            <div className="vidyagyan-level-icon">
              <Leaf size={22} />
            </div>

            <div>
              <strong>{siteBrand.initiativeName}</strong>
              <span>{siteBrand.initiativeLabel}</span>
            </div>
          </div>

          <ArrowDown className="vidyagyan-arrow" size={20} />

          <div className="vidyagyan-level">
            <div className="vidyagyan-level-icon">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <strong>REAL-WORLD IMPACT</strong>
              <span>Recycling • Reuse • Innovation</span>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="vidyagyan-leadership-footer">
            <span>{siteBrand.leadershipStatement}.</span>

            <Link to="/vidyagyan">
              Explore the relationship
              <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
