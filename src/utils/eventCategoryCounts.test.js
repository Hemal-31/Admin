import { describe, expect, it } from 'vitest';
import { getDaySplitCounts } from './eventCategoryCounts';

describe('getDaySplitCounts', () => {
  it('counts day-1 and day-2 entries separately when event registrations span both categories', () => {
    const counts = getDaySplitCounts([
      {
        selected_day: 'BOTH',
        selected_event_registrations: [
          { events: { day: 'DAY_1' } },
          { events: { day: 'DAY_2' } },
        ],
      },
    ]);

    expect(counts).toEqual({ tech: 1, nonTech: 1, both: 1, special: 0 });
  });

  it('counts special events even when no selected_day is present', () => {
    const counts = getDaySplitCounts([
      {
        selected_day: 'DAY_1',
        special_event_registrations: [{ special_events: { id: 'SP1' } }],
      },
    ]);

    expect(counts).toEqual({ tech: 1, nonTech: 0, both: 0, special: 1 });
  });

  it('keeps non-tech registrations visible even when they are not marked as selected_day', () => {
    const counts = getDaySplitCounts([
      {
        selected_day: 'DAY_2',
        selected_event_registrations: [{ events: { day: 'DAY_2' } }],
      },
    ]);

    expect(counts).toEqual({ tech: 0, nonTech: 1, both: 0, special: 0 });
  });
});
