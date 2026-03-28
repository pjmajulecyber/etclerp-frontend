import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (token) {
      setUser({ token });
    }

  }, []);

  const login = ({ token }) => {

    if (!token) return;

    localStorage.setItem("token", token);

    setUser({
      token: token
    });

  };

  const logout = async () => {

    const token = localStorage.getItem("token");

    try {

      if (token) {

        await fetch(`${API_BASE}/api/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

      }

    } catch (err) {}

    localStorage.removeItem("token");

    setUser(null);

    window.location.href = "/login";

  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {

  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;

}