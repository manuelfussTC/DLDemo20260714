export const dueStatuses = [
  "missing",
  "valid",
  "overdue",
  "invalid",
  "ambiguous",
] as const;

export type DueStatus = (typeof dueStatuses)[number];

export type NormalizedDeadline = {
  dueAt: string;
  dueStatus: DueStatus;
  dueWarning: string;
};

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

const timeZone = "Europe/Berlin";
const monthNames: Record<string, number> = {
  januar: 1,
  februar: 2,
  märz: 3,
  maerz: 3,
  april: 4,
  mai: 5,
  juni: 6,
  juli: 7,
  august: 8,
  september: 9,
  oktober: 10,
  november: 11,
  dezember: 12,
};
const weekdayNames: Record<string, number> = {
  sonntag: 0,
  montag: 1,
  dienstag: 2,
  mittwoch: 3,
  donnerstag: 4,
  freitag: 5,
  samstag: 6,
  sonnabend: 6,
};

function localParts(value: Date): CalendarDate & {
  hour: number;
  minute: number;
  second: number;
} {
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function toZonedDate(
  date: CalendarDate,
  hour: number,
  minute: number,
  second: number,
): Date {
  const intendedUtc = Date.UTC(date.year, date.month - 1, date.day, hour, minute, second);
  let candidate = new Date(intendedUtc);

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const actual = localParts(candidate);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    candidate = new Date(candidate.getTime() + intendedUtc - actualAsUtc);
  }

  return candidate;
}

function addDays(date: CalendarDate, amount: number): CalendarDate {
  const result = new Date(Date.UTC(date.year, date.month - 1, date.day + amount));

  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
}

function isValidCalendarDate(date: CalendarDate): boolean {
  const candidate = new Date(Date.UTC(date.year, date.month - 1, date.day));

  return (
    candidate.getUTCFullYear() === date.year &&
    candidate.getUTCMonth() + 1 === date.month &&
    candidate.getUTCDate() === date.day
  );
}

function calendarWeekday(date: CalendarDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

function detectedDateExpressions(value: string): string[] {
  const withoutExtendedOvermorgen = value.replace(
    /\b(?:den\s+)?tag\s+nach\s+übermorgen\b/giu,
    "",
  );
  const expressions = [
    ...value.matchAll(/\b(?:den\s+)?tag\s+nach\s+übermorgen\b/giu),
    ...withoutExtendedOvermorgen.matchAll(
      /\b(?:vorgestern|gestern|heute|morgen|übermorgen)\b/giu,
    ),
    ...value.matchAll(/\b\d{1,2}\.\s*\d{1,2}\.(?:\s*\d{2,4}\b)?/gu),
    ...value.matchAll(
      /\b\d{1,2}\.?\s+(?:januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)(?:\s+\d{4})?\b/giu,
    ),
  ].map((match) => match[0].toLocaleLowerCase("de-DE"));

  return [...new Set(expressions)];
}

function parseTime(value: string): { hour: number; minute: number; explicit: boolean } {
  const match = value.match(/\b(?:um\s+)?(\d{1,2})(?::(\d{2}))?\s*uhr\b/iu);

  if (!match) {
    return { hour: 23, minute: 59, explicit: false };
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2] ?? 0),
    explicit: true,
  };
}

function invalid(warning: string): NormalizedDeadline {
  return { dueAt: "", dueStatus: "invalid", dueWarning: warning };
}

export function normalizeDeadline(
  dueText: string,
  referenceDate = new Date(),
): NormalizedDeadline {
  const value = dueText.trim();

  if (!value) {
    return { dueAt: "", dueStatus: "missing", dueWarning: "" };
  }

  const expressions = detectedDateExpressions(value);

  if (expressions.length > 1) {
    return {
      dueAt: "",
      dueStatus: "ambiguous",
      dueWarning: "Die Frist enthält widersprüchliche Zeitangaben.",
    };
  }

  const reference = localParts(referenceDate);
  const currentDate: CalendarDate = {
    year: reference.year,
    month: reference.month,
    day: reference.day,
  };
  let date: CalendarDate | undefined;

  const numericDate = value.match(
    /\b(\d{1,2})\.\s*(\d{1,2})\.(?:\s*(\d{2,4})\b)?/u,
  );
  const namedDate = value.match(
    /\b(\d{1,2})\.?\s+(januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)(?:\s+(\d{4}))?\b/iu,
  );

  if (numericDate) {
    const suppliedYear = numericDate[3] ? Number(numericDate[3]) : reference.year;
    date = {
      year: suppliedYear < 100 ? 2000 + suppliedYear : suppliedYear,
      month: Number(numericDate[2]),
      day: Number(numericDate[1]),
    };
  } else if (namedDate) {
    date = {
      year: namedDate[3] ? Number(namedDate[3]) : reference.year,
      month: monthNames[namedDate[2].toLocaleLowerCase("de-DE")],
      day: Number(namedDate[1]),
    };
  } else if (/\b(?:den\s+)?tag\s+nach\s+übermorgen\b/iu.test(value)) {
    date = addDays(currentDate, 3);
  } else if (/\bübermorgen\b/iu.test(value)) {
    date = addDays(currentDate, 2);
  } else if (/\bvorgestern\b/iu.test(value)) {
    date = addDays(currentDate, -2);
  } else if (/\bgestern\b/iu.test(value)) {
    date = addDays(currentDate, -1);
  } else if (/\bheute\b/iu.test(value)) {
    date = currentDate;
  } else if (/\bmorgen\b/iu.test(value)) {
    date = addDays(currentDate, 1);
  } else {
    const weekday = Object.entries(weekdayNames).find(([name]) =>
      new RegExp(`\\b${name}\\b`, "iu").test(value),
    );

    if (weekday) {
      const currentWeekday = calendarWeekday(currentDate);
      const delta = (weekday[1] - currentWeekday + 7) % 7 || 7;
      date = addDays(currentDate, delta);
    }
  }

  if (!date) {
    return {
      dueAt: "",
      dueStatus: "ambiguous",
      dueWarning: "Die Frist konnte nicht eindeutig als Datum aufgelöst werden.",
    };
  }

  if (!isValidCalendarDate(date)) {
    return invalid("Die Frist enthält kein gültiges Kalenderdatum.");
  }

  const statedWeekday = Object.entries(weekdayNames).find(([name]) =>
    new RegExp(`\\b${name}\\b`, "iu").test(value),
  );

  if (statedWeekday && calendarWeekday(date) !== statedWeekday[1]) {
    return invalid("Wochentag und Kalenderdatum widersprechen sich.");
  }

  const time = parseTime(value);

  if (time.hour > 23 || time.minute > 59) {
    return invalid("Die Frist enthält keine gültige Uhrzeit.");
  }

  const dueDate = toZonedDate(date, time.hour, time.minute, time.explicit ? 0 : 59);
  const overdue = dueDate.getTime() < referenceDate.getTime();

  return {
    dueAt: dueDate.toISOString(),
    dueStatus: overdue ? "overdue" : "valid",
    dueWarning: overdue ? "Diese Frist ist bereits verstrichen." : "",
  };
}
