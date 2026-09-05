import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Heart,
  Leaf,
  Minus,
  Plus,
  Recycle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";

import { products } from "../data/products";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function ProductDetails() {
  const { addToCart } = useCart();
  const { slug } = useParams();

  const product = useMemo(
    () => products.find((item) => item.slug === slug || item.id === slug),
    [slug],
  );

  const [quantity, setQuantity] = useState(1);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <main className="product-details-page">
        <section className="product-not-found">
          <Leaf size={42} />
          <h1>Product not found</h1>
          <p>This product may have moved or is no longer available.</p>

          <Link to="/shop" className="product-back-link">
            <ArrowLeft size={17} />
            Back to Shop
          </Link>
        </section>
      </main>
    );
  }

  function handleAddToCart() {
    if (!product) return;

    addToCart(product, quantity);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 2200);
  }

  return (
    <main className="product-details-page">
      <div className="product-details-container">
        <Link to="/shop" className="product-back-link">
          <ArrowLeft size={16} />
          Back to Shop
        </Link>

        <div className="product-details-layout">
          <motion.section
            className="product-detail-visual"
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="product-detail-glow" />
            <div className="product-detail-orbit" />

            <motion.div
              className="product-detail-product"
              animate={{
                y: [0, -10, 0],
                rotate: [-4, 0, -4],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Leaf size={110} strokeWidth={1.35} />
            </motion.div>

            <div className="product-detail-eco">
              <Recycle size={15} />
              ECO CERTIFIED
            </div>

            <div className="product-detail-material">
              <span>MADE FROM</span>
              <strong>RECYCLED MATERIALS</strong>
            </div>
          </motion.section>

          <motion.section
            className="product-detail-info"
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="product-detail-kicker">
              <Sparkles size={14} />
              SUSTAINABLE COLLECTION
            </div>

            <div className="product-detail-rating">
              <span className="rating-stars">
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
              </span>

              <strong>4.9</strong>
              <span>124 reviews</span>
            </div>

            <h1>{product.name}</h1>

            <p className="product-detail-description">
              {product.description || product.short_description}
            </p>

            <div className="product-detail-price">
              {formatPrice(product.base_price)}
              <span>inclusive of all taxes</span>
            </div>

            <div className="product-detail-divider" />

            <div className="product-benefits">
              <div>
                <span className="benefit-icon">
                  <Leaf size={17} />
                </span>

                <span>
                  <strong>Eco friendly</strong>
                  <small>Made with recovered materials</small>
                </span>
              </div>

              <div>
                <span className="benefit-icon">
                  <Truck size={17} />
                </span>

                <span>
                  <strong>Conscious delivery</strong>
                  <small>Lower-impact packaging</small>
                </span>
              </div>

              <div>
                <span className="benefit-icon">
                  <ShieldCheck size={17} />
                </span>

                <span>
                  <strong>Quality checked</strong>
                  <small>Built for everyday use</small>
                </span>
              </div>
            </div>

            <div className="product-purchase-row">
              <div className="quantity-control">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.max(1, value - 1))
                  }
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>

                <strong>{quantity}</strong>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.min(10, value + 1))
                  }
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                type="button"
                className={`product-detail-add ${added ? "added" : ""}`}
                onClick={handleAddToCart}
              >
                {added ? (
                  <>
                    <Check size={19} />
                    Added to cart
                  </>
                ) : (
                  <>
                    <ShoppingBag size={19} />
                    Add to cart
                  </>
                )}
              </button>

              <button
                type="button"
                className={`product-detail-wishlist ${
                  isFavorite(product.id) ? "active" : ""
                }`}
                onClick={() => toggleFavorite(product.id)}
                aria-label="Add to wishlist"
              >
                <Heart
                  size={20}
                  fill={isFavorite(product.id) ? "currentColor" : "none"}
                />
              </button>
            </div>

            <div className="product-detail-trust">
              <div>
                <Recycle size={16} />
                <span>
                  <strong>Circular choice</strong>
                  Keeps materials in use longer.
                </span>
              </div>

              <div>
                <Check size={16} />
                <span>
                  <strong>Easy returns</strong>
                  Shop with confidence.
                </span>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
