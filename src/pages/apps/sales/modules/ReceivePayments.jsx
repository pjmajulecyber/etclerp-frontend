import React, { useMemo, useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./ReceivePayments.css";

export default function ReceivePayments() {
  const initialSales = [
    { id: 1, code: "S-1001", date: "2026-01-10", customer: "Alpha Ltd", total: 250000, paid: 100000 },
    { id: 2, code: "S-1002", date: "2026-01-12", customer: "Beta Traders", total: 150000, paid: 0 },
    { id: 3, code: "S-1003", date: "2026-02-03", customer: "Gamma Co", total: 420000, paid: 420000 },
    { id: 4, code: "S-1004", date: "2026-02-15", customer: "Delta Importers", total: 80000, paid: 20000 },
    { id: 5, code: "S-1005", date: "2026-02-18", customer: "Epsilon Retail", total: 120000, paid: 0 }
  ];

  const initialPayments = [
    { id: 1, code: "PMT-001", date: "2026-01-11", saleId: 1, saleCode: "S-1001", customer: "Alpha Ltd", method: "Bank", amount: 100000, note: "Initial part payment" },
    { id: 2, code: "PMT-002", date: "2026-02-04", saleId: 3, saleCode: "S-1003", customer: "Gamma Co", method: "Cash", amount: 420000, note: "Full payment" },
    { id: 3, code: "PMT-003", date: "2026-02-16", saleId: 4, saleCode: "S-1004", customer: "Delta Importers", method: "Mobile Money", amount: 20000, note: "Deposit" }
  ];

  const [sales, setSales] = useState(initialSales);
  const [payments, setPayments] = useState(initialPayments);

  const [range, setRange] = useState("30");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerQ, setCustomerQ] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNote, setPaymentNote] = useState("");

  const paymentsRef = useRef(null);

  useEffect(() => {
    if (!showPaymentModal) {
      setSelectedSaleId(null);
      setPaymentDate("");
      setPaymentAmount("");
      setPaymentMethod("Cash");
      setPaymentNote("");
    }
  }, [showPaymentModal]);

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

  const salesMap = useMemo(() => {
    const map = {};
    sales.forEach(s => {
      map[s.id] = { ...s, due: Math.max(0, (Number(s.total || 0) - Number(s.paid || 0))) };
    });
    return map;
  }, [sales]);

  const filteredPayments = useMemo(() => {
    const q = (customerQ || "").trim().toLowerCase();
    let list = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (cutoffDate) list = list.filter(p => new Date(p.date) >= cutoffDate);
    if (range === "custom" && fromDate) list = list.filter(p => new Date(p.date) >= new Date(fromDate));
    if (range === "custom" && toDate) list = list.filter(p => new Date(p.date) <= new Date(toDate));
    if (methodFilter !== "all") list = list.filter(p => p.method === methodFilter);
    if (q) list = list.filter(p => (p.customer || "").toLowerCase().includes(q) || (p.saleCode || "").toLowerCase().includes(q));
    if (statusFilter !== "all") {
      list = list.filter(p => {
        const s = salesMap[p.saleId];
        if (!s) return false;
        const dueAfter = Math.max(0, s.total - (s.paid));
        if (statusFilter === "paid") return dueAfter === 0;
        if (statusFilter === "partial") return s.paid > 0 && s.paid < s.total;
        if (statusFilter === "unpaid") return s.paid === 0;
        return true;
      });
    }
    return list;
  }, [payments, cutoffDate, range, fromDate, toDate, customerQ, methodFilter, statusFilter, salesMap]);

  const totalRows = filteredPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]); // eslint-disable-line
  const pageRows = filteredPayments.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const openNewPayment = (saleId = null) => {
    setSelectedSaleId(saleId);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentAmount("");
    setPaymentMethod("Cash");
    setPaymentNote("");
    setShowPaymentModal(true);
  };

  const submitPayment = (e) => {
    e.preventDefault();
    if (!selectedSaleId) { alert("Select sale to apply payment."); return; }
    const sale = salesMap[selectedSaleId];
    if (!sale) { alert("Sale not found."); return; }
    const amt = Number(paymentAmount || 0);
    if (!amt || amt <= 0) { alert("Enter valid amount."); return; }
    const maxPayable = Math.max(0, sale.total - sale.paid);
    const pay = Math.min(amt, maxPayable);
    const newPayment = {
      id: Date.now(),
      code: `PMT-${String(Date.now()).slice(-6)}`,
      date: paymentDate || new Date().toISOString().slice(0,10),
      saleId: sale.id,
      saleCode: sale.code,
      customer: sale.customer,
      method: paymentMethod,
      amount: pay,
      note: paymentNote || ""
    };
    setPayments(prev => [newPayment, ...prev]);
    setSales(prev => prev.map(s => s.id === sale.id ? { ...s, paid: Number(s.paid || 0) + pay } : s));
    setShowPaymentModal(false);
  };

  const exportCSV = () => {
    const headers = ["Date","Payment Code","Sale Code","Customer","Method","Amount","Note"];
    const rows = filteredPayments.map(p => [p.date, p.code, p.saleCode, p.customer, p.method, Number(p.amount||0).toFixed(2), (p.note||"")]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const node = paymentsRef.current;
    if (!node) return alert("Nothing to export");
    try {
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p","pt","a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position -= pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`payments-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF export failed");
    }
  };

  const deletePayment = (id) => {
    if (!window.confirm("Delete payment?")) return;
    const p = payments.find(x => x.id === id);
    if (!p) return;
    setPayments(prev => prev.filter(x => x.id !== id));
    setSales(prev => prev.map(s => s.id === p.saleId ? { ...s, paid: Math.max(0, Number(s.paid||0) - Number(p.amount||0)) } : s));
  };

  return (
    <div className="sales-page">
      <div className="sales-container">
        <div className="sales-header">
          <div className="sales-title">
            <h1>Receive Payments</h1>
            <div className="muted">Track received payments and view payment reports</div>
          </div>

          <div className="sales-actions">
            <button className="reset" onClick={() => { setRange("all"); setFromDate(""); setToDate(""); setCustomerQ(""); setMethodFilter("all"); setStatusFilter("all"); }}>
              Reset
            </button>
            <button className="btn btn-ghost" onClick={exportCSV}>Export CSV</button>
            <button className="btn btn-ghost" onClick={exportPDF}>Export PDF</button>
            <button className="btn btn-primary" onClick={() => openNewPayment()}>New Payment</button>
          </div>
        </div>

        <div className="sales-filters">
          <div className="filters-left">
            <label>Range
              <select value={range} onChange={(e) => { setRange(e.target.value); setPage(1); }}>
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="custom">Custom</option>
              </select>
            </label>

            {range === "custom" && (
              <>
                <label>From
                  <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
                </label>
                <label>To
                  <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
                </label>
              </>
            )}

            <label>Customer
              <input className="src" placeholder="search customer or sale code" value={customerQ} onChange={(e) => { setCustomerQ(e.target.value); setPage(1); }} />
            </label>

            <label>Method
              <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}>
                <option value="all">All</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </label>

            <label>Status
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </label>
          </div>

          <div className="filters-right">
            <label>Rows
              <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
        </div>

        <div className="card table-card sales-table-card" ref={paymentsRef}>
          <div className="sales-table-head">
            <h3>Payments Report</h3>
            <div className="sales-table-actions">
              <div className="rows-control">
                <label>Showing</label>
                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-scroll">
            <table className="sales-table">
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>Date</th>
                  <th style={{ width: "12%" }}>InvoiceNo</th>
                  <th style={{ width: "10%" }}>saleCode</th>
                  <th style={{ width: "18%" }}>Customer</th>
                  <th style={{ width: "14%", textAlign: "right" }}>Amount</th>
                  <th style={{ width: "12%" }}>Method</th>
                  <th style={{ width: "10%" }}>Status</th>
                  <th style={{ width: "14%" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr><td colSpan={8} className="empty">No payments found</td></tr>
                )}
                {pageRows.map(p => {
                  const s = salesMap[p.saleId];
                  const status = s ? (s.paid >= s.total ? "Paid" : (s.paid > 0 ? "Partial" : "Unpaid")) : "Unknown";
                  return (
                    <tr key={p.id}>
                      <td>{p.date}</td>
                      <td className="mono">{p.code}</td>
                      <td className="mono">{p.saleCode}</td>
                      <td>{p.customer}</td>
                      <td className="text-right">Tsh {Number(p.amount || 0).toLocaleString()}</td>
                      <td>{p.method}</td>
                      <td>
                        <span className={`badge ${status === "Paid" ? "paid" : status === "Partial" ? "partial" : "unpaid"}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn small" onClick={() => openNewPayment(p.saleId)}>Apply</button>
                          <button className="btn small ghost" onClick={() => deletePayment(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="sales-table-footer">
            <div className="sales-page-summary">Showing {(totalRows === 0) ? 0 : (page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, totalRows)} of {totalRows} payments</div>
            <div className="sales-pagination">
              <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
              <span className="page-indicator">Page {page} / {totalPages}</span>
              <button className="btn ghost" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </div>

        {showPaymentModal && (
          <div className="modal-backdrop" onClick={() => setShowPaymentModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Record Payment</h3>
              <form className="modal-form" onSubmit={submitPayment}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label>
                    Sale
                    <select value={selectedSaleId || ""} onChange={(e) => setSelectedSaleId(Number(e.target.value))} required>
                      <option value="">-- select sale --</option>
                      {sales.map(s => {
                        const due = Math.max(0, s.total - s.paid);
                        return <option key={s.id} value={s.id}>{s.code} — {s.customer} — Due: Tsh {due.toLocaleString()}</option>;
                      })}
                    </select>
                  </label>

                  <label>
                    Date
                    <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
                  </label>

                  <label>
                    Amount
                    <input type="number" min="0" step="1" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
                  </label>

                  <label>
                    Method
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option>Cash</option>
                      <option>Bank</option>
                      <option>Mobile Money</option>
                    </select>
                  </label>

                  <label style={{ gridColumn: "1 / span 2" }}>
                    Note
                    <input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Record Payment</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
