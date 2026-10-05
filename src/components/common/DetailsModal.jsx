import React from 'react';
import { Modal } from './Modal';
import { StatusBadge } from '../ui/StatusBadge';

export function DetailTable({ data }) {
  if (data === null || data === undefined || data === '') {
    return <span className="detail-empty">Not provided</span>;
  }

  if (typeof data === 'boolean') {
    return <StatusBadge status={data ? 'YES' : 'NO'} />;
  }

  if (
    typeof data === 'string' &&
    ['VERIFIED', 'PENDING', 'UNDER_REVIEW', 'PAYMENT_PENDING', 'REJECTED', 'ACTIVE', 'INACTIVE', 'CONFIRMED', 'PRESENT', 'ABSENT'].includes(
      data.toUpperCase()
    )
  ) {
    return <StatusBadge status={data} />;
  }

  if (typeof data !== 'object') {
    return <span>{String(data)}</span>;
  }

  if (Array.isArray(data)) {
    if (!data.length) {
      return <span className="detail-empty">None</span>;
    }
    return (
      <div className="detail-list">
        {data.map((item, idx) => (
          <div key={idx} className="detail-item">
            <DetailTable data={item} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <table className="detail-table">
      <tbody>
        {Object.entries(data).map(([key, value]) => {
          if (key === 'screenshot_path' || key === 'screenshot_url') return null;
          const isComplex = typeof value === 'object' && value !== null;
          return (
            <tr key={key}>
              <th>{key.replace(/_/g, ' ')}</th>
              <td className={isComplex ? 'detail-nested-td' : ''}>
                <DetailTable data={value} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function prepareParticipantDetails(item) {
  if (!item) return {};

  if (item.registration && item.participant) {
    return item;
  }

  const registrationSource = item.registrations || item.registration || {};
  const participantSource =
    item.participants ||
    registrationSource.participants ||
    item.participant ||
    registrationSource.participant ||
    {};

  const participant = Array.isArray(participantSource)
    ? participantSource[0] || {}
    : participantSource || {};

  const paymentSource =
    item.payments ||
    registrationSource.payments ||
    item.payment ||
    registrationSource.payment ||
    {};

  const payment = Array.isArray(paymentSource)
    ? paymentSource[0] || {}
    : paymentSource || {};

  const rawEventRegs = item.selected_event_registrations || item.event_registrations || registrationSource.selected_event_registrations || registrationSource.event_registrations || [];
  const selectedEvents = rawEventRegs.map((er) => {
    return {
      events: er.events
        ? {
            id: er.events.id || '—',
            day: er.events.day || '—',
            code: er.events.code || '—',
            name: er.events.name || '—',
          }
        : null,
      event_id: er.event_id || er.events?.id || '—',
    };
  });

  const rawSpecialRegs = item.special_event_registrations || registrationSource.special_event_registrations || [];
  const specialEvents = rawSpecialRegs.map((sr) => {
    return {
      special_events: sr.special_events
        ? {
            id: sr.special_events.id || '—',
            code: sr.special_events.code || '—',
            name: sr.special_events.name || '—',
          }
        : null,
      special_event_id: sr.special_event_id || sr.special_events?.id || '—',
    };
  });

  const normalizedRegistration = registrationSource && Object.keys(registrationSource).length
    ? registrationSource
    : item;

  return {
    registration: {
      id: normalizedRegistration.id || item.id || item.registration_id || '—',
      registration_code: normalizedRegistration.registration_code || item.registration_code || '—',
      selected_day: normalizedRegistration.selected_day || item.selected_day || '—',
      status: normalizedRegistration.status || item.status || '—',
      qr_token: normalizedRegistration.qr_token || item.qr_token || '—',
      participants: {
        name: participant.name || item.participant_name || item.name || '—',
        year: participant.year || item.participant_year || item.year || '3rd Year',
        email: participant.email || item.participant_email || item.email || '—',
        phone: participant.phone || item.participant_phone || item.phone || '—',
        college: participant.college || item.college || '—',
        department: participant.department || item.department || '—',
      },
      payments: {
        amount: payment.amount ?? item.amount ?? 170,
        status: payment.status || item.payment_status || item.status || (item.status === 'VERIFIED' ? 'VERIFIED' : 'UNDER_REVIEW'),
      },
      selected_event_registrations: selectedEvents.length ? selectedEvents : null,
      special_event_registrations: specialEvents.length ? specialEvents : null,
    },
    participant: {
      name: participant.name || item.participant_name || item.name || '—',
      year: participant.year || item.participant_year || item.year || '3rd Year',
      email: participant.email || item.participant_email || item.email || '—',
      phone: participant.phone || item.participant_phone || item.phone || '—',
      college: participant.college || item.college || '—',
      department: participant.department || item.department || '—',
    },
  };
}

export function DetailsModal({ isOpen, onClose, title = 'Details', data, maxWidth = '820px' }) {
  if (!data) return null;

  // If data looks like a participant/registration item, format it into { registration, participant }
  const hasNestedRegistration = Boolean(data.registrations || data.registration || data.participant || data.participants);
  const isParticipantRecord = Boolean(
    data.registration_code ||
    data.participants ||
    data.participant ||
    data.selected_day ||
    data.registrations ||
    data.registration
  );
  const formattedData = isParticipantRecord || hasNestedRegistration ? prepareParticipantDetails(data) : data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={maxWidth}>
      <div className="detail-table-container">
        <DetailTable data={formattedData} />
      </div>
    </Modal>
  );
}

export default DetailsModal;
