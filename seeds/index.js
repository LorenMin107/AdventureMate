const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');
const User = require('../models/user');
const config = require('../config');
const { logError, logInfo, logDebug } = require('../utils/logger');

// Use the MongoDB connection string from the config module
mongoose.connect(config.db.url);

const db = mongoose.connection;
db.on('error', (err) => logError('Database connection error', err));
db.once('open', () => {
  logInfo('Database connected', { 
    // Sanitize URL to remove credentials
    url: config.db.url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') 
  });
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  // Find the admin user to use as the author
  const adminUser = await User.findOne({ username: 'admin' });
  if (!adminUser) {
    logError('Admin user not found! Please run seedDB.js first to create an admin user.');
    return;
  }

  // Check if we already have campgrounds
  const campgroundCount = await Campground.countDocuments();
  if (campgroundCount > 0) {
    logInfo('Database already has campgrounds, skipping seed', { campgroundCount });
    return;
  }

  logInfo('Seeding campgrounds...');

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
  ];

  for (let i = 0; i < 10; i++) {
    const random20 = Math.floor(Math.random() * 20);
    const price = Math.floor(Math.random() * 1500) + 500; // Thai Baht pricing (500-2000 THB)
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
    });
    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
  logInfo('Database connection closed.');
});
