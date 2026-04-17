

// src/pages/admin/Customers/CustomerList.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerList.css";
import { FiPlus, FiSearch, FiEye, FiCreditCard } from "react-icons/fi";
import { getCustomers, createCustomer } from "../../../services/CustomerService";
import API from "../../../services/api";

const MOCK_CUSTOMERS = [
  {
    code: "CU0001",
    name: "Walk-in customer",
    location: "Dar es Salaam",
    phone: "255700000000",
    email: "walkin@example.com",
    opening_debit: 0,
    debit: 333175.7,
    credit: 333175.7,
    balance: 0,
    status: "ACTIVE",
    isNew: false
  }
];

const normalizeCustomer = (item) => {
  const openingDebit = Number(
    item?.opening_debit ??
    item?.opening_balance ??
    0
  );

  const debit = Number(
    item?.debit ??
    item?.total_debit ??
    0
  );

  const credit = Number(
    item?.credit ??
    item?.total_credit ??
    item?.totalPaid ??
    0
  );

  const balance = Number(
    item?.balance ??
    item?.overall_balance ??
    (openingDebit + debit - credit)
  );

  return {
    id: item?.id ?? item?.pk ?? null,
    code: item?.code ?? "",
    name: item?.name ?? "",
    location: item?.location ?? item?.address ?? "",
    phone: item?.phone ?? "",
    email: item?.email ?? "",
    address: item?.address ?? "",
    tin: item?.tin ?? "",
    vrn: item?.vrn ?? "",
    receivable_account: item?.receivable_account ?? "",
    receivable_account_code: item?.receivable_account_code ?? "",
    opening_balance: Number(item?.opening_balance ?? openingDebit ?? 0),
    opening_debit: openingDebit,
    debit,
    credit,
    balance,
    status: String(item?.status ?? "ACTIVE").toUpperCase(),
    isNew: item?.isNew ?? false
  };
};

const normalizeSalesList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.sales)) return data.sales;
  return [];
};

export default function CustomerList() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState(MOCK_CUSTOMERS.map(normalizeCustomer));

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [createErrors, setCreateErrors] = useState(null);

  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSales, setCustomerSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    sale: "",
    amount: "",
    payment_method: "CASH",
    reference_number: "",
    date: new Date().toISOString().slice(0, 10),
    notes: ""
  });

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
    opening_balance: 0,
    status: "ACTIVE"
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();

      let rawList = [];

      if (res?.data?.results && Array.isArray(res.data.results)) {
        rawList = res.data.results;
      } else if (Array.isArray(res?.data)) {
        rawList = res.data;
      } else if (Array.isArray(res?.data?.customers)) {
        rawList = res.data.customers;
      } else {
        console.warn("Unexpected customers response shape:", res?.data);
        rawList = [];
      }

      setCustomers(rawList.map(normalizeCustomer));
    } catch (err) {
      console.error("API failed, using mock customers", err);
      setCustomers(MOCK_CUSTOMERS.map(normalizeCustomer));
    }
  };

  const summary = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === "ACTIVE").length;
    const inactive = customers.filter(c => c.status !== "ACTIVE").length;
    const newCustomers = customers.filter(c => c.isNew).length;
    return { total, active, inactive, newCustomers };
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return customers.filter(c => {
      if (statusFilter !== "all") {
        const normalizedStatus = statusFilter === "active" ? "ACTIVE" : "INACTIVE";
        if (c.status !== normalizedStatus) return false;
      }

      if (!q) return true;

      return (
        (c.code || "").toLowerCase().includes(q) ||
        (c.name || "").toLowerCase().includes(q) ||
        (c.location || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
      );
    });
  }, [customers, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageData = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const pageTotals = useMemo(() => {
    return pageData.reduce(
      (acc, r) => {
        acc.openingDebit += Number(r.opening_debit || 0);
        acc.debit += Number(r.debit || 0);
        acc.credit += Number(r.credit || 0);
        acc.balance += Number(r.balance || 0);
        return acc;
      },
      { openingDebit: 0, debit: 0, credit: 0, balance: 0 }
    );
  }, [pageData]);

  const goNewCustomer = () => setShowAddCustomer(true);

  const handleViewAccount = (customer) => {
    const id = customer.id || customer.pk;

    if (!id) {
      console.error("Customer has no ID:", customer);
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

  const handleSaveCustomer = async () => {
    if (!newCustomer.name) return;

    setCreateErrors(null);

    const minimalPayload = {
      name: newCustomer.name,
    };

    if (newCustomer.code) minimalPayload.code = newCustomer.code;
    if (newCustomer.phone) minimalPayload.phone = newCustomer.phone;
    if (newCustomer.email) minimalPayload.email = newCustomer.email;
    if (newCustomer.address) minimalPayload.address = newCustomer.address;
    if (newCustomer.tin) minimalPayload.tin = newCustomer.tin;
    if (newCustomer.vrn) minimalPayload.vrn = newCustomer.vrn;
    if (newCustomer.opening_balance) {
      minimalPayload.opening_balance = Number(newCustomer.opening_balance);
    }
    if (newCustomer.status) {
      minimalPayload.status = String(newCustomer.status).toUpperCase();
    }

    try {
      await createCustomer(minimalPayload);
      await loadCustomers();
    } catch (err) {
      if (err?.response?.data) {
        console.error("Create customer failed:", err.response.data);
        setCreateErrors(err.response.data);
      } else {
        console.error("API save failed, using local fallback", err);

        const code = newCustomer.code || "CU" + Math.floor(Math.random() * 9000 + 1000);

        const tableCustomer = normalizeCustomer({
          code,
          name: newCustomer.name,
          location: newCustomer.location,
          phone: newCustomer.phone,
          email: newCustomer.email,
          opening_balance: Number(newCustomer.opening_balance || 0),
          opening_debit: Number(newCustomer.opening_balance || 0),
          debit: 0,
          credit: 0,
          balance: Number(newCustomer.opening_balance || 0),
          status: newCustomer.status,
          isNew: true
        });

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
      opening_balance: 0,
      status: "ACTIVE"
    });
  };

  const openPayModal = async (customer) => {
    if (!customer?.id) {
      alert("Customer ID missing.");
      return;
    }

    setSelectedCustomer(customer);
    setPaymentErrors(null);
    setShowPayModal(true);
    setSalesLoading(true);
    setCustomerSales([]);
    setPaymentForm({
      sale: "",
      amount: "",
      payment_method: "CASH",
      reference_number: "",
      date: new Date().toISOString().slice(0, 10),
      notes: ""
    });

    try {
      const res = await API.get(`sales/sales/?customer=${customer.id}`);
      const sales = normalizeSalesList(res?.data);

      const unpaidSales = sales.filter((s) => {
        const outstanding = Number(s?.outstanding_amount ?? 0);
        return outstanding > 0;
      });

      setCustomerSales(unpaidSales);
    } catch (err) {
      console.error("Failed to load customer sales:", err?.response?.data || err);
      setPaymentErrors("Failed to load customer unpaid sales.");
    } finally {
      setSalesLoading(false);
    }
  };

  const handlePaymentInput = (field, value) => {
    setPaymentForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePayment = async () => {
    if (!selectedCustomer?.id) {
      alert("Customer missing.");
      return;
    }

    if (!paymentForm.sale) {
      alert("Please select a sale to pay.");
      return;
    }

    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    setPaymentSaving(true);
    setPaymentErrors(null);

    const payload = {
      sale: Number(paymentForm.sale),
      customer: Number(selectedCustomer.id),
      amount: Number(paymentForm.amount),
      payment_method: paymentForm.payment_method,
      reference_number: paymentForm.reference_number || null,
      date: paymentForm.date,
      notes: paymentForm.notes || ""
    };

    try {
      await API.post("payments/payments/", payload);
      setShowPayModal(false);
      setSelectedCustomer(null);
      setCustomerSales([]);
      await loadCustomers();
    } catch (err) {
      console.error("Create payment failed:", err?.response?.data || err);
      setPaymentErrors(err?.response?.data || "Failed to save payment.");
    } finally {
      setPaymentSaving(false);
    }
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="filter-right">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
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
                <th className="text-right">Opening Balance</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Credit</th>
                <th className="text-right">Balance</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {pageData.map(c => {
                const opening = Number(c.opening_debit || 0);
                const debit = Number(c.debit || 0);
                const credit = Number(c.credit || 0);
                const balance = Number(c.balance || 0);

                return (
                  <tr key={c.id || c.code}>
                    <td>{c.code}</td>
                    <td>{c.name}</td>
                    <td>{c.location}</td>
                    <td>{c.phone}</td>
                    <td className="text-right">{opening.toLocaleString()}</td>
                    <td className="text-right">{debit.toLocaleString()}</td>
                    <td className="text-right">{credit.toLocaleString()}</td>
                    <td className="text-right">{balance.toLocaleString()}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-view" onClick={() => handleViewAccount(c)}>
                          <FiEye /> View
                        </button>
                        <button className="btn btn-view" onClick={() => openPayModal(c)}>
                          <FiCreditCard /> Pay
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
                <td className="text-right"><strong>{pageTotals.openingDebit.toLocaleString()}</strong></td>
                <td className="text-right"><strong>{pageTotals.debit.toLocaleString()}</strong></td>
                <td className="text-right"><strong>{pageTotals.credit.toLocaleString()}</strong></td>
                <td className="text-right"><strong>{pageTotals.balance.toLocaleString()}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="customerList-pagination">
        <div>
          Showing {filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} entries
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
                <label>Opening Balance</label>
                <input
                  type="number"
                  value={newCustomer.opening_balance}
                  onChange={(e)=>handleCustomerInput("opening_balance",e.target.value)}
                />
              </div>

              <div className="customerModal-row">
                <label>Status</label>
                <select value={newCustomer.status} onChange={(e)=>handleCustomerInput("status",e.target.value.toUpperCase())}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {createErrors && (
                <div style={{ color: "red", marginTop: "12px" }}>
                  {JSON.stringify(createErrors)}
                </div>
              )}
            </div>

            <div className="customerModal-actions">
              <button className="btn" onClick={() => setShowAddCustomer(false)}>Cancel</button>
              <button className="btn primary" onClick={handleSaveCustomer}>Save Customer</button>
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="customerModal-overlay">
          <div className="customerModal-card">
            <div className="customerModal-header">
              <h3>Receive Payment</h3>
            </div>

            <div className="customerModal-body">
              <div className="customerModal-row">
                <label>Customer</label>
                <input value={selectedCustomer?.name || ""} readOnly />
              </div>

              <div className="customerModal-row">
                <label>Sale / Invoice</label>
                <select
                  value={paymentForm.sale}
                  onChange={(e) => handlePaymentInput("sale", e.target.value)}
                  disabled={salesLoading}
                >
                  <option value="">Select outstanding sale</option>
                  {customerSales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {(sale.invoice_number || sale.invoice || `Sale ${sale.id}`)} - Outstanding: {Number(sale.outstanding_amount || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="customerModal-row">
                <label>Amount</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => handlePaymentInput("amount", e.target.value)}
                />
              </div>

              <div className="customerModal-row">
                <label>Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => handlePaymentInput("payment_method", e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="MOBILE">Mobile Money</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div className="customerModal-row">
                <label>Reference Number</label>
                <input
                  value={paymentForm.reference_number}
                  onChange={(e) => handlePaymentInput("reference_number", e.target.value)}
                />
              </div>

              <div className="customerModal-row">
                <label>Date</label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => handlePaymentInput("date", e.target.value)}
                />
              </div>

              <div className="customerModal-row">
                <label>Notes</label>
                <input
                  value={paymentForm.notes}
                  onChange={(e) => handlePaymentInput("notes", e.target.value)}
                />
              </div>

              {salesLoading && (
                <div style={{ marginTop: "12px" }}>Loading customer sales...</div>
              )}

              {paymentErrors && (
                <div style={{ color: "red", marginTop: "12px" }}>
                  {typeof paymentErrors === "string" ? paymentErrors : JSON.stringify(paymentErrors)}
                </div>
              )}
            </div>

git            <div className="customerModal-actions">
              <button
                className="btn"
                onClick={() => {
                  setShowPayModal(false);
                  setSelectedCustomer(null);
                  setCustomerSales([]);
                }}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={handleSavePayment}
                disabled={paymentSaving}
              >
                {paymentSaving ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
