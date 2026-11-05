import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { storageService } from '../../services/storageService';
import { Trip, TripStatus, DisruptionType } from '../../types';
import {
  Navigation,
  Search,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  Bus as BusIcon,
  UserCheck,
  MapPin,
  AlertCircle,
  Eye,
  Route as RouteIcon,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const TripManagement: React.FC = () => {
  const { trips, buses, drivers, routes, scheduleTrip, startTrip, delayTrip, completeTrip, reportDisruption } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [isDisruptionModalOpen, setIsDisruptionModalOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [disruptionTrip, setDisruptionTrip] = useState<Trip | null>(null);

  // Disruption form state (Driver Route Disruption)
  const [disruptionDriverId, setDisruptionDriverId] = useState('');
  const [disruptionRouteId, setDisruptionRouteId] = useState('');
  const [disruptionType, setDisruptionType] = useState<DisruptionType>('Traffic Congestion');
  const [disruptionLocation, setDisruptionLocation] = useState('');
  const [disruptionDelayMin, setDisruptionDelayMin] = useState(15);
  const [disruptionDescription, setDisruptionDescription] = useState('');
  const [disruptionAlternativeStop, setDisruptionAlternativeStop] = useState('');
  const [disruptionReroute, setDisruptionReroute] = useState('');
  const [applyTripDelay, setApplyTripDelay] = useState(true);

  // Delay form
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState('Traffic congestion along arterial junction');

  // Schedule form
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    session: 'Morning Pickup' as 'Morning Pickup' | 'Afternoon Dropoff',
    busId: buses[0]?.id || '',
    driverId: drivers[0]?.id || '',
    routeId: routes[0]?.id || '',
    scheduledStartTime: '07:00 AM',
    expectedArrivalTime: '07:45 AM',
    status: 'Scheduled' as TripStatus,
    notes: 'Regular scheduled route transit.',
  });

  const filteredTrips = trips.filter(t => {
    const bus = buses.find(b => b.id === t.busId);
    const driver = drivers.find(d => d.id === t.driverId);
    const route = routes.find(r => r.id === t.routeId);

    const matchesSearch =
      t.tripCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus?.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSession = sessionFilter === 'all' || t.session === sessionFilter;

    return matchesSearch && matchesStatus && matchesSession;
  });

  // Intelligent Delay Risk Diagnostics (Feature D)
  const delayRiskData = storageService.getDelayRiskInsights();

  const openDelayModal = (trip: Trip) => {
    setActiveTrip(trip);
    setDelayMinutes(15);
    setDelayReason(trip.delayReason || 'Traffic congestion near Metro Plaza');
    setIsDelayModalOpen(true);
  };

  const handleConfirmDelay = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTrip) {
      delayTrip(activeTrip.id, delayMinutes, delayReason);
      setIsDelayModalOpen(false);
    }
  };

  const openDisruptionModal = (trip?: Trip) => {
    if (trip) {
      setDisruptionTrip(trip);
      setDisruptionDriverId(trip.driverId || drivers[0]?.id || '');
      setDisruptionRouteId(trip.routeId || routes[0]?.id || '');
      setDisruptionLocation(trip.delayReason || 'Avinashi Road - Peelamedu Junction');
      setDisruptionDelayMin(trip.delayDurationMin || 15);
      setDisruptionDescription(`Driver on trip ${trip.tripCode} reported transit disruption and heavy road block.`);
    } else {
      setDisruptionTrip(null);
      setDisruptionDriverId(drivers[0]?.id || '');
      setDisruptionRouteId(routes[0]?.id || '');
      setDisruptionLocation('Avinashi Road - Lakshmi Mills Junction');
      setDisruptionDelayMin(15);
      setDisruptionDescription('Driver marked route bottleneck; vehicular movement halted.');
    }
    setDisruptionType('Traffic Congestion');
    setDisruptionAlternativeStop('Adjacent Service Road Bay');
    setDisruptionReroute('Divert via Kamarajar Road arterial corridor to bypass junction blockade.');
    setApplyTripDelay(true);
    setIsDisruptionModalOpen(true);
  };

  const handleDisruptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disruptionLocation.trim()) return;

    const reportingDriver = drivers.find(d => d.id === disruptionDriverId);
    const affectedRoute = routes.find(r => r.id === disruptionRouteId);
    const driverName = reportingDriver ? reportingDriver.name : 'Driver';

    // 1. Report Disruption (triggers toast alert in DataContext)
    reportDisruption({
      routeId: disruptionRouteId,
      disruptionType,
      locationName: disruptionLocation.trim(),
      description: disruptionDescription.trim() || `Route disruption reported by Driver ${driverName}.`,
      affectedPickupPointIds: affectedRoute ? [affectedRoute.pickupPoints[0]?.id || ''] : [],
      suggestedAlternativeStopName: disruptionAlternativeStop.trim() || 'Adjacent Service Road Bay',
      suggestedRerouteDescription: disruptionReroute.trim() || 'Divert via parallel arterial link road to bypass block.',
      estimatedDelayMin: Number(disruptionDelayMin),
      status: 'Active',
      reportedBy: `Driver ${driverName} (${reportingDriver?.driverCode || 'DRV'})`,
    });

    // 2. If trip is associated and applyTripDelay is true, also update trip timetable
    const targetTrip = disruptionTrip || (trips.find(t => t.routeId === disruptionRouteId && (t.status === 'Started' || t.status === 'Scheduled')));
    if (targetTrip && applyTripDelay) {
      delayTrip(
        targetTrip.id,
        Number(disruptionDelayMin),
        `Driver ${driverName} reported: ${disruptionType} at ${disruptionLocation.trim()}`
      );
    }

    setIsDisruptionModalOpen(false);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleTrip({
      date: formData.date,
      session: formData.session,
      busId: formData.busId,
      driverId: formData.driverId,
      routeId: formData.routeId,
      scheduledStartTime: formData.scheduledStartTime,
      expectedArrivalTime: formData.expectedArrivalTime,
      status: 'Scheduled',
      notes: formData.notes,
    });
    setIsScheduleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Trip Dispatch & Execution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulated route runs, departure logs, delay management, and historical schedule performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => openDisruptionModal()}
            className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            title="Mark route disruption reported by driver"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Mark Route Disruption</span>
          </button>

          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Trip</span>
          </button>
        </div>
      </div>

      {/* INTELLIGENT DELAY RISK INSIGHTS (FEATURE D) */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-sm text-white">
              Intelligent Delay Risk Diagnostics
            </h3>
          </div>
          <span className="text-xs text-sky-300 font-medium">
            Fleet Avg Delay Duration: ~{delayRiskData.averageDelayMinutes} mins
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {delayRiskData.highRiskRoutes.slice(0, 3).map((routeRisk, idx) => (
            <div
              key={idx}
              className="bg-white/10 rounded-lg p-3 border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>{routeRisk.routeName}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      routeRisk.riskLevel === 'High'
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {routeRisk.riskLevel} Delay Risk
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {routeRisk.primaryReason}
                </p>
              </div>

              <div className="mt-2 text-[10px] text-sky-200/80 pt-1.5 border-t border-white/10">
                Action: Recommend 10-min schedule buffer for morning run.
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search trip code, bus, driver, route..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <select
            value={sessionFilter}
            onChange={e => setSessionFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Sessions</option>
            <option value="Morning Pickup">Morning Pickup</option>
            <option value="Afternoon Dropoff">Afternoon Dropoff</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Trip Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Started">Started</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Trip Code</th>
                <th className="px-4 py-3">Date & Session</th>
                <th className="px-4 py-3">Assigned Route</th>
                <th className="px-4 py-3">Bus & Driver</th>
                <th className="px-4 py-3">Scheduled Time</th>
                <th className="px-4 py-3">Actual Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Dispatch Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrips.map(trip => {
                const bus = buses.find(b => b.id === trip.busId);
                const driver = drivers.find(d => d.id === trip.driverId);
                const route = routes.find(r => r.id === trip.routeId);

                return (
                  <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      {trip.tripCode}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900 block">{trip.date}</span>
                      <span className="text-[11px] text-slate-400">{trip.session}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {route ? `${route.routeCode} (${route.name})` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{bus?.busNumber}</div>
                      <div className="text-[11px] text-slate-400">{driver?.name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {trip.scheduledStartTime} ➔ {trip.expectedArrivalTime}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-mono">
                      {trip.actualStartTime ? trip.actualStartTime : '—'}
                      {trip.actualArrivalTime ? ` ➔ ${trip.actualArrivalTime}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={trip.status} />
                      {trip.delayReason && (
                        <div className="text-[10px] text-amber-700 mt-1 max-w-[140px] truncate" title={trip.delayReason}>
                          +{trip.delayDurationMin}m: {trip.delayReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openDisruptionModal(trip)}
                          className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors flex items-center gap-1"
                          title={`Mark route disruption reported by driver ${driver?.name || ''}`}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Disruption</span>
                        </button>

                        {trip.status === 'Scheduled' && (
                          <button
                            onClick={() => startTrip(trip.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start</span>
                          </button>
                        )}

                        {(trip.status === 'Started' || trip.status === 'Delayed') && (
                          <>
                            <button
                              onClick={() => openDelayModal(trip)}
                              className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                            >
                              Log Delay
                            </button>
                            <button
                              onClick={() => completeTrip(trip.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          </>
                        )}

                        {trip.status === 'Completed' && (
                          <span className="text-[11px] text-slate-400 font-medium">Logged</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG DELAY MODAL */}
      <Modal
        isOpen={isDelayModalOpen}
        onClose={() => setIsDelayModalOpen(false)}
        title="Record Trip Schedule Delay"
        subtitle={`Dispatch Alert for ${activeTrip?.tripCode}`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmDelay} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Estimated Delay Duration (Minutes) *
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={delayMinutes}
              onChange={e => setDelayMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Delay Reason / Root Cause *
            </label>
            <textarea
              rows={3}
              value={delayReason}
              onChange={e => setDelayReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g. Municipal road resurfacing detours near Greenfield Ave"
              required
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
            Logging a delay will update parent and student portals and display estimated arrival revisions.
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
              Submit Delay Notice
            </button>
          </div>
        </form>
      </Modal>

      {/* SCHEDULE TRIP MODAL */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Transport Trip"
        subtitle="Configure route run, vehicle, operator and timetable."
        maxWidth="lg"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Trip Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Session *</label>
              <select
                value={formData.session}
                onChange={e => setFormData({ ...formData, session: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Morning Pickup">Morning Pickup</option>
                <option value="Afternoon Dropoff">Afternoon Dropoff</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Route Corridor</label>
              <select
                value={formData.routeId}
                onChange={e => setFormData({ ...formData, routeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.routeCode} ({r.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Fleet Bus</label>
              <select
                value={formData.busId}
                onChange={e => setFormData({ ...formData, busId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {buses.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.busNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned Driver</label>
              <select
                value={formData.driverId}
                onChange={e => setFormData({ ...formData, driverId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Scheduled Start Time</label>
              <input
                type="text"
                value={formData.scheduledStartTime}
                onChange={e => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="07:00 AM"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Expected Arrival Time</label>
              <input
                type="text"
                value={formData.expectedArrivalTime}
                onChange={e => setFormData({ ...formData, expectedArrivalTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="07:45 AM"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Schedule Run
            </button>
          </div>
        </form>
      </Modal>

      {/* MARK ROUTE DISRUPTION MODAL (DRIVER REPORTED) */}
      <Modal
        isOpen={isDisruptionModalOpen}
        onClose={() => setIsDisruptionModalOpen(false)}
        title="Mark Route Disruption"
        subtitle={
          disruptionTrip
            ? `Driver Advisory for Trip ${disruptionTrip.tripCode}`
            : 'Driver-reported road closure, heavy bottleneck or emergency detour.'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleDisruptionSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-semibold text-xs">Driver Road Advisory Protocol</div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Submitting this report triggers an immediate system toast alert, logs the disruption to dispatch records, activates parent portal advisories, and reroutes affected stops.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Reporting Driver *
              </label>
              <select
                value={disruptionDriverId}
                onChange={e => setDisruptionDriverId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                required
              >
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.driverCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Affected Route Corridor *
              </label>
              <select
                value={disruptionRouteId}
                onChange={e => setDisruptionRouteId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                required
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.routeCode} ({r.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Disruption Category *
              </label>
              <select
                value={disruptionType}
                onChange={e => setDisruptionType(e.target.value as DisruptionType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                required
              >
                <option value="Traffic Congestion">Traffic Congestion</option>
                <option value="Road Maintenance">Road Maintenance / Digging</option>
                <option value="Road Closure">Road Closure / Blockade</option>
                <option value="Weather-related Disruption">Weather-related Disruption (Waterlogging)</option>
                <option value="Other">Vehicle Breakdown / Other</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Estimated Transit Delay (Minutes) *
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={disruptionDelayMin}
                onChange={e => setDisruptionDelayMin(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Disruption Location / Landmark *
            </label>
            <input
              type="text"
              value={disruptionLocation}
              onChange={e => setDisruptionLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g. Avinashi Road flyover ramp junction, Peelamedu"
              required
            />
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 self-center">Coimbatore hotspots:</span>
              {[
                'Avinashi Road Flyover Ramp',
                'Peelamedu Signal Junction',
                'Lakshmi Mills Junction',
                'Gandhipuram Cross-Cut Road',
                'Singanallur Trichy Road',
              ].map(spot => (
                <button
                  type="button"
                  key={spot}
                  onClick={() => setDisruptionLocation(spot)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {spot}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Suggested Alternative Stop / Service Bay
              </label>
              <input
                type="text"
                value={disruptionAlternativeStop}
                onChange={e => setDisruptionAlternativeStop(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. Adjacent Service Road Bay"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Detour / Bypass Corridor
              </label>
              <input
                type="text"
                value={disruptionReroute}
                onChange={e => setDisruptionReroute(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. Divert via Kamarajar Road to bypass junction block"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Driver Field Observations / Notes
            </label>
            <textarea
              rows={2}
              value={disruptionDescription}
              onChange={e => setDisruptionDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Driver notes transmitted via wireless radio or field dispatch..."
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              id="applyTripDelay"
              checked={applyTripDelay}
              onChange={e => setApplyTripDelay(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="applyTripDelay" className="text-xs text-slate-700 cursor-pointer font-medium">
              Automatically apply delay (+{disruptionDelayMin}m) to associated trip timetable and broadcast to parents
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDisruptionModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Mark Disruption & Trigger Alert</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
