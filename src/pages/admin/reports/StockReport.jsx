// src/pages/admin/inventory/StockReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./StockReport.css";
import { FiDownload, FiEye } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

/*
  Stock / Product Report - unique class prefix: stkrep-
  - mock data included
  - filters: search, depot, low-stock toggle
  - export CSV, pagination, totals
*/

const mockDepots = [
  { id: "DPT-01", name: "Camel Depot" },
  { id: "DPT-02", name: "Puma Depot" },
  { id: "DPT-03", name: "SuperStar Depot" }
];

const mockProducts = [
  { id: 1, productCode: "14000", name: "Diesel (HFO)", depot: "DPT-01", qty: 1200, unitCost: 3000, reorderLevel: 500 },
  { id: 2, productCode: "14001", name: "Petrol (RON95)", depot: "DPT-02", qty: 320, unitCost: 3200, reorderLevel: 400 },
  { id: 3, productCode: "14002", name: "Lubricant 20L", depot: "DPT-03", qty: 80, unitCost: 2800, reorderLevel: 120 },
  { id: 4, productCode: "14003", name: "Kerosene", depot: "DPT-01", qty: 520, unitCost: 2500, reorderLevel: 200 },
  { id: 5, productCode: "14004", name: "Fuel Oil Additive", depot: "DPT-02", qty: 40, unitCost: 10000, reorderLevel: 50 },
  { id: 6, productCode: "14005", name: "Marine Diesel", depot: "DPT-03", qty: 900, unitCost: 2900, reorderLevel: 600 }
];

// small util
const formatTZ = (n) => Number(n || 0).toLocaleString();

export default function StockReport() {
  const navigate = useNavigate();

  // data state
  const [products, setProducts] = useState(() => {
    // read from sessionStorage if present; else seed with mockProducts
    try {
      const raw = sessionStorage.getItem("stkrep_products");
      if (raw) return JSON.parse(raw);
    } catch {}
    return mockProducts;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("stkrep_products", JSON.stringify(products));
    } catch {}
  }, [products]);

  // filters
  const [q, setQ] = useState("");
  const [depot, setDepot] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [minQty, setMinQty] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // derived filtered list
  const filtered = useMemo(() => {
    const qStr = (q || "").trim().toLowerCase();
    return products.filter(p => {
      if (depot && p.depot !== depot) return false;
      if (onlyLowStock && Number(p.qty || 0) > Number(p.reorderLevel || 0)) return false;
      if (minQty !== "" && Number(p.qty || 0) < Number(minQty)) return false;

      if (!qStr) return true;
      // search tokens split (productCode or words in name)
      const tokens = qStr.split(/\s+/).filter(Boolean);
      const hay = `${p.productCode} ${p.name}`.toLowerCase();
      return tokens.every(t => hay.includes(t));
    });
  }, [products, q, depot, onlyLowStock, minQty]);

  // page calculations
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // summary totals
  const summary = useMemo(() => {
    const totalStockQty = filtered.reduce((s, p) => s + Number(p.qty || 0), 0);
    const totalStockValue = filtered.reduce((s, p) => s + (Number(p.qty || 0) * Number(p.unitCost || 0)), 0);
    const lowStockCount = filtered.filter(p => Number(p.qty || 0) <= Number(p.reorderLevel || 0)).length;
    const depotsCount = Array.from(new Set(filtered.map(p => p.depot))).length;
    return { totalStockQty, totalStockValue, lowStockCount, depotsCount, rows: filtered.length };
  }, [filtered]);

  // Export CSV
  const exportCSV = () => {
    const header = ["SN","Product Code","Product Name","Depot","Qty","Unit Cost","Total Value","Reorder Level"];
    const rows = filtered.map((p, idx) => [
      idx + 1,
      p.productCode,
      p.name,
      mockDepots.find(d => d.id === p.depot)?.name || p.depot,
      p.qty,
      p.unitCost,
      (Number(p.qty || 0) * Number(p.unitCost || 0)),
      p.reorderLevel
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c || "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // action: view product (navigate to product page if exists)
  const handleView = (prod) => {
    // Example: navigate to a product detail route if you have one
    // navigate(`/admin/inventory/product/${prod.productCode}`);
    // For now show a quick alert (can be replaced)
    alert(`View product: ${prod.productCode} — ${prod.name}`);
  };

  // UI
  return (
    <div className="stkrep-page">
      <div className="stkrep-header">
        <div>
          <h2 className="stkrep-title">Stock / Product Report</h2>
          <p className="stkrep-sub">Overview of inventory by depot, stock levels and values</p>
        </div>

        <div className="stkrep-actions">
          <button className="stkrep-btn stkrep-btn-export" onClick={exportCSV}>
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      <div className="stkrep-filters">
        <input
          className="stkrep-input"
          placeholder="Search product code or name (eg. 14000 diesel)"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />

        <select className="stkrep-select" value={depot} onChange={e => { setDepot(e.target.value); setPage(1); }}>
          <option value="">All Depots</option>
          {mockDepots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <input
          className="stkrep-input-mini"
          placeholder="Min Qty"
          type="number"
          value={minQty}
          onChange={e => { setMinQty(e.target.value); setPage(1); }}
        />

        <label className="stkrep-switch">
          <input type="checkbox" checked={onlyLowStock} onChange={e => { setOnlyLowStock(e.target.checked); setPage(1); }} />
          <span>Only Low Stock</span>
        </label>

        <div className="stkrep-rightFilters">
          <label>Rows</label>
          <select className="stkrep-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="stkrep-summaryGrid">
        <div className="stkrep-card">
          <div className="stkrep-card-title">Total Quantity</div>
          <div className="stkrep-card-value">{formatTZ(summary.totalStockQty)}</div>
        </div>

        <div className="stkrep-card">
          <div className="stkrep-card-title">Total Stock Value (TZS)</div>
          <div className="stkrep-card-value">{formatTZ(summary.totalStockValue)}</div>
        </div>

        <div className="stkrep-card">
          <div className="stkrep-card-title">Low Stock Items</div>
          <div className="stkrep-card-value">{summary.lowStockCount}</div>
        </div>

        <div className="stkrep-card">
          <div className="stkrep-card-title">Depots</div>
          <div className="stkrep-card-value">{summary.depotsCount}</div>
        </div>
      </div>

      <div className="stkrep-tableWrap">
        <table className="stkrep-table">
          <thead>
            <tr>
              <th>SN</th>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Depot</th>
              <th>Qty</th>
              <th>Unit Cost</th>
              <th>Total Value</th>
              <th>Reorder</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={9} className="stkrep-empty">No products match the filter</td>
              </tr>
            )}

            {pageItems.map((p, idx) => {
              const total = Number(p.qty || 0) * Number(p.unitCost || 0);
              const isLow = Number(p.qty || 0) <= Number(p.reorderLevel || 0);
              return (
                <tr key={p.id} className={isLow ? "stkrep-row-low" : ""}>
                  <td>{(page - 1) * pageSize + idx + 1}</td>
                  <td>{p.productCode}</td>
                  <td className="stkrep-productName">{p.name}</td>
                  <td>{mockDepots.find(d => d.id === p.depot)?.name || p.depot}</td>
                  <td className="stkrep-num">{formatTZ(p.qty)}</td>
                  <td className="stkrep-num">{formatTZ(p.unitCost)}</td>
                  <td className="stkrep-num">{formatTZ(total)}</td>
                  <td className="stkrep-num">{formatTZ(p.reorderLevel)}</td>
                  <td>
                    <button className="stkrep-btn stkrep-btn-view" onClick={() => handleView(p)} title="View">
                      <FiEye />
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* page totals row */}
            {pageItems.length > 0 && (
              <tr className="stkrep-totalRow">
                <td colSpan={4}><strong>Page Totals</strong></td>
                <td className="stkrep-num">
                  <strong>{formatTZ(pageItems.reduce((s, r) => s + Number(r.qty || 0), 0))}</strong>
                </td>
                <td></td>
                <td className="stkrep-num">
                  <strong>{formatTZ(pageItems.reduce((s, r) => s + (Number(r.qty||0) * Number(r.unitCost||0)), 0))}</strong>
                </td>
                <td colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="stkrep-footer">
        <div className="stkrep-pager">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>

        <div className="stkrep-meta">
          <div>Showing <strong>{pageItems.length}</strong> of <strong>{summary.rows}</strong> items</div>
        </div>
      </div>
    </div>
  );
}

