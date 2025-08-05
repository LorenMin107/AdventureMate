# AdventureMate - Use Case Diagrams

## Overview

This document contains focused, role-based use case diagrams for the AdventureMate camping booking and trip planning platform. Each diagram targets a specific user role for clarity and simplicity.

## 1. Guest & Registered User Use Case Diagram

```plantuml
@startuml Guest_User_Use_Case
left to right direction

actor "Guest User" as Guest
actor "Registered User" as User

package "Guest Use Cases" {
  usecase "Browse Campgrounds" as UC1
  usecase "Search & Filter" as UC2
  usecase "View Campground Details" as UC3
  usecase "Register Account" as UC4
  usecase "Login" as UC5
  usecase "Login with Google" as UC6
  usecase "Request Password Reset" as UC7
}

package "Registered User Use Cases" {
  usecase "Manage Profile" as UC8
  usecase "Change Password" as UC9
  usecase "Enable Two-Factor Auth" as UC10
  usecase "Book Campsite" as UC11
  usecase "View My Bookings" as UC12
  usecase "Cancel Booking" as UC13
  usecase "Write Review" as UC14
  usecase "Edit Review" as UC15
  usecase "Delete Review" as UC16
  usecase "Create Trip Plan" as UC17
  usecase "Edit Trip Plan" as UC18
  usecase "Delete Trip Plan" as UC19
  usecase "Add Trip Activities" as UC20
  usecase "Invite Collaborator" as UC21
  usecase "Export Trip PDF" as UC22
  usecase "View Safety Alerts" as UC23
}

Guest --> UC1
Guest --> UC2
Guest --> UC3
Guest --> UC4
Guest --> UC5
Guest --> UC6
Guest --> UC7

User --> UC8
User --> UC9
User --> UC10
User --> UC11
User --> UC12
User --> UC13
User --> UC14
User --> UC15
User --> UC16
User --> UC17
User --> UC18
User --> UC19
User --> UC20
User --> UC21
User --> UC22
User --> UC23

User --|> Guest : extends
@enduml
```

## 2. Owner Use Case Diagram

```plantuml
@startuml Owner_Use_Case
left to right direction

actor "Campground Owner" as Owner

package "Owner Use Cases" {
  usecase "Apply for Owner Status" as UC1
  usecase "Manage Campgrounds" as UC2
  usecase "Create Campground" as UC3
  usecase "Edit Campground" as UC4
  usecase "Delete Campground" as UC5
  usecase "Manage Campsites" as UC6
  usecase "Create Campsite" as UC7
  usecase "Edit Campsite" as UC8
  usecase "Delete Campsite" as UC9
  usecase "Set Campsite Availability" as UC10
  usecase "View Campground Bookings" as UC11
  usecase "Update Booking Status" as UC12
  usecase "View Owner Analytics" as UC13
  usecase "Create Safety Alert" as UC14
  usecase "Edit Safety Alert" as UC15
  usecase "Delete Safety Alert" as UC16
  usecase "Upload Images" as UC17
  usecase "Manage Images" as UC18
}

Owner --> UC1
Owner --> UC2
Owner --> UC3
Owner --> UC4
Owner --> UC5
Owner --> UC6
Owner --> UC7
Owner --> UC8
Owner --> UC9
Owner --> UC10
Owner --> UC11
Owner --> UC12
Owner --> UC13
Owner --> UC14
Owner --> UC15
Owner --> UC16
Owner --> UC17
Owner --> UC18
@enduml
```

## 3. Admin Use Case Diagram

```plantuml
@startuml Admin_Use_Case
left to right direction

actor "System Administrator" as Admin

package "Admin Use Cases" {
  usecase "Manage Users" as UC1
  usecase "Suspend User" as UC2
  usecase "Reactivate User" as UC3
  usecase "Review Owner Applications" as UC4
  usecase "Approve Owner Application" as UC5
  usecase "Reject Owner Application" as UC6
  usecase "Suspend Owner" as UC7
  usecase "Revoke Owner Status" as UC8
  usecase "View System Analytics" as UC9
  usecase "Monitor All Bookings" as UC10
  usecase "Generate Reports" as UC11
  usecase "Manage All Campgrounds" as UC12
  usecase "Delete Campground" as UC13
  usecase "View All Safety Alerts" as UC14
  usecase "Manage User Trips" as UC15
  usecase "Delete Trip" as UC16
  usecase "Manage System Settings" as UC17
}

Admin --> UC1
Admin --> UC2
Admin --> UC3
Admin --> UC4
Admin --> UC5
Admin --> UC6
Admin --> UC7
Admin --> UC8
Admin --> UC9
Admin --> UC10
Admin --> UC11
Admin --> UC12
Admin --> UC13
Admin --> UC14
Admin --> UC15
Admin --> UC16
Admin --> UC17
@enduml
```

## 4. External Services Integration View

```plantuml
@startuml External_Services_Integration
left to right direction

package "External Services" {
  usecase "Google OAuth" as UC1
  usecase "Payment Service" as UC2
  usecase "Cloudinary" as UC3
  usecase "Mapbox" as UC4
  usecase "Email Service" as UC5
  usecase "Redis Cache" as UC6
}

package "System Components" {
  usecase "Authentication System" as UC7
  usecase "Booking System" as UC8
  usecase "Campground Management" as UC9
  usecase "Trip Planning System" as UC10
  usecase "Image Management" as UC11
  usecase "Map & Location System" as UC12
  usecase "Email System" as UC13
  usecase "Cache System" as UC14
}

UC7 --> UC1 : uses
UC8 --> UC2 : uses
UC9 --> UC4 : uses
UC10 --> UC4 : uses
UC11 --> UC3 : uses
UC12 --> UC4 : uses
UC13 --> UC5 : uses
UC14 --> UC6 : uses
@enduml
```

## Key Features by Role

### **Guest & Registered Users**

- **Authentication**: Traditional login, Google OAuth, password reset
- **Campground Discovery**: Browse, search, filter, view details
- **Booking Management**: Book, view, cancel campsite reservations
- **Review System**: Write, edit, delete campground reviews
- **Trip Planning**: Create, edit, delete trip plans with activities
- **Collaboration**: Invite collaborators, export PDFs
- **Safety**: View safety alerts

### **Campground Owners**

- **Application Process**: Apply for owner status
- **Campground Management**: Create, edit, delete campgrounds
- **Campsite Management**: Manage individual campsites and availability
- **Booking Management**: View and update booking statuses
- **Analytics**: View owner-specific analytics
- **Safety Alerts**: Create, edit, delete safety alerts
- **Media Management**: Upload and manage images

### **System Administrators**

- **User Management**: Suspend, reactivate users
- **Owner Applications**: Review, approve, reject, suspend owners
- **System Analytics**: View comprehensive system statistics
- **Content Moderation**: Manage campgrounds, trips, safety alerts
- **System Settings**: Manage overall system configuration

### **External Services Integration**

- **Authentication**: Google OAuth for social login
- **Payments**: Payment processing for bookings
- **Media**: Cloudinary for image management
- **Maps**: Mapbox for geocoding and location services
- **Communication**: Email service for notifications
- **Performance**: Redis for caching and analytics

This approach provides much clearer, focused diagrams that follow proper PlantUML syntax and are easier to understand and explain! 🎯
