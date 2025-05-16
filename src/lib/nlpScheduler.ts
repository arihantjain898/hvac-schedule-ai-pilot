
import { format, parse, addDays, subDays } from 'date-fns';
import { Appointment } from '@/types';

interface ReschedulingAction {
  action: 'reschedule' | 'cancel' | 'info' | 'unknown';
  customerId?: string;
  customerName?: string;
  technicianId?: string;
  technicianName?: string;
  appointmentId?: string;
  fromDate?: string;
  toDate?: string;
  affectedAppointments?: string[];
  shiftDays?: number;
  original?: string;
}

// This is a simplified NLP parser that looks for specific patterns
// In a real app, you'd use a more sophisticated NLP system or service
export const parseSchedulingRequest = (
  input: string, 
  appointments: Appointment[]
): ReschedulingAction => {
  const lowerInput = input.toLowerCase();
  const action: ReschedulingAction = { 
    action: 'unknown',
    original: input
  };
  
  // Extract customer name (look for patterns like "move [name]" or "reschedule [name]")
  const moveCustomerRegex = /(move|reschedule|change)\s+([a-z]+\s+[a-z]+)(\s+to\s+|'s\s+appointment|\s+appointment)/i;
  const customerMatch = lowerInput.match(moveCustomerRegex);
  
  if (customerMatch && customerMatch[2]) {
    action.customerName = customerMatch[2].trim();
    action.action = 'reschedule';
    
    // Find the customer's appointment
    const customerAppointments = appointments.filter(appt => 
      appt.customer && 
      appt.customer.name.toLowerCase().includes(action.customerName?.toLowerCase() || '')
    );
    
    if (customerAppointments.length > 0) {
      // Use the first match for simplicity
      action.appointmentId = customerAppointments[0].id;
      action.fromDate = customerAppointments[0].date;
    }
    
    // Extract day of the week
    const dayRegex = /to\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
    const dayMatch = lowerInput.match(dayRegex);
    
    if (dayMatch && dayMatch[1]) {
      const targetDay = dayMatch[1].toLowerCase();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = new Date();
      const todayDayIndex = today.getDay();
      const targetDayIndex = days.indexOf(targetDay);
      
      // Calculate days to add
      let daysToAdd = targetDayIndex - todayDayIndex;
      if (daysToAdd <= 0) daysToAdd += 7; // Go to next week if the day has already passed
      
      const targetDate = addDays(today, daysToAdd);
      action.toDate = format(targetDate, 'yyyy-MM-dd');
    }
  }
  
  // Look for shift patterns like "move back by 1 day" or "push forward 2 days"
  const shiftRegex = /(move|push|shift)\s+(back|forward|ahead|later|earlier)\s+(by\s+)?(\d+)?\s*day/i;
  const shiftMatch = lowerInput.match(shiftRegex);
  
  if (shiftMatch) {
    action.action = 'reschedule';
    const direction = shiftMatch[2].toLowerCase();
    const days = shiftMatch[4] ? parseInt(shiftMatch[4]) : 1;
    
    // Positive for forward, negative for back
    action.shiftDays = (direction === 'back' || direction === 'earlier') ? -days : days;
    
    // Check if this applies to a specific appointment or customer
    if (!action.customerName) {
      // Check if there's a mention of "other" appointments
      if (lowerInput.includes('other appointment') || lowerInput.includes('all appointment')) {
        // This means shift all appointments without specific customer mentions
        action.affectedAppointments = appointments
          .filter(appt => appt.date >= format(new Date(), 'yyyy-MM-dd'))
          .map(appt => appt.id);
      }
    }
  }
  
  // Handle cancellation requests
  if (lowerInput.includes('cancel') && (lowerInput.includes('appointment') || lowerInput.includes('meeting'))) {
    action.action = 'cancel';
    
    // Try to find customer name in cancellation request
    const cancelCustomerRegex = /cancel\s+([a-z]+\s+[a-z]+)('s)?\s+appointment/i;
    const cancelMatch = lowerInput.match(cancelCustomerRegex);
    
    if (cancelMatch && cancelMatch[1]) {
      action.customerName = cancelMatch[1].trim();
      
      const customerAppointments = appointments.filter(appt => 
        appt.customer && 
        appt.customer.name.toLowerCase().includes(action.customerName?.toLowerCase() || '')
      );
      
      if (customerAppointments.length > 0) {
        action.appointmentId = customerAppointments[0].id;
      }
    }
  }
  
  // Handle information requests
  if ((lowerInput.includes('show') || lowerInput.includes('tell me') || lowerInput.includes('what is')) && 
      (lowerInput.includes('schedule') || lowerInput.includes('appointment'))) {
    action.action = 'info';
    
    // Try to extract a technician name
    const technicianRegex = /(show|what|tell me about)\s+([a-z]+)('s)?\s+(schedule|appointments)/i;
    const techMatch = lowerInput.match(technicianRegex);
    
    if (techMatch && techMatch[2]) {
      action.technicianName = techMatch[2].trim();
    }
  }
  
  return action;
};

export const executeReschedulingAction = (
  action: ReschedulingAction,
  appointments: Appointment[]
): {
  updatedAppointments: Appointment[];
  message: string;
} => {
  const updatedAppointments = [...appointments];
  let message = "I couldn't understand that request. Could you please try again?";
  
  if (action.action === 'reschedule') {
    if (action.appointmentId && action.toDate) {
      // Reschedule a specific appointment to a specific date
      const appointmentIndex = updatedAppointments.findIndex(appt => appt.id === action.appointmentId);
      
      if (appointmentIndex !== -1) {
        const oldDate = updatedAppointments[appointmentIndex].date;
        updatedAppointments[appointmentIndex] = {
          ...updatedAppointments[appointmentIndex],
          date: action.toDate
        };
        
        message = `Rescheduled ${updatedAppointments[appointmentIndex].customer.name}'s appointment from ${format(new Date(oldDate), 'MMM d')} to ${format(new Date(action.toDate), 'MMM d')}`;
      }
    } else if (action.shiftDays && action.customerName) {
      // Shift a specific customer's appointment by days
      const appointmentIndices = updatedAppointments
        .map((appt, index) => appt.customer.name.toLowerCase().includes(action.customerName?.toLowerCase() || '') ? index : -1)
        .filter(index => index !== -1);
      
      if (appointmentIndices.length > 0) {
        appointmentIndices.forEach(index => {
          const oldDate = new Date(updatedAppointments[index].date);
          const newDate = action.shiftDays && action.shiftDays > 0 
            ? addDays(oldDate, action.shiftDays) 
            : subDays(oldDate, Math.abs(action.shiftDays || 0));
          
          updatedAppointments[index] = {
            ...updatedAppointments[index],
            date: format(newDate, 'yyyy-MM-dd')
          };
        });
        
        const direction = action.shiftDays && action.shiftDays > 0 ? 'forward' : 'back';
        message = `Moved ${action.customerName}'s appointment ${direction} by ${Math.abs(action.shiftDays || 0)} day(s)`;
      }
    } else if (action.shiftDays && action.affectedAppointments && action.affectedAppointments.length > 0) {
      // Shift multiple appointments by days
      action.affectedAppointments.forEach(appId => {
        const index = updatedAppointments.findIndex(appt => appt.id === appId);
        
        if (index !== -1) {
          const oldDate = new Date(updatedAppointments[index].date);
          const newDate = action.shiftDays && action.shiftDays > 0 
            ? addDays(oldDate, action.shiftDays) 
            : subDays(oldDate, Math.abs(action.shiftDays || 0));
          
          updatedAppointments[index] = {
            ...updatedAppointments[index],
            date: format(newDate, 'yyyy-MM-dd')
          };
        }
      });
      
      const direction = action.shiftDays && action.shiftDays > 0 ? 'forward' : 'back';
      message = `Shifted ${action.affectedAppointments.length} appointments ${direction} by ${Math.abs(action.shiftDays || 0)} day(s)`;
    }
  } else if (action.action === 'cancel' && action.appointmentId) {
    // Find the appointment to cancel
    const appointmentIndex = updatedAppointments.findIndex(appt => appt.id === action.appointmentId);
    
    if (appointmentIndex !== -1) {
      // In a real app, you might not delete but change the status to 'cancelled'
      const customer = updatedAppointments[appointmentIndex].customer.name;
      updatedAppointments[appointmentIndex] = {
        ...updatedAppointments[appointmentIndex],
        status: 'cancelled'
      };
      
      message = `Cancelled ${customer}'s appointment`;
    }
  } else if (action.action === 'info') {
    if (action.technicianName) {
      const techAppointments = appointments.filter(appt => 
        appt.technician.name.toLowerCase().includes(action.technicianName?.toLowerCase() || '')
      );
      
      if (techAppointments.length > 0) {
        const apptsStr = techAppointments
          .map(a => `${format(new Date(a.date), 'MMM d')}: ${a.customer.name} (${a.serviceType})`)
          .join(', ');
        
        message = `${action.technicianName} has these upcoming appointments: ${apptsStr}`;
      } else {
        message = `I couldn't find any appointments for ${action.technicianName}`;
      }
    } else {
      // General schedule info
      const upcomingCount = appointments.filter(a => new Date(a.date) >= new Date()).length;
      message = `You have ${upcomingCount} upcoming appointments scheduled.`;
    }
  }
  
  return {
    updatedAppointments,
    message
  };
};
