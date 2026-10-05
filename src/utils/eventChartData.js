export function getChartRegistrationSource({ allEventParticipants = [], participants = [], allDbEvents = [] }) {
  if (Array.isArray(allEventParticipants) && allEventParticipants.length > 0) {
    return allEventParticipants;
  }

  if (Array.isArray(allDbEvents) && allDbEvents.length > 0) {
    return [];
  }

  return Array.isArray(participants) ? participants : [];
}
