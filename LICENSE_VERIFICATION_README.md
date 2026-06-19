# License Verification System for Pharmacists

This document describes the license verification system implemented for pharmacist authentication in SafeMeds.

## Overview

The license verification system ensures that only qualified pharmacists with valid licenses can register and sign in to the platform. The system includes:

1. **License Verification API** - Dedicated endpoint for verifying pharmacist licenses
2. **Real-time Validation** - Frontend validation during sign-up and sign-in
3. **Database Integration** - License numbers are stored and verified against the database
4. **Mock Verification Service** - Simulated external verification (replace with real API in production)

## API Endpoints

### POST `/api/auth/verify-license`

Verifies a pharmacist license number.

**Request Body:**

```json
{
  "licenseNumber": "PH123456",
  "email": "pharmacist@example.com", // Optional, for checking duplicates
  "state": "NY", // Optional, for state-specific verification
  "isSignIn": false // Optional, set to true for sign-in verification (allows new licenses)
}
```

**Response:**

```json
{
  "isValid": true,
  "message": "License verified successfully",
  "details": {
    "name": "Dr. Sarah Johnson",
    "state": "NY",
    "expirationDate": "2025-12-31",
    "status": "ACTIVE"
  }
}
```

### GET `/api/auth/verify-license?licenseNumber=PH123456&email=pharmacist@example.com`

Real-time license availability check.

**Response:**

```json
{
  "isValid": true,
  "available": true
}
```

## Authentication Flow

### Pharmacist Sign-up Process

1. User selects "Pharmacist" role
2. User fills in all required fields including license number
3. Frontend validates license number format
4. License is verified via API call
5. If valid, account is created with `isVerified: true`
6. If invalid, error message is displayed

### Pharmacist Sign-in Process

1. User selects "Pharmacist" role
2. User enters email, password, and license number
3. System verifies:
   - Email exists in database
   - User role is "PHARMACY"
   - Account is verified
   - Password is correct
   - License number (either matches stored license OR is a valid new license)
4. If license is new and valid, it updates the user's license in the database
5. If all checks pass, user is authenticated

## License Number Format

- **Format**: `PH123456` (2 letters followed by 6 digits)
- **Validation**: `/^[A-Z]{2}\d{6}$/`
- **Examples**: `PH123456`, `PH789012`, `PH345678`

## Sign-in License Verification

The system now supports pharmacists entering new license numbers during sign-in:

### Features

- **New License Support**: Pharmacists can enter a new license number during sign-in
- **Automatic Verification**: New licenses are verified against the external verification service
- **Database Update**: If the new license is valid, it automatically updates the user's license in the database
- **Seamless Experience**: No additional steps required - the process is transparent to the user

### Use Cases

- **License Renewal**: When a pharmacist renews their license and gets a new number
- **License Transfer**: When a pharmacist moves to a different state and gets a new license
- **License Correction**: When a pharmacist needs to correct their license information

### Security

- New licenses are verified against the same external verification service
- Only valid, verified licenses are accepted
- The verification process maintains the same security standards as sign-up

## Mock License Data

For development/testing purposes, the following license numbers are considered valid:

| License Number | State | Name                | Expiration |
| -------------- | ----- | ------------------- | ---------- |
| PH123456       | NY    | Dr. Sarah Johnson   | 2025-12-31 |
| PH789012       | CA    | Dr. Michael Chen    | 2025-06-30 |
| PH345678       | TX    | Dr. Emily Rodriguez | 2024-12-31 |
| PH901234       | FL    | Dr. David Thompson  | 2025-03-15 |
| PH567890       | IL    | Dr. Lisa Wang       | 2025-09-30 |

## Frontend Integration

### License Service (`src/services/licenseService.ts`)

The frontend uses a dedicated service for license verification:

```typescript
import {
  verifyLicense,
  checkLicenseAvailability,
  validateLicenseFormat,
} from "@/services/licenseService";

// Verify license during sign-up
const result = await verifyLicense(licenseNumber, email, state);

// Check availability in real-time
const availability = await checkLicenseAvailability(licenseNumber, email);

// Validate format
const isValidFormat = validateLicenseFormat(licenseNumber);
```

### Form Validation

The sign-up form includes real-time license validation:

1. **Format Validation** - Checks if license follows correct format
2. **Availability Check** - Verifies license isn't already registered
3. **Verification** - Calls external service to verify license validity

## Security Considerations

1. **License Uniqueness** - Each license can only be registered once
2. **Role Verification** - Only users with "PHARMACY" role can use license verification
3. **Input Validation** - All inputs are validated and sanitized
4. **Error Handling** - Sensitive information is not exposed in error messages

## Production Implementation

To implement in production:

1. **Replace Mock Service** - Integrate with real state board APIs
2. **Add Rate Limiting** - Prevent abuse of verification endpoints
3. **Implement Caching** - Cache verification results to reduce API calls
4. **Add Logging** - Log all verification attempts for audit purposes
5. **Error Handling** - Implement proper error handling for external API failures

## Testing

### Manual Testing

1. **Valid License Sign-up**:

   - Use one of the mock license numbers
   - Should successfully create account

2. **Invalid License Sign-up**:

   - Use invalid license number
   - Should show error message

3. **Duplicate License**:

   - Try to register same license twice
   - Should show "already registered" error

4. **Pharmacist Sign-in**:

   - Use valid email, password, and license
   - Should successfully authenticate

5. **Pharmacist Sign-in with New License**:
   - Use valid email and password
   - Enter a different valid license number
   - Should verify new license and update database
   - Should successfully authenticate

### API Testing

Test the verification endpoints directly:

```bash
# Verify license for signup
curl -X POST http://localhost:3000/api/auth/verify-license \
  -H "Content-Type: application/json" \
  -d '{"licenseNumber": "PH123456", "state": "NY"}'

# Verify license for sign-in (allows new licenses)
curl -X POST http://localhost:3000/api/auth/verify-license \
  -H "Content-Type: application/json" \
  -d '{"licenseNumber": "PH789012", "email": "pharmacist@example.com", "isSignIn": true}'

# Check availability
curl "http://localhost:3000/api/auth/verify-license?licenseNumber=PH123456"
```

## Error Codes

| Error                        | Description                                   | HTTP Status |
| ---------------------------- | --------------------------------------------- | ----------- |
| `LICENSE_REQUIRED`           | License number is required                    | 400         |
| `INVALID_FORMAT`             | License number format is invalid              | 400         |
| `LICENSE_NOT_FOUND`          | License not found in verification system      | 400         |
| `LICENSE_ALREADY_REGISTERED` | License already registered to another account | 409         |
| `VERIFICATION_FAILED`        | External verification service failed          | 500         |

## Future Enhancements

1. **Multi-state Support** - Support for different state board APIs
2. **License Renewal Tracking** - Monitor license expiration dates
3. **Bulk Verification** - Verify multiple licenses at once
4. **Verification History** - Track verification attempts and results
5. **License Status Updates** - Periodic checks for license status changes
