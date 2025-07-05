const mongoose = require('mongoose');
const User = require('../models/user');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/myancamp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  updateUsers();
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

async function updateUsers() {
  try {
    console.log('Starting user update process...');
    
    // Find all users without createdAt field
    const users = await User.find({ createdAt: { $exists: false } });
    console.log(`Found ${users.length} users without createdAt field`);
    
    let updatedCount = 0;
    
    // Process each user
    for (const user of users) {
      // Extract timestamp from ObjectId
      // MongoDB ObjectIds contain a timestamp in the first 4 bytes
      const timestamp = parseInt(user._id.toString().substring(0, 8), 16) * 1000;
      const createdAt = new Date(timestamp);
      
      // Set createdAt and updatedAt fields
      user.createdAt = createdAt;
      user.updatedAt = new Date(); // Current time for updatedAt
      
      await user.save();
      updatedCount++;
      
      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount} users so far...`);
      }
    }
    
    console.log(`Update complete. Updated ${updatedCount} users.`);
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating users:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}