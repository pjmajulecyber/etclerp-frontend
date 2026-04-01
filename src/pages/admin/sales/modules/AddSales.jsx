

// src/pages/admin/sales/modules/AddSales.jsx
import "./AddSales.css";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../../../services/api";

/* ================= SMART ACCOUNT STRUCTURE (DATA) ================= */

/* SALES ACCOUNT (revenue) */
const SALES_ACCOUNT_CODE = "41000";

/* Customers 12000+ (use accCode only) - fallback/demo */
const customersDB = [
  { id: 1, accCode: "12000", name: "Tanzania Breweries Plc" },
  { id: 2, accCode: "12001", name: "Shanta Gold mine" },
  { id: 3, accCode: "12002", name: "Prime Traders" },
  { id: 4, accCode: "12003", name: "Next Customer" }
];

/* Products 14000+ (use accCode / productCode) - fallback/demo */
const productsDB = [
  { accCode: "14000", name: "Diesel", price: 3000 },
  { accCode: "14001", name: "Petrol", price: 3200 },
  { accCode: "14002", name: "Lubricant", price: 2800 }
];

/* Charges 15000+ (use accCode only) - fallback/demo */
const chargesDB = [
  { accCode: "15000", name: "Transport", price: 150 },
  { accCode: "15001", name: "Handling", price: 25000 }
];

/* Depots list (replace with API if needed) - fallback/demo */
const depotsDB = [
  { id: "DPT-01", name: "Camel" },
  { id: "DPT-02", name: "Puma" },
  { id: "DPT-03", name: "SuperStar" }
];

/* Drivers (dropdown) - fallback/demo */
const driversDB = [
  { id: 1, name: "YUNUS ISSA SELEMANI" },
  { id: 2, name: "Ramadhan Kalolo" },
  { id: 3, name: "Issa Ramadhan" }
];

/* Trucks (dropdown) - fallback/demo */
const trucksDB = [
  { id: 1, number: "T390 EFB" }
];

/* Trailers (dropdown) - fallback/demo */
const trailersDB = [
  { id: 1, number: "T422 CFR" }
];

const chargesMap = (accCode) => chargesDB.find(c => c.accCode === accCode);

let invoiceCounter = Number(localStorage.getItem("invoiceCounter")) || 1001;

export default function AddSalesModal({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const overlayRef = useRef(null);

  // Support both shapes: location.state.saleData (old flow) or location.state (we may pass res directly)
  const incoming = location.state?.saleData ?? location.state ?? null;
  console.log("INVOICE DATA:", incoming);

  const handleClose = () => {
    if (onClose) onClose();
    else navigate("/admin/sales/list");
  };

  // --- TOP ROW fields (kept and extended) ---
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saleType, setSaleType] = useState("Final");

  // AC reference - revenue account (read only)
  const [referenceNo, setReferenceNo] = useState(SALES_ACCOUNT_CODE);

  // New fields requested
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().slice(0, 10));
  const [depot, setDepot] = useState("");
  const [driverName, setDriverName] = useState("");
  const [truckNo, setTruckNo] = useState("");
  const [trailerNo, setTrailerNo] = useState("");

  // table-driven items (productCode + accCode for compatibility)
  const [items, setItems] = useState([]);
  const [discountAll, setDiscountAll] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  // Delivery-related new state
  const [deliveryNotes, setDeliveryNotes] = useState([
    { id: Date.now(), tankNumber: "", fuelQuantity: "", upperSeal: "", lowerSeal: "" }
  ]);

  // images for delivery (array of { file, url, name })
  const [deliveryImages, setDeliveryImages] = useState([]);

  // --- API-loaded master data states (added, do not remove) ---
  const [customersAPI, setCustomersAPI] = useState([]);
  const [productsAPI, setProductsAPI] = useState([]);
  const [depotsAPI, setDepotsAPI] = useState([]);
  const [driversAPI, setDriversAPI] = useState([]);
  const [trucksAPI, setTrucksAPI] = useState([]);

  const invoiceNumber = incoming?.invoiceNumber || incoming?.invoice_number || `INV-${Date.now()}`;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "auto";
      deliveryImages.forEach(img => (img.url && URL.revokeObjectURL(img.url)));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // hydrate incoming if present (keeps parity with earlier AddSales)
  useEffect(() => {
    if (!incoming) return;

    if (incoming.customer) {
      if (typeof incoming.customer === "string") {
        const parts = incoming.customer.split(" - ");
        const acc = parts[0]?.trim() || "";
        const name = parts.slice(1).join(" - ").trim() || parts[0];
        setSelectedCustomer({ id: null, accCode: acc, name });
        setCustomerSearch(`${acc} - ${name}`);
      } else {
        const cust = incoming.customer;
        const acc = cust.accCode ?? cust.code ?? null;
        setSelectedCustomer({ id: cust.id ?? cust.pk ?? null, accCode: acc, name: cust.name });
        setCustomerSearch(`${acc} - ${cust.name}`);
      }
    }

    if (incoming.date) setDate(incoming.date);
    if (incoming.saleType) setSaleType(incoming.saleType);
    if (incoming.referenceNo) setReferenceNo(incoming.referenceNo);

    if (incoming.poNumber) setPoNumber(incoming.poNumber);
    if (incoming.poDate) setPoDate(incoming.poDate);
    if (incoming.depot) setDepot(incoming.depot);
    if (incoming.driverName) setDriverName(incoming.driverName);
    if (incoming.truckNo) setTruckNo(incoming.truckNo);
    if (incoming.trailerNo) setTrailerNo(incoming.trailerNo);

    if (incoming.items && Array.isArray(incoming.items)) {
      const cloned = incoming.items.map(it => {
        const productCode = it.productCode ?? it.accCode ?? it.code ?? it.product ?? "";
        return {
          id: it.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productCode,
          accCode: productCode,
          name: it.name || it.description || "",
          price: Number(it.price ?? it.unitPrice ?? it.unit_price ?? 0),
          qty: Number(it.qty ?? it.quantity ?? 1),
          taxType: it.taxType || it.tax_type || "Exclusive",
          type: it.type || (String(productCode).startsWith("150") ? "charge" : "product")
        };
      });
      setItems(cloned);
    }

    if (incoming.discountAll !== undefined && incoming.discountAll !== null) {
      setDiscountAll(Number(incoming.discountAll) || 0);
    }

    if (incoming.paidAmount !== undefined && incoming.paidAmount !== null) {
      setPaidAmount(Number(incoming.paidAmount) || 0);
    }

    if (incoming.deliveryNotes && Array.isArray(incoming.deliveryNotes)) {
      setDeliveryNotes(incoming.deliveryNotes.map(d => ({ id: d.id || Date.now(), ...d })));
    }

    if (incoming.deliveryImages && Array.isArray(incoming.deliveryImages)) {
      setDeliveryImages(
        incoming.deliveryImages.map((img, idx) => {
          if (typeof img === "string") {
            return { file: null, url: "", name: img };
          }
          return {
            file: null,
            url: img?.url || "",
            name: img?.name || `image-${idx + 1}`
          };
        })
      );
    }
  }, [incoming]);

  // -------------------------
  // Load master data from APIs
  // -------------------------
  useEffect(() => {
    let mounted = true;

    async function loadMasterData() {
      try {
        const [
          customersRes,
          productsRes,
          depotsRes,
          driversRes,
          trucksRes
        ] = await Promise.all([
          API.get("/customers/").catch(() => ({ data: [] })),
          API.get("/inventory/products/").catch(() => ({ data: [] })),
          API.get("/inventory/depots/").catch(() => ({ data: [] })),
          API.get("/logistics/drivers/").catch(() => ({ data: [] })),
          API.get("/logistics/trucks/").catch(() => ({ data: [] })),
        ]);

        if (!mounted) return;

        const unwrap = (d) => {
          const val = d && d.data !== undefined ? d.data : d;
          if (Array.isArray(val)) return val;
          if (val && Array.isArray(val.results)) return val.results;
          return [];
        };

        setCustomersAPI(unwrap(customersRes));
        setProductsAPI(unwrap(productsRes));
        setDepotsAPI(unwrap(depotsRes));
        setDriversAPI(unwrap(driversRes));
        setTrucksAPI(unwrap(trucksRes));
      } catch (err) {
        console.error("Failed loading ERP master data", err);
      }
    }

    loadMasterData();

    return () => {
      mounted = false;
    };
  }, []);

  // Search customers by accCode or name (use API data when available, else fallback)
  const customerSource = customersAPI.length ? customersAPI : customersDB;
  const filteredCustomers = customerSource.filter(c =>
    `${c.accCode || c.code || ""} ${c.name || c.full_name || ""}`.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // product source (for table dropdown)
  const productSource = productsAPI.length ? productsAPI : productsDB;

  // depot / drivers / trucks / trailers sources (use API when available)
  const depotSource = depotsAPI.length ? depotsAPI : depotsDB;
  const driverSource = driversAPI.length ? driversAPI : driversDB;
  const truckSource = trucksAPI.length ? trucksAPI : trucksDB;
  const trailerSource = trucksAPI.length ? trucksAPI : trailersDB;

  // --- Table row helpers ---
  const addEmptyRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        productCode: "",
        accCode: "",
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

  // --- Delivery helpers ---
  const addDeliveryRow = () => {
    setDeliveryNotes(prev => [
      ...prev,
      { id: Date.now(), tankNumber: "", fuelQuantity: "", upperSeal: "", lowerSeal: "" }
    ]);
  };

  const updateDeliveryRow = (index, field, value) => {
    setDeliveryNotes(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeDeliveryRow = (index) => {
    setDeliveryNotes(prev => prev.filter((_, i) => i !== index));
  };

  // handle image uploads for delivery (multiple)
  const handleDeliveryFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      name: f.name
    }));

    deliveryImages.forEach(img => img.url && URL.revokeObjectURL(img.url));
    setDeliveryImages(mapped);
  };

  const removeDeliveryImage = (idx) => {
    const toRemove = deliveryImages[idx];
    if (toRemove && toRemove.url) URL.revokeObjectURL(toRemove.url);
    setDeliveryImages(prev => prev.filter((_, i) => i !== idx));
  };

  // calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach(item => {
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

  const persistToSession = (key, row) => {
    try {
      const raw = sessionStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(row);
      sessionStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      console.error("persist error", e);
    }
  };

  // build canonical sale row with the three accounting dimensions
  const buildSaleRow = (paidOverride = null) => {
    const id = Date.now();
    const amount = Number(calculations.grandTotal || 0);
    const paid = Number(paidOverride !== null ? paidOverride : (paidAmount || 0));
    const outstanding = Math.max(0, amount - paid);
    const invoiceVal = invoiceNumber.includes("INV-2026-") ? invoiceNumber : `INV-2026-${id}`;

    const customerCode = selectedCustomer?.accCode || "";

    const canonicalItems = items.map((it, idx) => {
      const prod = it.productCode || it.accCode || "";

      return {
        id: it.id ?? `${invoiceVal}-${idx}`,
        invoice: invoiceVal,
        product: prod,
        item_type: (it.type || "product").toString().trim().toUpperCase(),
        description: it.name || "",
        quantity: Number(it.qty || 0),
        unit_price: Number(it.price || 0),
        tax_type: (it.taxType || "Exclusive").toUpperCase(),
        line_total: (Number(it.qty || 0) * Number(it.price || 0))
      };
    });

    const deliveryMeta = deliveryNotes.map(d => ({
      id: d.id,
      tankNumber: d.tankNumber,
      fuelQuantity: d.fuelQuantity,
      upperSeal: d.upperSeal,
      lowerSeal: d.lowerSeal
    }));

    const deliveryFilesMeta = deliveryImages.map(img => ({
      name: img.name || (img.file && img.file.name) || null
    }));

    return {
      id,
      invoice: invoiceVal,
      revenueCode: SALES_ACCOUNT_CODE,
      acCode: SALES_ACCOUNT_CODE,
      customerCode,
      customer: selectedCustomer ? selectedCustomer.name : (customerSearch || "Unknown"),
      totalAmount: amount,
      amount,
      paid,
      outstanding,
      date,
      poNumber,
      poDate,
      depot,
      driverName,
      truckNo,
      trailerNo,
      product: canonicalItems.length ? canonicalItems[0].name : "Misc",
      status: paid >= amount ? "Paid" : paid === 0 ? "Unpaid" : "Partial",
      items: canonicalItems,
      discountAll,
      saleType,
      referenceNo: referenceNo || SALES_ACCOUNT_CODE,
      deliveryNotes: deliveryMeta,
      deliveryImages: deliveryFilesMeta,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  /**
   * submitToBackend
   * - sends JSON if no files, otherwise FormData with 'payload' JSON + files[].
   * - expects backend at /api/sales/
   * Uses API (axios) instance so Authorization and baseURL are handled in one place.
   */
  const submitToBackend = async (salePayload, images = []) => {
    try {
      const hasFiles = images && images.some(i => i.file);

      console.log("SALE PAYLOAD (to backend)", salePayload, "hasFiles=", hasFiles);

      if (hasFiles) {
        const form = new FormData();
        form.append("payload", JSON.stringify(salePayload));
        images.forEach((img) => {
          if (img.file) form.append("files", img.file, img.file.name);
        });

        const res = await API.post("/sales/", form);
        return res.data;
      } else {
        const res = await API.post("/sales/", salePayload);
        return res.data;
      }
    } catch (err) {
      const serverBody = err?.response?.data ?? err?.message ?? err;
      console.error("submitToBackend error", serverBody);
      throw new Error(
        (serverBody && typeof serverBody === "object")
          ? JSON.stringify(serverBody)
          : String(serverBody)
      );
    }
  };

  const buildPreviewState = ({
    res,
    row,
    paidAmountOverride,
    calculationsOverride
  }) => {
    const resolvedId =
      res?.id ??
      res?.pk ??
      res?.sale_id ??
      res?.saleId ??
      row?.id ??
      null;

    const resolvedInvoiceNumber =
      res?.invoiceNumber ??
      res?.invoice_number ??
      res?.invoice ??
      row?.invoice ??
      invoiceNumber;

    return {
      ...res,
      id: resolvedId,
      pk: res?.pk ?? resolvedId,
      saleId: res?.sale_id ?? res?.saleId ?? resolvedId,
      invoiceId: res?.invoice_id ?? res?.invoiceId ?? resolvedId,
      invoiceNumber: resolvedInvoiceNumber,
      invoice_number: res?.invoice_number ?? resolvedInvoiceNumber,
      invoice: res?.invoice ?? resolvedInvoiceNumber,
      date: res?.date ?? date,
      customer: selectedCustomer
        ? {
            id: selectedCustomer.id ?? null,
            accCode: selectedCustomer.accCode,
            name: selectedCustomer.name
          }
        : null,
      items: res?.items ?? row.items,
      discountAll,
      paidAmount: paidAmountOverride,
      calculations: calculationsOverride,
      deliveryNotes: row.deliveryNotes,
      deliveryImages: row.deliveryImages,
      backendResponse: res
    };
  };

  const goToInvoicePreview = (overrideType = null, forcePaid = false) => {
    if (!incoming) invoiceCounter++;

    const finalCalculations = forcePaid
      ? { ...calculations, outstanding: 0 }
      : calculations;

    const finalPaidAmount = forcePaid
      ? Number(finalCalculations.grandTotal || 0)
      : Number(paidAmount || 0);

    const row = buildSaleRow(finalPaidAmount);

    const saleData = {
      id: incoming?.id ?? incoming?.pk ?? row.id ?? null,
      pk: incoming?.pk ?? incoming?.id ?? row.id ?? null,
      saleId: incoming?.saleId ?? incoming?.sale_id ?? incoming?.id ?? row.id ?? null,
      invoiceId: incoming?.invoiceId ?? incoming?.invoice_id ?? incoming?.id ?? row.id ?? null,
      invoiceNumber: incoming?.invoiceNumber ?? incoming?.invoice_number ?? row.invoice,
      invoice_number: incoming?.invoice_number ?? incoming?.invoiceNumber ?? row.invoice,
      invoice: incoming?.invoice ?? incoming?.invoice_number ?? incoming?.invoiceNumber ?? row.invoice,
      poNumber,
      poDate,
      depot,
      driverName,
      truckNo,
      trailerNo,
      customer: selectedCustomer
        ? { id: selectedCustomer.id ?? null, accCode: selectedCustomer.accCode, name: selectedCustomer.name }
        : null,
      items,
      discountAll,
      paidAmount: finalPaidAmount,
      calculations: finalCalculations,
      date,
      saleType: overrideType || saleType,
      referenceNo,
      deliveryNotes,
      deliveryImages: deliveryImages.map(img => ({
        name: img.name || (img.file && img.file.name) || null
      }))
    };

    navigate("/admin/sales/invoice-preview", {
      state: saleData,
      replace: true,
    });

    return;
  };

  // --- handlers ---
  const handlePayNow = async (e) => {
    e?.preventDefault?.();

    const mappedCompartments = deliveryNotes.map(d => ({
      compartment_number: d.tankNumber,
      litres: Number(d.fuelQuantity || 0),
      upper_seal_number: d.upperSeal,
      lower_seal_number: d.lowerSeal
    }));

    const row = buildSaleRow(Number(calculations.grandTotal || 0));

    const salePayload = {
      invoice_number: row.invoice,
      date,
      customer: selectedCustomer?.id ?? selectedCustomer?.accCode ?? null,
      po_number: row.poNumber || null,
      po_date: row.poDate || null,
      depot: row.depot || null,
      driver_name: row.driverName || null,
      truck_no: row.truckNo || null,
      trailer_no: row.trailerNo || null,
      reference_no: row.referenceNo || null,
      total_amount: Number(calculations.grandTotal || 0),
      subtotal: Number(calculations.subtotal || 0),
      tax_amount: Number(calculations.totalTax || 0),
      discount_amount: Number(calculations.discountAmount || 0),
      paid_amount: Number(calculations.grandTotal || 0),
      outstanding_amount: 0,
      sale_type: "FINAL",
      items: row.items,
      compartments: mappedCompartments,
      delivery_files: row.deliveryImages.map(f => f.name)
    };

    try {
      console.log("SALE PAYLOAD", salePayload);
      const res = await submitToBackend(salePayload, deliveryImages);
      console.log("CREATE SALE RESPONSE:", res);

      invoiceCounter++;
      persistToSession("sales_list", row);

      const saleDataForPreview = buildPreviewState({
        res,
        row,
        paidAmountOverride: Number(calculations.grandTotal || 0),
        calculationsOverride: { ...calculations, outstanding: 0 }
      });

      navigate("/admin/sales/invoice-preview", {
        state: saleDataForPreview,
        replace: true,
      });

      return;
    } catch (err) {
      alert("Saving sale failed: " + (err.message || err));
    }
  };

  const handleSaveAndCreateInvoice = async (e) => {
    e?.preventDefault?.();

    const mappedCompartments = deliveryNotes.map(d => ({
      compartment_number: d.tankNumber,
      litres: Number(d.fuelQuantity || 0),
      upper_seal_number: d.upperSeal,
      lower_seal_number: d.lowerSeal
    }));

    const row = buildSaleRow();

    const salePayload = {
      invoice_number: row.invoice,
      date,
      customer: selectedCustomer?.id ?? selectedCustomer?.accCode ?? null,
      po_number: row.poNumber || null,
      po_date: row.poDate || null,
      depot: row.depot || null,
      driver_name: row.driverName || null,
      truck_no: row.truckNo || null,
      trailer_no: row.trailerNo || null,
      reference_no: row.referenceNo || null,
      total_amount: Number(calculations.grandTotal || 0),
      subtotal: Number(calculations.subtotal || 0),
      tax_amount: Number(calculations.totalTax || 0),
      discount_amount: Number(calculations.discountAmount || 0),
      paid_amount: Number(paidAmount || 0),
      outstanding_amount: Number(calculations.outstanding || 0),
      sale_type: saleType.toUpperCase(),
      items: row.items,
      compartments: mappedCompartments,
      delivery_files: row.deliveryImages.map(f => f.name)
    };

    try {
      console.log("SALE PAYLOAD", salePayload);
      const res = await submitToBackend(salePayload, deliveryImages);
      console.log("CREATE SALE RESPONSE:", res);

      invoiceCounter++;
      persistToSession("sales_list", row);

      const saleDataForPreview = buildPreviewState({
        res,
        row,
        paidAmountOverride: row.paid,
        calculationsOverride: calculations
      });

      navigate("/admin/sales/invoice-preview", {
        state: saleDataForPreview,
        replace: true,
      });

      return;
    } catch (err) {
      alert("Saving sale failed: " + (err.message || err));
    }
  };

  const handleCreditSale = async (e) => {
    e?.preventDefault?.();

    const mappedCompartments = deliveryNotes.map(d => ({
      compartment_number: d.tankNumber,
      litres: Number(d.fuelQuantity || 0),
      upper_seal_number: d.upperSeal,
      lower_seal_number: d.lowerSeal
    }));

    const row = buildSaleRow(0);

    const salePayload = {
      invoice_number: row.invoice,
      date,
      customer: selectedCustomer?.id ?? selectedCustomer?.accCode ?? null,
      po_number: row.poNumber || null,
      po_date: row.poDate || null,
      depot: row.depot || null,
      driver_name: row.driverName || null,
      truck_no: row.truckNo || null,
      trailer_no: row.trailerNo || null,
      reference_no: row.referenceNo || null,
      total_amount: Number(calculations.grandTotal || 0),
      subtotal: Number(calculations.subtotal || 0),
      tax_amount: Number(calculations.totalTax || 0),
      discount_amount: Number(calculations.discountAmount || 0),
      paid_amount: 0,
      outstanding_amount: Number(calculations.grandTotal || 0),
      sale_type: "CREDIT",
      items: row.items,
      compartments: mappedCompartments,
      delivery_files: row.deliveryImages.map(f => f.name)
    };

    try {
      console.log("SALE PAYLOAD", salePayload);
      const res = await submitToBackend(salePayload, deliveryImages);
      console.log("CREATE SALE RESPONSE:", res);

      invoiceCounter++;
      persistToSession("sales_list", row);

      const saleDataForPreview = buildPreviewState({
        res,
        row,
        paidAmountOverride: 0,
        calculationsOverride: calculations
      });

      navigate("/admin/sales/invoice-preview", {
        state: saleDataForPreview,
        replace: true,
      });

      return;
    } catch (err) {
      alert("Saving sale failed: " + (err.message || err));
    }
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
            <h2>New Sales Order</h2>
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
              <label>Customer Name or Account Code *</label>
              <input
                placeholder="Start typing account code or name..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer(null);
                }}
              />
              {customerSearch && !selectedCustomer && (
                <div className="erp-dropdown-menu customers">
                  {filteredCustomers.map(c => (
                    <div
                      key={c.id || (c.accCode + c.name)}
                      className="erp-dropdown-item"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch(`${c.accCode || c.code} - ${c.name || c.full_name}`);
                      }}
                    >
                      <div className="erp-dd-code">{c.accCode || c.code}</div>
                      <div className="erp-dd-name">{c.name || c.full_name}</div>
                    </div>
                  ))}
                </div>
              )}
              {selectedCustomer && (
                <div className="erp-selected">
                  Selected: {selectedCustomer.accCode} — {selectedCustomer.name}
                </div>
              )}
            </div>

            <div className="erp-field">
              <label>Sales Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
              <label>PO Number</label>
              <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="PO-12345" />
            </div>

            <div className="erp-field">
              <label>PO Date</label>
              <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} />
            </div>

            <div className="erp-field">
              <label>Depot</label>
              <select value={depot} onChange={(e) => setDepot(e.target.value)}>
                <option value="">Select Depot</option>
                {depotSource.map(d => (
                  <option key={d.id || d.code || d.name} value={d.id || d.code || d.name}>
                    {d.name || d.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="erp-field">
              <label>Driver Name</label>
              <select value={driverName} onChange={(e) => setDriverName(e.target.value)}>
                <option value="">Select Driver</option>
                {driverSource.map(d => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="erp-field">
              <label>Truck No</label>
              <select value={truckNo} onChange={(e) => setTruckNo(e.target.value)}>
                <option value="">Select Truck</option>
                {truckSource.map(t => (
                  <option key={t.id} value={t.truck_number || t.truckNo || t.number}>
                    {t.truck_number || t.truckNo || t.number}
                  </option>
                ))}
              </select>
            </div>

            <div className="erp-field">
              <label>Trailer No</label>
              <select value={trailerNo} onChange={(e) => setTrailerNo(e.target.value)}>
                <option value="">Select Trailer</option>
                {trailerSource.map(t => (
                  <option key={t.id} value={t.trailer_number || t.trailerNo || t.number}>
                    {t.trailer_number || t.trailerNo || t.number}
                  </option>
                ))}
              </select>
            </div>

            <div className="erp-field">
              <label>AC CODE.</label>
              <input value={referenceNo} readOnly />
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
                      No items added. Use "Add Row" to create product/charge lines.
                    </td>
                  </tr>
                )}

                {items.map((item, idx) => {
                  const total = (Number(item.qty) || 0) * (Number(item.price) || 0);
                  return (
                    <tr key={item.id || idx}>
                      <td>
                        <select
                          value={item.productCode || item.accCode || ""}
                          onChange={(e) => {
                            const selectedAcc = e.target.value;

                            const productMatch = productSource.find(
                              p => String(p.id ?? p.accCode) === selectedAcc
                            );

                            const chargeMatch = chargesDB.find(
                              c => String(c.accCode) === selectedAcc
                            );

                            if (productMatch) {
                              const code = String(productMatch.id ?? productMatch.accCode);

                              updateItem(idx, "productCode", code);
                              updateItem(idx, "accCode", code);
                              updateItem(idx, "name", productMatch.name || productMatch.title || "");
                              updateItem(idx, "price", productMatch.price ?? productMatch.unit_price ?? 0);
                              updateItem(idx, "type", "product");
                            } else if (chargeMatch) {
                              updateItem(idx, "productCode", String(chargeMatch.accCode));
                              updateItem(idx, "accCode", String(chargeMatch.accCode));
                              updateItem(idx, "name", chargeMatch.name);
                              updateItem(idx, "price", chargeMatch.price);
                              updateItem(idx, "type", "charge");
                            } else {
                              updateItem(idx, "productCode", "");
                              updateItem(idx, "accCode", "");
                              updateItem(idx, "name", "");
                              updateItem(idx, "price", 0);
                              updateItem(idx, "type", "product");
                            }
                          }}
                        >
                          <option value="">Select Item</option>
                          <optgroup label="Products">
                            {productSource.map(p => (
                              <option key={p.id ?? p.accCode} value={String(p.id ?? p.accCode)}>
                                {p.accCode ?? p.id} — {p.name ?? p.title}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Charges">
                            {chargesDB.map(c => (
                              <option key={c.accCode} value={String(c.accCode)}>
                                {c.accCode} — {c.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>

                        <div className="line-item-sub" style={{ marginTop: 6 }}>
                          {item.name ? item.name : (item.type === "charge" ? "Charge" : "Product")}
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
                        <select value={item.taxType} onChange={(e) => updateItem(idx, "taxType", e.target.value)}>
                          <option>Exclusive</option>
                          <option>Inclusive</option>
                        </select>
                      </td>

                      <td>{format(total)}</td>

                      <td>
                        <button type="button" className="row-delete" onClick={() => removeItem(idx)}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 10 }}>
            <button type="button" className="erp-add-btn" onClick={addEmptyRow}>+ Add Row</button>
          </div>

          <div className="delivery-section" style={{ marginTop: 20 }}>
            <h3>Delivery Details</h3>
            <p className="small-muted">
              Add delivery tank info & seals. You can add multiple delivery rows and attach delivery images (e.g. upper/lower seals photos).
            </p>

            <div className="delivery-table-wrapper">
              <table className="delivery-table" style={{ width: "100%", marginTop: 10 }}>
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>Tank Number</th>
                    <th style={{ width: "20%" }}>Fuel Quantity (Lts)</th>
                    <th style={{ width: "20%" }}>Upper Seal Number</th>
                    <th style={{ width: "20%" }}>Lower Seal Number</th>
                    <th style={{ width: "10%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryNotes.map((d, i) => (
                    <tr key={d.id}>
                      <td>
                        <input
                          className="dlvinputs"
                          value={d.tankNumber}
                          onChange={(e) => updateDeliveryRow(i, "tankNumber", e.target.value)}
                          placeholder="Room no. / Tank no."
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={d.fuelQuantity}
                          onChange={(e) => updateDeliveryRow(i, "fuelQuantity", e.target.value)}
                          placeholder="e.g. 5000"
                        />
                      </td>
                      <td>
                        <input
                          className="dlvinputs"
                          value={d.upperSeal}
                          onChange={(e) => updateDeliveryRow(i, "upperSeal", e.target.value)}
                          placeholder="ETCL 10340"
                        />
                      </td>
                      <td>
                        <input
                          className="dlvinputs"
                          value={d.lowerSeal}
                          onChange={(e) => updateDeliveryRow(i, "lowerSeal", e.target.value)}
                          placeholder="ETCL 10686"
                        />
                      </td>
                      <td>
                        <button type="button" className="row-delete" onClick={() => removeDeliveryRow(i)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 8 }}>
              <button type="button" className="erp-add-btn" onClick={addDeliveryRow}>+ Add Delivery Row</button>
            </div>

            <div style={{ marginTop: 8 }}>
              <label className="small-muted">Attach delivery images (optional)</label>
              <input type="file" multiple onChange={handleDeliveryFiles} />
              <div className="delivery-images-preview">
                {deliveryImages.map((img, i) => (
                  <div key={i} style={{ display: "inline-block", marginRight: 8 }}>
                    {img.url ? (
                      <img
                        src={img.url}
                        alt={img.name}
                        style={{ width: 80, height: 60, objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: 80, height: 60, background: "#eee" }} />
                    )}
                    <div style={{ textAlign: "center", fontSize: 12 }}>{img.name}</div>
                    <button type="button" className="row-delete" onClick={() => removeDeliveryImage(i)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="erp-bottom" style={{ marginTop: 16 }}>
            <div className="erp-left">
              <div className="erp-input-row">
                <label>Discount on All (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountAll}
                  onChange={e => setDiscountAll(e.target.value)}
                />
              </div>

              <div className="erp-input-row">
                <label>Amount Paid</label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="erp-right">
              <div className="tot-row"><span>Subtotal:</span> <strong>{format(calculations.subtotal)}</strong></div>
              <div className="tot-row"><span>Total Tax (18%):</span> <strong>{format(calculations.totalTax)}</strong></div>
              <div className="tot-row"><span>Discount:</span> <strong>{format(calculations.discountAmount)}</strong></div>
              <div className="tot-row grand"><span>Grand Total:</span> <strong>{format(calculations.grandTotal)}</strong></div>
              <div className="tot-row"><span>Outstanding:</span> <strong>{format(calculations.outstanding)}</strong></div>
            </div>
          </div>

          <div className="addSales-actions" style={{ marginTop: 18 }}>
            <button type="button" className="btn-ghost" onClick={handlePayNow}>Pay Now</button>
            <button type="button" className="btn-warning" onClick={handleCreditSale}>Credit Sale</button>
            <button type="button" className="btn-primary" onClick={handleSaveAndCreateInvoice}>Save & Create Invoice</button>
          </div>
        </div>
      </div>
    </div>
  );
}




