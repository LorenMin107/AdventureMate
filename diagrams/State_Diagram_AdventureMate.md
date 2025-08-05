# AdventureMate - State Diagram

## Overview

This state diagram accurately represents the different states and transitions for all entities in the AdventureMate platform based on the actual codebase implementation.

## 1. User Account States

```mermaid
stateDiagram-v2
    [*] --> Guest
    Guest --> Registered : Register
    Guest --> LoggedIn : Login

    Registered --> EmailVerification : Send verification email
    EmailVerification --> Verified : Verify email
    EmailVerification --> Registered : Resend email

    LoggedIn --> TwoFactorAuth : 2FA enabled
    TwoFactorAuth --> Authenticated : Valid 2FA code
    TwoFactorAuth --> LoggedIn : Invalid code

    Verified --> Authenticated : Login
    Authenticated --> Owner : Apply for owner
    Authenticated --> Admin : Admin privileges granted

    Authenticated --> AccountLocked : Too many failed attempts
    AccountLocked --> Authenticated : Lock expires

    Authenticated --> LoggedOut : Logout
    LoggedOut --> Guest
```

## 2. Owner Application & Verification States

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> UnderReview : Admin starts review
    UnderReview --> Verified : Admin approves
    UnderReview --> Rejected : Admin rejects
    Rejected --> Pending : Owner resubmits

    Verified --> Suspended : Admin suspends
    Suspended --> Verified : Admin reinstates

    %% Styling
    note right of Pending : Application submitted
    note right of UnderReview : Admin reviewing documents
    note right of Verified : Can manage campgrounds
    note right of Rejected : Application denied
    note right of Suspended : Temporarily blocked
```

## 3. Campground Lifecycle (No Status Field)

```mermaid
stateDiagram-v2
    [*] --> NotCreated
    NotCreated --> Created : Owner creates
    Created --> Updated : Owner edits
    Updated --> Created : Save changes
    Created --> Deleted : Owner deletes

    %% Styling
    note right of NotCreated : No campground exists
    note right of Created : Campground exists and visible
    note right of Updated : Changes being made
    note right of Deleted : Campground removed
```

## 4. Campsite States (Based on Actual Model)

```mermaid
stateDiagram-v2
    [*] --> Available
    Available --> Booked : User books
    Available --> Unavailable : Owner sets availability=false

    Booked --> Available : Booking cancelled/completed
    Unavailable --> Available : Owner sets availability=true

    %% Styling
    note right of Available : availability=true, ready for booking
    note right of Booked : Has bookedDates entries
    note right of Unavailable : availability=false, not bookable
```

## 5. Booking States (Actual Implementation)

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Confirmed : Owner confirms
    Pending --> Cancelled : Owner/User cancels
    Pending --> Completed : Stay finished

    Confirmed --> Completed : Stay finished
    Confirmed --> Cancelled : Early cancellation

    %% Styling
    note right of Pending : Default status, awaiting confirmation
    note right of Confirmed : Owner approved booking
    note right of Completed : Stay finished successfully
    note right of Cancelled : Booking was cancelled
```

## 6. Review States (No Status Field in Model)

```mermaid
stateDiagram-v2
    [*] --> NotCreated
    NotCreated --> Created : User submits review
    Created --> Updated : User edits review
    Updated --> Created : Save changes
    Created --> Deleted : User/Admin deletes

    %% Styling
    note right of NotCreated : No review exists
    note right of Created : Review exists and visible
    note right of Updated : Changes being made
    note right of Deleted : Review removed
```

## 7. Trip States (Based on Actual Model)

```mermaid
stateDiagram-v2
    [*] --> NotCreated
    NotCreated --> Created : User creates trip
    Created --> Updated : User edits trip
    Updated --> Created : Save changes
    Created --> Deleted : User deletes trip

    %% Visibility States
    Created --> Public : isPublic=true
    Created --> Private : isPublic=false
    Public --> Private : User changes visibility
    Private --> Public : User changes visibility

    %% Styling
    note right of NotCreated : No trip exists
    note right of Created : Trip exists
    note right of Public : Visible to all users
    note right of Private : Only owner/collaborators see
```

## 8. Trip Day States

```mermaid
stateDiagram-v2
    [*] --> NotCreated
    NotCreated --> Created : Auto-generated or manual
    Created --> Updated : User edits activities
    Updated --> Created : Save changes
    Created --> Deleted : User deletes day

    %% Styling
    note right of NotCreated : No trip day exists
    note right of Created : Trip day with activities
    note right of Updated : Changes being made
    note right of Deleted : Trip day removed
```

## 9. Safety Alert States (Actual Implementation)

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Active : Owner/Admin publishes
    Active --> Resolved : Issue resolved
    Active --> Expired : End date reached

    Resolved --> [*]
    Expired --> [*]

    %% Styling
    note right of Draft : Alert being created
    note right of Active : Currently active alert
    note right of Resolved : Issue fixed
    note right of Expired : Past end date
```

## 10. Email Verification Token States

```mermaid
stateDiagram-v2
    [*] --> Generated
    Generated --> Used : User verifies email
    Generated --> Expired : 24 hours pass

    Used --> [*]
    Expired --> [*]

    %% Styling
    note right of Generated : Token created, email sent
    note right of Used : Email verified successfully
    note right of Expired : Token no longer valid
```

## 11. Password Reset Token States

```mermaid
stateDiagram-v2
    [*] --> Generated
    Generated --> Used : User resets password
    Generated --> Expired : 1 hour passes

    Used --> [*]
    Expired --> [*]

    %% Styling
    note right of Generated : Token created, email sent
    note right of Used : Password reset successfully
    note right of Expired : Token no longer valid
```

## 12. Trip Invite States

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Accepted : User accepts invite
    Pending --> Expired : Token expires

    Accepted --> [*]
    Expired --> [*]

    %% Styling
    note right of Pending : Invite sent, awaiting response
    note right of Accepted : User joined trip
    note right of Expired : Invite no longer valid
```

## Key State Transitions

### **User Account Flow**

- **Guest** → **Registered** → **EmailVerification** → **Verified** → **Authenticated**
- **Authenticated** → **Owner** → **PendingVerification** → **VerifiedOwner**
- **Authenticated** → **AccountLocked** (security measure)

### **Owner Verification Flow**

- **Pending** → **UnderReview** → **Verified** (admin approval)
- **Verified** → **Suspended** (admin action)

### **Campground Flow** (No Status Field)

- **NotCreated** → **Created** → **Updated** → **Created** (edit cycle)
- **Created** → **Deleted** (owner action)

### **Campsite Flow** (Based on availability field)

- **Available** ↔ **Unavailable** (owner control)
- **Available** → **Booked** (user booking)
- **Booked** → **Available** (booking ends)

### **Booking Flow** (Actual status enum)

- **Pending** → **Confirmed** (owner approval)
- **Pending/Confirmed** → **Completed** (stay finished)
- **Pending/Confirmed** → **Cancelled** (cancellation)

### **Trip Flow**

- **NotCreated** → **Created** → **Public/Private** (visibility)
- **Created** → **Updated** → **Created** (edit cycle)
- **Created** → **Deleted** (user action)

## State Management Benefits

1. **Clear Lifecycle**: Each entity has a well-defined state progression
2. **Business Rules**: States enforce business logic and constraints
3. **Audit Trail**: State changes provide history and accountability
4. **User Experience**: Clear feedback on current status
5. **System Integrity**: Prevents invalid state transitions
6. **Analytics**: State data enables business intelligence

## Implementation Considerations

- **State Validation**: Ensure only valid transitions are allowed
- **State Persistence**: Store current state in database
- **State Notifications**: Alert users of state changes
- **State History**: Track all state transitions for audit
- **State Permissions**: Control who can change states
- **State Timeouts**: Automatic state changes based on time

## Important Notes

- **Campgrounds**: No explicit status field - just exists or doesn't exist
- **Campsites**: Use `availability` boolean field, not complex status states
- **Bookings**: Simple status enum: pending, confirmed, cancelled, completed
- **Reviews**: No status field - just basic CRUD operations
- **Trips**: Use `isPublic` boolean for visibility, not status
- **Tokens**: Have expiration and usage tracking
- **Owner Verification**: Controls campground management permissions

This state diagram accurately reflects the actual implementation in your AdventureMate system!
