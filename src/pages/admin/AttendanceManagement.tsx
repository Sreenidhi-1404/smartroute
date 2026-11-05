import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { storageService } from '../../services/storageService';
import { AttendanceStatus } from '../../types';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  Calendar,
  Bus as BusIcon,
  Users,
  Download,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { ProgressBar } from '../../components/common/Charts';

export const AttendanceManagement: React.FC = () => {
  const { students, buses, routes, attendance, markAttendance, showToast } = useData();

  const [selectedDate, setSelectedDate] = useState('2026-10-31');
  const [selectedSession, setSelectedSession] = useState<'Morning' | 'Afternoon'>('Morning');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Draft attendance state for in-place editing before submission
  const [draftAttendance, setDraftAttendance] = useState<{ [studentId: string]: AttendanceStatus }>({});

  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
  const activeBus = buses.find(b => b.id === activeRoute?.assignedBusId);

  // Eligible students for this route
  const routeStudents = students.filter(
    s => s.assignedRouteId === activeRoute?.id && s.transportStatus === 'Active'
  );

  // Helper to format date for DD-MM-YYYY storage
  const normalizeDate = (d: string) => {
    if (d.includes('-') && d.split('-')[0].length === 4) {
      return d.split('-').reverse().join('-');
    }
    return d;
  };

  // Get current recorded attendance for these students on selected date
  const getExistingStatus = (studentId: string): AttendanceStatus => {
    if (draftAttendance[studentId]) return draftAttendance[studentId];
    const norm = normalizeDate(selectedDate);
    const rec = attendance.find(
      a => (a.date === selectedDate || a.date === norm) && a.studentId === studentId && a.session === selectedSession
    );
    return rec ? rec.status : 'Not Marked';
  };

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setDraftAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllBoarded = () => {
    const updated: { [stdId: string]: AttendanceStatus } = {};
    routeStudents.forEach(s => {
      updated[s.id] = 'Boarded';
    });
    setDraftAttendance(prev => ({ ...prev, ...updated }));
  };

  const handleSaveAttendance = () => {
    const norm = normalizeDate(selectedDate);
    const recordsToSave = routeStudents.map(s => {
      const status = draftAttendance[s.id] || getExistingStatus(s.id);
      return {
        date: norm,
        studentId: s.id,
        tripId: `TRIP-AUTO-${norm.replace(/-/g, '')}-${activeRoute?.id}`,
        busId: activeBus?.id || s.assignedBusId,
        routeId: activeRoute?.id || s.assignedRouteId,
        pickupPointId: s.pickupPointId,
        session: selectedSession,
        status,
        markedTime: status === 'Boarded' ? '07:18 AM' : undefined,
        markedByDriverId: activeRoute?.assignedDriverId,
        remarks: status === 'Absent' ? 'Marked absent at stop by dispatcher' : 'Boarding confirmed',
      };
    });

    markAttendance(recordsToSave);
    setDraftAttendance({});
    showToast('success', `Attendance for ${norm} saved successfully.`, 'Attendance Committed');
  };

  // Metrics for active route attendance
  const totalExpected = routeStudents.length;
  let boardedCount = 0;
  let absentCount = 0;
  let uncommittedCount = 0;

  routeStudents.forEach(s => {
    const st = getExistingStatus(s.id);
    if (st === 'Boarded') boardedCount++;
    else if (st === 'Absent') absentCount++;
    else uncommittedCount++;
  });

  const completionPercent = totalExpected > 0 ? Math.round(((boardedCount + absentCount) / totalExpected) * 100) : 0;
  const boardingRate = totalExpected > 0 ? Math.round((boardedCount / totalExpected) * 100) : 0;

  // Intelligent Attendance Pattern Analysis (Feature B)
  const patternAnalysis = storageService.getAttendancePatterns();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daily Transport Attendance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Student passenger verification logs, driver roll-call manifest, and absence analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllBoarded}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark All Boarded</span>
          </button>
          <button
            onClick={handleSaveAttendance}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Commit & Save Attendance</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Expected"
          value={totalExpected}
          subtitle={`Route: ${activeRoute?.routeCode || ''}`}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Students Boarded"
          value={boardedCount}
          subtitle={`${boardingRate}% boarding rate`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Recorded Absences"
          value={absentCount}
          subtitle="Parent notifications triggered"
          icon={XCircle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <StatCard
          title="Verification Progress"
          value={`${completionPercent}%`}
          subtitle={`${uncommittedCount} students unverified`}
          icon={Clock}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>

      {/* INTELLIGENT ATTENDANCE PATTERN ANALYSIS (FEATURE B) */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-sm text-white">
              Intelligent Attendance Pattern Diagnostics
            </h3>
          </div>
          <span className="text-xs text-sky-300 font-medium">
            Overall Fleet Attendance: {patternAnalysis.overallAttendanceRate}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Repeat Absentees */}
          <div className="bg-white/10 rounded-lg p-3 border border-white/10">
            <h4 className="font-bold text-sky-200 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Repeated Transport Absences Detected
            </h4>
            <div className="space-y-1.5 text-slate-300 mt-2">
              {patternAnalysis.repeatAbsentees.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>
                    {item.student.name} (Grade {item.student.classGrade}{item.student.section})
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 font-mono text-[10px]">
                    {item.absenceCount} absences • Last: {item.lastDate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Route Attendance Performance */}
          <div className="bg-white/10 rounded-lg p-3 border border-white/10">
            <h4 className="font-bold text-sky-200 mb-1 flex items-center gap-1.5">
              <BusIcon className="w-3.5 h-3.5 text-sky-400" />
              Corridor Absence Rates
            </h4>
            <div className="space-y-1.5 text-slate-300 mt-2">
              {patternAnalysis.routeAbsenceRates.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span>{r.routeName}</span>
                  <span
                    className={`font-mono text-[10px] ${
                      r.rate > 10 ? 'text-amber-300 font-bold' : 'text-emerald-300'
                    }`}
                  >
                    {r.absentCount} absent ({r.rate}% absence rate)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Date, Session & Route Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs border border-slate-200">
            <button
              onClick={() => setSelectedSession('Morning')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                selectedSession === 'Morning'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Morning Pickup
            </button>
            <button
              onClick={() => setSelectedSession('Afternoon')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                selectedSession === 'Afternoon'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Afternoon Dropoff
            </button>
          </div>

          <select
            value={selectedRouteId}
            onChange={e => setSelectedRouteId(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            {routes.map(r => (
              <option key={r.id} value={r.id}>
                {r.routeCode} - {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search passenger name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Attendance Manifest Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Roll / ID</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Designated Stop</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3 text-right">Attendance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routeStudents
                .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(student => {
                  const status = getExistingStatus(student.id);
                  const stop = activeRoute?.pickupPoints.find(p => p.id === student.pickupPointId);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {student.studentIdNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">{student.name}</span>
                        <span className="text-[11px] text-slate-400">Guardian: {student.parentPhone}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        Grade {student.classGrade}-{student.section}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="font-medium text-slate-800">{stop?.name || 'Main Stop'}</span>
                        <span className="text-[11px] text-slate-400 block">{stop?.morningTime}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'Boarded')}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                              status === 'Boarded'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Boarded</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetStatus(student.id, 'Absent')}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                              status === 'Absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-rose-700 hover:bg-white'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
