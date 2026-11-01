

import React, { useEffect, useMemo, useState } from "react";
import API from "../../../../services/api";
import "./Suppliers.css";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // search + paging
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // modal state + form
  const [showAdd, setShowAdd] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createErrors, setCreateErrors] = useState(null);
  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    tin: "",
    is_active: true
  });

  // small mock fallback list (used if API fails)
  const MOCK_SUPPLIERS = [
    { id: "m1", name: "Alpha Logistics", contact_person: "John Mwinyi", phone: "255700111222", email: "alpha@example.com", address: "Dar es Salaam", tin: "TIN0001", is_active: true },
    { id: "m2", name: "Prime Traders", contact_person: "Asha K", phone: "255700333444", email: "prime@example.com", address: "Arusha", tin: "TIN0002", is_active: true },
    { id: "m3", name: "Metro Transport", contact_person: "Sam P", phone: "255700555666", email: "metro@example.com", address: "Moshi", tin: "TIN0003", is_active: false }
  ];

  useEffect(() => {
    loadSuppliers();
    // eslint-disable-next-line
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await API.get("suppliers/");
      const data = res?.data;
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setSuppliers(list);
    } catch (err) {
      console.error("Suppliers API failed:", err);
      setApiError(err);
      setSuppliers(MOCK_SUPPLIERS);
    } finally {
      setLoading(false);
      setPage(1);
    }
  };

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const resetForm = () => setForm({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    tin: "",
    is_active: true
  });

  const handleCreate = async () => {
    setCreateErrors(null);

    if (!form.name || form.name.trim() === "") {
      setCreateErrors({ name: ["This field is required."] });
      return;
    }

    const payload = {
      name: form.name,
      contact_person: form.contact_person || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      tin: form.tin || null,
      is_active: form.is_active
    };

    setCreateLoading(true);
    try {
      await API.post("suppliers/", payload);
      await loadSuppliers();
      setShowAdd(false);
      resetForm();
    } catch (err) {
      console.error("Create supplier failed:", err);
      if (err?.response?.data) {
        setCreateErrors(err.response.data);
        setCreateLoading(false);
        return;
      }
      // fallback to local
      const fallback = {
        id: `local-${Date.now()}`,
        ...payload
      };
      setSuppliers(prev => [fallback, ...prev]);
      setShowAdd(false);
      resetForm();
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteLocal = (id) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // Search/filter logic
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(s =>
      (s.id || "").toString().toLowerCase().includes(q) ||
      (s.name || "").toString().toLowerCase().includes(q) ||
      (s.contact_person || "").toString().toLowerCase().includes(q) ||
      (s.phone || "").toString().toLowerCase().includes(q) ||
      (s.email || "").toString().toLowerCase().includes(q) ||
      (s.address || "").toString().toLowerCase().includes(q) ||
      (s.tin || "").toString().toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageData = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // helper to display CODE (prefer supplier.code if backend provided; otherwise generate SUP-<id or local>)
  const displayCode = (s) => {
    if (s.code) return s.code;
    if (s.id && typeof s.id === "number") return `SUP-${String(s.id).padStart(4, "0")}`;
    if (s.id && typeof s.id === "string" && s.id.startsWith("m")) return `SUP-${s.id.toUpperCase()}`;
    return `SUP-${String(Math.abs(String(s.name || "").split("").reduce((a,c)=>a+c.charCodeAt(0),0))).slice(0,4)}`;
  };

  return (
    <div className="sp-page">
      <header className="sp-header">
        <div className="sp-titleBlock">
          <h1>Suppliers</h1>
          <p className="sp-muted">Manage suppliers — add, search and view contact info</p>
        </div>

        <div className="sp-actions">
          <button className="sp-btn primary" onClick={() => setShowAdd(true)}>+ Add Supplier</button>
          <button className="sp-btn" onClick={loadSuppliers}>Reload</button>
        </div>
      </header>

      <section className="sp-controls">
        <div className="sp-left">
          <input
            className="sp-search"
            placeholder="Search code, name, contact, phone, email, tin..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="sp-right">
          <label className="sp-selectLabel">Rows</label>
          <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </section>

      <section className="sp-summary">
        <div className="sp-card">
          <div className="sp-cardLabel">Total</div>
          <div className="sp-cardValue">{filtered.length}</div>
        </div>
        <div className="sp-card">
          <div className="sp-cardLabel">Visible</div>
          <div className="sp-cardValue">{pageData.length}</div>
        </div>
        <div className="sp-card">
          <div className="sp-cardLabel">Page</div>
          <div className="sp-cardValue">{page} / {totalPages}</div>
        </div>
      </section>

      <section className="sp-tableWrap">
        <table className="sp-table">
          <thead>
            <tr>
              <th>CODE</th>
              <th>NAME</th>
              <th>CONTACT</th>
              <th>PHONE</th>
              <th>EMAIL</th>
              <th>ADDRESS</th>
              <th>TIN</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr><td colSpan={9} className="sp-empty">Loading suppliers...</td></tr>
            )}

            {!loading && pageData.length === 0 && (
              <tr><td colSpan={9} className="sp-empty">No suppliers found</td></tr>
            )}

            {!loading && pageData.map(s => (
              <tr key={s.id}>
                <td className="sp-code">{displayCode(s)}</td>
                <td>{s.name}</td>
                <td>{s.contact_person || "-"}</td>
                <td>{s.phone || "-"}</td>
                <td>{s.email || "-"}</td>
                <td className="sp-address">{s.address || "-"}</td>
                <td>{s.tin || "-"}</td>
                <td>{s.is_active ? "Active" : "Inactive"}</td>
                <td>
                  <div className="sp-rowActions">
                    <button className="sp-btn small" onClick={() => alert(JSON.stringify(s, null, 2))}>View</button>
                    <button className="sp-btn small danger" onClick={() => handleDeleteLocal(s.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={9} className="sp-footer">
                Showing {(filtered.length === 0) ? 0 : (page - 1) * rowsPerPage + 1}
                {" "}to {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="sp-pagination">
        <div>
          <button className="sp-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
          <span className="sp-pageInd">Page {page} / {totalPages}</span>
          <button className="sp-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </section>

      {/* Add Supplier Modal */}
      {showAdd && (
        <div className="sp-modalOverlay" onClick={() => setShowAdd(false)}>
          <div className="sp-modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modalHead">
              <h3>Add Supplier</h3>
              <button className="sp-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>

            <div className="sp-modalBody">
              <div className="sp-grid">
                <div className="sp-field">
                  <label>CODE (auto)</label>
                  <input readOnly value={ suppliers.length > 0 ? `SUP-${String((suppliers[0]?.id || "0")).padStart(4,"0")}` : "SUP-0000" } />
                </div>

                <div className="sp-field">
                  <label>NAME *</label>
                  <input value={form.name} onChange={(e)=>setField("name", e.target.value)} />
                  {createErrors?.name && <div className="sp-error">{createErrors.name.join(", ")}</div>}
                </div>

                <div className="sp-field">
                  <label>CONTACT</label>
                  <input value={form.contact_person} onChange={(e)=>setField("contact_person", e.target.value)} />
                </div>

                <div className="sp-field">
                  <label>PHONE</label>
                  <input value={form.phone} onChange={(e)=>setField("phone", e.target.value)} />
                </div>

                <div className="sp-field wide">
                  <label>EMAIL</label>
                  <input value={form.email} onChange={(e)=>setField("email", e.target.value)} />
                </div>

                <div className="sp-field">
                  <label>TIN</label>
                  <input value={form.tin} onChange={(e)=>setField("tin", e.target.value)} />
                </div>

                <div className="sp-field wide">
                  <label>ADDRESS</label>
                  <input value={form.address} onChange={(e)=>setField("address", e.target.value)} />
                </div>

                <div className="sp-field">
                  <label>STATUS</label>
                  <select value={form.is_active ? "active" : "inactive"} onChange={(e)=>setField("is_active", e.target.value === "active")}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="sp-field actionsCol">
                  <label>&nbsp;</label>
                  <div className="sp-modalActions">
                    <button className="sp-btn" onClick={()=>{ setShowAdd(false); resetForm(); }}>Cancel</button>
                    <button className="sp-btn primary" onClick={handleCreate} disabled={createLoading}>
                      {createLoading ? "Saving..." : "Save Supplier"}
                    </button>
                  </div>
                </div>
              </div>

              {createErrors && typeof createErrors === "object" && !createErrors.name && (
                <div className="sp-error serverErr">Server error: {JSON.stringify(createErrors)}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {apiError && <div className="sp-apiError">API error (using mock data): {String(apiError.message || apiError)}</div>}
    </div>
  );
}