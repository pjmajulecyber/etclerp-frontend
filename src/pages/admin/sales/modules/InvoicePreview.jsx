

// src/pages/admin/sales/modules/InvoicePreview.jsx
import "./InvoicePreview.css";
import React, { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import logo from "../../../../assets/logo.png";
import jsPDF from "jspdf";
import API from "../../../../services/api";

export default function InvoicePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef(null);
  const saleId =
  location.state?.id ||
  location.state?.saleId ||
  location.state?.saleData?.id ||
  location.state?.backendResponse?.id ||
  null;

console.log("SALE ID:", saleId);

  // --- COMPANY HEADER (allowed to remain static / hardcoded) ---
  const COMPANY = {
    name: "EVOSHA TRADING COMPANY LIMITED",
    address: "P.O.Box 13134, Dar es Salaam",
    phone: "+255 715 894 738, +255 754 881 266",
    email: "evosha2010@yahoo.com",
    website: "www.evosha.co.tz",
    logo: logo,
  };

  // --- Local state for invoice data coming from backend API ---
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper: try to extract an identifier from location.state or query params
  const findInvoiceId = () => {
    // possible places where apps place id
    const s = location.state || {};
    if (s?.id) return s.id;
    if (s?.saleId) return s.saleId;
    if (s?.saleData?.id) return s.saleData.id;
    if (s?.sale?.id) return s.sale.id;
    if (s?.invoiceId) return s.invoiceId;
    // check search params
    const qp = new URLSearchParams(location.search);
    const qId = qp.get("id") || qp.get("invoiceId") || qp.get("saleId");
    if (qId) return qId;
    // last resort: invoiceNumber (will return an object to signal "search by invoiceNumber")
    if (s?.invoiceNumber) return { invoiceNumber: s.invoiceNumber };
    return null;
  };

  useEffect(() => {
    let mounted = true;

    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);

      // Try to get either an id or an object containing invoiceNumber
      const idOrObj = findInvoiceId();
      console.log("Invoice ID detected:", idOrObj);

      try {
        let respData = null;

        if (!idOrObj) {
          // no id and no invoiceNumber provided, try to fall back to raw state object
          if (location.state && typeof location.state === "object" && Object.keys(location.state).length > 0) {
            // use provided object as best-effort fallback
            console.warn("No invoice id found; using provided state object as invoice data.");
            respData = location.state;
          } else {
            throw new Error("No invoice identifier provided (location.state or query).");
          }
        } else if (typeof idOrObj === "object" && idOrObj.invoiceNumber) {
          // We got an invoiceNumber object; search for the sale to obtain its id, then fetch full invoice
          const searchRes = await API.get(`/sales`, { params: { invoiceNumber: idOrObj.invoiceNumber } });

          // normalize possible shapes: { results: [...] } or direct array or single object
          const results = searchRes?.data?.results || searchRes?.data || [];
          const sale = Array.isArray(results) ? results[0] : results;

          if (!sale || !sale.id) {
            throw new Error("Sale not found for invoice number: " + idOrObj.invoiceNumber);
          }

          const invoiceRes = await API.get(`/sales/${sale.id}/invoice/`);
          respData = invoiceRes?.data;
        } else {
          // idOrObj is an id - fetch the invoice endpoint directly
          const saleId = idOrObj;
          const invoiceRes = await API.get(`/sales/${saleId}/invoice/`);
          console.log("Invoice API response:", invoiceRes.data);
          respData = invoiceRes?.data;
        }

        if (!mounted) return;

        if (!respData) {
          throw new Error("Invoice not found from API.");
        }

        // set normalized invoice data into state
        setData(respData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load invoice:", err);
        if (!mounted) return;
        setError(err?.message || "Failed to load invoice");
        // best-effort: if location.state has something useful, show it
        if (location.state && Object.keys(location.state).length > 0) {
          setData(location.state);
        } else {
          setData({});
        }
        setLoading(false);
      }
    };

    fetchInvoice();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const format = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleEdit = () => {
    navigate("/admin/sales/modules/add", {
      state: { backgroundLocation: location, saleData: data },
    });
  };

  const handleDeliveryNote = () => {
    navigate("/admin/sales/delivery-note", {
      state: data,
    });
  };

  const printPage = () => {
    window.print();
  };

  const exportPDF = async () => {
    const input = printRef.current;
    if (!input) {
      alert("Nothing to export.");
      return;
    }
    try {
      const SCALE = 2;
      const canvas = await html2canvas(input, {
        scale: SCALE,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = `${(data && (data.invoiceNumber || data.invoice_no)) || "invoice"}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed — opening native print dialog instead.");
      window.print();
    }
  };

  // --- calculations (same logic as before) ---
  const items = Array.isArray(data?.items) ? data.items : [];

  const passedCalc = data?.calculations && typeof data.calculations === "object"
    ? {
        subtotal: Number(data.calculations.subtotal || 0),
        totalTax: Number(data.calculations.totalTax || 0),
        discountAmount: Number(data.calculations.discountAmount || 0),
        grandTotal: Number(data.calculations.grandTotal || 0),
      }
    : null;

  let subtotal = 0;
  let totalTax = 0;
  let discountAmount = 0;
  let grandTotal = 0;

  if (passedCalc) {
    subtotal = passedCalc.subtotal;
    totalTax = passedCalc.totalTax;
    discountAmount = passedCalc.discountAmount;
    grandTotal = passedCalc.grandTotal;
  } else {
    items.forEach((it) => {
      const qty = Number(it.qty || 0);
      const price = Number(it.price || 0);
      const lineTotal = qty * price;
      const taxType = (it.taxType || "Exclusive").toString().toLowerCase();

      if (taxType === "exclusive") {
        subtotal += lineTotal;
        totalTax += lineTotal * 0.18;
      } else {
        const beforeTax = lineTotal / 1.18;
        subtotal += beforeTax;
        totalTax += lineTotal - beforeTax;
      }
    });

    const discountAll = Number(data?.discountAll ?? data?.discount ?? 0);
    discountAmount = subtotal * (discountAll / 100);
    grandTotal = subtotal + totalTax - discountAmount;
  }

  const paidAmount = Number(data?.paidAmount ?? data?.paid ?? 0);
  const outstanding = grandTotal - paidAmount;

  // Use a safe object to avoid undefined errors in JSX
  const d = data || {};

  return (
    <div className="invoice-page">
      <div className="invoice-actions">
        <div>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>Back</button>
        </div>

        <div className="invoice-actions-right">
          <button className="inedit" onClick={handleEdit}>Edit</button>
          <button
              className="btn btn-outline"
              onClick={() => {
                console.log("DELIVERY CLICK ID:", data?.id);

                navigate("/admin/sales/delivery-note", {
                  state: { id: data?.id }
                });
              }}
              >
              View Delivery Note
            </button>
          <button className="btn btn-print" onClick={exportPDF}>Print PDF</button>
        </div>
      </div>

      <div className="invoice-print-area" ref={printRef}>
        <div className="invoice-card paper-a4">
          <header className="inv-header">
            <div className="inv-header-left">
              {/* Use static company logo from top header */}
              <img src={COMPANY.logo} alt="logo" className="inv-logo" />
            </div>

            <div className="inv-header-center">
              <div className="tax-title">TAX INVOICE</div>
              <div className="incompany-name">{COMPANY.name}</div>
              <div className="company-meta">
                <div>{COMPANY.address}</div>
                <div>Tel: {COMPANY.phone}</div>
                <div>Email: {COMPANY.email} — Web: {COMPANY.website}</div>
              </div>
            </div>
          </header>

          <section className="inv-top-grids">
            <div className="inv-header-right">
              <div className="meta-box top-meta">
                <div className="meta-row">
                  <div ><strong>InvoiceNo:</strong></div>
                  <div >{d.invoiceNumber ?? d.invoice_no ?? ""}</div>
                </div>
                <div className="meta-row">  
                  <div ><strong>Date:</strong></div>
                  <div >{d.date ?? d.invoice_date ?? ""}</div>
                </div>
              </div>

              <div className="meta-box tins">
                <div><strong>TIN:</strong> {d.company?.tin ?? ""}</div>
                <div><strong>VRN:</strong> {d.company?.vrn ?? ""}</div>



              </div>
              <div className="meta-box tins">
                <div><strong>Purchase Order:</strong> {d.purchaseOrder ?? d.po_number ?? d.poNo ?? ""}</div>
                <div><strong>Date:</strong> {d.po_date ?? d.purchaseDate ?? ""}</div>
              </div>
            </div>  

            <div className="bill-to">
              <div className="box-title">Bill To:</div>
              <table className="info-table">
                <tbody>
                  <tr><td>Company Name</td><td>{d.billTo?.company ?? d.customerName ?? ""}</td></tr>
                  <tr><td>Address</td><td>{d.billTo?.address ?? d.customerAddress ?? ""}</td></tr>
                  <tr><td>TIN</td><td>{d.billTo?.tin ?? ""}</td></tr>
                  <tr><td>VRN</td><td>{d.billTo?.vrn ?? ""}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="depot-box">
              <div className="box-title">Depot</div>
              <table className="info-table">
                <tbody>
                  <tr><td>Depot</td><td>{d.meta?.depot ?? d.depot ?? ""}</td></tr>
                  <tr><td>Shipment No.</td><td>{d.meta?.shipment ?? d.shipment ?? ""}</td></tr>
                  <tr><td>Driver Name</td><td>{d.meta?.driver ?? d.driver_name ?? ""}</td></tr>
                  <tr><td>Truck No.</td><td>{d.meta?.truck ?? d.truck_no ?? ""}</td></tr>
                  <tr><td>Trailer No.</td><td>{d.meta?.trailer ?? d.trailer_no ?? ""}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="inv-items-section">
            <table className="invoice-main-table">
              <thead>
                <tr>
                  <th className="incol-qty">Qty</th>
                  <th className="col-desc">Product description</th>
                  <th className="col-unit">Unit Cost</th>
                  <th className="col-amount">Total Item Cost</th>
                  <th className="col-cts">Cts</th>
                </tr>
              </thead>

              <tbody>
                {items.map((it, i) => {
                  const qty = Number(it.qty || 0);
                  const price = Number(it.price || 0);
                  const total = qty * price;

                  return (
                    <tr key={i}>
                      <td className="col-qty">
                        {qty.toLocaleString()}
                        <div className="litres"></div>
                      </td>

                      <td className="col-desc">{it.name ?? it.description ?? ""}</td>

                      <td className="col-unit">
                        TZS {price.toLocaleString()}
                      </td>

                      <td className="col-amount">
                        TZS {total.toLocaleString()}
                      </td>

                      <td className="col-cts">00</td>
                    </tr>
                  );
                })}

                {/* LARGE BODY SPACE */}
                <tr className="body-space">
                  <td colSpan="5"></td>
                </tr>
              </tbody>

              <tfoot>
                <tr className="totals-row">
                  {/* Merge first 3 columns */}
                  <td colSpan="3" className="totals-labels">
                    <div>SUB TOTAL</div>
                    <div>ADD VAT 18%</div>
                    <div className="grand">GRAND TOTAL</div>
                  </td>

                  {/* Amount column */}
                  <td className="totals-amounts">
                    <div>TZS {format(subtotal)}</div>
                    <div>TZS {format(totalTax)}</div>
                    <div className="grand">TZS {format(grandTotal)}</div>
                  </td>

                  {/* Cts column */}
                  <td className="totals-cts">
                    <div>00</div>
                    <div>00</div>
                    <div>00</div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* ===== TOP SIGNATURE ROW ===== */}
          <section>
            <div className="sig-row">
              {/* Prepared By */}
              <div className="sig-col">
                <div className="sig-title">Prepared By:</div>

                <div className="sig-field">
                  <span>Name:</span>
                  <div className="sig-line" />
                </div>

                <div className="sig-field">
                  <span>Sign:</span>
                  <div className="sig-line" />
                </div>
              </div>

              {/* Reviewed By */}
              <div className="sig-col">
                <div className="sig-title">Reviewed By:</div>

                <div className="sig-field">
                  <span>Name</span>
                  <div className="sig-line" />
                </div>

                <div className="sig-field">
                  <span>Sign:</span>
                  <div className="sig-line" />
                </div>
              </div>

              {/* Authorized */}
              <div className="sig-col">
                <div className="sig-title">
                  Approved/Authorized :
                  <br />
                  for {d.company?.name ?? ""}
                </div>

                <div className="sig-field">
                  <span>Sign:</span>
                  <div className="sig-line" />
                </div>
              </div>
            </div>

            {/* ===== BANK DETAILS HEADER ===== */}
            <div className="bank-header">
              <div className="make-payment">Make Payment</div>
              <div className="bank-title">BANK DETAILS</div>
            </div>

            {/* ===== BANK DETAILS GRID ===== */}
            <div className="bank-grid">
              {/* Labels column */}
              <div className="bank-labels">
                <div>Bank Name:</div>
                <div>Bank Branch Name:</div>
                <div>Account Number:</div>
                <div>Account Name:</div>
                <div>Swift Code:</div>
                <div>Currency:</div>
              </div>

              {/* CRDB */}
              <div className="bank-col">
                <div className="bank-red">{d.bankDetails?.crdb?.name ?? "CRDB BANK LIMITED"}</div>
                <div className="bank-red">{d.bankDetails?.crdb?.branch ?? "UBUNGO BRANCH"}</div>
                <div className="bank-red">{d.bankDetails?.crdb?.account ?? "1.50435E+11"}</div>
                <div className="bank-red">{d.bankDetails?.crdb?.accountName ?? COMPANY.name}</div>
                <div className="bank-red">{d.bankDetails?.crdb?.swift ?? "CORUTZTZ"}</div>
                <div className="bank-red">{d.bankDetails?.crdb?.currency ?? "TZS"}</div>
              </div>

              {/* KCB */}
              <div className="bank-col">
                <div className="bank-red">{d.bankDetails?.kcb?.name ?? "KCB BANK LTD"}</div>
                <div className="bank-red">{d.bankDetails?.kcb?.branch ?? "MBAGALA BRANCH"}</div>
                <div className="bank-red">{d.bankDetails?.kcb?.account ?? "3390982256"}</div>
                <div className="bank-red">{d.bankDetails?.kcb?.accountName ?? COMPANY.name}</div>
                <div className="bank-red">{d.bankDetails?.kcb?.swift ?? "KCBLTZTZ"}</div>
                <div className="bank-red">{d.bankDetails?.kcb?.currency ?? "TZS"}</div>
              </div>

              {/* STANBIC */}
              <div className="bank-col">
                <div className="bank-red">{d.bankDetails?.stanbic?.name ?? "STANBIC BANK LIMITED"}</div>
                <div className="bank-red">{d.bankDetails?.stanbic?.branch ?? "CENTRAL BRANCH"}</div>
                <div className="bank-red">{d.bankDetails?.stanbic?.account ?? "9.12E+12"}</div>
                <div className="bank-red">{d.bankDetails?.stanbic?.accountName ?? COMPANY.name}</div>
                <div className="bank-red">{d.bankDetails?.stanbic?.swift ?? "CORUTZTZ"}</div>
                <div className="bank-red">{d.bankDetails?.stanbic?.currency ?? "TZS"}</div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}