import Breadcrumbs from './Breadcrumbs';

export default function PageTopRow({ items, right }) {
  return (
    <div className="page-top-row">
      <Breadcrumbs items={items} />
      <div className="page-top-row-right">{right}</div>
    </div>
  );
}

