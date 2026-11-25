/**
 * Ethiopian (Ge'ez) Calendar utilities.
 * Handles bidirectional conversions between Gregorian (ISO YYYY-MM-DD / ISO timestamps)
 * and Ethiopian dates with 100% mathematical accuracy.
 */

export const ETHIOPIAN_MONTHS = [
  'መስከረም', // 1
  'ጥቅምት',   // 2
  'ኅዳር',    // 3
  'ታኅሣሥ',   // 4
  'ጥር',      // 5
  'የካቲት',   // 6
  'መጋቢት',   // 7
  'ሚያዝያ',   // 8
  'ግንቦት',   // 9
  'ሰኔ',      // 10
  'ሐምሌ',    // 11
  'ነሐሴ',    // 12
  'ጳጉሜ',    // 13
] as const;

export const ETHIOPIAN_WEEKDAYS = [
  'እሑድ',
  'ሰኞ',
  'ማክሰኞ',
  'ረቡዕ',
  'ሐሙስ',
  'ዓርብ',
  'ቅዳሜ',
] as const;

export interface EthiopicDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  weekdayName?: string;
}

/**
 * Extracts a YYYY-MM-DD string in Africa/Nairobi timezone from any date string or ISO timestamp.
 */
export function toNairobiIsoDate(value: string | Date): string {
  try {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      return value.trim();
    }
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());
    }
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());
  }
}

/**
 * Converts a Gregorian ISO date string (YYYY-MM-DD or timestamp) to an Ethiopian date.
 */
export function gregorianToEthiopic(dateInput: string | Date): EthiopicDate {
  try {
    const isoDate = toNairobiIsoDate(dateInput);
    const d = new Date(isoDate + 'T12:00:00Z');
    if (isNaN(d.getTime())) {
      return getTodayEthiopic();
    }
    const parts = new Intl.DateTimeFormat('en-US-u-ca-ethiopic', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Africa/Nairobi',
    }).formatToParts(d);

    let year = 2017;
    let month = 1;
    let day = 1;

    for (const p of parts) {
      if (p.type === 'year') year = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10);
      if (p.type === 'day') day = parseInt(p.value, 10);
    }

    const monthIndex = Math.max(0, Math.min(12, month - 1));
    const weekdayIndex = d.getUTCDay();
    return {
      year,
      month,
      day,
      monthName: ETHIOPIAN_MONTHS[monthIndex],
      weekdayName: ETHIOPIAN_WEEKDAYS[weekdayIndex],
    };
  } catch {
    return getTodayEthiopic();
  }
}

/**
 * Converts an Ethiopian date (year, month, day) to a Gregorian ISO string (YYYY-MM-DD).
 */
export function ethiopicToGregorian(eYear: number, eMonth: number, eDay: number): string {
  // Ethiopian epoch in Julian Day Number (JDN)
  const jdn = 1724220 + 365 * (eYear - 1) + Math.floor(eYear / 4) + 30 * (eMonth - 1) + eDay;

  // Convert JDN to Gregorian Date (Fliegel-Van Flandern algorithm)
  const l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l3) / 2447);
  const gDay = l3 - Math.floor((2447 * j) / 80);
  const l4 = Math.floor(j / 11);
  const gMonth = j + 2 - 12 * l4;
  const gYear = 100 * (n - 49) + i + l4;

  const pad = (val: number) => String(val).padStart(2, '0');
  return `${gYear}-${pad(gMonth)}-${pad(gDay)}`;
}

/**
 * Returns today's Ethiopian date and corresponding ISO date.
 */
export function getTodayEthiopic(): EthiopicDate & { isoDate: string } {
  const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());
  const eth = gregorianToEthiopic(todayIso);
  return {
    ...eth,
    isoDate: todayIso,
  };
}

/**
 * Formats a Gregorian date or timestamp as an Ethiopian date string (e.g. "16 ኅዳር 2019" or "ረቡዕ፣ 16 ኅዳር 2019 ዓ.ም").
 */
export function formatEthiopicDate(
  dateInput: string | Date,
  options?: { withYearSuffix?: boolean; withWeekday?: boolean }
): string {
  const eth = gregorianToEthiopic(dateInput);
  const prefix = options?.withWeekday && eth.weekdayName ? `${eth.weekdayName}፣ ` : '';
  const suffix = options?.withYearSuffix ? ' ዓ.ም' : '';
  return `${prefix}${eth.day} ${eth.monthName} ${eth.year}${suffix}`;
}

/**
 * Formats a timestamp as Ethiopian Date + Time (Africa/Nairobi), e.g. "16 ኅዳር 2019 · 10:17 AM".
 */
export function formatEthiopicDateTime(
  timestampInput: string | Date,
  options?: { withYearSuffix?: boolean }
): string {
  try {
    const d = typeof timestampInput === 'string' ? new Date(timestampInput) : timestampInput;
    if (isNaN(d.getTime())) return String(timestampInput);
    const datePart = formatEthiopicDate(d, { withYearSuffix: options?.withYearSuffix });
    const timePart = d.toLocaleTimeString('en-US', {
      timeZone: 'Africa/Nairobi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} · ${timePart}`;
  } catch {
    return String(timestampInput);
  }
}

/**
 * Formats just the Nairobi time from a timestamp.
 */
export function formatEthiopicTime(timestampInput: string | Date): string {
  try {
    const d = typeof timestampInput === 'string' ? new Date(timestampInput) : timestampInput;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      timeZone: 'Africa/Nairobi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

/**
 * Returns the maximum days in an Ethiopian month (30 for months 1-12, 5 or 6 for Pagumē).
 */
export function getDaysInEthMonth(year: number, month: number): number {
  if (month < 13) return 30;
  // Ethiopian leap year occurs when year % 4 === 3
  return year % 4 === 3 ? 6 : 5;
}

/**
 * Checks if two Gregorian dates fall within the same Ethiopian month.
 */
export function isSameEthMonth(dateStrA: string, dateStrB: string): boolean {
  const a = gregorianToEthiopic(dateStrA);
  const b = gregorianToEthiopic(dateStrB);
  return a.year === b.year && a.month === b.month;
}
