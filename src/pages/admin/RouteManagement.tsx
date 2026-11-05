import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { storageService } from '../../services/storageService';
import { Route, PickupPoint } from '../../types';
import {
  Map,
  Search,
  Plus,
  Edit2,
  Trash2,
  Navigation,
  Clock,
  Users,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Eye,
  Bus as BusIcon,
  MapPin,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { RouteVisualizer } from '../../components/map/RouteVisualizer';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const RouteManagement: React.FC = () => {
  const { routes, buses, drivers, students, addRoute, updateRoute, deleteRoute, showToast } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);

  // Optimization simulation data
  const [optimizationResult, setOptimizationResult] = useState<ReturnType<
    typeof storageService.analyzeRouteOptimization
  > | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    startLocation: '',
    destination: 'Kovai Valley Matriculation School, Coimbatore',
    estimatedDistanceKm: 15,
    estimatedDurationMin: 40,
    assignedBusId: '',
    assignedDriverId: '',
    status: 'Active' as Route['status'],
    description: '',
    pickupPoints: [] as PickupPoint[],
  });
  const [formError, setFormError] = useState('');

  // Active viewed route
  const currentRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  const filteredRoutes = routes.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.routeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.startLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      startLocation: 'North Transit Hub',
      destination: 'St. Jude International Academy',
      estimatedDistanceKm: 16.5,
      estimatedDurationMin: 42,
      assignedBusId: buses[0]?.id || '',
      assignedDriverId: drivers[0]?.id || '',
      status: 'Active',
      description: 'Daily municipal transit loop servicing northern school families.',
      pickupPoints: [
        {
          id: `PKP-NEW-1`,
          name: 'Transit Hub Terminal',
          address: '100 Gateway Blvd',
          morningTime: '07:05 AM',
          afternoonTime: '03:45 PM',
          order: 1,
          landmark: 'Terminal A Gate',
        },
        {
          id: `PKP-NEW-2`,
          name: 'Cedar Park Crossing',
          address: '50 Cedar Ave',
          morningTime: '07:20 AM',
          afternoonTime: '03:30 PM',
          order: 2,
          landmark: 'Opposite Library',
        },
        {
          id: `PKP-NEW-3`,
          name: 'St. Jude Academy Dropoff',
          address: '450 University Blvd',
          morningTime: '07:45 AM',
          afternoonTime: '03:00 PM',
          order: 3,
          landmark: 'School Bus Loop',
        },
      ],
    });
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (route: Route) => {
    setActiveRoute(route);
    setFormData({
      name: route.name,
      startLocation: route.startLocation,
      destination: route.destination,
      estimatedDistanceKm: route.estimatedDistanceKm,
      estimatedDurationMin: route.estimatedDurationMin,
      assignedBusId: route.assignedBusId,
      assignedDriverId: route.assignedDriverId,
      status: route.status,
      description: route.description || '',
      pickupPoints: [...route.pickupPoints],
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (route: Route) => {
    setActiveRoute(route);
    setIsDeleteConfirmOpen(true);
  };

  // Smart Optimization trigger
  const handleOpenOptimization = (route: Route) => {
    const analysis = storageService.analyzeRouteOptimization(route.id);
    setOptimizationResult(analysis);
    setActiveRoute(route);
    setIsOptimizationModalOpen(true);
  };

  const handleApplyOptimization = () => {
    if (activeRoute && optimizationResult) {
      const updated: Route = {
        ...activeRoute,
        pickupPoints: optimizationResult.suggestedStops,
        estimatedDistanceKm: optimizationResult.optimizedDistance,
        estimatedDurationMin: Math.max(20, activeRoute.estimatedDurationMin - optimizationResult.timeSavedMin),
      };
      updateRoute(updated);
      setIsOptimizationModalOpen(false);
      showToast(
        'success',
        `Route ${activeRoute.routeCode} optimized! Saved ${optimizationResult.distanceSavedKm} km and ${optimizationResult.timeSavedMin} mins per transit cycle.`,
        'Route Optimized'
      );
    }
  };

  // Pickup point helpers inside form
  const handleAddStop = () => {
    const newOrder = formData.pickupPoints.length + 1;
    const newStop: PickupPoint = {
      id: `PKP-${Date.now().toString().slice(-4)}`,
      name: `Pickup Stop ${newOrder}`,
      address: 'Main St & 2nd Ave',
      morningTime: '07:25 AM',
      afternoonTime: '03:25 PM',
      order: newOrder,
      landmark: 'Near Crosswalk',
    };
    setFormData(prev => ({
      ...prev,
      pickupPoints: [...prev.pickupPoints, newStop],
    }));
  };

  const handleRemoveStop = (index: number) => {
    if (formData.pickupPoints.length <= 2) {
      alert('A route must have at least an origin and a destination stop.');
      return;
    }
    const updated = formData.pickupPoints
      .filter((_, i) => i !== index)
      .map((stop, i) => ({ ...stop, order: i + 1 }));
    setFormData(prev => ({ ...prev, pickupPoints: updated }));
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.pickupPoints.length) return;

    const list = [...formData.pickupPoints];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    const reordered = list.map((stop, i) => ({ ...stop, order: i + 1 }));
    setFormData(prev => ({ ...prev, pickupPoints: reordered }));
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startLocation.trim()) {
      setFormError('Route name and start location are required.');
      return;
    }

    const newRoute = addRoute({
      name: formData.name.trim(),
      startLocation: formData.startLocation.trim(),
      destination: formData.destination.trim(),
      estimatedDistanceKm: Number(formData.estimatedDistanceKm),
      estimatedDurationMin: Number(formData.estimatedDurationMin),
      assignedBusId: formData.assignedBusId,
      assignedDriverId: formData.assignedDriverId,
      status: formData.status,
      description: formData.description.trim(),
      pickupPoints: formData.pickupPoints,
    });

    setSelectedRouteId(newRoute.id);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoute) return;

    updateRoute({
      ...activeRoute,
      name: formData.name.trim(),
      startLocation: formData.startLocation.trim(),
      destination: formData.destination.trim(),
      estimatedDistanceKm: Number(formData.estimatedDistanceKm),
      estimatedDurationMin: Number(formData.estimatedDurationMin),
      assignedBusId: formData.assignedBusId,
      assignedDriverId: formData.assignedDriverId,
      status: formData.status,
      description: formData.description.trim(),
      pickupPoints: formData.pickupPoints,
    });

    setIsEditModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (activeRoute) {
      const res = deleteRoute(activeRoute.id);
      if (res.success) {
        setIsDeleteConfirmOpen(false);
        const remaining = routes.filter(r => r.id !== activeRoute.id);
        if (remaining[0]) setSelectedRouteId(remaining[0].id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Route Corridors & Pickup Points
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual bus lines, pickup stop sequences, and algorithmic route optimization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRoute && (
            <button
              onClick={() => handleOpenOptimization(currentRoute)}
              className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Smart Route Suggestions</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Route</span>
          </button>
        </div>
      </div>

      {/* Route Corridor Search & Select Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search route name, code (e.g. RT-101), or starting origin..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white placeholder-slate-400 shadow-2xs"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong>{filteredRoutes.length}</strong> of <strong>{routes.length}</strong> active corridors
          </div>
        </div>

        {/* Route Select Cards / Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {filteredRoutes.map(route => {
            const isSelected = route.id === selectedRouteId;
            const assignedCount = students.filter(
              s => s.assignedRouteId === route.id && s.transportStatus === 'Active'
            ).length;
            const bus = buses.find(b => b.id === route.assignedBusId);

            return (
              <button
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`} />
                <span className="font-bold">{route.routeCode}</span>
                <span className={isSelected ? 'text-blue-100' : 'text-slate-600'}>
                  {route.name}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {route.pickupPoints.length} stops • {assignedCount} students
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Route View */}
      {currentRoute ? (
        <div className="space-y-6">
          {/* Action Row for Currently Selected Route */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="font-semibold text-slate-900 text-sm">
                Managing: {currentRoute.routeCode} – {currentRoute.name}
              </span>
              <span className="hidden md:inline text-slate-400">|</span>
              <span className="hidden md:inline">
                Start: <strong>{currentRoute.startLocation}</strong>
              </span>
              <span className="hidden md:inline">
                Destination: <strong>{currentRoute.destination}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openEditModal(currentRoute)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Route</span>
              </button>
              <button
                onClick={() => openDeleteDialog(currentRoute)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                title="Delete route"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Map & Stop Visualizer Component */}
          <RouteVisualizer route={currentRoute} activeStopIndex={1} />
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          No routes available.
        </div>
      )}

      {/* SMART ROUTE OPTIMIZATION MODAL (FEATURE A) */}
      {optimizationResult && (
        <Modal
          isOpen={isOptimizationModalOpen}
          onClose={() => setIsOptimizationModalOpen(false)}
          title={`Smart Route Suggestion: ${optimizationResult.routeName}`}
          subtitle="Algorithmic resequencing analysis based on pickup point geographic clusters."
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Comparison Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Original Distance</span>
                <span className="font-bold text-base text-slate-900">
                  {optimizationResult.originalDistance} km
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-emerald-700 block font-medium">Optimized Distance</span>
                <span className="font-bold text-base text-emerald-800">
                  {optimizationResult.optimizedDistance} km
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-700 block font-medium">Distance Saved</span>
                <span className="font-bold text-base text-blue-800">
                  -{optimizationResult.distanceSavedKm} km
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-700 block font-medium">Time Saved</span>
                <span className="font-bold text-base text-blue-800">
                  ~{optimizationResult.timeSavedMin} mins
                </span>
              </div>
            </div>

            {/* Smart Insights list */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
              <h4 className="font-semibold text-blue-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Algorithm Inefficiency Diagnostics
              </h4>
              <ul className="space-y-1.5 text-slate-700">
                {optimizationResult.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Stop Sequence */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">
                Proposed Optimized Pickup Order:
              </h4>
              <div className="space-y-1.5 border border-slate-200 rounded-lg p-2 max-h-48 overflow-y-auto">
                {optimizationResult.suggestedStops.map((stop, i) => (
                  <div
                    key={stop.id}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-800">{stop.name}</span>
                      <span className="text-slate-400">({stop.address})</span>
                    </div>
                    <span className="text-slate-600 font-medium">AM: {stop.morningTime}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOptimizationModalOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Dismiss Suggestion
              </button>
              <button
                type="button"
                onClick={handleApplyOptimization}
                className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Optimized Sequence</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE / EDIT ROUTE MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Create Route Corridor' : `Edit Route: ${activeRoute?.routeCode}`}
        subtitle="Configure route terminals, assigned resources, and intermediate pickup stops."
        maxWidth="3xl"
      >
        <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Route Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. North Hills Express"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Starting Origin *</label>
              <input
                type="text"
                value={formData.startLocation}
                onChange={e => setFormData({ ...formData, startLocation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. North Hills Gate (Terminal A)"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Destination</label>
              <input
                type="text"
                value={formData.destination}
                onChange={e => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                value={formData.estimatedDistanceKm}
                onChange={e => setFormData({ ...formData, estimatedDistanceKm: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Duration (min)</label>
              <input
                type="number"
                value={formData.estimatedDurationMin}
                onChange={e => setFormData({ ...formData, estimatedDurationMin: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    {b.busNumber} (Cap: {b.seatingCapacity})
                  </option>
                ))}
              </select>
            </div>

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
              <label className="block font-medium text-slate-700 mb-1">Route Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Active">Active</option>
                <option value="Under Review">Under Review</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Pickup Points Management */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block">
                  Pickup Points Sequence ({formData.pickupPoints.length} stops)
                </span>
                <p className="text-[11px] text-slate-500">
                  Reorder or configure arrival timing and addresses.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStop}
                className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stop</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {formData.pickupPoints.map((stop, idx) => (
                <div
                  key={stop.id}
                  className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={stop.name}
                      onChange={e => {
                        const updated = [...formData.pickupPoints];
                        updated[idx].name = e.target.value;
                        setFormData({ ...formData, pickupPoints: updated });
                      }}
                      className="px-2 py-1 text-xs border border-slate-200 rounded font-semibold w-40"
                      placeholder="Stop Name"
                    />
                    <input
                      type="text"
                      value={stop.address}
                      onChange={e => {
                        const updated = [...formData.pickupPoints];
                        updated[idx].address = e.target.value;
                        setFormData({ ...formData, pickupPoints: updated });
                      }}
                      className="px-2 py-1 text-xs border border-slate-200 rounded text-slate-600 flex-1 hidden md:block"
                      placeholder="Address"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <input
                      type="text"
                      value={stop.morningTime}
                      onChange={e => {
                        const updated = [...formData.pickupPoints];
                        updated[idx].morningTime = e.target.value;
                        setFormData({ ...formData, pickupPoints: updated });
                      }}
                      className="w-20 px-2 py-1 text-xs border border-slate-200 rounded text-center"
                      placeholder="AM Time"
                    />

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveStop(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStop(idx, 'down')}
                        disabled={idx === formData.pickupPoints.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Remove Stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
              {isAddModalOpen ? 'Create Route' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Route Corridor"
        message={`Are you sure you want to delete route ${activeRoute?.routeCode} (${activeRoute?.name})? All assigned students must be reallocated first.`}
        confirmLabel="Delete Route"
      />
    </div>
  );
};
