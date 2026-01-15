export default function PostForm({
  action,
  titleLabel,
  bodyLabel,
  buttonLabel,
  showDate = false,
  titleRequired = true,
  bodyRequired = true
}) {
  return (
    <form action={action} method="post">
      <label>
        <div className="muted">{titleLabel}</div>
        <input name="title" placeholder="Title" required={titleRequired} />
      </label>
      {showDate ? (
        <label>
          <div className="muted">Date and time</div>
          <input name="starts_at" type="datetime-local" required />
        </label>
      ) : null}
      <label>
        <div className="muted">{bodyLabel}</div>
        <textarea name="body" placeholder="Share the details..." required={bodyRequired} />
      </label>
      <button type="submit">{buttonLabel}</button>
    </form>
  );
}
