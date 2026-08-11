"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type AdminTheme = "dark" | "light";

interface AdminThemeContextType {
  theme: AdminTheme;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme") as AdminTheme | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("admin-theme", next);
      return next;
    });
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`admin-panel${theme === "light" ? " light" : ""} min-h-screen flex`}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}
