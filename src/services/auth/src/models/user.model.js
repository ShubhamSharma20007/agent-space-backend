import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    firebaseUUID:{
        type: String,
        required: true,
        unique:true
    },
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
        ,unique: true
        ,lowercase: true
        ,trim: true
    },
    picture:{
        type: String,
    },
    planId:{
        type: String,
        default:"free"
    },
    credits:{
        type:Number,
        default:100 
    },
    totalCredits:{
        type:Number,
        default:100 // like addons
    },
        planExpiresAt:{
            type:Date,
            default:()=> new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
            
        },
    isFreeEnd:{
        type:Boolean,
        default:false
    }


}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;