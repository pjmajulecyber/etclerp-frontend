




// src/pages/admin/settings/UserRoles.jsx
import React, { useState } from "react";
import "./UserRoles.css";
import { FiPlus, FiSave } from "react-icons/fi";

const modules = [
  // MAIN
  { group: "MAIN", module: "Dashboard" },

  // SALES
  { group: "SALES MANAGEMENT", module: "Sales List" },
  { group: "SALES MANAGEMENT", module: "Receive Payment" },
  { group: "SALES MANAGEMENT", module: "Proforma Invoices" },

  // PURCHASES
  { group: "PURCHASES", module: "Purchase List" },
  { group: "PURCHASES", module: "Suppliers" },
  { group: "PURCHASES", module: "Purchase Invoices" },

  // CUSTOMERS
  { group: "CUSTOMERS", module: "Customer List" },
  { group: "CUSTOMERS", module: "Customer Statements" },
  { group: "CUSTOMERS", module: "Upload Customers" },

  // INVENTORY
  { group: "INVENTORY MANAGEMENT", module: "Stock Management" },
  { group: "INVENTORY MANAGEMENT", module: "Track Stock" },
  { group: "INVENTORY MANAGEMENT", module: "Stock Depot" },
  { group: "INVENTORY MANAGEMENT", module: "Create QR Codes" },

  // LOGISTICS
  { group: "LOGISTIC MANAGEMENT", module: "Trucks Management" },
  { group: "LOGISTIC MANAGEMENT", module: "Drivers" },
  { group: "LOGISTIC MANAGEMENT", module: "Live Tracker" },

  // EXPENSES
  { group: "EXPENSES", module: "Expense List" },
  { group: "EXPENSES", module: "Create Category" },
  { group: "EXPENSES", module: "Track Expenses" },
  { group: "EXPENSES", module: "Import Expenses" },

  // HR
  { group: "HR & PAYROLL", module: "Employees List" },
  { group: "HR & PAYROLL", module: "Add Employee" },
  { group: "HR & PAYROLL", module: "Payrolls" },
  { group: "HR & PAYROLL", module: "Import Payrolls" },

  // ASSETS
  { group: "ASSET MANAGEMENT", module: "Asset List" },
  { group: "ASSET MANAGEMENT", module: "Register Asset" },
  { group: "ASSET MANAGEMENT", module: "Track Assets" },
  { group: "ASSET MANAGEMENT", module: "Import Asset" },
  { group: "ASSET MANAGEMENT", module: "Create QR Code" },

  // DOCUMENTS
  { group: "DOCUMENT MANAGEMENT", module: "Doc List" },
  { group: "DOCUMENT MANAGEMENT", module: "Doc Categories" },
  { group: "DOCUMENT MANAGEMENT", module: "Upload Doc" },
  { group: "DOCUMENT MANAGEMENT", module: "Track Doc" },

  // REPORTS
  { group: "REPORTS", module: "Sales Reports" },
  { group: "REPORTS", module: "Payment Reports" },
  { group: "REPORTS", module: "Stock Reports" },
  { group: "REPORTS", module: "Expense Reports" },
  { group: "REPORTS", module: "Asset Reports" },
  { group: "REPORTS", module: "Document Reports" },
  { group: "REPORTS", module: "Tax / VAT Reports" },

  // USERS
  { group: "USERS", module: "New User" },
  { group: "USERS", module: "User Roles" },

  // EMAIL
  { group: "EMAIL", module: "Access Email" },

  // SETTINGS
  { group: "SETTINGS", module: "Company Profile" },
  { group: "SETTINGS", module: "Tax List" },
  { group: "SETTINGS", module: "Manage Account Codes" },
  { group: "SETTINGS", module: "Payment Types" },
  { group: "SETTINGS", module: "Database Backup" },
];

const moduleNames = modules.map((m) => m.module);

const defaultRoles = [
  {
    id: 1,
    name: "Admin",
    permissions: moduleNames.map((m) => ({
      module: m,
      view: true,
      create: true,
      edit: true,
      delete: true,
    })),
  },
  {
    id: 2,
    name: "Directors",
    permissions: moduleNames.map((m) => ({
      module: m,
      view: true,
      create: true,
      edit: true,
      delete: false,
    })),
  },
  {
    id: 3,
    name: "Accountant",
    permissions: moduleNames.map((m) => ({
      module: m,
      view: true,
      create: false,
      edit: false,
      delete: false,
    })),
  },
  {
    id: 4,
    name: "Deport Manager",
    permissions: moduleNames.map((m) => ({
      module: m,
      view: true,
      create: false,
      edit: false,
      delete: false,
    })),
  },
];

export default function UserRoles() {
  const [roles, setRoles] = useState(defaultRoles);
  const [selectedRole, setSelectedRole] = useState(defaultRoles[0]);
  const [showModal, setShowModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const handlePermissionChange = (module, field) => {
    const updated = {
      ...selectedRole,
      permissions: selectedRole.permissions.map((p) =>
        p.module === module ? { ...p, [field]: !p[field] } : p
      ),
    };

    setSelectedRole(updated);
    setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleAddRole = () => {
    const name = String(newRoleName || "").trim();
    if (!name) return;

    const newRole = {
      id: Date.now(),
      name,
      permissions: moduleNames.map((m) => ({
        module: m,
        view: false,
        create: false,
        edit: false,
        delete: false,
      })),
    };

    setRoles((prev) => [...prev, newRole]);
    setNewRoleName("");
    setShowModal(false);
    setSelectedRole(newRole);
  };

  return (
    <div className="roles-page">
      <div className="roles-header">
        <h2>User Roles & Permissions</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <FiPlus /> Add Role
        </button>
      </div>

      <div className="roles-container">
        <div className="roles-list">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`role-item ${selectedRole.id === role.id ? "active" : ""}`}
              onClick={() => setSelectedRole(role)}
            >
              {role.name}
            </div>
          ))}
        </div>

        <div className="roles-table-container">
          <h3>{selectedRole.name} Permissions</h3>

          <table className="roles-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>View</th>
                <th>Create</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>

            <tbody>
              {modules.map((item) => {
                const permission = selectedRole.permissions.find(
                  (p) => p.module === item.module
                ) || {
                  module: item.module,
                  view: false,
                  create: false,
                  edit: false,
                  delete: false,
                };

                return (
                  <tr key={`${item.group}-${item.module}`}>
                    <td>{item.module}</td>
                    {["view", "create", "edit", "delete"].map((field) => (
                      <td key={field}>
                        <input
                          type="checkbox"
                          checked={Boolean(permission[field])}
                          onChange={() => handlePermissionChange(item.module, field)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button className="save-btn">
            <FiSave /> Save Changes
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Role</h3>

            <input
              placeholder="Role Name (e.g Supervisor)"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />

            <button className="save-btn" onClick={handleAddRole}>
              Create Role
            </button>
          </div>
        </div>
      )}
    </div>
  );
}