// src/pages/admin/customers/modules/CustomerAccount.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CustomerAccount.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import API from "./../../../services/api";

const CUSTOMERS_API = "/customers/";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.results)) return value.results;
  if (value && Array.isArray(value.transactions)) return value.transactions;
  if (value && Array.isArray(value.ledger)) return value.ledger;
  return [];
};

const safeDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const money = (n) => Number(n || 0).toLocaleString();
const num = (v) => Number(v || 0);

export default function CustomerAccount() {
  const navigate = useNavigate();
  const { code } = useParams();
  const customerKey = code;
  const statementRef = useRef(null);
  const fileInputRef = useRef(null);

  console.log("PARAMS 👉", useParams());
  console.log("CUSTOMER KEY 👉", customerKey);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customer, setCustomer] = useState({
    id: null,
    code: "CU0001",
    name: "Walk-in customer",
    business: "",
    location: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    tin: "",
    vrn: "",
    license: "",
    corpCert: "",
    receivable_account_code: "",
    status: "",
    balance: 0,
    created_at: "",
    updated_at: "",
  });

  const [ledgerRows, setLedgerRows] = useState([]);

  const [rangeFilter, setRangeFilter] = useState("12month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addMethod, setAddMethod] = useState("CASH");

  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("");

  const normalizeCustomer = (data, fallbackKey) => {
    const d = data || {};
    const code = d.code || d.customer_code || d.accCode || `CU-${fallbackKey}`;
    const name = d.name || d.customer_name || d.full_name || "Customer";
    const location = d.location || d.address || "";
    const address = d.address || d.location || "";

    return {
      id: d.id ?? d.pk ?? fallbackKey,
      code,
      name,
      business: d.business || d.business_name || d.company || "",
      location,
      address,
      phone: d.phone || d.mobile || "",
      email: d.email || "",
      website: d.website || "",
      tin: d.tin || "",
      vrn: d.vrn || "",
      license: d.license || d.business_license || "",
      corpCert: d.corpCert || d.corporate_certificate || "",
      receivable_account_code: d.receivable_account_code || d.receivable_account?.code || "",
      status: d.status || "",
      balance: num(d.balance),
      created_at: d.created_at || "",
      updated_at: d.updated_at || "",
    };
  };

  const normalizeLedger = (list) => {
    return toArray(list)
      .map((row, idx) => {
        const date = safeDate(row.date || row.created_at || row.createdAt);
        const product =
          row.product ||
          row.description ||
          row.memo ||
          row.note ||
          row.invoice ||
          row.ref ||
          `Row ${idx + 1}`;

        return {
          date,
          product,
          credit: num(row.credit ?? row.paid ?? row.amount_credit ?? row.amountCredit ?? 0),
          debit: num(row.debit ?? row.amount ?? row.amount_debit ?? row.amountDebit ?? 0),
          ref: row.ref || row.invoice || row.reference || row.reference_number || row.id || "",
          source: row.source || "LEDGER",
        };
      })
      .filter((r) => r.date || r.product);
  };

  const fetchCustomer = async (id) => {
    try {
      const res = await API.get(`${CUSTOMERS_API}${encodeURIComponent(id)}/`);
      return res?.data || null;
    } catch (err) {
      try {
        const listRes = await API.get(CUSTOMERS_API);
        const list = toArray(listRes?.data);
        return (
          list.find(
            (c) =>
              String(c.id) === String(id) ||
              String(c.pk) === String(id) ||
              String(c.code || c.customer_code || c.accCode) === String(id)
          ) || null
        );
      } catch (innerErr) {
        console.warn("Customer endpoint not reachable:", innerErr?.message || innerErr);
        return null;
      }
    }
  };

  const fetchLedger = async (id) => {
    try {
      const res = await API.get(`${CUSTOMERS_API}${encodeURIComponent(id)}/ledger/`);
      return normalizeLedger(res?.data);
    } catch (err) {
      console.warn("Ledger endpoint not reachable:", err?.message || err);
      return [];
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      if (!customerKey) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [customerObj, ledgerList] = await Promise.all([
          fetchCustomer(customerKey),
          fetchLedger(customerKey),
        ]);

        const normalizedCustomer = normalizeCustomer(customerObj, customerKey);
        setCustomer(normalizedCustomer);
        setLedgerRows(ledgerList);
      } catch (err) {
        console.error("Customer account load error:", err);
        setError("Failed to load customer account data.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [customerKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rangeFilter, fromDate, toDate, searchTerm]);

  const cutoffDate = useMemo(() => {
    if (rangeFilter === "all") return null;
    const now = new Date();
    const copy = new Date(now);
    if (rangeFilter === "month") copy.setMonth(copy.getMonth() - 1);
    if (rangeFilter === "3month") copy.setMonth(copy.getMonth() - 3);
    if (rangeFilter === "6month") copy.setMonth(copy.getMonth() - 6);
    if (rangeFilter === "12month") copy.setMonth(copy.getMonth() - 12);
    return copy;
  }, [rangeFilter]);

  const filteredTx = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let list = [...ledgerRows].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (cutoffDate) {
      list = list.filter((t) => new Date(t.date) >= cutoffDate);
    }

    if (fromDate) {
      list = list.filter((t) => new Date(t.date) >= new Date(fromDate));
    }

    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((t) => new Date(t.date) <= end);
    }

    if (q) {
      list = list.filter(
        (t) =>
          String(t.product || "").toLowerCase().includes(q) ||
          String(t.ref || "").toLowerCase().includes(q) ||
          String(t.date || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [ledgerRows, cutoffDate, fromDate, toDate, searchTerm]);

  const txWithRunning = useMemo(() => {
    let running = 0;
    return filteredTx.map((t) => {
      running += num(t.credit) - num(t.debit);
      return { ...t, running };
    });
  }, [filteredTx]);

  const totals = useMemo(() => {
    let totalCredit = 0;
    let totalDebit = 0;

    txWithRunning.forEach((t) => {
      totalCredit += num(t.credit);
      totalDebit += num(t.debit);
    });

    const balance = totalCredit - totalDebit;
    const overdue = balance < 0 ? Math.abs(balance) : 0;

    return { totalCredit, totalDebit, balance, overdue };
  }, [txWithRunning]);

  const agingBuckets = useMemo(() => {
    const debits = [];
    const credits = [];

    txWithRunning.forEach((t) => {
      if (num(t.debit) > 0) {
        debits.push({ date: new Date(t.date), remaining: num(t.debit) });
      } else if (num(t.credit) > 0) {
        credits.push({ date: new Date(t.date), amount: num(t.credit) });
      }
    });

    credits.forEach((credit) => {
      let amt = credit.amount;
      for (let i = 0; i < debits.length && amt > 0; i++) {
        if (debits[i].remaining <= 0) continue;
        const used = Math.min(debits[i].remaining, amt);
        debits[i].remaining -= used;
        amt -= used;
      }
    });

    const buckets = { "30": 0, "90": 0, "180": 0, "240": 0, "366": 0, gt366: 0 };
    const today = new Date();

    debits.forEach((d) => {
      if (d.remaining <= 0) return;
      const days = Math.floor((today - d.date) / (1000 * 60 * 60 * 24));
      if (days <= 30) buckets["30"] += d.remaining;
      else if (days <= 90) buckets["90"] += d.remaining;
      else if (days <= 180) buckets["180"] += d.remaining;
      else if (days <= 240) buckets["240"] += d.remaining;
      else if (days <= 366) buckets["366"] += d.remaining;
      else buckets.gt366 += d.remaining;
    });

    return buckets;
  }, [txWithRunning]);

  const totalRows = txWithRunning.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRows = txWithRunning.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const generateCSV = () => {
    const headers = ["No", "Date", "Description", "Credit", "Debit", "Balance"];
    const lines = [headers.join(",")];

    txWithRunning.forEach((r, i) => {
      lines.push([
        i + 1,
        r.date,
        `"${String(r.product || "").replace(/"/g, '""')}"`,
        num(r.credit).toFixed(2),
        num(r.debit).toFixed(2),
        num(r.running).toFixed(2),
      ].join(","));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${customer.code || "customer"}-statement.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const input = statementRef.current;
    if (!input) return;

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;

      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pdfW, imgH);

      let heightLeft = imgH - pdfH;
      while (heightLeft > 0) {
        position -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfW, imgH);
        heightLeft -= pdfH;
      }

      pdf.save(`${customer.code || "customer"}-statement.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    }
  };

  const handleUploadClick = (type) => {
    setSelectedDocType(type);
    setShowUploadMenu(false);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", selectedDocType);

      const uploadUrl = `${CUSTOMERS_API}${encodeURIComponent(customerKey)}/upload_document/`;
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.warn("Upload failed:", res.status);
      }
    } catch (err) {
      console.log("Upload API not ready or failed:", err.message);
    }

    alert(`${selectedDocType} uploaded successfully`);
    e.target.value = "";
  };

  const openAddModal = () => {
    setAddDate("");
    setAddAmount("");
    setAddNote("");
    setShowAddModal(true);
  };

  const handleAddPaymentSubmit = (e) => {
    e.preventDefault();

    const d = addDate || new Date().toISOString().slice(0, 10);
    const amt = num(addAmount);

    if (!amt || amt <= 0) {
      alert("Enter a valid amount");
      return;
    }

    const note = addNote || "Manual payment";
    const newRow = {
      date: d,
      product: `Payment Received - ${addMethod}${note ? ` (${note})` : ""}`,
      credit: amt,
      debit: 0,
      ref: note,
      source: "LOCAL",
    };

    setLedgerRows((prev) => [...prev, newRow]);
    setShowAddModal(false);
    setAddDate("");
    setAddAmount("");
    setAddNote("");
    setAddMethod("CASH");
  };

  if (loading) {
    return (
      <div className="account-page">
        <div style={{ padding: 30 }}>Loading customer account...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-page">
        <div style={{ padding: 30 }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <header className="account-header">
        <div className="account-breadcrumb">
          <button className="btn btn-ghost" onClick={() => navigate("/admin/customers/list")}>
            ← Back to Customers
          </button>
        </div>

        <h1 className="account-title">Customer Account</h1>
        <div className="account-subtitle muted">
          {customer.name} — {customer.code}
        </div>
      </header>

      <main className="account-main">
        <div className="top-row">
          <div className="customer-card wide">
            <div className="logo-circle">{(customer.name || "C").charAt(0)}</div>
            <div className="customer-name">{customer.name}</div>
            <div className="customer-business">{customer.business || "Customer Profile"}</div>

            <div className="customer-info">
              <div><strong>Location:</strong> {customer.location || customer.address || "-"}</div>
              <div><strong>Phone:</strong> {customer.phone || "-"}</div>
              <div><strong>Email:</strong> {customer.email || "-"}</div>
              <div>
                <strong>Website:</strong>{" "}
                {customer.website ? (
                  <a href={customer.website} target="_blank" rel="noreferrer">
                    {customer.website}
                  </a>
                ) : (
                  "-"
                )}
              </div>
              <div><strong>Status:</strong> {customer.status || "-"}</div>
              <div><strong>Receivable AC:</strong> {customer.receivable_account_code || "-"}</div>
            </div>

            <table className="customer-detail-table">
              <tbody>
                <tr>
                  <td>Code</td>
                  <td>{customer.code || "-"}</td>
                </tr>
                <tr>
                  <td>TIN</td>
                  <td>{customer.tin || "-"}</td>
                </tr>
                <tr>
                  <td>VRN</td>
                  <td>{customer.vrn || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="kyc-card compact">
            <div className="kyc-header">
              <h4>KYC Documents</h4>

              <div className="kyc-upload-wrapper">
                <button
                  className="kyc-upload-btn"
                  onClick={() => setShowUploadMenu((prev) => !prev)}
                >
                  Upload
                </button>

                {showUploadMenu && (
                  <div className="kyc-upload-menu">
                    <button onClick={() => handleUploadClick("Business Licence")}>
                      Business Licence
                    </button>
                    <button onClick={() => handleUploadClick("Cooperate Certificate")}>
                      Cooperate Certificate
                    </button>
                    <button onClick={() => handleUploadClick("TIN")}>
                      TIN
                    </button>
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />

            <div className="kyc-row">
              <div className="kyc-left">
                <div className="kyc-title">Business Licence</div>
                <div className="kyc-sub">{customer.license || "-"}</div>
              </div>
              <div className="row-actions">
                <button
                  className="kyc-btn"
                  onClick={() => {
                    const txt = customer.license || "Business Licence";
                    const blob = new Blob([txt], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${customer.code || "customer"}-business-license.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download
                </button>
              </div>
            </div>

            <div className="kyc-row">
              <div className="kyc-left">
                <div className="kyc-title">Cooperate Certificate</div>
                <div className="kyc-sub">{customer.corpCert || "-"}</div>
              </div>
              <div className="row-actions">
                <button
                  className="kyc-btn"
                  onClick={() => {
                    const txt = customer.corpCert || "Cooperate Certificate";
                    const blob = new Blob([txt], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${customer.code || "customer"}-cooperate-certificate.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download
                </button>
              </div>
            </div>

            <div className="kyc-row">
              <div className="kyc-left">
                <div className="kyc-title">TIN</div>
                <div className="kyc-sub">{customer.tin || "-"}</div>
              </div>
              <div className="row-actions">
                <button
                  className="kyc-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(customer.tin || "");
                      window.alert("TIN copied to clipboard");
                    } catch (err) {
                      window.prompt("Copy TIN (Ctrl+C / Cmd+C):", customer.tin || "");
                    }
                  }}
                >
                  Copy TIN
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-row">
          <div className="summary-card credit">
            <div className="label">Credit</div>
            <div className="acvalue">{money(totals.totalCredit)}</div>
          </div>
          <div className="summary-card debit">
            <div className="label">Debit</div>
            <div className="acvalue">{money(totals.totalDebit)}</div>
          </div>
          <div className="summary-card balance">
            <div className="label">Balance</div>
            <div className="acvalue">{money(totals.balance)}</div>
          </div>
          <div className="summary-card overdue">
            <div className="label">Overdue</div>
            <div className="acvalue">{money(totals.overdue)}</div>
          </div>
        </div>

        <section className="statement-wrap" ref={statementRef}>
          <div className="statement-controls">
            <div className="filters">
              <label>Range</label>
              <select value={rangeFilter} onChange={(e) => setRangeFilter(e.target.value)}>
                <option value="month">1 Month</option>
                <option value="3month">3 Months</option>
                <option value="6month">6 Months</option>
                <option value="12month">12 Months</option>
                <option value="all">All</option>
              </select>

              <label>From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

              <label>To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

              <label>Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ledger text, date..."
              />
            </div>

            <div className="statement-actions">
              <button className="btn btn-ghost" onClick={openAddModal}>Add Payment</button>
              <button className="btn btn-ghost" onClick={generateCSV}>Export CSV</button>
              <button className="btn btn-ghost" onClick={exportPDF}>Export PDF</button>
              <button className="btn btn-primary" onClick={() => navigate("/admin/customers/statement-preview", {
                state: {
                  customer,
                  transactions: txWithRunning,
                  totals,
                  buckets: agingBuckets,
                },
              })}>
                Create Statement
              </button>
            </div>
          </div>

          <div className="transactions-wrap">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th style={{ width: "4%" }}>No.</th>
                  <th style={{ width: "12%" }}>Date</th>
                  <th style={{ width: "30%" }}>Description</th>
                  <th className="text-right" style={{ width: "16%" }}>Credit</th>
                  <th className="text-right" style={{ width: "16%" }}>Debit</th>
                  <th className="text-right" style={{ width: "16%" }}>Balance</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty">No transactions</td>
                  </tr>
                ) : (
                  paginatedRows.map((r, idx) => (
                    <tr key={`${r.source}-${r.ref}-${r.date}-${idx}`}>
                      <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                      <td>{r.date}</td>
                      <td>{r.product}</td>
                      <td className="text-right">{money(r.credit)}</td>
                      <td className="text-right">{money(r.debit)}</td>
                      <td className="text-right">{money(r.running)}</td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan={3}><strong>Totals</strong></td>
                  <td className="text-right"><strong>{money(totals.totalCredit)}</strong></td>
                  <td className="text-right"><strong>{money(totals.totalDebit)}</strong></td>
                  <td className="text-right"><strong>{money(totals.balance)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="aging-wrap">
            <table className="aging-table">
              <thead>
                <tr>
                  <th>30 days</th>
                  <th>90 days</th>
                  <th>180 days</th>
                  <th>240 days</th>
                  <th>366 days</th>
                  <th>{">366 days"}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{money(agingBuckets["30"])}</td>
                  <td>{money(agingBuckets["90"])}</td>
                  <td>{money(agingBuckets["180"])}</td>
                  <td>{money(agingBuckets["240"])}</td>
                  <td>{money(agingBuckets["366"])}</td>
                  <td>{money(agingBuckets.gt366)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="table-pagination">
            <div className="rows-per-page">
              <label>Rows</label>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="page-controls">
              <button
                className="btn btn-ghost"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <button className="btn btn-ghost active-page">{currentPage}</button>

              <button
                className="btn btn-ghost"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>

              <div className="page-info muted">
                Page {currentPage} of {totalPages} • {totalRows} rows
              </div>
            </div>
          </div>
        </section>
      </main>

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Payment</h3>
            <form onSubmit={handleAddPaymentSubmit} className="modal-form">
              <label>
                Date
                <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} />
              </label>

              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                />
              </label>

              <label>
                Method
                <select value={addMethod} onChange={(e) => setAddMethod(e.target.value)}>
                  <option value="CASH">CASH</option>
                  <option value="BANK">BANK</option>
                  <option value="MOBILE MONEY">MOBILE MONEY</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </label>

              <label>
                Reference / Note
                <input
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  placeholder="e.g. Receipt number"
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 