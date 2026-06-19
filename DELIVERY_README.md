# SafeMeds Delivery System

## Overview

The SafeMeds delivery system provides a comprehensive, privacy-focused delivery tracking solution for students seeking discreet medication delivery. The system includes real-time tracking, secure drop points, and OTP verification to ensure both privacy and security.

## Features

### 🗺️ **Interactive Map System**

- Real-time delivery vehicle tracking
- Visual representation of delivery progress
- Drop point location markers
- Route visualization with animated paths
- Live location updates every 5 seconds

### 📊 **Delivery Progress Tracker**

- 6-stage delivery process visualization
- Real-time progress percentage
- Estimated delivery time countdown
- Stage-by-stage timeline with timestamps
- Current status highlighting

### 📦 **Order Management**

- Anonymous order tracking
- Secure order IDs and tracking codes
- Package type and delivery method details
- Drop point information and instructions
- Privacy-focused packaging details

### 🔐 **Security & Privacy**

- Anonymous session management
- Discreet packaging with no medical labels
- Secure campus drop points
- OTP verification for pickup
- No personal information shared

## Technical Implementation

### Frontend Components

#### `DeliveryPage` (`src/app/delivery/page.jsx`)

- Main delivery tracking page
- Integrates all delivery components
- Handles anonymous session management
- Provides error handling and loading states

#### `DeliveryMap` (`src/components/Delivery/DeliveryMap.jsx`)

- Interactive map visualization
- Real-time location updates
- Vehicle and drop point markers
- Route line animation
- Status overlays and controls

#### `DeliveryTracker` (`src/components/Delivery/DeliveryTracker.jsx`)

- Progress bar with percentage
- Delivery stages timeline
- Estimated delivery countdown
- Current status highlighting
- Stage completion indicators

#### `OrderStatus` (`src/components/Delivery/OrderStatus.jsx`)

- Order details display
- Tracking code formatting
- Drop point information
- Delivery instructions
- Privacy notices

### Backend Services

#### `deliveryService.js` (`src/services/deliveryService.js`)

- API integration for delivery data
- Mock data fallbacks
- Error handling
- Delivery history management

#### API Routes

- `/api/delivery/status/[anonId]` - Get delivery status
- `/api/delivery/location/[anonId]` - Get delivery location

### Delivery Stages

1. **Order Confirmed** 📝

   - Order received and confirmed
   - Payment processed

2. **Processing** ⚙️

   - Pharmacist reviewing medication
   - Preparation in progress

3. **Packaged** 📦

   - Medication packaged
   - Discreet labeling applied

4. **In Transit** 🚚

   - Package picked up
   - On the way to drop point

5. **Out for Delivery** 🎯

   - Final delivery phase
   - Approaching drop point

6. **Delivered** ✅
   - Package at drop point
   - Ready for pickup

## Privacy Features

### Anonymous Sessions

- Uses `crypto.randomUUID()` for anonymous IDs
- Stored in localStorage for session persistence
- No personal information required

### Discreet Packaging

- No medical labels visible
- Generic packaging materials
- Secure drop point delivery
- OTP verification required

### Data Protection

- No personal information stored
- Anonymous tracking codes
- Secure API endpoints
- Privacy-focused UI design

## Usage

### For Students

1. Navigate to `/delivery` page
2. System automatically creates anonymous session
3. View real-time delivery progress
4. Track package location on map
5. Use OTP for secure pickup

### For Admins

1. Access admin panel at `/admin`
2. View all active deliveries
3. Update delivery status
4. Manage drop points
5. Monitor delivery progress

## Technical Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Styling**: Custom animations, responsive design
- **State Management**: React hooks (useState, useEffect)
- **API**: Axios for HTTP requests
- **Maps**: Custom SVG-based map visualization
- **Authentication**: Anonymous sessions with localStorage

## Customization

### Adding New Drop Points

1. Update drop point coordinates in `DeliveryMap.jsx`
2. Add drop point information to `OrderStatus.jsx`
3. Update API routes for location data

### Modifying Delivery Stages

1. Edit `deliveryStages` array in `DeliveryTracker.jsx`
2. Update status configurations in `OrderStatus.jsx`
3. Modify API response handling

### Styling Changes

1. Update Tailwind classes in components
2. Modify color schemes in `tailwind.config.js`
3. Adjust animations and transitions

## Security Considerations

- All API endpoints validate anonymous IDs
- No sensitive data stored in frontend
- Secure drop point verification
- OTP-based pickup authentication
- Privacy-first design principles

## Future Enhancements

- Real-time notifications
- Multiple drop point selection
- Delivery time preferences
- Package insurance options
- Integration with campus security systems
- Mobile app development

## Demo Features

The current implementation includes:

- Mock API endpoints for demonstration
- Simulated delivery progress
- Real-time location updates
- Interactive map visualization
- Complete delivery workflow simulation

This delivery system provides a comprehensive solution for the SafeMeds platform, ensuring privacy, security, and user experience while maintaining the anonymous nature of the service.
