import { prisma } from "@/lib/prisma";
import type { StaffPosition, ShiftStatus, TimeOffType, TimeOffStatus } from "@/lib/prisma-client";

export interface StaffMember {
  id: string;
  userId: string;
  employeeId: string;
  position: string;
  department: string;
  hireDate: Date;
  salary: number | null;
  isActive: boolean;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  certifications: string[];
  specializations: string[];
  notes: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: string;
  staffId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: string;
  notes?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  staff: {
    id: string;
    employeeId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeOffRequest {
  id: string;
  staffId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: string;
  status: string;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  staff: {
    id: string;
    employeeId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStaffData {
  userId: string;
  employeeId: string;
  position: string;
  department: string;
  hireDate: Date;
  salary?: number;
  emergencyContact?: string;
  emergencyPhone?: string;
  certifications?: string[];
  specializations?: string[];
  notes?: string;
}

export interface UpdateStaffData {
  position?: string;
  department?: string;
  salary?: number;
  isActive?: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
  certifications?: string[];
  specializations?: string[];
  notes?: string;
}

export interface CreateScheduleData {
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isActive?: boolean;
}

export interface CreateShiftData {
  staffId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

export interface CreateTimeOffRequestData {
  staffId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: string;
  notes?: string;
}

export interface StaffAvailability {
  id: string;
  employeeId: string;
  name: string;
  position: string;
  department: string;
  hasSchedule: boolean;
  schedule: object | null;
  hasShift: boolean;
  shift: object | null;
  hasTimeOff: boolean;
  timeOff: object | null;
  isAvailable: boolean;
}

export class StaffService {
  /**
   * Create a new staff member
   */
  static async createStaff(data: CreateStaffData): Promise<StaffMember> {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Check if employee ID is unique
      const existingStaff = await prisma.staff.findUnique({
        where: { employeeId: data.employeeId },
      });

      if (existingStaff) {
        throw new Error("Employee ID already exists");
      }

      const staff = await prisma.staff.create({
        data: {
          userId: data.userId,
          employeeId: data.employeeId,
          position: data.position as StaffPosition,
          department: data.department,
          hireDate: data.hireDate,
          salary: data.salary,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          certifications: data.certifications || [],
          specializations: data.specializations || [],
          notes: data.notes,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      return staff as StaffMember;
    } catch (error) {
      console.error("Error creating staff:", error);
      throw new Error("Failed to create staff member");
    }
  }

  /**
   * Get all staff members
   */
  static async getAllStaff(includeInactive: boolean = false): Promise<StaffMember[]> {
    try {
      const staff = await prisma.staff.findMany({
        where: includeInactive ? {} : { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: [
          { user: { lastName: "asc" } },
          { user: { firstName: "asc" } },
        ],
      });

      return staff as StaffMember[];
    } catch (error) {
      console.error("Error fetching staff:", error);
      throw new Error("Failed to fetch staff members");
    }
  }

  /**
   * Get staff member by ID
   */
  static async getStaffById(staffId: string): Promise<StaffMember> {
    try {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!staff) {
        throw new Error("Staff member not found");
      }

      return staff as StaffMember;
    } catch (error) {
      console.error("Error fetching staff member:", error);
      throw new Error("Failed to fetch staff member");
    }
  }

  /**
   * Update staff member
   */
  static async updateStaff(staffId: string, data: UpdateStaffData): Promise<StaffMember> {
    try {
      const staff = await prisma.staff.update({
        where: { id: staffId },
        data: {
          position: data.position as StaffPosition,
          department: data.department,
          salary: data.salary,
          isActive: data.isActive,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          certifications: data.certifications,
          specializations: data.specializations,
          notes: data.notes,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      return staff as StaffMember;
    } catch (error) {
      console.error("Error updating staff:", error);
      throw new Error("Failed to update staff member");
    }
  }

  /**
   * Deactivate staff member
   */
  static async deactivateStaff(staffId: string): Promise<void> {
    try {
      await prisma.staff.update({
        where: { id: staffId },
        data: { isActive: false },
      });
    } catch (error) {
      console.error("Error deactivating staff:", error);
      throw new Error("Failed to deactivate staff member");
    }
  }

  /**
   * Create staff schedule
   */
  static async createSchedule(data: CreateScheduleData): Promise<StaffSchedule> {
    try {
      const schedule = await prisma.staffSchedule.create({
        data: {
          staffId: data.staffId,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
          breakStart: data.breakStart,
          breakEnd: data.breakEnd,
        },
      });

      return schedule as StaffSchedule;
    } catch (error) {
      console.error("Error creating schedule:", error);
      throw new Error("Failed to create schedule");
    }
  }

  /**
   * Get staff schedules
   */
  static async getStaffSchedules(staffId: string): Promise<StaffSchedule[]> {
    try {
      const schedules = await prisma.staffSchedule.findMany({
        where: { staffId, isActive: true },
        orderBy: { dayOfWeek: "asc" },
      });

      return schedules as StaffSchedule[];
    } catch (error) {
      console.error("Error fetching schedules:", error);
      throw new Error("Failed to fetch schedules");
    }
  }

  /**
   * Update staff schedule
   */
  static async updateSchedule(scheduleId: string, data: Partial<CreateScheduleData>): Promise<StaffSchedule> {
    try {
      const schedule = await prisma.staffSchedule.update({
        where: { id: scheduleId },
        data: {
          startTime: data.startTime,
          endTime: data.endTime,
          breakStart: data.breakStart,
          breakEnd: data.breakEnd,
          isActive: data.isActive,
        },
      });

      return schedule as StaffSchedule;
    } catch (error) {
      console.error("Error updating schedule:", error);
      throw new Error("Failed to update schedule");
    }
  }

  /**
   * Create shift
   */
  static async createShift(data: CreateShiftData): Promise<Shift> {
    try {
      const shift = await prisma.shift.create({
        data: {
          staffId: data.staffId,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes,
        },
        include: {
          staff: {
            select: {
              id: true,
              employeeId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      return shift as Shift;
    } catch (error) {
      console.error("Error creating shift:", error);
      throw new Error("Failed to create shift");
    }
  }

  /**
   * Get shifts for a date range
   */
  static async getShifts(startDate: Date, endDate: Date, staffId?: string): Promise<Shift[]> {
    try {
      const shifts = await prisma.shift.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          ...(staffId && { staffId }),
        },
        include: {
          staff: {
            select: {
              id: true,
              employeeId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: [
          { date: "asc" },
          { startTime: "asc" },
        ],
      });

      return shifts as Shift[];
    } catch (error) {
      console.error("Error fetching shifts:", error);
      throw new Error("Failed to fetch shifts");
    }
  }

  /**
   * Update shift status
   */
  static async updateShiftStatus(shiftId: string, status: string, actualStartTime?: Date, actualEndTime?: Date): Promise<Shift> {
    try {
      const shift = await prisma.shift.update({
        where: { id: shiftId },
        data: {
          status: status as ShiftStatus,
          actualStartTime,
          actualEndTime,
        },
        include: {
          staff: {
            select: {
              id: true,
              employeeId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      return shift as Shift;
    } catch (error) {
      console.error("Error updating shift:", error);
      throw new Error("Failed to update shift");
    }
  }

  /**
   * Create time off request
   */
  static async createTimeOffRequest(data: CreateTimeOffRequestData): Promise<TimeOffRequest> {
    try {
      const timeOffRequest = await prisma.timeOffRequest.create({
        data: {
          staffId: data.staffId,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
          type: data.type as TimeOffType,
          notes: data.notes,
        },
        include: {
          staff: {
            select: {
              id: true,
              employeeId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      return timeOffRequest as TimeOffRequest;
    } catch (error) {
      console.error("Error creating time off request:", error);
      throw new Error("Failed to create time off request");
    }
  }

  /**
   * Get time off requests
   */
  static async getTimeOffRequests(staffId?: string, status?: string): Promise<TimeOffRequest[]> {
    try {
      const timeOffRequests = await prisma.timeOffRequest.findMany({
        where: {
          ...(staffId && { staffId }),
          ...(status && { status: status as TimeOffStatus }),
        },
        include: {
          staff: {
            select: {
              id: true,
              employeeId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: [
          { startDate: "asc" },
          { createdAt: "desc" },
        ],
      });

      return timeOffRequests as TimeOffRequest[];
    } catch (error) {
      console.error("Error fetching time off requests:", error);
      throw new Error("Failed to fetch time off requests");
    }
  }

  /**
   * Approve/reject time off request
   */
  static async updateTimeOffRequestStatus(
    requestId: string,
    status: string,
    approvedBy: string,
    notes?: string
  ): Promise<TimeOffRequest> {
    try {
      const timeOffRequest = await prisma.timeOffRequest.update({
        where: { id: requestId },
        data: {
          status: status as TimeOffStatus,
          approvedBy,
          approvedAt: new Date(),
          notes,
        },
        include: {
          staff: {
            select: {
              id: true,
              employeeId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      return timeOffRequest as TimeOffRequest;
    } catch (error) {
      console.error("Error updating time off request:", error);
      throw new Error("Failed to update time off request");
    }
  }

  /**
   * Get staff availability for a date
   */
  static async getStaffAvailability(date: Date): Promise<StaffAvailability[]> {
    try {
      const dayOfWeek = date.getDay();
      const dateString = date.toISOString().split('T')[0];

      // Get all active staff with their schedules for this day
      const staffWithSchedules = await prisma.staff.findMany({
        where: { isActive: true },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          schedules: {
            where: { dayOfWeek, isActive: true },
          },
          shifts: {
            where: {
              date: {
                gte: new Date(dateString + 'T00:00:00Z'),
                lt: new Date(dateString + 'T23:59:59Z'),
              },
            },
          },
          timeOffRequests: {
            where: {
              startDate: { lte: date },
              endDate: { gte: date },
              status: 'APPROVED',
            },
          },
        },
      });

      return staffWithSchedules.map(staff => ({
        id: staff.id,
        employeeId: staff.employeeId,
        name: `${staff.user.firstName} ${staff.user.lastName}`,
        position: staff.position,
        department: staff.department,
        hasSchedule: staff.schedules.length > 0,
        schedule: staff.schedules[0] || null,
        hasShift: staff.shifts.length > 0,
        shift: staff.shifts[0] || null,
        hasTimeOff: staff.timeOffRequests.length > 0,
        timeOff: staff.timeOffRequests[0] || null,
        isAvailable: staff.schedules.length > 0 && staff.shifts.length === 0 && staff.timeOffRequests.length === 0,
      }));
    } catch (error) {
      console.error("Error fetching staff availability:", error);
      throw new Error("Failed to fetch staff availability");
    }
  }

  /**
   * Generate shifts from schedules for a date range
   */
  static async generateShiftsFromSchedules(startDate: Date, endDate: Date): Promise<Shift[]> {
    try {
      const shifts: Shift[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const dateString = currentDate.toISOString().split('T')[0];

        // Get all schedules for this day
        const schedules = await prisma.staffSchedule.findMany({
          where: {
            dayOfWeek,
            isActive: true,
            staff: { isActive: true },
          },
          include: {
            staff: {
              select: {
                id: true,
                employeeId: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });

        // Create shifts for each schedule
        for (const schedule of schedules) {
          // Check if shift already exists
          const existingShift = await prisma.shift.findFirst({
            where: {
              staffId: schedule.staffId,
              date: {
                gte: new Date(dateString + 'T00:00:00Z'),
                lt: new Date(dateString + 'T23:59:59Z'),
              },
            },
          });

          if (!existingShift) {
            const startTime = new Date(dateString + 'T' + schedule.startTime + ':00Z');
            const endTime = new Date(dateString + 'T' + schedule.endTime + ':00Z');

            const shift = await prisma.shift.create({
              data: {
                staffId: schedule.staffId,
                date: currentDate,
                startTime,
                endTime,
              },
              include: {
                staff: {
                  select: {
                    id: true,
                    employeeId: true,
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            });

            shifts.push(shift as Shift);
          }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return shifts;
    } catch (error) {
      console.error("Error generating shifts:", error);
      throw new Error("Failed to generate shifts");
    }
  }
} 