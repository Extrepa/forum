export default function AdminStatCard({ label, value, helper }) {
  const numeric = Number(value) || 0;
  let level = 'zero';
  if (numeric >= 1000) level = 'mega';
  else if (numeric >= 100) level = 'high';
  else if (numeric >= 25) level = 'mid';
  else if (numeric >= 1) level = 'low';

  return (
    <div className={`admin-stat-card admin-stat-card--${level}`}>
      <div className={`admin-stat-value admin-stat-value--${level}`}>{value}</div>
      <div className="admin-stat-label">{label}</div>
      {helper ? <div className="admin-stat-helper">{helper}</div> : null}
    </div>
  );
}
