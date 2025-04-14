
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { User } from "@/types/user";
import { AppointmentObserver } from "./appointmentObserver";
import { AppointmentFactory } from "./appointmentFactory";
import { SchedulingStrategy, BasicSchedulingStrategy } from "./schedulingStrategies";

// Mediator Pattern - coordinates between scheduling, notification, and appointment creation
export class AppointmentMediator {
  private appointments: Appointment[] = [];
  private observers: AppointmentObserver[] = [];
  private appointmentFactory: AppointmentFactory;
  private schedulingStrategy: SchedulingStrategy;
  
  constructor() {
    this.appointmentFactory = new AppointmentFactory();
    this.schedulingStrategy = new BasicSchedulingStrategy([]);
  }
  
  // Allow changing the scheduling strategy (Strategy Pattern)
  setSchedulingStrategy(strategy: SchedulingStrategy): void {
    this.schedulingStrategy = strategy;
  }
  
  // Register observers (Observer Pattern)
  registerObserver(observer: AppointmentObserver): void {
    this.observers.push(observer);
  }
  
  // Remove observers
  removeObserver(observer: AppointmentObserver): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }
  
  // Notify all observers about appointment changes
  private notifyObservers(appointment: Appointment, action: string): void {
    this.observers.forEach(observer => {
      observer.update(appointment, action);
    });
  }
  
  // Load appointments (e.g., from API or local storage)
  loadAppointments(appointments: Appointment[]): void {
    this.appointments = appointments;
    // Update the scheduling strategy with the new appointments
    this.schedulingStrategy = new BasicSchedulingStrategy(this.appointments);
  }
  
  // Get all appointments
  getAllAppointments(): Appointment[] {
    return [...this.appointments];
  }
  
  // Create a new appointment
  createAppointment(
    title: string,
    startTime: Date,
    endTime: Date,
    client: User,
    staff: User,
    type: "one-on-one" | "group" | "recurring" = "one-on-one"
  ): Appointment | null {
    const id = `appt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let appointment: Appointment;
    
    // Use the factory to create the appropriate appointment type
    if (type === "one-on-one") {
      appointment = this.appointmentFactory.createOneOnOneAppointment(
        id, title, startTime, endTime, client, staff
      );
    } else if (type === "group") {
      const groupAppointment = this.appointmentFactory.createGroupAppointment(
        id, title, startTime, endTime, [client], staff
      );
      appointment = groupAppointment;
    } else {
      const recurringAppointment = this.appointmentFactory.createRecurringAppointment(
        id, title, startTime, endTime, client, staff, "weekly"
      );
      appointment = recurringAppointment;
    }
    
    // Check for conflicts
    if (this.schedulingStrategy.checkConflicts(appointment)) {
      return null; // Conflict detected
    }
    
    // Add to appointments list
    this.appointments.push(appointment);
    
    // Notify observers
    this.notifyObservers(appointment, "created");
    
    return appointment;
  }
  
  // Update appointment status
  updateAppointmentStatus(id: string, status: AppointmentStatus): Appointment | null {
    const appointmentIndex = this.appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return null;
    }
    
    const updatedAppointment = {
      ...this.appointments[appointmentIndex],
      status,
      updatedAt: new Date()
    };
    
    this.appointments[appointmentIndex] = updatedAppointment;
    
    // Notify observers
    this.notifyObservers(updatedAppointment, "updated");
    
    return updatedAppointment;
  }
  
  // Reschedule an appointment
  rescheduleAppointment(id: string, newStartTime: Date, newEndTime: Date): Appointment | null {
    const appointmentIndex = this.appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return null;
    }
    
    const updatedAppointment = {
      ...this.appointments[appointmentIndex],
      startTime: newStartTime,
      endTime: newEndTime,
      updatedAt: new Date()
    };
    
    // Check for conflicts with the new time
    if (this.schedulingStrategy.checkConflicts(updatedAppointment)) {
      return null; // Conflict detected
    }
    
    this.appointments[appointmentIndex] = updatedAppointment;
    
    // Notify observers
    this.notifyObservers(updatedAppointment, "rescheduled");
    
    return updatedAppointment;
  }
  
  // Cancel an appointment
  cancelAppointment(id: string): Appointment | null {
    return this.updateAppointmentStatus(id, "cancelled");
  }
}
