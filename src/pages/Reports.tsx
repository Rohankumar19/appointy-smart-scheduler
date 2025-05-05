
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { FilePlus, Download, Clock, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Appointment } from "@/types/appointment";

interface Report {
  id: string;
  appointment_id: string;
  content: string;
  generated_at: string;
  created_by: string;
  appointment?: {
    title: string;
    client: {
      name: string;
    };
  };
}

const ReportsPage = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
    fetchReports();
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, title, start_time, client:client_id(name), status
        `)
        .order('start_time', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    }
  };

  const fetchReports = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id, appointment_id, content, generated_at, created_by,
          appointment:appointment_id(title, client:client_id(name))
        `)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedAppointment) {
      toast({
        title: "No appointment selected",
        description: "Please select an appointment to generate a report",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("generate-report", {
        body: { appointmentId: selectedAppointment },
      });

      if (response.error) {
        throw new Error(response.error.message || "Error generating report");
      }

      toast({
        title: "Report Generated",
        description: "The appointment report has been created successfully",
      });

      // Refresh reports list
      fetchReports();
      setSelectedAppointment("");
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (report: Report) => {
    const element = document.createElement("a");
    const file = new Blob([report.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Report-${report.id}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 container mx-auto p-4">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Patient Reports</h1>
          <p className="text-muted-foreground">
            Generate and view medical reports for appointments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>
                Select an appointment to create a detailed report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Appointment</label>
                  <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an appointment" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointments.map((appointment) => (
                        <SelectItem key={appointment.id} value={appointment.id}>
                          {appointment.title} - {appointment.client.name} ({format(new Date(appointment.start_time), "MMM d, yyyy")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={generateReport} 
                disabled={!selectedAppointment || generating}
                className="w-full"
              >
                <FilePlus className="mr-2 h-4 w-4" /> 
                {generating ? "Generating..." : "Generate Report"}
              </Button>
            </CardFooter>
          </Card>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Available Reports</CardTitle>
                <CardDescription>
                  Review and download previously generated reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading reports...</p>
                  </div>
                ) : reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <Card key={report.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold mb-1">
                                {report.appointment?.title || "Appointment Report"}
                              </h3>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <User className="mr-2 h-3.5 w-3.5" />
                                  Patient: {report.appointment?.client.name || "Unknown"}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="mr-2 h-3.5 w-3.5" />
                                  Generated: {format(new Date(report.generated_at), "MMM d, yyyy")}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="mr-2 h-3.5 w-3.5" />
                                  Time: {format(new Date(report.generated_at), "h:mm a")}
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => downloadReport(report)}
                            >
                              <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FilePlus className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                    <h3 className="mt-4 text-lg font-medium">No reports available</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Generate your first report by selecting an appointment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
