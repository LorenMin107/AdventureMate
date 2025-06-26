const Campground = require("../../models/campground");
const { cloudinary } = require("../../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
  try {
    const campgrounds = await Campground.find({});
    const locations = await Campground.distinct("location");
    res.json({ campgrounds, locations });
  } catch (error) {
    console.error("Failed to fetch data:", error);
    res.status(500).json({ error: "Failed to fetch campgrounds" });
  }
};

module.exports.createCampground = async (req, res) => {
  try {
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
      })
      .send();

    const campground = new Campground({
      title: req.body.campground.title,
      location: req.body.campground.location,
      description: req.body.campground.description,
      price: req.body.campground.price,
      geometry: geoData.body.features[0].geometry,
      author: req.user._id
    });

    if (req.files) {
      campground.images = req.files.map((f) => ({ url: f.path, filename: f.filename }));
    }

    await campground.save();
    res.status(201).json({ campground, message: "Successfully created new campground" });
  } catch (error) {
    console.error("Error creating campground:", error);
    res.status(400).json({ error: error.message || "Failed to create campground" });
  }
};

module.exports.showCampground = async (req, res) => {
  try {
    const campground = await Campground.findById(req.params.id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("author");

    if (!campground) {
      return res.status(404).json({ error: "Campground not found" });
    }

    res.json({ campground });
  } catch (error) {
    console.error("Error fetching campground:", error);
    res.status(500).json({ error: "Failed to fetch campground" });
  }
};

module.exports.searchCampgrounds = async (req, res) => {
  const { search } = req.query;
  try {
    const campgrounds = await Campground.find({
      title: { $regex: new RegExp(search, "i") },
    });
    res.json({ campgrounds, searchTerm: search });
  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).json({ error: "Error performing search" });
  }
};

module.exports.updateCampground = async (req, res) => {
  try {
    const { id } = req.params;

    // Get geocoding data if location is provided
    let geometry = undefined;
    if (req.body.campground && req.body.campground.location) {
      const geoData = await geocoder
        .forwardGeocode({
          query: req.body.campground.location,
          limit: 1,
        })
        .send();
      geometry = geoData.body.features[0].geometry;
    }

    // Build update object
    const updateData = {
      title: req.body.campground.title,
      location: req.body.campground.location,
      description: req.body.campground.description,
      price: req.body.campground.price
    };

    if (geometry) {
      updateData.geometry = geometry;
    }

    const campground = await Campground.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!campground) {
      return res.status(404).json({ error: "Campground not found" });
    }

    // Add new images if any
    if (req.files && req.files.length > 0) {
      const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
      campground.images.push(...imgs);
    }

    // Delete images if specified
    if (req.body.deleteImages && req.body.deleteImages.length > 0) {
      // Delete from cloudinary
      for (let filename of req.body.deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }
      // Remove from campground
      await campground.updateOne({ 
        $pull: { images: { filename: { $in: req.body.deleteImages } } } 
      });
    }

    await campground.save();
    res.json({ 
      campground, 
      message: "Successfully updated campground" 
    });
  } catch (error) {
    console.error("Error updating campground:", error);
    res.status(400).json({ error: error.message || "Failed to update campground" });
  }
};

module.exports.deleteCampground = async (req, res) => {
  try {
    const { id } = req.params;
    const campground = await Campground.findById(id);

    if (!campground) {
      return res.status(404).json({ error: "Campground not found" });
    }

    // Delete images from cloudinary
    for (let image of campground.images) {
      await cloudinary.uploader.destroy(image.filename);
    }

    await Campground.findByIdAndDelete(id);
    res.json({ message: "Successfully deleted campground" });
  } catch (error) {
    console.error("Error deleting campground:", error);
    res.status(500).json({ error: "Failed to delete campground" });
  }
};
