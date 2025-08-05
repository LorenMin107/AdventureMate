const mongoose = require('mongoose');
const User = require('./models/user');
const Campground = require('./models/campground');
const Campsite = require('./models/campsite');
const Review = require('./models/review');
const Booking = require('./models/booking');
const SafetyAlert = require('./models/safetyAlert');
const Forum = require('./models/forum');
const config = require('./config');
const { logError, logInfo, logDebug } = require('./utils/logger');
const { hashPassword } = require('./utils/passwordUtils');
const cities = require('./seeds/cities');
const { places, descriptors } = require('./seeds/seedHelpers');

// Use the same database URL as the main application
const adventureMateUrl = config.db.url;

logInfo('Connecting to AdventureMate database...', { url: adventureMateUrl });
mongoose.connect(adventureMateUrl);

const db = mongoose.connection;
db.on('error', (err) => logError('Database connection error', err));
db.once('open', () => {
  logInfo('Connected to AdventureMate database successfully');
  logInfo('Database name:', db.name);
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const cleanDatabase = async () => {
  try {
    logInfo('Cleaning database...');

    // Clear all collections
    await User.deleteMany({});
    await Campground.deleteMany({});
    await Campsite.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({});
    await SafetyAlert.deleteMany({});
    await Forum.deleteMany({});

    logInfo('Database cleaned successfully');
  } catch (error) {
    logError('Error cleaning database', error);
    throw error;
  }
};

const createAdminUser = async () => {
  try {
    logInfo('Creating admin user...');

    // Hash the password
    const hashedPassword = await hashPassword('asdf!');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@dventuremate.com',
      phone: '09945727000',
      password: hashedPassword,
      isAdmin: true,
      isEmailVerified: true,
      firstName: 'Admin',
      lastName: 'User',
      profilePicture:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    });

    await adminUser.save();
    logInfo('Admin user created successfully');
    return adminUser;
  } catch (error) {
    logError('Error creating admin user', error);
    throw error;
  }
};

const createSampleCampgrounds = async (adminUser) => {
  try {
    logInfo('Creating sample campgrounds...');

    const thaiDescriptions = [
      "Experience the beauty of Thailand's natural landscapes with this stunning campground. Perfect for families and adventure seekers alike.",
      "Nestled in the heart of Thailand's wilderness, this campground offers breathtaking views and unforgettable outdoor experiences.",
      'Discover the magic of Thai camping with pristine beaches, crystal clear waters, and spectacular sunsets.',
      "Immerse yourself in Thailand's rich culture and natural beauty at this exceptional campground location.",
      'Escape the city and reconnect with nature at this peaceful Thai campground surrounded by lush tropical vegetation.',
      'Experience authentic Thai hospitality while camping in some of the most beautiful locations in the country.',
      "From mountain views to beachfront camping, this location offers the best of Thailand's diverse landscapes.",
      'Perfect for both relaxation and adventure, this campground showcases the natural wonders of Thailand.',
      'Enjoy the perfect blend of comfort and nature at this well-maintained Thai campground.',
      'Discover hidden gems and pristine natural beauty at this exceptional camping destination in Thailand.',
      'A family-friendly campground with modern amenities and beautiful surroundings.',
      "Experience the thrill of adventure camping in Thailand's most scenic locations.",
      'Peaceful retreat surrounded by nature, perfect for meditation and relaxation.',
      'Budget-friendly camping with all the essential amenities for a comfortable stay.',
      'Luxury camping experience with premium facilities and stunning views.',
      'Rustic camping experience that brings you closer to nature.',
      'Modern campground with excellent facilities and beautiful natural surroundings.',
      'Traditional Thai camping experience with authentic local hospitality.',
      'Eco-friendly campground committed to sustainable tourism practices.',
      'Adventure camping site perfect for thrill-seekers and outdoor enthusiasts.',
      'Tranquil camping spot ideal for couples and romantic getaways.',
      'Family-oriented campground with activities for all ages.',
      'Backpacker-friendly camping with affordable rates and great atmosphere.',
      'Premium camping destination with luxury amenities and exclusive access.',
      'Community camping experience with shared facilities and social activities.',
    ];

    const campgrounds = [];
    for (let i = 0; i < 25; i++) {
      const random20 = Math.floor(Math.random() * 20);
      const price = Math.floor(Math.random() * 800) + 200; // Reduced Thai Baht pricing (200-1000 THB)

      const camp = new Campground({
        author: adminUser._id,
        location: `${cities[random20].city}, ${cities[random20].state}`,
        title: `${sample(descriptors)} ${sample(places)}`,
        description: thaiDescriptions[i % thaiDescriptions.length],
        price,
        geometry: {
          type: 'Point',
          coordinates: [cities[random20].longitude, cities[random20].latitude],
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            filename: 'AdventureMate/campground1',
          },
          {
            url: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            filename: 'AdventureMate/campground2',
          },
        ],
        amenities: ['WiFi', 'Parking', 'Restrooms', 'Showers'],
        maxGuests: Math.floor(Math.random() * 10) + 5,
        contactPhone: `08${Math.floor(Math.random() * 90000000) + 10000000}`,
        contactEmail: `campground${i + 1}@example.com`,
      });

      await camp.save();
      campgrounds.push(camp);
    }

    logInfo(`Created ${campgrounds.length} sample campgrounds`);
    return campgrounds;
  } catch (error) {
    logError('Error creating sample campgrounds', error);
    throw error;
  }
};

const createSampleCampsites = async (campgrounds) => {
  try {
    logInfo('Creating sample campsites...');

    const campsiteNames = [
      'Riverside Retreat',
      'Mountain View Spot',
      'Beachfront Paradise',
      'Forest Hideaway',
      'Lakeside Haven',
      'Valley Vista',
      'Cliffside Camp',
      'Garden Oasis',
      'Sunset Point',
      'Starlight Site',
      'Bamboo Grove',
      'Waterfall View',
      'Coconut Beach',
      'Pine Forest',
      'Rice Field View',
      'Temple View',
      'Hot Spring Access',
      'Cave Entrance',
      'Butterfly Garden',
      'Bird Sanctuary',
      'Fishing Spot',
      'Swimming Hole',
      'Hiking Trail Start',
      'Meditation Point',
      'Photography Vista',
    ];

    const campsiteDescriptions = [
      'Peaceful riverside location with stunning water views',
      'Elevated spot offering panoramic mountain vistas',
      'Direct beach access with ocean breezes',
      'Secluded forest setting surrounded by nature',
      'Tranquil lakeside location perfect for fishing',
      'Scenic valley views with rolling hills',
      'Dramatic cliffside location with ocean views',
      'Beautiful garden setting with flowering plants',
      'Perfect spot to watch spectacular sunsets',
      'Open area ideal for stargazing at night',
      'Serene bamboo grove with natural shade',
      'Spectacular waterfall views with cooling mist',
      'Pristine coconut beach with white sand',
      'Pine forest setting with fresh mountain air',
      'Traditional rice field views with local culture',
      'Peaceful temple views with spiritual atmosphere',
      'Natural hot spring access for relaxation',
      'Mysterious cave entrance for exploration',
      'Colorful butterfly garden with diverse species',
      'Bird watching paradise with rare species',
      'Excellent fishing spot with local guides',
      'Natural swimming hole with crystal clear water',
      'Starting point for scenic hiking trails',
      'Quiet meditation point with mountain views',
      "Photographer's dream with panoramic vistas",
    ];

    const campsiteFeatures = [
      ['Fire Pit', 'Picnic Table', 'Water Access'],
      ['Mountain Views', 'Hiking Trails', 'Wildlife Watching'],
      ['Beach Access', 'Swimming', 'Water Sports'],
      ['Forest Trails', 'Bird Watching', 'Nature Walks'],
      ['Fishing', 'Boating', 'Water Activities'],
      ['Valley Views', 'Hiking', 'Photography'],
      ['Ocean Views', 'Rock Climbing', 'Adventure Sports'],
      ['Garden Views', 'Relaxation', 'Meditation'],
      ['Sunset Views', 'Photography', 'Romantic Setting'],
      ['Stargazing', 'Open Sky', 'Astronomy'],
      ['Bamboo Shade', 'Natural Cooling', 'Privacy'],
      ['Waterfall Views', 'Mist Cooling', 'Adventure'],
      ['Coconut Trees', 'Beach Activities', 'Tropical Feel'],
      ['Pine Forest', 'Mountain Air', 'Hiking'],
      ['Rice Fields', 'Cultural Experience', 'Local Life'],
      ['Temple Views', 'Spiritual Atmosphere', 'Peace'],
      ['Hot Springs', 'Relaxation', 'Natural Therapy'],
      ['Cave Exploration', 'Adventure', 'Discovery'],
      ['Butterfly Watching', 'Nature Photography', 'Biodiversity'],
      ['Bird Watching', 'Nature Trails', 'Wildlife'],
      ['Fishing Equipment', 'Local Guides', 'Water Activities'],
      ['Natural Pool', 'Swimming', 'Cooling Off'],
      ['Hiking Trails', 'Mountain Views', 'Adventure'],
      ['Meditation Space', 'Peaceful Atmosphere', 'Spiritual'],
      ['Panoramic Views', 'Photography', 'Scenic Beauty'],
    ];

    let totalCampsites = 0;
    for (const campground of campgrounds) {
      const numCampsites = Math.floor(Math.random() * 4) + 3; // 3-6 campsites per campground
      const campgroundCampsites = [];

      for (let i = 0; i < numCampsites; i++) {
        const nameIndex = Math.floor(Math.random() * campsiteNames.length);
        const price = Math.floor(Math.random() * 400) + 100; // Reduced: 100-500 THB per night
        const capacity = Math.floor(Math.random() * 4) + 2; // 2-5 people capacity

        const campsite = new Campsite({
          name: campsiteNames[nameIndex],
          description: campsiteDescriptions[nameIndex],
          features: campsiteFeatures[nameIndex],
          price: price,
          capacity: capacity,
          campground: campground._id,
          availability: true,
          images: [
            {
              url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
              filename: 'AdventureMate/campsite1',
            },
            {
              url: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
              filename: 'AdventureMate/campsite2',
            },
          ],
        });

        await campsite.save();
        campgroundCampsites.push(campsite._id);
        totalCampsites++;
      }

      // Update the campground with the campsite references
      campground.campsites = campgroundCampsites;
      await campground.save();
    }

    logInfo(`Created ${totalCampsites} sample campsites across ${campgrounds.length} campgrounds`);
  } catch (error) {
    logError('Error creating sample campsites', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    // Wait for database connection to be established
    if (mongoose.connection.readyState !== 1) {
      logInfo('Waiting for database connection...');
      await new Promise((resolve) => {
        mongoose.connection.once('open', resolve);
      });
    }

    // Verify we're in the correct database
    const dbName = mongoose.connection.db.databaseName;
    logInfo(`Working in database: ${dbName}`);

    if (dbName !== 'adventuremate') {
      throw new Error(
        `Wrong database! Expected 'adventuremate' but got '${dbName}'. Please check your connection.`
      );
    }

    // Clean the database first
    await cleanDatabase();

    // Create admin user
    const adminUser = await createAdminUser();

    // Create sample campgrounds (all owned by admin)
    const campgrounds = await createSampleCampgrounds(adminUser);

    // Create sample campsites for each campground
    await createSampleCampsites(campgrounds);

    logInfo('Database seeding completed successfully!');
    logInfo('Admin credentials: username: admin, password: asdf!');
    logInfo(`Created ${campgrounds.length} campgrounds with campsites owned by admin`);
  } catch (error) {
    logError('Error seeding database', error);
  } finally {
    await mongoose.connection.close();
    logInfo('Database connection closed.');
  }
};

seedDatabase();
