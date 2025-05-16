
export type TechnicianLevel = 'apprentice' | 'journeyman' | 'master';

export interface Technician {
  id: string;
  name: string;
  level: TechnicianLevel;
  specialties: string[];
  availability: {
    [date: string]: { // Format: YYYY-MM-DD
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
    }
  };
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  notes?: string;
}

export type ServiceType = 'installation' | 'maintenance' | 'repair' | 'inspection';
export type ServicePriority = 'low' | 'normal' | 'high' | 'emergency';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface Appointment {
  id: string;
  customerId: string;
  customer: Customer;
  technicianId: string;
  technician: Technician;
  serviceType: ServiceType;
  serviceDescription: string;
  priority: ServicePriority;
  date: string; // Format: YYYY-MM-DD
  timeSlot: TimeSlot;
  estimatedDuration: number; // In minutes
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

export type CalendarViewMode = 'day' | 'week' | 'month';

export interface AIRecommendation {
  technicianId: string;
  technicianName: string;
  reason: string;
  score: number; // 0-100 score for how well this technician matches
}
