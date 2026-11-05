import React from 'react';
import { useData } from '../../context/DataContext';
import { storageService } from '../../services/storageService';
import {
  Users,
  Bus as BusIcon,
  UserCheck,
  Map,
  ArrowLeftRight,
  ClipboardCheck,
  Navigation,
  MessageSquareWarning,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { ProgressBar, DonutChart, BarChart, LineChart } from '../../components/common/Charts';

export const AdminDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({
  onNavigate,
}) => {
  const {
    students,
    buses,
    drivers,
    routes,
    attendance = [],
    trips,
    complaints,
    handovers,
    missedAlerts,
    disruptions,
    getBusOccupancy,
  } = useData();

  // Calculated dynamic statistics from underlying Coimbatore data
  const totalStudents = students.length;
  const assignedStudents = students.filter(s => s.transportStatus === 'Active').length;
  const totalBuses = buses.length;
  const totalDrivers = drivers.length;
  const activeRoutes = routes.filter(r => r.status === 'Active').length;
  const activeTrips = trips.filter(t => t.status === 'Started' || t.status === 'Delayed').length;
  const pendingComplaints = complaints.filter(
    c => c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'In Progress'
  ).length;

  // Feature A, B, D counts
  const pendingHandovers = handovers.filter(
    h => h.status === 'Arrived at Drop-off' || h.status === 'Awaiting Guardian Verification' || h.status === 'Escalated'
  ).length;
  const activeMissedAlerts = missedAlerts.filter(a => a.status === 'Active').length;
  const activeDisruptions = disruptions.filter(d => d.status === 'Active' || d.status === 'Approved').length;

  // Attendance stats derived safely
  const attendancePatterns = storageService.getAttendancePatterns ? storageService.getAttendancePatterns() : { overallAttendanceRate: 94 };
  const todayDateStr = '31-10-2026';
  const todayRecords = attendance.filter(a => a.date === todayDateStr);
  const activeAttendanceRecords = todayRecords.length > 0 ? todayRecords : attendance;
  const boardedCount = activeAttendanceRecords.filter(a => a.status === 'Boarded').length;
  const absentCount = activeAttendanceRecords.filter(a => a.status === 'Absent').length;
  const totalMarked = boardedCount + absentCount;
  const todayAttendanceRate = totalMarked > 0 ? Math.round((boardedCount / totalMarked) * 100) : (attendancePatterns?.overallAttendanceRate || 94);

  // Bus capacity calculations
  const totalCapacity = buses.reduce((acc, b) => acc + b.seatingCapacity, 0);
  const totalOccupied = buses.reduce((acc, b) => acc + getBusOccupancy(b.id).occupied, 0);
  const overallUtilization = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  // Route-wise student distribution
  const routeBarData = routes.map(r => {
    const count = students.filter(s => s.assignedRouteId === r.id && s.transportStatus === 'Active').length;
    return {
      label: r.routeCode,
      value: count,
      tooltip: `${r.name}: ${count} students`,
      color: '#2563eb',
    };
  });

  // Daily attendance trend (Mon-Fri + Today in Coimbatore)
  const attendanceTrendData = [
    { label: 'Mon', value: 95 },
    { label: 'Tue', value: 96 },
    { label: 'Wed', value: 93 },
    { label: 'Thu', value: 97 },
    { label: 'Fri', value: 92 },
    { label: 'Today', value: todayAttendanceRate },
  ];

  // Bus Utilization Donut
  const occupiedSlices = [
    { label: 'Allocated Seats', value: totalOccupied, color: '#2563eb' },
    { label: 'Available Seats', value: Math.max(0, totalCapacity - totalOccupied), color: '#94a3b8' },
  ];

  // Feature E: Smart Bus Capacity & Seat Optimization
  const capacityOptimization = storageService.getCapacityOptimizationSuggestions();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kovai Valley Transport Control Room
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Coimbatore fleet telemetry, student handover verifications, and route contingencies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('allocation')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Seat Allocation</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Transport Reports</span>
          </button>
        </div>
      </div>

      {/* Operational Control Overview Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              Operational Control Overview (31-10-2026)
            </h2>
            <p className="text-xs text-slate-500">
              Live operational metrics across trips, passenger roll call, student handovers, and contingencies. Click any card to inspect.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
            Kovai Valley Central Dispatch
          </span>
        </div>

        {/* Operational Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Trips: In Progress */}
          <div
            onClick={() => onNavigate('trips')}
            className="p-3.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-xl cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-xs text-blue-800 font-semibold">
              <span>Trips In Progress</span>
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-950">{activeTrips}</div>
            <div className="text-[10px] text-blue-600 flex items-center justify-between">
              <span>Scheduled: {trips.filter(t => t.status === 'Scheduled').length}</span>
              <span>Done: {trips.filter(t => t.status === 'Completed').length}</span>
            </div>
          </div>

          {/* Passengers Boarded */}
          <div
            onClick={() => onNavigate('attendance')}
            className="p-3.5 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <span>Boarded Pupils</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-950">
              {boardedCount}
            </div>
            <div className="text-[10px] text-emerald-700">
              Expected: {assignedStudents} passengers
            </div>
          </div>

          {/* Absent Students */}
          <div
            onClick={() => onNavigate('attendance')}
            className="p-3.5 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 rounded-xl cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-xs text-rose-800 font-semibold">
              <span>Absent (Alerts)</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-950">
              {absentCount}
            </div>
            <div className="text-[10px] text-rose-700 font-medium">
              Auto-Alert SMS dispatched
            </div>
          </div>

          {/* Pending Handovers */}
          <div
            onClick={() => onNavigate('handovers')}
            className="p-3.5 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 rounded-xl cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
              <span>Pending Handovers</span>
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-950">{pendingHandovers}</div>
            <div className="text-[10px] text-amber-700">
              Completed: {handovers.filter(h => h.status === 'Handed Over' || h.status === 'Independently Dismissed').length}
            </div>
          </div>

          {/* Active Complaints */}
          <div
            onClick={() => onNavigate('complaints')}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
              <span>Active Inquiries</span>
              <MessageSquareWarning className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{pendingComplaints}</div>
            <div className="text-[10px] text-slate-500">
              Disruptions: {activeDisruptions} active
            </div>
          </div>
        </div>
      </div>

      {/* 5 Core Fleet & Student Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="Enrolled pupils"
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          onClick={() => onNavigate('students')}
        />
        <StatCard
          title="Fleet Buses"
          value={totalBuses}
          subtitle="TN 38, 37, 66, 40"
          icon={BusIcon}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          onClick={() => onNavigate('buses')}
        />
        <StatCard
          title="Active Drivers"
          value={totalDrivers}
          subtitle="All RTO verified"
          icon={UserCheck}
          iconColor="text-cyan-600"
          iconBg="bg-cyan-50"
          onClick={() => onNavigate('drivers')}
        />
        <StatCard
          title="Route Network"
          value={activeRoutes}
          subtitle="Coimbatore zones"
          icon={Map}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          onClick={() => onNavigate('routes')}
        />
        <StatCard
          title="Capacity Rate"
          value={`${overallUtilization}%`}
          subtitle={`${totalOccupied}/${totalCapacity} seats`}
          icon={ArrowLeftRight}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          onClick={() => onNavigate('buses')}
        />
      </div>

      {/* FEATURE B & D Active Urgent Banners */}
      {(activeMissedAlerts > 0 || activeDisruptions > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Missed Boarding Alert Card */}
          {activeMissedAlerts > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Missed Boarding Alerts ({activeMissedAlerts} Active)
                </span>
                <button
                  onClick={() => onNavigate('attendance')}
                  className="text-xs font-semibold text-rose-700 hover:underline"
                >
                  Manage Roll Call
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-rose-800">
                {missedAlerts.filter(a => a.status === 'Active').map(alert => (
                  <div key={alert.id} className="p-2 bg-white/90 rounded border border-rose-200 flex items-center justify-between">
                    <div>
                      <strong>{alert.studentName}</strong> ({alert.classGrade}-{alert.section}) missed pickup at{' '}
                      <strong>{alert.pickupPointName}</strong> at {alert.expectedTime}.
                    </div>
                    <span className="text-[10px] font-mono text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                      Guardian: {alert.parentPhone}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Disruption Card */}
          {activeDisruptions > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Map className="w-4 h-4 text-amber-600" />
                  Route Disruption Advisory ({activeDisruptions} Active)
                </span>
                <button
                  onClick={() => onNavigate('disruptions')}
                  className="text-xs font-semibold text-amber-700 hover:underline"
                >
                  View Detours
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-amber-900">
                {disruptions.filter(d => d.status === 'Active' || d.status === 'Approved').slice(0, 2).map(d => (
                  <div key={d.id} className="p-2 bg-white/90 rounded border border-amber-200 flex items-center justify-between">
                    <div>
                      <strong>{d.locationName}</strong>: {d.description}
                    </div>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded shrink-0 ml-2">
                      +{d.estimatedDelayMin}m buffer
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FEATURE E: Smart Bus Capacity & Seat Optimization Insights */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-sm text-white">
              Smart Bus Capacity & Seat Optimization (Coimbatore Fleet)
            </h3>
          </div>
          <span className="text-xs text-sky-300 font-medium">
            Fleet Seating Utilization: {overallUtilization}% ({totalOccupied} / {totalCapacity} Seats)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {capacityOptimization.rebalanceSuggestions.map((sug, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-3 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-sky-200">
                <span>{sug.fromBus} ➔ {sug.toBus}</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 font-mono text-[10px]">
                  Shift {sug.studentsToShift} Pupils
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {sug.rationale}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Passenger Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-slate-900">Route Passenger Distribution</h3>
              <span className="text-xs text-slate-400">Coimbatore Routes</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Pupils assigned to each active school corridor
            </p>
          </div>
          <BarChart data={routeBarData} height={190} valueSuffix=" students" />
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Peak: <strong>RT-101</strong> (Avinashi Road Express)</span>
            <button
              onClick={() => onNavigate('routes')}
              className="text-blue-600 font-medium hover:underline flex items-center gap-0.5"
            >
              Corridors <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bus Capacity Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-slate-900">Fleet Seating Breakdown</h3>
              <Badge variant="info">{overallUtilization}% Full</Badge>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Total seats filled across 5 buses vs reserve seats
            </p>
          </div>

          <DonutChart
            data={occupiedSlices}
            totalLabel="Capacity"
            totalValue={`${totalOccupied}/${totalCapacity}`}
            size={170}
          />

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Spare seats: <strong>{Math.max(0, totalCapacity - totalOccupied)}</strong></span>
            <button
              onClick={() => onNavigate('buses')}
              className="text-blue-600 font-medium hover:underline flex items-center gap-0.5"
            >
              Bus Details <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Attendance Verification Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-slate-900">Attendance Verification</h3>
              <span className="text-xs font-semibold text-emerald-600">Weekly Avg: 94%</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Biometric passenger verification trend
            </p>
          </div>

          <LineChart data={attendanceTrendData} height={180} valueSuffix="%" />

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Today's Boarded: <strong>{boardedCount} pupils</strong></span>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-blue-600 font-medium hover:underline flex items-center gap-0.5"
            >
              Roll Call <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Bus Progress Bars */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Fleet Occupancy Breakdown (Tamil Nadu Plates)</h3>
            <p className="text-xs text-slate-500">Live seat occupancy for all 5 school buses</p>
          </div>
          <button
            onClick={() => onNavigate('buses')}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            Manage Buses
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {buses.map(bus => {
            const occ = getBusOccupancy(bus.id);
            return (
              <div key={bus.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-800">{bus.busNumber}</span>
                  <Badge variant={bus.status === 'Active' ? 'success' : 'warning'}>
                    {bus.status}
                  </Badge>
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate mb-2">
                  {bus.registrationNumber}
                </div>
                <ProgressBar
                  value={occ.percentage}
                  size="sm"
                  label=""
                  sublabel={`${occ.occupied}/${occ.capacity} seats`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
