import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Driver } from '../../types';
import {
  UserCheck,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  AlertTriangle,
  Award,
  Bus as BusIcon,
  Calendar,
  Shield,
  Star,
  MapPin,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const DriverManagement: React.FC = () => {
  const { drivers, buses, trips, addDriver, updateDriver, deleteDriver } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeDriver, setActiveDriver] = useState<Driver | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    licenseNumber: '',
    licenseExpiryDate: '2027-10-30',
    experienceYears: 8,
    assignedBusId: '',
    status: 'Active' as Driver['status'],
    joiningDate: '2022-01-15',
    emergencyContact: '',
    rating: 4.8,
  });
  const [formError, setFormError] = useState('');

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.driverCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '+1 (555) 000-0000',
      email: '',
      address: '',
      licenseNumber: `DL-MA-2026-${String(drivers.length + 1).padStart(3, '0')}`,
      licenseExpiryDate: '2028-05-30',
      experienceYears: 7,
      assignedBusId: buses[0]?.id || '',
      status: 'Active',
      joiningDate: '2023-08-01',
      emergencyContact: '+1 (555) 999-0000 (Spouse)',
      rating: 4.9,
    });
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setActiveDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      address: driver.address,
      licenseNumber: driver.licenseNumber,
      licenseExpiryDate: driver.licenseExpiryDate,
      experienceYears: driver.experienceYears,
      assignedBusId: driver.assignedBusId,
      status: driver.status,
      joiningDate: driver.joiningDate,
      emergencyContact: driver.emergencyContact,
      rating: driver.rating,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openViewModal = (driver: Driver) => {
    setActiveDriver(driver);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (driver: Driver) => {
    setActiveDriver(driver);
    // Check if driver assigned to a bus
    const assignedBuses = buses.filter(b => b.assignedDriverId === driver.id);
    if (assignedBuses.length > 0) {
      alert(`Cannot delete driver ${driver.name}. Currently assigned to ${assignedBuses.map(b => b.busNumber).join(', ')}. Please unassign from bus first.`);
      return;
    }
    setIsDeleteConfirmOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.licenseNumber.trim()) {
      setFormError('Driver name, phone, and commercial license number are required.');
      return;
    }

    const res = addDriver({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@stjude.edu`,
      address: formData.address.trim() || 'Central District',
      licenseNumber: formData.licenseNumber.trim().toUpperCase(),
      licenseExpiryDate: formData.licenseExpiryDate,
      experienceYears: Number(formData.experienceYears),
      assignedBusId: formData.assignedBusId,
      status: formData.status,
      joiningDate: formData.joiningDate,
      emergencyContact: formData.emergencyContact.trim(),
      rating: Number(formData.rating),
    });

    if (res.success) {
      setIsAddModalOpen(false);
    } else {
      setFormError(res.message || 'Error creating driver.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDriver) return;

    const res = updateDriver({
      ...activeDriver,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      licenseNumber: formData.licenseNumber.trim().toUpperCase(),
      licenseExpiryDate: formData.licenseExpiryDate,
      experienceYears: Number(formData.experienceYears),
      assignedBusId: formData.assignedBusId,
      status: formData.status,
      joiningDate: formData.joiningDate,
      emergencyContact: formData.emergencyContact.trim(),
      rating: Number(formData.rating),
    });

    if (res.success) {
      setIsEditModalOpen(false);
    } else {
      setFormError(res.message || 'Error updating driver.');
    }
  };

  const handleConfirmDelete = () => {
    if (activeDriver) {
      deleteDriver(activeDriver.id);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Driver & Operator Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified transport operators, driving credentials, and assigned fleet vehicles.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Enlist Driver</span>
        </button>
      </div>

      {/* License Expiry Warnings Banner */}
      {(() => {
        const expiringDrivers = drivers.filter(d => d.licenseExpiryDate.startsWith('2026-11'));
        if (expiringDrivers.length === 0) return null;
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-900 block mb-0.5">
                Commercial Driving License Expiry Alert
              </span>
              <p className="text-amber-800">
                {expiringDrivers.map(d => `${d.name} (${d.licenseNumber})`).join(', ')} has a commercial
                driver's permit expiring within 30 days. Renewal submission required before next dispatch cycle.
              </p>
            </div>
          </div>
        );
      })()}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search driver name, ID, license number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 self-end sm:self-auto"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="On Leave">On Leave</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDrivers.map(driver => {
          const bus = buses.find(b => b.assignedDriverId === driver.id || b.id === driver.assignedBusId);
          const isExpiringSoon = driver.licenseExpiryDate.startsWith('2026-11');

          return (
            <div
              key={driver.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-slate-200">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{driver.name}</h3>
                        <StatusBadge status={driver.status} />
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{driver.driverCode}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{driver.rating}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{driver.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{driver.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">License: {driver.licenseNumber}</span>
                  </div>
                </div>

                {/* License Expiry Badge */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Permit Expiry:</span>
                  <span
                    className={`font-semibold ${
                      isExpiringSoon ? 'text-amber-700 flex items-center gap-1' : 'text-slate-800'
                    }`}
                  >
                    {isExpiringSoon && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    {driver.licenseExpiryDate}
                  </span>
                </div>

                {/* Assigned Vehicle */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Assigned Bus:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <BusIcon className="w-3.5 h-3.5 text-blue-600" />
                    {bus ? `${bus.busNumber} (${bus.registrationNumber})` : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => openViewModal(driver)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Profile & Trips</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(driver)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Edit driver"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(driver)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Delete driver"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIEW DRIVER PROFILE & TRIP HISTORY MODAL */}
      {activeDriver && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Driver Dossier: ${activeDriver.name}`}
          subtitle={`Employee Code: ${activeDriver.driverCode} • Joined: ${activeDriver.joiningDate}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Experience</span>
                <span className="font-bold text-sm text-slate-900">{activeDriver.experienceYears} Years</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Safety Rating</span>
                <span className="font-bold text-sm text-amber-600">{activeDriver.rating} / 5.0</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={activeDriver.status} />
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">License Validity</span>
                <span className="font-bold text-xs text-slate-900">{activeDriver.licenseExpiryDate}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-700">
              <h4 className="font-semibold text-slate-900">Personal & Emergency Contact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><strong>Phone:</strong> {activeDriver.phone}</div>
                <div><strong>Email:</strong> {activeDriver.email}</div>
                <div><strong>Home Address:</strong> {activeDriver.address}</div>
                <div><strong>Emergency Contact:</strong> {activeDriver.emergencyContact}</div>
              </div>
            </div>

            {/* Recent Trips Log */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Recent Dispatched Trips</h4>
              <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Trip Code</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Session</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trips
                      .filter(t => t.driverId === activeDriver.id)
                      .map(trip => (
                        <tr key={trip.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-medium">{trip.tripCode}</td>
                          <td className="px-3 py-2">{trip.date}</td>
                          <td className="px-3 py-2">{trip.session}</td>
                          <td className="px-3 py-2"><StatusBadge status={trip.status} /></td>
                        </tr>
                      ))}
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
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD / EDIT DRIVER MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Enlist New Driver' : `Edit Driver: ${activeDriver?.name}`}
        subtitle="Manage commercial driving license credentials and vehicle assignment."
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
              <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. Robert Vance"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="driver@stjude.edu"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Driving License Number *</label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono"
                placeholder="DL-MA-0000-00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">License Expiry Date</label>
              <input
                type="date"
                value={formData.licenseExpiryDate}
                onChange={e => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                min="1"
                max="40"
                value={formData.experienceYears}
                onChange={e => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Employment Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned Fleet Bus</label>
              <select
                value={formData.assignedBusId}
                onChange={e => setFormData({ ...formData, assignedBusId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Unassigned</option>
                {buses.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.busNumber} ({b.registrationNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Name & relation: +1 (555) 000-0000"
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
              {isAddModalOpen ? 'Enlist Driver' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remove Driver"
        message={`Are you sure you want to remove driver ${activeDriver?.name} (${activeDriver?.driverCode}) from the transport roster?`}
        confirmLabel="Remove Driver"
      />
    </div>
  );
};
