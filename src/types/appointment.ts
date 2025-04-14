
import { User } from "./user";

export type TimeSlot = {
  id: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
};

export type AppointmentStatus = 
  | "scheduled" 
  | "confirmed"
  | "cancelled"
  | "completed"
  | "pending";

export type AppointmentType = 
  | "one-on-one"
  | "group"
  | "recurring";

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  client: User;
  staff?: User;
  status: AppointmentStatus;
  type: AppointmentType;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilityRule {
  id: string;
  weekday: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  userId?: string; // Optional: to link to a specific user
}

export type CalendarView = "day" | "week" | "month";
