import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status?: string;
  email_verified?: boolean;
  role?: string;
}

type AuthContextValue = {
  user: LocalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  login: (
    email: string,
    password: string,
    remember?: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE_URL = "/api/v1";
const TOKEN_KEY = "recyclepro-access-token";
const USER_KEY = "recyclepro-user";

function getStoredToken(): string | null {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY)
  );
}

function getStoredUser(): LocalUser | null {
  const stored =
    localStorage.getItem(USER_KEY) ||
    sessionStorage.getItem(USER_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as LocalUser;
  } catch {
    return null;
  }
}

function saveAuth(
  token: string,
  user: LocalUser,
  remember: boolean,
) {
  clearStoredAuth();

  const storage = remember ? localStorage : sessionStorage;

  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: { msg?: string }) => item.msg)
        .filter(Boolean)
        .join(", ");
    }

    return "Authentication request failed.";
  } catch {
    return "Authentication request failed.";
  }
}

function mapUser(data: {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  status?: string;
  email_verified?: boolean;
  role?: string;
}): LocalUser {
  return {
    id: data.id,
    name: `${data.first_name} ${data.last_name}`.trim(),
    email: data.email,
    phone: data.phone ?? null,
    status: data.status,
    email_verified: data.email_verified,
    role: data.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(
    getStoredUser,
  );

  const [isLoading, setIsLoading] = useState(
    () => Boolean(getStoredToken()),
  );

  useEffect(() => {
    const handleAuthExpired = () => {
      clearStoredAuth();
      setUser(null);
      setIsLoading(false);
      window.location.assign("/login");
    };

    window.addEventListener(
      "recyclepro-auth-expired",
      handleAuthExpired,
    );

    return () => {
      window.removeEventListener(
        "recyclepro-auth-expired",
        handleAuthExpired,
      );
    };
  }, []);


  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await parseError(response));
        }

        return response.json();
      })
      .then((data) => {
        const currentUser = mapUser(data);

        setUser(currentUser);

        const remember = Boolean(
          localStorage.getItem(TOKEN_KEY),
        );

        const storage = remember
          ? localStorage
          : sessionStorage;

        storage.setItem(
          USER_KEY,
          JSON.stringify(currentUser),
        );
      })
      .catch(() => {
        clearStoredAuth();
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const authenticate = async (
    email: string,
    password: string,
    remember: boolean,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: await parseError(response),
        };
      }

      const tokenData = await response.json();
      const token = tokenData.access_token;

      if (!token) {
        return {
          success: false,
          error: "Authentication server returned no access token.",
        };
      }

      const meResponse = await fetch(
        `${API_BASE_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!meResponse.ok) {
        return {
          success: false,
          error: await parseError(meResponse),
        };
      }

      const meData = await meResponse.json();
      const authenticatedUser = mapUser(meData);

      saveAuth(token, authenticatedUser, remember);
      setUser(authenticatedUser);

      return {
        success: true,
      };
    } catch {
      return {
        success: false,
        error:
          "Unable to connect to the authentication server.",
      };
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,

      async register(name, email, password, phone = "") {
        const trimmedName = name.trim();
        const parts = trimmedName.split(/\s+/);

        const firstName = parts[0] || "";
        const lastName =
          parts.slice(1).join(" ") || firstName;

        try {
          const response = await fetch(
            `${API_BASE_URL}/auth/register`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: email.trim().toLowerCase(),
                password,
                first_name: firstName,
                last_name: lastName,
                phone: phone.trim() || null,
              }),
            },
          );

          if (!response.ok) {
            if (response.status === 409) {
              return {
                success: false,
                error:
                  "An account with this email already exists. Please log in instead.",
              };
            }

            return {
              success: false,
              error: await parseError(response),
            };
          }

          /*
           * Registration creates the account.
           * Authentication happens immediately afterwards so
           * the new account receives a real JWT session.
           */
          return authenticate(
            email,
            password,
            true,
          );
        } catch {
          return {
            success: false,
            error:
              "Unable to connect to the authentication server.",
          };
        }
      },

      async login(email, password, remember = false) {
        return authenticate(email, password, remember);
      },

      logout() {
        clearStoredAuth();
        setUser(null);
      },
    }),
    [user, isLoading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}
