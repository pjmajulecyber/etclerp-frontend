import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./StatementPreview.css";

export default function StatementPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state || {};
  const { customer = {}, transactions = [], totals = {}, buckets = {} } = data;

  const areaRef = useRef(null);

  const f = (n) => Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const exportPDF = async () => {
    const node = areaRef.current;
    if (!node) return;

    const canvas = await html2canvas(node, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
    pdf.save(`${customer.code || "customer"}-statement.pdf`);
  };

  return (
    <div className="statement-page">
      <div className="controls">
        <button className="btn ghost" onClick={() => navigate(-1)}>Back</button>
        <button className="btn primary" onClick={exportPDF}>Download PDF</button>
      </div>

      <div ref={areaRef} className="statement-doc">

        {/* ===== TITLE ===== */}
        <div className="statement-title">Statement</div>

        {/* ===== TOP HEADER ===== */}
        <div className="statement-top">

          <div className="company-left">
            <strong>EVOSHA TRADING COMPANY LIMITED</strong>
            <div>12th Floor PSSSF Commercial Complex</div>
            <div>Sam Nujoma Road</div>

            <div className="customer-code">{customer.code}</div>
            <div className="customer-name">{customer.name}</div>
          </div>

          <div className="company-right">
            <div><strong>Telephone</strong> {customer.phone || "-"}</div>
            <div><strong>Fax</strong> -</div>

            <div className="spacer" />

            <div><strong>Date</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Amount Due</strong> {f(totals.balance)} TSHS</div>

            <div className="credit-terms">30 Days</div>
          </div>

        </div>

        {/* ===== TABLE ===== */}
        <table className="statement-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Description</th>
              <th>Allocated To</th>
              <th className="num">Debit</th>
              <th className="num">Credit</th>
              <th className="num">Balance</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t, i) => (
              <tr key={i}>
                <td>{t.date}</td>
                <td>{t.reference || "-"}</td>
                <td>{t.product}</td>
                <td>{t.allocated || ""}</td>
                <td className="num">{t.debit ? f(t.debit) : ""}</td>
                <td className="num">{t.credit ? f(t.credit) : ""}</td>
                <td className="num">{f(t.running)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== AGING ===== */}
        <div className="aging-row">
          <div>180 Days</div>
          <div>150 Days</div>
          <div>120 Days</div>
          <div>90 Days</div>
          <div>60 Days</div>
          <div>30 Days</div>
          <div>Current</div>
          <div>Amount Due</div>
        </div>

        <div className="aging-values">
          <div>{f(buckets["180"])}</div>
          <div>{f(buckets["150"])}</div>
          <div>{f(buckets["120"])}</div>
          <div>{f(buckets["90"])}</div>
          <div>{f(buckets["60"])}</div>
          <div>{f(buckets["30"])}</div>
          <div>{f(buckets["current"])}</div>
          <div>{f(totals.balance)}</div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="statement-footer">
          <div>
            <div>{customer.code}</div>
            <div>{customer.name}</div>
          </div>

          <div className="footer-company">
            <strong>EVOSHA TRADING COMPANY LIMITED</strong>
            <div>P.O Box 3434</div>
          </div>
        </div>

      </div>
    </div>
  );
}
