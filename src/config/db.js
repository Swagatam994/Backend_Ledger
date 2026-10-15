const mongoose=require("mongoose");

function connectDb(){
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Server Connected to DB")
    })
    .catch(err=>{
        console.log("Error connecting to db : ",err)
        process.exit(1)//close the server
    })
}

module.exports=connectDb;
