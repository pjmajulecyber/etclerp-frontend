

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import {
  FiSearch,
  FiPlus,
  FiBell,
  FiUser,
  FiLogOut,
  FiLock,
  FiChevronDown
} from "react-icons/fi";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import "./Topbar.css";

export default function Topbar() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [user, setUser] = useState(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const notifications = [
    { id: 1, text: "New sale created", time: "2 mins ago" },
    { id: 2, text: "Stock running low", time: "10 mins ago" },
    { id: 3, text: "Expense approved", time: "1 hour ago" }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/users/");
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      } catch (err) {
        console.error(err);

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser({
            username: "Philip",
            first_name: "Philip",
            last_name: "Majule"
          });
        }
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (name, e) => {
    e.stopPropagation();
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleAddSale = (e) => {
    e.stopPropagation();
    setActiveDropdown(null);
    navigate("/admin/sales/modules/add");
  };

  const handleAddPurchase = (e) => {
    e.stopPropagation();
    setActiveDropdown(null);
    navigate("/admin/purchases/modules/add");
  };

  const handleAddExpense = (e) => {
    e.stopPropagation();
    setActiveDropdown(null);
    navigate("/admin/expenses/modules/add", { replace: false });
  };

  const goToProfile = (e) => {
    e.stopPropagation();
    setActiveDropdown(null);
    navigate("/admin/users/list");
  };

  const goToChangePassword = (e) => {
    e.stopPropagation();
    setActiveDropdown(null);
    navigate("/admin/settings/change-password");
  };

  const handleLogout = (e) => {
    e.stopPropagation();
    setActiveDropdown(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/logout");
  };

  const getDisplayName = () => {
    if (!user) return "Guest";

    const fullName =
      user.full_name ||
      user.name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim();

    return fullName || user.username || "User";
  };

  const getInitials = () => {
    if (!user) return "U";

    const name = getDisplayName();
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  return (
    <div className="topbar">
      <div className="topbar-left"></div>

      <div className="topbar-right" ref={wrapperRef}>
        <div className="search-box">
          <FiSearch className="icon" />
          <input placeholder="Search transactions, items" />
        </div>

        <div className="dropdown-wrapper">
          <button
            className="icon-btn"
            onClick={(e) => toggle("quick", e)}
            aria-expanded={activeDropdown === "quick"}
            aria-haspopup="menu"
          >
            <FiPlus className="topbar-icon" />
          </button>

          {activeDropdown === "quick" && (
            <div className="dropdown-menu" role="menu" aria-label="Quick actions">
              <button className="dropdown-item" onClick={handleAddSale}>Add Sale</button>
              <button className="dropdown-item" onClick={handleAddPurchase}>Add Purchase</button>
              <button className="dropdown-item" onClick={handleAddExpense}>Add Expense</button>
            </div>
          )}
        </div>

        <div className="dropdown-wrapper">
          <button
            className="icon-btn"
            onClick={(e) => toggle("notif", e)}
            aria-expanded={activeDropdown === "notif"}
            aria-haspopup="dialog"
          >
            <FiBell className="topbarNot-icon" />
            <span className="notification-dot" />
          </button>

          {activeDropdown === "notif" && (
            <div className="dropdown-menu notification-menu" role="dialog" aria-label="Notifications">
              <h4>Notifications</h4>
              {notifications.map((n) => (
                <div key={n.id} className="notification-item">
                  <span>{n.text}</span>
                  <small>{n.time}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dropdown-wrapper">
          <div
            className="branch-select"
            onClick={(e) => toggle("branch", e)}
            role="button"
            tabIndex={0}
            aria-expanded={activeDropdown === "branch"}
          >
            <HiOutlineOfficeBuilding className="icon" />
            <span>Head Office</span>
            <FiChevronDown className="icon-small" />
          </div>

          {activeDropdown === "branch" && (
            <div className="dropdown-menu">
              <p>Head Office</p>
              <p>Branch</p>
            </div>
          )}
        </div>

        <div className="dropdown-wrapper">
          <div
            className="profile-box"
            onClick={(e) => toggle("profile", e)}
            role="button"
            tabIndex={0}
            aria-expanded={activeDropdown === "profile"}
          >
            <div className="avatar">{getInitials()}</div>
            <span>{getDisplayName()}</span>
            <FiChevronDown className="icon-small" />
          </div>

          {activeDropdown === "profile" && (
            <div className="dropdown-menu" role="menu" aria-label="User menu">
              <button className="dropdown-item" onClick={goToProfile}>
                <FiUser className="icon-small" /> Profile
              </button>

              <button className="dropdown-item" onClick={goToChangePassword}>
                <FiLock className="icon-small" /> Change Password
              </button>

              <button className="dropdown-item" onClick={handleLogout}>
                <FiLogOut className="icon-small" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}