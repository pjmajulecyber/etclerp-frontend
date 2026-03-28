// pages/admin/inventory/TrackStock.jsx
import React, { useMemo, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./TrackStock.css";

const MOCK_LOGS = [
  // sample rows - replace with API data
  { date: "2026-02-15", code: "P0001", product: "Diesel 50L", stockIn: 0, stockOut: 3000, customer: "Walk-in", current: 4200 },
  { date: "2026-02-14", code: "P0002", product: "Lubricant 5L", stockIn: 3000, stockOut: 0, customer: "Alpha Ltd", current: 5000 },
  { date: "2026-01-28", code: "P0003", product: "Oil Filter", stockIn: 500, stockOut: 20, customer: "Beta Traders", current: 480 },
  { date: "2025-12-30", code: "P0001", product: "Diesel 50L", stockIn: 10000, stockOut: 0, customer: "Opening", current: 7000 },
  { date: "2025-11-20", code: "P0004", product: "Engine Oil 1L", stockIn: 0, stockOut: 5000, customer: "Gamma Co", current: 12000 },
  // add more rows to test pagination...
];

function formatDateStr(d) {
  if (!d) return "";
  const dd = new Date(d);
  return dd.toISOString().slice(0, 10);
}

export default function TrackStock() {
  const [logs] = useState(MOCK_LOGS);
  const [range, setRange] = useState("30"); // 'all','today','7','30','custom'
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const areaRef = useRef(null);

  // compute cutoff
  const cutoffDate = useMemo(() => {
    if (range === "all") return null;
    const now = new Date();
    if (range === "today") {
      const copy = new Date(now);
      copy.setHours(0, 0, 0, 0);
      return copy;
    }
    if (["7", "30", "90"].includes(range)) {
      const copy = new Date(now);
      copy.setDate(copy.getDate() - Number(range));
      copy.setHours(0, 0, 0, 0);
      return copy;
    }
    return null;
  }, [range]);

  // filtered logs
  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    let list = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date)); // latest first

    if (cutoffDate) {
      list = list.filter((r) => new Date(r.date) >= cutoffDate);
    }

    if (range === "custom" && fromDate) {
      list = list.filter((r) => new Date(r.date) >= new Date(fromDate));
    }
    if (range === "custom" && toDate) {
      list = list.filter((r) => new Date(r.date) <= new Date(toDate));
    }

    if (q) {
      list = list.filter(
        (r) =>
          (r.code || "").toString().toLowerCase().includes(q) ||
          (r.product || "").toString().toLowerCase().includes(q) ||
          (r.customer || "").toString().toLowerCase().includes(q) ||
          (r.date || "").toString().toLowerCase().includes(q)
      );
    }

    return list;
  }, [logs, cutoffDate, range, fromDate, toDate, search]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  if (page > totalPages) setPage(totalPages);

  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const totals = paginated.reduce(
    (acc, r) => {
      acc.in += Number(r.stockIn || 0);
      acc.out += Number(r.stockOut || 0);
      return acc;
    },
    { in: 0, out: 0 }
  );

  // CSV export (filtered full set)
  const exportCSV = () => {
    const headers = ["Date", "Code", "Product", "Stock In", "Stock Out", "Customer", "Current Stock"];
    const lines = [headers.join(",")];
    filtered.forEach((r) => {
      const row = [
        `"${r.date}"`,
        `"${r.code}"`,
        `"${(r.product || "").replace(/"/g, '""')}"`,
        Number(r.stockIn || 0),
        Number(r.stockOut || 0),
        `"${(r.customer || "").replace(/"/g, '""')}"`,
        Number(r.current || 0)
      ];
      lines.push(row.join(","));
    });
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-tracking.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF export of the printable area (table only)
  const exportPDF = async () => {
    const node = areaRef.current;
    if (!node) return alert("Nothing to export");
    try {
      const SCALE = 2;
      const canvas = await html2canvas(node, { scale: SCALE, useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`stock-statement.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF generation failed");
    }
  };

  return (
    <div className="trackstock-page">
      <div className="trackstock-header">
        <div className="trackstock-titleBlock">
          <h1>Stock Tracking</h1>
          <p className="muted">View and export all stock movements (in/out) — filter by date range or search.</p>
        </div>

        <div className="trackstock-actions">
          <button className="btn btn-outline" onClick={() => { setRange("all"); setFromDate(""); setToDate(""); setSearch(""); }}>
            Reset
          </button>
          <button className="btn btn-default" onClick={exportCSV}>Export CSV</button>
          <button className="btn btn-primary" onClick={exportPDF}>Export PDF</button>
        </div>
      </div>

      <div className="trackstock-controls">
        <div className="control-left">
          <label>Range</label>
          <select value={range} onChange={(e) => { setRange(e.target.value); setPage(1); }}>
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="custom">Custom</option>
          </select>

          {range === "custom" && (
            <>
              <label>From</label>
              <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
              <label>To</label>
              <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
            </>
          )}

          <label>Search</label>
          <input placeholder="code, product or customer" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>

        <div className="Stcontrol-right">
          <label >Rows</label>
          <select className="control-right-select" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Printable area (table only) */}
      <div className="trackstock-tableWrap" ref={areaRef}>
        <div className="table-scroll">
          <table className="trackstock-table">
            <thead>
              <tr>
                <th style={{ width: "10%" }}>Date</th>
                <th style={{ width: "10%" }}>Code</th>
                <th style={{ width: "18%" }}>Product</th>
                <th style={{ width: "14%", textAlign: "left" }}>Stock In</th>
                <th style={{ width: "14%", textAlign: "left" }}>Stock Out</th>
                <th style={{ width: "17%" }}>Customer</th>
                <th style={{ width: "12%", textAlign: "left" }}>Current</th>
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="empty">No records</td></tr>
              )}

              {paginated.map((r, i) => (
                <tr key={`${r.code}-${i}`}>
                  <td>{formatDateStr(r.date)}</td>
                  <td>{r.code}</td>
                  <td>{r.product}</td>
                  <td className="text-left">{Number(r.stockIn || 0).toLocaleString()}</td>
                  <td className="text-left">{Number(r.stockOut || 0).toLocaleString()}</td>
                  <td>{r.customer}</td>
                  <td className="text-left">{Number(r.current || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan={3}><strong>Page Totals</strong></td>
                <td className="text-right"><strong>{totals.in.toLocaleString()}</strong></td>
                <td className="text-right"><strong>{totals.out.toLocaleString()}</strong></td>
                <td></td>
                <td className="text-right"><strong>{/* optionally show page current total */}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* pagination */}
      <div className="trackstock-pagination">
        <div className="page-info muted">
          Showing {(totalRows === 0) ? 0 : (page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, totalRows)} of {totalRows} entries
        </div>

        <div className="page-controls">
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <button className="btn btn-ghost active">{page}</button>
          <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
}

