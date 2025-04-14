
import { useAppointments } from "@/contexts/AppointmentContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentCalendar from "./AppointmentCalendar";
import AppointmentList from "./AppointmentList";
import NewAppointmentForm from "./NewAppointmentForm";

const Dashboard = () => {
  const { currentUser } = useAppointments();

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="text-center max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-appointy-purple-dark">Welcome to Appointy</h2>
          <p className="text-gray-600">
            Please select a user from the top-right menu to access the appointment dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="schedule">Schedule New</TabsTrigger>
        </TabsList>
        <TabsContent value="appointments">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <AppointmentCalendar />
            </div>
            <div className="md:col-span-2">
              <AppointmentList />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="schedule">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <AppointmentCalendar />
            </div>
            <div className="md:col-span-2">
              <NewAppointmentForm />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
