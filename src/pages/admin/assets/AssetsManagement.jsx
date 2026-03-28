import React, { useMemo, useState, useRef } from "react";
import "./AssetsManagement.css";

const MOCK_ASSETS = [
  { id: 1, code: "AS-001", name: "Office Building", idNo: "F-1001", value: 25000000, category: "fixed", location: "Dar es Salaam HQ", status: "In use", purchasedAt: "2019-05-12" },
  { id: 2, code: "AS-002", name: "Delivery Van - Toyota", idNo: "M-2001", value: 1200000, category: "movable", location: "Depot A", status: "In use", purchasedAt: "2021-02-10" },
  { id: 3, code: "AS-003", name: "Forklift", idNo: "M-2002", value: 450000, category: "movable", location: "Warehouse", status: "Repairing", purchasedAt: "2020-11-07" },
  { id: 4, code: "AS-004", name: "Office Desks (set of 10)", idNo: "F-1002", value: 800000, category: "fixed", location: "Dar es Salaam HQ", status: "In use", purchasedAt: "2018-07-01" },
  { id: 5, code: "AS-005", name: "Desktop Computer (i7)", idNo: "M-2003", value: 250000, category: "movable", location: "IT Room", status: "Broken", purchasedAt: "2022-09-15" },
];

const formatCurrency = (n) => {
  if (n == null) return "-";
  return Number(n).toLocaleString();
};

export default function AssetsManagement() {
  const [assets, setAssets] = useState(MOCK_ASSETS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const tableRef = useRef(null);

  const totals = useMemo(() => {
    const totalCount = assets.length;
    const fixedCount = assets.filter(a => a.category === "fixed").length;
    const movableCount = assets.filter(a => a.category === "movable").length;
    const totalValue = assets.reduce((s, a) => s + Number(a.value || 0), 0);
    const depreciationTotal = assets.reduce((s, a) => s + (Number(a.value || 0) * 0.2), 0);
    return {
      totalCount, fixedCount, movableCount, totalValue, depreciationTotal
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return assets.filter(a => {
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (fromDate && new Date(a.purchasedAt) < new Date(fromDate)) return false;
      if (toDate && new Date(a.purchasedAt) > new Date(toDate)) return false;
      if (!q) return true;
      return (
        (a.code || "").toLowerCase().includes(q) ||
        (a.name || "").toLowerCase().includes(q) ||
        (a.idNo || "").toLowerCase().includes(q)
      );
    }).sort((x,y) => x.code.localeCompare(y.code));
  }, [assets, search, categoryFilter, statusFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / rowsPerPage));
  const pageRows = filteredAssets.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const openAddModal = () => {
    setEditingAsset(null);
    setModalOpen(true);
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingAsset(null);
    setModalOpen(false);
  };

  const handleSaveAsset = (asset) => {
    if (!asset.code || !asset.name) {
      alert("Code and Name are required");
      return;
    }
    if (editingAsset) {
      setAssets(prev => prev.map(p => p.id === editingAsset.id ? { ...p, ...asset } : p));
    } else {
      const newAsset = { ...asset, id: Date.now(), purchasedAt: asset.purchasedAt || new Date().toISOString().slice(0,10) };
      setAssets(prev => [newAsset, ...prev]);
    }
    closeModal();
  };

  const exportCSV = () => {
    const headers = ["Code","Name","ID No","Value","Location","Depreciation (20%)","Category","Status","PurchasedAt"];
    const rows = filteredAssets.map(a => {
      const dep = (Number(a.value || 0) * 0.2).toFixed(2);
      return [a.code, a.name, a.idNo, Number(a.value||0).toFixed(2), a.location, dep, a.category, a.status, a.purchasedAt];
    });
    const csv = [headers, ...rows].map(r => r.map(cell => `"${(cell||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assets-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="assets-page">
      <div className="assets-container">

        <div className="page-hero">
          <div className="hero-left">
            <div className="hero-greeting">Assets Management</div>
            <div className="hero-sub">Here's what's happening with your assets.</div>
          </div>
          <div className="hero-actions">
            <select className="year-select" defaultValue={new Date().getFullYear()}>
              <option>{new Date().getFullYear()}</option>
            </select>
            <button className="btn btn-green">Export Data</button>
          </div>
        </div>

        <div className="assets-summary">
          <div className="card summary-card summary-card-1">
            <div className="summary-title">Total Assets</div>
            <div className="summary-value">{totals.totalCount}</div>
            <div className="summary-sub muted"></div>
          </div>

          <div className="card summary-card summary-card-2">
            <div className="summary-title">Fixed Assets</div>
            <div className="summary-value">{totals.fixedCount}</div>
            <div className="summary-sub muted"></div>
          </div>

          <div className="card summary-card summary-card-3">
            <div className="summary-title"> Movable Assets</div>
            <div className="summary-value">{totals.movableCount}</div>
            <div className="summary-sub"></div>
          </div>

          <div className="card summary-card summary-card-4">
            <div className="summary-title">Assets Value</div>
            <div className="summary-value">Tsh {formatCurrency(totals.totalValue)}</div>
            <div className="summary-sub"></div>
          </div>

          <div className="card summary-card summary-card-5">
            <div className="summary-title">Depreciation (20%)</div>
            <div className="summary-value">Tsh {formatCurrency(Math.round(totals.depreciationTotal))}</div>
            <div className="summary-sub "></div>
          </div>
        </div>

        <div className="assets-controls">
          <div className="controls-left">
            <input className="search" placeholder="Search code, name or ID..." value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1); }} />
            <select value={categoryFilter} onChange={(e)=>{ setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="all">All categories</option>
              <option value="fixed">Fixed</option>
              <option value="movable">Movable</option>
            </select>

            <select value={statusFilter} onChange={(e)=>{ setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">All status</option>
              <option value="In use">In use</option>
              <option value="Broken">Broken</option>
              <option value="Repairing">Repairing</option>
            </select>

            <label className="small-label">From</label>
            <input type="date" value={fromDate} onChange={(e)=>{ setFromDate(e.target.value); setPage(1); }} />
            <label className="small-label">To</label>
            <input type="date" value={toDate} onChange={(e)=>{ setToDate(e.target.value); setPage(1); }} />
          </div>

          <div className="controls-right">
            <button className="btn btn-ghost" onClick={()=>{ setSearch(""); setCategoryFilter("all"); setStatusFilter("all"); setFromDate(""); setToDate(""); setPage(1); }}>Reset</button>
            <button className="btn btn-ghost" onClick={exportCSV}>Export CSV</button>
            <button className="btn btn-primary" onClick={openAddModal}>+ Add Asset</button>
          </div>
        </div>

        <div className="card table-card">
          <div className="table-head">
            <h3>Assets</h3>
            <div className="table-head-actions">
              <div className="rows-control">
                <label>Show</label>
                <select value={rowsPerPage} onChange={(e)=>{ setRowsPerPage(Number(e.target.value)); setPage(1); }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-scroll" ref={tableRef}>
            <table className="assets-table">
              <thead>
                <tr>
                  <th style={{ width: "6%" }}>Code</th>
                  <th style={{ width: "12%" }}>Name</th>
                  <th style={{ width: "6%" }}>ID No</th>
                  <th style={{ width: "17%" }}>Value</th>
                  <th style={{ width: "14%" }}>Location</th>
                  <th style={{ width: "12%" }}>Depreciation (20%)</th>
                  <th style={{ width: "8%" }}>Status</th>
                  <th style={{ width: "8%" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {pageRows.length === 0 && (
                  <tr><td colSpan={8} className="empty">No assets found</td></tr>
                )}

                {pageRows.map(asset => {
                  const dep = Number(asset.value || 0) * 0.2;
                  return (
                    <tr key={asset.id}>
                      <td className="mono">{asset.code}</td>
                      <td>{asset.name}</td>
                      <td>{asset.idNo}</td>
                      <td className="text-right">Tsh {formatCurrency(asset.value)}</td>
                      <td>{asset.location}</td>
                      <td className="text-right">Tsh {formatCurrency(Math.round(dep))}</td>
                      <td>
                        <span className={`badge status-${asset.status.replace(/\s+/g,"-").toLowerCase()}`}>{asset.status}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn small" onClick={() => openEditModal(asset)}>Edit</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="page-summary">Showing {(filteredAssets.length===0)?0:(page-1)*rowsPerPage+1} to {Math.min(page*rowsPerPage, filteredAssets.length)} of {filteredAssets.length} assets</div>
            <div className="pagination-controls">
              <button className="btn ghost" disabled={page<=1} onClick={()=>setPage(p => Math.max(1, p-1))}>Prev</button>
              <span className="page-indicator">Page {page} / {totalPages}</span>
              <button className="btn ghost" disabled={page>=totalPages} onClick={()=>setPage(p => Math.min(totalPages, p+1))}>Next</button>
            </div>
          </div>
        </div>

        {modalOpen && (
          <AssetModal
            asset={editingAsset}
            onClose={closeModal}
            onSave={handleSaveAsset}
          />
        )}

      </div>
    </div>
  );
}

function AssetModal({ asset, onClose, onSave }) {
  const editing = Boolean(asset);
  const [code, setCode] = useState(asset?.code || "");
  const [name, setName] = useState(asset?.name || "");
  const [idNo, setIdNo] = useState(asset?.idNo || "");
  const [value, setValue] = useState(asset?.value || "");
  const [location, setLocation] = useState(asset?.location || "");
  const [category, setCategory] = useState(asset?.category || "fixed");
  const [status, setStatus] = useState(asset?.status || "In use");
  const [purchasedAt, setPurchasedAt] = useState(asset?.purchasedAt || new Date().toISOString().slice(0,10));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      code, name, idNo, value: Number(value || 0), location, category, status, purchasedAt
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <h3>{editing ? "Edit Asset" : "Add Asset"}</h3>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>Code
            <input value={code} onChange={(e)=>setCode(e.target.value)} required />
          </label>

          <label>Name
            <input value={name} onChange={(e)=>setName(e.target.value)} required />
          </label>

          <label>ID No
            <input value={idNo} onChange={(e)=>setIdNo(e.target.value)} />
          </label>

          <label>Value (Tsh)
            <input type="number" value={value} onChange={(e)=>setValue(e.target.value)} required />
          </label>

          <label>Location
            <input value={location} onChange={(e)=>setLocation(e.target.value)} />
          </label>

          <label>Category
            <select value={category} onChange={(e)=>setCategory(e.target.value)}>
              <option value="fixed">Fixed</option>
              <option value="movable">Movable</option>
            </select>
          </label>

          <label>Status
            <select value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option>In use</option>
              <option>Broken</option>
              <option>Repairing</option>
            </select>
          </label>

          <label>Purchased Date
            <input type="date" value={purchasedAt} onChange={(e)=>setPurchasedAt(e.target.value)} />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary">{editing ? "Update" : "Add Asset"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
