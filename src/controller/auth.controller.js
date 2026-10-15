const userModel=require("../models/user.model")
const emailService=require("../services/email.services")
const jwt=require("jsonwebtoken")
const tokenBlacklistModel=require("../models/blackList.model")


async function userRegisterController(req,res)
{
    const {email,name,password}=req.body

    const isExists=await userModel.findOne({
        email:email

    })

    if(isExists){
        return res.status(422).json({
            message:"User already exists with email.",
            status:"failed"
        })
    }

    const user=await userModel.create({
        email,password,name
    })

    const token =jwt.sign({userId: user._id},process.env.JWT_SECRET,{expiresIn:"3d"})

    res.cookie("token",token)

    res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    })

    await emailService.sendRegistrationEmail(user.email,user.name)
}

async function userLoginController(req,res){
    const {email,password}=req.body
    const user=await userModel.findOne({email:email}).select("password")

    if(!user){
        return res.status(401).json({message:"Email or Password incorrect"})
    }

    const isValidPassword=await user.comparePassword(password)
    if(!isValidPassword){
        return res.status(401).json({message:"Email or Password incorrect"})
    }

    const token=jwt.sign({userId: user._id},process.env.JWT_SECRET,{expiresIn:"3d"})

    res.cookie("token",token);
    res.status(200).json({
        user:{
            id:user._id,
            name:user.name,
            email:user.email
        },
        token
    })

}


/**
 * User Lougout Controller
 * POST /api/auth/logout
 */

async function userLogoutController(req,res){

    const token=req.cookies.token || req.headers.authoization?.split(" ")[1]

    if(!token)
        return res.status(200).json({message:"user logged out successfully(no token found)"})

    

    await tokenBlacklistModel.create({
        token:token

    })

    res.clearCookie("token")

    res.status(200).json({
        message:"User logged out successfully "
    })


}
module.exports={
    userRegisterController,userLoginController,userLogoutController
}