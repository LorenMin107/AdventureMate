# AdventureMate - Activity Diagrams

## Overview

This document contains three separate activity diagrams showing the main user flows for different roles in the AdventureMate camping booking platform.

## 1. Camper User Flow

```mermaid
flowchart TD
    Start([Camper visits site]) --> Register[Register/Login]
    Register --> Browse[Browse Campgrounds]
    Browse --> Search[Search & Filter]
    Search --> Select[Select Campground]
    Select --> View[View Details & Reviews]
    View --> Decide{Book this site?}
    Decide -->|Yes| Book[Book Campsite]
    Decide -->|No| Browse
    Book --> Payment[Pay via Stripe API]
    Payment --> Confirm[Receive Confirmation]
    Confirm --> Review{Write Review?}
    Review -->|Yes| WriteReview[Write Review]
    Review -->|No| End([End])
    WriteReview --> End

    %% Styling
    classDef startEnd fill:#e1f5fe
    classDef process fill:#f3e5f5
    classDef decision fill:#fff3e0
    classDef api fill:#ffebee

    class Start,End startEnd
    class Register,Browse,Search,Select,View,Book,WriteReview process
    class Decide,Review decision
    class Payment api
```

## 2. Campground Owner Flow

```mermaid
flowchart TD
    Start([Owner logs in]) --> Dashboard[Access Dashboard]
    Dashboard --> Manage[Manage Campgrounds]
    Manage --> Add[Add New Campground]
    Add --> Upload[Upload Images via Cloudinary API]
    Upload --> Location[Set Location via Mapbox API]
    Location --> Save[Save Campground]
    Save --> Campsites[Add Campsites]
    Campsites --> Pricing[Set Pricing]
    Pricing --> Bookings[View Bookings]
    Bookings --> Analytics[View Analytics]
    Analytics --> End([End])

    %% Alternative path
    Manage --> Edit[Edit Existing]
    Edit --> Update[Update Details]
    Update --> Bookings

    %% Styling
    classDef startEnd fill:#e1f5fe
    classDef process fill:#f3e5f5
    classDef api fill:#ffebee

    class Start,End startEnd
    class Dashboard,Manage,Add,Save,Campsites,Pricing,Bookings,Analytics,Edit,Update process
    class Upload,Location api
```

## 3. Admin Flow

```mermaid
flowchart TD
    Start([Admin logs in]) --> Dashboard[Access Admin Dashboard]
    Dashboard --> Users[Manage Users]
    Users --> Approve[Approve Owner Applications]
    Approve --> Campgrounds[Manage Campgrounds]
    Campgrounds --> Analytics[View System Analytics]
    Analytics --> Bookings[Monitor All Bookings]
    Bookings --> Reports[Generate Reports]
    Reports --> End([End])

    %% Alternative paths
    Users --> Suspend[Suspend Users]
    Suspend --> Campgrounds

    Dashboard --> System[System Settings]
    System --> Analytics

    %% Styling
    classDef startEnd fill:#e1f5fe
    classDef process fill:#f3e5f5
    classDef admin fill:#ffebee

    class Start,End startEnd
    class Dashboard,Analytics,Reports,System process
    class Users,Approve,Campgrounds,Bookings,Suspend admin
```

## 4. System Integration Flow (Swimlanes)

```mermaid
flowchart TD
    subgraph "Frontend"
        UI[User Interface]
        Forms[Forms & Validation]
    end

    subgraph "Backend API"
        Auth[Authentication]
        Data[Data Processing]
        Business[Business Logic]
    end

    subgraph "External Services"
        Stripe[Stripe Payment API]
        Mapbox[Mapbox Maps API]
        Cloudinary[Cloudinary Images API]
        Email[Email Service API]
    end

    subgraph "Database"
        Users[(Users)]
        Campgrounds[(Campgrounds)]
        Bookings[(Bookings)]
    end

    UI --> Forms
    Forms --> Auth
    Auth --> Data
    Data --> Business
    Business --> Users
    Business --> Campgrounds
    Business --> Bookings

    Business -->|Payment Processing| Stripe
    Business -->|Geocoding & Maps| Mapbox
    Business -->|Image Upload| Cloudinary
    Business -->|Notifications| Email

    %% Styling
    classDef frontend fill:#e3f2fd
    classDef backend fill:#f3e5f5
    classDef external fill:#fff3e0
    classDef database fill:#e8f5e8

    class UI,Forms frontend
    class Auth,Data,Business backend
    class Stripe,Mapbox,Cloudinary,Email external
    class Users,Campgrounds,Bookings database
```

## Key User Flows Summary

### **Camper Flow** (Primary User)

1. **Register/Login** → Create account or sign in
2. **Browse & Search** → Find campgrounds
3. **Select & View** → Choose campground and see details
4. **Decide** → Choose whether to book or continue browsing
5. **Book & Pay** → Reserve campsite and pay via Stripe API
6. **Review** → Optionally write review after stay

### **Owner Flow** (Campground Manager)

1. **Dashboard** → Access owner management panel
2. **Manage Campgrounds** → Add/edit campgrounds and campsites
3. **Upload & Location** → Add images via Cloudinary API, set location via Mapbox API
4. **Pricing** → Set campsite pricing
5. **Analytics** → View booking analytics and performance

### **Admin Flow** (System Administrator)

1. **Dashboard** → Access admin control panel
2. **User Management** → Approve owner applications, manage users
3. **Campground Management** → Oversee and manage all campgrounds
4. **System Monitoring** → View system analytics and reports
5. **Booking Oversight** → Monitor all platform bookings

## System Architecture

### **Frontend Layer**

- React components and user interface
- Form validation and user interactions

### **Backend Layer**

- Authentication and authorization
- Business logic and data processing
- API endpoints and routing

### **External Services**

- **Stripe API**: Payment processing
- **Mapbox API**: Maps and geolocation
- **Cloudinary API**: Image management
- **Email Service API**: Notifications and verification

### **Database Layer**

- User accounts and profiles
- Campground and campsite data
- Booking records and reviews

## Benefits of This Approach

1. **Clarity**: Each role has a focused, simple flow
2. **Decision Points**: Shows realistic user choices
3. **API Integration**: Clear labeling of external service calls
4. **Maintainability**: Easy to update individual user journeys
5. **Documentation**: Clear for different stakeholders
6. **Development**: Teams can work on different flows independently
7. **Testing**: Each flow can be tested separately

This modular approach makes the system much easier to understand and implement!
