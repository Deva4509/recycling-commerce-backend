import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CircleUserRound,
  Facebook,
  Instagram,
  Linkedin,
  Leaf,
  Mail,
  Recycle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { siteBrand } from "../config/brand";
import "./Gallery.css";

type TeamMember = {
  number: string;
  department: string;
  post: string;
  name: string;
  description: string;
};

const teamMembers: TeamMember[] = [
  {
    number: "01",
    department: "Leadership",
    post: "CEO (CHIEF EXECUTIVE OFFICER)",
    name: "Pawan",
    description: "Building a stronger vision for a cleaner and more circular future.",
  },
  {
    number: "02",
    department: "Operations",
    post: "COO (CHIEF OPERATING OFFICER)",
    name: "Leadership Team",
    description: "Turning our plans into smooth, consistent execution.",
  },
  {
    number: "03",
    department: "Finance",
    post: "CFO (CHIEF FINANCIAL OFFICER)",
    name: "Kashish",
    description: "Creating financial discipline that supports sustainable growth.",
  },
  {
    number: "04",
    department: "Marketing",
    post: "CMO (CHIEF MARKETING OFFICER)",
    name: "Leadership Team",
    description: "Building awareness and connecting GreenCore with more people.",
  },
  {
    number: "05",
    department: "Sales",
    post: "CSO (CHIEF SALES OFFICER)",
    name: "Leadership Team",
    description: "Turning meaningful relationships into sustainable growth.",
  },
  {
    number: "06",
    department: "Technology",
    post: "CTO (CHIEF TECHNOLOGY OFFICER)",
    name: "Rudraksh",
    description: "Using technology to make GreenCore smarter and more efficient.",
  },
  {
    number: "07",
    department: "Technology",
    post: "HOT (HEAD OF TECHNOLOGY)",
    name: "Devansh Yadav",
    description: "Driving technology forward through innovation and practical solutions.",
  },
  {
    number: "08",
    department: "People",
    post: "HR HEAD (HEAD OF HUMAN RESOURCES)",
    name: "Leadership Team",
    description: "Building a team where people can learn, contribute and grow.",
  },
  {
    number: "09",
    department: "Supply Chain",
    post: "SUPPLY & LOGISTICS HEAD",
    name: "Leadership Team",
    description: "Keeping materials and delivery moving with precision.",
  },
  {
    number: "10",
    department: "R&D",
    post: "PRODUCT DEVELOPMENT HEAD",
    name: "Leadership Team",
    description: "Creating better products from materials that deserve another life.",
  },
  {
    number: "11",
    department: "Digital Communications",
    post: "SOCIAL MEDIA HEAD",
    name: "Leadership Team",
    description: "Giving GreenCore a stronger voice across the digital world.",
  },
];

const departmentIcons = {
  Leadership: ShieldCheck,
  Operations: BriefcaseBusiness,
  Finance: Building2,
  Marketing: Users,
  Sales: ArrowUpRight,
  Technology: Recycle,
  People: CircleUserRound,
  "Supply Chain": Building2,
  "R&D": Recycle,
  "Digital Communications": Mail,
};

function TeamCard({ member }: { member: TeamMember }) {
  const DepartmentIcon =
    departmentIcons[member.department as keyof typeof departmentIcons] ??
    Users;

  return (
    <article className="gallery-team-card">
      <div className="gallery-card-visual">
        <span className="gallery-card-number">{member.number}</span>

        <span className="gallery-card-department">
          <DepartmentIcon size={10} />
          {member.department}
        </span>

        <div className="gallery-card-brand">
          <Leaf size={14} />
          <span>GREENCORE</span>
        </div>

        <div className="gallery-card-orbit gallery-card-orbit-one" />
        <div className="gallery-card-orbit gallery-card-orbit-two" />
        <div className="gallery-card-glow" />
      </div>

      <div className="gallery-card-content">
        <div className="gallery-card-post">{member.post}</div>

        <h3>{member.name}</h3>

        <p>{member.description}</p>

        <div className="gallery-card-footer">
          <div className="gallery-card-socials">
            <button type="button" aria-label={`${member.name} Instagram`}>
              <Instagram size={11} />
            </button>
            <button type="button" aria-label={`${member.name} LinkedIn`}>
              <Linkedin size={11} />
            </button>
            <button type="button" aria-label={`${member.name} Facebook`}>
              <Facebook size={11} />
            </button>
          </div>

          <Leaf size={13} className="gallery-card-leaf" />
        </div>
      </div>
    </article>
  );
}

export default function Gallery() {
  return (
    <main className="greencore-gallery">
      <section className="gallery-hero">
        <div className="gallery-hero-background" aria-hidden="true" />
        <div className="gallery-hero-grid" aria-hidden="true" />
        <div className="gallery-hero-glow gallery-hero-glow-one" aria-hidden="true" />
        <div className="gallery-hero-glow gallery-hero-glow-two" aria-hidden="true" />

        <div className="gallery-container gallery-hero-content">
          <div className="gallery-hero-copy">
            <span className="gallery-hero-label">
              A VIDYAGYAN INITIATIVE
            </span>

            <h1>
              Meet the people
              <span>behind the mission.</span>
            </h1>

            <p>
              The people shaping GreenCore through leadership, technology,
              operations, innovation, and a shared commitment to a more circular
              future.
            </p>
          </div>

          <div className="gallery-hero-emblem" aria-hidden="true">
            <div className="gallery-emblem-ring gallery-emblem-ring-one" />
            <div className="gallery-emblem-ring gallery-emblem-ring-two" />
            <div className="gallery-emblem-ring gallery-emblem-ring-three" />

            <div className="gallery-emblem-core">
              <Recycle size={52} strokeWidth={1.1} />
              <span>GREENCORE</span>
            </div>
          </div>
        </div>
      </section>

      <section className="gallery-team-section">
        <div className="gallery-container">
          <div className="gallery-team-heading">
            <div>
              <span className="gallery-section-label">THE PEOPLE</span>
              <h2>Built by people with purpose.</h2>
            </div>

            <p>
              Meet the team structure behind GreenCore and the people working
              across every part of the mission.
            </p>
          </div>

          <div className="gallery-team-grid">
            {teamMembers.map((member) => (
              <TeamCard key={member.number} member={member} />
            ))}
          </div>
        </div>
      </section>

      <section className="gallery-impact-section">
        <div className="gallery-container">
          <div className="gallery-impact-card">
            <div className="gallery-impact-icon">
              <Recycle size={22} />
            </div>

            <div className="gallery-impact-copy">
              <span>THE CIRCULAR LIFESTYLE</span>
              <h2>Give everyday materials a second life.</h2>
              <p>
                Discover products made from recycled, reclaimed and upcycled
                materials.
              </p>
            </div>

            <Link to="/shop" className="gallery-impact-button">
              Explore products
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section className="gallery-leadership-section">
        <div className="gallery-container">
          <div className="gallery-leadership-card">
            <div className="gallery-leadership-icon">
              <ShieldCheck size={25} />
            </div>

            <div>
              <span>{siteBrand.organizationName}</span>
              <h2>A Vidyagyan Initiative</h2>
              <p>{siteBrand.leadershipStatement}.</p>
            </div>

            <div className="gallery-leadership-flow">
              <strong>VIDYAGYAN</strong>
              <span>↓</span>
              <strong>GREENCORE</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
