const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError.js");
const fetch = require("node-fetch");

// Reusable geocode function
async function geocodeLocation(location, country) {

    const query = `${location}, ${country}`;

    const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    );

    const geoData = await geoResponse.json();

    if (geoData.length === 0) return null;

    const place = geoData[0];

    // Validation check
    const returnedAddress = place.display_name.toLowerCase();

    if (!returnedAddress.includes(location.toLowerCase())) {
        return null;
    }

    return [parseFloat(place.lon), parseFloat(place.lat)];
}


//  INDEX 
module.exports.index = async (req, res) => {
    const alllisting = await Listing.find({});
    res.render("listings/index", { alllisting });
};


//  NEW FORM 
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};


//  SHOW LISTING 
module.exports.showListing = async (req, res) => {

    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested does not exist");
        return res.redirect("/listings");
    }

    res.render("listings/show", { listing });
};


//  CREATE LISTING 
module.exports.createListing = async (req, res) => {

    let url = req.file.path;
    let filename = req.file.filename;

    const newlisting = new Listing(req.body.listing);

    newlisting.owner = req.user._id;
    newlisting.image = { url, filename };

    // Convert location to coordinates
    const coords = await geocodeLocation(
        req.body.listing.location,
        req.body.listing.country
    );

    if (!coords) {
        req.flash("error", "Invalid location entered!");
        return res.redirect("/listings/new");
    }

    newlisting.geometry = {
        type: "Point",
        coordinates: coords
    };

    await newlisting.save();

    req.flash("success", "New Listing added!!");
    res.redirect("/listings");
};


// EDIT FORM 
module.exports.renderEditForm = async (req, res) => {

    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing does not exist");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
};


//  UPDATE LISTING 
module.exports.updateListing = async (req, res) => {

    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    // Update geometry if location changed
    if (req.body.listing.location || req.body.listing.country) {

        const coords = await geocodeLocation(
            req.body.listing.location,
            req.body.listing.country
        );

        if (coords) {
            listing.geometry = {
                type: "Point",
                coordinates: coords
            };
            await listing.save();
        }
    }

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;

        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${id}`);
};


//  DELETE 
module.exports.destroyListing = async (req, res) => {

    const { id } = req.params;

    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
