import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getCoordinatorAssignedEvents } from '../../services/coordinatorService';
import { openGmailCompose } from '../../utils/helpers';
import {
  Mail,
  Send,
  Users,
  CheckSquare,
  Square,
  RefreshCw,
  Layers,
  Sparkles,
  ExternalLink,
  Search,
  ShieldCheck,
  AlertCircle,
  Filter,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function CoordinatorEmails() {
  const { user, coordinatorProfile, getCoordinatorClientInstance } = useAuth();
  const { addToast } = useToast();

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [assignedSpecialEvents, setAssignedSpecialEvents] = useState([]);

  // Form State
  const [audience, setAudience] = useState('ASSIGNED_ALL');
  const [subject, setSubject] = useState('Payment Reminder: CyberSentinel 2K26 Registration');
  const [message, setMessage] = useState(
    `Dear participant,\n\nYour registration payment for CyberSentinel 2K26 has not been done or cleared yet.\n\nKindly complete your payment to confirm your seat and take part in this event. If you have already completed the transaction, please check your status on the verification portal.\n\nWarm regards,\nCyberSentinel Organizing Committee`
  );
  const [recipients, setRecipients] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Search & Filter in recipient checklist
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // ALL, PAID, UNPAID

  const client = getCoordinatorClientInstance();

  useEffect(() => {
    async function loadEvents() {
      try {
        const coordId = user?.id || coordinatorProfile?.id;
        let normalEvents = [];
        let specialEvents = [];

        if (coordId) {
          try {
            const eventsData = await getCoordinatorAssignedEvents(client, coordId);
            normalEvents = eventsData.normalEvents || [];
            specialEvents = eventsData.specialEvents || [];
          } catch (evErr) {
            console.warn('Coordinator email events error:', evErr);
          }
        }

        setAssignedEvents(normalEvents);
        setAssignedSpecialEvents(specialEvents);
      } catch (err) {
        console.warn('Coordinator emails error:', err);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

  const loadRecipients = async (audienceStr) => {
    if (!audienceStr) {
      setRecipients([]);
      setSelectedEmails(new Set());
      return;
    }

    try {
      setLoadingRecipients(true);
      let queryData = [];

      if (audienceStr === 'ALL') {
        // All symposium registrations
        const { data, error } = await client
          .from('registrations')
          .select('id, registration_code, status, created_at, participants(name, email, phone, college), payments(status, amount)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        queryData = data || [];
      } else if (audienceStr === 'PENDING_PAYMENT') {
        // All registrations with pending / unverified payment
        const { data, error } = await client
          .from('registrations')
          .select('id, registration_code, status, created_at, participants(name, email, phone, college), payments(status, amount)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        queryData = (data || []).filter((r) => {
          const pay = Array.isArray(r.payments) ? r.payments[0] : r.payments;
          return pay?.status !== 'VERIFIED' && r.status !== 'CONFIRMED';
        });
      } else if (audienceStr === 'ASSIGNED_ALL') {
        // All participants enrolled in coordinator's assigned events
        const normalIds = assignedEvents.map((e) => e.id);
        const specialIds = assignedSpecialEvents.map((s) => s.id);
        const regIdSet = new Set();

        if (normalIds.length > 0) {
          const { data: nData } = await client
            .from('selected_event_registrations')
            .select('registration_id')
            .in('event_id', normalIds);
          (nData || []).forEach((r) => regIdSet.add(r.registration_id));
        }

        if (specialIds.length > 0) {
          const { data: sData } = await client
            .from('special_event_registrations')
            .select('registration_id')
            .in('special_event_id', specialIds);
          (sData || []).forEach((r) => regIdSet.add(r.registration_id));
        }

        if (regIdSet.size > 0) {
          const { data: regList, error } = await client
            .from('registrations')
            .select('id, registration_code, status, participants(name, email, phone, college), payments(status, amount)')
            .in('id', Array.from(regIdSet));
          if (error) throw error;
          queryData = regList || [];
        } else {
          // If no assigned events found, fallback to all registrations
          const { data: allData } = await client
            .from('registrations')
            .select('id, registration_code, status, participants(name, email, phone, college), payments(status, amount)')
            .limit(100);
          queryData = allData || [];
        }
      } else if (audienceStr.startsWith('SPECIAL:')) {
        const specialId = audienceStr.split(':')[1];
        const { data: sRegs } = await client
          .from('special_event_registrations')
          .select('registration_id')
          .eq('special_event_id', specialId);
        const regIds = (sRegs || []).map((r) => r.registration_id);

        if (regIds.length > 0) {
          const { data: regList, error } = await client
            .from('registrations')
            .select('id, registration_code, status, participants(name, email, phone, college), payments(status, amount)')
            .in('id', regIds);
          if (error) throw error;
          queryData = regList || [];
        }
      } else if (audienceStr.startsWith('EVENT:')) {
        const eventId = audienceStr.split(':')[1];
        const { data: eRegs } = await client
          .from('selected_event_registrations')
          .select('registration_id')
          .eq('event_id', eventId);
        const regIds = (eRegs || []).map((r) => r.registration_id);

        if (regIds.length > 0) {
          const { data: regList, error } = await client
            .from('registrations')
            .select('id, registration_code, status, participants(name, email, phone, college), payments(status, amount)')
            .in('id', regIds);
          if (error) throw error;
          queryData = regList || [];
        }
      }

      // Map unique recipients with email addresses
      const emailMap = new Map();
      queryData.forEach((r) => {
        const p = Array.isArray(r.participants) ? r.participants[0] : r.participants;
        const email = p?.email?.trim();
        if (email && !emailMap.has(email.toLowerCase())) {
          const pay = Array.isArray(r.payments) ? r.payments[0] : r.payments;
          const isPaid = pay?.status === 'VERIFIED' || r.status === 'CONFIRMED';
          emailMap.set(email.toLowerCase(), {
            id: r.id,
            email,
            name: p.name || 'Participant',
            phone: p.phone || '',
            college: p.college || '',
            registration_code: r.registration_code || '',
            isPaid,
            paymentStatus: pay?.status || (isPaid ? 'VERIFIED' : 'PENDING'),
          });
        }
      });

      const uniqueList = Array.from(emailMap.values());
      setRecipients(uniqueList);
      // By default, select all in the fetched audience
      setSelectedEmails(new Set(uniqueList.map((item) => item.email)));
    } catch (err) {
      console.error('Failed to load recipients:', err);
      addToast(err.message || 'Failed to fetch recipients', 'error');
    } finally {
      setLoadingRecipients(false);
    }
  };

  useEffect(() => {
    if (audience) {
      loadRecipients(audience);
    }
  }, [audience, assignedEvents, assignedSpecialEvents]);

  // Filtered recipients based on search query & payment status filter
  const filteredRecipients = useMemo(() => {
    return recipients.filter((rec) => {
      if (paymentFilter === 'PAID' && !rec.isPaid) return false;
      if (paymentFilter === 'UNPAID' && rec.isPaid) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        rec.name.toLowerCase().includes(q) ||
        rec.email.toLowerCase().includes(q) ||
        rec.registration_code.toLowerCase().includes(q) ||
        rec.college.toLowerCase().includes(q)
      );
    });
  }, [recipients, searchQuery, paymentFilter]);

  // "Select Everyone" & "Select None" Actions
  const handleSelectEveryone = () => {
    // Selects everyone in the filtered list (or all recipients if not filtered)
    const allEmails = new Set(filteredRecipients.map((r) => r.email));
    setSelectedEmails((prev) => new Set([...prev, ...allEmails]));
    addToast(`Selected ${allEmails.size} recipients for confidential BCC.`, 'info');
  };

  const handleSelectAllSymposium = () => {
    const allEmails = new Set(recipients.map((r) => r.email));
    setSelectedEmails(allEmails);
    addToast(`Selected all ${allEmails.size} recipients in this audience.`, 'info');
  };

  const handleDeselectAll = () => {
    setSelectedEmails(new Set());
  };

  const toggleEmail = (email) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  // Preset Template loader
  const applyPresetTemplate = (type) => {
    if (type === 'PAYMENT_REMINDER') {
      setSubject('Payment Reminder: CyberSentinel 2K26 Registration');
      setMessage(
        `Dear participant,\n\nYour registration payment for CyberSentinel 2K26 has not been done or cleared yet.\n\nKindly pay it to take part in this event. If you have already transferred the registration fee, please verify your UTR reference on our participant verification portal.\n\nWarm regards,\nCyberSentinel Organizing Team`
      );
    } else if (type === 'SCHEDULE_UPDATE') {
      setSubject('Important Event Updates: CyberSentinel 2K26');
      setMessage(
        `Dear participant,\n\nPlease review the symposium guidelines and venue timings. Please make sure to arrive at the hall 15 minutes prior to the start with your entry pass.\n\nSee you at the event!\n\nBest regards,\nCyberSentinel Event Coordinators`
      );
    } else if (type === 'CONFIRMATION') {
      setSubject('Registration & Payment Confirmed - CyberSentinel 2K26');
      setMessage(
        `Dear participant,\n\nWe are pleased to inform you that your registration and payment for CyberSentinel 2K26 have been successfully confirmed!\n\nYou can access your entry pass on the portal. We look forward to seeing you at the event.\n\nWarm regards,\nCyberSentinel Organizing Team`
      );
    }
  };

  const handleSendGmail = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      addToast('Please enter both subject and message', 'error');
      return;
    }

    const bccList = Array.from(selectedEmails).filter(Boolean);
    if (bccList.length === 0) {
      addToast('Please select at least one recipient', 'error');
      return;
    }

    // Crucial: leave 'to' empty so ALL recipients receive it strictly via BCC (completely confidential)
    openGmailCompose({
      to: '',
      bcc: bccList,
      subject: subject.trim(),
      body: message.trim(),
    });

    addToast(
      `Gmail opened with ${bccList.length} recipients in confidential BCC!`,
      'success'
    );
  };

  const paidCount = recipients.filter((r) => r.isPaid).length;
  const unpaidCount = recipients.filter((r) => !r.isPaid).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-brand-cyan" />
            Participant Email Dispatcher
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Dispatch announcements and payment reminders. All recipients are placed in private BCC so their email addresses remain confidential.
          </p>
        </div>

        {/* Confidentiality Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-brand-cyan shrink-0" />
          <span>Confidential BCC Delivery Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Email Composer Form */}
        <div className="lg:col-span-6 space-y-4">
          <form onSubmit={handleSendGmail} className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-cyan" />
                Compose Message
              </h2>
              {/* Quick Template Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('PAYMENT_REMINDER')}
                  className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium hover:bg-amber-500/20 transition-colors"
                  title="Load respectful payment reminder text"
                >
                  Payment Reminder
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('SCHEDULE_UPDATE')}
                  className="px-2 py-1 rounded bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan text-[11px] font-medium hover:bg-brand-cyan/20 transition-colors"
                >
                  Schedule Update
                </button>
              </div>
            </div>

            {/* Target Audience Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Audience Scope
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-brand-cyan absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="cyber-input pl-9 text-sm w-full bg-slate-900 border border-cyber-border rounded-lg text-white"
                >
                  <option value="ASSIGNED_ALL">All My Assigned Events ({assignedEvents.length + assignedSpecialEvents.length} events)</option>
                  <option value="ALL">Everyone - All Symposium Registrations</option>
                  <option value="PENDING_PAYMENT">Participants with Pending / Incomplete Payment</option>
                  <optgroup label="Specific Assigned Events">
                    {assignedEvents.map((ev) => (
                      <option key={ev.id} value={`EVENT:${ev.id}`}>
                        {ev.code} · {ev.name} ({ev.day || 'Symposium'})
                      </option>
                    ))}
                    {assignedSpecialEvents.map((sp) => (
                      <option key={sp.id} value={`SPECIAL:${sp.id}`}>
                        Special · {sp.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Payment Reminder: CyberSentinel 2K26 Registration"
                className="cyber-input w-full text-sm"
              />
            </div>

            {/* Email Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Message Body *
              </label>
              <textarea
                rows={9}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your email message here..."
                className="cyber-input w-full text-sm font-sans"
              />
            </div>

            {/* Privacy Callout Banner */}
            <div className="p-3 rounded-lg border border-brand-cyan/20 bg-brand-cyan/5 text-xs text-slate-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Confidential BCC Guarantee</strong>
                All selected recipients ({selectedEmails.size}) will be automatically loaded into the <strong>BCC</strong> field. Each recipient receives the email privately without knowing or seeing any other recipient's email address.
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-cyan" />
                <span>
                  <strong>{selectedEmails.size}</strong> recipients selected in BCC
                </span>
              </div>

              <button
                type="submit"
                disabled={selectedEmails.size === 0 || !subject.trim() || !message.trim()}
                className="btn-primary text-sm flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-brand-cyan to-brand-blue disabled:opacity-50"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Gmail (BCC {selectedEmails.size})</span>
              </button>
            </div>
          </form>
        </div>

        {/* Recipients Panel with "Select Everyone" Bar */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-card p-6 flex flex-col h-full max-h-[720px]">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-cyber-border">
              <div>
                <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-cyan" />
                  Target Recipients ({recipients.length})
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedEmails.size} of {recipients.length} selected for email
                </span>
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Total: {recipients.length}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Paid: {paidCount}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Pending: {unpaidCount}
                </span>
              </div>
            </div>

            {/* DEDICATED "SELECT EVERYONE" ACTION BAR */}
            <div className="my-3 p-3 rounded-lg border border-brand-cyan/30 bg-cyber-dark/80 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-brand-cyan" />
                  Selection Bar
                </span>

                <div className="flex items-center gap-2">
                  {/* Select Everyone Button */}
                  <button
                    type="button"
                    onClick={handleSelectAllSymposium}
                    className="px-3 py-1.5 rounded-md bg-brand-cyan/20 border border-brand-cyan text-brand-cyan text-xs font-bold hover:bg-brand-cyan/30 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Select Everyone (All {recipients.length})
                  </button>

                  {/* Deselect All Button */}
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-slate-400 text-xs hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Live search input & filter tabs */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or code..."
                    className="w-full pl-8 pr-3 py-1 text-xs bg-slate-900 border border-cyber-border rounded text-slate-200 focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPaymentFilter('ALL')}
                    className={`px-2 py-1 rounded ${
                      paymentFilter === 'ALL'
                        ? 'bg-brand-cyan text-slate-950 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentFilter('UNPAID')}
                    className={`px-2 py-1 rounded ${
                      paymentFilter === 'UNPAID'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    Unpaid
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentFilter('PAID')}
                    className={`px-2 py-1 rounded ${
                      paymentFilter === 'PAID'
                        ? 'bg-emerald-400 text-slate-950 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    Paid
                  </button>
                </div>
              </div>
            </div>

            {/* Recipient List with Individual Checkboxes */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-[300px]">
              {loadingRecipients ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-brand-cyan" />
                  <span className="text-xs">Loading audience recipients...</span>
                </div>
              ) : filteredRecipients.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {searchQuery ? 'No participants match your search criteria.' : 'No recipients found in this audience.'}
                </div>
              ) : (
                filteredRecipients.map((rec) => {
                  const isChecked = selectedEmails.has(rec.email);
                  return (
                    <div
                      key={rec.email}
                      onClick={() => toggleEmail(rec.email)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'border-brand-cyan/50 bg-brand-cyan/10 text-white'
                          : 'border-cyber-border bg-cyber-dark/40 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan border-slate-700 bg-slate-800"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate flex items-center gap-1.5">
                            {rec.name}
                            {rec.college && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                · {rec.college}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {rec.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {rec.isPaid ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Unpaid
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-brand-cyan">
                          {rec.registration_code}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
