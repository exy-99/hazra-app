// Attendance status contract (DS-01, design.md §4).
//
// These four status colors are reserved for attendance status ONLY and must
// not be reused for any other UI (design.md §3 usage rules). Later phases
// (attendance marking, reports, export) all import STATUS and CYCLE from here
// so parallel color/status definitions never appear elsewhere in the app.

export const STATUS = {
  present: { label: 'Present', solid: '#16A34A', tint: '#DCFCE7', text: '#15803D' },
  absent: { label: 'Absent', solid: '#DC2626', tint: '#FEE2E2', text: '#B91C1C' },
  half_day: { label: 'Half day', solid: '#B45309', tint: '#FEF3C7', text: '#B45309' },
  off_day: { label: 'Off day', solid: '#64748B', tint: '#E2E8F0', text: '#475569' },
} as const;

export const CYCLE = ['present', 'absent', 'half_day', 'off_day'] as const;

export type AttendanceStatus = keyof typeof STATUS;
