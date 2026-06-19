# Staff Management System

This document describes the comprehensive staff management system for the SafeMeds pharmacy platform, including staff profiles, schedules, shifts, and time-off management.

## Table of Contents

1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [Service Layer](#service-layer)
4. [Frontend Components](#frontend-components)
5. [Features](#features)
6. [Usage Examples](#usage-examples)

## Database Schema

### Staff Model

```prisma
model Staff {
  id              String   @id @default(cuid())
  userId          String   @unique
  employeeId      String   @unique
  position        StaffPosition
  department      String
  hireDate        DateTime
  salary          Decimal? @db.Decimal(10, 2)
  isActive        Boolean  @default(true)
  emergencyContact String?
  emergencyPhone  String?
  certifications  String[]
  specializations String[]
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  schedules       StaffSchedule[]
  assignedConsultations Consultation[] @relation("StaffConsultations")
  shifts          Shift[]
  timeOffRequests TimeOffRequest[]

  @@map("staff")
}
```

### StaffSchedule Model

```prisma
model StaffSchedule {
  id              String   @id @default(cuid())
  staffId         String
  dayOfWeek       Int      // 0 = Sunday, 1 = Monday, etc.
  startTime       String   // Format: "HH:MM"
  endTime         String   // Format: "HH:MM"
  breakStart      String?  // Format: "HH:MM"
  breakEnd        String?  // Format: "HH:MM"
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  staff           Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@unique([staffId, dayOfWeek])
  @@map("staff_schedules")
}
```

### Shift Model

```prisma
model Shift {
  id              String   @id @default(cuid())
  staffId         String
  date            DateTime
  startTime       DateTime
  endTime         DateTime
  status          ShiftStatus @default(SCHEDULED)
  notes           String?
  actualStartTime DateTime?
  actualEndTime   DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  staff           Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@map("shifts")
}
```

### TimeOffRequest Model

```prisma
model TimeOffRequest {
  id              String   @id @default(cuid())
  staffId         String
  startDate       DateTime
  endDate         DateTime
  reason          String
  type            TimeOffType
  status          TimeOffStatus @default(PENDING)
  approvedBy      String?
  approvedAt      DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  staff           Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@map("time_off_requests")
}
```

### Enums

```prisma
enum StaffPosition {
  PHARMACIST
  PHARMACY_TECHNICIAN
  CASHIER
  MANAGER
  SUPERVISOR
  INTERN
  VOLUNTEER
}

enum ShiftStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum TimeOffType {
  VACATION
  SICK_LEAVE
  PERSONAL_DAY
  BEREAVEMENT
  MATERNITY_PATERNITY
  UNPAID_LEAVE
  OTHER
}

enum TimeOffStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

## API Endpoints

### Staff Management

#### GET /api/staff

Retrieves all staff members.

**Query Parameters:**

- `includeInactive` (boolean): Include inactive staff members

**Response:**

```json
[
  {
    "id": "staff_id",
    "userId": "user_id",
    "employeeId": "EMP001",
    "position": "PHARMACIST",
    "department": "Pharmacy",
    "hireDate": "2023-01-15T00:00:00Z",
    "salary": 75000.0,
    "isActive": true,
    "emergencyContact": "John Doe",
    "emergencyPhone": "555-0123",
    "certifications": ["PharmD", "BCPS"],
    "specializations": ["Cardiology", "Oncology"],
    "notes": "Experienced pharmacist",
    "user": {
      "id": "user_id",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "phone": "555-0123"
    },
    "createdAt": "2023-01-15T00:00:00Z",
    "updatedAt": "2023-01-15T00:00:00Z"
  }
]
```

#### POST /api/staff

Creates a new staff member.

**Request Body:**

```json
{
  "userId": "user_id",
  "employeeId": "EMP001",
  "position": "PHARMACIST",
  "department": "Pharmacy",
  "hireDate": "2023-01-15T00:00:00Z",
  "salary": 75000.0,
  "emergencyContact": "John Doe",
  "emergencyPhone": "555-0123",
  "certifications": ["PharmD", "BCPS"],
  "specializations": ["Cardiology", "Oncology"],
  "notes": "Experienced pharmacist"
}
```

#### GET /api/staff/[id]

Retrieves a specific staff member.

#### PUT /api/staff/[id]

Updates a staff member.

#### DELETE /api/staff/[id]

Deactivates a staff member.

### Schedule Management

#### GET /api/staff/schedules

Retrieves staff schedules.

**Query Parameters:**

- `staffId` (string): Staff member ID

#### POST /api/staff/schedules

Creates a staff schedule.

**Request Body:**

```json
{
  "staffId": "staff_id",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00",
  "breakStart": "12:00",
  "breakEnd": "13:00"
}
```

### Shift Management

#### GET /api/staff/shifts

Retrieves shifts for a date range.

**Query Parameters:**

- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `staffId` (string): Staff member ID (optional)

#### POST /api/staff/shifts

Creates a new shift.

**Request Body:**

```json
{
  "staffId": "staff_id",
  "date": "2023-12-01T00:00:00Z",
  "startTime": "2023-12-01T09:00:00Z",
  "endTime": "2023-12-01T17:00:00Z",
  "notes": "Regular shift"
}
```

### Availability Management

#### GET /api/staff/availability

Retrieves staff availability for a specific date.

**Query Parameters:**

- `date` (string): Date to check availability

#### POST /api/staff/availability

Generates shifts from schedules for a date range.

**Request Body:**

```json
{
  "startDate": "2023-12-01T00:00:00Z",
  "endDate": "2023-12-07T23:59:59Z"
}
```

### Time Off Management

#### GET /api/staff/time-off

Retrieves time off requests.

**Query Parameters:**

- `staffId` (string): Staff member ID (optional)
- `status` (string): Request status (optional)

#### POST /api/staff/time-off

Creates a time off request.

**Request Body:**

```json
{
  "staffId": "staff_id",
  "startDate": "2023-12-25T00:00:00Z",
  "endDate": "2023-12-26T23:59:59Z",
  "reason": "Christmas holiday",
  "type": "VACATION",
  "notes": "Family vacation"
}
```

## Service Layer

### StaffService

The `StaffService` class provides comprehensive staff management functionality:

#### Core Methods

- **createStaff(data):** Creates a new staff member
- **getAllStaff(includeInactive):** Retrieves all staff members
- **getStaffById(staffId):** Retrieves a specific staff member
- **updateStaff(staffId, data):** Updates staff member information
- **deactivateStaff(staffId):** Deactivates a staff member

#### Schedule Methods

- **createSchedule(data):** Creates a staff schedule
- **getStaffSchedules(staffId):** Retrieves staff schedules
- **updateSchedule(scheduleId, data):** Updates a schedule

#### Shift Methods

- **createShift(data):** Creates a new shift
- **getShifts(startDate, endDate, staffId):** Retrieves shifts for a date range
- **updateShiftStatus(shiftId, status, actualStartTime, actualEndTime):** Updates shift status

#### Time Off Methods

- **createTimeOffRequest(data):** Creates a time off request
- **getTimeOffRequests(staffId, status):** Retrieves time off requests
- **updateTimeOffRequestStatus(requestId, status, approvedBy, notes):** Approves/rejects time off requests

#### Utility Methods

- **getStaffAvailability(date):** Gets staff availability for a specific date
- **generateShiftsFromSchedules(startDate, endDate):** Generates shifts from schedules

## Features

### 1. Staff Profile Management

- **Complete Staff Profiles:** Store comprehensive staff information including personal details, employment information, certifications, and specializations
- **Position Management:** Support for various pharmacy positions (Pharmacist, Technician, Cashier, etc.)
- **Active/Inactive Status:** Track staff employment status
- **Emergency Contacts:** Store emergency contact information
- **Notes and Specializations:** Track staff expertise and notes

### 2. Schedule Management

- **Weekly Schedules:** Create and manage weekly schedules for each staff member
- **Flexible Time Slots:** Support for start/end times and break periods
- **Day-of-Week Scheduling:** Schedule staff for specific days of the week
- **Active/Inactive Schedules:** Enable/disable schedules as needed

### 3. Shift Management

- **Individual Shifts:** Create specific shifts for staff members
- **Shift Status Tracking:** Track shift status (Scheduled, In Progress, Completed, etc.)
- **Actual Time Tracking:** Record actual start and end times
- **Date Range Queries:** Retrieve shifts for specific date ranges
- **Automatic Generation:** Generate shifts from weekly schedules

### 4. Time Off Management

- **Time Off Requests:** Staff can submit time off requests
- **Multiple Request Types:** Support for vacation, sick leave, personal days, etc.
- **Approval Workflow:** Manager approval process for time off requests
- **Status Tracking:** Track request status (Pending, Approved, Rejected)
- **Date Range Validation:** Ensure proper date ranges and prevent conflicts

### 5. Availability Management

- **Real-time Availability:** Check staff availability for specific dates
- **Conflict Detection:** Identify scheduling conflicts
- **Automated Scheduling:** Generate shifts based on weekly schedules
- **Time Off Integration:** Consider approved time off when checking availability

## Usage Examples

### Creating a Staff Member

```typescript
import { StaffService } from "@/services/staffService";

const staffData = {
  userId: "user_123",
  employeeId: "EMP001",
  position: "PHARMACIST",
  department: "Pharmacy",
  hireDate: new Date("2023-01-15"),
  salary: 75000.0,
  emergencyContact: "John Doe",
  emergencyPhone: "555-0123",
  certifications: ["PharmD", "BCPS"],
  specializations: ["Cardiology", "Oncology"],
  notes: "Experienced pharmacist with cardiology focus",
};

const staff = await StaffService.createStaff(staffData);
```

### Creating a Schedule

```typescript
const scheduleData = {
  staffId: "staff_123",
  dayOfWeek: 1, // Monday
  startTime: "09:00",
  endTime: "17:00",
  breakStart: "12:00",
  breakEnd: "13:00",
};

const schedule = await StaffService.createSchedule(scheduleData);
```

### Creating a Shift

```typescript
const shiftData = {
  staffId: "staff_123",
  date: new Date("2023-12-01"),
  startTime: new Date("2023-12-01T09:00:00Z"),
  endTime: new Date("2023-12-01T17:00:00Z"),
  notes: "Regular shift",
};

const shift = await StaffService.createShift(shiftData);
```

### Requesting Time Off

```typescript
const timeOffData = {
  staffId: "staff_123",
  startDate: new Date("2023-12-25"),
  endDate: new Date("2023-12-26"),
  reason: "Christmas holiday",
  type: "VACATION",
  notes: "Family vacation",
};

const timeOffRequest = await StaffService.createTimeOffRequest(timeOffData);
```

### Checking Availability

```typescript
const date = new Date("2023-12-01");
const availability = await StaffService.getStaffAvailability(date);

// Returns array of staff with availability information
availability.forEach((staff) => {
  console.log(
    `${staff.name}: ${staff.isAvailable ? "Available" : "Not Available"}`
  );
});
```

### Generating Shifts from Schedules

```typescript
const startDate = new Date("2023-12-01");
const endDate = new Date("2023-12-07");

const shifts = await StaffService.generateShiftsFromSchedules(
  startDate,
  endDate
);
console.log(`Generated ${shifts.length} shifts`);
```

## Frontend Integration

### Staff Management Page

The staff management page (`/staff-management`) provides a comprehensive interface with:

1. **Tabbed Interface:** Separate tabs for Staff, Schedules, Shifts, and Time Off
2. **CRUD Operations:** Create, read, update, and delete functionality for all entities
3. **Modal Forms:** User-friendly forms for adding and editing records
4. **Status Indicators:** Visual indicators for staff status, shift status, and time off status
5. **Responsive Design:** Mobile-friendly interface

### Key Components

- **Staff List:** Display all staff members with their key information
- **Schedule Management:** Weekly schedule creation and management
- **Shift Calendar:** Visual representation of shifts and availability
- **Time Off Requests:** Approval workflow for time off requests
- **Availability Dashboard:** Real-time availability checking

## Security Considerations

1. **Authentication:** All endpoints require valid NextAuth session
2. **Authorization:** Role-based access control for staff management
3. **Data Validation:** Comprehensive input validation for all forms
4. **Audit Trail:** Track changes to staff records and schedules
5. **Privacy Protection:** Secure handling of personal and employment information

## Performance Considerations

1. **Database Indexing:** Optimized queries for staff lookups and scheduling
2. **Caching:** Cache frequently accessed staff and schedule data
3. **Batch Operations:** Efficient handling of bulk schedule generation
4. **Pagination:** Handle large staff lists efficiently
5. **Real-time Updates:** WebSocket support for live schedule updates

## Future Enhancements

1. **Advanced Scheduling:** AI-powered optimal scheduling algorithms
2. **Mobile App:** Native mobile app for staff self-service
3. **Integration:** Integration with payroll and HR systems
4. **Analytics:** Staff performance and scheduling analytics
5. **Notifications:** Automated notifications for schedule changes and approvals
6. **Multi-location Support:** Support for multiple pharmacy locations
7. **Shift Swapping:** Allow staff to swap shifts with approval
8. **Overtime Tracking:** Automatic overtime calculation and tracking
