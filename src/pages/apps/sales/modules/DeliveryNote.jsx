// src/pages/admin/sales/modules/DeliveryNote.jsx
import React, { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./DeliveryNote.css";
import logo from "../../../../assets/logo.png";
import API from "../../../../services/api";

/**
 * DeliveryNote component
 * - expects navigate("/admin/sales/delivery-note", { state: { id: saleId } })
 * - fetches /api/sales/{id}/delivery_note/ (adjust base path if needed)
 * - falls back to default/mock data for missing fields so UI doesn't break
 */

export default function DeliveryNote() {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Mock/default dataset used when API doesn't provide everything
  const defaultData = {
    invoiceNumber: "2355",
    date: "01/01/2026",
    customer: {
      name: "Tanzania Distilleries limited",
      address: "P.O. Box, Dar es salaam",
      phone: "",
      code: "45773",
      tin: "100-104-946",
      vrn: "10-001015-B",
    },
    driver: {
      name: "ENURE MICHAEL KWEKA",
      truckNo: "T 489 ELD",
      trailerNo: "T 852 ELH",
    },
    rooms: [
      { room: "Room no. 1", litres: "4,000", upper: "ETCL 10340", bottom: "ETCL 10686" },
      { room: "Room no. 2", litres: "5,000", upper: "ETCL 10396", bottom: "ETCL 10693" },
      { room: "Room no. 3", litres: "5,000", upper: "ETCL 10339", bottom: "ETCL 10699" },
      { room: "Room no. 4", litres: "5,000", upper: "ETCL 10328", bottom: "ETCL 10669" },
      { room: "Room no. 5", litres: "5,000", upper: "ETCL 10338", bottom: "ETCL 10690" },
    ],
    logoSrc: logo,
  };

  // helper to safely pick id from many possible shapes (robust)
  const saleId =
    location?.state?.id ??
    location?.state?.saleData?.id ??
    location?.state?.backendResponse?.id ??
    null;

  useEffect(() => {
    let mounted = true;

    const fetchDelivery = async () => {
      if (!saleId) {
        // No id passed — use merged fallback state from any location.state
        const loc = location.state && typeof location.state === "object" ? location.state : {};
        const merged = mergeWithDefaults(loc);
        if (mounted) {
          setData(merged);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        // adjust endpoint if your backend uses /api/sales/... or /sales/...
        const res = await API.get(`/sales/${saleId}/delivery_note/`);
        const apiData = res.data || {};

        // Map API fields to UI expected names with safe fallbacks
        const mapped = {
          invoiceNumber:
            apiData.invoiceNumber ||
            apiData.invoice_number ||
            apiData.deliveryNumber ||
            apiData.id ||
            defaultData.invoiceNumber,
          date: apiData.date || apiData.dn_date || defaultData.date,

          // ✅ ADD THESE TWO
          po_number: apiData.po_number || "",
          po_date: apiData.po_date || "",

          customer: {
            name: apiData.customer || apiData.customer_name || (apiData.customer_obj && apiData.customer_obj.name) || defaultData.customer.name,
            address: apiData.address || (apiData.customer_obj && apiData.customer_obj.address) || defaultData.customer.address,
            phone: apiData.customer_phone || (apiData.customer_obj && apiData.customer_obj.phone) || defaultData.customer.phone,
            code: apiData.customer_code || (apiData.customer_obj && apiData.customer_obj.code) || defaultData.customer.code,
            tin: apiData.tin || (apiData.customer_obj && apiData.customer_obj.tin) || defaultData.customer.tin,
            vrn: apiData.vrn || (apiData.customer_obj && apiData.customer_obj.vrn) || defaultData.customer.vrn,
          },
          driver: {
            name: apiData.driver || apiData.driver_name || (apiData.meta && apiData.meta.driver) || defaultData.driver.name,
            truckNo: apiData.truck || apiData.truck_no || (apiData.meta && apiData.meta.truck) || defaultData.driver.truckNo,
            trailerNo: apiData.trailer || apiData.trailer_no || (apiData.meta && apiData.meta.trailer) || defaultData.driver.trailerNo,
          },
          rooms: (Array.isArray(apiData.rooms) && apiData.rooms.length ? apiData.rooms : (apiData.compartments || [])),
          logoSrc: logo,
        };

        // Ensure rooms are in expected shape: {room, litres, upper, bottom}
        mapped.rooms = mapped.rooms.map((r) => {
          // possible api keys: room, compartment_number, litres, upper_seal_number, lower_seal_number, upper, bottom
          return {
            room: r.room || r.compartment_number || r.name || "-",
            litres: r.litres ?? r.volume ?? r.litre ?? r.quantity ?? "-",
            upper: r.upper || r.upper_seal_number || r.upperSeal || r.upper_seal || "-",
            bottom: r.bottom || r.lower_seal_number || r.lowerSeal || r.lower_seal || "-",
          };
        });

        // if rooms are empty, fall back to default mock rows to keep layout
        if (!mapped.rooms.length) mapped.rooms = defaultData.rooms;

        if (mounted) {
          setData({ ...defaultData, ...mapped });
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch delivery note:", err);
        if (mounted) {
          setFetchError(err);
          // fallback to merged local state
          const loc = location.state && typeof location.state === "object" ? location.state : {};
          setData(mergeWithDefaults(loc));
          setLoading(false);
        }
      }
    };

    fetchDelivery();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId, location.state]);

  // Merge a lightweight location.state with defaultData (for manual nav)
  function mergeWithDefaults(loc) {
    const locObj = loc || {};
    return {
      ...defaultData,
      ...locObj,
      customer: { ...defaultData.customer, ...(locObj.customer || {}) },
      driver: { ...defaultData.driver, ...(locObj.driver || {}) },
      rooms:
        Array.isArray(locObj.rooms) && locObj.rooms.length
          ? locObj.rooms.map((r) => ({
              room: r.room || r.compartment_number || r.name || "-",
              litres: r.litres ?? r.volume ?? r.litre ?? r.quantity ?? "-",
              upper: r.upper || r.upper_seal_number || r.upperSeal || "-",
              bottom: r.bottom || r.lower_seal_number || r.lowerSeal || "-",
            }))
          : defaultData.rooms,
      logoSrc: locObj.logoSrc || defaultData.logoSrc,
    };
  }
  console.log("DELIVERY LOCATION:", location.state);
  console.log("SALE ID:", saleId);
  const handlePrint = () => window.print();
  const handleBack = () => navigate(-1);

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
        logging: false,
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

      const filename = `delivery-note-${(data && data.invoiceNumber) || "note"}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed — opening native print dialog instead.");
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="invoice-page">
        <div style={{ padding: 40, textAlign: "center" }}>
          <div>Loading Delivery Note...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="invoice-page">
        <div style={{ padding: 40, textAlign: "center" }}>
          <div>Delivery data not available.</div>
          <button className="btn" onClick={handleBack} style={{ marginTop: 12 }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-page">
      {/* Top actions — left Back, right Export/Print */}
      <div className="invoice-actions">
        <div>
          <button className="btn btn-outline" onClick={handleBack}>
            Back
          </button>
        </div>
        <div className="invoice-actions-right">
          <button className="btn btn-pdf" onClick={exportPDF}>
            Export PDF
          </button>
          <button className="btn btn-print" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {/* Print area (captured by html2canvas) */}
      <div className="delivery-note-print-area" ref={printRef}>
        <div className="delivery-note-outer">
          <div className="delivery-note-inner">
            {/* Header */}
            <div className="dn-header">
              <div className="dn-left">
                <img
                  src={data.logoSrc}
                  alt="logo"
                  className="dn-logo"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div className="company-name single-line">EVOSHA TRADING COMPANY LIMITED</div>
              </div>

              <div className="dn-right" role="banner">
                <div className="dn-title">DELIVERY NOTE</div>
                <div className="dn-contact">
                  <div>P. O. Box 13134, Dar es Salaam</div>
                  <div>Tel: 0715-894738, 0754-881 266</div>
                  <div>Email: evosha2010@yahoo.com, Website www.evosha.co.tz</div>
                  <div className="muted">Dealers in: Petroleum Products and Port Services</div>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="dn-meta">
              <div className="meta-left">
                <div>
                  <strong>Delivery Note No.</strong>{" "}
                  <span className="meta-value">{data.invoiceNumber}</span>
                </div>
                <div>
                  <strong>Purchase Order No.</strong>{" "}
                  <span className="meta-small">{data.po_number || "-"}</span>
                </div>
                <div>
                  <strong>Purchase Order Date</strong>{" "}
                  <span className="meta-small">{data.po_date || "-"}</span>
                </div>
              </div>
              <div className="meta-right">
                <div>
                  <strong>DN Date:</strong>{" "}
                  <span className="meta-value">{data.date}</span>
                </div>
                <div>
                  <strong>ETCL TIN</strong>{" "}
                  <span className="meta-small">TIN: 113-109-521</span>
                </div>
                <div>
                  <strong>ETCL VRN</strong>{" "}
                  <span className="meta-small">VRN: 400093561</span>
                </div>
              </div>
            </div>

            {/* Customer & Driver */}
            <div className="dn-customer-driver">
              <div className="customer-box">
                <div className="box-header">Customer</div>

                <div className="box-row">
                  <div className="label">Company Name</div>
                  <div className="value">{data.customer?.name}</div>
                </div>

                <div className="box-row">
                  <div className="label">Address</div>
                  <div className="value two-part">
                    <span>{String(data.customer?.address || "").split(",")[0] || "P.O. Box"}</span>
                    <span className="sep">{String(data.customer?.address || "").split(",")[1] || "Dar es salaam"}</span>
                  </div>
                </div>

                <div className="box-row">
                  <div className="label">TIN</div>
                  <div className="value">{data.customer?.tin}</div>
                </div>

                <div className="box-row">
                  <div className="label">VRN</div>
                  <div className="value">{data.customer?.vrn}</div>
                </div>
              </div>

              <div className="driver-box">
                <div className="box-header">Driver Name</div>
                <div className="driver-value">{data.driver?.name}</div>

                <div className="driver-row">
                  <div className="dlabel">Truck No</div>
                  <div className="dvalue">{data.driver?.truckNo}</div>
                </div>

                <div className="driver-row">
                  <div className="dlabel">Trailer No</div>
                  <div className="dvalue">{data.driver?.trailerNo}</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="dn-table-area">
              <div className="table-side" aria-hidden="true" />
              <div className="dn-table-wrap">
                <table className="dn-table" role="table" aria-label="Delivery table">
                  <thead>
                    <tr>
                      <th className="left-col">ROOM NO</th>
                      <th>VOLUME LITRES</th>
                      <th colSpan={2}>SEAL NUMBER</th>
                      <th className="notes-col">NOTES</th>
                    </tr>
                    <tr className="subhead">
                      <th />
                      <th />
                      <th className="subcell">Upper</th>
                      <th className="subcell">Bottom</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {(data.rooms || []).map((r, i) => (
                      <tr key={i}>
                        <td className="room">{r.room}</td>
                        <td className="litres">{String(r.litres)}</td>
                        <td className="seal">{r.upper}</td>
                        <td className="seal">{r.bottom}</td>
                        <td className="notes">&nbsp;</td>
                      </tr>
                    ))}

                    <tr className="blank-area-row">
                      <td colSpan={4} className="big-blank">&nbsp;</td>
                      <td className="vertical-notes">&nbsp;</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer / Signatures */}
            <div className="dn-footer dn-footer-updated">
              <div className="footer-left">
                <div className="footer-row name-row">
                  <div className="footer-label">Name:</div>
                  <div className="footer-line name-line">______________________________</div>
                </div>

                <div className="footer-row receiving-row">
                  <div className="receipt-caption">Receiving Officer</div>
                </div>

                <div className="stamp-box-left">
                  <div className="stamp-placeholder" />
                </div>
              </div>

              <div className="footer-right">
                <div className="footer-row signature-row">
                  <div className="footer-label">Signature:</div>
                  <div className="footer-line signature-line">______________________________</div>
                </div>

                <div className="footer-row date-row">
                  <div className="footer-label">Date:</div>
                  <div className="footer-line date-line">______________________________</div>
                </div>

                <div className="footer-row deliver-row">
                  <div className="footer-label deliver-label">Deliver Stamp:</div>
                  <div className="footer-line deliver-line">______________________________</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}