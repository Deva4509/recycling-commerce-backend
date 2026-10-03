import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Boxes,
  Check,
  Edit3,
  Eye,
  EyeOff,
  LoaderCircle,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import {
  createAdminProduct,
  deleteAdminProduct,
  setAdminProductStatus,
  getAdminProducts,
  getCategories,
  updateAdminProduct,
  deleteProductImage,
  getProductImages,
  updateProductImage,
  uploadProductImages,
  type ApiCategory,
  type ApiProduct,
  type ApiProductImage,
} from "../lib/api";

type ProductForm = {
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  base_price: string;
  currency: string;
  category_id: string;
  is_active: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  sku: "",
  short_description: "",
  description: "",
  base_price: "",
  currency: "INR",
  category_id: "",
  is_active: true,
};

function money(value: unknown) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function categoryName(
  product: ApiProduct,
  categories: ApiCategory[],
) {
  return (
    categories.find(
      (category) => category.id === product.category_id,
    )?.name || "Uncategorised"
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL",
  );
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<ApiProductImage[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesSaving, setImagesSaving] = useState(false);

  async function load() {
    setError("");

    try {
      const [productResult, categoryResult] = await Promise.all([
        getAdminProducts(),
        getCategories(),
      ]);

      setProducts(Array.isArray(productResult) ? productResult : []);
      setCategories(
        Array.isArray(categoryResult) ? categoryResult : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !needle ||
        product.name.toLowerCase().includes(needle) ||
        product.sku.toLowerCase().includes(needle) ||
        product.slug.toLowerCase().includes(needle);

      const matchesStatus =
        filter === "ALL" ||
        (filter === "ACTIVE" && product.is_active !== false) ||
        (filter === "INACTIVE" && product.is_active === false);

      const matchesCategory =
        categoryFilter === "ALL" ||
        product.category_id === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, query, filter, categoryFilter]);

  const activeCount = products.filter(
    (product) => product.is_active !== false,
  ).length;

  const inactiveCount = products.length - activeCount;

  function resetImageState() {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setExistingImages([]);
    setPendingImages([]);
    setImagePreviews([]);
    setImagesLoading(false);
    setImagesSaving(false);
  }

  function openCreate() {
    resetImageState();
    setEditing(null);
    setForm({
      ...emptyForm,
      category_id: categories[0]?.id || "",
    });
    setError("");
    setModalOpen(true);
  }

  async function openEdit(product: ApiProduct) {
    resetImageState();
    setEditing(product);

    setForm({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      short_description: product.short_description || "",
      description: product.description || "",
      base_price: String(product.base_price ?? ""),
      currency: product.currency || "INR",
      category_id: product.category_id,
      is_active: product.is_active !== false,
    });

    setError("");
    setModalOpen(true);
    setImagesLoading(true);

    try {
      const images = await getProductImages(product.id);
      setExistingImages(
        [...images].sort((a, b) => a.sort_order - b.sort_order),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load product images.",
      );
    } finally {
      setImagesLoading(false);
    }
  }

  function handleImageSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    const available =
      5 - existingImages.length - pendingImages.length;

    if (files.length > available) {
      setError(
        `A product can have a maximum of 5 images. You can add ${Math.max(
          available,
          0,
        )} more.`,
      );
      return;
    }

    const invalid = files.find((file) => {
      const validType = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type);

      return !validType || file.size > 5 * 1024 * 1024;
    });

    if (invalid) {
      setError(
        "Only JPEG, PNG, and WEBP images up to 5 MB each are allowed.",
      );
      return;
    }

    setError("");

    setPendingImages((current) => [
      ...current,
      ...files,
    ]);

    setImagePreviews((current) => [
      ...current,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
  }

  function removePendingImage(index: number) {
    setImagePreviews((current) => {
      const url = current[index];

      if (url) {
        URL.revokeObjectURL(url);
      }

      return current.filter((_, i) => i !== index);
    });

    setPendingImages((current) =>
      current.filter((_, i) => i !== index),
    );
  }

  async function setPrimaryImage(image: ApiProductImage) {
    if (imagesSaving || image.is_primary || !editing) {
      return;
    }

    setImagesSaving(true);
    setError("");

    try {
      const updated = await updateProductImage(
        editing.id,
        image.id,
        { is_primary: true },
      );

      setExistingImages((current) =>
        current.map((item) => ({
          ...item,
          is_primary: item.id === updated.id,
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to set the primary image.",
      );
    } finally {
      setImagesSaving(false);
    }
  }

  async function moveExistingImage(
    index: number,
    direction: -1 | 1,
  ) {
    const target = index + direction;

    if (
      imagesSaving ||
      !editing ||
      target < 0 ||
      target >= existingImages.length
    ) {
      return;
    }

    const ordered = [...existingImages];

    [ordered[index], ordered[target]] = [
      ordered[target],
      ordered[index],
    ];

    setImagesSaving(true);
    setError("");

    try {
      await Promise.all(
        ordered.map((image, sortIndex) =>
          updateProductImage(
            editing.id,
            image.id,
            { sort_order: sortIndex },
          ),
        ),
      );

      setExistingImages(
        ordered.map((image, sortIndex) => ({
          ...image,
          sort_order: sortIndex,
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reorder images.",
      );
    } finally {
      setImagesSaving(false);
    }
  }

  async function removeExistingImage(
    image: ApiProductImage,
  ) {
    if (imagesSaving || !editing) {
      return;
    }

    if (!window.confirm("Delete this product image?")) {
      return;
    }

    setImagesSaving(true);
    setError("");

    try {
      await deleteProductImage(editing.id, image.id);

      const remaining = existingImages.filter(
        (item) => item.id !== image.id,
      );

      if (remaining.length && image.is_primary) {
        const promoted = await updateProductImage(
          editing.id,
          remaining[0].id,
          { is_primary: true },
        );

        setExistingImages(
          remaining.map((item) => ({
            ...item,
            is_primary: item.id === promoted.id,
          })),
        );
      } else {
        setExistingImages(remaining);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete the image.",
      );
    } finally {
      setImagesSaving(false);
    }
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      sku: form.sku.trim(),
      short_description:
        form.short_description.trim() || null,
      description: form.description.trim() || null,
      base_price: Number(form.base_price),
      currency: form.currency,
      category_id: form.category_id,
      is_active: form.is_active,
    };

    try {
      let productId: string;

      if (editing) {
        await updateAdminProduct(editing.id, payload);
        productId = editing.id;
      } else {
        const created = await createAdminProduct(payload);
        productId = created.id;
      }

      if (pendingImages.length) {
        setImagesSaving(true);
        await uploadProductImages(
          productId,
          pendingImages,
        );
      }

      imagePreviews.forEach((url) =>
        URL.revokeObjectURL(url),
      );

      setModalOpen(false);
      resetImageState();
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the product.",
      );
    } finally {
      setSaving(false);
      setImagesSaving(false);
    }
  }

  async function toggleProductActive(product: ApiProduct) {
    const nextActive = product.is_active === false;

    setActionId(product.id);
    setError("");

    try {
      await updateAdminProduct(product.id, {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        short_description: product.short_description ?? null,
        description: product.description ?? null,
        base_price: Number(product.base_price ?? 0),
        currency: product.currency || "INR",
        category_id: product.category_id,
        is_active: nextActive,
      });

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change product visibility.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function deleteProduct(product: ApiProduct) {
    if (
      !window.confirm(
        `Permanently delete "${product.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setActionId(product.id);
    setError("");

    try {
      await deleteAdminProduct(product.id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to permanently delete the product.",
      );
    } finally {
      setActionId(null);
    }
  }


  if (loading) {
    return (
      <section className="rp-admin-modern-page">
        <div className="rp-admin-page-loading">
          <LoaderCircle size={25} className="rp-spin" />
          <span>Loading product catalog...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="rp-admin-modern-page">
      <div className="rp-admin-modern-heading products-heading">
        <div>
          <span className="rp-admin-modern-eyebrow">
            CATALOG MANAGEMENT
          </span>

          <h1>Products</h1>

          <p>
            Manage the products available across your circular
            marketplace.
          </p>
        </div>

        <button
          type="button"
          className="rp-admin-modern-primary"
          onClick={openCreate}
        >
          <Plus size={16} />
          Add product
        </button>
      </div>

      {error && (
        <div className="rp-admin-modern-error">
          <X size={17} />
          {error}
        </div>
      )}

      <div className="rp-admin-modern-metrics product-metrics">
        <div className="rp-admin-modern-metric">
          <div className="rp-admin-modern-metric-icon">
            <Boxes size={20} />
          </div>
          <div>
            <span>Total Products</span>
            <strong>{products.length}</strong>
            <small>Complete catalog</small>
          </div>
        </div>

        <div className="rp-admin-modern-metric">
          <div className="rp-admin-modern-metric-icon">
            <Check size={20} />
          </div>
          <div>
            <span>Active</span>
            <strong>{activeCount}</strong>
            <small>Visible to customers</small>
          </div>
        </div>

        <div className="rp-admin-modern-metric">
          <div className="rp-admin-modern-metric-icon warning">
            <EyeOff size={20} />
          </div>
          <div>
            <span>Inactive</span>
            <strong>{inactiveCount}</strong>
            <small>Hidden from catalog</small>
          </div>
        </div>

        <div className="rp-admin-modern-metric">
          <div className="rp-admin-modern-metric-icon">
            <PackagePlus size={20} />
          </div>
          <div>
            <span>Categories</span>
            <strong>{categories.length}</strong>
            <small>Catalog categories</small>
          </div>
        </div>
      </div>

      <div className="rp-admin-product-workspace">
        <div className="rp-admin-product-toolbar">
          <div className="rp-admin-product-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, SKU..."
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
            className="rp-admin-product-select"
          >
            <option value="ALL">All categories</option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <div className="rp-admin-product-filters">
            <button
              type="button"
              className="active"
              onClick={() => setFilter("ALL")}
            >
              All
            </button>
          </div>
        </div>

        <div className="rp-admin-product-table-card">
          <div className="rp-admin-product-table-head">
            <span>PRODUCT</span>
            <span>CATEGORY</span>
            <span>PRICE</span>
            <span>SKU</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rp-admin-product-empty">
              <Boxes size={30} />
              <strong>No products found</strong>
              <span>
                Try another search or create a new product.
              </span>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const active = product.is_active !== false;

              return (
                <div
                  className="rp-admin-product-row"
                  key={product.id}
                >
                  <div className="rp-admin-product-identity">
                    <div className="rp-admin-product-thumb">
                      <Boxes size={21} />
                    </div>

                    <div>
                      <strong>{product.name}</strong>
                      <small>
                        {product.short_description ||
                          "Recycled marketplace product"}
                      </small>
                    </div>
                  </div>

                  <span className="rp-admin-product-category">
                    {categoryName(product, categories)}
                  </span>

                  <strong className="rp-admin-product-price">
                    {money(product.base_price)}
                  </strong>

                  <span className="rp-admin-product-sku">
                    {product.sku}
                  </span>

                  <span
                    className={`rp-admin-modern-status ${
                      active ? "active" : "inactive"
                    }`}
                  >
                    {active ? "Active" : "Inactive"}
                  </span>

                  <div className="rp-admin-product-actions">
                    <button
                      type="button"
                      title="Edit product"
                      onClick={() => openEdit(product)}
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      title={
                        active
                          ? "Visible in catalog"
                          : "Hidden from catalog"
                      }
                    >
                      {active ? (
                        <Eye size={15} />
                      ) : (
                        <EyeOff size={15} />
                      )}
                    </button>

                    <button
                      type="button"
                      className="danger"
                      title="Permanently delete product"
                      disabled={actionId === product.id}
                      onClick={() => void deleteProduct(product)}
                    >
                      {actionId === product.id ? (
                        <LoaderCircle
                          size={15}
                          className="rp-spin"
                        />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}

          <div className="rp-admin-product-table-footer">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="rp-admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <form
            className="rp-admin-product-modal"
            onSubmit={saveProduct}
          >
            <div className="rp-admin-modal-heading">
              <div>
                <span>
                  {editing ? "EDIT CATALOG ITEM" : "NEW CATALOG ITEM"}
                </span>
                <h2>
                  {editing ? "Edit product" : "Add product"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="rp-admin-form-grid">
              <label>
                Product name
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                SKU
                <input
                  required
                  value={form.sku}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      sku: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Slug
                <input
                  required
                  value={form.slug}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      slug: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Category
                <select
                  required
                  value={form.category_id}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category_id: event.target.value,
                    })
                  }
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Price
                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={form.base_price}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      base_price: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Currency
                <input
                  maxLength={3}
                  value={form.currency}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      currency: event.target.value
                        .toUpperCase()
                        .slice(0, 3),
                    })
                  }
                />
              </label>

              <label className="wide">
                Short description
                <input
                  value={form.short_description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      short_description: event.target.value,
                    })
                  }
                />
              </label>

              <label className="wide">
                Description
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                />
              </label>

              <label className="rp-admin-toggle">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      is_active: event.target.checked,
                    })
                  }
                />
                <span>
                  <strong>Active product</strong>
                  <small>
                    Make this product visible in the customer catalog.
                  </small>
                </span>
              </label>
            </div>

            <div
              style={{
                marginTop: 22,
                padding: 18,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.025)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <strong style={{ display: "block" }}>
                    Product images
                  </strong>
                  <small style={{ opacity: 0.7 }}>
                    Up to 5 images · JPEG, PNG, WEBP · 5 MB each
                  </small>
                </div>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    cursor:
                      existingImages.length +
                        pendingImages.length >=
                        5 || imagesSaving
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      existingImages.length +
                        pendingImages.length >=
                        5 || imagesSaving
                        ? 0.5
                        : 1,
                  }}
                >
                  <Upload size={16} />
                  Add images

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    disabled={
                      existingImages.length +
                        pendingImages.length >=
                        5 || imagesSaving
                    }
                    onChange={handleImageSelection}
                  />
                </label>
              </div>

              {imagesLoading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: 0.7,
                  }}
                >
                  <LoaderCircle
                    size={17}
                    className="rp-spin"
                  />
                  Loading images...
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill,minmax(130px,1fr))",
                    gap: 12,
                  }}
                >
                  {existingImages.map((image, index) => (
                    <div
                      key={image.id}
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: 12,
                        border: image.is_primary
                          ? "2px solid currentColor"
                          : "1px solid rgba(255,255,255,.1)",
                      }}
                    >
                      <img
                        src={image.image_url}
                        alt={
                          image.alt_text ||
                          `${form.name} image ${index + 1}`
                        }
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />

                      {image.is_primary && (
                        <span
                          style={{
                            position: "absolute",
                            left: 7,
                            top: 7,
                            padding: "4px 7px",
                            borderRadius: 999,
                            background: "rgba(0,0,0,.7)",
                            fontSize: 11,
                          }}
                        >
                          Primary
                        </span>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          padding: 6,
                        }}
                      >
                        <button
                          type="button"
                          title="Move left"
                          disabled={
                            index === 0 || imagesSaving
                          }
                          onClick={() =>
                            void moveExistingImage(
                              index,
                              -1,
                            )
                          }
                        >
                          <ChevronLeft size={14} />
                        </button>

                        <button
                          type="button"
                          title="Move right"
                          disabled={
                            index ===
                              existingImages.length - 1 ||
                            imagesSaving
                          }
                          onClick={() =>
                            void moveExistingImage(
                              index,
                              1,
                            )
                          }
                        >
                          <ChevronRight size={14} />
                        </button>

                        <button
                          type="button"
                          title="Set primary"
                          disabled={
                            image.is_primary ||
                            imagesSaving
                          }
                          onClick={() =>
                            void setPrimaryImage(image)
                          }
                        >
                          <Star size={14} />
                        </button>

                        <button
                          type="button"
                          title="Delete image"
                          className="danger"
                          disabled={imagesSaving}
                          onClick={() =>
                            void removeExistingImage(
                              image,
                            )
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {pendingImages.map((file, index) => (
                    <div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: 12,
                        border:
                          "1px dashed rgba(255,255,255,.2)",
                      }}
                    >
                      <img
                        src={imagePreviews[index]}
                        alt={file.name}
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />

                      <span
                        style={{
                          position: "absolute",
                          left: 7,
                          top: 7,
                          padding: "4px 7px",
                          borderRadius: 999,
                          background: "rgba(0,0,0,.7)",
                          fontSize: 11,
                        }}
                      >
                        New
                      </span>

                      <button
                        type="button"
                        title="Remove selected image"
                        onClick={() =>
                          removePendingImage(index)
                        }
                        style={{
                          position: "absolute",
                          right: 7,
                          top: 7,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {existingImages.length === 0 &&
                    pendingImages.length === 0 && (
                      <div
                        style={{
                          gridColumn: "1 / -1",
                          padding: "24px 12px",
                          textAlign: "center",
                          opacity: 0.6,
                        }}
                      >
                        No images added yet.
                      </div>
                    )}
                </div>
              )}

              <small
                style={{
                  display: "block",
                  marginTop: 12,
                  opacity: 0.65,
                }}
              >
                {existingImages.length +
                  pendingImages.length}
                /5 images selected
                {imagesSaving
                  ? " · Saving image changes..."
                  : ""}
              </small>
            </div>

            <div className="rp-admin-modal-actions">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary"
                disabled={saving}
              >
                {saving ? (
                  <LoaderCircle size={16} className="rp-spin" />
                ) : (
                  <Check size={16} />
                )}
                {editing ? "Save changes" : "Create product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
