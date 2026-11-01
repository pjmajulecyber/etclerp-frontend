

// src/pages/admin/logistics/TruckList.jsx
import "./TruckList.css";
import { useState, useMemo, useEffect } from "react";
import API from "../../../services/api";

const MOCK_TRUCKS = [
  {
    id: 1,
    truckNo: "386EFB",
    trailerNo: "TRL-101",
    driver: "Mussa Jafari",
    driverId: null,
    model: "HOWO",
    insuranceExpiry: "2026-11-15",
    status: "PENDING",
    trips: 12,
    notes: ""
  },
  {
    id: 2,
    truckNo: "395EFB",
    trailerNo: "TRL-102",
    driver: "Kalolo",
    driverId: null,
    model: "HOWO",
    insuranceExpiry: "2026-07-20",
    status: "ON_TRIP",
    trips: 8,
    notes: ""
  },
  {
    id: 3,
    truckNo: "294EFB",
    trailerNo: "TRL-103",
    driver: "Riziki",
    driverId: null,
    model: "HOWO",
    insuranceExpiry: "2025-12-30",
    status: "COMPLETED",
    trips: 5,
    notes: ""
  }
];

const unwrapList = (res) => {
  const data = res?.data ?? res ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.trucks)) return data.trucks;
  return [];
};

const normalizeStatus = (value) => {
  const v = String(value || "").trim().toUpperCase();

  if (v === "ALL") return "PENDING";
  if (v === "ON ROAD") return "ON_TRIP";
  if (v === "SERVICE") return "CANCELLED";
  if (v === "AVAILABLE") return "PENDING";
  if (v === "PENDIND") return "PENDING";
  if (v === "PENDING" || v === "ON_TRIP" || v === "COMPLETED" || v === "CANCELLED") return v;

  return "PENDING";
};

const labelStatus = (value) => {
  const v = String(value || "").toUpperCase();
  if (v === "ON_TRIP") return "On Trip";
  if (v === "COMPLETED") return "Completed";
  if (v === "CANCELLED") return "Cancelled";
  return "Pending";
};

export default function TruckList() {
  const [trucksDB, setTrucksDB] = useState([]);
  const [driversDB, setDriversDB] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddTruck, setShowAddTruck] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add | edit | view
  const [selectedTruck, setSelectedTruck] = useState(null);

  const [formTruckNo, setFormTruckNo] = useState("");
  const [formTrailerNo, setFormTrailerNo] = useState("");
  const [formDriverId, setFormDriverId] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formInsuranceExpiry, setFormInsuranceExpiry] = useState("");
  const [formStatus, setFormStatus] = useState("PENDING");
  const [formNotes, setFormNotes] = useState("");

  const [savingTruck, setSavingTruck] = useState(false);
  const [loadingTrucks, setLoadingTrucks] = useState(false);

  /* ================= LOAD DRIVERS ================= */
  const loadDrivers = async () => {
    try {
      const res = await API.get("logistics/drivers/");
      const data = unwrapList(res);

      const mapped = data.map((d, idx) => ({
        id: d.id ?? idx + 1,
        name: d.name ?? "",
        phone: d.phone ?? "",
        license_number: d.license_number ?? "",
        license_expiry: d.license_expiry ?? "",
        status: d.status ?? "OFFLINE",
        total_trips: d.total_trips ?? 0
      }));

      setDriversDB(mapped);
    } catch (err) {
      console.error("Drivers API failed:", err);
      setDriversDB([]);
    }
  };

  /* ================= LOAD TRIPS (FOR COUNTS) ================= */
  const loadTrips = async () => {
    try {
      const res = await API.get("logistics/trips/");
      const data = unwrapList(res);

      const tripCountsByTruck = {};
      data.forEach((trip) => {
        const truckNo = trip.truck_number ?? trip.truckNo ?? trip.truck ?? "";
        if (!truckNo) return;
        tripCountsByTruck[truckNo] = (tripCountsByTruck[truckNo] || 0) + 1;
      });

      return tripCountsByTruck;
    } catch (err) {
      console.warn("Trips API not reachable:", err?.message || err);
      return {};
    }
  };

  /* ================= LOAD TRUCKS ================= */
  const loadTrucks = async () => {
    try {
      setLoadingTrucks(true);

      const [truckRes, tripCounts] = await Promise.all([
        API.get("logistics/trucks/").catch(() => ({ data: [] })),
        loadTrips()
      ]);

      const data = unwrapList(truckRes);

      const mapped = data.map((t, idx) => {
        const truckNo = t.truck_number ?? t.truckNo ?? `TRK-${String(idx + 1).padStart(3, "0")}`;
        const driverName = t.driver_name ?? t.driver?.name ?? t.driver ?? "Unknown";
        const status = normalizeStatus(t.status);

        return {
          id: t.id ?? idx + 1,
          truckNo,
          trailerNo: t.trailer_number ?? t.trailerNo ?? "",
          driver: driverName,
          driverId: t.driver ?? t.driver_id ?? null,
          model: t.model ?? "",
          insuranceExpiry: t.insurance_expiry ?? t.insuranceExpiry ?? "",
          status,
          trips: Number(t.total_trips ?? tripCounts[truckNo] ?? 0),
          notes: t.notes ?? ""
        };
      });

      if (!mapped.length) {
        setTrucksDB(MOCK_TRUCKS);
      } else {
        setTrucksDB(mapped);
      }
    } catch (err) {
      console.error("Truck API failed:", err);
      setTrucksDB(MOCK_TRUCKS);
    } finally {
      setLoadingTrucks(false);
    }
  };

  useEffect(() => {
    loadDrivers();
    loadTrucks();
  }, []);

  /* ================= OPEN MODALS ================= */
  const openAddTruck = () => {
    setModalMode("add");
    setSelectedTruck(null);
    setFormTruckNo("");
    setFormTrailerNo("");
    setFormDriverId("");
    setFormModel("");
    setFormInsuranceExpiry("");
    setFormStatus("PENDING");
    setFormNotes("");
    setShowAddTruck(true);
  };

  const openEditTruck = (truck) => {
    setModalMode("edit");
    setSelectedTruck(truck);
    setFormTruckNo(truck.truckNo || "");
    setFormTrailerNo(truck.trailerNo || "");
    setFormDriverId(
      truck.driverId !== null && truck.driverId !== undefined
        ? String(truck.driverId)
        : ""
    );
    setFormModel(truck.model || "");
    setFormInsuranceExpiry(truck.insuranceExpiry || "");
    setFormStatus(normalizeStatus(truck.status || "PENDING"));
    setFormNotes(truck.notes || "");
    setShowAddTruck(true);
  };

  const openViewTruck = (truck) => {
    setModalMode("view");
    setSelectedTruck(truck);
    setFormTruckNo(truck.truckNo || "");
    setFormTrailerNo(truck.trailerNo || "");
    setFormDriverId(
      truck.driverId !== null && truck.driverId !== undefined
        ? String(truck.driverId)
        : ""
    );
    setFormModel(truck.model || "");
    setFormInsuranceExpiry(truck.insuranceExpiry || "");
    setFormStatus(normalizeStatus(truck.status || "PENDING"));
    setFormNotes(truck.notes || "");
    setShowAddTruck(true);
  };

  const closeModal = () => {
    setShowAddTruck(false);
    setSelectedTruck(null);
  };

  /* ================= SAVE TRUCK (ADD / EDIT) ================= */
  const saveTruck = async (e) => {
    e.preventDefault();

    if (!formTruckNo.trim()) {
      alert("Truck number required");
      return;
    }

    try {
      setSavingTruck(true);

      const payload = {
        truck_number: formTruckNo.trim(),
        trailer_number: formTrailerNo.trim() || null,
        driver: formDriverId ? Number(formDriverId) : null,
        model: formModel.trim(),
        insurance_expiry: formInsuranceExpiry || null,
        status: normalizeStatus(formStatus),
        notes: formNotes.trim() || ""
      };

      if (modalMode === "edit" && selectedTruck?.id) {
        await API.patch(`logistics/trucks/${selectedTruck.id}/`, payload);
      } else {
        await API.post("logistics/trucks/", payload);
      }

      closeModal();
      await loadTrucks();
    } catch (err) {
      console.error("Truck save failed:", err);
      console.error("Server response:", err?.response?.data);
      alert("Failed to save truck");
    } finally {
      setSavingTruck(false);
    }
  };

  /* ================= FILTER ================= */
  const filteredTrucks = useMemo(() => {
    return trucksDB.filter((truck) => {
      const driverValue = truck.driver || "";
      const matchSearch = `${truck.truckNo} ${truck.trailerNo} ${driverValue} ${truck.model}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "All" ||
        labelStatus(truck.status).toLowerCase() === statusFilter.toLowerCase() ||
        String(truck.status).toUpperCase() === String(statusFilter).toUpperCase();

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, trucksDB]);

  /* ================= SUMMARY ================= */
  const totalTrucks = trucksDB.length;
  const todayOnTrip = trucksDB.filter(t => t.status === "ON_TRIP").length;
  const completed = trucksDB.filter(t => t.status === "COMPLETED").length;
  const totalTrips = trucksDB.reduce((sum, t) => sum + (Number(t.trips) || 0), 0);

  const driverOptions = driversDB;

  return (
    <div className="truckPage">
      <div className="truckHeader">
        <div>
          <h2>Truck Management</h2>
          <p>Manage company fleet and logistics operations</p>
        </div>

        <button className="addTruck" onClick={openAddTruck}>
          + Add Truck
        </button>
      </div>

      <div className="truckSummary">
        <div className="summaryCard">
          <h4>Total Trucks</h4>
          <span>{totalTrucks}</span>
        </div>

        <div className="summaryCard green">
          <h4>Today On Trip</h4>
          <span>{todayOnTrip}</span>
        </div>

        <div className="summaryCard orange">
          <h4>Completed</h4>
          <span>{completed}</span>
        </div>

        <div className="summaryCard purple">
          <h4>Total Trips</h4>
          <span>{totalTrips}</span>
        </div>
      </div>

      <div className="truckFilters">
        <div className="filterLeft">
          <input
            placeholder="Search Truck, Trailer or Driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>PENDING</option>
            <option>ON_TRIP</option>
            <option>COMPLETED</option>
            <option>CANCELLED</option>
          </select>
        </div>

        <button className="btnExport" onClick={loadTrucks}>
          {loadingTrucks ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="truckTableWrapper">
        <table className="truckTable">
          <thead>
            <tr>
              <th>SN</th>
              <th>Truck No</th>
              <th>Trailer No</th>
              <th>Driver Name</th>
              <th>Truck Model</th>
              <th>Insurance Expiration</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredTrucks.map((truck, index) => (
              <tr key={truck.id || `${truck.truckNo}-${index}`}>
                <td>{index + 1}</td>
                <td>{truck.truckNo}</td>
                <td>{truck.trailerNo}</td>
                <td>{truck.driver}</td>
                <td>{truck.model}</td>
                <td>{truck.insuranceExpiry}</td>
                <td>{labelStatus(truck.status)}</td>
                <td>
                  <button className="actionBtn view" type="button" onClick={() => openViewTruck(truck)}>
                    View
                  </button>
                  <button className="actionBtn edit" type="button" onClick={() => openEditTruck(truck)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredTrucks.length === 0 && (
              <tr>
                <td colSpan="8" className="noData">
                  No trucks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddTruck && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modalMode === "add"
                ? "Add Truck"
                : modalMode === "edit"
                ? "Edit Truck"
                : "Truck Details"}
            </h3>

            <form className="modal-form" onSubmit={saveTruck}>
              <label>
                Truck Number
                <input
                  value={formTruckNo}
                  onChange={(e) => setFormTruckNo(e.target.value)}
                  required
                  disabled={modalMode === "view"}
                />
              </label>

              <label>
                Trailer Number
                <input
                  value={formTrailerNo}
                  onChange={(e) => setFormTrailerNo(e.target.value)}
                  disabled={modalMode === "view"}
                />
              </label>

              <label>
                Driver Name
                <select
                  value={formDriverId}
                  onChange={(e) => setFormDriverId(e.target.value)}
                  disabled={modalMode === "view"}
                >
                  <option value="">Select Driver</option>
                  {driverOptions.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Truck Model
                <input
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  disabled={modalMode === "view"}
                />
              </label>

              <label>
                Insurance Expiry
                <input
                  type="date"
                  value={formInsuranceExpiry}
                  onChange={(e) => setFormInsuranceExpiry(e.target.value)}
                  disabled={modalMode === "view"}
                />
              </label>

              <label>
                Status
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  disabled={modalMode === "view"}
                >
                  <option value="PENDING">Pending</option>
                  <option value="ON_TRIP">On Trip</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>

              <label>
                Notes
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  disabled={modalMode === "view"}
                  rows={3}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeModal}
                >
                  {modalMode === "view" ? "Close" : "Cancel"}
                </button>

                {modalMode !== "view" && (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingTruck}
                  >
                    {savingTruck ? "Saving..." : modalMode === "edit" ? "Update Truck" : "Save Truck"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 