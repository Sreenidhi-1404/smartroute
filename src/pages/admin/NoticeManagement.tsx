import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Notice, NoticeCategory, NoticeAudience } from '../../types';
import {
  BellRing,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Users,
  AlertCircle,
  Tag,
  Radio,
  Clock,
  Languages,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const NoticeManagement: React.FC = () => {
  const { notices, routes, addNotice, updateNotice, deleteNotice, language, setLanguage } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);

  // Form State with Bilingual support (Feature G)
  const [formData, setFormData] = useState({
    title: '',
    titleTa: '',
    content: '',
    contentTa: '',
    category: 'Transport Announcement' as NoticeCategory,
    audience: 'All' as NoticeAudience,
    publishDate: '31-10-2026',
    expiryDate: '15-11-2026',
    isUrgent: false,
    author: 'Transport Department',
    routeId: '',
  });

  const categories: NoticeCategory[] = [
    'General',
    'Route Change',
    'Bus Delay',
    'Holiday',
    'Transport Announcement',
    'Emergency Information',
  ];

  const audiences: NoticeAudience[] = ['All', 'Parents', 'Drivers', 'Students', 'Staff'];

  const filteredNotices = notices.filter(n => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(term) ||
      (n.titleTa && n.titleTa.toLowerCase().includes(term)) ||
      n.content.toLowerCase().includes(term) ||
      (n.contentTa && n.contentTa.toLowerCase().includes(term));
    const matchesCategory = categoryFilter === 'all' || n.category === categoryFilter;
    const matchesAudience = audienceFilter === 'all' || n.audience === audienceFilter;
    return matchesSearch && matchesCategory && matchesAudience;
  });

  const resetForm = () => {
    setFormData({
      title: '',
      titleTa: '',
      content: '',
      contentTa: '',
      category: 'Transport Announcement',
      audience: 'All',
      publishDate: '31-10-2026',
      expiryDate: '15-11-2026',
      isUrgent: false,
      author: 'Transport Department',
      routeId: '',
    });
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (notice: Notice) => {
    setActiveNotice(notice);
    setFormData({
      title: notice.title,
      titleTa: notice.titleTa || '',
      content: notice.content,
      contentTa: notice.contentTa || '',
      category: notice.category,
      audience: notice.audience,
      publishDate: notice.publishDate,
      expiryDate: notice.expiryDate,
      isUrgent: notice.isUrgent,
      author: notice.author,
      routeId: notice.routeId || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (notice: Notice) => {
    setActiveNotice(notice);
    setIsDeleteConfirmOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    addNotice({
      title: formData.title.trim(),
      titleTa: formData.titleTa.trim() || formData.title.trim(),
      content: formData.content.trim(),
      contentTa: formData.contentTa.trim() || formData.content.trim(),
      category: formData.category,
      audience: formData.audience,
      publishDate: formData.publishDate,
      expiryDate: formData.expiryDate,
      isUrgent: formData.isUrgent,
      author: formData.author.trim() || 'Transport Department',
      routeId: formData.routeId || undefined,
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNotice) return;

    updateNotice({
      ...activeNotice,
      title: formData.title.trim(),
      titleTa: formData.titleTa.trim() || formData.title.trim(),
      content: formData.content.trim(),
      contentTa: formData.contentTa.trim() || formData.content.trim(),
      category: formData.category,
      audience: formData.audience,
      publishDate: formData.publishDate,
      expiryDate: formData.expiryDate,
      isUrgent: formData.isUrgent,
      author: formData.author.trim(),
      routeId: formData.routeId || undefined,
    });

    setIsEditModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (activeNotice) {
      deleteNotice(activeNotice.id);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              School Transport Notices
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              இருமொழி அறிவிப்புகள் (English & தமிழ்)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Publish bilingual advisories, holiday timetables, and Coimbatore route alteration alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Quick Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <span>View: {language === 'en' ? 'English (ஆங்கிலம்)' : 'தமிழ் (Tamil)'}</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Bilingual Notice</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search in English or தமிழ்..."
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
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={audienceFilter}
            onChange={e => setAudienceFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Audiences</option>
            {audiences.map(a => (
              <option key={a} value={a}>
                For {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotices.map(notice => {
          const route = routes.find(r => r.id === notice.routeId);

          return (
            <div
              key={notice.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition-shadow hover:shadow-md flex flex-col justify-between ${
                notice.isUrgent ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={notice.isUrgent ? 'danger' : 'info'}>
                      {notice.category}
                    </Badge>
                    <Badge variant="outline">Audience: {notice.audience}</Badge>
                    {notice.isUrgent && <Badge variant="warning">URGENT / அவசரம்</Badge>}
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium">
                    {notice.publishDate}
                  </span>
                </div>

                {/* Primary display based on language toggle */}
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {language === 'ta' && notice.titleTa ? notice.titleTa : notice.title}
                </h3>

                {/* Secondary subtitle in other language */}
                {language === 'ta' && notice.title && (
                  <div className="text-[11px] text-slate-400 italic mt-0.5">{notice.title}</div>
                )}
                {language === 'en' && notice.titleTa && (
                  <div className="text-[11px] text-blue-700 font-medium mt-0.5">{notice.titleTa}</div>
                )}

                <div className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                  <p>{language === 'ta' && notice.contentTa ? notice.contentTa : notice.content}</p>
                  {/* Bilingual toggle peek */}
                  {language === 'en' && notice.contentTa && (
                    <p className="text-[11px] text-slate-500 border-t border-slate-200/60 pt-1.5 font-sans">
                      <strong className="text-slate-600">தமிழ்:</strong> {notice.contentTa}
                    </p>
                  )}
                  {language === 'ta' && notice.content && (
                    <p className="text-[11px] text-slate-500 border-t border-slate-200/60 pt-1.5 font-sans">
                      <strong className="text-slate-600">English:</strong> {notice.content}
                    </p>
                  )}
                </div>

                {route && (
                  <div className="mt-2.5 text-xs text-blue-700 font-medium flex items-center gap-1">
                    <span>Applicable Route: {route.routeCode} ({route.name})</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>By: {notice.author}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(notice)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Edit notice"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(notice)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT NOTICE MODAL (BILINGUAL) */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Broadcast Bilingual Notice' : 'Edit Bilingual Notice'}
        subtitle="Provide notices in both English and தமிழ் for Kovai Valley Matriculation School."
        maxWidth="lg"
      >
        <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit} className="space-y-4 text-xs">
          {/* English Headline */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Notice Headline (English) *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g. Avinashi Road Corridor Diversion Notice"
              required
            />
          </div>

          {/* Tamil Headline */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Notice Headline (தமிழ் தலைப்பு) *</label>
            <input
              type="text"
              value={formData.titleTa}
              onChange={e => setFormData({ ...formData, titleTa: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="எ.கா. அவினாசி சாலை வழித்தட மாற்ற அறிவிப்பு"
              required
            />
          </div>

          {/* English Content */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Notice Body (English) *</label>
            <textarea
              rows={3}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Provide clear details regarding timings, pickup stops, or safety instructions..."
              required
            />
          </div>

          {/* Tamil Content */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Notice Body (தமிழ் விளக்கம்) *</label>
            <textarea
              rows={3}
              value={formData.contentTa}
              onChange={e => setFormData({ ...formData, contentTa: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="பேருந்து நேரம் மற்றும் நிறுத்தம் குறித்த முழு விவரங்களை உள்ளிடவும்..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Audience</label>
              <select
                value={formData.audience}
                onChange={e => setFormData({ ...formData, audience: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {audiences.map(a => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Publish Date (DD-MM-YYYY)</label>
              <input
                type="text"
                value={formData.publishDate}
                onChange={e => setFormData({ ...formData, publishDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Expiry Date (DD-MM-YYYY)</label>
              <input
                type="text"
                value={formData.expiryDate}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Specific Corridor (Optional)</label>
              <select
                value={formData.routeId}
                onChange={e => setFormData({ ...formData, routeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">All Corridors</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.routeCode} ({r.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={e => setFormData({ ...formData, isUrgent: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <span className="font-semibold text-rose-700">Flag as Urgent Priority (அவசரம்)</span>
              </label>
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
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              {isAddModalOpen ? 'Broadcast Notice' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Notice"
        message={`Are you sure you want to remove the notice "${activeNotice?.title}" from the public bulletin?`}
        confirmLabel="Delete Notice"
      />
    </div>
  );
};
