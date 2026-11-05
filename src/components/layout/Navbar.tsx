import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Bus,
  Bell,
  LogOut,
  User,
  Shield,
  Car,
  Heart,
  GraduationCap,
  ChevronDown,
  Globe,
  MapPin,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { TestRunnerModal } from '../common/TestRunnerModal';

export const Navbar: React.FC<{
  toggleSidebar?: () => void;
  onNavigate?: (tab: string) => void;
}> = ({ toggleSidebar, onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const { notices, settings, missedAlerts, disruptions, language, setLanguage } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);

  // Active alerts
  const activeMissedAlerts = missedAlerts.filter(a => a.status === 'Active');
  const activeDisruptions = disruptions.filter(d => d.status === 'Active' || d.status === 'Approved');

  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const roleBadgeColor = {
    admin: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    driver: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    parent: 'bg-amber-100 text-amber-800 border-amber-200',
    student: 'bg-sky-100 text-sky-800 border-sky-200',
  }[currentUser?.role || 'admin'];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onNavigate && onNavigate('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-tight">
                  Kovai Valley
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  SmartRoute
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none truncate max-w-[200px] sm:max-w-none flex items-center gap-1">
                <span>Coimbatore, Tamil Nadu</span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="hidden sm:inline text-slate-400">Affiliation: {settings.affiliationNumber}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right Actions (NO ROLE SWITCHER BUTTONS!) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bilingual Language Switcher Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                language === 'en'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                language === 'ta'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* Quick-Access JUnit 5 Automated Test Suite */}
          <button
            onClick={() => setIsTestRunnerOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Open JUnit 5 Automated Test Suite (Student Transport & Safety Module)"
          >
            <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">JUnit Tests</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1 rounded font-bold">10✔</span>
          </button>

          {/* Active alerts icon if any missed boarding or disruption */}
          {(activeMissedAlerts.length > 0 || activeDisruptions.length > 0) && (
            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title={`${activeMissedAlerts.length} Missed Boarding Alerts, ${activeDisruptions.length} Route Disruptions`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="hidden md:inline">
                {activeMissedAlerts.length + activeDisruptions.length} Alerts
              </span>
            </button>
          )}

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
              aria-label="School Notices"
            >
              <Bell className="w-5 h-5" />
              {notices.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="font-semibold text-sm text-slate-900">
                    {language === 'ta' ? 'பள்ளி போக்குவரத்து அறிவிப்புகள்' : 'Transport Bulletins & Alerts'}
                  </div>
                  <span className="text-xs text-blue-600 font-medium">
                    {notices.length} active
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto my-2">
                  {notices.slice(0, 4).map(notice => (
                    <div key={notice.id} className="py-2.5 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {language === 'ta' && notice.titleTa ? notice.titleTa : notice.title}
                        </span>
                        {notice.isUrgent && <Badge variant="danger">Urgent</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {language === 'ta' && notice.contentTa ? notice.contentTa : notice.content}
                      </p>
                      <div className="text-[10px] text-slate-400">
                        {notice.publishDate} • Kovai Valley Matriculation School
                      </div>
                    </div>
                  ))}
                </div>

                {onNavigate && (
                  <button
                    onClick={() => {
                      onNavigate('notices');
                      setShowNotifications(false);
                    }}
                    className="w-full text-center py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 border-t border-slate-100 block transition-colors"
                  >
                    {language === 'ta' ? 'அனைத்து அறிவிப்புகளையும் பார்க்கவும்' : 'View All Notices'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User profile dropdown (NO ROLE SWITCHER) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              {/* Initials-based avatar instead of foreign stock photos */}
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold text-xs flex items-center justify-center ring-1 ring-blue-200 shadow-xs">
                {currentUser ? getInitials(currentUser.name) : 'KV'}
              </div>

              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.name}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {currentUser?.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                  <div className="mt-1.5">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadgeColor} uppercase`}>
                      {currentUser?.role} PORTAL
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  {currentUser?.role === 'admin' && onNavigate && (
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      School Settings & Fleet Control
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 text-left flex items-center gap-2 font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JUnit Test Runner Modal */}
      <TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />
    </header>
  );
};
