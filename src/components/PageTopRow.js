export default function PageTopRow({ items, right }) {
  void items;
  if (!right) return null;

  return (
    <div className="page-top-row page-top-row--solo">
      <div className="page-top-row-right">{right}</div>
    </div>
  );
}
