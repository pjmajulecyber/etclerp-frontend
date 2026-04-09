import "./AddPurchases.css";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../../../services/api";

/*
  Converted to Purchase Order component.
  - All "customer" wording in the UI is now "supplier".
  - Prefill respects incoming.saleData.supplier OR incoming.saleData.customer.
  - Loads additional master endpoints.
  - Saves purchases including items and returns backend response; navigation sends backend id to preview.
*/

const chargesDB = [
  { code: "CH-001", name: "Transport", price: 150000 },
  { code: "CH-002", name: "Handling", price: 25000 }
];

let invoiceCounter = Number(localStorage.getItem("purchaseInvoiceCounter")) || 1025;

export default function AddPurchaseOrder({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const overlayRef = useRef(null);

  const incoming = location.state?.saleData ?? location.state ?? null;

  const [suppliersDB, setSuppliersDB] = useState([]);
  const [productsDB, setProductsDB] = useState([]);
  const [depotsDB, setDepotsDB] = useState([]);

  const [paymentsDB, setPaymentsDB] = useState([]);
  const [customersDB, setCustomersDB] = useState([]);
  const [expensesDB, setExpensesDB] = useState([]);
  const [documentsDB, setDocumentsDB] = useState([]);
  const [hrDB, setHrDB] = useState([]);
  const [assetsDB, setAssetsDB] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [inventoryMeta, setInventoryMeta] = useState(null);

  const handleClose = () => {
    if (onClose) onClose();
    else navigate("/admin/purchases");
  };

  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saleType, setSaleType] = useState("Final");
  const [referenceNo, setReferenceNo] = useState("");
  const [depot, setDepot] = useState("");

  const [selectedProductInput, setSelectedProductInput] = useState("");
  const [selectedProductCode, setSelectedProductCode] = useState("");
  const [selectedChargeInput, setSelectedChargeInput] = useState("");
  const [selectedChargeCode, setSelectedChargeCode] = useState("");

  const [items, setItems] = useState([]);
  const [discountAll, setDiscountAll] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [saving, setSaving] = useState(false);

  const invoiceNumber = incoming?.invoiceNumber || `PINV-${Date.now()}`;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAllMasters();
  }, []);

  const unwrapList = (res) => {
    const data = res?.data ?? res ?? [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  };

  const loadAllMasters = async () => {
    try {
      const [
        suppliersRes,
        productsRes,
        depotsRes,
        paymentsRes,
        customersRes,
        expensesRes,
        documentsRes,
        hrRes,
        assetsRes,
        dashboardRes,
        inventoryRes
      ] = await Promise.all([
        API.get("/suppliers/").catch(() => ({ data: [] })),
        API.get("/inventory/products/").catch(() => ({ data: [] })),
        API.get("/inventory/depots/").catch(() => ({ data: [] })),
        API.get("/payments/").catch(() => ({ data: [] })),
        API.get("/customers/").catch(() => ({ data: [] })),
        API.get("/expenses/").catch(() => ({ data: [] })),
        API.get("/documents/").catch(() => ({ data: [] })),
        API.get("/hr/").catch(() => ({ data: [] })),
        API.get("/assets/").catch(() => ({ data: [] })),
        API.get("/dashboard/").catch(() => ({ data: null })),
        API.get("/inventory/").catch(() => ({ data: null }))
      ]);

      const suppliers = unwrapList(suppliersRes).map((s) => ({
        id: s.id,
        code: s.code || s.supplier_code || `SUP-${s.id}`,
        name: s.name || s.supplier_name || s.company || ""
      }));
      setSuppliersDB(suppliers);

      const products = unwrapList(productsRes).map((p) => ({
        code: p.code || p.id,
        name: p.name || p.title || "",
        price: Number(p.buying_price ?? p.cost_price ?? p.selling_price ?? 0),
        productId: p.id ?? null
      }));
      setProductsDB(products);

      const depots = unwrapList(depotsRes).map((d) => ({
        id: d.id,
        code: d.code || d.id,
        name: d.name || d.code || `Depot ${d.id}`
      }));
      setDepotsDB(depots);

      setPaymentsDB(paymentsRes?.data ?? paymentsRes ?? []);
      setCustomersDB(customersRes?.data ?? customersRes ?? []);
      setExpensesDB(expensesRes?.data ?? expensesRes ?? []);
      setDocumentsDB(documentsRes?.data ?? documentsRes ?? []);
      setHrDB(hrRes?.data ?? hrRes ?? []);
      setAssetsDB(assetsRes?.data ?? assetsRes ?? []);
      setDashboardData(dashboardRes?.data ?? dashboardRes ?? null);
      setInventoryMeta(inventoryRes?.data ?? inventoryRes ?? null);
    } catch (err) {
      console.error("loadAllMasters error:", err);
    }
  };

  useEffect(() => {
    if (!incoming) return;

    const incomingSupplier = incoming.supplier || incoming.customer || null;

    if (incomingSupplier) {
      if (typeof incomingSupplier === "number" || typeof incomingSupplier === "string") {
        const found = suppliersDB.find(
          (s) =>
            String(s.id) === String(incomingSupplier) ||
            String(s.code) === String(incomingSupplier)
        );

        if (found) {
          setSelectedSupplier(found);
          setSupplierSearch(`${found.code} - ${found.name}`);
        } else {
          setSelectedSupplier({ id: incomingSupplier, code: incomingSupplier, name: "" });
          setSupplierSearch(`${incomingSupplier}`);
        }
      } else {
        const code =
          incomingSupplier.code ??
          incomingSupplier.supplier_code ??
          "";

        const name =
          incomingSupplier.name ??
          incomingSupplier.supplier_name ??
          incomingSupplier.company ??
          "";

        setSelectedSupplier({
          id: incomingSupplier.id ?? incomingSupplier.pk ?? null,
          code,
          name
        });
        setSupplierSearch(`${code} - ${name}`.trim());
      }
    }

    if (incoming.date) setDate(incoming.date);
    if (incoming.saleType) setSaleType(incoming.saleType);
    if (incoming.referenceNo) setReferenceNo(incoming.referenceNo);

    if (incoming.depot) {
      if (typeof incoming.depot === "object") {
        setDepot(String(incoming.depot.id ?? incoming.depot.code ?? ""));
      } else {
        setDepot(String(incoming.depot));
      }
    }

    if (incoming.items && Array.isArray(incoming.items)) {
      const cloned = incoming.items.map((it) => ({
        code: it.code ?? it.product_code ?? (it.product && it.product.code) ?? "",
        name: it.name ?? it.product_name ?? it.description ?? (it.product && it.product.name) ?? "",
        price: Number(it.price ?? it.unit_price ?? 0),
        qty: Number(it.qty ?? it.quantity ?? 1),
        taxType: it.taxType || "Exclusive",
        type:
          it.type ||
          (typeof it.code === "string" && it.code.startsWith("CH-") ? "charge" : "product"),
        productId: typeof it.product === "object" ? (it.product.id ?? null) : (it.product ?? null)
      }));
      setItems(cloned);
    }

    if (incoming.discountAll !== undefined && incoming.discountAll !== null) {
      setDiscountAll(Number(incoming.discountAll) || 0);
    }

    if (incoming.paidAmount !== undefined && incoming.paidAmount !== null) {
      setPaidAmount(Number(incoming.paidAmount) || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming, suppliersDB, depotsDB]);

  const filteredSuppliers = suppliersDB.filter((s) =>
    `${s.code} ${s.name}`.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const addProduct = () => {
    let code = selectedProductCode;

    if (!code && selectedProductInput) {
      const match = productsDB.find((p) =>
        `${p.code} ${p.name}`.toLowerCase().includes(selectedProductInput.toLowerCase())
      );
      if (match) code = match.code;
    }

    if (!code) return;

    const p = productsDB.find((x) => x.code === code);
    if (!p) return;

    setItems((prev) => [
      ...prev,
      {
        code: p.code,
        name: p.name,
        price: p.price,
        qty: 1,
        taxType: "Exclusive",
        type: "product",
        productId: p.productId ?? null
      }
    ]);

    setSelectedProductCode("");
    setSelectedProductInput("");
  };

  const addCharge = () => {
    let code = selectedChargeCode;

    if (!code && selectedChargeInput) {
      const match = chargesDB.find((c) =>
        `${c.code} ${c.name}`.toLowerCase().includes(selectedChargeInput.toLowerCase())
      );
      if (match) code = match.code;
    }

    if (!code) return;

    const c = chargesDB.find((x) => x.code === code);
    if (!c) return;

    setItems((prev) => [
      ...prev,
      {
        code: c.code,
        name: c.name,
        price: c.price,
        qty: 1,
        taxType: "Exclusive",
        type: "charge",
        productId: null
      }
    ]);

    setSelectedChargeCode("");
    setSelectedChargeInput("");
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach((item) => {
      const lineTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);

      if ((item.taxType || "").toLowerCase() === "exclusive") {
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

  const format = (n) => (Number(n) || 0).toLocaleString();

  const savePurchaseToAPI = async (finalCalculations, finalPaidAmount, previewSaleType) => {
    if (!selectedSupplier || !selectedSupplier.id) {
      alert("Supplier is required");
      return null;
    }

    if (!depot) {
      alert("Depot is required");
      return null;
    }

    if (!items.length) {
      alert("Please add at least one item.");
      return null;
    }

    try {
      const payloadItems = items.map((it) => {
        const row = {
          description: it.name || "",
          quantity: Number(it.qty || 0),
          unit_price: Number(it.price || 0),
          line_total: Number(
            ((Number(it.qty || 0) * Number(it.price || 0)) || 0).toFixed(2)
          )
        };

        if (it.type === "product" && it.productId) {
          row.product = it.productId;
        }

        return row;
      });

      const status =
        Number(finalCalculations.outstanding || 0) <= 0
          ? "PAID"
          : Number(finalPaidAmount || 0) > 0
          ? "PARTIAL"
          : "UNPAID";

      const payload = {
        invoice_number: invoiceNumber,
        date,
        supplier: selectedSupplier.id,
        purchase_type:
          String(previewSaleType || saleType || "Final").toUpperCase(),
        depot: Number(depot),
        subtotal: Number(finalCalculations.subtotal || 0),
        tax_amount: Number(finalCalculations.totalTax || 0),
        discount_amount: Number(finalCalculations.discountAmount || 0),
        total_amount: Number(finalCalculations.grandTotal || 0),
        paid_amount: Number(finalPaidAmount || 0),
        outstanding_amount: Number(finalCalculations.outstanding || 0),
        status,
        items: payloadItems
      };

      console.log("Saving purchase payload:", payload);

      const res = await API.post("/purchases/", payload);
      const data = res?.data ?? null;
      console.log("Purchase saved, backend response:", data);
      return data;
    } catch (err) {
      console.error("Purchase API save failed:", err?.response?.data || err.message);
      alert(
        "Purchase save failed: " +
          (
            err?.response?.data?.detail ||
            JSON.stringify(err?.response?.data) ||
            err.message
          )
      );
      return null;
    }
  };

  const goToInvoicePreview = async (overrideType = null, forcePaid = false) => {
    if (saving) return;
    setSaving(true);

    try {
      const finalCalculations = forcePaid
        ? { ...calculations, outstanding: 0 }
        : calculations;

      const finalPaidAmount = forcePaid
        ? Number(finalCalculations.grandTotal || 0)
        : Number(paidAmount || 0);

      const selectedType = overrideType || saleType;

      const saved = await savePurchaseToAPI(
        finalCalculations,
        finalPaidAmount,
        selectedType
      );

      if (!saved) {
        setSaving(false);
        return;
      }

      if (!incoming) {
        invoiceCounter++;
        localStorage.setItem("purchaseInvoiceCounter", invoiceCounter);
      }

      const saleDataForPreview = {
        invoiceNumber:
          saved.po_number ||
          saved.invoice_number ||
          saved.invoiceNumber ||
          invoiceNumber,
        supplier: selectedSupplier,
        items,
        discountAll,
        paidAmount: finalPaidAmount,
        calculations: finalCalculations,
        date,
        saleType: selectedType,
        referenceNo,
        depot,
        backendResponse: saved
      };

      if (saved && (saved.id || saved.pk)) {
        navigate("/admin/purchases/invoice-preview", {
          state: {
            id: saved.id ?? saved.pk,
            saleData: saleDataForPreview
          }
        });
      } else {
        navigate("/admin/purchases/invoice-preview", {
          state: saleDataForPreview
        });
      }

      if (typeof onClose === "function") onClose();
    } finally {
      setSaving(false);
    }
  };

  const handlePayNow = async () => {
    await goToInvoicePreview("Final", true);
  };

  const handleSaveAndCreateInvoice = async () => {
    await goToInvoicePreview();
  };

  const handleCreditPurchase = async () => {
    await goToInvoicePreview("Credit");
  };

  return (
    <div
      className="addSales-overlay"
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div className="addSales-modal" role="dialog" aria-modal="true">
        <div className="addSales-header">
          <div>
            <h2>New Purchase Order</h2>
            <div className="addSales-sub">
              Invoice: <strong>{invoiceNumber}</strong>
            </div>
          </div>

          <div className="addSales-headerRight">
            <button
              type="button"
              className="addSales-close"
              onClick={handleClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="addSales-content">
          <div className="erp-row top-row">
            <div className="erp-field">
              <label>Supplier Name or Code *</label>
              <input
                placeholder="Start typing code or name..."
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setSelectedSupplier(null);
                }}
              />
              {supplierSearch && !selectedSupplier && (
                <div className="erp-dropdown-menu customers">
                  {filteredSuppliers.map((s) => (
                    <div
                      key={s.id}
                      className="erp-dropdown-item"
                      onClick={() => {
                        setSelectedSupplier(s);
                        setSupplierSearch(`${s.code} - ${s.name}`);
                      }}
                    >
                      <div className="erp-dd-code">{s.code}</div>
                      <div className="erp-dd-name">{s.name}</div>
                    </div>
                  ))}
                </div>
              )}
              {selectedSupplier && (
                <div className="erp-selected">
                  Selected Supplier: {selectedSupplier.code} — {selectedSupplier.name}
                </div>
              )}
            </div>

            <div className="erp-field">
              <label>Purchase Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="erp-field">
              <label>Status *</label>
              <select value={saleType} onChange={(e) => setSaleType(e.target.value)}>
                <option>Final</option>
                <option>Quotation</option>
                <option>Credit</option>
              </select>
            </div>

            <div className="erp-field">
              <label>Depot *</label>
              <select value={depot} onChange={(e) => setDepot(e.target.value)}>
                <option value="">Select Depot</option>
                {depotsDB.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code ? `${d.code} - ${d.name}` : d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="erp-field">
              <label>AC CODE.</label>
              <input
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>
          </div>

          <div className="erp-product-row">
            <div className="erp-product-field">
              <label>Product</label>
              <div className="erp-product-controls">
                <div className="erp-search-input">
                  <input
                    placeholder="Type product code or name..."
                    value={selectedProductInput}
                    onChange={(e) => {
                      setSelectedProductInput(e.target.value);
                      setSelectedProductCode("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addProduct();
                      }
                    }}
                  />

                  {selectedProductInput && (
                    <div className="erp-dropdown-menu">
                      {productsDB
                        .filter((p) =>
                          `${p.code} ${p.name}`.toLowerCase().includes(selectedProductInput.toLowerCase())
                        )
                        .slice(0, 8)
                        .map((p) => (
                          <div
                            key={p.code}
                            className="erp-dropdown-item"
                            onClick={() => {
                              setSelectedProductInput(`${p.code} — ${p.name}`);
                              setSelectedProductCode(p.code);
                            }}
                          >
                            {p.code} — {p.name} ({p.price.toLocaleString()})
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <button className="erp-add-btn" onClick={addProduct}>
                  Add
                </button>
              </div>
            </div>

            <div className="erp-charge-field">
              <label>Charge</label>
              <div className="erp-product-controls">
                <div className="erp-search-input">
                  <input
                    placeholder="Type charge code or name..."
                    value={selectedChargeInput}
                    onChange={(e) => {
                      setSelectedChargeInput(e.target.value);
                      setSelectedChargeCode("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCharge();
                      }
                    }}
                  />

                  {selectedChargeInput && (
                    <div className="erp-dropdown-menu">
                      {chargesDB
                        .filter(
                          (c) =>
                            c.code.toLowerCase().includes(selectedChargeInput.toLowerCase()) ||
                            c.name.toLowerCase().includes(selectedChargeInput.toLowerCase())
                        )
                        .slice(0, 8)
                        .map((c) => (
                          <div
                            key={c.code}
                            className="erp-dropdown-item"
                            onClick={() => {
                              setSelectedChargeInput(`${c.code} — ${c.name}`);
                              setSelectedChargeCode(c.code);
                            }}
                          >
                            {c.code} — {c.name} ({c.price.toLocaleString()})
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <button className="erp-add-btn" onClick={addCharge}>
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="erp-table-wrapper">
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>Item</th>
                  <th style={{ width: "10%" }}>Qty</th>
                  <th style={{ width: "15%" }}>Unit Price</th>
                  <th style={{ width: "12%" }}>Tax Type</th>
                  <th style={{ width: "15%" }}>Line Total</th>
                  <th style={{ width: "8%" }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={6} style={{ textAlign: "center", padding: 28 }}>
                      No items added. Use Product or Charge selectors above to add.
                    </td>
                  </tr>
                )}

                {items.map((item, idx) => {
                  const total = (Number(item.qty) || 0) * (Number(item.price) || 0);

                  return (
                    <tr key={idx}>
                      <td>
                        <div className="line-item-title">
                          {item.code} — {item.name}
                        </div>
                        <div className="line-item-sub">
                          {item.type === "charge" ? "Charge" : "Product"}
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.qty}
                          onChange={(e) => updateItem(idx, "qty", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateItem(idx, "price", e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          value={item.taxType}
                          onChange={(e) => updateItem(idx, "taxType", e.target.value)}
                        >
                          <option>Exclusive</option>
                          <option>Inclusive</option>
                        </select>
                      </td>
                      <td>{format(total)}</td>
                      <td>
                        <button className="row-delete" onClick={() => removeItem(idx)}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="erp-bottom">
            <div className="erp-left">
              <div className="erp-input-row">
                <label>Discount on All (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountAll}
                  onChange={(e) => setDiscountAll(e.target.value)}
                />
              </div>

              <div className="erp-input-row">
                <label>Amount Paid</label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="erp-right">
              <div className="tot-row">
                <span>Subtotal:</span> <strong>{format(calculations.subtotal)}</strong>
              </div>
              <div className="tot-row">
                <span>Total Tax (18%):</span> <strong>{format(calculations.totalTax)}</strong>
              </div>
              <div className="tot-row">
                <span>Discount:</span> <strong>{format(calculations.discountAmount)}</strong>
              </div>
              <div className="tot-row grand">
                <span>Grand Total:</span> <strong>{format(calculations.grandTotal)}</strong>
              </div>
              <div className="tot-row">
                <span>Outstanding:</span> <strong>{format(calculations.outstanding)}</strong>
              </div>
            </div>
          </div>

          <div className="addSales-actions">
            <button className="btn-ghost" onClick={handlePayNow} disabled={saving}>
              {saving ? "Saving..." : "Pay Now"}
            </button>
            <button className="btn-warning" onClick={handleCreditPurchase} disabled={saving}>
              {saving ? "Saving..." : "Credit Purchase"}
            </button>
            <button className="btn-primary" onClick={handleSaveAndCreateInvoice} disabled={saving}>
              {saving ? "Saving..." : "Save & Create Purchase Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}