const accountModel=require("../models/accounts.model")

async function createAccountController(req,res){

    const user=req.user;

    const account=await accountModel.create({
        user:user._id

    })

    res.status(201).json({
        account
    })
}


async function getUserAccountsController(req,res){
    const account=await accountModel.find({user:req.user._id});
    res.status(200).json({
        account
    })
}

async function getBalanceAccountController(req,res){

    const{accountId}=req.params;

    const account=await accountModel.findOne({
        _id:accountId,
        user:req.user._id
    })

    if(!account)
        return res.status(404).json({message:"Account not found"})

    const balance =await account.getBalanceData();

    res.status(200).json({
        accountId:account._id,
        balance:balance
    })



}
module.exports={
    createAccountController,getUserAccountsController,getBalanceAccountController
}