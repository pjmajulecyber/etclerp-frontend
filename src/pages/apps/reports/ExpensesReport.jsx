// src/pages/admin/reports/ExpensesReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./ExpensesReport.css";

const STORAGE_KEY = "expenses_list";

const formatTZ = (n) => Number(n || 0).toLocaleString();

const safeParseStorage = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to parse expenses storage:", err);
    return [];
  }
};

const normalizeDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const normalizeStatus = (value) => {
  const s = String(value || "").trim().toLowerCase();

  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  if (s === "requested") return "Pending";
  if (s === "saved") return "Pending";
  if (s === "pending") return "Pending";

  if (!s) return "Pending";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const normalizeExpense = (item) => {
  const nestedCategory =
    item?.category && typeof item.category === "object" ? item.category : null;

  const amount = Number(
    item?.amount ??
      item?.total ??
      item?.expense_amount ??
      item?.grand_total ??
      0
  );

  const rawStatus = String(item?.approvalStatus ?? item?.status ?? "").trim().toLowerCase();

  const paidFromField = Number(
    item?.paid ??
      item?.paid_amount ??
      item?.paidAmount ??
      0
  );

  const paid =
    paidFromField ||
    (rawStatus === "approved" ? amount : 0);

  const code = String(
    item?.code ??
      item?.reference ??
      item?.expense_code ??
      item?.reference_no ??
      ""
  ).trim();

  const category = String(
    item?.category_name ??
      item?.category ??
      nestedCategory?.name ??
      nestedCategory?.title ??
      ""
  ).trim();

  return {
    id: item?.id ?? `${code}-${item?.date || item?.expense_date || Math.random()}`,
    code,
    category,
    description: String(item?.description ?? "").trim(),
    amount,
    paid,
    date: normalizeDate(item?.date ?? item?.expense_date),
    approvalStatus: normalizeStatus(item?.approvalStatus ?? item?.status ?? "Pending"),
  };
};

const loadExpensesFromStorage = () => {
  const stored = safeParseStorage(STORAGE_KEY);
  if (!Array.isArray(stored)) return [];
  return stored.map(normalizeExpense);
};

export default function ExpensesReport() {
  const [expenses, setExpenses] = useState(loadExpensesFromStorage);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const sync = () => {
      setExpenses(loadExpensesFromStorage());
    };

    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("expenses_list_updated", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("expenses_list_updated", sync);
    };
  }, []);

  const availableCategories = useMemo(() => {
    const set = new Set();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [expenses]);

  const filtered = useMemo(() => {
    const q = String(search || "").toLowerCase().trim();

    const list = expenses.filter((e) => {
      if (category && e.category !== category) return false;
      if (approvalStatus && e.approvalStatus !== approvalStatus) return false;

      if (paymentStatus) {
        const outstanding = Number(e.amount || 0) - Number(e.paid || 0);
        const paidValue = Number(e.paid || 0);

        if (paymentStatus === "Paid" && outstanding > 0) return false;
        if (paymentStatus === "Unpaid" && paidValue > 0) return false;
        if (paymentStatus === "Partial" && !(paidValue > 0 && outstanding > 0)) return false;
      }

      if (fromDate && e.date && e.date < fromDate) return false;
      if (toDate && e.date && e.date > toDate) return false;

      if (!q) return true;

      const hay = `${e.code} ${e.category} ${e.description} ${e.approvalStatus}`.toLowerCase();
      return hay.includes(q);
    });

    list.sort((a, b) => {
      const da = a.date || "";
      const db = b.date || "";
      if (da < db) return 1;
      if (da > db) return -1;
      return Number(b.id || 0) - Number(a.id || 0);
    });

    return list;
  }, [expenses, search, category, paymentStatus, approvalStatus, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const headerSummary = useMemo(() => {
    let total = 0;
    let approved = 0;
    let rejected = 0;
    let pendingCount = 0;

    filtered.forEach((e) => {
      total += Number(e.amount || 0);
      if (e.approvalStatus === "Approved") approved += Number(e.amount || 0);
      if (e.approvalStatus === "Rejected") rejected += Number(e.amount || 0);
      if (e.approvalStatus === "Pending") pendingCount += 1;
    });

    return { total, approved, rejected, pendingCount, rows: filtered.length };
  }, [filtered]);

  const totals = useMemo(() => {
    const filteredTotals = filtered.reduce(
      (acc, e) => {
        acc.amount += Number(e.amount || 0);
        acc.paid += Number(e.paid || 0);
        return acc;
      },
      { amount: 0, paid: 0 }
    );
    filteredTotals.outstanding = filteredTotals.amount - filteredTotals.paid;

    const pageTotals = pageItems.reduce(
      (acc, e) => {
        acc.amount += Number(e.amount || 0);
        acc.paid += Number(e.paid || 0);
        return acc;
      },
      { amount: 0, paid: 0 }
    );
    pageTotals.outstanding = pageTotals.amount - pageTotals.paid;

    return { filteredTotals, pageTotals };
  }, [filtered, pageItems]);

  const exportCSV = () => {
    const header = [
      "Code",
      "Category",
      "Description",
      "Amount",
      "Paid",
      "Outstanding",
      "Approval",
      "Date",
    ];

    const rows = filtered.map((e) => [
      e.code,
      e.category,
      e.description,
      e.amount,
      e.paid,
      Number(e.amount || 0) - Number(e.paid || 0),
      e.approvalStatus || "",
      e.date,
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const styles = `
      <style>
        body{font-family:Inter, Arial, sans-serif; padding:18px; color:#111;}
        h1{font-size:18px;margin-bottom:8px;}
        table{width:100%;border-collapse:collapse;margin-top:12px;}
        th,td{padding:8px;border:1px solid #ddd;font-size:12px;}
        th{background:#f4f6f8;text-align:left;}
        .totals{margin-top:12px;font-weight:700;}
      </style>
    `;

    const headerHtml = `<h1>Expenses Report — ${new Date().toLocaleString()}</h1>`;
    const tableHeader = `<tr>
      <th>Code</th><th>Category</th><th>Description</th><th>Amount</th><th>Paid</th><th>Outstanding</th><th>Approval</th><th>Date</th>
    </tr>`;

    const tableRows = filtered
      .map((e) => {
        const out = Number(e.amount || 0) - Number(e.paid || 0);
        return `<tr>
          <td>${e.code}</td>
          <td>${e.category}</td>
          <td>${e.description}</td>
          <td style="text-align:right">${formatTZ(e.amount)}</td>
          <td style="text-align:right">${formatTZ(e.paid)}</td>
          <td style="text-align:right">${formatTZ(out)}</td>
          <td>${e.approvalStatus || ""}</td>
          <td>${e.date}</td>
        </tr>`;
      })
      .join("");

    const totalsHtml = `
      <div class="totals">
        Filtered Totals — Amount: TZS ${formatTZ(totals.filteredTotals.amount)} |
        Paid: TZS ${formatTZ(totals.filteredTotals.paid)} |
        Outstanding: TZS ${formatTZ(totals.filteredTotals.outstanding)}
      </div>
    `;

    const win = window.open("", "_blank", "noopener,width=900,height=700");
    if (!win) {
      alert("Popup blocked. Allow popups for this site to export PDF.");
      return;
    }

    win.document.write(
      `<!doctype html><html><head><title>Expenses Report</title>${styles}</head><body>${headerHtml}<table>${tableHeader}${tableRows}</table>${totalsHtml}</body></html>`
    );
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  };

  return (
    <div className="exprep-page">
      <div className="exprep-headerRow">
        <div className="exprep-heading">
          <h2>Expenses Report</h2>
          <div className="exprep-sub">
            Track, filter and export expense records (approval + payment states)
          </div>
        </div>

        <div className="exprep-actions">
          <button className="exprep-btn exprep-btn-csv" onClick={exportCSV} type="button">
            Export CSV
          </button>
          <button className="exprep-btn exprep-btn-pdf" onClick={exportPDF} type="button">
            Export PDF
          </button>
        </div>
      </div>

      <div className="exprep-filters">
        <input
          className="exprep-input"
          placeholder="Search code, category, description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <select
          className="exprep-select"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {availableCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="exprep-select"
          value={approvalStatus}
          onChange={(e) => {
            setApprovalStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Approval</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Pending</option>
        </select>

        <select
          className="exprep-select"
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Payment</option>
          <option>Paid</option>
          <option>Unpaid</option>
          <option>Partial</option>
        </select>

        <input
          className="exprep-input-date"
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(1);
          }}
        />
        <input
          className="exprep-input-date"
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(1);
          }}
        />

        <select
          className="exprep-select"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
        </select>
      </div>

      <div className="exprep-summarygrid">
        <div className="exprep-card">
          <div className="exprep-card-label">Total Expenses (filtered)</div>
          <div className="exprep-card-value">TZS {formatTZ(headerSummary.total)}</div>
        </div>
        <div className="exprep-card approved">
          <div className="exprep-card-label">Approved Amount</div>
          <div className="exprep-card-value">TZS {formatTZ(headerSummary.approved)}</div>
        </div>
        <div className="exprep-card rejected">
          <div className="exprep-card-label">Rejected Amount</div>
          <div className="exprep-card-value">TZS {formatTZ(headerSummary.rejected)}</div>
        </div>
        <div className="exprep-card pending">
          <div className="exprep-card-label">Pending Count</div>
          <div className="exprep-card-value">{headerSummary.pendingCount}</div>
        </div>
      </div>

      <div className="exprep-tableWrap">
        <table className="exprep-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Category</th>
              <th>Description</th>
              <th className="exprep-num">Amount</th>
              <th className="exprep-num">Paid</th>
              <th className="exprep-num">Outstanding</th>
              <th>Approval</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={8} className="exprep-empty">
                  No expenses match the filter.
                </td>
              </tr>
            )}

            {pageItems.map((e) => {
              const outstanding = Number(e.amount || 0) - Number(e.paid || 0);
              return (
                <tr key={e.id}>
                  <td>{e.code}</td>
                  <td>{e.category}</td>
                  <td>{e.description}</td>
                  <td className="exprep-num">{formatTZ(e.amount)}</td>
                  <td className="exprep-num">{formatTZ(e.paid)}</td>
                  <td className="exprep-num">{formatTZ(outstanding)}</td>
                  <td>
                    <span className={`exprep-badge ${String(e.approvalStatus || "").toLowerCase()}`}>
                      {e.approvalStatus}
                    </span>
                  </td>
                  <td>{e.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="exprep-pagination">
        <div className="exprep-pagerLeft">
          <button
            className="exprep-pagerBtn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            type="button"
          >
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            className="exprep-pagerBtn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            type="button"
          >
            Next
          </button>
        </div>

        <div className="exprep-pagerRight">
          <div>
            Showing <strong>{pageItems.length}</strong> of <strong>{headerSummary.rows}</strong> items
          </div>
        </div>
      </div>
    </div>
  );
}