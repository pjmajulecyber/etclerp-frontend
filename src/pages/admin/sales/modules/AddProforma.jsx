


import "./AddProforma.css";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const customersDB = [
  { id: 1, code: "45010", name: "Shanta Gold" },
  { id: 2, code: "45020", name: "Lake Steel Industries" },
  { id: 3, code: "45030", name: "Lodhia Industries" },
  { id: 4, code: "45040", name: "Tanzania Breweries Limited" },
  { id: 5, code: "45050", name: "Steel Master Industries" },
  { id: 6, code: "45060", name: "Muhimbili National Hospital" },
  { id: 7, code: "45070", name: "Tanzania Biotech Products ltd" },
  { id: 8, code: "45080", name: "Mufindi Papermill industries" },
  { id: 9, code: "45090", name: "Morogoro Tobacco Industries" },
  { id: 10, code: "45100", name: "Benjamin Mkapa Hospital" },
  { id: 11, code: "45110", name: "Fulcon Tanzania" },
  { id: 12, code: "45120", name: "Jambo Industries Limited" },
  { id: 13, code: "45130", name: "Mbeya Cement Factory Ltd" },
  { id: 14, code: "45140", name: "East Africa Spirits Ltd" },
  { id: 15, code: "45150", name: "Pepsi Cola Mbeya" },
  { id: 16, code: "45999", name: "Other" }
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

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState("");

  const [items, setItems] = useState([]);
  const [discountAll, setDiscountAll] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const proformaNumber = incoming?.invoiceNumber || `PF-2026-${proformaCounter}`;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "auto";
    };
  }, []);

  const filteredCustomers = customersDB.filter(c =>
    `${c.code} ${c.name}`.toLowerCase().includes(customerSearch.toLowerCase())
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

          {/* TOP ROW */}
          <div className="erp-row top-row">
            <div className="erp-field">
              <label>Customer *</label>
              <input
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer(null);
                }}
              />
              {customerSearch && !selectedCustomer && (
                <div className="erp-dropdown-menu">
                  {filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      className="erp-dropdown-item"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch(`${c.code} - ${c.name}`);
                      }}
                    >
                      {c.code} — {c.name}
                    </div>
                  ))}
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

          {/* TABLE */}
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
                      {/* PRODUCT DROPDOWN */}
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

          {/* TOTALS */}
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
