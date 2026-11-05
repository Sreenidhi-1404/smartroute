export type UserRole = 'admin' | 'driver' | 'parent' | 'student';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string; // Plaintext for demo architecture
  name: string;
  role: UserRole;
  status: 'Active' | 'Suspended';
  phone: string;
  profileId: string;
  assignedStudentIds?: string[]; // for parent (e.g. ['STD-014', 'STD-021', 'STD-008', 'STD-005'])
  assignedStudentId?: string;   // for student (e.g. 'STD-014')
  assignedBusId?: string;       // for driver (e.g. 'BUS-01')
  assignedDriverId?: string;    // for driver (e.g. 'DRV-001')
  avatar?: string;
}

export type User = UserAccount;

export interface ParentProfile {
  id: string; // parent_id e.g. "PAR-001"
  userId: string; // e.g. "ACC-PARENT-01"
  name: string;
  phone: string;
  email: string;
  address: string;
  linkedStudentIds: string[];
}

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  morningTime: string;   // e.g. "07:15 AM"
  afternoonTime: string; // e.g. "03:45 PM"
  order: number;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  isAlternative?: boolean;
}

export interface Route {
  id: string;
  routeCode: string; // e.g. "RT-101"
  name: string;
  startLocation: string;
  destination: string;
  pickupPoints: PickupPoint[];
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  assignedBusId: string;
  assignedDriverId: string;
  status: 'Active' | 'Under Review' | 'Inactive';
  description?: string;
}

export interface Bus {
  id: string;
  busNumber: string;        // e.g. "BUS-01"
  registrationNumber: string; // Tamil Nadu plate: e.g. "TN 38 BE 4011"
  model: string;            // e.g. "Tata Starbus Ultra 40-Seater"
  seatingCapacity: number;  // e.g. 40
  assignedDriverId: string;
  assignedRouteId: string;
  status: 'Active' | 'Maintenance' | 'Out of Service';
  insuranceExpiryDate: string; // DD-MM-YYYY
  permitExpiryDate: string;    // DD-MM-YYYY
  maintenanceStatus: 'Good' | 'Service Due' | 'In Workshop';
  fuelType: 'Diesel' | 'CNG' | 'Electric';
  lastServiceDate: string;
}

export interface Driver {
  id: string;
  driverCode: string;       // e.g. "DRV-001"
  name: string;
  phone: string;            // +91 format
  email: string;
  address: string;          // Coimbatore locality
  licenseNumber: string;    // TN format e.g. "TN-38-20120004521"
  licenseExpiryDate: string; // DD-MM-YYYY
  experienceYears: number;
  assignedBusId: string;
  status: 'Active' | 'On Leave' | 'Suspended';
  joiningDate: string;
  emergencyContact: string;
  rating: number; // 1-5
}

export type HandoverPolicy = 'Guardian Required' | 'Authorized Adult Required' | 'Independent Dismissal';

export interface Student {
  id: string;
  studentIdNumber: string; // e.g. "KVMS-2026-014"
  parentId: string;        // Parent foreign key (PAR-001)
  name: string;
  classGrade: string;      // e.g. "Class 7", "Class 4", "LKG", "UKG"
  section: string;         // e.g. "A"
  rollNumber: string;      // e.g. "14"
  dateOfBirth: string;     // DD-MM-YYYY
  gender: 'Male' | 'Female' | 'Other';
  parentName: string;
  parentPhone: string;     // +91 format
  parentEmail: string;
  address: string;         // Coimbatore address
  pickupPointId: string;
  assignedRouteId: string;
  assignedBusId: string;
  transportStatus: 'Active' | 'Pending' | 'Suspended' | 'Cancelled';
  handoverPolicy: HandoverPolicy;
  medicalNotes?: string;
  emergencyContact: string;
  handoverPin?: string;    // legacy/fallback PIN
  authorizedGuardians?: Guardian[];
}

export interface Guardian {
  id: string;
  name: string;
  relationship: 'Father' | 'Mother' | 'Grandparent' | 'Guardian' | 'Van Driver';
  phone: string;
  isPrimary: boolean;
  idProofNumber?: string;
}

export interface TransportAllocation {
  id: string;
  studentId: string;
  routeId: string;
  busId: string;
  pickupPointId: string;
  seatNumber?: number;
  allocatedDate: string;
  status: 'Active' | 'Cancelled' | 'Changed';
  notes?: string;
}

export type AttendanceStatus = 'Not Marked' | 'Boarded' | 'Absent' | 'Not Expected';

export interface AttendanceRecord {
  id: string;
  date: string; // DD-MM-YYYY
  studentId: string;
  tripId: string;
  busId: string;
  routeId: string;
  pickupPointId: string;
  session: 'Morning' | 'Afternoon';
  status: AttendanceStatus;
  markedTime?: string;
  markedByDriverId?: string;
  remarks?: string;
}

export type TripStatus = 'Scheduled' | 'Started' | 'Delayed' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  tripCode: string; // e.g. "TRIP-KVMS-101-AM"
  date: string;     // DD-MM-YYYY
  session: 'Morning Pickup' | 'Afternoon Dropoff';
  busId: string;
  driverId: string;
  routeId: string;
  scheduledStartTime: string; // e.g. "07:00 AM"
  actualStartTime?: string;
  expectedArrivalTime: string; // e.g. "07:45 AM"
  actualArrivalTime?: string;
  status: TripStatus;
  delayReason?: string;
  delayDurationMin?: number;
  currentStopIndex?: number;
  notes?: string;
}

export type ComplaintCategory =
  | 'Bus Delay'
  | 'Driver Behaviour'
  | 'Bus Condition'
  | 'Pickup Point Issue'
  | 'Attendance Issue'
  | 'Other';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ComplaintStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected';

export interface Complaint {
  id: string;
  complaintCode: string;
  submittedByUserId: string;
  submittedByName: string;
  studentId?: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  busId?: string;
  routeId?: string;
  submissionDate: string; // ISO
  adminResponse?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type NoticeCategory =
  | 'General'
  | 'Route Change'
  | 'Bus Delay'
  | 'Holiday'
  | 'Transport Announcement'
  | 'Emergency Information';

export type NoticeAudience = 'All' | 'Parents' | 'Drivers' | 'Students' | 'Staff';

// Feature G: Bilingual Notice
export interface Notice {
  id: string;
  title: string;       // English title
  titleTa: string;     // தமிழ் தலைப்பு
  content: string;     // English content
  contentTa: string;   // தமிழ் விளக்கம்
  category: NoticeCategory;
  audience: NoticeAudience;
  publishDate: string; // DD-MM-YYYY
  expiryDate: string;  // DD-MM-YYYY
  isUrgent: boolean;
  author: string;
  routeId?: string;
}

export interface SchoolSettings {
  schoolName: string;
  schoolNameTamil: string;
  affiliationNumber: string;
  academicYear: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  transportManager: string;
  emergencyHotline: string;
  notifyOnDelay: boolean;
  notifyOnBoarding: boolean;
  autoAttendanceNotification: boolean;
  maxBusCapacityThreshold: number; // e.g. 85%
  currency: string;
  locale: string;
  timeZone: string;
}

// FEATURE A: Safe Student Handover Verification
export type HandoverStatus =
  | 'Awaiting Drop-off'
  | 'Arrived at Drop-off'
  | 'Awaiting Guardian Verification'
  | 'Handed Over'
  | 'Independently Dismissed'
  | 'Escalated';

export interface HandoverRecord {
  id: string;
  date: string;               // DD-MM-YYYY
  time: string;               // e.g. "03:45 PM"
  tripId: string;
  studentId: string;
  pickupPointId: string;
  driverId: string;
  policy: HandoverPolicy;
  authorizedGuardianName: string;
  guardianPhone: string;
  oneTimePin?: string;        // Dynamic 6-digit OTP generated when driver arrives at stop
  pinExpiresAt?: string;      // e.g. "05:15 PM"
  expiresTimestamp?: number;  // Epoch ms for expiration validation & countdown
  pinUsed?: boolean;
  failedAttempts: number;     // Tracks failed PIN attempts (max 5)
  maxAttempts?: number;       // 5
  enteredPin?: string;
  status: HandoverStatus;
  verifiedAt?: string;
  verifiedByDriverId?: string;
  dismissedAt?: string;
  dismissedByDriverId?: string;
  verificationMethod?: 'one_time_otp' | 'emergency_pin' | 'authorized_adult' | 'independent_dismissal' | 'dispatcher_override';
  pickupPersonName?: string;  // Changed or registered adult name
  authorizedAdultName?: string;
  authorizedAdultRelation?: string;
  notes?: string;
  isSimulatedNotificationSent?: boolean;
}

// Simulated Notification
export interface SimulatedNotification {
  id: string;
  recipientRole: 'parent' | 'admin' | 'driver';
  recipientId: string; // user id or email
  studentId?: string;
  type: 'missed_boarding' | 'handover_otp' | 'handover_success' | 'delay' | 'readiness';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  meta?: Record<string, any>;
}

// FEATURE B: Missed Boarding Alert
export interface MissedBoardingAlert {
  id: string;
  date: string;               // DD-MM-YYYY
  time: string;               // e.g. "07:22 AM"
  tripId: string;
  studentId: string;
  studentName: string;
  classGrade: string;
  section: string;
  pickupPointName: string;
  expectedTime: string;
  parentPhone: string;
  parentName: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  resolutionNotes?: string;
}

// FEATURE C: Smart Pickup Readiness
export type ReadinessStatus = 'Ready for Pickup' | 'Not Ready' | 'Pickup Person Changed';

export interface PickupReadinessRecord {
  studentId: string;
  date: string; // DD-MM-YYYY
  session: 'Morning' | 'Afternoon';
  status: ReadinessStatus;
  notes?: string;
  pickupPersonName?: string;
  isApprovedPickupPerson?: boolean;
  updatedAt: string;
}

// FEATURE D: Smart Route Disruption Management
export type DisruptionType =
  | 'Road Closure'
  | 'Traffic Congestion'
  | 'Road Maintenance'
  | 'Weather-related Disruption'
  | 'Other';

export interface RouteDisruption {
  id: string;
  routeId: string;
  disruptionType: DisruptionType;
  locationName: string; // e.g. "Gandhipuram Flyover ramp repair"
  description: string;
  affectedPickupPointIds: string[];
  suggestedAlternativeStopName?: string;
  suggestedRerouteDescription?: string;
  estimatedDelayMin: number;
  status: 'Active' | 'Approved' | 'Rejected' | 'Resolved';
  reportedAt: string;
  reportedBy: string;
}

// FEATURE F: Transport Safety Timeline
export interface SafetyTimelineEvent {
  id: string;
  step: 'Scheduled' | 'Readiness' | 'Boarding' | 'InTransit' | 'Arrived' | 'Handover';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'pending' | 'delayed' | 'warning';
  icon?: string;
}
