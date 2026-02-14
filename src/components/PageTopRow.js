export default function PageTopRow({ items, right }) {
  const trail = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!right && trail.length === 0) return null;

  return (
    <div className={`page-top-row${trail.length === 0 ? ' page-top-row--solo' : ''}`}>
      {trail.length > 0 ? (
        <nav className="page-crumb-mini" aria-label="Page location">
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            const label = item?.label || '';
            const href = item?.href || '#';
            return (
              <span key={`${href}-${label}-${index}`} className="page-crumb-mini__part">
                {index > 0 ? <span className="page-crumb-mini__sep" aria-hidden="true">›</span> : null}
                {isLast ? (
                  <span className="page-crumb-mini__current" title={label}>{label}</span>
                ) : (
                  <a className="page-crumb-mini__link" href={href} title={label}>
                    {label}
                  </a>
                )}
              </span>
            );
          })}
        </nav>
      ) : null}
      <div className="page-top-row-right">{right}</div>
    </div>
  );
}
