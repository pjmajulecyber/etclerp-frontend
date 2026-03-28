import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import "./Adminlayout.css";
import "../styles/global.css";

export default function AdminLayouts() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebarCollapsed");
      return raw === "1";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sidebarCollapsed", collapsed ? "1" : "0");
    } catch (e) {}
  }, [collapsed]);

  const toggle = () => setCollapsed(c => !c);

  return (
    <div className={`admin-layout ${collapsed ? "collapsed" : ""}`}>
      <Sidebar />
      <Topbar />
      <button
        type="button"
        className={`sidebar-toggle ${collapsed ? "is-collapsed" : ""}`}
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          {collapsed ? (
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          ) : (
            <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
      </button>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

