

// src/pages/admin/logistics/LiveTruck.jsx
import "./LiveTruck.css";
import { useState } from "react";

/* ===== MOCK DATA USING YOUR TRUCK NUMBERS ===== */
const tripsDB = [
  {
    id: 1,
    date: "2026-02-22",
    driver: "John Mushi",
    truckNo: "386EFB",
    trailerNo: "TRL-101",
    trip: "Dar-Mbeya",
    status: "Online"
  },
  {
    id: 2,
    date: "2026-02-22",
    driver: "Ahmed Salim",
    truckNo: "395EFB",
    trailerNo: "TRL-102",
    trip: "Mbeya-Dar",
    status: "Online"
  },
  {
    id: 3,
    date: "2026-02-22",
    driver: "Peter John",
    truckNo: "294EFB",
    trailerNo: "TRL-103",
    trip: "Dar-Mbeya",
    status: "Offline"
  },
  {
    id: 4,
    date: "2026-02-22",
    driver: "Mussa Omari",
    truckNo: "382EFB",
    trailerNo: "TRL-104",
    trip: "Mbeya-Dar",
    status: "Online"
  },
  {
    id: 5,
    date: "2026-02-22",
    driver: "David Juma",
    truckNo: "390EFB",
    trailerNo: "TRL-105",
    trip: "Dar-Mbeya",
    status: "Online"
  },
  {
    id: 6,
    date: "2026-02-22",
    driver: "Elia Mgaya",
    truckNo: "393EFB",
    trailerNo: "TRL-106",
    trip: "Mbeya-Dar",
    status: "Offline"
  },
  {
    id: 7,
    date: "2026-02-22",
    driver: "Isack Mwita",
    truckNo: "396EFB",
    trailerNo: "TRL-107",
    trip: "Dar-Mbeya",
    status: "Online"
  },
  {
    id: 8,
    date: "2026-02-22",
    driver: "Lucas Kimaro",
    truckNo: "405EFB",
    trailerNo: "TRL-108",
    trip: "Mbeya-Dar",
    status: "Online"
  },
  {
    id: 9,
    date: "2026-02-22",
    driver: "Samwel John",
    truckNo: "392EFB",
    trailerNo: "TRL-109",
    trip: "Dar-Mbeya",
    status: "Offline"
  }
];

export default function LiveTruck() {
  const [selectedTrip, setSelectedTrip] = useState(null);

  const openTracking = () => {
    window.open("https://www.overseetracking.com/index.aspx", "_blank");
  };

  const getTripDirection = (trip) => {
    if (trip === "Dar-Mbeya") return "green";
    if (trip === "Mbeya-Dar") return "red";
    return "";
  };

  return (
    <div className="liveTruckPage">

      {/* HEADER */}
      <div className="liveTruckHeader">
        <div>
          <h2>Live Truck Operations</h2>
          <p>Real-time monitoring of all logistics trips</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="liveTruckTableWrapper">
        <table className="liveTruckTable">
          <thead>
            <tr>
              <th>SN</th>
              <th>Date</th>
              <th>Driver Name</th>
              <th>Truck No</th>
              <th>Trailer No</th>
              <th>Trip</th>
              <th>Live Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {tripsDB.map((trip, index) => (
              <tr key={trip.id}>
                <td>{index + 1}</td>
                <td>{trip.date}</td>
                <td>{trip.driver}</td>
                <td>{trip.truckNo}</td>
                <td>{trip.trailerNo}</td>

                <td>
                  <span className={`trip ${getTripDirection(trip.trip)}`}>
                    {trip.trip === "Dar-Mbeya"
                      ? "Dar → Mbeya"
                      : "Mbeya → Dar"}
                  </span>
                </td>

                <td>
                  <span className={`status ${trip.status.toLowerCase()}`}>
                    {trip.status}
                  </span>
                </td>

                <td>
                  <button
                    className="actionBtn view"
                    onClick={() => setSelectedTrip(trip)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FULL PAGE POPUP */}
      {selectedTrip && (
        <div className="trackingOverlay">
          <div className="trackingCard">

            <h2>Tracking Access</h2>
            <p>
              <strong>Truck:</strong> {selectedTrip.truckNo}
            </p>

            <div className="credentialsBox">
              <div><strong>Username:</strong> Philip Majule</div>
              <div><strong>Password:</strong> Wazohill4real</div>
            </div>

            <button className="btnPrimary" onClick={openTracking}>
              View Live
            </button>

            <button
              className="btnClose"
              onClick={() => setSelectedTrip(null)}
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}