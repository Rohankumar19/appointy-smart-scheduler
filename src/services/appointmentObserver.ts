
import { Appointment } from "@/types/appointment";
import { toast } from "@/hooks/use-toast";

// Observer Pattern for notifications
export interface AppointmentObserver {
  update(appointment: Appointment, action: string): void;
}

// Email notification observer
export class EmailNotificationObserver implements AppointmentObserver {
  update(appointment: Appointment, action: string): void {
    // In a real app, this would send an email
    console.log(`Email notification: Appointment ${action}`, appointment);
    
    // Show a toast for demo purposes
    toast({
      title: `Email notification sent`,
      description: `About appointment "${appointment.title}" being ${action}`,
    });
  }
}

// SMS notification observer
export class SMSNotificationObserver implements AppointmentObserver {
  update(appointment: Appointment, action: string): void {
    // In a real app, this would send an SMS
    console.log(`SMS notification: Appointment ${action}`, appointment);
    
    // Show a toast for demo purposes
    toast({
      title: `SMS notification sent`,
      description: `About appointment "${appointment.title}" being ${action}`,
    });
  }
}

// Calendar sync observer
export class CalendarSyncObserver implements AppointmentObserver {
  update(appointment: Appointment, action: string): void {
    // In a real app, this would sync with external calendars
    console.log(`Calendar sync: Appointment ${action}`, appointment);
    
    // Show a toast for demo purposes
    toast({
      title: `Calendar synced`,
      description: `Appointment "${appointment.title}" ${action} in calendar`,
    });
  }
}
