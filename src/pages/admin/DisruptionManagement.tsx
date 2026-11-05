import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { RouteDisruption, DisruptionType } from '../../types';
import {
  AlertTriangle,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  FileCheck,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const DisruptionManagement: React.FC = () => {
  const { disruptions, routes, reportDisruption, updateDisruptionStatus, showToast } = useData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form
  const [routeId, setRouteId] = useState(routes[0]?.id || 'RT-101');
  const [disruptionType, setDisruptionType] = useState<DisruptionType>('Road Maintenance');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedAlternativeStopName, setSuggestedAlternativeStopName] = useState('');
  const [suggestedRerouteDescription, setSuggestedRerouteDescription] = useState('');
  const [estimatedDelayMin, setEstimatedDelayMin] = useState(10);

  const filteredDisruptions = disruptions.filter(d => {
    const route = routes.find(r => r.id === d.routeId);
    const matchesSearch =
      d.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateDisruption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim() || !description.trim()) return;

    const targetRoute = routes.find(r => r.id === routeId);

    reportDisruption({
      routeId,
      disruptionType,
      locationName: locationName.trim(),
      description: description.trim(),
      affectedPickupPointIds: targetRoute ? [targetRoute.pickupPoints[2]?.id || targetRoute.pickupPoints[0]?.id] : [],
      suggestedAlternativeStopName: suggestedAlternativeStopName.trim() || 'Adjacent Service Road Bay',
      suggestedRerouteDescription: suggestedRerouteDescription.trim() || 'Divert via arterial link road to bypass construction block.',
      estimatedDelayMin: Number(estimatedDelayMin),
      status: 'Active',
      reportedBy: 'K. Natarajan (Transport Liaison)',
    });

    setLocationName('');
    setDescription('');
    setSuggestedAlternativeStopName('');
    setSuggestedRerouteDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              FEATURE D • CONTINGENCY DISPATCH
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Route Disruption Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Record road closures, construction work, and traffic bottlenecks across Coimbatore corridors with reroute recommendations.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Report Road Disruption</span>
        </button>
      </div>

      {/* Disruption Cards */}
      <div className="space-y-4">
        {filteredDisruptions.map(d => {
          const route = routes.find(r => r.id === d.routeId);

          return (
            <div
              key={d.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition-shadow hover:shadow-md ${
                d.status === 'Active'
                  ? 'border-amber-300 ring-1 ring-amber-100'
                  : d.status === 'Approved'
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{d.id}</span>
                    <Badge variant="warning">{d.disruptionType}</Badge>
                    <Badge variant="outline">Corridor: {route?.routeCode} ({route?.name})</Badge>
                    <StatusBadge status={d.status} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 pt-1">{d.locationName}</h3>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block">{d.reportedAt}</span>
                  <span className="text-xs font-semibold text-slate-700">By: {d.reportedBy}</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {d.description}
              </p>

              {/* Reroute Recommendation Box */}
              {(d.suggestedAlternativeStopName || d.suggestedRerouteDescription) && (
                <div className="mt-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-blue-950">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Smart Alternative Route & Stop Recommendation
                    </span>
                    <span className="text-amber-700 font-mono text-[11px]">
                      Est. Delay Buffer: +{d.estimatedDelayMin} mins
                    </span>
                  </div>
                  {d.suggestedAlternativeStopName && (
                    <div className="text-slate-800">
                      <strong>Suggested Alternative Pickup:</strong> {d.suggestedAlternativeStopName}
                    </div>
                  )}
                  {d.suggestedRerouteDescription && (
                    <div className="text-slate-700">
                      <strong>Detour Plan:</strong> {d.suggestedRerouteDescription}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                {d.status === 'Active' && (
                  <>
                    <button
                      onClick={() => updateDisruptionStatus(d.id, 'Approved')}
                      className="px-3 py-1.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Reroute Plan</span>
                    </button>
                    <button
                      onClick={() => updateDisruptionStatus(d.id, 'Rejected')}
                      className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 border border-slate-300"
                    >
                      Reject
                    </button>
                  </>
                )}
                {d.status === 'Approved' && (
                  <button
                    onClick={() => updateDisruptionStatus(d.id, 'Resolved')}
                    className="px-3 py-1.5 rounded-lg font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                  >
                    Mark Road Cleared & Resolved
                  </button>
                )}
                {d.status === 'Resolved' && (
                  <span className="text-xs font-semibold text-slate-400 italic">Disruption Resolved</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* REPORT DISRUPTION MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Report Route Road Disruption"
        subtitle="Log construction, water logging, or road blockages on Coimbatore routes."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDisruption} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Affected Route Corridor *</label>
              <select
                value={routeId}
                onChange={e => setRouteId(e.target.value)}
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
              <label className="block font-medium text-slate-700 mb-1">Disruption Type *</label>
              <select
                value={disruptionType}
                onChange={e => setDisruptionType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Road Maintenance">Road Maintenance / Resurfacing</option>
                <option value="Road Closure">Road Closure / Blockade</option>
                <option value="Traffic Congestion">Traffic Congestion / Peak Jam</option>
                <option value="Weather-related Disruption">Weather / Monsoon Waterlogging</option>
                <option value="Other">Other Operational Issue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Exact Location / Junction *</label>
            <input
              type="text"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g. Lakshmi Mills flyover service road or Gandhipuram Cross Cut junction"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description of Issue *</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Detail reasons, lanes blocked, and approximate duration..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Suggested Alternative Stop</label>
              <input
                type="text"
                value={suggestedAlternativeStopName}
                onChange={e => setSuggestedAlternativeStopName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. Mani School Gate (150m south)"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Estimated Delay (Minutes)</label>
              <input
                type="number"
                min="5"
                max="60"
                value={estimatedDelayMin}
                onChange={e => setEstimatedDelayMin(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Suggested Reroute Strategy</label>
            <input
              type="text"
              value={suggestedRerouteDescription}
              onChange={e => setSuggestedRerouteDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g. Divert through G.K.D. Nagar 80ft road to bypass bridge construction."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Broadcast Disruption
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
