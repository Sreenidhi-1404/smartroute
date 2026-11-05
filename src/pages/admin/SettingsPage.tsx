import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Settings,
  User,
  Shield,
  Bell,
  School,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Users,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings, updateSettings, resetAllData, showToast } = useData();

  const [activeTab, setActiveTab] = useState<'school' | 'notifications' | 'profile' | 'security' | 'users'>('school');

  // Form states
  const [schoolForm, setSchoolForm] = useState({ ...settings });
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || 'Thiru. S. Ramanathan',
    email: currentUser?.email || 'admin@kovaivalley.edu.in',
    phone: currentUser?.phone || '+91 94431 10001',
  });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });

  const handleSaveSchoolSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(schoolForm);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      showToast('error', 'New passwords do not match.', 'Password Error');
      return;
    }
    showToast('success', 'Password updated successfully.', 'Security Saved');
    setPasswords({ current: '', newPass: '', confirm: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Fleet Settings & Administrative Control
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure institutional transport policies, notification dispatches, and access permissions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'school', label: 'School Info', icon: School },
          { id: 'notifications', label: 'Dispatch Alerts', icon: Bell },
          { id: 'profile', label: 'Admin Profile', icon: User },
          { id: 'security', label: 'Security & Password', icon: Lock },
          { id: 'users', label: 'User & Role Access', icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: School Information Settings */}
      {activeTab === 'school' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">School & Fleet Institutional Details</h3>
            <p className="text-xs text-slate-500">
              Displayed on public notices, print reports, and parent portals.
            </p>
          </div>

          <form onSubmit={handleSaveSchoolSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  value={schoolForm.schoolName}
                  onChange={e => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={schoolForm.academicYear}
                  onChange={e => setSchoolForm({ ...schoolForm, academicYear: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Transport Director / Manager</label>
                <input
                  type="text"
                  value={schoolForm.transportManager}
                  onChange={e => setSchoolForm({ ...schoolForm, transportManager: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Emergency Dispatch Hotline</label>
                <input
                  type="text"
                  value={schoolForm.emergencyHotline}
                  onChange={e => setSchoolForm({ ...schoolForm, emergencyHotline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={schoolForm.contactEmail}
                  onChange={e => setSchoolForm({ ...schoolForm, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={schoolForm.contactPhone}
                  onChange={e => setSchoolForm({ ...schoolForm, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Campus Address</label>
              <input
                type="text"
                value={schoolForm.address}
                onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                Save Institutional Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Dispatch & Notification Preferences */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Automated Notification Policies</h3>
            <p className="text-xs text-slate-500">
              Control SMS and in-app push triggers dispatched to guardians and drivers.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block">Bus Delay Broadcast</span>
                <p className="text-slate-500 mt-0.5">
                  Automatically alert parents when a bus trip is logged with a delay exceeding 10 minutes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnDelay}
                onChange={e => updateSettings({ ...settings, notifyOnDelay: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded mt-1"
              />
            </div>

            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block">Instant Boarding Alerts</span>
                <p className="text-slate-500 mt-0.5">
                  Send parent notifications when the student card is scanned as "Boarded" at their stop.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnBoarding}
                onChange={e => updateSettings({ ...settings, notifyOnBoarding: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded mt-1"
              />
            </div>

            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block">Absence Roll Call Check</span>
                <p className="text-slate-500 mt-0.5">
                  Trigger automated dispatch call if a student is absent without prior parental notice.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAttendanceNotification}
                onChange={e => updateSettings({ ...settings, autoAttendanceNotification: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Administrator Profile</h3>
            <p className="text-xs text-slate-500">
              Manage personal credentials and transport contact details.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200"
            />
            <div>
              <h4 className="font-bold text-sm text-slate-900">{profileForm.name}</h4>
              <Badge variant="info">Full Administrator Access</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Change Account Password</h3>
            <p className="text-xs text-slate-500">
              Update password credentials for administrative portal access.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={passwords.current}
                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwords.newPass}
                  onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: User & Role Access Matrix */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-slate-500">
              Permission boundaries enforced across Administrator, Driver, Parent, and Student portals.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-4 py-3">Permission Capability</th>
                  <th className="px-4 py-3 text-center">Administrator</th>
                  <th className="px-4 py-3 text-center">Driver</th>
                  <th className="px-4 py-3 text-center">Parent</th>
                  <th className="px-4 py-3 text-center">Student</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="px-4 py-2.5 font-medium">Student & Fleet CRUD Operations</td>
                  <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium">Transport Allocation & Capacity Assignment</td>
                  <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium">Daily Attendance Roll Call</td>
                  <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full</td>
                  <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Mark Assigned Bus</td>
                  <td className="px-4 py-2.5 text-center text-slate-400">Read Own Child</td>
                  <td className="px-4 py-2.5 text-center text-slate-400">Read Own</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium">Trip Dispatch & Delay Logging</td>
                  <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full</td>
                  <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Start / Log Delay</td>
                  <td className="px-4 py-2.5 text-center text-slate-400">Live Status Read</td>
                  <td className="px-4 py-2.5 text-center text-slate-400">Live Status Read</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium">Complaint Submission & Resolution</td>
                  <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Resolve / Manage</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                  <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Submit & Track</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium">System Reset & Demonstration Data</td>
                  <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                  <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Reset Demo Data Card */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-rose-600" />
                Reset Application Demonstration Records
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                Restores original 50 students, 5 buses, 5 drivers, 5 routes, and seed attendance.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all SmartRoute records back to default demo state?')) {
                  resetAllData();
                }
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs self-start sm:self-auto shrink-0"
            >
              Reset All Demo Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
