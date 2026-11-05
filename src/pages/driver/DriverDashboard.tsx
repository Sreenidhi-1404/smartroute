import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AttendanceStatus, HandoverRecord, DisruptionType } from '../../types';
import {
  Bus as BusIcon,
  Navigation,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertTriangle,
  Play,
  Users,
  Phone,
  Shield,
  Search,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Info,
  Calendar,
  AlertCircle,
  Compass,
  Eye,
  Route as RouteIcon,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SixDigitPinInput } from '../../components/common/SixDigitPinInput';
import { RoutePreviewModal } from '../../components/map/RoutePreviewModal';

interface DriverDashboardProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  activeTab = 'driver-console',
  onSelectTab,
}) => {
  const { currentUser } = useAuth();
  const {
    buses,
    drivers,
    routes,
    students,
    trips,
    attendance,
    handovers,
    readinessRecords,
    disruptions,
    startTrip,
    delayTrip,
    completeTrip,
    markAttendance,
    markArrivedAtDropoff,
    batchMarkArrivedAtStop,
    verifyHandoverPin,
    confirmIndependentDismissal,
    confirmAuthorizedAdultHandover,
    updateHandoverStatus,
    reportDisruption,
    showToast,
  } = useData();

  // Strict driver and bus resolution (no arbitrary fallbacks to BUS-01 or buses[0])
  const myDriverRecord = drivers.find(
    d =>
      d.id === currentUser?.assignedDriverId ||
      d.id === currentUser?.profileId ||
      d.email.toLowerCase() === currentUser?.email.toLowerCase() ||
      d.phone === currentUser?.phone
  );

  const driverId = myDriverRecord?.id || currentUser?.assignedDriverId || currentUser?.profileId || '';

  const assignedBus = buses.find(
    b =>
      (driverId && b.assignedDriverId === driverId) ||
      (currentUser?.assignedBusId && b.id === currentUser.assignedBusId)
  );

  const assignedRoute = assignedBus
    ? routes.find(r => r.assignedBusId === assignedBus.id || r.id === assignedBus.assignedRouteId)
    : undefined;

  const busStudents = assignedBus
    ? students.filter(s => s.assignedBusId === assignedBus.id && s.transportStatus === 'Active')
    : [];

  // Local state
  const [internalTab, setInternalTab] = useState<'console' | 'attendance' | 'handovers' | 'readiness' | 'route'>(() => {
    if (activeTab === 'driver-attendance') return 'attendance';
    if (activeTab === 'driver-handovers') return 'handovers';
    if (activeTab === 'driver-readiness') return 'readiness';
    if (activeTab === 'driver-route') return 'route';
    return 'console';
  });

  // Sync internal tab if prop changes
  React.useEffect(() => {
    if (activeTab === 'driver-attendance') setInternalTab('attendance');
    else if (activeTab === 'driver-handovers') setInternalTab('handovers');
    else if (activeTab === 'driver-readiness') setInternalTab('readiness');
    else if (activeTab === 'driver-route') setInternalTab('route');
    else if (activeTab === 'driver-console') setInternalTab('console');
  }, [activeTab]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSession, setActiveSession] = useState<'Morning' | 'Afternoon'>('Morning');
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(10);
  const [delayReason, setDelayReason] = useState('Heavy traffic congestion on Avinashi Road junction');
  const [isRoutePreviewOpen, setIsRoutePreviewOpen] = useState(false);

  // Driver Route Disruption modal state
  const [isDriverDisruptionModalOpen, setIsDriverDisruptionModalOpen] = useState(false);
  const [driverDisruptionType, setDriverDisruptionType] = useState<DisruptionType>('Traffic Congestion');
  const [driverDisruptionLocation, setDriverDisruptionLocation] = useState('Avinashi Road - Peelamedu Junction');
  const [driverDisruptionDelayMin, setDriverDisruptionDelayMin] = useState(15);
  const [driverDisruptionDesc, setDriverDisruptionDesc] = useState('');
  const [driverDisruptionAltStop, setDriverDisruptionAltStop] = useState('Adjacent Service Road Bay');
  const [driverDisruptionReroute, setDriverDisruptionReroute] = useState('Divert via Kamarajar Road to bypass junction block');

  // Handover PIN verification state (Feature A)
  const [selectedHandover, setSelectedHandover] = useState<HandoverRecord | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinVerificationError, setPinVerificationError] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

  // Authorized Adult Handover state
  const [isAdultModalOpen, setIsAdultModalOpen] = useState(false);
  const [selectedAdultName, setSelectedAdultName] = useState('');
  const [selectedAdultRelation, setSelectedAdultRelation] = useState('Parent / Guardian');

  // Driver trips for today
  const todayTrips = assignedBus ? trips.filter(t => t.busId === assignedBus.id) : [];
  const activeTrip = todayTrips.find(t => t.status === 'Started' || t.status === 'Delayed') || todayTrips[0];

  const getStudentStatus = (studentId: string): AttendanceStatus => {
    const rec = attendance.find(
      a => a.date === '31-10-2026' && a.studentId === studentId && a.session === activeSession
    );
    return rec ? rec.status : 'Not Marked';
  };

  const handleMarkStudent = (studentId: string, status: AttendanceStatus) => {
    if (!assignedBus || !assignedRoute) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    markAttendance([
      {
        date: '31-10-2026',
        studentId,
        tripId: activeTrip?.id || `TRIP-KVMS-${assignedBus.id}`,
        busId: assignedBus.id,
        routeId: assignedRoute.id,
        pickupPointId: students.find(s => s.id === studentId)?.pickupPointId || '',
        session: activeSession,
        status,
        markedTime: status === 'Boarded' ? timeStr : undefined,
        markedByDriverId: driverId || currentUser?.assignedDriverId || 'DRV-001',
        remarks:
          status === 'Boarded'
            ? 'Smart card scanned at bus boarding gate'
            : status === 'Absent'
            ? 'Marked absent at stop - Auto-alert sent to parent & dispatch'
            : status === 'Not Expected'
            ? 'Marked as Not Expected (prior leave / personal conveyance)'
            : 'Reset roll call status',
      },
    ]);

    if (status === 'Absent') {
      showToast('warning', `Missed Boarding Alert generated for parent & school dispatch.`, 'Feature B: Auto-Alert');
    } else if (status === 'Boarded') {
      showToast('success', `Boarding recorded for student.`, 'Boarded');
    }
  };

  const handleConfirmDelay = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTrip) {
      delayTrip(activeTrip.id, delayMinutes, delayReason);
      setIsDelayModalOpen(false);
    }
  };

  const handleDriverDisruptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverDisruptionLocation.trim() || !assignedRoute) return;

    const myName = myDriverRecord?.name || currentUser?.name || 'Driver';

    reportDisruption({
      routeId: assignedRoute.id,
      disruptionType: driverDisruptionType,
      locationName: driverDisruptionLocation.trim(),
      description: driverDisruptionDesc.trim() || `Reported by Driver ${myName} on route ${assignedRoute.routeCode}`,
      affectedPickupPointIds: [assignedRoute.pickupPoints[0]?.id || ''],
      suggestedAlternativeStopName: driverDisruptionAltStop.trim() || 'Adjacent Service Bay',
      suggestedRerouteDescription: driverDisruptionReroute.trim() || 'Detour via secondary arterial corridor',
      estimatedDelayMin: Number(driverDisruptionDelayMin),
      status: 'Active',
      reportedBy: `Driver ${myName} (${myDriverRecord?.driverCode || 'DRV'})`,
    });

    if (activeTrip) {
      delayTrip(activeTrip.id, Number(driverDisruptionDelayMin), `Driver Disruption: ${driverDisruptionLocation}`);
    }

    setIsDriverDisruptionModalOpen(false);
  };

  // Drop-off arrival handler
  const handleArrivedAtDropoff = (studentId: string) => {
    if (!assignedBus) return;
    const activeDriverId = driverId || currentUser?.assignedDriverId || 'DRV-001';
    const tripId = activeTrip?.id || `TRIP-KVMS-${assignedBus.id}-PM`;
    const res = markArrivedAtDropoff(studentId, tripId, activeDriverId);
    if (res.success) {
      if (res.handover.policy === 'Guardian Required') {
        showToast('info', `Arrival marked. Dynamic 6-digit PIN generated and visible in Parent Portal.`, 'Arrived at Stop');
      } else if (res.handover.policy === 'Independent Dismissal') {
        showToast('info', `Arrival marked. Student is authorized for independent dismissal.`, 'Arrived at Stop');
      } else {
        showToast('info', `Arrival marked. Please verify authorized adult identity before release.`, 'Arrived at Stop');
      }
    }
  };

  // Independent Dismissal handler
  const handleConfirmIndependentDismissal = (handoverId: string) => {
    const activeDriverId = driverId || currentUser?.assignedDriverId || 'DRV-001';
    const res = confirmIndependentDismissal(handoverId, activeDriverId);
    if (res.success) {
      showToast('success', res.message, 'Independent Dismissal');
    } else {
      showToast('error', res.message, 'Dismissal Failed');
    }
  };

  // Open Authorized Adult Modal
  const openAdultModal = (record: HandoverRecord) => {
    setSelectedHandover(record);
    const student = students.find(s => s.id === record.studentId);
    const defaultAdult = student?.authorizedGuardians?.[0]?.name || record.authorizedGuardianName || '';
    const defaultRel = student?.authorizedGuardians?.[0]?.relationship || 'Authorized Guardian';
    setSelectedAdultName(defaultAdult);
    setSelectedAdultRelation(defaultRel);
    setIsAdultModalOpen(true);
  };

  const handleConfirmAdultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandover || !selectedAdultName.trim()) return;

    const activeDriverId = driverId || currentUser?.assignedDriverId || 'DRV-001';
    const res = confirmAuthorizedAdultHandover(selectedHandover.id, selectedAdultName.trim(), activeDriverId, selectedAdultRelation);
    if (res.success) {
      showToast('success', res.message, 'Handover Confirmed');
      setIsAdultModalOpen(false);
      setSelectedHandover(null);
    } else {
      showToast('error', res.message, 'Handover Failed');
    }
  };

  // Feature A: Handover PIN verification handlers
  const openPinModal = (record: HandoverRecord) => {
    setSelectedHandover(record);
    setEnteredPin('');
    setPinVerificationError('');
    setIsPinModalOpen(true);
  };

  const handleVerifyPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandover) return;

    if (!enteredPin || enteredPin.length !== 6) {
      setPinVerificationError('Please enter the full 6-digit verification PIN provided verbally by the guardian.');
      return;
    }

    const activeDriverId = driverId || currentUser?.assignedDriverId || 'DRV-001';
    const result = verifyHandoverPin(selectedHandover.id, enteredPin, activeDriverId);

    if (result.success) {
      showToast('success', result.message, 'Handover Confirmed');
      setIsPinModalOpen(false);
      setSelectedHandover(null);
    } else {
      setPinVerificationError(result.message);
    }
  };

  const openEscalateModal = (record: HandoverRecord) => {
    setSelectedHandover(record);
    setEscalationReason('Guardian unable to provide valid 6-digit PIN or unauthorized individual present.');
    setIsEscalateModalOpen(true);
  };

  const handleConfirmEscalation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandover) return;

    updateHandoverStatus(selectedHandover.id, 'Escalated', escalationReason);
    showToast('error', 'Handover has been escalated to School Safety Dispatch and Principal.', 'Escalation Alert');
    setIsEscalateModalOpen(false);
    setSelectedHandover(null);
  };

  // Readiness lookup
  const getReadiness = (studentId: string) => {
    return readinessRecords.find(r => r.studentId === studentId && r.date === '31-10-2026') || null;
  };

  // If driver has no assigned bus/route, show an informative empty state as requested
  if (!assignedBus || !assignedRoute) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto ring-8 ring-amber-50">
            <BusIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">No School Bus Currently Assigned</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Your driver account ({currentUser?.name || 'Driver'}) is registered and active, but is not currently allocated to any school bus or route corridor.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left space-y-2">
            <div className="font-semibold text-slate-800">Allocation Instructions:</div>
            <p>1. Report to Thiru. S. Ramanathan, Transport Director at the Peelamedu campus dispatch desk.</p>
            <p>2. Ensure your driver profile and vehicle allocation are configured in the Admin Fleet Management module.</p>
            <p>3. Once assigned, your daily route stops, passenger manifest, roll-call attendance, and drop-off handover portal will automatically activate.</p>
          </div>
        </div>
      </div>
    );
  }

  // Route disruptions affecting this route
  const activeDisruptions = disruptions.filter(
    d => d.routeId === assignedRoute.id && (d.status === 'Active' || d.status === 'Approved')
  );

  // Handover records for this bus
  const myHandovers = handovers.filter(h => {
    const student = students.find(s => s.id === h.studentId);
    return student?.assignedBusId === assignedBus.id;
  });

  // Metrics
  const boardedCount = busStudents.filter(s => getStudentStatus(s.id) === 'Boarded').length;
  const absentCount = busStudents.filter(s => getStudentStatus(s.id) === 'Absent').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner with Indian School Branding */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                Driver Operating Console • Kovai Valley Matriculation School
              </span>
            </div>
            <h1 className="text-2xl font-bold">{currentUser?.name || 'K. Murugesan'}</h1>
            <p className="text-xs text-slate-300 mt-1">
              Vehicle: <strong>{assignedBus.busNumber}</strong> ({assignedBus.registrationNumber}) • Route:{' '}
              <strong>{assignedRoute.routeCode} ({assignedRoute.name})</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/15 text-center">
              <span className="text-[10px] uppercase text-slate-300 font-semibold block">
                Passenger Count
              </span>
              <span className="text-xl font-bold text-white">
                {boardedCount} / {busStudents.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/10">
          <button
            onClick={() => setInternalTab('console')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'console'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Trip Console</span>
          </button>
          <button
            onClick={() => setInternalTab('attendance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'attendance'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student Boarding ({busStudents.length})</span>
          </button>
          <button
            onClick={() => setInternalTab('handovers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'handovers'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Handover Verification (PIN)</span>
            {myHandovers.filter(h => h.status !== 'Handed Over').length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {myHandovers.filter(h => h.status !== 'Handed Over').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setInternalTab('readiness')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'readiness'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pickup Readiness</span>
          </button>
          <button
            onClick={() => setInternalTab('route')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internalTab === 'route'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Route & Stops</span>
          </button>
        </div>
      </div>

      {/* Road Disruption Notice Banner if active */}
      {activeDisruptions.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Active Coimbatore Route Advisory ({activeDisruptions.length} Corridor Incident)</span>
          </div>
          {activeDisruptions.map(d => (
            <div key={d.id} className="text-amber-800 bg-white/70 p-2.5 rounded-lg border border-amber-200">
              <div className="font-semibold">{d.disruptionType} at {d.locationName} (+{d.estimatedDelayMin} min delay)</div>
              <p className="text-slate-600 mt-0.5">{d.description}</p>
              {d.suggestedAlternativeStopName && (
                <div className="mt-1 font-semibold text-blue-800 text-[11px]">
                  Detour: {d.suggestedAlternativeStopName} — {d.suggestedRerouteDescription}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 1: TRIP CONSOLE */}
      {internalTab === 'console' && (
        <div className="space-y-6">
          {/* Active Trip Dispatch Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {activeTrip ? activeTrip.tripCode : 'Trip Run'}
                  </span>
                  <Badge variant="info">{activeTrip?.session || 'Morning Pickup'}</Badge>
                  {activeTrip && <StatusBadge status={activeTrip.status} />}
                </div>
                <p className="text-xs text-slate-500">
                  Timetable: Scheduled start {activeTrip?.scheduledStartTime || '07:00 AM'} ➔ Arrival{' '}
                  {activeTrip?.expectedArrivalTime || '07:45 AM'} (Kovai Valley Campus)
                </p>
                {activeTrip?.delayReason && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-1.5 rounded font-medium">
                    Delay Note: {activeTrip.delayReason} (+{activeTrip.delayDurationMin}m)
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoutePreviewOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                  title="Preview upcoming trip path, student stops, and expected arrival times"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Preview Route & Stops</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDriverDisruptionModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                  title="Mark route road closure, waterlogging, or traffic bottleneck"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mark Route Disruption</span>
                </button>

                {activeTrip?.status === 'Scheduled' && (
                  <button
                    onClick={() => startTrip(activeTrip.id)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Morning Run</span>
                  </button>
                )}

                {(activeTrip?.status === 'Started' || activeTrip?.status === 'Delayed') && (
                  <>
                    <button
                      onClick={() => setIsDelayModalOpen(true)}
                      className="px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Report Delay</span>
                    </button>
                    <button
                      onClick={() => completeTrip(activeTrip.id)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Route Complete</span>
                    </button>
                  </>
                )}

                {activeTrip?.status === 'Completed' && (
                  <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    ✓ Trip Successfully Completed & Logged
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stop Sequence Progress */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              Route Stop Sequence ({assignedRoute.pickupPoints.length} Coimbatore Stops)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {assignedRoute.pickupPoints.map((stop, i) => {
                const isSchool = i === assignedRoute.pickupPoints.length - 1;
                const stopPassengers = busStudents.filter(s => s.pickupPointId === stop.id);
                const stopReady = stopPassengers.filter(s => getReadiness(s.id)?.status === 'Ready for Pickup').length;

                return (
                  <div
                    key={stop.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Stop #{i + 1}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{stop.morningTime}</span>
                    </div>
                    <div className="font-semibold text-slate-800 line-clamp-1">{stop.name}</div>
                    {!isSchool && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-blue-600 font-medium">{stopPassengers.length} students</span>
                        {stopReady > 0 && (
                          <span className="text-emerald-600 font-bold">{stopReady} ready</span>
                        )}
                      </div>
                    )}
                    {isSchool && (
                      <Badge variant="success" className="text-[9px]">
                        School Campus
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Handover Summary on Console */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Feature A: Safe Student Handover Status ({myHandovers.length} Drop-offs)
              </h3>
              <button
                onClick={() => setInternalTab('handovers')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Open Full Handover Panel →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myHandovers.slice(0, 4).map(h => {
                const student = students.find(s => s.id === h.studentId);
                return (
                  <div key={h.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{student?.name} ({student?.classGrade}-{student?.section})</div>
                      <div className="text-[11px] text-slate-500">Guardian: {h.authorizedGuardianName} • {h.guardianPhone}</div>
                      <div className="text-[10px] text-slate-400">Scheduled: {h.time}</div>
                    </div>
                    <div className="text-right space-y-1">
                      <StatusBadge status={h.status} />
                      {h.status === 'Awaiting Drop-off' && (
                        <button
                          onClick={() => handleArrivedAtDropoff(student?.id || h.studentId)}
                          className="px-2 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-xs block ml-auto"
                        >
                          Arrived
                        </button>
                      )}
                      {(h.status === 'Awaiting Guardian Verification' || h.status === 'Arrived at Drop-off') && (
                        <>
                          {h.policy === 'Guardian Required' && (
                            <button
                              onClick={() => openPinModal(h)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs block ml-auto"
                            >
                              Verify PIN
                            </button>
                          )}
                          {h.policy === 'Authorized Adult Required' && (
                            <button
                              onClick={() => openAdultModal(h)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-xs block ml-auto"
                            >
                              Verify Adult
                            </button>
                          )}
                          {h.policy === 'Independent Dismissal' && (
                            <button
                              onClick={() => handleConfirmIndependentDismissal(h.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs block ml-auto"
                            >
                              Dismiss
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT BOARDING (FEATURE B INTEGRATION) */}
      {internalTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-900">
                  Passenger Boarding Manifest ({busStudents.length} Students)
                </h3>
                <Badge variant="warning">Feature B: Missed Boarding Guard</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Marking Absent automatically triggers Missed Boarding SMS alert to guardian and school office.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
                <button
                  onClick={() => setActiveSession('Morning')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeSession === 'Morning' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  Morning Pickup
                </button>
                <button
                  onClick={() => setActiveSession('Afternoon')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeSession === 'Afternoon' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  Afternoon Drop
                </button>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {busStudents
              .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(student => {
                const status = getStudentStatus(student.id);
                const stop = assignedRoute.pickupPoints.find(p => p.id === student.pickupPointId);
                const readiness = getReadiness(student.id);

                return (
                  <div
                    key={student.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{student.name}</span>
                        <span className="text-xs text-slate-400 font-mono">{student.studentIdNumber}</span>
                        <StatusBadge status={status} />
                        {readiness && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              readiness.status === 'Ready for Pickup'
                                ? 'bg-emerald-100 text-emerald-800'
                                : readiness.status === 'Pickup Person Changed'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {readiness.status}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span>{student.classGrade}-{student.section} (Roll #{student.rollNumber})</span>
                        <span>Stop: <strong>{stop?.name || 'Main Stop'}</strong> ({stop?.morningTime})</span>
                        <span>Guardian: {student.parentName} ({student.parentPhone})</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleMarkStudent(student.id, 'Boarded')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          status === 'Boarded'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Boarded</span>
                      </button>
                      <button
                        onClick={() => handleMarkStudent(student.id, 'Absent')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          status === 'Absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 border border-slate-200'
                        }`}
                        title="Mark absent and trigger Missed Boarding Alert"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>
                      <button
                        onClick={() => handleMarkStudent(student.id, 'Not Expected')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          status === 'Not Expected'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700 border border-slate-200'
                        }`}
                        title="Mark as Not Expected (leave notified or personal drop)"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Not Expected</span>
                      </button>
                      {status !== 'Not Marked' && (
                        <button
                          onClick={() => handleMarkStudent(student.id, 'Not Marked')}
                          className="px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200"
                          title="Reset to Not Marked"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: FEATURE A - SAFE STUDENT HANDOVER VERIFICATION */}
      {internalTab === 'handovers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  Feature A: Safe Student Handover Verification (Driver Terminal)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  At each afternoon drop-off stop, require the authorized parent or guardian to recite their dynamic 6-digit security PIN (or registered emergency backup PIN) before releasing the child.
                </p>
              </div>
              <Badge variant="info">Afternoon Drop Protocol</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myHandovers.map(record => {
              const student = students.find(s => s.id === record.studentId);
              const stop = assignedRoute.pickupPoints.find(p => p.id === record.pickupPointId);

              return (
                <div
                  key={record.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                    record.status === 'Handed Over'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : record.status === 'Escalated'
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-slate-900">{student?.name}</span>
                        <span className="text-xs font-mono text-slate-500">
                          {student?.classGrade}-{student?.section} (ID: {student?.studentIdNumber})
                        </span>
                        <StatusBadge status={record.status} />

                        {/* Handover Policy Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            record.policy === 'Guardian Required'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : record.policy === 'Authorized Adult Required'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          Policy: {record.policy}
                        </span>

                        {record.failedAttempts && record.failedAttempts > 0 && record.status !== 'Handed Over' ? (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                            {record.failedAttempts}/3 Failed Attempts
                          </span>
                        ) : null}
                      </div>

                      <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                        <div>
                          <span className="text-slate-400">Designated Stop:</span>{' '}
                          <strong className="text-slate-800">{stop?.name || 'Drop Stop'}</strong> ({record.time})
                        </div>
                        <div>
                          <span className="text-slate-400">Authorized Guardian:</span>{' '}
                          <strong className="text-slate-800">{record.authorizedGuardianName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Guardian Contact:</span>{' '}
                          <a href={`tel:${record.guardianPhone}`} className="text-blue-600 font-medium">
                            {record.guardianPhone}
                          </a>
                        </div>
                        <div>
                          <span className="text-slate-400">Verification Status:</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {record.status === 'Handed Over'
                              ? `Verified at ${record.verifiedAt} by Driver`
                              : record.status === 'Independently Dismissed'
                              ? `Independently Dismissed at ${record.dismissedAt}`
                              : record.status === 'Escalated'
                              ? 'Escalated to Dispatch'
                              : record.status === 'Awaiting Guardian Verification'
                              ? 'Bus at stop • Waiting for Guardian'
                              : 'En route to stop'}
                          </span>
                        </div>
                      </div>

                      {record.notes && (
                        <div className="mt-2 text-xs p-2 rounded bg-slate-100 text-slate-700">
                          Note: {record.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      {/* Step 1: Mark Arrived at Drop-off (if not arrived yet) */}
                      {record.status === 'Awaiting Drop-off' && (
                        <button
                          onClick={() => handleArrivedAtDropoff(student?.id || record.studentId)}
                          className="w-full px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          <span>Arrived at Drop-off</span>
                        </button>
                      )}

                      {/* Step 2: Verification Actions according to Policy */}
                      {(record.status === 'Awaiting Guardian Verification' || record.status === 'Arrived at Drop-off') && (
                        <>
                          {record.policy === 'Guardian Required' && (
                            <button
                              onClick={() => openPinModal(record)}
                              className="w-full px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center justify-center gap-2"
                            >
                              <KeyRound className="w-4 h-4" />
                              <span>Verify Guardian OTP (PIN)</span>
                            </button>
                          )}

                          {record.policy === 'Authorized Adult Required' && (
                            <button
                              onClick={() => openAdultModal(record)}
                              className="w-full px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center justify-center gap-2"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>Verify Authorized Adult</span>
                            </button>
                          )}

                          {record.policy === 'Independent Dismissal' && (
                            <button
                              onClick={() => handleConfirmIndependentDismissal(record.id)}
                              className="w-full px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm Independent Dismissal</span>
                            </button>
                          )}

                          <button
                            onClick={() => openEscalateModal(record)}
                            className="w-full px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg flex items-center justify-center gap-1.5"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Escalate to Dispatch</span>
                          </button>
                        </>
                      )}

                      {record.status === 'Handed Over' && (
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Handover Confirmed</span>
                        </div>
                      )}

                      {record.status === 'Independently Dismissed' && (
                        <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          <span>Independently Dismissed</span>
                        </div>
                      )}

                      {record.status === 'Escalated' && (
                        <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Escalated to Dispatch</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: FEATURE C - SMART PICKUP READINESS */}
      {internalTab === 'readiness' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Feature C: Smart Pickup Readiness (Live Stop Pre-Alert)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Shows live readiness status marked by parents before the bus arrives at each pickup stop along the corridor.
                </p>
              </div>
              <Badge variant="info">Live Feed (31-10-2026)</Badge>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {busStudents.map(student => {
                const stop = assignedRoute.pickupPoints.find(p => p.id === student.pickupPointId);
                const readiness = getReadiness(student.id);

                return (
                  <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{student.name}</span>
                        <span className="text-xs text-slate-400 font-mono">{student.classGrade}-{student.section}</span>
                        {readiness ? (
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              readiness.status === 'Ready for Pickup'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : readiness.status === 'Pickup Person Changed'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            ● {readiness.status}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                            Awaiting Parent Update
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        Stop: <strong>{stop?.name}</strong> • Scheduled: {stop?.morningTime} • Guardian:{' '}
                        {student.parentName} ({student.parentPhone})
                      </div>
                      {readiness?.notes && (
                        <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 mt-1">
                          Parent Note: "{readiness.notes}" {readiness.pickupPersonName ? `(Person: ${readiness.pickupPersonName})` : ''}
                        </div>
                      )}
                    </div>

                    <div className="text-right text-xs text-slate-400">
                      {readiness ? `Updated at ${readiness.updatedAt}` : 'Default schedule'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ROUTE & STOPS */}
      {internalTab === 'route' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">{assignedRoute.name}</h3>
              <p className="text-xs text-slate-500">
                Route Code: <strong>{assignedRoute.routeCode}</strong> • Total Corridor Distance: {assignedRoute.estimatedDistanceKm} km
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRoutePreviewOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Live Route Preview</span>
              </button>
              <Badge variant="outline">{assignedRoute.pickupPoints.length} Stops Total</Badge>
            </div>
          </div>

          <div className="space-y-3">
            {assignedRoute.pickupPoints.map((point, index) => {
              const pointStudents = busStudents.filter(s => s.pickupPointId === point.id);

              return (
                <div
                  key={point.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{point.name}</div>
                      <div className="text-xs text-slate-500">
                        Morning: <strong>{point.morningTime}</strong> • Afternoon Drop: <strong>{point.afternoonTime}</strong>
                      </div>
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        {pointStudents.length} Assigned Students ({pointStudents.map(s => s.name).join(', ') || 'None'})
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-mono">Stop ID: {point.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FEATURE A: PIN VERIFICATION MODAL */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Verify Guardian 6-Digit Handover PIN"
        subtitle="Enter the verbal 6-digit code quoted by the authorized parent or guardian at this stop."
        maxWidth="md"
      >
        <form onSubmit={handleVerifyPinSubmit} className="space-y-4 text-xs">
          {selectedHandover && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-bold text-blue-950 text-sm">
                  Student: {students.find(s => s.id === selectedHandover.studentId)?.name}
                </div>
                {selectedHandover.failedAttempts > 0 && (
                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Failed Attempts: {selectedHandover.failedAttempts}/5
                  </span>
                )}
              </div>
              <div className="text-slate-600">
                Guardian on record: <strong>{selectedHandover.authorizedGuardianName}</strong> ({selectedHandover.guardianPhone})
              </div>
              <div className="text-[11px] text-slate-500">
                Drop stop: {assignedRoute?.pickupPoints.find(p => p.id === selectedHandover.pickupPointId)?.name || 'Designated Stop'}
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-2 text-center">
              Enter 6-Digit Guardian PIN *
            </label>
            <SixDigitPinInput
              value={enteredPin}
              onChange={val => {
                setEnteredPin(val);
                setPinVerificationError('');
              }}
              hasError={!!pinVerificationError}
              autoFocus={true}
            />
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              Guardian recites the dynamic 6-digit PIN shown in Parent Portal (or emergency backup PIN). (Max 5 attempts)
            </p>
          </div>

          {pinVerificationError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinVerificationError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsPinModalOpen(false);
                if (selectedHandover) openEscalateModal(selectedHandover);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
            >
              PIN mismatch? Escalate to Dispatch
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Verify & Handover
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* FEATURE A: ESCALATION MODAL */}
      <Modal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        title="Escalate Handover to School Safety Dispatch"
        subtitle="Use this if an unauthorized person attempts pickup or guardian PIN fails repeatedly."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmEscalation} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Escalation Reason / Observations *</label>
            <textarea
              rows={3}
              value={escalationReason}
              onChange={e => setEscalationReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
            <strong>Protocol:</strong> Retain the child safely aboard the bus. School dispatcher Thiru. S. Ramanathan and Kovai Valley security officer will contact the guardian directly.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEscalateModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
            >
              Confirm Escalation Alert
            </button>
          </div>
        </form>
      </Modal>

      {/* AUTHORIZED ADULT VERIFICATION MODAL */}
      <Modal
        isOpen={isAdultModalOpen}
        onClose={() => setIsAdultModalOpen(false)}
        title="Verify Authorized Adult Handover"
        subtitle="Confirm the identity of the authorized adult receiving the child at this stop."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmAdultSubmit} className="space-y-4 text-xs">
          {selectedHandover && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
              <div className="font-bold text-amber-950 text-sm">
                Student: {students.find(s => s.id === selectedHandover.studentId)?.name} (Class {students.find(s => s.id === selectedHandover.studentId)?.classGrade}-{students.find(s => s.id === selectedHandover.studentId)?.section})
              </div>
              <div className="text-slate-700">
                Authorized Adult Policy: Driver must physically verify guardian identity before releasing student.
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Authorized Adult Name *
            </label>
            <input
              type="text"
              value={selectedAdultName}
              onChange={e => setSelectedAdultName(e.target.value)}
              placeholder="e.g. Grandma Lakshmi / Uncle K. Rajesh"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Relationship to Student
            </label>
            <input
              type="text"
              value={selectedAdultRelation}
              onChange={e => setSelectedAdultRelation(e.target.value)}
              placeholder="e.g. Grandparent / Aunt / Neighbor / Van Driver"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Confirm person matches the registered guardian or authorized adult identity on file.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdultModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
            >
              Confirm Handover to Adult
            </button>
          </div>
        </form>
      </Modal>

      {/* DELAY MODAL */}
      <Modal
        isOpen={isDelayModalOpen}
        onClose={() => setIsDelayModalOpen(false)}
        title="Report Route Traffic Delay"
        subtitle="Notifies school dispatch office, administration, and parents along corridor."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmDelay} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Delay Duration (Minutes)</label>
            <input
              type="number"
              min="5"
              max="60"
              value={delayMinutes}
              onChange={e => setDelayMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason / Condition</label>
            <textarea
              rows={3}
              value={delayReason}
              onChange={e => setDelayReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDelayModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
            >
              Broadcast Delay Notice
            </button>
          </div>
        </form>
      </Modal>

      {/* ROUTE PREVIEW MODAL */}
      {assignedRoute && (
        <RoutePreviewModal
          isOpen={isRoutePreviewOpen}
          onClose={() => setIsRoutePreviewOpen(false)}
          route={assignedRoute}
          trip={activeTrip}
          bus={assignedBus}
          driver={myDriverRecord}
          students={busStudents}
          readinessRecords={readinessRecords}
          onStartTrip={tripId => {
            startTrip(tripId);
            setIsRoutePreviewOpen(false);
          }}
        />
      )}

      {/* DRIVER ROUTE DISRUPTION MODAL */}
      {assignedRoute && (
        <Modal
          isOpen={isDriverDisruptionModalOpen}
          onClose={() => setIsDriverDisruptionModalOpen(false)}
          title="Mark Route Disruption"
          subtitle={`Driver Incident Report for Route: ${assignedRoute.name} (${assignedRoute.routeCode})`}
          maxWidth="md"
        >
          <form onSubmit={handleDriverDisruptionSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold text-xs">Live Road Advisory Broadcast</div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Reporting a disruption triggers an instant toast alert, updates student/parent tracking ETAs, and notifies school transport dispatch.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Disruption Category *
                </label>
                <select
                  value={driverDisruptionType}
                  onChange={e => setDriverDisruptionType(e.target.value as DisruptionType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  required
                >
                  <option value="Traffic Congestion">Traffic Congestion</option>
                  <option value="Road Maintenance">Road Maintenance / Digging</option>
                  <option value="Road Closure">Road Closure / Blockade</option>
                  <option value="Weather-related Disruption">Weather / Waterlogging</option>
                  <option value="Other">Vehicle Breakdown / Other</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Expected Delay (Minutes) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={driverDisruptionDelayMin}
                  onChange={e => setDriverDisruptionDelayMin(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Bottleneck Location / Landmark *
              </label>
              <input
                type="text"
                value={driverDisruptionLocation}
                onChange={e => setDriverDisruptionLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. Avinashi Road flyover junction, Peelamedu"
                required
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {[
                  'Avinashi Road Flyover',
                  'Peelamedu Signal',
                  'Lakshmi Mills Junction',
                  'Gandhipuram Cross-Cut',
                  'Singanallur Trichy Rd',
                ].map(spot => (
                  <button
                    type="button"
                    key={spot}
                    onClick={() => setDriverDisruptionLocation(spot)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    {spot}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Alternative Stop / Bay
                </label>
                <input
                  type="text"
                  value={driverDisruptionAltStop}
                  onChange={e => setDriverDisruptionAltStop(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Adjacent Service Bay"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Detour Corridor
                </label>
                <input
                  type="text"
                  value={driverDisruptionReroute}
                  onChange={e => setDriverDisruptionReroute(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Divert via Kamarajar Road"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Driver Voice / Field Notes
              </label>
              <textarea
                rows={2}
                value={driverDisruptionDesc}
                onChange={e => setDriverDisruptionDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Road barricaded due to pipeline work; taking service lane detour."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDriverDisruptionModalOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mark Disruption & Trigger Alert</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
