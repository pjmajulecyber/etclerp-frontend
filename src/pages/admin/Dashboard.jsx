


// src/pages/admin/Dashboard.jsx
import "./Dashboard.css";
import { useState, useEffect } from "react";
import {
  FiArrowUp,
  FiArrowDown,
  FiChevronDown,
  FiSearch
} from "react-icons/fi";

/* ===============================
   API SERVICES
================================ */

const API_BASE = import.meta.env.VITE_API_BASE || "";

const getAuthToken = () => {
  return localStorage.getItem("token") || null;
};

const apiRequest = async (url, options = {}) => {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} ${response.statusText} ${text}`);
  }

  return response.json();
};

/* ===============================
   DASHBOARD API SERVICES
================================ */

const dashboardService = {
  getSummary: (year, period, signal) =>
    apiRequest(`/api/dashboard/summary?year=${year}&period=${period}`, { signal }),

  getStockStatus: (year, signal) =>
    apiRequest(`/api/dashboard/stock-status?year=${year}`, { signal }),

  getPendingExpenses: (year, signal) =>
    apiRequest(`/api/dashboard/pending-expenses?year=${year}`, { signal }),

  getWasteOilStock: (year, signal) =>
    apiRequest(`/api/dashboard/waste-oil-stock?year=${year}`, { signal }),

  getCustomerStatements: (year, signal) =>
    apiRequest(`/api/dashboard/customer-statements?year=${year}`, { signal }),

  getDocuments: (year, signal) =>
    apiRequest(`/api/dashboard/documents?year=${year}`, { signal })
};

/* ===============================
   COMPONENT
================================ */

export default function Dashboard() {
  const [year, setYear] = useState("2026");
  const [period, setPeriod] = useState("Year");

  const [docCategory, setDocCategory] = useState("All");
  const [docYear, setDocYear] = useState("All");
  const [docStatus, setDocStatus] = useState("All");
  const [docSearch, setDocSearch] = useState("");

  const [summaryValues, setSummaryValues] = useState(null);
  const [stockStatus, setStockStatus] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [wasteOilStock, setWasteOilStock] = useState([]);
  const [customerStatements, setCustomerStatements] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState({
    summary: false,
    lists: false
  });

  const [error, setError] = useState({
    summary: null,
    lists: null
  });

  /* ===============================
     FALLBACK DATA (UNCHANGED)
  ================================= */

  const fallbackSummary = {
    sales: 4200000,
    purchases: 2850000,
    expenses: 1150000,
    overdue: 750000,
    stock: 18400,
    employees: 42
  };

  const fallbackStockStatus = [
    { year: "2026", product: "Diesel", available: 4200, status: "Good" },
    { year: "2026", product: "Petrol", available: 1800, status: "Low" },
    { year: "2025", product: "Diesel", available: 3900, status: "Good" }
  ];

  const fallbackPendingExpenses = [
    { year: "2026", id: 1, code: "EXP-001", name: "Office Rent", amount: "1,200,000" },
    { year: "2026", id: 2, code: "EXP-002", name: "Fuel Purchase", amount: "850,000" },
    { year: "2026", id: 3, code: "EXP-003", name: "Insurance", amount: "600,000" },
    { year: "2025", id: 4, code: "EXP-004", name: "Office Rent", amount: "1,200,000" },
    { year: "2025", id: 5, code: "EXP-005", name: "Fuel Purchase", amount: "850,000" },
    { year: "2024", id: 6, code: "EXP-006", name: "Insurance", amount: "600,000" }
  ];

  const fallbackWasteOilStock = [
    { year: "2026", date: "12 May 2026", qty: 5000, type: "in" },
    { year: "2026", date: "14 May 2026", qty: 3200, type: "out" },
    { year: "2025", date: "10 April 2025", qty: 6000, type: "in" },
    { year: "2025", date: "12 May 2026", qty: 5000, type: "in" },
    { year: "2024", date: "14 May 2026", qty: 3200, type: "out" },
    { year: "2026", date: "10 April 2025", qty: 1400, type: "in" }
  ];

  const fallbackCustomerStatements = [
    { year: "2026", code: "CUS-001", name: "Alpha Logistics", outstanding: "2,400,000" },
    { year: "2026", code: "CUS-002", name: "Metro Transport", outstanding: "1,950,000" },
    { year: "2025", code: "CUS-003", name: "Prime Traders", outstanding: "1,200,000" }
  ];

  const fallbackDocuments = [
    { name: "Invoice 1023", category: "Invoice", year: "2026", status: "Valid" },
    { name: "Company Certificate", category: "Certificates", year: "2025", status: "Valid" },
    { name: "Payroll April", category: "Payrolls", year: "2026", status: "Expired" },
    { name: "Title Deed Block A", category: "Tittle deed", year: "2024", status: "Valid" }
  ];

  /* ===============================
     SUMMARY API CALL
  ================================= */

  useEffect(() => {
    const ctrl = new AbortController();

    async function loadSummary() {
      setLoading(l => ({ ...l, summary: true }));
      setError(e => ({ ...e, summary: null }));

      try {
        const data = await dashboardService.getSummary(year, period, ctrl.signal);

        setSummaryValues({
          sales: Number(data.sales || 0),
          purchases: Number(data.purchases || 0),
          expenses: Number(data.expenses || 0),
          overdue: Number(data.overdue || 0),
          stock: Number(data.stock_litres || 0),
          employees: Number(data.employees || 0)
        });

      } catch (err) {

        if (err.name !== "AbortError") {
          setError(e => ({ ...e, summary: err.message }));
          setSummaryValues(fallbackSummary);
        }

      } finally {
        setLoading(l => ({ ...l, summary: false }));
      }
    }

    loadSummary();

    return () => ctrl.abort();

  }, [year, period]);

  /* ===============================
     LIST DATA API CALLS
  ================================= */

  useEffect(() => {

    const ctrl = new AbortController();

    async function loadLists() {

      setLoading(l => ({ ...l, lists: true }));
      setError(e => ({ ...e, lists: null }));

      try {

        const [
          stockRes,
          expRes,
          wasteRes,
          custRes,
          docsRes
        ] = await Promise.all([
          dashboardService.getStockStatus(year, ctrl.signal),
          dashboardService.getPendingExpenses(year, ctrl.signal),
          dashboardService.getWasteOilStock(year, ctrl.signal),
          dashboardService.getCustomerStatements(year, ctrl.signal),
          dashboardService.getDocuments(year, ctrl.signal)
        ]);

        setStockStatus(Array.isArray(stockRes) ? stockRes : fallbackStockStatus);
        setPendingExpenses(Array.isArray(expRes) ? expRes : fallbackPendingExpenses);
        setWasteOilStock(Array.isArray(wasteRes) ? wasteRes : fallbackWasteOilStock);
        setCustomerStatements(Array.isArray(custRes) ? custRes : fallbackCustomerStatements);
        setDocuments(Array.isArray(docsRes) ? docsRes : fallbackDocuments);

      } catch (err) {

        if (err.name !== "AbortError") {

          setError(e => ({ ...e, lists: err.message }));

          setStockStatus(fallbackStockStatus);
          setPendingExpenses(fallbackPendingExpenses);
          setWasteOilStock(fallbackWasteOilStock);
          setCustomerStatements(fallbackCustomerStatements);
          setDocuments(fallbackDocuments);

        }

      } finally {

        setLoading(l => ({ ...l, lists: false }));

      }
    }

    loadLists();

    return () => ctrl.abort();

  }, [year]);

  /* ===============================
     UI DATA BUILD (UNCHANGED)
  ================================= */

  const summary = [
    {
      title: "Sales",
      value: (summaryValues ? summaryValues.sales : fallbackSummary.sales).toLocaleString(),
      unit: "TZS",
      trend: 3.4,
      color: "#16a34a"
    },
    {
      title: "Purchases",
      value: (summaryValues ? summaryValues.purchases : fallbackSummary.purchases).toLocaleString(),
      unit: "TZS",
      trend: -1.8,
      color: "#2563eb"
    },
    {
      title: "Expenses",
      value: (summaryValues ? summaryValues.expenses : fallbackSummary.expenses).toLocaleString(),
      unit: "TZS",
      trend: 2.1,
      color: "#f59e0b"
    },
    {
      title: "Overdue",
      value: (summaryValues ? summaryValues.overdue : fallbackSummary.overdue).toLocaleString(),
      unit: "TZS",
      trend: -0.9,
      color: "#dc2626"
    },
    {
      title: "Stock (Lts)",
      value: (summaryValues ? summaryValues.stock : fallbackSummary.stock).toLocaleString(),
      unit: "LTS",
      trend: 4.2,
      color: "#0f5f4f"
    },
    {
      title: "Employees",
      value: (summaryValues ? summaryValues.employees : fallbackSummary.employees),
      unit: null,
      trend: 1.5,
      color: "#7c3aed"
    }
  ];

  /* ===============================
     ORIGINAL JSX CONTINUES BELOW
     (UNCHANGED)
  ================================= */

  const filteredStock = stockStatus;
  const filteredExpenses = pendingExpenses;
  const filteredWasteOil = wasteOilStock;
  const filteredCustomers = customerStatements;

  const filteredDocuments = (documents || []).filter(doc => {
    const matchCategory = docCategory === "All" || doc.category === docCategory;
    const matchYear = docYear === "All" || doc.year === docYear;
    const matchStatus = docStatus === "All" || doc.status === docStatus;
    const matchSearch = doc.name.toLowerCase().includes(docSearch.toLowerCase());
    return matchCategory && matchYear && matchStatus && matchSearch;
  });
 

  return (
    <div className="dashboard">
      <div className="dashboard-wrapper">

        <div className="dashboardHeader-wrapper">
          <div className="dashboard-header">
            <div>
              <h2>Good Day, Team 👋</h2>
              <p>Here’s what’s happening with your business.</p>
            </div>

            <div className="header-actions">
              <div className="dashboard-dropdown">
                <button className="dashboard-dropdown-btn">
                  {year} <FiChevronDown />
                </button>
                <div className="dashboard-dropdown-menu">
                  <div onClick={() => setYear("2024")}>2024</div>
                  <div onClick={() => setYear("2025")}>2025</div>
                  <div onClick={() => setYear("2026")}>2026</div>
                </div>
              </div>

              <div className="dashboard-dropdown">
                <button className="dashboard-dropdown-btn">
                  {period} <FiChevronDown />
                </button>
                <div className="dashboard-dropdown-menu">
                  <div onClick={() => setPeriod("Today")}>Today</div>
                  <div onClick={() => setPeriod("Week")}>Week</div>
                  <div onClick={() => setPeriod("Month")}>Month</div>
                  <div onClick={() => setPeriod("Year")}>Year</div>
                </div>
              </div>

              <button className="export-btn">Export Data</button>
            </div>
          </div>
        </div>

        <div className="dashboardCard-wrapper">
          <div className="dssummary-grid">
            {summary.map((item, index) => (
              <div key={index} className="dssummary-card" style={{ backgroundColor: `${item.color}50` }}>
                <h4>{item.title}</h4>
                <div className="dssummary-value-row">
                  {item.unit && <span className="dscurrency-tag">{item.unit}</span>}
                  <h2 className="dssummary-value">{item.value}</h2>
                </div>
                <div className={`trend ${item.trend >= 0 ? "up" : "down"}`}>
                  {item.trend >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                  {Math.abs(item.trend)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="table-grid-2">
          <div className="card">
            <div className="card-header">
              <h3>Stock Status</h3>
              <button className="action-btn">Track</button>
            </div>
            <div className="table-scroll">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Available</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.map((item, i) => (
                      <tr key={i}>
                        <td>{item.product}</td>
                        <td>{item.available} Lts</td>
                        <td>
                          <span className={`status ${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card wide-card">
            <div className="card-header">
              <h3>Pending Expenses</h3>
            </div>
            <div className="table-scroll">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Ac/Code</th>
                      <th>Name</th>
                      <th>Amount (TZS)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td>{exp.code}</td>
                        <td>{exp.name}</td>
                        <td>{exp.amount}</td>
                        <td className="action-cell">
                          <button className="view-btn small-btn">View</button>
                          <button className="approve small-btn">Approve</button>
                          <button className="decline small-btn">Decline</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="bottom-grid">
          <div className="card">
            <div className="card-header">
              <h3>Waste Oil Stock</h3>
              <button className="action-btn">Track Stock</button>
            </div>
            <div className="table-scroll">
              <div className="table-responsive">
                <table>
                  <tbody>
                    {filteredWasteOil.map((item, i) => (
                      <tr key={i}>
                        <td>{item.date}</td>
                        <td>
                          {item.type === "in" ? (
                            <span className="stock-in">
                              <FiArrowUp /> {item.qty} Lts
                            </span>
                          ) : (
                            <span className="stock-out">
                              <FiArrowDown /> {item.qty} Lts
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Customer Statements</h3>
            </div>
            <div className="table-scroll">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Ac/Code</th>
                      <th>Name</th>
                      <th>Amount (TZS)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((c, i) => (
                      <tr key={i}>
                        <td>{c.code}</td>
                        <td>{c.name}</td>
                        <td>{c.outstanding}</td>
                        <td>
                          <button className="view-btn small-btn">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="card document-card">
          <div className="card-header">
            <h3>Documents Track</h3>
          </div>

          <div className="document-filters">
            <select onChange={(e) => setDocCategory(e.target.value)}>
              <option value="All">All Categories</option>
              <option value="Invoice">Invoice</option>
              <option value="Certificates">Certificates</option>
              <option value="Statements">Statements</option>
              <option value="Tittle deed">Tittle deed</option>
              <option value="Payrolls">Payrolls</option>
            </select>

            <select onChange={(e) => setDocYear(e.target.value)}>
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            <select onChange={(e) => setDocStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Valid">Valid</option>
              <option value="Expired">Expired</option>
            </select>

            <div className="document-search">
              <FiSearch />
              <input
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search by name, Invoice no, A/c code..."
              />
            </div>
          </div>

          <div className="table-scroll">
            <div className="table-responsive">
              <table>
                <tbody>
                  {filteredDocuments.map((doc, i) => (
                    <tr key={i}>
                      <td>{doc.name}</td>
                      <td>{doc.category}</td>
                      <td>{doc.year}</td>
                      <td>
                        <span className={`status ${doc.status.toLowerCase()}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button className="view-btn small-btn">View</button>
                        <button className="approve small-btn">Download</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div> 
          </div>
        </div>

      </div>
    </div>
  );
}
