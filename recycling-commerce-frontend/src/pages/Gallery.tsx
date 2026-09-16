import { useMemo, useState } from "react";
import {
  Facebook,
  Instagram,
  Leaf,
  Linkedin,
  Sparkles,
} from "lucide-react";
import "./Gallery.css";

type Leader = {
  number: string;
  name: string;
  position: string;
  department: string;
  quote: string;
  image: string;
};

const leaders: Leader[] = [
  {
    number: "01",
    name: "Pawan",
    position: "CEO (Chief Executive Officer)",
    department: "Leadership",
    quote:
      "Building a stronger vision for a cleaner and more circular future.",
    image: "/members/member-1.jpg",
  },
  {
    number: "02",
    name: "Leadership Team",
    position: "COO (Chief Operating Officer)",
    department: "Operations",
    quote: "Turning our plans into smooth, consistent execution.",
    image: "/members/member-2.jpg",
  },
  {
    number: "03",
    name: "Kashish",
    position: "CFO (Chief Financial Officer)",
    department: "Finance",
    quote:
      "Creating financial discipline that supports sustainable growth.",
    image: "/members/member-3.jpg",
  },
  {
    number: "04",
    name: "Leadership Team",
    position: "CMO (Chief Marketing Officer)",
    department: "Marketing",
    quote:
      "Building awareness and connecting GreenCore with more people.",
    image: "/members/member-4.jpg",
  },
  {
    number: "05",
    name: "Leadership Team",
    position: "CSO (Chief Sales Officer)",
    department: "Sales",
    quote:
      "Turning meaningful relationships into sustainable growth.",
    image: "/members/member-5.jpg",
  },
  {
    number: "06",
    name: "Rudraksh",
    position: "CTO (Chief Technology Officer)",
    department: "Technology",
    quote:
      "Using technology to make GreenCore smarter and more efficient.",
    image: "/members/member-6.jpg",
  },
  {
    number: "07",
    name: "Devansh Yadav",
    position: "HoT (Head of Technology)",
    department: "Technology",
    quote:
      "Driving technology forward through innovation and practical solutions.",
    image: "/members/member-7.jpg",
  },
  {
    number: "08",
    name: "Leadership Team",
    position: "HR Head (Head of Human Resources)",
    department: "People",
    quote:
      "Building a team where people can learn, contribute and grow.",
    image: "/members/member-8.jpg",
  },
  {
    number: "09",
    name: "Leadership Team",
    position: "Supply & Logistics Head",
    department: "Supply Chain",
    quote:
      "Keeping materials and delivery moving with precision.",
    image: "/members/member-9.jpg",
  },
  {
    number: "10",
    name: "Leadership Team",
    position: "Product Development Head",
    department: "R&D",
    quote:
      "Creating better products from materials that deserve another life.",
    image: "/members/member-10.jpg",
  },
  {
    number: "11",
    name: "Leadership Team",
    position: "Social Media Head",
    department: "Digital Communications",
    quote:
      "Giving GreenCore a stronger voice across the digital world.",
    image: "/members/member-11.jpg",
  },
];

const filters = [
  "All",
  "Leadership",
  "Operations",
  "Finance",
  "Marketing",
  "Technology",
  "People",
  "Supply Chain",
  "R&D",
  "Digital Communications",
];

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredLeaders = useMemo(() => {
    if (activeFilter === "All") return leaders;
    return leaders.filter(
      (leader) => leader.department === activeFilter,
    );
  }, [activeFilter]);

  return (
    <main className="gallery-page">
      <section className="gallery-hero">
        <div className="gallery-grid" />

        <div className="gallery-glow gallery-glow-one" />
        <div className="gallery-glow gallery-glow-two" />

        <div className="gallery-particles">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>

        {/* LEFT FUTURISTIC EARTH */}
        <div className="gallery-earth">
          <div className="earth-atmosphere" />
          <div className="earth-sphere">
            <div className="earth-land earth-land-one" />
            <div className="earth-land earth-land-two" />
            <div className="earth-land earth-land-three" />
            <div className="earth-light earth-light-one" />
            <div className="earth-light earth-light-two" />
            <div className="earth-cloud cloud-one" />
            <div className="earth-cloud cloud-two" />
          </div>

          <div className="earth-orbit earth-orbit-one" />
          <div className="earth-orbit earth-orbit-two" />
          <div className="earth-orbit earth-orbit-three" />

          <div className="earth-leaf">
            <Leaf size={54} strokeWidth={1.4} />
          </div>
        </div>

        {/* LEFT HUD */}
        <div className="gallery-hud gallery-hud-left">
          <span>A</span>
          <span>CLEANER</span>
          <span>GREENER</span>
          <span>TOMORROW</span>
          <b />
        </div>

        {/* RIGHT HOLOGRAPHIC LEAF */}
        <div className="gallery-right-orbit">
          <div className="right-ring right-ring-one" />
          <div className="right-ring right-ring-two" />
          <div className="right-ring right-ring-three" />

          <div className="hologram-leaf">
            <Leaf size={150} strokeWidth={0.9} />
          </div>

          <span className="orbit-dot orbit-dot-one" />
          <span className="orbit-dot orbit-dot-two" />
          <span className="orbit-dot orbit-dot-three" />
        </div>

        {/* RIGHT HUD */}
        <div className="gallery-hud gallery-hud-right">
          <span>SUSTAINABLE</span>
          <span>PEOPLE</span>
          <span>STRONGER</span>
          <span>FUTURE</span>
          <b />
        </div>

        <div className="gallery-hud gallery-hud-bottom-right">
          <span>IDEAS</span>
          <span>INTO</span>
          <span>IMPACT</span>
        </div>

        {/* MAIN CONTENT */}
        <div className="gallery-hero-content">
          <div className="gallery-hero-mark">
            <Leaf size={64} strokeWidth={1.2} />
            <div>
              <span>People</span>
              <span>Ideas</span>
              <span>Impact</span>
            </div>
            <b />
          </div>

          <div className="gallery-eyebrow">
            PEOPLE BEHIND A GREENER TOMORROW
          </div>

          <h1>
            Our Team <span>Gallery</span>
          </h1>

          <div className="gallery-title-line">
            <i />
            <Leaf size={25} strokeWidth={1.5} />
            <i />
          </div>

          <p>
            A passionate team working towards a cleaner, greener and more
            sustainable world through innovation, recycling and community
            action.
          </p>

          <div className="gallery-filter-panel">
            <div className="gallery-filters">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={
                    activeFilter === filter ? "active" : ""
                  }
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FUTURISTIC PLATFORM */}
        <div className="gallery-platform">
          <div className="platform-ring platform-ring-one" />
          <div className="platform-ring platform-ring-two" />
          <div className="platform-ring platform-ring-three" />
          <div className="platform-core">
            <Sparkles size={20} />
          </div>
        </div>
      </section>

      {/* TEAM CARDS */}
      <section className="gallery-team-section">
        <div className="gallery-section-heading">
          <span>THE PEOPLE</span>
          <h2>Behind The Mission</h2>
          <p>
            The people turning ideas into meaningful action for a greener
            future.
          </p>
        </div>

        <div className="gallery-team-grid">
          {filteredLeaders.map((leader) => (
            <article className="gallery-team-card" key={leader.number}>
              <div className="team-image-wrap">
                <img
                  src={leader.image}
                  alt={`${leader.name} - ${leader.position}`}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.parentElement?.classList.add(
                      "image-missing",
                    );
                  }}
                />

                <div className="team-image-overlay" />
                <span className="team-number">{leader.number}</span>
                <span className="team-department">
                  {leader.department}
                </span>
              </div>

              <div className="team-card-body">
                <span className="team-position">
                  {leader.position}
                </span>

                <h3>{leader.name}</h3>

                <p>{leader.quote}</p>

                <div className="team-card-footer">
                  <div className="team-socials">
                    <a href="#" aria-label="Instagram">
                      <Instagram size={14} />
                    </a>
                    <a href="#" aria-label="LinkedIn">
                      <Linkedin size={14} />
                    </a>
                    <a href="#" aria-label="Facebook">
                      <Facebook size={14} />
                    </a>
                  </div>

                  <Leaf size={17} strokeWidth={1.5} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gallery-bottom-statement">
        <div className="statement-line" />
        <Leaf size={28} />
        <h2>TOGETHER FOR A GREENER TOMORROW</h2>
        <p>People • Ideas • Impact</p>
      </section>
    </main>
  );
}
