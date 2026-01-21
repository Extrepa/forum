function digitsOnly(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

// Very small E.164-ish normalization (no external deps).
// - Accepts "+15551234567"
// - Accepts "5551234567" (assumes US -> +1)
// - Accepts "15551234567" (assumes leading 1 -> +1)
// - Accepts "441234567890" -> +441234567890
export function normalizePhone(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;

  if (raw.startsWith('+')) {
    const digits = digitsOnly(raw);
    if (!digits) return null;
    if (digits.length < 10 || digits.length > 15) return null;
    return `+${digits}`;
  }

  const digits = digitsOnly(raw);
  if (!digits) return null;
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

