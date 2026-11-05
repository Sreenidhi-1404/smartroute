import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { TransportAllocation, Student } from '../../types';
import {
  ArrowLeftRight,
  Search,
  Plus,
  Bus as BusIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  History,
  Users,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ProgressBar } from '../../components/common/Charts';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const TransportAllocationPage: React.FC = () => {
  const {
    students,
    buses,
    routes,
    allocations,
    createAllocation,
    cancelAllocation,
    getBusOccupancy,
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Cancelled' | 'Changed'>('Active');
  const [routeFilter, setRouteFilter] = useState('all');

  // Allocation Wizard Modal
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedStopId, setSelectedStopId] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Cancel Dialog
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [activeAlloc, setActiveAlloc] = useState<TransportAllocation | null>(null);

  // Filtered allocations list
  const filteredAllocations = allocations.filter(alloc => {
    const student = students.find(s => s.id === alloc.studentId);
    const bus = buses.find(b => b.id === alloc.busId);
    const route = routes.find(r => r.id === alloc.routeId);

    const matchesSearch =
      student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.studentIdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus?.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alloc.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || alloc.status === statusFilter;
    const matchesRoute = routeFilter === 'all' || alloc.routeId === routeFilter;

    return matchesSearch && matchesStatus && matchesRoute;
  });

  const openAllocateModal = (student?: Student) => {
    const targetStudent = student || students.find(s => s.transportStatus !== 'Active') || students[0];
    setSelectedStudentId(targetStudent?.id || '');

    const initialRoute = routes[0];
    setSelectedRouteId(initialRoute?.id || '');
    setSelectedBusId(initialRoute?.assignedBusId || buses[0]?.id || '');
    setSelectedStopId(initialRoute?.pickupPoints[0]?.id || '');
    setAllocationNotes('Standard academic route seat reservation.');
    setFormError('');
    setIsAllocateModalOpen(true);
  };

  const handleRouteChange = (routeId: string) => {
    setSelectedRouteId(routeId);
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setSelectedBusId(route.assignedBusId || buses[0]?.id || '');
      setSelectedStopId(route.pickupPoints[0]?.id || '');
    }
  };

  const handleConfirmAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedStudentId || !selectedRouteId || !selectedBusId) {
      setFormError('Please select student, route, and target fleet bus.');
      return;
    }

    // Bus capacity check
    const occ = getBusOccupancy(selectedBusId);
    if (occ.available <= 0) {
      setFormError(`Target bus is at 100% capacity (${occ.occupied}/${occ.capacity} seats). Please select an alternate bus.`);
      return;
    }

    const res = createAllocation({
      studentId: selectedStudentId,
      routeId: selectedRouteId,
      busId: selectedBusId,
      pickupPointId: selectedStopId,
      allocatedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      notes: allocationNotes.trim() || undefined,
    });

    if (res.success) {
      setIsAllocateModalOpen(false);
    } else {
      setFormError(res.message || 'Failed to complete allocation.');
    }
  };

  const handleOpenCancel = (alloc: TransportAllocation) => {
    setActiveAlloc(alloc);
    setIsCancelConfirmOpen(true);
  };

  const handleConfirmCancel = () => {
    if (activeAlloc) {
      cancelAllocation(activeAlloc.id);
      setIsCancelConfirmOpen(false);
    }
  };

  // Selected bus preview in wizard
  const targetBusOccupancy = selectedBusId ? getBusOccupancy(selectedBusId) : null;
  const isBusAtLimit = targetBusOccupancy ? targetBusOccupancy.available <= 0 : false;
  const isBusNearLimit = targetBusOccupancy ? targetBusOccupancy.percentage >= 85 : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Transport Seat Allocation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign students to routes and buses with automatic capacity verification and conflict checks.
          </p>
        </div>

        <button
          onClick={() => openAllocateModal()}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Seat Allocation</span>
        </button>
      </div>

      {/* Bus Capacity Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {buses.map(bus => {
          const occ = getBusOccupancy(bus.id);
          return (
            <div
              key={bus.id}
              className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{bus.busNumber}</span>
                <span
                  className={`font-semibold ${
                    occ.available === 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {occ.available} left
                </span>
              </div>
              <ProgressBar
                value={occ.percentage}
                size="sm"
                sublabel={`${occ.occupied}/${occ.capacity}`}
              />
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, ID, allocation code, bus..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <select
            value={routeFilter}
            onChange={e => setRouteFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Routes</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>
                {r.routeCode} ({r.name})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Allocation Statuses</option>
            <option value="Active">Active Allocations</option>
            <option value="Changed">Changed / Reallocated</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Alloc ID</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Assigned Route</th>
                <th className="px-4 py-3">Assigned Bus</th>
                <th className="px-4 py-3">Pickup Stop</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No transport allocations found.
                  </td>
                </tr>
              ) : (
                filteredAllocations.map(alloc => {
                  const student = students.find(s => s.id === alloc.studentId);
                  const bus = buses.find(b => b.id === alloc.busId);
                  const route = routes.find(r => r.id === alloc.routeId);
                  const stop = route?.pickupPoints.find(p => p.id === alloc.pickupPointId);

                  return (
                    <tr key={alloc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {alloc.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">
                          {student?.name || 'Unknown Student'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {student?.studentIdNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        Grade {student?.classGrade}-{student?.section}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">
                          {route?.routeCode || 'Unassigned'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[130px]">
                          {route?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {bus?.busNumber || 'None'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {stop?.name || 'School Loop'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{alloc.allocatedDate}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={alloc.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {alloc.status === 'Active' ? (
                          <button
                            onClick={() => handleOpenCancel(alloc)}
                            className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Archived</span>
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

      {/* NEW ALLOCATION MODAL */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title="Assign Student Seat Allocation"
        subtitle="Automatic capacity validation and route alignment."
        maxWidth="xl"
      >
        <form onSubmit={handleConfirmAllocation} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Select Student *</label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              required
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentIdNumber}) • Grade {s.classGrade}{s.section} • Status: {s.transportStatus}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Route Corridor *</label>
              <select
                value={selectedRouteId}
                onChange={e => handleRouteChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                required
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.routeCode} - {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Pickup Point Stop *</label>
              <select
                value={selectedStopId}
                onChange={e => setSelectedStopId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                required
              >
                {(() => {
                  const route = routes.find(r => r.id === selectedRouteId);
                  if (!route) return <option value="">Select Route First</option>;
                  return route.pickupPoints.map(p => (
                    <option key={p.id} value={p.id}>
                      Stop {p.order}: {p.name} ({p.morningTime})
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Fleet Bus *</label>
            <select
              value={selectedBusId}
              onChange={e => setSelectedBusId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              required
            >
              {buses.map(b => {
                const occ = getBusOccupancy(b.id);
                return (
                  <option key={b.id} value={b.id} disabled={occ.available <= 0}>
                    {b.busNumber} ({b.registrationNumber}) • {occ.available} available / {b.seatingCapacity} seats
                    {occ.available <= 0 ? ' [FULL - SEAT EXCEEDED]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Bus Occupancy Preview Card in Modal */}
          {targetBusOccupancy && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isBusAtLimit
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : isBusNearLimit
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <BusIcon className="w-4 h-4" />
                  Target Bus Capacity Check
                </span>
                <span>
                  {targetBusOccupancy.occupied} / {targetBusOccupancy.capacity} Seats Occupied (
                  {targetBusOccupancy.percentage}%)
                </span>
              </div>
              <ProgressBar
                value={targetBusOccupancy.percentage}
                size="sm"
                sublabel={`Available: ${targetBusOccupancy.available} seats`}
              />
              {isBusAtLimit && (
                <p className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Business Rule: Bus capacity reached. You cannot allocate additional students to this vehicle.
                </p>
              )}
              {isBusNearLimit && !isBusAtLimit && (
                <p className="text-[11px] text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Warning: Bus is nearing capacity threshold ({targetBusOccupancy.percentage}%).
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Administrative Notes</label>
            <input
              type="text"
              value={allocationNotes}
              onChange={e => setAllocationNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g. Approved sibling reservation"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAllocateModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusAtLimit}
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              Confirm Seat Allocation
            </button>
          </div>
        </form>
      </Modal>

      {/* CANCEL ALLOCATION CONFIRM */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Revoke Transport Allocation"
        message={`Are you sure you want to cancel the transport allocation ${activeAlloc?.id}? The student will be transitioned to Pending status and the seat freed up for other students.`}
        confirmLabel="Cancel Allocation"
      />
    </div>
  );
};
