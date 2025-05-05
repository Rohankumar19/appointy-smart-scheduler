import React, { createContext, useContext, useState, useEffect } from "react";
import { AppointmentMediator } from "@/services/appointmentMediator";
import { AppointmentStatus, Appointment, TimeSlot } from "@/types/appointment";
import { User } from "@/types/user";
import { EmailNotificationObserver, CalendarSyncObserver } from "@/services/appointmentObserver";
import { BasicSchedulingStrategy } from "@/services/schedulingStrategies";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

// Context type
interface AppointmentContextType {
  appointments: Appointment[];
  users: User[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  createAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  cancelAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, newStartTime: Date, newEndTime: Date) => boolean;
  getAvailableTimeSlots: (date: Date, duration: number, staffId?: string) => TimeSlot[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

// Create the context
const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

// Mock users and appointments for demonstration
const mockUsers: User[] = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "staff" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "client" },
  { id: "3", name: "Emily Johnson", email: "emily@example.com", role: "staff" },
  { id: "4", name: "Michael Brown", email: "michael@example.com", role: "client" },
];

const mockAppointments: Appointment[] = [
  {
    id: "1",
    title: "Website Consultation",
    description: "Initial discussion about website requirements",
    startTime: new Date(new Date().setHours(10, 0, 0, 0)),
    endTime: new Date(new Date().setHours(11, 0, 0, 0)),
    client: mockUsers[1],
    staff: mockUsers[0],
    status: "confirmed",
    type: "one-on-one",
    location: "Virtual Meeting",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Project Follow-up",
    startTime: new Date(new Date().setHours(14, 0, 0, 0)),
    endTime: new Date(new Date().setHours(15, 0, 0, 0)),
    client: mockUsers[3],
    staff: mockUsers[2],
    status: "scheduled",
    type: "one-on-one",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Provider component
export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mediator] = useState(() => new AppointmentMediator());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [users] = useState<User[]>(mockUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Initialize the mediator
  useEffect(() => {
    mediator.registerObserver(new EmailNotificationObserver());
    mediator.registerObserver(new CalendarSyncObserver());
    mediator.loadAppointments(mockAppointments);
    updateAppointmentsList();
  }, []);
  
  // Update the local state from the mediator
  const updateAppointmentsList = () => {
    setAppointments(mediator.getAllAppointments());
  };
  
  // Create an appointment
  const createAppointment = (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { title, startTime, endTime, client, staff, type = "one-on-one" } = appointment;
    
    if (!staff) {
      toast({
        title: "Error creating appointment",
        description: "Staff member is required",
        variant: "destructive",
      });
      return;
    }
    
    const newAppointment = mediator.createAppointment(
      title, 
      startTime, 
      endTime, 
      client, 
      staff, 
      type as "one-on-one" | "group" | "recurring"
    );
    
    if (newAppointment) {
      toast({
        title: "Appointment created",
        description: `${format(startTime, "PPP")} at ${format(startTime, "p")}`,
      });
      updateAppointmentsList();
    } else {
      toast({
        title: "Error creating appointment",
        description: "There was a scheduling conflict",
        variant: "destructive",
      });
    }
  };
  
  // Update appointment status
  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    const updated = mediator.updateAppointmentStatus(id, status);
    
    if (updated) {
      toast({
        title: "Appointment updated",
        description: `Status changed to ${status}`,
      });
      updateAppointmentsList();
    } else {
      toast({
        title: "Error updating appointment",
        description: "Appointment not found",
        variant: "destructive",
      });
    }
  };
  
  // Cancel an appointment
  const cancelAppointment = (id: string) => {
    const cancelled = mediator.cancelAppointment(id);
    
    if (cancelled) {
      toast({
        title: "Appointment cancelled",
        description: `Appointment "${cancelled.title}" was cancelled`,
      });
      updateAppointmentsList();
    } else {
      toast({
        title: "Error cancelling appointment",
        description: "Appointment not found",
        variant: "destructive",
      });
    }
  };
  
  // Reschedule an appointment
  const rescheduleAppointment = (id: string, newStartTime: Date, newEndTime: Date) => {
    const rescheduled = mediator.rescheduleAppointment(id, newStartTime, newEndTime);
    
    if (rescheduled) {
      toast({
        title: "Appointment rescheduled",
        description: `Rescheduled to ${format(newStartTime, "PPP")} at ${format(newStartTime, "p")}`,
      });
      updateAppointmentsList();
    } else {
      toast({
        title: "Error rescheduling appointment",
        description: "There was a scheduling conflict or appointment not found",
        variant: "destructive",
      });
    }
  };
  
  // Get available time slots
  const getAvailableTimeSlots = (date: Date, duration: number, staffId?: string): TimeSlot[] => {
    const staff = staffId ? users.find(u => u.id === staffId && u.role === "staff") : undefined;
    const schedulingStrategy = new BasicSchedulingStrategy(appointments);
    return schedulingStrategy.findAvailableSlots(date, duration, staff);
  };
  
  const value = {
    appointments,
    users,
    selectedDate,
    setSelectedDate,
    createAppointment,
    updateAppointmentStatus,
    cancelAppointment,
    rescheduleAppointment,
    getAvailableTimeSlots,
    currentUser,
    setCurrentUser,
  };
  
  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};

// Hook for using the appointment context
export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  
  if (context === undefined) {
    throw new Error("useAppointments must be used within an AppointmentProvider");
  }
  
  return context;
};
