import {
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
  X,
} from "lucide-react";
import {
  createAdminProduct,
  deactivateAdminProduct,
  getAdminProducts,
  getCategories,
  updateAdminProduct,
  type ApiCategory,
  type ApiProduct,
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

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      category_id: categories[0]?.id || "",
    });
    setError("");
    setModalOpen(true);
  }

  function openEdit(product: ApiProduct) {
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
      if (editing) {
        await updateAdminProduct(editing.id, payload);
      } else {
        await createAdminProduct(payload);
      }

      setModalOpen(false);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the product.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(product: ApiProduct) {
    if (
      !window.confirm(
        `Deactivate "${product.name}"? It will no longer appear in the customer catalog.`,
      )
    ) {
      return;
    }

    setActionId(product.id);
    setError("");

    try {
      await deactivateAdminProduct(product.id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to deactivate the product.",
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
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map(
              (value) => (
                <button
                  type="button"
                  key={value}
                  className={filter === value ? "active" : ""}
                  onClick={() => setFilter(value)}
                >
                  {value === "ALL"
                    ? "All"
                    : value === "ACTIVE"
                      ? "Active"
                      : "Inactive"}
                </button>
              ),
            )}
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

                    {active && (
                      <button
                        type="button"
                        className="danger"
                        title="Deactivate product"
                        disabled={actionId === product.id}
                        onClick={() => void deactivate(product)}
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
                    )}
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
