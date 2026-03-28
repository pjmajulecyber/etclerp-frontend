

// pages/admin/documents/DocumentManagement.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./DocumentManagement.css";

/**
 * Document Management System
 * - Upload documents with metadata (category, name, code, valid/expiry dates)
 * - Preview (view), Download, Edit
 * - Table with Date, Code, Doc Name, Type, Status (Valid / Expired)
 * - Filters, search, pagination, CSV export
 *
 * NOTE: files are kept in memory (File objects). In production persist to server.
 */

const DEFAULT_CATEGORIES = [
  "Invoice",
  "TRA",
  "TPA",
  "License",
  "Corporate Certificate",
  "Car Registration",
  "Title Deed",
  "Other",
];

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

export default function DocumentManagement() {
  const [docs, setDocs] = useState(() => {
    // sample seed
    const sample = [
      {
        id: 1,
        date: new Date().toISOString().slice(0, 10),
        code: genCode(),
        name: "Sample Invoice #1001",
        category: "Invoice",
        validDate: "",
        expiryDate: "",
        fileName: null,
        fileObj: null,
        fileUrl: null,
      },
    ];
    return sample;
  });

  // upload / edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formCategory, setFormCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formValidDate, setFormValidDate] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formFile, setFormFile] = useState(null);

  // filters / search / pagination
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // all, valid, expired
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const fileInputRef = useRef(null);

  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      docs.forEach((d) => {
        if (d.fileUrl) URL.revokeObjectURL(d.fileUrl);
      });
    };
  }, [docs]);

  // Derived: filtered docs
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return docs.filter((d) => {
      if (filterCategory !== "all" && d.category !== filterCategory) return false;
      const expired = isExpired(d.expiryDate);
      if (filterStatus === "valid" && expired) return false;
      if (filterStatus === "expired" && !expired) return false;
      if (!q) return true;
      return (
        (d.name || "").toLowerCase().includes(q) ||
        (d.code || "").toLowerCase().includes(q) ||
        (d.category || "").toLowerCase().includes(q)
      );
    });
  }, [docs, search, filterCategory, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]); // eslint-disable-line

  const visible = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  /* ----------------- Upload / Edit handlers ----------------- */

  const openUploadModal = () => {
    setEditingId(null);
    setFormCategory(DEFAULT_CATEGORIES[0]);
    setFormName("");
    setFormCode(genCode());
    setFormValidDate("");
    setFormExpiryDate("");
    setFormFile(null);
    setModalOpen(true);
  };

  const openEditModal = (doc) => {
    setEditingId(doc.id);
    setFormCategory(doc.category || DEFAULT_CATEGORIES[0]);
    setFormName(doc.name || "");
    setFormCode(doc.code || genCode());
    setFormValidDate(doc.validDate || "");
    setFormExpiryDate(doc.expiryDate || "");
    setFormFile(null); // user may choose to replace
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

  const handleUploadSubmit = (e) => {
    e.preventDefault();

    // validations
    if (!formName) {
      alert("Please enter document name");
      return;
    }
    if (!formCode) {
      alert("Please provide a code");
      return;
    }

    // if editing, update metadata (and file if new)
    if (editingId) {
      setDocs((prev) =>
        prev.map((d) => {
          if (d.id !== editingId) return d;
          // revoke old URL if replacing file
          if (formFile && d.fileUrl) {
            URL.revokeObjectURL(d.fileUrl);
          }
          const fileUrl = formFile ? URL.createObjectURL(formFile) : d.fileUrl || null;
          return {
            ...d,
            name: formName,
            code: formCode,
            category: formCategory,
            validDate: formValidDate,
            expiryDate: formExpiryDate,
            fileObj: formFile || d.fileObj,
            fileName: formFile ? formFile.name : d.fileName,
            fileUrl,
            date: d.date || new Date().toISOString().slice(0, 10),
          };
        })
      );
      closeModal();
      return;
    }

    // new doc
    const id = Date.now();
    const fileUrl = formFile ? URL.createObjectURL(formFile) : null;
    const newDoc = {
      id,
      date: new Date().toISOString().slice(0, 10),
      code: formCode || genCode(),
      name: formName,
      category: formCategory,
      validDate: formValidDate,
      expiryDate: formExpiryDate,
      fileObj: formFile || null,
      fileName: formFile ? formFile.name : null,
      fileUrl,
    };
    setDocs((prev) => [newDoc, ...prev]);
    closeModal();
  };

  /* ----------------- View / Download ----------------- */

  const handleView = (doc) => {
    if (!doc.fileUrl) {
      alert("No file attached to view.");
      return;
    }
    window.open(doc.fileUrl, "_blank");
  };

  const handleDownload = (doc) => {
    if (!doc.fileObj && !doc.fileUrl) {
      alert("No file to download.");
      return;
    }
    // prefer fileObj to preserve name
    if (doc.fileObj) {
      const url = URL.createObjectURL(doc.fileObj);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName || doc.name || "document";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (doc.fileUrl) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.fileName || doc.name || "document";
      a.click();
    }
  };

  /* ----------------- Delete (optional) ----------------- */
  const handleDelete = (doc) => {
    if (!window.confirm("Delete document?")) return;
    setDocs((prev) => {
      prev.forEach((d) => {
        if (d.id === doc.id && d.fileUrl) URL.revokeObjectURL(d.fileUrl);
      });
      return prev.filter((d) => d.id !== doc.id);
    });
  };

  /* ----------------- Export CSV of visible filtered set ----------------- */
  const exportCSV = () => {
    const headers = ["Date", "Code", "Name", "Category", "Valid Date", "Expiry Date", "Status"];
    const rows = filtered.map((d) => [
      d.date || "",
      d.code || "",
      `"${(d.name || "").replace(/"/g, '""')}"`,
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

  /* ----------------- Utility: quick prefill by code (auto-fill product) -----------------
     The user wanted: "when I input the code ex 23000 the product appears automatically"
     We'll implement a tiny lookup: if code matches existing doc's code, prefill name & category.
  ------------------------------------------------------------------------------- */
  useEffect(() => {
    if (!formCode) return;
    const match = docs.find((d) => d.code === formCode);
    if (match && !editingId) {
      setFormName((prev) => (prev ? prev : match.name || ""));
      setFormCategory((prev) => (prev ? prev : match.category || DEFAULT_CATEGORIES[0]));
    }
    // eslint-disable-next-line
  }, [formCode]);

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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />

            <select
              className="doc-select"
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            >
              <option value="all">All categories</option>
              {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              className="doc-select"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="all">All status</option>
              <option value="valid">Valid</option>
              <option value="expired">Expired</option>
            </select>

            <button className="btn btn-ghost" onClick={exportCSV}>Export CSV</button>
          </div>

          <div className="doc-upload-btns">
            <button className="btn btn-primary" onClick={openUploadModal}>+ Upload document</button>
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
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
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
                <th>Type</th>
                <th>Valid Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty">No documents found</td>
                </tr>
              )}

              {visible.map((d) => {
                const expired = isExpired(d.expiryDate);
                return (
                  <tr key={d.id}>
                    <td>{d.date || "-"}</td>
                    <td className="mono">{d.code}</td>
                    <td>{d.name}</td>
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

        {/* pagination */}
        <div className="doc-pagination">
          <div className="doc-page-info">
            Showing {(filtered.length === 0) ? 0 : (page - 1) * rowsPerPage + 1}
            {" to "}
            {Math.min(page * rowsPerPage, filtered.length)}
            {" of "}
            {filtered.length}
          </div>

          <div className="doc-page-controls">
            <button className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <button className="btn ghost active">{page}</button>
            <button className="btn ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </div>
      </div>

      {/* Upload / Edit Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Edit Document" : "Upload Document"}</h3>

            <form className="modal-form" onSubmit={handleUploadSubmit}>
              <label className="modal-label">Category
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                  {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="modal-label">Document Name
                <input value={formName} onChange={(e) => setFormName(e.target.value)} />
              </label>

              <label className="modal-label">Code
                <input value={formCode} onChange={(e) => setFormCode(e.target.value)} />
              </label>

              <label className="modal-label">Valid Date
                <input type="date" value={formValidDate} onChange={(e) => setFormValidDate(e.target.value)} />
              </label>

              <label className="modal-label">Expiry Date
                <input type="date" value={formExpiryDate} onChange={(e) => setFormExpiryDate(e.target.value)} />
              </label>

              <label className="modal-label">Select File
                <input ref={fileInputRef} type="file" onChange={handleFileInput} />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn primary">{editingId ? "Save Changes" : "Upload Document"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



