const express=require("express"); //we are using require because most of the code in company are written with require and not import
const cookieParser=require("cookie-parser")
const authRouter= require("./routes/auth.routes")
const accountRouter=require("./routes/account.routes")
const transactionRoutes=require('./routes/transaction.routes')
const app=express();

app.use(express.json()) //to read the data from the frontend
app.use(cookieParser())

app.get("/",(req,res)=>{res.send("Ledger serveice is up and running")});

app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transactions",transactionRoutes)


module.exports=app;

