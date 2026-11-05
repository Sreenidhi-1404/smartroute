import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { ParentProfile, Student } from '../../types';
import {
  Heart,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  UserPlus,
  Users,
  Phone,
  Mail,
  MapPin,
  Link2,
  Unlink2,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  Bus,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const ParentManagement: React.FC = () => {
  const {
    parents,
    students,
    buses,
    routes,
    addParent,
    updateParent,
    deleteParent,
    linkChildToParent,
    unlinkChildFromParent,
  } = useData();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [childFilter, setChildFilter] = useState<'all' | 'single' | 'multiple'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [activeParent, setActiveParent] = useState<ParentProfile | null>(null);
  const [selectedStudentToLink, setSelectedStudentToLink] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [formError, setFormError] = useState('');

  // Filtered Parents
  const filteredParents = useMemo(() => {
    return parents.filter(p => {
      const pStudents = students.filter(
        s => s.parentId === p.id || (p.linkedStudentIds || []).includes(s.id)
      );
      const childNames = pStudents.map(s => s.name.toLowerCase()).join(' ');

      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        childNames.includes(searchTerm.toLowerCase());

      const count = pStudents.length;
      const matchesChildFilter =
        childFilter === 'all' ||
        (childFilter === 'single' && count === 1) ||
        (childFilter === 'multiple' && count > 1);

      return matchesSearch && matchesChildFilter;
    });
  }, [parents, students, searchTerm, childFilter]);

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '+91 ',
      email: '',
      address: '',
    });
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (parent: ParentProfile) => {
    setActiveParent(parent);
    setFormData({
      name: parent.name,
      phone: parent.phone,
      email: parent.email,
      address: parent.address,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openViewModal = (parent: ParentProfile) => {
    setActiveParent(parent);
    setIsViewModalOpen(true);
  };

  const openLinkModal = (parent: ParentProfile) => {
    setActiveParent(parent);
    setSelectedStudentToLink('');
    setIsLinkModalOpen(true);
  };

  const openDeleteModal = (parent: ParentProfile) => {
    setActiveParent(parent);
    setIsDeleteConfirmOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setFormError('Name, email, and phone are mandatory fields.');
      return;
    }
    const res = addParent({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim() || 'Coimbatore, Tamil Nadu',
      userId: `ACC-PAR-${Date.now().toString().slice(-4)}`,
      linkedStudentIds: [],
    });
    if (res.success) {
      setIsAddModalOpen(false);
    } else {
      setFormError(res.message || 'Failed to add parent.');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeParent) return;
    setFormError('');
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setFormError('Name, email, and phone are mandatory.');
      return;
    }
    const res = updateParent({
      ...activeParent,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
    });
    if (res.success) {
      setIsEditModalOpen(false);
    } else {
      setFormError(res.message || 'Failed to update parent.');
    }
  };

  const handleDeleteConfirm = () => {
    if (!activeParent) return;
    deleteParent(activeParent.id);
    setIsDeleteConfirmOpen(false);
  };

  const handleLinkChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeParent || !selectedStudentToLink) return;
    linkChildToParent(activeParent.id, selectedStudentToLink);
    setIsLinkModalOpen(false);
  };

  const handleUnlinkChild = (parentId: string, studentId: string) => {
    unlinkChildFromParent(parentId, studentId);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Parent ID', 'Name', 'Phone', 'Email', 'Address', 'Linked Children Count', 'Linked Children'];
    const rows = filteredParents.map(p => {
      const pStudents = students.filter(
        s => s.parentId === p.id || (p.linkedStudentIds || []).includes(s.id)
      );
      const childNames = pStudents.map(s => `${s.name} (${s.classGrade}-${s.section})`).join('; ');
      return [
        p.id,
        `"${p.name}"`,
        p.phone,
        p.email,
        `"${p.address}"`,
        pStudents.length,
        `"${childNames}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kovai_valley_parents_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Available students to link for active parent
  const availableStudentsToLink = useMemo(() => {
    if (!activeParent) return [];
    const linkedSet = new Set(activeParent.linkedStudentIds || []);
    return students.filter(s => s.parentId !== activeParent.id && !linkedSet.has(s.id));
  }, [students, activeParent]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-600" />
            Parent & Guardian Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage parent accounts, multi-child associations (one-to-many relationship), and authorized guardians across Coimbatore.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Parent Account</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Parent Accounts</span>
          <span className="text-2xl font-bold text-slate-900">{parents.length}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Coimbatore residential registry</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Multi-Child Families</span>
          <span className="text-2xl font-bold text-blue-600">
            {parents.filter(p => (p.linkedStudentIds?.length || 0) > 1).length}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">e.g. Priya R (4 children)</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Single-Child Families</span>
          <span className="text-2xl font-bold text-emerald-600">
            {parents.filter(p => (p.linkedStudentIds?.length || 0) === 1).length}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Direct guardian allocation</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Associated Pupils</span>
          <span className="text-2xl font-bold text-indigo-600">{students.length}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Across classes LKG - 12</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by parent name, child, phone..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={childFilter}
            onChange={e => setChildFilter(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Families</option>
            <option value="multiple">Multi-Child Families (2+)</option>
            <option value="single">Single-Child Families</option>
          </select>
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Showing {filteredParents.length} parents
          </span>
        </div>
      </div>

      {/* Parents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Parent Details</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Coimbatore Address</th>
                <th className="py-3 px-4">Linked Children (One-to-Many)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParents.map(parent => {
                const linkedPupils = students.filter(
                  s => s.parentId === parent.id || (parent.linkedStudentIds || []).includes(s.id)
                );

                return (
                  <tr key={parent.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">
                          {parent.name
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{parent.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{parent.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{parent.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[170px]">{parent.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-1.5 text-slate-600 max-w-xs truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{parent.address}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={linkedPupils.length > 1 ? 'info' : 'neutral'}>
                            {linkedPupils.length} {linkedPupils.length === 1 ? 'Child' : 'Children'}
                          </Badge>
                          {parent.name === 'Priya R' && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                              Demo Showcase
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {linkedPupils.map(c => (
                            <span
                              key={c.id}
                              className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                            >
                              {c.name} ({c.classGrade}-{c.section})
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openLinkModal(parent)}
                          title="Link Child"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openViewModal(parent)}
                          title="View Details"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(parent)}
                          title="Edit Parent"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(parent)}
                          title="Delete Parent"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal 1: Add Parent */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Parent Account"
        subtitle="Create an authorized school parent profile with Coimbatore contact details."
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parent Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Ramesh Kumar P"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (+91) *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+91 98421 11440"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="parent@kovaivalley.edu.in"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Coimbatore Residential Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 12 Cross Cut Road, Gandhipuram, Coimbatore"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Save Parent
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Parent */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Parent Account"
        subtitle={`Update profile information for ${activeParent?.name}.`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parent Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (+91) *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Coimbatore Residential Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: View Parent & Linked Children Details */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Parent Profile & Linked Family"
        subtitle={`Detailed breakdown of ${activeParent?.name} and connected pupils.`}
        maxWidth="lg"
      >
        {activeParent && (
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block">Parent ID:</span>
                <span className="font-mono font-bold text-slate-800">{activeParent.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Full Name:</span>
                <span className="font-bold text-slate-900">{activeParent.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contact Phone:</span>
                <span className="font-semibold text-slate-800">{activeParent.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Registered Email:</span>
                <span className="font-semibold text-slate-800">{activeParent.email}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Address:</span>
                <span className="text-slate-700">{activeParent.address}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  Linked Children ({students.filter(s => s.parentId === activeParent.id || (activeParent.linkedStudentIds || []).includes(s.id)).length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openLinkModal(activeParent);
                  }}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  <span>Link Another Child</span>
                </button>
              </div>

              <div className="space-y-2">
                {students
                  .filter(s => s.parentId === activeParent.id || (activeParent.linkedStudentIds || []).includes(s.id))
                  .map(child => {
                    const childBus = buses.find(b => b.id === child.assignedBusId);
                    const childRoute = routes.find(r => r.id === child.assignedRouteId);
                    return (
                      <div
                        key={child.id}
                        className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{child.name}</span>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {child.studentIdNumber}
                            </span>
                            <Badge variant="neutral">{child.classGrade}-{child.section}</Badge>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                            <span>Bus: <strong>{childBus?.busNumber}</strong> ({childBus?.registrationNumber})</span>
                            <span>Route: <strong>{childRoute?.name}</strong></span>
                            <span>Policy: <strong className="text-blue-700">{child.handoverPolicy}</strong></span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnlinkChild(activeParent.id, child.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded flex items-center gap-1"
                        >
                          <Unlink2 className="w-3 h-3" />
                          <span>Unlink</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 4: Link Child */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Associate Child with Parent"
        subtitle={`Select a student from Kovai Valley roster to link to ${activeParent?.name}.`}
        maxWidth="md"
      >
        <form onSubmit={handleLinkChild} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Student to Associate
            </label>
            <select
              value={selectedStudentToLink}
              onChange={e => setSelectedStudentToLink(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              required
            >
              <option value="">-- Choose student from directory --</option>
              {availableStudentsToLink.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentIdNumber}) - {s.classGrade}-{s.section} (Currently: {s.parentName})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Associating this child will update their primary guardian to {activeParent?.name}.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedStudentToLink}
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              Confirm Association
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog: Delete Parent */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Parent Profile"
        message={`Are you sure you want to remove ${activeParent?.name}? This action is protected: parents with actively assigned students cannot be deleted until associations are updated.`}
        confirmLabel="Delete Account"
        isDestructive={true}
      />
    </div>
  );
};
