import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { storageService } from '../../services/storageService';
import {
  Bus as BusIcon,
  GraduationCap,
  MapPin,
  Clock,
  Shield,
  QrCode,
  Calendar,
  CheckCircle2,
  Info,
  Phone,
  Sparkles,
  ShieldCheck,
  BellRing,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';

interface StudentDashboardProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  activeTab = 'student-portal',
  onSelectTab,
}) => {
  const { currentUser } = useAuth();
  const { students, buses, routes, drivers, attendance, notices, language } = useData();

  // Strict dynamic binding to authenticated student (no fallbacks to arbitrary students)
  const student = students.find(
    s =>
      s.id === currentUser?.assignedStudentId ||
      s.id === currentUser?.profileId ||
      (currentUser?.email && s.name.toLowerCase() === currentUser?.name.toLowerCase())
  );

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto ring-8 ring-sky-50">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Student Record Not Found</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Your student account ({currentUser?.email}) is active, but is not currently linked to an active student registration at Kovai Valley Matriculation School.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left space-y-2">
            <div className="font-semibold text-slate-800">Resolution:</div>
            <p>Please visit the Transport Desk at the Peelamedu campus or have your parent update your transport profile in their portal.</p>
          </div>
        </div>
      </div>
    );
  }

  const bus = buses.find(b => b.id === student.assignedBusId);
  const route = routes.find(r => r.id === student.assignedRouteId);
  const driver = drivers.find(d => d.id === bus?.assignedDriverId);
  const pickupStop = route?.pickupPoints.find(p => p.id === student.pickupPointId) || route?.pickupPoints[0];

  // My attendance logs (strictly for this student)
  const myAttendance = attendance.filter(a => a.studentId === student?.id);

  // Safety Timeline (strictly for this student)
  const safetyTimeline = storageService.getStudentSafetyTimeline(student?.id);

  // Internal tab state
  const [internalTab, setInternalTab] = useState<'pass' | 'timeline' | 'attendance'>(() => {
    if (activeTab === 'student-timeline') return 'timeline';
    if (activeTab === 'student-attendance') return 'attendance';
    return 'pass';
  });

  React.useEffect(() => {
    if (activeTab === 'student-timeline') setInternalTab('timeline');
    else if (activeTab === 'student-attendance') setInternalTab('attendance');
    else if (activeTab === 'student-portal') setInternalTab('pass');
  }, [activeTab]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner with Indian School Branding */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <GraduationCap className="w-8 h-8 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                  Student Digital Bus Pass • Kovai Valley Matriculation School
                </span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                  VERIFIED STUDENT
                </span>
              </div>
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <p className="text-xs text-slate-300">
                {student.classGrade}-{student.section} • Roll #{student.rollNumber} • ID: {student.studentIdNumber}
              </p>
            </div>
          </div>

          <div className="bg-white/10 px-4 py-2.5 rounded-xl text-center border border-white/10 self-start sm:self-auto">
            <span className="text-[10px] uppercase text-slate-300 block font-semibold">Seat Number</span>
            <span className="text-xl font-bold text-white">Seat #{student.rollNumber}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/10">
          <button
            onClick={() => setInternalTab('pass')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'pass'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <BusIcon className="w-3.5 h-3.5" />
            <span>Smart Pass</span>
          </button>
          <button
            onClick={() => setInternalTab('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'timeline'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>My Transit Timeline (Feature F)</span>
          </button>
          <button
            onClick={() => setInternalTab('attendance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'attendance'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>My Attendance</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SMART BUS PASS */}
      {internalTab === 'pass' && (
        <div className="space-y-6">
          {/* Digital Smart Pass Card with simulated QR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="success">Active Bus Clearance</Badge>
                <span className="text-xs text-slate-400 font-mono">Academic Year 2026-2027</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                {route?.name} • {bus?.busNumber}
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block">Vehicle Registration:</span>
                  <span className="font-mono font-bold text-slate-800">{bus?.registrationNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Driver:</span>
                  <span className="font-semibold text-slate-800">{driver?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Designated Stop:</span>
                  <span className="font-semibold text-slate-800">{pickupStop?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Morning Departure:</span>
                  <span className="font-bold text-blue-600">{pickupStop?.morningTime}</span>
                </div>
              </div>

              <div className="pt-2 text-xs flex items-center gap-4 text-slate-500">
                <span>Driver Contact: <strong className="text-slate-800">{driver?.phone}</strong></span>
                <span>Campus Helpline: <strong className="text-blue-700">+91 422 257 8890</strong></span>
              </div>
            </div>

            {/* QR Code Simulation Graphic */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center shrink-0">
              <div className="w-28 h-28 bg-white border border-slate-300 rounded-xl p-2 flex items-center justify-center shadow-xs">
                {/* SVG QR Code Pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                  <rect x="0" y="0" width="30" height="30" rx="3" />
                  <rect x="5" y="5" width="20" height="20" fill="white" rx="2" />
                  <rect x="10" y="10" width="10" height="10" />
                  <rect x="70" y="0" width="30" height="30" rx="3" />
                  <rect x="75" y="5" width="20" height="20" fill="white" rx="2" />
                  <rect x="80" y="10" width="10" height="10" />
                  <rect x="0" y="70" width="30" height="30" rx="3" />
                  <rect x="5" y="75" width="20" height="20" fill="white" rx="2" />
                  <rect x="10" y="80" width="10" height="10" />
                  <rect x="40" y="10" width="10" height="10" />
                  <rect x="55" y="20" width="10" height="15" />
                  <rect x="35" y="40" width="30" height="15" />
                  <rect x="75" y="45" width="15" height="10" />
                  <rect x="45" y="65" width="20" height="20" />
                  <rect x="70" y="75" width="20" height="10" />
                </svg>
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-2 font-bold">
                {student.studentIdNumber}
              </span>
              <span className="text-[9px] text-slate-500 font-medium text-center">
                Simulated Student Identifier<br />(Visual ID Pass Only)
              </span>
            </div>
          </div>

          {/* Safety Guidelines and Transport Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Safety Guidelines */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Kovai Valley Transport Guidelines
              </h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Arrive at your pickup stop ({pickupStop?.name}) 5 minutes prior to departure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Present your SmartRoute digital student identifier or school ID to driver upon boarding.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Remain seated in designated Seat #{student.rollNumber} while the bus is in motion on {route?.name}.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>In case of emergency, immediately inform Driver {driver?.name} or call dispatch: +91 422 257 8890.</span>
                </li>
              </ul>
            </div>

            {/* Quick Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BusIcon className="w-4 h-4 text-blue-600" />
                Bus Route Profile
              </h3>
              <div className="text-xs space-y-2 text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Route Corridor:</span>
                  <span className="font-semibold text-slate-800">{route ? route.name : 'Corridor Unassigned'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Pickup Stop:</span>
                  <span className="font-semibold text-slate-800">{pickupStop?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Morning Pickup:</span>
                  <span className="font-bold text-emerald-600">{pickupStop?.morningTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Afternoon Drop:</span>
                  <span className="font-bold text-blue-600">{pickupStop?.afternoonTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAFETY TIMELINE (FEATURE F) */}
      {internalTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Feature F: Student Daily Transit Safety Timeline
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Live progression of your journey from home departure to safe return.
            </p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {safetyTimeline.map((item, index) => {
              const isCompleted = item.status === 'completed';
              const isInProgress = item.status === 'in_progress';
              const isDelayed = item.status === 'delayed';

              return (
                <div key={item.id} className="relative group">
                  <div
                    className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isInProgress
                        ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                        : isDelayed
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="ml-3 p-4 rounded-xl border border-slate-100 bg-slate-50/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.title}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{item.timestamp}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                    <div className="pt-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE HISTORY */}
      {internalTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            My Boarding History
          </h3>
          <div className="space-y-2">
            {myAttendance.map(att => (
              <div
                key={att.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">
                    {att.date} • {att.session} Session
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {att.markedTime ? `Boarded at ${att.markedTime}` : 'Absent'} • {att.remarks || 'Scanned'}
                  </span>
                </div>
                <StatusBadge status={att.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* School Notices for Students */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <BellRing className="w-4 h-4 text-blue-600" />
          School Transport Announcements
        </h3>
        <div className="divide-y divide-slate-100">
          {notices
            .filter(n => n.audience === 'All' || n.audience === 'Students')
            .map(n => (
              <div key={n.id} className="py-2.5 text-xs space-y-1">
                <span className="font-bold text-slate-800">
                  {language === 'ta' && n.titleTa ? n.titleTa : n.title}
                </span>
                <p className="text-slate-600">
                  {language === 'ta' && n.contentTa ? n.contentTa : n.content}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
