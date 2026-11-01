
import React, { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiEye,
  FiDollarSign,
  FiDownload,
  FiPrinter,
  FiPlus,
  FiEdit,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import "./Payroll.css";

/* ============================
   CONFIG
============================ */
const API_BASE = import.meta.env.VITE_API_BASE || "";
const HR_BASE = "/api/hr";

const ENDPOINTS = {
  list: `${HR_BASE}/payroll/`,
  fallbackList: `${HR_BASE}/`,
  create: `${HR_BASE}/payroll/`,
  detail: (id) => `${HR_BASE}/payroll/${id}/`,
  pay: `${HR_BASE}/payroll/payments/`,
};

const mockData = [
  { id: 1, emp_no: "EMP001", name: "Mussa Jafari", position: "Operator", basic: 200000, allowances: 30000, nssf: 20000, wcf: 0, other_deductions: 0, paid: 0 },
  { id: 2, emp_no: "EMP002", name: "Kalolo", position: "Driver", basic: 180000, allowances: 20000, nssf: 18000, wcf: 5000, other_deductions: 0, paid: 0 },
  { id: 3, emp_no: "EMP003", name: "Riziki", position: "Clerk", basic: 150000, allowances: 15000, nssf: 15000, wcf: 0, other_deductions: 0, paid: 0 },
  { id: 4, emp_no: "EMP004", name: "Issa Ibrahim", position: "Supervisor", basic: 240000, allowances: 40000, nssf: 24000, wcf: 10000, other_deductions: 0, paid: 0 },
  { id: 5, emp_no: "EMP005", name: "Baraka", position: "Mechanic", basic: 170000, allowances: 20000, nssf: 17000, wcf: 0, other_deductions: 0, paid: 0 },
  { id: 6, emp_no: "EMP006", name: "Wakushiba", position: "Cleaner", basic: 120000, allowances: 10000, nssf: 12000, wcf: 0, other_deductions: 0, paid: 0 },
  { id: 7, emp_no: "EMP007", name: "Ramafhan Yusupu", position: "Storekeeper", basic: 160000, allowances: 15000, nssf: 16000, wcf: 0, other_deductions: 0, paid: 0 },
  { id: 8, emp_no: "EMP008", name: "Ramadhan Ibrahimu", position: "Accountant", basic: 300000, allowances: 50000, nssf: 30000, wcf: 20000, other_deductions: 0, paid: 0 },
  { id: 9, emp_no: "EMP009", name: "Employee Nine", position: "Assistant", basic: 135000, allowances: 10000, nssf: 13500, wcf: 0, other_deductions: 0, paid: 0 },
  { id: 10, emp_no: "EMP010", name: "Employee Ten", position: "Admin", basic: 210000, allowances: 25000, nssf: 21000, wcf: 5000, other_deductions: 0, paid: 0 },
];

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function money(v) {
  return n(v).toLocaleString();
}

function computePAYE(gross) {
  const g = n(gross);
  let tax = 0;
  if (g <= 300000) tax = 0;
  else if (g <= 600000) tax = (g - 300000) * 0.1;
  else tax = 300000 * 0.1 + (g - 600000) * 0.2;
  return Math.round(tax);
}

function buildUrl(path) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

async function requestJson(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }

  return res.json();
}

async function requestFirstSuccess(paths, options = {}) {
  let lastError = null;

  for (const path of paths) {
    try {
      return await requestJson(path, options);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All requests failed");
}

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function mapToPayrollRow(raw = {}, idFallback = null) {
  const basic = n(raw.basic ?? raw.basic_salary ?? raw.basic_pay ?? raw.salary ?? 0);
  const allowances = n(raw.allowances ?? raw.allowance ?? 0);
  const gross = basic + allowances;

  const nssf = n(raw.nssf ?? raw.nssf_amount ?? 0);
  const wcf = n(raw.wcf ?? raw.wcf_amount ?? 0);
  const other = n(raw.other_deductions ?? raw.other ?? raw.other_amount ?? 0);

  const paye = n(raw.paye ?? computePAYE(gross));
  const totalDeductions = n(raw.total_deductions ?? (nssf + wcf + other + paye));
  const net = n(raw.net ?? (gross - totalDeductions));

  return {
    id: raw.id ?? idFallback ?? Math.floor(Math.random() * 1000000),
    emp_no: raw.emp_no ?? raw.employee_no ?? raw.employee_code ?? `EMP${String(raw.id ?? idFallback ?? "").padStart(3, "0")}`,
    name: raw.name ?? raw.employee_name ?? raw.full_name ?? "",
    position: raw.position ?? raw.role ?? raw.job_title ?? "",
    basic,
    allowances,
    gross,
    nssf,
    wcf,
    other,
    paye,
    totalDeductions,
    net,
    paid: n(raw.paid ?? raw.paid_amount ?? 0),
  };
}

export default function Payroll() {
  const navigate = useNavigate();
  const location = useLocation();

  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const emptyForm = {
    emp_no: "",
    name: "",
    position: "",
    basic: 0,
    allowances: 0,
    nssf: 0,
    wcf: 0,
    other: 0,
  };

  const [formValues, setFormValues] = useState(emptyForm);
  const [formPreview, setFormPreview] = useState(mapToPayrollRow(emptyForm, 1));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const payload = await requestFirstSuccess(
          [
            `${ENDPOINTS.list}?year=${encodeURIComponent(yearFilter)}&month=${encodeURIComponent(monthFilter)}`,
            `${ENDPOINTS.fallbackList}?year=${encodeURIComponent(yearFilter)}&month=${encodeURIComponent(monthFilter)}`,
          ],
          { method: "GET" }
        );

        const rows = unwrapList(payload);
        if (rows.length > 0) {
          setPayrollData(rows.map((r, i) => mapToPayrollRow(r, i + 1)));
        } else {
          setPayrollData(mockData.map((m) => mapToPayrollRow(m, m.id)));
        }
      } catch (err) {
        console.warn("Payroll load failed - using mock data:", err);
        setPayrollData(mockData.map((m) => mapToPayrollRow(m, m.id)));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [yearFilter, monthFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payrollData.filter((p) => {
      if (!q) return true;
      return (
        String(p.name || "").toLowerCase().includes(q) ||
        String(p.emp_no || "").toLowerCase().includes(q) ||
        String(p.position || "").toLowerCase().includes(q)
      );
    });
  }, [payrollData, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.basic += n(r.basic);
        acc.allowances += n(r.allowances);
        acc.gross += n(r.gross);
        acc.nssf += n(r.nssf);
        acc.wcf += n(r.wcf);
        acc.paye += n(r.paye);
        acc.deductions += n(r.totalDeductions);
        acc.net += n(r.net);
        acc.paid += n(r.paid);
        return acc;
      },
      { basic: 0, allowances: 0, gross: 0, nssf: 0, wcf: 0, paye: 0, deductions: 0, net: 0, paid: 0 }
    );
  }, [filtered]);

  const selectedEmployee = payrollData.find((p) => p.id === selectedRowId) || null;

  const handleRowClick = (row) => {
    setSelectedRowId((prev) => (prev === row.id ? null : row.id));
  };

  const handleView = (row) => {
    navigate("/admin/payroll/preview", { state: { payrollRow: row, backgroundLocation: location } });
  };

  const openPay = (row) => {
    setSelectedRowId(row.id);
    setPayAmount("");
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNote("");
    setShowPayModal(true);
  };

  const openEditTop = () => {
    if (!selectedEmployee) {
      alert("Select a row before editing.");
      return;
    }

    setFormValues({
      emp_no: selectedEmployee.emp_no,
      name: selectedEmployee.name,
      position: selectedEmployee.position,
      basic: selectedEmployee.basic,
      allowances: selectedEmployee.allowances,
      nssf: selectedEmployee.nssf,
      wcf: selectedEmployee.wcf,
      other: selectedEmployee.other,
    });

    setFormPreview(selectedEmployee);
    setShowEditModal(true);
  };

  useEffect(() => {
    setFormPreview(mapToPayrollRow(formValues, formValues.emp_no || payrollData.length + 1));
  }, [formValues, payrollData.length]);

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return alert("No employee selected");

    const amount = n(payAmount);
    if (amount <= 0) return alert("Enter valid amount");

    setPayLoading(true);
    try {
      setPayrollData((prev) =>
        prev.map((p) => {
          if (p.id !== selectedEmployee.id) return p;
          const newPaid = n(p.paid) + amount;
          const newNet = Math.max(0, n(p.net) - amount);
          return { ...p, paid: newPaid, net: newNet };
        })
      );

      try {
        await requestFirstSuccess(
          [`${ENDPOINTS.pay}`],
          {
            method: "POST",
            body: JSON.stringify({
              payroll: selectedEmployee.id,
              date: payDate,
              amount,
              note: payNote,
              year: yearFilter,
              month: monthFilter,
              employee_id: selectedEmployee.id,
            }),
          }
        );
      } catch (err) {
        console.warn("Persist payment failed:", err);
      }

      setShowPayModal(false);
      setSelectedRowId(null);
    } finally {
      setPayLoading(false);
    }
  };

  const openAddModal = () => {
    setFormValues(emptyForm);
    setFormPreview(mapToPayrollRow(emptyForm, payrollData.length + 1));
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formValues.name || !formValues.emp_no) return alert("Employee number and name are required");

    const newRow = mapToPayrollRow(formValues, payrollData.length + 1);
    setPayrollData((prev) => [...prev, newRow]);
    setShowAddModal(false);

    try {
      await requestFirstSuccess(
        [`${ENDPOINTS.create}`],
        {
          method: "POST",
          body: JSON.stringify({
            emp_no: newRow.emp_no,
            name: newRow.name,
            position: newRow.position,
            basic: newRow.basic,
            allowances: newRow.allowances,
            nssf: newRow.nssf,
            wcf: newRow.wcf,
            other_deductions: newRow.other,
            year: yearFilter,
            month: monthFilter,
          }),
        }
      );
    } catch (err) {
      console.warn("Persist add employee failed:", err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return alert("No row selected");

    const updated = mapToPayrollRow({ ...selectedEmployee, ...formValues }, selectedEmployee.id);

    setPayrollData((prev) => prev.map((p) => (p.id === selectedEmployee.id ? updated : p)));
    setShowEditModal(false);
    setSelectedRowId(null);

    try {
      await requestFirstSuccess(
        [ENDPOINTS.detail(selectedEmployee.id)],
        {
          method: "PUT",
          body: JSON.stringify({
            emp_no: updated.emp_no,
            name: updated.name,
            position: updated.position,
            basic: updated.basic,
            allowances: updated.allowances,
            nssf: updated.nssf,
            wcf: updated.wcf,
            other_deductions: updated.other,
            year: yearFilter,
            month: monthFilter,
          }),
        }
      );
    } catch (err) {
      console.warn("Persist edit failed:", err);
    }
  };

  const exportCSV = () => {
    const headers = ["Emp No", "Name", "Position", "Basic", "Allowances", "Gross", "NSSF", "WCF", "Other", "PAYE", "Total Deds", "Net", "Paid"];
    const rows = [headers.join(",")];

    payrollData.forEach((p) => {
      rows.push([
        p.emp_no,
        `"${String(p.name || "").replace(/"/g, '""')}"`,
        `"${String(p.position || "").replace(/"/g, '""')}"`,
        n(p.basic).toFixed(2),
        n(p.allowances).toFixed(2),
        n(p.gross).toFixed(2),
        n(p.nssf).toFixed(2),
        n(p.wcf).toFixed(2),
        n(p.other).toFixed(2),
        n(p.paye).toFixed(2),
        n(p.totalDeductions).toFixed(2),
        n(p.net).toFixed(2),
        n(p.paid).toFixed(2),
      ].join(","));
    });

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${yearFilter}-${monthFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPage = () => window.print();

  return (
    <div className="payrollX-page">
      <header className="payrollX-header">
        <div>
          <h2 className="payrollX-title">Payroll — Monthly Computation</h2>
          <p className="payrollX-sub">
            Year: {yearFilter} • Month: {monthFilter}
          </p>
        </div>

        <div className="payrollX-actions">
          <div className="payrollX-search">
            <FiSearch />
            <input
              placeholder="Search employee, emp no or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="payrollX-select"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
            <option value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</option>
          </select>

          <select
            className="payrollX-select"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, "0");
              return (
                <option key={m} value={m}>
                  {m}
                </option>
              );
            })}
          </select>

          <button className="payrollX-btn payrollX-btn-add" onClick={openAddModal}>
            <FiPlus /> Add Employee
          </button>
          <button className="payrollX-btn payrollX-btn-edit" onClick={openEditTop}>
            <FiEdit /> Edit Selected
          </button>
          <button className="payrollX-btn payrollX-btn-export" onClick={exportCSV}>
            <FiDownload /> Export
          </button>
          <button className="payrollX-btn payrollX-btn-print" onClick={printPage}>
            <FiPrinter /> Print
          </button>
        </div>
      </header>

      <section className="payrollX-summary">
        <div className="payrollX-card payrollX-card--green">
          <div className="payrollX-card-label">Total Gross</div>
          <div className="payrollX-card-value">{money(totals.gross)}</div>
        </div>

        <div className="payrollX-card payrollX-card--orange">
          <div className="payrollX-card-label">NSSF</div>
          <div className="payrollX-card-value">{money(totals.nssf)}</div>
        </div>

        <div className="payrollX-card payrollX-card--blue">
          <div className="payrollX-card-label">Net Payable</div>
          <div className="payrollX-card-value">{money(totals.net)}</div>
        </div>

        <div className="payrollX-card payrollX-card--purple">
          <div className="payrollX-card-label">Paid</div>
          <div className="payrollX-card-value">{money(totals.paid)}</div>
        </div>
      </section>

      <section className="payrollX-table-wrap">
        <table className="payrollX-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Emp No</th>
              <th>Name</th>
              <th>Position</th>
              <th className="payrollX-num">Basic</th>
              <th className="payrollX-num">Allowances</th>
              <th className="payrollX-num">Gross</th>
              <th className="payrollX-num">NSSF</th>
              <th className="payrollX-num">WCF</th>
              <th className="payrollX-num">PAYE</th>
              <th className="payrollX-num">Total Deds</th>
              <th className="payrollX-num">Net</th>
              <th className="payrollX-num">Paid</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="14" className="payrollX-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="14" className="payrollX-center">
                  No payroll rows
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((r, i) => {
                const isSelected = selectedRowId === r.id;
                return (
                  <tr
                    key={r.id}
                    className={`payrollX-row ${isSelected ? "payrollX-row--active" : ""}`}
                    onClick={() => handleRowClick(r)}
                  >
                    <td>{i + 1}</td>
                    <td>{r.emp_no}</td>
                    <td className="payrollX-nowrap">{r.name}</td>
                    <td>{r.position}</td>
                    <td className="payrollX-num">{money(r.basic)}</td>
                    <td className="payrollX-num">{money(r.allowances)}</td>
                    <td className="payrollX-num">{money(r.gross)}</td>
                    <td className="payrollX-num">{money(r.nssf)}</td>
                    <td className="payrollX-num">{money(r.wcf)}</td>
                    <td className="payrollX-num">{money(r.paye)}</td>
                    <td className="payrollX-num">{money(r.totalDeductions)}</td>
                    <td className="payrollX-num">{money(r.net)}</td>
                    <td className="payrollX-num">{money(r.paid)}</td>
                    <td className="payrollX-actions">
                      <button
                        title="View payroll"
                        className="payrollX-action payrollX-action--view"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(r);
                        }}
                      >
                        <FiEye />
                      </button>
                      <button
                        title="Pay"
                        className="payrollX-action payrollX-action--pay"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPay(r);
                        }}
                      >
                        <FiDollarSign />
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan="4">
                <strong>Totals (visible)</strong>
              </td>
              <td className="payrollX-num"><strong>{money(totals.basic)}</strong></td>
              <td className="payrollX-num"><strong>{money(totals.allowances)}</strong></td>
              <td className="payrollX-num"><strong>{money(totals.gross)}</strong></td>
              <td className="payrollX-num"><strong>{money(totals.nssf)}</strong></td>
              <td className="payrollX-num"><strong>{money(totals.wcf)}</strong></td>
              <td className="payrollX-num"><strong>{money(totals.paye)}</strong></td>
              <td className="payrollX-num"><strong>{money(totals.deductions)}</strong></td>
              <td className="payrollX-num"><strong>{money(totals.net)}</strong></td>
              <td className="payrollX-num"><strong>{money(totals.paid)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </section>

      {showPayModal && selectedEmployee && (
        <div className="payrollX-modal-backdrop" onClick={() => setShowPayModal(false)}>
          <div className="payrollX-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Pay Employee — {selectedEmployee.name}</h3>
            <form className="payrollX-modal-form" onSubmit={handlePaySubmit}>
              <label>
                Date
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </label>

              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={String(selectedEmployee.net)}
                />
              </label>

              <label className="payrollX-full">
                Note
                <input
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Salary payout, partial"
                />
              </label>

              <div className="payrollX-modal-actions">
                <button
                  type="button"
                  className="payrollX-btn payrollX-btn-ghost"
                  onClick={() => setShowPayModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="payrollX-btn payrollX-btn-primary"
                  disabled={payLoading}
                >
                  {payLoading ? "Processing..." : "Pay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="payrollX-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="payrollX-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Employee</h3>
            <form className="payrollX-modal-form" onSubmit={handleAddSubmit}>
              <label>
                Employee No
                <input
                  value={formValues.emp_no}
                  onChange={(e) => setFormValues({ ...formValues, emp_no: e.target.value })}
                  required
                />
              </label>

              <label>
                Name
                <input
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  required
                />
              </label>

              <label>
                Position
                <input
                  value={formValues.position}
                  onChange={(e) => setFormValues({ ...formValues, position: e.target.value })}
                />
              </label>

              <label>
                Basic
                <input
                  type="number"
                  value={formValues.basic}
                  onChange={(e) => setFormValues({ ...formValues, basic: Number(e.target.value) })}
                />
              </label>

              <label>
                Allowances
                <input
                  type="number"
                  value={formValues.allowances}
                  onChange={(e) => setFormValues({ ...formValues, allowances: Number(e.target.value) })}
                />
              </label>

              <label>
                NSSF
                <input
                  type="number"
                  value={formValues.nssf}
                  onChange={(e) => setFormValues({ ...formValues, nssf: Number(e.target.value) })}
                />
              </label>

              <label>
                WCF
                <input
                  type="number"
                  value={formValues.wcf}
                  onChange={(e) => setFormValues({ ...formValues, wcf: Number(e.target.value) })}
                />
              </label>

              <label className="payrollX-full">
                Other Deductions
                <input
                  type="number"
                  value={formValues.other}
                  onChange={(e) => setFormValues({ ...formValues, other: Number(e.target.value) })}
                />
              </label>

              <div className="payrollX-preview payrollX-full">
                <strong>Preview</strong>
                <div className="payrollX-preview-grid">
                  <div><span>Gross</span><b>{money(formPreview.gross)}</b></div>
                  <div><span>PAYE</span><b>{money(formPreview.paye)}</b></div>
                  <div><span>Total Deductions</span><b>{money(formPreview.totalDeductions)}</b></div>
                  <div><span>Net</span><b>{money(formPreview.net)}</b></div>
                </div>
              </div>

              <div className="payrollX-modal-actions payrollX-full">
                <button
                  type="button"
                  className="payrollX-btn payrollX-btn-ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="payrollX-btn payrollX-btn-primary">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedEmployee && (
        <div className="payrollX-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="payrollX-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Employee — {selectedEmployee.name}</h3>
            <form className="payrollX-modal-form" onSubmit={handleEditSubmit}>
              <label>
                Employee No
                <input
                  value={formValues.emp_no}
                  onChange={(e) => setFormValues({ ...formValues, emp_no: e.target.value })}
                  required
                />
              </label>

              <label>
                Name
                <input
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  required
                />
              </label>

              <label>
                Position
                <input
                  value={formValues.position}
                  onChange={(e) => setFormValues({ ...formValues, position: e.target.value })}
                />
              </label>

              <label>
                Basic
                <input
                  type="number"
                  value={formValues.basic}
                  onChange={(e) => setFormValues({ ...formValues, basic: Number(e.target.value) })}
                />
              </label>

              <label>
                Allowances
                <input
                  type="number"
                  value={formValues.allowances}
                  onChange={(e) => setFormValues({ ...formValues, allowances: Number(e.target.value) })}
                />
              </label>

              <label>
                NSSF
                <input
                  type="number"
                  value={formValues.nssf}
                  onChange={(e) => setFormValues({ ...formValues, nssf: Number(e.target.value) })}
                />
              </label>

              <label>
                WCF
                <input
                  type="number"
                  value={formValues.wcf}
                  onChange={(e) => setFormValues({ ...formValues, wcf: Number(e.target.value) })}
                />
              </label>

              <label className="payrollX-full">
                Other Deductions
                <input
                  type="number"
                  value={formValues.other}
                  onChange={(e) => setFormValues({ ...formValues, other: Number(e.target.value) })}
                />
              </label>

              <div className="payrollX-preview payrollX-full">
                <strong>Preview</strong>
                <div className="payrollX-preview-grid">
                  <div><span>Gross</span><b>{money(formPreview.gross)}</b></div>
                  <div><span>PAYE</span><b>{money(formPreview.paye)}</b></div>
                  <div><span>Total Deductions</span><b>{money(formPreview.totalDeductions)}</b></div>
                  <div><span>Net</span><b>{money(formPreview.net)}</b></div>
                </div>
              </div>

              <div className="payrollX-modal-actions payrollX-full">
                <button
                  type="button"
                  className="payrollX-btn payrollX-btn-ghost"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="payrollX-btn payrollX-btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}