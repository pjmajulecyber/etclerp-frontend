import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import API from "../../../../services/api";
import logo from "../../../../assets/logo.png";
import "./PurchaseOrder.css";

export default function PurchaseOrder() {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef(null);

  // --- more robust id detection from many shapes the navigator might send ---
  const purchaseId =
    location.state?.id ||
    location.state?.purchaseId ||
    location.state?.saleId ||
    location.state?.saleData?.id ||
    location.state?.saleData?.backendResponse?.id ||
    location.state?.saleData?.backendResponse?.pk ||
    location.state?.backendResponse?.id ||
    null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultData = {
    po_number: "988",
    po_date: "",
    billTo: { company: "", address: "", tin: "", vrn: "" },
    items: [],
    company: {
      name: "EVOSHA TRADING COMPANY LIMITED",
      address: "P.O.Box 13134, Dar es Salaam",
      tin: "113-109-521",
      phone: "+255715-894738",
      email: "evosha2010@yahoo.com",
    },
  };

  useEffect(() => {
    let mounted = true;

    const fetchPurchase = async () => {
      setLoading(true);

      console.debug("PurchaseOrder location.state:", location.state, "detected purchaseId:", purchaseId);

      // If no id present — try to use passed saleData directly (fallback)
      if (!purchaseId) {
        const loc = location.state || {};
        if (mounted) {
          // Try to normalize if saleData exists
          const fallback = normalizeIncoming(loc);
          setData({ ...defaultData, ...fallback });
          setLoading(false);
        }
        return;
      }

      // Try primary endpoint; if it fails, try fallback endpoints
      const tryUrls = [
        `/purchases/${purchaseId}/purchase_order/`,
        `/purchases/${purchaseId}/`,
        `/purchases/${purchaseId}/invoice/`,
      ];

      let apiResponse = null;
      for (const url of tryUrls) {
        try {
          console.debug("Attempting fetch:", url);
          const res = await API.get(url);
          if (res && (res.status === 200 || res.status === 201)) {
            apiResponse = res.data || res;
            console.debug("Got data from", url, apiResponse);
            break;
          }
        } catch (err) {
          console.warn("Fetch failed for", url, err?.message || err);
          // continue to next fallback
        }
      }

      if (!apiResponse) {
        // last resort: set data from provided state (maybe preview passed saleData)
        const loc = location.state || {};
        if (mounted) {
          const fallback = normalizeIncoming(loc);
          setData({ ...defaultData, ...fallback });
          setLoading(false);
        }
        return;
      }

      // Map the API response into the shape the component expects
      try {
        const mapped = mapApiToView(apiResponse, defaultData);
        if (mounted) {
          setData(mapped);
          setLoading(false);
        }
      } catch (err) {
        console.error("Mapping API response failed:", err);
        const loc = location.state || {};
        if (mounted) {
          const fallback = normalizeIncoming(loc);
          setData({ ...defaultData, ...fallback });
          setLoading(false);
        }
      }
    };

    fetchPurchase();

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseId, location.state]);

  // helper: normalize incoming state to expected view shape
  function normalizeIncoming(loc) {
    // possible shapes of loc:
    // { saleData: {...} } or { invoiceNumber, items, date, supplier... } or backendResponse
    const source = loc.saleData ?? loc.backendResponse ?? loc ?? {};
    // try to return same shape used below: po_number, po_date, billTo, items, company
    const po_number = source.po_number || source.invoiceNumber || source.invoice || source.invoiceNo || source.invoice_number || "";
    const po_date = source.po_date || source.date || source.poDate || source.purchase_date || "";
    const billTo = source.billTo || {
      company: (source.supplier && source.supplier.name) || source.customer || source.supplier_name || "",
      address: source.supplier_address || source.address || "",
      tin: source.supplier_tin || source.tin || "",
      vrn: source.supplier_vrn || source.vrn || ""
    };
    const items = Array.isArray(source.items) ? source.items.map(normalizeItem) : [];
    return { po_number, po_date, billTo, items, company: defaultData.company };
  }

  function normalizeItem(it) {
    // produce an object with qty, particulars, unitPrice, total, cts
    return {
      qty: it.qty ?? it.quantity ?? it.Qty ?? it.units ?? "",
      particulars: it.description ?? it.particulars ?? it.name ?? it.product_name ?? it.product?.name ?? "",
      unitPrice: it.unit_price ?? it.price ?? it.TZS ?? it.unitPrice ?? "-",
      total: it.total ?? (it.qty && it.price ? Number(it.qty) * Number(it.price) : it.line_total ?? "-"),
      cts: it.cts ?? it.ct ?? 0
    };
  }

  function mapApiToView(api, defaultData) {
    // Accept many shapes: { po_number, po_date, billTo, items } OR DRF serializer like earlier example
    const po_number = api.po_number || api.poNo || api.purchaseOrder || api.purchase_number || api.invoiceNumber || api.id || defaultData.po_number;
    const po_date = api.po_date || api.purchaseDate || api.date || api.created_at || "";
    const billTo = {
      company: api.billTo?.company || api.customer || api.customer_name || api.customerName || api.bill_to_name || "",
      address: api.billTo?.address || api.customer_address || api.address || "",
      tin: api.billTo?.tin || api.customer_tin || api.tin || "",
      vrn: api.billTo?.vrn || api.customer_vrn || api.vrn || ""
    };

    // items can come as api.items OR api.rooms OR api.lines
    let rawItems = [];

    if (Array.isArray(api.items) && api.items.length) rawItems = api.items;
    else if (Array.isArray(api.rooms) && api.rooms.length) rawItems = api.rooms;
    else if (Array.isArray(api.lines) && api.lines.length) rawItems = api.lines;
    else if (Array.isArray(api.purchase_items) && api.purchase_items.length) rawItems = api.purchase_items;
    else rawItems = [];

    const items = rawItems.map(it => ({
      qty: it.qty ?? it.quantity ?? it.Qty ?? it.units ?? "",
      particulars: it.description ?? it.particulars ?? it.name ?? it.product_name ?? (it.product && it.product.name) ?? "",
      unitPrice: it.price ?? it.unit_price ?? it.TZS ?? it.unitPrice ?? "-",
      total: it.total ?? it.line_total ?? (it.qty && it.price ? Number(it.qty) * Number(it.price) : "-"),
      cts: it.cts ?? it.ct ?? 0
    }));

    return {
      po_number,
      po_date,
      billTo,
      items,
      company: defaultData.company
    };
  }

  const exportPDF = async () => {
    const input = printRef.current;
    if (!input) return;
    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pdfW, imgH);
      let heightLeft = imgH - pdfH;
      while (heightLeft > 0) {
        position -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfW, imgH);
        heightLeft -= pdfH;
      }
      pdf.save(`purchase-order-${data?.po_number || "po"}.pdf`);
    } catch (e) {
      console.error(e);
      window.print();
    }
  };

  if (loading) return <div style={{ padding: 30 }}>Loading Purchase Order...</div>;
  if (!data) return <div style={{ padding: 30 }}>No data</div>;

  const rows = data.items.length ? data.items : new Array(12).fill({ qty: "", particulars: "", unitPrice: "-", total: "-", cts: "" });

  return (
    <div className="poi-page">
      <div className="poi-actions">
        <button className="poi-btn" onClick={() => navigate(-1)}>Back</button>
        <div>
          <button className="poi-btn poi-btn-outline" onClick={() => navigate(-1)}>Close</button>
          <button className="poi-btn poi-btn-pdf" onClick={exportPDF}>Export PDF</button>
          <button className="poi-btn poi-btn-print" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      <div className="poi-print-area" ref={printRef}>
        <div className="poi-card">
          <header className="poi-header">
            <div className="poi-logo"><img src={logo} alt="logo" /></div>

            <div className="poi-title-area">
              <h1>PURCHASE ORDER</h1>
              <div className="poi-company">{data.company.name}</div>
              <div className="poi-company-meta">{data.company.address}</div>
              <div className="poi-company-meta">Tel: {data.company.phone} • Email: {data.company.email}</div>
              <div className="poi-company-meta">TIN: {data.company.tin}</div>
            </div>

            <div className="poi-boxes">
              <div className="poi-box">
                <div className="poi-box-label">P/O Date</div>
                <div className="poi-box-value">{data.po_date || "-"}</div>
              </div>
              <div className="poi-box">
                <div className="poi-box-label">P/O No.</div>
                <div className="poi-box-value">{data.po_number || "-"}</div>
              </div>
            </div>
          </header>

          <section className="poi-billto">
            <div className="poi-bill-title">Bill To</div>
            <table className="poi-bill-table">
              <tbody>
                <tr><td className="poi-left">Company Name</td><td className="poi-right">{data.billTo.company}</td></tr>
                <tr><td className="poi-left">Address</td><td className="poi-right">{data.billTo.address}</td></tr>
                <tr><td className="poi-left">TIN</td><td className="poi-right">{data.billTo.tin}</td></tr>
                <tr><td className="poi-left">VRN</td><td className="poi-right">{data.billTo.vrn}</td></tr>
              </tbody>
            </table>
          </section>

          <section className="poi-items">
            <table className="poi-items-table">
              <thead>
                <tr>
                  <th className="poi-col-qty">Qty</th>
                  <th className="poi-col-part">Particulars</th>
                  <th className="poi-col-unit">TZS.@</th>
                  <th className="poi-col-amt">Amount.TZS</th>
                  <th className="poi-col-cts">Cts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="poi-col-qty-cell">{r.qty}</td>
                    <td className="poi-col-part-cell">{r.particulars}</td>
                    <td className="poi-col-unit-cell">{r.unitPrice}</td>
                    <td className="poi-col-amt-cell">{r.total}</td>
                    <td className="poi-col-cts-cell">{r.cts ?? "0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <footer className="poi-footer">
            <div className="poi-totals">
              <div>GRAND TOTAL</div>
              <div className="poi-amt">
                TZS { (data.items && data.items.length) ? data.items.reduce((s, it) => s + (Number(it.total)||0), 0).toLocaleString() : "0.00" }
              </div>
            </div>

            <div className="poi-vat">
              <div>VAT</div>
              <div>NIL</div>
            </div>

            <div className="poi-grand">
              <div>GRAND TOTAL</div>
              <div>TZS {(data.items && data.items.length) ? data.items.reduce((s, it) => s + (Number(it.total)||0), 0).toLocaleString() : "0.00"}</div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}




