const mongoose = require("mongoose");
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");
const Campground = require("../models/campground");
const User = require("../models/user");
const config = require("../config");

// Use the MongoDB connection string from the config module
mongoose.connect(config.db.url);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected to:", config.db.url);
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  // Find the admin user to use as the author
  const adminUser = await User.findOne({ username: "admin" });
  if (!adminUser) {
    console.log("Admin user not found! Please run seedDB.js first to create an admin user.");
    return;
  }

  // Check if we already have campgrounds
  const campgroundCount = await Campground.countDocuments();
  if (campgroundCount > 0) {
    console.log(`Database already has ${campgroundCount} campgrounds. Skipping seed.`);
    return;
  }

  console.log("Seeding campgrounds...");
  for (let i = 0; i < 10; i++) {
    const random20 = Math.floor(Math.random() * 20);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      author: adminUser._id,
      location: `${cities[random20].city}, ${cities[random20].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      description:
        "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Odit dignissimos cupiditate vero nam necessitatibus, debitis autem ea minus vel tempora, aut magnam minima expedita inventore sequi vitae animi itaque placeat.",
      price,
      geometry: {
        type: "Point",
        coordinates: [cities[random20].longitude, cities[random20].latitude],
      },
      images: [
        {
          url: "https://res.cloudinary.com/dlvtzyb7j/image/upload/v1717955180/MyanCamp/poyqcicerovtohj5nd7e.jpg",
          filename: "MyanCamp/poyqcicerovtohj5nd7e",
        },
        {
          url: "https://res.cloudinary.com/dlvtzyb7j/image/upload/v1717955176/MyanCamp/k4ou1y2ad2dzt2luu5pf.jpg",
          filename: "MyanCamp/k4ou1y2ad2dzt2luu5pf",
        },
      ],
    });
    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
  console.log("Database connection closed.");
});
