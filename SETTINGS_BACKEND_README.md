# Settings Backend Implementation

This document describes the comprehensive settings backend implementation for the SafeMeds application, including the database schema, API endpoints, service layer, and client-side integration.

## Table of Contents

1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [Service Layer](#service-layer)
4. [Client Integration](#client-integration)
5. [Authentication](#authentication)
6. [Validation](#validation)
7. [Error Handling](#error-handling)
8. [Usage Examples](#usage-examples)

## Database Schema

### UserSettings Model

The `UserSettings` model is defined in `src/prisma/schema.prisma`:

```prisma
model UserSettings {
  id              String   @id @default(cuid())
  userId          String   @unique
  theme           String   @default("light")
  language        String   @default("en")
  timezone        String   @default("UTC")
  dateFormat      String   @default("MM/DD/YYYY")

  // Privacy settings
  anonymousConsultations Boolean @default(true)
  dataRetentionPeriod    String  @default("30")
  encryptionLevel        String  @default("aes256")
  autoDeleteChats        Boolean @default(true)
  maskedDeliveryDefault  Boolean @default(true)

  // Delivery settings
  campusDropPoints       String[] @default([])
  deliveryHoursStart     String  @default("08:00")
  deliveryHoursEnd       String  @default("20:00")
  emergencyDelivery      Boolean @default(true)
  deliveryRadius         String  @default("5")
  trackingEnabled        Boolean @default(true)

  // Notification settings
  newConsultations       Boolean @default(true)
  urgentRequests         Boolean @default(true)
  deliveryUpdates        Boolean @default(true)
  systemAlerts           Boolean @default(true)
  emailNotifications     Boolean @default(true)
  smsNotifications       Boolean @default(false)

  // Security settings
  twoFactorAuth          Boolean @default(false)
  sessionTimeout         String  @default("30")
  ipWhitelist            String  @default("")
  auditLogging           Boolean @default(true)
  suspiciousActivityAlerts Boolean @default(true)

  // Consultation settings
  maxActiveChats         String  @default("10")
  responseTimeTarget     String  @default("15")
  autoAssignment         Boolean @default(true)
  prioritizeUrgent       Boolean @default(true)
  allowFileUploads       Boolean @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

### User Model Update

The `User` model has been updated to include the settings relation:

```prisma
model User {
  // ... existing fields ...

  // Relations
  settings     UserSettings?

  @@map("users")
}
```

## API Endpoints

### Base URL

```
/api/settings
```

### GET /api/settings

Retrieves the current user's settings.

**Authentication:** Required (NextAuth v5)

**Response:**

```json
{
  "theme": "light",
  "language": "en",
  "timezone": "UTC",
  "dateFormat": "MM/DD/YYYY",
  "privacy": {
    "anonymousConsultations": true,
    "dataRetentionPeriod": "30",
    "encryptionLevel": "aes256",
    "autoDeleteChats": true,
    "maskedDeliveryDefault": true
  },
  "delivery": {
    "campusDropPoints": [],
    "deliveryHours": {
      "start": "08:00",
      "end": "20:00"
    },
    "emergencyDelivery": true,
    "deliveryRadius": "5",
    "trackingEnabled": true
  },
  "notifications": {
    "newConsultations": true,
    "urgentRequests": true,
    "deliveryUpdates": true,
    "systemAlerts": true,
    "emailNotifications": true,
    "smsNotifications": false
  },
  "security": {
    "twoFactorAuth": false,
    "sessionTimeout": "30",
    "ipWhitelist": "",
    "auditLogging": true,
    "suspiciousActivityAlerts": true
  },
  "consultation": {
    "maxActiveChats": "10",
    "responseTimeTarget": "15",
    "autoAssignment": true,
    "prioritizeUrgent": true,
    "allowFileUploads": true
  }
}
```

### PUT /api/settings

Updates the current user's settings.

**Authentication:** Required (NextAuth v5)

**Request Body:** Partial settings object

```json
{
  "theme": "dark",
  "privacy": {
    "anonymousConsultations": false
  }
}
```

**Response:** Updated settings object (same format as GET)

### DELETE /api/settings

Resets the current user's settings to defaults.

**Authentication:** Required (NextAuth v5)

**Response:**

```json
{
  "message": "Settings reset to defaults"
}
```

## Service Layer

### SettingsService

Located in `src/services/settingsService.ts`, this service provides:

- **getUserSettings(userId):** Retrieves user settings or creates defaults
- **updateUserSettings(userId, updateData):** Updates user settings with validation
- **resetUserSettings(userId):** Resets settings to defaults
- **validateSettings(data):** Validates settings data
- **getMultipleUserSettings(userIds):** Admin function for bulk retrieval

### Key Features

1. **Automatic Default Creation:** Creates default settings for new users
2. **Data Validation:** Comprehensive validation for all settings
3. **Type Safety:** Full TypeScript support with interfaces
4. **Error Handling:** Proper error handling and logging
5. **Database Optimization:** Uses Prisma for efficient database operations

## Client Integration

### useSettings Hook

Located in `src/hooks/useSettings.ts`, this React hook provides:

```typescript
const {
  settings,
  loading,
  saving,
  error,
  updateSettings,
  updateSetting,
  updateNestedSetting,
  resetSettings,
  refetch,
} = useSettings();
```

### Usage Examples

```typescript
// Update theme
await updateSetting("theme", "dark");

// Update nested setting
await updateNestedSetting("privacy", "anonymousConsultations", false);

// Update multiple settings
await updateSettings({
  theme: "dark",
  language: "es",
  privacy: {
    anonymousConsultations: false,
  },
});

// Reset to defaults
await resetSettings();
```

## Authentication

The settings API uses NextAuth v5 for authentication:

```typescript
import { auth } from "@/app/auth";

async function getUserIdFromSession(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}
```

### Security Features

1. **Session-based Authentication:** All endpoints require valid session
2. **User Isolation:** Users can only access their own settings
3. **Input Validation:** All inputs are validated before processing
4. **Error Sanitization:** Errors don't expose sensitive information

## Validation

### Settings Validation Rules

- **Theme:** Must be 'light' or 'dark'
- **Language:** Must be one of: 'en', 'es', 'fr', 'de'
- **Timezone:** Must be one of: 'UTC', 'EST', 'PST', 'CET'
- **Date Format:** Must be one of: 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'
- **Data Retention Period:** Must be between 1 and 365 days
- **Delivery Radius:** Must be between 0.1 and 50 miles
- **Session Timeout:** Must be between 5 and 1440 minutes
- **Max Active Chats:** Must be between 1 and 100
- **Response Time Target:** Must be between 1 and 60 minutes

### Validation Response

```json
{
  "error": "Invalid settings data",
  "details": [
    "Theme must be either 'light' or 'dark'",
    "Data retention period must be between 1 and 365 days"
  ]
}
```

## Error Handling

### HTTP Status Codes

- **200:** Success
- **400:** Bad Request (validation errors)
- **401:** Unauthorized (authentication required)
- **500:** Internal Server Error

### Error Response Format

```json
{
  "error": "Error message",
  "details": ["Additional error details"]
}
```

## Usage Examples

### Frontend Component Example

```typescript
import { useSettings } from "@/hooks/useSettings";

export function SettingsPage() {
  const { settings, loading, saving, error, updateSettings, resetSettings } =
    useSettings();

  const handleThemeChange = async (theme: string) => {
    try {
      await updateSettings({ theme });
    } catch (err) {
      console.error("Failed to update theme:", err);
    }
  };

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Settings</h1>
      <div>
        <label>Theme:</label>
        <select
          value={settings.theme}
          onChange={(e) => handleThemeChange(e.target.value)}
          disabled={saving}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <button onClick={resetSettings} disabled={saving}>
        Reset to Defaults
      </button>
    </div>
  );
}
```

### API Client Example

```typescript
// Fetch settings
const response = await fetch("/api/settings");
const settings = await response.json();

// Update settings
const updateResponse = await fetch("/api/settings", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    theme: "dark",
    privacy: { anonymousConsultations: false },
  }),
});

// Reset settings
const resetResponse = await fetch("/api/settings", {
  method: "DELETE",
});
```

## Database Migration

To apply the database changes:

```bash
npx prisma migrate dev --name add_user_settings
```

This will:

1. Create the `user_settings` table
2. Add the foreign key relationship to the `users` table
3. Apply all default values

## Performance Considerations

1. **Caching:** Settings are cached in the client-side hook
2. **Optimistic Updates:** UI updates immediately, then syncs with server
3. **Batch Updates:** Multiple settings can be updated in a single request
4. **Database Indexing:** User ID is indexed for fast lookups

## Security Considerations

1. **Input Sanitization:** All inputs are validated and sanitized
2. **SQL Injection Prevention:** Using Prisma ORM for safe database queries
3. **Authentication:** All endpoints require valid session
4. **Authorization:** Users can only access their own settings
5. **Rate Limiting:** Consider implementing rate limiting for production

## Testing

### Unit Tests

```typescript
import { SettingsService } from "@/services/settingsService";

describe("SettingsService", () => {
  it("should validate settings correctly", () => {
    const result = SettingsService.validateSettings({
      theme: "invalid",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Theme must be either 'light' or 'dark'");
  });
});
```

### Integration Tests

```typescript
import { createMocks } from "node-mocks-http";
import { GET, PUT } from "@/app/api/settings/route";

describe("/api/settings", () => {
  it("should return 401 for unauthenticated requests", async () => {
    const { req } = createMocks({ method: "GET" });
    const response = await GET(req);

    expect(response.status).toBe(401);
  });
});
```

## Future Enhancements

1. **Settings Templates:** Predefined settings templates for different user types
2. **Settings Import/Export:** Allow users to backup and restore settings
3. **Settings History:** Track changes to settings over time
4. **Bulk Operations:** Admin tools for managing multiple users' settings
5. **Settings Analytics:** Track which settings are most commonly used
6. **Real-time Sync:** WebSocket support for real-time settings updates
7. **Settings Migration:** Tools for migrating settings between versions

## Troubleshooting

### Common Issues

1. **Settings not loading:** Check authentication status and network connectivity
2. **Validation errors:** Ensure all input values match the validation rules
3. **Database errors:** Verify database connection and migration status
4. **Type errors:** Ensure TypeScript types match the actual data structure

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=settings:*
```

This will log all settings-related operations for debugging purposes.
