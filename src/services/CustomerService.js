
import API from "./api";

export const getCustomers = () =>
  API.get("customers/");

export const getCustomer = (id) =>
  API.get(`customers/${id}/`);

export const getCustomerSummary = (id) =>
  API.get(`customers/${id}/financial_summary/`);

export const getCustomerLedger = (id) =>
  API.get(`customers/${id}/ledger/`);

export const getCustomerGlobalSummary = () =>
  API.get("customers/global_summary/");

export const createCustomer = (payload) => 
API.post("customers/", payload);


