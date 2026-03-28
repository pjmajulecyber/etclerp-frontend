

// src/pages/admin/purchases/PurchasesList.jsx
import "./Purchases.css";
import { NavLink } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import API from "./../../../services/api";
import {
  FiPlus,
  FiSearch,
  FiEye,
  FiPrinter,
  FiDollarSign
} from "react-icons/fi";

const MOCK_PURCHASES = [
  {
    id: 1,
    invoice_number: "INV0001",
    supplier_name: "Shanta Gold",
    purchase_type: "HFO",
    total_amount: 250000,
    paid_amount: 150000,
    outstanding_amount: 100000,
    date: "2026-01-10",
    status: "PARTIAL"
  }
];

export default function PurchasesList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [purchases, setPurchases] = useState([]);

  const [acCode, setAcCode] = useState("");
  const [invoice, setInvoice] = useState("");
  const [customer, setCustomer] = useState("");
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
      if (res.data?.results) {
        setPurchases(res.data.results);
      } else {
        setPurchases(MOCK_PURCHASES);
      }
    } catch (err) {
      console.error("Purchases API failed, using mock data:", err);
      setPurchases(MOCK_PURCHASES);
    }
  };

  const salesData = useMemo(() => {
    return purchases.map(p => ({
      id: p.id,
      acCode: `AC${String(p.id).padStart(3, "0")}`,
      invoice: p.invoice_number,
      customer: p.supplier_name,
      amount: Number(p.total_amount || 0),
      paid: Number(p.paid_amount || 0),
      outstanding: Number(p.outstanding_amount || 0),
      year: p.date?.slice(0,4),
      date: p.date,
      product: p.product || "",
      status: p.status
    }));
  }, [purchases]);

  const summary = useMemo(() => {
    const filtered = salesData.filter(s => s.year === summaryYear);
    return {
      totalSales: filtered.reduce((a,b)=>a+b.amount,0),
      totalDue: filtered.reduce((a,b)=>a+b.outstanding,0),
      invoices: filtered.length,
      overdue: filtered.filter(s=>s.outstanding>0).length
    };
  }, [salesData, summaryYear, summaryRange]);

  const filteredTable = useMemo(() => {
    return salesData.filter(s =>
      (tableYear === "All" || s.year === tableYear) &&
      s.acCode.toLowerCase().includes(acCode.toLowerCase()) &&
      s.invoice.toLowerCase().includes(invoice.toLowerCase()) &&
      s.customer.toLowerCase().includes(customer.toLowerCase()) &&
      JSON.stringify(s).toLowerCase().includes(search.toLowerCase())
    );
  }, [salesData, acCode, invoice, customer, tableYear, search]);

  const totalPages = Math.ceil(filteredTable.length / rowsPerPage);
  const paginatedData = filteredTable.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const pageTotals = paginatedData.reduce(
    (acc,row)=>{
      acc.amount += row.amount;
      acc.paid += row.paid;
      acc.outstanding += row.outstanding;
      return acc;
    },
    { amount:0, paid:0, outstanding:0 }
  );

  const handleView = (row) => {
    navigate("/admin/purchases/invoice-preview", {
      state: row 
    });
  };

  const openPayModal = (row) => {
    setSelectedPurchase(row);
    setPayAmount(""); 
    setPayDate(new Date().toISOString().slice(0,10));
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
    setPayLoading(true);

    try {
      const payload = {
        date: payDate || new Date().toISOString().slice(0,10),
        amount,
        note: payNote || "Payment via UI"
      };

      try {
        // try to post to a reasonable payments endpoint
        await API.post(`purchases/${selectedPurchase.id}/payments/`, payload);
      } catch (err) {
        console.warn("payments endpoint failed or not present:", err);
      }

      setPurchases(prev => prev.map(p => {
        if (p.id === selectedPurchase.id) {
          const newPaid = (Number(p.paid_amount || p.paid || 0) + amount);
          const newOutstanding = Math.max(0, (Number(p.outstanding_amount || p.outstanding || 0) - amount));
          return {
            ...p,
            paid_amount: newPaid,
            outstanding_amount: newOutstanding
          };
        }
        return p;
      }));

      setShowPayModal(false);
      setSelectedPurchase(null);
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
            onChange={e=>setSummaryYear(e.target.value)}
            className="salesListCard-select"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <select
            value={summaryRange}
            onChange={e=>setSummaryRange(e.target.value)}
            className="salesListCardMonth-select"
          >
            <option value="Today">Today</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
            <option value="Custom">Custom Range</option>
          </select>
        </div>

        <div className="salesList-summaryGrid">
          <SummaryCard label="Total Purchases" value={summary.totalSales} type="blue"/>
          <SummaryCard label="Purchases Due" value={summary.totalDue} type="orange"/>
          <SummaryCard label="Invoices" value={summary.invoices} type="green"/>
          <SummaryCard label="Overdue" value={summary.overdue} type="red"/>
        </div>
      </div>

      <div className="salesList-tabs">
        <NavLink to="/admin/sales/list" className={({isActive}) =>
          isActive ? "salesList-tab active" : "salesList-tab"
        }>Purchase Order</NavLink>

        <NavLink to="/admin/sales/invoice" className={({isActive}) =>
          isActive ? "salesList-tab active" : "salesList-tab"
        }>Purchase Invoice</NavLink>

        <NavLink to="/admin/sales/quotation" className={({isActive}) =>
          isActive ? "salesList-tab active" : "salesList-tab"
        }>Purchase Quotation</NavLink>

        <NavLink to="/admin/sales/overdue" className={({isActive}) =>
          isActive ? "salesList-tab active" : "salesList-tab"
        }>Overdue</NavLink>
      </div>

      <div className="salesList-tableCard">

        <div className="salesList-tableFilters">

          <input
            className="salesList-input"
            placeholder="AC Code"
            value={acCode}
            onChange={e=>setAcCode(e.target.value)}
          />

          <input
            className="salesList-input"
            placeholder="Invoice Number"
            value={invoice}
            onChange={e=>setInvoice(e.target.value)}
          />

          <input
            className="salesList-input"
            placeholder="Supplier Name"
            value={customer}
            onChange={e=>setCustomer(e.target.value)}
          />

          <select
            className="salesList-select"
            value={tableYear}
            onChange={e=>setTableYear(e.target.value)}
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
              {paginatedData.map(row=>(
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.acCode}</td>
                  <td>{row.invoice}</td>
                  <td>{row.customer}</td>
                  <td>{row.product}</td>
                  <td className="text-right">{row.amount.toLocaleString()}</td>
                  <td className="text-right">{row.paid.toLocaleString()}</td>
                  <td className="text-right">{row.outstanding.toLocaleString()}</td>
                  <td>
                    <span className={`salesList-status ${row.status.toLowerCase()}`}>
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
                      onClick={() => { window.print(); }}
                      title="Print"
                    >
                      <FiPrinter />
                    </button>

                    <button
                      className="pay-btn small-btn"
                      onClick={() => openPayModal(row)}
                      title="Make payment"
                      style={{
                        backgroundColor: "#0f9d58",
                        color: "#fff",
                        borderRadius: 8,
                        padding: "6px 8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginLeft: 6,
                        border: "none",
                        cursor: "pointer"
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
            </tbody>
          </table>
        </div>

        <div className="salesList-pagination">
          <select
            value={rowsPerPage}
            onChange={e=>{
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
            <button disabled={currentPage===1}
              onClick={()=>setCurrentPage(p=>p-1)}>Previous</button>

            <button className="active">{currentPage}</button>

            <button disabled={currentPage===totalPages}
              onClick={()=>setCurrentPage(p=>p+1)}>Next</button>
          </div>
        </div>

      </div>

      {showPayModal && selectedPurchase && (
        <div className="modal-backdrop" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Pay Purchase</h3>
            <form onSubmit={handlePaySubmit} className="modal-form">
              <label>
                Date
                <input
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                />
              </label>

              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder={selectedPurchase.outstanding.toString()}
                />
              </label>

              <label>
                Note
                <input
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  placeholder="e.g. Payment reference"
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPayModal(false)}>Cancel</button>
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

function SummaryCard({label,value,type}) {
  return (
    <div className={`salesList-card ${type}`}>
      <p>{label}</p>
      <h3>{Number(value||0).toLocaleString()}</h3>
    </div>
  );
}