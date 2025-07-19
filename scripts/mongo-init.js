// MongoDB initialization script for AdventureMate
// This script runs when the MongoDB container starts for the first time

print('Starting AdventureMate MongoDB initialization...');

// Switch to the application database
const dbName = process.env.MONGO_INITDB_DATABASE || 'adventure-mate';
const db = db.getSiblingDB(dbName);

// Create application user with appropriate permissions
db.createUser({
  user: process.env.MONGO_APP_USERNAME || 'adventuremate',
  pwd: process.env.MONGO_APP_PASSWORD || 'adventuremate123',
  roles: [
    {
      role: 'readWrite',
      db: dbName,
    },
    {
      role: 'dbAdmin',
      db: dbName,
    },
  ],
});

// Create collections with proper indexes
print('Creating collections and indexes...');

// Users collection
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ googleId: 1 }, { sparse: true });

// Campgrounds collection
db.createCollection('campgrounds');
db.campgrounds.createIndex({ location: '2dsphere' });
db.campgrounds.createIndex({ author: 1 });
db.campgrounds.createIndex({ title: 'text', description: 'text' });

// Reviews collection
db.createCollection('reviews');
db.reviews.createIndex({ campground: 1 });
db.reviews.createIndex({ author: 1 });
db.reviews.createIndex({ createdAt: -1 });

// Bookings collection
db.createCollection('bookings');
db.bookings.createIndex({ user: 1 });
db.bookings.createIndex({ campground: 1 });
db.bookings.createIndex({ checkIn: 1 });
db.bookings.createIndex({ checkOut: 1 });
db.bookings.createIndex({ status: 1 });

// Campsites collection
db.createCollection('campsites');
db.campsites.createIndex({ campground: 1 });
db.campsites.createIndex({ name: 1 });

// Owners collection
db.createCollection('owners');
db.owners.createIndex({ user: 1 }, { unique: true });
db.owners.createIndex({ businessName: 1 });

// Safety alerts collection
db.createCollection('safetyalerts');
db.safetyalerts.createIndex({ campground: 1 });
db.safetyalerts.createIndex({ severity: 1 });
db.safetyalerts.createIndex({ status: 1 });
db.safetyalerts.createIndex({ createdAt: -1 });

// Trips collection
db.createCollection('trips');
db.trips.createIndex({ user: 1 });
db.trips.createIndex({ visibility: 1 });
db.trips.createIndex({ createdAt: -1 });

// Forum posts collection
db.createCollection('forumposts');
db.forumposts.createIndex({ category: 1 });
db.forumposts.createIndex({ author: 1 });
db.forumposts.createIndex({ createdAt: -1 });
db.forumposts.createIndex({ title: 'text', content: 'text' });

// Audit logs collection
db.createCollection('auditlogs');
db.auditlogs.createIndex({ userId: 1 });
db.auditlogs.createIndex({ action: 1 });
db.auditlogs.createIndex({ timestamp: -1 });

// Email verification tokens collection
db.createCollection('emailverificationtokens');
db.emailverificationtokens.createIndex({ token: 1 }, { unique: true });
db.emailverificationtokens.createIndex({ user: 1 });
db.emailverificationtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Password reset tokens collection
db.createCollection('passwordresettokens');
db.passwordresettokens.createIndex({ token: 1 }, { unique: true });
db.passwordresettokens.createIndex({ user: 1 });
db.passwordresettokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Blacklisted tokens collection
db.createCollection('blacklistedtokens');
db.blacklistedtokens.createIndex({ token: 1 }, { unique: true });
db.blacklistedtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Refresh tokens collection
db.createCollection('refreshtokens');
db.refreshtokens.createIndex({ token: 1 }, { unique: true });
db.refreshtokens.createIndex({ user: 1 });
db.refreshtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

print('MongoDB initialization completed successfully!');
print('Database: ' + dbName);
print('Collections created with proper indexes');
