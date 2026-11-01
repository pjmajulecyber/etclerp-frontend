


import "./SalesReport.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const DEFAULT_PAGE_SIZE = 12;

function safeParseStorage(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("parse storage error", e);
    return [];
  }
}

function formatTZS(n) {
  return Number(n || 0).toLocaleString();
}

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

function normalizeDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function normalizeSaleRow(row) {
  const amount = Number(
    row?.amount ??
      row?.total ??
      row?.grandTotal ??
      row?.calculations?.grandTotal ??
      0
  );

  const paid = Number(
    row?.paid ??
      row?.paidAmount ??
      row?.payment ??
      row?.lastPayment?.amount ??
      0
  );

  const outstanding =
    row?.outstanding !== undefined && row?.outstanding !== null
      ? Number(row.outstanding)
      : Math.max(0, amount - paid);

  const items = Array.isArray(row?.items) ? row.items : [];

  return {
    id: row?.id ?? Date.now(),
    acCode: row?.acCode ?? row?.referenceNo ?? "",
    invoice: row?.invoice ?? row?.invoiceNumber ?? row?.invoiceNo ?? "",
    customer: row?.customer ?? row?.customerName ?? "",
    amount,
    paid,
    outstanding,
    year: row?.year ?? (row?.date ? String(new Date(row.date).getFullYear()) : ""),
    date: normalizeDate(row?.date),
    product: row?.product ?? "",
    status: row?.status ?? "Unpaid",
    depot: row?.depot ?? row?.branch ?? "",
    driverName: row?.driverName ?? row?.driver ?? row?.meta?.driver ?? "",
    items,
    calculations: row?.calculations ?? null,
    _raw: row
  };
}

export default function SalesReport() {
  const navigate = useNavigate();

  const [sales, setSales] = useState(() => {
    const stored = safeParseStorage("sales_list");
    return Array.isArray(stored) ? stored.map(normalizeSaleRow) : [];
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [depotFilter, setDepotFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const refreshFromStorage = () => {
    const stored = safeParseStorage("sales_list");
    setSales(Array.isArray(stored) ? stored.map(normalizeSaleRow) : []);
  };

  useEffect(() => {
    refreshFromStorage();

    const onStorage = () => refreshFromStorage();
    const onFocus = () => refreshFromStorage();

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const computeRowAmounts = (row) => {
    if (row?.calculations && typeof row.calculations.grandTotal === "number") {
      const amount = Number(row.calculations.grandTotal || row.amount || 0);
      const paid = Number(row.paid || row.paidAmount || 0);
      const outstanding =
        row.outstanding !== undefined && row.outstanding !== null
          ? Number(row.outstanding)
          : Math.max(0, amount - paid);

      const tax =
        row.calculations.totalTax ??
        (Array.isArray(row.items)
          ? row.items.reduce(
              (s, it) =>
                s +
                Number(it.qty || 0) * Number(it.price || 0) * 0.18,
              0
            )
          : 0);

      return { amount, paid, outstanding, tax };
    }

    const amount =
      Number(row?.amount || 0) ||
      (Array.isArray(row?.items)
        ? row.items.reduce(
            (s, it) => s + Number(it.qty || 0) * Number(it.price || 0),
            0
          )
        : 0);

    const paid = Number(row?.paid || row?.paidAmount || 0);
    const outstanding =
      row?.outstanding !== undefined && row?.outstanding !== null
        ? Number(row.outstanding)
        : Math.max(0, amount - paid);

    const tax = Array.isArray(row?.items)
      ? row.items.reduce(
          (s, it) =>
            s + Number(it.qty || 0) * Number(it.price || 0) * 0.18,
          0
        )
      : 0;

    return { amount, paid, outstanding, tax };
  };

  const filtered = useMemo(() => {
    let arr = Array.isArray(sales) ? [...sales] : [];

    arr = arr.map((r) => ({
      ...r,
      _date: normalizeDate(r.date)
    }));

    if (fromDate) {
      arr = arr.filter((r) => r._date && r._date >= fromDate);
    }

    if (toDate) {
      arr = arr.filter((r) => r._date && r._date <= toDate);
    }

    if (customerFilter.trim()) {
      const q = customerFilter.trim().toLowerCase();
      arr = arr.filter((r) => {
        const c = String(r.customer || "").toLowerCase();
        const ac = String(r.acCode || r.referenceNo || "").toLowerCase();
        return c.includes(q) || ac.includes(q);
      });
    }

    if (depotFilter.trim()) {
      const q = depotFilter.trim().toLowerCase();
      arr = arr.filter((r) =>
        String(r.depot || "").toLowerCase().includes(q)
      );
    }

    if (driverFilter.trim()) {
      const q = driverFilter.trim().toLowerCase();
      arr = arr.filter((r) =>
        String(r.driverName || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      arr = arr.filter(
        (r) => String(r.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      arr = arr.filter((r) => {
        return (
          String(r.invoice || "").toLowerCase().includes(q) ||
          String(r.customer || "").toLowerCase().includes(q) ||
          String(r.acCode || r.referenceNo || "").toLowerCase().includes(q) ||
          String(r.product || "").toLowerCase().includes(q)
        );
      });
    }

    arr.sort((a, b) => {
      let av;
      let bv;

      if (sortKey === "date") {
        av = a._date || "";
        bv = b._date || "";
      } else if (sortKey === "amount") {
        av = computeRowAmounts(a).amount;
        bv = computeRowAmounts(b).amount;
      } else if (sortKey === "paid") {
        av = computeRowAmounts(a).paid;
        bv = computeRowAmounts(b).paid;
      } else if (sortKey === "outstanding") {
        av = computeRowAmounts(a).outstanding;
        bv = computeRowAmounts(b).outstanding;
      } else {
        av = String(a[sortKey] || "").toLowerCase();
        bv = String(b[sortKey] || "").toLowerCase();
      }

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [
    sales,
    fromDate,
    toDate,
    customerFilter,
    depotFilter,
    driverFilter,
    statusFilter,
    searchText,
    sortKey,
    sortDir
  ]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const aggregates = useMemo(() => {
    const totals = filtered.reduce(
      (acc, r) => {
        const { amount, paid, outstanding, tax } = computeRowAmounts(r);
        acc.amount += Number(amount || 0);
        acc.paid += Number(paid || 0);
        acc.outstanding += Number(outstanding || 0);
        acc.tax += Number(tax || 0);
        return acc;
      },
      { amount: 0, paid: 0, outstanding: 0, tax: 0 }
    );

    return {
      invoices: filtered.length,
      totalSales: totals.amount,
      totalPaid: totals.paid,
      totalOutstanding: totals.outstanding,
      totalTax: totals.tax
    };
  }, [filtered]);

  const grouped = useMemo(() => {
    if (groupBy === "none") return null;

    const map = {};
    filtered.forEach((r) => {
      const d = r._date || "unknown";
      let key = d;

      if (groupBy === "month" && d.length >= 7) key = d.slice(0, 7);
      if (groupBy === "day" && d.length >= 10) key = d;

      map[key] = map[key] || 0;
      map[key] += computeRowAmounts(r).amount;
    });

    return Object.keys(map)
      .sort()
      .map((k) => ({ k, value: map[k] }));
  }, [filtered, groupBy]);

  const viewInvoice = (row) => {
    navigate("/admin/sales/invoice-preview", { state: row });
  };

  const exportCSV = () => {
    const header = [
      "Invoice",
      "Date",
      "AC Code",
      "Customer",
      "Amount",
      "Paid",
      "Outstanding",
      "Status",
      "ItemsCount",
      "Depot",
      "Driver"
    ];

    const rows = filtered.map((r) => {
      const { amount, paid, outstanding } = computeRowAmounts(r);
      return [
        r.invoice || "",
        r._date || r.date || "",
        r.acCode || r.referenceNo || "",
        r.customer || "",
        formatTZS(amount),
        formatTZS(paid),
        formatTZS(outstanding),
        r.status || "",
        Array.isArray(r.items) ? r.items.length : "",
        r.depot || "",
        r.driverName || ""
      ];
    });

    const csv = [
      header.map(csvEscape).join(","),
      ...rows.map((r) => r.map(csvEscape).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setCustomerFilter("");
    setDepotFilter("");
    setDriverFilter("");
    setStatusFilter("");
    setSearchText("");
    setGroupBy("none");
    setSortKey("date");
    setSortDir("desc");
    setPage(1);
  };

  return (
    <div className="sales-report-page">
      <div className="srpwrapper">
        <div className="report-header">
          <h2>Sales Report</h2>
          <div className="report-actions">
            <button
              className="btn btn-outline"
              onClick={refreshFromStorage}
            >
              Reload
            </button>
            <button className="btn btn-outline" onClick={exportCSV}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="report-controls">
          <div className="filters-grid">
            <div className="filter-col">
              <label>From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="filter-col">
              <label>To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="filter-col">
              <label>Customer / AC Code</label>
              <input
                placeholder="name or code..."
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
              />
            </div>

            <div className="filter-col">
              <label>Depot</label>
              <input
                placeholder="depot..."
                value={depotFilter}
                onChange={(e) => setDepotFilter(e.target.value)}
              />
            </div>

            <div className="filter-col">
              <label>Driver</label>
              <input
                placeholder="driver..."
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
              />
            </div>

            <div className="filter-col">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option>Paid</option>
                <option>Partial</option>
                <option>Unpaid</option>
              </select>
            </div>

            <div className="filter-col wide">
              <label>Search (invoice/customer/ac)</label>
              <input
                placeholder="free text search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="filter-col">
              <label>Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <option value="none">None</option>
                <option value="day">Day</option>
                <option value="month">Month</option>
              </select>
            </div>

            <div className="filter-col">
              <label>Page Size</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="filter-col actions">
              <label>&nbsp;</label>
              <div className="filter-buttons">
                <button
                  className="srp-primary"
                  onClick={() => setPage(1)}
                  type="button"
                >
                  Apply
                </button>
                <button
                  className="btn btn-outline"
                  onClick={clearFilters}
                  type="button"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="report-summaries">
          <div className="card">
            <div className="card-title">Total Sales</div>
            <div className="card-value">TZS {formatTZS(aggregates.totalSales)}</div>
          </div>

          <div className="card">
            <div className="card-title">Total Paid</div>
            <div className="card-value">TZS {formatTZS(aggregates.totalPaid)}</div>
          </div>

          <div className="card">
            <div className="card-title">Outstanding</div>
            <div className="card-value">
              TZS {formatTZS(aggregates.totalOutstanding)}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Invoices</div>
            <div className="card-value">{aggregates.invoices}</div>
          </div>
        </div>

        {grouped && (
          <div className="group-list">
            {grouped.map((g) => (
              <div key={g.k} className="group-item">
                <div className="g-key">{g.k}</div>
                <div className="g-val">TZS {formatTZS(g.value)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="report-table">
        <table>
          <thead>
            <tr>
              <th
                onClick={() => {
                  setSortKey("invoice");
                  setSortDir(sortDir === "asc" ? "desc" : "asc");
                }}
              >
                Invoice
              </th>
              <th
                onClick={() => {
                  setSortKey("date");
                  setSortDir(sortDir === "asc" ? "desc" : "asc");
                }}
              >
                Date
              </th>
              <th>AC Code</th>
              <th>Customer</th>
              <th
                onClick={() => {
                  setSortKey("amount");
                  setSortDir(sortDir === "asc" ? "desc" : "asc");
                }}
              >
                Amount
              </th>
              <th
                onClick={() => {
                  setSortKey("paid");
                  setSortDir(sortDir === "asc" ? "desc" : "asc");
                }}
              >
                Paid
              </th>
              <th
                onClick={() => {
                  setSortKey("outstanding");
                  setSortDir(sortDir === "asc" ? "desc" : "asc");
                }}
              >
                Outstanding
              </th>
              <th>Status</th>
              <th>Depot</th>
              <th>Driver</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: 24 }}>
                  No results
                </td>
              </tr>
            )}

            {paginated.map((r, idx) => {
              const { amount, paid, outstanding } = computeRowAmounts(r);

              return (
                <tr key={r.id || idx}>
                  <td>{r.invoice || "-"}</td>
                  <td>{r._date || r.date || "-"}</td>
                  <td>{r.acCode || r.referenceNo || "-"}</td>
                  <td>{r.customer || "-"}</td>
                  <td>TZS {formatTZS(amount)}</td>
                  <td>TZS {formatTZS(paid)}</td>
                  <td>TZS {formatTZS(outstanding)}</td>
                  <td>
                    <span className={`status-tag ${String(r.status || "").toLowerCase()}`}>
                      {r.status || "-"}
                    </span>
                  </td>
                  <td>{r.depot || "-"}</td>
                  <td>{r.driverName || "-"}</td>
                  <td className="row-actions">
                    <button className="btn btn-outline" onClick={() => viewInvoice(r)} type="button">
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="report-footer">
        <div className="pagination">
          <button
            className="btn btn-outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            type="button"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            type="button"
          >
            Next
          </button>
        </div>

        <div className="footer-actions">
          <div>Total rows: {totalRows}</div>
          <button className="btn btn-primary" onClick={exportCSV} type="button">
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}