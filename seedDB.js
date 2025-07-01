const mongoose = require("mongoose");
const User = require("./models/user"); // Adjust the path as necessary
const config = require("./config");

// Use the MongoDB connection string from the config module
mongoose.connect(config.db.url);

const seedAdmin = async () => {
  try {
    // Check if the admin user already exists
    const existingAdmin = await User.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      return;
    }

    // Create a new admin user if not already present
    const adminUser = new User({
      username: "admin",
      email: "lorenmin69@gmail.com",
      phone: "09945727000",
      isAdmin: true,
      isEmailVerified: true, // Add this line to bypass email verification
    });

    // Register the user with a password using Passport's register method
    const registeredAdmin = await User.register(adminUser, "asdf!");
    console.log("Admin user created!");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
};

seedAdmin().then(() => {
  mongoose.connection.close();
});
