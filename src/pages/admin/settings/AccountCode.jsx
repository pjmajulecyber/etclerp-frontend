
// src/pages/admin/accounts/AccountCodes.jsx
import "./AccountCode.css";
import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiTrash2, FiLock, FiPlus } from "react-icons/fi";

const STORAGE_KEY = "demo_chart_of_accounts_v1";

const inferTypeFromCode = (code) => {
  const n = Number(String(code || "").replace(/\D/g, ""));
  if (!Number.isFinite(n)) return "ASSET";

  if (n >= 45000 && n < 46000) return "COGS";
  if (n >= 40000 && n < 45000) return "REVENUE";
  if (n >= 5000 && n < 6000) return "EXPENSE";
  if (n >= 30000 && n < 40000) return "EQUITY";
  if (n >= 20000 && n < 30000) return "LIABILITY";
  return "ASSET";
};

const typeOrder = {
  ASSET: 1,
  LIABILITY: 2,
  EQUITY: 3,
  REVENUE: 4,
  COGS: 5,
  EXPENSE: 6,
  SYSTEM: 7,
};

const typeColors = {
  REVENUE: "#16a34a",
  COGS: "#dc2626",
  EXPENSE: "#dc2626",
  ASSET: "#111827",
  LIABILITY: "#111827",
  EQUITY: "#111827",
  SYSTEM: "#111827",
};

const sortByCode = (a, b) => {
  const na = Number(String(a.code || "").replace(/\D/g, "")) || 0;
  const nb = Number(String(b.code || "").replace(/\D/g, "")) || 0;
  if (na !== nb) return na - nb;
  return String(a.code || "").localeCompare(String(b.code || ""));
};

const safeParse = (raw, fallback = []) => {
  try {
    const parsed = raw ? JSON.parse(raw) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const DOCX_ACCOUNTS = [
  // ================= ASSETS =================
  { code: "10000", name: "Cash and Investments", type: "ASSET", isSystem: true },
  { code: "10100", name: "Petty Cash", type: "ASSET", parent: "10000", isSystem: true },
  { code: "10200", name: "Cash Payroll", type: "ASSET", parent: "10000", isSystem: true },
  { code: "10300", name: "Bank: Operating account", type: "ASSET", parent: "10000", isSystem: true },
  { code: "10400", name: "Term Deposits", type: "ASSET", parent: "10000", isSystem: true },
  { code: "10500", name: "Reserve Investments", type: "ASSET", parent: "10000", isSystem: true },
  { code: "10999", name: "Total Cash and Investments", type: "ASSET", parent: "10000", isSystem: true },

  { code: "1200", name: "Receivables", type: "ASSET", isSystem: true },
  { code: "12100", name: "Accounts Receivable", type: "ASSET", parent: "1200", isSystem: true },
  { code: "12150", name: "Allowance for Doubtful Accounts", type: "ASSET", parent: "1200", isSystem: true },
  { code: "12200", name: "Accounts Receivable – Net", type: "ASSET", parent: "1200", isSystem: true },
  { code: "12300", name: "Travel Advances", type: "ASSET", parent: "1200", isSystem: true },
  { code: "12400", name: "Good & Services Tax (GST) Paid on Purchases", type: "ASSET", parent: "1200", isSystem: true },
  { code: "12999", name: "Total Receivables", type: "ASSET", parent: "1200", isSystem: true },

  { code: "13000", name: "Prepaid Expense and Deposits", type: "ASSET", isSystem: true },
  { code: "13999", name: "Total Prepaid Expenses and Deposits", type: "ASSET", parent: "13000", isSystem: true },

  { code: "14000", name: "Inventories", type: "ASSET", isSystem: true },
  { code: "14100", name: "Inventory", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14101", name: "HFO 180", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14102", name: "HFO150", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14103", name: "HFO 125", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14104", name: "Automobile Gas Oil (diesel)", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14105", name: "Gasoline (Petrol)", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14106", name: "Parafine Oil (Kerosene)", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14107", name: "IDO", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14108", name: "Bitumen", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14109", name: "Lubricant", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14110", name: "Sludge", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14112", name: "Waste Oil", type: "ASSET", parent: "14000", isSystem: true },
  { code: "14999", name: "Total Inventories", type: "ASSET", parent: "14000", isSystem: true },

  { code: "1500", name: "Total Current asset", type: "ASSET", isSystem: true },

  { code: "16000", name: "Tangible Capital Assets", type: "ASSET", isSystem: true },
  { code: "16010", name: "Computer Hardware and Software", type: "ASSET", parent: "16000", isSystem: true },
  { code: "16020", name: "Furniture and Fixtures", type: "ASSET", parent: "16000", isSystem: true },
  { code: "16030", name: "Machinery and Equipment", type: "ASSET", parent: "16000", isSystem: true },
  { code: "16040", name: "Motor Vehicles", type: "ASSET", parent: "16000", isSystem: true },
  { code: "16050", name: "Buildings", type: "ASSET", parent: "16000", isSystem: true },
  { code: "16060", name: "Systems and Database", type: "ASSET", parent: "16000", isSystem: true },
  { code: "16070", name: "Land and Improvements", type: "ASSET", parent: "16000", isSystem: true },
  { code: "16350", name: "Other assets", type: "ASSET", parent: "16000", isSystem: true },
  { code: "16400", name: "Work In progress", type: "ASSET", parent: "16000", isSystem: true },
  { code: "16990", name: "Total Tangible Capital Assets", type: "ASSET", parent: "16000", isSystem: true },

  { code: "17000", name: "Accumulated Amortization", type: "ASSET", isSystem: true },
  { code: "17010", name: "Accumulated Amortization – Computer (H&S)", type: "ASSET", parent: "17000", isSystem: true },
  { code: "17050", name: "Accumulated Amortization - Furniture and Fixtures", type: "ASSET", parent: "17000", isSystem: true },
  { code: "17100", name: "Accumulated Amortization - Machinery and Equipment", type: "ASSET", parent: "17000", isSystem: true },
  { code: "17150", name: "Accumulated Amortization – Vehicles", type: "ASSET", parent: "17000", isSystem: true },
  { code: "17200", name: "Accumulated Amortization – Buildings", type: "ASSET", parent: "17000", isSystem: true },
  { code: "17250", name: "Accumulated Amortization – Systems", type: "ASSET", parent: "17000", isSystem: true },
  { code: "17300", name: "Accumulated Amortization - Land Improvements", type: "ASSET", parent: "17000", isSystem: true },
  { code: "17350", name: "Accumulated Amortization - Other Assets", type: "ASSET", parent: "17000", isSystem: true },
  { code: "17400", name: "Accumulated Amortization - Work in Progress", type: "ASSET", parent: "17000", isSystem: true },
  { code: "17950", name: "Total Accumulated Amortization", type: "ASSET", parent: "17000", isSystem: true },
  { code: "17999", name: "Net Tangible Capital Assets", type: "ASSET", parent: "16000", isSystem: true },

  // ================= LIABILITIES =================
  { code: "20000", name: "Current Liabilities", type: "LIABILITY", isSystem: true },
  { code: "20100", name: "Bank Overdraft", type: "LIABILITY", parent: "20000", isSystem: true },
  { code: "20200", name: "Advance from Department", type: "LIABILITY", parent: "20000", isSystem: true },
  { code: "20900", name: "Other Loans Payable", type: "LIABILITY", parent: "20000", isSystem: true },
  { code: "20950", name: "Current Lease Obligations", type: "LIABILITY", parent: "20000", isSystem: true },
  { code: "21100", name: "Accounts Payable", type: "LIABILITY", parent: "20000", isSystem: true },
  { code: "21120", name: "MEBP Pension", type: "LIABILITY", parent: "21100", isSystem: true },
  { code: "21140", name: "Medical Payable", type: "LIABILITY", parent: "21100", isSystem: true },
  { code: "21160", name: "Note payable Credit line #1", type: "LIABILITY", parent: "21100", isSystem: true },
  { code: "21170", name: "Note Payable Credit Line #2", type: "LIABILITY", parent: "21100", isSystem: true },
  { code: "21190", name: "Interest Payable", type: "LIABILITY", parent: "21100", isSystem: true },
  { code: "21220", name: "Wage Payable", type: "LIABILITY", parent: "21100", isSystem: true },
  { code: "21240", name: "Unearned Revenues Payable", type: "LIABILITY", parent: "21100", isSystem: true },
  { code: "21260", name: "Income Tax Payable", type: "LIABILITY", parent: "21100", isSystem: true },
  { code: "21800", name: "Property Taxes Payable", type: "LIABILITY", parent: "21100", isSystem: true },
  { code: "21920", name: "Customer Prepayments", type: "LIABILITY", parent: "21100", isSystem: true },
  { code: "21999", name: "Total Current Liabilities", type: "LIABILITY", parent: "20000", isSystem: true },

  { code: "24000", name: "Deferred Revenue (O&M)", type: "LIABILITY", isSystem: true },
  { code: "24490", name: "Total Deferred Revenue (O&M)", type: "LIABILITY", parent: "24000", isSystem: true },

  { code: "24500", name: "Deferred Revenue (Project)", type: "LIABILITY", isSystem: true },
  { code: "24600", name: "Tallying Income", type: "LIABILITY", parent: "24500", isSystem: true },
  { code: "24700", name: "Other Business", type: "LIABILITY", parent: "24500", isSystem: true },
  { code: "24999", name: "Total Deferred Revenue (Projects)", type: "LIABILITY", parent: "24500", isSystem: true },

  { code: "25000", name: "Long-term Liabilities", type: "LIABILITY", isSystem: true },
  { code: "2510", name: "Bank Loans", type: "LIABILITY", parent: "25000", isSystem: true },
  { code: "2520", name: "Long-term Lease Obligation", type: "LIABILITY", parent: "25000", isSystem: true },
  { code: "2530", name: "Bonds Payable", type: "LIABILITY", parent: "25000", isSystem: true },
  { code: "2540", name: "Discount on Bonds Payable", type: "LIABILITY", parent: "25000", isSystem: true },
  { code: "2599", name: "Total Long-term Liabilities", type: "LIABILITY", parent: "25000", isSystem: true },

  { code: "2700", name: "Deferred Revenue (Reserves)", type: "LIABILITY", isSystem: true },
  { code: "2799", name: "Total Deferred Revenue (Reserves)", type: "LIABILITY", parent: "2700", isSystem: true },

  // ================= EQUITY =================
  { code: "30000", name: "Equity", type: "EQUITY", isSystem: true },
  { code: "30500", name: "Current Earnings", type: "EQUITY", parent: "30000", isSystem: true },
  { code: "30510", name: "Transfers to Equity", type: "EQUITY", parent: "30000", isSystem: true },
  { code: "30600", name: "Retained Earnings", type: "EQUITY", parent: "30000", isSystem: true },
  { code: "30700", name: "Treasury Stock", type: "EQUITY", parent: "30000", isSystem: true },
  { code: "39999", name: "Total Equity", type: "EQUITY", parent: "30000", isSystem: true },

  // ================= OPERATION REVENUE =================
  { code: "40000", name: "Port Services Funding", type: "REVENUE", isSystem: true },
  { code: "40100", name: "Core Funding", type: "REVENUE", parent: "40000", isSystem: true },
  { code: "40200", name: "Operating Reserve", type: "REVENUE", parent: "40000", isSystem: true },
  { code: "40300", name: "Supplemental Funding", type: "REVENUE", parent: "40000", isSystem: true },
  { code: "40999", name: "Total Operating Funding", type: "REVENUE", parent: "40000", isSystem: true },

  { code: "43000", name: "User Fees and Other Revenue", type: "REVENUE", isSystem: true },
  { code: "43100", name: "Government Refund Tax", type: "REVENUE", parent: "43000", isSystem: true },
  { code: "43200", name: "Other Services fees", type: "REVENUE", parent: "43000", isSystem: true },
  { code: "43300", name: "Rentals", type: "REVENUE", parent: "43000", isSystem: true },
  { code: "43400", name: "Licenses /Permits/Fees", type: "REVENUE", parent: "43000", isSystem: true },
  { code: "43500", name: "Interest", type: "REVENUE", parent: "43000", isSystem: true },
  { code: "43600", name: "Gifts/Donations", type: "REVENUE", parent: "43000", isSystem: true },
  { code: "43700", name: "Other Fees and Revenues", type: "REVENUE", parent: "43000", isSystem: true },
  { code: "43999", name: "Total User Fees and Other Revenue", type: "REVENUE", parent: "43000", isSystem: true },

  { code: "44000", name: "Capital", type: "REVENUE", isSystem: true },
  { code: "44900", name: "Contributed Assets Revenue", type: "REVENUE", parent: "44000", isSystem: true },
  { code: "44999", name: "Total Capital", type: "REVENUE", parent: "44000", isSystem: true },

  // ================= COST OF GOODS SOLD =================
  { code: "45010", name: "COGS - Shanta Gold", type: "COGS", isSystem: true },
  { code: "45020", name: "COGS - Lake Steel Industries", type: "COGS", isSystem: true },
  { code: "45030", name: "COGS - Lodhia Industries", type: "COGS", isSystem: true },
  { code: "45040", name: "COGS - Tanzania Breweries Limited", type: "COGS", isSystem: true },
  { code: "45050", name: "COGS - Steel Master Industries", type: "COGS", isSystem: true },
  { code: "45060", name: "COGS - Muhimbili National Hospital", type: "COGS", isSystem: true },
  { code: "45070", name: "COGS - Tanzania Biotech Products ltd", type: "COGS", isSystem: true },
  { code: "45080", name: "COGS - Mufindi Papermill industries", type: "COGS", isSystem: true },
  { code: "45090", name: "COGS - Morogoro Tobacco Industries", type: "COGS", isSystem: true },
  { code: "45100", name: "COGS Benjamin Mkapa Hospital", type: "COGS", isSystem: true },
  { code: "45110", name: "COGS Fulcon Tanzania", type: "COGS", isSystem: true },
  { code: "45120", name: "COGS Jambo Industries Limited", type: "COGS", isSystem: true },
  { code: "45130", name: "COGS Mbeya Cement Factory Ltd", type: "COGS", isSystem: true },
  { code: "45140", name: "COGS East Africa Spirits Ltd", type: "COGS", isSystem: true },
  { code: "45150", name: "COGS Pepsi Cola Mbeya", type: "COGS", isSystem: true },
  { code: "45999", name: "Total cost of goods Sold", type: "COGS", isSystem: true },

  // ================= EXPENSE =================
  { code: "5001", name: "Salaries Payroll", type: "EXPENSE", isSystem: true },
  { code: "5002", name: "Wages", type: "EXPENSE", isSystem: true },
  { code: "5003", name: "Tax Expense", type: "EXPENSE", isSystem: true },
  { code: "5004", name: "WCF Expense", type: "EXPENSE", isSystem: true },
  { code: "5005", name: "Supplies Expense", type: "EXPENSE", isSystem: true },
  { code: "5006", name: "Telephone and Internet Expenses", type: "EXPENSE", isSystem: true },
  { code: "5007", name: "Medical expenses", type: "EXPENSE", isSystem: true },
  { code: "5008", name: "House allowances expenses", type: "EXPENSE", isSystem: true },
  { code: "5009", name: "NSSF expenses", type: "EXPENSE", isSystem: true },
  { code: "5010", name: "Transport allowance expenses", type: "EXPENSE", isSystem: true },
  { code: "5011", name: "Other", type: "EXPENSE", isSystem: true },
  { code: "5099", name: "Total Payroll", type: "EXPENSE", isSystem: true },

  { code: "5100", name: "Operations", type: "EXPENSE", isSystem: true },
  { code: "5110", name: "Bank/Late Fees/Interest", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5120", name: "Interview Expense", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5130", name: "Postage/Freight", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5140", name: "Phone/Fax/Internet", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5150", name: "Accounting/Auditing/Legal", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5160", name: "Bad Debt Expense", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5170", name: "Memberships/Registration Fees", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5180", name: "Grants and Donations", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5190", name: "Training Expenses", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5200", name: "Travel expenses", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5320", name: "Site Maintenance (Customers)", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5330", name: "Building Maintenance", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5340", name: "Equipment Rental", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5350", name: "Equipment Maintenance", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5360", name: "Pump Replacement", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5370", name: "Equipment purchase", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5380", name: "Supplies", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5400", name: "Fuel purchase", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5410", name: "Licenses and Insurance", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5490", name: "Other Operations", type: "EXPENSE", parent: "5100", isSystem: true },
  { code: "5599", name: "Total Operations", type: "EXPENSE", parent: "5100", isSystem: true },

  { code: "5600", name: "Community Operations", type: "EXPENSE", isSystem: true },
  { code: "5699", name: "Total Community Operations", type: "EXPENSE", parent: "5600", isSystem: true },

  { code: "5900", name: "Other Expenses", type: "EXPENSE", isSystem: true },
  { code: "5910", name: "Amortization Expense", type: "EXPENSE", parent: "5900", isSystem: true },
  { code: "5950", name: "Gain/Loss on Disposal of Assets", type: "EXPENSE", parent: "5900", isSystem: true },
  { code: "5999", name: "Total Other Expenses", type: "EXPENSE", parent: "5900", isSystem: true },
].map((a) => ({
  ...a,
  id: a.code,
}));

export default function AccountCodes() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const [newAccount, setNewAccount] = useState({
    code: "",
    name: "",
    type: "ASSET",
    parent: "",
  });

  useEffect(() => {
    const stored = safeParse(localStorage.getItem(STORAGE_KEY), []);
    const initial = stored.length > 0 ? stored : DOCX_ACCOUNTS;
    const sorted = [...initial].sort(sortByCode);
    setAccounts(sorted);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts, loaded]);

  const groupedAccounts = useMemo(() => {
    const grouped = accounts.reduce((acc, account) => {
      acc[account.type] = acc[account.type] || [];
      acc[account.type].push(account);
      return acc;
    }, {});

    Object.keys(grouped).forEach((type) => {
      grouped[type].sort(sortByCode);
    });

    return Object.entries(grouped).sort(
      (a, b) => (typeOrder[a[0]] || 99) - (typeOrder[b[0]] || 99)
    );
  }, [accounts]);

  const openAddForm = () => {
    setEditingCode(null);
    setNewAccount({
      code: "",
      name: "",
      type: "ASSET",
      parent: "",
    });
    setShowForm(true);
  };

  const handleSave = () => {
    const code = String(newAccount.code || "").trim();
    const name = String(newAccount.name || "").trim();

    if (!code || !name) return;

    const finalType = newAccount.type || inferTypeFromCode(code);

    const duplicateExists =
      accounts.some(
        (acc) => String(acc.code) === code && String(acc.code) !== String(editingCode)
      );

    if (duplicateExists) {
      alert("That account code already exists.");
      return;
    }

    if (editingCode) {
      setAccounts((prev) =>
        prev.map((acc) =>
          String(acc.code) === String(editingCode)
            ? {
                ...acc,
                code,
                name,
                type: finalType,
                parent: newAccount.parent.trim(),
              }
            : acc
        )
      );
    } else {
      setAccounts((prev) =>
        [
          ...prev,
          {
            id: code,
            code,
            name,
            type: finalType,
            parent: newAccount.parent.trim(),
            isSystem: false,
          },
        ].sort(sortByCode)
      );
    }

    setNewAccount({ code: "", name: "", type: "ASSET", parent: "" });
    setEditingCode(null);
    setShowForm(false);
  };

  const handleEdit = (acc) => {
    setEditingCode(acc.code);
    setNewAccount({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      parent: acc.parent || "",
    });
    setShowForm(true);
  };

  const handleDelete = (code) => {
    const ok = window.confirm("Delete this account?");
    if (!ok) return;

    setAccounts((prev) => prev.filter((acc) => String(acc.code) !== String(code)));
  };

  const getRowColor = (type) => {
    if (type === "REVENUE") return typeColors.REVENUE;
    if (type === "COGS" || type === "EXPENSE") return typeColors.EXPENSE;
    return typeColors[type] || "#111827";
  };

  return (
    <div className="account-container">
      <div className="account-header">
        <h2>Chart of Accounts</h2>
        <button className="btn-primary" onClick={openAddForm}>
          <FiPlus /> Add Account
        </button>
      </div>

      {showForm && (
        <div className="account-form">
          <input
            placeholder="Account Code"
            value={newAccount.code}
            onChange={(e) => {
              const nextCode = e.target.value;
              const suggestedType = inferTypeFromCode(nextCode);
              setNewAccount((prev) => ({
                ...prev,
                code: nextCode,
                type: suggestedType || prev.type,
              }));
            }}
          />
          <input
            placeholder="Account Name"
            value={newAccount.name}
            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
          />
          <select
            value={newAccount.type}
            onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
          >
            <option value="ASSET">Asset</option>
            <option value="LIABILITY">Liability</option>
            <option value="EQUITY">Equity</option>
            <option value="REVENUE">Revenue</option>
            <option value="COGS">COGS</option>
            <option value="EXPENSE">Expense</option>
            <option value="SYSTEM">System</option>
          </select>

          <input
            placeholder="Parent Code (optional)"
            value={newAccount.parent}
            onChange={(e) => setNewAccount({ ...newAccount, parent: e.target.value })}
          />

          <button className="btn-save" onClick={handleSave}>
            {editingCode ? "Update" : "Save"}
          </button>
        </div>
      )}

      {groupedAccounts.map(([type, items]) => (
        <div key={type} className="account-section">
          <h3 className="section-title">{type}</h3>

          <table className="account-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Account Name</th>
                <th>Parent</th>
                <th>System</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((acc) => {
                const rowColor = getRowColor(acc.type);

                return (
                  <tr key={acc.code} style={{ color: rowColor }}>
                    <td>{acc.code}</td>
                    <td>{acc.name}</td>
                    <td>{acc.parent || "-"}</td>
                    <td>{acc.isSystem ? <FiLock /> : "-"}</td>
                    <td>
                      <FiEdit2 className="acicon-btn" onClick={() => handleEdit(acc)} />
                      <FiTrash2 className="acdelete" onClick={() => handleDelete(acc.code)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

