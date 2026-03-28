import "./InvoicePreview.css";
import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import logo from "../../../../assets/logo.png";
import jsPDF from "jspdf";

function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  return rawItems.map((it, index) => {
    const rawQty = it?.qty ?? it?.quantity ?? it?.qtys ?? it?.litres ?? it?.liters;
    const rawName = it?.name ?? it?.description ?? it?.product ?? it?.item_name ?? "";
    const rawUnitPrice = it?.unitPrice ?? it?.unit_price ?? it?.price ?? it?.rate ?? 0;

    let qty = Number(rawQty);
    let name = String(rawName || "").trim();

    // If qty is not numeric and contains text, treat it as product name
    if (!Number.isFinite(qty)) {
      if (typeof rawQty === "string" && rawQty.trim() && isNaN(Number(rawQty))) {
        name = name || rawQty.trim();
      }
      qty = Number(it?.quantity ?? 1) || 1;
    }

    if (!name && typeof rawQty === "string" && rawQty.trim() && isNaN(Number(rawQty))) {
      name = rawQty.trim();
    }

    if (!name) {
      name = `Item ${index + 1}`;
    }

    const unitPrice = Number(rawUnitPrice) || 0;

    const amount =
      Number(it?.amount ?? it?.line_total ?? it?.total ?? 0) ||
      qty * unitPrice;

    return {
      ...it,
      name,
      qty,
      unitPrice,
      price: unitPrice,
      amount,
      cts: it?.cts ?? "00",
    };
  });
}

export default function InvoicePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef(null);
  const data = location.state || {};

  const format = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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

      const filename = `${data.invoiceNumber || "invoice"}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed — opening native print dialog instead.");
      window.print();
    }
  };

  const items = normalizeItems(data.items);

  const subtotal = items.reduce(
    (s, it) =>
      s + Number(it.amount || (Number(it.qty || 0) * Number(it.unitPrice || it.price || 0))),
    0
  );
  const vat = subtotal * 0.18;
  const grandTotal = subtotal + vat;

  return (
    <div className="invoice-page">
      <div className="invoice-actions">
        <div>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        <div className="invoice-actions-right">
          <button className="btn btn-edit" onClick={handleEdit}>
            Edit
          </button>
          <button className="btn btn-outline" onClick={handleDeliveryNote}>
            Delivery Note
          </button>
          <button className="btn btn-pdf" onClick={exportPDF}>
            Export PDF
          </button>
          <button className="btn btn-print" onClick={printPage}>
            Print
          </button>
        </div>
      </div>

      <div className="invoice-print-area" ref={printRef}>
        <div className="invoice-card paper-a4">
          <header className="inv-header">
            <div className="inv-header-left">
              {data.companyLogo ? (
                <img src={data.companyLogo} alt="logo" className="inv-logo" />
              ) : (
                <img src={logo} alt="Company Logo" className="inv-logo" />
              )}
            </div>

            <div className="inv-header-center">
              <div className="tax-title">PROFORMA INVOICE</div>
              <div className="company-name">
                {data.company?.name || "EVOSHA TRADING COMPANY LIMITED"}
              </div>
              <div className="company-meta">
                <div>{data.company?.address || "P.O.Box 13134, Dar es Salaam"}</div>
                <div>Tel: {data.company?.phone || "+255 715 894 738, +255 754 881 266"}</div>
                <div>
                  Email: {data.company?.email || "evosha2010@yahoo.com"} — Web:{" "}
                  {data.company?.website || "www.evosha.co.tz"}
                </div>
              </div>
            </div>
          </header>

          <section className="inv-top-grids">
            <div className="inv-header-right">
              <div className="meta-box top-meta">
                <div className="meta-row">
                  <div className="meta-left">Proforma No:</div>
                  <div className="meta-right">{data.invoiceNumber || "1954"}</div>
                </div>
                <div className="meta-row">
                  <div className="meta-left">Date:</div>
                  <div className="meta-right">{data.date || "25/02/2025"}</div>
                </div>
              </div>

              <div className="meta-box tins">
                <div><strong>TIN:</strong> {data.company?.tin || "113-109-521"}</div>
                <div><strong>VRN:</strong> {data.company?.vrn || "400093561"}</div>
              </div>
            </div>

            <div className="bill-to">
              <div className="box-title">PROFORMA SENT TO</div>
              <table className="info-table">
                <tbody>
                  <tr><td>Company Name</td><td>{data.billTo?.company || "Tanzania Breweries Plc"}</td></tr>
                  <tr><td>Address</td><td>{data.billTo?.address || "P.O. Box 6314 Mbeya"}</td></tr>
                  <tr><td>TIN</td><td>{data.billTo?.tin || "100-159-864"}</td></tr>
                  <tr><td>VRN</td><td>{data.billTo?.vrn || "10-001011-A"}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="depot-box">
              <div className="box-title">DELIVERY SITE</div>
              <table className="info-table">
                <tbody>
                  <tr><td>Depot</td><td>{data.meta?.depot || "CAMEL OIL (T) LTD"}</td></tr>
                  <tr><td>Shipment No.</td><td>{data.meta?.shipment || "MT ASPHALT SONATA"}</td></tr>
                  <tr><td>Driver Name</td><td>{data.meta?.driver || "YUNUS ISSA SELEMANI"}</td></tr>
                  <tr><td>Truck No.</td><td>{data.meta?.truck || "T 390 EFB"}</td></tr>
                  <tr><td>Trailer No.</td><td>{data.meta?.trailer || "T422 CFR"}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="inv-items-section">
            <table className="invoice-main-table">
              <thead>
                <tr>
                  <th className="incol-qty col-qty">Qty</th>
                  <th className="col-desc">Product description</th>
                  <th className="col-unit">TZS@</th>
                  <th className="col-amount">Amount.TZS</th>
                  <th className="col-cts">Cts</th>
                </tr>
              </thead>

              <tbody>
                {items.map((it, i) => {
                  const qty = Number(it.qty || 0);
                  const unitPrice = Number(it.unitPrice || it.price || 0);
                  const total = Number(it.amount || qty * unitPrice);

                  return (
                    <tr key={i}>
                      <td className="incol-qty col-qty">
                        <div className="qty-value">{qty.toLocaleString()}</div>
                        <div className="litres">litres</div>
                      </td>

                      <td className="col-desc">
                        <div className="product-name">{it.name}</div>
                      </td>

                      <td className="col-unit">
                        TZS {unitPrice.toLocaleString()}
                      </td>

                      <td className="col-amount">
                        TZS {total.toLocaleString()}
                      </td>

                      <td className="col-cts">{it.cts || "00"}</td>
                    </tr>
                  );
                })}

                <tr className="body-space">
                  <td colSpan="5"></td>
                </tr>
              </tbody>

              <tfoot>
                <tr className="totals-row">
                  <td colSpan="3" className="totals-labels">
                    <div>SUB TOTAL</div>
                    <div>ADD VAT 18%</div>
                    <div className="grand">GRAND TOTAL</div>
                  </td>

                  <td className="totals-amounts">
                    <div>TZS {format(subtotal)}</div>
                    <div>TZS {format(vat)}</div>
                    <div className="grand">TZS {format(grandTotal)}</div>
                  </td>

                  <td className="totals-cts">
                    <div>00</div>
                    <div>00</div>
                    <div>00</div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section className="inv-signatures">
            <div className="sig-col">
              <div className="sig-title">Prepared by</div>
              <div className="sig-line" />
            </div>

            <div className="sig-col">
              <div className="sig-title">Checked By</div>
              <div className="sig-line" />
            </div>

            <div className="sig-col">
              <div className="sig-title">
                Authorized by<br />
                for {data.company?.name || "EVOSHA Trading Co. Ltd"}
              </div>
              <div className="sig-box" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}