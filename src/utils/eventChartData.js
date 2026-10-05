export function getChartRegistrationSource({ allEventParticipants = [], participants = [], allDbEvents = [] }) {
  // Always prefer the full registrations list if available
  if (Array.isArray(allEventParticipants) && allEventParticipants.length > 0) {
    return allEventParticipants;
  }

  // Fall back to coordinator-scoped participants regardless of whether DB events loaded
  if (Array.isArray(participants) && participants.length > 0) {
    return participants;
  }

  return [];
}
