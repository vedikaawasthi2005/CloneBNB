const mongoose = require("mongoose");
const Listing = require("./models/listing");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

mongoose.connect("mongodb://127.0.0.1:27017/project");

// updateOldListing.js

async function geocodeLocation(location, country) {
    const query = `${location}, ${country}`;

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    );

    const data = await response.json();

    if (data.length === 0) return null;

    const place = data[0];

    const returnedAddress = place.display_name.toLowerCase();

    if (!returnedAddress.includes(location.toLowerCase())) {
        return null;
    }

    return [parseFloat(place.lon), parseFloat(place.lat)];
}


async function updateListings() {
    console.log("Updating old listings...");

    const listings = await Listing.find({});

    for (let listing of listings) {

        if (
            !listing.geometry ||
            !listing.geometry.coordinates ||
            listing.geometry.coordinates.length === 0
        ) {

            console.log("Fetching coords for:", listing.title);

            const coords = await geocodeLocation(
                listing.location,
                listing.country
            );

            if (coords) {
                listing.geometry = {
                    type: "Point",
                    coordinates: coords
                };

                await listing.save();
                console.log("Updated:", listing.title);
            } else {
                console.log("Location not found:", listing.title);
            }
        }
    }

    mongoose.connection.close();
}

updateListings();
