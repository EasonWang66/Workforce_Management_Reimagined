import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Icon } from "./icons";
import "./styles.css";

const weekDates = ["2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24"];
const statusOptions = ["Available", "Busy", "PTO", "Unavailable", "Available later"];

const shiftPresets = [
  { id: "dubai-core", name: "Asia/Dubai Core", start: "09:00", end: "17:00", color: "#2563eb" },
  { id: "india-evening", name: "India Evening", start: "13:00", end: "22:00", color: "#12a26c" },
  { id: "europe-early", name: "Europe Early", start: "07:00", end: "15:00", color: "#f59e0b" },
  { id: "us-east", name: "US East Support", start: "08:00", end: "16:00", color: "#8b5cf6" }
];

const holidayCalendars = {
  "Ittihad UAE Holiday Calendar": {
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
  "Fujifilm Germany Holiday Calendar": {
    company: "Fujifilm",
    region: "Germany",
    holidays: [
      { date: "2026-01-01", label: "New Year" },
      { date: "2026-04-03", label: "Good Friday" },
      { date: "2026-04-06", label: "Easter Monday" },
      { date: "2026-05-01", label: "Labor Day" },
      { date: "2026-05-14", label: "Ascension Day" },
      { date: "2026-05-25", label: "Whit Monday" },
      { date: "2026-10-03", label: "German Unity Day" },
      { date: "2026-12-25", label: "Christmas Day" },
      { date: "2026-12-26", label: "Boxing Day" }
    ]
  },
  "India Support Holiday Calendar": {
    company: "India Support",
    region: "India",
    holidays: [
      { date: "2026-01-26", label: "Republic Day" },
      { date: "2026-03-04", label: "Holi" },
      { date: "2026-03-20", label: "Eid Al Fitr" },
      { date: "2026-08-15", label: "Independence Day" },
      { date: "2026-10-02", label: "Gandhi Jayanti" },
      { date: "2026-11-08", label: "Diwali" },
      { date: "2026-12-25", label: "Christmas Day" }
    ]
  }
};

const defaultRules = {
  shift: "Resolver is eligible only inside assigned shift coverage unless manager chooses fallback handling.",
  holiday: "Company/country holidays remove normal availability without employee maintenance.",
  vacation: "Planned absence filters resolver out for affected windows.",
  adhoc: "Short blocks reduce ranking or eligibility for that period."
};

const fallbackProfile = {
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
      ...holidayCalendars["Ittihad UAE Holiday Calendar"]
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
  rules: defaultRules,
  exceptions: [
    { id: "availability-reviewed", time: "Now", title: "Availability reviewed", body: "Calendar checked before assignment recommendation is accepted.", status: "open" },
    { id: "resolve-conflicts", time: "Next", title: "Resolve conflicts", body: "Update busy/PTO windows or assign a peer fallback when the selected resolver is unavailable.", status: "open" }
  ]
};

function App() {
  const [profile, setProfile] = useState(() => normalizeProfile(loadLocal() || fallbackProfile));
  const [page, setPage] = useState("availability");
  const [calendarView, setCalendarView] = useState("week");
  const [selectedDate, setSelectedDate] = useState("2026-07-20");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/availability")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("API unavailable")))
      .then((data) => {
        if (mounted && !loadLocal()) setProfile(normalizeProfile(data));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const summary = useMemo(() => summarize(profile), [profile]);
  const selectedDay = dayForDate(profile, selectedDate);

  function flash(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  function updateProfile(mutator, message, nextModal = null) {
    const next = structuredClone(profile);
    mutator(next);
    const normalized = normalizeProfile(next);
    setProfile(normalized);
    localStorage.setItem("availability-profile", JSON.stringify(normalized));
    fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized)
    }).catch(() => {});
    setModal(nextModal);
    flash(message);
  }

  function openStatus(date, returnDate = null) {
    setSelectedDate(date);
    setModal({ type: "status", date, returnDate });
  }

  function openDaily(date) {
    setSelectedDate(date);
    setModal({ type: "daily", date });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Icon name="calendar-range" size={21} strokeWidth={1.9} /><i className="brand-signal" /></span><span><strong>Workforce</strong><small>Management</small></span></div>
        <div className="nav-block">
          <div className="nav-label">Workspace</div>
          <button className={`nav-item ${page === "availability" || page === "employee" ? "active" : ""}`} onClick={() => setPage("availability")}><Icon name="calendar-range" className="nav-icon" />Availability Calendar</button>
          <button className={`nav-item ${page === "tickets" ? "active" : ""}`} onClick={() => setPage("tickets")}><Icon name="inbox" className="nav-icon" />Ticket Queue</button>
          <button className={`nav-item ${page === "assignment" ? "active" : ""}`} onClick={() => setPage("assignment")}><Icon name="user-round-check" className="nav-icon" />Resolver Assignment</button>
          <button className={`nav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}><Icon name="layout-dashboard" className="nav-icon" />Dashboard</button>
        </div>
        <div className="sidebar-foot"><span className="presence-dot" /><span><strong>Manager workspace</strong><small>Operations planning</small></span></div>
      </aside>

      <main className="main">
        <WorkspaceHeader page={page} profile={profile} />
        {page === "availability" && (
          <AvailabilityPage
            profile={profile}
            summary={summary}
            selectedDay={selectedDay}
            selectedDate={selectedDate}
            calendarView={calendarView}
            setCalendarView={setCalendarView}
            openDaily={openDaily}
            openStatus={openStatus}
            openEvent={(date, hour, returnDate = null) => setModal({ type: "event", date, hour, returnDate })}
            setModal={setModal}
            onBack={() => setPage("employee")}
          />
        )}
        {page === "employee" && <EmployeeContextPage profile={profile} summary={summary} onOpenCalendar={() => setPage("availability")} />}
        {page === "tickets" && <StaticTicketQueue />}
        {page === "assignment" && <StaticResolverAssignment />}
        {page === "dashboard" && <StaticDashboard />}
      </main>

      {modal === "shift" && <ShiftModal shift={profile.layers.shift} onClose={() => setModal(null)} onSave={(shift) => updateProfile((draft) => { draft.layers.shift = shift; applyShiftToDays(draft); }, "Shift coverage updated")} />}
      {modal === "holiday" && <HolidayModal calendar={profile.layers.holidayCalendar} onClose={() => setModal(null)} onSave={(holidayCalendar) => updateProfile((draft) => { draft.layers.holidayCalendar = holidayCalendar; }, "Holiday calendar selection updated")} />}
      {modal === "pto" && <PtoModal requests={profile.layers.pto} onClose={() => setModal(null)} onSave={(requests) => updateProfile((draft) => { draft.layers.pto = requests; syncPtoToDays(draft); }, "Vacation and PTO updated")} />}
      {modal === "adhoc" && <AdhocModal blocks={profile.layers.adHocUnavailable} onClose={() => setModal(null)} onSave={(blocks) => updateProfile((draft) => { draft.layers.adHocUnavailable = blocks; syncAdhocToDays(draft); }, "Ad hoc unavailable block updated")} />}
      {modal === "rules" && <RulesModal rules={profile.rules} onClose={() => setModal(null)} onSave={(rules) => updateProfile((draft) => { draft.rules = rules; }, "Assignment rules updated")} />}
      {modal?.type === "exception" && <ExceptionModal exceptions={profile.exceptions} initialAction={modal.action} onClose={() => setModal(null)} onSave={(exceptions, message) => updateProfile((draft) => { draft.exceptions = exceptions; }, message)} />}
      {modal?.type === "daily" && <DailyModal profile={profile} date={modal.date} onClose={() => setModal(null)} onStatus={() => openStatus(modal.date, modal.date)} onEvent={(hour) => setModal({ type: "event", date: modal.date, hour, returnDate: modal.date })} />}
      {modal?.type === "status" && <StatusModal day={dayForDate(profile, modal.date)} onClose={() => setModal(modal.returnDate ? { type: "daily", date: modal.returnDate } : null)} onSave={(status, note) => updateProfile((draft) => upsertDayStatus(draft, modal.date, status, note), "Status tag updated", modal.returnDate ? { type: "daily", date: modal.returnDate } : null)} />}
      {modal?.type === "event" && <EventModal date={modal.date} hour={modal.hour} onClose={() => setModal(modal.returnDate ? { type: "daily", date: modal.returnDate } : null)} onSave={(event) => updateProfile((draft) => { draft.events.push({ id: `event-${Date.now()}`, ...event }); }, "Calendar event saved", modal.returnDate ? { type: "daily", date: modal.returnDate } : null)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function AvailabilityPage({ profile, summary, selectedDay, selectedDate, calendarView, setCalendarView, openDaily, openStatus, openEvent, setModal, onBack }) {
  return (
    <div className="content">
      <section className="section page-intro">
        <div className="section-head">
          <div className="employee-identity">
            <span className="employee-avatar">SR</span>
            <div>
              <div className="eyebrow">Employee availability</div>
              <div className="section-title employee-title">{profile.employee.name}</div>
              <div className="section-sub identity-meta"><span>{currentTimeLabel(profile.employee.timezone)}</span><span>{shiftNames(profile.layers.shift)}</span><span>{profile.remainingToday} remaining</span></div>
            </div>
          </div>
          <button className="secondary back-button" onClick={onBack}><Icon name="arrow-left" size={16} />Back to Employee</button>
        </div>
      </section>

      <section className="metric-grid">
        <Metric label="Available Days" value={summary.availableDays} note="This week" tone="green" />
        <Metric label="Busy Blocks" value={summary.busyBlocks} note="Assignment constraints" tone="amber" />
        <Metric label="Unavailable Days" value={summary.unavailableDays} note="PTO or blocked" tone="red" />
        <Metric label="Shift Window" value={profile.remainingToday} note="Remaining today" tone="blue" />
        <Metric label="Eligibility" value={profile.eligibility} note="Recommendation input" tone="navy" />
      </section>

      <section className="section">
        <SectionHead title="Availability Layers" subtitle="Availability is derived from shift assignment, company holiday calendar, vacation/PTO, and short ad hoc unavailable blocks." />
        <div className="section-body coverage-grid">
          <LayerCard kind="shift" title="Preset Shifts" value={shiftNames(profile.layers.shift)} note="Manager-controlled shift coverage" onEdit={() => setModal("shift")} />
          <LayerCard kind="holiday" title="Holiday Calendar" value={profile.layers.holidayCalendar.region} note="Company/country controlled visibility" onEdit={() => setModal("holiday")} />
          <LayerCard kind="pto" title="Vacation / PTO" value={ptoSummary(profile.layers.pto)} note="Employee-entered planned absence" onEdit={() => setModal("pto")} />
          <LayerCard kind="adhoc" title="Ad Hoc Unavailable" value={`${profile.layers.adHocUnavailable.length} block${profile.layers.adHocUnavailable.length === 1 ? "" : "s"}`} note="Short personal or appointment block" onEdit={() => setModal("adhoc")} />
        </div>
      </section>

      <section className="section calendar-section">
        <div className="section-head">
          <div>
            <div className="section-title">{calendarViewTitle(calendarView)}</div>
            <div className="section-sub">Calendar blocks determine whether a resolver can receive new ticket assignments.</div>
            {calendarView === "day" && (
              <div className="calendar-header-meta">
                <button className={`chip status-chip-button ${statusClass(selectedDay.status)}`} onClick={() => openStatus(selectedDate)}>{fullDayName(selectedDay.label)} · {selectedDay.status}</button>
                <span className="chip blue">{selectedDay.note}</span>
                <span className="chip gray">{shiftNames(profile.layers.shift)}</span>
              </div>
            )}
          </div>
          <div className="segmented" aria-label="Calendar view">
            {["day", "week", "month"].map((view) => <button key={view} className={calendarView === view ? "active" : ""} onClick={() => setCalendarView(view)}>{capitalize(view)}</button>)}
          </div>
        </div>
        <div className="section-body">
          {calendarView === "day" && <DayView profile={profile} date={selectedDate} onEvent={(hour) => openEvent(selectedDate, hour)} />}
          {calendarView === "week" && <WeekView profile={profile} openDaily={openDaily} openStatus={openStatus} />}
          {calendarView === "month" && <MonthView profile={profile} openDaily={openDaily} openStatus={openStatus} />}
        </div>
      </section>

      <div className="split">
        <section className="section">
          <div className="section-head">
            <div><div className="section-title">Assignment Rules</div><div className="section-sub">How calendar state affects recommendation ranking.</div></div>
            <button className="secondary action-button" onClick={() => setModal("rules")}><Icon name="sliders" size={16} />Edit Rules</button>
          </div>
          <div className="section-body">
            <table><tbody>
              <tr><td>Shift</td><td>{profile.rules.shift}</td></tr>
              <tr><td>Holiday Calendar</td><td>{profile.rules.holiday}</td></tr>
              <tr><td>Vacation / PTO</td><td>{profile.rules.vacation}</td></tr>
              <tr><td>Ad Hoc Unavailable</td><td>{profile.rules.adhoc}</td></tr>
            </tbody></table>
          </div>
        </section>
        <section className="section">
          <div className="section-head">
            <div><div className="section-title">Exception Queue</div><div className="section-sub">Calendar-driven issues a manager may need to resolve.</div></div>
            <div className="top-actions"><button className="secondary action-button" onClick={() => setModal({ type: "exception", action: "add" })}><Icon name="plus" size={16} />Add Exception</button><button className="secondary action-button" onClick={() => setModal({ type: "exception", action: "resolve" })}><Icon name="check" size={16} />Resolve</button></div>
          </div>
          <div className="section-body timeline"><ExceptionList exceptions={profile.exceptions} /></div>
        </section>
      </div>
    </div>
  );
}

function SectionHead({ title, subtitle }) {
  return <div className="section-head"><div><div className="section-title">{title}</div><div className="section-sub">{subtitle}</div></div></div>;
}

function WorkspaceHeader({ page, profile }) {
  const titles = {
    availability: "Availability Calendar",
    employee: "Employee Profile",
    tickets: "Ticket Queue",
    assignment: "Resolver Assignment",
    dashboard: "Dashboard"
  };
  return (
    <header className="workspace-header">
      <div><span className="workspace-kicker">Workforce</span><h1>{titles[page]}</h1></div>
      <div className="workspace-actions"><span className="tenant-name"><Icon name="building" size={15} />Ittihad International Investment</span><span className="manager-avatar" title={profile.employee.manager}>NH</span></div>
    </header>
  );
}

function Metric({ label, value, note, tone = "neutral" }) {
  return <div className={`metric metric-${tone}`}><div className="metric-label"><span>{label}</span><span className="metric-indicator" /></div><div className="metric-value">{value}</div><div className="metric-note">{note}</div></div>;
}

function LayerCard({ kind, title, value, note, onEdit }) {
  const layerIcons = { shift: "clock", holiday: "calendar-days", pto: "calendar-off", adhoc: "clock-alert" };
  return (
    <article className={`coverage feature-link coverage-${kind}`} role="button" tabIndex="0" onClick={onEdit} onKeyDown={(event) => { if (event.currentTarget === event.target && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onEdit(); } }}>
      <div className="coverage-title"><span><span className="coverage-icon"><Icon name={layerIcons[kind]} size={16} /></span>{title}</span><button className="ghost icon-edit" aria-label={`Edit ${title}`} title={`Edit ${title}`} onClick={(event) => { event.stopPropagation(); onEdit(); }}><Icon name="pencil" size={15} /></button></div>
      <div className="coverage-value">{value}</div>
      <div className="coverage-note">{note}</div>
    </article>
  );
}

function EventTag({ event, showEnd = false, compact = false }) {
  const typeClass = event.type.toLowerCase().replace(/[^a-z]+/g, "-");
  return <span className={`calendar-event event-${typeClass} ${compact ? "compact" : ""}`}><span className="event-time">{timeLabel(event.start)}{showEnd ? ` - ${timeLabel(event.end)}` : ""}</span><span className="event-title">{compact ? event.title : `${event.type} · ${event.title}`}</span></span>;
}

function WeekView({ profile, openDaily, openStatus }) {
  const days = weekDates.map((date) => dayForDate(profile, date));
  return (
    <div className="calendar-grid calendar-wide">
      {days.map((day) => (
        <article className="calendar-day feature-link" key={day.date} tabIndex="0" onClick={() => openDaily(day.date)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openDaily(day.date); }}>
          <div className="day-name"><span className="day-label"><strong>{day.label}</strong><small>{formatDateShort(day.date)}</small></span><button className={`chip status-chip-button ${statusClass(day.status)}`} onClick={(event) => { event.stopPropagation(); openStatus(day.date); }}>{day.status}</button></div>
          <div className={`calendar-block ${statusClass(day.status)}`}>{day.note}</div>
          <div className="day-events">{eventsForDate(profile, day.date).map((event) => <EventTag event={event} key={event.id} />)}</div>
        </article>
      ))}
    </div>
  );
}

function DayView({ profile, date, onEvent }) {
  const events = eventsForDate(profile, date);
  return (
    <div className="day-schedule">
      {calendarHours().map((hour) => (
        <React.Fragment key={hour}>
          <div className="hour-label">{hourLabel(hour)}</div>
          <button className="hour-slot" onClick={() => onEvent(hour)}>
            {events.filter((event) => Number(event.start.slice(0, 2)) === hour).map((event) => <EventTag event={event} showEnd key={event.id} />)}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

function MonthView({ profile, openDaily, openStatus }) {
  const daysByDate = Object.fromEntries(profile.days.map((day) => [day.date, day]));
  const blanks = Array.from({ length: new Date(2026, 6, 1).getDay() });
  return (
    <div className="month-view-grid">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => <div className="month-weekday" key={label}>{label}</div>)}
      {blanks.map((_, index) => <div className="month-view-cell muted-cell" key={`blank-${index}`} />)}
      {Array.from({ length: 31 }, (_, index) => {
        const date = `2026-07-${String(index + 1).padStart(2, "0")}`;
        const day = daysByDate[date];
        return (
          <article className="month-view-cell" key={date} tabIndex="0" onClick={() => openDaily(date)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openDaily(date); }}>
            <div className="day-name"><span>{index + 1}</span>{day && <button className={`chip status-chip-button ${statusClass(day.status)}`} onClick={(event) => { event.stopPropagation(); openStatus(date); }}>{day.status}</button>}</div>
            {eventsForDate(profile, date).map((event) => <EventTag event={event} compact key={event.id} />)}
          </article>
        );
      })}
    </div>
  );
}

function DailyModal({ profile, date, onClose, onStatus, onEvent }) {
  const day = dayForDate(profile, date);
  return (
    <Modal title={`Daily Calendar · ${formatDateLong(date)}`} onClose={onClose} footer={false} wide>
      <div className="calendar-header-meta modal-calendar-meta">
        <button className={`chip status-chip-button ${statusClass(day.status)}`} onClick={onStatus}>{formatDateLong(date)} · {day.status}</button>
        <span className="chip blue">{day.note}</span>
        <span className="chip gray">{shiftNames(profile.layers.shift)}</span>
      </div>
      <DayView profile={profile} date={date} onEvent={onEvent} />
      <div className="rationale">Click a time slot to add a meeting, check-in, training, or other calendar event for this day.</div>
    </Modal>
  );
}

function ShiftModal({ shift, onClose, onSave }) {
  const [selected, setSelected] = useState(shift.presets?.length ? shift.presets : ["dubai-core"]);
  const [start, setStart] = useState(shift.start);
  const [end, setEnd] = useState(shift.end);
  const [showPreview, setShowPreview] = useState(true);

  function togglePreset(preset) {
    const next = selected.includes(preset.id) ? selected.filter((id) => id !== preset.id) : [...selected, preset.id];
    setSelected(next);
    const chosen = shiftPresets.filter((item) => next.includes(item.id));
    if (chosen.length) {
      setStart(chosen[0].start);
      setEnd(chosen[chosen.length - 1].end);
    }
  }

  return (
    <Modal title="Edit Shift Assignment" onClose={onClose} onSave={() => onSave({ ...shift, presets: selected, preset: shiftPresets.filter((item) => selected.includes(item.id)).map((item) => item.name).join(" + ") || "Custom", start, end })}>
      <ReadOnlyEmployee />
      <div className="field"><label>Company preset shifts</label><div className="shift-selector">{shiftPresets.map((preset) => <label className="shift-option" key={preset.id}><span className="shift-dot" style={{ background: preset.color }} /><span><input type="checkbox" checked={selected.includes(preset.id)} onChange={() => togglePreset(preset)} /> <strong>{preset.name}</strong><br /><span className="queue-meta">{timeLabel(preset.start)} - {timeLabel(preset.end)}</span></span></label>)}</div></div>
      <label>Preview selected shifts<select value={showPreview ? "show" : "hide"} onChange={(event) => setShowPreview(event.target.value === "show")}><option value="show">Show timesheet preview</option><option value="hide">Hide timesheet preview</option></select></label>
      <div className="date-range-grid"><label>Coverage start time<input type="time" value={start} onChange={(event) => setStart(event.target.value)} /></label><label>Coverage end time<input type="time" value={end} onChange={(event) => setEnd(event.target.value)} /></label></div>
      {showPreview && <ShiftTimesheet selected={selected} start={start} end={end} onSelect={(preset) => { setStart(preset.start); setEnd(preset.end); }} />}
      <div className="rationale">A manager can assign one or multiple company preset shifts, then set the preferred coverage window. Editing start or end time updates the preview.</div>
    </Modal>
  );
}

function ShiftTimesheet({ selected, start, end, onSelect }) {
  const visible = shiftPresets.filter((preset) => selected.includes(preset.id));
  return (
    <div className="date-picker-panel">
      <div><div className="section-title">Shift Timesheet Preview</div><div className="section-sub">Colored bars show selected company preset shifts; the outlined block is preferred coverage.</div></div>
      <div className="time-axis">{Array.from({ length: 24 }, (_, hour) => <span key={hour}>{hour}</span>)}</div>
      <div className="timesheet">
        {visible.length ? visible.map((preset) => <div className="timesheet-row" key={preset.id}><div className="queue-meta"><strong>{preset.name}</strong><br />{timeLabel(preset.start)} - {timeLabel(preset.end)}</div><button className="timesheet-track" onClick={() => onSelect(preset)}><span className="shift-block" style={{ left: `${percentOfDay(preset.start)}%`, width: `${percentWidth(preset.start, preset.end)}%`, background: preset.color }} /><span className="coverage-block" style={{ left: `${percentOfDay(start)}%`, width: `${percentWidth(start, end)}%` }} /></button></div>) : <div className="rationale">Select one or more preset shifts to preview coverage.</div>}
      </div>
    </div>
  );
}

function HolidayModal({ calendar, onClose, onSave }) {
  const initialName = calendar.name && holidayCalendars[calendar.name] ? calendar.name : "Ittihad UAE Holiday Calendar";
  const [calendarName, setCalendarName] = useState(initialName);
  const [showPreview, setShowPreview] = useState(true);
  const selected = holidayCalendars[calendarName];
  return (
    <Modal title="View Holiday Calendar" onClose={onClose} onSave={() => onSave({ name: calendarName, ...selected })}>
      <label>Employee country<select value={selected.region} onChange={(event) => { const match = Object.entries(holidayCalendars).find(([, value]) => value.region === event.target.value); if (match) setCalendarName(match[0]); }}><option>UAE</option><option>India</option><option>Germany</option><option>United States</option></select></label>
      <label>Company calendar<select value={calendarName} onChange={(event) => setCalendarName(event.target.value)}>{Object.keys(holidayCalendars).map((name) => <option key={name}>{name}</option>)}</select></label>
      <label>Preview selected calendar<select value={showPreview ? "show" : "hide"} onChange={(event) => setShowPreview(event.target.value === "show")}><option value="show">Show yearly preview</option><option value="hide">Hide yearly preview</option></select></label>
      {showPreview && <HolidayPreview calendar={selected} />}
      <div className="rationale">Holiday calendars are company or country controlled. Employees can view them, but normal edits happen at company configuration level.</div>
    </Modal>
  );
}

function HolidayPreview({ calendar }) {
  return <div className="date-picker-panel"><div><div className="section-title">2026 Holiday Preview</div><div className="section-sub">Highlighted dates are blocked by the selected company calendar.</div></div><div className="holiday-legend">{calendar.holidays.map((holiday) => <span className="chip amber" key={`${holiday.date}-${holiday.label}`}>{formatDateLong(holiday.date)} · {holiday.label}</span>)}</div><YearCalendar highlighted={calendar.holidays.map((holiday) => holiday.date)} /></div>;
}

function PtoModal({ requests, onClose, onSave }) {
  const [items, setItems] = useState(requests);
  const [activeId, setActiveId] = useState("");
  const [action, setAction] = useState("add");
  const [form, setForm] = useState(newPtoRequest());
  const [dateField, setDateField] = useState(null);

  function chooseRequest(id) {
    setActiveId(id);
    const request = items.find((item) => item.id === id);
    if (request) { setForm({ ...request }); setAction("update"); }
    else { setForm(newPtoRequest()); setAction("add"); }
  }

  function submit() {
    let next = [...items];
    if (action === "remove" && activeId) next = next.filter((item) => item.id !== activeId);
    else if (action === "update" && activeId) next = next.map((item) => item.id === activeId ? normalizeRange(form) : item);
    else next.push(normalizeRange({ ...form, id: `pto-${Date.now()}` }));
    onSave(next);
  }

  return (
    <Modal title="Manage Vacation / PTO" onClose={onClose} onSave={submit}>
      <ReadOnlyEmployee />
      <label>Existing requests<select value={activeId} onChange={(event) => chooseRequest(event.target.value)}><option value="">Create new request</option>{items.map((item) => <option value={item.id} key={item.id}>{item.type} · {dateRangeLabel(item)}</option>)}</select></label>
      <RequestList requests={items} />
      <label>Action<select value={action} onChange={(event) => setAction(event.target.value)}><option value="add">Create new request</option><option value="update" disabled={!activeId}>Update selected request</option><option value="remove" disabled={!activeId}>Remove selected request</option></select></label>
      <label>PTO type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Vacation</option><option>Half-day PTO</option><option>Sick leave</option><option>Personal leave</option></select></label>
      <div className="date-range-grid"><label>Start date<button className="input-button" onClick={() => setDateField("startDate")}><span>{form.startDate}</span><Icon name="calendar-days" size={16} /></button></label><label>End date<button className="input-button" onClick={() => setDateField("endDate")}><span>{form.endDate}</span><Icon name="calendar-days" size={16} /></button></label></div>
      {dateField && <div className="date-picker-panel"><div><div className="section-title">Select Date</div><div className="section-sub">Choose {dateField === "startDate" ? "a start" : "an end"} date from the 2026 calendar.</div></div><YearCalendar selectedStart={form.startDate} selectedEnd={form.endDate} onPick={(date) => { const next = { ...form, [dateField]: date }; if (dateField === "startDate" && date > next.endDate) next.endDate = date; if (dateField === "endDate" && date < next.startDate) next.startDate = date; setForm(next); }} /></div>}
      <label>Request status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Requested</option><option>Approved</option><option>Manager review</option><option>Denied</option></select></label>
      <label>Request note<textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>
      <div className="rationale">Vacation/PTO requests use start and end dates. Click either date field to open the year calendar and select any date.</div>
    </Modal>
  );
}

function RequestList({ requests }) {
  if (!requests.length) return <div className="rationale">No vacation or PTO requests have been entered for this employee yet.</div>;
  return <div className="request-list">{requests.map((request) => <div className="request-row" key={request.id}><div><div className="note-title">{request.type} · {dateRangeLabel(request)}</div><div className="note-body">{request.note} · {request.status}</div></div><span className={`chip ${request.status === "Approved" ? "green" : "amber"}`}>{request.status}</span></div>)}</div>;
}

function AdhocModal({ blocks, onClose, onSave }) {
  const [items, setItems] = useState(blocks);
  const [activeId, setActiveId] = useState("");
  const [action, setAction] = useState("add");
  const [form, setForm] = useState(newAdhocBlock());
  const [showCalendar, setShowCalendar] = useState(false);

  function chooseBlock(id) {
    setActiveId(id);
    const block = items.find((item) => item.id === id);
    if (block) { setForm({ ...block }); setAction("update"); }
    else { setForm(newAdhocBlock()); setAction("add"); }
  }

  function submit() {
    let next = [...items];
    if (action === "remove" && activeId) next = next.filter((item) => item.id !== activeId);
    else if (action === "update" && activeId) next = next.map((item) => item.id === activeId ? form : item);
    else next.push({ ...form, id: `block-${Date.now()}` });
    onSave(next);
  }

  return (
    <Modal title="Add Ad Hoc Unavailable Block" onClose={onClose} onSave={submit}>
      <ReadOnlyEmployee />
      <label>Existing blocks<select value={activeId} onChange={(event) => chooseBlock(event.target.value)}><option value="">Create new block</option>{items.map((item) => <option value={item.id} key={item.id}>{formatDateLong(item.date)} · {item.reason}</option>)}</select></label>
      <label>Action<select value={action} onChange={(event) => setAction(event.target.value)}><option value="add">Create new block</option><option value="update" disabled={!activeId}>Update selected block</option><option value="remove" disabled={!activeId}>Remove selected block</option></select></label>
      <label>Date<button className="input-button" onClick={() => setShowCalendar(true)}><span>{form.date}</span><Icon name="calendar-days" size={16} /></button></label>
      {showCalendar && <div className="date-picker-panel"><div><div className="section-title">Select Date</div><div className="section-sub">Choose any date from the 2026 calendar.</div></div><YearCalendar selectedStart={form.date} selectedEnd={form.date} onPick={(date) => setForm({ ...form, date })} /></div>}
      <div className="date-range-grid"><label>Start time<input type="time" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} /></label><label>End time<input type="time" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} /></label></div>
      <label>Reason<select value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}><option>Doctor appointment</option><option>Customer meeting</option><option>Training</option><option>Personal block</option><option>Ticket review</option></select></label>
      <div className="rationale">Ad hoc unavailable blocks are short exceptions. Select a date, then customize the exact unavailable window.</div>
    </Modal>
  );
}

function StatusModal({ day, onClose, onSave }) {
  const [status, setStatus] = useState(day.status);
  const [note, setNote] = useState(day.note);
  return (
    <Modal title={`Change Status · ${formatDateLong(day.date)}`} onClose={onClose} onSave={() => onSave(status, note)}>
      <ReadOnlyEmployee />
      <label>Status tag<select value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
      <label>Availability note<input value={note} onChange={(event) => setNote(event.target.value)} /></label>
      <div className="rationale">This updates the availability status tag shown on the calendar. Meetings and check-ins remain separate calendar events.</div>
    </Modal>
  );
}

function EventModal({ date, hour, onClose, onSave }) {
  const startHour = String(hour).padStart(2, "0");
  const endHour = String(Math.min(hour + 1, 23)).padStart(2, "0");
  const [event, setEvent] = useState({ date, start: `${startHour}:00`, end: `${endHour}:00`, type: "Meeting", title: "Team check-in", note: "Calendar event for manager planning and assignment visibility." });
  return (
    <Modal title={`Mark Event · ${formatDateLong(date)}`} onClose={onClose} onSave={() => onSave(event)}>
      <ReadOnlyEmployee />
      <label>Date<input value={event.date} readOnly /></label>
      <label>Event type<select value={event.type} onChange={(change) => setEvent({ ...event, type: change.target.value })}><option>Meeting</option><option>Check-in</option><option>Training</option><option>1:1</option><option>Client call</option><option>Admin block</option><option>Ticket Review</option></select></label>
      <div className="date-range-grid"><label>Start time<input type="time" value={event.start} onChange={(change) => setEvent({ ...event, start: change.target.value })} /></label><label>End time<input type="time" value={event.end} onChange={(change) => setEvent({ ...event, end: change.target.value })} /></label></div>
      <label>Event title<input value={event.title} onChange={(change) => setEvent({ ...event, title: change.target.value })} /></label>
      <label>Notes<textarea value={event.note} onChange={(change) => setEvent({ ...event, note: change.target.value })} /></label>
      <div className="rationale">Events are saved to the employee calendar for review. They do not change preset shift coverage.</div>
    </Modal>
  );
}

function RulesModal({ rules, onClose, onSave }) {
  const [form, setForm] = useState(rules);
  return (
    <Modal title="Edit Assignment Rules" onClose={onClose} onSave={() => onSave(form)}>
      <label>Shift mismatch handling<select value={form.shift} onChange={(event) => setForm({ ...form, shift: event.target.value })}><option>Resolver is eligible only inside assigned shift coverage unless manager chooses fallback handling.</option><option>Allow manager fallback outside shift.</option><option>Lower ranking outside shift.</option></select></label>
      <label>Holiday handling<select value={form.holiday} onChange={(event) => setForm({ ...form, holiday: event.target.value })}><option>Company/country holidays remove normal availability without employee maintenance.</option><option>Allow emergency override on holidays.</option><option>Lower ranking on holidays.</option></select></label>
      <label>PTO handling<select value={form.vacation} onChange={(event) => setForm({ ...form, vacation: event.target.value })}><option>Planned absence filters resolver out for affected windows.</option><option>Allow manager override for urgent work.</option><option>Show as fallback only.</option></select></label>
      <label>Ad hoc unavailable handling<select value={form.adhoc} onChange={(event) => setForm({ ...form, adhoc: event.target.value })}><option>Short blocks reduce ranking or eligibility for that period.</option><option>Filter resolver out during block.</option><option>Allow assignment with manager acknowledgment.</option></select></label>
    </Modal>
  );
}

function ExceptionModal({ exceptions, initialAction, onClose, onSave }) {
  const openItems = exceptions.filter((item) => item.status !== "resolved");
  const [action, setAction] = useState(initialAction);
  const [selectedId, setSelectedId] = useState(openItems[0]?.id || "");
  const [day, setDay] = useState("Monday");
  const [type, setType] = useState("Shift conflict");
  const [note, setNote] = useState("Manager reviewed calendar conflict and updated assignment eligibility.");

  function submit() {
    if (action === "resolve") {
      onSave(exceptions.map((item) => item.id === selectedId ? { ...item, status: "resolved", body: note } : item), "Calendar exception resolved");
      return;
    }
    onSave([{ id: `exception-${Date.now()}`, time: day.slice(0, 3), title: type, body: note, status: "open" }, ...exceptions], "Calendar exception added");
  }

  return (
    <Modal title="Manage Calendar Exception" onClose={onClose} onSave={submit}>
      <label>Action<select value={action} onChange={(event) => setAction(event.target.value)}><option value="add">Add exception</option><option value="resolve">Resolve selected exception</option></select></label>
      <label>Existing exception<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={action !== "resolve"}>{openItems.length ? openItems.map((item) => <option value={item.id} key={item.id}>{item.title}</option>) : <option value="">No open exceptions</option>}</select></label>
      <label>Day<select value={day} onChange={(event) => setDay(event.target.value)} disabled={action === "resolve"}><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option></select></label>
      <label>Exception type<select value={type} onChange={(event) => setType(event.target.value)} disabled={action === "resolve"}><option>Shift conflict</option><option>PTO conflict</option><option>Holiday coverage</option><option>Ad hoc unavailable block</option><option>Peer fallback needed</option></select></label>
      <label>Resolution note<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
    </Modal>
  );
}

function ExceptionList({ exceptions }) {
  const openItems = exceptions.filter((item) => item.status !== "resolved");
  if (!openItems.length) return <div className="timeline-item"><div className="time">Clear</div><div><div className="note-title">No open calendar exceptions</div><div className="note-body">The selected resolver has no unresolved availability conflicts in this week.</div></div></div>;
  return openItems.map((item) => <div className="timeline-item" key={item.id}><div className="time">{item.time}</div><div><div className="note-title">{item.title}</div><div className="note-body">{item.body}</div></div></div>);
}

function YearCalendar({ selectedStart = "", selectedEnd = "", highlighted = [], onPick = () => {} }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const selectedDates = new Set(selectedStart ? datesInRange(selectedStart, selectedEnd || selectedStart) : []);
  const highlightedDates = new Set(highlighted);
  return (
    <div className="year-calendar">
      {months.map((month, monthIndex) => {
        const blanks = Array.from({ length: new Date(2026, monthIndex, 1).getDay() });
        const dayCount = new Date(2026, monthIndex + 1, 0).getDate();
        return <div className="month-card" key={month}><div className="month-title">{month}</div><div className="month-weekdays-mini">{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="month-days">{blanks.map((_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: dayCount }, (_, index) => { const date = `2026-${String(monthIndex + 1).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`; return <button type="button" className={`date-cell ${selectedDates.has(date) ? "selected" : ""} ${highlightedDates.has(date) ? "holiday" : ""}`} key={date} onClick={() => onPick(date)}>{index + 1}</button>; })}</div></div>;
      })}
    </div>
  );
}

function Modal({ title, children, onClose, onSave, footer = true, wide = false }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? "modal-wide" : ""}`}>
        <div className="modal-head"><div className="section-title">{title}</div><button className="icon-button close-button" aria-label="Close" onClick={onClose}><Icon name="x" size={18} /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot"><button className="secondary" onClick={onClose}><Icon name="x" size={15} />Cancel</button><button className="primary" onClick={onSave}><Icon name="check" size={16} />Save</button></div>}
      </div>
    </div>
  );
}

function ReadOnlyEmployee() {
  return <label>Employee<input value="Swapnil Ramesh Rajane" readOnly /></label>;
}

function StaticPageHeader({ title, subtitle }) {
  return <section className="section page-intro static-intro"><div className="section-head"><div><div className="eyebrow">Operations overview</div><div className="section-title page-heading">{title}</div><div className="section-sub">{subtitle}</div></div><span className="updated-stamp"><span className="presence-dot" />Updated just now</span></div></section>;
}

function EmployeeContextPage({ profile, summary, onOpenCalendar }) {
  return (
    <div className="content">
      <section className="section page-intro">
        <div className="section-head">
          <div className="employee-identity"><span className="employee-avatar large">SR</span><div><div className="eyebrow">Resolver profile</div><div className="section-title employee-title">{profile.employee.name}</div><div className="section-sub identity-meta"><span>{profile.employee.role}</span><span>{profile.employee.team}</span><span>{profile.employee.location}</span></div></div></div>
          <button className="primary action-button" onClick={onOpenCalendar}><Icon name="calendar-check" size={17} />View Availability</button>
        </div>
      </section>
      <section className="metric-grid">
        <Metric label="Availability" value={profile.eligibility} note="Current status" tone="green" />
        <Metric label="Available Days" value={summary.availableDays} note="This week" tone="blue" />
        <Metric label="Shift Window" value={profile.remainingToday} note="Remaining today" tone="navy" />
        <Metric label="Open Tickets" value="6" note="Current assignment load" tone="amber" />
        <Metric label="Access" value="Active" note="Queue-based eligibility" tone="green" />
      </section>
      <div className="split">
        <section className="section"><SectionHead title="Employee Information" subtitle="Profile context used by workforce planning." /><div className="section-body"><table><tbody><tr><td>Role</td><td>{profile.employee.role}</td></tr><tr><td>Team</td><td>{profile.employee.team}</td></tr><tr><td>Manager</td><td>{profile.employee.manager}</td></tr><tr><td>Location</td><td>{profile.employee.location}</td></tr><tr><td>Time zone</td><td>{profile.employee.timezone}</td></tr></tbody></table></div></section>
        <section className="section"><SectionHead title="Availability Snapshot" subtitle="Current calendar inputs used for resolver recommendation." /><div className="section-body"><table><tbody><tr><td>Preset shifts</td><td>{shiftNames(profile.layers.shift)}</td></tr><tr><td>Holiday calendar</td><td>{profile.layers.holidayCalendar.name}</td></tr><tr><td>Vacation / PTO</td><td>{ptoSummary(profile.layers.pto)}</td></tr><tr><td>Ad hoc blocks</td><td>{profile.layers.adHocUnavailable.length}</td></tr><tr><td>Eligibility</td><td>{profile.eligibility}</td></tr></tbody></table></div></section>
      </div>
    </div>
  );
}

function StaticTicketQueue() {
  return <div className="content"><StaticPageHeader title="Ticket Queue" subtitle="Operational tickets awaiting resolver review and assignment." /><section className="metric-grid"><Metric label="Open Tickets" value="78" note="Current backlog" tone="navy" /><Metric label="High Priority" value="12" note="Needs awareness" tone="amber" /><Metric label="SLA Risk" value="6" note="Approaching target" tone="red" /><Metric label="Queued Today" value="24" note="New intake" tone="blue" /><Metric label="Resolved Today" value="31" note="Completed work" tone="green" /></section><section className="section"><div className="section-head"><div><div className="section-title">Queue Snapshot</div><div className="section-sub">Current work ordered by operational urgency.</div></div><div className="filter-summary"><span className="chip blue">All tickets</span><span className="chip gray">Updated today</span></div></div><div className="section-body table-wrap"><table className="data-table"><thead><tr><th>Ticket</th><th>Summary</th><th>Application</th><th>Priority</th><th>Status</th></tr></thead><tbody><tr><td className="ticket-id">#177618</td><td>FG production error</td><td>SAP Quality Management</td><td><span className="priority normal">Normal</span></td><td><span className="chip blue">Queued</span></td></tr><tr><td className="ticket-id">#177592</td><td>Inbound delivery not posted</td><td>SAP Inventory</td><td><span className="priority high">High</span></td><td><span className="chip amber">SLA risk</span></td></tr><tr><td className="ticket-id">#177541</td><td>Payment block exception</td><td>SAP Finance</td><td><span className="priority normal">Normal</span></td><td><span className="chip gray">Review</span></td></tr><tr><td className="ticket-id">#177486</td><td>Warehouse transfer delayed</td><td>SAP Logistics</td><td><span className="priority high">High</span></td><td><span className="chip green">Assigned</span></td></tr></tbody></table></div></section></div>;
}

function StaticResolverAssignment() {
  return <div className="content"><StaticPageHeader title="Resolver Assignment" subtitle="Ranked resolver recommendations for the selected operational ticket." /><section className="section assignment-context"><div className="section-head"><div><div className="eyebrow">Ticket #177618</div><div className="section-title">FG production error</div><div className="section-sub">S/4HANA · Quality Management · Normal priority</div></div><span className="chip blue">3 eligible resolvers</span></div></section><section className="section"><SectionHead title="Ranked Resolver Recommendations" subtitle="Candidate order reflects skill, workload, access, and calendar eligibility." /><div className="section-body table-wrap"><table className="data-table resolver-table"><thead><tr><th>Resolver</th><th>Match</th><th>Availability</th><th>Relevant skills</th><th>Load</th></tr></thead><tbody><tr><td><PersonCell initials="SR" name="Swapnil Ramesh Rajane" role="Senior SAP Resolver" /></td><td><MatchScore value={92} /></td><td><span className="chip green">Available</span></td><td>S/4HANA, Quality Management</td><td>6 tickets</td></tr><tr><td><PersonCell initials="PS" name="Priya Srinivasan" role="SAP Resolver" /></td><td><MatchScore value={86} /></td><td><span className="chip amber">Busy</span></td><td>S/4HANA, Monitoring</td><td>8 tickets</td></tr><tr><td><PersonCell initials="ON" name="Omar Al Nuaimi" role="SAP Resolver" /></td><td><MatchScore value={79} /></td><td><span className="chip green">Available</span></td><td>S/4HANA, Production Planning</td><td>4 tickets</td></tr></tbody></table></div></section><section className="section"><SectionHead title="Recommendation Basis" subtitle="Skills and queue access establish eligibility; live calendar and workload signals determine ranking." /><div className="section-body signal-row"><span><i className="signal-icon skill-signal" />Skill match</span><span><i className="signal-icon calendar-signal" />Availability</span><span><i className="signal-icon access-signal" />Queue access</span><span><i className="signal-icon load-signal" />Current workload</span></div></section></div>;
}

function StaticDashboard() {
  return <div className="content"><StaticPageHeader title="Dashboard" subtitle="Management overview across ticket demand, service speed, and workforce readiness." /><section className="metric-grid"><Metric label="Total Tickets" value="6,161" note="Current scope" tone="navy" /><Metric label="Open Backlog" value="78" note="Open now" tone="amber" /><Metric label="Median MTTR" value="14h 46m" note="Resolved tickets" tone="green" /><Metric label="Average MTTR" value="52h 38m" note="Resolved average" tone="red" /><Metric label="Indicative FTE" value="179.87" note="Workload basis" tone="blue" /></section><div className="dashboard-split"><section className="section"><SectionHead title="Ticket Flow" subtitle="Opened and resolved ticket volume across the current period." /><div className="section-body mini-chart"><div className="chart-axis"><span>500</span><span>250</span><span>0</span></div><div className="chart-bars">{[62, 74, 58, 82, 70, 88, 76, 91, 68, 84, 79, 93].map((height, index) => <div className="chart-group" key={index}><span className="chart-bar opened" style={{ height: `${height}%` }} /><span className="chart-bar resolved" style={{ height: `${Math.max(30, height - (index % 3) * 8)}%` }} /></div>)}</div></div><div className="chart-legend"><span><i className="legend-dot opened" />Opened</span><span><i className="legend-dot resolved" />Resolved</span></div></section><section className="section"><SectionHead title="Queue Health" subtitle="Operational signals requiring manager attention." /><div className="section-body health-list"><HealthRow label="SLA coverage" value="94%" tone="good" /><HealthRow label="Resolver availability" value="82%" tone="good" /><HealthRow label="RCA completeness" value="49%" tone="warn" /><HealthRow label="Escalation coverage" value="68%" tone="warn" /></div></section></div><section className="section"><SectionHead title="Operational Readiness" subtitle="Coverage of the fields used by assignment and workforce planning." /><div className="section-body coverage-grid"><ReadinessCard label="Work Type" value={100} status="Complete" /><ReadinessCard label="Workstream" value={88.2} status="Healthy" /><ReadinessCard label="RCA" value={49.5} status="Needs attention" tone="warn" /><ReadinessCard label="Resolution" value={72.4} status="Partial" tone="warn" /></div></section></div>;
}

function PersonCell({ initials, name, role }) {
  return <div className="person-cell"><span className="person-avatar">{initials}</span><span><strong>{name}</strong><small>{role}</small></span></div>;
}

function MatchScore({ value }) {
  return <div className="match-score"><strong>{value}%</strong><span><i style={{ width: `${value}%` }} /></span></div>;
}

function HealthRow({ label, value, tone }) {
  return <div className="health-row"><div><span>{label}</span><strong>{value}</strong></div><span className={`health-track ${tone}`}><i style={{ width: value }} /></span></div>;
}

function ReadinessCard({ label, value, status, tone = "good" }) {
  return <article className="coverage readiness-card"><div className="coverage-title"><span>{label}</span><span className={`readiness-status ${tone}`}>{status}</span></div><div className="coverage-value">{value}%</div><div className="readiness-track"><i className={tone} style={{ width: `${value}%` }} /></div></article>;
}

function normalizeProfile(profile) {
  const source = profile || {};
  const sourceLayers = source.layers || {};
  const sourceShift = sourceLayers.shift || {};
  const sourceHoliday = sourceLayers.holidayCalendar || {};
  const holidayName = sourceHoliday.name || Object.keys(holidayCalendars).find((name) => holidayCalendars[name].company === sourceHoliday.company) || "Ittihad UAE Holiday Calendar";
  return {
    ...fallbackProfile,
    ...source,
    employee: { ...fallbackProfile.employee, ...(source.employee || {}) },
    remainingToday: source.remainingToday || "3h 20m",
    eligibility: source.eligibility || source.days?.[0]?.status || "Available",
    layers: {
      shift: { ...fallbackProfile.layers.shift, ...sourceShift, presets: sourceShift.presets || [shiftPresets.find((preset) => preset.name === sourceShift.preset)?.id || "dubai-core"] },
      holidayCalendar: { ...sourceHoliday, name: holidayName, ...holidayCalendars[holidayName] },
      pto: Array.isArray(sourceLayers.pto) ? sourceLayers.pto.map((request) => ({ status: "Approved", ...request })) : fallbackProfile.layers.pto,
      adHocUnavailable: Array.isArray(sourceLayers.adHocUnavailable) ? sourceLayers.adHocUnavailable : fallbackProfile.layers.adHocUnavailable
    },
    days: Array.isArray(source.days) ? source.days : fallbackProfile.days,
    events: Array.isArray(source.events) ? source.events : fallbackProfile.events,
    rules: { ...defaultRules, ...(source.rules || {}) },
    exceptions: Array.isArray(source.exceptions) ? source.exceptions : fallbackProfile.exceptions
  };
}

function summarize(profile) {
  const days = weekDates.map((date) => dayForDate(profile, date));
  return {
    availableDays: days.filter((day) => statusClass(day.status) === "available").length,
    busyBlocks: days.filter((day) => statusClass(day.status) === "busy").length,
    unavailableDays: days.filter((day) => statusClass(day.status) === "unavailable").length
  };
}

function applyShiftToDays(profile) {
  const note = `${timeLabel(profile.layers.shift.start)} - ${timeLabel(profile.layers.shift.end)}`;
  profile.days = profile.days.map((day) => day.source === "shift" || statusClass(day.status) === "available" ? { ...day, status: "Available", note, source: "shift" } : day);
}

function syncPtoToDays(profile) {
  const shiftNote = `${timeLabel(profile.layers.shift.start)} - ${timeLabel(profile.layers.shift.end)}`;
  const ptoDates = new Set(profile.layers.pto.filter((request) => request.status !== "Denied").flatMap((request) => datesInRange(request.startDate, request.endDate)));
  profile.days = profile.days.map((day) => {
    if (ptoDates.has(day.date)) return { ...day, status: "PTO", note: profile.layers.pto.find((request) => datesInRange(request.startDate, request.endDate).includes(day.date))?.note || "Unavailable", source: "pto" };
    if (day.source === "pto") return { ...day, status: "Available", note: shiftNote, source: "shift" };
    return day;
  });
}

function syncAdhocToDays(profile) {
  const shiftNote = `${timeLabel(profile.layers.shift.start)} - ${timeLabel(profile.layers.shift.end)}`;
  profile.days = profile.days.map((day) => day.source === "ad hoc" ? { ...day, status: "Available", note: shiftNote, source: "shift" } : day);
  profile.layers.adHocUnavailable.forEach((block) => {
    const day = profile.days.find((item) => item.date === block.date);
    if (day && day.source !== "pto") {
      day.status = "Busy";
      day.note = `${timeLabel(block.start)} - ${timeLabel(block.end)} ${block.reason.toLowerCase()}`;
      day.source = "ad hoc";
    }
  });
}

function upsertDayStatus(profile, date, status, note) {
  const existing = profile.days.find((day) => day.date === date);
  if (existing) Object.assign(existing, { status, note, source: "manual" });
  else profile.days.push({ date, label: shortDayName(date), status, note, source: "manual" });
  profile.eligibility = status === "PTO" ? "Unavailable" : status;
}

function dayForDate(profile, date) {
  const exact = profile.days.find((day) => day.date === date);
  if (exact) return exact;
  const template = profile.days.find((day) => day.label === shortDayName(date)) || profile.days[0];
  return { ...template, date, label: shortDayName(date) };
}

function eventsForDate(profile, date) {
  return profile.events.filter((event) => event.date === date);
}

function ptoSummary(requests) {
  const dates = new Set(requests.filter((request) => request.status !== "Denied").flatMap((request) => datesInRange(request.startDate, request.endDate)));
  return requests.length ? `${requests.length} request${requests.length === 1 ? "" : "s"} · ${dates.size} day${dates.size === 1 ? "" : "s"}` : "0 requests";
}

function shiftNames(shift) {
  const names = shiftPresets.filter((preset) => shift.presets?.includes(preset.id)).map((preset) => preset.name);
  return names.join(" + ") || shift.preset || "Custom shift";
}

function newPtoRequest() {
  return { id: "", type: "Vacation", startDate: "2026-07-24", endDate: "2026-07-24", note: "Employee-entered planned absence.", status: "Requested" };
}

function newAdhocBlock() {
  return { id: "", date: "2026-07-22", start: "13:00", end: "15:00", reason: "Doctor appointment" };
}

function normalizeRange(request) {
  return request.startDate <= request.endDate ? request : { ...request, startDate: request.endDate, endDate: request.startDate };
}

function loadLocal() {
  try { return JSON.parse(localStorage.getItem("availability-profile")); }
  catch { return null; }
}

function datesInRange(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const first = start <= end ? start : end;
  const last = start <= end ? end : start;
  const dates = [];
  for (const cursor = new Date(first); cursor <= last; cursor.setDate(cursor.getDate() + 1)) dates.push(cursor.toISOString().slice(0, 10));
  return dates;
}

function dateRangeLabel(request) {
  return `${formatDateLong(request.startDate)} - ${formatDateLong(request.endDate)}`;
}

function formatDateLong(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function shortDayName(date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(`${date}T12:00:00`).getDay()];
}

function fullDayName(label) {
  return { Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" }[label] || label;
}

function calendarHours() {
  return Array.from({ length: 10 }, (_, index) => index + 8);
}

function hourLabel(hour) {
  return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;
}

function timeLabel(value) {
  if (!/^\d{2}:\d{2}$/.test(value || "")) return value || "9:00 AM";
  const [hours, minutes] = value.split(":").map(Number);
  return `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

function minutesFromTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60) + minutes;
}

function percentOfDay(value) {
  return (minutesFromTime(value) / 1440) * 100;
}

function percentWidth(start, end) {
  return Math.max(((minutesFromTime(end) - minutesFromTime(start)) / 1440) * 100, 2);
}

function currentTimeLabel(timezone) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone, timeZoneName: "short" }).format(new Date());
}

function statusClass(status) {
  if (status === "Available" || status === "Available later") return "available";
  if (status === "Busy") return "busy";
  return "unavailable";
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function calendarViewTitle(view) {
  return { day: "Daily Calendar", week: "Weekly Calendar", month: "Monthly Calendar" }[view];
}

createRoot(document.getElementById("root")).render(<App />);
