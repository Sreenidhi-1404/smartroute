import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { storageService } from '../../services/storageService';
import { Complaint, ComplaintCategory, ComplaintStatus, ComplaintPriority } from '../../types';
import {
  MessageSquareWarning,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Filter,
  Send,
  User,
  MessageSquare,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { DonutChart } from '../../components/common/Charts';
import { Modal } from '../../components/common/Modal';

export const ComplaintManagement: React.FC = () => {
  const { complaints, updateComplaint, addComplaint } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Response Form
  const [adminResponseText, setAdminResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('Resolved');

  // New Complaint Form with Intelligent Categorization (Feature E)
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<ComplaintPriority>('Medium');
  const [newCategory, setNewCategory] = useState<ComplaintCategory>('Bus Delay');
  const [suggestedCategoryInfo, setSuggestedCategoryInfo] = useState<{
    category: ComplaintCategory;
    confidence: number;
    rationale: string;
  } | null>(null);

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch =
      c.complaintCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.submittedByName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Category breakdown for Donut Chart
  const categoriesList: ComplaintCategory[] = [
    'Bus Delay',
    'Driver Behaviour',
    'Bus Condition',
    'Pickup Point Issue',
    'Attendance Issue',
    'Other',
  ];

  const categoryChartColors = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#64748b'];

  const categoryChartData = categoriesList.map((cat, i) => ({
    label: cat,
    value: complaints.filter(c => c.category === cat).length,
    color: categoryChartColors[i % categoryChartColors.length],
  }));

  const openResolveModal = (c: Complaint) => {
    setSelectedComplaint(c);
    setAdminResponseText(c.adminResponse || '');
    setNewStatus(c.status);
    setIsResolveModalOpen(true);
  };

  const handleSaveResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    updateComplaint({
      ...selectedComplaint,
      status: newStatus,
      adminResponse: adminResponseText.trim(),
      resolvedAt: newStatus === 'Resolved' ? new Date().toISOString() : selectedComplaint.resolvedAt,
      resolvedBy: newStatus === 'Resolved' ? 'Eleanor Hayes (Transport Director)' : selectedComplaint.resolvedBy,
    });

    setIsResolveModalOpen(false);
  };

  // Trigger rule-based NLP suggestion when user types description
  const handleDescriptionChange = (text: string) => {
    setNewDescription(text);
    if (text.length > 5) {
      const suggestion = storageService.suggestComplaintCategory(text);
      setSuggestedCategoryInfo(suggestion);
      setNewCategory(suggestion.category);
    } else {
      setSuggestedCategoryInfo(null);
    }
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    addComplaint({
      submittedByUserId: 'USR-ADMIN-01',
      submittedByName: 'Transport Support Desk',
      category: newCategory,
      subject: newSubject.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      status: 'Submitted',
    });

    setNewSubject('');
    setNewDescription('');
    setSuggestedCategoryInfo(null);
    setIsSubmitModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Complaints & Passenger Feedback
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Guardian inquiries, driver performance feedback, and automated issue classification.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log New Complaint</span>
        </button>
      </div>

      {/* Intelligence & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Issue Category Breakdown</h3>
            <p className="text-xs text-slate-500 mb-3">
              Distribution of incoming parent & driver reports
            </p>
          </div>
          <DonutChart
            data={categoryChartData}
            totalLabel="Complaints"
            totalValue={complaints.length}
            size={160}
          />
        </div>

        {/* NLP Categorization Explainer */}
        <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-sm text-white">
                Intelligent Text Categorization Engine
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              SmartRoute parses natural language keywords in complaint descriptions (such as lateness,
              air conditioning, curb safety, or driver speed) to auto-tag categories with ~90% accuracy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-white/10 rounded-lg p-3 border border-white/10">
              <span className="font-bold text-amber-300 block mb-0.5">Delay Detection</span>
              <span className="text-[11px] text-slate-300">
                Matches schedule deviations and traffic congestion keywords.
              </span>
            </div>
            <div className="bg-white/10 rounded-lg p-3 border border-white/10">
              <span className="font-bold text-sky-300 block mb-0.5">Fleet Maintenance</span>
              <span className="text-[11px] text-slate-300">
                Flags HVAC, seatbelts, tires, and mechanical issues to maintenance bay.
              </span>
            </div>
            <div className="bg-white/10 rounded-lg p-3 border border-white/10">
              <span className="font-bold text-emerald-300 block mb-0.5">Pickup Point Safety</span>
              <span className="text-[11px] text-slate-300">
                Isolates curb obstructions and neighborhood crossing concerns.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code, parent name, keywords..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Categories</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map(complaint => (
          <div
            key={complaint.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-blue-300 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {complaint.complaintCode}
                  </span>
                  <Badge variant="outline">{complaint.category}</Badge>
                  <Badge
                    variant={
                      complaint.priority === 'Urgent'
                        ? 'danger'
                        : complaint.priority === 'High'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {complaint.priority} Priority
                  </Badge>
                  <StatusBadge status={complaint.status} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 pt-1">{complaint.subject}</h3>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-400 block">
                  Logged: {complaint.submissionDate.split('T')[0]}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  By: {complaint.submittedByName}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {complaint.description}
            </p>

            {/* Admin Response Box */}
            {complaint.adminResponse && (
              <div className="mt-3 p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs">
                <div className="font-semibold text-blue-900 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    Administrative Resolution
                  </span>
                  {complaint.resolvedBy && (
                    <span className="text-[10px] text-blue-700 font-normal">
                      Resolved by {complaint.resolvedBy}
                    </span>
                  )}
                </div>
                <p className="text-slate-700">{complaint.adminResponse}</p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => openResolveModal(complaint)}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Update Status & Dispatch Response</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* RESOLVE / UPDATE STATUS MODAL */}
      {selectedComplaint && (
        <Modal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          title={`Administrative Action: ${selectedComplaint.complaintCode}`}
          subtitle={`Regarding: ${selectedComplaint.subject}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveResponse} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Update Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Official Administrative Response *
              </label>
              <textarea
                rows={4}
                value={adminResponseText}
                onChange={e => setAdminResponseText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Detail corrective actions taken, vehicle adjustments, or guidance provided to parents."
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Save Resolution
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* NEW COMPLAINT MODAL (WITH NLP SUGGESTION FEATURE E) */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Log Transport Complaint"
        subtitle="Automatic natural language classification engine active."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Subject / Summary *</label>
            <input
              type="text"
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g. Afternoon delay on Eastside route"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              rows={4}
              value={newDescription}
              onChange={e => handleDescriptionChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Type complaint description (e.g., 'Driver was driving too fast on highway' or 'Air conditioning was off and students were hot')..."
              required
            />
          </div>

          {/* AI NLP Suggestion Chip */}
          {suggestedCategoryInfo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center justify-between font-semibold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Intelligent Category Suggestion: {suggestedCategoryInfo.category}
                </span>
                <span className="text-[10px] text-blue-700 font-mono">
                  {Math.round(suggestedCategoryInfo.confidence * 100)}% Match
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">{suggestedCategoryInfo.rationale}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Log Complaint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
