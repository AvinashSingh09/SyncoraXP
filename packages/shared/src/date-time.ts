const TIME_ZONE_CITY_LABELS: Record<string, string> = {
  "Asia/Calcutta": "Chennai, Kolkata, Mumbai, New Delhi",
  "Asia/Kolkata": "Chennai, Kolkata, Mumbai, New Delhi",
  "Asia/Colombo": "Sri Jayawardenepura",
};

export function formatTimeZoneOption(timeZone: string, date = new Date()) {
  const offsetName = new Intl.DateTimeFormat("en", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value;
  const match = /^GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?$/.exec(offsetName ?? "");
  if (!match) throw new Error(`Could not determine the UTC offset for ${timeZone}`);

  const direction = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const offsetMinutes = direction * (hours * 60 + minutes);
  const offset = `${direction < 0 ? "-" : "+"}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const city =
    TIME_ZONE_CITY_LABELS[timeZone] ??
    timeZone.split("/").slice(1).join(", ").replaceAll("_", " ");

  return {
    label: `(UTC${offset}) ${city}`,
    offsetMinutes,
    value: timeZone,
  };
}

export function zonedDateTimeToIso(value: string, timeZone: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Choose a valid date and time");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  let instant = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(instant))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const represented = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    instant -= represented - target;
  }

  return new Date(instant).toISOString();
}
