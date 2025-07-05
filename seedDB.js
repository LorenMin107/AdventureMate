const mongoose = require('mongoose');
const User = require('./models/user'); // Adjust the path as necessary
const config = require('./config');
const { logError, logInfo, logDebug } = require('./utils/logger');
const { hashPassword } = require('./utils/passwordUtils');

// Use the MongoDB connection string from the config module
mongoose.connect(config.db.url);

const seedAdmin = async () => {
  try {
    // Check if the admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      logInfo('Admin user already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await hashPassword('asdf!');

    // Create a new admin user if not already present
    const adminUser = new User({
      username: 'admin',
      email: 'lorenmin69@gmail.com',
      phone: '09945727000',
      password: hashedPassword,
      isAdmin: true,
      isEmailVerified: true, // Add this line to bypass email verification
    });

    // Save the admin user
    await adminUser.save();
    logInfo('Admin user created successfully');
  } catch (error) {
    logError('Error creating admin user', error);
  }
};

seedAdmin().then(() => {
  mongoose.connection.close();
});
