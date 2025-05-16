
import React, { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Appointment, CalendarDay, CalendarViewMode } from "@/types";
import AppointmentCard from "./AppointmentCard";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  appointments: Appointment[];
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onDateSelect: (date: Date) => void;
  onNewAppointment: () => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

export default function CalendarView({
  appointments,
  viewMode,
  onViewModeChange,
  onDateSelect,
  onNewAppointment,
  onAppointmentClick
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  // Generate days for month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    }).map(day => {
      return {
        date: day,
        isCurrentMonth: isSameMonth(day, currentDate),
        isToday: isSameDay(day, new Date()),
        appointments: appointments.filter(appointment => 
          isSameDay(new Date(appointment.date), day)
        )
      };
    });
  }, [currentDate, appointments]);
  
  // Generate days for week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    return Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(weekStart, index);
      return {
        date: day,
        isCurrentMonth: isSameMonth(day, currentDate),
        isToday: isSameDay(day, new Date()),
        appointments: appointments.filter(appointment => 
          isSameDay(new Date(appointment.date), day)
        )
      };
    });
  }, [currentDate, appointments]);
  
  // Get appointments for the selected day
  const dayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.date), selectedDate)
    );
  }, [selectedDate, appointments]);
  
  const navigatePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };
  
  const navigateNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };
  
  const handleDayClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    onDateSelect(day.date);
  };
  
  // Render month view
  const renderMonthView = () => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    return (
      <div>
        {/* Weekday headers */}
        <div className="calendar-grid mb-1 bg-gray-50 rounded-t">
          {weekdays.map((day, index) => (
            <div key={index} className="calendar-day-header">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="calendar-grid">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                "calendar-day border-t border-l",
                index % 7 === 6 && "border-r",
                index >= calendarDays.length - 7 && "border-b",
                !day.isCurrentMonth && "bg-gray-50",
                day.isToday && "bg-blue-50",
                selectedDate && isSameDay(day.date, selectedDate) && "ring-2 ring-hvac-blue ring-inset",
                "overflow-hidden"
              )}
              onClick={() => handleDayClick(day)}
            >
              <div className={cn(
                "text-right p-1 text-sm",
                !day.isCurrentMonth && "text-gray-400"
              )}>
                {format(day.date, "d")}
              </div>
              <div className="calendar-day-content">
                {day.appointments.slice(0, 2).map(appointment => (
                  <div key={appointment.id} className="mb-1">
                    <AppointmentCard 
                      appointment={appointment} 
                      isCompact
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appointment);
                      }}
                    />
                  </div>
                ))}
                {day.appointments.length > 2 && (
                  <div className="text-xs text-center text-gray-500 font-medium">
                    +{day.appointments.length - 2} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render week view
  const renderWeekView = () => {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    return (
      <div className="flex flex-col h-[32rem] overflow-auto">
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day, index) => (
            <div 
              key={index} 
              className={cn(
                "p-2 text-center border-r last:border-r-0",
                day.isToday && "bg-blue-50",
                selectedDate && isSameDay(day.date, selectedDate) && "bg-blue-100"
              )}
              onClick={() => handleDayClick(day)}
            >
              <div className="font-medium">{weekdays[index]}</div>
              <div className={cn(
                day.isToday ? "text-hvac-blue font-bold" : "text-gray-500"
              )}>
                {format(day.date, "MMM d")}
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 flex-grow">
          {weekDays.map((day, index) => (
            <div 
              key={index} 
              className={cn(
                "p-2 border-r overflow-auto",
                day.isToday && "bg-blue-50",
                selectedDate && isSameDay(day.date, selectedDate) && "bg-blue-100"
              )}
              onClick={() => handleDayClick(day)}
            >
              {day.appointments.map(appointment => (
                <div key={appointment.id} className="mb-2">
                  <AppointmentCard 
                    appointment={appointment} 
                    isCompact
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(appointment);
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render day view
  const renderDayView = () => {
    const timeSlots = ["Morning", "Afternoon", "Evening"];
    
    return (
      <div>
        <div className="text-center p-4">
          <div className="text-xl font-semibold">{format(currentDate, "EEEE")}</div>
          <div className="text-gray-500">{format(currentDate, "MMMM d, yyyy")}</div>
        </div>
        
        <div className="space-y-4 mt-4">
          {timeSlots.map((timeSlot, index) => {
            const slotAppointments = dayAppointments.filter(
              a => a.timeSlot.toLowerCase() === timeSlot.toLowerCase()
            );
            
            return (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 font-medium border-b">
                  {timeSlot}
                </div>
                <div className="p-3 space-y-3">
                  {slotAppointments.length > 0 ? (
                    slotAppointments.map(appointment => (
                      <AppointmentCard 
                        key={appointment.id} 
                        appointment={appointment}
                        onClick={() => onAppointmentClick(appointment)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No appointments scheduled
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={navigatePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-semibold">
            {viewMode === "day" 
              ? format(currentDate, "MMMM d, yyyy")
              : viewMode === "week"
              ? `${format(weekDays[0].date, "MMM d")} - ${format(weekDays[6].date, "MMM d, yyyy")}`
              : format(currentDate, "MMMM yyyy")}
          </h2>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={navigateNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex rounded-md overflow-hidden border">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => onViewModeChange("day")}
            >
              Day
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => onViewModeChange("week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => onViewModeChange("month")}
            >
              Month
            </Button>
          </div>
          
          <Button onClick={onNewAppointment}>
            <Plus className="h-4 w-4 mr-1" /> New Appointment
          </Button>
        </div>
      </div>
      
      {/* Calendar content */}
      <div className="border rounded-lg overflow-hidden">
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}
      </div>
    </div>
  );
}
