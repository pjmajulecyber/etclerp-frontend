import React, { useMemo, useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import API from "../../../services/api";
import "./ExpensesList.css";

const INITIAL_CODE_CATEGORY_MAP = {
  "45000": "Purchases",
  "46000": "Salaries",
  "46001": "Office",
  "47000": "Transport",
  "47001": "Logistics",
  "47002": "Transport",
  "48000": "Utilities",
  "49000": "Maintenance",
};

const unwrapList = (res) => {
  const data = res?.data ?? res ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.expenses)) return data.expenses;
  if (Array.isArray(data.categories)) return data.categories;
  return [];
};

const normalizeCategory = (item) => ({
  id: item?.id ?? item?.pk ?? null,
  code: String(item?.code ?? item?.category_code ?? item?.reference ?? "").trim(),
  name: String(item?.name ?? item?.category_name ?? item?.title ?? "").trim(),
});

const normalizeExpense = (item, categoryMap = {}) => {
  const nestedCategory = item?.category && typeof item.category === "object" ? item.category : null;

  const code = String(
    item?.reference ??
      item?.code ??
      item?.expense_code ??
      nestedCategory?.code ??
      ""
  ).trim();

  const categoryName = String(
    item?.category_name ??
      nestedCategory?.name ??
      categoryMap[code] ??
      ""
  ).trim();

  return {
    id: item?.id,
    date: item?.expense_date ?? item?.date ?? "",
    code,
    category: categoryName,
    categoryId: item?.category ?? item?.category_id ?? nestedCategory?.id ?? null,
    description: item?.description ?? "",
    amount: Number(item?.amount ?? 0),
    status: item?.status ?? "saved",
  };
};

export default function ExpensesList() {
  const [expenses, setExpenses] = useState([]);
  const [categoriesDB, setCategoriesDB] = useState([]);
  const [categoryMap, setCategoryMap] = useState(INITIAL_CODE_CATEGORY_MAP);

  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterCode, setFilterCode] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [formDate, setFormDate] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const [categoryCode, setCategoryCode] = useState("");
  const [categoryName, setCategoryName] = useState("");

  const tableRef = useRef(null);

  const [rowsPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    sessionStorage.setItem("expenses_list", JSON.stringify(expenses));
    window.dispatchEvent(new Event("expenses_list_updated"));
  }, [expenses]);

  const loadCategories = async () => {
    try {
      const res = await API.get("expenses/expense-categories/");
      const data = unwrapList(res);

      const mapped = data.map(normalizeCategory).filter((c) => c.code && c.name);
      setCategoriesDB(mapped);

      const backendMap = Object.fromEntries(mapped.map((c) => [c.code, c.name]));
      setCategoryMap({
        ...INITIAL_CODE_CATEGORY_MAP,
        ...backendMap,
      });
    } catch (err) {
      console.error("Categories API failed:", err);
      setCategoriesDB([]);
      setCategoryMap(INITIAL_CODE_CATEGORY_MAP);
    }
  };

  const loadExpenses = async () => {
    try {
      const res = await API.get("expenses/expenses/");
      const data = unwrapList(res);

      setExpenses((prev) => {
        const prevStatus = new Map(prev.map((x) => [String(x.id), x.status]));
        const mapped = data.map((item) => {
          const row = normalizeExpense(item, categoryMap);
          return {
            ...row,
            status: prevStatus.get(String(row.id)) || row.status || "saved",
          };
        });

        return mapped;
      });
    } catch (err) {
      console.error("Expenses API failed:", err);
    }
  };

  useEffect(() => {
    loadCategories();
    loadExpenses();
  }, []);

  useEffect(() => {
    if (!formCode) {
      setFormCategory("");
      return;
    }

    const exact = categoryMap[formCode];
    if (exact) {
      setFormCategory(exact);
      return;
    }

    const prefix = formCode.slice(0, 3);
    const foundKey = Object.keys(categoryMap).find((k) => k.startsWith(prefix));
    setFormCategory(foundKey ? categoryMap[foundKey] : "");
  }, [formCode, categoryMap]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filterYear !== "all") {
        const y = new Date(e.date).getFullYear().toString();
        if (y !== filterYear) return false;
      }

      if (filterMonth !== "all") {
        const dKey = String(e.date || "").slice(0, 7);
        if (filterMonth !== dKey) return false;
      }

      if (filterCode.trim()) {
        const hay = `${e.code || ""} ${e.category || ""} ${e.description || ""}`.toLowerCase();
        if (!hay.includes(filterCode.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [expenses, filterMonth, filterYear, filterCode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth, filterYear, filterCode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filtered.slice(start, end);
  }, [filtered, currentPage, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);
    const requested = filtered
      .filter((r) => r.status === "requested")
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    return { total, requested };
  }, [filtered]);

  const resetExpenseForm = () => {
    setEditing(null);
    setFormDate("");
    setFormCode("");
    setFormCategory("");
    setFormAmount("");
    setFormDescription("");
  };

  const openAddExpense = () => {
    resetExpenseForm();
    setShowAddModal(true);
  };

  const openEdit = (id) => {
    const row = expenses.find((r) => r.id === id);
    if (!row) return;

    setEditing(id);
    setFormDate(row.date || "");
    setFormCode(row.code || "");
    setFormCategory(row.category || "");
    setFormAmount(row.amount ?? "");
    setFormDescription(row.description || "");
    setShowAddModal(true);
  };

  const openAddCategory = () => {
    setCategoryCode("");
    setCategoryName("");
    setShowCategoryModal(true);
  };

  const findCategoryByCode = (code) =>
    categoriesDB.find((c) => c.code === code) || null;

  const saveExpense = async (opts = { asRequest: false }) => {
    if (!formDate || !formCode || !formAmount) {
      alert("Please provide date, code and amount.");
      return;
    }

    const selectedCategory = findCategoryByCode(formCode);

    if (!selectedCategory) {
      alert("Please add the category first, then use its code to add expenses.");
      return;
    }

    try {
      const payload = {
        expense_date: formDate,
        reference: formCode,
        description: formDescription,
        amount: Number(formAmount),
        payment_method: "CASH",
        category: selectedCategory.id,
      };

      let savedItem = null;

      if (editing) {
        const res = await API.patch(`expenses/expenses/${editing}/`, payload);
        savedItem = res?.data ?? null;
      } else {
        const res = await API.post("expenses/expenses/", payload);
        savedItem = res?.data ?? null;
      }

      const localRow = {
        id: savedItem?.id ?? editing ?? Date.now(),
        date: savedItem?.expense_date ?? savedItem?.date ?? formDate,
        code: savedItem?.reference ?? formCode,
        category: savedItem?.category_name ?? selectedCategory.name,
        categoryId: savedItem?.category ?? selectedCategory.id,
        description: savedItem?.description ?? formDescription,
        amount: Number(savedItem?.amount ?? formAmount),
        status: opts.asRequest ? "requested" : "saved",
      };

      setExpenses((prev) => {
        if (editing) {
          return prev.map((p) => (p.id === editing ? localRow : p));
        }
        return [localRow, ...prev];
      });

      setShowAddModal(false);
      resetExpenseForm();
      await loadExpenses();
    } catch (err) {
      console.error("Save expense failed:", err?.response?.data || err);
      alert("Failed to save expense");
    }
  };

  const saveCategory = async () => {
    const code = String(categoryCode || "").trim();
    const name = String(categoryName || "").trim();

    if (!code || !name) {
      alert("Please provide both category code and category name.");
      return;
    }

    try {
      const res = await API.post("expenses/expense-categories/", { code, name });
      const saved = normalizeCategory(res?.data || { code, name });

      setCategoriesDB((prev) => {
        const next = prev.some((c) => String(c.id) === String(saved.id))
          ? prev.map((c) => (String(c.id) === String(saved.id) ? saved : c))
          : [saved, ...prev];
        return next;
      });

      setCategoryMap((prev) => ({
        ...prev,
        [saved.code]: saved.name,
      }));

      setShowCategoryModal(false);
      setCategoryCode("");
      setCategoryName("");
    } catch (err) {
      console.error("Category save failed:", err?.response?.data || err);
      alert("Failed to save category");
    }
  };

  const approveExpense = async (id) => {
    try {
      await API.patch(`expenses/expenses/${id}/`, {
        status: "approved",
      });

      setExpenses((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p))
      );
    } catch (err) {
      console.error("Approve failed:", err?.response?.data || err);
      alert("Failed to approve");
    }
  };

  const rejectExpense = async (id) => {
    try {
      await API.patch(`expenses/expenses/${id}/`, {
        status: "rejected",
      });

      setExpenses((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "rejected" } : p))
      );
    } catch (err) {
      console.error("Reject failed:", err?.response?.data || err);
      alert("Failed to reject");
    }
  };

  const exportCSV = () => {
    const headers = ["Date", "Code", "Category", "Description", "Amount", "Status"];
    const rows = filtered.map((r) => [
      r.date,
      r.code,
      r.category,
      `"${String(r.description || "").replace(/"/g, '""')}"`,
      Number(r.amount).toFixed(2),
      r.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const node = tableRef.current;
    if (!node) {
      alert("No table to export.");
      return;
    }

    try {
      const SCALE = 2;
      const canvas = await html2canvas(node, {
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

      pdf.save(`expenses-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF export failed");
    }
  };

  return (
    <div className="expenses-page">
      <header className="expenses-header">
        <div className="title-block">
          <h1>Expenses</h1>
          <div className="muted">Manage and request expense approvals</div>
        </div>

        <div className="header-actions">
          <div className="header-actions">
            <div className="header-row">
              <div className="left-actions">
                <button className="btn btn-primary add-expense" onClick={openAddExpense}>
                  + Add Expense
                </button>

                <button className="btn btn-ghost" onClick={openAddCategory}>
                  + Add Category
                </button>
              </div>

              <div className="filters-inline">
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                  <option value="all">All months</option>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const key = d.toISOString().slice(0, 7);
                    const label = d.toLocaleString(undefined, {
                      month: "short",
                      year: "numeric",
                    });
                    return (
                      <option value={key} key={key}>
                        {label}
                      </option>
                    );
                  })}
                </select>

                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                  <option value="all">All years</option>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const y = new Date().getFullYear() - i;
                    return (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    );
                  })}
                </select>

                <input
                  placeholder="Code"
                  value={filterCode}
                  onChange={(e) => setFilterCode(e.target.value)}
                />
              </div>

              <div className="action-buttons">
                <button className="btn btn-ghost" onClick={exportCSV}>
                  Export CSV
                </button>
                <button className="btn btn-ghost" onClick={exportPDF}>
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="expenses-main">
        <div className="table-card" ref={tableRef}>
          <div className="table-scroll">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedExpenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">
                      No expenses found
                    </td>
                  </tr>
                )}

                {paginatedExpenses.map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.code}</td>
                    <td>{r.category}</td>
                    <td>{r.description}</td>
                    <td style={{ textAlign: "right" }}>
                      {Number(r.amount).toLocaleString()}
                    </td>
                    <td>
                      <div className="row-actions">
                        {r.status === "requested" && (
                          <>
                            <button
                              className="Apbtn-approve"
                              onClick={() => approveExpense(r.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="Apbtn btn-reject"
                              onClick={() => rejectExpense(r.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button className="btn btn-edit" onClick={() => openEdit(r.id)}>
                          Edit
                        </button>
                        <span className={`status-badge ${r.status}`}>{r.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan={4}>
                    <strong>Totals</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <strong>{totals.total.toLocaleString()}</strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="pagination-bar">
          <button
            className="btn btn-ghost"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="btn btn-ghost"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </main>

      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowAddModal(false);
            setEditing(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Edit Expense" : "Add Expense"}</h3>

            <label className="modal-label">
              Date
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </label>

            <label className="modal-label">
              Code
              <input
                placeholder="e.g. 45000"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
              />
            </label>

            <label className="modal-label">
              Category (auto)
              <input value={formCategory} readOnly placeholder="Auto from code" />
            </label>

            <label className="modal-label">
              Amount
              <input
                type="number"
                min="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </label>

            <label className="modal-label">
              Description
              <input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="short note"
              />
            </label>

            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setEditing(null);
                  resetExpenseForm();
                }}
              >
                Cancel
              </button>

              <button className="btn btn-primary" onClick={() => saveExpense({ asRequest: false })}>
                Save
              </button>

              <button
                className="btn btn-primary filled"
                onClick={() => saveExpense({ asRequest: true })}
              >
                Request Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowCategoryModal(false);
            setCategoryCode("");
            setCategoryName("");
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Category</h3>

            <label className="modal-label">
              Category Code
              <input
                placeholder="e.g. 50000"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
              />
            </label>

            <label className="modal-label">
              Category Name
              <input
                placeholder="e.g. Fuel"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </label>

            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryCode("");
                  setCategoryName("");
                }}
              >
                Cancel
              </button>

              <button className="btn btn-primary" onClick={saveCategory}>
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
