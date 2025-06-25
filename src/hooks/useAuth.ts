import { useState, useEffect } from "react";

import { Admin } from "@interface";

interface AuthState {
  isAuthenticated: boolean;
  admin: Admin | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    admin: null,
    loading: true,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          isAuthenticated: true,
          admin: data.admin,
          loading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          admin: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthState({
        isAuthenticated: false,
        admin: null,
        loading: false,
      });
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setAuthState({
        isAuthenticated: false,
        admin: null,
        loading: false,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    ...authState,
    checkAuth,
    logout,
  };
};
