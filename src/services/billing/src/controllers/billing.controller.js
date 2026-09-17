
import dotenv from 'dotenv'
dotenv.config()
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import ApiResponse from "../shared/apis/ApiResponse.js";
import { razorpay } from "../config/razorpay.js";
import { PLANS } from "../data/plan.js";
import {Payment} from "../model/payment.model.js";
import axios from 'axios'

export const createOrder =async(req,res,next)=>{
    try { 
        const {planId} = req.body
        console.log(req.body)
        const userId = req.headers['x-user-id'];
        const plan = PLANS.find(p => p.id === planId);
        if(!plan){
          return  res.status(404).send(new ApiResponse(404,"Invalid plan id"))
        }
        const order = await razorpay.orders.create({
            amount: plan.amount * 100,
            currency: 'INR',
            receipt: `order_rcptid_${new Date().getTime()}`,
            payment_capture: 1,
        })
        const createOrder = await Payment.create({
            userId,
            planId,
            paymentId: order.id,
            orderId:order.id,
            amount:plan.amount,
            currency: 'INR',
            status:'created',
            credits:plan.credits
        })
        return res.status(201).send(new ApiResponse(201,'Order created successfully',createOrder))
    } catch (error) {
      if(error.statusCode === 400){
        return res.status(400).json(ApiResponse.error(error?.error?.description || error?.message));
      }
        next(error)
        
    }
}


export const verifyPayment = async (req, res,next) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const session = req.cookies?.session

        const isValidPayment = validatePaymentVerification(
            {
                order_id: razorpay_order_id,
                payment_id: razorpay_payment_id
            },
            razorpay_signature,
            process.env.RAZORPAY_KEY_SECRET
        );

        if (!isValidPayment) {
            return res.status(400).send(new ApiResponse(400, 'Payment verification failed'));
        }

        const payment = await Payment.findOneAndUpdate(
            { orderId: razorpay_order_id },
            { status: 'paid', paymentId: razorpay_payment_id },
            { new: true }
        );

        if (!payment) {
            return res.status(404).send(new ApiResponse(404, 'Order not found'));
        }

        try {
          await axios.post(process.env.AUTH_SERVICE_URL + '/update-plan', {
                userId: payment.userId,
                planId: payment.planId,
                credits: payment.credits,
                session
            });
        } catch (syncErr) {
            console.error('Failed to sync plan to auth service:', syncErr.message);
        }

        return res.status(200).send(new ApiResponse(200, 'Payment verified successfully', payment));

    } catch (err) {
       next(err)
    }
};