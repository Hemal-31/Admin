import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { getParticipantsForAudience } from '../../services/adminService';
import { openGmailCompose } from '../../utils/helpers';
import {
  Mail,
  Send,
  CheckSquare,
  Square,
  Filter,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  Sparkles,
} from 'lucide-react';

export function AdminEmails() {
  const { addToast } = useToast();

  const [template, setTemplate] = useState('Payment reminder');
  const [subject, setSubject] = useState('Payment Reminder: CyberSentinel 2K26 Registration');
  const [message, setMessage] = useState(
    `Dear participant,\n\nYour registration payment for CyberSentinel 2K26 has not been done or cleared yet.\n\nKindly pay it to take part in this event. If you have already completed the transaction, please check your status on the verification portal.\n\nWarm regards,\nCyberSentinel Organizing Committee`
  );

  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, verified, unverified, present, absent
  const [selectedEmails, setSelectedEmails] = useState(new Set());

  // Template change presets
  useEffect(() => {
    if (template === 'Registration confirmed') {
      setSubject('CyberSentinel 2K26 - Registration Verified & Entry Pass Confirmed');
      setMessage(
        `Dear participant,\n\nWe are pleased to inform you that your registration and payment for CyberSentinel 2K26 have been verified and confirmed.\n\nYou can access your official entry pass on our checking portal at any time.\n\nPlease arrive on time and bring your digital pass.\n\nWarm regards,\nCyberSentinel Organizing Committee`
      );
    } else if (template === 'Payment reminder') {
      setSubject('Payment Reminder: CyberSentinel 2K26 Registration');
      setMessage(
        `Dear participant,\n\nYour registration payment for CyberSentinel 2K26 has not been done or cleared yet.\n\nKindly pay it to take part in this event. If you have already completed the transaction, please check your status on the verification portal.\n\nWarm regards,\nCyberSentinel Organizing Committee`
      );
    } else if (template === 'Event announcement') {
      setSubject('CyberSentinel 2K26 - Important Event Updates & Guidelines');
      setMessage(
        `Dear participant,\n\nPlease review the symposium schedule and guidelines on our official portal. All workshops and technical events will kick off promptly as scheduled.\n\nSee you at the symposium!\n\nBest regards,\nCyberSentinel Operations Team`
      );
    }
  }, [template]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getParticipantsForAudience();
        // Keep valid email recipients
        const validList = (data || []).filter((p) => p.email && p.email.trim());
        setParticipants(validList);
        // By default select all participants
        setSelectedEmails(new Set(validList.map((p) => p.email.trim())));
      } catch (err) {
        console.error('Error loading audience:', err);
        addToast({
          title: 'Failed to load recipients',
          message: err.message,
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      if (statusFilter === 'verified' && !p.isVerified) return false;
      if (statusFilter === 'unverified' && p.isVerified) return false;
      if (statusFilter === 'present' && !p.isPresent) return false;
      if (statusFilter === 'absent' && !p.isAbsent) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.registration_code && p.registration_code.toLowerCase().includes(q)) ||
        (p.college && p.college.toLowerCase().includes(q))
      );
    });
  }, [participants, search, statusFilter]);

  function handleSelectEveryone() {
    const allEmails = new Set(participants.map((p) => p.email.trim()));
    setSelectedEmails(allEmails);
    addToast({
      title: 'Everyone Selected',
      message: `Selected all ${allEmails.size} participants for confidential BCC delivery.`,
      type: 'info',
    });
  }

  function handleSelectFiltered() {
    const filteredEmails = new Set(filtered.map((p) => p.email.trim()));
    setSelectedEmails((prev) => new Set([...prev, ...filteredEmails]));
    addToast({
      title: 'Filtered List Selected',
      message: `Selected ${filteredEmails.size} matching participants.`,
      type: 'info',
    });
  }

  function handleClearSelection() {
    setSelectedEmails(new Set());
  }

  function toggleEmail(email) {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      const cleanEmail = email.trim();
      if (next.has(cleanEmail)) next.delete(cleanEmail);
      else next.add(cleanEmail);
      return next;
    });
  }

  function handleSend() {
    const targets = Array.from(selectedEmails).filter(Boolean);

    if (!targets.length) {
      addToast({
        title: 'Recipients Missing',
        message: 'Please click "Select Everyone" or check at least one recipient.',
        type: 'error',
      });
      return;
    }

    if (!subject.trim() || !message.trim()) {
      addToast({
        title: 'Incomplete Email',
        message: 'Please enter both subject and message body.',
        type: 'error',
      });
      return;
    }

    // Crucial: leave 'to' empty so all recipients are in BCC, guaranteeing privacy so nobody sees other emails
    openGmailCompose({
      to: '',
      bcc: targets,
      subject: subject.trim(),
      body: message.trim(),
    });

    addToast({
      title: 'Gmail Compose Opened',
      message: `BCC list populated with ${targets.length} recipients. Individual emails will remain confidential.`,
      type: 'success',
    });
  }

  const verifiedCount = participants.filter((p) => p.isVerified).length;
  const unverifiedCount = participants.filter((p) => !p.isVerified).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-brand-cyan" />
            Email Dispatch Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Dispatch announcements and payment reminders. All recipients are placed in private BCC so their emails remain completely confidential.
          </p>
        </div>

        {/* Confidentiality Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-brand-cyan shrink-0" />
          <span>Confidential BCC Delivery Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Composer Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-cyan" />
                Compose Direct Email
              </h2>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTemplate('Payment reminder')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                    template === 'Payment reminder'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  Payment Reminder
                </button>
                <button
                  type="button"
                  onClick={() => setTemplate('Event announcement')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                    template === 'Event announcement'
                      ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  Announcement
                </button>
              </div>
            </div>

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Communication Preset
              </label>
              <select
                className="cyber-input w-full text-sm bg-slate-900 border border-cyber-border rounded-lg text-white"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                <option value="Payment reminder">Payment Reminder (Unpaid / Pending)</option>
                <option value="Registration confirmed">Registration Confirmed (Verified)</option>
                <option value="Event announcement">General Event Announcement</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Subject Line *
              </label>
              <input
                type="text"
                required
                className="cyber-input w-full text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Message Body *
              </label>
              <textarea
                rows={9}
                required
                className="cyber-input w-full text-sm font-sans"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Confidentiality Callout */}
            <div className="p-3 rounded-lg border border-brand-cyan/20 bg-brand-cyan/5 text-xs text-slate-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Recipient Privacy Safeguard</strong>
                All selected recipients ({selectedEmails.size}) will be dispatched in <strong>BCC</strong>. Individual participants will never see other participants' emails.
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-cyan" />
                <span>
                  <strong>{selectedEmails.size}</strong> recipients selected in BCC
                </span>
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={selectedEmails.size === 0 || !subject.trim() || !message.trim()}
                className="btn-primary text-sm flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-brand-cyan to-brand-blue disabled:opacity-50"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Gmail (BCC {selectedEmails.size})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recipients Panel & "Select Everyone" Bar */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-card p-6 flex flex-col h-full max-h-[720px]">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-cyber-border">
              <div>
                <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-cyan" />
                  Target Recipients ({participants.length})
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedEmails.size} of {participants.length} selected for email
                </span>
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Total: {participants.length}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Paid: {verifiedCount}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Unpaid: {unverifiedCount}
                </span>
              </div>
            </div>

            {/* DEDICATED "SELECT EVERYONE" ACTION BAR */}
            <div className="my-3 p-3 rounded-lg border border-brand-cyan/30 bg-cyber-dark/80 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-brand-cyan" />
                  Select Bar
                </span>

                <div className="flex items-center gap-2">
                  {/* Select Everyone Button */}
                  <button
                    type="button"
                    onClick={handleSelectEveryone}
                    className="px-3 py-1.5 rounded-md bg-brand-cyan/20 border border-brand-cyan text-brand-cyan text-xs font-bold hover:bg-brand-cyan/30 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Select Everyone (All {participants.length})
                  </button>

                  {/* Clear Selection */}
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-slate-400 text-xs hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, college, code..."
                    className="w-full pl-8 pr-3 py-1 text-xs bg-slate-900 border border-cyber-border rounded text-slate-200 focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2 py-1 rounded ${
                      statusFilter === 'all'
                        ? 'bg-brand-cyan text-slate-950 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('unverified')}
                    className={`px-2 py-1 rounded ${
                      statusFilter === 'unverified'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    Unpaid
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('verified')}
                    className={`px-2 py-1 rounded ${
                      statusFilter === 'verified'
                        ? 'bg-emerald-400 text-slate-950 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    Paid
                  </button>
                </div>
              </div>
            </div>

            {/* Recipient Rows with Checkboxes */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-[300px]">
              {loading ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Loading participants list...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {search ? 'No participants match your search.' : 'No participants found.'}
                </div>
              ) : (
                filtered.map((p) => {
                  const isChecked = selectedEmails.has(p.email.trim());
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleEmail(p.email)}
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
                            {p.name}
                            {p.college && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                · {p.college}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {p.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {p.isVerified ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Unpaid
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-brand-cyan">
                          {p.registration_code}
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

export default AdminEmails;
