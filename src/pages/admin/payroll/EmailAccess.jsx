

// src/pages/admin/settings/EmailAccess.jsx
import React from "react";
import "./EmailAccess.css";
import { FiMail, FiExternalLink } from "react-icons/fi";

export default function EmailAccess() {

  const openYahoo = () => {
    window.open("https://mail.yahoo.com", "_blank");
  };

  const openCpanel = () => {
    window.open("https://webmail.evosha.co.tz", "_blank");
  };

  return (
    <div className="email-page">

      <div className="email-header">
        <h2>Email Access</h2>
        <p>Quick access to company email accounts</p>
      </div>

      <div className="email-grid">

        {/* YAHOO */}
        <div className="email-card yahoo">
          <div className="email-icon">
            <FiMail />
          </div>

          <h3>Yahoo Mail</h3>
          <p className="email-address">evosha2010@yahoo.com</p>

          <button className="email-btn" onClick={openYahoo}>
            Open Yahoo Mail <FiExternalLink />
          </button>
        </div>

        {/* CPANEL */}
        <div className="email-card cpanel">
          <div className="email-icon">
            <FiMail />
          </div>

          <h3>cPanel Webmail</h3>
          <p className="email-address">mail.cpanel@evosha.co.tz</p>

          <button className="email-btn" onClick={openCpanel}>
            Open Webmail <FiExternalLink />
          </button>
        </div>

      </div>

      {/* INFO SECTION */}
      <div className="email-info">
        <h4>Usage Tips</h4>
        <ul>
          <li>Ensure you are logged in to the correct email account</li>
          <li>Use Yahoo for general communication</li>
          <li>Use cPanel email for official company correspondence</li>
        </ul>
      </div>

    </div>
  );
}
