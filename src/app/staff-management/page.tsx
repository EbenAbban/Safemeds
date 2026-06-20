"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  Clock,
  FileText,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  CalendarDays,
  Clock4,
  FileCheck,
} from "lucide-react";

interface StaffMember {
  id: string;
  userId: string;
  employeeId: string;
  position: string;
  department: string;
  hireDate: string;
  salary?: number;
  isActive: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
  certifications: string[];
  specializations: string[];
  notes?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface StaffSchedule {
  id: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Shift {
  id: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  staff: {
    id: string;
    employeeId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface TimeOffRequest {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  staff: {
    id: string;
    employeeId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const tabs = [
  { id: "staff", label: "Staff Members", icon: Users },
  { id: "schedules", label: "Schedules", icon: Calendar },
  { id: "shifts", label: "Shifts", icon: Clock },
  { id: "time-off", label: "Time Off", icon: FileText },
];

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const positionOptions = [
  "PHARMACIST",
  "PHARMACY_TECHNICIAN",
  "CASHIER",
  "MANAGER",
  "SUPERVISOR",
  "INTERN",
  "VOLUNTEER",
];

const timeOffTypes = [
  "VACATION",
  "SICK_LEAVE",
  "PERSONAL_DAY",
  "BEREAVEMENT",
  "MATERNITY_PATERNITY",
  "UNPAID_LEAVE",
  "OTHER",
];

export default function StaffManagementPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("staff");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Staff state
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showStaffForm, setShowStaffForm] = useState(false);

  // Schedules state
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // Shifts state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showShiftForm, setShowShiftForm] = useState(false);

  // Time off state
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [showTimeOffForm, setShowTimeOffForm] = useState(false);

  // Form states
  const [staffForm, setStaffForm] = useState({
    userId: "",
    employeeId: "",
    position: "",
    department: "",
    hireDate: "",
    salary: "",
    emergencyContact: "",
    emergencyPhone: "",
    certifications: [] as string[],
    specializations: [] as string[],
    notes: "",
  });

  const [scheduleForm, setScheduleForm] = useState({
    staffId: "",
    dayOfWeek: 0,
    startTime: "",
    endTime: "",
    breakStart: "",
    breakEnd: "",
  });

  const [shiftForm, setShiftForm] = useState({
    staffId: "",
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  const [timeOffForm, setTimeOffForm] = useState({
    staffId: "",
    startDate: "",
    endDate: "",
    reason: "",
    type: "",
    notes: "",
  });

  const loadTabData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case "staff":
          await loadStaff();
          break;
        case "schedules":
          await loadSchedules();
          break;
        case "shifts":
          await loadShifts();
          break;
        case "time-off":
          await loadTimeOffRequests();
          break;
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Load data based on active tab
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      setLoading(false);
      return;
    }

    loadTabData();
  }, [session, status, loadTabData]);

  const loadStaff = async () => {
    const response = await fetch("/api/staff");
    if (!response.ok) throw new Error("Failed to fetch staff");
    const data = await response.json();
    setStaff(data);
  };

  const loadSchedules = async () => {
    // Load all staff first to get their schedules
    const staffResponse = await fetch("/api/staff");
    if (!staffResponse.ok) throw new Error("Failed to fetch staff");
    const staffData = await staffResponse.json();

    const allSchedules: StaffSchedule[] = [];
    for (const staffMember of staffData) {
      const scheduleResponse = await fetch(`/api/staff/schedules?staffId=${staffMember.id}`);
      if (scheduleResponse.ok) {
        const schedules = await scheduleResponse.json();
        allSchedules.push(...schedules);
      }
    }
    setSchedules(allSchedules);
  };

  const loadShifts = async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const response = await fetch(
      `/api/staff/shifts?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    if (!response.ok) throw new Error("Failed to fetch shifts");
    const data = await response.json();
    setShifts(data);
  };

  const loadTimeOffRequests = async () => {
    const response = await fetch("/api/staff/time-off");
    if (!response.ok) throw new Error("Failed to fetch time off requests");
    const data = await response.json();
    setTimeOffRequests(data);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...staffForm,
          hireDate: new Date(staffForm.hireDate),
          salary: staffForm.salary ? parseFloat(staffForm.salary) : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to create staff member");

      setShowStaffForm(false);
      setStaffForm({
        userId: "",
        employeeId: "",
        position: "",
        department: "",
        hireDate: "",
        salary: "",
        emergencyContact: "",
        emergencyPhone: "",
        certifications: [],
        specializations: [],
        notes: "",
      });
      await loadStaff();
    } catch (err) {
      console.error("Error creating staff:", err);
      setError("Failed to create staff member");
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/staff/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleForm),
      });

      if (!response.ok) throw new Error("Failed to create schedule");

      setShowScheduleForm(false);
      setScheduleForm({
        staffId: "",
        dayOfWeek: 0,
        startTime: "",
        endTime: "",
        breakStart: "",
        breakEnd: "",
      });
      await loadSchedules();
    } catch (err) {
      console.error("Error creating schedule:", err);
      setError("Failed to create schedule");
    }
  };

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/staff/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...shiftForm,
          date: new Date(shiftForm.date),
          startTime: new Date(`${shiftForm.date}T${shiftForm.startTime}`),
          endTime: new Date(`${shiftForm.date}T${shiftForm.endTime}`),
        }),
      });

      if (!response.ok) throw new Error("Failed to create shift");

      setShowShiftForm(false);
      setShiftForm({
        staffId: "",
        date: "",
        startTime: "",
        endTime: "",
        notes: "",
      });
      await loadShifts();
    } catch (err) {
      console.error("Error creating shift:", err);
      setError("Failed to create shift");
    }
  };

  const handleTimeOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/staff/time-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...timeOffForm,
          startDate: new Date(timeOffForm.startDate),
          endDate: new Date(timeOffForm.endDate),
        }),
      });

      if (!response.ok) throw new Error("Failed to create time off request");

      setShowTimeOffForm(false);
      setTimeOffForm({
        staffId: "",
        startDate: "",
        endDate: "",
        reason: "",
        type: "",
        notes: "",
      });
      await loadTimeOffRequests();
    } catch (err) {
      console.error("Error creating time off request:", err);
      setError("Failed to create time off request");
    }
  };

  const renderTabComponent = () => {
    switch (activeTab) {
      case "staff":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Staff Members</h2>
              <button
                onClick={() => setShowStaffForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={20} />
                Add Staff Member
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading staff members...</div>
            ) : (
              <div className="grid gap-4">
                {staff.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {member.user.firstName} {member.user.lastName}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">ID: {member.employeeId}</p>
                        <p className="text-gray-600 dark:text-gray-300">Position: {member.position}</p>
                        <p className="text-gray-600 dark:text-gray-300">Department: {member.department}</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          Status:{" "}
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              member.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedStaff(member)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case "schedules":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Staff Schedules</h2>
              <button
                onClick={() => setShowScheduleForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CalendarDays size={20} />
                Add Schedule
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading schedules...</div>
            ) : (
              <div className="grid gap-4">
                {schedules.map((schedule) => (
                  <motion.div
                    key={schedule.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {dayNames[schedule.dayOfWeek]}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {schedule.startTime} - {schedule.endTime}
                        </p>
                        {schedule.breakStart && schedule.breakEnd && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Break: {schedule.breakStart} - {schedule.breakEnd}
                          </p>
                        )}
                        <p className="text-gray-600">
                          Status:{" "}
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              schedule.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {schedule.isActive ? "Active" : "Inactive"}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case "shifts":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Staff Shifts</h2>
              <button
                onClick={() => setShowShiftForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Clock4 size={20} />
                Add Shift
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading shifts...</div>
            ) : (
              <div className="grid gap-4">
                {shifts.map((shift) => (
                  <motion.div
                    key={shift.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {shift.staff.user.firstName} {shift.staff.user.lastName}
                        </h3>
                        <p className="text-gray-600">
                          {new Date(shift.date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600">
                          {new Date(shift.startTime).toLocaleTimeString()} -{" "}
                          {new Date(shift.endTime).toLocaleTimeString()}
                        </p>
                        <p className="text-gray-600">
                          Status:{" "}
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              shift.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : shift.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {shift.status}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case "time-off":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Time Off Requests</h2>
              <button
                onClick={() => setShowTimeOffForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileCheck size={20} />
                Request Time Off
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading time off requests...</div>
            ) : (
              <div className="grid gap-4">
                {timeOffRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {request.staff.user.firstName} {request.staff.user.lastName}
                        </h3>
                        <p className="text-gray-600">
                          {new Date(request.startDate).toLocaleDateString()} -{" "}
                          {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600">Type: {request.type}</p>
                        <p className="text-gray-600">Reason: {request.reason}</p>
                        <p className="text-gray-600">
                          Status:{" "}
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              request.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : request.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {request.status}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {request.status === "PENDING" && (
                          <>
                            <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                              <CheckCircle size={16} />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300">Please log in to access staff management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage pharmacy staff, schedules, shifts, and time-off requests
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 mb-6">
          <div className="flex space-x-1 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          {renderTabComponent()}
        </div>

        {/* Staff Form Modal */}
        {showStaffForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Staff Member</h3>
              <form onSubmit={handleStaffSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={staffForm.userId}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, userId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={staffForm.employeeId}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, employeeId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Position
                  </label>
                  <select
                    value={staffForm.position}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, position: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select position</option>
                    {positionOptions.map((position) => (
                      <option key={position} value={position}>
                        {position.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Department
                  </label>
                  <input
                    type="text"
                    value={staffForm.department}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, department: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    value={staffForm.hireDate}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, hireDate: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add Staff Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStaffForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Schedule Form Modal */}
        {showScheduleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Schedule</h3>
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Staff Member
                  </label>
                  <select
                    value={scheduleForm.staffId}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, staffId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select staff member</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.user.firstName} {member.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Day of Week
                  </label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        dayOfWeek: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    {dayNames.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.startTime}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          startTime: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.endTime}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          endTime: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Shift Form Modal */}
        {showShiftForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Shift</h3>
              <form onSubmit={handleShiftSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Staff Member
                  </label>
                  <select
                    value={shiftForm.staffId}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, staffId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select staff member</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.user.firstName} {member.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </label>
                  <input
                    type="date"
                    value={shiftForm.date}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, date: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={shiftForm.startTime}
                      onChange={(e) =>
                        setShiftForm({
                          ...shiftForm,
                          startTime: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={shiftForm.endTime}
                      onChange={(e) =>
                        setShiftForm({
                          ...shiftForm,
                          endTime: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add Shift
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShiftForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Time Off Form Modal */}
        {showTimeOffForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Request Time Off</h3>
              <form onSubmit={handleTimeOffSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Staff Member
                  </label>
                  <select
                    value={timeOffForm.staffId}
                    onChange={(e) =>
                      setTimeOffForm({ ...timeOffForm, staffId: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select staff member</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.user.firstName} {member.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={timeOffForm.startDate}
                      onChange={(e) =>
                        setTimeOffForm({
                          ...timeOffForm,
                          startDate: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={timeOffForm.endDate}
                      onChange={(e) =>
                        setTimeOffForm({
                          ...timeOffForm,
                          endDate: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    value={timeOffForm.type}
                    onChange={(e) =>
                      setTimeOffForm({ ...timeOffForm, type: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select type</option>
                    {timeOffTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason
                  </label>
                  <textarea
                    value={timeOffForm.reason}
                    onChange={(e) =>
                      setTimeOffForm({ ...timeOffForm, reason: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTimeOffForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 