import "./DriversList.css";
import { useState, useMemo, useEffect } from "react";
import API from "../../../services/api";

const unwrapList = (res) => {
  const data = res?.data ?? res ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.drivers)) return data.drivers;
  return [];
};

export default function DriversList() {
  const [driversDB, setDriversDB] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddDriver, setShowAddDriver] = useState(false);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLicenseNo, setFormLicenseNo] = useState("");
  const [formLicenseExpiry, setFormLicenseExpiry] = useState("");
  const [formStatus, setFormStatus] = useState("OFFLINE");

  const [savingDriver, setSavingDriver] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  /* ================= LOAD DRIVERS FROM API ================= */
  const loadDrivers = async () => {
    try {
      setLoadingDrivers(true);

      const res = await API.get("logistics/drivers/");
      const data = unwrapList(res);

      const mapped = data.map((d, idx) => ({
        id: d.id ?? idx + 1,
        name: d.name ?? "",
        phone: d.phone ?? "",
        licenseNo: d.license_number ?? "",
        licenseExpiry: d.license_expiry ?? "",
        status: d.status ?? "OFFLINE",
        totalTrips: d.total_trips ?? 0,
        createdAt: d.created_at ?? "",
        updatedAt: d.updated_at ?? ""
      }));

      setDriversDB(mapped);
    } catch (err) {
      console.error("Drivers API failed:", err);
      setDriversDB([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  /* ================= CREATE DRIVER ================= */
  const saveDriver = async (e) => {
    e.preventDefault();

    if (!formName.trim()) {
      alert("Driver name required");
      return;
    }

    try {
      setSavingDriver(true);

      const payload = {
        name: formName.trim(),
        phone: formPhone.trim(),
        license_number: formLicenseNo.trim(),
        license_expiry: formLicenseExpiry || null,
        status: formStatus
      };

      await API.post("logistics/drivers/", payload);

      setShowAddDriver(false);

      setFormName("");
      setFormPhone("");
      setFormLicenseNo("");
      setFormLicenseExpiry("");
      setFormStatus("OFFLINE");

      await loadDrivers();
    } catch (err) {
      console.error("Driver create failed:", err);
      console.error("Server response:", err?.response?.data);
      alert("Failed to save driver");
    } finally {
      setSavingDriver(false);
    }
  };

  /* ================= FILTER ================= */
  const filteredDrivers = useMemo(() => {
    return driversDB.filter((driver) => {
      const matchSearch =
        `${driver.name || ""} ${driver.phone || ""} ${driver.licenseNo || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "All" || driver.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, driversDB]);

  /* ================= SUMMARY ================= */
  const totalDrivers = driversDB.length;
  const onTrip = driversDB.filter((d) => d.status === "ON_TRIP").length;
  const onLeave = driversDB.filter((d) => d.status === "OFFLINE").length;
  const totalTrips = driversDB.reduce((sum, d) => sum + Number(d.totalTrips || 0), 0);

  return (
    <div className="driversPage">
      {/* HEADER */}
      <div className="driversHeader">
        <div>
          <h2>Drivers Management</h2>
          <p>Manage company drivers and assignments</p>
        </div>

        <button
          className="addbtnPrimary"
          onClick={() => setShowAddDriver(true)}
        >
          + Add Driver
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="driversSummary">
        <div className="summaryCard">
          <h4>Total Drivers</h4>
          <span>{totalDrivers}</span>
        </div>

        <div className="summaryCard green">
          <h4>Currently On Trip</h4>
          <span>{onTrip}</span>
        </div>

        <div className="summaryCard orange">
          <h4>Offline</h4>
          <span>{onLeave}</span>
        </div>

        <div className="summaryCard purple">
          <h4>Total Trips</h4>
          <span>{totalTrips}</span>
        </div>
      </div>

      {/* FILTER + EXPORT */}
      <div className="driversFilters">
        <div className="filterLeft">
          <input
            placeholder="Search Name, Phone or License..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>ONLINE</option>
            <option>OFFLINE</option>
            <option>SUSPENDED</option>
          </select>
        </div>

        <button className="btnExport" onClick={loadDrivers}>
          {loadingDrivers ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* TABLE */}
      <div className="driversTableWrapper">
        <table className="driversTable">
          <thead>
            <tr>
              <th>SN</th>
              <th>Driver Name</th>
              <th>Phone</th>
              <th>License No</th>
              <th>License Expiry</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredDrivers.map((driver, index) => (
              <tr key={driver.id || `${driver.name}-${index}`}>
                <td>{index + 1}</td>
                <td>{driver.name}</td>
                <td>{driver.phone}</td>
                <td>{driver.licenseNo}</td>
                <td>{driver.licenseExpiry}</td>
                <td>{driver.status}</td>
                <td>
                  <button className="actionBtn view" type="button">
                    View
                  </button>
                  <button className="actionBtn edit" type="button">
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredDrivers.length === 0 && (
              <tr>
                <td colSpan="7" className="noData">
                  No drivers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD DRIVER MODAL */}
      {showAddDriver && (
        <div className="modal-backdrop" onClick={() => setShowAddDriver(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Driver</h3>

            <form className="modal-form" onSubmit={saveDriver}>
              <label>
                Driver Name
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </label>

              <label>
                Phone
                <input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </label>

              <label>
                License Number
                <input
                  value={formLicenseNo}
                  onChange={(e) => setFormLicenseNo(e.target.value)}
                />
              </label>

              <label>
                License Expiry
                <input
                  type="date"
                  value={formLicenseExpiry}
                  onChange={(e) => setFormLicenseExpiry(e.target.value)}
                />
              </label>

              <label>
                Status
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddDriver(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingDriver}
                >
                  {savingDriver ? "Saving..." : "Save Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}