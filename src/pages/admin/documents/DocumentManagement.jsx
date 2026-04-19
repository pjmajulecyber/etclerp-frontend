

// pages/admin/documents/DocumentManagement.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import API from "../../../services/api";
import "./DocumentManagement.css";

function genCode() {
  const t = Date.now().toString();
  return `DOC-${t.slice(-6)}`;
}

function isExpired(expiryDate) {
  if (!expiryDate) return false;
  const today = new Date();
  const exp = new Date(expiryDate);
  exp.setHours(23, 59, 59, 999);
  return exp < today;
}

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.documents)) return data.documents;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
}

export default function DocumentManagement() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formCategoryCode, setFormCategoryCode] = useState("");
  const [formCategoryName, setFormCategoryName] = useState("");
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formValidDate, setFormValidDate] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formFile, setFormFile] = useState(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    await Promise.all([loadCategories(), loadDocuments()]);
  };

  const normalizeCategory = (item) => {
    return {
      id: item?.id ?? null,
      code: String(item?.code ?? item?.name ?? "").trim(),
      name: item?.name ?? item?.label ?? item?.title ?? String(item?.code ?? "").trim(),
    };
  };

  const loadCategories = async () => {
    try {
      const res = await API.get("settings/document-categories/");
      const list = unwrapList(res?.data).map(normalizeCategory).filter((x) => x.code);

      setCategoryOptions(list);

      if (!formCategoryCode && list.length > 0) {
        setFormCategoryCode(list[0].code);
        setFormCategoryName(list[0].name);
      }
    } catch (err) {
      console.error("Document categories API failed:", err);
      setCategoryOptions([]);
    }
  };

  const normalizeDoc = (d) => {
    return {
      id: d?.id ?? d?.pk ?? Date.now(),
      date: d?.date || d?.created_at?.slice?.(0, 10) || new Date().toISOString().slice(0, 10),
      code: d?.code || d?.document_code || `DOC-${String(d?.id ?? Date.now()).padStart(6, "0")}`,
      name: d?.name || d?.document_name || d?.title || "",
      categoryCode:
        d?.category_code ||
        d?.category?.code ||
        "",
      category:
        d?.category_name ||
        d?.category?.name ||
        d?.document_type ||
        "Other",
      validDate: d?.valid_date || "",
      expiryDate: d?.expiry_date || "",
      fileName: d?.file_name || d?.filename || d?.file?.split?.("/").pop?.() || null,
      fileObj: null,
      fileUrl: d?.file_url || d?.file || null,
      raw: d,
    };
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await API.get("documents/");
      const list = unwrapList(res?.data).map(normalizeDoc);
      setDocs(list);
    } catch (err) {
      console.error("Documents API failed:", err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();

    return docs.filter((d) => {
      if (filterCategory !== "all" && d.categoryCode !== filterCategory) return false;

      const expired = isExpired(d.expiryDate);
      if (filterStatus === "valid" && expired) return false;
      if (filterStatus === "expired" && !expired) return false;

      if (!q) return true;

      return (
        (d.name || "").toLowerCase().includes(q) ||
        (d.code || "").toLowerCase().includes(q) ||
        (d.category || "").toLowerCase().includes(q) ||
        (d.categoryCode || "").toLowerCase().includes(q)
      );
    });
  }, [docs, search, filterCategory, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visible = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const syncCategoryNameFromCode = (codeValue) => {
    const found = categoryOptions.find(
      (c) => String(c.code).toLowerCase() === String(codeValue || "").toLowerCase()
    );
    setFormCategoryName(found?.name || "");
  };

  const openUploadModal = () => {
    setEditingId(null);
    setFormCategoryCode(categoryOptions[0]?.code || "");
    setFormCategoryName(categoryOptions[0]?.name || "");
    setFormName("");
    setFormCode(genCode());
    setFormValidDate("");
    setFormExpiryDate("");
    setFormFile(null);
    setModalOpen(true);
  };

  const openEditModal = (doc) => {
    setEditingId(doc.id);
    setFormCategoryCode(doc.categoryCode || "");
    setFormCategoryName(doc.category || "");
    setFormName(doc.name || "");
    setFormCode(doc.code || genCode());
    setFormValidDate(doc.validDate || "");
    setFormExpiryDate(doc.expiryDate || "");
    setFormFile(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormFile(null);
  };

  const handleFileInput = (e) => {
    const f = e.target.files && e.target.files[0];
    setFormFile(f || null);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name", formName || "");
    fd.append("category_code", formCategoryCode || "");
    if (formValidDate) fd.append("valid_date", formValidDate);
    if (formExpiryDate) fd.append("expiry_date", formExpiryDate);
    if (formFile) fd.append("file", formFile);
    return fd;
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!formName) {
      alert("Please enter document name");
      return;
    }

    if (!formCategoryCode) {
      alert("Please enter category code");
      return;
    }

    try {
      const fd = buildFormData();

      if (editingId) {
        await API.patch(`documents/${editingId}/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.post("documents/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await loadDocuments();
      closeModal();
    } catch (err) {
      console.error("Document save failed:", err);
      alert(
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data) ||
        "Failed to save document"
      );
    }
  };

  const handleView = (doc) => {
    if (!doc.fileUrl) {
      alert("No file attached to view.");
      return;
    }
    window.open(doc.fileUrl, "_blank");
  };

  const handleDownload = (doc) => {
    if (!doc.fileUrl) {
      alert("No file to download.");
      return;
    }

    const a = document.createElement("a");
    a.href = doc.fileUrl;
    a.target = "_blank";
    a.download = doc.fileName || doc.name || "document";
    a.click();
  };

  const handleDelete = async (doc) => {
    if (!window.confirm("Delete document?")) return;

    try {
      await API.delete(`documents/${doc.id}/`);
      await loadDocuments();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data) ||
        "Failed to delete document"
      );
    }
  };

  const exportCSV = () => {
    const headers = ["Date", "Code", "Name", "Category Code", "Category", "Valid Date", "Expiry Date", "Status"];
    const rows = filtered.map((d) => [
      d.date || "",
      d.code || "",
      `"${(d.name || "").replace(/"/g, '""')}"`,
      d.categoryCode || "",
      d.category || "",
      d.validDate || "",
      d.expiryDate || "",
      isExpired(d.expiryDate) ? "Expired" : "Valid",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documents-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!formCategoryCode) {
      setFormCategoryName("");
      return;
    }
    syncCategoryNameFromCode(formCategoryCode);
  }, [formCategoryCode, categoryOptions]);

  return (
    <div className="doc-page">
      <div className="doc-header">
        <div className="doc-left">
          <h2 className="doc-title">Documents</h2>
          <div className="doc-sub">Upload and manage company documents</div>
        </div>

        <div className="doc-actions">
          <div className="doc-filter-row">
            <input
              className="doc-search"
              placeholder="Search name, code or category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <select
              className="doc-select"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>

            <select
              className="doc-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All status</option>
              <option value="valid">Valid</option>
              <option value="expired">Expired</option>
            </select>

            <button className="btn btn-ghost" onClick={exportCSV}>
              Export CSV
            </button>
          </div>

          <div className="doc-upload-btns">
            <button className="btn btn-primary" onClick={openUploadModal}>
              + Upload document
            </button>
          </div>
        </div>
      </div>

      <div className="doc-card">
        <div className="doc-card-head">
          <div className="doc-card-title">All Documents</div>
          <div className="doc-card-actions">
            <label className="rows-label">Rows</label>
            <select
              className="rows-select"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Code</th>
                <th>Doc Name</th>
                <th>Category Code</th>
                <th>Category</th>
                <th>Valid Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="empty">Loading documents...</td>
                </tr>
              )}

              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty">No documents found</td>
                </tr>
              )}

              {!loading &&
                visible.map((d) => {
                  const expired = isExpired(d.expiryDate);
                  return (
                    <tr key={d.id}>
                      <td>{d.date || "-"}</td>
                      <td className="mono">{d.code}</td>
                      <td>{d.name}</td>
                      <td className="mono">{d.categoryCode || "-"}</td>
                      <td>{d.category}</td>
                      <td>{d.validDate || "-"}</td>
                      <td>{d.expiryDate || "-"}</td>
                      <td>
                        <span className={`doc-badge ${expired ? "expired" : "valid"}`}>
                          {expired ? "Expired" : "Valid"}
                        </span>
                      </td>
                      <td>
                        <div className="doc-row-actions">
                          <button className="btn small" onClick={() => handleView(d)}>View</button>
                          <button className="btn small" onClick={() => handleDownload(d)}>Download</button>
                          <button className="btn small" onClick={() => openEditModal(d)}>Edit</button>
                          <button className="btn small ghost" onClick={() => handleDelete(d)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="doc-pagination">
          <div className="doc-page-info">
            Showing {filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}
            {" to "}
            {Math.min(page * rowsPerPage, filtered.length)}
            {" of "}
            {filtered.length}
          </div>

          <div className="doc-page-controls">
            <button
              className="btn ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button className="btn ghost active">{page}</button>
            <button
              className="btn ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Edit Document" : "Upload Document"}</h3>

            <form className="modal-form" onSubmit={handleUploadSubmit}>
              <label className="modal-label">
                Category Code
                <input
                  list="document-category-codes"
                  value={formCategoryCode}
                  onChange={(e) => setFormCategoryCode(e.target.value)}
                  placeholder="Enter category code"
                />
                <datalist id="document-category-codes">
                  {categoryOptions.map((c) => (
                    <option key={c.id || c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </datalist>
              </label>

              <label className="modal-label">
                Category Name
                <input value={formCategoryName} readOnly />
              </label>

              <label className="modal-label">
                Document Name
                <input value={formName} onChange={(e) => setFormName(e.target.value)} />
              </label>

              <label className="modal-label">
                Display Code
                <input value={formCode} onChange={(e) => setFormCode(e.target.value)} />
              </label>

              <label className="modal-label">
                Valid Date
                <input
                  type="date"
                  value={formValidDate}
                  onChange={(e) => setFormValidDate(e.target.value)}
                />
              </label>

              <label className="modal-label">
                Expiry Date
                <input
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                />
              </label>

              <label className="modal-label">
                Select File
                <input ref={fileInputRef} type="file" onChange={handleFileInput} />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  {editingId ? "Save Changes" : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}








