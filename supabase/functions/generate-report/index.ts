
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentData {
  id: string;
  title: string;
  description?: string;
  client_name: string;
  doctor_name: string;
  status: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the JWT from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the token
    const token = authHeader.replace("Bearer ", "");
    
    // Set the auth token for the client
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token or unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { appointmentId } = await req.json();
    
    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: "Appointment ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get appointment data
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id, title, description, status, start_time, end_time, notes,
        client:client_id(name),
        doctor:doctor_id(name, id)
      `)
      .eq('id', appointmentId)
      .single();
      
    if (appointmentError || !appointmentData) {
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if user is the doctor for this appointment
    if (appointmentData.doctor.id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Only the assigned doctor can generate reports for this appointment" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate report - in a real app this would use OpenAI or similar
    const report = generateMockReport({
      id: appointmentData.id,
      title: appointmentData.title,
      description: appointmentData.description,
      client_name: appointmentData.client.name,
      doctor_name: appointmentData.doctor.name,
      status: appointmentData.status,
      start_time: appointmentData.start_time,
      end_time: appointmentData.end_time,
      notes: appointmentData.notes
    });

    // Save report to database
    const { data: savedReport, error: reportError } = await supabase
      .from('reports')
      .insert({
        appointment_id: appointmentId,
        content: report,
        created_by: user.id
      })
      .select()
      .single();
      
    if (reportError) {
      return new Response(
        JSON.stringify({ error: "Failed to save report" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ report: savedReport }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Mock report generator - in a real app, this would use OpenAI
function generateMockReport(appointment: AppointmentData): string {
  const appointmentDate = new Date(appointment.start_time);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const reportTemplate = `
# Medical Report
## Appointment Details
- **Date**: ${formattedDate}
- **Time**: ${appointmentDate.toLocaleTimeString('en-US')}
- **Patient**: ${appointment.client_name}
- **Doctor**: ${appointment.doctor_name}
- **Title**: ${appointment.title}
${appointment.description ? `- **Purpose**: ${appointment.description}` : ''}

## Assessment
Based on the appointment ${appointment.notes ? `notes: "${appointment.notes}"` : ''}, the patient appears to be in ${Math.random() > 0.5 ? 'good' : 'stable'} condition. 

## Diagnosis
After careful examination, the diagnosis is ${['Common Cold', 'Seasonal Allergy', 'Minor Sprain', 'Routine Checkup - No Issues', 'Vitamin Deficiency'][Math.floor(Math.random() * 5)]}.

## Recommendations
1. ${['Rest for 2-3 days', 'Increase fluid intake', 'Regular exercise', 'Follow up in 2 weeks', 'Take prescribed medication as directed'][Math.floor(Math.random() * 5)]}
2. ${['Avoid strenuous activities', 'Maintain a balanced diet', 'Monitor symptoms for changes', 'Apply ice to affected area', 'Get adequate sleep'][Math.floor(Math.random() * 5)]}
3. ${['Schedule a follow-up appointment', 'Complete blood work within 7 days', 'No follow-up needed at this time', 'See specialist if symptoms persist', 'Return if condition worsens'][Math.floor(Math.random() * 5)]}

This report was generated automatically based on appointment data.
`;

  return reportTemplate;
}
