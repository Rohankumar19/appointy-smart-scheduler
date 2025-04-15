
import { useState } from "react";
import { useAppointments } from "@/contexts/AppointmentContext";
import { Appointment } from "@/types/appointment";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface RescheduleFormProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
}

const RescheduleForm = ({ appointment, isOpen, onClose }: RescheduleFormProps) => {
  const { rescheduleAppointment } = useAppointments();
  const [date, setDate] = useState<Date>(new Date(appointment.startTime));
  const [title, setTitle] = useState(appointment.title);
  const [description, setDescription] = useState(appointment.description || "");
  const [location, setLocation] = useState(appointment.location || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Maintain the same duration as the original appointment
    const originalDuration = new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime();
    const newEndTime = new Date(date.getTime() + originalDuration);
    
    const success = rescheduleAppointment(appointment.id, date, newEndTime);
    
    if (success) {
      toast({
        title: "Appointment Rescheduled",
        description: `Successfully rescheduled to ${format(date, "PPP")} at ${format(date, "p")}`,
      });
      onClose();
    } else {
      toast({
        title: "Error",
        description: "Could not reschedule appointment. Please try a different time.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Modify the appointment details below
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Virtual or physical location"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional notes"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleForm;
