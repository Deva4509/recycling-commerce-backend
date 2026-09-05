import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

type FavoritesContextValue = {
  favorites: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  clearFavorites: () => void;
};

const FavoritesContext =
  createContext<FavoritesContextValue | undefined>(
    undefined,
  );

const GUEST_KEY = "recyclepro-favorites-guest";
const KEY_PREFIX = "recyclepro-favorites:";

function getStorageKey(userId: string | null) {
  return userId
    ? `${KEY_PREFIX}${userId}`
    : GUEST_KEY;
}

function readFavorites(storageKey: string): string[] {
  try {
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed.filter(
          (value): value is string =>
            typeof value === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const storageKey = getStorageKey(userId);

  const [favorites, setFavorites] = useState<string[]>(
    [],
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    setFavorites(readFavorites(storageKey));
  }, [storageKey, authLoading]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify(favorites),
    );
  }, [favorites, storageKey, authLoading]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,

      isFavorite(productId) {
        return favorites.includes(productId);
      },

      toggleFavorite(productId) {
        setFavorites((current) =>
          current.includes(productId)
            ? current.filter((id) => id !== productId)
            : [...current, productId],
        );
      },

      clearFavorites() {
        setFavorites([]);
      },
    }),
    [favorites],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      "useFavorites must be used inside FavoritesProvider",
    );
  }

  return context;
}
