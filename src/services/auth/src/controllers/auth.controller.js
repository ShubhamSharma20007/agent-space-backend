import crypto from "crypto";
import firebaseAdmin from "../config/firebase.js";
import { getAuth } from "firebase-admin/auth";
import User from "../models/user.model.js";
import ApiResponse from "../shared/apis/ApiResponse.js";
import redisClient from "../shared/config/redis.config.js";
import {COST} from '../utils/tokenCost.js'


export const login = async (req, res, next) => {
  const token = req.body?.token ?? req.query?.token;
  console.log("Received token:", token); // Debugging line
  try {
    if (!token) {
      return res
        .status(400)
        .json(ApiResponse.error("Token is required", 400));
    }

    const decodedToken = await getAuth(firebaseAdmin).verifyIdToken(token);

    if (!decodedToken) {
      return res
        .status(401)
        .json(ApiResponse.error("Invalid token", 401));
    }

    let user = await User.findOne({
      firebaseUUID: decodedToken.uid,
    });

    if (!user) {
      user = new User({
        firebaseUUID: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
      });

      await user.save();
    }

    const sessionId = crypto.randomUUID();
        // at login, alongside the existing session:${sessionId} set
    await redisClient.set(`user_session:${user._id}`, sessionId, 'PX', 1000 * 60 * 60 * 24 * 7);
    await redisClient.set(`session:${sessionId}`, JSON.stringify({
      userId: user._id,
      firebaseUUID: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
       planId:user.planId,
        credits:user.credits,
        totalCredits:user.totalCredits,
        planExpiresAt:user.planExpiresAt,
        isFreeEnd:user.isFreeEnd
    }), 'PX', 1000 * 60 * 60 * 24 * 7); // 7 days PX take millisecond Ex take in second

    res.cookie("session", sessionId, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "product ion"? 'none':"lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return res
      .status(200)
      .json(
        ApiResponse.success("Login successful", {
          sessionId,
          user,
        })
      );
  } catch (error) {
    next(error);
  }
};


export const signout = async (req, res, next) => {
  try {
    const { session:sessionId } = req.cookies;
  

    if (!sessionId) {
      return res
        .status(401)
        .json(ApiResponse.error("Invalid session", 401));
    }

    await redisClient.del(`session:${sessionId}`);  
    res.clearCookie("session");

    return res
      .status(200)
      .json(ApiResponse.success("Logout successful"));
  } catch (error) {
    next(error);
  }
};




export const updateUserPayment =async(req,res,next)=>{
    try {
      let {planId,credits,userId,session} = req.body;
      session =req.cookies?.session ?? session
      console.log({session})
      const user = await User.findOne({ _id: userId });
      if (!user) {
        return res
          .status(404)
          .json(ApiResponse.error("User not found", 404));
      }
      user.planId = planId;
      user.credits += credits;
      user.totalCredits +=credits
      user.planExpiresAt =  new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
      user.isFreeEnd = true
      await user.save();

      // update in redis
       const sessionId = await redisClient.get(`session:${session}`);

        if (sessionId) {
            const existingSessionRaw = await redisClient.get(`session:${session}`);
            if (existingSessionRaw) {
                const existingSession = JSON.parse(existingSessionRaw);
                await redisClient.set(
                    `session:${session}`,
                    JSON.stringify({
                        ...existingSession,
                        planId: user.planId,
                        credits: user.credits,
                        totalCredits: user.totalCredits,
                        planExpiresAt: user.planExpiresAt,
                         isFreeEnd:user.isFreeEnd
                    }),
                    'PX',
                    1000 * 60 * 60 * 24 * 7
                );
            }
        }
      res.status(200).json(ApiResponse.success("User updated successfully",user));
    } catch (error) {
     
      next(error)
      
    }
}

export const deductCredits = async (req, res, next) => {
    try {
        const { userId, agent } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(ApiResponse.error("User not found"));
        }

        const requiredCost = COST[agent];
        if (requiredCost === undefined) {
            return res.status(400).json(ApiResponse.error(`Unknown agent type: ${agent}`, 400));
        }

        if (user.credits < requiredCost) {
            return res.status(400).json(ApiResponse.error("Insufficient credits"));
        }

        user.credits -= requiredCost;
        await user.save();

        const sessionId = await redisClient.get(`user_session:${userId}`);
        const existingSessionRaw = sessionId ? await redisClient.get(`session:${sessionId}`) : null;

        if (existingSessionRaw) {
            const existingSession = JSON.parse(existingSessionRaw);
            await redisClient.set(
                `session:${sessionId}`,
                JSON.stringify({
                    ...existingSession,
                    planId: user.planId,
                    credits: user.credits,
                    totalCredits: user.totalCredits,
                    planExpiresAt: user.planExpiresAt,
                    isFreeEnd: user.isFreeEnd
                }),
                'PX',
                1000 * 60 * 60 * 24 * 7
            );
        }

        res.status(200).json(ApiResponse.success("Credits deducted successfully", user));
    } catch (error) {
        next(error);
    }
};