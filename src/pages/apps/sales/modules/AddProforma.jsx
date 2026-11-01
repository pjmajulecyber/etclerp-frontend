

import "./AddProforma.css";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../../../services/api";

const customersDB = [
  {
    id: 1,
    code: "45010",
    accCode: "45010",
    name: "Shanta Gold",
    address: "Songwe, Tanzania",
    phone: "255700000001",
    email: "info@shantagold.com",
    tin: "100-000-001",
    vrn: "40-000001-A",
    branches: [
      {
        id: 101,
        branch_name: "Mine Site",
        location: "Songwe",
        address: "New Luika Mine Site, Songwe",
        phone: "255700000001",
        email: "mine@shantagold.com",
        tin: "100-000-001",
        vrn: "40-000001-A",
        is_primary: true
      },
      {
        id: 102,
        branch_name: "Dar Office",
        location: "Dar es Salaam",
        address: "Masaki, Dar es Salaam",
        phone: "255700000002",
        email: "dar@shantagold.com",
        tin: "100-000-001",
        vrn: "40-000001-A",
        is_primary: false
      }
    ]
  },
  {
    id: 2,
    code: "45020",
    accCode: "45020",
    name: "Lake Steel Industries",
    address: "Mwanza, Tanzania",
    branches: [
      {
        id: 201,
        branch_name: "Main Branch",
        location: "Mwanza",
        address: "Ilemela, Mwanza",
        is_primary: true
      }
    ]
  },
  { id: 3, code: "45030", accCode: "45030", name: "Lodhia Industries", address: "Arusha", branches: [] },
  { id: 4, code: "45040", accCode: "45040", name: "Tanzania Breweries Limited", address: "Dar es Salaam", branches: [] },
  { id: 5, code: "45050", accCode: "45050", name: "Steel Master Industries", address: "Dar es Salaam", branches: [] },
  { id: 6, code: "45060", accCode: "45060", name: "Muhimbili National Hospital", address: "Upanga", branches: [] },
  { id: 7, code: "45070", accCode: "45070", name: "Tanzania Biotech Products ltd", address: "Dar es Salaam", branches: [] },
  { id: 8, code: "45080", accCode: "45080", name: "Mufindi Papermill industries", address: "Mufindi", branches: [] },
  { id: 9, code: "45090", accCode: "45090", name: "Morogoro Tobacco Industries", address: "Morogoro", branches: [] },
  { id: 10, code: "45100", accCode: "45100", name: "Benjamin Mkapa Hospital", address: "Dodoma", branches: [] },
  { id: 11, code: "45110", accCode: "45110", name: "Fulcon Tanzania", address: "Dar es Salaam", branches: [] },
  { id: 12, code: "45120", accCode: "45120", name: "Jambo Industries Limited", address: "Dar es Salaam", branches: [] },
  { id: 13, code: "45130", accCode: "45130", name: "Mbeya Cement Factory Ltd", address: "Mbeya", branches: [] },
  { id: 14, code: "45140", accCode: "45140", name: "East Africa Spirits Ltd", address: "Dar es Salaam", branches: [] },
  { id: 15, code: "45150", accCode: "45150", name: "Pepsi Cola Mbeya", address: "Mbeya", branches: [] },
  { id: 16, code: "45999", accCode: "45999", name: "Other", branches: [] }
];

const productsDB = [
  { code: "45000", name: "HFO 180", price: 3000 },
  { code: "45010", name: "HFO 150", price: 3200 },
  { code: "45020", name: "HFO", price: 2800 }
];

const chargesDB = [
  { code: "CH-001", name: "Transport", price: 150000 },
  { code: "CH-002", name: "Handling", price: 25000 }
];

let proformaCounter = 1006;

export default function AddProformaModal({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const overlayRef = useRef(null);

  const incoming = location.state?.saleData ?? null;

  const handleClose = () => {
    if (onClose) onClose();
    else navigate("/admin/sales/proforma-invoices");
  };

  const [customersAPI, setCustomersAPI] = useState([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBranches, setCustomerBranches] = useState([]);
  const [selectedCustomerBranch, setSelectedCustomerBranch] = useState(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState("");

  const [items, setItems] = useState([]);
  const [discountAll, setDiscountAll] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const proformaNumber = incoming?.invoiceNumber || `PF-2026-${proformaCounter}`;

  const unwrapList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.customers)) return data.customers;
    return [];
  };

  const normalizeCustomer = (customer) => {
    return {
      ...customer,
      id: customer?.id ?? customer?.pk ?? null,
      code: customer?.code ?? customer?.accCode ?? "",
      accCode: customer?.accCode ?? customer?.code ?? "",
      name: customer?.name ?? customer?.full_name ?? "",
      location: customer?.location ?? customer?.address ?? "",
      address: customer?.address ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      tin: customer?.tin ?? "",
      vrn: customer?.vrn ?? "",
      branches: Array.isArray(customer?.branches) ? customer.branches : []
    };
  };

  const normalizeCustomerBranch = (branch, index = 0) => {
    return {
      id: branch?.id ?? branch?.pk ?? null,
      branch_name:
        branch?.branch_name ||
        branch?.name ||
        branch?.title ||
        (index === 0 ? "Main Branch" : `Branch ${index + 1}`),
      location: branch?.location || "",
      address: branch?.address || "",
      phone: branch?.phone || "",
      email: branch?.email || "",
      tin: branch?.tin || "",
      vrn: branch?.vrn || "",
      is_primary: Boolean(branch?.is_primary || branch?.is_default)
    };
  };

  const buildCustomerBranches = (customer) => {
    const rawBranches = Array.isArray(customer?.branches)
      ? customer.branches
      : Array.isArray(customer?.customer_branches)
      ? customer.customer_branches
      : Array.isArray(customer?.branch_addresses)
      ? customer.branch_addresses
      : [];

    const normalizedBranches = rawBranches.map(normalizeCustomerBranch);

    if (normalizedBranches.length > 0) {
      return normalizedBranches;
    }

    if (!customer) return [];

    return [
      {
        id: null,
        branch_name: "Main Branch",
        location: customer.location || "",
        address: customer.address || "",
        phone: customer.phone || "",
        email: customer.email || "",
        tin: customer.tin || "",
        vrn: customer.vrn || "",
        is_primary: true
      }
    ];
  };

  const applySelectedCustomer = (customer) => {
    const normalizedCustomer = normalizeCustomer(customer);

    setSelectedCustomer(normalizedCustomer);
    setCustomerSearch(`${normalizedCustomer.code} - ${normalizedCustomer.name}`);

    const branches = buildCustomerBranches(normalizedCustomer);
    setCustomerBranches(branches);

    const primaryBranch =
      branches.find((b) => b.is_primary) ||
      branches[0] ||
      null;

    setSelectedCustomerBranch(primaryBranch);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCustomers() {
      try {
        const res = await API.get("/customers/");
        const rows = unwrapList(res?.data).map(normalizeCustomer);

        if (!mounted) return;

        setCustomersAPI(rows);
      } catch (err) {
        console.error("Failed to load customers:", err?.response?.data || err.message);
        setCustomersAPI([]);
      }
    }

    loadCustomers();

    return () => {
      mounted = false;
    };
  }, []);

  const customerSource = customersAPI.length ? customersAPI : customersDB;

  const filteredCustomers = customerSource.filter(c =>
    `${c.code || c.accCode || ""} ${c.name || c.full_name || ""}`
      .toLowerCase()
      .includes(customerSearch.toLowerCase())
  );

  const addEmptyRow = () => {
    setItems(prev => [
      ...prev,
      {
        code: "",
        name: "",
        price: 0,
        qty: 1,
        taxType: "Exclusive",
        type: "product"
      }
    ]);
  };

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach(item => {
      const lineTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);

      if (item.taxType === "Exclusive") {
        subtotal += lineTotal;
        totalTax += lineTotal * 0.18;
      } else {
        const beforeTax = lineTotal / 1.18;
        subtotal += beforeTax;
        totalTax += lineTotal - beforeTax;
      }
    });

    const discountAmount = subtotal * ((Number(discountAll) || 0) / 100);
    const grandTotal = subtotal + totalTax - discountAmount;
    const outstanding = grandTotal - (Number(paidAmount) || 0);

    return { subtotal, totalTax, discountAmount, grandTotal, outstanding };
  }, [items, discountAll, paidAmount]);

  const format = (n) => Number(n || 0).toLocaleString();

  const persistToSession = (key, row) => {
    try {
      const raw = sessionStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(row);
      sessionStorage.setItem(key, JSON.stringify(arr));
    } catch {}
  };

  const handleSaveProforma = () => {
    if (!selectedCustomer) return alert("Select customer");
    if (!items.length) return alert("Add at least one item");

    const id = Date.now();

    const row = {
      id,
      acCode: referenceNo || selectedCustomer.code,
      invoice: proformaNumber,
      customer: `${selectedCustomer.code} - ${selectedCustomer.name}`,
      customerBranch: selectedCustomerBranch,
      customer_branch: selectedCustomerBranch,
      customer_branch_id: selectedCustomerBranch?.id ?? null,
      amount: calculations.grandTotal,
      date,
      items,
      discountAll,
      status: "Draft"
    };

    persistToSession("proforma_invoices", row);
    proformaCounter++;

    navigate("/admin/sales/proform-preview", {
      state: {
        invoiceNumber: row.invoice,
        customer: selectedCustomer,
        customerBranch: selectedCustomerBranch,
        customer_branch: selectedCustomerBranch,
        items,
        discountAll,
        calculations,
        date
      }
    });
  };

  return (
    <div
      className="addProforma-overlay addSales-overlay"
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div className="addProforma-modal addSales-modal">
        <div className="addSales-header">
          <div>
            <h2>Create Proforma</h2>
            <div className="addSales-sub">
              Proforma: <strong>{proformaNumber}</strong>
            </div>
          </div>
          <button className="addSales-close" onClick={handleClose}>✕</button>
        </div>

        <div className="addSales-content">
          <div className="erp-row top-row">
            <div className="erp-field">
              <label>Customer *</label>
              <input
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer(null);
                  setCustomerBranches([]);
                  setSelectedCustomerBranch(null);
                }}
              />
              {customerSearch && !selectedCustomer && (
                <div className="erp-dropdown-menu">
                  {filteredCustomers.map(c => (
                    <div
                      key={c.id || c.code}
                      className="erp-dropdown-item"
                      onClick={() => applySelectedCustomer(c)}
                    >
                      {c.code || c.accCode} — {c.name || c.full_name}
                    </div>
                  ))}
                </div>
              )}

              {selectedCustomer && (
                <div className="erp-selected">
                  Selected: {selectedCustomer.code} — {selectedCustomer.name}
                </div>
              )}
            </div>

            <div className="erp-field">
              <label>Customer Branch / Address</label>
              <select
                value={selectedCustomerBranch?.id ?? selectedCustomerBranch?.branch_name ?? ""}
                onChange={(e) => {
                  const value = e.target.value;

                  const found = customerBranches.find((branch) =>
                    String(branch.id ?? branch.branch_name) === String(value)
                  );

                  setSelectedCustomerBranch(found || null);
                }}
                disabled={!selectedCustomer}
              >
                <option value="">
                  {selectedCustomer ? "Select Branch" : "Select customer first"}
                </option>

                {customerBranches.map((branch, idx) => (
                  <option
                    key={branch.id ?? `${branch.branch_name}-${idx}`}
                    value={branch.id ?? branch.branch_name}
                  >
                    {branch.branch_name}
                    {branch.location ? ` - ${branch.location}` : ""}
                    {branch.address ? ` (${branch.address})` : ""}
                  </option>
                ))}
              </select>

              {selectedCustomerBranch && (
                <div className="erp-selected">
                  Branch: {selectedCustomerBranch.branch_name}
                  {selectedCustomerBranch.address ? ` — ${selectedCustomerBranch.address}` : ""}
                </div>
              )}
            </div>

            <div className="erp-field">
              <label>Date</label>
              <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
            </div>

            <div className="erp-field">
              <label>AC Code</label>
              <input value={referenceNo} onChange={(e)=>setReferenceNo(e.target.value)} />
            </div>
          </div>

          <div className="erp-table-wrapper">
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>Item</th>
                  <th style={{ width: "10%" }}>Qty</th>
                  <th style={{ width: "15%" }}>Price</th>
                  <th style={{ width: "15%" }}>Tax</th>
                  <th style={{ width: "15%" }}>Total</th>
                  <th style={{ width: "8%" }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                      No items added
                    </td>
                  </tr>
                )}

                {items.map((item, idx) => {
                  const total = (Number(item.qty) || 0) * (Number(item.price) || 0);

                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          value={item.code}
                          onChange={(e) => {
                            const selectedCode = e.target.value;

                            const productMatch = productsDB.find(p => p.code === selectedCode);
                            const chargeMatch = chargesDB.find(c => c.code === selectedCode);

                            if (productMatch) {
                              updateItem(idx, "code", productMatch.code);
                              updateItem(idx, "name", productMatch.name);
                              updateItem(idx, "price", productMatch.price);
                              updateItem(idx, "type", "product");
                            }

                            if (chargeMatch) {
                              updateItem(idx, "code", chargeMatch.code);
                              updateItem(idx, "name", chargeMatch.name);
                              updateItem(idx, "price", chargeMatch.price);
                              updateItem(idx, "type", "charge");
                            }
                          }}
                        >
                          <option value="">Select Item</option>

                          <optgroup label="Products">
                            {productsDB.map(p => (
                              <option key={p.code} value={p.code}>
                                {p.code} — {p.name}
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="Charges">
                            {chargesDB.map(c => (
                              <option key={c.code} value={c.code}>
                                {c.code} — {c.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </td>

                      <td>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e)=>updateItem(idx,"qty",e.target.value)}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e)=>updateItem(idx,"price",e.target.value)}
                        />
                      </td>

                      <td>
                        <select
                          value={item.taxType}
                          onChange={(e)=>updateItem(idx,"taxType",e.target.value)}
                        >
                          <option>Exclusive</option>
                          <option>Inclusive</option>
                        </select>
                      </td>

                      <td>{format(total)}</td>

                      <td>
                        <button className="row-delete" onClick={()=>removeItem(idx)}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button className="erp-add-btn" onClick={addEmptyRow}>
            + Add Row
          </button>

          <div className="erp-bottom">
            <div className="erp-left">
              <div className="erp-input-row">
                <label>Discount (%)</label>
                <input
                  type="number"
                  value={discountAll}
                  onChange={(e)=>setDiscountAll(e.target.value)}
                />
              </div>
            </div>

            <div className="erp-right">
              <div className="tot-row"><span>Subtotal:</span> <strong>{format(calculations.subtotal)}</strong></div>
              <div className="tot-row"><span>Tax:</span> <strong>{format(calculations.totalTax)}</strong></div>
              <div className="tot-row"><span>Discount:</span> <strong>{format(calculations.discountAmount)}</strong></div>
              <div className="tot-row grand"><span>Grand Total:</span> <strong>{format(calculations.grandTotal)}</strong></div>
            </div>
          </div>

          <div className="addSales-actions">
            <button className="btn-primary" onClick={handleSaveProforma}>
              Save & Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  ); 
}
