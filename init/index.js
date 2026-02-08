const mongoose=require("mongoose")
const initData=require("./data.js")
const listing=require("../models/listing.js");

const Mango_url='mongodb://127.0.0.1:27017/project'

main().then(()=>{
    console.log("connected to database")
})
 .catch((err) => {
    console.log(err)
})



async function main(){
    await mongoose.connect(Mango_url)
}
const initDB= async() =>{
    await listing.deleteMany({}); 
    initData.data=initData.data.map((obj)=>({...obj, owner:"697a00e661c4400b84441ae9"})); 
    await listing.insertMany(initData.data);
    console.log("data was initailiazed")
}
initDB();
