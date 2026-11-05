import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Users,
  Bus,
  UserCheck,
  Map,
  ArrowLeftRight,
  ClipboardCheck,
  Navigation,
  MessageSquareWarning,
  BellRing,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Heart,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser } = useAuth();
  const { complaints, students, parents, buses, trips, handovers, missedAlerts, disruptions } = useData();

  const pendingComplaintsCount = complaints.filter(
    c => c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'In Progress'
  ).length;

  const activeTripsCount = trips.filter(t => t.status === 'Started' || t.status === 'Delayed').length;
  const pendingHandoversCount = handovers.filter(
    h => h.status === 'Arrived at Drop-off' || h.status === 'Awaiting Guardian Verification' || h.status === 'Escalated'
  ).length;
  const activeMissedCount = missedAlerts.filter(a => a.status === 'Active').length;
  const activeDisruptionsCount = disruptions.filter(d => d.status === 'Active' || d.status === 'Approved').length;

  // Admin Navigation Links
  const adminLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users, badge: students.length },
    { id: 'parents', label: 'Parents & Guardians', icon: Heart, badge: parents.length },
    { id: 'buses', label: 'Bus Fleet', icon: Bus, badge: buses.length },
    { id: 'drivers', label: 'Drivers', icon: UserCheck },
    { id: 'routes', label: 'Routes & Stops', icon: Map },
    { id: 'allocation', label: 'Seat Allocation', icon: ArrowLeftRight },
    {
      id: 'trips',
      label: 'Trip Management',
      icon: Navigation,
      badge: activeTripsCount > 0 ? `${activeTripsCount} live` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'attendance',
      label: 'Daily Attendance',
      icon: ClipboardCheck,
      badge: activeMissedCount > 0 ? `${activeMissedCount} missed` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'handovers',
      label: 'Guardian Handovers',
      icon: KeyRound,
      badge: pendingHandoversCount > 0 ? `${pendingHandoversCount} pending` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'disruptions',
      label: 'Route Disruptions',
      icon: AlertTriangle,
      badge: activeDisruptionsCount > 0 ? `${activeDisruptionsCount} active` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'complaints',
      label: 'Complaints',
      icon: MessageSquareWarning,
      badge: pendingComplaintsCount > 0 ? pendingComplaintsCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    { id: 'notices', label: 'Bilingual Notices', icon: BellRing },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: ShieldCheck },
    { id: 'settings', label: 'Settings & Fleet', icon: Settings },
  ];

  // Driver Navigation Links
  const driverLinks = [
    { id: 'driver-console', label: 'Trip Console', icon: Navigation },
    { id: 'driver-attendance', label: 'Student Boarding', icon: ClipboardCheck },
    {
      id: 'driver-handovers',
      label: 'Handover Verification',
      icon: KeyRound,
      badge: pendingHandoversCount > 0 ? pendingHandoversCount : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    { id: 'driver-readiness', label: 'Pickup Readiness', icon: Clock },
    { id: 'driver-route', label: 'Route & Stops', icon: Map },
    { id: 'notices', label: 'School Notices', icon: BellRing },
  ];

  // Parent Navigation Links
  const parentLinks = [
    { id: 'parent-portal', label: 'Child Transit', icon: Bus },
    { id: 'parent-handover', label: 'Handover PIN & Safety', icon: KeyRound },
    { id: 'parent-timeline', label: 'Safety Timeline', icon: ShieldCheck },
    { id: 'parent-attendance', label: 'Attendance Log', icon: ClipboardCheck },
    { id: 'complaints', label: 'Complaints & Help', icon: MessageSquareWarning },
    { id: 'notices', label: 'School Notices', icon: BellRing },
  ];

  // Student Navigation Links
  const studentLinks = [
    { id: 'student-portal', label: 'My Bus Pass', icon: Bus },
    { id: 'student-timeline', label: 'My Transit Timeline', icon: ShieldCheck },
    { id: 'student-attendance', label: 'My Attendance', icon: ClipboardCheck },
    { id: 'notices', label: 'School Notices', icon: BellRing },
  ];

  let links = adminLinks;
  if (currentUser?.role === 'driver') links = driverLinks;
  if (currentUser?.role === 'parent') links = parentLinks;
  if (currentUser?.role === 'student') links = studentLinks;

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col justify-between ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* Section title */}
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {currentUser?.role === 'admin'
                ? 'Kovai Valley Operations'
                : `${currentUser?.role?.toUpperCase()} PORTAL`}
            </div>
          )}

          {links.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />

                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}

                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || (isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer with Collapse Toggle & System Status */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          {!isCollapsed && (
            <div className="mb-3 p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-900">
              <div className="flex items-center justify-between font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Coimbatore Fleet
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">ALL 5 BUSES ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                TN-38, TN-37, TN-66, TN-40 • 50 students registered
              </p>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
