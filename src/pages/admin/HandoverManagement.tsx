import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { HandoverRecord, HandoverStatus, Student } from '../../types';
import {
  KeyRound,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  UserCheck,
  Shield,
  ShieldAlert,
  ArrowRight,
  Filter,
  Users,
  Download,
  FileCheck,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SixDigitPinInput } from '../../components/common/SixDigitPinInput';

export const HandoverManagement: React.FC = () => {
  const {
    handovers,
    students,
    routes,
    buses,
    drivers,
    verifyHandoverPin,
    regenerateHandoverPin,
    updateHandoverStatus,
    overrideHandoverWithDispatcherApproval,
    showToast,
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [policyFilter, setPolicyFilter] = useState('all');

  // Verify PIN modal
  const [selectedHandover, setSelectedHandover] = useState<HandoverRecord | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Dispatcher Override Modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideAdultName, setOverrideAdultName] = useState('');
  const [overrideIdProof, setOverrideIdProof] = useState('Aadhaar / Driving License');
  const [overrideReason, setOverrideReason] = useState('Parent verified in-person with valid identity proof (phone battery drained).');

  // Audit Details Modal
  const [auditRecord, setAuditRecord] = useState<HandoverRecord | null>(null);

  const filteredHandovers = handovers.filter(h => {
    const student = students.find(s => s.id === h.studentId);
    const matchesSearch =
      h.authorizedGuardianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.guardianPhone.includes(searchTerm) ||
      h.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || h.status === statusFilter;
    const matchesPolicy = policyFilter === 'all' || h.policy === policyFilter;
    return matchesSearch && matchesStatus && matchesPolicy;
  });

  const openVerifyModal = (h: HandoverRecord) => {
    setSelectedHandover(h);
    setPinInput('');
    setVerifyMessage(null);
    setIsVerifyModalOpen(true);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandover) return;
    if (pinInput.length !== 6) {
      setVerifyMessage({ success: false, text: 'Please enter all 6 digits of the handover PIN.' });
      return;
    }
    const res = verifyHandoverPin(selectedHandover.id, pinInput, selectedHandover.driverId);
    setVerifyMessage({ success: res.success, text: res.message });
    if (res.success) {
      setTimeout(() => {
        setIsVerifyModalOpen(false);
      }, 1400);
    }
  };

  const openOverrideModal = (h: HandoverRecord) => {
    setSelectedHandover(h);
    setOverrideAdultName(h.authorizedGuardianName);
    setOverrideIdProof('AADHAAR-TN-2026-XXXX');
    setOverrideReason('Verified in-person at school curb with physical government ID.');
    setIsOverrideModalOpen(true);
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandover || !overrideAdultName.trim()) return;
    const res = overrideHandoverWithDispatcherApproval(
      selectedHandover.id,
      overrideAdultName.trim(),
      overrideIdProof.trim(),
      overrideReason.trim(),
      'Thiru. S. Ramanathan'
    );
    if (res.success) {
      setIsOverrideModalOpen(false);
      setSelectedHandover(null);
    }
  };

  const exportAuditCSV = () => {
    const headers = [
      'Handover ID',
      'Date',
      'Time',
      'Student ID',
      'Student Name',
      'Class',
      'Policy',
      'Guardian Name',
      'Guardian Phone',
      'Active PIN',
      'Status',
      'Verified At',
      'Verification Method',
      'Failed Attempts',
      'Notes',
    ];
    const rows = filteredHandovers.map(h => {
      const student = students.find(s => s.id === h.studentId);
      return [
        h.id,
        h.date,
        h.time,
        student?.studentIdNumber || h.studentId,
        `"${student?.name || ''}"`,
        `"${student?.classGrade || ''}-${student?.section || ''}"`,
        `"${h.policy}"`,
        `"${h.authorizedGuardianName}"`,
        h.guardianPhone,
        h.oneTimePin || student?.handoverPin || 'N/A',
        h.status,
        h.verifiedAt || h.dismissedAt || 'N/A',
        h.verificationMethod || 'N/A',
        String(h.failedAttempts || 0),
        `"${h.notes || ''}"`,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartroute_handovers_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              UPDATED SECURITY PROTOCOL • 6-DIGIT OTP
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Safe Student Handover Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cryptographic dynamic 6-digit OTP verification & emergency offline fallback for Kovai Valley pupils.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={exportAuditCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Handovers Today</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{handovers.length}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Scheduled afternoon runs</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-blue-600 block">Awaiting Verification</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">
            {handovers.filter(h => h.status === 'Arrived at Drop-off' || h.status === 'Awaiting Guardian Verification').length}
          </span>
          <span className="text-[11px] text-blue-500 mt-1 block">Bus at designated stop</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 block">Safely Handed Over</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            {handovers.filter(h => h.status === 'Handed Over' || h.status === 'Independently Dismissed').length}
          </span>
          <span className="text-[11px] text-emerald-500 mt-1 block">6-digit PIN / Adult verified</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-rose-600 block">Escalated Inquiries</span>
          <span className="text-2xl font-bold text-rose-700 mt-1 block">
            {handovers.filter(h => h.status === 'Escalated').length}
          </span>
          <span className="text-[11px] text-rose-500 mt-1 block">Max PIN attempts / alerts</span>
        </div>
      </div>

      {/* Safety Protocol Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm text-white">Handover Security Protocol (Synchronized 6-Digit Matrix)</h3>
          </div>
          <span className="text-[11px] font-mono text-sky-300">Protocol v2.4 Active</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          When the school bus reaches the student's designated stop, the driver marks arrival.
          The guardian's portal displays a <strong>dynamic 6-digit one-time PIN (OTP)</strong> with 2-hour validity.
          The driver enters the 6 digits into their mobile console to complete the handshake.
          If phone reception is lost, the student's registered <strong>6-digit Emergency Backup PIN</strong> can be verified.
          After 5 failed attempts, the system automatically locks the release and alerts the School Safety Dispatch.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, guardian, phone, PIN..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <select
            value={policyFilter}
            onChange={e => setPolicyFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Policies</option>
            <option value="Guardian Required">Guardian Required (6-digit OTP)</option>
            <option value="Authorized Adult Required">Authorized Adult Required</option>
            <option value="Independent Dismissal">Independent Dismissal</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Handover Statuses</option>
            <option value="Awaiting Drop-off">Awaiting Drop-off</option>
            <option value="Awaiting Guardian Verification">Awaiting Guardian Verification</option>
            <option value="Handed Over">Handed Over</option>
            <option value="Independently Dismissed">Independently Dismissed</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>
      </div>

      {/* Handovers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Handover Policy</th>
                <th className="px-4 py-3">Designated Stop</th>
                <th className="px-4 py-3">Authorized Guardian</th>
                <th className="px-4 py-3">6-Digit OTP / Method</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Verification Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHandovers.map(h => {
                const student = students.find(s => s.id === h.studentId);
                const route = routes.find(r => r.id === student?.assignedRouteId);
                const stop = route?.pickupPoints.find(p => p.id === h.pickupPointId);
                const driver = drivers.find(d => d.id === h.driverId);

                return (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{student?.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {student?.classGrade}-{student?.section} • {student?.studentIdNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          h.policy === 'Guardian Required'
                            ? 'bg-blue-100 text-blue-800'
                            : h.policy === 'Authorized Adult Required'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {h.policy}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 block">{stop?.name || 'Main Stop'}</span>
                      <span className="text-[11px] text-slate-400">{stop?.afternoonTime || '03:45 PM'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{h.authorizedGuardianName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {h.guardianPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {h.policy === 'Guardian Required' ? (
                        h.oneTimePin ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 tracking-wider">
                              {h.oneTimePin}
                            </span>
                            {h.verificationMethod && (
                              <span className="text-[9px] text-slate-500 block font-sans">
                                {h.verificationMethod === 'emergency_pin'
                                  ? 'Emergency Backup PIN'
                                  : h.verificationMethod === 'dispatcher_override'
                                  ? 'Dispatcher Override'
                                  : 'Dynamic OTP'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-sans">Awaiting Drop Arrival</span>
                        )
                      ) : h.policy === 'Authorized Adult Required' ? (
                        <span className="text-[10px] text-amber-700 font-sans font-medium">In-Person ID Check</span>
                      ) : (
                        <span className="text-[10px] text-indigo-700 font-sans font-medium">Self Dismissal Pass</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-medium">{driver?.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={h.status} />
                      {h.failedAttempts && h.failedAttempts > 0 && h.status !== 'Handed Over' ? (
                        <span className="text-[10px] text-rose-600 block font-semibold mt-0.5">
                          {h.failedAttempts}/5 attempts failed
                        </span>
                      ) : null}
                      {h.notes && (
                        <span className="text-[10px] text-slate-500 block truncate max-w-[150px] mt-0.5" title={h.notes}>
                          {h.notes}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {h.status === 'Handed Over' ? (
                          <button
                            onClick={() => setAuditRecord(h)}
                            className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200 transition-colors flex items-center gap-1"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </button>
                        ) : h.status === 'Independently Dismissed' ? (
                          <button
                            onClick={() => setAuditRecord(h)}
                            className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded border border-indigo-200 transition-colors"
                          >
                            ✓ Dismissed
                          </button>
                        ) : (
                          <>
                            {h.policy === 'Guardian Required' && (
                              <button
                                onClick={() => openVerifyModal(h)}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Verify PIN</span>
                              </button>
                            )}
                            <button
                              onClick={() => openOverrideModal(h)}
                              title="Dispatcher Emergency Override (Physical ID)"
                              className="px-2 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                            >
                              Override
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setAuditRecord(h)}
                          title="View Full Audit Log"
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

      {/* VERIFY PIN MODAL (6-DIGIT INTERACTIVE COMPONENT) */}
      {selectedHandover && (
        <Modal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          title="Safe Student Handover: Enter 6-Digit Guardian PIN"
          subtitle={`Simulated PIN Handshake for ${students.find(s => s.id === selectedHandover.studentId)?.name}`}
          maxWidth="sm"
        >
          <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div>
                <strong>Student:</strong> {students.find(s => s.id === selectedHandover.studentId)?.name}
              </div>
              <div>
                <strong>Guardian at Stop:</strong> {selectedHandover.authorizedGuardianName}
              </div>
              <div>
                <strong>Registered Phone:</strong> {selectedHandover.guardianPhone}
              </div>
              {selectedHandover.failedAttempts > 0 && (
                <div className="text-rose-600 font-semibold pt-1">
                  Prior failed attempts: {selectedHandover.failedAttempts} / 5
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-2 text-center">
                Enter 6-Digit Handover PIN Provided Verbally by Guardian *
              </label>

              <SixDigitPinInput
                value={pinInput}
                onChange={val => {
                  setPinInput(val);
                  setVerifyMessage(null);
                }}
                hasError={!!verifyMessage && !verifyMessage.success}
                autoFocus={true}
              />

              <div className="mt-2 text-[11px] text-slate-500 text-center space-y-0.5">
                <p>
                  (Admin Audit View: Active 6-digit OTP is <strong className="font-mono text-blue-700">{selectedHandover.oneTimePin}</strong>)
                </p>
                <p className="text-[10px] text-slate-400">
                  Registered emergency backup PIN: <strong className="font-mono">{students.find(s => s.id === selectedHandover.studentId)?.handoverPin}</strong>
                </p>
              </div>
            </div>

            {verifyMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  verifyMessage.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {verifyMessage.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{verifyMessage.text}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  regenerateHandoverPin(selectedHandover.id);
                  showToast('info', 'Generated fresh 6-digit PIN for guardian.', 'PIN Regenerated');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate PIN</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length !== 6}
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
                >
                  Confirm Handover
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* DISPATCHER EMERGENCY OVERRIDE MODAL */}
      {selectedHandover && (
        <Modal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          title="Dispatcher Handover Safety Override"
          subtitle="Direct supervisor authorization for in-person parent ID verification."
          maxWidth="md"
        >
          <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1 text-slate-700">
              <div className="font-bold text-amber-950">
                Student: {students.find(s => s.id === selectedHandover.studentId)?.name}
              </div>
              <p className="text-[11px] text-amber-900">
                This administrative override bypasses electronic OTP when the guardian is physically present at the vehicle/office and their identity has been verified via official photo credentials.
              </p>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Authorized Adult Receiving Student *
              </label>
              <input
                type="text"
                value={overrideAdultName}
                onChange={e => setOverrideAdultName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Verified Government ID Document Reference *
              </label>
              <input
                type="text"
                value={overrideIdProof}
                onChange={e => setOverrideIdProof(e.target.value)}
                placeholder="e.g. AADHAAR / DL number"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Override Justification & Dispatcher Notes *
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
              >
                Authorize Safety Override
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* FULL AUDIT RECORD MODAL */}
      {auditRecord && (
        <Modal
          isOpen={!!auditRecord}
          onClose={() => setAuditRecord(null)}
          title={`Handover Audit Dossier: ${auditRecord.id}`}
          subtitle={`Student: ${students.find(s => s.id === auditRecord.studentId)?.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Verification Status:</span>
                <StatusBadge status={auditRecord.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Handover Policy:</span>
                <Badge variant="info">{auditRecord.policy}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Verification Method:</span>
                <span className="font-mono font-bold text-blue-900">
                  {auditRecord.verificationMethod || '6-digit OTP'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Verified Timestamp:</span>
                <span className="font-mono text-slate-800">{auditRecord.verifiedAt || auditRecord.dismissedAt || auditRecord.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Verified By Operator:</span>
                <span className="font-medium text-slate-800">{auditRecord.verifiedByDriverId || auditRecord.driverId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Authorized Adult:</span>
                <span className="font-semibold text-slate-900">{auditRecord.pickupPersonName || auditRecord.authorizedGuardianName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Guardian Phone:</span>
                <span className="font-mono text-slate-800">{auditRecord.guardianPhone}</span>
              </div>
            </div>

            {auditRecord.notes && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
                <div className="font-semibold text-blue-950">Audit Security Log:</div>
                <p className="text-slate-700">{auditRecord.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAuditRecord(null)}
                className="px-4 py-2 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
