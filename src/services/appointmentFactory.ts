
import { Appointment, AppointmentType } from "@/types/appointment";
import { User } from "@/types/user";

// Factory Pattern for creating different types of appointments
export class AppointmentFactory {
  createOneOnOneAppointment(
    id: string,
    title: string,
    startTime: Date,
    endTime: Date,
    client: User,
    staff: User
  ): Appointment {
    return {
      id,
      title,
      startTime,
      endTime,
      client,
      staff,
      status: "pending",
      type: "one-on-one",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  createGroupAppointment(
    id: string,
    title: string,
    startTime: Date,
    endTime: Date,
    clients: User[],
    staff: User
  ): Appointment & { clients: User[] } {
    return {
      id,
      title,
      startTime,
      endTime,
      client: clients[0], // Main client
      clients, // All clients
      staff,
      status: "pending",
      type: "group",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  createRecurringAppointment(
    id: string,
    title: string,
    startTime: Date,
    endTime: Date,
    client: User,
    staff: User,
    recurrencePattern: string
  ): Appointment & { recurrencePattern: string } {
    return {
      id,
      title,
      startTime,
      endTime,
      client,
      staff,
      status: "pending",
      type: "recurring",
      recurrencePattern, // e.g., "weekly", "bi-weekly", "monthly"
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
