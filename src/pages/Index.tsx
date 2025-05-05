
import { useEffect } from "react";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import { useAppointments } from "@/contexts/AppointmentContext";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const { users, setCurrentUser } = useAppointments();

  useEffect(() => {
    // Demo helper - toast instructions for first time users
    toast({
      title: "Welcome to Appointy",
      description: "Select a user from the top-right menu to get started. Try the premium features!",
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <Dashboard />
      </main>
      <footer className="bg-white border-t py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          Appointy Smart Scheduler &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Index;
