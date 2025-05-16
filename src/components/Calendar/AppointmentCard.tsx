
import React from "react";
import { Appointment } from "@/types";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  User 
} from "lucide-react";

interface AppointmentCardProps {
  appointment: Appointment;
  isCompact?: boolean;
  onClick?: () => void;
}

export default function AppointmentCard({ 
  appointment, 
  isCompact = false,
  onClick
}: AppointmentCardProps) {
  const {
    serviceType,
    serviceDescription,
    customer,
    technician,
    priority,
    timeSlot,
    status
  } = appointment;
  
  // Determine background color based on service type and priority
  const getBgColor = () => {
    if (status === "cancelled") return "bg-gray-200";
    
    if (priority === "emergency") return "bg-red-100 border-red-300";
    if (priority === "high") return "bg-amber-100 border-amber-300";
    
    switch (serviceType) {
      case "installation":
        return "bg-blue-100 border-blue-300";
      case "repair":
        return "bg-orange-100 border-orange-300";
      case "maintenance":
        return "bg-green-100 border-green-300";
      case "inspection":
        return "bg-purple-100 border-purple-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };
  
  // Status indicator
  const StatusIndicator = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      default:
        return <Calendar className="h-4 w-4 text-hvac-blue" />;
    }
  };
  
  // Time slot display
  const getTimeDisplay = () => {
    switch (timeSlot) {
      case "morning":
        return "8:00 AM - 12:00 PM";
      case "afternoon":
        return "12:00 PM - 4:00 PM";
      case "evening":
        return "4:00 PM - 8:00 PM";
      default:
        return "";
    }
  };
  
  // Service type display
  const getServiceTypeDisplay = () => {
    return serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
  };
  
  if (isCompact) {
    return (
      <div 
        className={cn(
          "px-2 py-1 text-xs border rounded cursor-pointer hover:opacity-80 transition-opacity",
          getBgColor()
        )}
        onClick={onClick}
      >
        <div className="font-semibold truncate">{customer.name}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <StatusIndicator />
          <span>{getServiceTypeDisplay()}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "p-3 border rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow",
        getBgColor()
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{getServiceTypeDisplay()}</h3>
        <div className="flex items-center gap-1">
          <StatusIndicator />
          <span className="text-sm">{status}</span>
        </div>
      </div>
      
      <p className="text-sm mb-2 line-clamp-2">{serviceDescription}</p>
      
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span>{customer.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{getTimeDisplay()}</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
          Technician: {technician.name}
        </div>
      </div>
    </div>
  );
}
