export function normalizeEventDay(value) {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (!normalized) return '';

  if (normalized === 'DAY 1') return 'DAY_1';
  if (normalized === 'DAY 2') return 'DAY_2';
  return normalized;
}

export function getDaySplitCounts(participants = []) {
  return (participants || []).reduce(
    (counts, participant) => {
      const selectedDay = normalizeEventDay(participant?.selected_day);
      const selectedEventRegs = Array.isArray(participant?.selected_event_registrations)
        ? participant.selected_event_registrations
        : [];
      const specialRegs = Array.isArray(participant?.special_event_registrations)
        ? participant.special_event_registrations
        : [];

      const eventDays = selectedEventRegs
        .map((reg) => normalizeEventDay(reg?.events?.day || reg?.day || reg?.event_day))
        .filter(Boolean);

      const hasTech = selectedDay === 'DAY_1' || eventDays.some((day) => ['DAY_1', 'BOTH', 'ALL'].includes(day));
      const hasNonTech = selectedDay === 'DAY_2' || eventDays.some((day) => ['DAY_2', 'BOTH', 'ALL'].includes(day));
      const hasSpecial = selectedDay === 'SPECIAL' || specialRegs.length > 0;
      const isBothDay = selectedDay === 'BOTH' || selectedDay === 'ALL' || (hasTech && hasNonTech);

      if (hasTech) counts.tech += 1;
      if (hasNonTech) counts.nonTech += 1;
      if (isBothDay) counts.both += 1;
      if (hasSpecial) counts.special += 1;

      return counts;
    },
    { tech: 0, nonTech: 0, both: 0, special: 0 }
  );
}
