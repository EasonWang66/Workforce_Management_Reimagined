const availabilityProfile = {
  employee: {
    name: "Swapnil Ramesh Rajane",
    role: "Senior SAP Resolver",
    team: "SAP - ERP Support",
    location: "Dubai, UAE",
    manager: "Nadia Hassan",
    timezone: "Asia/Dubai",
    email: "swapnil.rajane@example.com"
  },
  remainingToday: "3h 20m",
  eligibility: "Available",
  layers: {
    shift: {
      presets: ["dubai-core"],
      preset: "Asia/Dubai Core",
      start: "09:00",
      end: "17:00",
      notes: "Manager-controlled coverage window"
    },
    holidayCalendar: {
      name: "Ittihad UAE Holiday Calendar",
      company: "Ittihad International Investment",
      region: "UAE",
      holidays: [
        { date: "2026-01-01", label: "New Year" },
        { date: "2026-03-20", label: "Eid Al Fitr" },
        { date: "2026-03-21", label: "Eid Al Fitr" },
        { date: "2026-05-27", label: "Arafat Day" },
        { date: "2026-05-28", label: "Eid Al Adha" },
        { date: "2026-06-16", label: "Islamic New Year" },
        { date: "2026-08-25", label: "Prophet's Birthday" },
        { date: "2026-12-02", label: "UAE National Day" },
        { date: "2026-12-03", label: "UAE National Day" }
      ]
    },
    pto: [
      { id: "pto-1", type: "Vacation", startDate: "2026-07-24", endDate: "2026-07-24", note: "Family commitment", status: "Approved" }
    ],
    adHocUnavailable: [
      { id: "block-1", date: "2026-07-22", start: "13:00", end: "15:00", reason: "Ticket review" }
    ]
  },
  days: [
    { date: "2026-07-20", label: "Mon", status: "Available", note: "9:00 AM - 5:00 PM", source: "shift" },
    { date: "2026-07-21", label: "Tue", status: "Available", note: "9:00 AM - 5:00 PM", source: "shift" },
    { date: "2026-07-22", label: "Wed", status: "Busy", note: "1:00 PM - 3:00 PM ticket review", source: "ad hoc" },
    { date: "2026-07-23", label: "Thu", status: "Available", note: "9:00 AM - 5:00 PM", source: "shift" },
    { date: "2026-07-24", label: "Fri", status: "PTO", note: "Unavailable", source: "pto" }
  ],
  events: [
    { id: "event-1", date: "2026-07-22", start: "10:00", end: "10:30", type: "Check-in", title: "Manager check-in", note: "Weekly resolver check-in" },
    { id: "event-2", date: "2026-07-22", start: "13:00", end: "15:00", type: "Ticket Review", title: "Production incident review", note: "Review open production issues" }
  ],
  rules: {
    shift: "Resolver is eligible only inside assigned shift coverage unless manager chooses fallback handling.",
    holiday: "Company/country holidays remove normal availability without employee maintenance.",
    vacation: "Planned absence filters resolver out for affected windows.",
    adhoc: "Short blocks reduce ranking or eligibility for that period."
  },
  exceptions: [
    { id: "availability-reviewed", time: "Now", title: "Availability reviewed", body: "Calendar checked before assignment recommendation is accepted.", status: "open" },
    { id: "resolve-conflicts", time: "Next", title: "Resolve conflicts", body: "Update busy/PTO windows or assign a peer fallback when the selected resolver is unavailable.", status: "open" }
  ]
};

export default function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method === "GET") {
    response.status(200).json(availabilityProfile);
    return;
  }

  if (request.method === "POST") {
    const body = request.body || {};
    const errors = validateAvailability(body);

    if (errors.length) {
      response.status(400).json({ ok: false, errors });
      return;
    }

    response.status(200).json({
      ok: true,
      savedAt: new Date().toISOString(),
      profile: body
    });
    return;
  }

  response.setHeader("Allow", "GET,POST,OPTIONS");
  response.status(405).json({ ok: false, error: "Method not allowed" });
}

function validateAvailability(profile) {
  const errors = [];

  if (!profile.employee?.name) errors.push("Employee name is required.");
  if (!profile.employee?.timezone) errors.push("Employee timezone is required.");
  if (!Array.isArray(profile.days)) errors.push("Days must be an array.");
  if (!Array.isArray(profile.events)) errors.push("Events must be an array.");
  if (!profile.layers?.shift?.start || !profile.layers?.shift?.end) {
    errors.push("Shift start and end times are required.");
  }

  return errors;
}
