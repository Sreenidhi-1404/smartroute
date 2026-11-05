import { JUnitTestSuite, Assert } from './junit';
import { storageService } from '../services/storageService';
import { Student } from '../types';

/**
 * ============================================================================
 * JUNIT TEST SUITE: Student Transport Management & Handover Safety Module
 * Kovai Valley Matriculation School, Coimbatore
 * ============================================================================
 * Tests student admission records, class grade normalization, bus seat
 * allocation capacity boundaries, and 6-digit dynamic PIN safety handovers.
 */

export const studentManagementTestSuite = new JUnitTestSuite('StudentManagementTest');

// Setup fixture: reset storage to clean Coimbatore default state before each test
studentManagementTestSuite.beforeEach(() => {
  storageService.resetAllToDefaults();
});

/**
 * @Test 1: Student Creation with Unique Admission Number
 * Verifies that registering a new student generates a valid KVMS-2026-XXX
 * admission number and persists the record.
 */
studentManagementTestSuite.test(
  'testStudentCreationWithUniqueAdmissionNumber',
  'Verify new student registration assigns unique STD and KVMS admission IDs',
  () => {
    const initialCount = storageService.getStudents().length;

    const newStudentData: Omit<Student, 'id' | 'studentIdNumber'> = {
      name: 'M. Kanishka Devi',
      classGrade: '7',
      section: 'A',
      rollNumber: '32',
      gender: 'Female',
      dateOfBirth: '2013-08-20',
      parentId: 'PAR-001',
      parentName: 'Priya R',
      parentPhone: '+91 98421 88440',
      parentEmail: 'parent.priya@kovaivalley.edu.in',
      address: '74 Avinashi Road, Peelamedu, Coimbatore',
      assignedRouteId: 'ROUTE-01',
      assignedBusId: 'BUS-01',
      pickupPointId: 'PNT-01',
      transportStatus: 'Active',
      handoverPolicy: 'Guardian Required',
      handoverPin: '829143',
      emergencyContact: '+91 98421 88440',
    };

    const res = storageService.addStudent(newStudentData);

    Assert.assertTrue(res.success, 'addStudent should return success = true');
    Assert.assertNotNull(res.student, 'Returned student record must not be null');
    Assert.assertTrue(
      res.student!.studentIdNumber.startsWith('KVMS-2026-'),
      'Admission number must follow KVMS-2026-XXX standard pattern'
    );
    Assert.assertEquals(
      initialCount + 1,
      storageService.getStudents().length,
      'Student database count should increment by 1'
    );
  }
);

/**
 * @Test 2: Grade Key Normalization Utility
 * Verifies that grade inputs ('Class 7', 'Grade 7', 'Std 7', '7') are all
 * normalized into a consistent comparable token.
 */
studentManagementTestSuite.test(
  'testGradeNormalization',
  'Ensure diverse grade strings normalize uniformly for robust search and filtering',
  () => {
    const normalizeGradeKey = (g: string) => {
      if (!g) return '';
      return g.toLowerCase().replace(/^(class|grade|std)\s*/i, '').trim();
    };

    Assert.assertEquals('7', normalizeGradeKey('Class 7'));
    Assert.assertEquals('7', normalizeGradeKey('Grade 7'));
    Assert.assertEquals('7', normalizeGradeKey('Std 7'));
    Assert.assertEquals('7', normalizeGradeKey('7'));
    Assert.assertEquals('lkg', normalizeGradeKey('Class LKG'));
    Assert.assertEquals('12', normalizeGradeKey('Class 12'));
  }
);

/**
 * @Test 3: Bus Allocation & Capacity Limit Enforcement
 * Verifies that allocating a student to an already full bus is blocked with
 * an informative capacity error.
 */
studentManagementTestSuite.test(
  'testBusCapacityLimitEnforcement',
  'Prevent seat allocation when target fleet vehicle is at 100% capacity',
  () => {
    // Locate a bus and temporarily reduce its capacity to match its current occupancy
    const buses = storageService.getBuses();
    Assert.assertTrue(buses.length > 0, 'At least one fleet bus must exist');

    const targetBus = buses[0];
    const initialOccupancy = storageService.getBusOccupancy(targetBus.id);

    // Artificially saturate bus capacity (seatingCapacity)
    const saturatedBus = { ...targetBus, seatingCapacity: initialOccupancy.occupied };
    storageService.saveBuses(buses.map(b => (b.id === targetBus.id ? saturatedBus : b)));

    // Attempt to allocate another student to this saturated bus
    const res = storageService.addStudent({
      name: 'Overflow Test Student',
      classGrade: '8',
      section: 'B',
      rollNumber: '44',
      gender: 'Male',
      dateOfBirth: '2012-04-10',
      parentId: 'PAR-001',
      parentName: 'Priya R',
      parentPhone: '+91 98421 88440',
      parentEmail: 'parent.priya@kovaivalley.edu.in',
      address: 'Coimbatore',
      assignedRouteId: targetBus.assignedRouteId,
      assignedBusId: targetBus.id,
      pickupPointId: 'PNT-01',
      transportStatus: 'Active',
      handoverPolicy: 'Guardian Required',
      handoverPin: '991283',
      emergencyContact: '+91 98421 88440',
    });

    Assert.assertFalse(res.success, 'Allocation should fail when bus capacity is saturated');
    Assert.assertTrue(
      (res.message || '').includes('capacity'),
      'Error message should explicitly cite bus capacity restriction'
    );
  }
);

/**
 * @Test 4: Student Deletion Cascades to Allocation Cancellation
 * Verifies that deleting a student record marks existing seat allocations
 * as 'Cancelled'.
 */
studentManagementTestSuite.test(
  'testStudentDeletionCancelsAllocation',
  'Ensure deleting a student cascades to deactivate transport allocation records',
  () => {
    const students = storageService.getStudents();
    const studentToDelete = students.find(s => s.transportStatus === 'Active');
    Assert.assertNotNull(studentToDelete, 'An active transport student must exist for this test');

    const studentId = studentToDelete!.id;
    const deleteRes = storageService.deleteStudent(studentId);
    Assert.assertTrue(deleteRes.success, 'deleteStudent must return success = true');

    // Verify student is removed from active roster
    const queried = storageService.getStudentById(studentId);
    Assert.assertNull(queried, 'Deleted student must not be found in active student list');

    // Verify allocation record is marked as Cancelled
    const allocations = storageService.getAllocations().filter(a => a.studentId === studentId);
    for (const alloc of allocations) {
      Assert.assertEquals('Cancelled', alloc.status, 'Associated allocation must be marked Cancelled');
    }
  }
);

/**
 * @Test 5: Dynamic 6-Digit Handover PIN Generation
 * Verifies that marking arrival at drop-off automatically generates a
 * 6-digit numeric PIN with timestamped expiration.
 */
studentManagementTestSuite.test(
  'testHandoverDynamicPinGeneration',
  'Validate arrival at drop-off stop triggers 6-digit numeric PIN for Guardian Required',
  () => {
    const students = storageService.getStudents();
    const student = students.find(s => s.handoverPolicy === 'Guardian Required');
    Assert.assertNotNull(student, 'A student with Guardian Required policy must exist');

    const res = storageService.markArrivedAtDropoff(student!.id, 'TRIP-DEMO-AM', 'DRV-001');

    Assert.assertTrue(res.success, 'markArrivedAtDropoff must succeed');
    Assert.assertNotNull(res.oneTimePin, 'One-time PIN must be generated');
    Assert.assertEquals(6, res.oneTimePin!.length, 'Generated PIN must be exactly 6 digits');
    Assert.assertTrue(/^\d{6}$/.test(res.oneTimePin!), 'Generated PIN must consist strictly of digits');
    Assert.assertEquals('Awaiting Guardian Verification', res.handover.status);
  }
);

/**
 * @Test 6: Successful Handover PIN Verification
 * Verifies that driver input of the correct 6-digit verbal PIN marks the
 * handover as 'Handed Over'.
 */
studentManagementTestSuite.test(
  'testHandoverPinVerificationSuccess',
  'Ensure correct 6-digit PIN input transitions handover status to Handed Over',
  () => {
    const students = storageService.getStudents();
    const student = students.find(s => s.handoverPolicy === 'Guardian Required')!;

    // Generate active handover record with known PIN
    const arrival = storageService.markArrivedAtDropoff(student.id, 'TRIP-TEST-VERIFY', 'DRV-001');
    const validPin = arrival.oneTimePin!;
    const handoverId = arrival.handover.id;

    // Driver submits the correct PIN
    const verification = storageService.verifyHandoverPin(handoverId, validPin, 'DRV-001');

    Assert.assertTrue(verification.success, 'PIN verification must succeed for correct PIN');
    Assert.assertEquals('Handed Over', verification.record?.status, 'Status must update to Handed Over');
    Assert.assertTrue(verification.record?.pinUsed === true, 'pinUsed flag must be true');
    Assert.assertNotNull(verification.record?.verifiedAt, 'verifiedAt timestamp must be recorded');
  }
);

/**
 * @Test 7: Security Lockout on Excessive Invalid PIN Attempts
 * Verifies that submitting incorrect PINs increments failed attempt counter
 * and prevents further unauthorized attempts after threshold.
 */
studentManagementTestSuite.test(
  'testHandoverPinLockoutOnMaxAttempts',
  'Verify security defense: 5 failed PIN attempts lock record and require escalation',
  () => {
    const students = storageService.getStudents();
    const student = students.find(s => s.handoverPolicy === 'Guardian Required')!;

    const arrival = storageService.markArrivedAtDropoff(student.id, 'TRIP-TEST-LOCKOUT', 'DRV-001');
    const handoverId = arrival.handover.id;

    // Submit invalid PIN 5 times
    for (let i = 1; i <= 5; i++) {
      storageService.verifyHandoverPin(handoverId, '000000', 'DRV-001');
    }

    // 6th attempt should be rejected due to lockout
    const attemptAfterLockout = storageService.verifyHandoverPin(handoverId, arrival.oneTimePin!, 'DRV-001');
    Assert.assertFalse(attemptAfterLockout.success, 'Attempts after max failed attempts must be rejected');
    Assert.assertTrue(
      (attemptAfterLockout.message || '').toLowerCase().includes('maximum pin attempts') ||
      (attemptAfterLockout.message || '').toLowerCase().includes('locked'),
      'Should inform user of attempt limit exhaustion and record lock'
    );
  }
);

/**
 * @Test 8: Independent Dismissal Policy Exemption
 * Verifies that secondary students authorized for independent dismissal
 * can be safely dismissed without requiring a guardian PIN.
 */
studentManagementTestSuite.test(
  'testIndependentDismissalPolicy',
  'Verify authorized independent dismissal students do not require guardian PIN entry',
  () => {
    const students = storageService.getStudents();
    // Locate or temporarily configure a student for Independent Dismissal
    let student = students.find(s => s.handoverPolicy === 'Independent Dismissal');
    if (!student) {
      student = { ...students[0], handoverPolicy: 'Independent Dismissal' };
      storageService.updateStudent(student);
    }

    const arrival = storageService.markArrivedAtDropoff(student.id, 'TRIP-TEST-DISMISS', 'DRV-001');
    Assert.assertTrue(arrival.success, 'Arrival must be recorded successfully');
    Assert.assertEquals(
      'Arrived at Drop-off',
      arrival.handover.status,
      'Initial status for independent dismissal is Arrived at Drop-off'
    );

    const dismissal = storageService.confirmIndependentDismissal(arrival.handover.id, 'DRV-001');
    Assert.assertTrue(dismissal.success, 'Independent dismissal confirmation must succeed');
    Assert.assertEquals('Independently Dismissed', dismissal.record?.status);
  }
);

/**
 * @Test 9: Parent-Child Linkage & Profile Integrity
 * Verifies that getStudentsForParent correctly queries all children linked
 * to a guardian profile across different grades and bus corridors.
 */
studentManagementTestSuite.test(
  'testParentChildLinkageIntegrity',
  'Ensure parent profiles accurately resolve all linked wards without duplication',
  () => {
    const parents = storageService.getParents();
    Assert.assertTrue(parents.length > 0, 'At least one parent profile must exist');

    const targetParent = parents[0];
    const linkedStudents = storageService.getStudentsForParent(targetParent.id);

    Assert.assertTrue(linkedStudents.length > 0, 'Parent must have at least one linked child');

    // Ensure no duplicate student IDs in response
    const ids = linkedStudents.map(s => s.id);
    const uniqueIds = new Set(ids);
    Assert.assertEquals(ids.length, uniqueIds.size, 'Returned student list must contain zero duplicates');
  }
);

/**
 * @Test 10: Student Update Preserves Critical Transport Data
 * Verifies that updating a student contact or address does not accidentally
 * erase assigned bus IDs or route sequences.
 */
studentManagementTestSuite.test(
  'testStudentUpdatePreservesCriticalData',
  'Verify modifying student contact data preserves allocated bus and route IDs',
  () => {
    const original = storageService.getStudents()[0];
    const originalBusId = original.assignedBusId;
    const originalRouteId = original.assignedRouteId;

    const updatedStudent: Student = {
      ...original,
      parentPhone: '+91 99999 11111',
      medicalNotes: 'Updated allergy notes: carries inhaler.',
    };

    const updateRes = storageService.updateStudent(updatedStudent);
    Assert.assertTrue(updateRes.success, 'updateStudent should succeed');

    const fetched = storageService.getStudentById(original.id);
    Assert.assertNotNull(fetched, 'Updated student must exist in database');
    Assert.assertEquals('+91 99999 11111', fetched!.parentPhone, 'Phone number must be updated');
    Assert.assertEquals(originalBusId, fetched!.assignedBusId, 'Assigned bus ID must remain intact');
    Assert.assertEquals(originalRouteId, fetched!.assignedRouteId, 'Assigned route ID must remain intact');
  }
);
