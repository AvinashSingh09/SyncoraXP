import assert from "node:assert/strict";
import test from "node:test";
import {
  CreateMeetingInputSchema,
  formatTimeZoneOption,
  zonedDateTimeToIso,
} from "@voice/shared";

test("formats time zones as offset and city labels", () => {
  assert.deepEqual(
    formatTimeZoneOption("Asia/Kolkata", new Date("2026-07-31T00:00:00.000Z")),
    {
      label: "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi",
      offsetMinutes: 330,
      value: "Asia/Kolkata",
    },
  );
  assert.equal(
    formatTimeZoneOption("America/New_York", new Date("2026-07-31T00:00:00.000Z")).label,
    "(UTC-04:00) New York",
  );
});

test("converts a scheduled wall time from its selected time zone", () => {
  assert.equal(
    zonedDateTimeToIso("2026-07-20T10:00", "Asia/Kolkata"),
    "2026-07-20T04:30:00.000Z",
  );
  assert.equal(
    zonedDateTimeToIso("2026-07-20T10:00", "UTC"),
    "2026-07-20T10:00:00.000Z",
  );
});

test("keeps safe meeting defaults for existing creation clients", () => {
  const parsed = CreateMeetingInputSchema.parse({
    title: "Instant team meeting",
    scheduledFor: null,
  });

  assert.equal(parsed.timeZone, "UTC");
  assert.deepEqual(parsed.settings, {
    waitingRoomEnabled: true,
    allowGuestCamera: true,
    allowGuestMicrophone: true,
    allowGuestScreenShare: false,
    transcriptionEnabled: false,
    subtitlesEnabled: false,
    interpretationEnabled: false,
    interpretationProvider: "gemini",
    interpretationLanguages: ["hi", "bn", "mr", "ta", "te"],
  });
});
