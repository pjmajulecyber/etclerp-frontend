import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "./pages/auth/AuthProvider";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/apps/Dashboard";
import PackageExpire from "./pages/system/PackageExpire";

/* --- Sales --- */
import SalesList from "./pages/apps/sales/SalesList";
import Invoice from "./pages/apps/sales/modules/Invoice";
import Quatation from "./pages/apps/sales/modules/Quatation";
import Overdue from "./pages/apps/sales/modules/Overdue";
import AddSales from "./pages/apps/sales/modules/AddSales";
import AddProforma from "./pages/apps/sales/modules/AddProforma";
import InvoicePreview from "./pages/apps/sales/modules/InvoicePreview";
import ProformPreview from "./pages/apps/sales/modules/ProformPreview";
import DeliveryNote from "./pages/apps/sales/modules/DeliveryNote";
import ReceivePayments from "./pages/apps/sales/modules/ReceivePayments";
import ProformaInvoices from "./pages/apps/sales/modules/ProformaInvoices";

/* --- Purchases --- */
import PurchasesList from "./pages/apps/purchases/PurchasesList";
import AddPurchases from "./pages/apps/purchases/Modules/AddPurchases";
import PurchasesInvoicePreview from "./pages/apps/purchases/Modules/PurchasesInvoicePreview";
import Supplier from "./pages/apps/purchases/Modules/supplier";

/* --- Customers --- */
import CustomerList from "./pages/apps/customers/CustomerList";
import CustomerStatement from "./pages/apps/customers/CustomerStatement";
import CustomerAccount from "./pages/apps/customers/CustomerAc";
import StatementPreview from "./pages/apps/customers/StatementPreview";

/* --- Inventory --- */
import ProductList from "./pages/apps/inventory/ProductList";
import TrackStock from "./pages/apps/inventory/Stock/TrackStock";

/* --- Logistics --- */
import TruckList from "./pages/apps/logistics/TruckList";
import DriversList from "./pages/apps/logistics/DriversList";
import LiveTruck from "./pages/apps/logistics/LiveTruck";

/* --- Expenses --- */
import ExpensesList from "./pages/apps/expenses/ExpensesList";

/* --- HR --- */
import HRPayroll from "./pages/apps/payroll/HRPayroll";
import EmailAccess  from "./pages/apps/payroll/EmailAccess";


/* --- Assets --- */
import AssetsManagement from "./pages/apps/assets/AssetsManagement";

/* --- Docs --- */
import DocumentManagement from "./pages/apps/documents/DocumentManagement";

/* --- Settings --- */
import AccountCode from "./pages/apps/settings/AccountCode";
import CompanySettings from "./pages/apps/settings/CompanySettings";
import TaxSettings from "./pages/apps/settings/TaxSettings"; 
import PaymentSetting from "./pages/apps/settings/PaymentSetting"; 
import DatabaseBackup from "./pages/apps/settings/DatabaseBackup";


/* --- Reports --- */
import SalesReport from "./pages/apps/reports/SalesReport";
import PaymentReport from "./pages/apps/reports/PaymentReport";
import StockReport from "./pages/apps/reports/StockReport";
import ExpensesReport from "./pages/apps/reports/ExpensesReport";
import AssetsReport from "./pages/apps/reports/AssetsReport";

/* --- users --- */
import UsersList from "./pages/apps/users/UsersList";
import UserRoles from "./pages/apps/users/UserRoles";

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
        <Route path="/apps" element={<AdminLayout />}>

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
          <Route path="/apps/sales/modules/add" element={<AddSales onClose={() => window.history.back()} />} />
          <Route path="/apps/sales/modules/add-proforma" element={<AddProforma onClose={() => window.history.back()} />} />
          <Route path="/apps/purchases/modules/add" element={<AddPurchases onClose={() => window.history.back()} />} />
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

