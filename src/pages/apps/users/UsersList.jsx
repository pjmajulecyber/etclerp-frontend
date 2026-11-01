// src/pages/admin/settings/Users.jsx
import React, { useState } from "react";
import "./Users.css";
import { FiPlus, FiEdit, FiTrash2, FiUserCheck } from "react-icons/fi";

export default function Users() {
  const [users, setUsers] = useState([
    {
      id: 1,
      first_name: "Philip",
      last_name: "Majule",
      email: "philip@evosha.co.tz",
      role: "Admin",
      phone: "0712345678",
      active: true,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    first_name: "",
    last_name: "",
    email: "",
    role: "User",
    phone: "",
    password: "",
    active: true,
  };

  const [form, setForm] = useState(emptyForm);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.first_name || !form.email) {
      alert("Name and Email required");
      return;
    }

    if (editingId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingId ? { ...u, ...form } : u
        )
      );
    } else {
      setUsers((prev) => [
        ...prev,
        { ...form, id: Date.now() },
      ]);
    }

    setShowModal(false);
  };

  const handleEdit = (u) => {
    setForm(u);
    setEditingId(u.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this user?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, active: !u.active } : u
      )
    );
  };

  return (
    <div className="users-page">

      <div className="users-header">
        <h2>Users Management</h2>
        <button className="add-btn" onClick={openAdd}>
          <FiPlus /> Add User
        </button>
      </div>

      <div className="users-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>{u.role}</td>

                <td>
                  <span className={u.active ? "active" : "inactive"}>
                    {u.active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>
                  <button onClick={() => toggleStatus(u.id)}>
                    <FiUserCheck />
                  </button>
                  <button onClick={() => handleEdit(u)}>
                    <FiEdit />
                  </button>
                  <button onClick={() => handleDelete(u.id)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal users-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Edit User" : "Add User"}</h3>

            <form onSubmit={handleSubmit} className="users-form">

              <div className="form-row">
                <input name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} />
                <input name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} />
              </div>

              <div className="form-row">
                <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
                <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
              </div>

              <div className="form-row">
                <select name="role" value={form.role} onChange={handleChange}>
                  <option>Admin</option>
                  <option>User</option>
                  <option>Manager</option>
                </select>

                <input name="password" type="password" placeholder="Password" onChange={handleChange} />
              </div>

              <label className="checkbox">
                <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
                Active User
              </label>

              <button className="save-btn">
                {editingId ? "Update User" : "Create User"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}


