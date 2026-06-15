/**
 * Court time-slot generator.
 * Produces available slots for a given date from courtAvailabilityRules.
 */

export type TimeSlot = {
  courtId: string;
  courtName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
};

export type AvailabilityRule = {
  courtId: string;
  dayOfWeek: number | null; // 0=Sun … 6=Sat, null = date-specific
  specificDate: string | null; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  isAvailable: boolean;
};

/** Parse "HH:MM" or "HH:MM:SS" into total minutes */
function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Generate time slots for a single court on a single date. */
function slotsForCourt(
  court: { id: string; name: string },
  date: string,
  rules: AvailabilityRule[],
  matchDurationMinutes: number
): TimeSlot[] {
  const dow = new Date(date + "T12:00:00").getDay(); // 0=Sun
  const courtRules = rules.filter((r) => r.courtId === court.id);

  // Specific-date unavailability wins over everything
  if (courtRules.some((r) => r.specificDate === date && !r.isAvailable)) return [];

  // Prefer specific-date availability, fall back to day-of-week
  const rule =
    courtRules.find((r) => r.specificDate === date && r.isAvailable) ??
    courtRules.find((r) => r.dayOfWeek === dow && r.specificDate === null && r.isAvailable);

  if (!rule) return [];

  const windowStart = toMinutes(rule.startTime);
  const windowEnd = toMinutes(rule.endTime);
  const slots: TimeSlot[] = [];

  let cursor = windowStart;
  while (cursor + matchDurationMinutes <= windowEnd) {
    slots.push({
      courtId: court.id,
      courtName: court.name,
      date,
      startTime: fromMinutes(cursor),
      endTime: fromMinutes(cursor + matchDurationMinutes),
    });
    cursor += matchDurationMinutes;
  }
  return slots;
}

/** Generate all slots for all courts on a given date. */
export function generateSlotsForDate(
  date: string,
  courts: { id: string; name: string }[],
  rules: AvailabilityRule[],
  matchDurationMinutes: number
): TimeSlot[] {
  return courts.flatMap((court) =>
    slotsForCourt(court, date, rules, matchDurationMinutes)
  );
}

/** Generate slots across a range of dates. */
export function generateSlotsForDateRange(
  startDate: string,
  endDate: string,
  courts: { id: string; name: string }[],
  rules: AvailabilityRule[],
  matchDurationMinutes: number,
  allowedDaysOfWeek?: number[] // 0=Sun … 6=Sat; undefined = all days
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const cursor = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");

  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (!allowedDaysOfWeek || allowedDaysOfWeek.includes(cursor.getDay())) {
      slots.push(
        ...generateSlotsForDate(dateStr, courts, rules, matchDurationMinutes)
      );
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

/** Convert day name to JS getDay() value (0=Sun). */
export function dayNameToNumber(day: string): number {
  const map: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  return map[day.toLowerCase()] ?? -1;
}

/** Add weeks to a date string. */
export function addWeeks(date: string, weeks: number): string {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}
