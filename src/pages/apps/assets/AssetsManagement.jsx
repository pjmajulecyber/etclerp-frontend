


import React, { useMemo, useState, useRef } from "react";
import "./AssetsManagement.css";

// =====================================================
// VEHICLE ASSET REGISTER
// =====================================================

const RAW_ASSETS = [
  { idNo: "T233ADH", purchasedAt: "2010-05-17", supplier: "", value: 70000000 },
  { idNo: "T235 BBT", purchasedAt: "2010-05-17", supplier: "", value: 130000000 },
  { idNo: "T862 AHQ", purchasedAt: "2010-05-17", supplier: "", value: 120000000 },
  { idNo: "T943 BBR", purchasedAt: "2010-05-17", supplier: "D.B Binadi", value: 60000000 },
  { idNo: "T530 BBP", purchasedAt: "2022-05-01", supplier: "D.B.Binadi", value: 40000000 },

  { idNo: "T390 EFB", purchasedAt: "2023-12-18", supplier: "SINO Tracks", value: 133120000 },
  { idNo: "T382 EFB", purchasedAt: "2023-12-18", supplier: "SINO Tracks", value: 133120000 },
  { idNo: "T212 BZD", purchasedAt: "2024-01-02", supplier: "", value: 60000000 },
  { idNo: "T392EFB", purchasedAt: "2023-12-18", supplier: "SINO Tracks", value: 133120000 },
  { idNo: "T294EFB", purchasedAt: "2023-12-18", supplier: "SINO Tracks", value: 133120000 },
  { idNo: "T405EFB", purchasedAt: "2023-12-18", supplier: "SINO Tracks", value: 133120000 },
  { idNo: "T395 EFB", purchasedAt: "2023-12-18", supplier: "SINO Tracks", value: 133120000 },
  { idNo: "", purchasedAt: "2023-12-18", supplier: "SINO Tracks", value: 133120000 },
  { idNo: "T386EFB", purchasedAt: "2023-12-18", supplier: "SINO Tracks", value: 133120000 },
  { idNo: "T393EFB", purchasedAt: "2023-12-18", supplier: "SINO Tracks", value: 133120000 },

  { idNo: "T422CQJ", purchasedAt: "2023-08-20", supplier: "OIL COM", value: 60000000 },
  { idNo: "T398 CFR", purchasedAt: "2023-12-22", supplier: "OIL COM", value: 60000000 },
  { idNo: "T383 CGC", purchasedAt: "2023-12-24", supplier: "OIL COM", value: 60000000 },
  { idNo: "T282 CGC", purchasedAt: "2023-08-22", supplier: "OIL COM", value: 80000000 },
  { idNo: "T360CGC", purchasedAt: "2023-08-22", supplier: "OIL COM", value: 80000000 },
  { idNo: "T422 CFR", purchasedAt: "2023-12-26", supplier: "OIL COM", value: 60000000 },

  { idNo: "T609 BYN", purchasedAt: "2023-12-28", supplier: "SINO Tracks", value: 60000000 },
  { idNo: "T396EFB", purchasedAt: "2023-12-30", supplier: "SINO Tracks", value: 60000000 },
  { idNo: "T292 EFB", purchasedAt: "2023-12-30", supplier: "SINO Tracks", value: 60000000 },

  { idNo: "T378 EFB", purchasedAt: "2024-07-15", supplier: "", value: 130000000 },
  { idNo: "T698 DBV", purchasedAt: "2024-08-30", supplier: "", value: 70000000 },
  { idNo: "T 660 CVK", purchasedAt: "2024-05-02", supplier: "", value: 60000000 },
  { idNo: "T585 EHY", purchasedAt: "2024-09-04", supplier: "SINO Tracks", value: 217068945 },
  { idNo: "T390 EHR", purchasedAt: "2024-09-04", supplier: "SINO Tracks", value: 197120000 },

  { idNo: "T487 ELD", purchasedAt: "2025-03-04", supplier: "SCANIA TANZANIA", value: 140400000 },
  { idNo: "T493 ELD", purchasedAt: "2025-03-04", supplier: "SCANIA TANZANIA", value: 140400000 },
  { idNo: "T478 ELD", purchasedAt: "2025-03-04", supplier: "SCANIA TANZANIA", value: 140400000 },
  { idNo: "T489 ELD", purchasedAt: "2025-03-04", supplier: "SCANIA TANZANIA", value: 140400000 },
  { idNo: "T486 ELD", purchasedAt: "2025-03-04", supplier: "SCANIA TANZANIA", value: 140400000 },

  { idNo: "T856 ELH", purchasedAt: "2025-03-20", supplier: "SUPERDOLL", value: 137700000 },
  { idNo: "T855 ELH", purchasedAt: "2025-03-20", supplier: "SUPERDOLL", value: 137700000 },
  { idNo: "T854 ELH", purchasedAt: "2025-03-20", supplier: "SUPERDOLL", value: 137700000 },
  { idNo: "T853 ELH", purchasedAt: "2025-03-20", supplier: "SUPERDOLL", value: 137700000 },
  { idNo: "T852 ELH", purchasedAt: "2025-03-20", supplier: "SUPERDOLL", value: 137700000 },
  { idNo: "T851 ELH", purchasedAt: "2025-03-20", supplier: "SUPERDOLL", value: 137700000 },
  { idNo: "T850 ELH", purchasedAt: "2025-03-20", supplier: "SUPERDOLL", value: 137700000 },
  { idNo: "T849 ELH", purchasedAt: "2025-03-20", supplier: "SUPERDOLL", value: 137700000 },
  { idNo: "T848 ELH", purchasedAt: "2025-03-20", supplier: "SUPERDOLL", value: 137700000 },
  { idNo: "T847 ELH", purchasedAt: "2025-03-20", supplier: "SUPERDOLL", value: 137700000 },

  { idNo: "T215 EPH", purchasedAt: "2025-11-17", supplier: "SUPERDOLL", value: 128000000 },
  { idNo: "T213 EPG", purchasedAt: "2025-11-17", supplier: "SUPERDOLL", value: 128000000 },
  { idNo: "T214 EPG", purchasedAt: "2025-11-17", supplier: "SUPERDOLL", value: 128000000 },

  { idNo: "T578 EGU", purchasedAt: "2025-09-18", supplier: "", value: 32000000 },
  { idNo: "T775 ECY", purchasedAt: "2025-09-18", supplier: "", value: 30000000 },
  { idNo: "T748 ENM", purchasedAt: "2025-09-18", supplier: "", value: 120000000 },
  { idNo: "T457 ENP", purchasedAt: "2025-09-22", supplier: "", value: 170000000 },
];

const MOCK_ASSETS = RAW_ASSETS.map((asset, index) => ({
  id: index + 1,
  code: "16040",
  name: "Motor Vehicle",
  ...asset,
  location: "Operations Dept",
  category: "movable",
  status: "In use",
  depreciationMethod: "Straight line",
  depreciationRate: 25,
}));

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (value) => {
  if (value == null || value === "") return "-";
  return Number(value).toLocaleString("en-US");
};

const calculateAnnualDepreciation = (asset) => {
  return (
    Number(asset.value || 0) *
    Number(asset.depreciationRate || 0) / 100
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

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

  // ===================================================
  // ASSET SUMMARY
  // ===================================================

  const totals = useMemo(() => {
    const totalCount = assets.length;

    const fixedCount = assets.filter(
      (a) => a.category === "fixed"
    ).length;

    const movableCount = assets.filter(
      (a) => a.category === "movable"
    ).length;

    const totalValue = assets.reduce(
      (sum, a) => sum + Number(a.value || 0),
      0
    );

    const depreciationTotal = assets.reduce(
      (sum, a) => sum + calculateAnnualDepreciation(a),
      0
    );

    return {
      totalCount,
      fixedCount,
      movableCount,
      totalValue,
      depreciationTotal,
    };
  }, [assets]);

  // ===================================================
  // SEARCH AND FILTER
  // ===================================================

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();

    return assets
      .filter((a) => {
        if (
          categoryFilter !== "all" &&
          a.category !== categoryFilter
        ) return false;

        if (
          statusFilter !== "all" &&
          a.status !== statusFilter
        ) return false;

        if (
          fromDate &&
          a.purchasedAt < fromDate
        ) return false;

        if (
          toDate &&
          a.purchasedAt > toDate
        ) return false;

        if (!q) return true;

        return (
          (a.code || "").toLowerCase().includes(q) ||
          (a.name || "").toLowerCase().includes(q) ||
          (a.idNo || "").toLowerCase().includes(q) ||
          (a.supplier || "").toLowerCase().includes(q) ||
          (a.location || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [
    assets,
    search,
    categoryFilter,
    statusFilter,
    fromDate,
    toDate,
  ]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssets.length / rowsPerPage)
  );

  const pageRows = filteredAssets.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // ===================================================
  // MODAL ACTIONS
  // ===================================================

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
      setAssets((prev) =>
        prev.map((item) =>
          item.id === editingAsset.id
            ? { ...item, ...asset }
            : item
        )
      );
    } else {
      const nextId =
        Math.max(0, ...assets.map((a) => a.id)) + 1;

      const newAsset = {
        ...asset,
        id: nextId,
        code: asset.code || `AS-${String(nextId).padStart(3, "0")}`,
        purchasedAt:
          asset.purchasedAt ||
          new Date().toISOString().slice(0, 10),
      };

      setAssets((prev) => [newAsset, ...prev]);
    }

    closeModal();
  };

  // ===================================================
  // CSV EXPORT
  // ===================================================

  const exportCSV = () => {
    const headers = [
      "Asset Code",
      "Asset Name",
      "Serial / Registration No",
      "Supplier",
      "Purchase Date",
      "Purchase Cost (TZS)",
      "Location",
      "Category",
      "Status",
      "Depreciation Method",
      "Depreciation Rate (%)",
      "Annual Depreciation (TZS)",
    ];

    const rows = filteredAssets.map((a) => [
      a.code,
      a.name,
      a.idNo,
      a.supplier,
      a.purchasedAt,
      a.value,
      a.location,
      a.category,
      a.status,
      a.depreciationMethod,
      a.depreciationRate,
      calculateAnnualDepreciation(a),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) =>
            `"${String(cell ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `vehicle-assets-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ===================================================
  // RESET FILTERS
  // ===================================================

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="assets-page">
      <div className="assets-container">

        {/* PAGE HEADER */}

        <div className="page-hero">
          <div className="hero-left">
            <div className="hero-greeting">
              Assets Management
            </div>

            <div className="hero-sub">
              Manage and monitor company vehicle assets.
            </div>
          </div>

          <div className="hero-actions">
            <button
              className="btn btn-green"
              onClick={exportCSV}
            >
              Export Data
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}

        <div className="assets-summary">

          <div className="card summary-card summary-card-1">
            <div className="summary-title">
              Total Assets
            </div>
            <div className="summary-value">
              {totals.totalCount}
            </div>
            <div className="summary-sub muted">
              Registered assets
            </div>
          </div>

          <div className="card summary-card summary-card-2">
            <div className="summary-title">
              Fixed Assets
            </div>
            <div className="summary-value">
              {totals.fixedCount}
            </div>
            <div className="summary-sub muted">
              Fixed asset items
            </div>
          </div>

          <div className="card summary-card summary-card-3">
            <div className="summary-title">
              Movable Assets
            </div>
            <div className="summary-value">
              {totals.movableCount}
            </div>
            <div className="summary-sub">
              Vehicle assets
            </div>
          </div>

          <div className="card summary-card summary-card-4">
            <div className="summary-title">
              Total Purchase Value
            </div>
            <div className="summary-value">
              Tsh {formatCurrency(totals.totalValue)}
            </div>
            <div className="summary-sub">
              Original acquisition cost
            </div>
          </div>

          <div className="card summary-card summary-card-5">
            <div className="summary-title">
              Annual Depreciation (25%)
            </div>
            <div className="summary-value">
              Tsh {formatCurrency(
                Math.round(totals.depreciationTotal)
              )}
            </div>
            <div className="summary-sub">
              Full-year depreciation
            </div>
          </div>

        </div>

        {/* FILTER CONTROLS */}

        <div className="assets-controls">

          <div className="controls-left">

            <input
              className="search"
              placeholder="Search code, registration or supplier..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All categories</option>
              <option value="fixed">Fixed</option>
              <option value="movable">Movable</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All status</option>
              <option value="In use">In use</option>
              <option value="Broken">Broken</option>
              <option value="Repairing">Repairing</option>
            </select>

            <label className="small-label">From</label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />

            <label className="small-label">To</label>

            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />

          </div>

          <div className="controls-right">

            <button
              className="btn btn-ghost"
              onClick={resetFilters}
            >
              Reset
            </button>

            <button
              className="btn btn-ghost"
              onClick={exportCSV}
            >
              Export CSV
            </button>

            <button
              className="btn btn-primary"
              onClick={openAddModal}
            >
              + Add Asset
            </button>

          </div>
        </div>

        {/* ASSET TABLE */}

        <div className="card table-card">

          <div className="table-head">
            <h3>Vehicle Asset Register</h3>

            <div className="table-head-actions">

              <div className="rows-control">
                <label>Show</label>

                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                >
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
                  <th>Code</th>
                  <th>Asset Name</th>
                  <th>Registration No.</th>
                  <th>Supplier</th>
                  <th>Purchase Date</th>
                  <th>Purchase Cost (TZS)</th>
                  <th>Location</th>
                  <th>Depreciation (25%)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="empty">
                      No assets found
                    </td>
                  </tr>
                )}

                {pageRows.map((asset) => {
                  const depreciation =
                    calculateAnnualDepreciation(asset);

                  return (
                    <tr key={asset.id}>

                      <td className="mono">
                        {asset.code}
                      </td>

                      <td>
                        {asset.name}
                      </td>

                      <td className="mono">
                        {asset.idNo || "-"}
                      </td>

                      <td>
                        {asset.supplier || "-"}
                      </td>

                      <td>
                        {asset.purchasedAt}
                      </td>

                      <td className="text-right">
                        Tsh {formatCurrency(asset.value)}
                      </td>

                      <td>
                        {asset.location}
                      </td>

                      <td className="text-right">
                        Tsh {formatCurrency(
                          Math.round(depreciation)
                        )}
                      </td>

                      <td>
                        <span
                          className={`badge status-${asset.status
                            .replace(/\s+/g, "-")
                            .toLowerCase()}`}
                        >
                          {asset.status}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            className="btn small"
                            onClick={() => openEditModal(asset)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

          {/* TABLE FOOTER */}

          <div className="table-footer">

            <div className="page-summary">
              Showing{" "}
              {filteredAssets.length === 0
                ? 0
                : (page - 1) * rowsPerPage + 1}
              {" "}to{" "}
              {Math.min(
                page * rowsPerPage,
                filteredAssets.length
              )}
              {" "}of {filteredAssets.length} assets
            </div>

            <div className="pagination-controls">

              <button
                className="btn ghost"
                disabled={page <= 1}
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
              >
                Prev
              </button>

              <span className="page-indicator">
                Page {page} / {totalPages}
              </span>

              <button
                className="btn ghost"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next
              </button>

            </div>

          </div>

        </div>

        {/* ADD / EDIT MODAL */}

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

// =====================================================
// ASSET MODAL
// =====================================================

function AssetModal({ asset, onClose, onSave }) {

  const editing = Boolean(asset);

  const [code, setCode] = useState(asset?.code || "");
  const [name, setName] = useState(
    asset?.name || "Motor Vehicle"
  );
  const [idNo, setIdNo] = useState(asset?.idNo || "");
  const [supplier, setSupplier] = useState(
    asset?.supplier || ""
  );

  const [value, setValue] = useState(
    asset?.value ?? ""
  );

  const [location, setLocation] = useState(
    asset?.location || "Operations Dept"
  );

  const [category, setCategory] = useState(
    asset?.category || "movable"
  );

  const [status, setStatus] = useState(
    asset?.status || "In use"
  );

  const [purchasedAt, setPurchasedAt] = useState(
    asset?.purchasedAt ||
    new Date().toISOString().slice(0, 10)
  );

  const [depreciationMethod, setDepreciationMethod] =
    useState(asset?.depreciationMethod || "Straight line");

  const [depreciationRate, setDepreciationRate] =
    useState(asset?.depreciationRate ?? 25);

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave({
      code,
      name,
      idNo,
      supplier,
      value: Number(value || 0),
      location,
      category,
      status,
      purchasedAt,
      depreciationMethod,
      depreciationRate: Number(depreciationRate || 0),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>

      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >

        <h3>
          {editing ? "Edit Asset" : "Add Asset"}
        </h3>

        <form
          className="modal-form"
          onSubmit={handleSubmit}
        >

          <label>
            Asset Code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>

          <label>
            Asset Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label>
            Serial / Registration Number
            <input
              value={idNo}
              onChange={(e) => setIdNo(e.target.value)}
            />
          </label>

          <label>
            Supplier
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Enter supplier name"
            />
          </label>

          <label>
            Purchase Cost (TZS)
            <input
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </label>

          <label>
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </label>

          <label>
            Purchase Date
            <input
              type="date"
              value={purchasedAt}
              onChange={(e) => setPurchasedAt(e.target.value)}
              required
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="fixed">Fixed</option>
              <option value="movable">Movable</option>
            </select>
          </label>

          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>In use</option>
              <option>Broken</option>
              <option>Repairing</option>
            </select>
          </label>

          <label>
            Depreciation Method
            <select
              value={depreciationMethod}
              onChange={(e) =>
                setDepreciationMethod(e.target.value)
              }
            >
              <option value="Straight line">
                Straight line
              </option>
            </select>
          </label>

          <label>
            Annual Depreciation Rate (%)
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={depreciationRate}
              onChange={(e) =>
                setDepreciationRate(e.target.value)
              }
              required
            />
          </label>

          <div className="modal-actions">

            <button
              type="button"
              className="btn ghost"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn primary"
            >
              {editing ? "Update Asset" : "Add Asset"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}
