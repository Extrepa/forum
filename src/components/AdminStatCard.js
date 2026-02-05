export default function AdminStatCard({ label, value, helper }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-label">{label}</div>
      {helper ? <div className="admin-stat-helper">{helper}</div> : null}
    </div>
  );
}
