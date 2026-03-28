

import React, { useEffect, useMemo, useState } from "react";
import "./AssetsReport.css";
import { FiEye, FiAlertTriangle, FiRepeat, FiMapPin, FiDownload } from "react-icons/fi";

/**
 * Assets Report (namespaced classes: astrep-)
 *
 * Drop into: src/pages/admin/reports/AssetsReport.jsx
 */

const mockAssetsSeed = [
  {
    id: "A-1001",
    tag: "A-1001",
    name: "Let L-410 Engine #1",
    category: "OFFICE TABLES",
    location: "Dar es Salaam Depot",
    purchaseDate: "2022-03-15",
    purchaseCost: 1200000,
    currentValue: 800000,
    depreciationRate: 0.12, // annual
    status: "active", // active | broken | maintenance | retired
    assignedTo: "Ops",
    notes: ""
  },
  {
    id: "A-1002",
    tag: "A-1002",
    name: "Fuel Pump #7",
    category: "Pump",
    location: "Puma Depot",
    purchaseDate: "2023-01-10",
    purchaseCost: 450000,
    currentValue: 350000,
    depreciationRate: 0.10,
    status: "maintenance",
    assignedTo: "Maintenance",
    notes: "Scheduled service"
  },
  {
    id: "A-1003",
    tag: "A-1003",
    name: "Delivery Truck T390 EFB",
    category: "Vehicle",
    location: "Dar es Salaam Depot",
    purchaseDate: "2021-07-22",
    purchaseCost: 900000,
    currentValue: 420000,
    depreciationRate: 0.15,
    status: "broken",
    assignedTo: "Logistics",
    notes: "Engine fault"
  },
  {
    id: "A-1004",
    tag: "A-1004",
    name: "Handheld Scanner",
    category: "Tool",
    location: "SuperStar Depot",
    purchaseDate: "2024-02-02",
    purchaseCost: 120000,
    currentValue: 110000,
    depreciationRate: 0.2,
    status: "active",
    assignedTo: "Warehouse",
    notes: ""
  },
  {
    id: "A-1005",
    tag: "A-1005",
    name: "Generator G-12",
    category: "Generator",
    location: "Dar es Salaam Depot",
    purchaseDate: "2020-09-30",
    purchaseCost: 600000,
    currentValue: 180000,
    depreciationRate: 0.18,
    status: "active",
    assignedTo: "Facilities",
    notes: ""
  }
];

const formatTZ = (n) => Number(n || 0).toLocaleString();

export default function AssetsReport() {
  // load from sessionStorage if present
  const [assets, setAssets] = useState(() => {
    try {
      const raw = sessionStorage.getItem("astrep_assets");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return mockAssetsSeed;
  });

  // Persist
  useEffect(() => {
    try { sessionStorage.setItem("astrep_assets", JSON.stringify(assets)); } catch (e) {}
  }, [assets]);

  // Filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // realtime demo timestamp & toggling statuses (simulates "real-time")
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString());
    // simulation: every 18s randomly mark one active -> maintenance/broken for demo
    const t = setInterval(() => {
      setAssets(prev => {
        const activeIndices = prev.map((a,i)=>a.status === "active" ? i : -1).filter(i=>i>=0);
        if (activeIndices.length === 0) return prev;
        const pickIdx = activeIndices[Math.floor(Math.random() * activeIndices.length)];
        const pick = prev[pickIdx];
        const newStatus = Math.random() < 0.5 ? "maintenance" : "broken";
        const copy = [...prev];
        copy[pickIdx] = { ...pick, status: newStatus, notes: `${newStatus} (auto-demo)` };
        return copy;
      });
      setLastUpdate(new Date().toLocaleTimeString());
    }, 18000);
    return () => clearInterval(t);
  }, []);

  // dynamic lists for filters
  const categories = useMemo(() => Array.from(new Set(assets.map(a => a.category))), [assets]);
  const locations = useMemo(() => Array.from(new Set(assets.map(a => a.location))), [assets]);

  // filtered list
  const filtered = useMemo(() => {
    const qStr = (q || "").trim().toLowerCase();
    return assets.filter(a => {
      if (category && a.category !== category) return false;
      if (status && a.status !== status) return false;
      if (location && a.location !== location) return false;
      if (minValue !== "" && Number(a.currentValue || 0) < Number(minValue)) return false;
      if (maxValue !== "" && Number(a.currentValue || 0) > Number(maxValue)) return false;
      if (fromDate && a.purchaseDate < fromDate) return false;
      if (toDate && a.purchaseDate > toDate) return false;
      if (!qStr) return true;
      const hay = `${a.tag} ${a.name} ${a.category} ${a.location}`.toLowerCase();
      return qStr.split(/\s+/).every(tok => hay.includes(tok));
    });
  }, [assets, q, category, status, location, minValue, maxValue, fromDate, toDate]);

  // pagination bounds
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // summaries
  const summary = useMemo(() => {
    const totalAssets = filtered.length;
    const totalValue = filtered.reduce((s, a) => s + Number(a.currentValue || 0), 0);
    const brokenCount = filtered.filter(a => a.status === "broken").length;
    const maintenanceCount = filtered.filter(a => a.status === "maintenance").length;
    const retiredCount = filtered.filter(a => a.status === "retired").length;
    return { totalAssets, totalValue, brokenCount, maintenanceCount, retiredCount };
  }, [filtered]);

  const pageTotals = useMemo(() => {
    const totalValue = pageItems.reduce((s, a) => s + Number(a.currentValue || 0), 0);
    return { totalValue, rows: pageItems.length };
  }, [pageItems]);

  // actions
  const handleMarkBroken = (id) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, status: "broken", notes: "Marked broken" } : a));
  };
  const handleMarkRepaired = (id) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, status: "active", notes: "Repaired" } : a));
  };
  const handleTransfer = (id) => {
    const target = window.prompt("Enter new location (e.g. Puma Depot):");
    if (!target) return;
    setAssets(prev => prev.map(a => a.id === id ? { ...a, location: target, notes: `Transferred to ${target}` } : a));
  };
  const handleView = (asset) => {
    // simple modal-less view - you can wire to a modal or route
    alert(
      `Asset: ${asset.tag}\nName: ${asset.name}\nCategory: ${asset.category}\nLocation: ${asset.location}\nStatus: ${asset.status}\nValue: TZS ${formatTZ(asset.currentValue)}\nNotes: ${asset.notes}`
    );
  };

  // Export CSV
  const exportCSV = () => {
    const header = ["Tag","Name","Category","Location","Purchase Date","Purchase Cost","Current Value","Status","Assigned To","Notes"];
    const rows = filtered.map(a => [
      a.tag, a.name, a.category, a.location, a.purchaseDate,
      a.purchaseCost, a.currentValue, a.status, a.assignedTo, a.notes || ""
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c || "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assets-report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF (print-friendly)
  const exportPDF = () => {
    const styles = `<style>
      body{font-family:Inter, Arial, sans-serif; padding:18px; color:#111;}
      h1{font-size:18px;margin-bottom:8px;}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px;}
      th,td{padding:8px;border:1px solid #ddd;}
      th{background:#f4f6f8;text-align:left;}
      .totals{margin-top:12px;font-weight:700;}
    </style>`;
    const headerHtml = `<h1>Assets Report — ${new Date().toLocaleString()}</h1>`;
    const tableHeader = `<tr><th>Tag</th><th>Name</th><th>Category</th><th>Location</th><th>Value</th><th>Status</th><th>Purchase</th></tr>`;
    const tableRows = filtered.map(a => `<tr>
      <td>${a.tag}</td><td>${a.name}</td><td>${a.category}</td><td>${a.location}</td><td style="text-align:right">${formatTZ(a.currentValue)}</td><td>${a.status}</td><td>${a.purchaseDate}</td></tr>`
    ).join("");
    const totalsHtml = `<div class="totals">Total assets: ${summary.totalAssets} — Total value: TZS ${formatTZ(summary.totalValue)}</div>`;
    const win = window.open("", "_blank", "noopener,width=900,height=700");
    if (!win) { alert("Popup blocked. Allow popups for this site to export PDF."); return; }
    win.document.write(`<!doctype html><html><head><title>Assets Report</title>${styles}</head><body>${headerHtml}<table>${tableHeader}${tableRows}</table>${totalsHtml}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="astrep-page">
      <div className="astrep-header">
        <div className="astrep-heading">
          <h2>Assets Report</h2>
          <div className="astrep-sub">Real-time status, location, values, transfers and lifecycle</div>
        </div>

        <div className="astrep-actions">
          <button className="astrep-btn astrep-btn-export" onClick={exportCSV}><FiDownload /> CSV</button>
          <button className="astrep-btn astrep-btn-export astrep-btn-outline" onClick={exportPDF}>Print / PDF</button>
        </div>
      </div>

      <div className="astrep-filters">
        <input className="astrep-input" placeholder="Search tag / name / category" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />

        <select className="astrep-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="astrep-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="broken">Broken</option>
          <option value="retired">Retired</option>
        </select>

        <select className="astrep-select" value={location} onChange={e => { setLocation(e.target.value); setPage(1); }}>
          <option value="">All Locations</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <input className="astrep-input-mini" placeholder="Min value" type="number" value={minValue} onChange={e => { setMinValue(e.target.value); setPage(1); }} />
        <input className="astrep-input-mini" placeholder="Max value" type="number" value={maxValue} onChange={e => { setMaxValue(e.target.value); setPage(1); }} />

        <input className="astrep-input-date" type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
        <input className="astrep-input-date" type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />

        <div className="astrep-filters-right">
          <label>Rows</label>
          <select className="astrep-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="astrep-summaryGrid">
        <div className="astrep-card">
          <div className="astrep-card-label">Total Assets (filtered)</div>
          <div className="astrep-card-value">{summary.totalAssets}</div>
        </div>

        <div className="astrep-card">
          <div className="astrep-card-label">Total Current Value (TZS)</div>
          <div className="astrep-card-value">TZS {formatTZ(summary.totalValue)}</div>
        </div>

        <div className="astrep-card warning">
          <div className="astrep-card-label">Broken</div>
          <div className="astrep-card-value">{summary.brokenCount}</div>
        </div>

        <div className="astrep-card maintenance">
          <div className="astrep-card-label">Under Maintenance</div>
          <div className="astrep-card-value">{summary.maintenanceCount}</div>
        </div>
      </div>

      <div className="astrep-tableWrap">
        <table className="astrep-table">
          <thead>
            <tr>
              <th>Tag</th>
              <th>Name</th>
              <th>Category</th>
              <th>Location</th>
              <th className="astrep-num">Value</th>
              <th>Assigned</th>
              <th>Status</th>
              <th>Purchase</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={9} className="astrep-empty">No assets match filter</td></tr>
            )}

            {pageItems.map(a => {
              const isBroken = a.status === "broken";
              const isMaint = a.status === "maintenance";
              return (
                <tr key={a.id} className={isBroken ? "astrep-row-broken" : isMaint ? "astrep-row-maint" : ""}>
                  <td>{a.tag}</td>
                  <td className="astrep-nameCol">{a.name}</td>
                  <td>{a.category}</td>
                  <td>{a.location}</td>
                  <td className="astrep-num">TZS {formatTZ(a.currentValue)}</td>
                  <td>{a.assignedTo}</td>
                  <td>
                    <span className={`astrep-badge ${String(a.status||"").toLowerCase()}`}>{a.status}</span>
                  </td>
                  <td>{a.purchaseDate}</td>
                  <td className="astrep-actionsCol">
                    <button title="View" className="astrep-actionBtn" onClick={() => handleView(a)}><FiEye /></button>
                    {a.status !== "broken" && <button title="Mark Broken" className="astrep-actionBtn danger" onClick={() => handleMarkBroken(a.id)}><FiAlertTriangle /></button>}
                    {a.status === "broken" && <button title="Mark Repaired" className="astrep-actionBtn success" onClick={() => handleMarkRepaired(a.id)}><FiRepeat /></button>}
                    <button title="Transfer Location" className="astrep-actionBtn" onClick={() => handleTransfer(a.id)}><FiMapPin /></button>
                  </td>
                </tr>
              );
            })}

          </tbody>
        </table>
      </div>

      <div className="astrep-tableTotals">
        <div className="astrep-tableTotals-block">
        </div>

        <div className="astrep-meta">
          <div>Last update: <strong>{lastUpdate || "-"}</strong></div>
        </div>
      </div>

      <div className="astrep-pagination">
        <div>
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>

        <div>Showing <strong>{pageItems.length}</strong> of <strong>{filtered.length}</strong> items</div>
      </div>
    </div>
  );
}

