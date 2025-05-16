
import React, { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import Sidebar from "@/components/Sidebar/Sidebar";
import Header from "@/components/Header/Header";
import CalendarView from "@/components/Calendar/CalendarView";
import AppointmentForm from "@/components/Calendar/AppointmentForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Appointment, CalendarViewMode } from "@/types";
import { appointments as initialAppointments } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const Index = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | undefined>(undefined);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  
  const handleNewAppointment = () => {
    setCurrentAppointment(undefined);
    setShowAppointmentForm(true);
  };
  
  const handleAppointmentClick = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    setShowAppointmentDetails(true);
  };
  
  const handleEditAppointment = () => {
    setShowAppointmentDetails(false);
    setShowAppointmentForm(true);
  };
  
  const handleDeleteAppointment = () => {
    if (currentAppointment) {
      setAppointments(appointments.filter(a => a.id !== currentAppointment.id));
      setShowAppointmentDetails(false);
      toast.success("Appointment deleted successfully!");
    }
  };
  
  const handleAppointmentSubmit = (appointmentData: Partial<Appointment>) => {
    if (currentAppointment) {
      // Update existing appointment
      setAppointments(appointments.map(a => 
        a.id === currentAppointment.id ? { ...a, ...appointmentData } : a
      ));
    } else {
      // Add new appointment
      setAppointments([...appointments, appointmentData as Appointment]);
    }
    
    setShowAppointmentForm(false);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500";
      case "in-progress":
        return "bg-amber-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header appointments={appointments} />
        
        <div className="flex-1 p-6 overflow-auto">
          <CalendarView
            appointments={appointments}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onDateSelect={setSelectedDate}
            onNewAppointment={handleNewAppointment}
            onAppointmentClick={handleAppointmentClick}
          />
        </div>
      </div>
      
      {/* Appointment Form Dialog */}
      <Dialog open={showAppointmentForm} onOpenChange={setShowAppointmentForm}>
        <DialogContent className="max-w-2xl">
          <AppointmentForm 
            existingAppointment={currentAppointment}
            onSubmit={handleAppointmentSubmit}
            onCancel={() => setShowAppointmentForm(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Appointment Details Dialog */}
      <Dialog open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
        <DialogContent className="max-w-md">
          {currentAppointment && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm text-gray-500">
                    {format(new Date(currentAppointment.date), "EEEE, MMMM d, yyyy")}
                  </span>
                  <h2 className="text-xl font-bold">{currentAppointment.serviceType.charAt(0).toUpperCase() + currentAppointment.serviceType.slice(1)}</h2>
                </div>
                <div className={cn(
                  "px-2 py-1 text-xs text-white rounded-full",
                  getStatusColor(currentAppointment.status)
                )}>
                  {currentAppointment.status}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="font-medium">Service Details</h3>
                <p className="mt-1 text-gray-600">{currentAppointment.serviceDescription}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                    Priority: {currentAppointment.priority}
                  </span>
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                    Duration: {currentAppointment.estimatedDuration} min
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <h3 className="font-medium">Customer</h3>
                  <p className="text-gray-600">{currentAppointment.customer.name}</p>
                  <p className="text-xs text-gray-500">{currentAppointment.customer.address}</p>
                  <p className="text-xs text-gray-500">{currentAppointment.customer.phone}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Technician</h3>
                  <p className="text-gray-600">{currentAppointment.technician.name}</p>
                  <p className="text-xs text-gray-500">{currentAppointment.technician.level}</p>
                </div>
              </div>
              
              {currentAppointment.notes && (
                <div>
                  <h3 className="font-medium">Notes</h3>
                  <p className="text-gray-600 text-sm">{currentAppointment.notes}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm transition-colors"
                  onClick={handleDeleteAppointment}
                >
                  Delete
                </button>
                <button 
                  className="px-3 py-1 bg-hvac-blue text-white hover:bg-blue-600 rounded text-sm transition-colors"
                  onClick={handleEditAppointment}
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
