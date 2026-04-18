// src/pages/admin/purchases/PurchasesList.jsx
import "./Purchases.css";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import API from "./../../../services/api";
import {
  FiPlus,
  FiEye,
  FiPrinter,
  FiDollarSign
} from "react-icons/fi";

const MOCK_PURCHASES = [
  {
    id: 1,
    invoice_number: "INV0001",
    supplier_name: "Shanta Gold",
    purchase_type: "CREDIT",
    total_amount: 250000,
    paid_amount: 150000,
    outstanding_amount: 100000,
    date: "2026-01-10",
    status: "PARTIAL",
    product: "HFO"
  }
];

const unwrapList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

export default function PurchasesList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [purchases, setPurchases] = useState([]);

  const [acCode, setAcCode] = useState("");
  const [invoice, setInvoice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [search, setSearch] = useState("");
  const [tableYear, setTableYear] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [summaryYear, setSummaryYear] = useState("2026");
  const [summaryRange, setSummaryRange] = useState("Month");

  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const res = await API.get("purchases/");
      const list = unwrapList(res?.data);

      if (list.length > 0) {
        setPurchases(list);
      } else {
        setPurchases(MOCK_PURCHASES);
      }
    } catch (err) {
      console.error("Purchases API failed, using mock data:", err);
      setPurchases(MOCK_PURCHASES);
    }
  };

  const purchaseData = useMemo(() => {
    return purchases.map((p) => ({
      id: p.id,
      acCode:
        p.ac_code ||
        p.expense_account_code ||
        p.payable_account_code ||
        `AC${String(p.id).padStart(3, "0")}`,
      invoice: p.invoice_number || p.po_number || "",
      supplier:
        p.supplier_name ||
        p.billTo?.company ||
        p.supplier?.name ||
        p.supplier_display ||
        "",
      amount: Number(p.total_amount || p.calculations?.grandTotal || 0),
      paid: Number(p.paid_amount || 0),
      outstanding: Math.max(Number(p.outstanding_amount || 0), 0),
      year: p.date?.slice(0, 4) || "",
      date: p.date || p.po_date || "",
      product: p.product || p.items?.[0]?.description || p.items?.[0]?.particulars || "",
      status: String(p.status || "UNPAID").toUpperCase(),
      purchase_type: String(p.purchase_type || "").toUpperCase(),
      raw: p
    }));
  }, [purchases]);

  const summary = useMemo(() => {
    const filtered = purchaseData.filter((s) => summaryYear === "All" || s.year === summaryYear);

    return {
      totalPurchases: filtered.reduce((a, b) => a + b.amount, 0),
      totalDue: filtered.reduce((a, b) => a + b.outstanding, 0),
      invoices: filtered.length,
      overdue: filtered.filter((s) => s.outstanding > 0).length
    };
  }, [purchaseData, summaryYear, summaryRange]);

  const filteredTable = useMemo(() => {
    return purchaseData.filter((s) =>
      (tableYear === "All" || s.year === tableYear) &&
      String(s.acCode || "").toLowerCase().includes(acCode.toLowerCase()) &&
      String(s.invoice || "").toLowerCase().includes(invoice.toLowerCase()) &&
      String(s.supplier || "").toLowerCase().includes(supplier.toLowerCase()) &&
      JSON.stringify(s).toLowerCase().includes(search.toLowerCase())
    );
  }, [purchaseData, acCode, invoice, supplier, tableYear, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTable.length / rowsPerPage));

  const paginatedData = filteredTable.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const pageTotals = paginatedData.reduce(
    (acc, row) => {
      acc.amount += row.amount;
      acc.paid += row.paid;
      acc.outstanding += row.outstanding;
      return acc;
    },
    { amount: 0, paid: 0, outstanding: 0 }
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleView = async (row) => {
    try {
      const res = await API.get(`purchases/${row.id}/purchase_order/`);
      const backendData = res?.data ?? null;

      navigate("/admin/purchases/invoice-preview", {
        state: {
          id: row.id,
          saleData: {
            invoiceNumber: backendData?.po_number || row.invoice,
            supplier: {
              name: backendData?.billTo?.company || row.supplier,
              address: backendData?.billTo?.address || "",
              tin: backendData?.billTo?.tin || "",
              vrn: backendData?.billTo?.vrn || ""
            },
            items:
              backendData?.items?.map((it) => ({
                name: it.particulars,
                qty: Number(it.qty || 0),
                price: Number(it.unitPrice || 0),
                total: Number(it.total || 0)
              })) || [],
            calculations: {
              subtotal: Number(backendData?.calculations?.subtotal || 0),
              totalTax: Number(backendData?.calculations?.totalTax || 0),
              discountAmount: Number(backendData?.calculations?.discountAmount || 0),
              grandTotal: Number(backendData?.calculations?.grandTotal || row.amount || 0),
              outstanding: Number(row.outstanding || 0)
            },
            date: backendData?.po_date || row.date,
            purchaseType: row.purchase_type,
            backendResponse: backendData
          }
        }
      });
    } catch (err) {
      console.error("Failed to load purchase order preview:", err);
      navigate("/admin/purchases/invoice-preview", {
        state: {
          id: row.id,
          saleData: row
        }
      });
    }
  };

  const openPayModal = (row) => {
    setSelectedPurchase(row);
    setPayAmount("");
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNote("");
    setShowPayModal(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();

    if (!selectedPurchase) return;

    const amount = Number(payAmount || 0);

    if (!amount || amount <= 0) {
      alert("Enter a valid payment amount");
      return;
    }

    if (amount > Number(selectedPurchase.outstanding || 0)) {
      alert("Amount exceeds outstanding balance");
      return;
    }

    setPayLoading(true);

    try {
      const payload = {
        date: payDate || new Date().toISOString().slice(0, 10),
        amount,
        note: payNote || "Payment via UI"
      };

      const res = await API.post(`purchases/${selectedPurchase.id}/payments/`, payload);
      const data = res?.data ?? {};

      setPurchases((prev) =>
        prev.map((p) =>
          p.id === selectedPurchase.id
            ? {
                ...p,
                paid_amount: Number(data.paid_amount ?? p.paid_amount ?? 0),
                outstanding_amount: Math.max(Number(data.outstanding_amount ?? p.outstanding_amount ?? 0), 0),
                status: String(data.status ?? p.status ?? "UNPAID").toUpperCase()
              }
            : p
        )
      );

      setShowPayModal(false);
      setSelectedPurchase(null);
      setPayAmount("");
      setPayDate("");
      setPayNote("");
    } catch (err) {
      console.error("Payment failed:", err);

      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Payment failed";

      alert(msg);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="salesList-page">
      <div className="SalesListSum-wrapper">
        <div className="salesList-header">
          <div>
            <h2>Purchases Management</h2>
            <p>Manage purchase orders, invoices, suppliers, and receipts</p>
          </div>
          <button
            className="salesList-primaryBtn"
            onClick={() =>
              navigate("/admin/purchases/modules/add", {
                state: { backgroundLocation: location }
              })
            }
          >
            <FiPlus /> New Purchase Order
          </button>
        </div>

        <div className="salesList-summaryFilter">
          <select
            value={summaryYear}
            onChange={(e) => setSummaryYear(e.target.value)}
            className="salesListCard-select"
          >
            <option value="All">All</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <select
            value={summaryRange}
            onChange={(e) => setSummaryRange(e.target.value)}
            className="salesListCardMonth-select"
          >
            <option value="Today">Today</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
            <option value="Custom">Custom Range</option>
          </select>
        </div>

        <div className="salesList-summaryGrid">
          <SummaryCard label="Total Purchases" value={summary.totalPurchases} type="blue" />
          <SummaryCard label="Purchases Due" value={summary.totalDue} type="orange" />
          <SummaryCard label="Invoices" value={summary.invoices} type="green" />
          <SummaryCard label="Overdue" value={summary.overdue} type="red" />
        </div>
      </div>

      <div className="salesList-tabs">
        <NavLink
          to="/admin/purchases/list"
          className={({ isActive }) => (isActive ? "salesList-tab active" : "salesList-tab")}
        >
          Purchase Order
        </NavLink>

        <NavLink
          to="/admin/purchases/invoice"
          className={({ isActive }) => (isActive ? "salesList-tab active" : "salesList-tab")}
        >
          Purchase Invoice
        </NavLink>

        <NavLink
          to="/admin/purchases/credit"
          className={({ isActive }) => (isActive ? "salesList-tab active" : "salesList-tab")}
        >
          Credit Purchases
        </NavLink>

        <NavLink
          to="/admin/purchases/overdue"
          className={({ isActive }) => (isActive ? "salesList-tab active" : "salesList-tab")}
        >
          Overdue
        </NavLink>
      </div>

      <div className="salesList-tableCard">
        <div className="salesList-tableFilters">
          <input
            className="salesList-input"
            placeholder="AC Code"
            value={acCode}
            onChange={(e) => setAcCode(e.target.value)}
          />

          <input
            className="salesList-input"
            placeholder="Invoice Number"
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
          />

          <input
            className="salesList-input"
            placeholder="Supplier Name"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />

          <input
            className="salesList-input"
            placeholder="Search anything..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="salesList-select"
            value={tableYear}
            onChange={(e) => setTableYear(e.target.value)}
          >
            <option value="All">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

        <div className="salesList-tableWrapper">
          <table className="salesList-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Code</th>
                <th>Invoice</th>
                <th>Supplier</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.acCode}</td>
                  <td>{row.invoice}</td>
                  <td>{row.supplier}</td>
                  <td>{row.product}</td>
                  <td className="text-right">{row.amount.toLocaleString()}</td>
                  <td className="text-right">{row.paid.toLocaleString()}</td>
                  <td className="text-right">{row.outstanding.toLocaleString()}</td>
                  <td>
                    <span className={`salesList-status ${String(row.status || "unpaid").toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="salesList-actions">
                    <button
                      className="view-btn small-btn"
                      onClick={() => handleView(row)}
                      title="View invoice"
                    >
                      <FiEye />
                    </button>

                    <button
                      className="print-btn small-btn"
                      onClick={() => window.print()}
                      title="Print"
                    >
                      <FiPrinter />
                    </button>

                    <button
                      className="pay-btn small-btn"
                      onClick={() => openPayModal(row)}
                      title="Make payment"
                      disabled={row.outstanding <= 0}
                      style={{
                        backgroundColor: row.outstanding <= 0 ? "#9ca3af" : "#0f9d58",
                        color: "#fff",
                        borderRadius: 8,
                        padding: "6px 8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginLeft: 6,
                        border: "none",
                        cursor: row.outstanding <= 0 ? "not-allowed" : "pointer"
                      }}
                    >
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

              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
                    No purchases found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="salesList-pagination">
          <select
            value={rowsPerPage}
            onChange={(e) => {
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
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </button>

            <button className="active">{currentPage}</button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showPayModal && selectedPurchase && (
        <div className="modal-backdrop" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Pay Purchase</h3>
            <form onSubmit={handlePaySubmit} className="modal-form">
              <label>
                Date
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </label>

              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={String(selectedPurchase.outstanding || 0)}
                />
              </label>

              <label>
                Note
                <input
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Payment reference"
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowPayModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={payLoading}>
                  {payLoading ? "Processing..." : "Pay"}
                </button>
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