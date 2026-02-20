const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatUsageDuration(value) {
  const raw = (value || '').trim();
  if (!raw) return '';

  if (!DATE_PATTERN.test(raw)) return raw;

  const firstUse = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(firstUse.getTime())) return raw;

  const now = new Date();
  let totalMonths =
    (now.getFullYear() - firstUse.getFullYear()) * 12 +
    (now.getMonth() - firstUse.getMonth());

  if (now.getDate() < firstUse.getDate()) {
    totalMonths -= 1;
  }

  if (totalMonths <= 0) return 'Menos de 1 mes';

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];

  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'a\u00f1o' : 'a\u00f1os'}`);
  }

  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  }

  return parts.join(' y ');
}

export function isIsoDate(value) {
  return DATE_PATTERN.test((value || '').trim());
}
