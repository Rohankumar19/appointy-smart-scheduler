import { useState } from "react";
import { useAppointments } from "@/contexts/AppointmentContext";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { Edit2, Calendar, Clock, MapPin, User, MoreVertical, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RescheduleForm from "./RescheduleForm";
import { useToast } from "@/hooks/use-toast";

const AppointmentList = () => {
  const { appointments, selectedDate, updateAppointmentStatus, cancelAppointment, currentUser } = useAppointments();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();

  // Filter appointments for the selected date
  const todaysAppointments = appointments.filter(
    appointment => isSameDay(new Date(appointment.startTime), selectedDate)
  );

  const getStatusBadgeVariant = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return "success";
      case "cancelled":
        return "destructive";
      case "completed":
        return "secondary";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    updateAppointmentStatus(id, status);
  };

  const handleCancel = (id: string) => {
    cancelAppointment(id);
  };

  const canManageAppointment = (appointment: Appointment) => {
    if (!currentUser) return false;
    return (
      currentUser.id === appointment.client.id || // Client who booked
      (currentUser.role === "staff" && appointment.staff?.id === currentUser.id) // Staff assigned to appointment
    );
  };

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = 
    useState<Appointment | null>(null);

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointmentForReschedule(appointment);
    setIsRescheduleOpen(true);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Appointments for {format(selectedDate, "MMMM d, yyyy")}
      </h2>
      
      {todaysAppointments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No appointments scheduled for today.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {todaysAppointments.map((appointment) => (
            <Card key={appointment.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {appointment.title}
                    </CardTitle>
                    <CardDescription>
                      {appointment.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={getStatusBadgeVariant(appointment.status) as any}
                    className={`${
                      appointment.status === "cancelled" ? "text-destructive bg-destructive/10" : 
                      appointment.status === "confirmed" ? "text-green-700 bg-green-100" : 
                      appointment.status === "completed" ? "text-secondary-foreground bg-secondary" : 
                      "text-yellow-700 bg-yellow-100"
                    }`}
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(appointment.startTime, "h:mm a")} - {format(appointment.endTime, "h:mm a")}
                    </span>
                  </div>
                  {appointment.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.client.name}</span>
                  </div>
                  {appointment.staff && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.staff.name} (Staff)</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-4">
                  {canManageAppointment(appointment) ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => handleViewDetails(appointment)}
                      >
                        <Edit2 className="h-3 w-3" />
                        View Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {appointment.status !== "confirmed" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, "confirmed")}>
                              <Check className="h-4 w-4 mr-2" />
                              Confirm
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleReschedule(appointment)}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Reschedule
                          </DropdownMenuItem>
                          {appointment.status !== "cancelled" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCancel(appointment.id)} className="text-destructive">
                                <X className="h-4 w-4 mr-2" />
                                Cancel Appointment
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      You don't have permission to manage this appointment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {selectedAppointment && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedAppointment.title}</DialogTitle>
              <DialogDescription>
                {selectedAppointment.description || "No description provided"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{format(selectedAppointment.startTime, "MMMM d, yyyy")}</span>
                </div>
                <Badge 
                  variant={getStatusBadgeVariant(selectedAppointment.status) as any}
                  className={`${
                    selectedAppointment.status === "cancelled" ? "text-destructive bg-destructive/10" : 
                    selectedAppointment.status === "confirmed" ? "text-green-700 bg-green-100" : 
                    selectedAppointment.status === "completed" ? "text-secondary-foreground bg-secondary" : 
                    "text-yellow-700 bg-yellow-100"
                  }`}
                >
                  {selectedAppointment.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>{format(selectedAppointment.startTime, "h:mm a")} - {format(selectedAppointment.endTime, "h:mm a")}</span>
              </div>
              {selectedAppointment.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{selectedAppointment.location}</span>
                </div>
              )}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Participants</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{selectedAppointment.client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedAppointment.client.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedAppointment.client.email}</p>
                    </div>
                  </div>
                  {selectedAppointment.staff && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{selectedAppointment.staff.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{selectedAppointment.staff.name} (Staff)</p>
                        <p className="text-xs text-muted-foreground">{selectedAppointment.staff.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-2 sm:justify-start">
              {selectedAppointment.status !== "cancelled" && (
                <Button variant="destructive" size="sm" onClick={() => {
                  handleCancel(selectedAppointment.id);
                  setIsDialogOpen(false);
                }}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
              {selectedAppointment.status !== "confirmed" && selectedAppointment.status !== "cancelled" && (
                <Button variant="default" size="sm" onClick={() => {
                  handleStatusChange(selectedAppointment.id, "confirmed");
                  setIsDialogOpen(false);
                }}>
                  <Check className="h-4 w-4 mr-1" />
                  Confirm
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedAppointmentForReschedule && (
        <RescheduleForm
          appointment={selectedAppointmentForReschedule}
          isOpen={isRescheduleOpen}
          onClose={() => {
            setIsRescheduleOpen(false);
            setSelectedAppointmentForReschedule(null);
          }}
        />
      )}
    </div>
  );
};

export default AppointmentList;
