
import { useState } from "react";
import { useAppointments } from "@/contexts/AppointmentContext";
import { TimeSlot } from "@/types/appointment";
import { User } from "@/types/user";
import { format, addMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const NewAppointmentForm = () => {
  const { users, selectedDate, createAppointment, getAvailableTimeSlots, currentUser } = useAppointments();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [staff, setStaff] = useState<string>("");
  const [client, setClient] = useState<string>(currentUser?.role === "client" ? currentUser.id : "");
  const [duration, setDuration] = useState<number>(30);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  
  const staffMembers = users.filter(user => user.role === "staff");
  const clients = users.filter(user => user.role === "client");
  
  const handleFindSlots = () => {
    if (!staff) {
      toast({
        title: "Please select a staff member",
        description: "A staff member is required to find available time slots",
        variant: "destructive",
      });
      return;
    }
    
    const slots = getAvailableTimeSlots(selectedDate, duration, staff);
    setAvailableSlots(slots);
    setSelectedSlot(null);
  };
  
  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      toast({
        title: "Please select a time slot",
        description: "A time slot is required to create an appointment",
        variant: "destructive",
      });
      return;
    }
    
    if (!title) {
      toast({
        title: "Please enter a title",
        description: "A title is required for the appointment",
        variant: "destructive",
      });
      return;
    }
    
    if (!staff) {
      toast({
        title: "Please select a staff member",
        description: "A staff member is required for the appointment",
        variant: "destructive",
      });
      return;
    }
    
    if (!client) {
      toast({
        title: "Please select a client",
        description: "A client is required for the appointment",
        variant: "destructive",
      });
      return;
    }
    
    const selectedStaff = users.find(u => u.id === staff) as User;
    const selectedClient = users.find(u => u.id === client) as User;
    
    createAppointment({
      title,
      description,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      client: selectedClient,
      staff: selectedStaff,
      status: "pending",
      type: "one-on-one",
    });
    
    // Reset form
    setTitle("");
    setDescription("");
    setSelectedSlot(null);
    setAvailableSlots([]);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule New Appointment</CardTitle>
        <CardDescription>Fill in the details to create a new appointment</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Project Kickoff Meeting"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Provide any additional details"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff">Staff Member</Label>
              <Select value={staff} onValueChange={setStaff}>
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map(staffMember => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select 
                value={client} 
                onValueChange={setClient} 
                disabled={currentUser?.role === "client"}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full mt-4" 
            onClick={handleFindSlots}
          >
            Find Available Slots
          </Button>
          
          {availableSlots.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label>Available Time Slots</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto p-1">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    type="button"
                    variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                    className={`text-xs justify-start ${!slot.isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => slot.isAvailable && handleSlotSelect(slot)}
                    disabled={!slot.isAvailable}
                  >
                    {format(slot.startTime, "h:mm a")}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {selectedSlot && (
            <div className="p-3 border rounded-md bg-primary/5 mt-4">
              <h4 className="font-medium text-sm">Selected Slot</h4>
              <p className="text-sm mt-1">
                {format(selectedSlot.startTime, "h:mm a")} - {format(selectedSlot.endTime, "h:mm a")}
              </p>
            </div>
          )}
          
          <Button type="submit" className="w-full mt-6" disabled={!selectedSlot}>
            Schedule Appointment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewAppointmentForm;
