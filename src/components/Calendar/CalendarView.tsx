
import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppointmentCard from "./AppointmentCard";
import { Appointment, CalendarViewMode } from "@/types";

interface CalendarViewProps {
  appointments: Appointment[];
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onDateSelect: (date: Date) => void;
  onNewAppointment: () => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const CalendarView = ({
  appointments,
  viewMode,
  onViewModeChange,
  onDateSelect,
  onNewAppointment,
  onAppointmentClick,
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  
  useEffect(() => {
    let days: Date[] = [];
    
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      
      days = eachDayOfInterval({ start: startDate, end: endDate });
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      
      days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      // Day view (just one day)
      days = [currentDate];
    }
    
    setCalendarDays(days);
  }, [currentDate, viewMode]);
  
  const nextPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addMonths(currentDate, 0.25));
    } else {
      setCurrentDate(addMonths(currentDate, 0.033));
    }
  };
  
  const prevPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(subMonths(currentDate, 0.25));
    } else {
      setCurrentDate(subMonths(currentDate, 0.033));
    }
  };
  
  const handleDayClick = (day: Date) => {
    onDateSelect(day);
  };
  
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateString = format(date, "yyyy-MM-dd");
    return appointments.filter(appointment => appointment.date === dateString);
  };
  
  const renderMonthView = () => {
    return (
      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
        
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`calendar-day relative border border-gray-200 ${
              isSameMonth(day, currentDate)
                ? "bg-white"
                : "bg-gray-50 text-gray-500"
            } ${
              isSameDay(day, new Date())
                ? "ring-2 ring-inset ring-blue-500"
                : ""
            }`}
            onClick={() => handleDayClick(day)}
          >
            <div className="text-xs font-medium p-1">{format(day, "d")}</div>
            <div className="calendar-day-content">
              {getAppointmentsForDate(day)
                .slice(0, 3)
                .map(appointment => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    isCompact={true}
                    onClick={() => onAppointmentClick(appointment)}
                  />
                ))}
              {getAppointmentsForDate(day).length > 3 && (
                <div className="text-xs text-center mt-1 text-gray-500">
                  {getAppointmentsForDate(day).length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderWeekView = () => {
    return (
      <div className="flex flex-col space-y-2">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`rounded-md border border-gray-200 overflow-hidden ${
              isSameDay(day, new Date())
                ? "ring-2 ring-inset ring-blue-500"
                : ""
            }`}
          >
            <div className="bg-gray-50 px-3 py-2 font-medium flex justify-between items-center">
              <span>{format(day, "EEEE, MMMM d")}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  handleDayClick(day);
                  onNewAppointment();
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
              {getAppointmentsForDate(day).length > 0 ? (
                getAppointmentsForDate(day).map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    isCompact={false}
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
        ))}
      </div>
    );
  };
  
  const renderDayView = () => {
    return (
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 font-medium flex justify-between items-center">
          <span>{format(currentDate, "EEEE, MMMM d, yyyy")}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onNewAppointment}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-3 space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {getAppointmentsForDate(currentDate).length > 0 ? (
            getAppointmentsForDate(currentDate).map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isCompact={false}
                onClick={() => onAppointmentClick(appointment)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No appointments scheduled for today
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={prevPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="text-lg font-medium ml-2">
            {viewMode === "day" ? format(currentDate, "MMMM d, yyyy") : viewMode === "week" ? "Week of " + format(calendarDays[0], "MMM d, yyyy") : format(currentDate, "MMMM yyyy")}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Tabs
            value={viewMode}
            onValueChange={(value) => onViewModeChange(value as CalendarViewMode)}
            className="mr-4"
          >
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={onNewAppointment}>New Appointment</Button>
        </div>
      </div>
      
      {viewMode === "month" && renderMonthView()}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "day" && renderDayView()}
    </div>
  );
};

export default CalendarView;
