import { SUPABASE_URL, SUPABASE_ANON_KEY, supabase } from '../config/supabase';

export async function getRegistrationFees() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-registration-fees`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      return {
        DAY_1: Number(data.DAY_1 || 0),
        DAY_2: Number(data.DAY_2 || 0),
      };
    }
  } catch (err) {
    console.warn('Edge function get-registration-fees notice:', err);
  }

  // Fallback to Supabase RPC
  try {
    const { data, error } = await supabase.rpc('get_registration_fees');
    if (!error && data) {
      return {
        DAY_1: Number(data?.DAY_1 || 0),
        DAY_2: Number(data?.DAY_2 || 0),
      };
    }
  } catch (rpcErr) {
    console.warn('RPC get_registration_fees notice:', rpcErr);
  }

  return { DAY_1: 250, DAY_2: 250 };
}

export async function getSpecialEvents() {
  const { data, error } = await supabase.rpc('get_special_events');
  if (error) {
    // Fallback directly to special_events table if RPC fails
    const fallback = await supabase
      .from('special_events')
      .select('id, code, name, description, fee, status')
      .eq('status', 'ACTIVE')
      .order('code');
    if (fallback.error) throw fallback.error;
    return fallback.data || [];
  }
  return Array.isArray(data) ? data : [];
}

export async function submitRegistration({
  name,
  email,
  phone,
  college,
  department,
  year,
  selectedDay,
  selectedEventIds = [],
  specialEventCodes = [],
  utr = '',
  paymentScreenshotFile = null,
}) {
  const fd = new FormData();
  fd.append('name', name.trim());
  fd.append('email', email.trim());
  fd.append('phone', phone.trim());
  fd.append('college', college.trim());
  fd.append('department', department.trim());
  fd.append('year', year || '');
  if (utr) fd.append('utr', utr.trim());
  fd.append('selected_day', selectedDay);
  fd.append('selected_event_ids', JSON.stringify(selectedEventIds));
  fd.append('special_event_codes', JSON.stringify(specialEventCodes));
  if (paymentScreenshotFile) fd.append('payment_screenshot', paymentScreenshotFile);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/public-register`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: fd,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Registration submission failed.');
  }
  return data;
}

export async function checkRegistrationStatus(email, phone) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/check-registration`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      email: email.trim(),
      phone: phone.trim(),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Unable to find registration record.');
  }
  return data;
}

export async function callTeamManagement(payload) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/team-management`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Team operation failed.');
  }
  return data;
}
