import { PrismaClient } from "@/lib/prisma-client";

const prisma = new PrismaClient();

export interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  privacy: {
    anonymousConsultations: boolean;
    dataRetentionPeriod: string;
    encryptionLevel: string;
    autoDeleteChats: boolean;
    maskedDeliveryDefault: boolean;
  };
  delivery: {
    campusDropPoints: string[];
    deliveryHours: {
      start: string;
      end: string;
    };
    emergencyDelivery: boolean;
    deliveryRadius: string;
    trackingEnabled: boolean;
  };
  notifications: {
    newConsultations: boolean;
    urgentRequests: boolean;
    deliveryUpdates: boolean;
    systemAlerts: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    ipWhitelist: string;
    auditLogging: boolean;
    suspiciousActivityAlerts: boolean;
  };
  consultation: {
    maxActiveChats: string;
    responseTimeTarget: string;
    autoAssignment: boolean;
    prioritizeUrgent: boolean;
    allowFileUploads: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsUpdateData {
  theme?: string;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  privacy?: {
    anonymousConsultations?: boolean;
    dataRetentionPeriod?: string;
    encryptionLevel?: string;
    autoDeleteChats?: boolean;
    maskedDeliveryDefault?: boolean;
  };
  delivery?: {
    campusDropPoints?: string[];
    deliveryHours?: {
      start?: string;
      end?: string;
    };
    emergencyDelivery?: boolean;
    deliveryRadius?: string;
    trackingEnabled?: boolean;
  };
  notifications?: {
    newConsultations?: boolean;
    urgentRequests?: boolean;
    deliveryUpdates?: boolean;
    systemAlerts?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };
  security?: {
    twoFactorAuth?: boolean;
    sessionTimeout?: string;
    ipWhitelist?: string;
    auditLogging?: boolean;
    suspiciousActivityAlerts?: boolean;
  };
  consultation?: {
    maxActiveChats?: string;
    responseTimeTarget?: string;
    autoAssignment?: boolean;
    prioritizeUrgent?: boolean;
    allowFileUploads?: boolean;
  };
}

export class SettingsService {
  /**
   * Get user settings by user ID
   */
  static async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      let userSettings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!userSettings) {
        // Create default settings if none exist
        userSettings = await prisma.userSettings.create({
          data: { userId },
        });
      }

      return this.transformToUserSettings(userSettings);
    } catch (error) {
      console.error("Error getting user settings:", error);
      throw new Error("Failed to retrieve user settings");
    }
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(
    userId: string,
    updateData: SettingsUpdateData
  ): Promise<UserSettings> {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Prepare update data for database
      const dbUpdateData: Record<string, unknown> = {};

      // Basic settings
      if (updateData.theme !== undefined) dbUpdateData.theme = updateData.theme;
      if (updateData.language !== undefined) dbUpdateData.language = updateData.language;
      if (updateData.timezone !== undefined) dbUpdateData.timezone = updateData.timezone;
      if (updateData.dateFormat !== undefined) dbUpdateData.dateFormat = updateData.dateFormat;

      // Privacy settings
      if (updateData.privacy) {
        if (updateData.privacy.anonymousConsultations !== undefined) 
          dbUpdateData.anonymousConsultations = updateData.privacy.anonymousConsultations;
        if (updateData.privacy.dataRetentionPeriod !== undefined) 
          dbUpdateData.dataRetentionPeriod = updateData.privacy.dataRetentionPeriod;
        if (updateData.privacy.encryptionLevel !== undefined) 
          dbUpdateData.encryptionLevel = updateData.privacy.encryptionLevel;
        if (updateData.privacy.autoDeleteChats !== undefined) 
          dbUpdateData.autoDeleteChats = updateData.privacy.autoDeleteChats;
        if (updateData.privacy.maskedDeliveryDefault !== undefined) 
          dbUpdateData.maskedDeliveryDefault = updateData.privacy.maskedDeliveryDefault;
      }

      // Delivery settings
      if (updateData.delivery) {
        if (updateData.delivery.campusDropPoints !== undefined) 
          dbUpdateData.campusDropPoints = updateData.delivery.campusDropPoints;
        if (updateData.delivery.deliveryHours) {
          if (updateData.delivery.deliveryHours.start !== undefined) 
            dbUpdateData.deliveryHoursStart = updateData.delivery.deliveryHours.start;
          if (updateData.delivery.deliveryHours.end !== undefined) 
            dbUpdateData.deliveryHoursEnd = updateData.delivery.deliveryHours.end;
        }
        if (updateData.delivery.emergencyDelivery !== undefined) 
          dbUpdateData.emergencyDelivery = updateData.delivery.emergencyDelivery;
        if (updateData.delivery.deliveryRadius !== undefined) 
          dbUpdateData.deliveryRadius = updateData.delivery.deliveryRadius;
        if (updateData.delivery.trackingEnabled !== undefined) 
          dbUpdateData.trackingEnabled = updateData.delivery.trackingEnabled;
      }

      // Notification settings
      if (updateData.notifications) {
        if (updateData.notifications.newConsultations !== undefined) 
          dbUpdateData.newConsultations = updateData.notifications.newConsultations;
        if (updateData.notifications.urgentRequests !== undefined) 
          dbUpdateData.urgentRequests = updateData.notifications.urgentRequests;
        if (updateData.notifications.deliveryUpdates !== undefined) 
          dbUpdateData.deliveryUpdates = updateData.notifications.deliveryUpdates;
        if (updateData.notifications.systemAlerts !== undefined) 
          dbUpdateData.systemAlerts = updateData.notifications.systemAlerts;
        if (updateData.notifications.emailNotifications !== undefined) 
          dbUpdateData.emailNotifications = updateData.notifications.emailNotifications;
        if (updateData.notifications.smsNotifications !== undefined) 
          dbUpdateData.smsNotifications = updateData.notifications.smsNotifications;
      }

      // Security settings
      if (updateData.security) {
        if (updateData.security.twoFactorAuth !== undefined) 
          dbUpdateData.twoFactorAuth = updateData.security.twoFactorAuth;
        if (updateData.security.sessionTimeout !== undefined) 
          dbUpdateData.sessionTimeout = updateData.security.sessionTimeout;
        if (updateData.security.ipWhitelist !== undefined) 
          dbUpdateData.ipWhitelist = updateData.security.ipWhitelist;
        if (updateData.security.auditLogging !== undefined) 
          dbUpdateData.auditLogging = updateData.security.auditLogging;
        if (updateData.security.suspiciousActivityAlerts !== undefined) 
          dbUpdateData.suspiciousActivityAlerts = updateData.security.suspiciousActivityAlerts;
      }

      // Consultation settings
      if (updateData.consultation) {
        if (updateData.consultation.maxActiveChats !== undefined) 
          dbUpdateData.maxActiveChats = updateData.consultation.maxActiveChats;
        if (updateData.consultation.responseTimeTarget !== undefined) 
          dbUpdateData.responseTimeTarget = updateData.consultation.responseTimeTarget;
        if (updateData.consultation.autoAssignment !== undefined) 
          dbUpdateData.autoAssignment = updateData.consultation.autoAssignment;
        if (updateData.consultation.prioritizeUrgent !== undefined) 
          dbUpdateData.prioritizeUrgent = updateData.consultation.prioritizeUrgent;
        if (updateData.consultation.allowFileUploads !== undefined) 
          dbUpdateData.allowFileUploads = updateData.consultation.allowFileUploads;
      }

      // Update or create settings
      const updatedSettings = await prisma.userSettings.upsert({
        where: { userId },
        update: dbUpdateData,
        create: {
          userId,
          ...dbUpdateData,
        },
      });

      return this.transformToUserSettings(updatedSettings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw new Error("Failed to update user settings");
    }
  }

  /**
   * Reset user settings to defaults
   */
  static async resetUserSettings(userId: string): Promise<void> {
    try {
      await prisma.userSettings.delete({
        where: { userId },
      });
    } catch (error) {
      console.error("Error resetting user settings:", error);
      throw new Error("Failed to reset user settings");
    }
  }

  /**
   * Get settings for multiple users (admin function)
   */
  static async getMultipleUserSettings(userIds: string[]): Promise<UserSettings[]> {
    try {
      const settings = await prisma.userSettings.findMany({
        where: {
          userId: {
            in: userIds,
          },
        },
      });

      return settings.map(setting => this.transformToUserSettings(setting));
    } catch (error) {
      console.error("Error getting multiple user settings:", error);
      throw new Error("Failed to retrieve multiple user settings");
    }
  }

  /**
   * Validate settings data
   */
  static validateSettings(data: SettingsUpdateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate theme
    if (data.theme && !['light', 'dark'].includes(data.theme)) {
      errors.push("Theme must be either 'light' or 'dark'");
    }

    // Validate language
    if (data.language && !['en', 'es', 'fr', 'de'].includes(data.language)) {
      errors.push("Language must be one of: en, es, fr, de");
    }

    // Validate timezone
    if (data.timezone && !['UTC', 'EST', 'PST', 'CET'].includes(data.timezone)) {
      errors.push("Timezone must be one of: UTC, EST, PST, CET");
    }

    // Validate date format
    if (data.dateFormat && !['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(data.dateFormat)) {
      errors.push("Date format must be one of: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD");
    }

    // Validate data retention period
    if (data.privacy?.dataRetentionPeriod) {
      const retention = parseInt(data.privacy.dataRetentionPeriod);
      if (isNaN(retention) || retention < 1 || retention > 365) {
        errors.push("Data retention period must be between 1 and 365 days");
      }
    }

    // Validate delivery radius
    if (data.delivery?.deliveryRadius) {
      const radius = parseFloat(data.delivery.deliveryRadius);
      if (isNaN(radius) || radius < 0.1 || radius > 50) {
        errors.push("Delivery radius must be between 0.1 and 50 miles");
      }
    }

    // Validate session timeout
    if (data.security?.sessionTimeout) {
      const timeout = parseInt(data.security.sessionTimeout);
      if (isNaN(timeout) || timeout < 5 || timeout > 1440) {
        errors.push("Session timeout must be between 5 and 1440 minutes");
      }
    }

    // Validate max active chats
    if (data.consultation?.maxActiveChats) {
      const maxChats = parseInt(data.consultation.maxActiveChats);
      if (isNaN(maxChats) || maxChats < 1 || maxChats > 100) {
        errors.push("Max active chats must be between 1 and 100");
      }
    }

    // Validate response time target
    if (data.consultation?.responseTimeTarget) {
      const responseTime = parseInt(data.consultation.responseTimeTarget);
      if (isNaN(responseTime) || responseTime < 1 || responseTime > 60) {
        errors.push("Response time target must be between 1 and 60 minutes");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Transform database settings to UserSettings interface
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static transformToUserSettings(dbSettings: any): UserSettings {
    return {
      id: dbSettings.id,
      userId: dbSettings.userId,
      theme: dbSettings.theme,
      language: dbSettings.language,
      timezone: dbSettings.timezone,
      dateFormat: dbSettings.dateFormat,
      privacy: {
        anonymousConsultations: dbSettings.anonymousConsultations,
        dataRetentionPeriod: dbSettings.dataRetentionPeriod,
        encryptionLevel: dbSettings.encryptionLevel,
        autoDeleteChats: dbSettings.autoDeleteChats,
        maskedDeliveryDefault: dbSettings.maskedDeliveryDefault,
      },
      delivery: {
        campusDropPoints: dbSettings.campusDropPoints,
        deliveryHours: {
          start: dbSettings.deliveryHoursStart,
          end: dbSettings.deliveryHoursEnd,
        },
        emergencyDelivery: dbSettings.emergencyDelivery,
        deliveryRadius: dbSettings.deliveryRadius,
        trackingEnabled: dbSettings.trackingEnabled,
      },
      notifications: {
        newConsultations: dbSettings.newConsultations,
        urgentRequests: dbSettings.urgentRequests,
        deliveryUpdates: dbSettings.deliveryUpdates,
        systemAlerts: dbSettings.systemAlerts,
        emailNotifications: dbSettings.emailNotifications,
        smsNotifications: dbSettings.smsNotifications,
      },
      security: {
        twoFactorAuth: dbSettings.twoFactorAuth,
        sessionTimeout: dbSettings.sessionTimeout,
        ipWhitelist: dbSettings.ipWhitelist,
        auditLogging: dbSettings.auditLogging,
        suspiciousActivityAlerts: dbSettings.suspiciousActivityAlerts,
      },
      consultation: {
        maxActiveChats: dbSettings.maxActiveChats,
        responseTimeTarget: dbSettings.responseTimeTarget,
        autoAssignment: dbSettings.autoAssignment,
        prioritizeUrgent: dbSettings.prioritizeUrgent,
        allowFileUploads: dbSettings.allowFileUploads,
      },
      createdAt: dbSettings.createdAt,
      updatedAt: dbSettings.updatedAt,
    };
  }
} 