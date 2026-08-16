import React from "react";

// Official Lucide icon nodes, vendored as a focused subset under the ISC license.
const icons = {
  "calendar-range": [
    ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
    ["path", { d: "M16 2v4" }],
    ["path", { d: "M3 10h18" }],
    ["path", { d: "M8 2v4" }],
    ["path", { d: "M17 14h-6" }],
    ["path", { d: "M13 18H7" }],
    ["path", { d: "M7 14h.01" }],
    ["path", { d: "M17 18h.01" }]
  ],
  inbox: [
    ["polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }],
    ["path", { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" }]
  ],
  "user-round-check": [
    ["path", { d: "M2 21a8 8 0 0 1 13.292-6" }],
    ["circle", { cx: "10", cy: "8", r: "5" }],
    ["path", { d: "m16 19 2 2 4-4" }]
  ],
  "layout-dashboard": [
    ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1" }],
    ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1" }]
  ],
  clock: [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 6v6h4" }]
  ],
  "calendar-days": [
    ["path", { d: "M8 2v4" }],
    ["path", { d: "M16 2v4" }],
    ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
    ["path", { d: "M3 10h18" }],
    ["path", { d: "M8 14h.01" }],
    ["path", { d: "M12 14h.01" }],
    ["path", { d: "M16 14h.01" }],
    ["path", { d: "M8 18h.01" }],
    ["path", { d: "M12 18h.01" }],
    ["path", { d: "M16 18h.01" }]
  ],
  "calendar-off": [
    ["path", { d: "M4.2 4.2A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.82-1.18" }],
    ["path", { d: "M21 15.5V6a2 2 0 0 0-2-2H9.5" }],
    ["path", { d: "M16 2v4" }],
    ["path", { d: "M3 10h7" }],
    ["path", { d: "M21 10h-5.5" }],
    ["path", { d: "m2 2 20 20" }]
  ],
  "clock-alert": [
    ["path", { d: "M12 6v6l4 2" }],
    ["path", { d: "M20 12v5" }],
    ["path", { d: "M20 21h.01" }],
    ["path", { d: "M21.25 8.2A10 10 0 1 0 16 21.16" }]
  ],
  pencil: [
    ["path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }],
    ["path", { d: "m15 5 4 4" }]
  ],
  "arrow-left": [
    ["path", { d: "m12 19-7-7 7-7" }],
    ["path", { d: "M19 12H5" }]
  ],
  sliders: [
    ["path", { d: "M10 5H3" }],
    ["path", { d: "M12 19H3" }],
    ["path", { d: "M14 3v4" }],
    ["path", { d: "M16 17v4" }],
    ["path", { d: "M21 12h-9" }],
    ["path", { d: "M21 19h-5" }],
    ["path", { d: "M21 5h-7" }],
    ["path", { d: "M8 10v4" }],
    ["path", { d: "M8 12H3" }]
  ],
  plus: [
    ["path", { d: "M5 12h14" }],
    ["path", { d: "M12 5v14" }]
  ],
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  x: [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ],
  "calendar-check": [
    ["path", { d: "M8 2v4" }],
    ["path", { d: "M16 2v4" }],
    ["path", { d: "M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" }],
    ["path", { d: "M3 10h18" }],
    ["path", { d: "m16 20 2 2 4-4" }]
  ],
  building: [
    ["path", { d: "M10 12h4" }],
    ["path", { d: "M10 8h4" }],
    ["path", { d: "M14 21v-3a2 2 0 0 0-4 0v3" }],
    ["path", { d: "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" }],
    ["path", { d: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" }]
  ]
};

export function Icon({ name, size = 18, strokeWidth = 2, className = "", ...props }) {
  const nodes = icons[name];
  if (!nodes) return null;
  return (
    <svg
      aria-hidden="true"
      className={`ui-icon ${className}`.trim()}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {nodes.map(([tag, attributes], index) => React.createElement(tag, { ...attributes, key: `${name}-${index}` }))}
    </svg>
  );
}
