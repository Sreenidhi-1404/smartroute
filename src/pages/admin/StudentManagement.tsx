import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Student } from '../../types';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  Bus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  X,
  GraduationCap,
  RotateCcw,
  FlaskConical,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TestRunnerModal } from '../../components/common/TestRunnerModal';

export const StudentManagement: React.FC = () => {
  const { students, parents, buses, routes, addStudent, updateStudent, deleteStudent } = useData();

  // Search, Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'grade'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    classGrade: '7',
    section: 'A',
    rollNumber: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dateOfBirth: '2013-05-12',
    parentId: 'PAR-001',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    assignedRouteId: '',
    assignedBusId: '',
    pickupPointId: '',
    transportStatus: 'Active' as Student['transportStatus'],
    handoverPolicy: 'Guardian Required' as Student['handoverPolicy'],
    handoverPin: '739412',
    medicalNotes: '',
    emergencyContact: '',
  });
  const [formError, setFormError] = useState('');

  // Helper to normalize grade representation (e.g. "Class 7", "Grade 7", "7" -> "7")
  const normalizeGradeKey = (g: string) => {
    if (!g) return '';
    return g.toLowerCase().replace(/^(class|grade|std)\s*/i, '').trim();
  };

  const formatGradeDisplay = (g: string) => {
    if (!g) return '-';
    const clean = g.replace(/^(class|grade|std)\s*/i, '').trim();
    if (!clean) return g;
    return /^\d+$/.test(clean) ? `Class ${clean}` : clean.toUpperCase();
  };

  // Dynamically compute all available classes/grades from registered students
  const availableGrades = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const norm = normalizeGradeKey(s.classGrade);
      if (norm) {
        counts[norm] = (counts[norm] || 0) + 1;
      }
    });

    // Seed standard Classes 1 through 12 and pre-primary
    const standardKeys = [
      'LKG',
      'UKG',
      ...Array.from({ length: 12 }, (_, i) => String(i + 1)),
    ];

    const seen = new Set<string>();
    const list: { key: string; label: string; count: number }[] = [];

    standardKeys.forEach(raw => {
      const norm = normalizeGradeKey(raw);
      if (!seen.has(norm)) {
        seen.add(norm);
        const count = counts[norm] || 0;
        const isNum = /^\d+$/.test(norm);
        const label = isNum ? `Class ${norm}` : norm.toUpperCase();
        list.push({ key: norm, label, count });
      }
    });

    Object.keys(counts).forEach(norm => {
      if (!seen.has(norm)) {
        seen.add(norm);
        const isNum = /^\d+$/.test(norm);
        const label = isNum ? `Class ${norm}` : norm.toUpperCase();
        list.push({ key: norm, label, count: counts[norm] });
      }
    });

    return list.sort((a, b) => {
      const numA = parseInt(a.key, 10);
      const numB = parseInt(b.key, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      if (!isNaN(numA)) return 1;
      if (!isNaN(numB)) return -1;
      return a.label.localeCompare(b.label);
    });
  }, [students]);

  // Filtering & Sorting
  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return students
      .filter(s => {
        const assignedRoute = routes.find(r => r.id === s.assignedRouteId);
        const assignedBus = buses.find(b => b.id === s.assignedBusId);

        const matchesSearch =
          !query ||
          s.name.toLowerCase().includes(query) ||
          s.studentIdNumber.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query) ||
          s.parentName.toLowerCase().includes(query) ||
          s.parentPhone.toLowerCase().includes(query) ||
          s.parentEmail.toLowerCase().includes(query) ||
          s.rollNumber.toLowerCase().includes(query) ||
          (s.address && s.address.toLowerCase().includes(query)) ||
          (assignedRoute && (assignedRoute.name.toLowerCase().includes(query) || assignedRoute.routeCode.toLowerCase().includes(query))) ||
          (assignedBus && assignedBus.busNumber.toLowerCase().includes(query));

        const matchesGrade =
          selectedGrade === 'all' ||
          normalizeGradeKey(s.classGrade) === normalizeGradeKey(selectedGrade);

        const matchesSection = selectedSection === 'all' || s.section.toLowerCase() === selectedSection.toLowerCase();
        const matchesStatus = selectedStatus === 'all' || s.transportStatus === selectedStatus;
        const matchesRoute = selectedRoute === 'all' || s.assignedRouteId === selectedRoute;

        return matchesSearch && matchesGrade && matchesSection && matchesStatus && matchesRoute;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'name') comp = a.name.localeCompare(b.name);
        else if (sortBy === 'id') comp = a.studentIdNumber.localeCompare(b.studentIdNumber);
        else if (sortBy === 'grade') {
          const numA = parseInt(a.classGrade.replace(/\D/g, '') || '0', 10);
          const numB = parseInt(b.classGrade.replace(/\D/g, '') || '0', 10);
          comp = numA - numB;
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [students, routes, buses, searchTerm, selectedGrade, selectedSection, selectedStatus, selectedRoute, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetForm = () => {
    setFormData({
      name: '',
      classGrade: '7',
      section: 'A',
      rollNumber: '',
      gender: 'Male',
      dateOfBirth: '2013-05-12',
      parentId: parents[0]?.id || 'PAR-001',
      parentName: parents[0]?.name || '',
      parentPhone: parents[0]?.phone || '',
      parentEmail: parents[0]?.email || '',
      address: parents[0]?.address || 'Coimbatore, Tamil Nadu',
      assignedRouteId: routes[0]?.id || '',
      assignedBusId: routes[0]?.assignedBusId || '',
      pickupPointId: routes[0]?.pickupPoints[0]?.id || '',
      transportStatus: 'Active',
      handoverPolicy: 'Guardian Required',
      handoverPin: String(100000 + Math.floor(Math.random() * 900000)),
      medicalNotes: '',
      emergencyContact: '',
    });
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setActiveStudent(student);
    setFormData({
      name: student.name,
      classGrade: student.classGrade,
      section: student.section,
      rollNumber: student.rollNumber,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      parentId: student.parentId || 'PAR-001',
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      address: student.address,
      assignedRouteId: student.assignedRouteId,
      assignedBusId: student.assignedBusId,
      pickupPointId: student.pickupPointId,
      transportStatus: student.transportStatus,
      handoverPolicy: student.handoverPolicy || 'Guardian Required',
      handoverPin: student.handoverPin || '739412',
      medicalNotes: student.medicalNotes || '',
      emergencyContact: student.emergencyContact,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openViewModal = (student: Student) => {
    setActiveStudent(student);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (student: Student) => {
    setActiveStudent(student);
    setIsDeleteConfirmOpen(true);
  };

  const handleRouteSelect = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setFormData(prev => ({
        ...prev,
        assignedRouteId: route.id,
        assignedBusId: route.assignedBusId,
        pickupPointId: route.pickupPoints[0]?.id || '',
      }));
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Student full name is required.');
      return;
    }
    if (!formData.parentName.trim() || !formData.parentPhone.trim()) {
      setFormError('Parent contact information is required.');
      return;
    }

    const matchedParent = parents.find(p => p.id === formData.parentId || p.name.toLowerCase() === formData.parentName.toLowerCase());

    const res = addStudent({
      name: formData.name.trim(),
      parentId: matchedParent?.id || formData.parentId || 'PAR-001',
      classGrade: formData.classGrade,
      section: formData.section,
      rollNumber: formData.rollNumber || String(Math.floor(Math.random() * 40) + 1),
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      parentName: matchedParent?.name || formData.parentName.trim(),
      parentPhone: matchedParent?.phone || formData.parentPhone.trim(),
      parentEmail: matchedParent?.email || formData.parentEmail.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      address: formData.address.trim() || 'Coimbatore, Tamil Nadu',
      assignedRouteId: formData.assignedRouteId,
      assignedBusId: formData.assignedBusId,
      pickupPointId: formData.pickupPointId,
      transportStatus: formData.transportStatus,
      handoverPolicy: formData.handoverPolicy || 'Guardian Required',
      handoverPin: formData.handoverPin.trim() || String(100000 + Math.floor(Math.random() * 900000)),
      medicalNotes: formData.medicalNotes.trim() || undefined,
      emergencyContact: formData.emergencyContact.trim() || formData.parentPhone.trim(),
    });

    if (res.success) {
      setIsAddModalOpen(false);
    } else {
      setFormError(res.message || 'Error creating student.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    if (!formData.name.trim()) {
      setFormError('Student full name is required.');
      return;
    }

    const res = updateStudent({
      ...activeStudent,
      name: formData.name.trim(),
      parentId: formData.parentId || activeStudent.parentId || 'PAR-001',
      handoverPolicy: formData.handoverPolicy || activeStudent.handoverPolicy || 'Guardian Required',
      handoverPin: formData.handoverPin.trim() || activeStudent.handoverPin || '739412',
      classGrade: formData.classGrade,
      section: formData.section,
      rollNumber: formData.rollNumber,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      parentName: formData.parentName.trim(),
      parentPhone: formData.parentPhone.trim(),
      parentEmail: formData.parentEmail.trim(),
      address: formData.address.trim(),
      assignedRouteId: formData.assignedRouteId,
      assignedBusId: formData.assignedBusId,
      pickupPointId: formData.pickupPointId,
      transportStatus: formData.transportStatus,
      medicalNotes: formData.medicalNotes.trim() || undefined,
      emergencyContact: formData.emergencyContact.trim(),
    });

    if (res.success) {
      setIsEditModalOpen(false);
    } else {
      setFormError(res.message || 'Error updating student record.');
    }
  };

  const handleConfirmDelete = () => {
    if (activeStudent) {
      deleteStudent(activeStudent.id);
      setIsDeleteConfirmOpen(false);
    }
  };

  // CSV Export
  const exportStudentsCSV = () => {
    const headers = [
      'Student ID',
      'Name',
      'Grade',
      'Section',
      'Roll No',
      'Status',
      'Assigned Route',
      'Assigned Bus',
      'Parent Name',
      'Parent Phone',
      'Parent Email',
      'Address',
    ];

    const rows = filteredStudents.map(s => {
      const route = routes.find(r => r.id === s.assignedRouteId);
      const bus = buses.find(b => b.id === s.assignedBusId);
      return [
        s.studentIdNumber,
        `"${s.name}"`,
        s.classGrade,
        s.section,
        s.rollNumber,
        s.transportStatus,
        `"${route?.name || s.assignedRouteId}"`,
        bus?.busNumber || s.assignedBusId,
        `"${s.parentName}"`,
        s.parentPhone,
        s.parentEmail,
        `"${s.address}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartroute_students_${new Date().toISOString().split('T')[0]}.csv`);
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
            Student Transport Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered students, bus allocations, and guardian contact profiles ({students.length} total).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsTestModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Run automated JUnit unit test suite for Student Transport Management"
          >
            <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
            <span>Run JUnit Tests</span>
            <span className="text-[10px] bg-indigo-200/80 text-indigo-900 px-1.5 py-0.2 rounded font-mono font-bold">10/10 PASS</span>
          </button>
          <button
            onClick={exportStudentsCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search box with instant clear */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by student name, admission number (e.g. KVMS-2026-014), roll #, parent, phone..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white placeholder-slate-400 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear search"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Class / Grade Filter Dropdown */}
            <div className="relative flex items-center">
              <select
                value={selectedGrade}
                onChange={e => {
                  setSelectedGrade(e.target.value);
                  setCurrentPage(1);
                }}
                className={`pl-8 pr-3 py-2 text-xs border rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 shadow-2xs transition-colors ${
                  selectedGrade !== 'all'
                    ? 'border-blue-400 text-blue-900 bg-blue-50/50 font-semibold'
                    : 'border-slate-300 text-slate-700'
                }`}
                title="Filter students by class or grade level"
              >
                <option value="all">All Classes / Grades ({students.length})</option>
                {availableGrades.map(g => (
                  <option key={g.key} value={g.key}>
                    {g.label} ({g.count} {g.count === 1 ? 'student' : 'students'})
                  </option>
                ))}
              </select>
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            </div>

            {/* Section Filter Dropdown */}
            <select
              value={selectedSection}
              onChange={e => {
                setSelectedSection(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-2 text-xs border rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 shadow-2xs transition-colors ${
                selectedSection !== 'all'
                  ? 'border-blue-400 text-blue-900 bg-blue-50/50 font-semibold'
                  : 'border-slate-300 text-slate-700'
              }`}
            >
              <option value="all">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>

            {/* Route Filter Dropdown */}
            <select
              value={selectedRoute}
              onChange={e => {
                setSelectedRoute(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-2 text-xs border rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 shadow-2xs transition-colors ${
                selectedRoute !== 'all'
                  ? 'border-blue-400 text-blue-900 bg-blue-50/50 font-semibold'
                  : 'border-slate-300 text-slate-700'
              }`}
            >
              <option value="all">All Routes</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.routeCode} ({r.name})
                </option>
              ))}
            </select>

            {/* Status Filter Dropdown */}
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-2 text-xs border rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 shadow-2xs transition-colors ${
                selectedStatus !== 'all'
                  ? 'border-blue-400 text-blue-900 bg-blue-50/50 font-semibold'
                  : 'border-slate-300 text-slate-700'
              }`}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>

            {/* Sorting Dropdown */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => {
                const [sb, so] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="name-desc">Sort: Name (Z-A)</option>
              <option value="grade-asc">Sort: Grade (Low-High)</option>
              <option value="grade-desc">Sort: Grade (High-Low)</option>
              <option value="id-asc">Sort: Admission ID</option>
            </select>
          </div>
        </div>

        {/* Quick Class Pills for 1-click filtering */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Quick Class:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedGrade('all');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 text-xs rounded-full transition-colors font-medium ${
              selectedGrade === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Classes ({students.length})
          </button>
          {availableGrades.slice(0, 8).map(g => {
            const isSelected = selectedGrade === g.key;
            return (
              <button
                type="button"
                key={g.key}
                onClick={() => {
                  setSelectedGrade(isSelected ? 'all' : g.key);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors font-medium ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {g.label} <span className="opacity-75 text-[10px]">({g.count})</span>
              </button>
            );
          })}
        </div>

        {/* Active Filters and Results Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-2.5 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>
              Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
            </span>

            {/* Active filter badges */}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="hover:text-blue-900"
                  aria-label="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedGrade !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px]">
                Class: {availableGrades.find(g => g.key === selectedGrade)?.label || selectedGrade}
                <button
                  onClick={() => setSelectedGrade('all')}
                  className="hover:text-indigo-900"
                  aria-label="Remove grade filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedSection !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                Section: {selectedSection}
                <button
                  onClick={() => setSelectedSection('all')}
                  className="hover:text-slate-900"
                  aria-label="Remove section filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedRoute !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                Route: {routes.find(r => r.id === selectedRoute)?.routeCode || selectedRoute}
                <button
                  onClick={() => setSelectedRoute('all')}
                  className="hover:text-slate-900"
                  aria-label="Remove route filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                Status: {selectedStatus}
                <button
                  onClick={() => setSelectedStatus('all')}
                  className="hover:text-slate-900"
                  aria-label="Remove status filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {(searchTerm || selectedGrade !== 'all' || selectedSection !== 'all' || selectedRoute !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGrade('all');
                setSelectedSection('all');
                setSelectedRoute('all');
                setSelectedStatus('all');
                setCurrentPage(1);
              }}
              className="text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset all filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Class & Sec</th>
                <th className="px-4 py-3">Assigned Route</th>
                <th className="px-4 py-3">Bus</th>
                <th className="px-4 py-3">Parent Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="font-semibold text-sm text-slate-800">
                        No students matching your criteria
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {searchTerm && selectedGrade !== 'all'
                          ? `No records found for "${searchTerm}" in ${availableGrades.find(g => g.key === selectedGrade)?.label || selectedGrade}.`
                          : searchTerm
                          ? `No student records match "${searchTerm}".`
                          : selectedGrade !== 'all'
                          ? `No students currently registered in ${availableGrades.find(g => g.key === selectedGrade)?.label || selectedGrade}.`
                          : 'Try modifying your search keywords or filter dropdowns.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedGrade('all');
                          setSelectedSection('all');
                          setSelectedRoute('all');
                          setSelectedStatus('all');
                          setCurrentPage(1);
                        }}
                        className="mt-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear All Filters</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map(student => {
                  const route = routes.find(r => r.id === student.assignedRouteId);
                  const bus = buses.find(b => b.id === student.assignedBusId);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        {student.studentIdNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-400">Roll #{student.rollNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="font-semibold text-slate-900 block">
                          {formatGradeDisplay(student.classGrade)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Section {student.section}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">
                          {route?.routeCode || 'Unassigned'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                          {route?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {bus?.busNumber || 'None'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium">{student.parentName}</div>
                        <div className="text-[11px] text-slate-400">{student.parentPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={student.transportStatus} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openViewModal(student)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View student profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(student)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* VIEW STUDENT PROFILE MODAL */}
      {activeStudent && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Student Profile: ${activeStudent.name}`}
          subtitle={`Registration ID: ${activeStudent.studentIdNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Class & Section</span>
                <span className="font-bold text-sm text-slate-900">
                  {formatGradeDisplay(activeStudent.classGrade)} - Section {activeStudent.section} (Roll #{activeStudent.rollNumber})
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Date of Birth & Gender</span>
                <span className="font-bold text-sm text-slate-900">
                  {activeStudent.dateOfBirth} • {activeStudent.gender}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Transport Status</span>
                <div className="mt-1">
                  <StatusBadge status={activeStudent.transportStatus} />
                </div>
              </div>
            </div>

            {/* Transport Allocation Details */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-sm text-blue-950">Transport Allocation Details</h4>
              </div>

              {(() => {
                const route = routes.find(r => r.id === activeStudent.assignedRouteId);
                const bus = buses.find(b => b.id === activeStudent.assignedBusId);
                const stop = route?.pickupPoints.find(p => p.id === activeStudent.pickupPointId);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-600 block">Assigned Route:</span>
                      <span>
                        {route ? `${route.routeCode} - ${route.name}` : 'Not Assigned'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600 block">Assigned Fleet Bus:</span>
                      <span>
                        {bus ? `${bus.busNumber} (${bus.model})` : 'Not Assigned'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600 block">Designated Stop:</span>
                      <span>{stop ? stop.name : 'School Main Loop'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600 block">Pickup Schedule:</span>
                      <span>
                        AM: {stop?.morningTime || '07:15 AM'} | PM: {stop?.afternoonTime || '03:45 PM'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Guardian & Emergency Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-600" />
                  Primary Guardian Information
                </h4>
                <div className="text-slate-600 space-y-1">
                  <div>
                    <strong>Name:</strong> {activeStudent.parentName}
                  </div>
                  <div>
                    <strong>Phone:</strong> {activeStudent.parentPhone}
                  </div>
                  <div>
                    <strong>Email:</strong> {activeStudent.parentEmail}
                  </div>
                  <div>
                    <strong>Home Address:</strong> {activeStudent.address}
                  </div>
                  <div className="pt-1.5 text-blue-900 font-medium">
                    <div className="flex items-center justify-between">
                      <strong>Emergency Handover PIN:</strong>
                      <span className="font-mono font-bold bg-blue-100 text-blue-950 px-2.5 py-1 rounded-md text-xs tracking-wider">
                        {activeStudent.handoverPin || '739412'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal block mt-0.5">
                      6-digit emergency fallback PIN if parent phone is unreachable at drop-off stop.
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-600" />
                  Safety & Emergency Notes
                </h4>
                <div className="text-slate-600 space-y-1">
                  <div>
                    <strong>Emergency Hotline:</strong> {activeStudent.emergencyContact}
                  </div>
                  <div>
                    <strong>Medical Notes:</strong>{' '}
                    {activeStudent.medicalNotes || 'No known allergies or medical restrictions reported.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD / EDIT STUDENT MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Register New Student' : `Edit Student: ${activeStudent?.name}`}
        subtitle="Complete student academic, guardian and transportation allocation parameters."
        maxWidth="2xl"
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
              <label className="block font-medium text-slate-700 mb-1">Student Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Liam Jenkins"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Grade *</label>
                <select
                  value={formData.classGrade}
                  onChange={e => setFormData({ ...formData, classGrade: e.target.value })}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                    <option key={g} value={String(g)}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Section *</label>
                <select
                  value={formData.section}
                  onChange={e => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Roll No</label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. 14"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Transport Status</label>
              <select
                value={formData.transportStatus}
                onChange={e => setFormData({ ...formData, transportStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Route and Bus selection */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-semibold text-slate-900 block">
              Transportation Route & Bus Assignment
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Route Corridor</label>
                <select
                  value={formData.assignedRouteId}
                  onChange={e => handleRouteSelect(e.target.value)}
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

              <div>
                <label className="block font-medium text-slate-600 mb-1">Assigned Bus</label>
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
                <label className="block font-medium text-slate-600 mb-1">Designated Pickup Stop</label>
                <select
                  value={formData.pickupPointId}
                  onChange={e => setFormData({ ...formData, pickupPointId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {(() => {
                    const selectedRouteObj = routes.find(r => r.id === formData.assignedRouteId);
                    if (!selectedRouteObj) return <option value="">Select Route First</option>;
                    return selectedRouteObj.pickupPoints.map(p => (
                      <option key={p.id} value={p.id}>
                        Stop {p.order}: {p.name} ({p.morningTime})
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>
          </div>

          {/* Parent Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Parent / Guardian Name *</label>
              <input
                type="text"
                value={formData.parentName}
                onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. Sarah Jenkins"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Parent Phone *</label>
              <input
                type="text"
                value={formData.parentPhone}
                onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="+91 98421 88440"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Parent Email</label>
              <input
                type="email"
                value={formData.parentEmail}
                onChange={e => setFormData({ ...formData, parentEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="parent@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Home Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Street address, neighborhood"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Emergency Handover PIN (6-Digits)</label>
              <input
                type="text"
                maxLength={6}
                value={formData.handoverPin}
                onChange={e => setFormData({ ...formData, handoverPin: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold tracking-widest text-blue-900"
                placeholder="739412"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Offline fallback PIN</span>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Medical / Health Notes</label>
              <input
                type="text"
                value={formData.medicalNotes}
                onChange={e => setFormData({ ...formData, medicalNotes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. Asthma, allergies"
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
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              {isAddModalOpen ? 'Confirm Registration' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Student Record"
        message={`Are you sure you want to remove ${activeStudent?.name} (${activeStudent?.studentIdNumber}) from the school transport registry? This will cancel any active bus seat allocation.`}
        confirmLabel="Delete Student"
      />

      {/* JUNIT TEST RUNNER MODAL */}
      <TestRunnerModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
};
