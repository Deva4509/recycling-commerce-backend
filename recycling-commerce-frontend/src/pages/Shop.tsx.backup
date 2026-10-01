import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  Leaf,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  ShieldCheck,
  Recycle,
  TreePine,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { products } from "../data/products";
import { getProducts } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

const categoryOptions = [
  { id: "all", label: "All products" },
  { id: "c1", label: "Cotton" },
  { id: "c2", label: "Wood" },
  { id: "c3", label: "Glass" },
  { id: "c4", label: "Paper" },
];

export default function Shop() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(urlSearch);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [backendProducts, setBackendProducts] = useState<
    Awaited<ReturnType<typeof getProducts>>
  >([]);

  useEffect(() => {
    let mounted = true;

    getProducts()
      .then((data) => {
        if (mounted) {
          setBackendProducts(data);
        }
      })
      .catch((error) => {
        console.error("GreenCore: failed to load product images:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesCategory =
        category === "all" || product.category_id === category;

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.short_description || "").toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "price-low") {
        return Number(a.base_price) - Number(b.base_price);
      }

      if (sort === "price-high") {
        return Number(b.base_price) - Number(a.base_price);
      }

      if (sort === "name") {
        return a.name.localeCompare(b.name);
      }

      return 0;
    });
  }, [search, category, sort]);

  function handleAddToCart(productId: string) {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      console.error("GreenCore: product not found:", productId);
      return;
    }

    addToCart(product, 1);
  }

  function handleBuyNow(productId: string) {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      console.error("GreenCore: product not found:", productId);
      return;
    }

    navigate("/checkout", {
      state: {
        buyNowProduct: product,
        quantity: 1,
      },
    });
  }

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <div className="shop-hero-bg" />
        <div className="shop-hero-grid" />

        <div className="shop-container shop-hero-layout">
          <motion.div
            className="shop-hero-copy"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="shop-eyebrow">
              <span>
                <Sparkles size={14} />
              </span>
              THE GREENCORE COLLECTION
            </div>

            <h1>
              Shop products with a{" "}
              <em>second life.</em>
            </h1>

            <p>
              Thoughtfully selected everyday products made from materials
              that deserve another chance.
            </p>

            <div className="shop-hero-meta">
              <span>
                <Recycle size={15} />
                Recovered materials
              </span>
              <span>
                <Leaf size={15} />
                Conscious design
              </span>
            </div>
          </motion.div>

          <motion.div
            className="shop-hero-art"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 }}
          >
            <div className="shop-art-glow" />
            <div className="shop-art-orbit shop-art-orbit-one" />
            <div className="shop-art-orbit shop-art-orbit-two" />

            <div className="shop-material-stack">
              <div className="shop-material-sheet sheet-back">
                <span>RECYCLED</span>
                <strong>COTTON</strong>
              </div>

              <div className="shop-material-sheet sheet-middle">
                <span>RECLAIMED</span>
                <strong>WOOD</strong>
              </div>

              <motion.div
                className="shop-material-sheet sheet-front"
                animate={{ y: [0, -10, 0], rotate: [-4, 1, -4] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="shop-sheet-icon">
                  <Leaf size={64} strokeWidth={1.15} />
                </div>
                <span>GREENCORE</span>
                <strong>EVERYDAY<br />ESSENTIALS</strong>
              </motion.div>
            </div>

            <div className="shop-floating-note">
              <TreePine size={17} />
              <span>
                <strong>4 collections</strong>
                made for conscious living
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="shop-catalog">
        <div className="shop-container">
          <div className="shop-toolbar">
            <div className="shop-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search sustainable products..."
              />
            </div>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort products"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="shop-category-row">
            {categoryOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={category === item.id ? "active" : ""}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="shop-results-heading">
            <div>
              <p className="shop-kicker">CURATED FOR YOU</p>
              <h2>
                Sustainable <em>essentials.</em>
              </h2>
            </div>

            <span>{filteredProducts.length} products</span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="shop-product-grid">
              {filteredProducts.map((product, index) => {
                const favorite = isFavorite(product.id);

                return (
                  <motion.article
                    className="shop-product-card"
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -7 }}
                  >
                    <div className="shop-product-visual">
                      <span className="shop-eco-label">
                        <Leaf size={12} />
                        ECO CHOICE
                      </span>

                      <button
                        type="button"
                        className={`shop-favorite ${favorite ? "active" : ""}`}
                        onClick={() => toggleFavorite(product.id)}
                        aria-label={`${
                          favorite ? "Remove" : "Add"
                        } ${product.name} from wishlist`}
                      >
                        <Heart
                          size={18}
                          fill={favorite ? "currentColor" : "none"}
                        />
                      </button>

                      {(() => {
                        const backendProduct = backendProducts.find(
                          (item) =>
                            item.slug === product.slug ||
                            item.sku === product.sku ||
                            item.name === product.name
                        );

                        const galleryImages = [
                          ...(backendProduct?.images ?? []),
                        ].sort(
                          (a, b) =>
                            Number(b.is_primary) - Number(a.is_primary) ||
                            a.sort_order - b.sort_order
                        );

                        const primaryImage =
                          galleryImages.find((image) => image.is_primary)
                            ?.image_url ||
                          galleryImages[0]?.image_url;

                        return primaryImage ? (
                          <div className="shop-product-image-wrap">
                            <img
                              src={primaryImage}
                              alt={
                                galleryImages.find(
                                  (image) => image.is_primary
                                )?.alt_text ||
                                `${product.name} product image`
                              }
                              className="shop-product-image"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="shop-product-orb">
                            <Leaf size={65} strokeWidth={1.15} />
                          </div>
                        );
                      })()}

                      <div className="shop-product-material">
                        RECYCLED MATERIAL
                      </div>
                    </div>

                    <div className="shop-product-content">
                      <div className="shop-rating">
                        <span>
                          <Star size={12} fill="currentColor" />
                          4.9
                        </span>
                        <small>124 reviews</small>
                      </div>

                      <Link
                        to={`/product/${product.slug}`}
                        className="shop-product-title"
                      >
                        {product.name}
                      </Link>

                      <div className="shop-product-actions">
                        <button
                          type="button"
                          className="shop-buy-now"
                          onClick={() => handleBuyNow(product.id)}
                        >
                          <Sparkles size={15} />
                          Buy now
                          <ArrowRight size={14} />
                        </button>

                        <button
                          type="button"
                          className="shop-add-cart"
                          onClick={() => handleAddToCart(product.id)}
                        >
                          <ShoppingBag size={15} />
                          Add to cart
                        </button>
                      </div>

                      <div className="shop-product-benefits">
                        <span>
                          <Leaf size={13} />
                          Eco friendly
                        </span>
                        <span>
                          <Recycle size={13} />
                          Recycled
                        </span>
                        <span>
                          <ShieldCheck size={13} />
                          Secure
                        </span>
                      </div>

                      <p>
                        {product.short_description ||
                          "Thoughtfully made from recovered materials."}
                      </p>

                      <div className="shop-product-bottom">
                        <strong>{formatPrice(product.base_price)}</strong>

                        <Link
                          to={`/product/${product.slug}`}
                          className="shop-product-button"
                        >
                          <ShoppingBag size={16} />
                          View
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          ) : (
            <div className="shop-empty">
              <Leaf size={38} />
              <h3>No products found</h3>
              <p>Try another search or category.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
              >
                Reset filters
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
