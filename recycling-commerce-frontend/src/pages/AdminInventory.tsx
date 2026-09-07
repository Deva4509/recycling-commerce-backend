import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Check,
  LoaderCircle,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  getAdminProducts,
  type ApiProduct,
} from "../lib/api";

type InventoryItem = {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type InventoryLocation = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
};

const API_BASE = "/api/v1";

function token() {
  return (
    localStorage.getItem("recyclepro-access-token") ||
    sessionStorage.getItem("recyclepro-access-token") ||
    ""
  );
}

async function inventoryRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  const accessToken = token();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text();

  let data: unknown = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!response.ok) {
    const detail =
      typeof data === "object" &&
      data !== null &&
      "detail" in data
        ? String((data as { detail?: unknown }).detail)
        : `Request failed with status ${response.status}.`;

    throw new Error(detail);
  }

  return data as T;
}

function available(item: InventoryItem) {
  return Math.max(
    Number(item.quantity) - Number(item.reserved_quantity),
    0,
  );
}

function stockState(item: InventoryItem) {
  const stock = Number(item.quantity);

  if (!item.is_active) return "inactive";
  if (stock <= 0) return "out";
  if (stock <= Number(item.low_stock_threshold)) {
    return "low";
  }

  return "healthy";
}

export default function AdminInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "HEALTHY" | "LOW" | "OUT" | "INACTIVE"
  >("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [movementItem, setMovementItem] =
    useState<InventoryItem | null>(null);
  const [movementType, setMovementType] =
    useState<"receive" | "sell">("receive");
  const [movementQuantity, setMovementQuantity] = useState("1");
  const [saving, setSaving] = useState(false);

  const [historyItem, setHistoryItem] =
    useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<
    Array<{
      id: string;
      movement_type: string;
      quantity_change: number;
      reason?: string | null;
      created_at: string;
    }>
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function load(refresh = false) {
    setError("");

    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [inventory, locationResult, productResult] =
        await Promise.all([
          inventoryRequest<InventoryItem[]>("/inventory/items"),
          inventoryRequest<InventoryLocation[]>(
            "/inventory/locations",
          ),
          getAdminProducts(),
        ]);

      setItems(Array.isArray(inventory) ? inventory : []);
      setLocations(
        Array.isArray(locationResult) ? locationResult : [],
      );
      setProducts(
        Array.isArray(productResult) ? productResult : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const productMap = useMemo(
    () =>
      new Map(
        products.map((product) => [product.id, product]),
      ),
    [products],
  );

  const locationMap = useMemo(
    () =>
      new Map(
        locations.map((location) => [location.id, location]),
      ),
    [locations],
  );

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      const product = productMap.get(item.product_id);
      const productName = product?.name || "";
      const sku = product?.sku || "";

      const matchesSearch =
        !needle ||
        productName.toLowerCase().includes(needle) ||
        sku.toLowerCase().includes(needle);

      const matchesLocation =
        locationFilter === "ALL" ||
        item.location_id === locationFilter;

      const state = stockState(item);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "HEALTHY" && state === "healthy") ||
        (filter === "LOW" && state === "low") ||
        (filter === "OUT" && state === "out") ||
        (filter === "INACTIVE" && state === "inactive");

      return matchesSearch && matchesLocation && matchesFilter;
    });
  }, [
    items,
    products,
    productMap,
    locationFilter,
    query,
    filter,
  ]);

  const totals = useMemo(() => {
    let quantity = 0;
    let availableStock = 0;
    let low = 0;
    let out = 0;

    items.forEach((item) => {
      quantity += Number(item.quantity);
      availableStock += available(item);

      const state = stockState(item);

      if (state === "low") low += 1;
      if (state === "out") out += 1;
    });

    return {
      quantity,
      availableStock,
      low,
      out,
    };
  }, [items]);

  async function submitMovement() {
    if (!movementItem) return;

    const quantity = Number(movementQuantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await inventoryRequest<InventoryItem>(
        `/inventory/items/${movementItem.id}/${movementType}?quantity=${quantity}`,
        { method: "POST" },
      );

      setMovementItem(null);
      setMovementQuantity("1");

      await load(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update stock.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function openHistory(item: InventoryItem) {
    setHistoryItem(item);
    setHistoryLoading(true);
    setMovements([]);
    setError("");

    try {
      const result = await inventoryRequest<
        Array<{
          id: string;
          movement_type: string;
          quantity_change: number;
          reason?: string | null;
          created_at: string;
        }>
      >(`/inventory/items/${item.id}/movements`);

      setMovements(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load movement history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <section className="rp-admin-modern-page">
      <div className="rp-admin-modern-heading products-heading">
        <div>
          <span className="rp-admin-modern-eyebrow">
            INVENTORY CONTROL
          </span>

          <h1>Inventory</h1>

          <p>
            Monitor stock, reservations and warehouse availability
            in real time.
            {loading && (
              <span className="rp-admin-inline-loading">
                <LoaderCircle size={11} className="rp-spin" />
                Syncing inventory
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          className="rp-admin-modern-refresh"
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={15}
            className={refreshing ? "rp-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rp-admin-modern-error">
          <X size={17} />
          {error}
        </div>
      )}

      <div className="rp-admin-modern-metrics">
        <div className="rp-admin-modern-metric">
          <div className="rp-admin-modern-metric-icon">
            <Boxes size={20} />
          </div>

          <div>
            <span>Total Stock</span>
            <strong>{totals.quantity}</strong>
            <small>Units across locations</small>
          </div>
        </div>

        <div className="rp-admin-modern-metric">
          <div className="rp-admin-modern-metric-icon warning">
            <ArrowDownToLine size={20} />
          </div>

          <div>
            <span>Low Stock</span>
            <strong>{totals.low + totals.out}</strong>
            <small>
              {totals.out} out of stock
            </small>
          </div>
        </div>
      </div>

      <div className="rp-admin-inventory-toolbar">
        <div className="rp-admin-product-search">
          <Search size={17} />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products or SKU..."
          />
        </div>

        <select
          value={locationFilter}
          onChange={(event) =>
            setLocationFilter(event.target.value)
          }
          className="rp-admin-product-select"
        >
          <option value="ALL">All locations</option>

          {locations.map((location) => (
            <option value={location.id} key={location.id}>
              {location.name}
            </option>
          ))}
        </select>

        <div className="rp-admin-product-filters">
          {[
            ["ALL", "All"],
            ["HEALTHY", "Healthy"],
            ["LOW", "Low stock"],
            ["OUT", "Out"],
            ["INACTIVE", "Inactive"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={filter === value ? "active" : ""}
              onClick={() =>
                setFilter(
                  value as
                    | "ALL"
                    | "HEALTHY"
                    | "LOW"
                    | "OUT"
                    | "INACTIVE",
                )
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rp-admin-product-table-card rp-admin-inventory-table">
        <div className="rp-admin-inventory-table-head">
          <span>PRODUCT</span>
          <span>LOCATION</span>
          <span>STOCK</span>
          <span>THRESHOLD</span>
          <span>STATUS</span>
          <span>ACTIONS</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="rp-admin-product-empty">
            <Boxes size={30} />
            <strong>No inventory records found</strong>
            <span>
              Inventory records will appear here once products are
              assigned to a location.
            </span>
          </div>
        ) : (
          filteredItems.map((item) => {
            const product = productMap.get(item.product_id);
            const location = locationMap.get(item.location_id);
            const availableStock = available(item);
            const state = stockState(item);

            return (
              <div
                className="rp-admin-inventory-row"
                key={item.id}
              >
                <div className="rp-admin-product-identity">
                  <div className="rp-admin-product-thumb">
                    <Boxes size={21} />
                  </div>

                  <div>
                    <strong>
                      {product?.name || "Unknown product"}
                    </strong>

                    <small>
                      {product?.sku || item.product_id}
                    </small>
                  </div>
                </div>

                <div className="rp-admin-inventory-location">
                  <strong>
                    {location?.name || "Unknown location"}
                  </strong>
                  <small>
                    {location?.code || item.location_id}
                  </small>
                </div>

                <strong className="inventory-number">
                  {item.quantity}
                </strong>

                <span className="inventory-number muted">
                  {item.low_stock_threshold}
                </span>

                <span
                  className={`rp-admin-modern-status inventory-${state}`}
                >
                  {state === "healthy"
                    ? "Healthy"
                    : state === "low"
                      ? "Low stock"
                      : state === "out"
                        ? "Out"
                        : "Inactive"}
                </span>

                <div className="rp-admin-inventory-actions">
                  <button
                    type="button"
                    className="inventory-add-action"
                    title="Add stock"
                    disabled={!item.is_active}
                    onClick={() => {
                      setMovementType("receive");
                      setMovementQuantity("1");
                      setMovementItem(item);
                    }}
                  >
                    <Plus size={15} />
                    <span>Add Stock</span>
                  </button>

                  <button
                    type="button"
                    className="inventory-sell-action"
                    title="Sell stock"
                    disabled={
                      !item.is_active || Number(item.quantity) <= 0
                    }
                    onClick={() => {
                      setMovementType("sell");
                      setMovementQuantity("1");
                      setMovementItem(item);
                    }}
                  >
                    <Minus size={16} strokeWidth={2.5} />
                    <span>Sell Stock</span>
                  </button>
</div>
              </div>
            );
          })
        )}

        <div className="rp-admin-product-table-footer">
          Showing {filteredItems.length} of {items.length} inventory
          records
        </div>
      </div>

      <div className="rp-admin-inventory-note">
        <div>
          <Check size={18} />
        </div>

        <span>
          Stock changes are processed by the InventoryService. Selling
          stock cannot exceed available inventory, and every movement
          is recorded in the backend movement ledger.
        </span>
      </div>

      {movementItem && (
        <div
          className="rp-admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMovementItem(null);
            }
          }}
        >
          <div className="rp-admin-inventory-modal">
            <div className="rp-admin-modal-heading">
              <div>
                <span>
                  {movementType === "receive"
                    ? "RECEIVE STOCK"
                    : "SELL STOCK"}
                </span>

                <h2>
                  {movementType === "receive"
                    ? "Add stock to inventory"
                    : "Sell stock from inventory"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMovementItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="rp-admin-movement-body">
              <div className="rp-admin-movement-product">
                <Boxes size={20} />

                <div>
                  <strong>
                    {productMap.get(movementItem.product_id)?.name ||
                      "Unknown product"}
                  </strong>

                  <small>
                    Available: {available(movementItem)} units
                  </small>
                </div>
              </div>

              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={movementQuantity}
                  onChange={(event) =>
                    setMovementQuantity(event.target.value)
                  }
                  autoFocus
                />
              </label>
            </div>

            <div className="rp-admin-modal-actions">
              <button
                type="button"
                onClick={() => setMovementItem(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary"
                disabled={saving}
                onClick={() => void submitMovement()}
              >
                {saving ? (
                  <LoaderCircle
                    size={16}
                    className="rp-spin"
                  />
                ) : movementType === "receive" ? (
                  <Plus size={16} />
                ) : (
                  <Check size={16} />
                )}

                {movementType === "receive"
                  ? "Add Stock"
                  : "Sell Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyItem && (
        <div
          className="rp-admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setHistoryItem(null);
            }
          }}
        >
          <div className="rp-admin-inventory-modal history">
            <div className="rp-admin-modal-heading">
              <div>
                <span>MOVEMENT LEDGER</span>
                <h2>Stock history</h2>
              </div>

              <button
                type="button"
                onClick={() => setHistoryItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="rp-admin-history-list">
              {historyLoading ? (
                <div className="rp-admin-page-loading">
                  <LoaderCircle
                    size={22}
                    className="rp-spin"
                  />
                  <span>Loading movements...</span>
                </div>
              ) : movements.length === 0 ? (
                <div className="rp-admin-modern-empty">
                  No movements recorded.
                </div>
              ) : (
                movements.map((movement) => (
                  <div
                    className="rp-admin-history-row"
                    key={movement.id}
                  >
                    <div>
                      <strong>
                        {movement.movement_type.replace(
                          /_/g,
                          " ",
                        )}
                      </strong>

                      <small>
                        {movement.reason || "Inventory movement"}
                      </small>
                    </div>

                    <strong
                      className={
                        movement.quantity_change >= 0
                          ? "movement-positive"
                          : "movement-negative"
                      }
                    >
                      {movement.quantity_change >= 0 ? "+" : ""}
                      {movement.quantity_change}
                    </strong>

                    <small>
                      {new Date(
                        movement.created_at,
                      ).toLocaleString("en-IN")}
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
