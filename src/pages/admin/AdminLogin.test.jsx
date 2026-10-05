import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminLogin from './AdminLogin';
import { ToastProvider } from '../../context/ToastContext';
import { ToastContainer } from '../../components/common/ToastContainer';
import { prepareParticipantDetails } from '../../components/common/DetailsModal';

const loginAdminMock = vi.fn();
const loginCoordinatorMock = vi.fn();

const mockProfilesQuery = (matches = []) => {
  const eqMock = vi.fn(() => ({
    ilike: vi.fn(() => Promise.resolve({ data: matches })),
  }));

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: eqMock,
      })),
    })),
  };
};

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    loginAdmin: loginAdminMock,
    adminLogin: loginAdminMock,
    loginCoordinator: loginCoordinatorMock,
    coordinatorLogin: loginCoordinatorMock,
  }),
}));

describe('prepareParticipantDetails', () => {
  it('reads payment details from nested registrations and payments relations', () => {
    const data = {
      id: 42,
      status: 'UNDER_REVIEW',
      amount: 170,
      registrations: {
        registration_code: 'CS-7321',
        selected_day: 'DAY_1',
        qr_token: 'qr-abc',
        participants: [{ name: 'Aisha', year: '3rd Year', email: 'aisha@example.com', phone: '9876543210', college: 'MIT', department: 'CSE' }],
        selected_event_registrations: [{ event_id: 10, events: { id: 10, code: 'PP', name: 'Paper Presentation', day: 'DAY_1' } }],
        special_event_registrations: [{ special_event_id: 20, special_events: { id: 20, code: 'SP', name: 'Spotlight' } }],
      },
    };

    const normalized = prepareParticipantDetails(data);

    expect(normalized.registration.registration_code).toBe('CS-7321');
    expect(normalized.registration.participants.name).toBe('Aisha');
    expect(normalized.registration.payments.amount).toBe(170);
    expect(normalized.registration.selected_event_registrations[0].events.name).toBe('Paper Presentation');
    expect(normalized.registration.special_event_registrations[0].special_events.name).toBe('Spotlight');
  });
});

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderLogin() {
    return render(
      <MemoryRouter>
        <ToastProvider>
          <ToastContainer />
          <AdminLogin />
        </ToastProvider>
      </MemoryRouter>
    );
  }

  it('shows email wrong message when the entered admin email is not registered', async () => {
    const { supabase } = await import('../../config/supabase');
    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          ilike: () => Promise.resolve({ data: [] }),
        }),
      }),
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Admin ID or Email'), {
      target: { value: 'no-user@cybersentinel.in' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'admin123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login as admin/i }));

    await waitFor(() => {
      expect(screen.getByText('Email is wrong')).toBeInTheDocument();
    });

    expect(screen.getByText('This email is not registered in our system.')).toBeInTheDocument();
  });

  it('shows password wrong message when the email exists but the password is incorrect', async () => {
    const { supabase } = await import('../../config/supabase');
    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          ilike: () => Promise.resolve({ data: [{ email: 'admin@cybersentinel.in' }] }),
        }),
      }),
    });

    loginAdminMock.mockRejectedValue(new Error('Invalid administrator credentials.'));

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Admin ID or Email'), {
      target: { value: 'admin@cybersentinel.in' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login as admin/i }));

    await waitFor(() => {
      expect(screen.getByText('Password is wrong')).toBeInTheDocument();
    });

    expect(screen.getByText('The password you entered is incorrect.')).toBeInTheDocument();
  });
});
