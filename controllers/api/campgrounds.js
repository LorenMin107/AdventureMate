const Campground = require("../../models/campground");
const { cloudinary } = require("../../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const ApiResponse = require("../../utils/ApiResponse");
const ExpressError = require("../../utils/ExpressError");

module.exports.index = async (req, res) => {
  try {
    const campgrounds = await Campground.find({});
    const locations = await Campground.distinct("location");
    return ApiResponse.success(
      { campgrounds, locations },
      "Campgrounds retrieved successfully"
    ).send(res);
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return ApiResponse.error(
      "Failed to fetch campgrounds",
      "An error occurred while retrieving campgrounds",
      500
    ).send(res);
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

    if (!geoData.body.features.length) {
      return ApiResponse.error(
        "Invalid location",
        "Could not geocode the provided location",
        400
      ).send(res);
    }

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
    return ApiResponse.success(
      { campground },
      "Campground created successfully",
      201
    ).send(res);
  } catch (error) {
    console.error("Error creating campground:", error);
    return ApiResponse.error(
      error.message || "Failed to create campground",
      "An error occurred while creating the campground",
      400
    ).send(res);
  }
};

module.exports.showCampground = async (req, res) => {
  try {
    const campground = await Campground.findById(req.params.id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("author");

    if (!campground) {
      return ApiResponse.error(
        "Campground not found",
        "The requested campground does not exist",
        404
      ).send(res);
    }

    return ApiResponse.success(
      { campground },
      "Campground retrieved successfully"
    ).send(res);
  } catch (error) {
    console.error("Error fetching campground:", error);
    return ApiResponse.error(
      "Failed to fetch campground",
      "An error occurred while retrieving the campground",
      500
    ).send(res);
  }
};

module.exports.searchCampgrounds = async (req, res) => {
  const { search } = req.query;
  try {
    const campgrounds = await Campground.find({
      title: { $regex: new RegExp(search, "i") },
    });

    return ApiResponse.success(
      { campgrounds, searchTerm: search },
      `Found ${campgrounds.length} campgrounds matching "${search}"`
    ).send(res);
  } catch (error) {
    console.error("Error during search:", error);
    return ApiResponse.error(
      "Error performing search",
      "An error occurred while searching for campgrounds",
      500
    ).send(res);
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

      if (!geoData.body.features.length) {
        return ApiResponse.error(
          "Invalid location",
          "Could not geocode the provided location",
          400
        ).send(res);
      }

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
      return ApiResponse.error(
        "Campground not found",
        "The requested campground does not exist",
        404
      ).send(res);
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
    return ApiResponse.success(
      { campground },
      "Campground updated successfully"
    ).send(res);
  } catch (error) {
    console.error("Error updating campground:", error);
    return ApiResponse.error(
      error.message || "Failed to update campground",
      "An error occurred while updating the campground",
      400
    ).send(res);
  }
};

module.exports.deleteCampground = async (req, res) => {
  try {
    const { id } = req.params;
    const campground = await Campground.findById(id);

    if (!campground) {
      return ApiResponse.error(
        "Campground not found",
        "The requested campground does not exist",
        404
      ).send(res);
    }

    // Delete images from cloudinary
    for (let image of campground.images) {
      await cloudinary.uploader.destroy(image.filename);
    }

    await Campground.findByIdAndDelete(id);
    return ApiResponse.success(
      null,
      "Campground deleted successfully"
    ).send(res);
  } catch (error) {
    console.error("Error deleting campground:", error);
    return ApiResponse.error(
      "Failed to delete campground",
      "An error occurred while deleting the campground",
      500
    ).send(res);
  }
};
