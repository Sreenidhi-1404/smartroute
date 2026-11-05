import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Bus,
  Driver,
  Route,
  Student,
  TransportAllocation,
  AttendanceRecord,
  Trip,
  Complaint,
  Notice,
  SchoolSettings,
  HandoverRecord,
  HandoverStatus,
  MissedBoardingAlert,
  PickupReadinessRecord,
  RouteDisruption,
  ParentProfile,
  SimulatedNotification,
  UserAccount,
} from '../types';
import { storageService } from '../services/storageService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  timestamp?: string;
  category?: 'Complaint' | 'Disruption' | 'Trip' | 'Handover' | 'Safety' | string;
}

interface DataContextType {
  buses: Bus[];
  drivers: Driver[];
  routes: Route[];
  students: Student[];
  allocations: TransportAllocation[];
  attendance: AttendanceRecord[];
  trips: Trip[];
  complaints: Complaint[];
  notices: Notice[];
  settings: SchoolSettings;
  handovers: HandoverRecord[];
  missedAlerts: MissedBoardingAlert[];
  readinessRecords: PickupReadinessRecord[];
  disruptions: RouteDisruption[];
  parents: ParentProfile[];
  notifications: SimulatedNotification[];
  toasts: ToastMessage[];
  showToast: (
    type: ToastMessage['type'],
    message: string,
    title?: string,
    duration?: number,
    category?: ToastMessage['category']
  ) => void;
  removeToast: (id: string) => void;

  // Language state (English / தமிழ்)
  language: 'en' | 'ta';
  setLanguage: (lang: 'en' | 'ta') => void;

  // Student & Parent relations
  getStudentsForParent: (parentIdOrUserId: string) => Student[];
  getStudentById: (id: string) => Student | undefined;
  addStudent: (student: Omit<Student, 'id' | 'studentIdNumber'>) => { success: boolean; message?: string };
  updateStudent: (student: Student) => { success: boolean; message?: string };
  deleteStudent: (id: string) => void;

  // Parent Management actions
  addParent: (parent: Omit<ParentProfile, 'id'>) => { success: boolean; message?: string; parent?: ParentProfile };
  updateParent: (parent: ParentProfile) => { success: boolean; message?: string };
  deleteParent: (id: string) => { success: boolean; message?: string };
  linkChildToParent: (parentId: string, studentId: string) => { success: boolean; message?: string };
  unlinkChildFromParent: (parentId: string, studentId: string) => { success: boolean; message?: string };

  // User Management actions
  userAccounts: UserAccount[];
  addUserAccount: (acc: Omit<UserAccount, 'id'>) => { success: boolean; message?: string; account?: UserAccount };
  updateUserAccount: (acc: UserAccount) => { success: boolean; message?: string };
  deleteUserAccount: (id: string) => { success: boolean; message?: string };

  // Bus actions
  addBus: (bus: Omit<Bus, 'id'>) => { success: boolean; message?: string };
  updateBus: (bus: Bus) => { success: boolean; message?: string };
  deleteBus: (id: string) => { success: boolean; message?: string };
  getBusOccupancy: (busId: string) => { occupied: number; capacity: number; percentage: number; available: number };

  // Driver actions
  addDriver: (driver: Omit<Driver, 'id' | 'driverCode'>) => { success: boolean; message?: string };
  updateDriver: (driver: Driver) => { success: boolean; message?: string };
  deleteDriver: (id: string) => { success: boolean; message?: string };

  // Route actions
  addRoute: (route: Omit<Route, 'id' | 'routeCode'>) => Route;
  updateRoute: (route: Route) => void;
  deleteRoute: (id: string) => { success: boolean; message?: string };

  // Allocation actions
  createAllocation: (alloc: Omit<TransportAllocation, 'id'>) => { success: boolean; message?: string };
  cancelAllocation: (id: string) => void;

  // Attendance actions (driver-authoritative, morning vs afternoon)
  markAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => void;

  // Handover actions (driver-and-guardian workflow)
  markArrivedAtDropoff: (studentId: string, tripId: string, driverId: string) => { success: boolean; handover: HandoverRecord; oneTimePin?: string };
  generateOrActivateHandoverPin: (studentId: string) => { success: boolean; message: string; handover?: HandoverRecord; pin?: string };
  batchMarkArrivedAtStop: (pickupPointId: string, tripId: string, driverId: string) => { success: boolean; count: number; studentNames: string[] };
  verifyHandoverPin: (handoverId: string, enteredPin: string, driverId: string) => { success: boolean; message: string; record?: HandoverRecord };
  regenerateHandoverPin: (handoverId: string) => { success: boolean; message: string; record?: HandoverRecord; newPin?: string };
  overrideHandoverWithDispatcherApproval: (handoverId: string, authorizedAdultName: string, idProof: string, reason: string, adminName: string) => { success: boolean; message: string; record?: HandoverRecord };
  confirmIndependentDismissal: (handoverId: string, driverId: string) => { success: boolean; message: string; record?: HandoverRecord };
  confirmAuthorizedAdultHandover: (handoverId: string, adultName: string, driverId: string, adultRelation?: string) => { success: boolean; message: string; record?: HandoverRecord };
  updateHandoverStatus: (handoverId: string, status: HandoverStatus, notes?: string) => void;

  // Simulated Notifications
  markNotificationRead: (id: string) => void;

  // Missed boarding actions
  acknowledgeMissedAlert: (alertId: string, notes?: string) => void;
  resolveMissedAlert: (alertId: string, notes: string) => void;

  // Pickup Readiness
  setPickupReadiness: (record: PickupReadinessRecord) => void;

  // Route Disruptions
  reportDisruption: (disruption: Omit<RouteDisruption, 'id' | 'reportedAt'>) => RouteDisruption;
  updateDisruptionStatus: (disruptionId: string, status: RouteDisruption['status']) => void;

  // Trip actions
  scheduleTrip: (trip: Omit<Trip, 'id' | 'tripCode'>) => Trip;
  updateTrip: (trip: Trip) => void;
  startTrip: (tripId: string) => void;
  delayTrip: (tripId: string, minutes: number, reason: string) => void;
  completeTrip: (tripId: string) => void;

  // Complaint actions
  addComplaint: (complaint: Omit<Complaint, 'id' | 'complaintCode' | 'submissionDate'>) => Complaint;
  updateComplaint: (complaint: Complaint) => void;

  // Notice actions
  addNotice: (notice: Omit<Notice, 'id'>) => Notice;
  updateNotice: (notice: Notice) => void;
  deleteNotice: (id: string) => void;

  // Settings
  updateSettings: (settings: SchoolSettings) => void;
  resetAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [buses, setBuses] = useState<Bus[]>(() => storageService.getBuses());
  const [drivers, setDrivers] = useState<Driver[]>(() => storageService.getDrivers());
  const [routes, setRoutes] = useState<Route[]>(() => storageService.getRoutes());
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const [allocations, setAllocations] = useState<TransportAllocation[]>(() => storageService.getAllocations());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => storageService.getAttendance());
  const [trips, setTrips] = useState<Trip[]>(() => storageService.getTrips());
  const [complaints, setComplaints] = useState<Complaint[]>(() => storageService.getComplaints());
  const [notices, setNotices] = useState<Notice[]>(() => storageService.getNotices());
  const [settings, setSettings] = useState<SchoolSettings>(() => storageService.getSettings());
  const [handovers, setHandovers] = useState<HandoverRecord[]>(() => storageService.getHandovers());
  const [missedAlerts, setMissedAlerts] = useState<MissedBoardingAlert[]>(() => storageService.getMissedBoardingAlerts());
  const [readinessRecords, setReadinessRecords] = useState<PickupReadinessRecord[]>(() => storageService.getReadinessRecords());
  const [disruptions, setDisruptions] = useState<RouteDisruption[]>(() => storageService.getDisruptions());
  const [parents, setParents] = useState<ParentProfile[]>(() => storageService.getParents());
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => storageService.getUserAccounts());
  const [notifications, setNotifications] = useState<SimulatedNotification[]>(() => storageService.getNotifications());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');

  // Reload all state from storageService
  const refreshAllState = useCallback(() => {
    setBuses(storageService.getBuses());
    setDrivers(storageService.getDrivers());
    setRoutes(storageService.getRoutes());
    setStudents(storageService.getStudents());
    setAllocations(storageService.getAllocations());
    setAttendance(storageService.getAttendance());
    setTrips(storageService.getTrips());
    setComplaints(storageService.getComplaints());
    setNotices(storageService.getNotices());
    setSettings(storageService.getSettings());
    setHandovers(storageService.getHandovers());
    setMissedAlerts(storageService.getMissedBoardingAlerts());
    setReadinessRecords(storageService.getReadinessRecords());
    setDisruptions(storageService.getDisruptions());
    setParents(storageService.getParents());
    setUserAccounts(storageService.getUserAccounts());
    setNotifications(storageService.getNotifications());
  }, []);

  const showToast = useCallback(
    (
      type: ToastMessage['type'],
      message: string,
      title?: string,
      duration: number = 5500,
      category?: ToastMessage['category']
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setToasts(prev => [...prev, { id, type, message, title, timestamp, category }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Parent-child relationships
  const getStudentsForParent = useCallback((parentIdOrUserId: string): Student[] => {
    return storageService.getStudentsForParent(parentIdOrUserId);
  }, []);

  const getStudentById = useCallback((id: string): Student | undefined => {
    return storageService.getStudentById(id);
  }, []);

  // Student methods
  const addStudent = (student: Omit<Student, 'id' | 'studentIdNumber'>) => {
    const res = storageService.addStudent(student);
    if (res.success && res.student) {
      refreshAllState();
      showToast('success', `Student ${res.student.name} (${res.student.studentIdNumber}) registered.`, 'Student Added');
    } else {
      showToast('error', res.message || 'Failed to add student.', 'Capacity Limit');
    }
    return res;
  };

  const updateStudent = (student: Student) => {
    const res = storageService.updateStudent(student);
    if (res.success) {
      refreshAllState();
      showToast('success', `Student profile for ${student.name} updated.`, 'Profile Updated');
    } else {
      showToast('error', res.message || 'Cannot update student allocation.', 'Allocation Error');
    }
    return res;
  };

  const deleteStudent = (id: string) => {
    const res = storageService.deleteStudent(id);
    if (res.success) {
      refreshAllState();
      showToast('info', 'Student record archived.', 'Student Removed');
    }
  };

  // Parent methods
  const addParent = (parent: Omit<ParentProfile, 'id'>) => {
    const res = storageService.addParent(parent);
    if (res.success && res.parent) {
      refreshAllState();
      showToast('success', `Parent profile for ${res.parent.name} registered.`, 'Parent Created');
    } else {
      showToast('error', res.message || 'Failed to add parent profile.', 'Validation Error');
    }
    return res;
  };

  const updateParent = (parent: ParentProfile) => {
    const res = storageService.updateParent(parent);
    if (res.success) {
      refreshAllState();
      showToast('success', `Parent record for ${parent.name} updated.`, 'Profile Updated');
    } else {
      showToast('error', res.message || 'Cannot update parent profile.', 'Validation Error');
    }
    return res;
  };

  const deleteParent = (id: string) => {
    const res = storageService.deleteParent(id);
    if (res.success) {
      refreshAllState();
      showToast('info', 'Parent record removed.', 'Parent Deleted');
    } else {
      showToast('error', res.message || 'Cannot delete parent with associated children.', 'Active Children Error');
    }
    return res;
  };

  const linkChildToParent = (parentId: string, studentId: string) => {
    const res = storageService.linkChildToParent(parentId, studentId);
    if (res.success) {
      refreshAllState();
      showToast('success', 'Child successfully linked to parent profile.', 'Child Associated');
    } else {
      showToast('error', res.message || 'Failed to link child.', 'Association Error');
    }
    return res;
  };

  const unlinkChildFromParent = (parentId: string, studentId: string) => {
    const res = storageService.unlinkChildFromParent(parentId, studentId);
    if (res.success) {
      refreshAllState();
      showToast('info', 'Child unlinked from parent profile.', 'Association Removed');
    } else {
      showToast('error', res.message || 'Failed to unlink child.', 'Association Error');
    }
    return res;
  };

  // User Account methods
  const addUserAccount = (acc: Omit<UserAccount, 'id'>) => {
    const res = storageService.addUserAccount(acc);
    if (res.success && res.account) {
      refreshAllState();
      showToast('success', `User account for ${res.account.name} (${res.account.email}) created.`, 'User Created');
    } else {
      showToast('error', res.message || 'Failed to create user account.', 'Account Error');
    }
    return res;
  };

  const updateUserAccount = (acc: UserAccount) => {
    const res = storageService.updateUserAccount(acc);
    if (res.success) {
      refreshAllState();
      showToast('success', `Account ${acc.email} updated.`, 'Account Updated');
    } else {
      showToast('error', res.message || 'Failed to update user account.', 'Account Error');
    }
    return res;
  };

  const deleteUserAccount = (id: string) => {
    const res = storageService.deleteUserAccount(id);
    if (res.success) {
      refreshAllState();
      showToast('info', 'User account removed.', 'Account Deleted');
    } else {
      showToast('error', res.message || 'Failed to delete user account.', 'Account Error');
    }
    return res;
  };

  // Bus methods
  const addBus = (bus: Omit<Bus, 'id'>) => {
    const res = storageService.addBus(bus);
    if (res.success && res.bus) {
      refreshAllState();
      showToast('success', `Bus ${res.bus.busNumber} added to Coimbatore fleet.`, 'Bus Added');
    } else {
      showToast('error', res.message || 'Failed to add bus.', 'Validation Error');
    }
    return res;
  };

  const updateBus = (bus: Bus) => {
    const res = storageService.updateBus(bus);
    if (res.success) {
      refreshAllState();
      showToast('success', `Bus ${bus.busNumber} updated.`, 'Bus Updated');
    } else {
      showToast('error', res.message || 'Failed to update bus.', 'Validation Error');
    }
    return res;
  };

  const deleteBus = (id: string) => {
    const res = storageService.deleteBus(id);
    if (res.success) {
      refreshAllState();
      showToast('info', 'Bus removed from active fleet.', 'Bus Removed');
    } else {
      showToast('error', res.message || 'Cannot delete bus with active allocations.', 'Active Bus Error');
    }
    return res;
  };

  const getBusOccupancy = useCallback((busId: string) => {
    return storageService.getBusOccupancy(busId);
  }, []);

  // Driver methods
  const addDriver = (driver: Omit<Driver, 'id' | 'driverCode'>) => {
    const res = storageService.addDriver(driver);
    if (res.success && res.driver) {
      refreshAllState();
      showToast('success', `Driver ${res.driver.name} onboarded.`, 'Driver Added');
    } else {
      showToast('error', res.message || 'Failed to add driver.', 'Validation Error');
    }
    return res;
  };

  const updateDriver = (driver: Driver) => {
    const res = storageService.updateDriver(driver);
    if (res.success) {
      refreshAllState();
      showToast('success', `Driver record for ${driver.name} updated.`, 'Driver Updated');
    } else {
      showToast('error', res.message || 'Failed to update driver.', 'Validation Error');
    }
    return res;
  };

  const deleteDriver = (id: string) => {
    const res = storageService.deleteDriver(id);
    if (res.success) {
      refreshAllState();
      showToast('info', 'Driver removed from personnel roster.', 'Driver Removed');
    } else {
      showToast('error', res.message || 'Driver is currently assigned to a bus.', 'Active Assignment');
    }
    return res;
  };

  // Route methods
  const addRoute = (route: Omit<Route, 'id' | 'routeCode'>) => {
    const res = storageService.addRoute(route);
    refreshAllState();
    showToast('success', `Route ${res.routeCode} (${res.name}) mapped successfully.`, 'Route Created');
    return res;
  };

  const updateRoute = (route: Route) => {
    storageService.updateRoute(route);
    refreshAllState();
    showToast('success', `Route ${route.routeCode} updated.`, 'Route Updated');
  };

  const deleteRoute = (id: string) => {
    const res = storageService.deleteRoute(id);
    if (res.success) {
      refreshAllState();
      showToast('info', 'Route corridor archived.', 'Route Deleted');
    } else {
      showToast('error', res.message || 'Cannot delete route with assigned students.', 'Active Route');
    }
    return res;
  };

  // Allocations
  const createAllocation = (alloc: Omit<TransportAllocation, 'id'>) => {
    const res = storageService.createAllocation(alloc);
    if (res.success) {
      refreshAllState();
      showToast('success', 'Student seat allocation confirmed.', 'Allocation Complete');
    } else {
      showToast('error', res.message || 'Bus capacity limit exceeded.', 'Capacity Exceeded');
    }
    return res;
  };

  const cancelAllocation = (id: string) => {
    storageService.cancelAllocation(id);
    refreshAllState();
    showToast('info', 'Transport seat allocation revoked.', 'Allocation Cancelled');
  };

  // Attendance (Driver authoritative, morning vs afternoon)
  const markAttendance = (records: Omit<AttendanceRecord, 'id'>[]) => {
    storageService.markAttendance(records);
    refreshAllState();
    showToast('success', `Recorded attendance for ${records.length} passenger entries.`, 'Attendance Submitted');
  };

  // Handover Verification (Driver-and-Guardian Workflow)
  const markArrivedAtDropoff = (studentId: string, tripId: string, driverId: string) => {
    const res = storageService.markArrivedAtDropoff(studentId, tripId, driverId);
    refreshAllState();
    if (res.oneTimePin) {
      showToast(
        'info',
        `Arrived at drop-off stop. Simulated Guardian OTP dispatched to parent portal.`,
        'Stop Arrival Recorded'
      );
    } else {
      showToast('info', `Arrived at drop-off stop. Ready for student release.`, 'Stop Arrival Recorded');
    }
    return res;
  };

  const verifyHandoverPin = (handoverId: string, enteredPin: string, driverId: string) => {
    const res = storageService.verifyHandoverPin(handoverId, enteredPin, driverId);
    refreshAllState();
    if (res.success) {
      showToast('success', res.message, 'Handover Verified');
    } else {
      showToast('error', res.message, 'Handover Security Alert');
    }
    return res;
  };

  const generateOrActivateHandoverPin = (studentId: string) => {
    const res = storageService.generateOrActivateHandoverPin(studentId);
    refreshAllState();
    if (res.success) {
      showToast('success', res.message, 'Handover OTP Ready');
    } else {
      showToast('error', res.message, 'Handover Error');
    }
    return res;
  };

  const batchMarkArrivedAtStop = (pickupPointId: string, tripId: string, driverId: string) => {
    const res = storageService.batchMarkArrivedAtStop(pickupPointId, tripId, driverId);
    refreshAllState();
    if (res.count > 0) {
      showToast('success', `Arrival marked for ${res.count} passengers at this stop. Guardian PINs activated.`, 'Stop Arrival');
    } else {
      showToast('info', 'No active students scheduled for drop-off at this stop.', 'Stop Arrival');
    }
    return res;
  };

  const overrideHandoverWithDispatcherApproval = (
    handoverId: string,
    authorizedAdultName: string,
    idProof: string,
    reason: string,
    adminName: string
  ) => {
    const res = storageService.overrideHandoverWithDispatcherApproval(handoverId, authorizedAdultName, idProof, reason, adminName);
    refreshAllState();
    if (res.success) {
      showToast('success', res.message, 'Safety Override Approved');
    } else {
      showToast('error', res.message, 'Override Failed');
    }
    return res;
  };

  const regenerateHandoverPin = (handoverId: string) => {
    const res = storageService.regenerateHandoverPin(handoverId);
    refreshAllState();
    if (res.success) {
      showToast('success', res.message, 'PIN Regenerated');
    } else {
      showToast('error', res.message, 'Regeneration Failed');
    }
    return res;
  };

  const confirmIndependentDismissal = (handoverId: string, driverId: string) => {
    const res = storageService.confirmIndependentDismissal(handoverId, driverId);
    refreshAllState();
    if (res.success) {
      showToast('success', res.message, 'Independent Dismissal Recorded');
    } else {
      showToast('error', res.message, 'Dismissal Error');
    }
    return res;
  };

  const confirmAuthorizedAdultHandover = (handoverId: string, adultName: string, driverId: string, adultRelation?: string) => {
    const res = storageService.confirmAuthorizedAdultHandover(handoverId, adultName, driverId, adultRelation);
    refreshAllState();
    if (res.success) {
      showToast('success', res.message, 'Handover to Adult Confirmed');
    } else {
      showToast('error', res.message, 'Verification Error');
    }
    return res;
  };

  const updateHandoverStatus = (handoverId: string, status: HandoverStatus, notes?: string) => {
    storageService.updateHandoverStatus(handoverId, status, notes);
    refreshAllState();
    showToast('info', `Handover status updated to: ${status}`, 'Handover Status');
  };

  // Simulated Notifications
  const markNotificationRead = (id: string) => {
    storageService.markNotificationRead(id);
    refreshAllState();
  };

  // Missed Boarding
  const acknowledgeMissedAlert = (alertId: string, notes?: string) => {
    storageService.acknowledgeMissedAlert(alertId, notes);
    refreshAllState();
    showToast('info', 'Missed boarding alert acknowledged.', 'Alert Acknowledged');
  };

  const resolveMissedAlert = (alertId: string, notes: string) => {
    storageService.resolveMissedAlert(alertId, notes);
    refreshAllState();
    showToast('success', 'Missed boarding incident marked resolved.', 'Alert Resolved');
  };

  // Pickup Readiness
  const setPickupReadiness = (record: PickupReadinessRecord) => {
    storageService.setPickupReadiness(record);
    refreshAllState();
    showToast('success', `Readiness set to: ${record.status}.`, 'Pickup Status Updated');
  };

  // Route Disruptions
  const reportDisruption = (disruption: Omit<RouteDisruption, 'id' | 'reportedAt'>) => {
    const res = storageService.reportDisruption(disruption);
    refreshAllState();
    const reporter = disruption.reportedBy ? disruption.reportedBy : 'Driver on duty';
    showToast(
      'warning',
      `Route disruption marked by ${reporter}: ${res.locationName} (${res.disruptionType}, +${res.estimatedDelayMin}m estimated delay). Detour advisories activated.`,
      'Route Disruption Alert',
      7000,
      'Disruption'
    );
    return res;
  };

  const updateDisruptionStatus = (disruptionId: string, status: RouteDisruption['status']) => {
    storageService.updateDisruptionStatus(disruptionId, status);
    refreshAllState();
    showToast('info', `Disruption status updated to: ${status}`, 'Advisory Updated');
  };

  // Trips
  const scheduleTrip = (trip: Omit<Trip, 'id' | 'tripCode'>) => {
    const res = storageService.scheduleTrip(trip);
    refreshAllState();
    showToast('success', `Trip ${res.tripCode} scheduled for ${res.session}.`, 'Trip Scheduled');
    return res;
  };

  const updateTrip = (trip: Trip) => {
    storageService.updateTrip(trip);
    refreshAllState();
    showToast('success', `Trip timetable for ${trip.tripCode} updated.`, 'Trip Updated');
  };

  const startTrip = (tripId: string) => {
    storageService.startTrip(tripId);
    refreshAllState();
    showToast('info', 'Simulated trip run started. Stops in progress.', 'Trip Started');
  };

  const delayTrip = (tripId: string, minutes: number, reason: string) => {
    storageService.delayTrip(tripId, minutes, reason);
    refreshAllState();
    showToast('warning', `Broadcast delay of +${minutes}m: ${reason}`, 'Traffic Delay Logged');
  };

  const completeTrip = (tripId: string) => {
    storageService.completeTrip(tripId);
    refreshAllState();
    showToast('success', 'Trip completed successfully and logged.', 'Trip Complete');
  };

  // Complaints
  const addComplaint = (complaint: Omit<Complaint, 'id' | 'complaintCode' | 'submissionDate'>) => {
    const res = storageService.addComplaint(complaint);
    refreshAllState();
    showToast(
      'info',
      `New complaint filed [${res.complaintCode}]: "${res.subject}" by ${res.submittedByName} (${res.category} • Priority: ${res.priority}).`,
      'New Complaint Registered',
      7000,
      'Complaint'
    );
    return res;
  };

  const updateComplaint = (complaint: Complaint) => {
    storageService.updateComplaint(complaint);
    refreshAllState();
    showToast('success', `Complaint ${complaint.complaintCode} status updated.`, 'Feedback Updated');
  };

  // Notices
  const addNotice = (notice: Omit<Notice, 'id'>) => {
    const res = storageService.addNotice(notice);
    refreshAllState();
    showToast('success', `Notice "${res.title}" published.`, 'Notice Broadcast');
    return res;
  };

  const updateNotice = (notice: Notice) => {
    storageService.updateNotice(notice);
    refreshAllState();
    showToast('success', `Notice updated.`, 'Notice Saved');
  };

  const deleteNotice = (id: string) => {
    storageService.deleteNotice(id);
    refreshAllState();
    showToast('info', 'Notice removed from bulletin.', 'Notice Deleted');
  };

  // Settings & Reset
  const updateSettings = (newSettings: SchoolSettings) => {
    storageService.saveSettings(newSettings);
    refreshAllState();
    showToast('success', 'School transport policies updated.', 'Settings Saved');
  };

  const resetAllData = () => {
    storageService.resetAllToDefaults();
    refreshAllState();
    showToast('warning', 'All application records restored to Coimbatore defaults.', 'System Reset');
  };

  return (
    <DataContext.Provider
      value={{
        buses,
        drivers,
        routes,
        students,
        allocations,
        attendance,
        trips,
        complaints,
        notices,
        settings,
        handovers,
        missedAlerts,
        readinessRecords,
        disruptions,
        parents,
        notifications,
        toasts,
        showToast,
        removeToast,
        language,
        setLanguage,
        getStudentsForParent,
        getStudentById,
        addStudent,
        updateStudent,
        deleteStudent,
        addParent,
        updateParent,
        deleteParent,
        linkChildToParent,
        unlinkChildFromParent,
        userAccounts,
        addUserAccount,
        updateUserAccount,
        deleteUserAccount,
        addBus,
        updateBus,
        deleteBus,
        getBusOccupancy,
        addDriver,
        updateDriver,
        deleteDriver,
        addRoute,
        updateRoute,
        deleteRoute,
        createAllocation,
        cancelAllocation,
        markAttendance,
        markArrivedAtDropoff,
        generateOrActivateHandoverPin,
        batchMarkArrivedAtStop,
        verifyHandoverPin,
        regenerateHandoverPin,
        overrideHandoverWithDispatcherApproval,
        confirmIndependentDismissal,
        confirmAuthorizedAdultHandover,
        updateHandoverStatus,
        markNotificationRead,
        acknowledgeMissedAlert,
        resolveMissedAlert,
        setPickupReadiness,
        reportDisruption,
        updateDisruptionStatus,
        scheduleTrip,
        updateTrip,
        startTrip,
        delayTrip,
        completeTrip,
        addComplaint,
        updateComplaint,
        addNotice,
        updateNotice,
        deleteNotice,
        updateSettings,
        resetAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
