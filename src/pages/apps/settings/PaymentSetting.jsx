// src/pages/admin/settings/PaymentSettings.jsx
import React, { useState } from "react";
import "./PaymentSettings.css";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

/* ================= MOCK DATA ================= */
const mockPayments = [
  {
    id: 1,
    name: "Cash",
    type: "CASH",
    charge: 0,
    is_percentage: false,
    account: "Cash Account",
    active: true,
  },
  {
    id: 2,
    name: "CRDB Bank",
    type: "BANK",
    charge: 1.5,
    is_percentage: true,
    account: "CRDB - 0150023456",
    active: true,
  },
  {
    id: 3,
    name: "M-Pesa",
    type: "MOBILE",
    charge: 2,
    is_percentage: true,
    account: "M-Pesa Till 123456",
    active: true,
  },
];

const emptyForm = {
  name: "",
  type: "CASH",
  charge: "",
  is_percentage: true,
  account: "",
  active: true,
};

export default function PaymentSettings() {
  const [payments, setPayments] = useState(mockPayments);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  /* ================= HANDLE ================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  /* ================= ADD / UPDATE ================= */
  const handleSubmit = (e) => {
    e.preventDefault();

    const newItem = {
      id: editingId || Date.now(),
      name: form.name,
      type: form.type,
      charge: Number(form.charge),
      is_percentage: form.is_percentage,
      account: form.account,
      active: form.active,
    };

    if (editingId) {
      setPayments((prev) =>
        prev.map((p) => (p.id === editingId ? newItem : p))
      );
    } else {
      setPayments((prev) => [newItem, ...prev]);
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowModal(false);
  };

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
    setShowModal(true);
  };

  /* ================= DELETE ================= */
  const handleDelete = (id) => {
    if (!confirm("Delete this payment type?")) return;
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="pay-page">
      <div className="pay-card">

        <div className="pay-header">
          <h2>Payment Settings</h2>
          <button className="add-btn" onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowModal(true);
          }}>
            <FiPlus /> Add Payment
          </button>
        </div>

        <table className="pay-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Account</th>
              <th>Charge</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.type}</td>
                <td>{p.account}</td>
                <td>{p.charge}{p.is_percentage ? "%" : ""}</td>
                <td>{p.is_percentage ? "Percentage" : "Fixed"}</td>
                <td>
                  <span className={p.active ? "active" : "inactive"}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleEdit(p)}><FiEdit /></button>
                  <button onClick={() => handleDelete(p.id)}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Edit Payment" : "Add Payment"}</h3>

            <form onSubmit={handleSubmit} className="form">

              <input
                name="name"
                placeholder="Payment Name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <select name="type" value={form.type} onChange={handleChange}>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
                <option value="MOBILE">Mobile Money</option>
                <option value="OTHER">Other</option>
              </select>

              <input
                name="account"
                placeholder="Bank / Account / Till Number"
                value={form.account}
                onChange={handleChange}
                required
              />

              <input
                name="charge"
                type="number"
                placeholder="Charge"
                value={form.charge}
                onChange={handleChange}
                required
              />

              <label className="checkbox">
                <input
                  type="checkbox"
                  name="is_percentage"
                  checked={form.is_percentage}
                  onChange={handleChange}
                />
                Percentage (%)
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                Active
              </label>

              <button className="save-btn">
                {editingId ? "Update" : "Save"}
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}