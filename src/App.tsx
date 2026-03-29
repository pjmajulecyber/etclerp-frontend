import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "./pages/auth/AuthProvider";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/admin/Dashboard";
import PackageExpire from "./pages/system/PackageExpire";

/* --- Sales --- */
import SalesList from "./pages/admin/sales/SalesList";
import Invoice from "./pages/admin/sales/modules/Invoice";
import Quatation from "./pages/admin/sales/modules/Quatation";
import Overdue from "./pages/admin/sales/modules/Overdue";
import AddSales from "./pages/admin/sales/modules/AddSales";
import AddProforma from "./pages/admin/sales/modules/AddProforma";
import InvoicePreview from "./pages/admin/sales/modules/InvoicePreview";
import ProformPreview from "./pages/admin/sales/modules/ProformPreview";
import DeliveryNote from "./pages/admin/sales/modules/DeliveryNote";
import ReceivePayments from "./pages/admin/sales/modules/ReceivePayments";
import ProformaInvoices from "./pages/admin/sales/modules/ProformaInvoices";

/* --- Purchases --- */
import PurchasesList from "./pages/admin/purchases/PurchasesList";
import AddPurchases from "./pages/admin/purchases/Modules/AddPurchases";
import PurchasesInvoicePreview from "./pages/admin/purchases/Modules/PurchasesInvoicePreview";
import Supplier from "./pages/admin/purchases/Modules/supplier";

/* --- Customers --- */
import CustomerList from "./pages/admin/customers/CustomerList";
import CustomerStatement from "./pages/admin/customers/CustomerStatement";
import CustomerAccount from "./pages/admin/customers/CustomerAc";
import StatementPreview from "./pages/admin/customers/StatementPreview";

/* --- Inventory --- */
import ProductList from "./pages/admin/inventory/ProductList";
import TrackStock from "./pages/admin/inventory/Stock/TrackStock";

/* --- Logistics --- */
import TruckList from "./pages/admin/logistics/TruckList";
import DriversList from "./pages/admin/logistics/DriversList";
import LiveTruck from "./pages/admin/logistics/LiveTruck";

/* --- Expenses --- */
import ExpensesList from "./pages/admin/expenses/ExpensesList";

/* --- HR --- */
import HRPayroll from "./pages/admin/payroll/HRPayroll";
import EmailAccess  from "./pages/admin/payroll/EmailAccess";


/* --- Assets --- */
import AssetsManagement from "./pages/admin/assets/AssetsManagement";

/* --- Docs --- */
import DocumentManagement from "./pages/admin/documents/DocumentManagement";

/* --- Settings --- */
import AccountCode from "./pages/admin/settings/AccountCode";
import CompanySettings from "./pages/admin/settings/CompanySettings";
import TaxSettings from "./pages/admin/settings/TaxSettings"; 
import PaymentSetting from "./pages/admin/settings/PaymentSetting"; 
import DatabaseBackup from "./pages/admin/settings/DatabaseBackup";


/* --- Reports --- */
import SalesReport from "./pages/admin/reports/SalesReport";
import PaymentReport from "./pages/admin/reports/PaymentReport";
import StockReport from "./pages/admin/reports/StockReport";
import ExpensesReport from "./pages/admin/reports/ExpensesReport";
import AssetsReport from "./pages/admin/reports/AssetsReport";

/* --- users --- */
import UsersList from "./pages/admin/users/UsersList";
import UserRoles from "./pages/admin/users/UserRoles";

import AdminLayout from "./layouts/AdminLayout";

function AppRoutes() {

  const location = useLocation();
  const state = location.state;
  const backgroundLocation = state && state.backgroundLocation;

  return (
    <>
     <PackageExpire />
      <Routes location={backgroundLocation || location}>

        {/* LOGIN PAGE */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* ================= ADMIN AREA ================= */}
        <Route path="/admin" element={<AdminLayout />}>

          {/* redirect /admin → dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* SALES */}
          <Route path="sales/list" element={<SalesList />} />
          <Route path="sales/invoice" element={<Invoice />} />
          <Route path="sales/quotation" element={<Quatation />} />
          <Route path="sales/overdue" element={<Overdue />} />
          <Route path="sales/invoice-preview" element={<InvoicePreview />} />
          <Route path="sales/proform-preview" element={<ProformPreview />} />
          <Route path="sales/delivery-note" element={<DeliveryNote />} />
          <Route path="sales/receive-payments" element={<ReceivePayments />} />
          <Route path="sales/proforma-invoices" element={<ProformaInvoices />} />

          {/* PURCHASES */}
          <Route path="purchases" element={<PurchasesList />} />
          <Route path="purchases/invoice-preview" element={<PurchasesInvoicePreview />} />
          <Route path="purchases/supplier" element={<Supplier />} />

          {/* CUSTOMERS */}
          <Route path="customers/list" element={<CustomerList />} />
          <Route path="customers/customer-statement" element={<CustomerStatement />} />
          <Route path="customers/statement-preview" element={<StatementPreview />} />
          <Route path="customers/account/:code" element={<CustomerAccount />} />

          {/* LOGISTICS */}
          <Route path="logistics/list" element={<TruckList />} />
          <Route path="logistics/drivers-list" element={<DriversList />} />
          <Route path="logistics/live-truck" element={<LiveTruck />} />

          {/* INVENTORY */}
          <Route path="inventory" element={<ProductList />} />
          <Route path="inventory/stock/track" element={<TrackStock />} />

          {/* EXPENSES */}
          <Route path="expenses" element={<ExpensesList />} />

          {/* HR */}
          <Route path="payroll" element={<HRPayroll />} />
          <Route path="payroll/email-access" element={<EmailAccess />} />

          {/* ASSETS */}
          <Route path="assets" element={<AssetsManagement />} />

          {/* DOCUMENTS */}
          <Route path="documents" element={<DocumentManagement />} />

          {/* REPORTS */}
          <Route path="reports/sales-report" element={<SalesReport />} />
          <Route path="reports/payment-report" element={<PaymentReport />} />
          <Route path="reports/stock-report" element={<StockReport />} />
          <Route path="reports/expenses-report" element={<ExpensesReport />} />
          <Route path="reports/assets-report" element={<AssetsReport />} />

          <Route path="users/list" element={< UsersList />} />
          <Route path="users/roles" element={< UserRoles />} />


          {/* SETTINGS */}
          <Route path="settings/account-code" element={<AccountCode />} />
          <Route path="settings/company-settings" element={<CompanySettings />} /> 
          <Route path="settings/tax-settings" element={<TaxSettings />} />  
          <Route path="settings/payment-setting" element={<PaymentSetting />} /> DatabaseBackup
          <Route path="settings/database-backup" element={<DatabaseBackup />} />
 

        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      {/* ================= MODAL ROUTES ================= */}
      {backgroundLocation && (
        <Routes>
          <Route path="/admin/sales/modules/add" element={<AddSales onClose={() => window.history.back()} />} />
          <Route path="/admin/sales/modules/add-proforma" element={<AddProforma onClose={() => window.history.back()} />} />
          <Route path="/admin/purchases/modules/add" element={<AddPurchases onClose={() => window.history.back()} />} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    
      <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
  );
}

