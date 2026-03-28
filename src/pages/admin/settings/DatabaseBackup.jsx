
// src/pages/admin/settings/DatabaseBackup.jsx
import React, { useMemo, useState } from "react";
import "./DatabaseBackup.css";
import {
  FiDownload,
  FiRefreshCw,
  FiUpload,
  FiTrash2,
  FiHardDrive,
  FiCpu,
  FiClock,
  FiShield,
  FiServer,
  FiLayers,
} from "react-icons/fi";

const initialBackups = [
  {
    id: 1,
    file: "backup_2026_03_20_23_00.sql",
    size: "85.4 Gib",
    date: "20 Mar 2026",
    status: "Completed",
    duration: "18 sec",
    type: "Full",
  },
  {
    id: 2,
    file: "backup_2026_03_18_23_00.sql",
    size: "89.1 Gib",
    date: "18 Mar 2026",
    status: "Completed",
    duration: "16 sec",
    type: "Full",
  },
  {
    id: 3,
    file: "backup_2026_03_17_02_00.sql",
    size: "90.0 GiB",
    date: "17 Mar 2026",
    status: "Completed",
    duration: "15 sec",
    type: "Incremental",
  },
];

const requirements = [
  {
    label: "RAM",
    value: "Minimum 24 GiB",
    note: "32 GiB recommended for smoother backup and restore operations.",
  },
  {
    label: "Storage",
    value: "At least 70 GiB free",
    note: "Keep extra space for backup files and logs.",
  },
  {
    label: "vCPU",
    value: "3 cores minimum",
    note: "4 cores or more recommended for larger databases.",
  },
  {
    label: "Database",
    value: "MySQL / PostgreSQL / SQLite",
    note: "Supported backup format depends on your backend implementation.",
  },
];

const activityStats = [
  { label: "Last Backup", value: "Today, 23:00" },
  { label: "Backup Size", value: "80.4 Gib" },
  { label: "Average Time", value: "17 sec" },
  { label: "Success Rate", value: "99.8%" },
];

const formatDateTime = () => {
  const now = new Date();
  return now.toLocaleDateString() + " " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function DatabaseBackup() {
  const [backups, setBackups] = useState(initialBackups);
  const [autoBackup, setAutoBackup] = useState(true);
  const [frequency, setFrequency] = useState("daily");
  const [retention, setRetention] = useState("30");
  const [includeMedia, setIncludeMedia] = useState(true);
  const [compressBackup, setCompressBackup] = useState(true);
  const [encryptBackup, setEncryptBackup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [restoreMode, setRestoreMode] = useState("safe");

  const summary = useMemo(() => {
    const total = backups.length;
    const completed = backups.filter((b) => b.status === "Completed").length;
    const totalSize = backups.reduce((acc, b) => acc + Number(String(b.size).replace(/[^\d.]/g, "")), 0);
    return {
      total,
      completed,
      totalSize: `${totalSize.toFixed(1)} Gib`,
    };
  }, [backups]);

  const handleCreateBackup = async () => {
    setLoading(true);

    setTimeout(() => {
      const ts = new Date();
      const fileName = `backup_${ts.toISOString().slice(0, 10).replace(/-/g, "_")}_${String(
        ts.getHours()
      ).padStart(2, "0")}_${String(ts.getMinutes()).padStart(2, "0")}.sql`;

      const newBackup = {
        id: Date.now(),
        file: fileName,
        size: "2.5 Gib",
        date: formatDateTime(),
        status: "Completed",
        duration: "14 sec",
        type: compressBackup ? "Compressed Full" : "Full",
      };

      setBackups((prev) => [newBackup, ...prev]);
      setLoading(false);
    }, 1200);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this backup file?")) return;
    setBackups((prev) => prev.filter((b) => b.id !== id));
  };

  const handleRestore = (file) => {
    alert(`Restore requested for ${file} using "${restoreMode}" mode.`);
  };

  const handleDownload = (file) => {
    alert(`Downloading ${file}...`);
  };

  return (
    <div className="db-page">
      <div className="db-card">
        <div className="db-header">
          <div>
            <h2>Database Backup</h2>
            <p>Manage automatic backups, restore points, and system readiness.</p>
          </div>

          <div className="db-header-badges">
            <span className="db-badge db-badge-good">
              <FiShield /> Protected
            </span>
            <span className="db-badge db-badge-soft">
              <FiServer /> Ready
            </span>
          </div>
        </div>

        <div className="db-top-grid">
          <div className="db-summary-card">
            <div className="db-summary-icon">
              <FiHardDrive />
            </div>
            <div>
              <div className="db-summary-label">Total Backups</div>
              <div className="db-summary-value">{summary.total}</div>
            </div>
          </div>

          <div className="db-summary-card">
            <div className="db-summary-icon">
              <FiLayers />
            </div>
            <div>
              <div className="db-summary-label">Completed</div>
              <div className="db-summary-value">{summary.completed}</div>
            </div>
          </div>

          <div className="db-summary-card">
            <div className="db-summary-icon">
              <FiClock />
            </div>
            <div>
              <div className="db-summary-label">Latest Backup Time</div>
              <div className="db-summary-value">23:00</div>
            </div>
          </div>

          <div className="db-summary-card">
            <div className="db-summary-icon">
              <FiCpu />
            </div>
            <div>
              <div className="db-summary-label">Total Backup Size</div>
              <div className="db-summary-value">{summary.totalSize}</div>
            </div>
          </div>
        </div>

        <div className="db-actions">
          <button className="db-btn db-btn-primary" onClick={handleCreateBackup} disabled={loading}>
            <FiDownload /> {loading ? "Creating Backup..." : "Create Backup Now"}
          </button>

          <button className="db-btn db-btn-secondary" onClick={() => handleRestore("latest")}>
            <FiUpload /> Restore Latest
          </button>

          <button className="db-btn db-btn-ghost" onClick={() => window.print()}>
            <FiRefreshCw /> Print Page
          </button>
        </div>

        <div className="db-config-grid">
          <div className="db-panel">
            <h3>Backup Policy</h3>

            <label className="db-switch-row">
              <span>Enable Auto Backup</span>
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={() => setAutoBackup((v) => !v)}
              />
            </label>

            <label className="db-field">
              <span>Backup Frequency</span>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>

            <label className="db-field">
              <span>Retention Period</span>
              <select value={retention} onChange={(e) => setRetention(e.target.value)}>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
              </select>
            </label>

            <label className="db-switch-row">
              <span>Include Media Files</span>
              <input
                type="checkbox"
                checked={includeMedia}
                onChange={() => setIncludeMedia((v) => !v)}
              />
            </label>

            <label className="db-switch-row">
              <span>Compress Backup</span>
              <input
                type="checkbox"
                checked={compressBackup}
                onChange={() => setCompressBackup((v) => !v)}
              />
            </label>

            <label className="db-switch-row">
              <span>Encrypt Backup</span>
              <input
                type="checkbox"
                checked={encryptBackup}
                onChange={() => setEncryptBackup((v) => !v)}
              />
            </label>

            <label className="db-field">
              <span>Restore Mode</span>
              <select value={restoreMode} onChange={(e) => setRestoreMode(e.target.value)}>
                <option value="safe">Safe Restore</option>
                <option value="force">Force Restore</option>
                <option value="dry-run">Dry Run</option>
              </select>
            </label>
          </div>

          <div className="db-panel">
            <h3>Performance & Health</h3>

            <div className="db-stats-grid">
              {activityStats.map((item) => (
                <div key={item.label} className="db-stat-card">
                  <div className="db-stat-label">{item.label}</div>
                  <div className="db-stat-value">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="db-health-box">
              <div className="db-health-title">Backup Health</div>
              <p>
                Backup process is stable. Recommended to keep at least one daily backup and
                verify restores weekly.
              </p>
            </div>

            <div className="db-health-box">
              <div className="db-health-title">Maintenance Notes</div>
              <ul>
                <li>Store backups off-site for safety.</li>
                <li>Use encryption for sensitive company data.</li>
                <li>Verify backup restore before major updates.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="db-req-section">
          <div className="db-section-title">
            <h3>Minimum System Requirements</h3>
            <p>These help keep backups fast and reliable.</p>
          </div>

          <div className="db-req-grid">
            {requirements.map((item) => (
              <div key={item.label} className="db-req-card">
                <div className="db-req-label">{item.label}</div>
                <div className="db-req-value">{item.value}</div>
                <div className="db-req-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="db-history-section">
          <div className="db-section-title">
            <h3>Backup History</h3>
            <p>Download, restore, or delete a backup file from here.</p>
          </div>

          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {backups.map((b) => (
                  <tr key={b.id}>
                    <td>{b.file}</td>
                    <td>{b.type}</td>
                    <td>{b.size}</td>
                    <td>{b.date}</td>
                    <td>{b.duration}</td>
                    <td>
                      <span className="db-status db-status-ok">{b.status}</span>
                    </td>
                    <td>
                      <button className="db-icon-btn" title="Download" onClick={() => handleDownload(b.file)}>
                        <FiDownload />
                      </button>
                      <button className="db-icon-btn" title="Restore" onClick={() => handleRestore(b.file)}>
                        <FiRefreshCw />
                      </button>
                      <button className="db-icon-btn" title="Delete" onClick={() => handleDelete(b.id)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

