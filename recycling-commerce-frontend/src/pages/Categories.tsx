import {
  ArrowRight,
  Box,
  CheckCircle2,
  GlassWater,
  Leaf,
  Recycle,
  ShoppingBag,
  Trees,
} from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  {
    id: "cotton",
    title: "Recycled Cotton",
    description:
      "Soft, durable products created from recovered textile fibers.",
    count: "12 products",
    icon: Leaf,
    tone: "green",
    visual: "cotton",
  },
  {
    id: "wood",
    title: "Reclaimed Wood",
    description:
      "Beautiful everyday pieces crafted from rescued and reclaimed timber.",
    count: "9 products",
    icon: Trees,
    tone: "earth",
    visual: "wood",
  },
  {
    id: "glass",
    title: "Recycled Glass",
    description:
      "Elegant reusable products created from recovered glass materials.",
    count: "8 products",
    icon: GlassWater,
    tone: "mint",
    visual: "glass",
  },
  {
    id: "paper",
    title: "Upcycled Paper",
    description:
      "Thoughtful stationery and products made from recovered paper.",
    count: "15 products",
    icon: Box,
    tone: "sand",
    visual: "paper",
  },
];

export default function Categories() {
  return (
    <main className="categories-page">
      <section className="categories-hero">
        <div className="categories-hero-glow glow-a" />
        <div className="categories-hero-glow glow-b" />

        <div className="categories-hero-inner">
          <div className="categories-hero-content">
            <div className="categories-eyebrow">
              <Recycle size={14} />
              EXPLORE BY MATERIAL
            </div>

            <h1>
              Choose a material.
              <br />
              <em>Make an impact.</em>
            </h1>

            <p>
              Discover thoughtfully designed products made from materials
              that deserve a second life.
            </p>

            <div className="categories-hero-buttons">
              <Link to="/shop" className="categories-main-button">
                Explore all products
                <ArrowRight size={16} />
              </Link>

              <a href="#materials" className="categories-outline-button">
                Browse materials
              </a>
            </div>
          </div>

          <div className="categories-visual">
            <div className="category-orbit orbit-large" />
            <div className="category-orbit orbit-small" />

            <div className="category-core">
              <div className="category-core-icon">
                <Recycle size={30} />
              </div>

              <span>GREENCORE</span>

              <strong>
                Give materials
                <br />
                another life.
              </strong>
            </div>

            <div className="material-float float-cotton">
              <Leaf size={16} />
              Cotton
            </div>

            <div className="material-float float-wood">
              <Trees size={16} />
              Wood
            </div>

            <div className="material-float float-glass">
              <GlassWater size={16} />
              Glass
            </div>

            <div className="material-float float-paper">
              <Box size={16} />
              Paper
            </div>
          </div>
        </div>
      </section>

      <section className="categories-introduction">
        <div>
          <span className="section-label">OUR MATERIALS</span>

          <h2>
            Waste is only waste
            <br />
            <em>until we rethink it.</em>
          </h2>
        </div>

        <p>
          Every category begins with a material that could have been
          discarded. We transform those resources into useful, beautiful
          products designed for everyday life.
        </p>
      </section>

      <section className="categories-materials" id="materials">
        <div className="categories-section-heading">
          <div>
            <span className="section-label">SHOP BY MATERIAL</span>
            <h2>Find your kind of green.</h2>
          </div>

          <Link to="/shop" className="view-all-link">
            View all products
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="categories-grid">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <article
                className={`material-category-card ${category.tone}`}
                key={category.id}
              >
                <div className={`material-card-visual ${category.visual}`}>
                  <div className="material-card-ring" />

                  <div className="material-card-icon">
                    <Icon size={43} strokeWidth={1.45} />
                  </div>

                  <span>{category.id}</span>
                </div>

                <div className="material-card-body">
                  <div className="material-card-meta">
                    <span>{category.count}</span>
                    <CheckCircle2 size={15} />
                  </div>

                  <h3>{category.title}</h3>

                  <p>{category.description}</p>

                  <Link
                    to={`/shop?category=${category.id}`}
                    className="material-shop-link"
                  >
                    Shop this material
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="categories-impact">
        <div className="categories-impact-copy">
          <span className="section-label light-label">
            THE CIRCULAR IDEA
          </span>

          <h2>
            Better products.
            <br />
            <em>Smarter resources.</em>
          </h2>

          <p>
            GreenCore connects conscious design with materials already in
            circulation, helping everyday objects become part of a longer
            story.
          </p>

          <Link to="/shop" className="categories-impact-button">
            Start shopping
            <ShoppingBag size={16} />
          </Link>
        </div>

        <div className="categories-impact-panel">
          <div className="impact-glow" />

          <div className="impact-main-icon">
            <Recycle size={29} />
          </div>

          <div className="impact-numbers">
            <div>
              <strong>44+</strong>
              <span>Products</span>
            </div>

            <div>
              <strong>4</strong>
              <span>Materials</span>
            </div>

            <div>
              <strong>100%</strong>
              <span>Circular</span>
            </div>
          </div>

          <div className="impact-cycle">
            <span>RECOVER</span>
            <i />
            <span>REMAKE</span>
            <i />
            <span>REUSE</span>
          </div>
        </div>
      </section>

      <section className="categories-final-cta">
        <div className="final-cta-icon">
          <Recycle size={25} />
        </div>

        <span className="section-label">READY TO MAKE A DIFFERENCE?</span>

        <h2>
          Find something worth giving
          <br />
          <em>a second life.</em>
        </h2>

        <Link to="/shop" className="categories-main-button">
          Visit the shop
          <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
