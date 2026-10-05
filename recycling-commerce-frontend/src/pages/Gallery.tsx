import { useMemo, useState } from "react";
import {
  Facebook,
  Instagram,
  Leaf,
  Linkedin,
  Sparkles,
} from "lucide-react";
import "./Gallery.css";
import { siteBrand } from "../config/brand";

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
      <section className="gallery-hero gallery-hero-clean">
        <div className="gallery-clean-background" />
        <div className="gallery-clean-grid" />
        <div className="gallery-clean-glow gallery-clean-glow-one" />
        <div className="gallery-clean-glow gallery-clean-glow-two" />

        <div className="gallery-clean-container">
          <div className="gallery-clean-copy">
            <span className="gallery-clean-initiative">
              {siteBrand.initiativeLabel}
            </span>

            <h1>
              Behind the
              <span>mission.</span>
            </h1>

            <p className="gallery-clean-lead">
              Meet the people turning ideas into meaningful action for a
              cleaner, greener and more circular future.
            </p>

            <p className="gallery-clean-support">
              GreenCore brings together people, ideas and technology to give
              materials a second life.
            </p>

            <div className="gallery-clean-meta">
              <div>
                <strong>01</strong>
                <span>People</span>
              </div>

              <div>
                <strong>02</strong>
                <span>Ideas</span>
              </div>

              <div>
                <strong>03</strong>
                <span>Impact</span>
              </div>
            </div>

            <div className="gallery-clean-filter-wrap">
              <span>EXPLORE THE TEAM</span>

              <div className="gallery-filters">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={activeFilter === filter ? "active" : ""}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="gallery-clean-visual" aria-hidden="true">
            <div className="gallery-clean-visual-glow" />

            <div className="gallery-clean-ring gallery-clean-ring-one" />
            <div className="gallery-clean-ring gallery-clean-ring-two" />
            <div className="gallery-clean-ring gallery-clean-ring-three" />

            <div className="gallery-clean-core">
              <Leaf size={64} strokeWidth={1.35} />
              <span>GREENCORE</span>
              <strong>PEOPLE • IDEAS • IMPACT</strong>
            </div>

            <div className="gallery-clean-card gallery-clean-card-top">
              <span>01</span>
              <div>
                <strong>PEOPLE</strong>
                <small>Building the mission</small>
              </div>
            </div>

            <div className="gallery-clean-card gallery-clean-card-bottom">
              <span>03</span>
              <div>
                <strong>IMPACT</strong>
                <small>Creating meaningful change</small>
              </div>
            </div>
          </div>
        </div>

        <div className="gallery-clean-scroll">
          <span />
          SCROLL TO MEET THE TEAM
        </div>
      </section>

      {/* TEAM CARDS */}
      <section className="gallery-team-section">
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


    </main>
  );
}
