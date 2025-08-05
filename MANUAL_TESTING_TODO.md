# Manual Testing Todo List for AdventureMate

## **🔐 Authentication & User Management**

### **Guest User Testing**

- [ ] **Browse as Guest**
  - [ ] Visit homepage and verify it loads
  - [ ] Navigate to campgrounds page without login
  - [ ] Try to search campgrounds by name, description, or location
  - [ ] Test price sorting (low to high, high to low)
  - [ ] View campground details
  - [ ] Attempt to book without login (should redirect to login)

### **User Registration**

- [ ] **New User Registration**
  - [ ] Click "Register" link
  - [ ] Fill out registration form with valid data
  - [ ] Submit and verify email verification message
  - [ ] Check email for verification link
  - [ ] Click verification link and verify account activation
  - [ ] Try registering with existing email (should show error)
  - [ ] Try registering with invalid email format
  - [ ] Try registering with weak password

- [ ] **Google OAuth Registration**
  - [ ] Click "Login with Google" button
  - [ ] Complete Google OAuth flow
  - [ ] Verify account creation and login

### **User Login**

- [ ] **Standard Login**
  - [ ] Login with correct credentials
  - [ ] Login with wrong password (should show error)
  - [ ] Login with non-existent email
  - [ ] Test "Remember Me" functionality

- [ ] **Two-Factor Authentication**
  - [ ] Enable 2FA in profile settings
  - [ ] Scan QR code with authenticator app
  - [ ] Login with password + TOTP code
  - [ ] Try login with wrong TOTP code
  - [ ] Test backup codes if available

- [ ] **Password Reset**
  - [ ] Click "Forgot Password" link
  - [ ] Enter email address
  - [ ] Check email for reset link
  - [ ] Click reset link and set new password
  - [ ] Login with new password

### **Profile Management**

- [ ] **Update Profile**
  - [ ] Edit profile information
  - [ ] Upload profile picture
  - [ ] Change password
  - [ ] Update email preferences

---

## **🏕️ Campground Discovery & Search**

### **Campground Browsing**

- [ ] **Search Functionality**
  - [ ] Search for "Bangkok" campgrounds
  - [ ] Search for "Chiang Mai" campgrounds
  - [ ] Search by campground name
  - [ ] Search by description keywords
  - [ ] Clear search and verify all campgrounds show

- [ ] **Price Sorting**
  - [ ] Select "Price: Low to High" and verify campgrounds are sorted by increasing price
  - [ ] Select "Price: High to Low" and verify campgrounds are sorted by decreasing price
  - [ ] Select "Sort by" (default) and verify original order is restored
  - [ ] Combine search with price sorting
  - [ ] Clear filters and verify sorting is reset

- [ ] **Campground Details**
  - [ ] Click on a campground card
  - [ ] View all photos in gallery
  - [ ] Check amenities list
  - [ ] Read reviews and ratings
  - [ ] View location on map
  - [ ] Check availability calendar

### **Map Integration**

- [ ] **Map Functionality**
  - [ ] Verify campgrounds appear on map
  - [ ] Click on map markers to see campground info
  - [ ] Test map zoom and pan
  - [ ] Verify map updates when filtering/searching

---

## **📅 Booking System**

### **Booking Flow**

- [ ] **Complete Booking Process**
  - [ ] Select a campground
  - [ ] Choose available dates
  - [ ] Select number of guests
  - [ ] Review pricing breakdown
  - [ ] Fill guest information
  - [ ] Enter payment details (use Stripe test card)
  - [ ] Complete payment
  - [ ] Verify booking confirmation
  - [ ] Check confirmation email

- [ ] **Booking Edge Cases**
  - [ ] Try booking unavailable dates
  - [ ] Try booking with invalid guest count
  - [ ] Test payment failure scenarios
  - [ ] Try booking same campsite twice

### **Booking Management**

- [ ] **View Bookings**
  - [ ] Go to "My Bookings" page
  - [ ] View upcoming bookings
  - [ ] View past bookings
  - [ ] Download booking confirmation

- [ ] **Modify Bookings**
  - [ ] Cancel a booking
  - [ ] Try to modify booking dates
  - [ ] Contact owner about booking

---

## **⭐ Review System**

### **Write Reviews**

- [ ] **Submit Review**
  - [ ] Go to a campground you've booked
  - [ ] Click "Write Review"
  - [ ] Rate different aspects (cleanliness, location, etc.)
  - [ ] Write review text
  - [ ] Upload photos
  - [ ] Submit review
  - [ ] Verify review appears on campground page

- [ ] **Manage Reviews**
  - [ ] Edit your review
  - [ ] Delete your review
  - [ ] View all your reviews

### **Read Reviews**

- [ ] **Review Display**
  - [ ] Browse reviews on campground page
  - [ ] Filter reviews by rating
  - [ ] Sort reviews by date
  - [ ] Report inappropriate review

---

## **🗺️ Trip Planning**

### **Create Trip**

- [ ] **New Trip**
  - [ ] Click "Plan Trip" or "Create Trip"
  - [ ] Enter trip name and dates
  - [ ] Add campgrounds to itinerary
  - [ ] Plan day-by-day activities
  - [ ] Add notes and descriptions
  - [ ] Save trip

### **Manage Trip**

- [ ] **Trip Operations**
  - [ ] Edit trip details
  - [ ] Add/remove campgrounds
  - [ ] Reorder activities
  - [ ] Delete trip
  - [ ] Make trip public/private

### **Trip Sharing**

- [ ] **Share Trip**
  - [ ] Share trip with another user
  - [ ] Export trip to PDF
  - [ ] View shared trip from another account

---

## **👤 Owner Functionality**

### **Owner Application**

- [ ] **Apply for Owner Status**
  - [ ] Go to owner application page
  - [ ] Fill out application form
  - [ ] Upload required documents
  - [ ] Submit application
  - [ ] Check application status

### **Campground Management**

- [ ] **Create Campground**
  - [ ] Add new campground
  - [ ] Upload campground photos
  - [ ] Set location and description
  - [ ] Add amenities

- [ ] **Manage Campsites**
  - [ ] Add campsites to campground
  - [ ] Set pricing for each campsite (100-500 THB range)
  - [ ] Set availability dates
  - [ ] Edit campsite details

### **Booking Management (Owner)**

- [ ] **Handle Bookings**
  - [ ] View incoming bookings
  - [ ] Accept a booking
  - [ ] Reject a booking
  - [ ] Send message to camper
  - [ ] Update booking status

### **Owner Analytics**

- [ ] **View Analytics**
  - [ ] Check booking statistics
  - [ ] View revenue reports
  - [ ] Analyze popular dates

---

## **🚨 Safety & Community**

### **Safety Alerts**

- [ ] **Create Safety Alert (Owner)**
  - [ ] Go to safety alerts section
  - [ ] Create new safety alert
  - [ ] Set alert type and description
  - [ ] Set alert duration

- [ ] **View Safety Alerts (User)**
  - [ ] View safety alerts on campground page
  - [ ] Acknowledge safety alert before booking
  - [ ] Check emergency contact information

### **Forum System**

- [ ] **Forum Participation**
  - [ ] Browse forum categories
  - [ ] Create new forum post
  - [ ] Reply to existing posts
  - [ ] Search forum topics
  - [ ] Report inappropriate content

---

## **🔧 Admin Functionality**

### **User Management**

- [ ] **Manage Users**
  - [ ] View all users list
  - [ ] Suspend a user account
  - [ ] Reactivate suspended account
  - [ ] View user activity logs

### **Owner Management**

- [ ] **Review Applications**
  - [ ] View pending owner applications
  - [ ] Approve an application
  - [ ] Reject an application
  - [ ] Suspend owner account

### **System Analytics**

- [ ] **View System Stats**
  - [ ] Check overall booking statistics
  - [ ] View revenue analytics
  - [ ] Monitor system health

---

## **📱 Mobile & Responsive Testing**

### **Mobile Experience**

- [ ] **Mobile Navigation**
  - [ ] Test on mobile device or browser dev tools
  - [ ] Check responsive design
  - [ ] Test touch interactions
  - [ ] Verify mobile booking flow
  - [ ] Test price sorting on mobile

### **Cross-browser Testing**

- [ ] **Browser Compatibility**
  - [ ] Test on Chrome
  - [ ] Test on Firefox
  - [ ] Test on Safari
  - [ ] Test on Edge

---

## **⚡ Performance & Error Handling**

### **Error Scenarios**

- [ ] **Network Issues**
  - [ ] Test with slow internet (dev tools)
  - [ ] Test offline functionality
  - [ ] Check error message display

### **Form Validation**

- [ ] **Input Validation**
  - [ ] Test required field validation
  - [ ] Test email format validation
  - [ ] Test password strength requirements
  - [ ] Test date validation

---

## **🌐 Internationalization**

### **Language Support**

- [ ] **Language Switching**
  - [ ] Switch between English and Thai
  - [ ] Verify all text changes
  - [ ] Check date format localization
  - [ ] Verify currency display
  - [ ] Test price sorting labels in both languages

---

## **🔗 Integration Testing**

### **External Services**

- [ ] **Payment Processing**
  - [ ] Test Stripe payment with test cards
  - [ ] Test payment failure scenarios
  - [ ] Verify payment confirmation emails

- [ ] **Email System**
  - [ ] Check registration confirmation email
  - [ ] Check booking confirmation email
  - [ ] Check password reset email

- [ ] **Map Integration**
  - [ ] Verify campground locations on map
  - [ ] Test map search functionality
  - [ ] Check directions to campgrounds

---

## **📊 Database & Data Testing**

### **Campground Data**

- [ ] **Verify Seeded Data**
  - [ ] Check that 25 campgrounds are created
  - [ ] Verify each campground has 3-6 campsites
  - [ ] Confirm price range is 100-500 THB for campsites
  - [ ] Test price sorting with real data
  - [ ] Verify search works with seeded campground names

### **Price Sorting with Real Data**

- [ ] **Sort by Price**
  - [ ] Verify "Price: Low to High" shows cheapest first
  - [ ] Verify "Price: High to Low" shows most expensive first
  - [ ] Test with filtered results
  - [ ] Verify sorting persists when navigating

---

## **Testing Notes Template**

For each test case, note:

- **Date tested**:
- **Browser/Device**:
- **Result**: ✅ Pass / ❌ Fail
- **Issues found**:
- **Screenshots**: (if needed)

## **Priority Testing Order**

1. **High Priority**: Authentication, Search & Price Sorting, Booking Flow, Payment
2. **Medium Priority**: Reviews, Trip Planning, Owner Features
3. **Low Priority**: Admin Features, Advanced Analytics

## **Key Features to Focus On**

- ✅ **Price Sorting**: New feature - test thoroughly
- ✅ **Search by Location**: Verify works with seeded data
- ✅ **Responsive Design**: Test on mobile devices
- ✅ **Payment Integration**: Test with Stripe test cards
- ✅ **Database Seeding**: Verify 25 campgrounds with affordable prices

Start with the high-priority items and work your way down. This will ensure the core functionality is solid before testing advanced features.
