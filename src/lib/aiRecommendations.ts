
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
    
    // Add some randomness to simulate AI variation
    score += Math.floor(Math.random() * 10);
    
    // Cap at 100
    score = Math.min(score, 100);
    
    // Generate a reason
    let reason = "";
    if (score > 80) {
      reason = `${tech.name} is highly recommended due to ${tech.level} level expertise`;
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
  
  // Add some random insights to simulate AI
  const randomInsights = [
    "Consider batch scheduling maintenance appointments by neighborhood",
    "Emergency slots could be reserved each day for unexpected calls",
    "Morning appointments for commercial clients appear most efficient",
    "Journeyman technicians might benefit from more varied assignments"
  ];
  
  if (Math.random() > 0.5) {
    suggestions.push(randomInsights[Math.floor(Math.random() * randomInsights.length)]);
  }
  
  return {
    efficiencyScore: Math.min(100, Math.max(0, efficiencyScore)),
    suggestions
  };
};
