
import React, { useState, useEffect } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { Calculator, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { getAITechnicianRecommendations } from "@/lib/aiRecommendations";
import { Appointment, ServiceType, TimeSlot, Technician } from "@/types";
import { technicians } from "@/lib/mockData";

interface SmartSchedulerProps {
  appointments: Appointment[];
  onSchedule: (appointmentData: Partial<Appointment>) => void;
}

export default function SmartScheduler({ appointments, onSchedule }: SmartSchedulerProps) {
  const [serviceType, setServiceType] = useState<ServiceType>("maintenance");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "emergency">("normal");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("morning");
  const [aiSuggestions, setAiSuggestions] = useState<{
    dates: { date: Date; score: number }[];
    technicians: { tech: Technician; score: number }[];
  } | null>(null);
  
  // Function to get optimal scheduling suggestions
  const generateSmartSuggestions = () => {
    if (!serviceType || !date) return;
    
    // Get date suggestions (simulated AI logic)
    const dateSuggestions: { date: Date; score: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const suggestedDate = addDays(new Date(), i);
      // Calculate a "score" based on existing appointments that day
      // Higher score = better day to schedule
      const appointmentsOnDay = appointments.filter(a => 
        isSameDay(new Date(a.date), suggestedDate)
      );
      
      // Basic scoring algorithm - fewer appointments = higher score
      let dateScore = 100 - (appointmentsOnDay.length * 15);
      
      // Bonus for weekdays vs weekends
      const day = suggestedDate.getDay();
      if (day > 0 && day < 6) dateScore += 10;
      
      // Cap score between 0-100
      dateScore = Math.max(0, Math.min(100, dateScore));
      
      dateSuggestions.push({
        date: suggestedDate,
        score: dateScore
      });
    }
    
    // Sort by score (highest first)
    dateSuggestions.sort((a, b) => b.score - a.score);
    
    // Get technician suggestions based on service type
    const formattedDate = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
    const techRecommendations = getAITechnicianRecommendations(serviceType, formattedDate, timeSlot);
    
    // Format technician recommendations
    const techSuggestions = techRecommendations.map(rec => {
      const tech = technicians.find(t => t.id === rec.technicianId);
      return {
        tech: tech!,
        score: rec.score
      };
    });
    
    setAiSuggestions({
      dates: dateSuggestions.slice(0, 3), // Top 3 date suggestions
      technicians: techSuggestions.slice(0, 3) // Top 3 technician suggestions
    });
  };
  
  // Update suggestions when inputs change
  useEffect(() => {
    if (serviceType && date) {
      generateSmartSuggestions();
    }
  }, [serviceType, date, timeSlot, appointments]);
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  const handleQuickSchedule = (suggestedDate: Date, techId: string) => {
    const tech = technicians.find(t => t.id === techId);
    if (!tech || !date) return;
    
    // Create partial appointment data
    const appointmentData: Partial<Appointment> = {
      serviceType,
      priority,
      date: format(suggestedDate, "yyyy-MM-dd"),
      timeSlot,
      technicianId: tech.id,
      estimatedDuration: 
        serviceType === 'installation' ? 180 : 
        serviceType === 'repair' ? 120 : 
        serviceType === 'maintenance' ? 60 : 45,
    };
    
    onSchedule(appointmentData);
    toast.success("Smart appointment scheduled!");
  };
  
  return (
    <div className="w-full">
      <CardHeader>
        <CardTitle>Smart Scheduling Assistant</CardTitle>
        <CardDescription>
          Our AI will analyze workloads, technician skills, and location data to find the optimal scheduling options.
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="options">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="options">Scheduling Options</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="options" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <RadioGroup 
                  defaultValue={serviceType}
                  onValueChange={value => setServiceType(value as ServiceType)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="installation" id="smart-installation" />
                    <Label htmlFor="smart-installation">Installation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maintenance" id="smart-maintenance" />
                    <Label htmlFor="smart-maintenance">Maintenance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="repair" id="smart-repair" />
                    <Label htmlFor="smart-repair">Repair</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inspection" id="smart-inspection" />
                    <Label htmlFor="smart-inspection">Inspection</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label>Priority</Label>
                <RadioGroup 
                  defaultValue={priority}
                  onValueChange={value => setPriority(value as "low" | "normal" | "high" | "emergency")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="smart-low" />
                    <Label htmlFor="smart-low">Low</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="smart-normal" />
                    <Label htmlFor="smart-normal">Normal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="smart-high" />
                    <Label htmlFor="smart-high">High</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="emergency" id="smart-emergency" />
                    <Label htmlFor="smart-emergency">Emergency</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Preferred Time</Label>
                <RadioGroup 
                  defaultValue={timeSlot}
                  onValueChange={value => setTimeSlot(value as TimeSlot)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="morning" id="smart-morning" />
                    <Label htmlFor="smart-morning">Morning (8AM-12PM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="afternoon" id="smart-afternoon" />
                    <Label htmlFor="smart-afternoon">Afternoon (12PM-4PM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="evening" id="smart-evening" />
                    <Label htmlFor="smart-evening">Evening (4PM-8PM)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button 
                className="w-full mt-2" 
                onClick={generateSmartSuggestions}
              >
                Generate AI Suggestions
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="suggestions" className="pt-4">
          {aiSuggestions ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Recommended Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {aiSuggestions.dates.map((dateOption, idx) => (
                    <Card key={idx} className={cn(
                      "cursor-pointer transition-all",
                      dateOption.score > 80 ? "border-green-300" : 
                      dateOption.score > 60 ? "border-yellow-300" : "border-gray-200"
                    )}>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-base">{format(dateOption.date, "EEE, MMM d")}</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 px-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Optimality</span>
                          <Badge variant={dateOption.score > 80 ? "default" : "secondary"}>
                            {dateOption.score}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Recommended Technicians</h3>
                <div className="grid grid-cols-1 gap-3">
                  {aiSuggestions.technicians.map((techOption, idx) => (
                    <Card key={idx} className="cursor-pointer transition-all">
                      <div className="flex items-center p-4">
                        <div className="flex-1">
                          <h4 className="font-medium">{techOption.tech.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{techOption.tech.level} • {techOption.tech.specialties.join(", ")}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={techOption.score > 80 ? "default" : "secondary"}>
                            {techOption.score}% match
                          </Badge>
                          <Button size="sm" onClick={() => date && handleQuickSchedule(date, techOption.tech.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Select
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">
                Enter your preferences and click "Generate AI Suggestions" to see recommendations
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between pt-4 mt-4">
        <Button variant="outline">
          Cancel
        </Button>
        <Button>
          Done
        </Button>
      </CardFooter>
    </div>
  );
}
