import "./PackageExpired.css";
import { useState, useEffect } from "react";

export default function PackageExpired() {

  /* MOCK PACKAGE DATA */
  const [packageInfo, setPackageInfo] = useState({
    company: "Evosh Energy Ltd",
    package: "USD 163 / Monthly | VPS Plan",
    expiryDate: "2026-05-20",
    amount: "USD 1956/ Annually",
    usersAllowed: 5,
    usersUsed: 5,
    hoursAllowed: 8760,
    hoursUsed: 8760,
    status: "Active"
  });

  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (packageInfo.status === "expired") {
      setShowPopup(true);
    }
  }, [packageInfo]);

  if (!showPopup) return null;

  return (
    <div className="package-overlay">

      <div className="package-modal">

        <div className="package-header">
          <h2>Digital Ocean Subscription Expired</h2>
          <p>Your system access is temporarily disabled.</p>
        </div>

        <div className="package-body">

          <div className="package-info">

            <div className="package-row">
              <span>Company</span>
              <strong>{packageInfo.company}</strong>
            </div>

            <div className="package-row">
              <span>Current Plan</span>
              <strong>{packageInfo.package}</strong>
            </div>

            <div className="package-row">
              <span>Annually</span>
              <strong>{packageInfo.amount}</strong>
            </div>

            <div className="package-row">
              <span>Expiry Date</span>
              <strong>{packageInfo.expiryDate}</strong>
            </div>

            <div className="package-row">
              <span>Users Used</span>
              <strong>
                {packageInfo.usersUsed} / {packageInfo.usersAllowed}
              </strong>
            </div>

            <div className="package-row">
              <span>Hours Used (Year)</span>
              <strong>
                {packageInfo.hoursUsed} / {packageInfo.hoursAllowed}
              </strong>
            </div>

          </div>

          <div className="package-warning">
            Your subscription package has expired.  
            Please renew your plan to continue using Evosha ERP services.
          </div>

        </div>

        <div className="package-actions">

          <a
            href="https://www.digitalocean.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="package-btn primary"
          >
            Access Server
          </a>

          <a
            href="mailto:package@wapcom.com"
            className="package-btn secondary"
          >
            Contact Support
          </a>

        </div>

      </div>

    </div>
  );
}