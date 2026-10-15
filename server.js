require("dotenv").config();

const app=require("./src/app.js");
const connectDb=require("./src/config/db.js")

connectDb()

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})