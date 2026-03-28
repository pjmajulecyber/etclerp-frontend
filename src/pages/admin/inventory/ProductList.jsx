

// src/pages/admin/products/ProductList.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import API from "../../../services/api";
import "./ProductList.css";

export default function ProductList() {
  const initialProducts = [
    { id: 1, code: "43", name: "HFO", qty: 471, stock: 100, location: "Warehouse A", status: "in_stock", buyingPrice: 8000, sellingPrice: 12000, taxInclusive: false },
    { id: 2, code: "44", name: "HFO-180", qty: 402, stock: 0, location: "Warehouse B", status: "out_of_stock", buyingPrice: 8000, sellingPrice: 12000, taxInclusive: true },
    { id: 3, code: "45", name: "Furnance", qty: 7, stock: 12, location: "Warehouse A", status: "in_stock", buyingPrice: 250000, sellingPrice: 320000, taxInclusive: false },
  ];

  const NUMERIC_CODE_MAP = {
    "23": "Waste Oil",
    "24": "sluge",
    "25": "HFO-180",
    "26": "Engine Oil 1L",
  };

  // Core state
  const [products, setProducts] = useState(initialProducts); // merged UI view
  const [productDefs, setProductDefs] = useState([]); // product model records (have ids)
  const [stockSummary, setStockSummary] = useState([]); // stocks from /summary/
  const [wasteLogs, setWasteLogs] = useState([]);

  // Depots (load from API, fallback to mock)
  const [depots, setDepots] = useState([]);
  const [selectedDepot, setSelectedDepot] = useState("");

  // Two modal states: Add (new product) and Update (existing modal preserved)
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingProductCode, setEditingProductCode] = useState(null); // used for update modal

  // Add Product form fields (manual inputs - per screenshot)
  const [addCode, setAddCode] = useState("");
  const [addName, setAddName] = useState("");
  const [addBuyingPrice, setAddBuyingPrice] = useState("");
  const [addSellingPrice, setAddSellingPrice] = useState("");
  const [addTaxInclusive, setAddTaxInclusive] = useState(false);
  const [addInventoryMode, setAddInventoryMode] = useState("MANUAL"); // screenshot shows Manual Log selected
  const [addLowStockThreshold, setAddLowStockThreshold] = useState("");
  const [addLocation, setAddLocation] = useState("");
  const [addInitialStock, setAddInitialStock] = useState("");
  const [addInitialDepot, setAddInitialDepot] = useState("");

  // Update Product form fields (preserve previous modal's form fields and behavior)
  const [updCode, setUpdCode] = useState("");
  const [updName, setUpdName] = useState("");
  const [updBuyingPrice, setUpdBuyingPrice] = useState("");
  const [updSellingPrice, setUpdSellingPrice] = useState("");
  const [updTaxInclusive, setUpdTaxInclusive] = useState(false);
  const [updInventoryMode, setUpdInventoryMode] = useState("AUTO");
  const [updQty, setUpdQty] = useState("");
  const [updStock, setUpdStock] = useState("");
  const [updLocation, setUpdLocation] = useState("");
  const [updLowStockThreshold, setUpdLowStockThreshold] = useState("");
  

  // Movement modal (unchanged)
  const [modalOpen, setModalOpen] = useState(false);
  const [movementType, setMovementType] = useState("IN");
  const [movementDate, setMovementDate] = useState("");
  const [movementCode, setMovementCode] = useState("");
  const [movementProduct, setMovementProduct] = useState("");
  const [movementQty, setMovementQty] = useState("");

  // refs for export
  const wasteTableRef = useRef(null);

  /* ================= LOAD PRODUCTS, DEPOTS & MOVEMENTS ================= */
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    await Promise.all([loadProducts(), loadDepots(), loadMovements()]);
  };

  // loads both product model and stock summary then merges (table source)
  const loadProducts = async () => {
    try {
      const [prodRes, stockRes] = await Promise.all([
        API.get("inventory/products/"),
        API.get("inventory/summary/"),
      ]);

      const prodData = prodRes?.data ?? [];
      const stockData = stockRes?.data ?? [];

      setProductDefs(Array.isArray(prodData) ? prodData : (prodData.results ?? []));
      setStockSummary(Array.isArray(stockData) ? stockData : (stockData.results ?? []));

      const merged = (Array.isArray(prodData) ? prodData : (prodData.results ?? [])).map((p) => {
        const stockRow = (Array.isArray(stockData) ? stockData : (stockData.results ?? [])).find(s => String(s.code) === String(p.code));
        return {
          id: p.id,
          code: p.code,
          name: p.name,
          qty: Number(stockRow?.quantity ?? 0),
          stock: Number(stockRow?.quantity ?? 0),
          location: stockRow?.location ?? p.default_location ?? "-",
          status: (stockRow && stockRow.low_stock) ? "out_of_stock" : "in_stock",
          buyingPrice: Number(p.buying_price ?? 0),
          sellingPrice: Number(p.selling_price ?? 0),
          taxInclusive: Boolean(p.tax_inclusive),
          inventory_mode: p.inventory_mode ?? "AUTO",
          low_stock_threshold: Number(p.low_stock_threshold ?? 0),
        };
      });

      setProducts(merged);
    } catch (err) {
      console.error("Products/summary load failed:", err);
      setProducts(initialProducts);
    }
  };

  const loadDepots = async () => {
    try {
      const res = await API.get("inventory/depots/");
      const data = res?.data ?? [];
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(d => ({ id: d.id, name: d.name }));
        setDepots(mapped);
        setSelectedDepot(mapped[0].id);
        setAddInitialDepot(mapped[0].id);
      } else {
        throw new Error("No depots from API");
      }
    } catch (err) {
      console.warn("Depots API failed — using fallback mocks:", err);
      const fallback = [
        { id: 1, name: "Mbagala" },
        { id: 2, name: "Camel" }
      ];
      setDepots(fallback);
      setSelectedDepot(fallback[0].id);
      setAddInitialDepot(fallback[0].id);
    }
  };

  const loadMovements = async () => {
    try {
      const res = await API.get("inventory/movements/");
      const data = res?.data ?? [];
      const raw = Array.isArray(data) ? data : (data.results ?? []);
  
      // ensure correct ledger order
const sorted = [...raw].sort(
  (a, b) => new Date(a.created_at) - new Date(b.created_at)
);

        // balance per product
        const balanceMap = {};

        const mapped = sorted.map(m => {

          const code = m.product_code;

          if (!balanceMap[code]) {
            balanceMap[code] = 0;
          }

          let stockIn = 0;
          let stockOut = 0;

          if ((m.movement_type || "").toUpperCase() === "IN") {
            stockIn = Number(m.quantity);
            balanceMap[code] += Number(m.quantity);
          }

          if ((m.movement_type || "").toUpperCase() === "OUT") {
            stockOut = Number(m.quantity);
            balanceMap[code] -= Number(m.quantity);
          }

          return {
            id: m.id,
            date: (m.created_at || "").slice(0, 10),
            depot: m.depot,
            code: code,
            product: m.product_name,
            stockIn,
            stockOut,
            current: balanceMap[code]
          };

        });

  
      setWasteLogs(mapped);
  
    } catch (err) {
      console.error("Movement API failed:", err);
  
      setWasteLogs([
        {
          id: 1,
          date: "2025-01-01",
          code: "WO-001",
          product: "Used Engine Oil",
          stockIn: 100,
          stockOut: 0,
          current: 100
        }
      ]);
    }
  };

  /* ================= FIND HELPERS ================= */
  const findProductDefByCode = (code) => {
    const codeStr = (code || "").toString();
    return productDefs.find(p => (p.code || "").toString() === codeStr) || null;
  };

  const findMergedProductByCode = (code) => {
    const codeStr = (code || "").toString();
    return products.find(p => (p.code || "").toString() === codeStr) || null;
  };

  /* ================= ADD PRODUCT (NEW modal) ================= */

  const openAddProduct = () => {
    // reset add form fields
    setAddCode("");
    setAddName("");
    setAddBuyingPrice("");
    setAddSellingPrice("");
    setAddTaxInclusive(false);
    setAddInventoryMode("MANUAL");
    setAddLowStockThreshold("");
    setAddLocation("");
    setAddInitialStock("");
    setAddInitialDepot(selectedDepot || (depots[0] && depots[0].id) || "");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const handleAddCodeChange = (val) => {
    const v = (val || "").toString().trim();
    setAddCode(v);
    if (!v) {
      setAddName("");
      return;
    }
    // If product def exists, prefill from it (optional)
    const def = findProductDefByCode(v);
    if (def) {
      setAddName(def.name || "");
      setAddBuyingPrice(String(def.buying_price ?? ""));
      setAddSellingPrice(String(def.selling_price ?? ""));
      setAddInventoryMode(def.inventory_mode ?? "AUTO");
      setAddLocation(def.default_location ?? "");
      setAddTaxInclusive(Boolean(def.tax_inclusive));
      return;
    }
    // fallback numeric mapping
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 2) {
      const prefix = digits.slice(0, 2);
      if (NUMERIC_CODE_MAP[prefix]) {
        setAddName(NUMERIC_CODE_MAP[prefix]);
      }
    }
  };



/* ================= AUTO LOAD UPDATE PRODUCT ================= */

const handleUpdateCodeChange = (val) => {

  const code = (val || "").toString().trim();

  setUpdCode(code);

  if (!code) {
    setUpdName("");
    setUpdBuyingPrice("");
    setUpdSellingPrice("");
    setUpdTaxInclusive(false);
    setUpdInventoryMode("AUTO");
    setUpdQty("");
    setUpdStock("");
    setUpdLocation("");
    setUpdLowStockThreshold("");
    return;
  }

  // look inside loaded products first
  const merged = findMergedProductByCode(code);

  // look inside product model definitions
  const def = findProductDefByCode(code);

  const product = merged || def;

  if (!product) return;

  setUpdName(product.name || "");
  setUpdBuyingPrice(product.buyingPrice ?? product.buying_price ?? "");
  setUpdSellingPrice(product.sellingPrice ?? product.selling_price ?? "");
  setUpdTaxInclusive(product.taxInclusive ?? product.tax_inclusive ?? false);
  setUpdInventoryMode(product.inventory_mode ?? "AUTO");
  setUpdQty(product.qty ?? 0);
  setUpdStock(product.stock ?? 0);
  setUpdLocation(product.location ?? product.default_location ?? "");
  setUpdLowStockThreshold(product.low_stock_threshold ?? 0);

  setEditingProductCode(code);
};


  const saveNewProduct = async () => {
    if (!addCode) return alert("Enter product code.");
    if (!addName) return alert("Enter product name.");

    const payload = {
      code: addCode,
      name: addName,
      buying_price: Number(addBuyingPrice || 0),
      selling_price: Number(addSellingPrice || 0),
      tax_inclusive: Boolean(addTaxInclusive),
      inventory_mode: addInventoryMode || "MANUAL",
      low_stock_threshold: Number(addLowStockThreshold || 0),
      // include a default location field if backend supports it
      default_location: addLocation || undefined,
    };

    try {
      const res = await API.post("inventory/products/", payload);
      const created = res?.data ?? null;

      // If user provided initial stock and inventory is MANUAL, create initial manual movement
      const initialQty = Number(addInitialStock || 0);
      const targetDepot = addInitialDepot || selectedDepot;
      if (initialQty > 0 && payload.inventory_mode === "MANUAL") {
        const prodId = created?.id ?? findProductDefByCode(addCode)?.id;
        if (prodId && targetDepot) {
          try {
            await API.post("inventory/manual-movement/", {
              product: prodId,
              depot: targetDepot,
              movement_type: "IN",
              quantity: initialQty,
              reference: "initial-stock"
            });
          } catch (err) {
            console.warn("Initial stock creation failed:", err);
          }
        }
      }

      setShowAddModal(false);
      await loadProducts();
      await loadMovements();
    } catch (err) {
      console.error("Add product failed:", err);
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert("Add product failed: " + msg);
    }
  };

  /* ================= UPDATE PRODUCT (EXISTING/unchanged modal) ================= */

  const openUpdateProduct = (p = null) => {
    // p may be merged product row or null when user clicks top Update Product button
    setEditingProductCode(p ? p.code : null);

    if (p) {
      // populate update form using merged row and productDefs if present
      setUpdCode(p.code || "");
      setUpdName(p.name || "");
      setUpdBuyingPrice(String(p.buyingPrice ?? ""));
      setUpdSellingPrice(String(p.sellingPrice ?? ""));
      setUpdTaxInclusive(Boolean(p.taxInclusive));
      setUpdInventoryMode(p.inventory_mode ?? "AUTO");
      setUpdQty(String(p.qty ?? 0));
      setUpdStock(String(p.stock ?? 0));
      setUpdLocation(p.location || "");
      const def = findProductDefByCode(p.code);
      setUpdLowStockThreshold(String(def?.low_stock_threshold ?? p.low_stock_threshold ?? 0));
    } else {
      // empty update modal (keeps previous modal behavior)
      setUpdCode("");
      setUpdName("");
      setUpdBuyingPrice("");
      setUpdSellingPrice("");
      setUpdTaxInclusive(false);
      setUpdInventoryMode("AUTO");
      setUpdQty("");
      setUpdStock("");
      setUpdLocation("");
      setUpdLowStockThreshold("");
    }

    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setEditingProductCode(null);
  };

  // This keeps the same update/save logic you had previously (PATCH if id exists, else POST)
  const saveUpdateProduct = async () => {
    if (!updCode) return alert("Enter product code.");
    if (!updName) return alert("Product name required.");

    const payload = {
      code: updCode,
      name: updName,
      buying_price: Number(updBuyingPrice || 0),
      selling_price: Number(updSellingPrice || 0),
      tax_inclusive: Boolean(updTaxInclusive),
      inventory_mode: updInventoryMode || "AUTO",
      low_stock_threshold: Number(updLowStockThreshold || 0),
      // location left to backend field name; attempt to update default_location if supported
      default_location: updLocation || undefined,
    };

    try {
      let result = null;
      const def = findProductDefByCode(editingProductCode || updCode);
      if (def && def.id) {
        // keep same behavior — PATCH existing product record
        const res = await API.patch(`inventory/products/${def.id}/`, payload);
        result = res?.data ?? null;
      } else {
        // fallback: create new product record
        const res = await API.post("inventory/products/", payload);
        result = res?.data ?? null;
      }

      setShowUpdateModal(false);
      setEditingProductCode(null);
      await loadProducts();
      await loadMovements();
    } catch (err) {
      console.error("Update product failed:", err);
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert("Update product failed: " + msg);
    }
  };

  /* ================= EXPORT CSV / PDF (unchanged) ================= */

  const exportProductsCSV = () => {
    const headers = [
      "Code",
      "Product",
      "Price",
      "Tax Inclusive",
      "Quantity",
      "Current Stock",
      "Location",
    ];

    const rows = products.map((p) => [
      p.code,
      p.name,
      (p.sellingPrice || 0).toFixed(2),
      p.taxInclusive ? "Inclusive" : "Exclusive",
      p.qty || 0,
      p.stock || 0,
      p.location || "",
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportProductsPDF = async () => {
    const node = wasteTableRef.current;
    if (!node) return alert("Nothing to export");
    try {
      const canvas = await html2canvas(node, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
      pdf.save(`products-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF export failed");
    }
  };

  /* ================= MOVEMENT MODAL HELPERS (unchanged) ================= */

  const openMovement = () => {
    setMovementType("IN");
    setMovementDate(new Date().toISOString().slice(0, 10));
    setMovementCode("");
    setMovementProduct("");
    setMovementQty("");
    if (!selectedDepot && depots.length > 0) setSelectedDepot(depots[0].id);
    setModalOpen(true);
  };

  const handleMovementCodeChange = (val) => {
    const v = (val || "").toString().trim();
    setMovementCode(v);
    if (!v) {
      setMovementProduct("");
      return;
    }
    const prod = findMergedProductByCode(v) || findProductDefByCode(v);
    if (prod) {
      setMovementProduct(prod.name || "");
      return;
    }
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 2) {
      const prefix = digits.slice(0, 2);
      if (NUMERIC_CODE_MAP[prefix]) setMovementProduct(NUMERIC_CODE_MAP[prefix]);
    }
  };

  const submitMovement = async (e) => {
    e.preventDefault();
    const qty = Number(movementQty || 0);
    if (!qty || qty <= 0) return alert("Enter valid quantity");

    const prodDef = findProductDefByCode(movementCode);
    if (!prodDef || !prodDef.id) return alert("Product not found. Add it first via Add Product.");

    if (!selectedDepot) return alert("Select a depot.");

    try {
      await API.post("inventory/manual-movement/", {
        product: prodDef.id,
        depot: selectedDepot,
        movement_type: movementType,
        quantity: qty,
        reference: "manual"
      });

      setModalOpen(false);
      await loadProducts();
      await loadMovements();
    } catch (err) {
      console.error("Movement failed:", err);
      if (err?.response?.data) {
        alert("Stock movement failed: " + (err.response.data.detail || JSON.stringify(err.response.data)));
      } else {
        alert("Stock movement failed");
      }
    }
  };

  /* ================= SORTED VIEWS ================= */
  const sortedProducts = useMemo(() => [...products].sort((a, b) => (a.code || "").toString().localeCompare((b.code || "").toString())), [products]);
  const sortedLogs = useMemo(() => [...wasteLogs].sort((a, b) => new Date(b.date) - new Date(a.date)), [wasteLogs]);

  /* ================= RENDER ================= */
  return (
    <div className="product-page">
      <div className="product-topbar">
        <div className="product-top-left">
          <h2>Products</h2>
          <p className="muted">Inventory & stock overview</p>
        </div>

        <div className="product-top-actions">
          {/* New Add Product button (opens Add modal) */}
          <button className="btn btn-primary" onClick={openAddProduct}>
            <FiPlus /> Add Product
          </button>

          {/* Keep an Update Product button (keeps previous modal behaviour) */}
          <button className="btn" onClick={() => openUpdateProduct(null)}>Update Product</button>

          <button className="btn" onClick={exportProductsCSV}>Export CSV</button>
          <button className="btn" onClick={exportProductsPDF}>Export PDF</button>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Product Inventory</h3></div>

        <div className="table-scroll" ref={wasteTableRef}>
          <table className="main-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Product</th>
                <th>Price</th>
                <th>Tax</th>
                <th>Quantity</th>
                <th>Current Stock</th>
                <th>Location</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {sortedProducts.map((p) => (
                <tr key={p.id || p.code}>
                  <td className="mono">{p.code}</td>
                  <td>{p.name}</td>
                  <td>Tsh {(p.sellingPrice || 0).toLocaleString()}</td>
                  <td>{p.taxInclusive ? "Inclusive" : "Exclusive"}</td>
                  <td>{(p.qty || 0).toLocaleString()}</td>
                  <td>{(p.stock || 0).toLocaleString()}</td>
                  <td>{p.location}</td>
                  <td>
                    <div className="row-actions">
                      {/* Edit opens the unchanged Update Product modal for that product */}
                      <button className="btn small" onClick={() => openUpdateProduct(p)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedProducts.length === 0 && (
                <tr><td colSpan={8} className="empty">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD PRODUCT MODAL (new, matches screenshot and includes location) ================= */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={closeAddModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Add Product</h3>
              <button className="close" onClick={closeAddModal}>✕</button>
            </div>

            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); saveNewProduct(); }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  Code:
                  <input value={addCode} onChange={(e) => handleAddCodeChange(e.target.value)} required />
                </label>

                <label>
                  Name:
                  <input value={addName} onChange={(e) => setAddName(e.target.value)} required />
                </label>

                <label>
                  Buying price:
                  <input type="number" step="0.01" value={addBuyingPrice} onChange={(e) => setAddBuyingPrice(e.target.value)} />
                </label>

                <label>
                  Selling price:
                  <input type="number" step="0.01" value={addSellingPrice} onChange={(e) => setAddSellingPrice(e.target.value)} />
                </label>

                <label>
                  Tax inclusive:
                  <select value={addTaxInclusive ? "inclusive" : "exclusive"} onChange={(e) => setAddTaxInclusive(e.target.value === "inclusive")}>
                    <option value="exclusive">Exclusive</option>
                    <option value="inclusive">Inclusive</option>
                  </select>
                </label>

                <label>
                  Inventory mode:
                  <select value={addInventoryMode} onChange={(e) => setAddInventoryMode(e.target.value)}>
                    <option value="AUTO">AUTO</option>
                    <option value="MANUAL">MANUAL</option>
                  </select>
                </label>

                <label>
                  Low stock threshold:
                  <input type="number" step="0.001" value={addLowStockThreshold} onChange={(e) => setAddLowStockThreshold(e.target.value)} />
                </label>

                <label>
                  Location:
                  <input value={addLocation} onChange={(e) => setAddLocation(e.target.value)} placeholder="Warehouse A" />
                </label>

                <label>
                  Initial Stock (optional):
                  <input type="number" min="0" value={addInitialStock} onChange={(e) => setAddInitialStock(e.target.value)} placeholder="0" />
                </label>

                <label>
                  Initial Stock Depot:
                  <select value={addInitialDepot} onChange={(e) => setAddInitialDepot(e.target.value)}>
                    {depots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>

                <div style={{ gridColumn: "1 / span 2", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ fontSize: 14 }}>
                    Profit: Tsh {(Number(addSellingPrice || 0) - Number(addBuyingPrice || 0)).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeAddModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= UPDATE PRODUCT MODAL (preserved behaviour — used by Edit and top Update Product) ================= */}
      {showUpdateModal && (
        <div className="modal-backdrop" onClick={closeUpdateModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingProductCode ? "Edit Product / Update Stock" : "Update Product"}</h3>
              <button className="close" onClick={closeUpdateModal}>✕</button>
            </div>

            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); saveUpdateProduct(); }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  Code
                  <input
                      value={updCode}
                      onChange={(e) => handleUpdateCodeChange(e.target.value)}
                      placeholder="Enter product code"
/>
                </label>

                <label>
                  Product
                  <input value={updName} onChange={(e) => setUpdName(e.target.value)} required />
                </label>

                <label>
                  Buying Price (Tsh)
                  <input type="number" value={updBuyingPrice} onChange={(e) => setUpdBuyingPrice(e.target.value)} />
                </label>

                <label>
                  Selling Price (Tsh)
                  <input type="number" value={updSellingPrice} onChange={(e) => setUpdSellingPrice(e.target.value)} />
                </label>

                <label>
                  Tax
                  <select value={updTaxInclusive ? "inclusive" : "exclusive"} onChange={(e) => setUpdTaxInclusive(e.target.value === "inclusive")}>
                    <option value="exclusive">Exclusive</option>
                    <option value="inclusive">Inclusive</option>
                  </select>
                </label>

                <label>
                  Inventory mode
                  <select value={updInventoryMode} onChange={(e) => setUpdInventoryMode(e.target.value)}>
                    <option value="AUTO">AUTO</option>
                    <option value="MANUAL">MANUAL</option>
                  </select>
                </label>

                <label>
                  Quantity
                  <input type="number" value={updQty} onChange={(e) => setUpdQty(e.target.value)} />
                </label>

                <label>
                  Current Stock
                  <input type="number" value={updStock} onChange={(e) => setUpdStock(e.target.value)} />
                </label>

                <label>
                  Location
                  <input value={updLocation} onChange={(e) => setUpdLocation(e.target.value)} />
                </label>

                <label>
                  Low stock threshold
                  <input type="number" value={updLowStockThreshold} onChange={(e) => setUpdLowStockThreshold(e.target.value)} />
                </label>

                <div style={{ gridColumn: "1 / span 2", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ fontSize: 14 }}>
                    Profit: Tsh {(Number(updSellingPrice || 0) - Number(updBuyingPrice || 0)).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeUpdateModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVEMENT MODAL */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Record Stock Movement</h3>

            <form onSubmit={submitMovement} className="modal-form">
              <label>
                Date
                <input type="date" value={movementDate} onChange={(e) => setMovementDate(e.target.value)} required />
              </label>

              <label>
                Depot
                <select value={selectedDepot} onChange={(e) => setSelectedDepot(e.target.value)} required>
                  {depots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>

              <label>
                Code
                <input value={movementCode} onChange={(e) => handleMovementCodeChange(e.target.value)} required />
              </label>

              <label>
                Product
                <input value={movementProduct} readOnly />
              </label>

              <label>
                Quantity
                <input type="number" min="1" value={movementQty} onChange={(e) => setMovementQty(e.target.value)} required />
              </label>

              <label>
                Movement Type
                <select value={movementType} onChange={(e) => setMovementType(e.target.value)}>
                  <option value="IN">Stock In</option>
                  <option value="OUT">Stock Out</option>
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WASTE OIL LOG */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h3>Waste Oil Stock Movement Log</h3>
          <div className="card-head-actions">
            <button className="btn btn-primary" onClick={() => { setMovementType("IN"); openMovement(); }}>Stock In +</button>
            <button className="btn btn-danger" onClick={() => { setMovementType("OUT"); openMovement(); }}>Stock Out -</button>
            <button className="btn" onClick={loadMovements}>Reload</button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="waste-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Code</th>
                <th>Depot</th>
                <th>Product</th>
                <th>Stock In</th>
                <th>Stock Out</th>
                <th>Current</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td className="mono">{r.code}</td>
                  <td>{r.depot}</td>
                  <td>{r.product}</td>
                  <td className="text-left">{Number(r.stockIn || 0).toLocaleString()}</td>
                  <td className="text-left">{Number(r.stockOut || 0).toLocaleString()}</td>
                  <td className="text-right">{Number(r.current || 0).toLocaleString()}</td>
                </tr>
              ))}
              {sortedLogs.length === 0 && <tr><td colSpan={6} className="empty">No waste stock logs</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
