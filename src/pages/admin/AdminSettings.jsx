import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Settings as SettingsIcon,
  Shield,
  Save,
  CheckCircle2,
  Mail,
  Lock,
  Globe,
  Bell,
  Sparkles,
} from 'lucide-react';

export default function AdminSettings() {
  const { adminProfile } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('General');

  const [profileName, setProfileName] = useState(adminProfile?.name || 'Admin');
  const [profileEmail, setProfileEmail] = useState(adminProfile?.email || 'admin@cybersentinel.in');
  const [profileRole, setProfileRole] = useState(adminProfile?.role || 'Super Admin');

  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [requireDocUpload, setRequireDocUpload] = useState(false);
  const [autoVerification, setAutoVerification] = useState(true);
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);
  const [welcomeSubject, setWelcomeSubject] = useState('Welcome to Cyber Sentinel 2K26');
  const [reminderInterval, setReminderInterval] = useState('24h');
  const [mfaRequired, setMfaRequired] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('45 minutes');

  const [isSaving, setIsSaving] = useState(false);

  const tabs = ['General', 'Events', 'Mail Templates', 'Security'];

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addToast('Settings updated successfully!', 'success');
    }, 600);
  };

  const renderTabContent = () => {
    if (activeTab === 'General') {
      return (
        <div className="glass-card p-6 border-white/[0.08] space-y-4">
          <h2 className="text-base font-bold font-heading text-white tracking-wide border-b border-white/[0.06] pb-3">
            Admin Profile
          </h2>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
              <label className="text-slate-400 font-medium">Name</label>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="cyber-input w-full text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
              <label className="text-slate-400 font-medium">Email</label>
              <div className="sm:col-span-2">
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="cyber-input w-full text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
              <label className="text-slate-400 font-medium">Role</label>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  disabled
                  value={profileRole}
                  className="cyber-input w-full text-xs opacity-70 bg-black/40 font-mono text-brand-purple"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'Events') {
      return (
        <div className="glass-card p-6 border-white/[0.08] space-y-4">
          <h2 className="text-base font-bold font-heading text-white tracking-wide border-b border-white/[0.06] pb-3">
            Event Settings
          </h2>

          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Registration Open</div>
                <div className="text-slate-500 mt-0.5">
                  Allow public visitors to register for Day 1 and Day 2 events
                </div>
              </div>
              <label className="cyber-switch shrink-0">
                <input
                  type="checkbox"
                  checked={registrationOpen}
                  onChange={(e) => setRegistrationOpen(e.target.checked)}
                />
                <span className="cyber-slider"></span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
              <div>
                <div className="font-semibold text-white">Require Document Upload</div>
                <div className="text-slate-500 mt-0.5">
                  Demand student ID card and bonafide certificate at registration
                </div>
              </div>
              <label className="cyber-switch shrink-0">
                <input
                  type="checkbox"
                  checked={requireDocUpload}
                  onChange={(e) => setRequireDocUpload(e.target.checked)}
                />
                <span className="cyber-slider"></span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
              <div>
                <div className="font-semibold text-white">Auto Verification for College Mail IDs</div>
                <div className="text-slate-500 mt-0.5">
                  Automatically verify registrations from official partner domains
                </div>
              </div>
              <label className="cyber-switch shrink-0">
                <input
                  type="checkbox"
                  checked={autoVerification}
                  onChange={(e) => setAutoVerification(e.target.checked)}
                />
                <span className="cyber-slider"></span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
              <div>
                <div className="font-semibold text-white">Send Confirmation Email</div>
                <div className="text-slate-500 mt-0.5">
                  Dispatches pass badge link immediately upon payment approval
                </div>
              </div>
              <label className="cyber-switch shrink-0">
                <input
                  type="checkbox"
                  checked={sendConfirmationEmail}
                  onChange={(e) => setSendConfirmationEmail(e.target.checked)}
                />
                <span className="cyber-slider"></span>
              </label>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'Mail Templates') {
      return (
        <div className="glass-card p-6 border-white/[0.08] space-y-4">
          <h2 className="text-base font-bold font-heading text-white tracking-wide border-b border-white/[0.06] pb-3">
            Mail Templates
          </h2>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-slate-400 font-medium">Welcome subject</label>
                <input
                  type="text"
                  value={welcomeSubject}
                  onChange={(e) => setWelcomeSubject(e.target.value)}
                  className="cyber-input w-full text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-medium">Reminder cadence</label>
                <select
                  value={reminderInterval}
                  onChange={(e) => setReminderInterval(e.target.value)}
                  className="cyber-input w-full text-xs"
                >
                  <option value="12h">12 hours</option>
                  <option value="24h">24 hours</option>
                  <option value="48h">48 hours</option>
                  <option value="72h">72 hours</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-slate-950/50 p-4 text-slate-300">
              <div className="text-[10px] uppercase tracking-[0.24em] text-brand-cyan">Preview</div>
              <div className="mt-3 text-white font-semibold">{welcomeSubject}</div>
              <p className="mt-2 text-slate-400">
                Hello team, your Cyber Sentinel registration is confirmed. We will send the next reminder in{' '}
                <span className="text-brand-cyan">{reminderInterval}</span>.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="glass-card p-6 border-white/[0.08] space-y-4">
        <h2 className="text-base font-bold font-heading text-white tracking-wide border-b border-white/[0.06] pb-3">
          Security
        </h2>

        <div className="space-y-5 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Require MFA</div>
              <div className="text-slate-500 mt-0.5">Enforce multi-factor verification for privileged admin access</div>
            </div>
            <label className="cyber-switch shrink-0">
              <input type="checkbox" checked={mfaRequired} onChange={(e) => setMfaRequired(e.target.checked)} />
              <span className="cyber-slider"></span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <div>
              <div className="font-semibold text-white">Session timeout</div>
              <div className="text-slate-500 mt-0.5">Automatically sign out inactive administrators after a set duration</div>
            </div>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="cyber-input text-xs min-w-[140px]"
            >
              <option value="15 minutes">15 minutes</option>
              <option value="30 minutes">30 minutes</option>
              <option value="45 minutes">45 minutes</option>
              <option value="60 minutes">60 minutes</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage admin preferences</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                : 'text-slate-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {renderTabContent()}

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={isSaving} className="btn-cyber-login text-xs py-2.5 px-8">
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
