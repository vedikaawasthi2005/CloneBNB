const express=require("express")
const router=express.Router();
const wrapasync=require("../utils/wrapasync.js")

const {isLoggedIn,isOwner,validateListing}=require("../middleware.js")
const listingController=require("../controllers/listing.js")
const multer=require("multer")
const{storage}=require("../cloudconfig.js")
const upload=multer({storage})



router
.route("/")
.get( wrapasync(listingController.index))
.post(isLoggedIn,validateListing,upload.single('listing[image]'),wrapasync(listingController.createListing))

//new route
router.get("/new",isLoggedIn,listingController.renderNewForm)

router.route("/:id").get( wrapasync(listingController.showListing)).put(isLoggedIn,isOwner,validateListing,upload.single('listing[image]'),wrapasync(listingController.updateListing)).delete(isLoggedIn,isOwner,wrapasync(listingController.destroyListing))

//edit this route
router.get("/:id/edit",isLoggedIn,isOwner,wrapasync(listingController.renderEditForm))
//for individual categories
router.get("/category/:category", async (req, res) => {
    const { category } = req.params;

    const alllisting = await Listing.find({ category });

    res.render("listings/index", { alllisting });
});


module.exports=router;