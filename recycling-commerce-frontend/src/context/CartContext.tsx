import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Product } from "../types/catalog";
import { useAuth } from "./AuthContext";

export type CartItem = Product & {
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(
  undefined,
);

const GUEST_CART_KEY = "greencore-cart-guest";
const CART_KEY_PREFIX = "greencore-cart:";

function getStorageKey(userId: string | null) {
  return userId
    ? `${CART_KEY_PREFIX}${userId}`
    : GUEST_CART_KEY;
}

function readStoredCart(storageKey: string): CartItem[] {
  try {
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    return Array.isArray(parsed)
      ? (parsed as CartItem[])
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();

  const userId = user?.id ?? null;
  const storageKey = getStorageKey(userId);

  const [items, setItems] = useState<CartItem[]>([]);

  /*
   * Load the cart belonging to the currently authenticated user.
   * When the account changes, the previous user's cart is removed
   * from React state and the new user's cart is loaded.
   */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    setItems(readStoredCart(storageKey));
  }, [storageKey, authLoading]);

  /*
   * Persist only the cart belonging to the current account.
   */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify(items),
    );
  }, [items, storageKey, authLoading]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.length;

    const subtotal = items.reduce(
      (total, item) =>
        total + Number(item.base_price) * item.quantity,
      0,
    );

    function addToCart(
      product: Product,
      quantity = 1,
    ) {
      setItems((current) => {
        const existing = current.find(
          (item) => item.id === product.id,
        );

        if (existing) {
          return current.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + quantity,
                }
              : item,
          );
        }

        return [
          ...current,
          {
            ...product,
            quantity,
          },
        ];
      });
    }

    function updateQuantity(
      productId: string,
      quantity: number,
    ) {
      if (quantity <= 0) {
        setItems((current) =>
          current.filter(
            (item) => item.id !== productId,
          ),
        );
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity,
              }
            : item,
        ),
      );
    }

    function removeFromCart(productId: string) {
      setItems((current) =>
        current.filter(
          (item) => item.id !== productId,
        ),
      );
    }

    function clearCart() {
      setItems([]);
    }

    return {
      items,
      itemCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    };
  }, [items]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider",
    );
  }

  return context;
}
