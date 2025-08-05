# AdventureMate - Sequence Diagram

## Overview

This sequence diagram shows the key user flows and system interactions in the AdventureMate platform based on the actual codebase implementation.

## 1. User Registration & Email Verification Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend UI
    participant Auth API
    participant Database
    participant Email Service
    participant Token Service

    Note over User,Token Service: Registration Phase
    User->>Frontend UI: Fill registration form
    Frontend UI->>Auth API: POST /auth/register
    Auth API->>Database: Create user (isEmailVerified=false)
    Auth API->>Token Service: Generate email verification token
    Token Service->>Database: Save EmailVerificationToken
    Auth API->>Email Service: Send verification email
    Email Service-->>User: Email with verification link
    Auth API-->>Frontend UI: 201 Created (check email message)
    Frontend UI-->>User: Show verification required message

    Note over User,Token Service: Email Verification Phase
    User->>Frontend UI: Visit verification URL
    Frontend UI->>Auth API: GET /auth/verify-email?token=xxx
    Auth API->>Token Service: Verify token
    Token Service->>Database: Mark token as used
    Auth API->>Database: Update user.isEmailVerified=true
    Auth API-->>Frontend UI: 200 OK (email verified)
    Frontend UI-->>User: Show success message
```

## 2. User Login & Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend UI
    participant Auth API
    participant Database
    participant JWT Service

    Note over User,JWT Service: Login Process
    User->>Frontend UI: Enter email/password
    Frontend UI->>Auth API: POST /auth/login
    Auth API->>Database: Find user by email
    Auth API->>Auth API: Verify password (bcrypt)

    alt Email not verified
        Note over Auth API,JWT Service: Email Verification Required
        Auth API->>Auth API: Generate new verification token
        Auth API->>Email Service: Send verification email
        Auth API-->>Frontend UI: 403 Forbidden (verify email)
        Frontend UI-->>User: Show verification required
    else Email verified
        Note over Auth API,JWT Service: Successful Authentication
        Auth API->>JWT Service: Generate access token
        Auth API->>JWT Service: Generate refresh token
        Auth API->>Database: Save refresh token
        Auth API-->>Frontend UI: 200 OK (tokens)
        Frontend UI->>Frontend UI: Store tokens in localStorage
        Frontend UI-->>User: Redirect to dashboard
    end
```

## 3. Google OAuth Login Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend UI
    participant Google OAuth
    participant Auth API
    participant Database
    participant JWT Service

    Note over User,JWT Service: OAuth Initiation
    User->>Frontend UI: Click "Continue with Google"
    Frontend UI->>Frontend UI: Generate OAuth URL
    Frontend UI->>Google OAuth: Redirect to Google consent screen
    Google OAuth-->>User: Show consent screen
    User->>Google OAuth: Grant permissions
    Google OAuth->>Frontend UI: Redirect with authorization code

    Note over User,JWT Service: OAuth Callback Processing
    Frontend UI->>Auth API: POST /auth/google (code + redirectUri)
    Auth API->>Google OAuth: Exchange code for access token
    Google OAuth-->>Auth API: Access token
    Auth API->>Google OAuth: Get user profile
    Google OAuth-->>Auth API: User profile (email, name, picture)

    Note over Auth API,Database: User Account Management
    Auth API->>Database: Check if user exists (googleId)
    alt User doesn't exist
        Auth API->>Database: Check if email already registered
        alt Email already registered with password
            Auth API-->>Frontend UI: 409 Conflict (use email/password)
            Frontend UI-->>User: Show error message
        else Email not registered or OAuth-only
            Auth API->>Database: Create new user (googleId, isEmailVerified=true)
            Auth API->>Database: Set profile from Google
        end
    else User exists
        Auth API->>Database: Update user profile if needed
    end

    Note over Auth API,JWT Service: Authentication Completion
    alt 2FA enabled
        Note over Auth API,JWT Service: Two-Factor Authentication Required
        Auth API->>JWT Service: Generate temporary access token (10min)
        Auth API-->>Frontend UI: 200 OK (requiresTwoFactor=true)
        Frontend UI->>Frontend UI: Store temp token
        Frontend UI-->>User: Redirect to 2FA verification
    else 2FA not enabled
        Note over Auth API,JWT Service: Direct Login
        Auth API->>JWT Service: Generate access token
        Auth API->>JWT Service: Generate refresh token
        Auth API->>Database: Save refresh token
        Auth API-->>Frontend UI: 200 OK (tokens + user data)
        Frontend UI->>Frontend UI: Store tokens in localStorage
        Frontend UI-->>User: Redirect to dashboard
    end
```

## 4. Owner Application & Verification Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend UI
    participant Owner API
    participant Database
    participant Admin
    participant Email Service

    Note over User,Email Service: Application Submission
    User->>Frontend UI: Submit owner application
    Frontend UI->>Owner API: POST /owners/applications
    Owner API->>Database: Create OwnerApplication (status=pending)
    Owner API->>Database: Update user.isOwner=true
    Owner API-->>Frontend UI: 201 Created
    Frontend UI-->>User: Show application submitted

    Note over Admin,Email Service: Admin Review Process
    Admin->>Owner API: GET /admin/owner-applications
    Owner API->>Database: Fetch pending applications
    Owner API-->>Admin: List of applications
    Admin->>Owner API: PUT /admin/owner-applications/:id (approve)
    Owner API->>Database: Update status=approved
    Owner API->>Database: Create Owner record
    Owner API->>Email Service: Send approval email
    Email Service-->>User: Approval notification
```

## 5. Campground Creation Flow

```mermaid
sequenceDiagram
    participant Owner
    participant Frontend UI
    participant Campground API
    participant Database
    participant Cloudinary
    participant Mapbox

    Note over Owner,Mapbox: Campground Creation Process
    Owner->>Frontend UI: Fill campground form
    Frontend UI->>Campground API: POST /owners/campgrounds
    Campground API->>Mapbox: Geocode location
    Mapbox-->>Campground API: Coordinates
    Campground API->>Cloudinary: Upload images
    Cloudinary-->>Campground API: Image URLs
    Campground API->>Database: Create Campground
    Campground API->>Database: Update Owner.campgrounds array
    Campground API-->>Frontend UI: 201 Created
    Frontend UI-->>Owner: Show success message
```

## 6. Campsite Booking Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend UI
    participant Booking API
    participant Database
    participant Campsite Service
    participant Payment Service

    Note over User,Payment Service: Booking Process
    User->>Frontend UI: Select campsite & dates
    Frontend UI->>Campsite Service: Check availability
    Campsite Service->>Database: Query bookedDates
    Campsite Service-->>Frontend UI: Availability status
    Frontend UI->>Frontend UI: Calculate total price
    User->>Frontend UI: Confirm booking
    Frontend UI->>Booking API: POST /bookings
    Booking API->>Database: Create Booking (status=pending)
    Booking API->>Database: Add bookedDates to campsite
    Booking API->>Payment Service: Process payment
    Payment Service-->>Booking API: Payment result
    Booking API->>Database: Update booking.paid=true
    Booking API-->>Frontend UI: 201 Created
    Frontend UI-->>User: Show booking confirmation
```

## 7. Owner Booking Management Flow

```mermaid
sequenceDiagram
    participant Owner
    participant Frontend UI
    participant Booking API
    participant Database
    participant Email Service

    Note over Owner,Email Service: Booking Management
    Owner->>Frontend UI: View campground bookings
    Frontend UI->>Booking API: GET /owners/campgrounds/:id/bookings
    Booking API->>Database: Query bookings for campground
    Booking API-->>Frontend UI: List of bookings
    Frontend UI-->>Owner: Display bookings table

    Note over Owner,Email Service: Status Update Process
    Owner->>Frontend UI: Update booking status
    Frontend UI->>Booking API: PATCH /owners/campgrounds/:id/bookings/:bookingId
    Booking API->>Database: Update booking.status
    Booking API->>Email Service: Send status update email
    Email Service-->>User: Status notification
    Booking API-->>Frontend UI: 200 OK
    Frontend UI-->>Owner: Show updated status
```

## 8. Trip Planning Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend UI
    participant Trip API
    participant Database
    participant TripDay Service

    Note over User,TripDay Service: Trip Creation
    User->>Frontend UI: Create new trip
    Frontend UI->>Trip API: POST /trips
    Trip API->>Database: Create Trip
    Trip API->>TripDay Service: Generate TripDay records
    TripDay Service->>Database: Create TripDay for each date
    Trip API->>Database: Update Trip.days array
    Trip API->>Database: Update User.trips array
    Trip API-->>Frontend UI: 201 Created
    Frontend UI-->>User: Show trip planner

    Note over User,TripDay Service: Activity Management
    User->>Frontend UI: Add activities to trip day
    Frontend UI->>Trip API: PUT /trips/:id/days/:dayId
    Trip API->>Database: Update TripDay.activities
    Trip API-->>Frontend UI: 200 OK
    Frontend UI-->>User: Show updated itinerary
```

## 9. Review System Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend UI
    participant Review API
    participant Database
    participant Campground Service

    Note over User,Campground Service: Review Creation
    User->>Frontend UI: Write review
    Frontend UI->>Review API: POST /campgrounds/:id/reviews
    Review API->>Database: Create Review
    Review API->>Database: Add review to Campground.reviews
    Review API->>Database: Update Campground average rating
    Review API-->>Frontend UI: 201 Created
    Frontend UI-->>User: Show review posted

    Note over User,Campground Service: Review Display
    User->>Frontend UI: View campground
    Frontend UI->>Campground Service: GET /campgrounds/:id
    Campground Service->>Database: Fetch campground with reviews
    Campground Service->>Database: Populate review authors
    Campground Service-->>Frontend UI: Campground with reviews
    Frontend UI-->>User: Display reviews
```

## 10. Safety Alert Flow

```mermaid
sequenceDiagram
    participant Owner
    participant Frontend UI
    participant Safety Alert API
    participant Database
    participant Users

    Note over Owner,Users: Alert Creation
    Owner->>Frontend UI: Create safety alert
    Frontend UI->>Safety Alert API: POST /campgrounds/:id/safety-alerts
    Safety Alert API->>Database: Create SafetyAlert (status=active)
    Safety Alert API-->>Frontend UI: 201 Created
    Frontend UI-->>Owner: Show alert created

    Note over Users,Safety Alert API: Alert Display
    Users->>Frontend UI: Visit campground
    Frontend UI->>Safety Alert API: GET /campgrounds/:id/safety-alerts/active
    Safety Alert API->>Database: Query active alerts
    Safety Alert API-->>Frontend UI: Active alerts list
    Frontend UI-->>Users: Display safety alerts
```

## 11. Admin Analytics Flow

```mermaid
sequenceDiagram
    participant Admin
    participant Frontend UI
    participant Admin API
    participant Database
    participant Cache Service

    Note over Admin,Cache Service: Analytics Retrieval
    Admin->>Frontend UI: Access admin dashboard
    Frontend UI->>Admin API: GET /admin/analytics
    Admin API->>Cache Service: Check cache for analytics
    alt Cache hit
        Note over Cache Service,Admin API: Cached Data Available
        Cache Service-->>Admin API: Cached analytics data
    else Cache miss
        Note over Database,Cache Service: Data Aggregation Required
        Admin API->>Database: Aggregate booking statistics
        Admin API->>Database: Count users, campgrounds, reviews
        Admin API->>Database: Calculate revenue metrics
        Admin API->>Cache Service: Cache analytics data
    end
    Admin API-->>Frontend UI: Analytics data
    Frontend UI-->>Admin: Display dashboard
```

## 12. Password Reset Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend UI
    participant Auth API
    participant Database
    participant Token Service
    participant Email Service

    Note over User,Email Service: Password Reset Request
    User->>Frontend UI: Request password reset
    Frontend UI->>Auth API: POST /auth/request-password-reset
    Auth API->>Database: Find user by email
    Auth API->>Token Service: Generate password reset token
    Token Service->>Database: Save PasswordResetToken
    Auth API->>Email Service: Send reset email
    Email Service-->>User: Email with reset link
    Auth API-->>Frontend UI: 200 OK
    Frontend UI-->>User: Show email sent message

    Note over User,Token Service: Password Reset Completion
    User->>Frontend UI: Visit reset URL
    Frontend UI->>Auth API: POST /auth/reset-password
    Auth API->>Token Service: Verify reset token
    Auth API->>Auth API: Validate new password
    Auth API->>Auth API: Hash new password
    Auth API->>Database: Update user password
    Auth API->>Database: Add to password history
    Auth API->>Token Service: Mark token as used
    Auth API-->>Frontend UI: 200 OK
    Frontend UI-->>User: Show password updated
```

## 13. Trip Collaboration Flow

```mermaid
sequenceDiagram
    participant Owner
    participant Frontend UI
    participant Trip API
    participant Database
    participant Invite Service
    participant Email Service
    participant Collaborator

    Note over Owner,Email Service: Invitation Process
    Owner->>Frontend UI: Invite collaborator
    Frontend UI->>Trip API: POST /trips/:id/invite
    Trip API->>Invite Service: Create invite
    Invite Service->>Database: Save Invite (status=pending)
    Invite Service->>Email Service: Send invite email
    Email Service-->>Collaborator: Email with invite link
    Trip API-->>Frontend UI: 201 Created
    Frontend UI-->>Owner: Show invite sent

    Note over Collaborator,Invite Service: Invitation Acceptance
    Collaborator->>Frontend UI: Accept invite
    Frontend UI->>Trip API: POST /trips/:id/accept-invite
    Trip API->>Invite Service: Verify invite token
    Trip API->>Database: Update Invite status=accepted
    Trip API->>Database: Add user to Trip.collaborators
    Trip API->>Database: Add trip to User.sharedTrips
    Trip API-->>Frontend UI: 200 OK
    Frontend UI-->>Collaborator: Show trip access granted
```

## Key System Interactions

### **Authentication & Security**

- JWT tokens for session management
- Email verification for account security
- Google OAuth integration with 2FA support
- Password reset with time-limited tokens
- Account locking for failed login attempts

### **Data Management**

- MongoDB for data persistence
- Redis for caching (analytics, campgrounds)
- Cloudinary for image storage
- Mapbox for geocoding

### **Business Logic**

- Owner verification controls campground management
- Booking availability prevents double-booking
- Trip planning with collaboration features
- Safety alerts for emergency notifications

### **User Experience**

- Real-time availability checking
- Email notifications for status changes
- PDF export for trip itineraries
- Multi-language support

This sequence diagram accurately represents the key user flows and system interactions in your AdventureMate platform!
