export interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
  notes?: string;
}

export const CALENDAR: CalEvent[] = [
  { id: "c-1", title: "Ops sync with Priya", start: "2026-09-03T09:30:00-07:00", end: "2026-09-03T10:00:00-07:00", attendees: ["Priya Raman"] },
  { id: "c-2", title: "Bergstrom options review", start: "2026-09-03T14:00:00-07:00", end: "2026-09-03T15:00:00-07:00", attendees: ["Tomasz Nowak", "Marcus Oyelaran"], notes: "Bring the Verdant sample timing and the air freight quote." },
  { id: "c-3", title: "Fall campaign go/no-go", start: "2026-09-08T11:00:00-07:00", end: "2026-09-08T11:30:00-07:00", attendees: ["Lena Fischer", "June Castellanos"] },
  { id: "c-4", title: "Board deck draft due", start: "2026-09-10T17:00:00-07:00", end: "2026-09-10T17:00:00-07:00", attendees: ["Marcus Oyelaran"] },
  { id: "c-5", title: "Leadership meeting", start: "2026-09-16T10:00:00-07:00", end: "2026-09-16T11:00:00-07:00", attendees: ["Priya Raman", "Marcus Oyelaran", "Dana Whitfield", "Tomasz Nowak", "Lena Fischer", "Sam Okafor", "June Castellanos"] },
  { id: "c-6", title: "Board meeting", start: "2026-09-18T13:00:00-07:00", end: "2026-09-18T16:00:00-07:00", attendees: ["Marcus Oyelaran", "Priya Raman"] },
];
