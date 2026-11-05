import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { storageService } from '../../services/storageService';
import { Bus } from '../../types';
import {
  Bus as BusIcon,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Shield,
  FileCheck,
  AlertTriangle,
  Users,
  Sparkles,
  CheckCircle2,
  Wrench,
  Fuel,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/Charts';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const BusManagement: React.FC = () => {
  const { buses, drivers, routes, students, addBus, updateBus, deleteBus, getBusOccupancy } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  // Form
  const [formData, setFormData] = useState({
    busNumber: '',
    registrationNumber: '',
    model: '',
    seatingCapacity: 40,
    assignedDriverId: '',
    assignedRouteId: '',
    status: 'Active' as Bus['status'],
    insuranceExpiryDate: '2027-06-30',
    permitExpiryDate: '2027-09-30',
    maintenanceStatus: 'Good' as Bus['maintenanceStatus'],
    fuelType: 'Diesel' as Bus['fuelType'],
    lastServiceDate: '2026-09-01',
  });
  const [formError, setFormError] = useState('');

  // Filtered
  const filteredBuses = buses.filter(bus => {
    const matchesSearch =
      bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Intelligent Bus Utilization Insights
  const utilizationData = storageService.getBusUtilizationInsights();

  const resetForm = () => {
    setFormData({
      busNumber: `BUS-${String(buses.length + 1).padStart(2, '0')}`,
      registrationNumber: `MA-01-SJ-10${String(buses.length + 1).padStart(2, '0')}`,
      model: 'Tata Starbus Ultra 40-Seater',
      seatingCapacity: 40,
      assignedDriverId: drivers[0]?.id || '',
      assignedRouteId: routes[0]?.id || '',
      status: 'Active',
      insuranceExpiryDate: '2027-06-30',
      permitExpiryDate: '2027-09-30',
      maintenanceStatus: 'Good',
      fuelType: 'Diesel',
      lastServiceDate: '2026-09-01',
    });
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (bus: Bus) => {
    setSelectedBus(bus);
    setFormData({
      busNumber: bus.busNumber,
      registrationNumber: bus.registrationNumber,
      model: bus.model,
      seatingCapacity: bus.seatingCapacity,
      assignedDriverId: bus.assignedDriverId,
      assignedRouteId: bus.assignedRouteId,
      status: bus.status,
      insuranceExpiryDate: bus.insuranceExpiryDate,
      permitExpiryDate: bus.permitExpiryDate,
      maintenanceStatus: bus.maintenanceStatus,
      fuelType: bus.fuelType,
      lastServiceDate: bus.lastServiceDate,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openViewModal = (bus: Bus) => {
    setSelectedBus(bus);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (bus: Bus) => {
    setSelectedBus(bus);
    setIsDeleteConfirmOpen(false);
    // Check if active students are assigned
    const occ = getBusOccupancy(bus.id);
    if (occ.occupied > 0) {
      alert(`Cannot delete bus ${bus.busNumber}. There are ${occ.occupied} active students currently allocated to this bus. Please reallocate them first in Transport Allocation.`);
      return;
    }
    setIsDeleteConfirmOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registrationNumber.trim()) {
      setFormError('Vehicle registration number is required.');
      return;
    }
    if (formData.seatingCapacity <= 0) {
      setFormError('Seating capacity must be greater than 0.');
      return;
    }

    const res = addBus({
      busNumber: formData.busNumber.trim(),
      registrationNumber: formData.registrationNumber.trim().toUpperCase(),
      model: formData.model.trim(),
      seatingCapacity: Number(formData.seatingCapacity),
      assignedDriverId: formData.assignedDriverId,
      assignedRouteId: formData.assignedRouteId,
      status: formData.status,
      insuranceExpiryDate: formData.insuranceExpiryDate,
      permitExpiryDate: formData.permitExpiryDate,
      maintenanceStatus: formData.maintenanceStatus,
      fuelType: formData.fuelType,
      lastServiceDate: formData.lastServiceDate,
    });

    if (res.success) {
      setIsAddModalOpen(false);
    } else {
      setFormError(res.message || 'Error creating bus.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;

    const res = updateBus({
      ...selectedBus,
      busNumber: formData.busNumber.trim(),
      registrationNumber: formData.registrationNumber.trim().toUpperCase(),
      model: formData.model.trim(),
      seatingCapacity: Number(formData.seatingCapacity),
      assignedDriverId: formData.assignedDriverId,
      assignedRouteId: formData.assignedRouteId,
      status: formData.status,
      insuranceExpiryDate: formData.insuranceExpiryDate,
      permitExpiryDate: formData.permitExpiryDate,
      maintenanceStatus: formData.maintenanceStatus,
      fuelType: formData.fuelType,
      lastServiceDate: formData.lastServiceDate,
    });

    if (res.success) {
      setIsEditModalOpen(false);
    } else {
      setFormError(res.message || 'Error updating bus.');
    }
  };

  const handleConfirmDelete = () => {
    if (selectedBus) {
      deleteBus(selectedBus.id);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bus Fleet Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            School vehicle registrations, live capacity tracking, and compliance certifications.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add School Bus</span>
        </button>
      </div>

      {/* Intelligent Bus Utilization Insights Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-sm text-white">
              Intelligent Fleet Utilization Insights
            </h3>
          </div>
          <span className="text-xs text-sky-300 font-medium">
            Fleet Avg Occupancy: {utilizationData.fleetAverageUtilization}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {utilizationData.busInsights.slice(0, 3).map((insight, idx) => (
            <div
              key={idx}
              className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10"
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>{insight.bus.busNumber} ({insight.bus.registrationNumber})</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    insight.statusCategory === 'Near Capacity'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : insight.statusCategory === 'Underutilized'
                      ? 'bg-sky-400/20 text-sky-300 border border-sky-400/30'
                      : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {insight.statusCategory}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {insight.recommendation}
              </p>
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
            placeholder="Search bus number, registration, model..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Out of Service">Out of Service</option>
          </select>
        </div>
      </div>

      {/* Buses Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBuses.map(bus => {
          const occ = getBusOccupancy(bus.id);
          const driver = drivers.find(d => d.id === bus.assignedDriverId);
          const route = routes.find(r => r.id === bus.assignedRouteId);
          const isNearCapacity = occ.percentage >= 85;

          return (
            <div
              key={bus.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100">
                      <BusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{bus.busNumber}</h3>
                        <StatusBadge status={bus.status} />
                      </div>
                      <span className="text-xs font-mono font-medium text-slate-500">
                        {bus.registrationNumber}
                      </span>
                    </div>
                  </div>

                  <Badge variant={bus.maintenanceStatus === 'Good' ? 'success' : 'warning'}>
                    {bus.maintenanceStatus}
                  </Badge>
                </div>

                <div className="mt-3 text-xs text-slate-600 line-clamp-1">{bus.model}</div>

                {/* Occupancy Progress */}
                <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <ProgressBar
                    value={occ.percentage}
                    label="Seat Occupancy"
                    sublabel={`${occ.occupied} / ${occ.capacity} seats`}
                    size="md"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Available Seats: <strong>{occ.available}</strong>
                    </span>
                    {isNearCapacity && (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        Near Capacity
                      </span>
                    )}
                  </div>
                </div>

                {/* Assignments */}
                <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assigned Driver:</span>
                    <span className="font-semibold text-slate-800">
                      {driver ? driver.name : 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Route Corridor:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                      {route ? `${route.routeCode} (${route.name})` : 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Fuel & Type:</span>
                    <span className="font-medium text-slate-700">{bus.fuelType}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => openViewModal(bus)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(bus)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Edit bus"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(bus)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Delete bus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIEW BUS DETAILS & STUDENT MANIFEST MODAL */}
      {selectedBus && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Bus Specifications: ${selectedBus.busNumber}`}
          subtitle={`Registration: ${selectedBus.registrationNumber} • ${selectedBus.model}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(() => {
                const occ = getBusOccupancy(selectedBus.id);
                return (
                  <>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Total Capacity</span>
                      <span className="font-bold text-base text-slate-900">{occ.capacity} Seats</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Current Occupancy</span>
                      <span className="font-bold text-base text-blue-600">{occ.occupied} Students</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Available Seats</span>
                      <span className="font-bold text-base text-emerald-600">{occ.available} Seats</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Utilization</span>
                      <span className="font-bold text-base text-slate-900">{occ.percentage}%</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Compliance certifications */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                Fleet Compliance & Inspection Records
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                <div>
                  <strong>Insurance Expiry:</strong> {selectedBus.insuranceExpiryDate}
                </div>
                <div>
                  <strong>Transport Permit:</strong> {selectedBus.permitExpiryDate}
                </div>
                <div>
                  <strong>Last Workshop Service:</strong> {selectedBus.lastServiceDate}
                </div>
              </div>
            </div>

            {/* Passenger Manifest */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  Assigned Student Manifest (
                  {students.filter(s => s.assignedBusId === selectedBus.id && s.transportStatus === 'Active').length}
                  )
                </h4>
              </div>

              <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Grade</th>
                      <th className="px-3 py-2">Stop</th>
                      <th className="px-3 py-2">Parent Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students
                      .filter(s => s.assignedBusId === selectedBus.id && s.transportStatus === 'Active')
                      .map(student => {
                        const route = routes.find(r => r.id === student.assignedRouteId);
                        const stop = route?.pickupPoints.find(p => p.id === student.pickupPointId);
                        return (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono">{student.studentIdNumber}</td>
                            <td className="px-3 py-2 font-semibold text-slate-900">{student.name}</td>
                            <td className="px-3 py-2">Grade {student.classGrade}-{student.section}</td>
                            <td className="px-3 py-2 text-slate-600">{stop?.name || '-'}</td>
                            <td className="px-3 py-2 text-slate-600">{student.parentPhone}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Close Details
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD / EDIT BUS MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Register Fleet Bus' : `Edit Bus: ${selectedBus?.busNumber}`}
        subtitle="Manage seating capacities, drivers, and route assignment."
        maxWidth="lg"
      >
        <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Bus Code *</label>
              <input
                type="text"
                value={formData.busNumber}
                onChange={e => setFormData({ ...formData, busNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. BUS-06"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Registration Plate *</label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase"
                placeholder="e.g. MA-01-SJ-1006"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Bus Model & Make</label>
              <input
                type="text"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. Tata Starbus Ultra"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Seating Capacity *</label>
              <input
                type="number"
                min="10"
                max="80"
                value={formData.seatingCapacity}
                onChange={e => setFormData({ ...formData, seatingCapacity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned Driver</label>
              <select
                value={formData.assignedDriverId}
                onChange={e => setFormData({ ...formData, assignedDriverId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Unassigned</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.driverCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned Route</label>
              <select
                value={formData.assignedRouteId}
                onChange={e => setFormData({ ...formData, assignedRouteId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Unassigned</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.routeCode} - {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Bus Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Maintenance Status</label>
              <select
                value={formData.maintenanceStatus}
                onChange={e => setFormData({ ...formData, maintenanceStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Good">Good</option>
                <option value="Service Due">Service Due</option>
                <option value="In Workshop">In Workshop</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={e => setFormData({ ...formData, fuelType: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Insurance Expiry Date</label>
              <input
                type="date"
                value={formData.insuranceExpiryDate}
                onChange={e => setFormData({ ...formData, insuranceExpiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Permit Expiry Date</label>
              <input
                type="date"
                value={formData.permitExpiryDate}
                onChange={e => setFormData({ ...formData, permitExpiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              {isAddModalOpen ? 'Add Bus' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Fleet Bus"
        message={`Are you sure you want to retire Bus ${selectedBus?.busNumber} (${selectedBus?.registrationNumber})?`}
        confirmLabel="Retire Bus"
      />
    </div>
  );
};
