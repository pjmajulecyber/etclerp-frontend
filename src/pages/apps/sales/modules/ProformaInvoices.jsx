import "./proformaIvoice.css";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { FiPlus, FiEye } from "react-icons/fi";

export default function ProformaList() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ================= STORAGE ================= */

  const [proformas, setProformas] = useState(() => {
    try {
      const stored = sessionStorage.getItem("proforma_list");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return []; // no mock data
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("proforma_list", JSON.stringify(proformas));
    } catch (e) {}
  }, [proformas]);

  /* ================= RECEIVE NEW PROFORMA ================= */

  useEffect(() => {
    const state = location.state || {};
    const candidate =
      state.newProforma || state.createdProforma || state.proforma;

    if (candidate && typeof candidate === "object") {
      const id = Date.now();
      const amount = Number(candidate.amount || candidate.total || 0);

      const newRow = {
        id,
        acCode: candidate.acCode || `AC${String(id).slice(-3)}`,
        invoice: candidate.invoice || `PF${String(id).slice(-6)}`,
        customer: candidate.customer || "Unknown",
        amount,
        year: new Date().getFullYear().toString(),
        date: candidate.date || new Date().toISOString().slice(0, 10),
        product: candidate.product || "Proforma Item",
        status: "Draft"
      };

      setProformas(prev => [newRow, ...prev]);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  /* ================= FILTERING ================= */

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return proformas.filter(p =>
      JSON.stringify(p).toLowerCase().includes(search.toLowerCase())
    );
  }, [search, proformas]);

  const totalAmount = filtered.reduce(
    (a, b) => a + Number(b.amount || 0),
    0
  );

  /* ================= NAVIGATION ================= */

  const goToPreview = (row) => {
    navigate("/admin/sales/proform-preview", {
      state: {
        invoiceNumber: row.invoice,
        customer: { code: row.acCode, name: row.customer },
        items: [{ name: row.product, price: row.amount, qty: 1 }],
        calculations: {
          subtotal: row.amount,
          grandTotal: row.amount
        },
        date: row.date,
        type: "Proforma"
      }
    });
  };

  /* ================= UI ================= */

  return (
    <div className="proforma-page">

      <div className="SalesListSum-wrapper">
        <div className="salesList-header">
          <div>
            <h2>Proforma Management</h2>
            <p>Create and manage proforma invoices</p>
          </div>

          <button
            className="salesList-primaryBtn"
            onClick={() =>
              navigate("/admin/sales/modules/add-proforma", {
                state: { backgroundLocation: location }
              })
            }
          >
            <FiPlus /> Create Proforma
          </button>
        </div>

        <div className="salesList-summaryGrid">
          <SummaryCard label="Total Proformas" value={filtered.length} type="blue" />
          <SummaryCard label="Total Value" value={totalAmount} type="green" />
          <SummaryCard label="Draft" value={filtered.length} type="orange" />
          <SummaryCard label="Converted" value={0} type="red" />
        </div>
      </div>

      {/* Tabs identical style */}
      <div className="salesList-tabs">
        <NavLink to="/admin/sales/list" className="salesList-tab">Sales Order</NavLink>
        <NavLink to="/admin/sales/invoice" className="salesList-tab">Invoice</NavLink>
        <NavLink to="/admin/sales/proforma" className={({isActive}) =>
          isActive ? "salesList-tab active" : "salesList-tab"
        }>Proforma</NavLink>
      </div>

      <div className="salesList-tableCard">
        <div className="salesList-tableFilters">
          <input
            className="salesList-input"
            placeholder="Search Proforma..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="salesList-tableWrapper">
          <table className="salesList-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Code</th>
                <th>Proforma No</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.acCode}</td>
                  <td>{row.invoice}</td>
                  <td>{row.customer}</td>
                  <td>{row.product}</td>
                  <td className="text-right">
                    {Number(row.amount || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className="salesList-status partial">
                      {row.status}
                    </span>
                  </td>
                  <td className="salesList-actions">
                    <button
                      className="icon-btn view"
                      onClick={() => goToPreview(row)}
                    >
                      <FiEye />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length > 0 && (
                <tr className="salesList-totalRow">
                  <td colSpan="5"><strong>Total</strong></td>
                  <td className="text-right">
                    <strong>{totalAmount.toLocaleString()}</strong>
                  </td>
                  <td colSpan="2"></td>
                </tr>
              )}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty">
                    No Proforma Created Yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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