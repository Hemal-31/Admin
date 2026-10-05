const VERIFIED_STATUSES = new Set(['VERIFIED', 'CONFIRMED']);
const REJECTED_STATUSES = new Set(['REJECTED', 'CANCELLED']);

export function getRegistrationStatusCounts(registrations = []) {
  return registrations.reduce(
    (counts, registration) => {
      const status = String(registration?.status || '').toUpperCase();
      counts.total += 1;

      if (VERIFIED_STATUSES.has(status)) counts.verified += 1;
      else if (REJECTED_STATUSES.has(status)) counts.rejected += 1;
      else counts.pending += 1;

      return counts;
    },
    { total: 0, verified: 0, pending: 0, rejected: 0 }
  );
}

export function getTrackCounts(registrations = []) {
  return registrations.reduce(
    (counts, registration) => {
      switch (String(registration?.selected_day || '').toUpperCase()) {
        case 'DAY_1':
          counts.day1 += 1;
          break;
        case 'DAY_2':
          counts.day2 += 1;
          break;
        case 'BOTH':
          counts.both += 1;
          break;
        default:
          counts.special += 1;
      }
      return counts;
    },
    { day1: 0, day2: 0, both: 0, special: 0 }
  );
}

export function buildRegistrationTrend(registrations = [], maxDays = null) {
  const validRegistrations = registrations.filter((registration) => registration?.created_at);
  if (!validRegistrations.length) return [];

  const buckets = new Map();
  validRegistrations.forEach((registration) => {
    const date = new Date(registration.created_at);
    if (Number.isNaN(date.getTime())) return;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        date: date.getTime(),
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        verified: 0,
        pending: 0,
        tech: 0,
        nonTech: 0,
        total: 0,
      });
    }

    const bucket = buckets.get(key);
    bucket.total += 1;

    // Status breakdown
    const status = String(registration.status || '').toUpperCase();
    if (VERIFIED_STATUSES.has(status)) bucket.verified += 1;
    else if (!REJECTED_STATUSES.has(status)) bucket.pending += 1;

    // Track breakdown (Tech vs Non-Tech)
    const day = String(registration.selected_day || '').toUpperCase();
    if (day === 'DAY_1') {
      bucket.tech += 1;
    } else if (day === 'DAY_2') {
      bucket.nonTech += 1;
    } else if (day === 'BOTH') {
      bucket.tech += 1;
      bucket.nonTech += 1;
    } else {
      // Check selected_event_registrations / event_registrations day or default
      let hasTech = false;
      let hasNonTech = false;
      const selections = registration.selected_event_registrations || registration.event_registrations || [];
      selections.forEach((er) => {
        if (er?.events?.day === 'DAY_1') hasTech = true;
        if (er?.events?.day === 'DAY_2') hasNonTech = true;
      });
      if (hasTech) bucket.tech += 1;
      if (hasNonTech) bucket.nonTech += 1;
      if (!hasTech && !hasNonTech) {
        bucket.tech += 1;
      }
    }
  });

  const sorted = [...buckets.values()].sort((a, b) => a.date - b.date);
  return maxDays ? sorted.slice(-maxDays) : sorted;
}

export function buildLast6DaysTrend(registrations = []) {
  const result = [];
  const validRegistrations = (registrations || []).filter((r) => r?.created_at);

  let anchor = new Date();
  if (validRegistrations.length > 0) {
    const latestTs = Math.max(
      ...validRegistrations
        .map((r) => new Date(r.created_at).getTime())
        .filter((t) => !Number.isNaN(t))
    );
    if (latestTs > 0) {
      anchor = new Date(latestTs);
    }
  }

  for (let i = 5; i >= 0; i--) {
    const d = new Date(anchor);
    d.setHours(0, 0, 0, 0);
    d.setDate(anchor.getDate() - i);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${dayStr}`;
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    result.push({
      key,
      date: d.getTime(),
      label,
      verified: 0,
      pending: 0,
      tech: 0,
      nonTech: 0,
      total: 0,
      raw: d,
    });
  }

  validRegistrations.forEach((registration) => {
    const date = new Date(registration.created_at);
    if (Number.isNaN(date.getTime())) return;
    const bucket = result.find((b) => b.raw.toDateString() === date.toDateString());
    if (!bucket) return;

    bucket.total += 1;
    const status = String(registration.status || '').toUpperCase();
    if (VERIFIED_STATUSES.has(status)) bucket.verified += 1;
    else if (!REJECTED_STATUSES.has(status)) bucket.pending += 1;

    const day = String(registration.selected_day || '').toUpperCase();
    if (day === 'DAY_1') {
      bucket.tech += 1;
    } else if (day === 'DAY_2') {
      bucket.nonTech += 1;
    } else if (day === 'BOTH') {
      bucket.tech += 1;
      bucket.nonTech += 1;
    } else {
      let hasTech = false;
      let hasNonTech = false;
      const selections = registration.selected_event_registrations || registration.event_registrations || [];
      selections.forEach((er) => {
        if (er?.events?.day === 'DAY_1') hasTech = true;
        if (er?.events?.day === 'DAY_2') hasNonTech = true;
      });
      if (hasTech) bucket.tech += 1;
      if (hasNonTech) bucket.nonTech += 1;
      if (!hasTech && !hasNonTech) bucket.tech += 1;
    }
  });

  return result;
}

export function percentageOf(count, total) {
  return total > 0 ? Math.round((Number(count) / total) * 100) : 0;
}

