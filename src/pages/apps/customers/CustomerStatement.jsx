import "../sales/SalesList.css";
import "./CustomerStatement.css";
import { useState, useMemo, useEffect, useRef } from "react";

export default function CustomerStatement() {
  const statementRef = useRef(null);

  const [rangeFilter, setRangeFilter] = useState("month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(20);

  const f = (n) => (Number(n) || 0).toLocaleString();

  const sales = useMemo(() => {
    try {
      const stored = sessionStorage.getItem("sales_list");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const filtered = useMemo(() => {
    let rows = [...sales];

    const today = new Date();
    let start = null;

    if (rangeFilter === "month") start = new Date(today.setMonth(today.getMonth() - 1));
    if (rangeFilter === "3month") start = new Date(today.setMonth(today.getMonth() - 3));
    if (rangeFilter === "6month") start = new Date(today.setMonth(today.getMonth() - 6));
    if (rangeFilter === "12month") start = new Date(today.setMonth(today.getMonth() - 12));

    if (rangeFilter !== "all" && start) {
      rows = rows.filter(r => new Date(r.date) >= start);
    }

    if (fromDate) rows = rows.filter(r => new Date(r.date) >= new Date(fromDate));
    if (toDate) rows = rows.filter(r => new Date(r.date) <= new Date(toDate));

    rows.sort((a, b) => new Date(a.date) - new Date(b.date));

    let running = 0;

    return rows.map(r => {
      const debit = Number(r.amount || 0);
      const credit = Number(r.paid || 0);
      running += debit - credit;

      return {
        date: r.date,
        product: r.invoice,
        debit,
        credit,
        running
      };
    });
  }, [sales, rangeFilter, fromDate, toDate]);

  const totals = useMemo(() => {
    const totalDebit = filtered.reduce((a, b) => a + b.debit, 0);
    const totalCredit = filtered.reduce((a, b) => a + b.credit, 0);
    const balance = totalDebit - totalCredit;
    return { totalDebit, totalCredit, balance };
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const paginatedRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const agingBuckets = useMemo(() => {
    const buckets = {
      "30": 0,
      "90": 0,
      "180": 0,
      "240": 0,
      "366": 0,
      "gt366": 0
    };

    const today = new Date();

    sales.forEach(s => {
      const diff = Math.floor((today - new Date(s.date)) / (1000 * 60 * 60 * 24));
      const outstanding = Number(s.outstanding || 0);
      if (outstanding <= 0) return;

      if (diff <= 30) buckets["30"] += outstanding;
      else if (diff <= 90) buckets["90"] += outstanding;
      else if (diff <= 180) buckets["180"] += outstanding;
      else if (diff <= 240) buckets["240"] += outstanding;
      else if (diff <= 366) buckets["366"] += outstanding;
      else buckets["gt366"] += outstanding;
    });

    return buckets;
  }, [sales]);

  return (
    <div className="salesList-page">

      <div className="statementList-header">
        <div>
          <h2>Customer Statement</h2>
          <p>Account transaction history and balance summary</p>
        </div>
      </div>

      <section className="statement-wrap" ref={statementRef}>
        <div className="statement-controls">
          <div className="filters">
            <label>Range</label>
            <select value={rangeFilter} onChange={(e) => setRangeFilter(e.target.value)}>
              <option value="month">1 Month</option>
              <option value="3month">3 Months</option>
              <option value="6month">6 Months</option>
              <option value="12month">12 Months</option>
              <option value="all">All</option>
            </select>

            <label>From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

            <label>To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <div className="statement-actions">
            <button className="salesList-btn">Add Balance</button>
            <button className="salesList-primaryBtn">Create Statement</button>
          </div>
        </div>

        <div className="transactions-wrap">
          <table className="salesList-table">
            <thead>
              <tr>
                <th style={{ width: "3%" }}>No.</th>
                <th style={{ width: "12%" }}>Date</th>
                <th style={{ width: "25%" }}>Description</th>
                <th className="text-left" style={{ width: "20%" }}>Credit</th>
                <th className="text-left" style={{ width: "20%" }}>Debit</th>
                <th className="text-left" style={{ width: "20%" }}>Balance</th>
              </tr>
            </thead>

            <tbody>
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">No transactions</td>
                </tr>
              )}

              {paginatedRows.map((r, idx) => (
                <tr key={idx}>
                  <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                  <td>{r.date}</td>
                  <td>{r.product}</td>
                  <td className="text-left">{f(r.credit)}</td>
                  <td className="text-left">{f(r.debit)}</td>
                  <td className="text-left">{f(r.running)}</td>
                </tr>
              ))}
            </tbody> 

            <tfoot>
              <tr>
                <td colSpan={3}><strong>Totals</strong></td>
                <td className="text-right"><strong>{f(totals.totalCredit)}</strong></td>
                <td className="text-right"><strong>{f(totals.totalDebit)}</strong></td>
                <td className="text-right"><strong>{f(totals.balance)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="aging-wrap">
          <table className="salesList-table">
            <thead>
              <tr>
                <th>30 days</th>
                <th>90 days</th>
                <th>180 days</th>
                <th>240 days</th>
                <th>366 days</th>
                <th>{">366 days"}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{f(agingBuckets["30"])}</td>
                <td>{f(agingBuckets["90"])}</td>
                <td>{f(agingBuckets["180"])}</td>
                <td>{f(agingBuckets["240"])}</td>
                <td>{f(agingBuckets["366"])}</td>
                <td>{f(agingBuckets["gt366"])}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </section>

      <div className="salesList-pagination">
        <div className="salesList-pageButtons">
          <button disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}>Previous</button>

          <button className="active">{currentPage}</button>

          <button disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}>Next</button>
        </div>
      </div>

    </div>
  );
}
