import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { storageService } from '../../services/storageService';
import { ComplaintCategory, ComplaintPriority, ReadinessStatus } from '../../types';
import {
  Bus as BusIcon,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  MessageSquareWarning,
  Plus,
  Send,
  Sparkles,
  Shield,
  User,
  Heart,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Users,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

interface ParentDashboardProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  activeTab = 'parent-portal',
  onSelectTab,
}) => {
  const { currentUser } = useAuth();
  const {
    students,
    buses,
    routes,
    drivers,
    trips,
    attendance,
    complaints,
    addComplaint,
    notices,
    handovers,
    regenerateHandoverPin,
    generateOrActivateHandoverPin,
    missedAlerts,
    readinessRecords,
    setPickupReadiness,
    acknowledgeMissedAlert,
    language,
    showToast,
    getStudentsForParent,
    notifications,
    markNotificationRead,
  } = useData();

  // All linked children for this parent account (strictly authenticated parent's children)
  const myChildren = getStudentsForParent(
    currentUser?.profileId || currentUser?.id || currentUser?.email || ''
  );

  const [selectedChildId, setSelectedChildId] = useState<string>(() => {
    return myChildren[0]?.id || '';
  });

  // Ensure selected child stays valid
  useEffect(() => {
    if (myChildren.length > 0 && !myChildren.some(c => c.id === selectedChildId)) {
      setSelectedChildId(myChildren[0].id);
    }
  }, [myChildren, selectedChildId]);

  const selectedChild = myChildren.find(c => c.id === selectedChildId) || myChildren[0];

  const [pinCopied, setPinCopied] = useState(false);

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setPinCopied(true);
    showToast('success', `Verification PIN ${pin} copied to clipboard.`, 'PIN Copied');
    setTimeout(() => setPinCopied(false), 2000);
  };

  const bus = buses.find(b => b.id === selectedChild?.assignedBusId);
  const route = routes.find(r => r.id === selectedChild?.assignedRouteId);
  const driver = drivers.find(d => d.id === bus?.assignedDriverId);
  const pickupStop = route?.pickupPoints.find(p => p.id === selectedChild?.pickupPointId);

  // Active trip status for child's bus
  const activeTrip = trips.find(t => t.busId === bus?.id && (t.status === 'Started' || t.status === 'Delayed'));

  // Child attendance records
  const childAttendance = attendance.filter(a => a.studentId === selectedChild?.id);

  // Feature A: Handover records & dynamic OTP
  const childHandover = handovers.find(h => h.studentId === selectedChild?.id);
  const [showPin, setShowPin] = useState(true);
  const [isGuardianPassModalOpen, setIsGuardianPassModalOpen] = useState(false);

  // Parent notifications
  const myNotifications = notifications.filter(
    n =>
      n.recipientRole === 'parent' &&
      (n.studentId === selectedChild?.id ||
        myChildren.some(c => c.id === n.studentId) ||
        n.recipientId === currentUser?.email ||
        n.recipientId === 'parent')
  );

  // Feature B: Missed boarding alerts for this child
  const childMissedAlerts = missedAlerts.filter(
    a => a.studentId === selectedChild?.id && a.status === 'Active'
  );

  // Feature C: Readiness record
  const currentReadiness = readinessRecords.find(
    r => r.studentId === selectedChild?.id && r.date === '31-10-2026'
  );
  const [readinessStatus, setReadinessStatus] = useState<ReadinessStatus>(
    currentReadiness?.status || 'Ready for Pickup'
  );
  const [readinessNotes, setReadinessNotes] = useState(currentReadiness?.notes || '');
  const [pickupPerson, setPickupPerson] = useState(currentReadiness?.pickupPersonName || 'Priya R (Mother)');

  // Feature F: Safety Timeline
  const safetyTimeline = storageService.getStudentSafetyTimeline(selectedChild?.id);

  // Parent's submitted complaints
  const myComplaints = complaints.filter(
    c =>
      c.submittedByUserId === currentUser?.id ||
      c.studentId === selectedChild?.id ||
      c.submittedByName.includes('Priya')
  );

  // New Complaint Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [category, setCategory] = useState<ComplaintCategory>('Bus Delay');
  const [suggestion, setSuggestion] = useState<{ category: ComplaintCategory; confidence: number; rationale: string } | null>(null);

  // Tab navigation state
  const [internalTab, setInternalTab] = useState<'portal' | 'handover' | 'timeline' | 'attendance' | 'complaints' | 'notifications'>(() => {
    if (activeTab === 'parent-handover') return 'handover';
    if (activeTab === 'parent-timeline') return 'timeline';
    if (activeTab === 'parent-attendance') return 'attendance';
    if (activeTab === 'complaints') return 'complaints';
    if (activeTab === 'parent-notifications') return 'notifications';
    return 'portal';
  });

  React.useEffect(() => {
    if (activeTab === 'parent-handover') setInternalTab('handover');
    else if (activeTab === 'parent-timeline') setInternalTab('timeline');
    else if (activeTab === 'parent-attendance') setInternalTab('attendance');
    else if (activeTab === 'complaints') setInternalTab('complaints');
    else if (activeTab === 'parent-notifications') setInternalTab('notifications');
    else if (activeTab === 'parent-portal') setInternalTab('portal');
  }, [activeTab]);

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    if (text.length > 5) {
      const sug = storageService.suggestComplaintCategory(text);
      setSuggestion(sug);
      setCategory(sug.category);
    } else {
      setSuggestion(null);
    }
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    addComplaint({
      submittedByUserId: currentUser?.id || 'USR-PARENT-01',
      submittedByName: currentUser?.name || 'Priya R',
      studentId: selectedChild.id,
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      status: 'Submitted',
      busId: bus?.id,
      routeId: route?.id,
    });

    setSubject('');
    setDescription('');
    setSuggestion(null);
    setIsSubmitModalOpen(false);
  };

  // Feature C: Save pickup readiness
  const handleUpdateReadiness = (newStatus: ReadinessStatus) => {
    setReadinessStatus(newStatus);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setPickupReadiness({
      studentId: selectedChild.id,
      date: '31-10-2026',
      session: 'Morning',
      status: newStatus,
      notes: readinessNotes,
      pickupPersonName: pickupPerson,
      updatedAt: timeStr,
    });

    showToast('success', `Status updated to "${newStatus}". Driver K. Murugesan notified.`, 'Readiness Updated');
  };

  // If no children linked to parent account, render informative empty state
  if (!selectedChild || myChildren.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto ring-8 ring-blue-50">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">No Enrolled Children Linked</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Your parent account ({currentUser?.email}) is active, but there are currently no students linked to your profile in Kovai Valley Matriculation School records.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left space-y-2">
            <div className="font-semibold text-slate-800">How to link your student:</div>
            <p>1. Contact Kovai Valley Matriculation School Transport Desk at Peelamedu (Phone: +91 98422 10100).</p>
            <p>2. Provide your child's Admission Number (e.g. KVMS-2026-XXX) and your registered mobile number.</p>
            <p>3. Once linked by the Administrator in Parent Management, their live bus tracking, roll-call attendance, and drop-off handover PIN will appear here immediately.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner with Coimbatore School Branding */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                Parent Transport Portal • Kovai Valley Matriculation School
              </span>
            </div>
            <h1 className="text-2xl font-bold">{selectedChild.name}'s Daily Transit</h1>
            <p className="text-xs text-slate-300 mt-1">
              {selectedChild.classGrade}-{selectedChild.section} • Roll #{selectedChild.rollNumber} • Student ID: {selectedChild.studentIdNumber}
            </p>
          </div>

          {/* Sibling Selector Switcher */}
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/20 self-start sm:self-auto">
            <div className="flex items-center justify-between gap-3 mb-1 px-1">
              <span className="text-[10px] uppercase font-bold text-sky-200 block">
                Select Child:
              </span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                {myChildren.length} Children Linked
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {myChildren.map(child => (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChildId(child.id);
                    const childR = readinessRecords.find(r => r.studentId === child.id && r.date === '31-10-2026');
                    setReadinessStatus(childR?.status || 'Ready for Pickup');
                    setReadinessNotes(childR?.notes || '');
                    setPickupPerson(childR?.pickupPersonName || 'Priya R (Mother)');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedChildId === child.id
                      ? 'bg-white text-blue-950 shadow-xs ring-2 ring-sky-300'
                      : 'text-white hover:bg-white/15 bg-white/5'
                  }`}
                >
                  {child.name.split(' ')[0]} ({child.classGrade}-{child.section})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/10">
          <button
            onClick={() => setInternalTab('portal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'portal'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <BusIcon className="w-3.5 h-3.5" />
            <span>Child Transit</span>
          </button>
          <button
            onClick={() => setInternalTab('handover')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'handover'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Handover & Safety</span>
            {selectedChild.handoverPolicy === 'Guardian Required' && childHandover?.oneTimePin ? (
              <span className="bg-amber-400 text-amber-950 text-[10px] px-1.5 py-0.2 rounded font-bold font-mono">
                OTP Active
              </span>
            ) : (
              <span className="bg-white/20 text-sky-200 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                {selectedChild.handoverPolicy === 'Independent Dismissal' ? 'Self Dismissal' : selectedChild.handoverPolicy === 'Authorized Adult Required' ? 'Adult Required' : 'OTP Guard'}
              </span>
            )}
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
            <span>Safety Timeline (Feature F)</span>
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
            <span>Attendance Log</span>
          </button>
          <button
            onClick={() => setInternalTab('complaints')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'complaints'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <MessageSquareWarning className="w-3.5 h-3.5" />
            <span>Transport Inquiries</span>
          </button>
          <button
            onClick={() => setInternalTab('notifications')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'notifications'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Demo Notifications</span>
            {myNotifications.filter(n => !n.read).length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {myNotifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* FEATURE B: ACTIVE MISSED BOARDING ALERT BANNER */}
      {childMissedAlerts.length > 0 && (
        <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
              <span>URGENT SAFETY ALERT: Missed Bus Boarding Logged</span>
            </div>
            <Badge variant="danger">Active Alert</Badge>
          </div>
          {childMissedAlerts.map(alert => (
            <div key={alert.id} className="text-xs text-rose-800 space-y-1">
              <p>
                Driver recorded that <strong>{selectedChild.name}</strong> was absent at pickup stop{' '}
                <strong>{alert.pickupPointName}</strong> at <strong>{alert.time}</strong> (Expected: {alert.expectedTime}).
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  {alert.resolutionNotes}
                </span>
                <button
                  onClick={() => {
                    acknowledgeMissedAlert(alert.id, 'Parent acknowledged via portal. Child is safe at home.');
                    showToast('success', 'Missed boarding alert acknowledged.', 'Safe Confirmation');
                  }}
                  className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Acknowledge & Confirm Child Safe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 1: CHILD TRANSIT */}
      {internalTab === 'portal' && (
        <div className="space-y-6">
          {/* FEATURE C: SMART PICKUP READINESS CARD */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Feature C: Smart Pickup Readiness (Today • 31-10-2026)
                </h3>
                <p className="text-xs text-slate-500">
                  Signal your child's readiness at the stop to Driver K. Murugesan before the bus reaches {pickupStop?.name || 'the stop'}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateReadiness('Ready for Pickup')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    readinessStatus === 'Ready for Pickup'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                  }`}
                >
                  ✓ Ready for Pickup
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReadiness('Not Ready')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    readinessStatus === 'Not Ready'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-rose-50'
                  }`}
                >
                  ✗ Not Ready / Delay
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReadiness('Pickup Person Changed')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    readinessStatus === 'Pickup Person Changed'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-amber-50'
                  }`}
                >
                  ⇄ Person Changed
                </button>
              </div>
            </div>

            {/* Note & Pickup Person Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Pickup Person Name (for afternoon handover)
                </label>
                <input
                  type="text"
                  value={pickupPerson}
                  onChange={e => setPickupPerson(e.target.value)}
                  placeholder="e.g. Priya R (Mother) or Rajesh Kumar (Father)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Special Note for Driver at Stop (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={readinessNotes}
                    onChange={e => setReadinessNotes(e.target.value)}
                    placeholder="e.g. Waiting at Peelamedu PSG Tech gate with umbrella"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    onClick={() => handleUpdateReadiness(readinessStatus)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shrink-0"
                  >
                    Send Note
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Transit & Dispatch Status Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    activeTrip ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
                <h3 className="font-bold text-sm text-slate-900">
                  {activeTrip ? 'Live Morning Transit in Progress' : 'Transit Status'}
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">31-10-2026 • 12-Hour IST</span>
            </div>

            {activeTrip ? (
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-emerald-950">
                  <span>Bus {bus?.busNumber} ({bus?.registrationNumber}) is en route along {route?.name}</span>
                  <StatusBadge status={activeTrip.status} />
                </div>
                <p className="text-slate-600">
                  Trip started at {activeTrip.actualStartTime || activeTrip.scheduledStartTime}. Scheduled arrival at Kovai Valley campus: {activeTrip.expectedArrivalTime}.
                </p>
                {activeTrip.delayReason && (
                  <div className="p-2 rounded bg-amber-100 text-amber-900 font-medium">
                    Traffic Advisory: {activeTrip.delayReason} (+{activeTrip.delayDurationMin} minutes)
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                Morning route run completed safely. Afternoon return departure from school scheduled for 03:00 PM.
              </div>
            )}
          </div>

          {/* Child Transport Dossier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bus & Driver Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <BusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{bus?.busNumber}</h3>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {bus?.registrationNumber}
                    </span>
                  </div>
                </div>
                <Badge variant="success">Assigned Fleet Vehicle</Badge>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vehicle Model:</span>
                  <span className="font-medium">{bus?.model} (Tata Starbus)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Route Corridor:</span>
                  <span className="font-semibold text-blue-700">{route?.routeCode} - {route?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Designated Pickup Stop:</span>
                  <span className="font-semibold text-slate-900">{pickupStop?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Morning Pickup Time:</span>
                  <span className="font-bold text-slate-900">{pickupStop?.morningTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Afternoon Drop Time:</span>
                  <span className="font-bold text-slate-900">{pickupStop?.afternoonTime}</span>
                </div>
              </div>

              {/* Assigned Driver Box */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Assigned Driver</div>
                  <div className="font-bold text-xs text-slate-900">{driver?.name}</div>
                  <div className="text-[11px] text-slate-500">{driver?.phone}</div>
                </div>

                <a
                  href={`tel:${driver?.phone}`}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Driver</span>
                </a>
              </div>
            </div>

            {/* Quick Handover Policy card preview */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-xl border border-blue-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-blue-700" />
                    <h3 className="font-bold text-sm text-blue-950">
                      Handover Protocol ({selectedChild.handoverPolicy})
                    </h3>
                  </div>
                  <Badge
                    variant={
                      selectedChild.handoverPolicy === 'Guardian Required'
                        ? 'warning'
                        : selectedChild.handoverPolicy === 'Authorized Adult Required'
                        ? 'info'
                        : 'success'
                    }
                  >
                    {selectedChild.handoverPolicy}
                  </Badge>
                </div>

                <div className="mt-4 text-center space-y-3">
                  {selectedChild.handoverPolicy === 'Guardian Required' ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                        <span className="font-semibold text-blue-950">
                          {childHandover?.status === 'Awaiting Guardian Verification'
                            ? 'Vehicle at Stop! One-Time PIN:'
                            : childHandover?.status === 'Handed Over'
                            ? 'Handover Completed Successfully'
                            : 'Dynamic 6-Digit Handover PIN:'}
                        </span>
                        {childHandover?.pinExpiresAt && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Expires: {childHandover.pinExpiresAt}
                          </span>
                        )}
                      </div>

                      {childHandover?.oneTimePin ? (
                        <div className="space-y-2">
                          {/* Segmented 6-digit display boxes */}
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            {childHandover.oneTimePin.split('').map((char, idx) => (
                              <div
                                key={idx}
                                className="w-9 h-12 sm:w-11 sm:h-14 rounded-xl border-2 border-blue-400 bg-white shadow-xs flex items-center justify-center"
                              >
                                <span className="text-xl sm:text-2xl font-mono font-black text-blue-950">
                                  {showPin ? char : '•'}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowPin(!showPin)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg flex items-center gap-1"
                              title={showPin ? 'Hide PIN' : 'Show PIN'}
                            >
                              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{showPin ? 'Hide' : 'Reveal'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyPin(childHandover.oneTimePin!)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1"
                              title="Copy PIN"
                            >
                              {pinCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{pinCopied ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => regenerateHandoverPin(childHandover.id)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg flex items-center gap-1"
                              title="Regenerate new PIN"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Refresh</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2 opacity-50">
                            {[0, 1, 2, 3, 4, 5].map(idx => (
                              <div
                                key={idx}
                                className="w-9 h-12 sm:w-11 sm:h-14 rounded-xl border-2 border-slate-300 bg-slate-100 flex items-center justify-center"
                              >
                                <span className="text-xl font-mono text-slate-400">•</span>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => generateOrActivateHandoverPin(selectedChild.id)}
                            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Activate 6-Digit Handover PIN Now</span>
                          </button>
                        </div>
                      )}

                      {childHandover?.failedAttempts && childHandover.failedAttempts > 0 ? (
                        <div className="text-[10px] text-rose-600 font-semibold">
                          Failed attempts: {childHandover.failedAttempts}/5
                        </div>
                      ) : null}

                      {/* Emergency Backup PIN info */}
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-left space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-blue-950">Offline Backup PIN:</span>
                          <span className="font-mono font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                            {selectedChild.handoverPin || '739412'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600">
                          Quote this permanent 6-digit emergency code if your phone battery dies or has no reception at {pickupStop?.name || 'the stop'}.
                        </p>
                      </div>

                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        Recite the 6-digit code verbally to Driver {driver?.name || 'K. Murugesan'} at {pickupStop?.name || 'stop'} to safely receive {selectedChild.name}.
                      </p>
                    </>
                  ) : selectedChild.handoverPolicy === 'Authorized Adult Required' ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left space-y-1">
                      <div className="font-bold text-amber-950 text-xs">Authorized Adult Verification Required</div>
                      <p className="text-[11px] text-amber-800">
                        Driver will physically verify the authorized guardian identity ({selectedChild.parentName}) before releasing {selectedChild.name}.
                      </p>
                      <div className="text-[11px] text-slate-600 pt-1">
                        Current Status: <StatusBadge status={childHandover?.status || 'Awaiting Drop-off'} />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-left space-y-1">
                      <div className="font-bold text-indigo-950 text-xs">Independent Dismissal Authorized</div>
                      <p className="text-[11px] text-indigo-800">
                        {selectedChild.name} (Class {selectedChild.classGrade}-{selectedChild.section}) is cleared to walk home directly upon dismissal by driver at {pickupStop?.name}.
                      </p>
                      <div className="text-[11px] text-slate-600 pt-1">
                        Current Status: <StatusBadge status={childHandover?.status || 'Awaiting Drop-off'} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-600">Primary Guardian: <strong>{selectedChild.parentName}</strong></span>
                <button
                  onClick={() => setInternalTab('handover')}
                  className="font-bold text-blue-700 hover:text-blue-800"
                >
                  View Full Details →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HANDOVER & SAFETY (FEATURE A) */}
      {internalTab === 'handover' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  Safe Student Handover Protocol: {selectedChild.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kovai Valley Matriculation School enforces strict drop-off verification matching each student's designated safety policy.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsGuardianPassModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Guardian ID Pass</span>
                </button>
                <Badge
                  variant={
                    selectedChild.handoverPolicy === 'Guardian Required'
                      ? 'warning'
                      : selectedChild.handoverPolicy === 'Authorized Adult Required'
                      ? 'info'
                      : 'success'
                  }
                >
                  Policy: {selectedChild.handoverPolicy}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dynamic Policy Card */}
              {selectedChild.handoverPolicy === 'Guardian Required' && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Dynamic 6-Digit Handover PIN
                    </span>
                    {childHandover?.status && <StatusBadge status={childHandover.status} />}
                  </div>

                  {childHandover?.oneTimePin ? (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-inner space-y-2">
                      {/* Segmented 6-digit display */}
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {childHandover.oneTimePin.split('').map((char, idx) => (
                          <div
                            key={idx}
                            className="w-10 h-14 sm:w-12 sm:h-16 rounded-xl border-2 border-blue-500 bg-blue-50/20 shadow-xs flex items-center justify-center"
                          >
                            <span className="text-2xl sm:text-3xl font-mono font-black text-blue-950">
                              {showPin ? char : '•'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {childHandover?.pinExpiresAt && (
                        <span className="text-[11px] text-slate-500 block font-mono">
                          Valid until {childHandover.pinExpiresAt} (2-Hour Active Validity)
                        </span>
                      )}

                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg flex items-center gap-1"
                        >
                          {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showPin ? 'Hide PIN' : 'Reveal PIN'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyPin(childHandover.oneTimePin!)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1"
                        >
                          {pinCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{pinCopied ? 'Copied!' : 'Copy Code'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => regenerateHandoverPin(childHandover.id)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg flex items-center gap-1"
                          title="Generate fresh 6-digit PIN"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-inner space-y-3">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 opacity-40">
                        {[0, 1, 2, 3, 4, 5].map(idx => (
                          <div
                            key={idx}
                            className="w-10 h-14 sm:w-12 sm:h-16 rounded-xl border-2 border-slate-300 bg-slate-100 flex items-center justify-center"
                          >
                            <span className="text-xl font-mono text-slate-400">•</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-600">
                        A dynamic 6-digit OTP activates when Driver {driver?.name || 'K. Murugesan'} arrives at {pickupStop?.name || 'the stop'}. You can also pre-generate your OTP now:
                      </p>
                      <button
                        type="button"
                        onClick={() => generateOrActivateHandoverPin(selectedChild.id)}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Activate 6-Digit Handover PIN Now</span>
                      </button>
                    </div>
                  )}

                  {childHandover?.failedAttempts && childHandover.failedAttempts > 0 ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs text-center font-medium">
                      Security Alert: {childHandover.failedAttempts} of 5 incorrect verification attempts recorded.
                    </div>
                  ) : null}

                  {/* Registered Emergency 6-Digit Backup PIN */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-left space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-950">Offline Emergency Backup PIN:</span>
                      <span className="font-mono font-bold text-base text-blue-900 bg-white px-2.5 py-0.5 rounded-md border border-blue-200 tracking-wider">
                        {selectedChild.handoverPin || '739412'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      If mobile network or battery is exhausted at the drop-off curb, recite this registered permanent 6-digit backup PIN to driver.
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-600 text-left bg-slate-100/80 p-3 rounded-lg border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">
                      {language === 'ta' ? 'பாதுகாப்பு வழிமுறைகள் (Handshake Instructions):' : 'Guardian Handshake Instructions:'}
                    </div>
                    <p>
                      1. Meet Bus {bus?.busNumber} ({bus?.registrationNumber}) at {pickupStop?.name} ({pickupStop?.afternoonTime}).
                    </p>
                    <p>
                      2. Verbally recite this 6-digit PIN to Driver {driver?.name}. (Do not hand your phone to others).
                    </p>
                    <p>
                      3. Driver verifies the PIN on their operating console before releasing {selectedChild.name}.
                    </p>
                  </div>
                </div>
              )}

              {selectedChild.handoverPolicy === 'Authorized Adult Required' && (
                <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                      Authorized Adult Clearance
                    </span>
                    {childHandover?.status && <StatusBadge status={childHandover.status} />}
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-amber-200 text-xs space-y-2">
                    <div className="font-bold text-slate-900 text-sm">{selectedChild.name} (Class {selectedChild.classGrade}-{selectedChild.section})</div>
                    <p className="text-slate-600">
                      Under Kovai Valley policy, students under Class 5 require in-person adult verification. Driver will confirm adult identity on the passenger manifest prior to handover.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1">
                    <div className="font-semibold text-slate-800">Assigned Drop-off Stop:</div>
                    <div className="text-slate-600 font-medium">{pickupStop?.name} • Scheduled {pickupStop?.afternoonTime}</div>
                    <div className="text-slate-500 text-[11px]">Assigned Driver: {driver?.name} ({driver?.phone})</div>
                  </div>
                </div>
              )}

              {selectedChild.handoverPolicy === 'Independent Dismissal' && (
                <div className="bg-indigo-50/60 rounded-2xl border border-indigo-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                      Independent Dismissal Clearance
                    </span>
                    {childHandover?.status && <StatusBadge status={childHandover.status} />}
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-indigo-200 text-xs space-y-2">
                    <div className="font-bold text-slate-900 text-sm">{selectedChild.name} (Class {selectedChild.classGrade}-{selectedChild.section})</div>
                    <p className="text-slate-600">
                      Older student independent dismissal waiver is active. {selectedChild.name} is cleared to alight at {pickupStop?.name} and walk home independently.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-indigo-200 text-xs space-y-1">
                    <div className="font-semibold text-slate-800">Dismissal Stop & Vehicle:</div>
                    <div className="text-slate-600 font-medium">{pickupStop?.name} • Bus {bus?.busNumber} ({bus?.registrationNumber})</div>
                    <div className="text-slate-500 text-[11px]">Driver: {driver?.name} ({driver?.phone})</div>
                  </div>
                </div>
              )}

              {/* Authorized Guardians List */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Registered Guardians on Record
                </h4>
                <div className="space-y-2.5">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{selectedChild.parentName} (Primary Guardian)</div>
                      <div className="text-slate-500">{selectedChild.parentPhone} • {selectedChild.parentEmail}</div>
                    </div>
                    <Badge variant="success">Registered</Badge>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Rajesh Kumar (Secondary Guardian / Father)</div>
                      <div className="text-slate-500">+91 98421 88441 • Peelamedu, Coimbatore</div>
                    </div>
                    <Badge variant="outline">Authorized</Badge>
                  </div>
                </div>

                {childHandover && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="font-semibold text-slate-800">Today's Handover Record:</div>
                    <div className="flex items-center justify-between">
                      <span>Status: <StatusBadge status={childHandover.status} /></span>
                      <span className="text-slate-500">{childHandover.time}</span>
                    </div>
                    {childHandover.verifiedAt && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        ✓ Verified by Driver at {childHandover.verifiedAt}
                      </p>
                    )}
                    {childHandover.dismissedAt && (
                      <p className="text-[11px] text-indigo-700 font-medium">
                        ✓ Independently dismissed at {childHandover.dismissedAt}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAFETY TIMELINE (FEATURE F) */}
      {internalTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Feature F: Transport Safety Timeline ({selectedChild.name})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              End-to-end trip verification audit trail from morning departure through safe afternoon handover.
            </p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {safetyTimeline.map((item, index) => {
              const isCompleted = item.status === 'completed';
              const isInProgress = item.status === 'in_progress';
              const isDelayed = item.status === 'delayed';
              const isWarning = item.status === 'warning';

              return (
                <div key={item.id} className="relative group">
                  {/* Step circle marker */}
                  <div
                    className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isInProgress
                        ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                        : isDelayed
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : isWarning
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="ml-3 p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{item.title}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                    <div className="pt-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                            ? 'bg-blue-100 text-blue-800'
                            : isDelayed
                            ? 'bg-amber-100 text-amber-800'
                            : isWarning
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ATTENDANCE LOG */}
      {internalTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Attendance History for {selectedChild.name}
            </h3>
            <span className="text-xs text-slate-400">Digital Roll Records</span>
          </div>

          <div className="space-y-2">
            {childAttendance.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent records found.</p>
            ) : (
              childAttendance.map(att => (
                <div
                  key={att.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {att.date} • {att.session} Session
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {att.markedTime ? `Boarded at ${att.markedTime}` : 'Recorded Absent at stop'} • {att.remarks || 'Scanned'}
                    </span>
                  </div>
                  <StatusBadge status={att.status} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: COMPLAINTS & INQUIRIES */}
      {internalTab === 'complaints' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4 text-blue-600" />
                Transport Inquiries & Support Tickets
              </h3>
              <p className="text-xs text-slate-500">Direct line to Kovai Valley Transport Office.</p>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Inquiry</span>
            </button>
          </div>

          <div className="space-y-3">
            {myComplaints.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                You haven't submitted any complaints or inquiries.
              </p>
            ) : (
              myComplaints.map(c => (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{c.complaintCode}</span>
                      <Badge variant="outline">{c.category}</Badge>
                      <StatusBadge status={c.status} />
                    </div>
                    <span className="text-[11px] text-slate-400">{c.submissionDate.split('T')[0]}</span>
                  </div>

                  <h4 className="font-bold text-slate-800">{c.subject}</h4>
                  <p className="text-slate-600 leading-relaxed">{c.description}</p>

                  {c.adminResponse && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-950">
                      <div className="font-semibold text-xs mb-1 flex items-center gap-1">
                        <span>Transport Office Official Response:</span>
                      </div>
                      <p className="text-slate-700">{c.adminResponse}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DEMO NOTIFICATIONS (SIMULATED SMS / ALERTS) */}
      {internalTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  Simulated Guardian Notification Stream
                </h3>
                <Badge variant="info">Demo Notification Feed</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays live simulated SMS and dispatch notifications triggered by morning boarding, drop-off OTP, and traffic updates.
              </p>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Total Alerts: {myNotifications.length}
            </div>
          </div>

          <div className="space-y-3">
            {myNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No simulated notifications received yet for your registered phone (+91 98421 88440).
              </div>
            ) : (
              myNotifications.map(n => {
                const student = students.find(s => s.id === n.studentId);
                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border transition-all text-xs space-y-2 ${
                      n.type === 'missed_boarding'
                        ? 'bg-rose-50/70 border-rose-200'
                        : n.type === 'handover_otp'
                        ? 'bg-amber-50/70 border-amber-200'
                        : n.type === 'handover_success'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            n.type === 'missed_boarding'
                              ? 'text-rose-900'
                              : n.type === 'handover_otp'
                              ? 'text-amber-900'
                              : n.type === 'handover_success'
                              ? 'text-emerald-900'
                              : 'text-slate-900'
                          }`}
                        >
                          {n.title}
                        </span>
                        {student && (
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded font-medium border border-slate-200">
                            Child: {student.name}
                          </span>
                        )}
                        {!n.read && (
                          <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-bold">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{n.timestamp}</span>
                    </div>

                    <p className="text-slate-700 leading-relaxed font-sans">{n.message}</p>

                    {n.meta?.otp && (
                      <div className="p-2.5 bg-white rounded-lg border border-amber-300 flex items-center justify-between">
                        <span className="font-semibold text-amber-950">
                          One-Time Verification PIN: <strong className="font-mono text-base text-blue-700">{n.meta.otp}</strong>
                        </span>
                        <span className="text-[10px] text-slate-500">Provide this to driver</span>
                      </div>
                    )}

                    {!n.read && (
                      <div className="text-right pt-1">
                        <button
                          onClick={() => markNotificationRead(n.id)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Mark as Read
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* School Transport Notices for Parents */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Kovai Valley Transport Notices</h3>
        <div className="divide-y divide-slate-100">
          {notices
            .filter(n => n.audience === 'All' || n.audience === 'Parents')
            .map(notice => (
              <div key={notice.id} className="py-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {language === 'ta' && notice.titleTa ? notice.titleTa : notice.title}
                  </span>
                  <span className="text-[11px] text-slate-400">{notice.publishDate}</span>
                </div>
                <p className="text-slate-600">
                  {language === 'ta' && notice.contentTa ? notice.contentTa : notice.content}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* SUBMIT COMPLAINT MODAL */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Transport Inquiry or Feedback"
        subtitle="Our transport coordinator reviews feedback daily."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g. Bus 01 late arrival at Peelamedu PSG Tech"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description *</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => handleDescriptionChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Provide details regarding the occurrence..."
              required
            />
          </div>

          {suggestion && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Smart Categorization: {suggestion.category}
                </span>
                <span className="text-[10px] text-blue-700 font-mono">
                  {Math.round(suggestion.confidence * 100)}% Match
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">{suggestion.rationale}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Bus Delay">Bus Delay</option>
                <option value="Driver Behaviour">Driver Behaviour</option>
                <option value="Bus Condition">Bus Condition</option>
                <option value="Pickup Point Issue">Pickup Point Issue</option>
                <option value="Attendance Issue">Attendance Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Submit Inquiry
            </button>
          </div>
        </form>
      </Modal>

      {/* DIGITAL GUARDIAN HANDOVER PASS MODAL */}
      <Modal
        isOpen={isGuardianPassModalOpen}
        onClose={() => setIsGuardianPassModalOpen(false)}
        title="Authorized Guardian Digital Pass"
        subtitle="Official drop-off verification credential for Kovai Valley Matriculation School."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {/* Card Frame */}
          <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-blue-400/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* School Header */}
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-sky-300 uppercase block">
                  Kovai Valley Matriculation School
                </span>
                <span className="text-xs font-semibold text-white">Student Transport Safety Division</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30">
                AUTHORIZED
              </span>
            </div>

            {/* Guardian & Pupil Details */}
            <div className="grid grid-cols-2 gap-3 my-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Student Name</span>
                <span className="font-bold text-sm text-white">{selectedChild.name}</span>
                <span className="text-[10px] text-slate-300 block">{selectedChild.classGrade}-{selectedChild.section} • Roll #{selectedChild.rollNumber}</span>
                <span className="text-[10px] font-mono text-slate-400">{selectedChild.studentIdNumber}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Authorized Guardian</span>
                <span className="font-bold text-sm text-white">{selectedChild.parentName}</span>
                <span className="text-[10px] text-slate-300 block">{selectedChild.parentPhone}</span>
                <span className="text-[10px] text-sky-300 block mt-0.5">Aadhaar Verified</span>
              </div>
            </div>

            {/* Transit Route & Stop */}
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-300 block">Assigned Vehicle & Stop:</span>
                <span className="font-bold text-white">{bus?.busNumber} ({bus?.registrationNumber})</span>
                <span className="text-[11px] text-sky-200 block">{pickupStop?.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-300 block">Drop Schedule:</span>
                <span className="font-bold text-white">{pickupStop?.afternoonTime || '03:45 PM'}</span>
              </div>
            </div>

            {/* 6-Digit Handover Verification Code */}
            <div className="mt-4 pt-3 border-t border-white/15 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">
                Active 6-Digit Handover Verification Code
              </span>
              <div className="inline-flex items-center gap-1.5 bg-white text-slate-900 px-4 py-2 rounded-xl shadow-md border-2 border-sky-400">
                {(childHandover?.oneTimePin || selectedChild.handoverPin || '739412').split('').map((ch, i) => (
                  <span key={i} className="font-mono font-black text-xl text-blue-950 px-1">
                    {ch}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-300 mt-1">
                Recite verbally to Driver {driver?.name || 'K. Murugesan'} at bus door upon receiving child.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Transport Guidelines:</div>
            <p>• Only registered guardians with authorized credentials may receive pupils.</p>
            <p>• Emergency transport dispatch helpline: <strong>+91 98422 10100</strong> / <strong>0422-2578900</strong>.</p>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsGuardianPassModalOpen(false)}
              className="px-4 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Close Pass
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
