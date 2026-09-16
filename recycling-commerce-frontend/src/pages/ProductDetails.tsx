import { FormEvent, useEffect, useMemo, useState } from "react";
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
  Pencil,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";

import { products } from "../data/products";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import {
  createProductReview,
  deleteProductReview,
  getProductRating,
  getProductReviews,
  getProducts,
  updateProductReview,
  ApiRatingSummary,
  ApiReview,
  ApiProductImage,
} from "../lib/api";

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function Stars({
  rating,
  size = 16,
  interactive = false,
  onSelect,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onSelect?: (value: number) => void;
}) {
  const selectedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span
      className="rating-stars"
      aria-label={`${selectedRating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => {
        const selected = value <= selectedRating;
        const star = selected ? "★" : "☆";

        if (interactive) {
          return (
            <button
              key={value}
              type="button"
              className={`review-star-button ${
                selected ? "selected" : "unselected"
              }`}
              onClick={() => onSelect?.(value)}
              aria-label={`Rate ${value} out of 5`}
              aria-pressed={selected}
              style={{ fontSize: size }}
            >
              {star}
            </button>
          );
        }

        return (
          <span
            key={value}
            className={`review-star-static ${
              selected ? "selected" : "unselected"
            }`}
            style={{ fontSize: size }}
            aria-hidden="true"
          >
            {star}
          </span>
        );
      })}
    </span>
  );
}

export default function ProductDetails() {
  const { addToCart } = useCart();
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();

  const product = useMemo(
    () => products.find((item) => item.slug === slug || item.id === slug),
    [slug],
  );

  const [quantity, setQuantity] = useState(1);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [added, setAdded] = useState(false);

  const [backendProductId, setBackendProductId] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<ApiProductImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [ratingSummary, setRatingSummary] =
    useState<ApiRatingSummary | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!product) {
      setBackendProductId(null);
      setGalleryImages([]);
      setActiveImageIndex(0);
      return;
    }

    setGalleryImages([]);
    setActiveImageIndex(0);

    const currentProduct = product;
    let cancelled = false;

    async function resolveBackendProduct() {
      try {
        const backendProducts = await getProducts();

        const match = backendProducts.find(
          (item) =>
            item.slug === currentProduct.slug ||
            item.sku === currentProduct.sku ||
            item.name.trim().toLowerCase() ===
              currentProduct.name.trim().toLowerCase(),
        );

        if (!cancelled) {
          setBackendProductId(match?.id ?? null);

          const images = [...(match?.images ?? [])].sort(
            (a, b) =>
              Number(b.is_primary) - Number(a.is_primary) ||
              a.sort_order - b.sort_order,
          );

          setGalleryImages(images);
          setActiveImageIndex(0);

          if (!match) {
            console.warn(
              "No matching backend product found for:",
              currentProduct.slug,
              currentProduct.sku,
              currentProduct.name,
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to resolve backend product:", error);
          setBackendProductId(null);
        }
      }
    }

    resolveBackendProduct();

    return () => {
      cancelled = true;
    };
  }, [product]);

  useEffect(() => {
    const productId = backendProductId;
    if (!productId) return;

    let cancelled = false;

    async function loadReviews() {
      setReviewsLoading(true);
      setReviewsError("");

      try {
        const [summary, reviewList] = await Promise.all([
          getProductRating(productId!),
          getProductReviews(productId!, 1, 10),
        ]);

        if (cancelled) return;

        setRatingSummary(summary);
        setReviews(reviewList.items);
      } catch (error) {
        if (cancelled) return;

        setReviewsError(
          error instanceof Error
            ? error.message
            : "Unable to load reviews right now.",
        );
      } finally {
        if (!cancelled) {
          setReviewsLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [backendProductId]);

  function resetReviewForm() {
    setEditingReviewId(null);
    setReviewRating(5);
    setReviewTitle("");
    setReviewComment("");
    setReviewMessage("");
  }

  function startEditingReview(review: ApiReview) {
    setEditingReviewId(review.id);
    setReviewRating(review.rating);
    setReviewTitle(review.title ?? "");
    setReviewComment(review.comment);
    setReviewMessage("");
  }

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      setReviewMessage("Please log in before submitting a review.");
      return;
    }

    if (!backendProductId) {
      setReviewMessage(
        "Product connection is still loading. Please refresh and try again.",
      );
      return;
    }

    const comment = reviewComment.trim();

    if (!comment) {
      setReviewMessage("Please write a review comment.");
      return;
    }

    setReviewSubmitting(true);
    setReviewMessage("");

    try {
      const payload = {
        rating: Number(reviewRating),
        title: reviewTitle.trim() || undefined,
        comment,
      };

      let savedReview: ApiReview;

      if (editingReviewId) {
        savedReview = await updateProductReview(
          editingReviewId,
          payload,
        );

        setReviews((current) =>
          current.map((review) =>
            review.id === savedReview.id ? savedReview : review,
          ),
        );

        setReviewMessage("Your review has been updated.");
      } else {
        savedReview = await createProductReview(
          backendProductId,
          payload,
        );

        setReviews((current) => [savedReview, ...current]);
        setReviewMessage("Thanks! Your review has been submitted.");
      }

      setEditingReviewId(null);
      setReviewRating(5);
      setReviewTitle("");
      setReviewComment("");

      // Refresh rating separately; it must never block submission.
      void getProductRating(backendProductId)
        .then((summary) => setRatingSummary(summary))
        .catch(() => {});
    } catch (error) {
      setReviewMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit your review.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!backendProductId) return;

    setDeletingReviewId(reviewId);
    setReviewMessage("");

    try {
      await deleteProductReview(reviewId);

      setReviews((current) =>
        current.filter((review) => review.id !== reviewId),
      );

      const summary = await getProductRating(backendProductId);
      setRatingSummary(summary);

      if (editingReviewId === reviewId) {
        resetReviewForm();
      }

      setReviewMessage("Your review has been deleted.");
    } catch (error) {
      setReviewMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete your review.",
      );
    } finally {
      setDeletingReviewId(null);
    }
  }

  function handleAddToCart() {
    if (!product) return;

    addToCart(product, quantity);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 2200);
  }

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

  const averageRating = ratingSummary?.average ?? 0;
  const reviewCount = ratingSummary?.total ?? 0;
  const distribution = ratingSummary?.distribution;

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
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55 }}
          >
            {galleryImages.length > 0 ? (
              <>
                <div className="product-detail-gallery-main">
                  <img
                    src={galleryImages[activeImageIndex]?.image_url}
                    alt={
                      galleryImages[activeImageIndex]?.alt_text ||
                      `${product.name} product image`
                    }
                    className="product-detail-gallery-image"
                  />

                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="product-detail-gallery-nav prev"
                        aria-label="Previous product image"
                        onClick={() =>
                          setActiveImageIndex(
                            (current) =>
                              (current - 1 + galleryImages.length) %
                              galleryImages.length,
                          )
                        }
                      >
                        <ArrowLeft size={20} />
                      </button>

                      <button
                        type="button"
                        className="product-detail-gallery-nav next"
                        aria-label="Next product image"
                        onClick={() =>
                          setActiveImageIndex(
                            (current) =>
                              (current + 1) % galleryImages.length,
                          )
                        }
                      >
                        <ArrowLeft
                          size={20}
                          style={{ transform: "rotate(180deg)" }}
                        />
                      </button>

                      <span className="product-detail-gallery-counter">
                        {activeImageIndex + 1} / {galleryImages.length}
                      </span>
                    </>
                  )}
                </div>

                {galleryImages.length > 1 && (
                  <div className="product-detail-gallery-thumbnails">
                    {galleryImages.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        className={`product-detail-gallery-thumbnail ${
                          index === activeImageIndex ? "active" : ""
                        }`}
                        aria-label={`View product image ${index + 1}`}
                        aria-current={
                          index === activeImageIndex ? "true" : undefined
                        }
                        onClick={() => setActiveImageIndex(index)}
                      >
                        <img
                          src={image.image_url}
                          alt={
                            image.alt_text ||
                            `${product.name} thumbnail ${index + 1}`
                          }
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div className="product-detail-eco">
                  <Recycle size={15} />
                  
                </div>

                <div className="product-detail-material">
                  <Sparkles size={14} />
                  
                </div>
              </>
            ) : (
              <>
                <div className="product-detail-glow" />
                <div className="product-detail-orbit" />

                <motion.div
                  className="product-detail-product"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Leaf size={110} strokeWidth={1.35} />
                </motion.div>

                <div className="product-detail-eco">
                  <Recycle size={15} />
                  
                </div>

                <div className="product-detail-material">
                  <Sparkles size={14} />
                  
                </div>
              </>
            )}
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
              {ratingSummary ? (
                <>
                  <Stars rating={Math.round(averageRating)} size={14} />
                  <strong>{averageRating.toFixed(1)}</strong>
                  <span>
                    {reviewCount}{" "}
                    {reviewCount === 1 ? "review" : "reviews"}
                  </span>
                </>
              ) : (
                <span>Loading ratings...</span>
              )}
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

        <section className="product-reviews-section">
          <div className="product-reviews-header">
            <div>
              <div className="product-detail-kicker">
                <Star size={14} />
                CUSTOMER REVIEWS
              </div>
              <h2>What our customers say</h2>
              <p>Real feedback from the GreenCore community.</p>
            </div>
          </div>

          {reviewsError && (
            <div className="product-review-message error">
              {reviewsError}
            </div>
          )}

          <div className="product-rating-overview">
            <div className="product-rating-score">
              <strong>
                {ratingSummary ? averageRating.toFixed(1) : "—"}
              </strong>

              <Stars rating={Math.round(averageRating)} size={18} />

              <span>
                {reviewCount}{" "}
                {reviewCount === 1 ? "customer review" : "customer reviews"}
              </span>
            </div>

            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map((star) => {
                const count =
                  distribution?.[
                    star === 5
                      ? "five"
                      : star === 4
                        ? "four"
                        : star === 3
                          ? "three"
                          : star === 2
                            ? "two"
                            : "one"
                  ] ?? 0;

                const percentage =
                  reviewCount > 0 ? (count / reviewCount) * 100 : 0;

                return (
                  <div className="rating-distribution-row" key={star}>
                    <span>{star}</span>
                    <Star size={13} fill="currentColor" />
                    <div className="rating-bar">
                      <span style={{ width: `${percentage}%` }} />
                    </div>
                    <small>{count}</small>
                  </div>
                );
              })}
            </div>
          </div>

          {isAuthenticated ? (
            <form
              className="product-review-form"
              onSubmit={handleReviewSubmit}
            >
              <div className="product-review-form-header">
                <div>
                  <h3>
                    {editingReviewId ? "Edit your review" : "Share your review"}
                  </h3>
                  <p>
                    {editingReviewId
                      ? "Update this review."
                      : "Share your experience with other customers."}
                  </p>
                </div>
              </div>

              <>
                <div className="review-rating-picker">
                  <span>Your rating</span>
                  <Stars
                    rating={reviewRating}
                    size={24}
                    interactive
                    onSelect={setReviewRating}
                  />
                </div>

                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(event) => setReviewTitle(event.target.value)}
                  placeholder="Review title (optional)"
                  maxLength={200}
                />

                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Write your review..."
                  rows={5}
                  maxLength={5000}
                  required
                />

                {reviewMessage && (
                  <div className="product-review-message">
                    {reviewMessage}
                  </div>
                )}

                <div className="review-form-actions">
                  <button
                    type="submit"
                    className="product-detail-add"
                    disabled={reviewSubmitting}
                  >
                    {reviewSubmitting
                      ? "Saving..."
                      : editingReviewId
                        ? "Update review"
                        : "Submit review"}
                  </button>

                  {editingReviewId && (
                    <button
                      type="button"
                      className="review-cancel-button"
                      onClick={resetReviewForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </>
            </form>
          ) : (
            <div className="product-review-login">
              <h3>Have you used this product?</h3>
              <p>Log in to share your experience with other customers.</p>
              <Link to="/login" className="product-detail-add">
                Log in to review
              </Link>
            </div>
          )}

          {reviewMessage && !isAuthenticated && (
            <div className="product-review-message">{reviewMessage}</div>
          )}

          <div className="product-review-list">
            {reviewsLoading ? (
              <div className="product-review-empty">
                Loading customer reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="product-review-empty">
                <Star size={28} />
                <h3>No reviews yet</h3>
                <p>Be the first customer to review this product.</p>
              </div>
            ) : (
              reviews.map((review) => {
                const isOwner = review.user_id === user?.id;

                return (
                  <article className="product-review-card" key={review.id}>
                    <div className="product-review-card-top">
                      <div>
                        <strong>{review.user_name}</strong>
                        <Stars rating={review.rating} size={14} />
                      </div>

                      <time dateTime={review.created_at}>
                        {new Intl.DateTimeFormat("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(review.created_at))}
                      </time>
                    </div>

                    {review.title && <h3>{review.title}</h3>}

                    <p>{review.comment}</p>

                    {isOwner && (
                      <div className="product-review-actions">
                        <button
                          type="button"
                          onClick={() => startEditingReview(review)}
                          disabled={deletingReviewId === review.id}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                        >
                          <Trash2 size={14} />
                          {deletingReviewId === review.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
