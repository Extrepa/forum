export default function ShowHiddenToggleButton({ showHidden, searchParams }) {
  const preservedEntries = Object.entries(searchParams || {}).filter(([key]) => key !== 'showHidden');
  const hiddenInputs = [];

  preservedEntries.forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        if (entry !== undefined) {
          hiddenInputs.push(
            <input key={`${key}-${index}`} type="hidden" name={key} value={String(entry)} />
          );
        }
      });
      return;
    }
    if (value !== undefined) {
      hiddenInputs.push(
        <input key={key} type="hidden" name={key} value={String(value)} />
      );
    }
  });

  return (
    <form method="get">
      {hiddenInputs}
      {showHidden ? null : <input type="hidden" name="showHidden" value="1" />}
      <button type="submit">{showHidden ? 'Hide hidden' : 'Show hidden'}</button>
    </form>
  );
}
