
import React, { createContext, useContext, useState, useEffect } from "react";
import { AppointmentMediator } from "@/services/appointmentMediator";
import { AppointmentStatus, Appointment, TimeSlot } from "@/types/appointment";
import { User } from "@/types/user";
import { EmailNotificationObserver, CalendarSyncObserver } from "@/services/appointmentObserver";
import { BasicSchedulingStrategy } from "@/services/schedulingStrategies";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

// Context type
interface AppointmentContextType {
  appointments: Appointment[];
  users: User[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  createAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  cancelAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, newStartTime: Date, newEndTime: Date) => boolean; // Changed to return boolean
  getAvailableTimeSlots: (date: Date, duration: number, staffId?: string) => TimeSlot[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

// Create the context
const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

// Provider component
export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mediator] = useState(() => new AppointmentMediator());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { user } = useAuth();
  
  // Initialize the mediator
  useEffect(() => {
    mediator.registerObserver(new EmailNotificationObserver());
    mediator.registerObserver(new CalendarSyncObserver());
    
    // Load users and appointments when authenticated
    if (user) {
      fetchUsers();
      fetchAppointments();
    }
  }, [user]);
  
  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      if (profiles) {
        const mappedUsers = profiles.map((profile): User => ({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as any,
          avatar: profile.avatar_url
        }));
        
        setUsers(mappedUsers);
        
        // Find and set current user
        const loggedInUser = mappedUsers.find(u => u.id === user?.id) || null;
        setCurrentUser(loggedInUser);
        
        return mappedUsers;
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error fetching users",
        description: "There was a problem loading user data",
        variant: "destructive",
      });
    }
    
    return [];
  };
  
  // Fetch appointments from Supabase
  const fetchAppointments = async () => {
    try {
      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:client_id(id, name, email, avatar_url, role),
          doctor:doctor_id(id, name, email, avatar_url, role)
        `);
        
      if (error) {
        throw error;
      }
      
      if (appointmentData) {
        const mappedAppointments = appointmentData.map((appt): Appointment => ({
          id: appt.id,
          title: appt.title,
          description: appt.description || undefined,
          startTime: new Date(appt.start_time),
          endTime: new Date(appt.end_time),
          client: {
            id: appt.client.id,
            name: appt.client.name,
            email: appt.client.email,
            role: appt.client.role as any,
            avatar: appt.client.avatar_url
          },
          staff: appt.doctor ? {
            id: appt.doctor.id,
            name: appt.doctor.name,
            email: appt.doctor.email,
            role: appt.doctor.role as any,
            avatar: appt.doctor.avatar_url
          } : undefined,
          status: appt.status as AppointmentStatus,
          type: appt.type as any,
          location: appt.location || undefined,
          notes: appt.notes || undefined,
          createdAt: new Date(appt.created_at),
          updatedAt: new Date(appt.updated_at)
        }));
        
        setAppointments(mappedAppointments);
        mediator.loadAppointments(mappedAppointments);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error fetching appointments",
        description: "There was a problem loading appointment data",
        variant: "destructive",
      });
    }
  };
  
  // Create an appointment
  const createAppointment = async (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { title, startTime, endTime, client, staff, type = "one-on-one", status, location, description } = appointment;
      
      if (!staff) {
        toast({
          title: "Error creating appointment",
          description: "Staff member is required",
          variant: "destructive",
        });
        return;
      }
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          title,
          description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          client_id: client.id,
          doctor_id: staff.id,
          status,
          type,
          location
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data[0]) {
        toast({
          title: "Appointment created",
          description: `${format(startTime, "PPP")} at ${format(startTime, "p")}`,
        });
        
        // Refresh appointments
        fetchAppointments();
      }
    } catch (error: any) {
      toast({
        title: "Error creating appointment",
        description: error.message || "There was an error creating the appointment",
        variant: "destructive",
      });
    }
  };
  
  // Update appointment status
  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Appointment updated",
        description: `Status changed to ${status}`,
      });
      
      // Refresh appointments
      fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error updating appointment",
        description: error.message || "Appointment not found",
        variant: "destructive",
      });
    }
  };
  
  // Cancel an appointment
  const cancelAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Appointment cancelled",
        description: "The appointment was successfully cancelled",
      });
      
      // Refresh appointments
      fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error cancelling appointment",
        description: error.message || "Appointment not found",
        variant: "destructive",
      });
    }
  };
  
  // Reschedule an appointment
  const rescheduleAppointment = (id: string, newStartTime: Date, newEndTime: Date): boolean => {
    try {
      const rescheduled = mediator.rescheduleAppointment(id, newStartTime, newEndTime);
      
      if (rescheduled) {
        // Update in Supabase
        supabase
          .from('appointments')
          .update({ 
            start_time: newStartTime.toISOString(),
            end_time: newEndTime.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.error("Error updating appointment in database:", error);
              return false;
            }
            
            toast({
              title: "Appointment rescheduled",
              description: `Rescheduled to ${format(newStartTime, "PPP")} at ${format(newStartTime, "p")}`,
            });
            
            // Refresh appointments
            fetchAppointments();
            return true;
          });
          
        return true;
      } else {
        toast({
          title: "Error rescheduling appointment",
          description: "There was a scheduling conflict or appointment not found",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error in rescheduleAppointment:", error);
      return false;
    }
  };
  
  // Get available time slots
  const getAvailableTimeSlots = (date: Date, duration: number, staffId?: string): TimeSlot[] => {
    const staff = staffId ? users.find(u => u.id === staffId && u.role === "staff" || u.role === "doctor") : undefined;
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
