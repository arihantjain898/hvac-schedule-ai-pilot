
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Search, 
  UserCircle, 
  Bot
} from "lucide-react";
import { analyzeScheduleEfficiency } from "@/lib/aiRecommendations";
import { Appointment } from "@/types";
import { cn } from "@/lib/utils";

interface HeaderProps {
  appointments: Appointment[];
}

export default function Header({ appointments }: HeaderProps) {
  const [showAIInsights, setShowAIInsights] = React.useState(false);
  const [aiAnalysis, setAiAnalysis] = React.useState<{
    efficiencyScore: number;
    suggestions: string[];
  } | null>(null);

  const handleAIInsightsClick = () => {
    const analysis = analyzeScheduleEfficiency(appointments);
    setAiAnalysis(analysis);
    setShowAIInsights(true);
  };

  return (
    <header className="bg-white border-b py-3 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search appointments..."
              className="pl-8 pr-4 py-2 border rounded-md w-full text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleAIInsightsClick}
          >
            <Bot className="h-4 w-4" />
            <span>AI Insights</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-auto">
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">New service request</p>
                    <p className="text-xs text-gray-500">Sarah Williams requested an emergency repair</p>
                    <p className="text-xs text-gray-400">10 minutes ago</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">Appointment completed</p>
                    <p className="text-xs text-gray-500">John Smith completed maintenance at Oakridge Apartments</p>
                    <p className="text-xs text-gray-400">1 hour ago</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">System alert</p>
                    <p className="text-xs text-gray-500">AI scheduling detected a potential conflict tomorrow</p>
                    <p className="text-xs text-gray-400">3 hours ago</p>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* AI Insights Dialog */}
      <Dialog open={showAIInsights} onOpenChange={setShowAIInsights}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Schedule Analysis</DialogTitle>
            <DialogDescription>
              Our AI has analyzed your current schedule and found the following insights.
            </DialogDescription>
          </DialogHeader>
          
          {aiAnalysis && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Efficiency Score:</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full",
                        aiAnalysis.efficiencyScore > 80 ? "bg-green-500" : 
                        aiAnalysis.efficiencyScore > 60 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${aiAnalysis.efficiencyScore}%` }}
                    />
                  </div>
                  <span className="ml-2 font-medium">{aiAnalysis.efficiencyScore}%</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Suggestions:</h4>
                <ul className="space-y-2">
                  {aiAnalysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.5 1C11.0899 1 14 3.91015 14 7.5C14 11.0899 11.0899 14 7.5 14C3.91015 14 1 11.0899 1 7.5C1 3.91015 3.91015 1 7.5 1ZM7.5 2C4.46243 2 2 4.46243 2 7.5C2 10.5376 4.46243 13 7.5 13C10.5376 13 13 10.5376 13 7.5C13 4.46243 10.5376 2 7.5 2ZM7.5 4.5C7.77614 4.5 8 4.72386 8 5V7.5C8 7.63807 7.94123 7.76307 7.85 7.85L6.35 9.35C6.15598 9.54402 5.84402 9.54402 5.65 9.35C5.45598 9.15598 5.45598 8.84402 5.65 8.65L7 7.3V5C7 4.72386 7.22386 4.5 7.5 4.5Z"
                            fill="#0EA5E9"
                            fillRule="evenodd"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                      <span className="text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
}
