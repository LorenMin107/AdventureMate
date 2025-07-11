# Safety Alert System Implementation

This document describes the safety alert system implementation for the MyanCamp campground booking application.

## Overview

The safety alert system allows campground owners and administrators to create and manage safety notices that are visible to users on each campground's detail page. This provides a manual alternative to weather-based alerts, which are not available in the free tier of OpenWeatherMap API.

## Features

- **Manual Alert Creation**: Campground owners and admins can create safety alerts
- **Multiple Alert Types**: Weather, wildlife, fire, flood, medical, security, maintenance, and other
- **Severity Levels**: Low, medium, high, and critical with color-coded visual indicators
- **Time-based Alerts**: Start and end dates for alert validity
- **Visibility Control**: Public or private alerts
- **User Acknowledgment**: Optional acknowledgment requirement for important alerts
- **Responsive Design**: Works on all screen sizes
- **Theme Support**: Adapts to light/dark theme automatically
- **Permission-based Access**: Only authorized users can create/edit/delete alerts

## Backend Implementation

### Safety Alert Model

**File**: `models/safetyAlert.js`

**Schema Fields**:

- `title` (String, required): Alert title (max 100 characters)
- `description` (String, required): Alert description (max 1000 characters)
- `severity` (Enum): 'low', 'medium', 'high', 'critical' (default: 'medium')
- `type` (Enum): 'weather', 'wildlife', 'fire', 'flood', 'medical', 'security', 'maintenance', 'other' (default: 'other')
- `status` (Enum): 'active', 'resolved', 'expired' (default: 'active')
- `startDate` (Date, required): When the alert becomes active
- `endDate` (Date, optional): When the alert expires
- `campground` (ObjectId, required): Reference to the campground
- `createdBy` (ObjectId, required): Reference to the user who created the alert
- `updatedBy` (ObjectId): Reference to the user who last updated the alert
- `isPublic` (Boolean): Whether the alert is visible to all users (default: true)
- `requiresAcknowledgement` (Boolean): Whether users must acknowledge the alert (default: false)
- `acknowledgedBy` (Array): List of users who have acknowledged the alert

**Model Methods**:

- `isActive()`: Virtual property to check if alert is currently active
- `isVisibleTo(user)`: Method to check if alert should be visible to a specific user
- `acknowledge(userId)`: Method to acknowledge an alert
- `getActiveAlerts(campgroundId, user)`: Static method to get active alerts for a campground

### API Controller

**File**: `controllers/api/safetyAlerts.js`

**Endpoints**:

- `GET /api/v1/campgrounds/:campgroundId/safety-alerts` - Get all alerts for a campground
- `GET /api/v1/campgrounds/:campgroundId/safety-alerts/active` - Get active alerts only
- `GET /api/v1/campgrounds/:campgroundId/safety-alerts/:alertId` - Get specific alert
- `POST /api/v1/campgrounds/:campgroundId/safety-alerts` - Create new alert
- `PUT /api/v1/campgrounds/:campgroundId/safety-alerts/:alertId` - Update alert
- `DELETE /api/v1/campgrounds/:campgroundId/safety-alerts/:alertId` - Delete alert
- `POST /api/v1/campgrounds/:campgroundId/safety-alerts/:alertId/acknowledge` - Acknowledge alert

**Permission Requirements**:

- **Create/Update/Delete**: Campground owners, authors, and admins only
- **View**: Public alerts visible to all, private alerts visible to owners and admins
- **Acknowledge**: Authenticated users for alerts requiring acknowledgment

### API Routes

**File**: `routes/api/v1/safetyAlerts.js`

Routes are mounted at `/api/v1/campgrounds/:campgroundId/safety-alerts` and include proper authentication middleware.

## Frontend Implementation

### Components

#### SafetyAlertList Component

**File**: `client/src/components/SafetyAlertList.jsx`

**Features**:

- Displays list of safety alerts with severity-based styling
- Color-coded severity indicators and icons
- Support for alert acknowledgment
- Delete functionality for authorized users
- Responsive design with mobile optimization

**Props**:

- `campgroundId` (required): ID of the campground
- `initialAlerts` (optional): Initial alerts data
- `onAlertDeleted` (optional): Callback when alert is deleted
- `showActiveOnly` (optional): Whether to show only active alerts (default: true)

#### SafetyAlertForm Component

**File**: `client/src/components/SafetyAlertForm.jsx`

**Features**:

- Form for creating and editing safety alerts
- Validation for required fields and date logic
- Severity and type selection with visual indicators
- Public/private visibility toggle
- Acknowledgment requirement toggle
- Responsive design

**Props**:

- `campgroundId` (required): ID of the campground
- `alert` (optional): Existing alert data for editing
- `isEditing` (optional): Whether form is for editing (default: false)
- `onAlertSubmitted` (optional): Callback when alert is submitted
- `onCancel` (optional): Callback when form is cancelled

### Custom Hook

#### useSafetyAlerts Hook

**File**: `client/src/hooks/useSafetyAlerts.js`

**Features**:

- React Query integration for efficient data fetching and caching
- CRUD operations for safety alerts
- Automatic cache invalidation on mutations
- Optimistic updates for better UX

**Available Hooks**:

- `useCampgroundSafetyAlerts(campgroundId)`: Get all alerts for a campground
- `useActiveSafetyAlerts(campgroundId)`: Get active alerts only
- `useSafetyAlert(campgroundId, alertId)`: Get specific alert
- `useCreateSafetyAlert()`: Create new alert mutation
- `useUpdateSafetyAlert()`: Update alert mutation
- `useDeleteSafetyAlert()`: Delete alert mutation
- `useAcknowledgeSafetyAlert()`: Acknowledge alert mutation

### Integration

#### Campground Detail Page

**File**: `client/src/pages/CampgroundDetailPage.jsx`

The safety alerts section is integrated into the campground detail page:

- Positioned after the weather section and before campsites
- "Create Alert" button for campground owners
- Collapsible form for creating new alerts
- List of active alerts with full functionality

## Styling

### CSS Files

- `client/src/components/SafetyAlertList.css`: Styles for the alert list component
- `client/src/components/SafetyAlertForm.css`: Styles for the alert form component
- `client/src/pages/CampgroundDetailPage.css`: Additional styles for the safety alerts section

### Design Features

- **Theme Support**: Uses CSS custom properties for light/dark theme compatibility
- **Severity Colors**:
  - Critical: Red (#dc2626)
  - High: Orange (#ea580c)
  - Medium: Amber (#d97706)
  - Low: Green (#059669)
- **Responsive Design**: Mobile-first approach with breakpoints at 768px and 480px
- **Visual Indicators**: Icons for severity levels and alert types
- **Hover Effects**: Subtle animations and transitions

## Usage Examples

### Creating a Safety Alert

```javascript
// Using the custom hook
const { useCreateSafetyAlert } = useSafetyAlerts();
const createAlert = useCreateSafetyAlert();

const handleCreateAlert = async () => {
  await createAlert.mutateAsync({
    campgroundId: 'campground123',
    alert: {
      title: 'Bear Activity in Area',
      description: 'Recent bear sightings reported. Please store food properly.',
      severity: 'high',
      type: 'wildlife',
      startDate: new Date().toISOString(),
      isPublic: true,
      requiresAcknowledgement: true,
    },
  });
};
```

### Displaying Safety Alerts

```jsx
// In a React component
<SafetyAlertList
  campgroundId={campgroundId}
  showActiveOnly={true}
  onAlertDeleted={(alertId) => {
    // Handle alert deletion
  }}
/>
```

## Security Considerations

1. **Permission Validation**: All operations check user permissions on both frontend and backend
2. **Input Validation**: Comprehensive validation for all alert fields
3. **XSS Prevention**: Proper escaping and sanitization of user input
4. **Rate Limiting**: Inherits from existing rate limiting middleware
5. **Audit Trail**: All operations are logged for security monitoring

## Performance Considerations

1. **Database Indexing**: Proper indexes on campground, status, and date fields
2. **Caching**: React Query provides automatic caching and background updates
3. **Lazy Loading**: Alerts are loaded only when needed
4. **Optimistic Updates**: UI updates immediately while API calls are in progress

## Future Enhancements

1. **Email Notifications**: Send alerts to users with upcoming bookings
2. **Push Notifications**: Real-time alerts for mobile users
3. **Alert Templates**: Predefined templates for common alert types
4. **Bulk Operations**: Create multiple alerts at once
5. **Alert History**: Track all alert changes and acknowledgments
6. **Integration**: Connect with external weather APIs when available
7. **Analytics**: Track alert effectiveness and user engagement

## Testing

The safety alert system should be tested for:

- **Unit Tests**: Individual component and hook functionality
- **Integration Tests**: API endpoint functionality
- **E2E Tests**: Complete user workflows
- **Permission Tests**: Access control validation
- **Responsive Tests**: Mobile and desktop compatibility
- **Theme Tests**: Light and dark mode functionality

## Deployment Notes

1. **Database Migration**: The SafetyAlert model will be automatically created by Mongoose
2. **API Routes**: New routes are automatically available through the existing API structure
3. **Frontend Build**: New components are included in the React build process
4. **Environment Variables**: No additional environment variables required
5. **Dependencies**: No new external dependencies added
