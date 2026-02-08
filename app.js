if(process.env.NODE_ENV!="production"){
    require('dotenv').config()

}
// require('dotenv').config();



const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride=require("method-override")
const ejsmate=require("ejs-mate")
const listingRouter=require("./routes/listing.js")
const reviewsRouter=require("./routes/review.js")
const session=require("express-session");
const MongoStore = require("connect-mongo").default;

const flash=require("connect-flash")
const passport=require("passport")
const LocalStrategy=require("passport-local")
const User=require("./models/user.js");
const userRouter=require("./routes/user.js")




// const dbUrl = "mongodb://127.0.0.1:27017/project";

const dbUrl=process.env.ATLASDB_URL

main()
  .then(() => console.log("connected to database"))
  .catch(err => console.log(err));

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs",ejsmate)
app.use(express.static(path.join(__dirname, "public")));

const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET
    },
    touchAfter:24*3600,
})
store.on("error",(err)=>{
    console.log("ERROR IN MONGO SESSION STORE",err)
})

const sessionOption={
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly:true

    }
}
// app.get("/", (req, res) => {
//     res.send("this is the root");
// });


app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser=req.user;
    next();
});


// app.get("/demouser",async(req,res)=>{
//     let fakeuser=new User({
//         email:"student@gmail.com",
//         username:"delta-student"
//     })
//     let registereduser= await User.register(fakeuser,"helloworld")
//     res.send(registereduser)
// })


app.use("/listings",listingRouter)
app.use("/listings/:id/reviews",reviewsRouter)
app.use("/",userRouter)

// 404 handler (NO next, NO error)
app.use((req, res) => {
    res.status(404).send("Page not found!");
});


// actual error handler (for real errors)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";
    console.log(err)
    res.status(statusCode).render("error.ejs",{message})
     //res.status(statusCode).send(message);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log("app is listening to port 8080");
});
