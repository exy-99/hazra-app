import type { AttendanceStatus } from '@/constants/status';

export type { AttendanceStatus };

export interface Worksite {
  id: string;
  name: string;
  type: string;
  address: string | null;
  created_at: string;
  is_active: number;
}

export interface Worker {
  id: string;
  name: string;
  worksite_id: string;
  role: string | null;
  phone: string | null;
  created_at: string;
  is_active: number;
}

export interface AttendanceEntry {
  id: string;
  worker_id: string;
  date: string;
  status: AttendanceStatus;
  note: string | null;
  updated_at: string;
}
