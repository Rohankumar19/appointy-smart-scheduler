
import { Appointment, TimeSlot } from "@/types/appointment";
import { User } from "@/types/user";

// Strategy Pattern for different scheduling algorithms
export interface SchedulingStrategy {
  findAvailableSlots(
    date: Date,
    duration: number,
    staff?: User
  ): TimeSlot[];
  
  checkConflicts(appointment: Appointment): boolean;
}

// Default scheduling strategy
export class BasicSchedulingStrategy implements SchedulingStrategy {
  private appointments: Appointment[] = [];
  
  constructor(appointments: Appointment[]) {
    this.appointments = appointments;
  }
  
  findAvailableSlots(date: Date, duration: number, staff?: User): TimeSlot[] {
    // Simple implementation that returns dummy available slots
    // In a real app, this would check against existing appointments
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0); // Start at 9 AM
    
    const dayEnd = new Date(date);
    dayEnd.setHours(17, 0, 0, 0); // End at 5 PM
    
    const slots: TimeSlot[] = [];
    const slotDuration = duration; // minutes
    
    // Generate slots every 30 minutes
    for (let time = dayStart; time < dayEnd; time = new Date(time.getTime() + 30 * 60000)) {
      const endTime = new Date(time.getTime() + slotDuration * 60000);
      
      // Check if this slot conflicts with any existing appointment
      const hasConflict = this.appointments.some(appointment => {
        // Skip appointments not for this staff if staff is specified
        if (staff && appointment.staff && appointment.staff.id !== staff.id) {
          return false;
        }
        
        // Skip cancelled appointments
        if (appointment.status === "cancelled") {
          return false;
        }
        
        // Check time overlap
        return (
          (time >= appointment.startTime && time < appointment.endTime) ||
          (endTime > appointment.startTime && endTime <= appointment.endTime) ||
          (time <= appointment.startTime && endTime >= appointment.endTime)
        );
      });
      
      slots.push({
        id: `slot-${time.getTime()}`,
        startTime: new Date(time),
        endTime: endTime,
        isAvailable: !hasConflict,
      });
    }
    
    return slots;
  }
  
  checkConflicts(appointment: Appointment): boolean {
    return this.appointments.some(existing => {
      // Skip comparing to itself
      if (existing.id === appointment.id) {
        return false;
      }
      
      // Skip cancelled appointments
      if (existing.status === "cancelled") {
        return false;
      }
      
      // Skip appointments with different staff
      if (appointment.staff && existing.staff && existing.staff.id !== appointment.staff.id) {
        return false;
      }
      
      // Check time overlap
      return (
        (appointment.startTime >= existing.startTime && appointment.startTime < existing.endTime) ||
        (appointment.endTime > existing.startTime && appointment.endTime <= existing.endTime) ||
        (appointment.startTime <= existing.startTime && appointment.endTime >= existing.endTime)
      );
    });
  }
}

// Premium scheduling strategy with smart suggestions
export class PremiumSchedulingStrategy implements SchedulingStrategy {
  private appointments: Appointment[] = [];
  
  constructor(appointments: Appointment[]) {
    this.appointments = appointments;
  }
  
  findAvailableSlots(date: Date, duration: number, staff?: User): TimeSlot[] {
    // First get basic available slots
    const basicStrategy = new BasicSchedulingStrategy(this.appointments);
    const slots = basicStrategy.findAvailableSlots(date, duration, staff);
    
    // Apply additional optimization algorithms here
    // For example, prioritize slots during peak hours or staff preferences
    // For now, we'll just sort them to prioritize morning slots
    return slots.sort((a, b) => {
      // Prioritize morning slots (before noon)
      const aIsMorning = a.startTime.getHours() < 12;
      const bIsMorning = b.startTime.getHours() < 12;
      
      if (aIsMorning && !bIsMorning) return -1;
      if (!aIsMorning && bIsMorning) return 1;
      
      // If both are morning or both are afternoon, sort by time
      return a.startTime.getTime() - b.startTime.getTime();
    });
  }
  
  checkConflicts(appointment: Appointment): boolean {
    const basicStrategy = new BasicSchedulingStrategy(this.appointments);
    return basicStrategy.checkConflicts(appointment);
  }
}
