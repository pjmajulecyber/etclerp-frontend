
// src/pages/admin/settings/CompanySettings.jsx
import React, { useEffect, useState } from "react";
import "./CompanySettings.css";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function CompanySettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Tanzania",
    tin: "",
    vrn: "",
    website: "",
    currency: "TZS",
    logo: null,
  });

  const [logoPreview, setLogoPreview] = useState(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/settings/company/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error();

        const data = await res.json();

        setForm({
          ...form,
          ...data,
        });

        if (data.logo) {
          setLogoPreview(data.logo);
        }
      } catch (err) {
        console.warn("Using empty settings");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= LOGO ================= */
  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm({ ...form, logo: file });

    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  /* ================= SAVE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key] !== null) {
          formData.append(key, form[key]);
        }
      });

      await fetch(`${API_BASE}/api/settings/company/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      alert("Company settings saved successfully");
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="company-page">
      <div className="company-card">

        <div className="company-header">
          <h2>Company Settings</h2>
          <p>Manage your company information</p>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="company-form">

            {/* LOGO */}
            <div className="logo-section">
              <div className="logo-preview">
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" />
                ) : (
                  <span>No Logo</span>
                )}
              </div>

              <input type="file" accept="image/*" onChange={handleLogo} />
            </div>

            {/* DETAILS */}
            <div className="grid-2">
              <input name="name" placeholder="Company Name" value={form.name} onChange={handleChange} />
              <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
              <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
              <input name="website" placeholder="Website" value={form.website} onChange={handleChange} />
              <input name="tin" placeholder="TIN" value={form.tin} onChange={handleChange} />
              <input name="vrn" placeholder="VRN" value={form.vrn} onChange={handleChange} />
              <input name="city" placeholder="City" value={form.city} onChange={handleChange} />
              <input name="country" placeholder="Country" value={form.country} onChange={handleChange} />
            </div>

            <textarea
              name="address"
              placeholder="Company Address"
              value={form.address}
              onChange={handleChange}
            />

            <select name="currency" value={form.currency} onChange={handleChange}>
              <option value="TZS">TZS</option>
              <option value="USD">USD</option>
            </select>

            <button className="save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}