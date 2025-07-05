const mongoose = require('mongoose');
const Campground = require('../models/campground');
const Review = require('../models/review');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/myancamp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  updateReviews();
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

async function updateReviews() {
  try {
    console.log('Starting review update process...');
    
    // Find all campgrounds with reviews
    const campgrounds = await Campground.find({ 'reviews': { $exists: true, $ne: [] } });
    console.log(`Found ${campgrounds.length} campgrounds with reviews`);
    
    let updatedCount = 0;
    
    // Process each campground
    for (const campground of campgrounds) {
      // For each review in the campground's reviews array
      for (const reviewId of campground.reviews) {
        // Find the review
        const review = await Review.findById(reviewId);
        
        // If review exists and doesn't have a campground field set
        if (review && (!review.campground || review.campground.toString() !== campground._id.toString())) {
          // Set the campground field
          review.campground = campground._id;
          await review.save();
          updatedCount++;
          
          if (updatedCount % 10 === 0) {
            console.log(`Updated ${updatedCount} reviews so far...`);
          }
        }
      }
    }
    
    console.log(`Update complete. Updated ${updatedCount} reviews.`);
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating reviews:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}