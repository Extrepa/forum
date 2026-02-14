export default function PageTopRow({ items, right }) {
  const trail = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!right && trail.length === 0) return null;
  const compactTrail = trail.slice(-2);
  const sectionItem = compactTrail[0] || null;
  const currentItem = compactTrail[1] || compactTrail[0] || null;
  const showPath = Boolean(sectionItem && currentItem);
  const sameItem = sectionItem?.label === currentItem?.label;

  return (
    <div className={`page-top-row${trail.length === 0 ? ' page-top-row--solo' : ' page-top-row--context'}`}>
      {showPath ? (
        <div className="page-top-row-context" aria-label="Page location">
          {!sameItem ? (
            <>
              <a
                className="page-top-row-context__section"
                href={sectionItem.href || '#'}
                title={sectionItem.label || ''}
              >
                {sectionItem.label || ''}
              </a>
              <span className="page-top-row-context__sep" aria-hidden="true">›</span>
            </>
          ) : null}
          <span className="page-top-row-context__current" title={currentItem?.label || ''}>
            {currentItem?.label || ''}
          </span>
        </div>
      ) : null}
      <div className="page-top-row-right">{right}</div>
    </div>
  );
}
