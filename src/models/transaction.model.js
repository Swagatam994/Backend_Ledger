const mongoose =require('mongoose')

const transactionSchema=new mongoose.Schema({

    fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required :[true,"Transaction must be associaated from this account"],
        index:true
    },

    toAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required :[true,"Transaction must be associaated to this account"],
        index:true
    },
    status:{
        type:String,
        enum:{
            values:["PENDING","COMPLETED","FAILED","REVERSED"],
            message:["Status must be either PENDING,COMPLETED,FAILED or REVERSED"]
        },
        default:"PENDING"
    },
    amount:{
        type:Number,
        required:[true,"Amount is required for creating a transaction"],
        min:[1,"Minimum transaction must be of 1"]
    },
    idempotencyKey:{
        type:String,
        required:[true,"Idempotency key is required for creating transaction"],
        index:true,
        unique:true
    }
},{
    timestamps:true
})

const transactionModel=mongoose.model("transaction",transactionSchema)

module.exports=transactionModel