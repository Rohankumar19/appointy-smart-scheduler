
import { useState } from "react";
import { useAppointments } from "@/contexts/AppointmentContext";
import { CalendarView } from "@/types/appointment";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AppointmentCalendar = () => {
  const { selectedDate, setSelectedDate, appointments } = useAppointments();
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Find days with appointments
  const appointmentDates = appointments.map(appointment => 
    new Date(appointment.startTime.getFullYear(), appointment.startTime.getMonth(), appointment.startTime.getDate())
  );

  // Create an array of unique dates
  const uniqueDatesWithAppointments = [...new Set(
    appointmentDates.map(date => date.toISOString().split('T')[0])
  )];

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Calendar</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePreviousMonth} 
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <div className="text-sm font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && setSelectedDate(date)}
        modifiers={{
          hasAppointment: (date) => uniqueDatesWithAppointments.includes(
            date.toISOString().split('T')[0]
          ),
        }}
        modifiersClassNames={{
          hasAppointment: "bg-primary/20 text-primary font-semibold",
        }}
        className="rounded-md border"
        month={currentMonth}
        onMonthChange={setCurrentMonth}
      />
    </div>
  );
};

export default AppointmentCalendar;
