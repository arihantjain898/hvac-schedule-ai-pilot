
import { Appointment, AIRecommendation, Technician, ServiceType } from "@/types";
import { technicians } from "./mockData";

// Simulated AI recommendation engine
export const getAITechnicianRecommendations = (
  serviceType: ServiceType,
  date: string,
  timeSlot: "morning" | "afternoon" | "evening"
): AIRecommendation[] => {
  // In a real application, this would call an AI service
  // For now, we'll use a rule-based system to simulate AI recommendations
  
  const availableTechnicians = technicians.filter(tech => {
    const techAvailability = tech.availability[date];
    return techAvailability && techAvailability[timeSlot];
  });
  
  if (availableTechnicians.length === 0) {
    return [];
  }

  const recommendations: AIRecommendation[] = availableTechnicians.map(tech => {
    // Calculate a score based on technician level and specialties
    let score = 0;
    
    // Level-based scoring
    if (tech.level === "master") score += 40;
    else if (tech.level === "journeyman") score += 25;
    else score += 15;
    
    // Specialty-based scoring
    if (serviceType === "installation" && tech.specialties.includes("installations")) {
      score += 30;
    }
    if (serviceType === "maintenance" && tech.specialties.includes("maintenance")) {
      score += 30;
    }
    if (serviceType === "repair" && 
        (tech.specialties.includes("repairs") || tech.level === "master")) {
      score += 30;
    }
    if (serviceType === "inspection" && 
        (tech.specialties.includes("diagnostics") || tech.level === "journeyman")) {
      score += 25;
    }
    
    // Location-based scoring (simulated)
    // In a real app, this would be based on proximity to customer location
    score += Math.floor(Math.random() * 10);
    
    // Cap at 100
    score = Math.min(score, 100);
    
    // Generate a reason
    let reason = "";
    if (score > 80) {
      reason = `${tech.name} is highly recommended due to ${tech.level} level expertise`;
      if (tech.specialties.includes(serviceType === "installation" ? "installations" : 
                                    serviceType === "maintenance" ? "maintenance" : 
                                    "repairs")) {
        reason += ` and specialization in ${serviceType}s`;
      }
    } else if (score > 60) {
      reason = `${tech.name} is qualified with relevant experience`;
    } else {
      reason = `${tech.name} is available but may not specialize in this service`;
    }
    
    return {
      technicianId: tech.id,
      technicianName: tech.name,
      reason,
      score
    };
  });
  
  // Sort by score (highest first)
  return recommendations.sort((a, b) => b.score - a.score);
};

export const analyzeScheduleEfficiency = (appointments: Appointment[]): {
  efficiencyScore: number;
  suggestions: string[];
} => {
  // This would use machine learning in a real app
  // Here we'll simulate some analysis
  
  const suggestions: string[] = [];
  let efficiencyScore = 75; // Default baseline
  
  // Check for appointment clustering
  const appointmentsByDate: Record<string, Appointment[]> = {};
  appointments.forEach(appointment => {
    if (!appointmentsByDate[appointment.date]) {
      appointmentsByDate[appointment.date] = [];
    }
    appointmentsByDate[appointment.date].push(appointment);
  });
  
  // Look at distribution of appointments
  const datesWithAppointments = Object.keys(appointmentsByDate);
  const appointmentCounts = datesWithAppointments.map(date => appointmentsByDate[date].length);
  
  // Calculate standard deviation to measure distribution
  const average = appointmentCounts.reduce((a, b) => a + b, 0) / appointmentCounts.length;
  const squareDiffs = appointmentCounts.map(count => {
    const diff = count - average;
    return diff * diff;
  });
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  
  // Adjust score based on distribution
  if (stdDev > 2) {
    efficiencyScore -= 10;
    suggestions.push("Consider balancing workload more evenly across days");
  } else {
    efficiencyScore += 5;
    suggestions.push("Appointment distribution is well balanced");
  }
  
  // Check for technician specialization alignment
  let specializationMismatches = 0;
  appointments.forEach(appointment => {
    const tech = appointment.technician;
    const serviceType = appointment.serviceType;
    
    if (serviceType === "installation" && !tech.specialties.includes("installations")) {
      specializationMismatches++;
    } else if (serviceType === "maintenance" && !tech.specialties.includes("maintenance")) {
      specializationMismatches++;
    }
  });
  
  if (specializationMismatches > 0) {
    efficiencyScore -= specializationMismatches * 5;
    suggestions.push("Some technicians are assigned services outside their specialties");
  } else {
    efficiencyScore += 10;
    suggestions.push("Technician specialties are well aligned with assigned services");
  }
  
  // Check for geographic optimization
  suggestions.push("Consider grouping appointments by location to reduce travel time");
  
  // Add some random insights to simulate AI
  const randomInsights = [
    "Consider batch scheduling maintenance appointments by neighborhood",
    "Emergency slots could be reserved each day for unexpected calls",
    "Morning appointments for commercial clients appear most efficient",
    "Journeyman technicians might benefit from more varied assignments",
    "Analyze customer service history to better predict appointment duration"
  ];
  
  if (Math.random() > 0.3) {
    suggestions.push(randomInsights[Math.floor(Math.random() * randomInsights.length)]);
  }
  
  return {
    efficiencyScore: Math.min(100, Math.max(0, efficiencyScore)),
    suggestions
  };
};

// New function to suggest optimized appointment dates 
export const suggestOptimalDates = (
  appointments: Appointment[],
  serviceType: ServiceType,
  priority: string
): {date: string, score: number}[] => {
  // Simulate AI recommendations for optimal dates
  // In a real app, this would use machine learning algorithms
  
  const today = new Date();
  const suggested: {date: string, score: number}[] = [];
  
  // Generate suggestions for the next 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Format date as YYYY-MM-DD
    const dateString = date.toISOString().split('T')[0];
    
    // Count existing appointments on this date
    const existingAppointments = appointments.filter(a => a.date === dateString);
    
    // Calculate a base score (fewer appointments is better)
    let score = 100 - (existingAppointments.length * 10);
    
    // Adjust score based on day of week (weekdays slightly preferred)
    const dayOfWeek = date.getDay();
    if (dayOfWeek > 0 && dayOfWeek < 6) {
      score += 5;
    }
    
    // Adjust score based on service type and priority
    if (priority === "emergency" && i === 0) {
      score += 30; // Emergencies should be handled ASAP
    } else if (serviceType === "maintenance" && dayOfWeek === 2) {
      score += 15; // Maintenance is good on Tuesdays (arbitrary business rule)
    }
    
    // Add some randomness to simulate AI variation
    score += Math.floor(Math.random() * 10);
    
    // Cap score between 0-100
    score = Math.max(0, Math.min(100, score));
    
    suggested.push({ date: dateString, score });
  }
  
  // Sort by score (highest first)
  return suggested.sort((a, b) => b.score - a.score);
};
