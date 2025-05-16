
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon } from "lucide-react";

import { Appointment, Customer, Technician, ServiceType, ServicePriority, TimeSlot } from "@/types";
import { customers, technicians } from "@/lib/mockData";
import { getAITechnicianRecommendations } from "@/lib/aiRecommendations";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  serviceType: z.enum(["installation", "maintenance", "repair", "inspection"]),
  serviceDescription: z.string().min(5, "Description is required"),
  priority: z.enum(["low", "normal", "high", "emergency"]),
  date: z.date({ required_error: "Date is required" }),
  timeSlot: z.enum(["morning", "afternoon", "evening"]),
  technicianId: z.string().min(1, "Technician is required"),
  estimatedDuration: z.number().min(15).max(480),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AppointmentFormProps {
  existingAppointment?: Appointment;
  onSubmit: (appointment: Partial<Appointment>) => void;
  onCancel: () => void;
}

export default function AppointmentForm({
  existingAppointment,
  onSubmit,
  onCancel
}: AppointmentFormProps) {
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<any[]>([]);
  
  const isEditing = !!existingAppointment;
  
  // Initialize the form with default values or existing appointment values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: existingAppointment
      ? {
          customerId: existingAppointment.customerId,
          serviceType: existingAppointment.serviceType,
          serviceDescription: existingAppointment.serviceDescription,
          priority: existingAppointment.priority,
          date: new Date(existingAppointment.date),
          timeSlot: existingAppointment.timeSlot,
          technicianId: existingAppointment.technicianId,
          estimatedDuration: existingAppointment.estimatedDuration,
          notes: existingAppointment.notes || "",
        }
      : {
          customerId: "",
          serviceType: "maintenance",
          serviceDescription: "",
          priority: "normal",
          date: new Date(),
          timeSlot: "morning",
          technicianId: "",
          estimatedDuration: 60,
          notes: "",
        },
  });
  
  const watchServiceType = form.watch("serviceType") as ServiceType;
  const watchDate = form.watch("date");
  const watchTimeSlot = form.watch("timeSlot") as TimeSlot;
  
  // Update estimated duration based on service type
  useEffect(() => {
    const duration = 
      watchServiceType === 'installation' ? 180 : 
      watchServiceType === 'repair' ? 120 : 
      watchServiceType === 'maintenance' ? 60 : 45;
    
    form.setValue("estimatedDuration", duration);
  }, [watchServiceType, form]);
  
  // Get AI recommendations when service type, date, or time slot changes
  useEffect(() => {
    if (watchServiceType && watchDate && watchTimeSlot) {
      const dateString = format(watchDate, "yyyy-MM-dd");
      const recommendations = getAITechnicianRecommendations(
        watchServiceType,
        dateString,
        watchTimeSlot
      );
      setAIRecommendations(recommendations);
    }
  }, [watchServiceType, watchDate, watchTimeSlot]);
  
  const handleFormSubmit = (values: FormValues) => {
    // Find the selected customer and technician
    const customer = customers.find(c => c.id === values.customerId)!;
    const technician = technicians.find(t => t.id === values.technicianId)!;
    
    // Create the appointment object
    const appointment: Partial<Appointment> = {
      ...values,
      id: existingAppointment?.id || `appt-${Date.now()}`,
      date: format(values.date, "yyyy-MM-dd"),
      customer,
      technician,
      status: existingAppointment?.status || "scheduled",
    };
    
    onSubmit(appointment);
    toast.success(`Appointment ${isEditing ? 'updated' : 'scheduled'} successfully!`);
  };
  
  const handleAIRecommendation = (techId: string) => {
    form.setValue("technicianId", techId);
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Appointment" : "Schedule New Appointment"}</CardTitle>
      </CardHeader>
      
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer</Label>
            <Select 
              defaultValue={form.getValues().customerId}
              onValueChange={value => form.setValue("customerId", value)}
            >
              <SelectTrigger id="customerId" className="w-full">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.customerId && (
              <span className="text-xs text-red-500">
                {form.formState.errors.customerId.message}
              </span>
            )}
          </div>
          
          {/* Service Type */}
          <div className="space-y-2">
            <Label>Service Type</Label>
            <RadioGroup 
              defaultValue={form.getValues().serviceType}
              onValueChange={value => form.setValue("serviceType", value as ServiceType)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="installation" id="installation" />
                <Label htmlFor="installation">Installation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="maintenance" id="maintenance" />
                <Label htmlFor="maintenance">Maintenance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="repair" id="repair" />
                <Label htmlFor="repair">Repair</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inspection" id="inspection" />
                <Label htmlFor="inspection">Inspection</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Service Description */}
          <div className="space-y-2">
            <Label htmlFor="serviceDescription">Description</Label>
            <Textarea 
              id="serviceDescription"
              placeholder="Describe the service needed"
              {...form.register("serviceDescription")}
            />
            {form.formState.errors.serviceDescription && (
              <span className="text-xs text-red-500">
                {form.formState.errors.serviceDescription.message}
              </span>
            )}
          </div>
          
          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <RadioGroup 
              defaultValue={form.getValues().priority}
              onValueChange={value => form.setValue("priority", value as ServicePriority)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low">Low</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal">Normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high">High</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="emergency" id="emergency" />
                <Label htmlFor="emergency">Emergency</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.getValues().date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.getValues().date ? (
                    format(form.getValues().date, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.getValues().date}
                  onSelect={(date) => date && form.setValue("date", date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time Slot */}
          <div className="space-y-2">
            <Label>Time Slot</Label>
            <Select 
              defaultValue={form.getValues().timeSlot}
              onValueChange={value => form.setValue("timeSlot", value as TimeSlot)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a time slot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (8:00 AM - 12:00 PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12:00 PM - 4:00 PM)</SelectItem>
                <SelectItem value="evening">Evening (4:00 PM - 8:00 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* AI Recommendations */}
          <div>
            <div className="flex items-center justify-between">
              <Label>Technician</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowAIRecommendations(!showAIRecommendations)}
              >
                {showAIRecommendations ? "Hide" : "Show"} AI Recommendations
              </Button>
            </div>
            
            {showAIRecommendations && aiRecommendations.length > 0 && (
              <div className="mt-2 mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                <h4 className="font-medium text-sm mb-2">AI Recommended Technicians</h4>
                <div className="space-y-2">
                  {aiRecommendations.map((rec) => (
                    <div key={rec.technicianId} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{rec.technicianName}</div>
                        <div className="text-xs text-gray-500">{rec.reason}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-medium">Score: {rec.score}%</div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAIRecommendation(rec.technicianId)}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Technician Select */}
            <Select 
              defaultValue={form.getValues().technicianId}
              onValueChange={value => form.setValue("technicianId", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((technician) => (
                  <SelectItem key={technician.id} value={technician.id}>
                    {technician.name} ({technician.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.technicianId && (
              <span className="text-xs text-red-500">
                {form.formState.errors.technicianId.message}
              </span>
            )}
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea 
              id="notes"
              placeholder="Any additional information"
              {...form.register("notes")}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update Appointment" : "Schedule Appointment"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
