const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const Review=require("./review.js");
const { types, string } = require("joi");

const listingSchema=new Schema({
    title: {
        type: String,
        required:true,
    },
    description: String,
    image: {
      url:String,
      filename:String
  },
    price:Number,
    location: String,
    country:String,
    category: {
    type: String,
    enum: ["Trending","Rooms","Iconic Cities","Mountains","Farms","Artic","Camping"],
    required: true
},

    geometry: {
        type: {
            type: String, // Must be 'Point'
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    reviews:[
      {
        type:Schema.Types.ObjectId,
        ref:"Review"

      }
    ],
    owner:{
      type:Schema.Types.ObjectId,
      ref:"User",

    },
    

})
listingSchema.post("findOneAndDelete",async(listing)=>{
  if(listing){
  await Review.deleteMany({_id: {$in: listing.reviews}})
  }

})

const listing=mongoose.model("listing", listingSchema);
module.exports=listing;
