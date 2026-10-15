const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")

const userSchema= new mongoose.Schema({
    email:{
        type:String,
        required:[true,"Email is required for creating user"],
        trin:true,
        lowercase:true,
        match:[/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,"Invalid email address"],
        unique:[true,"Email already exixts"]
    },
    name:{
        type:String,
        required:[true,"Name is required for creating a account"]

    },
    password:{
        type:String,
        required:[true,"Password is requied for creating an account"],
        minlength:[6,"Password should contain more than 6 character"],
        select:false // password will not come by default on calling the user
    },
    systemUser:{
        type:Boolean,
        default:false,
        immutable:true,
        select:false
    }
},{
    timestamps:true
})

userSchema.pre("save",async function () {
    if(!this.isModified("password")){
        return 
    }//checks if the password is modified or not

    const hash=await bcrypt.hash(this.password,10)
    this.password=hash
    return 
})

userSchema.methods.comparePassword=async function (password) {
    return await bcrypt.compare(password,this.password);
}

const userModel=mongoose.model("user",userSchema)

module.exports=userModel