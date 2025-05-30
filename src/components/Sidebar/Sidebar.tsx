
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CalendarClock,
  Users,
  Settings,
  BarChart3,
  HelpCircle,
  Calculator,
  Mic,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  className?: string;
  onSmartScheduleClick: () => void;
  onVoiceAssistantClick: () => void;
}

export default function Sidebar({ className, onSmartScheduleClick, onVoiceAssistantClick }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white border-r w-[250px] p-4",
        className
      )}
    >
      <div className="flex items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-hvac-blue flex items-center justify-center">
            <CalendarClock className="text-white h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold">HVAC Scheduler</h1>
        </div>
      </div>

      <div className="space-y-1">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <a href="/" className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5" />
            Calendar
          </a>
        </Button>
        
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" disabled>
          <Users className="mr-2 h-5 w-5" />
          Customers
        </Button>
        
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" disabled>
          <BarChart3 className="mr-2 h-5 w-5" />
          Analytics
        </Button>
      </div>

      <Separator className="my-4" />
      
      <div className="space-y-1">
        <h2 className="px-4 text-xs font-semibold text-gray-500 mb-2">
          AI TOOLS
        </h2>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={onSmartScheduleClick}
        >
          <Calculator className="mr-2 h-5 w-5" />
          Smart Scheduling
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={onVoiceAssistantClick}
        >
          <Mic className="mr-2 h-5 w-5" />
          Voice Assistant
        </Button>
        
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" disabled>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-5 w-5"
          >
            <path d="M12 2a8 8 0 0 0-8 8v12l10-5 10 5V10a8 8 0 0 0-8-8Z" />
          </svg>
          Smart Optimization
        </Button>
      </div>

      <div className="mt-auto space-y-1">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" disabled>
          <Settings className="mr-2 h-5 w-5" />
          Settings
        </Button>
        
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" disabled>
          <HelpCircle className="mr-2 h-5 w-5" />
          Help
        </Button>
      </div>
    </div>
  );
}
