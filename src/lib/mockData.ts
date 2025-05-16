
import { Appointment, Customer, ServiceType, ServicePriority, Technician, TimeSlot } from "@/types";

// Generate a random ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Technicians
export const technicians: Technician[] = [
  {
    id: "tech-1",
    name: "John Smith",
    level: "master",
    specialties: ["commercial HVAC", "refrigeration", "heat pumps"],
    availability: {
      "2025-05-16": { morning: true, afternoon: true, evening: false },
      "2025-05-17": { morning: true, afternoon: true, evening: false },
      "2025-05-18": { morning: false, afternoon: false, evening: false },
      "2025-05-19": { morning: true, afternoon: true, evening: false },
      "2025-05-20": { morning: true, afternoon: true, evening: false },
      "2025-05-21": { morning: true, afternoon: true, evening: false },
      "2025-05-22": { morning: true, afternoon: false, evening: false },
    }
  },
  {
    id: "tech-2",
    name: "Maria Garcia",
    level: "journeyman",
    specialties: ["residential HVAC", "ductwork", "installations"],
    availability: {
      "2025-05-16": { morning: false, afternoon: true, evening: true },
      "2025-05-17": { morning: true, afternoon: true, evening: false },
      "2025-05-18": { morning: false, afternoon: false, evening: false },
      "2025-05-19": { morning: false, afternoon: true, evening: true },
      "2025-05-20": { morning: false, afternoon: true, evening: true },
      "2025-05-21": { morning: false, afternoon: true, evening: true },
      "2025-05-22": { morning: false, afternoon: true, evening: true },
    }
  },
  {
    id: "tech-3",
    name: "David Johnson",
    level: "apprentice",
    specialties: ["maintenance", "filter changes", "basic repairs"],
    availability: {
      "2025-05-16": { morning: true, afternoon: true, evening: false },
      "2025-05-17": { morning: true, afternoon: false, evening: false },
      "2025-05-18": { morning: false, afternoon: false, evening: false },
      "2025-05-19": { morning: true, afternoon: true, evening: false },
      "2025-05-20": { morning: true, afternoon: true, evening: false },
      "2025-05-21": { morning: true, afternoon: false, evening: false },
      "2025-05-22": { morning: true, afternoon: true, evening: false },
    }
  }
];

// Customers
export const customers: Customer[] = [
  {
    id: "cust-1",
    name: "Oakridge Apartments",
    address: "1234 Maple Street, Springfield",
    phone: "555-123-4567",
    email: "manager@oakridgeapts.com",
    notes: "Large apartment complex with 50 units. Multiple systems."
  },
  {
    id: "cust-2",
    name: "Sarah Williams",
    address: "456 Oak Avenue, Springfield",
    phone: "555-876-5432",
    email: "swilliams@email.com",
    notes: "Prefers afternoon appointments. Has a dog."
  },
  {
    id: "cust-3",
    name: "Riverfront Office Park",
    address: "789 River Road, Springfield",
    phone: "555-222-3333",
    email: "facilities@riverfrontoffice.com",
    notes: "After-hours access requires security notification."
  },
  {
    id: "cust-4",
    name: "Michael Johnson",
    address: "101 Pine Lane, Springfield",
    phone: "555-444-5555",
    email: "mjohnson@email.com"
  },
  {
    id: "cust-5",
    name: "Greenview Shopping Center",
    address: "200 Retail Drive, Springfield",
    phone: "555-999-8888",
    email: "maintenance@greenviewmall.com",
    notes: "Multiple units on roof. Access through service corridor."
  }
];

// Helper function to create an appointment
const createAppointment = (
  id: string,
  customerId: string,
  technicianId: string,
  serviceType: ServiceType,
  description: string,
  priority: ServicePriority,
  date: string,
  timeSlot: TimeSlot,
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' = 'scheduled'
): Appointment => {
  const customer = customers.find(c => c.id === customerId)!;
  const technician = technicians.find(t => t.id === technicianId)!;
  
  return {
    id,
    customerId,
    customer,
    technicianId,
    technician,
    serviceType,
    serviceDescription: description,
    priority,
    date,
    timeSlot,
    estimatedDuration: 
      serviceType === 'installation' ? 180 : 
      serviceType === 'repair' ? 120 : 
      serviceType === 'maintenance' ? 60 : 45,
    status,
    notes: ""
  };
};

// Generate appointments for the current month
export const appointments: Appointment[] = [
  // Today's appointments
  createAppointment(
    "appt-1",
    "cust-1",
    "tech-1",
    "maintenance",
    "Annual system check and filter replacement",
    "normal",
    "2025-05-16",
    "morning",
    "scheduled"
  ),
  createAppointment(
    "appt-2",
    "cust-2",
    "tech-2",
    "repair",
    "AC not cooling properly",
    "high",
    "2025-05-16",
    "afternoon",
    "scheduled"
  ),
  
  // Tomorrow's appointments
  createAppointment(
    "appt-3",
    "cust-3",
    "tech-1",
    "inspection",
    "Pre-summer inspection of cooling towers",
    "normal",
    "2025-05-17",
    "morning",
    "scheduled"
  ),
  
  // More appointments for the week
  createAppointment(
    "appt-4",
    "cust-4",
    "tech-3",
    "maintenance",
    "Air filter replacement",
    "low",
    "2025-05-19",
    "morning",
    "scheduled"
  ),
  createAppointment(
    "appt-5",
    "cust-5",
    "tech-1",
    "repair",
    "Refrigerant leak",
    "high",
    "2025-05-19",
    "afternoon",
    "scheduled"
  ),
  createAppointment(
    "appt-6",
    "cust-2",
    "tech-2",
    "maintenance",
    "Annual maintenance",
    "normal",
    "2025-05-20",
    "afternoon",
    "scheduled"
  ),
  createAppointment(
    "appt-7",
    "cust-3",
    "tech-1",
    "installation",
    "New system installation",
    "normal",
    "2025-05-21",
    "morning",
    "scheduled"
  ),
  createAppointment(
    "appt-8",
    "cust-1",
    "tech-3",
    "maintenance",
    "Quarterly maintenance",
    "low",
    "2025-05-22",
    "morning",
    "scheduled"
  )
];
