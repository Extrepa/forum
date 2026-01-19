export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="breadcrumb-item">
            {isLast ? (
              <span className="breadcrumb-current">{item.label}</span>
            ) : (
              <a href={item.href}>{item.label}</a>
            )}
            {!isLast && <span className="breadcrumb-separator">›</span>}
          </span>
        );
      })}
    </nav>
  );
}
