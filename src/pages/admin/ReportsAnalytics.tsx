import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileSpreadsheet,
  Bus as BusIcon,
  Users,
  UserCheck,
  ClipboardCheck,
  Navigation,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { BarChart, DonutChart, ProgressBar } from '../../components/common/Charts';

type ReportType =
  | 'allocation'
  | 'utilization'
  | 'driver'
  | 'daily-attendance'
  | 'monthly-attendance'
  | 'trips'
  | 'route-students'
  | 'complaints'
  | 'handover-audit';

export const ReportsAnalytics: React.FC = () => {
  const { students, buses, drivers, routes, allocations, attendance, trips, complaints, handovers, getBusOccupancy, settings } = useData();

  const [activeReport, setActiveReport] = useState<ReportType>('allocation');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'this-week' | 'this-month' | 'academic-term' | 'custom'>('this-month');
  const [routeFilter, setRouteFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const reportTabs: { id: ReportType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'allocation', label: '1. Student Allocation', icon: Users },
    { id: 'utilization', label: '2. Bus Utilization', icon: BusIcon },
    { id: 'driver', label: '3. Driver Assignment', icon: UserCheck },
    { id: 'daily-attendance', label: '4. Daily Attendance', icon: ClipboardCheck },
    { id: 'monthly-attendance', label: '5. Monthly Attendance', icon: Calendar },
    { id: 'trips', label: '6. Trip History', icon: Navigation },
    { id: 'route-students', label: '7. Route-wise Students', icon: BarChart3 },
    { id: 'complaints', label: '8. Complaints Report', icon: MessageSquareWarning },
    { id: 'handover-audit', label: '9. Handover Safety Audit', icon: ShieldCheck },
  ];

  // Helper to parse dates into comparable YYYY-MM-DD
  const parseDateToComparable = (dateStr?: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length <= 2 && parts[2]?.length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return dateStr;
    }
    return dateStr;
  };

  // Helper to check if a date falls within [startDate, endDate]
  const isDateInRange = (itemDate?: string, start?: string, end?: string): boolean => {
    if (!start && !end) return true;
    const comp = parseDateToComparable(itemDate);
    if (!comp) return true;
    if (start && comp < start) return false;
    if (end && comp > end) return false;
    return true;
  };

  // Memoized filtered collections based on date range, route, bus, and search query
  const filteredAllocations = useMemo(() => {
    return allocations.filter(a => {
      if (routeFilter !== 'all' && a.routeId !== routeFilter) return false;
      if (busFilter !== 'all' && a.busId !== busFilter) return false;
      if (searchQuery) {
        const student = students.find(s => s.id === a.studentId);
        const route = routes.find(r => r.id === a.routeId);
        const bus = buses.find(b => b.id === a.busId);
        const q = searchQuery.toLowerCase();
        const matchesName = student?.name.toLowerCase().includes(q);
        const matchesId = student?.studentIdNumber.toLowerCase().includes(q) || a.studentId.toLowerCase().includes(q);
        const matchesRoute = route?.routeCode.toLowerCase().includes(q) || route?.name.toLowerCase().includes(q);
        const matchesBus = bus?.busNumber.toLowerCase().includes(q);
        return matchesName || matchesId || matchesRoute || matchesBus;
      }
      return true;
    });
  }, [allocations, routeFilter, busFilter, searchQuery, students, routes, buses]);

  const filteredBuses = useMemo(() => {
    return buses.filter(b => {
      if (busFilter !== 'all' && b.id !== busFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          b.busNumber.toLowerCase().includes(q) ||
          b.registrationNumber.toLowerCase().includes(q) ||
          b.model.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [buses, busFilter, searchQuery]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.driverCode.toLowerCase().includes(q) ||
          d.phone.includes(q) ||
          d.licenseNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [drivers, searchQuery]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter(att => {
      if (!isDateInRange(att.date, startDate, endDate)) return false;
      if (busFilter !== 'all' && att.busId !== busFilter) return false;
      if (routeFilter !== 'all' && att.routeId !== routeFilter) return false;
      if (searchQuery) {
        const student = students.find(s => s.id === att.studentId);
        const q = searchQuery.toLowerCase();
        const matchesStudent = student?.name.toLowerCase().includes(q) || student?.studentIdNumber.toLowerCase().includes(q);
        const matchesRemarks = att.remarks?.toLowerCase().includes(q);
        const matchesDate = att.date.includes(q);
        return matchesStudent || matchesRemarks || matchesDate;
      }
      return true;
    });
  }, [attendance, startDate, endDate, busFilter, routeFilter, searchQuery, students]);

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      if (!isDateInRange(t.date, startDate, endDate)) return false;
      if (busFilter !== 'all' && t.busId !== busFilter) return false;
      if (routeFilter !== 'all' && t.routeId !== routeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const bus = buses.find(b => b.id === t.busId);
        const driver = drivers.find(d => d.id === t.driverId);
        const route = routes.find(r => r.id === t.routeId);
        return (
          t.tripCode.toLowerCase().includes(q) ||
          (route?.name && route.name.toLowerCase().includes(q)) ||
          (driver?.name && driver.name.toLowerCase().includes(q)) ||
          (bus?.busNumber && bus.busNumber.toLowerCase().includes(q)) ||
          (t.delayReason && t.delayReason.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [trips, startDate, endDate, busFilter, routeFilter, searchQuery, buses, drivers, routes]);

  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      if (routeFilter !== 'all' && r.id !== routeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.routeCode.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [routes, routeFilter, searchQuery]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      if (!isDateInRange(c.submissionDate, startDate, endDate)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.complaintCode.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.submittedByName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [complaints, startDate, endDate, searchQuery]);

  const filteredHandovers = useMemo(() => {
    return handovers.filter(h => {
      if (!isDateInRange(h.date, startDate, endDate)) return false;
      if (searchQuery) {
        const student = students.find(s => s.id === h.studentId);
        const q = searchQuery.toLowerCase();
        return (
          h.id.toLowerCase().includes(q) ||
          (student?.name && student.name.toLowerCase().includes(q)) ||
          h.authorizedGuardianName.toLowerCase().includes(q) ||
          h.guardianPhone.includes(q) ||
          h.policy.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [handovers, startDate, endDate, searchQuery, students]);

  const activeRecordCount = useMemo(() => {
    switch (activeReport) {
      case 'allocation': return filteredAllocations.length;
      case 'utilization': return filteredBuses.length;
      case 'driver': return filteredDrivers.length;
      case 'daily-attendance':
      case 'monthly-attendance': return filteredAttendance.length;
      case 'trips': return filteredTrips.length;
      case 'route-students': return filteredRoutes.length;
      case 'complaints': return filteredComplaints.length;
      case 'handover-audit': return filteredHandovers.length;
      default: return 0;
    }
  }, [activeReport, filteredAllocations, filteredBuses, filteredDrivers, filteredAttendance, filteredTrips, filteredRoutes, filteredComplaints, filteredHandovers]);

  // Helper to trigger browser print and save as PDF
  const handlePrint = () => {
    window.print();
  };

  // CSV Generator for active report with filtered date range data
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    const rangeTag = startDate && endDate ? `${startDate}_to_${endDate}` : (startDate || endDate || 'all_dates');
    const filename = `smartroute_${activeReport}_${rangeTag}.csv`;

    if (activeReport === 'allocation') {
      headers = ['Student ID', 'Student Name', 'Grade', 'Route Code', 'Route Name', 'Bus Number', 'Pickup Stop', 'Status'];
      rows = filteredAllocations.map(a => {
        const student = students.find(s => s.id === a.studentId);
        const route = routes.find(r => r.id === a.routeId);
        const bus = buses.find(b => b.id === a.busId);
        const stop = route?.pickupPoints.find(p => p.id === a.pickupPointId);
        return [
          student?.studentIdNumber || a.studentId,
          `"${student?.name || ''}"`,
          student ? `Grade ${student.classGrade}${student.section}` : '',
          route?.routeCode || '',
          `"${route?.name || ''}"`,
          bus?.busNumber || '',
          `"${stop?.name || ''}"`,
          a.status,
        ];
      });
    } else if (activeReport === 'utilization') {
      headers = ['Bus Number', 'Plate Registration', 'Model', 'Capacity', 'Occupancy', 'Available Seats', 'Utilization %', 'Status'];
      rows = filteredBuses.map(b => {
        const occ = getBusOccupancy(b.id);
        return [
          b.busNumber,
          b.registrationNumber,
          `"${b.model}"`,
          String(occ.capacity),
          String(occ.occupied),
          String(occ.available),
          `${occ.percentage}%`,
          b.status,
        ];
      });
    } else if (activeReport === 'driver') {
      headers = ['Driver Code', 'Driver Name', 'Phone', 'License No', 'License Expiry', 'Assigned Bus', 'Status', 'Rating'];
      rows = filteredDrivers.map(d => {
        const bus = buses.find(b => b.assignedDriverId === d.id);
        return [
          d.driverCode,
          `"${d.name}"`,
          d.phone,
          d.licenseNumber,
          d.licenseExpiryDate,
          bus?.busNumber || 'None',
          d.status,
          String(d.rating),
        ];
      });
    } else if (activeReport === 'daily-attendance' || activeReport === 'monthly-attendance') {
      headers = ['Date', 'Session', 'Student ID', 'Student Name', 'Route Code', 'Bus', 'Status', 'Marked Time'];
      rows = filteredAttendance.map(att => {
        const student = students.find(s => s.id === att.studentId);
        const bus = buses.find(b => b.id === att.busId);
        const route = routes.find(r => r.id === att.routeId);
        return [
          att.date,
          att.session,
          student?.studentIdNumber || att.studentId,
          `"${student?.name || ''}"`,
          route?.routeCode || '',
          bus?.busNumber || '',
          att.status,
          att.markedTime || 'N/A',
        ];
      });
    } else if (activeReport === 'trips') {
      headers = ['Trip Code', 'Date', 'Session', 'Route', 'Bus', 'Driver', 'Scheduled Time', 'Status', 'Delay Reason'];
      rows = filteredTrips.map(t => {
        const bus = buses.find(b => b.id === t.busId);
        const driver = drivers.find(d => d.id === t.driverId);
        const route = routes.find(r => r.id === t.routeId);
        return [
          t.tripCode,
          t.date,
          t.session,
          `"${route?.name || ''}"`,
          bus?.busNumber || '',
          `"${driver?.name || ''}"`,
          `${t.scheduledStartTime} - ${t.expectedArrivalTime}`,
          t.status,
          `"${t.delayReason || ''}"`,
        ];
      });
    } else if (activeReport === 'route-students') {
      headers = ['Route Code', 'Route Name', 'Distance (km)', 'Duration (min)', 'Assigned Students', 'Capacity'];
      rows = filteredRoutes.map(r => {
        const count = students.filter(s => s.assignedRouteId === r.id && s.transportStatus === 'Active').length;
        return [r.routeCode, `"${r.name}"`, String(r.estimatedDistanceKm), String(r.estimatedDurationMin), String(count), '40'];
      });
    } else if (activeReport === 'complaints') {
      headers = ['Case Code', 'Date', 'Category', 'Priority', 'Subject', 'Submitted By', 'Status', 'Resolution'];
      rows = filteredComplaints.map(c => [
        c.complaintCode,
        c.submissionDate.split('T')[0],
        c.category,
        c.priority,
        `"${c.subject}"`,
        `"${c.submittedByName}"`,
        c.status,
        `"${c.adminResponse || ''}"`,
      ]);
    } else if (activeReport === 'handover-audit') {
      headers = ['Handover ID', 'Date', 'Time', 'Student ID', 'Student Name', 'Policy', 'Guardian Name', 'Guardian Phone', 'Status', '6-Digit OTP', 'Verified At', 'Method', 'Failed Attempts'];
      rows = filteredHandovers.map(h => {
        const student = students.find(s => s.id === h.studentId);
        return [
          h.id,
          h.date,
          h.time,
          student?.studentIdNumber || h.studentId,
          `"${student?.name || ''}"`,
          `"${h.policy}"`,
          `"${h.authorizedGuardianName}"`,
          h.guardianPhone,
          h.status,
          h.oneTimePin || student?.handoverPin || 'N/A',
          h.verifiedAt || h.dismissedAt || 'Pending',
          h.verificationMethod || 'N/A',
          String(h.failedAttempts || 0),
        ];
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reports & Fleet Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit-grade operational intelligence, bus capacity reports, and printable dispatch rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print or save analytical data as PDF document via window.print()"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Print/Export</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 8 Report Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {reportTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
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

      {/* Report Filter Bar with Date Range Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Range Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Time Period:</span>
            </span>
            {[
              { id: 'today', label: 'Today (31 Oct)', start: '2026-10-31', end: '2026-10-31' },
              { id: 'this-week', label: 'Past 7 Days', start: '2026-10-25', end: '2026-10-31' },
              { id: 'this-month', label: 'This Month (Oct 2026)', start: '2026-10-01', end: '2026-10-31' },
              { id: 'academic-term', label: 'Academic Term (Jun-Oct)', start: '2026-06-01', end: '2026-10-31' },
              { id: 'all', label: 'All Dates', start: '', end: '' },
            ].map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setDatePreset(preset.id as any);
                  setStartDate(preset.start);
                  setEndDate(preset.end);
                }}
                className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors cursor-pointer border ${
                  datePreset === preset.id
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Active Records: <strong className="text-slate-900 font-mono">{activeRecordCount}</strong> entries
          </div>
        </div>

        {/* Date Range Inputs & Secondary Dropdowns */}
        <div className="flex flex-wrap gap-3 items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
              <span className="text-[11px] text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
              <span className="text-[11px] text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-hidden"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setDatePreset('all');
                }}
                className="text-[11px] text-slate-500 hover:text-rose-600 underline px-1 cursor-pointer"
                title="Clear date range filters"
              >
                Clear Dates
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <select
              value={routeFilter}
              onChange={e => setRouteFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="all">All Corridors</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.routeCode} ({r.name})
                </option>
              ))}
            </select>

            <select
              value={busFilter}
              onChange={e => setBusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="all">All Fleet Buses</option>
              {buses.map(b => (
                <option key={b.id} value={b.id}>
                  {b.busNumber} ({b.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search filtered report..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header for Official School Printing */}
        <div className="border-b border-slate-200 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{settings.schoolName}</h2>
            <p className="text-xs text-slate-500">
              Department of Pupil Transportation • Academic Year {settings.academicYear}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Report Generated: {new Date().toLocaleDateString()} • Date Range: {startDate || 'Earliest'} to {endDate || 'Latest'} ({activeRecordCount} entries)
            </p>
          </div>
          <div className="text-right flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors print:hidden cursor-pointer"
              title="Print/Export this report as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print/Export</span>
            </button>
            <span className="text-xs font-mono font-bold text-blue-700 uppercase bg-blue-50 px-2 py-1 rounded border border-blue-200">
              {activeReport.replace('-', ' ').toUpperCase()} REPORT
            </span>
          </div>
        </div>

        {/* Dynamic Content based on active report */}
        {activeReport === 'allocation' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 block">Total Active Allocations</span>
                <span className="font-bold text-base text-slate-900">
                  {allocations.filter(a => a.status === 'Active').length}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 block">Unassigned Enrollees</span>
                <span className="font-bold text-base text-amber-600">
                  {students.filter(s => s.transportStatus !== 'Active').length}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 block">Fleet Capacity</span>
                <span className="font-bold text-base text-slate-900">200 Seats</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 block">Allocation Rate</span>
                <span className="font-bold text-base text-emerald-600">96%</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="px-3 py-2.5">Student ID</th>
                    <th className="px-3 py-2.5">Full Name</th>
                    <th className="px-3 py-2.5">Grade</th>
                    <th className="px-3 py-2.5">Route</th>
                    <th className="px-3 py-2.5">Bus</th>
                    <th className="px-3 py-2.5">Pickup Point</th>
                    <th className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAllocations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                        No allocations match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAllocations.map(alloc => {
                      const student = students.find(s => s.id === alloc.studentId);
                      const route = routes.find(r => r.id === alloc.routeId);
                      const bus = buses.find(b => b.id === alloc.busId);
                      const stop = route?.pickupPoints.find(p => p.id === alloc.pickupPointId);

                      return (
                        <tr key={alloc.id}>
                          <td className="px-3 py-2 font-mono">{student?.studentIdNumber}</td>
                          <td className="px-3 py-2 font-semibold text-slate-900">{student?.name}</td>
                          <td className="px-3 py-2">Grade {student?.classGrade}-{student?.section}</td>
                          <td className="px-3 py-2">{route?.routeCode}</td>
                          <td className="px-3 py-2 font-medium">{bus?.busNumber}</td>
                          <td className="px-3 py-2 text-slate-600">{stop?.name}</td>
                          <td className="px-3 py-2"><StatusBadge status={alloc.status} /></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'utilization' && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="px-3 py-2.5">Bus Number</th>
                    <th className="px-3 py-2.5">Registration</th>
                    <th className="px-3 py-2.5">Model</th>
                    <th className="px-3 py-2.5">Capacity</th>
                    <th className="px-3 py-2.5">Occupied</th>
                    <th className="px-3 py-2.5">Available</th>
                    <th className="px-3 py-2.5">Progress</th>
                    <th className="px-3 py-2.5">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBuses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                        No fleet vehicles match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBuses.map(bus => {
                      const occ = getBusOccupancy(bus.id);
                      return (
                        <tr key={bus.id}>
                          <td className="px-3 py-2.5 font-bold text-slate-900">{bus.busNumber}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-600">{bus.registrationNumber}</td>
                          <td className="px-3 py-2.5">{bus.model}</td>
                          <td className="px-3 py-2.5 font-medium">{occ.capacity}</td>
                          <td className="px-3 py-2.5 font-semibold text-blue-600">{occ.occupied}</td>
                          <td className="px-3 py-2.5 font-semibold text-emerald-600">{occ.available}</td>
                          <td className="px-3 py-2.5 w-36">
                            <ProgressBar value={occ.percentage} size="sm" showPercentage={true} />
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant={bus.maintenanceStatus === 'Good' ? 'success' : 'warning'}>
                              {bus.maintenanceStatus}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'driver' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2.5">Driver Code</th>
                  <th className="px-3 py-2.5">Operator Name</th>
                  <th className="px-3 py-2.5">Phone</th>
                  <th className="px-3 py-2.5">License Number</th>
                  <th className="px-3 py-2.5">Expiry Date</th>
                  <th className="px-3 py-2.5">Assigned Bus</th>
                  <th className="px-3 py-2.5">Safety Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      No drivers match the search query.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map(driver => {
                    const bus = buses.find(b => b.assignedDriverId === driver.id);
                    return (
                      <tr key={driver.id}>
                        <td className="px-3 py-2 font-mono font-medium">{driver.driverCode}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{driver.name}</td>
                        <td className="px-3 py-2 text-slate-600">{driver.phone}</td>
                        <td className="px-3 py-2 font-mono">{driver.licenseNumber}</td>
                        <td className="px-3 py-2">{driver.licenseExpiryDate}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">{bus?.busNumber || 'None'}</td>
                        <td className="px-3 py-2 font-semibold text-amber-600">{driver.rating} ★</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {(activeReport === 'daily-attendance' || activeReport === 'monthly-attendance') && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2.5">Log Date</th>
                  <th className="px-3 py-2.5">Session</th>
                  <th className="px-3 py-2.5">Student ID</th>
                  <th className="px-3 py-2.5">Passenger Name</th>
                  <th className="px-3 py-2.5">Route</th>
                  <th className="px-3 py-2.5">Bus</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Boarding Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                      No attendance records found within {startDate || 'earliest'} to {endDate || 'latest'}.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map(att => {
                    const student = students.find(s => s.id === att.studentId);
                    const bus = buses.find(b => b.id === att.busId);
                    const route = routes.find(r => r.id === att.routeId);
                    return (
                      <tr key={att.id}>
                        <td className="px-3 py-2 font-mono">{att.date}</td>
                        <td className="px-3 py-2">{att.session}</td>
                        <td className="px-3 py-2 font-mono">{student?.studentIdNumber}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{student?.name}</td>
                        <td className="px-3 py-2">{route?.routeCode}</td>
                        <td className="px-3 py-2">{bus?.busNumber}</td>
                        <td className="px-3 py-2"><StatusBadge status={att.status} /></td>
                        <td className="px-3 py-2 text-slate-600 font-mono">{att.markedTime || 'Absent'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'trips' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2.5">Trip Code</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Session</th>
                  <th className="px-3 py-2.5">Route</th>
                  <th className="px-3 py-2.5">Bus & Operator</th>
                  <th className="px-3 py-2.5">Timetable</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Incident / Delay Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                      No trip runs found within {startDate || 'earliest'} to {endDate || 'latest'}.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map(trip => {
                    const bus = buses.find(b => b.id === trip.busId);
                    const driver = drivers.find(d => d.id === trip.driverId);
                    const route = routes.find(r => r.id === trip.routeId);
                    return (
                      <tr key={trip.id}>
                        <td className="px-3 py-2 font-mono font-medium">{trip.tripCode}</td>
                        <td className="px-3 py-2">{trip.date}</td>
                        <td className="px-3 py-2">{trip.session}</td>
                        <td className="px-3 py-2">{route?.name}</td>
                        <td className="px-3 py-2">{bus?.busNumber} ({driver?.name})</td>
                        <td className="px-3 py-2 text-slate-600">{trip.scheduledStartTime} - {trip.expectedArrivalTime}</td>
                        <td className="px-3 py-2"><StatusBadge status={trip.status} /></td>
                        <td className="px-3 py-2 text-slate-500 italic">{trip.delayReason || 'On schedule'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'route-students' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2.5">Route Code</th>
                  <th className="px-3 py-2.5">Corridor Name</th>
                  <th className="px-3 py-2.5">Distance</th>
                  <th className="px-3 py-2.5">Duration</th>
                  <th className="px-3 py-2.5">Intermediate Stops</th>
                  <th className="px-3 py-2.5">Assigned Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      No routes match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.map(route => {
                    const assigned = students.filter(s => s.assignedRouteId === route.id && s.transportStatus === 'Active');
                    return (
                      <tr key={route.id}>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">{route.routeCode}</td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{route.name}</td>
                        <td className="px-3 py-2">{route.estimatedDistanceKm} km</td>
                        <td className="px-3 py-2">{route.estimatedDurationMin} min</td>
                        <td className="px-3 py-2">{route.pickupPoints.length} stops</td>
                        <td className="px-3 py-2 font-bold text-blue-600">{assigned.length} students</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'complaints' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2.5">Case Code</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="px-3 py-2.5">Submitted By</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      No complaints lodged within {startDate || 'earliest'} to {endDate || 'latest'}.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map(c => (
                    <tr key={c.id}>
                      <td className="px-3 py-2 font-mono font-medium">{c.complaintCode}</td>
                      <td className="px-3 py-2"><Badge variant="outline">{c.category}</Badge></td>
                      <td className="px-3 py-2 font-semibold">{c.priority}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{c.subject}</td>
                      <td className="px-3 py-2 text-slate-600">{c.submittedByName}</td>
                      <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                      <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{c.adminResponse || 'Pending'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'handover-audit' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 block">Total Scheduled Handovers</span>
                <span className="font-bold text-base text-slate-900">{filteredHandovers.length}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                <span className="text-emerald-700 block font-medium">Successfully Verified</span>
                <span className="font-bold text-base text-emerald-800">
                  {filteredHandovers.filter(h => h.status === 'Handed Over' || h.status === 'Independently Dismissed').length}
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs">
                <span className="text-blue-700 block font-medium">6-Digit OTP Protocol</span>
                <span className="font-bold text-base text-blue-800">Active</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs">
                <span className="text-rose-700 block font-medium">Escalated Alerts</span>
                <span className="font-bold text-base text-rose-800">
                  {filteredHandovers.filter(h => h.status === 'Escalated').length}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="px-3 py-2.5">Handover Code</th>
                    <th className="px-3 py-2.5">Pupil Name</th>
                    <th className="px-3 py-2.5">Class</th>
                    <th className="px-3 py-2.5">Policy</th>
                    <th className="px-3 py-2.5">Authorized Guardian</th>
                    <th className="px-3 py-2.5">6-Digit OTP</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Verified Time & Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHandovers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                        No handover records found within {startDate || 'earliest'} to {endDate || 'latest'}.
                      </td>
                    </tr>
                  ) : (
                    filteredHandovers.map(h => {
                      const student = students.find(s => s.id === h.studentId);
                      return (
                        <tr key={h.id}>
                          <td className="px-3 py-2 font-mono font-medium">{h.id}</td>
                          <td className="px-3 py-2 font-semibold text-slate-900">{student?.name}</td>
                          <td className="px-3 py-2">{student?.classGrade}-{student?.section}</td>
                          <td className="px-3 py-2"><Badge variant="outline">{h.policy}</Badge></td>
                          <td className="px-3 py-2 text-slate-700">
                            {h.authorizedGuardianName}
                            <span className="block text-[10px] text-slate-400">{h.guardianPhone}</span>
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-blue-900">
                            {h.oneTimePin || student?.handoverPin || '• • • • • •'}
                          </td>
                          <td className="px-3 py-2"><StatusBadge status={h.status} /></td>
                          <td className="px-3 py-2 text-slate-600">
                            {h.verifiedAt || h.dismissedAt || h.time}
                            {h.verificationMethod && (
                              <span className="block text-[10px] text-slate-400">
                                {h.verificationMethod === 'emergency_pin'
                                  ? 'Emergency Backup PIN'
                                  : h.verificationMethod === 'dispatcher_override'
                                  ? 'Dispatcher Override'
                                  : '6-Digit OTP'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Official Signature Footer for Print */}
        <div className="hidden print:flex items-center justify-between pt-12 border-t border-slate-300 text-xs">
          <div>
            <div className="w-48 border-b border-slate-400 mb-1" />
            <span>Transport Coordinator Signature</span>
          </div>
          <div className="text-right">
            <div className="w-48 border-b border-slate-400 mb-1 ml-auto" />
            <span>Head of School / Director Approval</span>
          </div>
        </div>
      </div>
    </div>
  );
};
