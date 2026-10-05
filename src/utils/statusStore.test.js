import { describe, expect, it, beforeEach } from 'vitest';
import { getStatusOverrides } from './statusStore';

describe('getStatusOverrides', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ignores stale local status overrides so they cannot inflate verified totals', () => {
    const oldTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      'cs_status_overrides',
      JSON.stringify({
        registrations: {
          r1: { status: 'VERIFIED', updated_at: oldTime },
        },
        payments: {
          p1: { status: 'VERIFIED', updated_at: oldTime },
        },
      })
    );

    expect(getStatusOverrides()).toEqual({ registrations: {}, payments: {} });
  });

  it('keeps recent overrides so real admin actions still apply', () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      'cs_status_overrides',
      JSON.stringify({
        registrations: {
          r2: { status: 'VERIFIED', updated_at: recent },
        },
        payments: {},
      })
    );

    expect(getStatusOverrides()).toEqual({
      registrations: { r2: { status: 'VERIFIED', updated_at: recent } },
      payments: {},
    });
  });
});
