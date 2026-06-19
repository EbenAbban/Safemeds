# SafeMeds Pharmacy Dashboard Backend

## Overview

This document outlines the comprehensive backend implementation for the SafeMeds pharmacy dashboard, designed to support anonymous consultations, verified pharmacist communication, and discreet delivery as outlined in the SafeMeds proposal.

## Architecture

The backend is built using:

- **Next.js 14** with App Router
- **Prisma ORM** with PostgreSQL
- **NextAuth.js** for authentication
- **TypeScript** for type safety
- **RESTful API** design

## Database Schema

### Core Models

#### User

- Supports multiple roles: CLIENT, PHARMACY, ADMIN
- Stores pharmacist license information
- Links to consultations, prescriptions, orders, and inventory

#### Consultation

- Supports both authenticated and anonymous consultations
- Includes detailed health information (symptoms, medications, allergies)
- Links to assigned pharmacists and chat messages
- Tracks consultation status and progress

#### Message

- Supports chat communication between patients and pharmacists
- Handles both authenticated and anonymous users
- Includes message types (TEXT, IMAGE, FILE, SYSTEM)
- Tracks pharmacist vs patient messages

#### Medication

- Comprehensive medication database
- Includes prescription requirements, controlled substance flags
- Stores pricing, side effects, interactions, contraindications
- Links to inventory and prescriptions

#### InventoryItem

- Tracks medication stock levels per pharmacy
- Manages lot numbers, expiration dates, locations
- Provides low stock and expiration alerts
- Links medications to specific pharmacies

#### Prescription

- Links consultations to specific medications
- Tracks prescription status (PENDING, APPROVED, REJECTED, DISPENSED, EXPIRED)
- Supports both authenticated and anonymous prescriptions
- Includes dosage, frequency, duration, and refill information

#### Order

- Manages medication orders and payments
- Tracks order status and payment status
- Links to prescriptions and deliveries
- Supports anonymous orders

#### Delivery

- Handles discreet delivery tracking
- Supports anonymous deliveries with tracking numbers
- Includes drop point and package type information
- Tracks delivery status and history

#### AnonymousSession

- Manages anonymous user sessions
- Links anonymous consultations, orders, and deliveries
- Includes session expiration for security

## API Endpoints

### Consultations

#### `GET /api/consultations`

- Fetch consultations with filtering and pagination
- Supports status, type, and role-based filtering
- Returns consultation data with user and pharmacist information

#### `POST /api/consultations`

- Create new consultations
- Supports both authenticated and anonymous consultations
- Validates required fields and generates anonymous IDs

#### `GET /api/consultations/[id]`

- Fetch specific consultation details
- Includes messages, prescriptions, and user information
- Enforces access control based on user role and ownership

#### `PUT /api/consultations/[id]`

- Update consultation status and assignment
- Assign pharmacists to consultations
- Update consultation details

#### `DELETE /api/consultations/[id]`

- Delete consultations (admin only)
- Includes proper authorization checks

#### `POST /api/consultations/anonymous`

- Create anonymous consultations
- Generates session IDs for tracking
- Returns consultation and session information

#### `GET /api/consultations/anonymous`

- Track anonymous consultation status
- Returns consultation, order, and delivery information
- Includes session expiration checks

### Chat System

#### `GET /api/chat/consultation/[consultationId]`

- Fetch consultation chat messages
- Supports both authenticated and anonymous access
- Returns messages with user information

#### `POST /api/chat/consultation/[consultationId]`

- Send messages in consultation chats
- Auto-assigns pharmacists when they first respond
- Supports anonymous messaging

### Medications

#### `GET /api/medications`

- Fetch medications with inventory information
- Supports search, filtering, and pagination
- Returns medication details with pharmacy-specific inventory

#### `POST /api/medications`

- Create new medications (pharmacy/admin only)
- Validates required fields and pricing
- Supports comprehensive medication information

### Inventory Management

#### `GET /api/inventory`

- Fetch pharmacy inventory with statistics
- Supports low stock and expiration filtering
- Returns inventory items with medication details

#### `POST /api/inventory`

- Add medications to pharmacy inventory
- Updates existing inventory or creates new items
- Manages lot numbers, expiration dates, and locations

### Prescriptions

#### `GET /api/prescriptions`

- Fetch prescriptions with filtering
- Includes consultation and medication information
- Supports status-based filtering

#### `POST /api/prescriptions`

- Create new prescriptions
- Links to consultations and medications
- Validates prescription requirements

### Orders

#### `GET /api/orders`

- Fetch orders with comprehensive details
- Includes prescription, user, and delivery information
- Provides order statistics and revenue data

#### `POST /api/orders`

- Create new orders from prescriptions
- Calculates total amounts and generates order numbers
- Validates prescription approval status

### Delivery

#### `GET /api/delivery/enhanced/[deliveryId]`

- Fetch delivery details and tracking information
- Supports anonymous delivery tracking
- Returns delivery history and status updates

#### `PUT /api/delivery/enhanced/[deliveryId]`

- Update delivery status (pharmacy/admin only)
- Manages delivery progress and completion
- Updates estimated and actual delivery times

### Analytics

#### `GET /api/analytics`

- Comprehensive pharmacy analytics
- Sales data, consultation statistics, inventory insights
- Top medications and user type breakdown
- Supports date range filtering

## Key Features

### 1. Anonymous Consultations

- Students can submit health inquiries anonymously
- Generated session IDs for tracking without personal information
- Secure access control for anonymous sessions
- Full consultation workflow support

### 2. Verified Pharmacist Communication

- Secure chat system between patients and pharmacists
- Auto-assignment of pharmacists to consultations
- Message history and consultation tracking
- Support for both authenticated and anonymous users

### 3. Discreet Delivery System

- Anonymous delivery tracking with unique identifiers
- Drop point management for campus delivery
- Discreet packaging options
- Real-time delivery status updates

### 4. Comprehensive Inventory Management

- Stock level tracking with low stock alerts
- Expiration date management
- Lot number tracking
- Pharmacy-specific inventory

### 5. Prescription Management

- Full prescription lifecycle from creation to dispensing
- Status tracking and approval workflows
- Integration with consultations and orders
- Support for controlled substances

### 6. Analytics and Reporting

- Sales analytics and revenue tracking
- Consultation and prescription statistics
- Inventory insights and alerts
- User type analysis (anonymous vs authenticated)

## Security Features

### Authentication & Authorization

- Role-based access control (CLIENT, PHARMACY, ADMIN)
- Session management for authenticated users
- Anonymous session tracking with expiration
- Secure API endpoints with proper authorization

### Data Privacy

- Anonymous user support without personal information
- Secure handling of sensitive health data
- Session-based tracking for anonymous users
- Proper data isolation between pharmacies

### Input Validation

- Comprehensive validation for all API endpoints
- Type safety with TypeScript
- SQL injection prevention with Prisma ORM
- XSS protection with proper input sanitization

## Frontend Integration

### Services

- `consultationService.ts` - Consultation management
- `medicationService.ts` - Medication and inventory management
- `analyticsService.ts` - Analytics and reporting
- Enhanced delivery service for discreet delivery tracking

### Key Components

- Anonymous consultation forms
- Pharmacist chat interface
- Inventory management dashboard
- Order processing system
- Analytics and reporting interface

## Database Migrations

To set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (if needed)
npx prisma db seed
```

## Environment Variables

Required environment variables:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Testing

The backend includes comprehensive error handling and validation. Test the endpoints using:

```bash
# Test consultation creation
curl -X POST http://localhost:3000/api/consultations \
  -H "Content-Type: application/json" \
  -d '{"type":"general","description":"test consultation"}'

# Test anonymous consultation
curl -X POST http://localhost:3000/api/consultations/anonymous \
  -H "Content-Type: application/json" \
  -d '{"type":"general","description":"anonymous test"}'
```

## Future Enhancements

1. **Real-time Notifications** - WebSocket support for live updates
2. **Payment Integration** - Secure payment processing
3. **Advanced Analytics** - Machine learning insights
4. **Mobile API** - Native mobile app support
5. **Multi-language Support** - Internationalization
6. **Advanced Security** - Two-factor authentication, audit logs

## Support

For questions or issues with the pharmacy dashboard backend, please refer to the main SafeMeds documentation or contact the development team.
