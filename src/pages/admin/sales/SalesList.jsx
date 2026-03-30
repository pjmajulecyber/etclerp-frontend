// src/pages/admin/Sales/SalesList.jsx
import "./SalesList.css";
import { NavLink } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { FiPlus, FiEye, FiDollarSign } from "react-icons/fi";


const API_BASE = import.meta.env.VITE_API_BASE_URL || ""; 
const ACCOUNT_CODE = "41000"; // <-- constant ac code for all sales

const customers = [
  "Tanzania Breweries (TBL)",
  "Shanta Gold",
  "METL",
  "Serengeti",
  "Benjamin Mkapa",
  "Lake Steel",
  "Jambo Food Limited",
  "DUBAI"
];

const salesData = Array.from({ length: 50 }, (_, i) => {
  const amount = 100000 + i * 15000;
  let paid;
  if (i % 3 === 0) {
    paid = amount;
  } else if (i % 3 === 1) {
    paid = 0;
  } else {
    paid = Math.floor(amount * 0.6);
  }
  return {
    id: i + 1,
    acCode: ACCOUNT_CODE, // use constant here
    invoice: `INV${(i + 1).toString().padStart(4, "0")}`,
    customer: customers[i % customers.length],
    amount,
    paid,
    outstanding: amount - paid,
    year: i % 2 === 0 ? "2026" : "2025",
    date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
    product: "HFO",
    status: paid === amount ? "Paid" : paid === 0 ? "Unpaid" : "Partial"
  };
});

export default function SalesList() {
  const navigate = useNavigate();
  const location = useLocation();

  // Normalize stored sales to ensure acCode = ACCOUNT_CODE
  const [sales, setSales] = useState(() => {
    try {
      const stored = sessionStorage.getItem("sales_list");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Normalize any existing entries' acCode to constant
        return parsed.map(p => ({ ...p, acCode: ACCOUNT_CODE }));
      }
    } catch (e) {
      // ignore parse errors and fallback to default mock
    }
    return salesData;
  });

  // Always persist normalized acCode when saving
  useEffect(() => {
    try {
      const normalized = sales.map(s => ({ ...s, acCode: ACCOUNT_CODE }));
      sessionStorage.setItem("sales_list", JSON.stringify(normalized));
    } catch (e) {}
  }, [sales]);

  useEffect(() => {
    const state = location.state || {};
    const candidate =
      state.newSale || state.createdSale || state.sale || state.addedSale;
    if (candidate && typeof candidate === "object") {
      const id = Date.now();
      const amount = Number(candidate.amount || candidate.total || 0);
      const paid = Number(candidate.paid || 0);
      const outstanding = Math.max(0, amount - paid);
      const year = candidate.year || new Date(candidate.date || Date.now()).getFullYear().toString();
      const newRow = {
        id,
        acCode: ACCOUNT_CODE, // enforce constant
        invoice: candidate.invoice || `INV${String(id).slice(-6)}`,
        customer: candidate.customer || candidate.customerName || "Unknown",
        amount,
        paid,
        outstanding,
        year,
        date: candidate.date || new Date().toISOString().slice(0, 10),
        product: candidate.product || "Misc",
        status: paid >= amount ? "Paid" : paid === 0 ? "Unpaid" : "Partial"
      };
      setSales(prev => [newRow, ...prev]);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {

    async function loadSales() {
      try {
  
        const res = await fetch(`${API_BASE}/api/sales/`, {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("access")
          }
        });

        if (!res.ok) {
          throw new Error(`Failed to load sales: ${res.status}`);
        }        
  
        const data = await res.json();
  
        if (data.results) {
  
          const mapped = data.results.map(s => ({
            id: s.id,
            acCode: s.acCode || ACCOUNT_CODE,
            invoice: s.invoice,
            customer: s.customer,
            amount: Number(s.amount || 0),
            paid: Number(s.paid || 0),
            outstanding: Number(s.outstanding || 0),
            year: new Date(s.date).getFullYear().toString(),
            date: s.date,
            product: s.product || "HFO",
            status: s.status || "Unpaid"
          }));
  
          setSales(mapped);
  
        }
  
      } catch (err) {
        console.error("Failed to load sales:", err);
      }
    }
  
    loadSales();
  
  }, []);

  const [acCode, setAcCode] = useState("");
  const [invoice, setInvoice] = useState("");
  const [customer, setCustomer] = useState("");
  const [search, setSearch] = useState("");
  const [tableYear, setTableYear] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [summaryYear, setSummaryYear] = useState("2026");
  const [summaryRange, setSummaryRange] = useState("Month");

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentSale, setPaymentSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNote, setPaymentNote] = useState("");

  const openPaymentModal = (sale) => {
    setPaymentSale(sale);
    setPaymentAmount(sale?.outstanding || 0);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod("Cash");
    setPaymentNote("");
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setPaymentSale(null);
  };

  const submitPayment = (e) => {
    e.preventDefault();
    if (!paymentSale) return;
    const paidVal = Number(paymentAmount || 0);
    if (paidVal <= 0) {
      alert("Enter valid payment amount.");
      return;
    }
    setSales(prev => {
      const copy = prev.map(s => {
        if (s.id !== paymentSale.id) return s;
        const newPaid = Number(s.paid || 0) + paidVal;
        const newOutstanding = Math.max(0, Number(s.amount || 0) - newPaid);
        const newStatus = newPaid >= Number(s.amount || 0) ? "Paid" : newPaid === 0 ? "Unpaid" : "Partial";
        return {
          ...s,
          paid: newPaid,
          outstanding: newOutstanding,
          status: newStatus,
          lastPayment: { date: paymentDate, amount: paidVal, method: paymentMethod, note: paymentNote }
        };
      });
      try {
        const normalized = copy.map(s => ({ ...s, acCode: ACCOUNT_CODE }));
        sessionStorage.setItem("sales_list", JSON.stringify(normalized));
      } catch (e) {}
      return copy;
    });
    closePaymentModal();
  };

  const summary = useMemo(() => {
    const filtered = sales.filter(s => s.year === summaryYear);
    return {
      totalSales: filtered.reduce((a, b) => a + (Number(b.amount) || 0), 0),
      totalDue: filtered.reduce((a, b) => a + (Number(b.outstanding) || 0), 0),
      invoices: filtered.length,
      overdue: filtered.filter(s => (Number(s.outstanding) || 0) > 0).length
    };
  }, [summaryYear, summaryRange, sales]);

  // --------- UPDATED: tokenized customer matching (each token must match name OR acCode) ----------
  const filteredTable = useMemo(() => {
    const codeFilter = (acCode || "").trim().toLowerCase();
    const invoiceFilter = (invoice || "").trim().toLowerCase();
    const searchFilter = (search || "").trim().toLowerCase();
    const yearFilter = tableYear;

    // tokenized customer input: split on whitespace, ignore empty tokens
    const customerInput = (customer || "").trim().toLowerCase();
    const customerTokens = customerInput ? customerInput.split(/\s+/).filter(Boolean) : [];

    return sales.filter(s => {
      // Year filter
      if (yearFilter !== "All" && s.year !== yearFilter) return false;

      // AC Code filter (simple substring on acCode)
      if (codeFilter && !((s.acCode || "").toLowerCase().includes(codeFilter))) return false;

      // Invoice filter
      if (invoiceFilter && !((s.invoice || "").toLowerCase().includes(invoiceFilter))) return false;

      // Customer tokens: every token must match either customer name OR acCode
      if (customerTokens.length > 0) {
        const name = (s.customer || "").toLowerCase();
        const ac = (s.acCode || "").toLowerCase();
        const allTokensMatch = customerTokens.every(tok => name.includes(tok) || ac.includes(tok));
        if (!allTokensMatch) return false;
      }

      // Global search (falls back to JSON search)
      if (searchFilter && !JSON.stringify(s).toLowerCase().includes(searchFilter)) return false;

      return true;
    });
  }, [acCode, invoice, customer, tableYear, search, sales]);
  // -----------------------------------------------------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(filteredTable.length / rowsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedData = filteredTable.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const pageTotals = paginatedData.reduce(
    (acc, row) => {
      acc.amount += Number(row.amount || 0);
      acc.paid += Number(row.paid || 0);
      acc.outstanding += Number(row.outstanding || 0);
      return acc;
    },
    { amount: 0, paid: 0, outstanding: 0 }
  );

  const goToInvoicePreview = (row) => {
    const saleData = {
      invoiceNumber: row.invoice,
      customer: { code: row.acCode, name: row.customer },
      items: row.items || [{ code: "", name: row.product, price: Number(row.amount || 0), qty: 1 }],
      discountAll: row.discountAll || 0,
      paidAmount: Number(row.paid || 0),
      calculations: {
        subtotal: Number(row.amount || 0),
        totalTax: 0,
        discountAmount: 0,
        grandTotal: Number(row.amount || 0),
        outstanding: Number(row.outstanding || 0)
      },
      date: row.date,
      saleType: row.saleType || "Final",
      referenceNo: row.acCode
    };
    navigate("/admin/sales/invoice-preview", {
      state: { id: row.id }
    });
  };
  
  
  return (
    <div className="salesList-page">
      <div className="SalesListSum-wrapper">
        <div className="salesList-header">
          <div>
            <h2>Sales Management</h2>
            <p>Manage quotations, orders, invoices, and customers</p>
          </div>
          <button
            className="salesList-primaryBtn"
            onClick={() =>
              navigate("/admin/sales/modules/add", {
                state: { backgroundLocation: location }
              })
            }
          >
            <FiPlus /> New Sales Order
          </button>
        </div>

        <div className="salesList-summaryFilter">
          <select
            value={summaryYear}
            onChange={e => setSummaryYear(e.target.value)}
            className="salesListCard-select"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <select
            value={summaryRange}
            onChange={e => setSummaryRange(e.target.value)}
            className="salesListCardMonth-select"
          >
            <option value="Today">Today</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
            <option value="Custom">Custom Range</option>
          </select>

          {summaryRange === "Custom" && (
            <div className="salesList-dateRange">
              <input type="date" />
              <span>to</span>
              <input type="date" />
            </div>
          )}
        </div>

        <div className="salesList-summaryGrid">
          <SummaryCard label="Total Sales" value={summary.totalSales} type="blue" />
          <SummaryCard label="Sales Due" value={summary.totalDue} type="orange" />
          <SummaryCard label="Invoices" value={summary.invoices} type="green" />
          <SummaryCard label="Overdue" value={summary.overdue} type="red" />
        </div>
      </div>

      <div className="salesList-tabs">
        <NavLink to="/admin/sales/list" className={({ isActive }) =>
          isActive ? "salesList-tab active" : "salesList-tab"
        }>Sales Order</NavLink>

        <NavLink to="/admin/sales/invoice" className={({ isActive }) =>
          isActive ? "salesList-tab active" : "salesList-tab"
        }>Invoice</NavLink>

        <NavLink to="/admin/sales/quotation" className={({ isActive }) =>
          isActive ? "salesList-tab active" : "salesList-tab"
        }>Quotation</NavLink>

        <NavLink to="/admin/sales/overdue" className={({ isActive }) =>
          isActive ? "salesList-tab active" : "salesList-tab"
        }>Overdue</NavLink>
      </div>

      <div className="salesList-tableCard">
        <div className="salesList-tableFilters">
          <input
            className="salesList-input"
            placeholder="AC Code"
            value={acCode}
            onChange={e => setAcCode(e.target.value)}
          />

          <input
            className="salesList-input"
            placeholder="Invoice Number"
            value={invoice}
            onChange={e => setInvoice(e.target.value)}
          />

          <input
            className="salesList-input"
            placeholder="Customer Name or Code (e.g. '12000 shanta')"
            value={customer}
            onChange={e => setCustomer(e.target.value)}
          />

          <select
            className="salesList-select"
            value={tableYear}
            onChange={e => setTableYear(e.target.value)}
          >
            <option value="All">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <div className="salesList-exportButtons">
            <button
              className="salesList-btn salesList-btn-pdf"
              onClick={() => {
                const csv = [
                  ["Date","Code","Invoice","Customer","Product","Amount","Paid","Outstanding"].join(","),
                  ...filteredTable.map(r =>
                    [r.date, r.acCode, r.invoice, r.customer, r.product, r.amount, r.paid, r.outstanding].map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")
                  )
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `sales-export-${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export PDF
            </button>

            <button
              className="salesList-btn salesList-btn-excel"
              onClick={() => {
                const csv = [
                  ["Date","Code","Invoice","Customer","Product","Amount","Paid","Outstanding"].join(","),
                  ...filteredTable.map(r =>
                    [r.date, r.acCode, r.invoice, r.customer, r.product, r.amount, r.paid, r.outstanding].map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")
                  )
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `sales-export-${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export Excel
            </button>
          </div>
        </div>;

        <div className="salesList-tableWrapper">
          <table className="salesList-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Code</th>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map(row => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.acCode}</td>
                  <td>{row.invoice}</td>
                  <td>{row.customer}</td>
                  <td>{row.product}</td>
                  <td className="text-right">{Number(row.amount || 0).toLocaleString()}</td>
                  <td className="text-right">{Number(row.paid || 0).toLocaleString()}</td>
                  <td className="text-right">{Number(row.outstanding || 0).toLocaleString()}</td>
                  <td>
                    <span className={`salesList-status ${String(row.status || "").toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="salesList-actions">
                    <button className="icon-btn view" title="View" onClick={() => goToInvoicePreview(row)}>
                      <FiEye />
                    </button>
                    <button className="icon-btn receive" title="Receive Payment" onClick={() => openPaymentModal(row)}>
                      <FiDollarSign />
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedData.length > 0 && (
                <tr className="salesList-totalRow">
                  <td colSpan="5"><strong>Total (This Page)</strong></td>
                  <td className="text-right"><strong>{pageTotals.amount.toLocaleString()}</strong></td>
                  <td className="text-right"><strong>{pageTotals.paid.toLocaleString()}</strong></td>
                  <td className="text-right"><strong>{pageTotals.outstanding.toLocaleString()}</strong></td>
                  <td colSpan="2"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="salesList-pagination">
          <select
            value={rowsPerPage}
            onChange={e => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="salesList-select"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <div className="salesList-pageButtons">
            <button disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}>Previous</button>

            <button className="active">{currentPage}</button>

            <button disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {paymentModalOpen && paymentSale && (
        <div className="modal-backdrop" onClick={closePaymentModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Receive Payment</h3>
            <form onSubmit={submitPayment} className="modal-form">
              <label>
                Date
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
              </label>

              <label>
                Invoice
                <input value={paymentSale.invoice} readOnly />
              </label>

              <label>
                Customer
                <input value={paymentSale.customer} readOnly />
              </label>

              <label>
                Outstanding (Tsh)
                <input value={Number(paymentSale.outstanding || 0).toLocaleString()} readOnly />
              </label>

              <label>
                Amount to Receive
                <input type="number" min="1" step="any" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
              </label>

              <label>
                Method
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option>Cash</option>
                  <option>Bank</option>
                  <option>Mobile Money</option>
                </select>
              </label>

              <label>
                Note
                <input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Optional note" />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={closePaymentModal}>Cancel</button>
                <button type="submit" className="btn primary">Receive Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, type }) {
  return (
    <div className={`salesList-card ${type}`}>
      <p>{label}</p>
      <h3>{Number(value || 0).toLocaleString()}</h3>
    </div>
  );
}