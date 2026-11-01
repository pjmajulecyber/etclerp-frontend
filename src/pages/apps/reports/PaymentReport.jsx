// src/pages/admin/sales/modules/PaymentsReport.jsx
import "./PaymentsReport.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* --------- small utilities --------- */
const PAGE_SIZE_DEFAULT = 12;
const formatTZS = (n) => Number(n || 0).toLocaleString();
const todayISO = () => new Date().toISOString().slice(0, 10);

function readJSON(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("readJSON", key, e);
    return [];
  }
}
function writeJSON(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("writeJSON", key, e);
  }
}

/* --------- mock payment methods (you can extend) --------- */
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Mobile Money", "Cheque", "Card"];

export default function PaymentsReport() {
  const navigate = useNavigate();

  // raw data
  const [salesRaw, setSalesRaw] = useState(() => readJSON("sales_list"));
  const [paymentsRaw, setPaymentsRaw] = useState(() => readJSON("payments"));

  // filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [acCode, setAcCode] = useState("");
  const [driver, setDriver] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState(""); // Paid / Partial / Unpaid
  const [q, setQ] = useState("");

  // UI / paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [showAddPayment, setShowAddPayment] = useState(false);

  // add payment form state
  const [payInvoice, setPayInvoice] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(todayISO());
  const [payMethod, setPayMethod] = useState(PAYMENT_METHODS[0] || "");
  const [payNote, setPayNote] = useState("");

  // reactively reload if storage changes in other tabs/windows
  useEffect(() => {
    const onStorage = () => {
      setSalesRaw(readJSON("sales_list"));
      setPaymentsRaw(readJSON("payments"));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // derive invoice summary (amount / paid / outstanding) by merging sales + payments
  const invoices = useMemo(() => {
    // use salesRaw as base
    const byInvoice = {};
    salesRaw.forEach((s) => {
      const invoiceKey = s.invoice || `INV-${s.id || Math.random().toString(36).slice(2,8)}`;
      byInvoice[invoiceKey] = {
        invoice: invoiceKey,
        date: s.date ? String(s.date).slice(0,10) : "",
        acCode: s.acCode || "",
        customer: s.customer || "",
        driver: s.driverName || s.meta?.driver || s.meta?.driverName || "",
        total: Number(s.amount || 0),
        paid: Number(s.paid || 0),
        items: s.items || [],
        raw: s
      };
    });

    // apply paymentsRaw to accumulate payments (so payments list stays authoritative)
    paymentsRaw.forEach((p) => {
      const inv = p.invoice || p.invoiceNumber;
      if (!inv) return;
      if (!byInvoice[inv]) {
        // orphan payment -> create placeholder invoice entry
        byInvoice[inv] = {
          invoice: inv,
          date: p.date ? String(p.date).slice(0,10) : "",
          acCode: p.acCode || "",
          customer: p.customer || "",
          driver: p.driver || "",
          total: Number(p.total || 0) || 0,
          paid: 0,
          items: [],
          raw: null
        };
      }
      byInvoice[inv].paid = (byInvoice[inv].paid || 0) + Number(p.amount || 0);
    });

    // compute outstanding
    const arr = Object.values(byInvoice).map((i) => ({
      ...i,
      outstanding: Math.max(0, Number(i.total || 0) - Number(i.paid || 0)),
    }));

    // keep stable order (by date desc -> invoice)
    arr.sort((a, b) => {
      const da = a.date || "";
      const db = b.date || "";
      if (da === db) return b.invoice.localeCompare(a.invoice);
      return db.localeCompare(da);
    });

    return arr;
  }, [salesRaw, paymentsRaw]);

  // filtered invoices base on UI filters
  const filteredInvoices = useMemo(() => {
    let list = invoices.slice();

    if (fromDate) list = list.filter(i => (i.date || "") >= fromDate);
    if (toDate) list = list.filter(i => (i.date || "") <= toDate);

    if (customer) list = list.filter(i => (i.customer || "").toLowerCase().includes(customer.toLowerCase()));
    if (acCode) list = list.filter(i => (i.acCode || "").toLowerCase().includes(acCode.toLowerCase()));
    if (driver) list = list.filter(i => (i.driver || "").toLowerCase().includes(driver.toLowerCase()));
    if (method) {
      // filter invoices that have at least one payment with this method
      const invWithMethod = new Set(
        paymentsRaw.filter(p => (p.method || "").toLowerCase() === method.toLowerCase()).map(p => p.invoice || p.invoiceNumber)
      );
      list = list.filter(i => invWithMethod.has(i.invoice));
    }
    if (status) {
      list = list.filter(i => {
        if (status === "Paid") return Number(i.outstanding || 0) <= 0 && Number(i.total || 0) > 0;
        if (status === "Partial") return Number(i.paid || 0) > 0 && Number(i.outstanding || 0) > 0;
        if (status === "Unpaid") return Number(i.paid || 0) <= 0;
        return true;
      });
    }
    if (q) {
      const Q = q.toLowerCase();
      list = list.filter(i =>
        (i.invoice || "").toLowerCase().includes(Q) ||
        (i.customer || "").toLowerCase().includes(Q) ||
        (i.acCode || "").toLowerCase().includes(Q)
      );
    }

    return list;
  }, [invoices, fromDate, toDate, customer, acCode, driver, method, status, q, paymentsRaw]);

  // paging
  const totalRows = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageItems = filteredInvoices.slice((page-1)*pageSize, page*pageSize);

  // summary numbers
  const totals = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => {
      acc.totalSales += Number(inv.total || 0);
      acc.totalPaid += Number(inv.paid || 0);
      acc.totalOutstanding += Number(inv.outstanding || 0);
      return acc;
    }, { totalSales: 0, totalPaid: 0, totalOutstanding: 0 });
  }, [filteredInvoices]);

  /* ====== actions: export CSV ====== */
  const exportCSV = () => {
    const header = ["Invoice", "Date", "AC Code", "Customer", "Total", "Paid", "Outstanding"];
    const rows = filteredInvoices.map(i => [
      i.invoice, i.date, i.acCode, i.customer, formatTZS(i.total), formatTZS(i.paid), formatTZS(i.outstanding)
    ]);
    const csv = [header.join(","), ...rows.map(r => r.map(c => `"${String(c||"").replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-report-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ====== add manual payment (front-end only) ====== */
  const handleAddPayment = () => {
    if (!payInvoice) return alert("Select Invoice to pay.");
    const amount = Number(payAmount || 0);
    if (!amount || amount <= 0) return alert("Enter valid payment amount.");

    const payment = {
      id: Date.now(),
      invoice: payInvoice,
      date: payDate,
      amount,
      method: payMethod,
      note: payNote,
      acCode: acCode || "" // optional
    };

    const payments = readJSON("payments");
    payments.unshift(payment);
    writeJSON("payments", payments);
    setPaymentsRaw(payments);

    // update sales_list paid field if invoice exists there
    const sales = readJSON("sales_list").map(s => {
      const inv = s.invoice || `INV-${s.id || ""}`;
      if (inv === payInvoice) {
        const newPaid = Number(s.paid || 0) + amount;
        return { ...s, paid: newPaid };
      }
      return s;
    });
    writeJSON("sales_list", sales);
    setSalesRaw(sales);

    // reset form & close
    setPayInvoice("");
    setPayAmount("");
    setPayDate(todayISO());
    setPayMethod(PAYMENT_METHODS[0] || "");
    setPayNote("");
    setShowAddPayment(false);
    alert("Payment recorded (frontend-only).");
  };

  /* ====== helper: get payments for invoice ====== */
  const paymentsFor = (invoice) => {
    return paymentsRaw.filter(p => (p.invoice || p.invoiceNumber) === invoice).sort((a,b) => (b.date||"").localeCompare(a.date||""));
  };

  /* ====== navigate to invoice preview ====== */
  const goToInvoice = (inv) => {
    // try to find raw sale and pass; else pass invoice key
    const sale = salesRaw.find(s => (s.invoice || "") === inv);
    const state = sale ? sale : { invoiceNumber: inv };
    navigate("/admin/sales/invoice-preview", { state });
  };

  return (
    <div className="pr-page">
      <div className="pr-header">
        <h2>Payments Report</h2>
        <div className="pr-actions">
          <button className="pr-btn pr-btn-outline" onClick={() => { setSalesRaw(readJSON("sales_list")); setPaymentsRaw(readJSON("payments")); }}>Reload</button>
          <button className="pr-btn pr-btn-primary" onClick={exportCSV}>Export CSV</button>
          <button className="pr-btn pr-btn-ghost" onClick={() => setShowAddPayment(s => !s)}>{showAddPayment ? "Close Add Payment" : "Add Payment"}</button>
        </div>
      </div>

      {/* filters */}
      <div className="pr-filters-grid">
        <div>
          <label>From</label>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
        </div>
        <div>
          <label>To</label>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} />
        </div>
        <div>
          <label>Customer</label>
          <input value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Customer name or part" />
        </div>
        <div>
          <label>AC Code</label>
          <input value={acCode} onChange={e=>setAcCode(e.target.value)} placeholder="12000..." />
        </div>
        <div>
          <label>Driver</label>
          <input value={driver} onChange={e=>setDriver(e.target.value)} placeholder="driver name" />
        </div>
        <div>
          <label>Payment Method</label>
          <select value={method} onChange={e=>setMethod(e.target.value)}>
            <option value="">Any</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label>Status</label>
          <select value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
        <div className="pr-search-col">
          <label>Search</label>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Invoice / Customer / AC code" />
        </div>
      </div>

      {/* summaries */}
      <div className="pr-summary-cards">
        <div className="pr-card">
          <div className="pr-card-title">Total Payments</div>
          <div className="pr-card-value">TZS {formatTZS(totals.totalPaid)}</div>
        </div>
        <div className="pr-card">
          <div className="pr-card-title">Total Sales</div>
          <div className="pr-card-value">TZS {formatTZS(totals.totalSales)}</div>
        </div>
        <div className="pr-card">
          <div className="pr-card-title">Total Outstanding</div>
          <div className="pr-card-value">TZS {formatTZS(totals.totalOutstanding)}</div>
        </div>
        <div className="pr-card">
          <div className="pr-card-title">Invoices</div>
          <div className="pr-card-value">{totalRows}</div>
        </div>
      </div>

      {/* add payment form (toggle) */}
      {showAddPayment && (
        <div className="pr-add-payment-form">
          <h4>Add Payment (frontend-only)</h4>
          <div className="pr-row">
            <div className="pr-col">
              <label>Invoice</label>
              <select value={payInvoice} onChange={e=>setPayInvoice(e.target.value)}>
                <option value="">Select invoice</option>
                {invoices.map(inv => <option key={inv.invoice} value={inv.invoice}>{inv.invoice} — {inv.customer}</option>)}
              </select>
            </div>
            <div className="pr-col">
              <label>Amount</label>
              <input type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} />
            </div>
            <div className="pr-col">
              <label>Date</label>
              <input type="date" value={payDate} onChange={e=>setPayDate(e.target.value)} />
            </div>
            <div className="pr-col">
              <label>Method</label>
              <select value={payMethod} onChange={e=>setPayMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="pr-col-full">
              <label>Note</label>
              <input value={payNote} onChange={e=>setPayNote(e.target.value)} />
            </div>
            <div className="pr-col-full pr-actions-row">
              <button className="pr-btn pr-btn-primary" onClick={handleAddPayment}>Record Payment</button>
              <button className="pr-btn pr-btn-outline" onClick={() => setShowAddPayment(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* invoices table */}
      <div className="pr-report-table">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>AC Code</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Outstanding</th>
              <th>Payments</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((inv) => (
              <tr key={inv.invoice}>
                <td>{inv.invoice}</td>
                <td>{inv.date}</td>
                <td>{inv.acCode}</td>
                <td>{inv.customer}</td>
                <td>TZS {formatTZS(inv.total)}</td>
                <td className="pr-paid">TZS {formatTZS(inv.paid)}</td>
                <td className="pr-outstanding">TZS {formatTZS(inv.outstanding)}</td>
                <td>
                  <div className="pr-payments-list">
                    {paymentsFor(inv.invoice).length === 0 ? (
                      <div className="pr-small-muted">—</div>
                    ) : paymentsFor(inv.invoice).map(p => (
                      <div key={p.id} className="pr-payment-row">
                        <div className="pr-p-date">{p.date}</div>
                        <div className="pr-p-amt">TZS {formatTZS(p.amount)}</div>
                        <div className="pr-p-method">{p.method}</div>
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="pr-row-actions">
                    <button className="pr-btn pr-btn-outline" onClick={() => goToInvoice(inv.invoice)}>View</button>
                    <button className="pr-btn pr-btn-ghost" onClick={() => { setShowAddPayment(true); setPayInvoice(inv.invoice); }}>Pay</button>
                  </div>
                </td>
              </tr>
            ))}

            {pageItems.length === 0 && (
              <tr><td colSpan="9" style={{textAlign:"center", padding:20}}>No invoices to show.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="pr-pagination">
        <div>
          <label>Rows</label>
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
            {[6,12,24,50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="pr-pager-controls">
          <button disabled={page<=1} className="pr-btn pr-pager-btn" onClick={()=>setPage(p=>p-1)}>Prev</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page>=totalPages} className="pr-btn pr-pager-btn" onClick={()=>setPage(p=>p+1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
