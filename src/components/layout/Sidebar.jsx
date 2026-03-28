



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

import "./Sidebar.css";

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
            <NavLink to="/admin/dashboard" className={linkClass}>
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
            <NavLink to="/admin/sales/list" className={linkClass}>Sales List</NavLink>
            <NavLink to="/admin/sales/receive-payments" className={linkClass}>Receive Payment</NavLink>
            <NavLink to="/admin/sales/proforma-invoices" className={linkClass}>Proforma Invoices</NavLink>
          </SidebarDropdown>

          {/* PURCHASES */}
          <SidebarDropdown
            icon={<FiTruck />}
            title="Purchases"
            isOpen={openMenu === "purchases"}
            toggle={() => toggleMenu("purchases")}
          >
            {/* updated paths */}
            <NavLink to="/admin/purchases" className={linkClass}>Purchase List</NavLink>
            <NavLink to="/admin/purchases/supplier" className={linkClass}>Suppliers</NavLink>
            <NavLink to="/admin/purchases/" className={linkClass}>Purchases Invoices</NavLink>
          </SidebarDropdown>

          {/* CUSTOMERS */}
          <SidebarDropdown
            icon={<FiUsers />}
            title="Customers"
            isOpen={openMenu === "customers"}
            toggle={() => toggleMenu("customers")}
          >
            <NavLink to="/admin/customers/list" className={linkClass}>Customer List</NavLink>
            <NavLink to="/admin/customers/customer-statement" className={linkClass}>Customer Statements</NavLink>
            <NavLink to="/admin/customers/upload" className={linkClass}>Upload Customers</NavLink>
          </SidebarDropdown>

          {/* INVENTORY */}
          <SidebarDropdown
            icon={<FiBox />}
            title="Inventory Management"
            isOpen={openMenu === "inventory"}
            toggle={() => toggleMenu("inventory")}
          >
            <NavLink to="/admin/inventory" className={linkClass}>Stock Management</NavLink>
            <NavLink to="/admin/inventory/stock/track" className={linkClass}>Track Stock</NavLink>
            <NavLink to="/admin/stock/depot" className={linkClass}>Stock Depot</NavLink>
            <NavLink to="/admin/stock/qr" className={linkClass}>Create QR Codes</NavLink>
          </SidebarDropdown>

          {/* LOGISTIC */}
          <SidebarDropdown
            icon={<FiTruck />}
            title="Logistic Management"
            isOpen={openMenu === "Logistics"}
            toggle={() => toggleMenu("Logistics")}
          >
            <NavLink to="/admin/logistics/list" className={linkClass}>Trucks Management</NavLink>
            <NavLink to="/admin/logistics/drivers-list" className={linkClass}>Drivers</NavLink>
            <NavLink to="/admin/logistics/live-truck" className={linkClass}>Live Tracker</NavLink>
          </SidebarDropdown>


          {/* EXPENSES */}
          <SidebarDropdown
            icon={<FiDollarSign />}
            title="Expenses"
            isOpen={openMenu === "expenses"}
            toggle={() => toggleMenu("expenses")}
          >
            <NavLink to="/admin/expenses" className={linkClass}>Expense List</NavLink>
            <NavLink to="/admin/expenses/categories" className={linkClass}>Create Category</NavLink>
            <NavLink to="/admin/expenses/track" className={linkClass}>Track Expenses</NavLink>
            <NavLink to="/admin/expenses/import" className={linkClass}>Import Expenses</NavLink>
          </SidebarDropdown>

          {/* HR */}
          <SidebarDropdown
            icon={<FiUser />}
            title="HR & Payroll"
            isOpen={openMenu === "hr"}
            toggle={() => toggleMenu("hr")}
          >
            <NavLink to="/admin/payroll" className={linkClass}>Employees List</NavLink>
            <NavLink to="/admin/employees/add" className={linkClass}>Add Employee</NavLink>
            <NavLink to="/admin/payroll/list" className={linkClass}>Payrolls</NavLink>
            <NavLink to="/admin/payroll/import" className={linkClass}>Import Payrolls</NavLink>
          </SidebarDropdown>

          {/* ASSETS */}
          <SidebarDropdown
            icon={<FiLayers />}
            title="Asset Management"
            isOpen={openMenu === "assets"}
            toggle={() => toggleMenu("assets")}
          >
           
            <NavLink to="/admin/assets" className={linkClass}>Asset List</NavLink>
            <NavLink to="/admin/assets/register" className={linkClass}>Register Asset</NavLink>
            <NavLink to="/admin/assets/track" className={linkClass}>Track Assets</NavLink>
            <NavLink to="/admin/assets/import" className={linkClass}>Import Asset</NavLink>
            <NavLink to="/admin/assets/qr" className={linkClass}>Create QR Code</NavLink>
          </SidebarDropdown>

          {/* DOCUMENTS */}
          <SidebarDropdown
            icon={<FiFileText />}
            title="Document Management"
            isOpen={openMenu === "documents"}
            toggle={() => toggleMenu("documents")}
          >
            <NavLink to="/admin/documents" className={linkClass}>Doc List</NavLink>
            <NavLink to="/admin/docs/categories" className={linkClass}>Doc Categories</NavLink>
            <NavLink to="/admin/docs/upload" className={linkClass}>Upload Doc</NavLink>
            <NavLink to="/admin/docs/track" className={linkClass}>Track Doc</NavLink>
          </SidebarDropdown>

          {/* REPORTS */}
          <SidebarDropdown
            icon={<FiBarChart2 />}
            title="Reports"
            isOpen={openMenu === "reports"}
            toggle={() => toggleMenu("reports")}
          >
            <NavLink to="/admin/reports/sales-report" className={linkClass}>Sales Reports</NavLink>
            <NavLink to="/admin/reports/payment-report" className={linkClass}>Payment Reports</NavLink>
            <NavLink to="/admin/reports/stock-report" className={linkClass}>Stock Reports</NavLink>
            <NavLink to="/admin/reports/expenses-report" className={linkClass}>Expense Reports</NavLink>
            <NavLink to="/admin/reports/assets-report" className={linkClass}>Asset Reports</NavLink>
            <NavLink to="/admin/reports/documents" className={linkClass}>Document Reports</NavLink>
            <NavLink to="/admin/reports/tax" className={linkClass}>Tax / VAT Reports</NavLink>
          </SidebarDropdown>

          {/* USERS */}
          <SidebarDropdown
            icon={<FiUsers />}
            title="Users" 
            isOpen={openMenu === "users"}
            toggle={() => toggleMenu("users")}
          >
            <NavLink to="/admin/users/list" className={linkClass}>New User</NavLink>
            <NavLink to="/admin/users/roles" className={linkClass}>User Roles</NavLink>
          </SidebarDropdown>

          {/* EMAIL */}
          <SidebarDropdown
            icon={<FiMail />}
            title="Email"
            isOpen={openMenu === "email"}
            toggle={() => toggleMenu("email")}
          >
            <NavLink to="/admin/payroll/email-access" className={linkClass}>Access Email</NavLink>
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
          <NavLink to="/admin/settings/company-settings" className={linkClass}>Company Profile</NavLink>
          <NavLink to="/admin/settings/tax-settings" className={linkClass}>Tax List</NavLink>
          <NavLink to="/admin/settings/account-code" className={linkClass}>Manage Account Codes</NavLink>
          <NavLink to="/admin/settings/payment-setting" className={linkClass}>Payment Types</NavLink>
          <NavLink to="/admin/settings/database-backup" className={linkClass}>Database Backup</NavLink>
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