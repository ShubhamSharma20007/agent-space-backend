import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId:{
        type:String, // store here firebaseUUID
        required:true
    },
    orderId:{
        type:String,
        required:true
    },
    paymentId:{
        type:String,
        required:true
    },
    planId:{
        type:String,
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    currency:{
        type:String,
        required:true,
        default:'INR'
    },
    credits:{
        type:Number,
        default:0
    },
    status:{
        type:String,
        enum:['created','paid','failed'],
        default:'created'
    }
},{
    timestamps:true
})

export const Payment = mongoose.model('Payment', paymentSchema);