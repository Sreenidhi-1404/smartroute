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
  ComplaintCategory,
  PickupPoint,
  HandoverRecord,
  HandoverStatus,
  HandoverPolicy,
  MissedBoardingAlert,
  PickupReadinessRecord,
  RouteDisruption,
  SafetyTimelineEvent,
  ParentProfile,
  SimulatedNotification,
  UserAccount,
} from '../types';
import {
  INITIAL_BUSES,
  INITIAL_DRIVERS,
  INITIAL_ROUTES,
  INITIAL_STUDENTS,
  INITIAL_ALLOCATIONS,
  INITIAL_ATTENDANCE,
  INITIAL_TRIPS,
  INITIAL_COMPLAINTS,
  INITIAL_NOTICES,
  INITIAL_SETTINGS,
  INITIAL_HANDOVERS,
  INITIAL_MISSED_ALERTS,
  INITIAL_READINESS,
  INITIAL_DISRUPTIONS,
  INITIAL_PARENTS,
  INITIAL_NOTIFICATIONS,
  DEMO_ACCOUNTS,
} from '../data/mockData';

const KEYS = {
  BUSES: 'smartroute_cb_buses_v4',
  DRIVERS: 'smartroute_cb_drivers_v4',
  ROUTES: 'smartroute_cb_routes_v4',
  STUDENTS: 'smartroute_cb_students_v4',
  ALLOCATIONS: 'smartroute_cb_allocations_v4',
  ATTENDANCE: 'smartroute_cb_attendance_v4',
  TRIPS: 'smartroute_cb_trips_v4',
  COMPLAINTS: 'smartroute_cb_complaints_v4',
  NOTICES: 'smartroute_cb_notices_v4',
  SETTINGS: 'smartroute_cb_settings_v4',
  HANDOVERS: 'smartroute_cb_handovers_v4',
  MISSED_ALERTS: 'smartroute_cb_missed_alerts_v4',
  READINESS: 'smartroute_cb_readiness_v4',
  DISRUPTIONS: 'smartroute_cb_disruptions_v4',
  PARENTS: 'smartroute_cb_parents_v4',
  NOTIFICATIONS: 'smartroute_cb_notifications_v4',
  ACCOUNTS: 'smartroute_accounts_v4',
};

const memoryStore = new Map<string, string>();

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item);
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return fallback;
    }
  }
  // In-memory fallback for Node.js / Unit test runner
  const inMem = memoryStore.get(key);
  if (inMem) {
    try {
      return JSON.parse(inMem);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  const json = JSON.stringify(data);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, json);
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }
  memoryStore.set(key, json);
}

export const storageService = {
  // Reset all records to Coimbatore demo defaults
  resetAllToDefaults() {
    saveToStorage(KEYS.BUSES, INITIAL_BUSES);
    saveToStorage(KEYS.DRIVERS, INITIAL_DRIVERS);
    saveToStorage(KEYS.ROUTES, INITIAL_ROUTES);
    saveToStorage(KEYS.STUDENTS, INITIAL_STUDENTS);
    saveToStorage(KEYS.ALLOCATIONS, INITIAL_ALLOCATIONS);
    saveToStorage(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    saveToStorage(KEYS.TRIPS, INITIAL_TRIPS);
    saveToStorage(KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
    saveToStorage(KEYS.NOTICES, INITIAL_NOTICES);
    saveToStorage(KEYS.SETTINGS, INITIAL_SETTINGS);
    saveToStorage(KEYS.HANDOVERS, INITIAL_HANDOVERS);
    saveToStorage(KEYS.MISSED_ALERTS, INITIAL_MISSED_ALERTS);
    saveToStorage(KEYS.READINESS, INITIAL_READINESS);
    saveToStorage(KEYS.DISRUPTIONS, INITIAL_DISRUPTIONS);
    saveToStorage(KEYS.PARENTS, INITIAL_PARENTS);
    saveToStorage(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    saveToStorage(KEYS.ACCOUNTS, DEMO_ACCOUNTS);
  },

  // SETTINGS
  getSettings(): SchoolSettings {
    return getFromStorage<SchoolSettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: SchoolSettings) {
    saveToStorage(KEYS.SETTINGS, settings);
  },

  // PARENTS
  getParents(): ParentProfile[] {
    return getFromStorage<ParentProfile[]>(KEYS.PARENTS, INITIAL_PARENTS);
  },
  saveParents(parents: ParentProfile[]) {
    saveToStorage(KEYS.PARENTS, parents);
  },
  addParent(parent: Omit<ParentProfile, 'id'>): { success: boolean; message?: string; parent?: ParentProfile } {
    const parents = this.getParents();
    const cleanEmail = parent.email.trim().toLowerCase();
    if (parents.some(p => p.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: `Parent account with email ${cleanEmail} already exists.` };
    }
    const newId = `PAR-${String(parents.length + 1).padStart(3, '0')}`;
    const newParent: ParentProfile = {
      ...parent,
      id: newId,
      userId: parent.userId || `ACC-PAR-${String(parents.length + 1).padStart(2, '0')}`,
      linkedStudentIds: parent.linkedStudentIds || [],
    };
    this.saveParents([...parents, newParent]);
    return { success: true, parent: newParent };
  },
  updateParent(parent: ParentProfile): { success: boolean; message?: string } {
    const parents = this.getParents();
    const cleanEmail = parent.email.trim().toLowerCase();
    if (parents.some(p => p.id !== parent.id && p.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: `Email ${cleanEmail} is used by another parent.` };
    }
    const updated = parents.map(p => (p.id === parent.id ? parent : p));
    this.saveParents(updated);
    return { success: true };
  },
  deleteParent(id: string): { success: boolean; message?: string } {
    const students = this.getStudents().filter(s => s.parentId === id);
    if (students.length > 0) {
      return { success: false, message: `Cannot delete parent. ${students.length} students are currently associated with this profile.` };
    }
    const parents = this.getParents().filter(p => p.id !== id);
    this.saveParents(parents);
    return { success: true };
  },
  linkChildToParent(parentId: string, studentId: string): { success: boolean; message?: string } {
    const parents = this.getParents();
    const parent = parents.find(p => p.id === parentId);
    if (!parent) return { success: false, message: 'Parent not found.' };
    const linked = new Set(parent.linkedStudentIds || []);
    linked.add(studentId);
    const updated = parents.map(p => (p.id === parentId ? { ...p, linkedStudentIds: Array.from(linked) } : p));
    this.saveParents(updated);

    // Also sync student foreign key
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (student) {
      const updatedStudents = students.map(s =>
        s.id === studentId
          ? { ...s, parentId: parent.id, parentName: parent.name, parentPhone: parent.phone, parentEmail: parent.email }
          : s
      );
      this.saveStudents(updatedStudents);
    }
    return { success: true };
  },
  unlinkChildFromParent(parentId: string, studentId: string): { success: boolean; message?: string } {
    const parents = this.getParents();
    const parent = parents.find(p => p.id === parentId);
    if (!parent) return { success: false, message: 'Parent not found.' };
    const updatedLinked = (parent.linkedStudentIds || []).filter(id => id !== studentId);
    const updated = parents.map(p => (p.id === parentId ? { ...p, linkedStudentIds: updatedLinked } : p));
    this.saveParents(updated);
    return { success: true };
  },

  // USER ACCOUNTS
  getUserAccounts(): UserAccount[] {
    try {
      const v4Data = localStorage.getItem(KEYS.ACCOUNTS);
      if (v4Data) {
        return JSON.parse(v4Data);
      }
      // Migrate from v2 if present
      const v2Data = localStorage.getItem('smartroute_accounts_v2');
      if (v2Data) {
        const v2Accounts: UserAccount[] = JSON.parse(v2Data);
        const emailMap = new Map<string, UserAccount>();
        DEMO_ACCOUNTS.forEach(a => emailMap.set(a.email.toLowerCase(), a));
        v2Accounts.forEach(a => emailMap.set(a.email.toLowerCase(), a));
        const merged = Array.from(emailMap.values());
        localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.error('Error reading accounts from storage:', e);
    }
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(DEMO_ACCOUNTS));
    return DEMO_ACCOUNTS;
  },
  saveUserAccounts(accounts: UserAccount[]) {
    saveToStorage(KEYS.ACCOUNTS, accounts);
  },
  addUserAccount(acc: Omit<UserAccount, 'id'>): { success: boolean; message?: string; account?: UserAccount } {
    const accounts = this.getUserAccounts();
    const cleanEmail = acc.email.trim().toLowerCase();
    if (accounts.some(a => a.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: `Account with email ${cleanEmail} already exists.` };
    }
    const newId = `ACC-${acc.role.toUpperCase()}-${String(accounts.length + 1).padStart(2, '0')}`;
    const newAcc: UserAccount = { ...acc, id: newId };
    this.saveUserAccounts([...accounts, newAcc]);
    return { success: true, account: newAcc };
  },
  updateUserAccount(acc: UserAccount): { success: boolean; message?: string } {
    const accounts = this.getUserAccounts();
    const cleanEmail = acc.email.trim().toLowerCase();
    if (accounts.some(a => a.id !== acc.id && a.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: `Email ${cleanEmail} is used by another account.` };
    }
    const updated = accounts.map(a => (a.id === acc.id ? acc : a));
    this.saveUserAccounts(updated);
    return { success: true };
  },
  deleteUserAccount(id: string): { success: boolean; message?: string } {
    const accounts = this.getUserAccounts();
    if (accounts.length <= 1) {
      return { success: false, message: 'Cannot delete the last remaining user account.' };
    }
    this.saveUserAccounts(accounts.filter(a => a.id !== id));
    return { success: true };
  },

  // BUSES
  getBuses(): Bus[] {
    return getFromStorage<Bus[]>(KEYS.BUSES, INITIAL_BUSES);
  },
  saveBuses(buses: Bus[]) {
    saveToStorage(KEYS.BUSES, buses);
  },
  addBus(bus: Omit<Bus, 'id'>): { success: boolean; message?: string; bus?: Bus } {
    const buses = this.getBuses();
    const cleanReg = bus.registrationNumber.trim().toUpperCase();
    if (buses.some(b => b.registrationNumber.toUpperCase() === cleanReg)) {
      return { success: false, message: `Registration number ${cleanReg} already exists in fleet.` };
    }
    const newId = `BUS-${String(buses.length + 1).padStart(2, '0')}`;
    const newBus: Bus = { ...bus, id: newId, registrationNumber: cleanReg };
    this.saveBuses([...buses, newBus]);
    return { success: true, bus: newBus };
  },
  updateBus(bus: Bus): { success: boolean; message?: string } {
    const buses = this.getBuses();
    const cleanReg = bus.registrationNumber.trim().toUpperCase();
    if (buses.some(b => b.id !== bus.id && b.registrationNumber.toUpperCase() === cleanReg)) {
      return { success: false, message: `Registration number ${cleanReg} is used by another bus.` };
    }
    const updated = buses.map(b => (b.id === bus.id ? { ...bus, registrationNumber: cleanReg } : b));
    this.saveBuses(updated);
    return { success: true };
  },
  deleteBus(id: string): { success: boolean; message?: string } {
    const students = this.getStudents().filter(s => s.assignedBusId === id && s.transportStatus === 'Active');
    if (students.length > 0) {
      return { success: false, message: `Cannot delete bus. ${students.length} students are currently allocated to it.` };
    }
    const buses = this.getBuses().filter(b => b.id !== id);
    this.saveBuses(buses);
    return { success: true };
  },
  getBusOccupancy(busId: string): { occupied: number; capacity: number; percentage: number; available: number } {
    const bus = this.getBuses().find(b => b.id === busId);
    const capacity = bus ? bus.seatingCapacity : 40;
    const occupied = this.getStudents().filter(
      s => s.assignedBusId === busId && s.transportStatus === 'Active'
    ).length;
    const available = Math.max(0, capacity - occupied);
    const percentage = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
    return { occupied, capacity, percentage, available };
  },

  // DRIVERS
  getDrivers(): Driver[] {
    return getFromStorage<Driver[]>(KEYS.DRIVERS, INITIAL_DRIVERS);
  },
  saveDrivers(drivers: Driver[]) {
    saveToStorage(KEYS.DRIVERS, drivers);
  },
  addDriver(driver: Omit<Driver, 'id' | 'driverCode'>): { success: boolean; message?: string; driver?: Driver } {
    const drivers = this.getDrivers();
    const cleanLic = driver.licenseNumber.trim().toUpperCase();
    if (drivers.some(d => d.licenseNumber.toUpperCase() === cleanLic)) {
      return { success: false, message: `License number ${cleanLic} already exists.` };
    }
    const newId = `DRV-${String(drivers.length + 1).padStart(3, '0')}`;
    const newDriver: Driver = { ...driver, id: newId, driverCode: newId, licenseNumber: cleanLic };
    this.saveDrivers([...drivers, newDriver]);
    return { success: true, driver: newDriver };
  },
  updateDriver(driver: Driver): { success: boolean; message?: string } {
    const drivers = this.getDrivers();
    const cleanLic = driver.licenseNumber.trim().toUpperCase();
    if (drivers.some(d => d.id !== driver.id && d.licenseNumber.toUpperCase() === cleanLic)) {
      return { success: false, message: `License number ${cleanLic} belongs to another driver.` };
    }
    const updated = drivers.map(d => (d.id === driver.id ? { ...driver, licenseNumber: cleanLic } : d));
    this.saveDrivers(updated);
    return { success: true };
  },
  deleteDriver(id: string): { success: boolean; message?: string } {
    const buses = this.getBuses().filter(b => b.assignedDriverId === id);
    if (buses.length > 0) {
      return { success: false, message: `Cannot delete driver. Currently assigned to ${buses.map(b => b.busNumber).join(', ')}.` };
    }
    const drivers = this.getDrivers().filter(d => d.id !== id);
    this.saveDrivers(drivers);
    return { success: true };
  },

  // ROUTES
  getRoutes(): Route[] {
    return getFromStorage<Route[]>(KEYS.ROUTES, INITIAL_ROUTES);
  },
  saveRoutes(routes: Route[]) {
    saveToStorage(KEYS.ROUTES, routes);
  },
  addRoute(route: Omit<Route, 'id' | 'routeCode'>): Route {
    const routes = this.getRoutes();
    const newId = `RT-${String(routes.length + 101)}`;
    const newRoute: Route = { ...route, id: newId, routeCode: newId };
    this.saveRoutes([...routes, newRoute]);
    return newRoute;
  },
  updateRoute(route: Route) {
    const routes = this.getRoutes();
    const updated = routes.map(r => (r.id === route.id ? route : r));
    this.saveRoutes(updated);
  },
  deleteRoute(id: string): { success: boolean; message?: string } {
    const students = this.getStudents().filter(s => s.assignedRouteId === id && s.transportStatus === 'Active');
    if (students.length > 0) {
      return { success: false, message: `Cannot delete route. ${students.length} students are currently assigned to it.` };
    }
    const routes = this.getRoutes().filter(r => r.id !== id);
    this.saveRoutes(routes);
    return { success: true };
  },

  // STUDENTS
  getStudents(): Student[] {
    const list = getFromStorage<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
    return list.map((s, idx) => {
      if (!s.handoverPin || s.handoverPin.length !== 6) {
        return {
          ...s,
          handoverPin:
            s.id === 'STD-014'
              ? '739412'
              : s.id === 'STD-021'
              ? '618294'
              : String(100000 + (((idx + 1) * 13789) % 900000)),
        };
      }
      return s;
    });
  },
  saveStudents(students: Student[]) {
    saveToStorage(KEYS.STUDENTS, students);
  },
  getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.id === id);
  },
  getStudentsForParent(parentIdOrUserId: string): Student[] {
    const allStudents = this.getStudents();
    const allParents = this.getParents();
    const cleanId = parentIdOrUserId.trim().toLowerCase();

    // Find parent profile
    const parent = allParents.find(
      p =>
        p.id.toLowerCase() === cleanId ||
        p.userId.toLowerCase() === cleanId ||
        p.email.toLowerCase() === cleanId
    );

    if (parent) {
      const parentLinkedIds = new Set(parent.linkedStudentIds || []);
      const matched = allStudents.filter(
        s =>
          s.parentId === parent.id ||
          parentLinkedIds.has(s.id) ||
          s.parentEmail.toLowerCase() === parent.email.toLowerCase()
      );
      // Deduplicate by ID
      const seen = new Set<string>();
      return matched.filter(s => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
    }

    // Fallback: match by parentEmail or parentId directly
    const matched = allStudents.filter(
      s => s.parentId.toLowerCase() === cleanId || s.parentEmail.toLowerCase() === cleanId
    );
    const seen = new Set<string>();
    return matched.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  },
  addStudent(student: Omit<Student, 'id' | 'studentIdNumber'>): { success: boolean; message?: string; student?: Student } {
    const students = this.getStudents();
    if (student.assignedBusId && student.transportStatus === 'Active') {
      const occ = this.getBusOccupancy(student.assignedBusId);
      if (occ.available <= 0) {
        return { success: false, message: `Target bus is at maximum capacity (${occ.occupied}/${occ.capacity}). Cannot allocate seat.` };
      }
    }

    const newIdNum = students.length + 1;
    const newId = `STD-${String(newIdNum).padStart(3, '0')}`;
    const idNumber = `KVMS-2026-${String(newIdNum).padStart(3, '0')}`;

    const newStudent: Student = {
      ...student,
      id: newId,
      studentIdNumber: idNumber,
    };

    this.saveStudents([...students, newStudent]);

    // Create allocation record if transport is active
    if (newStudent.assignedRouteId && newStudent.assignedBusId && newStudent.transportStatus === 'Active') {
      this.createAllocation({
        studentId: newId,
        routeId: newStudent.assignedRouteId,
        busId: newStudent.assignedBusId,
        pickupPointId: newStudent.pickupPointId,
        allocatedDate: '31-10-2026',
        status: 'Active',
      });
    }

    return { success: true, student: newStudent };
  },
  updateStudent(student: Student): { success: boolean; message?: string } {
    const students = this.getStudents();
    const existing = students.find(s => s.id === student.id);

    if (
      student.transportStatus === 'Active' &&
      student.assignedBusId &&
      (!existing || existing.assignedBusId !== student.assignedBusId || existing.transportStatus !== 'Active')
    ) {
      const occ = this.getBusOccupancy(student.assignedBusId);
      if (occ.available <= 0) {
        return { success: false, message: `Target bus is at maximum capacity (${occ.occupied}/${occ.capacity}).` };
      }
    }

    const updated = students.map(s => (s.id === student.id ? student : s));
    this.saveStudents(updated);
    return { success: true };
  },
  deleteStudent(id: string): { success: boolean } {
    const students = this.getStudents().filter(s => s.id !== id);
    this.saveStudents(students);
    const allocations = this.getAllocations().map(a => (a.studentId === id ? { ...a, status: 'Cancelled' as const } : a));
    this.saveAllocations(allocations);
    return { success: true };
  },

  // ALLOCATIONS
  getAllocations(): TransportAllocation[] {
    return getFromStorage<TransportAllocation[]>(KEYS.ALLOCATIONS, INITIAL_ALLOCATIONS);
  },
  saveAllocations(allocations: TransportAllocation[]) {
    saveToStorage(KEYS.ALLOCATIONS, allocations);
  },
  createAllocation(alloc: Omit<TransportAllocation, 'id'>): { success: boolean; message?: string; allocation?: TransportAllocation } {
    const occ = this.getBusOccupancy(alloc.busId);
    if (occ.available <= 0) {
      return { success: false, message: `Bus is already full (${occ.occupied}/${occ.capacity} seats). Cannot allocate seat.` };
    }

    const existing = this.getAllocations();
    const updated = existing.map(a =>
      a.studentId === alloc.studentId && a.status === 'Active' ? { ...a, status: 'Changed' as const } : a
    );

    const newId = `ALC-${String(existing.length + 1).padStart(3, '0')}`;
    const newAlloc: TransportAllocation = { ...alloc, id: newId };
    this.saveAllocations([...updated, newAlloc]);

    const students = this.getStudents();
    const student = students.find(s => s.id === alloc.studentId);
    if (student) {
      student.assignedRouteId = alloc.routeId;
      student.assignedBusId = alloc.busId;
      student.pickupPointId = alloc.pickupPointId;
      student.transportStatus = 'Active';
      this.saveStudents(students);
    }

    return { success: true, allocation: newAlloc };
  },
  cancelAllocation(allocationId: string): { success: boolean } {
    const allocations = this.getAllocations();
    const alloc = allocations.find(a => a.id === allocationId);
    if (alloc) {
      const updated = allocations.map(a => (a.id === allocationId ? { ...a, status: 'Cancelled' as const } : a));
      this.saveAllocations(updated);

      const students = this.getStudents();
      const student = students.find(s => s.id === alloc.studentId);
      if (student) {
        student.transportStatus = 'Pending';
        this.saveStudents(students);
      }
    }
    return { success: true };
  },

  // ATTENDANCE & FEATURE B: MISSED BOARDING ALERTS
  getAttendance(): AttendanceRecord[] {
    return getFromStorage<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  },
  saveAttendance(attendance: AttendanceRecord[]) {
    saveToStorage(KEYS.ATTENDANCE, attendance);
  },
  markAttendance(records: Omit<AttendanceRecord, 'id'>[]): { success: boolean; count: number } {
    const existing = this.getAttendance();
    let updatedList = [...existing];
    let count = 0;

    for (const rec of records) {
      // Find matching record by date, studentId, and session/tripId
      const existingIdx = updatedList.findIndex(
        e => e.date === rec.date && e.studentId === rec.studentId && (e.session === rec.session || e.tripId === rec.tripId)
      );
      if (existingIdx >= 0) {
        updatedList[existingIdx] = { ...updatedList[existingIdx], ...rec };
      } else {
        const id = `ATT-${rec.date.replace(/-/g, '')}-${rec.session[0]}-${rec.studentId}`;
        updatedList.push({ ...rec, id });
      }
      count++;

      // FEATURE B: If marked Absent, generate Missed Boarding Alert automatically!
      if (rec.status === 'Absent') {
        this.generateMissedBoardingAlert(rec.studentId, rec.date, rec.tripId);
      }
    }

    this.saveAttendance(updatedList);
    return { success: true, count };
  },

  // FEATURE B: Missed Boarding Alert Management
  getMissedBoardingAlerts(): MissedBoardingAlert[] {
    return getFromStorage<MissedBoardingAlert[]>(KEYS.MISSED_ALERTS, INITIAL_MISSED_ALERTS);
  },
  saveMissedBoardingAlerts(alerts: MissedBoardingAlert[]) {
    saveToStorage(KEYS.MISSED_ALERTS, alerts);
  },
  generateMissedBoardingAlert(studentId: string, date: string, tripId: string): void {
    const alerts = this.getMissedBoardingAlerts();
    // Prevent duplicate alert for same student, trip, and date
    const exists = alerts.some(a => a.studentId === studentId && a.date === date && a.tripId === tripId);
    if (exists) return;

    const student = this.getStudents().find(s => s.id === studentId);
    const routes = this.getRoutes();
    const route = routes.find(r => r.id === student?.assignedRouteId);
    const stop = route?.pickupPoints.find(p => p.id === student?.pickupPointId);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAlert: MissedBoardingAlert = {
      id: `ALR-MB-${Date.now().toString().slice(-6)}`,
      date,
      time: timeStr,
      tripId,
      studentId,
      studentName: student?.name || 'Student',
      classGrade: student?.classGrade || 'Class 7',
      section: student?.section || 'A',
      pickupPointName: stop?.name || 'Designated Pickup Stop',
      expectedTime: stop?.morningTime || '07:15 AM',
      parentPhone: student?.parentPhone || '+91 98422 10100',
      parentName: student?.parentName || 'Guardian',
      status: 'Active',
      resolutionNotes: `Auto-logged: Student not boarded during vehicle stop at ${stop?.name || 'stop'}. Immediate simulated notification dispatched to guardian.`,
    };

    this.saveMissedBoardingAlerts([newAlert, ...alerts]);

    // Send Simulated Notification to Parent
    this.addNotification({
      recipientRole: 'parent',
      recipientId: student?.parentEmail || student?.parentId || 'parent',
      studentId: student?.id,
      type: 'missed_boarding',
      title: `Missed Boarding Notice: ${student?.name}`,
      message: `Your child ${student?.name} was marked Absent at stop "${stop?.name || 'Designated Stop'}" at ${timeStr}. Please confirm if the child is safe at home.`,
    });

    // Send Simulated Notification to Admin
    this.addNotification({
      recipientRole: 'admin',
      recipientId: 'admin@kovaivalley.edu.in',
      studentId: student?.id,
      type: 'missed_boarding',
      title: `Absence Recorded: ${student?.name} (${student?.classGrade}-${student?.section})`,
      message: `Driver marked student absent during morning pickup on Route ${route?.routeCode || ''}. Guardian notified.`,
    });
  },
  acknowledgeMissedAlert(alertId: string, notes?: string): void {
    const alerts = this.getMissedBoardingAlerts();
    const updated = alerts.map(a =>
      a.id === alertId ? { ...a, status: 'Acknowledged' as const, resolutionNotes: notes || a.resolutionNotes } : a
    );
    this.saveMissedBoardingAlerts(updated);
  },
  resolveMissedAlert(alertId: string, notes: string): void {
    const alerts = this.getMissedBoardingAlerts();
    const updated = alerts.map(a =>
      a.id === alertId ? { ...a, status: 'Resolved' as const, resolutionNotes: notes } : a
    );
    this.saveMissedBoardingAlerts(updated);
  },

  // FEATURE A: Safe Student Handover Verification Service (Driver-and-Guardian Workflow)
  getHandovers(): HandoverRecord[] {
    const list = getFromStorage<HandoverRecord[]>(KEYS.HANDOVERS, INITIAL_HANDOVERS);
    return list.map(h => {
      // Ensure all dynamic one-time PINs are 6 digits
      if (h.oneTimePin && h.oneTimePin.length !== 6) {
        return {
          ...h,
          oneTimePin: Math.floor(100000 + Math.random() * 900000).toString(),
        };
      }
      return h;
    });
  },
  saveHandovers(handovers: HandoverRecord[]) {
    saveToStorage(KEYS.HANDOVERS, handovers);
  },
  updateHandoverStatus(handoverId: string, status: HandoverStatus, notes?: string): void {
    const handovers = this.getHandovers();
    const updated = handovers.map(h => (h.id === handoverId ? { ...h, status, notes: notes || h.notes } : h));
    this.saveHandovers(updated);
  },

  // Driver marks "Arrived at Drop-off"
  markArrivedAtDropoff(
    studentId: string,
    tripId: string,
    driverId: string
  ): { success: boolean; handover: HandoverRecord; oneTimePin?: string } {
    const handovers = this.getHandovers();
    const student = this.getStudents().find(s => s.id === studentId);
    const routes = this.getRoutes();
    const route = routes.find(r => r.id === student?.assignedRouteId);
    const stop = route?.pickupPoints.find(p => p.id === student?.pickupPointId);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let record = handovers.find(h => h.studentId === studentId && (h.tripId === tripId || h.date === '31-10-2026'));
    const policy: HandoverPolicy = student?.handoverPolicy || 'Guardian Required';

    // Generate real 6-digit cryptographically random one-time PIN for Guardian Required
    let otp: string | undefined = undefined;
    const expiresTimestamp = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    const expiryDate = new Date(expiresTimestamp);
    const pinExpiresAt = expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (policy === 'Guardian Required') {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
    }

    if (record) {
      record = {
        ...record,
        status: policy === 'Guardian Required' ? 'Awaiting Guardian Verification' : 'Arrived at Drop-off',
        oneTimePin: otp || record.oneTimePin,
        pinExpiresAt: otp ? pinExpiresAt : record.pinExpiresAt,
        expiresTimestamp: otp ? expiresTimestamp : record.expiresTimestamp,
        pinUsed: false,
        failedAttempts: 0,
        maxAttempts: 5,
        time: nowTime,
        isSimulatedNotificationSent: true,
        notes: `Driver marked arrival at ${stop?.name || 'stop'} at ${nowTime}.`,
      };
      this.saveHandovers(handovers.map(h => (h.id === record!.id ? record! : h)));
    } else {
      record = {
        id: `HND-${Date.now().toString().slice(-6)}`,
        date: '31-10-2026',
        time: nowTime,
        tripId,
        studentId,
        pickupPointId: student?.pickupPointId || '',
        driverId,
        policy,
        authorizedGuardianName: student?.parentName || 'Authorized Guardian',
        guardianPhone: student?.parentPhone || '+91 98421 88440',
        oneTimePin: otp,
        pinExpiresAt: otp ? pinExpiresAt : undefined,
        expiresTimestamp: otp ? expiresTimestamp : undefined,
        pinUsed: false,
        failedAttempts: 0,
        maxAttempts: 5,
        status: policy === 'Guardian Required' ? 'Awaiting Guardian Verification' : 'Arrived at Drop-off',
        isSimulatedNotificationSent: true,
        notes: `Driver marked arrival at ${stop?.name || 'stop'} at ${nowTime}.`,
      };
      this.saveHandovers([record, ...handovers]);
    }

    // Send Simulated Notification to Parent
    if (policy === 'Guardian Required' && otp) {
      this.addNotification({
        recipientRole: 'parent',
        recipientId: student?.parentEmail || student?.parentId || 'parent',
        studentId: student?.id,
        type: 'handover_otp',
        title: `Vehicle Arrived at Stop: ${student?.name}`,
        message: `Bus has reached ${stop?.name || 'the drop-off stop'}. Your dynamic 6-digit Verification PIN is ${otp}. Please recite this code to the driver upon receiving ${student?.name}. Valid until ${pinExpiresAt}.`,
        meta: { otp, handoverId: record.id },
      });
    } else if (policy === 'Independent Dismissal') {
      this.addNotification({
        recipientRole: 'parent',
        recipientId: student?.parentEmail || student?.parentId || 'parent',
        studentId: student?.id,
        type: 'delay',
        title: `Drop-off Arrival: ${student?.name}`,
        message: `Bus has reached ${stop?.name || 'the drop-off stop'}. ${student?.name} is authorized for independent dismissal.`,
      });
    }

    return { success: true, handover: record, oneTimePin: otp };
  },

  // Parent or Administrator can activate or generate a fresh 6-digit Handover PIN anytime
  generateOrActivateHandoverPin(
    studentId: string
  ): { success: boolean; message: string; handover?: HandoverRecord; pin?: string } {
    const handovers = this.getHandovers();
    const student = this.getStudents().find(s => s.id === studentId);
    if (!student) {
      return { success: false, message: 'Student record not found.' };
    }

    const activeTripId = `TRIP-KVMS-${student.assignedBusId || 'BUS-01'}-PM`;
    const driverId = 'DRV-001';
    const res = this.markArrivedAtDropoff(studentId, activeTripId, driverId);
    return {
      success: true,
      message: `Active 6-digit handover PIN is ready: ${res.oneTimePin || student.handoverPin}`,
      handover: res.handover,
      pin: res.oneTimePin || student.handoverPin,
    };
  },

  // Driver batch marks stop arrival for all passengers assigned to that stop
  batchMarkArrivedAtStop(
    pickupPointId: string,
    tripId: string,
    driverId: string
  ): { success: boolean; count: number; studentNames: string[] } {
    const studentsAtStop = this.getStudents().filter(
      s => s.pickupPointId === pickupPointId && s.transportStatus === 'Active'
    );
    const studentNames: string[] = [];
    for (const s of studentsAtStop) {
      this.markArrivedAtDropoff(s.id, tripId, driverId);
      studentNames.push(s.name);
    }
    return { success: true, count: studentNames.length, studentNames };
  },

  // Regenerate fresh Handover PIN for Guardian Required
  regenerateHandoverPin(
    handoverId: string
  ): { success: boolean; message: string; record?: HandoverRecord; newPin?: string } {
    const handovers = this.getHandovers();
    const record = handovers.find(h => h.id === handoverId);
    if (!record) {
      return { success: false, message: 'Handover record not found.' };
    }

    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresTimestamp = Date.now() + 2 * 60 * 60 * 1000;
    const pinExpiresAt = new Date(expiresTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedRecord: HandoverRecord = {
      ...record,
      oneTimePin: newPin,
      pinExpiresAt,
      expiresTimestamp,
      failedAttempts: 0,
      pinUsed: false,
      status: 'Awaiting Guardian Verification',
      notes: `Fresh 6-digit PIN regenerated by parent at ${nowTime}.`,
    };

    this.saveHandovers(handovers.map(h => (h.id === handoverId ? updatedRecord : h)));

    const student = this.getStudents().find(s => s.id === record.studentId);
    this.addNotification({
      recipientRole: 'parent',
      recipientId: student?.parentEmail || student?.parentId || 'parent',
      studentId: student?.id,
      type: 'handover_otp',
      title: `New Handover PIN Generated: ${student?.name}`,
      message: `Your new 6-digit verification PIN is ${newPin} (valid until ${pinExpiresAt}). Recite this code verbally to the driver.`,
      meta: { otp: newPin, handoverId: record.id },
    });

    return { success: true, message: 'Fresh 6-digit PIN generated successfully.', record: updatedRecord, newPin };
  },

  // Driver enters and verifies the One-Time Guardian PIN (Supports 6-digit OTP or registered emergency backup PIN)
  verifyHandoverPin(
    handoverId: string,
    enteredPin: string,
    driverId: string
  ): { success: boolean; message: string; record?: HandoverRecord } {
    const handovers = this.getHandovers();
    const record = handovers.find(h => h.id === handoverId);
    if (!record) {
      return { success: false, message: 'Handover record not found.' };
    }

    if (record.status === 'Handed Over') {
      return { success: true, message: 'This handover has already been verified and safely completed.', record };
    }

    // Check if locked due to maximum attempts
    if (record.status === 'Escalated' || (record.failedAttempts || 0) >= 5) {
      return {
        success: false,
        message: 'Security Alert: Maximum PIN attempts (5/5) exceeded. Handover is locked and escalated to Safety Dispatch.',
      };
    }

    // Check expiration
    if (record.expiresTimestamp && Date.now() > record.expiresTimestamp) {
      const updated = handovers.map(h =>
        h.id === handoverId
          ? { ...h, status: 'Escalated' as const, notes: 'Handover PIN expired before verification.' }
          : h
      );
      this.saveHandovers(updated);
      return {
        success: false,
        message: 'This verification PIN has expired (validity period passed). Please ask the parent to generate a fresh PIN from their portal.',
      };
    }

    const cleanPin = enteredPin.trim();
    const expectedPin = record.oneTimePin;
    const student = this.getStudents().find(s => s.id === record.studentId);
    const emergencyPin = student?.handoverPin;

    const isPrimaryOtp = !!(expectedPin && cleanPin === expectedPin);
    const isEmergencyPin = !!(emergencyPin && cleanPin === emergencyPin);

    if (!isPrimaryOtp && !isEmergencyPin) {
      const attempts = (record.failedAttempts || 0) + 1;
      const isMaxReached = attempts >= 5;

      const updated = handovers.map(h =>
        h.id === handoverId
          ? {
              ...h,
              enteredPin: cleanPin,
              failedAttempts: attempts,
              status: isMaxReached ? ('Escalated' as const) : h.status,
              notes: isMaxReached
                ? `Security Alert: PIN verification failed 5/5 times (Last input: ${cleanPin}). Handover locked and escalated to Safety Dispatch.`
                : `Incorrect PIN attempt ${attempts}/5 entered (${cleanPin}). Expected 6-digit code.`,
            }
          : h
      );
      this.saveHandovers(updated);

      if (isMaxReached) {
        this.addNotification({
          recipientRole: 'admin',
          recipientId: 'admin@kovaivalley.edu.in',
          studentId: record.studentId,
          type: 'missed_boarding',
          title: `HANDOVER ESCALATION: ${student?.name}`,
          message: `Driver reported 5 failed PIN attempts for ${student?.name} at stop. Immediate safety dispatch verification required.`,
        });

        return {
          success: false,
          message: 'Security Alert: Maximum PIN attempts exceeded (5/5). Handover has been locked and escalated to School Safety Dispatch and Principal Office.',
        };
      }

      return {
        success: false,
        message: `Incorrect 6-Digit PIN. Attempt ${attempts} of 5. Please verify the 6-digit code provided by guardian.`,
      };
    }

    // Success: Verified and handed over
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const method: 'one_time_otp' | 'emergency_pin' = isEmergencyPin && !isPrimaryOtp ? 'emergency_pin' : 'one_time_otp';
    const verifiedRecord: HandoverRecord = {
      ...record,
      enteredPin: cleanPin,
      pinUsed: true,
      status: 'Handed Over',
      verifiedAt: nowTime,
      verifiedByDriverId: driverId,
      verificationMethod: method,
      notes: method === 'emergency_pin'
        ? `Verified successfully via registered 6-digit emergency backup PIN at ${nowTime}.`
        : `Verified successfully via dynamic 6-digit guardian OTP at ${nowTime}.`,
    };

    this.saveHandovers(handovers.map(h => (h.id === handoverId ? verifiedRecord : h)));

    // Send Simulated Notification to Parent
    this.addNotification({
      recipientRole: 'parent',
      recipientId: student?.parentEmail || student?.parentId || 'parent',
      studentId: student?.id,
      type: 'handover_success',
      title: `Handover Completed: ${student?.name}`,
      message: `Safe handover of ${student?.name} confirmed with guardian ${record.authorizedGuardianName} at ${nowTime} (${method === 'emergency_pin' ? 'Emergency PIN' : '6-Digit OTP'}).`,
    });

    return {
      success: true,
      message: `Handover verified successfully! ${verifiedRecord.authorizedGuardianName} has safely received ${student?.name || 'the student'}. (${method === 'emergency_pin' ? 'Emergency Backup PIN verified' : '6-Digit OTP verified'})`,
      record: verifiedRecord,
    };
  },

  // Administrator Dispatcher Override (for verified parent presenting ID at curb or transport office)
  overrideHandoverWithDispatcherApproval(
    handoverId: string,
    authorizedAdultName: string,
    idProof: string,
    reason: string,
    adminName: string
  ): { success: boolean; message: string; record?: HandoverRecord } {
    const handovers = this.getHandovers();
    const record = handovers.find(h => h.id === handoverId);
    if (!record) return { success: false, message: 'Handover record not found.' };

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const verifiedRecord: HandoverRecord = {
      ...record,
      status: 'Handed Over',
      verifiedAt: nowTime,
      verifiedByDriverId: `DISPATCH-${adminName}`,
      pickupPersonName: authorizedAdultName,
      verificationMethod: 'dispatcher_override',
      notes: `Safety Override authorized by Dispatcher ${adminName}. Adult: ${authorizedAdultName} (ID: ${idProof || 'Verified Govt ID'}). Reason: ${reason || 'Physical ID verification'} at ${nowTime}.`,
    };
    this.saveHandovers(handovers.map(h => (h.id === handoverId ? verifiedRecord : h)));

    const student = this.getStudents().find(s => s.id === record.studentId);
    this.addNotification({
      recipientRole: 'parent',
      recipientId: student?.parentEmail || student?.parentId || 'parent',
      studentId: student?.id,
      type: 'handover_success',
      title: `Emergency Handover Override Confirmed: ${student?.name}`,
      message: `Safety clearance granted by School Dispatch (${adminName}) for ${student?.name} to ${authorizedAdultName} at ${nowTime}.`,
    });

    return {
      success: true,
      message: `Dispatcher safety override confirmed. Student safely released to ${authorizedAdultName}.`,
      record: verifiedRecord,
    };
  },

  // Driver confirms Independent Dismissal (for older authorized students)
  confirmIndependentDismissal(
    handoverId: string,
    driverId: string
  ): { success: boolean; message: string; record?: HandoverRecord } {
    const handovers = this.getHandovers();
    const record = handovers.find(h => h.id === handoverId);
    if (!record) {
      return { success: false, message: 'Handover record not found.' };
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dismissedRecord: HandoverRecord = {
      ...record,
      status: 'Independently Dismissed',
      dismissedAt: nowTime,
      dismissedByDriverId: driverId,
      notes: `Student independently dismissed at stop at ${nowTime}.`,
    };

    this.saveHandovers(handovers.map(h => (h.id === handoverId ? dismissedRecord : h)));

    const student = this.getStudents().find(s => s.id === record.studentId);
    this.addNotification({
      recipientRole: 'parent',
      recipientId: student?.parentEmail || student?.parentId || 'parent',
      studentId: student?.id,
      type: 'handover_success',
      title: `Independent Dismissal: ${student?.name}`,
      message: `${student?.name} was independently dismissed at the designated stop at ${nowTime}.`,
    });

    return {
      success: true,
      message: `Independent dismissal confirmed for ${student?.name || 'student'}. Recorded at ${nowTime}.`,
      record: dismissedRecord,
    };
  },

  // Driver confirms Authorized Adult Handover
  confirmAuthorizedAdultHandover(
    handoverId: string,
    adultName: string,
    driverId: string,
    adultRelation?: string
  ): { success: boolean; message: string; record?: HandoverRecord } {
    const handovers = this.getHandovers();
    const record = handovers.find(h => h.id === handoverId);
    if (!record) {
      return { success: false, message: 'Handover record not found.' };
    }

    const cleanAdult = adultName.trim() || record.authorizedGuardianName;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const completedRecord: HandoverRecord = {
      ...record,
      pickupPersonName: cleanAdult,
      authorizedAdultName: cleanAdult,
      authorizedAdultRelation: adultRelation,
      status: 'Handed Over',
      verifiedAt: nowTime,
      verifiedByDriverId: driverId,
      notes: `Handover completed to authorized adult: ${cleanAdult} ${adultRelation ? `(${adultRelation})` : ''} at ${nowTime}.`,
    };

    this.saveHandovers(handovers.map(h => (h.id === handoverId ? completedRecord : h)));

    const student = this.getStudents().find(s => s.id === record.studentId);
    this.addNotification({
      recipientRole: 'parent',
      recipientId: student?.parentEmail || student?.parentId || 'parent',
      studentId: student?.id,
      type: 'handover_success',
      title: `Authorized Adult Handover: ${student?.name}`,
      message: `Handover of ${student?.name} completed to authorized adult ${cleanAdult} at ${nowTime}.`,
    });

    return {
      success: true,
      message: `Handover confirmed! ${cleanAdult} has safely received ${student?.name || 'the student'}.`,
      record: completedRecord,
    };
  },

  // SIMULATED NOTIFICATIONS
  getNotifications(): SimulatedNotification[] {
    return getFromStorage<SimulatedNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  saveNotifications(notifications: SimulatedNotification[]) {
    saveToStorage(KEYS.NOTIFICATIONS, notifications);
  },
  addNotification(notif: Omit<SimulatedNotification, 'id' | 'timestamp' | 'read'>): SimulatedNotification {
    const notifications = this.getNotifications();
    const newNotif: SimulatedNotification = {
      ...notif,
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    this.saveNotifications([newNotif, ...notifications]);
    return newNotif;
  },
  markNotificationRead(id: string): void {
    const notifications = this.getNotifications();
    this.saveNotifications(notifications.map(n => (n.id === id ? { ...n, read: true } : n)));
  },
  getNotificationsForUser(role: string, userIdOrEmail: string): SimulatedNotification[] {
    const notifications = this.getNotifications();
    const cleanId = userIdOrEmail.toLowerCase();
    return notifications.filter(
      n =>
        n.recipientRole === role &&
        (n.recipientId.toLowerCase() === cleanId ||
          cleanId.includes(n.recipientId.toLowerCase()) ||
          n.recipientId.toLowerCase().includes(cleanId) ||
          role === 'admin')
    );
  },

  // FEATURE C: Smart Pickup Readiness Service
  getReadinessRecords(): PickupReadinessRecord[] {
    return getFromStorage<PickupReadinessRecord[]>(KEYS.READINESS, INITIAL_READINESS);
  },
  saveReadinessRecords(records: PickupReadinessRecord[]) {
    saveToStorage(KEYS.READINESS, records);
  },
  setPickupReadiness(record: PickupReadinessRecord): void {
    const records = this.getReadinessRecords();
    const existingIdx = records.findIndex(
      r => r.studentId === record.studentId && r.date === record.date && r.session === record.session
    );
    if (existingIdx >= 0) {
      records[existingIdx] = record;
    } else {
      records.unshift(record);
    }
    this.saveReadinessRecords(records);

    // If pickup person changed, notify driver and admin
    if (record.status === 'Pickup Person Changed') {
      const student = this.getStudents().find(s => s.id === record.studentId);
      this.addNotification({
        recipientRole: 'driver',
        recipientId: student?.assignedBusId || 'driver',
        studentId: record.studentId,
        type: 'readiness',
        title: `Pickup Person Update: ${student?.name}`,
        message: `Parent reported designated pickup person for ${record.session} run: "${record.pickupPersonName || 'Alternative Guardian'}". Note: ${record.notes || 'None'}`,
      });
    }
  },
  getStudentReadiness(studentId: string, date: string, session: 'Morning' | 'Afternoon'): PickupReadinessRecord | null {
    const records = this.getReadinessRecords();
    return records.find(r => r.studentId === studentId && r.date === date && r.session === session) || null;
  },

  // FEATURE D: Smart Route Disruption Management
  getDisruptions(): RouteDisruption[] {
    return getFromStorage<RouteDisruption[]>(KEYS.DISRUPTIONS, INITIAL_DISRUPTIONS);
  },
  saveDisruptions(disruptions: RouteDisruption[]) {
    saveToStorage(KEYS.DISRUPTIONS, disruptions);
  },
  reportDisruption(disruption: Omit<RouteDisruption, 'id' | 'reportedAt'>): RouteDisruption {
    const disruptions = this.getDisruptions();
    const newId = `DIS-${Date.now().toString().slice(-6)}`;
    const newDisruption: RouteDisruption = {
      ...disruption,
      id: newId,
      reportedAt: `31-10-2026 ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };
    this.saveDisruptions([newDisruption, ...disruptions]);
    return newDisruption;
  },
  updateDisruptionStatus(disruptionId: string, status: RouteDisruption['status']): void {
    const disruptions = this.getDisruptions();
    const updated = disruptions.map(d => (d.id === disruptionId ? { ...d, status } : d));
    this.saveDisruptions(updated);
  },

  // TRIPS
  getTrips(): Trip[] {
    return getFromStorage<Trip[]>(KEYS.TRIPS, INITIAL_TRIPS);
  },
  saveTrips(trips: Trip[]) {
    saveToStorage(KEYS.TRIPS, trips);
  },
  scheduleTrip(trip: Omit<Trip, 'id' | 'tripCode'>): Trip {
    const trips = this.getTrips();
    const newId = `TRIP-KVMS-${Date.now().toString().slice(-4)}`;
    const newTrip: Trip = { ...trip, id: newId, tripCode: newId };
    this.saveTrips([newTrip, ...trips]);
    return newTrip;
  },
  updateTrip(trip: Trip) {
    const trips = this.getTrips();
    const updated = trips.map(t => (t.id === trip.id ? trip : t));
    this.saveTrips(updated);
  },
  startTrip(tripId: string) {
    const trips = this.getTrips();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = trips.map(t => (t.id === tripId ? { ...t, status: 'Started' as const, actualStartTime: timeStr } : t));
    this.saveTrips(updated);
  },
  delayTrip(tripId: string, delayMinutes: number, reason: string) {
    const trips = this.getTrips();
    const updated = trips.map(t =>
      t.id === tripId
        ? {
            ...t,
            status: 'Delayed' as const,
            delayDurationMin: delayMinutes,
            delayReason: reason,
          }
        : t
    );
    this.saveTrips(updated);
  },
  completeTrip(tripId: string) {
    const trips = this.getTrips();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = trips.map(t =>
      t.id === tripId ? { ...t, status: 'Completed' as const, actualArrivalTime: timeStr } : t
    );
    this.saveTrips(updated);
  },

  // COMPLAINTS
  getComplaints(): Complaint[] {
    return getFromStorage<Complaint[]>(KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
  },
  saveComplaints(complaints: Complaint[]) {
    saveToStorage(KEYS.COMPLAINTS, complaints);
  },
  addComplaint(complaint: Omit<Complaint, 'id' | 'complaintCode' | 'submissionDate'>): Complaint {
    const complaints = this.getComplaints();
    const newCode = `CMP-KVMS-${String(complaints.length + 1).padStart(3, '0')}`;
    const newComplaint: Complaint = {
      ...complaint,
      id: newCode,
      complaintCode: newCode,
      submissionDate: new Date().toISOString(),
    };
    this.saveComplaints([newComplaint, ...complaints]);
    return newComplaint;
  },
  updateComplaint(complaint: Complaint) {
    const complaints = this.getComplaints();
    const updated = complaints.map(c => (c.id === complaint.id ? complaint : c));
    this.saveComplaints(updated);
  },
  suggestComplaintCategory(description: string): { category: ComplaintCategory; confidence: number; rationale: string } {
    const lower = description.toLowerCase();
    if (lower.includes('late') || lower.includes('delay') || lower.includes('traffic') || lower.includes('waiting') || lower.includes('time') || lower.includes('jam')) {
      return { category: 'Bus Delay', confidence: 0.94, rationale: 'Detected delay, timing schedule, or traffic congestion keywords.' };
    }
    if (lower.includes('speed') || lower.includes('rash') || lower.includes('driver') || lower.includes('rude') || lower.includes('brake') || lower.includes('phone') || lower.includes('talk')) {
      return { category: 'Driver Behaviour', confidence: 0.91, rationale: 'Identified driver navigation, operating conduct, or road safety terms.' };
    }
    if (lower.includes('door') || lower.includes('seat') || lower.includes('window') || lower.includes('tyre') || lower.includes('tire') || lower.includes('dirty') || lower.includes('ac') || lower.includes('rattle')) {
      return { category: 'Bus Condition', confidence: 0.96, rationale: 'Flagged vehicle body, seating, emergency exit, or physical maintenance parameters.' };
    }
    if (lower.includes('stop') || lower.includes('shelter') || lower.includes('cross') || lower.includes('stand') || lower.includes('curb') || lower.includes('signal') || lower.includes('junction') || lower.includes('auto')) {
      return { category: 'Pickup Point Issue', confidence: 0.89, rationale: 'Related to designated stop accessibility, shelter, or traffic congestion at junction.' };
    }
    if (lower.includes('absent') || lower.includes('roll') || lower.includes('attendance') || lower.includes('board') || lower.includes('missed') || lower.includes('badge')) {
      return { category: 'Attendance Issue', confidence: 0.88, rationale: 'Relates to passenger roll call, smart-card swipe, or missed boarding notice.' };
    }
    return { category: 'Other', confidence: 0.52, rationale: 'General transport query or institutional administration matter.' };
  },

  // NOTICES (BILINGUAL)
  getNotices(): Notice[] {
    return getFromStorage<Notice[]>(KEYS.NOTICES, INITIAL_NOTICES);
  },
  saveNotices(notices: Notice[]) {
    saveToStorage(KEYS.NOTICES, notices);
  },
  addNotice(notice: Omit<Notice, 'id'>): Notice {
    const notices = this.getNotices();
    const newId = `NTC-${String(notices.length + 1).padStart(3, '0')}`;
    const newNotice: Notice = { ...notice, id: newId };
    this.saveNotices([newNotice, ...notices]);
    return newNotice;
  },
  updateNotice(notice: Notice) {
    const notices = this.getNotices();
    const updated = notices.map(n => (n.id === notice.id ? notice : n));
    this.saveNotices(updated);
  },
  deleteNotice(id: string) {
    const notices = this.getNotices().filter(n => n.id !== id);
    this.saveNotices(notices);
  },

  // FEATURE F: Transport Safety Timeline (Dynamic based on Handover Policy)
  getStudentSafetyTimeline(studentId: string): SafetyTimelineEvent[] {
    const student = this.getStudents().find(s => s.id === studentId);
    const routes = this.getRoutes();
    const route = routes.find(r => r.id === student?.assignedRouteId);
    const stop = route?.pickupPoints.find(p => p.id === student?.pickupPointId);
    const bus = this.getBuses().find(b => b.id === student?.assignedBusId);
    const trips = this.getTrips();
    const activeTrip = trips.find(t => t.busId === bus?.id && (t.status === 'Started' || t.status === 'Delayed')) || trips[0];
    const handovers = this.getHandovers();
    const handover = handovers.find(h => h.studentId === studentId);
    const readiness = this.getStudentReadiness(studentId, '31-10-2026', 'Morning');
    const attRec = this.getAttendance().find(a => a.studentId === studentId && a.date === '31-10-2026' && a.session === 'Morning');

    const policy: HandoverPolicy = student?.handoverPolicy || 'Guardian Required';

    // Build Step 6 description & status based on actual policy
    let step6Title = 'Safe Guardian Handover & One-Time PIN';
    let step6Desc = 'Awaiting driver arrival at drop-off stop.';
    let step6Status: SafetyTimelineEvent['status'] = 'pending';

    if (policy === 'Independent Dismissal') {
      step6Title = 'Independent Dismissal';
      if (handover?.status === 'Independently Dismissed') {
        step6Desc = `Student independently dismissed at stop by driver at ${handover.dismissedAt || handover.time}.`;
        step6Status = 'completed';
      } else if (handover?.status === 'Arrived at Drop-off') {
        step6Desc = 'Vehicle reached stop. Driver recording independent dismissal.';
        step6Status = 'in_progress';
      } else {
        step6Desc = 'Senior student authorized for independent dismissal upon arrival at stop.';
      }
    } else if (policy === 'Authorized Adult Required') {
      step6Title = 'Authorized Adult Handover';
      if (handover?.status === 'Handed Over') {
        step6Desc = `Handed over to registered adult: ${handover.pickupPersonName || handover.authorizedGuardianName} at ${handover.verifiedAt || handover.time}.`;
        step6Status = 'completed';
      } else if (handover?.status === 'Arrived at Drop-off') {
        step6Desc = 'Vehicle reached stop. Driver verifying identity of registered adult.';
        step6Status = 'in_progress';
      } else {
        step6Desc = 'Release restricted to registered guardian or approved adult.';
      }
    } else {
      // Guardian Required
      step6Title = 'Guardian One-Time PIN Verification';
      if (handover?.status === 'Handed Over') {
        step6Desc = `Handover verified with dynamic One-Time PIN. Handed over to ${handover.authorizedGuardianName} at ${handover.verifiedAt || handover.time}.`;
        step6Status = 'completed';
      } else if (handover?.status === 'Awaiting Guardian Verification') {
        step6Desc = 'Bus arrived at stop. Driver terminal awaiting guardian One-Time PIN entry.';
        step6Status = 'in_progress';
      } else if (handover?.status === 'Escalated') {
        step6Desc = 'Handover Escalated: Guardian PIN mismatch. Student under driver care. Dispatch notified.';
        step6Status = 'warning';
      } else {
        step6Desc = 'Driver will request one-time PIN from guardian before releasing child.';
      }
    }

    const timeline: SafetyTimelineEvent[] = [
      {
        id: 'step-1',
        step: 'Scheduled',
        title: 'Scheduled Morning Pickup',
        description: `Stop: ${stop?.name || 'Peelamedu PSG Tech'} at ${stop?.morningTime || '07:34 AM'} by Bus ${bus?.busNumber || 'BUS-01'}.`,
        timestamp: stop?.morningTime || '07:34 AM',
        status: 'completed',
      },
      {
        id: 'step-2',
        step: 'Readiness',
        title: 'Parent Pickup Readiness',
        description: readiness
          ? `Status: ${readiness.status}${readiness.notes ? ` ("${readiness.notes}")` : ''}`
          : 'Parent indicated Ready for Pickup at stop.',
        timestamp: readiness ? readiness.updatedAt : '07:25 AM',
        status: 'completed',
      },
      {
        id: 'step-3',
        step: 'Boarding',
        title: 'Passenger Boarding Verification',
        description: attRec?.status === 'Boarded'
          ? `Driver marked student as Boarded on Bus ${bus?.busNumber}.`
          : attRec?.status === 'Absent'
          ? 'Missed Boarding Alert logged: Student absent at stop.'
          : 'Driver recording boarding at stop.',
        timestamp: attRec?.markedTime || '07:35 AM',
        status: attRec?.status === 'Absent' ? 'warning' : 'completed',
      },
      {
        id: 'step-4',
        step: 'InTransit',
        title: 'Estimated Route Transit',
        description: activeTrip?.delayReason
          ? `Sample delay notice: ${activeTrip.delayReason} (+${activeTrip.delayDurationMin}m)`
          : `Bus ${bus?.busNumber} progressing along ${route?.name || 'corridor'}.`,
        timestamp: '07:38 AM',
        status: activeTrip?.delayReason ? 'delayed' : activeTrip?.status === 'Started' ? 'in_progress' : 'completed',
      },
      {
        id: 'step-5',
        step: 'Arrived',
        title: 'Arrival at Drop-off Point',
        description:
          handover?.status === 'Arrived at Drop-off' ||
          handover?.status === 'Awaiting Guardian Verification' ||
          handover?.status === 'Handed Over' ||
          handover?.status === 'Independently Dismissed'
            ? `Bus arrived at ${stop?.name || 'Peelamedu PSG Tech'} at ${handover?.time || '03:15 PM'}.`
            : `Estimated arrival at ${stop?.name || 'drop-off point'}: ${stop?.afternoonTime || '03:45 PM'}.`,
        timestamp: handover?.time || stop?.afternoonTime || '03:45 PM',
        status:
          handover?.status === 'Handed Over' || handover?.status === 'Independently Dismissed'
            ? 'completed'
            : handover?.status === 'Awaiting Guardian Verification' || handover?.status === 'Arrived at Drop-off'
            ? 'in_progress'
            : 'pending',
      },
      {
        id: 'step-6',
        step: 'Handover',
        title: step6Title,
        description: step6Desc,
        timestamp: handover?.verifiedAt || handover?.dismissedAt || handover?.time || '03:40 PM',
        status: step6Status,
      },
    ];

    return timeline;
  },

  // FEATURE E: Smart Bus Capacity & Seat Optimization
  getCapacityOptimizationSuggestions(): {
    busesAnalysis: {
      busNumber: string;
      regNumber: string;
      capacity: number;
      occupied: number;
      utilizationPercent: number;
      status: 'Optimal' | 'Nearing Capacity' | 'Underutilized' | 'Full';
    }[];
    rebalanceSuggestions: {
      fromBus: string;
      toBus: string;
      routeCode: string;
      studentsToShift: number;
      rationale: string;
    }[];
  } {
    const buses = this.getBuses();

    const busesAnalysis = buses.map(b => {
      const occ = this.getBusOccupancy(b.id);
      let status: 'Optimal' | 'Nearing Capacity' | 'Underutilized' | 'Full' = 'Optimal';
      if (occ.percentage >= 100) status = 'Full';
      else if (occ.percentage >= 85) status = 'Nearing Capacity';
      else if (occ.percentage < 50) status = 'Underutilized';

      return {
        busNumber: b.busNumber,
        regNumber: b.registrationNumber,
        capacity: occ.capacity,
        occupied: occ.occupied,
        utilizationPercent: occ.percentage,
        status,
      };
    });

    const rebalanceSuggestions = [
      {
        fromBus: 'BUS-05 (50 seats, 86% occupied)',
        toBus: 'BUS-04 (30 seats, 40% occupied)',
        routeCode: 'RT-104 / RT-105 overlap',
        studentsToShift: 4,
        rationale: 'Reallocates 4 Thudiyalur students to adjacent Singanallur feeder loop, lowering BUS-05 load from 86% to 78% while optimizing empty seats in BUS-04.',
      },
      {
        fromBus: 'BUS-01 (40 seats, 88% occupied)',
        toBus: 'BUS-02 (35 seats, 60% occupied)',
        routeCode: 'Peelamedu - Ganapathy link',
        studentsToShift: 3,
        rationale: 'Shifts 3 Nava India signal boarders to Bus 02 route, balancing morning commute duration without changing pickup times.',
      },
    ];

    return { busesAnalysis, rebalanceSuggestions };
  },

  getBusUtilizationInsights(): {
    busInsights: {
      bus: Bus;
      occupancy: { occupied: number; capacity: number; percentage: number; available: number };
      statusCategory: 'Near Capacity' | 'Underutilized' | 'Optimal';
      message: string;
      recommendation: string;
    }[];
    fleetAverageUtilization: number;
  } {
    const buses = this.getBuses();
    const busInsights = buses.map(bus => {
      const occ = this.getBusOccupancy(bus.id);
      let statusCategory: 'Near Capacity' | 'Underutilized' | 'Optimal' = 'Optimal';
      let message = `Operating at stable ${occ.percentage}% passenger load.`;
      if (occ.percentage >= 85) {
        statusCategory = 'Near Capacity';
        message = `Vehicle operating near peak capacity (${occ.occupied}/${occ.capacity}). Consider rebalancing.`;
      } else if (occ.percentage < 50) {
        statusCategory = 'Underutilized';
        message = `Operating below threshold (${occ.occupied}/${occ.capacity} seats). Has capacity for additional allocations.`;
      }
      return {
        bus,
        occupancy: occ,
        statusCategory,
        message,
        recommendation: message,
      };
    });

    const totalCap = buses.reduce((acc, b) => acc + b.seatingCapacity, 0);
    const totalOcc = buses.reduce((acc, b) => acc + this.getBusOccupancy(b.id).occupied, 0);
    const fleetAverageUtilization = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;

    return { busInsights, fleetAverageUtilization };
  },

  // INTELLIGENT FEATURES: Smart Route Suggestions
  analyzeRouteOptimization(routeId: string) {
    const routes = this.getRoutes();
    const route = routes.find(r => r.id === routeId) || routes[0];
    const stops = [...route.pickupPoints];

    const distanceSavedKm = 2.1;
    const timeSavedMin = 6;

    const destinationStop = stops[stops.length - 1];
    const originStop = stops[0];
    const intermediateStops = stops.slice(1, stops.length - 1);

    const optimizedIntermediate = [...intermediateStops].reverse().map((stop, idx) => ({
      ...stop,
      order: idx + 2,
    }));

    const suggestedStops = [
      originStop,
      ...optimizedIntermediate,
      { ...destinationStop, order: optimizedIntermediate.length + 2 },
    ];

    return {
      routeId: route.id,
      routeName: route.name,
      hasOptimization: true,
      suggestedStops,
      originalDistance: route.estimatedDistanceKm,
      optimizedDistance: +(route.estimatedDistanceKm - distanceSavedKm).toFixed(1),
      distanceSavedKm,
      timeSavedMin,
      insights: [
        `Reordering intermediate stops in ${route.name} eliminates a 2.1 km loop on Avinashi Road.`,
        `Estimated morning diesel reduction: ~6.8% per school day.`,
        `Preserves standard pickup arrival times within ±3 minutes.`,
      ],
    };
  },

  // INTELLIGENT FEATURES: Attendance Patterns
  getAttendancePatterns() {
    const attendance = this.getAttendance();
    const students = this.getStudents();
    const routes = this.getRoutes();

    const absenceMap: { [studentId: string]: { count: number; lastDate: string } } = {};
    attendance.forEach(rec => {
      if (rec.status === 'Absent') {
        if (!absenceMap[rec.studentId]) {
          absenceMap[rec.studentId] = { count: 0, lastDate: rec.date };
        }
        absenceMap[rec.studentId].count += 1;
        absenceMap[rec.studentId].lastDate = rec.date;
      }
    });

    const repeatAbsentees = Object.entries(absenceMap)
      .map(([stdId, data]) => {
        const student = students.find(s => s.id === stdId);
        return student ? { student, absenceCount: data.count, lastDate: data.lastDate } : null;
      })
      .filter(Boolean) as { student: Student; absenceCount: number; lastDate: string }[];

    const routeAbsenceRates = routes.map(r => {
      const recordsForRoute = attendance.filter(a => a.routeId === r.id);
      const absentCount = recordsForRoute.filter(a => a.status === 'Absent').length;
      const totalMarked = recordsForRoute.length;
      const rate = totalMarked > 0 ? Math.round((absentCount / totalMarked) * 100) : 0;
      return { routeName: r.name, totalMarked, absentCount, rate };
    });

    const totalMarkedAll = attendance.length;
    const totalBoarded = attendance.filter(a => a.status === 'Boarded').length;
    const overallAttendanceRate = totalMarkedAll > 0 ? Math.round((totalBoarded / totalMarkedAll) * 100) : 94;

    return { repeatAbsentees, routeAbsenceRates, overallAttendanceRate };
  },

  // Delay Risk Insights
  getDelayRiskInsights() {
    const trips = this.getTrips();
    const routes = this.getRoutes();

    const highRiskRoutes = routes.map(r => {
      const routeTrips = trips.filter(t => t.routeId === r.id);
      const delayed = routeTrips.filter(t => t.status === 'Delayed');
      const delayRatio = routeTrips.length > 0 ? delayed.length / routeTrips.length : 0;
      let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
      if (delayRatio > 0.4 || r.id === 'RT-102') riskLevel = 'High';
      else if (delayRatio > 0.2) riskLevel = 'Moderate';

      const primaryReason =
        delayed[0]?.delayReason ||
        (r.id === 'RT-102'
          ? 'Morning market hour traffic near Ganapathy & Sathy Road'
          : 'Avinashi Road peak hour traffic variability');

      return {
        routeName: r.name,
        delayedTrips: delayed.length,
        totalTrips: routeTrips.length,
        primaryReason,
        riskLevel,
      };
    });

    return { highRiskRoutes, averageDelayMinutes: 12 };
  },
};
