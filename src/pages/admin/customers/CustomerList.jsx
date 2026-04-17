// src/pages/admin/Customers/CustomerList.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerList.css";
import { FiPlus, FiSearch, FiEye } from "react-icons/fi";
import { getCustomers, createCustomer } from "../../../services/CustomerService";
import API from "../../../services/api"; // optional: for debugging/extra lookups

const MOCK_CUSTOMERS = [
  { code: "CU0001", name: "Walk-in customer", location: "Dar es Salaam", phone: "255700000000", email: "walkin@example.com", totalDue: 333175.7, totalPaid: 333175.7, status: "active", isNew: false },
  { code: "CU0002", name: "John P", location: "Moshi", phone: "97788754544", email: "john@gmail.com", totalDue: 1100.0, totalPaid: 0.0, status: "active", isNew: true },
  { code: "CU0003", name: "Chris Moris", location: "Arusha", phone: "845457454545", email: "chris@gmail.com", totalDue: 0.0, totalPaid: 0.0, status: "inactive", isNew: false },
  { code: "CU0004", name: "Moin", location: "Dar es Salaam", phone: "97545775454", email: "moin@yahoo.com", totalDue: 1100.0, totalPaid: 1100.0, status: "active", isNew: false },
  { code: "CU0005", name: "Sundar", location: "Tanga", phone: "98475454544", email: "sunadar@gmail.com", totalDue: 0.0, totalPaid: 11000.0, status: "active", isNew: true },
  { code: "CU0006", name: "Santosh", location: "Dodoma", phone: "9584645454", email: "santosh@gmail.com", totalDue: 0.0, totalPaid: 0.0, status: "inactive", isNew: false },
  { code: "CU0007", name: "Vinit Hiremath", location: "Zanzibar", phone: "866022565988", email: "vinit@gmail.com", totalDue: 660.0, totalPaid: 660.0, status: "active", isNew: false }
];

export default function CustomerList() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [createErrors, setCreateErrors] = useState(null);

  const [newCustomer, setNewCustomer] = useState({
    id: null,
    code: "",
    name: "",
    location: "",
    phone: "",
    email: "",
    address: "",
    tin: "",
    vrn: "",
    receivable_account: "",
    receivable_account_code: "",
    balance: 0,
    status: "active"
  });

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      // some APIs return { results: [...] }, some return array directly
      if (res?.data?.results && Array.isArray(res.data.results)) {
        setCustomers(res.data.results);
      } else if (Array.isArray(res?.data)) {
        setCustomers(res.data);
      } else if (Array.isArray(res?.data?.customers)) {
        setCustomers(res.data.customers);
      } else {
        // fallback if shape unexpected but object contains list somewhere
        console.warn("Unexpected customers response shape, falling back if possible", res.data);
        // try results, then data, else mock
        setCustomers(res.data.results || res.data || MOCK_CUSTOMERS);
      }
    } catch (err) {
      console.error("API failed, using mock customers", err);
      setCustomers(MOCK_CUSTOMERS);
    }
  };

  const summary = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === "active").length;
    const inactive = customers.filter(c => c.status !== "active").length;
    const newCustomers = customers.filter(c => c.isNew).length;
    return { total, active, inactive, newCustomers };
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter(c => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (c.code || "").toLowerCase().includes(q) ||
        (c.name || "").toLowerCase().includes(q) ||
        ((c.location || "")).toLowerCase().includes(q) ||
        ((c.phone || "")).toLowerCase().includes(q) ||
        ((c.email || "")).toLowerCase().includes(q)
      );
    });
  }, [customers, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageData = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const pageTotals = useMemo(() => {
    return pageData.reduce(
      (acc, r) => {
        acc.totalDue += Number(r.totalDue || 0);
        acc.totalPaid += Number(r.totalPaid || 0);
        return acc;
      },
      { totalDue: 0, totalPaid: 0 }
    );
  }, [pageData]);

  const goNewCustomer = () => setShowAddCustomer(true);

  const handleViewAccount = (customer) => {
    const id = customer.id || customer.pk;

    if (!id) {
      console.error("❌ Customer has no ID:", customer);
      alert("Customer ID missing — check backend data");
      return;
    }

    navigate(`/admin/customers/account/${id}`);
  };

  const onRowsChange = (val) => {
    setRowsPerPage(Number(val));
    setPage(1);
  };

  const handleCustomerInput = (field, value) => {
    setNewCustomer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ---- FIXED: use backend createCustomer (axios) so request goes to backend baseURL and includes auth header ----
  const handleSaveCustomer = async () => {
    if (!newCustomer.name) return;

    // clear previous errors
    setCreateErrors(null);

    // Build a minimal payload first (safer — many DRF serializers accept minimal fields)
    const minimalPayload = {
      name: newCustomer.name,
    };
    if (newCustomer.code) minimalPayload.code = newCustomer.code;
    if (newCustomer.phone) minimalPayload.phone = newCustomer.phone;
    if (newCustomer.email) minimalPayload.email = newCustomer.email;
    // Do NOT include receivable_account unless you can pass a numeric PK that exists.
    // Do NOT include status if you're not sure which choice values are valid.

    try {
      // Attempt create with minimal safe payload
      const res = await createCustomer(minimalPayload); // uses axios + baseURL + Authorization
      // success — reload authoritative list from server
      await loadCustomers();
      // optionally notify success
      console.log("Customer created:", res.data);
    } catch (err) {
      // If server responded with validation errors, show them
      if (err?.response?.data) {
        console.error("Create customer failed:", err.response.data);
        setCreateErrors(err.response.data);
      } else {
        // Network or unexpected error — fallback to local insertion as before
        console.error("API save failed, using local fallback", err);
        const code = newCustomer.code || "CU" + Math.floor(Math.random() * 9000 + 1000);
        const tableCustomer = {
          code,
          name: newCustomer.name,
          location: newCustomer.location,
          phone: newCustomer.phone,
          email: newCustomer.email,
          totalDue: 0,
          totalPaid: 0,
          status: newCustomer.status,
          isNew: true
        };
        setCustomers(prev => [tableCustomer, ...prev]);
      }
    }

    setShowAddCustomer(false);
    setPage(1);

    setNewCustomer({
      id: null,
      code: "",
      name: "",
      location: "",
      phone: "",
      email: "",
      address: "",
      tin: "",
      vrn: "",
      receivable_account: "",
      receivable_account_code: "",
      balance: 0,
      status: "active"
    });
  };

  return (
    <div className="customerList-page">
      <div className="customerList-headerWrap">
        <div className="customerList-titleBlock">
          <h2>Customers List</h2>
          <p className="muted">Manage your customers, payments and account balances</p>
        </div>

        <div className="customerList-actions">
          <button className="btn primary newCustomerBtn" onClick={goNewCustomer}>
            <FiPlus /> New Customer
          </button>
        </div>
      </div>

      <div className="customerList-summary">
        <div className="cusummaryCard">
          <div className="cusummaryLabel">Total Customers</div>
          <div className="cusummaryValue">{summary.total}</div>
        </div>

        <div className="cusummaryCard">
          <div className="cusummaryLabel">Active Customers</div>
          <div className="cusummaryValue">{summary.active}</div>
        </div>

        <div className="cusummaryCard">
          <div className="cusummaryLabel">Inactive Customers</div>
          <div className="cusummaryValue">{summary.inactive}</div>
        </div>

        <div className="cusummaryCard">
          <div className="cusummaryLabel">New Customers</div>
          <div className="cusummaryValue">{summary.newCustomers}</div>
        </div>
      </div>

      <div className="customerList-filters">
        <div className="filter-left">
          <div className="searchBox">
            <FiSearch />
            <input
              placeholder="Search by code, name, phone, email or location..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="filter-right">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select value={rowsPerPage} onChange={(e) => onRowsChange(e.target.value)}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      <div className="customerList-tableWrap">
        <div className="table-scroll">
          <table className="customerList-table">
            <thead>
              <tr>
                <th>CODE</th>
                <th>Customer name</th>
                <th>Location</th>
                <th>Phone</th>
                <th className="text-right">Total Due</th>
                <th className="text-right">Total Paid</th>
                <th className="text-right">Balance</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {pageData.map(c => {
                const due = Number(c.totalDue || 0);
                const paid = Number(c.totalPaid || 0);
                const balance = due - paid;

                return (
                  <tr key={c.id || c.code}>
                    <td>{c.code}</td>
                    <td>{c.name}</td>
                    <td>{c.location}</td>
                    <td>{c.phone}</td>
                    <td className="text-right">{due.toLocaleString()}</td>
                    <td className="text-right">{paid.toLocaleString()}</td>
                    <td className="text-right">{balance.toLocaleString()}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-view" onClick={() => handleViewAccount(c)}>
                          <FiEye /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="totalsRow">
                <td colSpan={4}><strong>Page Totals</strong></td>
                <td className="text-right"><strong>{pageTotals.totalDue.toLocaleString()}</strong></td>
                <td className="text-right"><strong>{pageTotals.totalPaid.toLocaleString()}</strong></td>
                <td className="text-right"><strong>{(pageTotals.totalDue - pageTotals.totalPaid).toLocaleString()}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="customerList-pagination">
        <div>
          Showing {(filtered.length === 0) ? 0 : (page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} entries
        </div>

        <div className="pagination-controls">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
          <span className="page-indicator">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>

      {showAddCustomer && (
        <div className="customerModal-overlay">
          <div className="customerModal-card">
            <div className="customerModal-header">
              <h3>Add New Customer</h3>
            </div>

            <div className="customerModal-body">
              <div className="customerModal-row">
                <label>Customer Code</label>
                <input value={newCustomer.code} onChange={(e)=>handleCustomerInput("code",e.target.value)} />
              </div>

              <div className="customerModal-row">
                <label>Customer Name</label>
                <input value={newCustomer.name} onChange={(e)=>handleCustomerInput("name",e.target.value)} />
              </div>

              <div className="customerModal-row">
                <label>Location</label>
                <input value={newCustomer.location} onChange={(e)=>handleCustomerInput("location",e.target.value)} />
              </div>

              <div className="customerModal-row">
                <label>Phone</label>
                <input value={newCustomer.phone} onChange={(e)=>handleCustomerInput("phone",e.target.value)} />
              </div>

              <div className="customerModal-row">
                <label>Email</label>
                <input value={newCustomer.email} onChange={(e)=>handleCustomerInput("email",e.target.value)} />
              </div>

              <div className="customerModal-row">
                <label>Address</label>
                <input value={newCustomer.address} onChange={(e)=>handleCustomerInput("address",e.target.value)} />
              </div>

              <div className="customerModal-row">
                <label>TIN</label>
                <input value={newCustomer.tin} onChange={(e)=>handleCustomerInput("tin",e.target.value)} />
              </div>

              <div className="customerModal-row">
                <label>VRN</label>
                <input value={newCustomer.vrn} onChange={(e)=>handleCustomerInput("vrn",e.target.value)} />
              </div>

              <div className="customerModal-row">
                <label>Receivable Account</label>
                <input value={newCustomer.receivable_account} onChange={(e)=>handleCustomerInput("receivable_account",e.target.value)} />
              </div>

              <div className="customerModal-row">
                <label>Receivable Account Code</label>
                <input value={newCustomer.receivable_account_code} onChange={(e)=>handleCustomerInput("receivable_account_code",e.target.value)} />
              </div>

              <div className="customerModal-row">
                <label>Balance</label>
                <input type="number" value={newCustomer.balance} onChange={(e)=>handleCustomerInput("balance",e.target.value)} />
              </div>

              <div className="customerModal-row">
                <label>Status</label>
                <select value={newCustomer.status} onChange={(e)=>handleCustomerInput("status",e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="customerModal-actions">
              <button className="btn" onClick={()=>setShowAddCustomer(false)}>Cancel</button>
              <button className="btn primary" onClick={handleSaveCustomer}>Save Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 