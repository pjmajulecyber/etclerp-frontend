
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FiHome,
  FiShoppingCart,
  FiTruck,
  FiUsers,
  FiBox,
  FiDollarSign,
  FiUser,
  FiLayers,
  FiFileText,
  FiBarChart2,
  FiMail,
  FiSettings,  
  FiChevronDown
} from "react-icons/fi";

import "./sidebar.css";

export default function Sidebar() {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const linkClass = ({ isActive }) =>
    `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <aside className="sidebar">

      {/* ================= HEADER AREA ================= */}
      
      <div className="sidebar-top">

        {/* BRAND */}
        <div className="sidebar-brand">
          <div className="logo-box">🏢</div>
          <div>
            <h2>EVOSHA ERP</h2>
            <small>ETCL - Company System</small>
          </div>
        </div>

        {/* ACTIVE COMPANY */}
        <div className="active-company">
          <span>Active Company</span>
          <select>
            <option>Evosha Corporation</option>
          </select>
        </div>

      </div>

      {/* ================= SCROLLABLE MENU ================= */}
      <div className="sidebar-content">

        <ul className="sidebar-menu">

          <p className="menu-title">MAIN</p>

          <li>
            <NavLink to="/apps/dashboard" className={linkClass}>
              <FiHome /> Dashboard
            </NavLink>
          </li>

          <p className="menu-title">MODULES</p>

          {/* SALES */}
          <SidebarDropdown
            icon={<FiShoppingCart />}
            title="Sales Management"
            isOpen={openMenu === "sales"}
            toggle={() => toggleMenu("sales")}
          >  
            <NavLink to="/apps/sales/list" className={linkClass}>Sales List</NavLink>
        
            <NavLink to="/apps/sales/proforma-invoices" className={linkClass}>Proforma Invoices</NavLink>
          </SidebarDropdown>

          {/* PURCHASES */}
          <SidebarDropdown
            icon={<FiTruck />}
            title="Purchases"
            isOpen={openMenu === "purchases"}
            toggle={() => toggleMenu("purchases")}
          >
            {/* updated paths */}
            <NavLink to="/apps/purchases" className={linkClass}>Purchase List</NavLink>
            <NavLink to="/apps/purchases/supplier" className={linkClass}>Suppliers</NavLink>
            <NavLink to="/apps/purchases/" className={linkClass}>Purchases Invoices</NavLink>
          </SidebarDropdown>

          {/* CUSTOMERS */}
          <SidebarDropdown
            icon={<FiUsers />}
            title="Customers"
            isOpen={openMenu === "customers"}
            toggle={() => toggleMenu("customers")}
          >
            <NavLink to="/apps/customers/list" className={linkClass}>Customer List</NavLink>
            <NavLink to="/apps/customers/customer-statement" className={linkClass}>Customer Statements</NavLink>
           
          </SidebarDropdown>

          {/* INVENTORY */}
          <SidebarDropdown
            icon={<FiBox />}
            title="Inventory Management"
            isOpen={openMenu === "inventory"}
            toggle={() => toggleMenu("inventory")}
          >
            <NavLink to="/apps/inventory" className={linkClass}>Stock Management</NavLink>
            <NavLink to="/apps/inventory/stock/track" className={linkClass}>Track Stock</NavLink>
            <NavLink to="/apps/stock/depot" className={linkClass}>Stock Depot</NavLink>
            <NavLink to="/apps/stock/qr" className={linkClass}>Create QR Codes</NavLink>
          </SidebarDropdown>

          {/* LOGISTIC */}
          <SidebarDropdown
            icon={<FiTruck />}
            title="Logistic Management"
            isOpen={openMenu === "Logistics"}
            toggle={() => toggleMenu("Logistics")}
          >
            <NavLink to="/apps/logistics/list" className={linkClass}>Trucks Management</NavLink>
            <NavLink to="/apps/logistics/drivers-list" className={linkClass}>Drivers</NavLink>
            <NavLink to="/apps/logistics/live-truck" className={linkClass}>Live Tracker</NavLink>
          </SidebarDropdown>


          {/* EXPENSES */}
          <SidebarDropdown
            icon={<FiDollarSign />}
            title="Expenses"
            isOpen={openMenu === "expenses"}
            toggle={() => toggleMenu("expenses")}
          >
            <NavLink to="/apps/expenses" className={linkClass}>Expense List</NavLink>
            <NavLink to="/apps/expenses/categories" className={linkClass}>Create Category</NavLink>
            <NavLink to="/apps/expenses/track" className={linkClass}>Track Expenses</NavLink>
           
          </SidebarDropdown>

          {/* HR */}
          <SidebarDropdown
            icon={<FiUser />}
            title="HR & Payroll"
            isOpen={openMenu === "hr"}
            toggle={() => toggleMenu("hr")}
          >
            <NavLink to="/apps/payroll" className={linkClass}>Employees List</NavLink>
            <NavLink to="/apps/payroll" className={linkClass}>Add Employee</NavLink>
            <NavLink to="/apps/payroll" className={linkClass}>Payrolls</NavLink>
            <NavLink to="/apps/payroll" className={linkClass}>Import Payrolls</NavLink>
          </SidebarDropdown>

          {/* ASSETS */}
          <SidebarDropdown
            icon={<FiLayers />}
            title="Asset Management"
            isOpen={openMenu === "assets"}
            toggle={() => toggleMenu("assets")}
          >
           
            <NavLink to="/apps/assets" className={linkClass}>Asset List</NavLink>
            <NavLink to="/apps/assets/register" className={linkClass}>Register Asset</NavLink>
            <NavLink to="/apps/assets/track" className={linkClass}>Track Assets</NavLink>
            <NavLink to="/apps/assets/import" className={linkClass}>Import Asset</NavLink>
            <NavLink to="/apps/assets/qr" className={linkClass}>Create QR Code</NavLink>
          </SidebarDropdown>

          {/* DOCUMENTS */}
          <SidebarDropdown
            icon={<FiFileText />}
            title="Document Management"
            isOpen={openMenu === "documents"}
            toggle={() => toggleMenu("documents")}
          >
            <NavLink to="/apps/documents" className={linkClass}>Doc List</NavLink>
            <NavLink to="/apps/docs/categories" className={linkClass}>Doc Categories</NavLink>
            <NavLink to="/apps/docs/upload" className={linkClass}>Upload Doc</NavLink>
            <NavLink to="/apps/docs/track" className={linkClass}>Track Doc</NavLink>
          </SidebarDropdown>

          {/* REPORTS */}
          <SidebarDropdown
            icon={<FiBarChart2 />}
            title="Reports"
            isOpen={openMenu === "reports"}
            toggle={() => toggleMenu("reports")}
          >
            <NavLink to="/apps/reports/sales-report" className={linkClass}>Sales Reports</NavLink>
            <NavLink to="/apps/reports/payment-report" className={linkClass}>Payment Reports</NavLink>
            <NavLink to="/apps/reports/stock-report" className={linkClass}>Stock Reports</NavLink>
            <NavLink to="/apps/reports/expenses-report" className={linkClass}>Expense Reports</NavLink>
            <NavLink to="/apps/reports/assets-report" className={linkClass}>Asset Reports</NavLink>
            <NavLink to="/apps/reports/documents" className={linkClass}>Document Reports</NavLink>
            <NavLink to="/apps/reports/tax" className={linkClass}>Tax / VAT Reports</NavLink>
          </SidebarDropdown>

          {/* USERS */}
          <SidebarDropdown
            icon={<FiUsers />}
            title="Users" 
            isOpen={openMenu === "users"}
            toggle={() => toggleMenu("users")}
          >
            <NavLink to="/apps/users/list" className={linkClass}>New User</NavLink>
            <NavLink to="/apps/users/roles" className={linkClass}>User Roles</NavLink>
          </SidebarDropdown>

          {/* EMAIL */}
          <SidebarDropdown
            icon={<FiMail />}
            title="Email"
            isOpen={openMenu === "email"}
            toggle={() => toggleMenu("email")}
          >
            <NavLink to="/apps/payroll/email-access" className={linkClass}>Access Email</NavLink>
          </SidebarDropdown>

        </ul>
      </div>

      {/* ================= FIXED FOOTER ================= */}
      <div className="sidebar-footer">
        <SidebarDropdown
          icon={<FiSettings />}
          title="Settings"
          isOpen={openMenu === "settings"}
          toggle={() => toggleMenu("settings")}
        >
          <NavLink to="/apps/settings/company-settings" className={linkClass}>Company Profile</NavLink>
          <NavLink to="/apps/settings/tax-settings" className={linkClass}>Tax List</NavLink>
          <NavLink to="/apps/settings/account-code" className={linkClass}>Manage Account Codes</NavLink>
          <NavLink to="/apps/settings/payment-setting" className={linkClass}>Payment Types</NavLink>
          <NavLink to="/apps 
           /settings/database-backup" className={linkClass}>Database Backup</NavLink>
        </SidebarDropdown>
      </div>

    </aside>
  );
}

/* Reusable Dropdown */
function SidebarDropdown({ icon, title, isOpen, toggle, children }) {
  return (
    <li className="sidebar-section">
      <button className="sidebar-dropdown-btn" onClick={toggle}>
        <span>{icon} {title}</span>
        <FiChevronDown className={`arrow ${isOpen ? "open" : ""}`} />
      </button>

      <ul className={`sidebar-submenu ${isOpen ? "show" : ""}`}>
        {children}
      </ul>
    </li>
  );
}