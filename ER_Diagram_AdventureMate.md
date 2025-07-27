# AdventureMate - Entity Relationship Diagram

## Overview

AdventureMate is a camping booking platform that connects campers with campground owners.

## Core ER Diagram

```mermaid
erDiagram
    User {
        ObjectId _id PK
        String username UK
        String email UK
        String password
        Boolean isAdmin
        Boolean isOwner
        Date createdAt
    }

    Owner {
        ObjectId _id PK
        ObjectId user FK
        String businessName
        String businessType
        String verificationStatus
        Date createdAt
    }

    Campground {
        ObjectId _id PK
        String title
        String description
        String location
        ObjectId owner FK
        Array images
        Date createdAt
    }

    Campsite {
        ObjectId _id PK
        String name
        String description
        Number price
        Number capacity
        ObjectId campground FK
        Boolean availability
        Date createdAt
    }

    Booking {
        ObjectId _id PK
        ObjectId user FK
        ObjectId campsite FK
        Date startDate
        Date endDate
        Number totalPrice
        String status
        Date createdAt
    }

    Review {
        ObjectId _id PK
        String body
        Number rating
        ObjectId author FK
        ObjectId campground FK
        Date createdAt
    }

    Trip {
        ObjectId _id PK
        ObjectId user FK
        String title
        String description
        Date startDate
        Date endDate
        Boolean isPublic
        Date createdAt
    }

    %% Core Relationships
    User ||--o{ Owner : "becomes"
    User ||--o{ Booking : "makes"
    User ||--o{ Review : "writes"
    User ||--o{ Trip : "creates"

    Owner ||--o{ Campground : "owns"

    Campground ||--o{ Campsite : "contains"
    Campground ||--o{ Review : "receives"

    Campsite ||--o{ Booking : "receives"
```

## Key Features

### 1. **User Management**

- Regular users can book campsites and write reviews
- Users can become campground owners
- Admin users have special privileges

### 2. **Campground System**

- Owners manage campgrounds
- Each campground contains multiple campsites
- Campsites have individual pricing and availability

### 3. **Booking System**

- Users book specific campsites for date ranges
- System tracks booking status and payments

### 4. **Review System**

- Users can review campgrounds with ratings
- 1-5 star rating system

### 5. **Trip Planning**

- Users can create and share trip itineraries
- Public and private trip options

## Simple Flow

1. **Owner** creates **Campground** with multiple **Campsites**
2. **User** books a **Campsite** for specific dates
3. **User** writes **Review** for the **Campground**
4. **User** can plan **Trips** and share with others

This simplified diagram shows the core functionality without overwhelming detail!
