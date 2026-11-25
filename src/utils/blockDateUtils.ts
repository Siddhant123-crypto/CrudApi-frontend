/**
 * Flexible date parser & validator for Admin Block modals.
 * Supports:
 * - DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD MM YYYY (with optional spaces around separators)
 * - DD/MM/YY, DD-MM-YY (2-digit year -> 20YY)
 * - YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
 * - DDMMYYYY (8 digits typed without separators)
 */
export const parseBlockDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const cleaned = dateStr.trim().replace(/\s*([\/\-.])\s*/g, '$1');
  if (!cleaned) return null;

  let d = NaN;
  let m = NaN;
  let y = NaN;

  // Case 1: 8 raw digits DDMMYYYY (e.g. "25112026")
  if (/^\d{8}$/.test(cleaned)) {
    d = parseInt(cleaned.slice(0, 2), 10);
    m = parseInt(cleaned.slice(2, 4), 10) - 1;
    y = parseInt(cleaned.slice(4, 8), 10);
  } else {
    const parts = cleaned.split(/[\/\-\.\s]+/);
    if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) {
      return null;
    }

    if (parts[0].length === 4) {
      // YYYY-MM-DD
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
    } else {
      // DD/MM/YYYY or DD/MM/YY
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      const rawYear = parts[2];
      if (rawYear.length === 2) {
        y = 2000 + parseInt(rawYear, 10);
      } else if (rawYear.length === 4) {
        y = parseInt(rawYear, 10);
      } else {
        return null;
      }
    }
  }

  if (isNaN(d) || isNaN(m) || isNaN(y) || m < 0 || m > 11 || d < 1 || d > 31 || y < 2000 || y > 2100) {
    return null;
  }

  const parsed = new Date(y, m, d, 0, 0, 0, 0);
  // Reject impossible calendar dates like 31/02/2026 that JS Date rolls over
  if (parsed.getFullYear() !== y || parsed.getMonth() !== m || parsed.getDate() !== d) {
    return null;
  }

  return parsed;
};

export const isValidBlockUntilDate = (dateStr: string, now: Date = new Date()): boolean => {
  const targetDate = parseBlockDate(dateStr);
  if (!targetDate) return false;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  // Allow today's date (>= today) as well as any future date
  return targetDate.getTime() >= today.getTime();
};

export const calculateBlockDurationDays = (dateStr: string, now: Date = new Date()): number => {
  const targetDate = parseBlockDate(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  if (!targetDate) return 1;

  const diffMs = targetDate.getTime() - today.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  // If admin selects today's date, block for 1 day (until end of day / 24h)
  return Math.max(1, days);
};
